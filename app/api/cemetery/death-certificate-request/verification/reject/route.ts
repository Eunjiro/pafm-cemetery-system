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

    const { requestId, remarks } = await request.json()

    if (!requestId || !remarks) {
      return NextResponse.json(
        { error: "Request ID and remarks are required" },
        { status: 400 }
      )
    }

    // Update status to returned for correction
    await prisma.deathCertificateRequest.update({
      where: { id: requestId },
      data: {
        status: "RETURNED_FOR_CORRECTION",
        remarks,
        verifiedBy: session.user.id,
        verifiedAt: new Date()
      }
    })

    // Create audit log
    await createAuditLog({
      userId: session.user.id!,
      action: AUDIT_ACTIONS.DEATH_CERTIFICATE_REQUEST_REJECTED,
      entityType: "DeathCertificateRequest",
      entityId: requestId,
      details: {
        remarks,
        verifiedBy: session.user.name
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Error rejecting certificate request:", error)
    return NextResponse.json(
      { error: "Failed to reject request" },
      { status: 500 }
    )
  }
}
