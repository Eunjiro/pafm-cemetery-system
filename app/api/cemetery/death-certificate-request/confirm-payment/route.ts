import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role || "USER"
    if (userRole !== "EMPLOYEE" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { requestId } = await request.json()

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 })
    }

    const certificateRequest = await prisma.deathCertificateRequest.findUnique({
      where: { id: requestId }
    })

    if (!certificateRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // Update status to registered for pickup
    await prisma.deathCertificateRequest.update({
      where: { id: requestId },
      data: {
        status: "REGISTERED_FOR_PICKUP",
        paymentVerifiedBy: session.user.id,
        paymentVerifiedAt: new Date()
      }
    })

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: certificateRequest.userId,
        transactionType: "DEATH_CERTIFICATE_FEE",
        amount: certificateRequest.totalFee,
        orderOfPayment: certificateRequest.orderOfPayment!,
        entityType: "DeathCertificateRequest",
        entityId: requestId
      }
    })

    // Create audit log
    await createAuditLog({
      userId: session.user.id!,
      action: AUDIT_ACTIONS.DEATH_CERTIFICATE_REQUEST_PAYMENT_CONFIRMED,
      entityType: "DeathCertificateRequest",
      entityId: requestId,
      details: {
        amount: certificateRequest.totalFee,
        verifiedBy: session.user.name
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Error confirming payment:", error)
    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    )
  }
}
