import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user?.role || "USER"
    if (userRole !== "EMPLOYEE" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { permitId } = await request.json()

    if (!permitId) {
      return NextResponse.json({ error: "Permit ID is required" }, { status: 400 })
    }

    // Get permit details
    const permit = await prisma.burialPermit.findUnique({
      where: { id: permitId },
      include: { user: true }
    })

    if (!permit) {
      return NextResponse.json({ error: "Permit not found" }, { status: 404 })
    }

    if (permit.status !== "PENDING_VERIFICATION") {
      return NextResponse.json({ error: "Permit is not pending verification" }, { status: 400 })
    }

    // Generate Order of Payment number
    const timestamp = Date.now()
    const orderOfPayment = `OR-BP-${timestamp}`

    // Update permit status
    const updatedPermit = await prisma.burialPermit.update({
      where: { id: permitId },
      data: {
        status: "APPROVED_FOR_PAYMENT",
        orderOfPayment: orderOfPayment,
        processedBy: session.user.name || session.user.email,
        processedAt: new Date()
      }
    })

    // Create audit log
    await createAuditLog({
      userId: permit.userId,
      action: AUDIT_ACTIONS.BURIAL_PERMIT_APPROVED,
      entityType: "BurialPermit",
      entityId: permit.id,
      details: {
        permitType: permit.burialType,
        totalFee: permit.totalFee,
        orderOfPayment: orderOfPayment,
        processedBy: session.user.name || session.user.email,
        deceasedName: permit.deceasedName
      }
    })

    // Attempt to create a CemeteryPermitSubmission record so staff can send to PAFM-C
    try {
      const nameParts = (permit.deceasedName || "").trim().split(/\s+/)
      const deceasedFirstName = nameParts[0] || ""
      const deceasedLastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ""
      const deceasedMiddleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : null

      await prisma.cemeteryPermitSubmission.create({
        data: {
          permitId: permit.id,
          permitType: 'BURIAL',
          deceasedFirstName,
          deceasedMiddleName,
          deceasedLastName,
          deceasedSuffix: null,
          dateOfDeath: permit.deceasedDateOfDeath,
          gender: null,
          applicantName: permit.requesterName || `${permit.user?.name || ''}`,
          applicantEmail: permit.user?.email || null,
          applicantPhone: permit.requesterContactNumber || null,
          relationshipToDeceased: permit.requesterRelation || null,
          preferredCemeteryId: permit.cemeteryLocation || null,
          preferredPlotId: null,
          preferredSection: null,
          preferredLayer: null,
          permitApprovedAt: updatedPermit.processedAt || new Date(),
          permitExpiryDate: null,
          permitDocumentUrl: updatedPermit.burialForm || permit.deathCertificate || null,
          metadata: {
            burialType: permit.burialType,
            nicheType: permit.nicheType || null
          }
        }
      })
    } catch (err) {
      console.error('Failed to create CemeteryPermitSubmission:', err)
    }

    return NextResponse.json({
      message: "Permit approved successfully",
      orderOfPayment: orderOfPayment,
      totalFee: permit.totalFee.toFixed(2),
      permit: updatedPermit
    })

  } catch (error) {
    console.error("Approve burial permit error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
