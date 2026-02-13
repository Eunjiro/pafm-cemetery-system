"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useDialog } from "@/app/components/DialogProvider"

interface VenueBooking {
  id: string
  applicantName: string
  organizationName: string | null
  eventType: string
  eventTypeOther: string | null
  venueType: string
  venueDetails: string | null
  desiredStartDate: string
  desiredEndDate: string
  estimatedAttendees: number
  layoutFile: string | null
  contactPerson: string
  contactNumber: string
  governmentPermit: string | null
  barangayEndorsement: string | null
  paymentStatus: string
  paymentMethod: string | null
  paymentReference: string | null
  paymentProof: string | null
  amountDue: number | null
  amountPaid: number | null
  exemptionMemo: string | null
  status: string
  remarks: string | null
  processedBy: string | null
  processedAt: string | null
  gatePassCode: string | null
  gatePassUsed: boolean
  venueStatus: string | null
  markedCompletedAt: string | null
  noShow: boolean
  holdExpiresAt: string | null
  autoCancelled: boolean
  isLguSponsored: boolean
  isPriority: boolean
  createdAt: string
  user: { name: string; email: string }
}

const statusFlow = [
  "PENDING_REVIEW",
  "AWAITING_REQUIREMENTS",
  "AWAITING_PAYMENT",
  "PAYMENT_VERIFIED",
  "APPROVED",
  "IN_USE",
  "COMPLETED",
]

const statusColors: Record<string, string> = {
  PENDING_REVIEW: "bg-yellow-100 text-yellow-800 border-yellow-300",
  AWAITING_REQUIREMENTS: "bg-orange-100 text-orange-800 border-orange-300",
  AWAITING_PAYMENT: "bg-orange-100 text-orange-800 border-orange-300",
  PAYMENT_VERIFIED: "bg-indigo-100 text-indigo-800 border-indigo-300",
  APPROVED: "bg-green-100 text-green-800 border-green-300",
  REJECTED: "bg-red-100 text-red-800 border-red-300",
  CANCELLED: "bg-gray-100 text-gray-800 border-gray-300",
  IN_USE: "bg-blue-100 text-blue-800 border-blue-300",
  COMPLETED: "bg-green-100 text-green-800 border-green-300",
  NO_SHOW: "bg-red-100 text-red-800 border-red-300",
}

const venueLabels: Record<string, string> = {
  PICNIC_GROUND: "Picnic Ground",
  COVERED_COURT: "Covered Court",
  AMPHITHEATER: "Amphitheater",
  CAFETERIA: "Cafeteria",
  EVENT_HALL: "Event Hall",
  OTHER_VENUE: "Other Venue",
}

