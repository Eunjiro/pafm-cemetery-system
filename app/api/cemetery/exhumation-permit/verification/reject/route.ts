import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role
    if (userRole !== "EMPLOYEE" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const employee = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    const body = await request.json()
    const { permitId, remarks } = body

    if (!permitId || !remarks) {
      return NextResponse.json(
        { error: "Permit ID and remarks are required" },
        { status: 400 }
      )
    }

    const permit = await prisma.exhumationPermit.findUnique({
      where: { id: permitId }
    })

    if (!permit) {
      return NextResponse.json({ error: "Permit not found" }, { status: 404 })
    }

    if (permit.status !== "PENDING_VERIFICATION") {
      return NextResponse.json(
        { error: "Permit is not in pending verification status" },
        { status: 400 }
      )
    }

    // Update permit status to returned
    const updatedPermit = await prisma.exhumationPermit.update({
      where: { id: permitId },
      data: {
        status: "RETURNED_FOR_CORRECTION",
        remarks
      }
    })

    // Audit log
    await createAuditLog({
      userId: employee.id,
      action: AUDIT_ACTIONS.EXHUMATION_PERMIT_REJECTED,
      entityType: "ExhumationPermit",
      entityId: permitId,
      details: {
        deceasedName: permit.deceasedName,
        remarks,
        rejectedBy: employee.name
      }
    })

    return NextResponse.json({
      message: "Exhumation permit returned for correction",
      permit: updatedPermit
    })

  } catch (error) {
    console.error("Reject exhumation permit error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
