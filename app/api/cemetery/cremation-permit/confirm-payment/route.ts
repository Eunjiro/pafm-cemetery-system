import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/auditLog"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || (user.role !== "EMPLOYEE" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { permitId, notes } = await request.json()

    if (!permitId) {
      return NextResponse.json({ error: "Missing permit ID" }, { status: 400 })
    }

    const permit = await prisma.cremationPermit.findUnique({
      where: { id: permitId }
    })

    if (!permit) {
      return NextResponse.json({ error: "Cremation permit not found" }, { status: 404 })
    }

    if (permit.status !== "PAYMENT_SUBMITTED") {
      return NextResponse.json({ error: "Payment not yet submitted" }, { status: 400 })
    }

    // Update permit status
    const updatedPermit = await prisma.cremationPermit.update({
      where: { id: permitId },
      data: {
        status: "REGISTERED_FOR_PICKUP",
        paymentVerifiedBy: user.id,
        paymentVerifiedAt: new Date(),
        verificationNotes: notes
      }
    })

    // Create transaction record
    await prisma.transaction.create({
      data: {
        transactionType: "CREMATION_PERMIT_FEE",
        amount: permit.permitFee,
        orderOfPayment: permit.orderOfPayment!,
        entityType: "CremationPermit",
        entityId: permit.id,
        userId: permit.userId
      }
    })

    await createAuditLog({
      userId: user.id,
      action: "CREMATION_PERMIT_PAYMENT_CONFIRMED",
      entityType: "CremationPermit",
      entityId: permitId,
      details: {
        amount: permit.permitFee,
        orderOfPayment: permit.orderOfPayment,
        notes
      }
    })

    return NextResponse.json({
      message: "Payment confirmed successfully",
      permit: updatedPermit
    })

  } catch (error) {
    console.error("Error confirming payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
