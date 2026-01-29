import { auth } from "@/auth"
export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role || "USER"
    if (userRole !== "EMPLOYEE" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { requestId } = await request.json()

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 })
    }

    // Fetch the request
    const certificateRequest = await prisma.deathCertificateRequest.findUnique({
      where: { id: requestId }
    })

    if (!certificateRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // Generate Order of Payment
    const timestamp = Date.now()
    const orderOfPayment = `OR-${timestamp}-${requestId.substring(0, 8).toUpperCase()}`

    // Update status and generate OR
    const updatedRequest = await prisma.deathCertificateRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED_FOR_PAYMENT",
        orderOfPayment,
        verifiedBy: session.user.id,
        verifiedAt: new Date()
      }
    })

    // Create audit log
    await createAuditLog({
      userId: session.user.id!,
      action: AUDIT_ACTIONS.DEATH_CERTIFICATE_REQUEST_APPROVED,
      entityType: "DeathCertificateRequest",
      entityId: requestId,
      details: {
        orderOfPayment,
        totalFee: updatedRequest.totalFee,
        verifiedBy: session.user.name
      }
    })

    return NextResponse.json({
      success: true,
      orderOfPayment,
      totalFee: updatedRequest.totalFee
    })

  } catch (error) {
    console.error("Error approving certificate request:", error)
    return NextResponse.json(
      { error: "Failed to approve request" },
      { status: 500 }
    )
  }
}
