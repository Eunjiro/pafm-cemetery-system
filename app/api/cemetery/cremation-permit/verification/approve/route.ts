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

    const { permitId, notes } = await request.json()

    if (!permitId) {
      return NextResponse.json({ error: "Missing permit ID" }, { status: 400 })
    }

    const permit = await prisma.cremationPermit.findUnique({
      where: { id: permitId }
    })

    if (!permit) {
      return NextResponse.json({ error: "Cremation permit not found" }, { status: 404 })
    }

    // Generate Order of Payment
    const timestamp = Date.now()
    const orderOfPayment = `OR-${timestamp}-${permitId.substring(0, 8).toUpperCase()}`

    const updatedPermit = await prisma.cremationPermit.update({
      where: { id: permitId },
      data: {
        status: "APPROVED_FOR_PAYMENT",
        orderOfPayment,
        verificationNotes: notes,
        verifiedBy: user.id,
        verifiedAt: new Date()
      }
    })

    await createAuditLog({
      userId: user.id,
      action: "CREMATION_PERMIT_APPROVED",
      entityType: "CremationPermit",
      entityId: permitId,
      details: {
        orderOfPayment,
        notes
      }
    })

    return NextResponse.json({
      message: "Cremation permit approved successfully",
      permit: updatedPermit
    })

  } catch (error) {
    console.error("Error approving cremation permit:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
