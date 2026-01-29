import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"

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
    const orNumber = formData.get("orNumber") as string | null
    const proofFile = formData.get("proofOfPayment") as File | null

    if (!permitId) {
      return NextResponse.json({ error: "Permit ID is required" }, { status: 400 })
    }

    // Verify permit exists and belongs to user
    const permit = await prisma.exhumationPermit.findFirst({
      where: {
        id: permitId,
        userId: user.id
      }
    })

    if (!permit) {
      return NextResponse.json({ error: "Permit not found" }, { status: 404 })
    }

    if (permit.status !== "APPROVED_FOR_PAYMENT") {
      return NextResponse.json(
        { error: "Permit is not approved for payment" },
        { status: 400 }
      )
    }

    let proofOfPaymentPath: string | null = null

    // Handle file upload if provided
    if (proofFile) {
      const uploadDir = join(process.cwd(), "uploads", "exhumation-permits", user.id)
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }

      const timestamp = Date.now()
      const fileBuffer = Buffer.from(await proofFile.arrayBuffer())
      proofOfPaymentPath = join(uploadDir, `payment_proof_${timestamp}_${proofFile.name}`)
      await writeFile(proofOfPaymentPath, fileBuffer)
    }

    // Update permit with payment information
    const updatedPermit = await prisma.exhumationPermit.update({
      where: { id: permitId },
      data: {
        proofOfPayment: proofOfPaymentPath || orNumber || "OR_NUMBER_ENTERED",
        status: "PAYMENT_SUBMITTED"
      }
    })

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.PAYMENT_SUBMITTED,
      entityType: "ExhumationPermit",
      entityId: permitId,
      details: {
        deceasedName: permit.deceasedName,
        permitFee: permit.permitFee,
        paymentMethod: proofFile ? "file_upload" : "or_number"
      }
    })

    return NextResponse.json({
      message: "Payment submitted successfully",
      permit: updatedPermit
    })

  } catch (error) {
    console.error("Payment submission error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
