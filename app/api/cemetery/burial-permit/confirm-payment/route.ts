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
    const { permitId } = await req.json()

    if (!permitId) {
      return NextResponse.json({ error: "Permit ID is required" }, { status: 400 })
    }

    const permit = await prisma.burialPermit.findUnique({
      where: { id: permitId }
    })

    if (!permit) {
      return NextResponse.json({ error: "Burial permit not found" }, { status: 404 })
    }

    if (permit.status !== "PAYMENT_SUBMITTED") {
      return NextResponse.json({ error: "Permit is not awaiting payment confirmation" }, { status: 400 })
    }

    const updatedPermit = await prisma.burialPermit.update({
      where: { id: permitId },
      data: {
        status: "REGISTERED_FOR_PICKUP",
        paymentConfirmed: true,
        processedBy: session.user.id,
        processedAt: new Date()
      }
    })

    // Get user for audit log and transaction
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (user) {
      // Record transaction
      await prisma.transaction.create({
        data: {
          userId: permit.userId,
          transactionType: "BURIAL_PERMIT_FEE",
          amount: permit.totalFee || 0,
          orderOfPayment: permit.orderOfPayment!,
          paymentMethod: permit.proofOfPayment?.startsWith("OR:") ? "CASH" : "ONLINE",
          referenceNumber: permit.proofOfPayment,
          status: "CONFIRMED",
          confirmedBy: user.id,
          confirmedAt: new Date(),
          entityType: "BurialPermit",
          entityId: permitId,
          remarks: "Burial permit fee"
        }
      })

      await createAuditLog({
        userId: user.id,
        action: AUDIT_ACTIONS.PAYMENT_CONFIRMED,
        entityType: "BurialPermit",
        entityId: permitId,
        details: {
          permitId,
          amount: permit.totalFee
        }
      })
    }

    // Ensure a CemeteryPermitSubmission exists so staff can send to PAFM-C
    try {
      const existing = await prisma.cemeteryPermitSubmission.findUnique({
        where: { permitId: permitId }
      })

      if (!existing) {
        const nameParts = (updatedPermit.deceasedName || "").trim().split(/\s+/)
        const deceasedFirstName = nameParts[0] || ""
        const deceasedLastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ""
        const deceasedMiddleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : null

        await prisma.cemeteryPermitSubmission.create({
          data: {
            permitId: updatedPermit.id,
            permitType: 'BURIAL',
            deceasedFirstName,
            deceasedMiddleName,
            deceasedLastName,
            deceasedSuffix: null,
            dateOfDeath: updatedPermit.deceasedDateOfDeath,
            gender: null,
            applicantName: updatedPermit.requesterName || `${updatedPermit.userId}`,
            applicantEmail: null,
            applicantPhone: updatedPermit.requesterContactNumber || null,
            relationshipToDeceased: updatedPermit.requesterRelation || null,
            preferredCemeteryId: updatedPermit.cemeteryLocation || null,
            permitApprovedAt: updatedPermit.processedAt || new Date(),
            permitDocumentUrl: updatedPermit.burialForm || updatedPermit.deathCertificate || null,
            metadata: {
              createdFrom: 'confirm-payment'
            }
          }
        })
      }
    } catch (err) {
      console.error('Failed to create CemeteryPermitSubmission on payment confirmation:', err)
    }

    return NextResponse.json({ 
      success: true,
      message: "Payment confirmed successfully. Burial permit is ready for pickup." 
    })

  } catch (error) {
    console.error("Error confirming payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
