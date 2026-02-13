import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"

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
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const lowStock = searchParams.get("lowStock") === "true"

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { itemCode: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }
    if (category) where.category = category

    if (lowStock) {
      where.currentStock = { lte: prisma.inventoryItem.fields.reorderLevel }
    }

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: {
              deliveryItems: true,
              requisitionItems: true,
              stockAdjustments: true,
            }
          }
        }
      }),
      prisma.inventoryItem.count({ where }),
    ])

    // Get stats
    const allItems = await prisma.inventoryItem.findMany({
      select: { currentStock: true, reorderLevel: true, reservedStock: true, category: true }
    })

    const stats = {
      totalItems: allItems.length,
      totalStock: allItems.reduce((sum, i) => sum + i.currentStock, 0),
      lowStockItems: allItems.filter(i => i.currentStock <= i.reorderLevel && i.reorderLevel > 0).length,
      reservedItems: allItems.filter(i => i.reservedStock > 0).length,
    }

    return NextResponse.json({
      items,
      stats,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error("Fetch inventory items error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, category, unit, currentStock, reorderLevel, storageZone, storageRack } = body

    if (!name || !unit) {
      return NextResponse.json({ error: "Name and unit are required" }, { status: 400 })
    }

    // Generate item code
    const count = await prisma.inventoryItem.count()
    const prefix = (category || "SUPPLIES").substring(0, 3).toUpperCase()
    const itemCode = `${prefix}-${String(count + 1).padStart(5, "0")}`

    const item = await prisma.inventoryItem.create({
      data: {
        itemCode,
        name,
        description: description || null,
        category: category || "SUPPLIES",
        unit,
        currentStock: parseInt(currentStock) || 0,
        reorderLevel: parseInt(reorderLevel) || 0,
        storageZone: storageZone || null,
        storageRack: storageRack || null,
      }
    })

    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.INVENTORY_ITEM_CREATED,
      entityType: "InventoryItem",
      entityId: item.id,
      details: { itemCode, name, category, unit }
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error("Create inventory item error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
