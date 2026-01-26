import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role
    if (userRole !== "EMPLOYEE" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { registrationId, processedBy } = await request.json()

    if (!registrationId) {
      return NextResponse.json({ error: "Registration ID required" }, { status: 400 })
    }

    // Generate Order of Payment number
    const timestamp = Date.now()
    const orderOfPayment = `OR-${timestamp}-${registrationId.substring(0, 8).toUpperCase()}`

    // Update registration
    const registration = await prisma.deathRegistration.update({
      where: { id: registrationId },
      data: {
        status: "APPROVED_FOR_PAYMENT",
        orderOfPayment: orderOfPayment,
        processedBy: processedBy,
        processedAt: new Date(),
        remarks: "Application approved. Please proceed to payment."
      }
    })

    // Get user for audit log
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (user) {
      await createAuditLog({
        userId: user.id,
        action: AUDIT_ACTIONS.DEATH_REGISTRATION_APPROVED,
        entityType: "DeathRegistration",
        entityId: registrationId,
        details: {
          orderOfPayment,
          processedBy
        }
      })
    }

    return NextResponse.json({
      message: "Registration approved successfully",
      orderOfPayment: orderOfPayment,
      registration
    })

  } catch (error) {
    console.error("Approval error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
