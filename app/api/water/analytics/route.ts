import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session || !["ADMIN", "EMPLOYEE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [drainageRequests, waterConnections, waterIssues] = await Promise.all([
    prisma.drainageRequest.findMany({ select: { id: true, status: true, barangay: true, createdAt: true, updatedAt: true } }),
    prisma.waterConnection.findMany({ select: { id: true, status: true, barangay: true, createdAt: true, updatedAt: true } }),
    prisma.waterIssue.findMany({ select: { id: true, status: true, address: true, createdAt: true, updatedAt: true } }),
  ])

  const allRecords = [
    ...drainageRequests.map((r) => ({ ...r, type: "Drainage Request" })),
    ...waterConnections.map((r) => ({ ...r, type: "Water Connection" })),
    ...waterIssues.map((r) => ({ ...r, barangay: r.address || "Unknown", type: "Water Issue" })),
  ]

  const total = allRecords.length
  const completed = allRecords.filter((r) => ["APPROVED", "COMPLETED", "RESOLVED"].includes(r.status)).length
  const pending = allRecords.filter((r) => ["PENDING", "UNDER_REVIEW", "PROCESSING", "IN_PROGRESS"].includes(r.status)).length
  const rejected = allRecords.filter((r) => ["REJECTED", "DENIED"].includes(r.status)).length

  // Avg processing days
  const completedRecords = allRecords.filter((r) => ["APPROVED", "COMPLETED", "RESOLVED"].includes(r.status))
  let avgProcessingDays = 0
  if (completedRecords.length > 0) {
    const totalDays = completedRecords.reduce((sum, r) => {
      return sum + (new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    }, 0)
    avgProcessingDays = Math.round((totalDays / completedRecords.length) * 10) / 10
  }

  // Type breakdown
  const typeBreakdown = [
    { type: "Drainage Request", count: drainageRequests.length },
    { type: "Water Connection", count: waterConnections.length },
    { type: "Water Issue", count: waterIssues.length },
  ]

  // Status distribution
  const statusMap: Record<string, number> = {}
  allRecords.forEach((r) => {
    const label = r.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    statusMap[label] = (statusMap[label] || 0) + 1
  })
  const statusDistribution = Object.entries(statusMap)
    .map(([status, count]) => ({ status, count }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count)

  // Volume trends (last 6 months)
  const now = new Date()
  const volumeTrends: Array<{ month: string; count: number }> = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    const label = d.toLocaleString("default", { month: "short", year: "2-digit" })
    const count = allRecords.filter((r) => {
      const created = new Date(r.createdAt)
      return created >= d && created <= monthEnd
    }).length
    volumeTrends.push({ month: label, count })
  }

  // Top barangays
  const barangayMap: Record<string, number> = {}
  allRecords.forEach((r) => {
    const b = (r.barangay || "Unknown").trim()
    if (b) barangayMap[b] = (barangayMap[b] || 0) + 1
  })
  const topBarangays = Object.entries(barangayMap)
    .map(([barangay, count]) => ({ barangay, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Bottlenecks
  const pendingRecords = allRecords.filter((r) =>
    ["PENDING", "UNDER_REVIEW", "PROCESSING", "IN_PROGRESS", "SCHEDULED"].includes(r.status)
  )
  const bottleneckMap: Record<string, { count: number; totalDays: number }> = {}
  pendingRecords.forEach((r) => {
    const label = r.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    if (!bottleneckMap[label]) bottleneckMap[label] = { count: 0, totalDays: 0 }
    bottleneckMap[label].count++
    bottleneckMap[label].totalDays += (now.getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  })
  const bottlenecks = Object.entries(bottleneckMap)
    .map(([status, data]) => ({
      status,
      count: data.count,
      avgWaitDays: Math.round((data.totalDays / data.count) * 10) / 10,
    }))
    .sort((a, b) => b.avgWaitDays - a.avgWaitDays)

  return NextResponse.json({
    kpis: {
      totalRequests: total,
      completedRequests: completed,
      pendingRequests: pending,
      rejectedRequests: rejected,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgProcessingDays,
    },
    typeBreakdown,
    statusDistribution,
    volumeTrends,
    topBarangays,
    bottlenecks,
  })
}
