import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user || (user.role !== "ADMIN" && user.role !== "EMPLOYEE")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    const requisition = await prisma.requisition.findUnique({
      where: { id },
      include: {
        items: {
          include: { item: { select: { name: true, itemCode: true, currentStock: true, unit: true, reservedStock: true } } }
        }
      }
    })

    if (!requisition) {
      return NextResponse.json({ error: "Requisition not found" }, { status: 404 })
    }

    return NextResponse.json({ requisition })
  } catch (error) {
    console.error("Fetch requisition error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, approvedItems, rejectionReason, acknowledgement, remarks } = body

    const requisition = await prisma.requisition.findUnique({
      where: { id },
      include: { items: { include: { item: true } } }
    })

    if (!requisition) {
      return NextResponse.json({ error: "Requisition not found" }, { status: 404 })
    }

    // APPROVE
    if (action === "approve") {
      if (requisition.status !== "PENDING_APPROVAL") {
        return NextResponse.json({ error: "Requisition is not pending approval" }, { status: 400 })
      }

      // Check stock availability
      let hasStock = true
      for (const item of requisition.items) {
        const invItem = item.item
        const approvedQty = approvedItems?.find((ai: any) => ai.id === item.id)?.approvedQty ?? item.requestedQty
        const available = invItem.currentStock - invItem.reservedStock
        if (available < approvedQty) {
          hasStock = false
          break
        }
      }

      // Update approved quantities
      if (approvedItems && Array.isArray(approvedItems)) {
        for (const ai of approvedItems) {
          await prisma.requisitionItem.update({
            where: { id: ai.id },
            data: { approvedQty: ai.approvedQty, remarks: ai.remarks || null }
          })
        }
      } else {
        // Auto-approve with requested quantities
        for (const item of requisition.items) {
          await prisma.requisitionItem.update({
            where: { id: item.id },
            data: { approvedQty: item.requestedQty }
          })
        }
      }

      const newStatus = hasStock ? "APPROVED" : "PENDING_STOCK"

      // Reserve stock for approved items
      if (hasStock) {
        for (const item of requisition.items) {
          const approvedQty = approvedItems?.find((ai: any) => ai.id === item.id)?.approvedQty ?? item.requestedQty
          await prisma.inventoryItem.update({
            where: { id: item.itemId },
            data: { reservedStock: { increment: approvedQty } }
          })
        }
      }

      const updated = await prisma.requisition.update({
        where: { id },
        data: {
          status: newStatus,
          approvedBy: user.id,
          approvedByName: user.name,
          approvedAt: new Date(),
          remarks: remarks || null,
        },
        include: { items: { include: { item: true } } }
      })

      await createAuditLog({
        userId: user.id,
        action: AUDIT_ACTIONS.REQUISITION_APPROVED,
        entityType: "Requisition",
        entityId: id,
        details: { risNumber: requisition.risNumber, status: newStatus }
      })

      return NextResponse.json({ requisition: updated })
    }

    // REJECT
    if (action === "reject") {
      if (requisition.status !== "PENDING_APPROVAL") {
        return NextResponse.json({ error: "Requisition is not pending approval" }, { status: 400 })
      }

      const updated = await prisma.requisition.update({
        where: { id },
        data: {
          status: "REJECTED",
          approvedBy: user.id,
          approvedByName: user.name,
          approvedAt: new Date(),
          rejectionReason: rejectionReason || "Request rejected",
          remarks: remarks || null,
        },
        include: { items: { include: { item: true } } }
      })

      await createAuditLog({
        userId: user.id,
        action: AUDIT_ACTIONS.REQUISITION_REJECTED,
        entityType: "Requisition",
        entityId: id,
        details: { risNumber: requisition.risNumber, reason: rejectionReason }
      })

      return NextResponse.json({ requisition: updated })
    }

    // RELEASE (prepare for issuance)
    if (action === "release") {
      if (requisition.status !== "APPROVED") {
        return NextResponse.json({ error: "Requisition must be approved first" }, { status: 400 })
      }

      const updated = await prisma.requisition.update({
        where: { id },
        data: {
          status: "FOR_RELEASE",
          remarks: remarks || null,
        },
        include: { items: { include: { item: true } } }
      })

      await createAuditLog({
        userId: user.id,
        action: AUDIT_ACTIONS.REQUISITION_RELEASED,
        entityType: "Requisition",
        entityId: id,
        details: { risNumber: requisition.risNumber }
      })

      return NextResponse.json({ requisition: updated })
    }

    // ISSUE (complete the transaction)
    if (action === "issue") {
      if (requisition.status !== "APPROVED" && requisition.status !== "FOR_RELEASE") {
        return NextResponse.json({ error: "Requisition must be approved or for release" }, { status: 400 })
      }

      // Deduct stock
      for (const item of requisition.items) {
        const issuedQty = item.approvedQty ?? item.requestedQty
        await prisma.requisitionItem.update({
          where: { id: item.id },
          data: { issuedQty }
        })

        await prisma.inventoryItem.update({
          where: { id: item.itemId },
          data: {
            currentStock: { decrement: issuedQty },
            reservedStock: { decrement: issuedQty },
          }
        })
      }

      const updated = await prisma.requisition.update({
        where: { id },
        data: {
          status: "ISSUED",
          issuedBy: user.id,
          issuedByName: user.name,
          issuedAt: new Date(),
          acknowledgement: acknowledgement || null,
          remarks: remarks || null,
        },
        include: { items: { include: { item: true } } }
      })

      await createAuditLog({
        userId: user.id,
        action: AUDIT_ACTIONS.REQUISITION_ISSUED,
        entityType: "Requisition",
        entityId: id,
        details: { risNumber: requisition.risNumber, itemCount: requisition.items.length }
      })

      return NextResponse.json({ requisition: updated })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Update requisition error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
