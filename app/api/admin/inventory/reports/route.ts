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
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get("type") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const where: any = {}
    if (reportType) where.reportType = reportType

    const [rawReports, total] = await Promise.all([
      prisma.inventoryReport.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.inventoryReport.count({ where }),
    ])

    // Parse the JSON data field so the frontend receives objects
    const reports = rawReports.map(r => ({
      ...r,
      data: r.data ? JSON.parse(r.data) : null,
    }))

    return NextResponse.json({
      reports,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error("Fetch reports error:", error)
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
    const { reportType, reportPeriod, periodStart, periodEnd, submittedTo, notes } = body

    if (!reportType || !reportPeriod || !periodStart || !periodEnd) {
      return NextResponse.json({ error: "Report type, period, and dates are required" }, { status: 400 })
    }

    // Generate report data based on period
    const start = new Date(periodStart)
    const end = new Date(periodEnd)

    // Gather inventory data
    const [items, deliveries, requisitions, adjustments] = await Promise.all([
      prisma.inventoryItem.findMany({
        select: {
          id: true, itemCode: true, name: true, category: true, unit: true,
          currentStock: true, reservedStock: true, reorderLevel: true,
          storageZone: true, storageRack: true,
        },
        orderBy: { name: "asc" }
      }),
      prisma.delivery.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: { items: true },
        orderBy: { createdAt: "desc" }
      }),
      prisma.requisition.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: { items: true },
        orderBy: { createdAt: "desc" }
      }),
      prisma.stockAdjustment.findMany({
        where: { createdAt: { gte: start, lte: end } },
        orderBy: { createdAt: "desc" }
      }),
    ])

    // Build adjustment type breakdown
    const adjustmentsByType = adjustments.reduce((acc: Record<string, number>, adj) => {
      const t = adj.adjustmentType || "OTHER"
      acc[t] = (acc[t] || 0) + 1
      return acc
    }, {})

    const reportData = {
      generatedAt: new Date().toISOString(),
      period: { start: start.toISOString(), end: end.toISOString() },
      summary: {
        totalItems: items.length,
        totalStock: items.reduce((sum, i) => sum + i.currentStock, 0),
        totalReserved: items.reduce((sum, i) => sum + i.reservedStock, 0),
        lowStockItems: items.filter(i => i.currentStock <= i.reorderLevel && i.reorderLevel > 0).length,
        totalValue: 0, // Can be computed if items have unitCost
        deliveriesReceived: deliveries.length,
        deliveriesStored: deliveries.filter(d => d.status === "STORED").length,
        totalItemsReceived: deliveries.reduce((sum, d) => sum + d.items.reduce((s, i) => s + (i.verifiedQty ?? i.quantity), 0), 0),
        requisitionsProcessed: requisitions.length,
        requisitionsIssued: requisitions.filter(r => r.status === "ISSUED").length,
        totalItemsIssued: requisitions.filter(r => r.status === "ISSUED").reduce((sum, r) => sum + r.items.reduce((s, i) => s + (i.issuedQty ?? 0), 0), 0),
        stockAdjustments: adjustments.length,
      },
      inventorySnapshot: items,
      categoryBreakdown: items.reduce((acc: Record<string, { count: number; totalStock: number }>, item) => {
        if (!acc[item.category]) acc[item.category] = { count: 0, totalStock: 0 }
        acc[item.category].count++
        acc[item.category].totalStock += item.currentStock
        return acc
      }, {}),
      deliveries: {
        total: deliveries.length,
        recent: deliveries.slice(0, 20).map(d => ({
          deliveryNumber: d.deliveryNumber,
          supplier: d.supplierName,
          status: d.status,
          date: d.deliveryDate,
          itemCount: d.items.length,
        })),
      },
      requisitions: {
        total: requisitions.length,
        recent: requisitions.slice(0, 20).map(r => ({
          risNumber: r.risNumber,
          requestingOffice: r.requestingOffice,
          status: r.status,
          date: r.createdAt,
          itemCount: r.items.length,
        })),
      },
      adjustments: {
        total: adjustments.length,
        byType: adjustmentsByType,
      },
    }

    const report = await prisma.inventoryReport.create({
      data: {
        reportType: reportType as any,
        reportPeriod,
        periodStart: start,
        periodEnd: end,
        data: JSON.stringify(reportData),
        generatedBy: user.id,
        generatedByName: user.name,
        submittedTo: submittedTo || null,
        notes: notes || null,
      }
    })

    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.INVENTORY_REPORT_GENERATED,
      entityType: "InventoryReport",
      entityId: report.id,
      details: { reportType, reportPeriod }
    })

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    console.error("Generate report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 })
    }

    const report = await prisma.inventoryReport.findUnique({ where: { id } })
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    await prisma.inventoryReport.delete({ where: { id } })

    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.INVENTORY_REPORT_DELETED,
      entityType: "InventoryReport",
      entityId: id,
      details: { reportType: report.reportType, reportPeriod: report.reportPeriod }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
