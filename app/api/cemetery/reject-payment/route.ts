import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "EMPLOYEE" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { registrationId, remarks } = await req.json()

    if (!registrationId || !remarks) {
      return NextResponse.json({ error: "Registration ID and remarks are required" }, { status: 400 })
    }

    const registration = await prisma.deathRegistration.findUnique({
      where: { id: registrationId }
    })

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    if (registration.status !== "PAYMENT_SUBMITTED") {
      return NextResponse.json({ error: "Registration is not awaiting payment confirmation" }, { status: 400 })
    }

    // Return to approved for payment status so user can resubmit
    await prisma.deathRegistration.update({
      where: { id: registrationId },
      data: {
        status: "APPROVED_FOR_PAYMENT",
        proofOfPayment: null,
        remarks: `Payment rejected: ${remarks}`,
        processedBy: session.user.id,
        processedAt: new Date()
      }
    })

    return NextResponse.json({ 
      success: true,
      message: "Payment rejected successfully" 
    })

  } catch (error) {
    console.error("Error rejecting payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
