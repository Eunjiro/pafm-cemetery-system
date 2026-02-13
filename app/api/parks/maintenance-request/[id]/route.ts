import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"
import { notifyParkMaintenanceUpdate } from "@/lib/notifications"

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

    const maintenanceRequest = await prisma.parkMaintenanceRequest.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } }
    })

    if (!maintenanceRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    if (user.role === "USER" && maintenanceRequest.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({ request: maintenanceRequest })

  } catch (error) {
    console.error("Fetch maintenance request error:", error)
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

    if (user.role !== "EMPLOYEE" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.parkMaintenanceRequest.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    const updateData: any = {}
    
    if (body.status) updateData.status = body.status
    if (body.remarks !== undefined) updateData.remarks = body.remarks
    if (body.urgencyLevel) updateData.urgencyLevel = body.urgencyLevel
    if (body.repairScale) updateData.repairScale = body.repairScale
    if (body.inspectionScheduled) updateData.inspectionScheduled = new Date(body.inspectionScheduled)
    if (body.inspectionNotes !== undefined) updateData.inspectionNotes = body.inspectionNotes
    if (body.materialsStatus) updateData.materialsStatus = body.materialsStatus
    if (body.materialsNotes !== undefined) updateData.materialsNotes = body.materialsNotes
    if (body.assignedTeam) updateData.assignedTeam = body.assignedTeam
    if (body.assignedTo) {
      updateData.assignedTo = body.assignedTo
      updateData.assignedAt = new Date()
    }
    if (body.workReport !== undefined) updateData.workReport = body.workReport

    if (body.status === "IN_PROGRESS" && !existing.workStartedAt) {
      updateData.workStartedAt = new Date()
    }

    if (body.status === "COMPLETED") {
      updateData.completedAt = new Date()
      updateData.completedBy = user.id
    }

    updateData.processedBy = user.id
    updateData.processedAt = new Date()

    const updated = await prisma.parkMaintenanceRequest.update({
      where: { id },
      data: updateData
    })

    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.PARK_MAINTENANCE_UPDATED,
      entityType: "ParkMaintenanceRequest",
      entityId: id,
      details: { status: body.status, remarks: body.remarks }
    })

    if (body.status) {
      await notifyParkMaintenanceUpdate(
        existing.userId,
        existing.parkLocation,
        body.status,
        id
      )
    }

    return NextResponse.json({ message: "Request updated", request: updated })

  } catch (error) {
    console.error("Update maintenance request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
