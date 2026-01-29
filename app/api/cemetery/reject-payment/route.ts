import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
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
    const { registrationId, requestId, remarks } = await req.json()

    const entityId = registrationId || requestId
    const entityType = registrationId ? "registration" : "request"

    if (!entityId || !remarks) {
      return NextResponse.json({ error: "Entity ID and remarks are required" }, { status: 400 })
    }

    if (entityType === "registration") {
      // Handle Death Registration
      const registration = await prisma.deathRegistration.findUnique({
        where: { id: entityId }
      })

      if (!registration) {
        return NextResponse.json({ error: "Registration not found" }, { status: 404 })
      }

      if (registration.status !== "PAYMENT_SUBMITTED") {
        return NextResponse.json({ error: "Registration is not awaiting payment confirmation" }, { status: 400 })
      }

      // Return to approved for payment status so user can resubmit
      await prisma.deathRegistration.update({
        where: { id: entityId },
        data: {
          status: "APPROVED_FOR_PAYMENT",
          proofOfPayment: null,
          remarks: `Payment rejected: ${remarks}`,
          processedBy: session.user.id,
          processedAt: new Date()
        }
      })

      // Get user for audit log
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! }
      })

      if (user) {
        await createAuditLog({
          userId: user.id,
          action: AUDIT_ACTIONS.PAYMENT_REJECTED,
          entityType: "DeathRegistration",
          entityId: entityId,
          details: {
            remarks
          }
        })
      }
    } else {
      // Handle Death Certificate Request
      const request = await prisma.deathCertificateRequest.findUnique({
        where: { id: entityId }
      })

      if (!request) {
        return NextResponse.json({ error: "Certificate request not found" }, { status: 404 })
      }

      if (request.status !== "PAYMENT_SUBMITTED") {
        return NextResponse.json({ error: "Request is not awaiting payment confirmation" }, { status: 400 })
      }

      // Return to approved for payment status so user can resubmit
      await prisma.deathCertificateRequest.update({
        where: { id: entityId },
        data: {
          status: "APPROVED_FOR_PAYMENT",
          paymentProof: null,
          paymentSubmittedAt: null,
          verificationNotes: `Payment rejected: ${remarks}`,
          verifiedBy: session.user.id,
          verifiedAt: new Date()
        }
      })

      // Get user for audit log
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! }
      })

      if (user) {
        await createAuditLog({
          userId: user.id,
          action: AUDIT_ACTIONS.PAYMENT_REJECTED,
          entityType: "DeathCertificateRequest",
          entityId: entityId,
          details: {
            remarks
          }
        })
      }
    }

    return NextResponse.json({ 
      success: true,
      message: "Payment rejected successfully" 
    })

  } catch (error) {
    console.error("Error rejecting payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
