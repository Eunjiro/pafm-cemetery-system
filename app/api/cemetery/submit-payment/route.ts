import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { saveFile } from "@/lib/upload"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  try {
    const formData = await req.formData()
    const registrationId = formData.get("registrationId") as string | null
    const requestId = formData.get("requestId") as string | null
    const uploadMode = formData.get("uploadMode") as string

    // Determine which entity type we're dealing with
    const entityId = registrationId || requestId
    const entityType = registrationId ? "registration" : "request"

    if (!entityId) {
      return NextResponse.json({ error: "Missing entity ID (registrationId or requestId)" }, { status: 400 })
    }

    // Verify entity exists and belongs to user
    let entity: any = null
    let entityModel: string = ""

    if (entityType === "registration") {
      entity = await prisma.deathRegistration.findFirst({
        where: {
          id: entityId,
          userId: user.id,
          status: "APPROVED_FOR_PAYMENT"
        }
      })
      entityModel = "DeathRegistration"
    } else {
      entity = await prisma.deathCertificateRequest.findFirst({
        where: {
          id: entityId,
          userId: user.id,
          status: "APPROVED_FOR_PAYMENT"
        }
      })
      entityModel = "DeathCertificateRequest"
    }

    if (!entity) {
      return NextResponse.json({ error: `${entityModel} not found or not eligible for payment` }, { status: 404 })
    }

    let proofOfPaymentPath = null

    if (uploadMode === "file") {
      const proofFile = formData.get("proofOfPayment") as File
      
      if (!proofFile) {
        return NextResponse.json({ error: "Proof of payment file is required" }, { status: 400 })
      }

      // Save file using Vercel Blob storage
      const folder = `payment-proofs/${user.id}`
      const fileName = `payment-${entityId}-${Date.now()}-${proofFile.name}`
      proofOfPaymentPath = await saveFile(proofFile, folder, fileName)
    } else if (uploadMode === "or") {
      const orNumber = formData.get("orNumber") as string
      
      if (!orNumber || !orNumber.trim()) {
        return NextResponse.json({ error: "OR number is required" }, { status: 400 })
      }

      proofOfPaymentPath = `OR:${orNumber.trim()}`
    }

    // Update entity
    if (entityType === "registration") {
      await prisma.deathRegistration.update({
        where: { id: entityId },
        data: {
          proofOfPayment: proofOfPaymentPath,
          status: "PAYMENT_SUBMITTED"
        }
      })
    } else {
      await prisma.deathCertificateRequest.update({
        where: { id: entityId },
        data: {
          paymentProof: proofOfPaymentPath,
          status: "PAYMENT_SUBMITTED",
          paymentSubmittedAt: new Date()
        }
      })
    }

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.PAYMENT_SUBMITTED,
      entityType: entityModel,
      entityId: entityId,
      details: {
        uploadMode,
        proofType: uploadMode === "file" ? "Upload" : "OR Number"
      }
    })

    return NextResponse.json({ 
      success: true,
      message: "Payment submitted successfully" 
    })

  } catch (error) {
    console.error("Error submitting payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
