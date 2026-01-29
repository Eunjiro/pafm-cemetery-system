import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/auditLog"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || (user.role !== "EMPLOYEE" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { permitId, reason } = await request.json()

    if (!permitId || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const permit = await prisma.cremationPermit.findUnique({
      where: { id: permitId }
    })

    if (!permit) {
      return NextResponse.json({ error: "Cremation permit not found" }, { status: 404 })
    }

    const updatedPermit = await prisma.cremationPermit.update({
      where: { id: permitId },
      data: {
        status: "REJECTED",
        verificationNotes: reason,
        verifiedBy: user.id,
        verifiedAt: new Date()
      }
    })

    await createAuditLog({
      userId: user.id,
      action: "CREMATION_PERMIT_REJECTED",
      entityType: "CremationPermit",
      entityId: permitId,
      details: {
        reason
      }
    })

    return NextResponse.json({
      message: "Cremation permit rejected successfully",
      permit: updatedPermit
    })

  } catch (error) {
    console.error("Error rejecting cremation permit:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
