import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"
import { notifyDrainageRequestUpdate } from "@/lib/notifications"
import { saveFile } from "@/lib/upload"

// GET - Fetch a specific drainage request
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

    const drainageRequest = await prisma.drainageRequest.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } }
    })

    if (!drainageRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // Regular users can only see their own
    if (user.role === "USER" && drainageRequest.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({ request: drainageRequest })

  } catch (error) {
    console.error("Fetch drainage request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Update drainage request status (Employee/Admin)
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

    const existing = await prisma.drainageRequest.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    const updateData: any = {}
    
    if (body.status) updateData.status = body.status
    if (body.assignedTo) {
      updateData.assignedTo = body.assignedTo
      updateData.assignedAt = new Date()
    }
    if (body.remarks !== undefined) updateData.remarks = body.remarks
    if (body.inspectionDate) updateData.inspectionDate = new Date(body.inspectionDate)
    if (body.inspectionNotes !== undefined) updateData.inspectionNotes = body.inspectionNotes
    if (body.materialsStatus) updateData.materialsStatus = body.materialsStatus
    if (body.materialsNotes !== undefined) updateData.materialsNotes = body.materialsNotes
    if (body.workReport !== undefined) updateData.workReport = body.workReport
    if (body.urgency) updateData.urgency = body.urgency

    if (body.status === "COMPLETED") {
      updateData.completedAt = new Date()
      updateData.completedBy = user.id
    }

    updateData.processedBy = user.id
    updateData.processedAt = new Date()

    const updated = await prisma.drainageRequest.update({
      where: { id },
      data: updateData
    })

    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.DRAINAGE_REQUEST_UPDATED,
      entityType: "DrainageRequest",
      entityId: id,
      details: { status: body.status, remarks: body.remarks }
    })

    // Notify citizen
    if (body.status) {
      await notifyDrainageRequestUpdate(
        existing.userId,
        `${existing.street}, ${existing.barangay}`,
        body.status,
        id
      )
    }

    return NextResponse.json({ message: "Request updated", request: updated })

  } catch (error) {
    console.error("Update drainage request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