export default function VenueVerificationDetailPage() {
  const { id } = useParams()
  const [booking, setBooking] = useState<VenueBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const dialog = useDialog()

  // Form state
  const [status, setStatus] = useState("")
  const [remarks, setRemarks] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [amountDue, setAmountDue] = useState("")
  const [amountPaid, setAmountPaid] = useState("")
  const [venueStatus, setVenueStatus] = useState("")
  const [generateGatePass, setGenerateGatePass] = useState(false)

  useEffect(() => {
    fetchBooking()
  }, [id])

  const fetchBooking = async () => {
    try {
      const res = await fetch(`/api/parks/venue-booking/${id}`)
      const data = await res.json()
      if (data.booking) {
        setBooking(data.booking)
        setStatus(data.booking.status)
        setRemarks(data.booking.remarks || "")
        setPaymentStatus(data.booking.paymentStatus)
        setPaymentMethod(data.booking.paymentMethod || "")
        setAmountDue(data.booking.amountDue?.toString() || "")
        setAmountPaid(data.booking.amountPaid?.toString() || "")
        setVenueStatus(data.booking.venueStatus || "")
      }
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!(await dialog.confirm("Are you sure you want to update this venue booking?"))) return
    setSaving(true)
    try {
      const body: any = { status, remarks, paymentStatus, paymentMethod }
      if (amountDue) body.amountDue = parseFloat(amountDue)
      if (amountPaid) body.amountPaid = parseFloat(amountPaid)
      if (venueStatus) body.venueStatus = venueStatus
      if (generateGatePass) body.generateGatePass = true

      const res = await fetch(`/api/parks/venue-booking/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        await dialog.success("Venue booking updated successfully!")
        setGenerateGatePass(false)
        fetchBooking()
      } else {
        const data = await res.json()
        await dialog.error(data.error || "Update failed")
      }
    } catch {
      await dialog.error("An error occurred")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Booking not found</p>
          <Link href="/services/parks/venue-verification" className="text-amber-600 hover:underline">Back to list</Link>
        </div>
      </div>
    )
  }

  const currentStep = statusFlow.indexOf(booking.status)
  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-amber-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/services/parks/venue-verification" className="text-sm text-amber-100 hover:text-white mb-2 inline-block">
            ← Back to Venue Bookings
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold">Venue Booking - {booking.applicantName}</h1>
              <p className="text-amber-100 text-sm mt-1">ID: {booking.id}</p>
            </div>
            <div className="flex items-center space-x-2">
              {booking.isPriority && (
                <span className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-bold">PRIORITY</span>
              )}
              <span className={`px-4 py-2 rounded-lg text-sm font-bold border ${statusColors[booking.status]}`}>
                {booking.status.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Tracker */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">WORKFLOW PROGRESS</h3>
          <div className="flex items-center justify-between">
            {statusFlow.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                  i <= currentStep ? "bg-amber-600 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {i <= currentStep ? "✓" : i + 1}
                </div>
                <span className={`ml-2 text-xs hidden md:block ${i <= currentStep ? "text-amber-700 font-medium" : "text-gray-400"}`}>
                  {s.replace(/_/g, " ")}
                </span>
                {i < statusFlow.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${i < currentStep ? "bg-amber-600" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Booking Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Applicant</p>
                  <p className="font-semibold">{booking.applicantName}</p>
                </div>
                {booking.organizationName && (
                  <div>
                    <p className="text-xs text-gray-500">Organization</p>
                    <p className="font-semibold">{booking.organizationName}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Contact Person</p>
                  <p className="font-semibold">{booking.contactPerson}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Contact Number</p>
                  <p className="font-semibold">{booking.contactNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Event Type</p>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-amber-100 text-amber-800">
                    {booking.eventType.replace(/_/g, " ")}
                    {booking.eventTypeOther && ` - ${booking.eventTypeOther}`}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Venue</p>
                  <p className="font-semibold">
                    {venueLabels[booking.venueType] || booking.venueType}
                    {booking.venueDetails && ` — ${booking.venueDetails}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Start Date</p>
                  <p className="font-semibold">{formatDate(booking.desiredStartDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">End Date</p>
                  <p className="font-semibold">{formatDate(booking.desiredEndDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Estimated Attendees</p>
                  <p className="font-semibold">{booking.estimatedAttendees}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">LGU Sponsored</p>
                  <p className="font-semibold">{booking.isLguSponsored ? "Yes" : "No"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Submitted By</p>
                  <p className="font-semibold">{booking.user.name} ({booking.user.email})</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date Submitted</p>
                  <p className="font-semibold">{formatDate(booking.createdAt)}</p>
                </div>
                {booking.holdExpiresAt && (
                  <div>
                    <p className="text-xs text-gray-500">Hold Expires</p>
                    <p className="font-semibold text-red-600">{new Date(booking.holdExpiresAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Uploaded Documents */}
            {(booking.layoutFile || booking.governmentPermit || booking.barangayEndorsement) && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Uploaded Documents</h2>
                <div className="grid grid-cols-3 gap-4">
                  {booking.layoutFile && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Event Layout</p>
                      <a href={booking.layoutFile} target="_blank" rel="noopener noreferrer" className="block">
                        <img src={booking.layoutFile} alt="Event Layout" className="w-full h-32 object-cover rounded-lg border hover:opacity-75 transition" />
                      </a>
                    </div>
                  )}
                  {booking.governmentPermit && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Government Permit</p>
                      <a href={booking.governmentPermit} target="_blank" rel="noopener noreferrer" className="block">
                        <img src={booking.governmentPermit} alt="Government Permit" className="w-full h-32 object-cover rounded-lg border hover:opacity-75 transition" />
                      </a>
                    </div>
                  )}
                  {booking.barangayEndorsement && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Barangay Endorsement</p>
                      <a href={booking.barangayEndorsement} target="_blank" rel="noopener noreferrer" className="block">
                        <img src={booking.barangayEndorsement} alt="Barangay Endorsement" className="w-full h-32 object-cover rounded-lg border hover:opacity-75 transition" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Payment Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                    booking.paymentStatus === "VERIFIED" || booking.paymentStatus === "PAID" ? "bg-green-100 text-green-800" :
                    booking.paymentStatus === "AWAITING_PAYMENT" ? "bg-orange-100 text-orange-800" :
                    booking.paymentStatus === "EXEMPTED" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {booking.paymentStatus.replace(/_/g, " ")}
                  </span>
                </div>
                {booking.paymentMethod && (
                  <div>
                    <p className="text-xs text-gray-500">Payment Method</p>
                    <p className="font-semibold">{booking.paymentMethod}</p>
                  </div>
                )}
                {booking.amountDue != null && (
                  <div>
                    <p className="text-xs text-gray-500">Amount Due</p>
                    <p className="font-semibold">₱{booking.amountDue.toFixed(2)}</p>
                  </div>
                )}
                {booking.amountPaid != null && (
                  <div>
                    <p className="text-xs text-gray-500">Amount Paid</p>
                    <p className="font-semibold">₱{booking.amountPaid.toFixed(2)}</p>
                  </div>
                )}
                {booking.paymentReference && (
                  <div>
                    <p className="text-xs text-gray-500">Reference #</p>
                    <p className="font-semibold font-mono">{booking.paymentReference}</p>
                  </div>
                )}
              </div>
              {booking.paymentProof && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">Payment Proof</p>
                  <a href={booking.paymentProof} target="_blank" rel="noopener noreferrer" className="block">
                    <img src={booking.paymentProof} alt="Payment Proof" className="max-w-sm h-40 object-cover rounded-lg border hover:opacity-75 transition" />
                  </a>
                </div>
              )}
              {booking.exemptionMemo && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">LGU Exemption/Waiver Memo</p>
                  <a href={booking.exemptionMemo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">View Document</a>
                </div>
              )}
            </div>

            {/* Gate Pass */}
            {booking.gatePassCode && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Gate Pass</h2>
                <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 text-center">
                  <p className="text-sm text-gray-500 mb-2">Gate Pass Code</p>
                  <p className="text-3xl font-mono font-bold text-amber-800 tracking-widest">{booking.gatePassCode}</p>
                  {booking.gatePassUsed && (
                    <p className="text-sm text-green-600 mt-3">✓ Gate pass has been used</p>
                  )}
                  {booking.venueStatus && (
                    <p className="text-sm text-blue-600 mt-2">Venue Status: {booking.venueStatus.replace(/_/g, " ")}</p>
                  )}
                  {booking.noShow && (
                    <p className="text-sm text-red-600 mt-3">✗ Marked as No Show</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right - Action Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Process Booking</h3>

              {/* Status */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500">
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="AWAITING_REQUIREMENTS">Awaiting Requirements</option>
                  <option value="AWAITING_PAYMENT">Awaiting Payment</option>
                  <option value="PAYMENT_VERIFIED">Payment Verified</option>
                  <option value="APPROVED">Approved</option>
                  <option value="IN_USE">In Use</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="NO_SHOW">No Show</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Payment Status */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500">
                  <option value="UNPAID">Unpaid</option>
                  <option value="AWAITING_PAYMENT">Awaiting Payment</option>
                  <option value="PAID">Paid</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="EXEMPTED">Exempted (LGU)</option>
                </select>
              </div>

              {/* Payment Method */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500">
                  <option value="">— Select —</option>
                  <option value="GCash">GCash</option>
                  <option value="Onsite">Onsite / Walk-in</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Manual Override">Manual Override</option>
                </select>
              </div>

              {/* Amount Due */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Due (₱)</label>
                <input type="number" step="0.01" value={amountDue} onChange={(e) => setAmountDue(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" />
              </div>

              {/* Amount Paid */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (₱)</label>
                <input type="number" step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" />
              </div>

              {/* Venue Day Status */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue Day Status</label>
                <select value={venueStatus} onChange={(e) => setVenueStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500">
                  <option value="">— Not Set —</option>
                  <option value="IN_USE">In Use</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="NO_SHOW">No Show</option>
                </select>
              </div>

              {/* Generate Gate Pass */}
              {!booking.gatePassCode && (
                <div className="mb-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={generateGatePass} onChange={(e) => setGenerateGatePass(e.target.checked)}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                    <span className="text-sm font-medium text-gray-700">Generate Gate Pass Code</span>
                  </label>
                </div>
              )}

              {/* Remarks */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks / Notes to Applicant</label>
                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3}
                  placeholder="Any message or note..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" />
              </div>

              <button onClick={handleUpdate} disabled={saving}
                className="w-full py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 font-semibold transition-colors">
                {saving ? "Saving..." : "Update Booking"}
              </button>
            </div>

            {/* Audit Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">PROCESSING INFO</h3>
              <div className="space-y-2 text-sm">
                {booking.processedAt && (
                  <div>
                    <p className="text-xs text-gray-500">Last Processed</p>
                    <p className="text-gray-700">{new Date(booking.processedAt).toLocaleString()}</p>
                  </div>
                )}
                {booking.autoCancelled && (
                  <div>
                    <p className="text-xs text-red-500">Auto-Cancelled</p>
                    <p className="text-red-600 font-medium">Payment hold expired</p>
                  </div>
                )}
                {booking.markedCompletedAt && (
                  <div>
                    <p className="text-xs text-gray-500">Marked Completed</p>
                    <p className="text-gray-700">{new Date(booking.markedCompletedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
