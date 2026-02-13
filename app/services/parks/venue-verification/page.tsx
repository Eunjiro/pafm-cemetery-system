"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"

interface VenueBooking {
  id: string
  applicantName: string
  organizationName: string | null
  eventType: string
  venueType: string
  desiredStartDate: string
  desiredEndDate: string
  estimatedAttendees: number
  contactPerson: string
  contactNumber: string
  status: string
  paymentStatus: string
  gatePassCode: string | null
  isLguSponsored: boolean
  isPriority: boolean
  createdAt: string
  user: { name: string; email: string }
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PENDING_REVIEW", label: "Pending Review" },
  { value: "AWAITING_REQUIREMENTS", label: "Awaiting Requirements" },
  { value: "AWAITING_PAYMENT", label: "Awaiting Payment" },
  { value: "PAYMENT_VERIFIED", label: "Payment Verified" },
  { value: "APPROVED", label: "Approved" },
  { value: "IN_USE", label: "In Use" },
  { value: "COMPLETED", label: "Completed" },
  { value: "NO_SHOW", label: "No Show" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
]

const venueLabels: Record<string, string> = {
  PICNIC_GROUND: "Picnic Ground",
  COVERED_COURT: "Covered Court",
  AMPHITHEATER: "Amphitheater",
  CAFETERIA: "Cafeteria",
  EVENT_HALL: "Event Hall",
  OTHER_VENUE: "Other Venue",
}

const statusColors: Record<string, string> = {
  PENDING_REVIEW: "bg-yellow-100 text-yellow-800",
  AWAITING_REQUIREMENTS: "bg-orange-100 text-orange-800",
  AWAITING_PAYMENT: "bg-orange-100 text-orange-800",
  PAYMENT_VERIFIED: "bg-indigo-100 text-indigo-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  IN_USE: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  NO_SHOW: "bg-red-100 text-red-800",
}

function VenueVerificationContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [bookings, setBookings] = useState<VenueBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "")
  const [venueFilter, setVenueFilter] = useState("")
  const dashboardUrl = session?.user?.role === "ADMIN" ? "/services/parks/admin-dashboard" : "/services/parks/employee-dashboard"

  useEffect(() => {
    fetchBookings()
  }, [statusFilter, venueFilter])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      if (venueFilter) params.set("venueType", venueFilter)
      const res = await fetch(`/api/parks/venue-booking?${params.toString()}`)
      const data = await res.json()
      setBookings(data.bookings || [])
    } catch (err) {
      console.error("Error fetching bookings:", err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-amber-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href={dashboardUrl} className="text-sm text-amber-100 hover:text-white mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold">Venue Booking Management</h1>
              <p className="text-amber-100 mt-1">Review and process venue rental applications</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500">
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Venue Type</label>
            <select value={venueFilter} onChange={(e) => setVenueFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500">
              <option value="">All Venues</option>
              {Object.entries(venueLabels).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={fetchBookings} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm">
              Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Venue Bookings ({bookings.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading...</div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-3">✓</div>
              <p className="text-gray-500">No venue bookings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venue</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendees</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filed</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{booking.applicantName}</div>
                        <div className="text-xs text-gray-500">{booking.contactNumber}</div>
                        {booking.isPriority && (
                          <span className="inline-flex px-1.5 py-0.5 text-xs font-bold rounded bg-red-100 text-red-700 mt-1">PRIORITY</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">{booking.eventType.replace(/_/g, " ")}</span>
                        {booking.isLguSponsored && (
                          <span className="block text-xs text-blue-600 font-medium mt-0.5">LGU Sponsored</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{venueLabels[booking.venueType] || booking.venueType}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{formatDate(booking.desiredStartDate)}</div>
                        <div className="text-xs text-gray-500">to {formatDate(booking.desiredEndDate)}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{booking.estimatedAttendees}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${statusColors[booking.status] || "bg-gray-100"}`}>
                          {booking.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(booking.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/services/parks/venue-verification/${booking.id}`}>
                          <button className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm">
                            Process
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VenueVerificationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>}>
      <VenueVerificationContent />
    </Suspense>
  )
}
