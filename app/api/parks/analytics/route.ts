import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// Actual enum values from Prisma schema
const AMENITY_COMPLETED = ["APPROVED", "COMPLETED", "CHECKED_IN"]
const AMENITY_PENDING = ["PENDING_REVIEW", "AWAITING_PAYMENT", "PAYMENT_VERIFIED"]
const AMENITY_REJECTED = ["REJECTED", "CANCELLED", "NO_SHOW"]

const VENUE_COMPLETED = ["APPROVED", "COMPLETED", "IN_USE"]
const VENUE_PENDING = ["PENDING_REVIEW", "AWAITING_REQUIREMENTS", "AWAITING_PAYMENT", "PAYMENT_VERIFIED"]
const VENUE_REJECTED = ["REJECTED", "CANCELLED", "NO_SHOW"]

const MAINT_COMPLETED = ["COMPLETED", "CLOSED"]
const MAINT_PENDING = ["LOGGED", "PENDING_INSPECTION", "UNDER_INSPECTION", "APPROVED_FOR_REPAIR", "PENDING_MATERIALS", "PENDING_CONTRACTOR", "IN_PROGRESS"]
const MAINT_REJECTED = ["REJECTED"]

export async function GET() {
  const session = await auth()
  if (!session || !["ADMIN", "EMPLOYEE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [amenityReservations, venueBookings, maintenanceRequests] = await Promise.all([
    prisma.amenityReservation.findMany({ select: { id: true, status: true, amenityType: true, createdAt: true, updatedAt: true } }),
    prisma.venueBooking.findMany({ select: { id: true, status: true, createdAt: true, updatedAt: true } }),
    prisma.parkMaintenanceRequest.findMany({ select: { id: true, status: true, parkLocation: true, createdAt: true, updatedAt: true } }),
  ])

  const allRecords = [
    ...amenityReservations.map((r) => ({ ...r, type: "Amenity Reservation", location: "", _completed: AMENITY_COMPLETED, _pending: AMENITY_PENDING, _rejected: AMENITY_REJECTED })),
    ...venueBookings.map((r) => ({ ...r, type: "Venue Booking", location: "", _completed: VENUE_COMPLETED, _pending: VENUE_PENDING, _rejected: VENUE_REJECTED })),
    ...maintenanceRequests.map((r) => ({ ...r, type: "Maintenance Request", location: r.parkLocation || "", _completed: MAINT_COMPLETED, _pending: MAINT_PENDING, _rejected: MAINT_REJECTED })),
  ]

  const total = allRecords.length
  const completed = allRecords.filter((r) => r._completed.includes(r.status)).length
  const pending = allRecords.filter((r) => r._pending.includes(r.status)).length
  const rejected = allRecords.filter((r) => r._rejected.includes(r.status)).length

  // Avg processing days
  const completedRecords = allRecords.filter((r) => r._completed.includes(r.status))
  let avgProcessingDays = 0
  if (completedRecords.length > 0) {
    const totalDays = completedRecords.reduce((sum, r) => {
      return sum + (new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    }, 0)
    avgProcessingDays = Math.round((totalDays / completedRecords.length) * 10) / 10
  }

  // Type breakdown
  const typeBreakdown = [
    { type: "Amenity Reservation", count: amenityReservations.length },
    { type: "Venue Booking", count: venueBookings.length },
    { type: "Maintenance Request", count: maintenanceRequests.length },
  ]

  // Status distribution
  const statusMap: Record<string, number> = {}
  allRecords.forEach((r) => {
    const label = r.status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
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

  // Top locations (from amenity reservations and maintenance requests)
  const locationMap: Record<string, number> = {}
  allRecords.forEach((r) => {
    const loc = (r.location || "").trim()
    if (loc) locationMap[loc] = (locationMap[loc] || 0) + 1
  })
  const topLocations = Object.entries(locationMap)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Bottlenecks
  const pendingRecords = allRecords.filter((r) => r._pending.includes(r.status))
  const bottleneckMap: Record<string, { count: number; totalDays: number }> = {}
  pendingRecords.forEach((r) => {
    const label = r.status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
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
    topLocations,
    bottlenecks,
  })
}
