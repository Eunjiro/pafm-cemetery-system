"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface CremationPermitVerificationActionsProps {
  permitId: string
}

export default function CremationPermitVerificationActions({ permitId }: CremationPermitVerificationActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [remarks, setRemarks] = useState("")

  const handleApprove = async () => {
    if (!confirm("Are you sure you want to approve this cremation permit? An Order of Payment will be generated.")) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/cemetery/cremation-permit/verification/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permitId })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Approved! Order of Payment: ${data.orderOfPayment}\n\nTotal Fee: ₱${data.permitFee}`)
        router.push("/services/cemetery/cremation-permits/verification")
        router.refresh()
      } else {
        alert(data.error || "Approval failed")
      }
    } catch (error) {
      alert("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!remarks.trim()) {
      alert("Please provide remarks for rejection")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/cemetery/cremation-permit/verification/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permitId,
          remarks
        })
      })

      if (response.ok) {
        alert("Permit request returned for correction. User will be notified.")
        router.push("/services/cemetery/cremation-permits/verification")
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || "Rejection failed")
      }
    } catch (error) {
      alert("An error occurred")
    } finally {
      setLoading(false)
      setShowRejectModal(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-bold text-gray-900 mb-4">Verification Actions</h3>
        <div className="space-y-3">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium transition-colors"
          >
            ✓ Approve & Generate OR
          </button>
          
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={loading}
            className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium transition-colors"
          >
            ✗ Return for Correction
          </button>
        </div>

        <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-xs text-orange-800">
            Review all documents carefully before approving. Ensure death certificate, cremation form, and valid ID are complete.
          </p>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Return for Correction</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide specific remarks on what needs to be corrected:
            </p>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-900 min-h-[120px]"
              placeholder="Example: Death certificate image is unclear. Please upload a clearer copy."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleReject}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium"
              >
                Confirm Return
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRemarks("")
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
