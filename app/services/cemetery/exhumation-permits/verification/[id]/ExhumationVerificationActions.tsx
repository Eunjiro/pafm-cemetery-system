"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface ExhumationVerificationActionsProps {
  permitId: string
  employeeName: string
}

export default function ExhumationVerificationActions({ permitId, employeeName }: ExhumationVerificationActionsProps) {
  const router = useRouter()
  const [action, setAction] = useState<"approve" | "reject" | null>(null)
  const [remarks, setRemarks] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleApprove = async () => {
    setSubmitting(true)
    try {
      const response = await fetch("/api/cemetery/exhumation-permit/verification/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permitId,
          remarks: remarks || undefined,
          employeeName
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        alert("Exhumation permit approved successfully!")
        router.push("/services/cemetery/exhumation-permits/verification")
        router.refresh()
      } else {
        alert(data.error || "Failed to approve permit")
      }
    } catch (error) {
      console.error("Approval error:", error)
      alert("An error occurred while approving the permit")
    } finally {
      setSubmitting(false)
      setAction(null)
    }
  }

  const handleReject = async () => {
    if (!remarks.trim()) {
      alert("Please provide remarks for rejection")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/cemetery/exhumation-permit/verification/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permitId,
          remarks,
          employeeName
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        alert("Exhumation permit returned for correction")
        router.push("/services/cemetery/exhumation-permits/verification")
        router.refresh()
      } else {
        alert(data.error || "Failed to reject permit")
      }
    } catch (error) {
      console.error("Rejection error:", error)
      alert("An error occurred while rejecting the permit")
    } finally {
      setSubmitting(false)
      setAction(null)
    }
  }

  if (action === null) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-bold text-gray-900 mb-4">Verification Actions</h3>
        <div className="space-y-3">
          <button
            onClick={() => setAction("approve")}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Approve Permit
          </button>
          <button
            onClick={() => setAction("reject")}
            className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Return for Correction
          </button>
        </div>
      </div>
    )
  }

  if (action === "approve") {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-bold text-gray-900 mb-4">Approve Permit</h3>
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
          <p className="text-sm text-green-800">
            The permit will be approved and an Order of Payment will be generated. 
            The applicant will be notified to proceed with payment.
          </p>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Remarks (Optional)
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400"
            placeholder="Add any notes or instructions..."
          />
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            disabled={submitting}
            className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400"
          >
            {submitting ? "Processing..." : "Confirm Approval"}
          </button>
          <button
            onClick={() => { setAction(null); setRemarks("") }}
            disabled={submitting}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="font-bold text-gray-900 mb-4">Return for Correction</h3>
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
        <p className="text-sm text-red-800">
          The permit will be returned to the applicant. Please specify what needs to be corrected.
        </p>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Remarks (Required) *
        </label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={4}
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400"
          placeholder="e.g., 'QC Health letter is not authentic', 'Death certificate is incomplete'..."
        />
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={handleReject}
          disabled={submitting || !remarks.trim()}
          className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-gray-400"
        >
          {submitting ? "Processing..." : "Confirm Return"}
        </button>
        <button
          onClick={() => { setAction(null); setRemarks("") }}
          disabled={submitting}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
