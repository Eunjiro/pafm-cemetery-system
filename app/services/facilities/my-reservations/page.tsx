"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"

const STATUS_COLORS: Record<string, string> = {
  PENDING_REVIEW: "bg-yellow-100 text-yellow-800",
  AWAITING_REQUIREMENTS: "bg-orange-100 text-orange-800",
  AWAITING_PAYMENT: "bg-blue-100 text-blue-800",
  PAYMENT_VERIFIED: "bg-indigo-100 text-indigo-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  IN_USE: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  COMPLETED_WITH_DAMAGES: "bg-amber-100 text-amber-800",
  NO_SHOW: "bg-rose-100 text-rose-800",
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: "Pending Review",
  AWAITING_REQUIREMENTS: "Awaiting Requirements",
  AWAITING_PAYMENT: "Awaiting Payment",
  PAYMENT_VERIFIED: "Payment Verified",
  APPROVED: "Approved – Booking Confirmed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  IN_USE: "In Use",
  COMPLETED: "Completed",
  COMPLETED_WITH_DAMAGES: "Completed – With Damages",
  NO_SHOW: "No-Show",
}

const FACILITY_LABELS: Record<string, string> = {
  CONFERENCE_HALL: "Conference Hall",
  GYMNASIUM: "Gymnasium",
  TRAINING_ROOM: "Training Room",
  AUDITORIUM: "Auditorium",
  CULTURAL_CENTER: "Cultural Center",
  MULTIPURPOSE_HALL: "Multipurpose Hall",
  COVERED_COURT: "Covered Court",
  OTHER_FACILITY: "Other Facility",
}

export default function MyReservationsPage() {
  const { data: session, status } = useSession()
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    if (status === "authenticated") {
      fetchReservations()
    }
  }, [status])

  const fetchReservations = async () => {
    try {
      const response = await fetch("/api/facilities/reservation")
      if (response.ok) {
        const data = await response.json()
        setReservations(data.reservations || [])
      }
    } catch (error) {
      console.error("Failed to fetch reservations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) return
    setCancellingId(id)
    try {
      const response = await fetch(`/api/facilities/reservation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      })
      if (response.ok) {
        fetchReservations()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to cancel")
      }
    } catch (error) {
      console.error("Cancel error:", error)
    } finally {
      setCancellingId(null)
    }
  }

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-xl">Loading...</div></div>
  }
  if (status === "unauthenticated") redirect("/login")

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-orange-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/services/facilities/user-dashboard" className="text-sm text-orange-100 hover:text-white mb-2 inline-block">← Back to Facility Management</Link>
          <h1 className="text-3xl font-bold">My Reservations</h1>
          <p className="text-orange-100 mt-1">Track your facility reservation requests and their status</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {reservations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reservations Yet</h3>
            <p className="text-gray-500 mb-4">You haven&apos;t made any facility reservations.</p>
            <Link href="/services/facilities/reserve" className="inline-block px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
              Make a Reservation
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((res) => (
              <div key={res.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{FACILITY_LABELS[res.facilityType] || res.facilityType}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[res.status] || "bg-gray-100 text-gray-800"}`}>
                        {STATUS_LABELS[res.status] || res.status}
                      </span>
                      {res.isPriority && <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Priority</span>}
                      {res.isLguEvent && <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">LGU Event</span>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Activity:</span> {res.activityType?.replace(/_/g, ' ')}
                      </div>
                      <div>
                        <span className="font-medium">Participants:</span> {res.estimatedParticipants}
                      </div>
                      <div>
                        <span className="font-medium">Start:</span> {new Date(res.desiredStartDate).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">End:</span> {new Date(res.desiredEndDate).toLocaleString()}
                      </div>
                    </div>
                    {res.organizationName && (
                      <p className="text-sm text-gray-500 mt-1">Organization: {res.organizationName}</p>
                    )}
                    {res.gatePassCode && res.status === "APPROVED" && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm font-semibold text-green-800">Gate Pass / Access Code: <span className="font-mono text-lg">{res.gatePassCode}</span></p>
                      </div>
                    )}
                    {res.remarks && (
                      <p className="text-sm text-gray-500 mt-2 italic">Staff remarks: {res.remarks}</p>
                    )}
                    {res.amountDue && (
                      <p className="text-sm text-gray-600 mt-1">Amount Due: ₱{res.amountDue?.toFixed(2)} | Payment: {res.paymentStatus?.replace(/_/g, ' ')}</p>
                    )}
                    {res.hasDamages && (
                      <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200">
                        <p className="text-sm text-amber-800">Damages reported: {res.damageDescription}</p>
                        {res.additionalBilling && <p className="text-sm text-amber-800">Additional billing: ₱{res.additionalBilling?.toFixed(2)}</p>}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">Submitted: {new Date(res.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="ml-4">
                    {["PENDING_REVIEW", "AWAITING_PAYMENT", "AWAITING_REQUIREMENTS"].includes(res.status) && (
                      <button
                        onClick={() => handleCancel(res.id)}
                        disabled={cancellingId === res.id}
                        className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        {cancellingId === res.id ? "Cancelling..." : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
