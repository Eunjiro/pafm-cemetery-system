"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface VerificationActionsProps {
  registrationId: string
  employeeName: string
}

export default function VerificationActions({ registrationId, employeeName }: VerificationActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [remarks, setRemarks] = useState("")

  const handleApprove = async () => {
    if (!confirm("Are you sure you want to approve this death registration? An Order of Payment will be generated.")) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/cemetery/verification/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId,
          processedBy: employeeName
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Approved! Order of Payment: ${data.orderOfPayment}`)
        router.push("/services/cemetery/verification")
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
      const response = await fetch("/api/cemetery/verification/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId,
          remarks,
          processedBy: employeeName
        })
      })

      if (response.ok) {
        alert("Application returned for correction. User will be notified.")
        router.push("/services/cemetery/verification")
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

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>Note:</strong> Approval will generate an Order of Payment (₱50) and notify the applicant. Rejection will return the application with your remarks.
          </p>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Return for Correction</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide specific remarks about what needs to be corrected:
            </p>
            
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="e.g., Municipal Form 103 is not clearly visible. Please upload a clearer copy."
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={loading || !remarks.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Confirm Return"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
