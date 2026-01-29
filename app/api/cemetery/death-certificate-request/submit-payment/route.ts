import { auth } from "@/auth"
export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { saveFile } from "@/lib/upload"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const requestId = formData.get("requestId") as string
    const submittedOrderNumber = formData.get("submittedOrderNumber") as string
    const paymentProofFile = formData.get("paymentProof") as File | null

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 })
    }

    if (!submittedOrderNumber && !paymentProofFile) {
      return NextResponse.json(
        { error: "Either OR number or payment proof must be provided" },
        { status: 400 }
      )
    }

    // Save payment proof if provided
    let paymentProofPath = null
    if (paymentProofFile) {
      const folder = `payment-proofs/${session.user.id!}`
      const fileName = `payment_${Date.now()}_${paymentProofFile.name}`
      paymentProofPath = await saveFile(paymentProofFile, folder, fileName)
    }

    const paymentProof = paymentProofFile 
      ? `OR:${submittedOrderNumber}`
      : submittedOrderNumber ? `OR:${submittedOrderNumber}` : null

    if (!paymentProof) {
      return NextResponse.json({ error: "Payment information required" }, { status: 400 })
    }

    // Update certificate request
    await prisma.deathCertificateRequest.update({
      where: { id: requestId },
      data: {
        status: "PAYMENT_SUBMITTED",
        submittedOrderNumber,
        paymentProof: paymentProofPath || paymentProof,
        paymentSubmittedAt: new Date()
      }
    })

    // Create audit log
    await createAuditLog({
      userId: session.user.id!,
      action: AUDIT_ACTIONS.DEATH_CERTIFICATE_REQUEST_PAYMENT_SUBMITTED,
      entityType: "DeathCertificateRequest",
      entityId: requestId,
      details: {
        submittedOrderNumber,
        hasPaymentProof: !!paymentProofFile
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Error submitting payment:", error)
    return NextResponse.json(
      { error: "Failed to submit payment" },
      { status: 500 }
    )
  }
}
