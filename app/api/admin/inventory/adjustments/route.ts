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

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user || (user.role !== "ADMIN" && user.role !== "EMPLOYEE")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { itemId, adjustmentType, newQty, reason } = body

    if (!itemId || !adjustmentType || newQty === undefined || !reason) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } })
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const previousQty = item.currentStock
    const difference = parseInt(newQty) - previousQty

    const adjustment = await prisma.stockAdjustment.create({
      data: {
        itemId,
        adjustmentType,
        previousQty,
        newQty: parseInt(newQty),
        difference,
        reason,
        performedBy: user.id,
        performedByName: user.name,
      }
    })

    // Update the item stock
    await prisma.inventoryItem.update({
      where: { id: itemId },
      data: { currentStock: parseInt(newQty) }
    })

    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.STOCK_ADJUSTMENT,
      entityType: "InventoryItem",
      entityId: itemId,
      details: { itemCode: item.itemCode, adjustmentType, previousQty, newQty: parseInt(newQty), difference, reason }
    })

    return NextResponse.json({ adjustment }, { status: 201 })
  } catch (error) {
    console.error("Stock adjustment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user || (user.role !== "ADMIN" && user.role !== "EMPLOYEE")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get("itemId") || ""
    const type = searchParams.get("type") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")

    const where: any = {}
    if (itemId) where.itemId = itemId
    if (type) where.adjustmentType = type

    const [adjustments, total] = await Promise.all([
      prisma.stockAdjustment.findMany({
        where,
        include: { item: { select: { name: true, itemCode: true, unit: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stockAdjustment.count({ where }),
    ])

    return NextResponse.json({
      adjustments,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error("Fetch stock adjustments error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
