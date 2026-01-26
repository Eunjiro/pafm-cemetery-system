import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "EMPLOYEE" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { permitId, remarks } = await req.json()

    if (!permitId || !remarks) {
      return NextResponse.json({ error: "Permit ID and remarks are required" }, { status: 400 })
    }

    const permit = await prisma.exhumationPermit.findUnique({
      where: { id: permitId }
    })

    if (!permit) {
      return NextResponse.json({ error: "Exhumation permit not found" }, { status: 404 })
    }

    if (permit.status !== "PAYMENT_SUBMITTED") {
      return NextResponse.json({ error: "Permit is not awaiting payment confirmation" }, { status: 400 })
    }

    // Return to approved for payment status so user can resubmit
    await prisma.exhumationPermit.update({
      where: { id: permitId },
      data: {
        status: "APPROVED_FOR_PAYMENT",
        proofOfPayment: null,
        remarks: `Payment rejected: ${remarks}`,
        processedBy: session.user.id,
        processedAt: new Date()
      }
    })

    // Get user for audit log
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (user) {
      await createAuditLog({
        userId: user.id,
        action: AUDIT_ACTIONS.PAYMENT_REJECTED,
        entityType: "ExhumationPermit",
        entityId: permitId,
        details: {
          remarks
        }
      })
    }

    return NextResponse.json({ 
      success: true,
      message: "Payment rejected successfully" 
    })

  } catch (error) {
    console.error("Error rejecting payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
