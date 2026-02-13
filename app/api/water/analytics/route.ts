import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session || !["ADMIN", "EMPLOYEE"].includes(session.user?.role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  const [drainageRequests, waterConnections, waterIssues] = await Promise.all([
    prisma.drainageRequest.findMany({
      select: {
        id: true,
        status: true,
        issueType: true,
        urgency: true,
        barangay: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.waterConnection.findMany({
      select: {
        id: true,
        status: true,
        structureType: true,
        barangay: true,
        connectionFee: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.waterIssue.findMany({
      select: {
        id: true,
        status: true,
        issueType: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ])

  // Month labels
  const monthLabels: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthLabels.push(d.toLocaleString("default", { month: "short", year: "2-digit" }))
  }
  const getMonthKey = (date: Date) =>
    new Date(date).toLocaleString("default", { month: "short", year: "2-digit" })

  const allItems = [
    ...drainageRequests.map((r) => ({ ...r, serviceType: "Drainage" })),
    ...waterConnections.map((r) => ({ ...r, serviceType: "Connection" })),
    ...waterIssues.map((r) => ({ ...r, serviceType: "Issue" })),
  ]

  // Volume Trends
  const volumeTrends = monthLabels.map((label) => {
    const monthItems = allItems.filter((item) => getMonthKey(item.createdAt) === label)
    return {
      month: label,
      Drainage: monthItems.filter((i) => i.serviceType === "Drainage").length,
      Connection: monthItems.filter((i) => i.serviceType === "Connection").length,
      Issue: monthItems.filter((i) => i.serviceType === "Issue").length,
      Total: monthItems.length,
    }
  })

  // Status Distribution
  const statusCounts: Record<string, number> = {}
  allItems.forEach((item) => {
    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1
  })
  const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
    status: status.replace(/_/g, " "),
    count,
    percentage: allItems.length > 0 ? Math.round((count / allItems.length) * 100) : 0,
  }))

  // Type Breakdown
  const typeBreakdown = [
    { type: "Drainage Requests", count: drainageRequests.length, color: "#06b6d4" },
    { type: "Water Connections", count: waterConnections.length, color: "#3b82f6" },
    { type: "Water Issues", count: waterIssues.length, color: "#f59e0b" },
  ]

  // Drainage Issue Type Breakdown
  const drainageByType: Record<string, number> = {}
  drainageRequests.forEach((r) => {
    const t = r.issueType.replace(/_/g, " ")
    drainageByType[t] = (drainageByType[t] || 0) + 1
  })
  const drainageTypeBreakdown = Object.entries(drainageByType).map(([type, count]) => ({
    type,
    count,
  }))

  // Water Issue Type Breakdown
  const issueByType: Record<string, number> = {}
  waterIssues.forEach((r) => {
    const t = r.issueType.replace(/_/g, " ")
    issueByType[t] = (issueByType[t] || 0) + 1
  })
  const issueTypeBreakdown = Object.entries(issueByType).map(([type, count]) => ({
    type,
    count,
  }))

  // Barangay Distribution
  const barangayCounts: Record<string, number> = {}
  allItems.forEach((item) => {
    const b = (item as { barangay?: string; address?: string }).barangay || (item as { address?: string }).address || "Unknown"
    barangayCounts[b] = (barangayCounts[b] || 0) + 1
  })
  const barangayDistribution = Object.entries(barangayCounts)
    .map(([barangay, count]) => ({ barangay, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)

  // Urgency Distribution (drainage)
  const urgencyCounts: Record<string, number> = {}
  drainageRequests.forEach((r) => {
    urgencyCounts[r.urgency] = (urgencyCounts[r.urgency] || 0) + 1
  })
  const urgencyDistribution = Object.entries(urgencyCounts).map(([urgency, count]) => ({
    urgency,
    count,
  }))

  // Structure Type (connections)
  const structureCounts: Record<string, number> = {}
  waterConnections.forEach((r) => {
    const t = r.structureType.replace(/_/g, " ")
    structureCounts[t] = (structureCounts[t] || 0) + 1
  })
  const structureTypeBreakdown = Object.entries(structureCounts).map(([type, count]) => ({
    type,
    count,
  }))

  // Processing Efficiency
  const completedStatuses = ["COMPLETED", "ACTIVE_CONNECTION", "RESOLVED", "CLOSED"]
  const completedItems = allItems.filter((i) => completedStatuses.includes(i.status))
  const processingTimes = completedItems.map((item) => {
    const c = new Date(item.createdAt).getTime()
    const u = new Date(item.updatedAt).getTime()
    return (u - c) / (1000 * 60 * 60 * 24)
  })
  const avgProcessingTime =
    processingTimes.length > 0
      ? Math.round((processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length) * 10) / 10
      : 0

  const processingByType = ["Drainage", "Connection", "Issue"].map((type) => {
    const items = completedItems.filter((i) => i.serviceType === type)
    const times = items.map((i) => {
      const c = new Date(i.createdAt).getTime()
      const u = new Date(i.updatedAt).getTime()
      return (u - c) / (1000 * 60 * 60 * 24)
    })
    return {
      type,
      avgDays: times.length > 0 ? Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10 : 0,
      count: items.length,
    }
  })

  // Completion & Rejection Rates
  const rejectedItems = allItems.filter((i) => i.status === "REJECTED")
  const pendingItems = allItems.filter((i) => !completedStatuses.includes(i.status) && i.status !== "REJECTED")
  const completionRate = allItems.length > 0 ? Math.round((completedItems.length / allItems.length) * 100) : 0

  // Bottlenecks
  const bottleneckByStatus: Record<string, { count: number; avgWaitDays: number }> = {}
  pendingItems.forEach((item) => {
    const waitDays = (now.getTime() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    if (!bottleneckByStatus[item.status]) {
      bottleneckByStatus[item.status] = { count: 0, avgWaitDays: 0 }
    }
    bottleneckByStatus[item.status].count++
    bottleneckByStatus[item.status].avgWaitDays += waitDays
  })
  const bottlenecks = Object.entries(bottleneckByStatus)
    .map(([status, data]) => ({
      status: status.replace(/_/g, " "),
      count: data.count,
      avgWaitDays: Math.round((data.avgWaitDays / data.count) * 10) / 10,
    }))
    .sort((a, b) => b.avgWaitDays - a.avgWaitDays)

  // KPIs
  const kpis = {
    totalRequests: allItems.length,
    completedRequests: completedItems.length,
    pendingRequests: pendingItems.length,
    rejectedRequests: rejectedItems.length,
    completionRate,
    avgProcessingDays: avgProcessingTime,
    thisMonthRequests: allItems.filter((i) => getMonthKey(i.createdAt) === monthLabels[monthLabels.length - 1]).length,
    lastMonthRequests: allItems.filter((i) => monthLabels.length > 1 && getMonthKey(i.createdAt) === monthLabels[monthLabels.length - 2]).length,
  }

  return NextResponse.json({
    kpis,
    volumeTrends,
    statusDistribution,
    typeBreakdown,
    drainageTypeBreakdown,
    issueTypeBreakdown,
    barangayDistribution,
    urgencyDistribution,
    structureTypeBreakdown,
    processingByType,
    bottlenecks,
  })
}
