import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
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

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const permitId = formData.get("permitId") as string
    const submittedOrderNumber = formData.get("submittedOrderNumber") as string | null
    const paymentProofFile = formData.get("paymentProof") as File | null

    if (!permitId) {
      return NextResponse.json({ error: "Missing permit ID" }, { status: 400 })
    }

    if (!submittedOrderNumber && !paymentProofFile) {
      return NextResponse.json({ error: "Either OR number or payment proof is required" }, { status: 400 })
    }

    const permit = await prisma.cremationPermit.findUnique({
      where: { id: permitId }
    })

    if (!permit) {
      return NextResponse.json({ error: "Cremation permit not found" }, { status: 404 })
    }

    if (permit.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 })
    }

    if (permit.status !== "APPROVED_FOR_PAYMENT") {
      return NextResponse.json({ error: "Permit not ready for payment submission" }, { status: 400 })
    }

    let paymentProofPath = null

    // Handle payment proof file upload
    if (paymentProofFile) {
      const uploadDir = join(process.cwd(), "uploads", "payment-proofs", user.id)
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }

      const timestamp = Date.now()
      const fileName = `cremation_payment_${timestamp}_${paymentProofFile.name}`
      paymentProofPath = join(uploadDir, fileName)
      
      const buffer = Buffer.from(await paymentProofFile.arrayBuffer())
      await writeFile(paymentProofPath, buffer)
    }

    const updatedPermit = await prisma.cremationPermit.update({
      where: { id: permitId },
      data: {
        status: "PAYMENT_SUBMITTED",
        paymentProof: paymentProofPath,
        submittedOrderNumber,
        paymentSubmittedAt: new Date()
      }
    })

    await createAuditLog({
      userId: user.id,
      action: "CREMATION_PERMIT_PAYMENT_SUBMITTED",
      entityType: "CremationPermit",
      entityId: permitId,
      details: {
        submittedOrderNumber,
        hasPaymentProof: !!paymentProofPath
      }
    })

    return NextResponse.json({
      message: "Payment submitted successfully",
      permit: updatedPermit
    })

  } catch (error) {
    console.error("Error submitting payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
