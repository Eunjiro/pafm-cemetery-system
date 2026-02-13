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

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        items: {
          include: { item: { select: { name: true, itemCode: true, currentStock: true } } }
        }
      }
    })

    if (!delivery) {
      return NextResponse.json({ error: "Delivery not found" }, { status: 404 })
    }

    return NextResponse.json({ delivery })
  } catch (error) {
    console.error("Fetch delivery error:", error)
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
    if (!user || (user.role !== "ADMIN" && user.role !== "EMPLOYEE")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, verifiedItems } = body

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!delivery) {
      return NextResponse.json({ error: "Delivery not found" }, { status: 404 })
    }

    if (action === "verify") {
      if (delivery.status !== "PENDING_VERIFICATION") {
        return NextResponse.json({ error: "Delivery is not pending verification" }, { status: 400 })
      }

      // Update verified quantities for items
      if (verifiedItems && Array.isArray(verifiedItems)) {
        for (const vi of verifiedItems) {
          await prisma.deliveryItem.update({
            where: { id: vi.id },
            data: { verifiedQty: vi.verifiedQty, remarks: vi.remarks || null }
          })
        }
      }

      const updated = await prisma.delivery.update({
        where: { id },
        data: {
          status: "VERIFIED",
          verifiedBy: user.id,
          verifiedAt: new Date(),
        },
        include: { items: true }
      })

      await createAuditLog({
        userId: user.id,
        action: AUDIT_ACTIONS.DELIVERY_VERIFIED,
        entityType: "Delivery",
        entityId: id,
        details: { deliveryNumber: delivery.deliveryNumber }
      })

      return NextResponse.json({ delivery: updated })
    }

    if (action === "store") {
      if (delivery.status !== "VERIFIED") {
        return NextResponse.json({ error: "Delivery must be verified first" }, { status: 400 })
      }

      // Update inventory stock for each item
      for (const item of delivery.items) {
        const qtyToAdd = item.verifiedQty ?? item.quantity

        if (item.itemId) {
          // Item exists in inventory — update stock
          await prisma.inventoryItem.update({
            where: { id: item.itemId },
            data: { currentStock: { increment: qtyToAdd } }
          })
        } else {
          // Create new inventory item
          const count = await prisma.inventoryItem.count()
          const itemCode = `SUP-${String(count + 1).padStart(5, "0")}`

          const newItem = await prisma.inventoryItem.create({
            data: {
              itemCode,
              name: item.itemName,
              description: item.description,
              unit: item.unit,
              currentStock: qtyToAdd,
              category: "SUPPLIES",
            }
          })

          // Link the delivery item to the new inventory item
          await prisma.deliveryItem.update({
            where: { id: item.id },
            data: { itemId: newItem.id }
          })
        }
      }

      const updated = await prisma.delivery.update({
        where: { id },
        data: {
          status: "STORED",
          storedAt: new Date(),
        },
        include: { items: { include: { item: true } } }
      })

      await createAuditLog({
        userId: user.id,
        action: AUDIT_ACTIONS.DELIVERY_STORED,
        entityType: "Delivery",
        entityId: id,
        details: { deliveryNumber: delivery.deliveryNumber, itemCount: delivery.items.length }
      })

      return NextResponse.json({ delivery: updated })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Update delivery error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
