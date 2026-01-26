"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface CertificateRequestVerificationActionsProps {
  requestId: string
}

export default function CertificateRequestVerificationActions({ requestId }: CertificateRequestVerificationActionsProps) {
  const router = useRouter()
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionRemarks, setRejectionRemarks] = useState("")

  const handleApprove = async () => {
    if (!confirm("Are you sure you want to approve this certificate request? This will generate an Order of Payment.")) {
      return
    }

    setIsApproving(true)
    try {
      const response = await fetch("/api/cemetery/death-certificate-request/verification/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to approve request")
      }

      alert(`Request approved successfully! Order of Payment: ${data.orderOfPayment}`)
      router.push("/services/cemetery/employee-dashboard")
      router.refresh()
    } catch (error: unknown) {
      console.error("Error approving request:", error)
      alert(error instanceof Error ? error.message : "Failed to approve request. Please try again.")
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionRemarks.trim()) {
      alert("Please provide remarks for rejection")
      return
    }

    setIsRejecting(true)
    try {
      const response = await fetch("/api/cemetery/death-certificate-request/verification/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          requestId, 
          remarks: rejectionRemarks.trim() 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to reject request")
      }

      alert("Request returned for correction successfully!")
      router.push("/services/cemetery/employee-dashboard")
      router.refresh()
    } catch (error: unknown) {
      console.error("Error rejecting request:", error)
      alert(error instanceof Error ? error.message : "Failed to reject request. Please try again.")
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Verification Actions</h2>
        <div className="space-y-3">
          <button
            onClick={handleApprove}
            disabled={isApproving}
            className="w-full py-3 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {isApproving ? "Approving..." : "✓ Approve Request"}
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={isRejecting}
            className="w-full py-3 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            ✗ Return for Correction
          </button>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Return for Correction</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide specific remarks about what needs to be corrected:
            </p>
            <textarea
              value={rejectionRemarks}
              onChange={(e) => setRejectionRemarks(e.target.value)}
              placeholder="Enter your remarks here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectionRemarks("")
                }}
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isRejecting || !rejectionRemarks.trim()}
                className="flex-1 py-2 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {isRejecting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
