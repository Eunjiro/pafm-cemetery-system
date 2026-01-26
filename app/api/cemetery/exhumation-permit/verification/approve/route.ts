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

    if (!permitId) {
      return NextResponse.json({ error: "Permit ID is required" }, { status: 400 })
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

    // Generate Order of Payment
    const timestamp = Date.now()
    const orderOfPayment = `EXH-${timestamp.toString().slice(-8)}`

    // Update permit status
    const updatedPermit = await prisma.exhumationPermit.update({
      where: { id: permitId },
      data: {
        status: "APPROVED_FOR_PAYMENT",
        orderOfPayment,
        remarks: remarks || null
      }
    })

    // Audit log
    await createAuditLog({
      userId: employee.id,
      action: AUDIT_ACTIONS.EXHUMATION_PERMIT_APPROVED,
      entityType: "ExhumationPermit",
      entityId: permitId,
      details: {
        deceasedName: permit.deceasedName,
        orderOfPayment,
        approvedBy: employee.name
      }
    })

    return NextResponse.json({
      message: "Exhumation permit approved successfully",
      permit: updatedPermit,
      orderOfPayment
    })

  } catch (error) {
    console.error("Approve exhumation permit error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
