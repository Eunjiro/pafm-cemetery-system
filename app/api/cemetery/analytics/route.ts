import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// Actual enum values from Prisma schema
const CEMETERY_COMPLETED = ["COMPLETED", "REGISTERED_FOR_PICKUP"]
const CEMETERY_PENDING = ["PENDING_VERIFICATION", "RETURNED_FOR_CORRECTION", "APPROVED_FOR_PAYMENT", "PAYMENT_SUBMITTED", "PAYMENT_CONFIRMED"]
const CEMETERY_REJECTED = ["REJECTED"]

export async function GET() {
  const session = await auth()
  if (!session || !["ADMIN", "EMPLOYEE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [deathRegs, burialPermits, exhumationPermits, cremationPermits, deathCertRequests] =
    await Promise.all([
      prisma.deathRegistration.findMany({ select: { id: true, status: true, createdAt: true, updatedAt: true } }),
      prisma.burialPermit.findMany({ select: { id: true, status: true, createdAt: true, updatedAt: true } }),
      prisma.exhumationPermit.findMany({ select: { id: true, status: true, createdAt: true, updatedAt: true } }),
      prisma.cremationPermit.findMany({ select: { id: true, status: true, createdAt: true, updatedAt: true } }),
      prisma.deathCertificateRequest.findMany({ select: { id: true, status: true, createdAt: true, updatedAt: true } }),
    ])

  const allRecords = [
    ...deathRegs.map((r) => ({ ...r, type: "Death Registration" })),
    ...burialPermits.map((r) => ({ ...r, type: "Burial Permit" })),
    ...exhumationPermits.map((r) => ({ ...r, type: "Exhumation Permit" })),
    ...cremationPermits.map((r) => ({ ...r, type: "Cremation Permit" })),
    ...deathCertRequests.map((r) => ({ ...r, type: "Death Certificate" })),
  ]

  const total = allRecords.length
  const completed = allRecords.filter((r) => CEMETERY_COMPLETED.includes(r.status)).length
  const pending = allRecords.filter((r) => CEMETERY_PENDING.includes(r.status)).length
  const rejected = allRecords.filter((r) => CEMETERY_REJECTED.includes(r.status)).length

  // Avg processing days (only completed records)
  const completedRecords = allRecords.filter((r) => CEMETERY_COMPLETED.includes(r.status))
  let avgProcessingDays = 0
  if (completedRecords.length > 0) {
    const totalDays = completedRecords.reduce((sum, r) => {
      return sum + (new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    }, 0)
    avgProcessingDays = Math.round((totalDays / completedRecords.length) * 10) / 10
  }

  // Type breakdown
  const typeBreakdown = [
    { type: "Death Registration", count: deathRegs.length },
    { type: "Burial Permit", count: burialPermits.length },
    { type: "Exhumation Permit", count: exhumationPermits.length },
    { type: "Cremation Permit", count: cremationPermits.length },
    { type: "Death Certificate", count: deathCertRequests.length },
  ]

  // Status distribution (merge similar statuses)
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

  // Bottlenecks - pending items with long wait times
  const pendingRecords = allRecords.filter((r) => CEMETERY_PENDING.includes(r.status))
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
    bottlenecks,
  })
}
