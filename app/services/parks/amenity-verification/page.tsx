"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"

interface AmenityReservation {
  id: string
  requesterName: string
  contactNumber: string
  preferredDate: string
  preferredTime: string
  numberOfGuests: number
  amenityType: string
  status: string
  paymentStatus: string
  entryPassCode: string | null
  createdAt: string
  user: { name: string; email: string }
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PENDING_REVIEW", label: "Pending Review" },
  { value: "AWAITING_PAYMENT", label: "Awaiting Payment" },
  { value: "PAYMENT_VERIFIED", label: "Payment Verified" },
  { value: "APPROVED", label: "Approved" },
  { value: "CHECKED_IN", label: "Checked In" },
  { value: "COMPLETED", label: "Completed" },
  { value: "NO_SHOW", label: "No Show" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
]

const amenityLabels: Record<string, string> = {
  SWIMMING_ENTRANCE: "Swimming Entrance",
  COTTAGE: "Cottage",
  TABLE: "Table / Pavilion",
  ROOM: "Function Room",
  OTHER: "Other",
}

const statusColors: Record<string, string> = {
  PENDING_REVIEW: "bg-yellow-100 text-yellow-800",
  AWAITING_PAYMENT: "bg-orange-100 text-orange-800",
  PAYMENT_VERIFIED: "bg-indigo-100 text-indigo-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  CHECKED_IN: "bg-teal-100 text-teal-800",
  NO_SHOW: "bg-red-100 text-red-800",
  COMPLETED: "bg-green-100 text-green-800",
}

function AmenityVerificationContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [reservations, setReservations] = useState<AmenityReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "")
  const [amenityFilter, setAmenityFilter] = useState("")
  const dashboardUrl = session?.user?.role === "ADMIN" ? "/services/parks/admin-dashboard" : "/services/parks/employee-dashboard"

  useEffect(() => {
    fetchReservations()
  }, [statusFilter, amenityFilter])

  const fetchReservations = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      if (amenityFilter) params.set("amenityType", amenityFilter)
      const res = await fetch(`/api/parks/amenity-reservation?${params.toString()}`)
      const data = await res.json()
      setReservations(data.reservations || [])
    } catch (err) {
      console.error("Error fetching reservations:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-amber-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href={dashboardUrl} className="text-sm text-amber-100 hover:text-white mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold">Amenity Reservation Management</h1>
              <p className="text-amber-100 mt-1">Review and process water park amenity reservations</p>
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
            <label className="block text-xs font-medium text-gray-500 mb-1">Amenity Type</label>
            <select value={amenityFilter} onChange={(e) => setAmenityFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500">
              <option value="">All Types</option>
              {Object.entries(amenityLabels).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={fetchReservations} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm">
              Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Amenity Reservations ({reservations.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading...</div>
          ) : reservations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-3">✓</div>
              <p className="text-gray-500">No reservations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requester</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amenity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date / Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guests</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Filed</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reservations.map((res) => (
                    <tr key={res.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{res.requesterName}</div>
                        <div className="text-xs text-gray-500">{res.contactNumber}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">{amenityLabels[res.amenityType] || res.amenityType}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{new Date(res.preferredDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                        <div className="text-xs text-gray-500">{res.preferredTime}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{res.numberOfGuests}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                          res.paymentStatus === "PAID" || res.paymentStatus === "VERIFIED" ? "bg-green-100 text-green-800" :
                          res.paymentStatus === "AWAITING_PAYMENT" ? "bg-orange-100 text-orange-800" :
                          res.paymentStatus === "EXEMPTED" ? "bg-blue-100 text-blue-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {res.paymentStatus.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${statusColors[res.status] || "bg-gray-100"}`}>
                          {res.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(res.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/services/parks/amenity-verification/${res.id}`}>
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

export default function AmenityVerificationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>}>
      <AmenityVerificationContent />
    </Suspense>
  )
}
