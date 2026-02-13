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
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [
    deathRegs,
    burialPermits,
    exhumationPermits,
    cremationPermits,
    deathCertRequests,
    transactions,
  ] = await Promise.all([
    prisma.deathRegistration.findMany({
      select: {
        id: true,
        status: true,
        registrationType: true,
        registrationFee: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.burialPermit.findMany({
      select: {
        id: true,
        status: true,
        burialType: true,
        totalFee: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.exhumationPermit.findMany({
      select: {
        id: true,
        status: true,
        permitFee: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.cremationPermit.findMany({
      select: {
        id: true,
        status: true,
        permitFee: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.deathCertificateRequest.findMany({
      select: {
        id: true,
        status: true,
        totalFee: true,
        numberOfCopies: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.transaction.findMany({
      where: {
        entityType: {
          in: [
            "DeathRegistration",
            "BurialPermit",
            "ExhumationPermit",
            "CremationPermit",
            "DeathCertificateRequest",
          ],
        },
      },
      select: {
        id: true,
        amount: true,
        status: true,
        entityType: true,
        paymentMethod: true,
        createdAt: true,
      },
    }),
  ])

  // --- Volume Trends (last 6 months) ---
  const monthLabels: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthLabels.push(d.toLocaleString("default", { month: "short", year: "2-digit" }))
  }

  const getMonthKey = (date: Date) =>
    new Date(date).toLocaleString("default", { month: "short", year: "2-digit" })

  const allItems = [
    ...deathRegs.map((r) => ({ ...r, type: "Death Registration" })),
    ...burialPermits.map((r) => ({ ...r, type: "Burial Permit" })),
    ...exhumationPermits.map((r) => ({ ...r, type: "Exhumation Permit" })),
    ...cremationPermits.map((r) => ({ ...r, type: "Cremation Permit" })),
    ...deathCertRequests.map((r) => ({ ...r, type: "Death Certificate" })),
  ]

  const volumeTrends = monthLabels.map((label) => {
    const monthItems = allItems.filter((item) => getMonthKey(item.createdAt) === label)
    return {
      month: label,
      "Death Registration": monthItems.filter((i) => i.type === "Death Registration").length,
      "Burial Permit": monthItems.filter((i) => i.type === "Burial Permit").length,
      "Exhumation Permit": monthItems.filter((i) => i.type === "Exhumation Permit").length,
      "Cremation Permit": monthItems.filter((i) => i.type === "Cremation Permit").length,
      "Death Certificate": monthItems.filter((i) => i.type === "Death Certificate").length,
      Total: monthItems.length,
    }
  })

  // --- Status Distribution ---
  const statusCounts: Record<string, number> = {}
  allItems.forEach((item) => {
    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1
  })
  const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
    status: status.replace(/_/g, " "),
    count,
    percentage: Math.round((count / allItems.length) * 100),
  }))

  // --- Type Breakdown ---
  const typeBreakdown = [
    { type: "Death Registration", count: deathRegs.length, color: "#10b981" },
    { type: "Burial Permit", count: burialPermits.length, color: "#3b82f6" },
    { type: "Exhumation Permit", count: exhumationPermits.length, color: "#f59e0b" },
    { type: "Cremation Permit", count: cremationPermits.length, color: "#ef4444" },
    { type: "Death Certificate", count: deathCertRequests.length, color: "#8b5cf6" },
  ]

  // --- Processing Efficiency ---
  const completedItems = allItems.filter((item) =>
    ["COMPLETED", "REGISTERED_FOR_PICKUP"].includes(item.status)
  )
  const processingTimes = completedItems.map((item) => {
    const created = new Date(item.createdAt).getTime()
    const updated = new Date(item.updatedAt).getTime()
    return (updated - created) / (1000 * 60 * 60 * 24) // days
  })
  const avgProcessingTime =
    processingTimes.length > 0
      ? Math.round((processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length) * 10) / 10
      : 0

  const processingByType = [
    "Death Registration",
    "Burial Permit",
    "Exhumation Permit",
    "Cremation Permit",
    "Death Certificate",
  ].map((type) => {
    const items = completedItems.filter((i) => i.type === type)
    const times = items.map((i) => {
      const c = new Date(i.createdAt).getTime()
      const u = new Date(i.updatedAt).getTime()
      return (u - c) / (1000 * 60 * 60 * 24)
    })
    return {
      type,
      avgDays:
        times.length > 0
          ? Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10
          : 0,
      count: items.length,
    }
  })

  // --- Completion Rates ---
  const completionRate = allItems.length > 0
    ? Math.round((completedItems.length / allItems.length) * 100)
    : 0
  const rejectedItems = allItems.filter((i) => i.status === "REJECTED")
  const rejectionRate = allItems.length > 0
    ? Math.round((rejectedItems.length / allItems.length) * 100)
    : 0

  // --- Bottlenecks ---
  const pendingItems = allItems.filter((item) =>
    !["COMPLETED", "REGISTERED_FOR_PICKUP", "REJECTED"].includes(item.status)
  )
  const bottleneckByStatus: Record<string, { count: number; avgWaitDays: number }> = {}
  pendingItems.forEach((item) => {
    const waitDays =
      (now.getTime() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24)
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

  // --- Revenue ---
  const totalRevenue = transactions
    .filter((t) => t.status === "CONFIRMED")
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const revenueByMonth = monthLabels.map((label) => {
    const monthTx = transactions.filter(
      (t) => t.status === "CONFIRMED" && getMonthKey(t.createdAt) === label
    )
    return {
      month: label,
      revenue: monthTx.reduce((sum, t) => sum + (t.amount || 0), 0),
    }
  })

  // --- Registration Type Breakdown ---
  const regularCount = deathRegs.filter((r) => r.registrationType === "REGULAR").length
  const delayedCount = deathRegs.filter((r) => r.registrationType === "DELAYED").length

  // --- KPI Summary ---
  const kpis = {
    totalRequests: allItems.length,
    completedRequests: completedItems.length,
    pendingRequests: pendingItems.length,
    rejectedRequests: rejectedItems.length,
    completionRate,
    rejectionRate,
    avgProcessingDays: avgProcessingTime,
    totalRevenue,
    thisMonthRequests: allItems.filter(
      (i) => getMonthKey(i.createdAt) === monthLabels[monthLabels.length - 1]
    ).length,
    lastMonthRequests: allItems.filter(
      (i) => monthLabels.length > 1 && getMonthKey(i.createdAt) === monthLabels[monthLabels.length - 2]
    ).length,
  }

  return NextResponse.json({
    kpis,
    volumeTrends,
    statusDistribution,
    typeBreakdown,
    processingByType,
    bottlenecks,
    revenueByMonth,
    registrationTypes: { regular: regularCount, delayed: delayedCount },
  })
}
