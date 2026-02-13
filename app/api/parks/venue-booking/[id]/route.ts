import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"
import { notifyVenueBookingUpdate } from "@/lib/notifications"
import crypto from "crypto"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { id } = await params

    const booking = await prisma.venueBooking.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } }
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (user.role === "USER" && booking.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({ booking })

  } catch (error) {
    console.error("Fetch venue booking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.venueBooking.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // User cancellation
    if (user.role === "USER") {
      if (existing.userId !== user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
      if (body.status === "CANCELLED") {
        if (!["PENDING_REVIEW", "AWAITING_PAYMENT", "AWAITING_REQUIREMENTS"].includes(existing.status)) {
          return NextResponse.json({ error: "Cannot cancel at this stage. Please contact staff." }, { status: 400 })
        }
        const updated = await prisma.venueBooking.update({
          where: { id },
          data: { status: "CANCELLED", remarks: body.remarks || "Cancelled by applicant" }
        })
        await createAuditLog({
          userId: user.id,
          action: AUDIT_ACTIONS.VENUE_BOOKING_CANCELLED,
          entityType: "VenueBooking",
          entityId: id,
          details: { cancelledBy: "USER" }
        })
        return NextResponse.json({ message: "Booking cancelled", booking: updated })
      }
      return NextResponse.json({ error: "Not allowed" }, { status: 403 })
    }

    if (user.role !== "EMPLOYEE" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const updateData: any = {}
    
    if (body.status) updateData.status = body.status
    if (body.remarks !== undefined) updateData.remarks = body.remarks
    if (body.amountDue !== undefined) updateData.amountDue = parseFloat(body.amountDue)
    if (body.paymentStatus) updateData.paymentStatus = body.paymentStatus
    if (body.paymentMethod) updateData.paymentMethod = body.paymentMethod
    if (body.paymentReference) updateData.paymentReference = body.paymentReference
    if (body.isLguSponsored !== undefined) updateData.isLguSponsored = body.isLguSponsored
    if (body.isPriority !== undefined) updateData.isPriority = body.isPriority

    // Generate gate pass on approval
    if (body.status === "APPROVED" && !existing.gatePassCode) {
      updateData.gatePassCode = crypto.randomBytes(8).toString('hex').toUpperCase()
    }

    // Handle venue status on event day
    if (body.status === "IN_USE") {
      updateData.venueStatus = "IN_USE"
      updateData.gatePassUsed = true
    }

    if (body.status === "COMPLETED") {
      updateData.venueStatus = "COMPLETED"
      updateData.markedCompletedAt = new Date()
    }

    if (body.status === "NO_SHOW") {
      updateData.venueStatus = "NO_SHOW"
      updateData.noShow = true
    }

    updateData.processedBy = user.id
    updateData.processedAt = new Date()

    const updated = await prisma.venueBooking.update({
      where: { id },
      data: updateData
    })

    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.VENUE_BOOKING_UPDATED,
      entityType: "VenueBooking",
      entityId: id,
      details: { status: body.status, remarks: body.remarks }
    })

    if (body.status) {
      await notifyVenueBookingUpdate(
        existing.userId,
        existing.venueType,
        body.status,
        id
      )
    }

    return NextResponse.json({ message: "Booking updated", booking: updated })

  } catch (error) {
    console.error("Update venue booking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
