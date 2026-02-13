import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"
import { notifyFacilityReservationUpdate } from "@/lib/notifications"
import crypto from "crypto"

// GET - Fetch a specific facility reservation
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

    const reservation = await prisma.facilityReservation.findUnique({
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
    console.error("Fetch facility reservation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Update facility reservation status (Employee/Admin) or cancel (User)
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

    const existing = await prisma.facilityReservation.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
    }

    // User cancellation
    if (user.role === "USER") {
      if (existing.userId !== user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
      if (body.status === "CANCELLED") {
        if (!["PENDING_REVIEW", "AWAITING_PAYMENT", "AWAITING_REQUIREMENTS"].includes(existing.status)) {
          return NextResponse.json({ error: "Cannot cancel at this stage. Please contact staff for approved reservations." }, { status: 400 })
        }
        const updated = await prisma.facilityReservation.update({
          where: { id },
          data: { status: "CANCELLED", remarks: body.remarks || "Cancelled by applicant" }
        })
        await createAuditLog({
          userId: user.id,
          action: AUDIT_ACTIONS.FACILITY_RESERVATION_CANCELLED,
          entityType: "FacilityReservation",
          entityId: id,
          details: { cancelledBy: "USER" }
        })
        await notifyFacilityReservationUpdate(user.id, existing.facilityType, "CANCELLED", id)
        return NextResponse.json({ message: "Reservation cancelled", reservation: updated })
      }

      // User uploading payment proof
      if (body.paymentProof || body.paymentReference) {
        const updateData: any = {}
        if (body.paymentProof) updateData.paymentProof = body.paymentProof
        if (body.paymentReference) updateData.paymentReference = body.paymentReference
        if (body.paymentMethod) updateData.paymentMethod = body.paymentMethod
        updateData.paymentStatus = "AWAITING_PAYMENT"

        const updated = await prisma.facilityReservation.update({
          where: { id },
          data: updateData
        })
        return NextResponse.json({ message: "Payment proof submitted", reservation: updated })
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
    if (body.isLguEvent !== undefined) updateData.isLguEvent = body.isLguEvent
    if (body.isPriority !== undefined) updateData.isPriority = body.isPriority
    if (body.isPaymentExempted !== undefined) updateData.isPaymentExempted = body.isPaymentExempted

    // If marking as exempted, update payment status
    if (body.isPaymentExempted === true) {
      updateData.paymentStatus = "EXEMPTED"
    }
    if (body.exemptionMemo) updateData.exemptionMemo = body.exemptionMemo

    // Generate gate pass code on approval
    if (body.status === "APPROVED" && !existing.gatePassCode) {
      updateData.gatePassCode = crypto.randomBytes(8).toString('hex').toUpperCase()
    }

    // Handle venue status on event day
    if (body.status === "IN_USE") {
      updateData.facilityDayStatus = "IN_USE"
      updateData.gatePassUsed = true
    }

    if (body.status === "COMPLETED") {
      updateData.facilityDayStatus = "COMPLETED"
      updateData.markedCompletedAt = new Date()
    }

    if (body.status === "COMPLETED_WITH_DAMAGES") {
      updateData.facilityDayStatus = "COMPLETED_WITH_DAMAGES"
      updateData.markedCompletedAt = new Date()
      updateData.hasDamages = true
      if (body.damageDescription) updateData.damageDescription = body.damageDescription
      if (body.additionalBilling !== undefined) updateData.additionalBilling = parseFloat(body.additionalBilling)
    }

    if (body.status === "NO_SHOW") {
      updateData.facilityDayStatus = "NO_SHOW"
      updateData.noShow = true
    }

    // Post-event inspection
    if (body.inspectionNotes !== undefined) updateData.inspectionNotes = body.inspectionNotes
    if (body.hasDamages !== undefined) updateData.hasDamages = body.hasDamages
    if (body.damageDescription !== undefined) updateData.damageDescription = body.damageDescription
    if (body.additionalBilling !== undefined) updateData.additionalBilling = parseFloat(body.additionalBilling)

    updateData.processedBy = user.id
    updateData.processedAt = new Date()

    const updated = await prisma.facilityReservation.update({
      where: { id },
      data: updateData
    })

    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.FACILITY_RESERVATION_UPDATED,
      entityType: "FacilityReservation",
      entityId: id,
      details: { status: body.status, remarks: body.remarks }
    })

    if (body.status) {
      await notifyFacilityReservationUpdate(
        existing.userId,
        existing.facilityType,
        body.status,
        id
      )
    }

    return NextResponse.json({ message: "Reservation updated", reservation: updated })

  } catch (error) {
    console.error("Update facility reservation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
