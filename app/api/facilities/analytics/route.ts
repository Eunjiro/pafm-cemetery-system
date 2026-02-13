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

  const reservations = await prisma.facilityReservation.findMany({
    select: {
      id: true,
      status: true,
      activityType: true,
      facilityType: true,
      estimatedParticipants: true,
      amountDue: true,
      amountPaid: true,
      isLguEvent: true,
      isPriority: true,
      isPaymentExempted: true,
      hasDamages: true,
      noShow: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  // Month labels
  const monthLabels: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthLabels.push(d.toLocaleString("default", { month: "short", year: "2-digit" }))
  }
  const getMonthKey = (date: Date) =>
    new Date(date).toLocaleString("default", { month: "short", year: "2-digit" })

  // Volume Trends
  const volumeTrends = monthLabels.map((label) => {
    const count = reservations.filter((r) => getMonthKey(r.createdAt) === label).length
    return { month: label, Reservations: count }
  })

  // Status Distribution
  const statusCounts: Record<string, number> = {}
  reservations.forEach((r) => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1
  })
  const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
    status: status.replace(/_/g, " "),
    count,
    percentage: reservations.length > 0 ? Math.round((count / reservations.length) * 100) : 0,
  }))

  // Facility Type Breakdown
  const byFacility: Record<string, number> = {}
  reservations.forEach((r) => {
    const t = r.facilityType.replace(/_/g, " ")
    byFacility[t] = (byFacility[t] || 0) + 1
  })
  const facilityTypeBreakdown = Object.entries(byFacility).map(([type, count], i) => ({
    type,
    count,
    color: ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#f59e0b"][i % 8],
  }))

  // Activity Type Breakdown
  const byActivity: Record<string, number> = {}
  reservations.forEach((r) => {
    const t = r.activityType.replace(/_/g, " ")
    byActivity[t] = (byActivity[t] || 0) + 1
  })
  const activityTypeBreakdown = Object.entries(byActivity).map(([type, count]) => ({ type, count }))

  // Revenue
  const totalRevenue = reservations.reduce((sum, r) => sum + (r.amountPaid || 0), 0)
  const lguCount = reservations.filter((r) => r.isLguEvent).length
  const privateCount = reservations.length - lguCount
  const damagesCount = reservations.filter((r) => r.hasDamages).length
  const noShowCount = reservations.filter((r) => r.noShow).length
  const exemptedCount = reservations.filter((r) => r.isPaymentExempted).length

  const revenueByMonth = monthLabels.map((label) => {
    const monthRevenue = reservations
      .filter((r) => getMonthKey(r.createdAt) === label)
      .reduce((sum, r) => sum + (r.amountPaid || 0), 0)
    return { month: label, revenue: monthRevenue }
  })

  // Facility usage by month
  const facilityByMonth = monthLabels.map((label) => {
    const monthItems = reservations.filter((r) => getMonthKey(r.createdAt) === label)
    const result: Record<string, number> = { month: 0 }
    const facilityTypes = [...new Set(reservations.map((r) => r.facilityType))]
    facilityTypes.forEach((ft) => {
      result[ft.replace(/_/g, " ")] = monthItems.filter((r) => r.facilityType === ft).length
    })
    return { month: label, ...result }
  })

  // Processing Efficiency
  const completedStatuses = ["COMPLETED", "COMPLETED_WITH_DAMAGES"]
  const completedItems = reservations.filter((r) => completedStatuses.includes(r.status))
  const processingTimes = completedItems.map((r) => {
    const c = new Date(r.createdAt).getTime()
    const u = new Date(r.updatedAt).getTime()
    return (u - c) / (1000 * 60 * 60 * 24)
  })
  const avgProcessingTime = processingTimes.length > 0
    ? Math.round((processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length) * 10) / 10
    : 0

  // Processing by Facility Type
  const facilityTypes = [...new Set(reservations.map((r) => r.facilityType))]
  const processingByFacility = facilityTypes.map((ft) => {
    const items = completedItems.filter((r) => r.facilityType === ft)
    const times = items.map((r) => {
      const c = new Date(r.createdAt).getTime()
      const u = new Date(r.updatedAt).getTime()
      return (u - c) / (1000 * 60 * 60 * 24)
    })
    return {
      type: ft.replace(/_/g, " "),
      avgDays: times.length > 0 ? Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10 : 0,
      count: items.length,
    }
  })

  // Bottlenecks
  const pendingItems = reservations.filter(
    (r) => !completedStatuses.includes(r.status) && !["REJECTED", "CANCELLED", "NO_SHOW"].includes(r.status)
  )
  const bottleneckByStatus: Record<string, { count: number; avgWaitDays: number }> = {}
  pendingItems.forEach((item) => {
    const waitDays = (now.getTime() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    if (!bottleneckByStatus[item.status]) bottleneckByStatus[item.status] = { count: 0, avgWaitDays: 0 }
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

  const rejectedItems = reservations.filter((r) => ["REJECTED", "CANCELLED", "NO_SHOW"].includes(r.status))
  const completionRate = reservations.length > 0 ? Math.round((completedItems.length / reservations.length) * 100) : 0

  // Participants stats
  const totalParticipants = reservations.reduce((sum, r) => sum + (r.estimatedParticipants || 0), 0)
  const avgParticipants = reservations.length > 0 ? Math.round(totalParticipants / reservations.length) : 0

  const kpis = {
    totalReservations: reservations.length,
    completedReservations: completedItems.length,
    pendingReservations: pendingItems.length,
    rejectedReservations: rejectedItems.length,
    completionRate,
    avgProcessingDays: avgProcessingTime,
    totalRevenue,
    lguCount,
    privateCount,
    damagesCount,
    noShowCount,
    exemptedCount,
    avgParticipants,
    thisMonthRequests: reservations.filter((r) => getMonthKey(r.createdAt) === monthLabels[monthLabels.length - 1]).length,
    lastMonthRequests: reservations.filter((r) => monthLabels.length > 1 && getMonthKey(r.createdAt) === monthLabels[monthLabels.length - 2]).length,
  }

  return NextResponse.json({
    kpis,
    volumeTrends,
    statusDistribution,
    facilityTypeBreakdown,
    activityTypeBreakdown,
    revenueByMonth,
    processingByFacility,
    bottlenecks,
  })
}
