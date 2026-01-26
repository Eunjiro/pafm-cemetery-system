import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

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
    const registrationId = formData.get("registrationId") as string
    const uploadMode = formData.get("uploadMode") as string

    // Verify registration exists and belongs to user
    const registration = await prisma.deathRegistration.findFirst({
      where: {
        id: registrationId,
        userId: user.id,
        status: "APPROVED_FOR_PAYMENT"
      }
    })

    if (!registration) {
      return NextResponse.json({ error: "Registration not found or not eligible for payment" }, { status: 404 })
    }

    let proofOfPaymentPath = null

    if (uploadMode === "file") {
      const proofFile = formData.get("proofOfPayment") as File
      
      if (!proofFile) {
        return NextResponse.json({ error: "Proof of payment file is required" }, { status: 400 })
      }

      // Save file
      const bytes = await proofFile.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const uploadDir = path.join(process.cwd(), "uploads", "payment-proofs", user.id)
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }

      const fileName = `payment-${registrationId}-${Date.now()}${path.extname(proofFile.name)}`
      const filePath = path.join(uploadDir, fileName)
      await writeFile(filePath, buffer)

      proofOfPaymentPath = path.join("uploads", "payment-proofs", user.id, fileName)
    } else if (uploadMode === "or") {
      const orNumber = formData.get("orNumber") as string
      
      if (!orNumber || !orNumber.trim()) {
        return NextResponse.json({ error: "OR number is required" }, { status: 400 })
      }

      proofOfPaymentPath = `OR:${orNumber.trim()}`
    }

    // Update registration
    await prisma.deathRegistration.update({
      where: { id: registrationId },
      data: {
        proofOfPayment: proofOfPaymentPath,
        status: "PAYMENT_SUBMITTED"
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
