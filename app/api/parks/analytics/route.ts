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

  const [amenityReservations, venueBookings, maintenanceRequests] = await Promise.all([
    prisma.amenityReservation.findMany({
      select: {
        id: true,
        status: true,
        amenityType: true,
        numberOfGuests: true,
        paymentStatus: true,
        amountDue: true,
        amountPaid: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.venueBooking.findMany({
      select: {
        id: true,
        status: true,
        eventType: true,
        venueType: true,
        paymentStatus: true,
        amountDue: true,
        amountPaid: true,
        isLguSponsored: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.parkMaintenanceRequest.findMany({
      select: {
        id: true,
        status: true,
        issueCategory: true,
        urgencyLevel: true,
        repairScale: true,
        parkLocation: true,
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
    ...amenityReservations.map((r) => ({ ...r, serviceType: "Amenity" })),
    ...venueBookings.map((r) => ({ ...r, serviceType: "Venue" })),
    ...maintenanceRequests.map((r) => ({ ...r, serviceType: "Maintenance" })),
  ]

  // Volume Trends
  const volumeTrends = monthLabels.map((label) => {
    const monthItems = allItems.filter((item) => getMonthKey(item.createdAt) === label)
    return {
      month: label,
      Amenity: monthItems.filter((i) => i.serviceType === "Amenity").length,
      Venue: monthItems.filter((i) => i.serviceType === "Venue").length,
      Maintenance: monthItems.filter((i) => i.serviceType === "Maintenance").length,
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
    { type: "Amenity Reservations", count: amenityReservations.length, color: "#10b981" },
    { type: "Venue Bookings", count: venueBookings.length, color: "#3b82f6" },
    { type: "Maintenance Requests", count: maintenanceRequests.length, color: "#f59e0b" },
  ]

  // Amenity Type Breakdown
  const amenityByType: Record<string, number> = {}
  amenityReservations.forEach((r) => {
    const t = r.amenityType.replace(/_/g, " ")
    amenityByType[t] = (amenityByType[t] || 0) + 1
  })
  const amenityTypeBreakdown = Object.entries(amenityByType).map(([type, count]) => ({ type, count }))

  // Venue Type Breakdown
  const venueByType: Record<string, number> = {}
  venueBookings.forEach((r) => {
    const t = r.venueType.replace(/_/g, " ")
    venueByType[t] = (venueByType[t] || 0) + 1
  })
  const venueTypeBreakdown = Object.entries(venueByType).map(([type, count]) => ({ type, count }))

  // Event Type Breakdown
  const eventByType: Record<string, number> = {}
  venueBookings.forEach((r) => {
    const t = r.eventType.replace(/_/g, " ")
    eventByType[t] = (eventByType[t] || 0) + 1
  })
  const eventTypeBreakdown = Object.entries(eventByType).map(([type, count]) => ({ type, count }))

  // Maintenance Category Breakdown
  const maintenanceByCategory: Record<string, number> = {}
  maintenanceRequests.forEach((r) => {
    const t = r.issueCategory.replace(/_/g, " ")
    maintenanceByCategory[t] = (maintenanceByCategory[t] || 0) + 1
  })
  const maintenanceCategoryBreakdown = Object.entries(maintenanceByCategory).map(([type, count]) => ({ type, count }))

  // Maintenance by Location
  const maintenanceByLocation: Record<string, number> = {}
  maintenanceRequests.forEach((r) => {
    maintenanceByLocation[r.parkLocation] = (maintenanceByLocation[r.parkLocation] || 0) + 1
  })
  const locationBreakdown = Object.entries(maintenanceByLocation)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Urgency Distribution
  const urgencyCounts: Record<string, number> = {}
  maintenanceRequests.forEach((r) => {
    urgencyCounts[r.urgencyLevel] = (urgencyCounts[r.urgencyLevel] || 0) + 1
  })
  const urgencyDistribution = Object.entries(urgencyCounts).map(([urgency, count]) => ({ urgency, count }))

  // Revenue
  const amenityRevenue = amenityReservations.reduce((sum, r) => sum + (r.amountPaid || 0), 0)
  const venueRevenue = venueBookings.reduce((sum, r) => sum + (r.amountPaid || 0), 0)
  const totalRevenue = amenityRevenue + venueRevenue
  const lguCount = venueBookings.filter((r) => r.isLguSponsored).length

  const revenueByMonth = monthLabels.map((label) => {
    const monthAmenity = amenityReservations.filter((r) => getMonthKey(r.createdAt) === label).reduce((sum, r) => sum + (r.amountPaid || 0), 0)
    const monthVenue = venueBookings.filter((r) => getMonthKey(r.createdAt) === label).reduce((sum, r) => sum + (r.amountPaid || 0), 0)
    return { month: label, Amenity: monthAmenity, Venue: monthVenue, Total: monthAmenity + monthVenue }
  })

  // Processing Efficiency
  const completedStatuses = ["COMPLETED", "CHECKED_IN", "CLOSED"]
  const completedItems = allItems.filter((i) => completedStatuses.includes(i.status))
  const processingByType = ["Amenity", "Venue", "Maintenance"].map((type) => {
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

  const avgProcessingTime = completedItems.length > 0
    ? Math.round((completedItems.map((i) => (new Date(i.updatedAt).getTime() - new Date(i.createdAt).getTime()) / (1000 * 60 * 60 * 24)).reduce((a, b) => a + b, 0) / completedItems.length) * 10) / 10
    : 0

  // Bottlenecks
  const pendingItems = allItems.filter((i) => !completedStatuses.includes(i.status) && !["REJECTED", "CANCELLED"].includes(i.status))
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

  const rejectedItems = allItems.filter((i) => ["REJECTED", "CANCELLED"].includes(i.status))
  const completionRate = allItems.length > 0 ? Math.round((completedItems.length / allItems.length) * 100) : 0

  const kpis = {
    totalRequests: allItems.length,
    completedRequests: completedItems.length,
    pendingRequests: pendingItems.length,
    rejectedRequests: rejectedItems.length,
    completionRate,
    avgProcessingDays: avgProcessingTime,
    totalRevenue,
    lguCount,
    thisMonthRequests: allItems.filter((i) => getMonthKey(i.createdAt) === monthLabels[monthLabels.length - 1]).length,
    lastMonthRequests: allItems.filter((i) => monthLabels.length > 1 && getMonthKey(i.createdAt) === monthLabels[monthLabels.length - 2]).length,
  }

  return NextResponse.json({
    kpis,
    volumeTrends,
    statusDistribution,
    typeBreakdown,
    amenityTypeBreakdown,
    venueTypeBreakdown,
    eventTypeBreakdown,
    maintenanceCategoryBreakdown,
    locationBreakdown,
    urgencyDistribution,
    revenueByMonth,
    processingByType,
    bottlenecks,
  })
}
