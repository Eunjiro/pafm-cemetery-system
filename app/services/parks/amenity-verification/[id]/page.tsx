"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useDialog } from "@/app/components/DialogProvider"

interface AmenityReservation {
  id: string
  requesterName: string
  contactNumber: string
  preferredDate: string
  preferredTime: string
  numberOfGuests: number
  amenityType: string
  amenityDetails: string | null
  proofOfResidency: string | null
  specialRequests: string | null
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
  entryPassCode: string | null
  entryPassUsed: boolean
  checkedInAt: string | null
  checkedInBy: string | null
  noShow: boolean
  holdExpiresAt: string | null
  autoCancelled: boolean
  createdAt: string
  user: { name: string; email: string }
}

const statusFlow = [
  "PENDING_REVIEW",
  "AWAITING_PAYMENT",
  "PAYMENT_VERIFIED",
  "APPROVED",
  "CHECKED_IN",
  "COMPLETED",
]

const statusColors: Record<string, string> = {
  PENDING_REVIEW: "bg-yellow-100 text-yellow-800 border-yellow-300",
  AWAITING_PAYMENT: "bg-orange-100 text-orange-800 border-orange-300",
  PAYMENT_VERIFIED: "bg-indigo-100 text-indigo-800 border-indigo-300",
  APPROVED: "bg-green-100 text-green-800 border-green-300",
  REJECTED: "bg-red-100 text-red-800 border-red-300",
  CANCELLED: "bg-gray-100 text-gray-800 border-gray-300",
  CHECKED_IN: "bg-teal-100 text-teal-800 border-teal-300",
  NO_SHOW: "bg-red-100 text-red-800 border-red-300",
  COMPLETED: "bg-green-100 text-green-800 border-green-300",
}

const amenityLabels: Record<string, string> = {
  SWIMMING_ENTRANCE: "Swimming Entrance",
  COTTAGE: "Cottage",
  TABLE: "Table / Pavilion",
  ROOM: "Function Room",
  OTHER: "Other",
}

