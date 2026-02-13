import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session || !["ADMIN", "EMPLOYEE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const reservations = await prisma.facilityReservation.findMany({
    select: {
      id: true, status: true, facilityType: true,
      createdAt: true, updatedAt: true,
    },
  })

  const total = reservations.length
  const completed = reservations.filter((r) => ["APPROVED", "COMPLETED", "CONFIRMED"].includes(r.status)).length
  const pending = reservations.filter((r) => ["PENDING", "UNDER_REVIEW", "PROCESSING"].includes(r.status)).length
  const rejected = reservations.filter((r) => ["REJECTED", "DENIED", "CANCELLED"].includes(r.status)).length

  // Avg processing days
  const completedRecords = reservations.filter((r) => ["APPROVED", "COMPLETED", "CONFIRMED"].includes(r.status))
  let avgProcessingDays = 0
  if (completedRecords.length > 0) {
    const totalDays = completedRecords.reduce((sum, r) => {
      return sum + (new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    }, 0)
    avgProcessingDays = Math.round((totalDays / completedRecords.length) * 10) / 10
  }

  // Facility type breakdown
  const typeMap: Record<string, number> = {}
  reservations.forEach((r) => {
    const t = (r.facilityType || "Other").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    typeMap[t] = (typeMap[t] || 0) + 1
  })
  const facilityTypeBreakdown = Object.entries(typeMap)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)

  // Status distribution
  const statusMap: Record<string, number> = {}
  reservations.forEach((r) => {
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
    const count = reservations.filter((r) => {
      const created = new Date(r.createdAt)
      return created >= d && created <= monthEnd
    }).length
    volumeTrends.push({ month: label, count })
  }

  // Bottlenecks
  const pendingRecords = reservations.filter((r) =>
    ["PENDING", "UNDER_REVIEW", "PROCESSING", "PAYMENT_PENDING"].includes(r.status)
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
      totalReservations: total,
      completedReservations: completed,
      pendingReservations: pending,
      rejectedReservations: rejected,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgProcessingDays,
    },
    facilityTypeBreakdown,
    statusDistribution,
    volumeTrends,
    bottlenecks,
  })
}
