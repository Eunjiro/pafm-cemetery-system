import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// Delivery statuses
const DELIVERY_COMPLETED = ["VERIFIED", "STORED"]
const DELIVERY_PENDING = ["PENDING_VERIFICATION"]

// Requisition statuses
const REQ_COMPLETED = ["ISSUED"]
const REQ_APPROVED = ["APPROVED", "FOR_RELEASE"]
const REQ_PENDING = ["PENDING_APPROVAL", "PENDING_STOCK"]
const REQ_REJECTED = ["REJECTED"]

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [items, deliveries, requisitions, adjustments] = await Promise.all([
    prisma.inventoryItem.findMany({
      select: {
        id: true, name: true, category: true,
        currentStock: true, reservedStock: true, reorderLevel: true,
        storageZone: true, createdAt: true,
      },
    }),
    prisma.delivery.findMany({
      select: {
        id: true, status: true, supplierName: true,
        deliveryDate: true, createdAt: true, updatedAt: true,
        items: { select: { quantity: true, verifiedQty: true } },
      },
    }),
    prisma.requisition.findMany({
      select: {
        id: true, status: true, requestingOffice: true,
        createdAt: true, updatedAt: true,
        items: { select: { requestedQty: true, issuedQty: true } },
      },
    }),
    prisma.stockAdjustment.findMany({
      select: {
        id: true, adjustmentType: true, difference: true,
        createdAt: true,
      },
    }),
  ])

  // ─── KPIs ───
  const totalItems = items.length
  const totalStock = items.reduce((sum, i) => sum + i.currentStock, 0)
  const lowStockItems = items.filter((i) => i.reorderLevel > 0 && i.currentStock <= i.reorderLevel).length
  const outOfStockItems = items.filter((i) => i.currentStock === 0).length

  const totalDeliveries = deliveries.length
  const pendingDeliveries = deliveries.filter((d) => DELIVERY_PENDING.includes(d.status)).length
  const completedDeliveries = deliveries.filter((d) => DELIVERY_COMPLETED.includes(d.status)).length

  const totalRequisitions = requisitions.length
  const issuedRequisitions = requisitions.filter((r) => REQ_COMPLETED.includes(r.status)).length
  const pendingRequisitions = requisitions.filter((r) => REQ_PENDING.includes(r.status)).length
  const rejectedRequisitions = requisitions.filter((r) => REQ_REJECTED.includes(r.status)).length
  const fulfillmentRate = totalRequisitions > 0 ? Math.round((issuedRequisitions / totalRequisitions) * 100) : 0

  // Avg delivery processing days
  const completedDel = deliveries.filter((d) => DELIVERY_COMPLETED.includes(d.status))
  let avgDeliveryDays = 0
  if (completedDel.length > 0) {
    const totalDays = completedDel.reduce((sum, d) => {
      return sum + (new Date(d.updatedAt).getTime() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    }, 0)
    avgDeliveryDays = Math.round((totalDays / completedDel.length) * 10) / 10
  }

  // ─── Category Breakdown ───
  const catMap: Record<string, number> = {}
  items.forEach((i) => {
    const label = i.category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    catMap[label] = (catMap[label] || 0) + 1
  })
  const categoryBreakdown = Object.entries(catMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  // ─── Delivery Status Distribution ───
  const delStatusMap: Record<string, number> = {}
  deliveries.forEach((d) => {
    const label = d.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    delStatusMap[label] = (delStatusMap[label] || 0) + 1
  })
  const deliveryStatusDistribution = Object.entries(delStatusMap)
    .map(([status, count]) => ({ status, count }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count)

  // ─── Requisition Status Distribution ───
  const reqStatusMap: Record<string, number> = {}
  requisitions.forEach((r) => {
    const label = r.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    reqStatusMap[label] = (reqStatusMap[label] || 0) + 1
  })
  const requisitionStatusDistribution = Object.entries(reqStatusMap)
    .map(([status, count]) => ({ status, count }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count)

  // ─── Volume Trends (last 6 months) ───
  const now = new Date()
  const deliveryTrends: Array<{ month: string; deliveries: number; requisitions: number }> = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    const label = d.toLocaleString("default", { month: "short", year: "2-digit" })
    const delCount = deliveries.filter((del) => {
      const created = new Date(del.createdAt)
      return created >= d && created <= monthEnd
    }).length
    const reqCount = requisitions.filter((req) => {
      const created = new Date(req.createdAt)
      return created >= d && created <= monthEnd
    }).length
    deliveryTrends.push({ month: label, deliveries: delCount, requisitions: reqCount })
  }

  // ─── Top Requesting Offices ───
  const officeMap: Record<string, number> = {}
  requisitions.forEach((r) => {
    const office = (r.requestingOffice || "Unknown").trim()
    officeMap[office] = (officeMap[office] || 0) + 1
  })
  const topOffices = Object.entries(officeMap)
    .map(([office, count]) => ({ office, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // ─── Stock Adjustment Summary ───
  const adjMap: Record<string, { count: number; totalDiff: number }> = {}
  adjustments.forEach((a) => {
    const label = a.adjustmentType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    if (!adjMap[label]) adjMap[label] = { count: 0, totalDiff: 0 }
    adjMap[label].count++
    adjMap[label].totalDiff += a.difference
  })
  const adjustmentSummary = Object.entries(adjMap)
    .map(([type, data]) => ({ type, count: data.count, netChange: data.totalDiff }))
    .sort((a, b) => b.count - a.count)

  // ─── Bottlenecks ───
  const pendingDel = deliveries.filter((d) => DELIVERY_PENDING.includes(d.status))
  const pendingReqs = requisitions.filter((r) => [...REQ_PENDING, ...REQ_APPROVED].includes(r.status))
  const bottleneckItems: Array<{ area: string; status: string; count: number; avgWaitDays: number }> = []

  // Delivery bottlenecks
  if (pendingDel.length > 0) {
    const totalWait = pendingDel.reduce((sum, d) => {
      return sum + (now.getTime() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    }, 0)
    bottleneckItems.push({
      area: "Receiving",
      status: "Pending Verification",
      count: pendingDel.length,
      avgWaitDays: Math.round((totalWait / pendingDel.length) * 10) / 10,
    })
  }

  // Requisition bottlenecks by status
  const reqBottleneckMap: Record<string, { count: number; totalDays: number }> = {}
  pendingReqs.forEach((r) => {
    const label = r.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    if (!reqBottleneckMap[label]) reqBottleneckMap[label] = { count: 0, totalDays: 0 }
    reqBottleneckMap[label].count++
    reqBottleneckMap[label].totalDays += (now.getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  })
  Object.entries(reqBottleneckMap).forEach(([status, data]) => {
    bottleneckItems.push({
      area: "Requisitions",
      status,
      count: data.count,
      avgWaitDays: Math.round((data.totalDays / data.count) * 10) / 10,
    })
  })

  bottleneckItems.sort((a, b) => b.avgWaitDays - a.avgWaitDays)

  return NextResponse.json({
    kpis: {
      totalItems,
      totalStock,
      lowStockItems,
      outOfStockItems,
      totalDeliveries,
      pendingDeliveries,
      completedDeliveries,
      avgDeliveryDays,
      totalRequisitions,
      issuedRequisitions,
      pendingRequisitions,
      rejectedRequisitions,
      fulfillmentRate,
    },
    categoryBreakdown,
    deliveryStatusDistribution,
    requisitionStatusDistribution,
    deliveryTrends,
    topOffices,
    adjustmentSummary,
    bottlenecks: bottleneckItems,
  })
}
