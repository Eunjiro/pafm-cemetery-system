"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

interface DeathRegistration {
  id: string
  deceasedFirstName: string
  deceasedMiddleName: string | null
  deceasedLastName: string
  deceasedDateOfBirth: string
  deceasedDateOfDeath: string
  deceasedPlaceOfDeath: string
  deceasedCauseOfDeath: string
  deceasedGender: string
  informantName: string
  informantRelation: string
  informantContactNumber: string
  informantAddress: string
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

export default function SubmissionDetail() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [registration, setRegistration] = useState<DeathRegistration | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadMode, setUploadMode] = useState<"file" | "or">("file")
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [orNumber, setOrNumber] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      fetchRegistration()
    }
  }, [status, router])

  const fetchRegistration = async () => {
    try {
      const response = await fetch(`/api/cemetery/submission/${params.id}`)
      const data = await response.json()
      if (data.registration) {
        setRegistration(data.registration)
      }
    } catch (error) {
      console.error("Error fetching registration:", error)
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
      formData.append("registrationId", params.id as string)
      formData.append("uploadMode", uploadMode)
      
      if (uploadMode === "file" && proofFile) {
        formData.append("proofOfPayment", proofFile)
      } else if (uploadMode === "or") {
        formData.append("orNumber", orNumber)
      }

      const response = await fetch("/api/cemetery/submit-payment", {
        method: "POST",
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        alert("Payment submitted successfully! Waiting for confirmation.")
        fetchRegistration()
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!registration) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Registration not found</p>
          <Link href="/services/cemetery/my-submissions" className="mt-4 inline-block text-blue-600 hover:underline">
            Back to My Submissions
          </Link>
        </div>
      </div>
    )
  }

  const statusInfo = statusConfig[registration.status] || statusConfig.PENDING_VERIFICATION
  const deceasedFullName = `${registration.deceasedFirstName} ${registration.deceasedMiddleName || ''} ${registration.deceasedLastName}`.trim()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/services/cemetery/my-submissions" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            ← Back to My Submissions
          </Link>
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Application Details</h1>
              <p className="text-gray-600 mt-1">Application ID: {registration.id}</p>
            </div>
            <span className={`px-4 py-2 rounded-lg text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Application Status</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mr-3">✓</div>
              <div>
                <p className="font-medium">Submitted</p>
                <p className="text-sm text-gray-500">{new Date(registration.createdAt).toLocaleString()}</p>
              </div>
            </div>
            
            {registration.status !== 'PENDING_VERIFICATION' && (
              <div className="flex items-center">
                <div className={`w-8 h-8 ${registration.status === 'RETURNED_FOR_CORRECTION' ? 'bg-red-600' : 'bg-green-600'} text-white rounded-full flex items-center justify-center font-bold mr-3`}>
                  {registration.status === 'RETURNED_FOR_CORRECTION' ? '✗' : '✓'}
                </div>
                <div>
                  <p className="font-medium">
                    {registration.status === 'RETURNED_FOR_CORRECTION' ? 'Returned for Correction' : 'Verified & Approved'}
                  </p>
                  {registration.processedAt && (
                    <p className="text-sm text-gray-500">{new Date(registration.processedAt).toLocaleString()}</p>
                  )}
                </div>
              </div>
            )}

            {(registration.status === 'PAYMENT_SUBMITTED' || registration.status === 'PAYMENT_CONFIRMED' || registration.status === 'REGISTERED_FOR_PICKUP' || registration.status === 'COMPLETED') && (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mr-3">✓</div>
                <div>
                  <p className="font-medium">Payment Submitted</p>
                </div>
              </div>
            )}

            {(registration.status === 'PAYMENT_CONFIRMED' || registration.status === 'REGISTERED_FOR_PICKUP' || registration.status === 'COMPLETED') && (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mr-3">✓</div>
                <div>
                  <p className="font-medium">Payment Confirmed</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order of Payment */}
        {registration.orderOfPayment && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-blue-900 mb-3">Order of Payment Generated</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700">OR Number</p>
                <p className="text-lg font-bold text-blue-900">{registration.orderOfPayment}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Amount to Pay</p>
                <p className="text-lg font-bold text-blue-900">₱50.00</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Upload Section */}
        {registration.status === 'APPROVED_FOR_PAYMENT' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Submit Payment Proof</h2>
            <p className="text-gray-600 mb-4">Please pay ₱50.00 and submit your proof of payment or enter your OR number.</p>
            
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
        {registration.status === 'PAYMENT_SUBMITTED' && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-purple-900 mb-2">⏳ Payment Under Review</h3>
            <p className="text-purple-800">Your payment proof has been submitted and is being verified by our staff.</p>
          </div>
        )}

        {registration.status === 'REGISTERED_FOR_PICKUP' && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-green-900 mb-2">✅ Ready for Pickup!</h3>
            <p className="text-green-800 mb-4">Your death certificate is ready. Please visit the Civil Registry Office to collect your document.</p>
            <div className="bg-white rounded p-4">
              <p className="text-sm text-gray-700"><strong>Office Hours:</strong> Monday - Friday, 8:00 AM - 5:00 PM</p>
              <p className="text-sm text-gray-700 mt-1"><strong>Bring:</strong> Valid ID and this application number</p>
            </div>
          </div>
        )}

        {/* Remarks */}
        {registration.remarks && (
          <div className={`border rounded-lg p-6 mb-6 ${
            registration.status === 'RETURNED_FOR_CORRECTION' 
              ? 'bg-red-50 border-red-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <h3 className="font-bold mb-2">
              {registration.status === 'RETURNED_FOR_CORRECTION' ? '⚠️ Correction Required' : 'ℹ️ Remarks'}
            </h3>
            <p className={registration.status === 'RETURNED_FOR_CORRECTION' ? 'text-red-800' : 'text-yellow-800'}>
              {registration.remarks}
            </p>
          </div>
        )}

        {/* Deceased Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Deceased Person Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Full Name</p>
              <p className="font-semibold text-gray-900">{deceasedFullName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gender</p>
              <p className="font-semibold text-gray-900">{registration.deceasedGender}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date of Death</p>
              <p className="font-semibold text-gray-900">
                {new Date(registration.deceasedDateOfDeath).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Place of Death</p>
              <p className="font-semibold text-gray-900">{registration.deceasedPlaceOfDeath}</p>
            </div>
          </div>
        </div>

        {/* Informant Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Informant Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-semibold text-gray-900">{registration.informantName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Relation</p>
              <p className="font-semibold text-gray-900">{registration.informantRelation}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Contact Number</p>
              <p className="font-semibold text-gray-900">{registration.informantContactNumber}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