export default function AmenityVerificationDetailPage() {
  const { id } = useParams()
  const [reservation, setReservation] = useState<AmenityReservation | null>(null)
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
  const [generateEntryPass, setGenerateEntryPass] = useState(false)
  const [markCheckedIn, setMarkCheckedIn] = useState(false)

  useEffect(() => {
    fetchReservation()
  }, [id])

  const fetchReservation = async () => {
    try {
      const res = await fetch(`/api/parks/amenity-reservation/${id}`)
      const data = await res.json()
      if (data.reservation) {
        setReservation(data.reservation)
        setStatus(data.reservation.status)
        setRemarks(data.reservation.remarks || "")
        setPaymentStatus(data.reservation.paymentStatus)
        setPaymentMethod(data.reservation.paymentMethod || "")
        setAmountDue(data.reservation.amountDue?.toString() || "")
        setAmountPaid(data.reservation.amountPaid?.toString() || "")
      }
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!(await dialog.confirm("Are you sure you want to update this reservation?"))) return
    setSaving(true)
    try {
      const body: any = { status, remarks, paymentStatus, paymentMethod }
      if (amountDue) body.amountDue = parseFloat(amountDue)
      if (amountPaid) body.amountPaid = parseFloat(amountPaid)
      if (generateEntryPass) body.generateEntryPass = true
      if (markCheckedIn) body.checkIn = true

      const res = await fetch(`/api/parks/amenity-reservation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        await dialog.success("Reservation updated successfully!")
        setGenerateEntryPass(false)
        setMarkCheckedIn(false)
        fetchReservation()
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

  if (!reservation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Reservation not found</p>
          <Link href="/services/parks/amenity-verification" className="text-amber-600 hover:underline">Back to list</Link>
        </div>
      </div>
    )
  }

  const currentStep = statusFlow.indexOf(reservation.status)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-amber-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/services/parks/amenity-verification" className="text-sm text-amber-100 hover:text-white mb-2 inline-block">
            ← Back to Amenity Reservations
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold">Amenity Reservation - {reservation.requesterName}</h1>
              <p className="text-amber-100 text-sm mt-1">ID: {reservation.id}</p>
            </div>
            <span className={`px-4 py-2 rounded-lg text-sm font-bold border ${statusColors[reservation.status]}`}>
              {reservation.status.replace(/_/g, " ")}
            </span>
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
            {/* Reservation Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Reservation Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Requester</p>
                  <p className="font-semibold">{reservation.requesterName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Contact</p>
                  <p className="font-semibold">{reservation.contactNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Amenity Type</p>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-amber-100 text-amber-800">
                    {amenityLabels[reservation.amenityType] || reservation.amenityType}
                  </span>
                </div>
                {reservation.amenityDetails && (
                  <div>
                    <p className="text-xs text-gray-500">Specific Amenity</p>
                    <p className="font-semibold">{reservation.amenityDetails}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Preferred Date</p>
                  <p className="font-semibold">{new Date(reservation.preferredDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Preferred Time</p>
                  <p className="font-semibold">{reservation.preferredTime}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Number of Guests</p>
                  <p className="font-semibold">{reservation.numberOfGuests}</p>
                </div>
                {reservation.specialRequests && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Special Requests</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{reservation.specialRequests}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Submitted By</p>
                  <p className="font-semibold">{reservation.user.name} ({reservation.user.email})</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date Submitted</p>
                  <p className="font-semibold">{new Date(reservation.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
                {reservation.holdExpiresAt && (
                  <div>
                    <p className="text-xs text-gray-500">Hold Expires</p>
                    <p className="font-semibold text-red-600">{new Date(reservation.holdExpiresAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Proof of Residency */}
            {reservation.proofOfResidency && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Proof of Residency</h2>
                <a href={reservation.proofOfResidency} target="_blank" rel="noopener noreferrer" className="block">
                  <img src={reservation.proofOfResidency} alt="Proof of Residency" className="max-w-md h-48 object-cover rounded-lg border hover:opacity-75 transition" />
                </a>
              </div>
            )}

            {/* Payment Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Payment Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                    reservation.paymentStatus === "VERIFIED" || reservation.paymentStatus === "PAID" ? "bg-green-100 text-green-800" :
                    reservation.paymentStatus === "AWAITING_PAYMENT" ? "bg-orange-100 text-orange-800" :
                    reservation.paymentStatus === "EXEMPTED" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {reservation.paymentStatus.replace(/_/g, " ")}
                  </span>
                </div>
                {reservation.paymentMethod && (
                  <div>
                    <p className="text-xs text-gray-500">Payment Method</p>
                    <p className="font-semibold">{reservation.paymentMethod}</p>
                  </div>
                )}
                {reservation.amountDue != null && (
                  <div>
                    <p className="text-xs text-gray-500">Amount Due</p>
                    <p className="font-semibold">₱{reservation.amountDue.toFixed(2)}</p>
                  </div>
                )}
                {reservation.amountPaid != null && (
                  <div>
                    <p className="text-xs text-gray-500">Amount Paid</p>
                    <p className="font-semibold">₱{reservation.amountPaid.toFixed(2)}</p>
                  </div>
                )}
                {reservation.paymentReference && (
                  <div>
                    <p className="text-xs text-gray-500">Reference #</p>
                    <p className="font-semibold font-mono">{reservation.paymentReference}</p>
                  </div>
                )}
              </div>
              {reservation.paymentProof && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">Payment Proof</p>
                  <a href={reservation.paymentProof} target="_blank" rel="noopener noreferrer" className="block">
                    <img src={reservation.paymentProof} alt="Payment Proof" className="max-w-sm h-40 object-cover rounded-lg border hover:opacity-75 transition" />
                  </a>
                </div>
              )}
            </div>

            {/* Entry Pass / Check-in */}
            {reservation.entryPassCode && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Entry Pass</h2>
                <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 text-center">
                  <p className="text-sm text-gray-500 mb-2">Entry Pass Code</p>
                  <p className="text-3xl font-mono font-bold text-amber-800 tracking-widest">{reservation.entryPassCode}</p>
                  {reservation.checkedInAt && (
                    <p className="text-sm text-green-600 mt-3">✓ Checked in at {new Date(reservation.checkedInAt).toLocaleString()}</p>
                  )}
                  {reservation.noShow && (
                    <p className="text-sm text-red-600 mt-3">✗ Marked as No Show</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right - Action Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Process Reservation</h3>

              {/* Status */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500">
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="AWAITING_PAYMENT">Awaiting Payment</option>
                  <option value="PAYMENT_VERIFIED">Payment Verified</option>
                  <option value="APPROVED">Approved</option>
                  <option value="CHECKED_IN">Checked In</option>
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

              {/* Generate Entry Pass */}
              {!reservation.entryPassCode && (
                <div className="mb-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={generateEntryPass} onChange={(e) => setGenerateEntryPass(e.target.checked)}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                    <span className="text-sm font-medium text-gray-700">Generate Entry Pass Code</span>
                  </label>
                </div>
              )}

              {/* Mark Check-in */}
              {reservation.entryPassCode && !reservation.checkedInAt && (
                <div className="mb-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={markCheckedIn} onChange={(e) => setMarkCheckedIn(e.target.checked)}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                    <span className="text-sm font-medium text-gray-700">Mark as Checked In</span>
                  </label>
                </div>
              )}

              {/* Remarks */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks / Notes to Citizen</label>
                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3}
                  placeholder="Any message or note..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" />
              </div>

              <button onClick={handleUpdate} disabled={saving}
                className="w-full py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 font-semibold transition-colors">
                {saving ? "Saving..." : "Update Reservation"}
              </button>
            </div>

            {/* Audit Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">PROCESSING INFO</h3>
              <div className="space-y-2 text-sm">
                {reservation.processedAt && (
                  <div>
                    <p className="text-xs text-gray-500">Last Processed</p>
                    <p className="text-gray-700">{new Date(reservation.processedAt).toLocaleString()}</p>
                  </div>
                )}
                {reservation.autoCancelled && (
                  <div>
                    <p className="text-xs text-red-500">Auto-Cancelled</p>
                    <p className="text-red-600 font-medium">Payment hold expired</p>
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
