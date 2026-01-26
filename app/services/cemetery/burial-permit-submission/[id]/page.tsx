"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

interface BurialPermit {
  id: string
  deceasedName: string
  deceasedDateOfDeath: string
  requesterName: string
  requesterRelation: string
  requesterContactNumber: string
  requesterAddress: string
  burialType: string
  nicheType: string | null
  cemeteryLocation: string
  isFromAnotherLGU: boolean
  permitFee: number
  nicheFee: number | null
  totalFee: number
  status: string
  orderOfPayment: string | null
  proofOfPayment: string | null
  paymentConfirmed: boolean
  remarks: string | null
  createdAt: string
  processedBy: string | null
  processedAt: string | null
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING_VERIFICATION: { label: "Pending Verification", color: "text-yellow-700", bgColor: "bg-yellow-100" },
  RETURNED_FOR_CORRECTION: { label: "Returned for Correction", color: "text-red-700", bgColor: "bg-red-100" },
  APPROVED_FOR_PAYMENT: { label: "Approved - Awaiting Payment", color: "text-blue-700", bgColor: "bg-blue-100" },
  PAYMENT_SUBMITTED: { label: "Payment Submitted", color: "text-purple-700", bgColor: "bg-purple-100" },
  PAYMENT_CONFIRMED: { label: "Payment Confirmed", color: "text-green-700", bgColor: "bg-green-100" },
  REGISTERED_FOR_PICKUP: { label: "Ready for Pickup", color: "text-green-700", bgColor: "bg-green-100" },
  COMPLETED: { label: "Completed", color: "text-gray-700", bgColor: "bg-gray-100" },
  REJECTED: { label: "Rejected", color: "text-red-700", bgColor: "bg-red-100" },
}

