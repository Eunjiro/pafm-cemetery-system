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

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        deliveryItems: {
          include: { delivery: { select: { deliveryNumber: true, status: true, deliveryDate: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        requisitionItems: {
          include: { requisition: { select: { risNumber: true, requestingOffice: true, status: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        stockAdjustments: {
          orderBy: { createdAt: "desc" },
          take: 20,
        }
      }
    })

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error("Fetch inventory item error:", error)
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

    const existing = await prisma.inventoryItem.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.category !== undefined) updateData.category = body.category
    if (body.unit !== undefined) updateData.unit = body.unit
    if (body.reorderLevel !== undefined) updateData.reorderLevel = parseInt(body.reorderLevel)
    if (body.storageZone !== undefined) updateData.storageZone = body.storageZone
    if (body.storageRack !== undefined) updateData.storageRack = body.storageRack

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
    })

    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.INVENTORY_ITEM_UPDATED,
      entityType: "InventoryItem",
      entityId: item.id,
      details: { changes: updateData }
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error("Update inventory item error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
