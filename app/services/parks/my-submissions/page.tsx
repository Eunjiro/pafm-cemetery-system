"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

const statusColors: Record<string, string> = {
  // Amenity Reservation
  PENDING_REVIEW: "bg-yellow-100 text-yellow-800",
  AWAITING_PAYMENT: "bg-orange-100 text-orange-800",
  PAYMENT_VERIFIED: "bg-indigo-100 text-indigo-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  CHECKED_IN: "bg-teal-100 text-teal-800",
  NO_SHOW: "bg-red-100 text-red-800",
  COMPLETED: "bg-green-100 text-green-800",
  // Venue Booking
  AWAITING_REQUIREMENTS: "bg-orange-100 text-orange-800",
  IN_USE: "bg-blue-100 text-blue-800",
  // Maintenance
  LOGGED: "bg-yellow-100 text-yellow-800",
  PENDING_INSPECTION: "bg-yellow-100 text-yellow-800",
  UNDER_INSPECTION: "bg-blue-100 text-blue-800",
  APPROVED_FOR_REPAIR: "bg-purple-100 text-purple-800",
  PENDING_MATERIALS: "bg-orange-100 text-orange-800",
  PENDING_CONTRACTOR: "bg-orange-100 text-orange-800",
  IN_PROGRESS: "bg-teal-100 text-teal-800",
  CLOSED: "bg-gray-100 text-gray-800",
}

const amenityTypeLabels: Record<string, string> = {
  SWIMMING_ENTRANCE: "Swimming Entrance",
  COTTAGE: "Cottage",
  TABLE: "Table / Pavilion",
  ROOM: "Function Room",
  OTHER: "Other",
}

const categoryLabels: Record<string, string> = {
  DAMAGED_BENCH: "Damaged Bench",
  FALLEN_TREE: "Fallen Tree",
  PLAYGROUND_EQUIPMENT: "Playground Equipment",
  VANDALISM: "Vandalism",
  LIGHTING: "Lighting Issue",
  CLEANLINESS: "Cleanliness / Sanitation",
  PATHWAY: "Pathway / Walkway Damage",
  FENCING: "Fencing / Barrier",
  IRRIGATION: "Irrigation / Sprinkler",
  OTHER: "Other",
}

export default function ParksMySubmissionsPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [reservations, setReservations] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [maintenanceReqs, setMaintenanceReqs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("amenity")

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchAll()
    }
  }, [authStatus])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [resRes, bookRes, maintRes] = await Promise.all([
        fetch("/api/parks/amenity-reservation"),
        fetch("/api/parks/venue-booking"),
        fetch("/api/parks/maintenance-request"),
      ])

      if (resRes.ok) {
        const data = await resRes.json()
        setReservations(data.reservations || [])
      }
      if (bookRes.ok) {
        const data = await bookRes.json()
        setBookings(data.bookings || [])
      }
      if (maintRes.ok) {
        const data = await maintRes.json()
        setMaintenanceReqs(data.requests || [])
      }
    } catch (error) {
      console.error("Failed to fetch submissions:", error)
    } finally {
      setLoading(false)
    }
  }

  if (authStatus === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-xl">Loading...</div></div>
  }

  if (authStatus === "unauthenticated") {
    router.push("/login")
    return null
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  const formatStatus = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())

  const tabs = [
    { key: "amenity", label: "Amenity Reservations", count: reservations.length },
    { key: "venue", label: "Venue Bookings", count: bookings.length },
    { key: "maintenance", label: "Maintenance Reports", count: maintenanceReqs.length },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-amber-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/services/parks/user-dashboard" className="text-sm text-amber-100 hover:text-white mb-2 inline-block">← Back to Parks & Recreation</Link>
          <h1 className="text-3xl font-bold">My Submissions</h1>
          <p className="text-amber-100 mt-1">Track your Parks & Recreation service requests</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-200 rounded-lg p-1">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Amenity Reservations Tab */}
        {activeTab === "amenity" && (
          <div className="space-y-4">
            {reservations.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">No amenity reservations yet</div>
            ) : reservations.map(res => (
              <Link key={res.id} href={`/services/parks/amenity-verification/${res.id}`}>
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer mb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{amenityTypeLabels[res.amenityType] || res.amenityType}</h3>
                      <p className="text-sm text-gray-600 mt-1">Date: {formatDate(res.preferredDate)} — {res.preferredTime}</p>
                      <p className="text-sm text-gray-500">{res.numberOfGuests} guest(s)</p>
                      {res.entryPassCode && (
                        <p className="text-xs text-green-600 font-mono mt-1">Entry Pass: {res.entryPassCode}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">Submitted: {formatDate(res.createdAt)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[res.status] || 'bg-gray-100 text-gray-800'}`}>
                      {formatStatus(res.status)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Venue Bookings Tab */}
        {activeTab === "venue" && (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">No venue bookings yet</div>
            ) : bookings.map(booking => (
              <Link key={booking.id} href={`/services/parks/venue-verification/${booking.id}`}>
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer mb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{booking.eventType.replace(/_/g, " ")} — {booking.venueType.replace(/_/g, " ")}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(booking.desiredStartDate)} → {formatDate(booking.desiredEndDate)}
                      </p>
                      <p className="text-sm text-gray-500">{booking.estimatedAttendees} attendees</p>
                      {booking.gatePassCode && (
                        <p className="text-xs text-green-600 font-mono mt-1">Gate Pass: {booking.gatePassCode}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">Submitted: {formatDate(booking.createdAt)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[booking.status] || 'bg-gray-100 text-gray-800'}`}>
                      {formatStatus(booking.status)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Maintenance Reports Tab */}
        {activeTab === "maintenance" && (
          <div className="space-y-4">
            {maintenanceReqs.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">No maintenance reports yet</div>
            ) : maintenanceReqs.map(req => (
              <Link key={req.id} href={`/services/parks/maintenance-verification/${req.id}`}>
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer mb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{categoryLabels[req.issueCategory] || req.issueCategory}</h3>
                      <p className="text-sm text-gray-600 mt-1">{req.parkLocation}</p>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{req.description}</p>
                      <p className="text-xs text-gray-400 mt-1">Submitted: {formatDate(req.createdAt)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[req.status] || 'bg-gray-100 text-gray-800'}`}>
                      {formatStatus(req.status)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