export default function BurialPermitSubmissionDetail() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [permit, setPermit] = useState<BurialPermit | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadMode, setUploadMode] = useState<"file" | "or">("file")
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [orNumber, setOrNumber] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      fetchPermit()
    }
  }, [status, router])

  const fetchPermit = async () => {
    try {
      const response = await fetch(`/api/cemetery/burial-permit/${params.id}`)
      const data = await response.json()
      if (data.permit) {
        setPermit(data.permit)
      }
    } catch (error) {
      console.error("Error fetching permit:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (uploadMode === "file" && !proofFile) {
      alert("Please upload proof of payment")
      return
    }
    
    if (uploadMode === "or" && !orNumber.trim()) {
      alert("Please enter OR number")
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("permitId", params.id as string)
      formData.append("uploadMode", uploadMode)
      
      if (uploadMode === "file" && proofFile) {
        formData.append("proofOfPayment", proofFile)
      } else if (uploadMode === "or") {
        formData.append("orNumber", orNumber)
      }

      const response = await fetch("/api/cemetery/burial-permit/submit-payment", {
        method: "POST",
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        alert("Payment submitted successfully! Waiting for confirmation.")
        fetchPermit()
        setProofFile(null)
        setOrNumber("")
      } else {
        alert(data.error || "Submission failed")
      }
    } catch (error) {
      alert("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!permit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Permit not found</p>
          <Link href="/services/cemetery/my-submissions" className="mt-4 inline-block text-blue-600 hover:underline">
            Back to My Submissions
          </Link>
        </div>
      </div>
    )
  }

  const statusInfo = statusConfig[permit.status] || statusConfig.PENDING_VERIFICATION

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/services/cemetery/my-submissions" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
            ← Back to My Submissions
          </Link>
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Burial Permit Details</h1>
              <p className="text-gray-600 mt-1">Permit ID: {permit.id}</p>
            </div>
            <span className={`px-4 py-2 rounded-lg text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Permit Status</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mr-3">✓</div>
              <div>
                <p className="font-medium">Submitted</p>
                <p className="text-sm text-gray-500">{new Date(permit.createdAt).toLocaleString()}</p>
              </div>
            </div>
            
            {permit.status !== 'PENDING_VERIFICATION' && (
              <div className="flex items-center">
                <div className={`w-8 h-8 ${permit.status === 'RETURNED_FOR_CORRECTION' ? 'bg-red-600' : 'bg-green-600'} text-white rounded-full flex items-center justify-center font-bold mr-3`}>
                  {permit.status === 'RETURNED_FOR_CORRECTION' ? '✗' : '✓'}
                </div>
                <div>
                  <p className="font-medium">
                    {permit.status === 'RETURNED_FOR_CORRECTION' ? 'Returned for Correction' : 'Verified & Approved'}
                  </p>
                  {permit.processedAt && (
                    <p className="text-sm text-gray-500">{new Date(permit.processedAt).toLocaleString()}</p>
                  )}
                </div>
              </div>
            )}

            {(permit.status === 'PAYMENT_SUBMITTED' || permit.status === 'PAYMENT_CONFIRMED' || permit.status === 'REGISTERED_FOR_PICKUP' || permit.status === 'COMPLETED') && (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mr-3">✓</div>
                <div>
                  <p className="font-medium">Payment Submitted</p>
                  <p className="text-sm text-gray-500">Waiting for confirmation</p>
                </div>
              </div>
            )}

            {(permit.status === 'PAYMENT_CONFIRMED' || permit.status === 'REGISTERED_FOR_PICKUP' || permit.status === 'COMPLETED') && (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mr-3">✓</div>
                <div>
                  <p className="font-medium">Payment Confirmed</p>
                  <p className="text-sm text-gray-500">Permit is being processed</p>
                </div>
              </div>
            )}

            {(permit.status === 'REGISTERED_FOR_PICKUP' || permit.status === 'COMPLETED') && (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mr-3">✓</div>
                <div>
                  <p className="font-medium">Ready for Pickup</p>
                  <p className="text-sm text-gray-500">Visit Civil Registry Office</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Remarks (if returned for correction) */}
        {permit.status === 'RETURNED_FOR_CORRECTION' && permit.remarks && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-red-900 mb-2">Remarks from Civil Registry</h3>
            <p className="text-red-800">{permit.remarks}</p>
            <p className="text-sm text-red-600 mt-3">Please resubmit your application with the necessary corrections.</p>
          </div>
        )}

        {/* Order of Payment */}
        {permit.orderOfPayment && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-blue-900 mb-3">Order of Payment Generated</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700">OR Number</p>
                <p className="text-lg font-bold text-blue-900">{permit.orderOfPayment}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Amount to Pay</p>
                <p className="text-lg font-bold text-blue-900">₱{permit.totalFee.toFixed(2)}</p>
              </div>
            </div>
            {permit.nicheFee && (
              <p className="text-sm text-blue-700 mt-3">
                Breakdown: Permit Fee (₱{permit.permitFee.toFixed(2)}) + Niche Fee (₱{permit.nicheFee.toFixed(2)})
              </p>
            )}
          </div>
        )}

        {/* Payment Upload Section */}
        {permit.status === 'APPROVED_FOR_PAYMENT' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Submit Payment Proof</h2>
            <p className="text-gray-600 mb-4">Please pay ₱{permit.totalFee.toFixed(2)} and submit your proof of payment or enter your OR number.</p>
            
            <form onSubmit={handlePaymentSubmit}>
              <div className="mb-4">
                <div className="flex gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadMode("file")
                      setOrNumber("")
                      setProofFile(null)
                    }}
                    className={`px-4 py-2 rounded-lg font-medium ${uploadMode === "file" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
                  >
                    Upload Receipt
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadMode("or")
                      setOrNumber("")
                      setProofFile(null)
                    }}
                    className={`px-4 py-2 rounded-lg font-medium ${uploadMode === "or" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
                  >
                    Enter OR Number
                  </button>
                </div>

                {uploadMode === "file" ? (
                  <div key="file-upload">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Proof of Payment (Receipt/Screenshot)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">Accepted: PDF, JPG, PNG (Max 5MB)</p>
                  </div>
                ) : (
                  <div key="or-input">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter Official Receipt Number
                    </label>
                    <input
                      type="text"
                      value={orNumber}
                      onChange={(e) => setOrNumber(e.target.value)}
                      placeholder="e.g., OR-123456789"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Payment"}
              </button>
            </form>
          </div>
        )}

        {/* Payment Status */}
        {permit.status === 'PAYMENT_SUBMITTED' && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-purple-900 mb-2">⏳ Payment Under Review</h3>
            <p className="text-purple-800">Your payment proof has been submitted and is being verified by our staff.</p>
          </div>
        )}

        {permit.status === 'REGISTERED_FOR_PICKUP' && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-green-900 mb-2">✅ Ready for Pickup!</h3>
            <p className="text-green-800 mb-4">Your burial permit is ready. Please visit the Civil Registry Office to collect your document.</p>
            <div className="bg-white rounded p-4">
              <p className="text-sm text-gray-700"><strong>Office Hours:</strong> Monday - Friday, 8:00 AM - 5:00 PM</p>
              <p className="text-sm text-gray-700 mt-1"><strong>Bring:</strong> Valid ID and this permit number</p>
            </div>
          </div>
        )}

        {/* Remarks */}
        {permit.remarks && (
          <div className={`border rounded-lg p-6 mb-6 ${
            permit.status === 'RETURNED_FOR_CORRECTION' 
              ? 'bg-red-50 border-red-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <h3 className="font-bold mb-2">
              {permit.status === 'RETURNED_FOR_CORRECTION' ? '⚠️ Correction Required' : 'ℹ️ Remarks'}
            </h3>
            <p className={permit.status === 'RETURNED_FOR_CORRECTION' ? 'text-red-800' : 'text-yellow-800'}>
              {permit.remarks}
            </p>
          </div>
        )}

        {/* Permit Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Permit Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Permit Type</p>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                permit.burialType === 'BURIAL' ? 'bg-green-100 text-green-700' :
                permit.burialType === 'ENTRANCE' ? 'bg-blue-100 text-blue-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                {permit.burialType}
                {permit.burialType === 'NICHE' && permit.nicheType && ` (${permit.nicheType})`}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Cemetery Location</p>
              <p className="font-semibold text-gray-900">{permit.cemeteryLocation}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">From Another LGU</p>
              <p className="font-semibold text-gray-900">{permit.isFromAnotherLGU ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Fee</p>
              <p className="font-semibold text-gray-900">₱{permit.totalFee.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Deceased Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Deceased Person Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Full Name</p>
              <p className="font-semibold text-gray-900">{permit.deceasedName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date of Death</p>
              <p className="font-semibold text-gray-900">
                {new Date(permit.deceasedDateOfDeath).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Requester Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Requester Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-semibold text-gray-900">{permit.requesterName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Relation</p>
              <p className="font-semibold text-gray-900">{permit.requesterRelation}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Contact Number</p>
              <p className="font-semibold text-gray-900">{permit.requesterContactNumber}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
