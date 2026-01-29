import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'

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
    const { permitId } = await req.json()

    if (!permitId) {
      return NextResponse.json({ error: "Permit ID is required" }, { status: 400 })
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

    await prisma.exhumationPermit.update({
      where: { id: permitId },
      data: {
        status: "REGISTERED_FOR_PICKUP",
        paymentConfirmed: true,
        processedBy: session.user.id,
        processedAt: new Date()
      }
    })

    // Get user for audit log and transaction
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (user) {
      // Record transaction
      await prisma.transaction.create({
        data: {
          userId: permit.userId,
          transactionType: "EXHUMATION_PERMIT_FEE",
          amount: permit.permitFee || 0,
          orderOfPayment: permit.orderOfPayment!,
          paymentMethod: permit.proofOfPayment?.startsWith("OR:") ? "CASH" : "ONLINE",
          referenceNumber: permit.proofOfPayment,
          status: "CONFIRMED",
          confirmedBy: user.id,
          confirmedAt: new Date(),
          entityType: "ExhumationPermit",
          entityId: permitId,
          remarks: "Exhumation permit fee"
        }
      })

      await createAuditLog({
        userId: user.id,
        action: AUDIT_ACTIONS.PAYMENT_CONFIRMED,
        entityType: "ExhumationPermit",
        entityId: permitId,
        details: {
          permitId,
          amount: permit.permitFee
        }
      })
    }

    return NextResponse.json({ 
      success: true,
      message: "Payment confirmed successfully. Exhumation permit is ready for pickup." 
    })

  } catch (error) {
    console.error("Error confirming payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
