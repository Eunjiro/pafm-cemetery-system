import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

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

    // Dashboard stats
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const [
      totalItems,
      items,
      pendingDeliveries,
      monthDeliveries,
      pendingRequisitions,
      monthRequisitions,
      recentDeliveries,
      recentRequisitions,
      recentAdjustments,
    ] = await Promise.all([
      prisma.inventoryItem.count(),
      prisma.inventoryItem.findMany({
        select: { currentStock: true, reservedStock: true, reorderLevel: true, category: true }
      }),
      prisma.delivery.count({ where: { status: "PENDING_VERIFICATION" } }),
      prisma.delivery.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.requisition.count({ where: { status: "PENDING_APPROVAL" } }),
      prisma.requisition.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.delivery.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, deliveryNumber: true, supplierName: true, status: true, createdAt: true, items: { select: { quantity: true } } }
      }),
      prisma.requisition.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, risNumber: true, requestingOffice: true, status: true, createdAt: true, items: { select: { requestedQty: true } } }
      }),
      prisma.stockAdjustment.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { item: { select: { name: true, itemCode: true } } }
      }),
    ])

    const totalStock = items.reduce((sum, i) => sum + i.currentStock, 0)
    const lowStockItems = items.filter(i => i.currentStock <= i.reorderLevel && i.reorderLevel > 0).length
    const outOfStockItems = items.filter(i => i.currentStock === 0).length

    const categoryBreakdown = items.reduce((acc: Record<string, { count: number; stock: number }>, item) => {
      if (!acc[item.category]) acc[item.category] = { count: 0, stock: 0 }
      acc[item.category].count++
      acc[item.category].stock += item.currentStock
      return acc
    }, {})

    return NextResponse.json({
      stats: {
        totalItems,
        totalStock,
        lowStockItems,
        outOfStockItems,
        pendingDeliveries,
        monthDeliveries,
        pendingRequisitions,
        monthRequisitions,
      },
      categoryBreakdown,
      recentDeliveries,
      recentRequisitions,
      recentAdjustments,
    })
  } catch (error) {
    console.error("Inventory dashboard error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
