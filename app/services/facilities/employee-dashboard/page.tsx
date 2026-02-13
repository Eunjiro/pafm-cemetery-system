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
  APPROVED: "Approved",
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

const ACTIVITY_LABELS: Record<string, string> = {
  MEETING: "Meeting",
  SEMINAR: "Seminar",
  SPORTS_EVENT: "Sports Event",
  OUTREACH: "Outreach",
  EXHIBIT: "Exhibit",
  TRAINING: "Training",
  WEDDING: "Wedding",
  ASSEMBLY: "Assembly",
  LGU_EVENT: "LGU Event",
  CULTURAL_EVENT: "Cultural Event",
  OTHER: "Other",
}

export default function FacilitiesEmployeeDashboard() {
  const { data: session, status } = useSession()
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [facilityFilter, setFacilityFilter] = useState("")
  const [selectedReservation, setSelectedReservation] = useState<any>(null)
  const [actionModal, setActionModal] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Action form state
  const [actionRemarks, setActionRemarks] = useState("")
  const [actionAmount, setActionAmount] = useState("")
  const [actionPaymentStatus, setActionPaymentStatus] = useState("")
  const [actionDamageDesc, setActionDamageDesc] = useState("")
  const [actionDamageBilling, setActionDamageBilling] = useState("")
  const [actionInspectionNotes, setActionInspectionNotes] = useState("")

  useEffect(() => {
    if (status === "authenticated") {
      fetchReservations()
      fetchNotifications()
    }
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.notifications-menu')) setShowNotifications(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [status])

  const fetchReservations = async () => {
    try {
      let url = "/api/facilities/reservation?"
      if (statusFilter) url += `status=${statusFilter}&`
      if (facilityFilter) url += `facilityType=${facilityFilter}&`
      const response = await fetch(url)
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

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) { console.error("Failed to fetch notifications:", error) }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' })
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        const deletedNotif = notifications.find(n => n.id === notificationId)
        if (deletedNotif && !deletedNotif.isRead) setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) { console.error("Failed to delete notification:", error) }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, { method: 'PATCH' })
      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) { console.error("Failed to mark notification as read:", error) }
  }

  useEffect(() => {
    if (status === "authenticated") {
      setLoading(true)
      fetchReservations()
    }
  }, [statusFilter, facilityFilter])

  const handleAction = async (reservationId: string, action: string) => {
    setProcessing(true)
    try {
      const body: any = { status: action, remarks: actionRemarks }

      if (action === "AWAITING_PAYMENT" && actionAmount) {
        body.amountDue = actionAmount
      }
      if (actionPaymentStatus) {
        body.paymentStatus = actionPaymentStatus
      }
      if (action === "COMPLETED_WITH_DAMAGES") {
        body.damageDescription = actionDamageDesc
        body.additionalBilling = actionDamageBilling
      }
      if (actionInspectionNotes) {
        body.inspectionNotes = actionInspectionNotes
      }

      const response = await fetch(`/api/facilities/reservation/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setActionModal(null)
        setSelectedReservation(null)
        resetActionForm()
        fetchReservations()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to process action")
      }
    } catch (error) {
      console.error("Action error:", error)
    } finally {
      setProcessing(false)
    }
  }

  const handlePaymentAction = async (reservationId: string, paymentAction: string) => {
    setProcessing(true)
    try {
      const body: any = { remarks: actionRemarks }
      
      if (paymentAction === "VERIFY_PAYMENT") {
        body.paymentStatus = "VERIFIED"
        body.status = "PAYMENT_VERIFIED"
      } else if (paymentAction === "MARK_PAID_MOCK") {
        body.paymentStatus = "PAID"
        body.paymentMethod = "MOCK_PAYMENT"
        body.status = "PAYMENT_VERIFIED"
      } else if (paymentAction === "EXEMPT") {
        body.paymentStatus = "EXEMPTED"
        body.isPaymentExempted = true
        body.status = "PAYMENT_VERIFIED"
      }

      const response = await fetch(`/api/facilities/reservation/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setActionModal(null)
        setSelectedReservation(null)
        resetActionForm()
        fetchReservations()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to process payment action")
      }
    } catch (error) {
      console.error("Payment action error:", error)
    } finally {
      setProcessing(false)
    }
  }

  const resetActionForm = () => {
    setActionRemarks("")
    setActionAmount("")
    setActionPaymentStatus("")
    setActionDamageDesc("")
    setActionDamageBilling("")
    setActionInspectionNotes("")
  }

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-xl">Loading...</div></div>
  }
  if (status === "unauthenticated") redirect("/login")

  const userRole = session?.user?.role || "USER"
  if (userRole !== "EMPLOYEE" && userRole !== "ADMIN") redirect("/services/facilities")

  const counts = {
    total: reservations.length,
    pending: reservations.filter(r => r.status === "PENDING_REVIEW").length,
    awaitingPayment: reservations.filter(r => ["AWAITING_PAYMENT", "AWAITING_REQUIREMENTS"].includes(r.status)).length,
    approved: reservations.filter(r => r.status === "APPROVED").length,
    inUse: reservations.filter(r => r.status === "IN_USE").length,
    completed: reservations.filter(r => ["COMPLETED", "COMPLETED_WITH_DAMAGES"].includes(r.status)).length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-orange-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/services" className="text-sm text-orange-100 hover:text-white mb-2 inline-block">← Back to Services</Link>
              <h1 className="text-3xl font-bold">Facility Management – Staff Dashboard</h1>
              <p className="text-orange-100 mt-1">Manage facility reservations, payments, and event operations</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <div className="relative notifications-menu">
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 text-orange-100 hover:text-white hover:bg-orange-700 rounded-full transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 max-h-96 overflow-y-auto z-50">
                    <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && <span className="text-xs text-gray-500">{unreadCount} unread</span>}
                    </div>
                    {notifications.length > 0 ? notifications.map((notif) => (
                      <div key={notif.id} className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-100 ${!notif.isRead ? 'bg-orange-50' : ''}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-2">
                            <p className="text-sm text-gray-900 font-medium">{notif.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            {!notif.isRead && (
                              <button onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id) }} className="p-1 text-orange-600 hover:text-orange-800 hover:bg-orange-100 rounded" title="Mark as read">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              </button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteNotification(notif.id) }} className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded" title="Delete">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="px-4 py-8 text-center text-gray-500 text-sm">No notifications yet</div>
                    )}
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">{session?.user?.name}</p>
                <p className="text-sm text-orange-200">Facility Booking Staff</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          {[
            { label: "Total", value: counts.total, color: "bg-gray-500" },
            { label: "Pending", value: counts.pending, color: "bg-yellow-500" },
            { label: "Awaiting", value: counts.awaitingPayment, color: "bg-blue-500" },
            { label: "Approved", value: counts.approved, color: "bg-green-500" },
            { label: "In Use", value: counts.inUse, color: "bg-purple-500" },
            { label: "Completed", value: counts.completed, color: "bg-emerald-500" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                <span className="text-sm text-gray-600">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-orange-500 text-sm"
            >
              <option value="">All Statuses</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-orange-500 text-sm"
            >
              <option value="">All Facilities</option>
              {Object.entries(FACILITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button onClick={() => { setStatusFilter(""); setFacilityFilter("") }} className="text-sm text-orange-600 hover:text-orange-800">Clear Filters</button>
          </div>
        </div>

        {/* Reservations List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading reservations...</div>
        ) : reservations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reservations Found</h3>
            <p className="text-gray-500">No facility reservations match the current filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((res) => (
              <div key={res.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{FACILITY_LABELS[res.facilityType] || res.facilityType}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[res.status] || "bg-gray-100 text-gray-800"}`}>
                        {STATUS_LABELS[res.status] || res.status}
                      </span>
                      {res.isPriority && <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Priority</span>}
                      {res.isLguEvent && <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">LGU</span>}
                      {res.isPaymentExempted && <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Exempted</span>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 mb-2">
                      <div><span className="font-medium">Applicant:</span> {res.applicantName}</div>
                      <div><span className="font-medium">Activity:</span> {ACTIVITY_LABELS[res.activityType] || res.activityType}</div>
                      <div><span className="font-medium">Contact:</span> {res.contactNumber}</div>
                      <div><span className="font-medium">Participants:</span> {res.estimatedParticipants}</div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                      <div><span className="font-medium">Start:</span> {new Date(res.desiredStartDate).toLocaleString()}</div>
                      <div><span className="font-medium">End:</span> {new Date(res.desiredEndDate).toLocaleString()}</div>
                      {res.organizationName && <div><span className="font-medium">Org:</span> {res.organizationName}</div>}
                      <div><span className="font-medium">User:</span> {res.user?.name || "N/A"}</div>
                    </div>
                    {res.gatePassCode && (
                      <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Gate Pass:</span> <span className="font-mono">{res.gatePassCode}</span></p>
                    )}
                    {res.amountDue && (
                      <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Amount:</span> ₱{res.amountDue?.toFixed(2)} | Payment: {res.paymentStatus?.replace(/_/g, ' ')}</p>
                    )}
                    {res.remarks && <p className="text-sm text-gray-500 mt-1 italic">Remarks: {res.remarks}</p>}
                    {(res.layoutFile || res.governmentPermit || res.barangayEndorsement) && (
                      <div className="flex gap-2 mt-2">
                        {res.layoutFile && <a href={`/${res.layoutFile}`} target="_blank" className="text-xs text-orange-600 hover:underline">📎 Layout</a>}
                        {res.governmentPermit && <a href={`/${res.governmentPermit}`} target="_blank" className="text-xs text-orange-600 hover:underline">📎 Permit</a>}
                        {res.barangayEndorsement && <a href={`/${res.barangayEndorsement}`} target="_blank" className="text-xs text-orange-600 hover:underline">📎 Endorsement</a>}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex flex-col gap-2">
                    <button
                      onClick={() => { setSelectedReservation(res); setActionModal("details") }}
                      className="px-3 py-1.5 text-sm bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
                    >
                      Process
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionModal && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {actionModal === "details" ? "Process Reservation" : 
                   actionModal === "payment" ? "Payment Processing" :
                   actionModal === "inspection" ? "Post-Event Inspection" : "Action"}
                </h2>
                <button onClick={() => { setActionModal(null); setSelectedReservation(null); resetActionForm() }} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Reservation Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{FACILITY_LABELS[selectedReservation.facilityType]} – {ACTIVITY_LABELS[selectedReservation.activityType]}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>Applicant: {selectedReservation.applicantName}</div>
                  <div>Contact: {selectedReservation.contactNumber}</div>
                  <div>Start: {new Date(selectedReservation.desiredStartDate).toLocaleString()}</div>
                  <div>End: {new Date(selectedReservation.desiredEndDate).toLocaleString()}</div>
                  <div>Participants: {selectedReservation.estimatedParticipants}</div>
                  <div>Status: {STATUS_LABELS[selectedReservation.status]}</div>
                </div>
              </div>

              {actionModal === "details" && (
                <>
                  {/* Status Actions */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedReservation.status === "PENDING_REVIEW" && (
                        <>
                          <button onClick={() => setActionModal("payment")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                            Issue Order of Payment
                          </button>
                          <button onClick={() => handleAction(selectedReservation.id, "AWAITING_REQUIREMENTS")} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm" disabled={processing}>
                            Request Requirements
                          </button>
                          <button onClick={() => handleAction(selectedReservation.id, "APPROVED")} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm" disabled={processing}>
                            Approve Directly
                          </button>
                          <button onClick={() => handleAction(selectedReservation.id, "REJECTED")} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm" disabled={processing}>
                            Reject
                          </button>
                        </>
                      )}
                      {selectedReservation.status === "AWAITING_REQUIREMENTS" && (
                        <>
                          <button onClick={() => setActionModal("payment")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                            Issue Order of Payment
                          </button>
                          <button onClick={() => handleAction(selectedReservation.id, "APPROVED")} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm" disabled={processing}>
                            Approve
                          </button>
                          <button onClick={() => handleAction(selectedReservation.id, "REJECTED")} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm" disabled={processing}>
                            Reject
                          </button>
                        </>
                      )}
                      {selectedReservation.status === "AWAITING_PAYMENT" && (
                        <>
                          <button onClick={() => setActionModal("payment")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                            Process Payment
                          </button>
                        </>
                      )}
                      {selectedReservation.status === "PAYMENT_VERIFIED" && (
                        <>
                          <button onClick={() => handleAction(selectedReservation.id, "APPROVED")} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm" disabled={processing}>
                            Approve – Confirm Booking
                          </button>
                          <button onClick={() => handleAction(selectedReservation.id, "REJECTED")} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm" disabled={processing}>
                            Reject
                          </button>
                        </>
                      )}
                      {selectedReservation.status === "APPROVED" && (
                        <>
                          <button onClick={() => handleAction(selectedReservation.id, "IN_USE")} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm" disabled={processing}>
                            Mark In Use (Event Started)
                          </button>
                          <button onClick={() => handleAction(selectedReservation.id, "NO_SHOW")} className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm" disabled={processing}>
                            Mark No-Show
                          </button>
                          <button onClick={() => handleAction(selectedReservation.id, "CANCELLED")} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm" disabled={processing}>
                            Cancel (Staff)
                          </button>
                        </>
                      )}
                      {selectedReservation.status === "IN_USE" && (
                        <>
                          <button onClick={() => handleAction(selectedReservation.id, "COMPLETED")} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm" disabled={processing}>
                            Complete – No Issues
                          </button>
                          <button onClick={() => setActionModal("inspection")} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm">
                            Complete – With Damages
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks / Notes</label>
                    <textarea
                      value={actionRemarks}
                      onChange={(e) => setActionRemarks(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-orange-500"
                      placeholder="Add processing remarks..."
                    />
                  </div>

                  {/* Mark LGU / Priority toggles */}
                  {["PENDING_REVIEW", "AWAITING_REQUIREMENTS"].includes(selectedReservation.status) && (
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          fetch(`/api/facilities/reservation/${selectedReservation.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ isPriority: !selectedReservation.isPriority })
                          }).then(() => fetchReservations())
                        }}
                        className={`px-3 py-1.5 text-xs rounded-lg border ${selectedReservation.isPriority ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : 'bg-white border-gray-300 text-gray-600'}`}
                      >
                        {selectedReservation.isPriority ? '★ Priority' : '☆ Mark Priority'}
                      </button>
                      <button
                        onClick={() => {
                          fetch(`/api/facilities/reservation/${selectedReservation.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ isLguEvent: !selectedReservation.isLguEvent })
                          }).then(() => fetchReservations())
                        }}
                        className={`px-3 py-1.5 text-xs rounded-lg border ${selectedReservation.isLguEvent ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-gray-300 text-gray-600'}`}
                      >
                        {selectedReservation.isLguEvent ? '🏛️ LGU Event' : 'Mark LGU Event'}
                      </button>
                    </div>
                  )}
                </>
              )}

              {actionModal === "payment" && (
                <>
                  <h3 className="font-semibold text-gray-900">Mock Payment Processing</h3>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-blue-800 mb-3">Issue Order of Payment and process mock payment for testing.</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount Due (₱)</label>
                        <input
                          type="number"
                          value={actionAmount}
                          onChange={(e) => setActionAmount(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
                          placeholder="Enter amount..."
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <button
                          onClick={() => handlePaymentAction(selectedReservation.id, "MARK_PAID_MOCK")}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          disabled={processing}
                        >
                          {processing ? "Processing..." : "Mark as Paid (Mock)"}
                        </button>
                        <button
                          onClick={() => handlePaymentAction(selectedReservation.id, "VERIFY_PAYMENT")}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                          disabled={processing}
                        >
                          Paid / Verified
                        </button>
                        <button
                          onClick={() => handlePaymentAction(selectedReservation.id, "EXEMPT")}
                          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm"
                          disabled={processing}
                        >
                          Exempted / Waived
                        </button>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                        <input
                          type="text"
                          value={actionRemarks}
                          onChange={(e) => setActionRemarks(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
                          placeholder="Payment notes..."
                        />
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setActionModal("details")} className="text-sm text-gray-500 hover:text-gray-700">← Back to Actions</button>
                </>
              )}

              {actionModal === "inspection" && (
                <>
                  <h3 className="font-semibold text-gray-900">Post-Event Inspection</h3>
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Notes</label>
                      <textarea
                        value={actionInspectionNotes}
                        onChange={(e) => setActionInspectionNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
                        placeholder="Describe findings..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Damage Description</label>
                      <textarea
                        value={actionDamageDesc}
                        onChange={(e) => setActionDamageDesc(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
                        placeholder="Describe damages or violations..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Additional Billing (₱)</label>
                      <input
                        type="number"
                        value={actionDamageBilling}
                        onChange={(e) => setActionDamageBilling(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
                        placeholder="Amount for damage assessment..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                      <input
                        type="text"
                        value={actionRemarks}
                        onChange={(e) => setActionRemarks(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
                        placeholder="Additional remarks..."
                      />
                    </div>
                    <button
                      onClick={() => handleAction(selectedReservation.id, "COMPLETED_WITH_DAMAGES")}
                      className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm"
                      disabled={processing}
                    >
                      {processing ? "Processing..." : "Complete – With Damages (Forward for Assessment)"}
                    </button>
                  </div>
                  <button onClick={() => setActionModal("details")} className="text-sm text-gray-500 hover:text-gray-700">← Back to Actions</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
