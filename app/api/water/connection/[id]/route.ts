import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"
import { notifyWaterConnectionUpdate } from "@/lib/notifications"

// GET - Fetch a specific water connection
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

    const connection = await prisma.waterConnection.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } }
    })

    if (!connection) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    if (user.role === "USER" && connection.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({ connection })

  } catch (error) {
    console.error("Fetch water connection error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Update water connection (Employee/Admin)
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

    if (user.role !== "EMPLOYEE" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.waterConnection.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    const updateData: any = {}
    
    if (body.status) updateData.status = body.status
    if (body.remarks !== undefined) updateData.remarks = body.remarks
    if (body.assignedInspector) updateData.assignedInspector = body.assignedInspector
    if (body.inspectionDate) updateData.inspectionDate = new Date(body.inspectionDate)
    if (body.mainlineAvailable !== undefined) updateData.mainlineAvailable = body.mainlineAvailable
    if (body.tappingPointAvailable !== undefined) updateData.tappingPointAvailable = body.tappingPointAvailable
    if (body.pipeDistance !== undefined) updateData.pipeDistance = body.pipeDistance
    if (body.estimatedMaterials !== undefined) updateData.estimatedMaterials = body.estimatedMaterials
    if (body.inspectionNotes !== undefined) updateData.inspectionNotes = body.inspectionNotes
    if (body.pipeSize) updateData.pipeSize = body.pipeSize
    if (body.connectionFee !== undefined) updateData.connectionFee = body.connectionFee
    if (body.paymentType) updateData.paymentType = body.paymentType
    if (body.assignedTeam) updateData.assignedTeam = body.assignedTeam
    if (body.installationDate) updateData.installationDate = new Date(body.installationDate)
    if (body.installationStatus) updateData.installationStatus = body.installationStatus
    if (body.installationNotes !== undefined) updateData.installationNotes = body.installationNotes

    // Cashier confirms payment with OR number
    if (body.orNumber) {
      updateData.orNumber = body.orNumber
      updateData.paymentConfirmedBy = user.id
      updateData.paymentConfirmedAt = new Date()
      updateData.status = "PAYMENT_CONFIRMED"
    }

    updateData.processedBy = user.id
    updateData.processedAt = new Date()

    const updated = await prisma.waterConnection.update({
      where: { id },
      data: updateData
    })

    const action = body.orNumber 
      ? AUDIT_ACTIONS.WATER_CONNECTION_PAYMENT_CONFIRMED
      : AUDIT_ACTIONS.WATER_CONNECTION_UPDATED

    await createAuditLog({
      userId: user.id,
      action,
      entityType: "WaterConnection",
      entityId: id,
      details: { status: body.status || updated.status, remarks: body.remarks, orNumber: body.orNumber }
    })

    if (body.status || body.orNumber) {
      await notifyWaterConnectionUpdate(
        existing.userId,
        existing.applicantName,
        body.status || updated.status,
        id
      )
    }

    return NextResponse.json({ message: "Application updated", connection: updated })

  } catch (error) {
    console.error("Update water connection error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
