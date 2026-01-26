"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface BurialPermitVerificationActionsProps {
  permitId: string
}

export default function BurialPermitVerificationActions({ permitId }: BurialPermitVerificationActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [remarks, setRemarks] = useState("")

  const handleApprove = async () => {
    if (!confirm("Are you sure you want to approve this burial permit? An Order of Payment will be generated.")) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/cemetery/burial-permit/verification/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permitId })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Approved! Order of Payment: ${data.orderOfPayment}\n\nTotal Fee: ₱${data.totalFee}`)
        router.push("/services/cemetery/burial-permits/verification")
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
      const response = await fetch("/api/cemetery/burial-permit/verification/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permitId,
          remarks
        })
      })

      if (response.ok) {
        alert("Permit request returned for correction. User will be notified.")
        router.push("/services/cemetery/burial-permits/verification")
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
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
          >
            ✓ Approve & Generate OR
          </button>
          
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={loading}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium transition-colors"
          >
            ✗ Return for Correction
          </button>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> Approving will generate an Order of Payment. User will need to pay and submit proof of payment.
          </p>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Return for Correction</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks/Reason for Return
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder:text-gray-400"
                rows={4}
                placeholder="Please specify what needs to be corrected..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={loading || !remarks.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                {loading ? "Processing..." : "Submit"}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRemarks("")
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
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
