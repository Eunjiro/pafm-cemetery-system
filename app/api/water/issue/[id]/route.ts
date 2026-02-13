import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"
import { notifyWaterIssueUpdate } from "@/lib/notifications"

// GET - Fetch a specific water issue report
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

    const issue = await prisma.waterIssue.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } }
    })

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 })
    }

    if (user.role === "USER" && issue.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({ issue })

  } catch (error) {
    console.error("Fetch water issue error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Update water issue (Employee/Admin)
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

    const existing = await prisma.waterIssue.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 })
    }

    const updateData: any = {}
    
    if (body.status) updateData.status = body.status
    if (body.assignedTo) {
      updateData.assignedTo = body.assignedTo
      updateData.assignedAt = new Date()
    }
    if (body.remarks !== undefined) updateData.remarks = body.remarks
    if (body.confirmedIssueType) updateData.confirmedIssueType = body.confirmedIssueType
    if (body.estimatedMaterials !== undefined) updateData.estimatedMaterials = body.estimatedMaterials
    if (body.inspectionNotes !== undefined) updateData.inspectionNotes = body.inspectionNotes
    if (body.repairDate) updateData.repairDate = new Date(body.repairDate)
    if (body.repairNotes !== undefined) updateData.repairNotes = body.repairNotes
    if (body.issueTag) updateData.issueTag = body.issueTag

    if (body.status === "RESOLVED") {
      updateData.resolvedAt = new Date()
      updateData.resolvedBy = user.id
    }

    updateData.processedBy = user.id
    updateData.processedAt = new Date()

    const updated = await prisma.waterIssue.update({
      where: { id },
      data: updateData
    })

    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.WATER_ISSUE_UPDATED,
      entityType: "WaterIssue",
      entityId: id,
      details: { status: body.status, remarks: body.remarks }
    })

    if (body.status) {
      await notifyWaterIssueUpdate(
        existing.userId,
        existing.issueType,
        body.status,
        id
      )
    }

    return NextResponse.json({ message: "Issue updated", issue: updated })

  } catch (error) {
    console.error("Update water issue error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
