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
    const { registrationId } = await req.json()

    if (!registrationId) {
      return NextResponse.json({ error: "Registration ID is required" }, { status: 400 })
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

    // Calculate processing deadline for delayed registrations (11 working days)
    let processingDeadline = null
    if (registration.registrationType === "DELAYED") {
      const currentDate = new Date()
      let workingDaysAdded = 0
      let deadlineDate = new Date(currentDate)

      while (workingDaysAdded < 11) {
        deadlineDate.setDate(deadlineDate.getDate() + 1)
        const dayOfWeek = deadlineDate.getDay()
        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          workingDaysAdded++
        }
      }
      processingDeadline = deadlineDate
    }

    await prisma.deathRegistration.update({
      where: { id: registrationId },
      data: {
        status: "REGISTERED_FOR_PICKUP",
        paymentConfirmed: true,
        processedBy: session.user.id,
        processedAt: new Date(),
        processingDeadline: processingDeadline
      }
    })

    // Get user for audit log and transaction
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (user) {
      // Record transaction with correct fee based on registration type
      const fee = registration.registrationFee || 50.00

      await prisma.transaction.create({
        data: {
          userId: registration.userId,
          transactionType: registration.registrationType === "DELAYED" ? "DELAYED_DEATH_REGISTRATION_FEE" : "DEATH_REGISTRATION_FEE",
          amount: fee,
          orderOfPayment: registration.orderOfPayment!,
          paymentMethod: registration.proofOfPayment?.startsWith("OR:") ? "CASH" : "ONLINE",
          referenceNumber: registration.proofOfPayment,
          status: "CONFIRMED",
          confirmedBy: user.id,
          confirmedAt: new Date(),
          entityType: "DeathRegistration",
          entityId: registrationId,
          remarks: registration.registrationType === "DELAYED" 
            ? "Delayed death registration certificate fee (11 working days)" 
            : "Death registration certificate fee"
        }
      })

      // Audit log
      await createAuditLog({
        userId: user.id,
        action: AUDIT_ACTIONS.PAYMENT_CONFIRMED,
        entityType: "DeathRegistration",
        entityId: registrationId,
        details: {
          status: "REGISTERED_FOR_PICKUP",
          amount: fee,
          registrationType: registration.registrationType,
          orderOfPayment: registration.orderOfPayment,
          processingDeadline: processingDeadline
        }
      })
    }

    return NextResponse.json({ 
      success: true,
      message: "Payment confirmed successfully" 
    })

  } catch (error) {
    console.error("Error confirming payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
