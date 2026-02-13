import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"
import { notifyAmenityReservationUpdate } from "@/lib/notifications"
import crypto from "crypto"

// GET - Fetch a specific amenity reservation
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

    const reservation = await prisma.amenityReservation.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } }
    })

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
    }

    if (user.role === "USER" && reservation.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({ reservation })

  } catch (error) {
    console.error("Fetch amenity reservation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Update amenity reservation status (Employee/Admin) or cancel (User)
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

    const existing = await prisma.amenityReservation.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
    }

    // User cancellation
    if (user.role === "USER") {
      if (existing.userId !== user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
      if (body.status === "CANCELLED") {
        if (!["PENDING_REVIEW", "AWAITING_PAYMENT"].includes(existing.status)) {
          return NextResponse.json({ error: "Cannot cancel at this stage. Please contact staff." }, { status: 400 })
        }
        const updated = await prisma.amenityReservation.update({
          where: { id },
          data: { status: "CANCELLED", remarks: body.remarks || "Cancelled by user" }
        })
        await createAuditLog({
          userId: user.id,
          action: AUDIT_ACTIONS.AMENITY_RESERVATION_CANCELLED,
          entityType: "AmenityReservation",
          entityId: id,
          details: { cancelledBy: "USER" }
        })
        return NextResponse.json({ message: "Reservation cancelled", reservation: updated })
      }
      return NextResponse.json({ error: "Not allowed" }, { status: 403 })
    }

    // Employee/Admin processing
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

    // Generate entry pass code on approval
    if (body.status === "APPROVED" && !existing.entryPassCode) {
      updateData.entryPassCode = crypto.randomBytes(8).toString('hex').toUpperCase()
    }

    // Handle check-in
    if (body.status === "CHECKED_IN") {
      updateData.checkedInAt = new Date()
      updateData.checkedInBy = user.id
      updateData.entryPassUsed = true
    }

    // Handle no-show
    if (body.status === "NO_SHOW") {
      updateData.noShow = true
    }

    // Handle completion
    if (body.status === "COMPLETED") {
      updateData.completedAt = new Date()
    }

    updateData.processedBy = user.id
    updateData.processedAt = new Date()

    const updated = await prisma.amenityReservation.update({
      where: { id },
      data: updateData
    })

    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.AMENITY_RESERVATION_UPDATED,
      entityType: "AmenityReservation",
      entityId: id,
      details: { status: body.status, remarks: body.remarks }
    })

    if (body.status) {
      await notifyAmenityReservationUpdate(
        existing.userId,
        existing.amenityType,
        body.status,
        id
      )
    }

    return NextResponse.json({ message: "Reservation updated", reservation: updated })

  } catch (error) {
    console.error("Update amenity reservation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
