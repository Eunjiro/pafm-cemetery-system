"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

interface DeathCertificateRequest {
  id: string
  userId: string
  deceasedFullName: string
  deceasedDateOfDeath: Date
  deceasedPlaceOfDeath: string
  requesterName: string
  requesterRelation: string
  requesterContactNumber: string
  requesterAddress: string
  purpose: string
  numberOfCopies: number
  totalFee: number
  claimSchedule: string
  validId: string
  authorizationLetter: string | null
  status: string
  orderOfPayment: string | null
  proofOfPayment: string | null
  verificationNotes: string | null
  verifiedAt: Date | null
  createdAt: Date
  user: {
    name: string | null
    email: string | null
  }
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  PENDING_VERIFICATION: {
    label: "Pending Verification",
    color: "text-green-700",
    bgColor: "bg-green-100",
    icon: "⏳"
  },
  RETURNED_FOR_CORRECTION: {
    label: "Returned for Correction",
    color: "text-red-700",
    bgColor: "bg-red-100",
    icon: "↩️"
  },
  APPROVED_FOR_PAYMENT: {
    label: "Approved - Awaiting Payment",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    icon: "💳"
  },
  PAYMENT_SUBMITTED: {
    label: "Payment Submitted",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    icon: "📄"
  },
  REGISTERED_FOR_PICKUP: {
    label: "Ready for Pickup",
    color: "text-green-700",
    bgColor: "bg-green-100",
    icon: "✅"
  },
  COMPLETED: {
    label: "Completed",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    icon: "🎉"
  },
  REJECTED: {
    label: "Rejected",
    color: "text-red-700",
    bgColor: "bg-red-100",
    icon: "❌"
  }
}

const formatStatus = (status: string) => {
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

const formatDate = (date: Date | null) => {
  if (!date) return "N/A"
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function DeathCertificateRequestSubmissionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [request, setRequest] = useState<DeathCertificateRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadMode, setUploadMode] = useState<"file" | "or">("file")
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [orNumber, setOrNumber] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && params.id) {
      fetchRequest()
    }
  }, [status, params.id, router])

  const fetchRequest = async () => {
    try {
      const response = await fetch(`/api/cemetery/death-certificate-request/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        // API returns { certificateRequest } wrapped object
        setRequest(data.certificateRequest || data)
      } else {
        console.error("Failed to fetch request")
      }
    } catch (error) {
      console.error("Error fetching request:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!request) return

    if (uploadMode === "file" && !proofFile) {
      alert("Please select a proof of payment file")
      return
    }

    if (uploadMode === "or" && !orNumber.trim()) {
      alert("Please enter OR number")
      return
    }

    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("requestId", request.id)
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
        alert("Payment proof submitted successfully! Please wait for confirmation.")
        fetchRequest()
        setProofFile(null)
        setOrNumber("")
      } else {
        alert(data.error || "Failed to submit payment")
      }
    } catch (error) {
      console.error("Payment submission error:", error)
      alert("An error occurred while submitting payment")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading request details...</p>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Not Found</h2>
          <p className="text-gray-600 mb-6">The death certificate request you're looking for doesn't exist or you don't have access to it.</p>
          <Link href="/services/cemetery/my-submissions">
            <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Back to My Submissions
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const statusInfo = statusConfig[request.status] || statusConfig.PENDING_VERIFICATION
  const canSubmitPayment = request.status === "APPROVED_FOR_PAYMENT" && request.orderOfPayment && !request.proofOfPayment
  
  // Calculate total fee if not present (₱50 per copy)
  const totalFee = request.totalFee || (request.numberOfCopies * 50)

  // Status timeline
  const statuses = [
    { key: "PENDING_VERIFICATION", label: "Submitted" },
    { key: "APPROVED_FOR_PAYMENT", label: "Approved" },
    { key: "PAYMENT_SUBMITTED", label: "Payment" },
    { key: "REGISTERED_FOR_PICKUP", label: "Ready" },
    { key: "COMPLETED", label: "Completed" }
  ]
  
  const currentIndex = statuses.findIndex(s => s.key === request.status)
  const isReturned = request.status === "RETURNED_FOR_CORRECTION"
  const isRejected = request.status === "REJECTED"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/services/cemetery/my-submissions" className="text-sm text-green-100 hover:text-white mb-2 inline-block">
                ← Back to My Submissions
              </Link>
              <h1 className="text-3xl font-bold">Death Certificate Request Details</h1>
              <p className="text-green-100 mt-1">Track your death certificate request</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-100">Welcome</p>
              <p className="font-semibold">{session?.user?.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Status Card */}
        <div className={`rounded-lg p-6 mb-6 ${statusInfo.bgColor} border-l-4 border-green-600`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${statusInfo.color} flex items-center gap-2`}>
                <span>{statusInfo.icon}</span>
                {statusInfo.label}
              </h2>
              <p className="text-sm mt-2 text-gray-700">Request ID: <span className="font-mono">{request.id}</span></p>
              <p className="text-sm text-gray-700">Submitted: {new Date(request.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        {!isReturned && !isRejected && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Request Progress</h3>
            <div className="flex items-center justify-between">
              {statuses.map((status, index) => (
                <div key={status.key} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                      index <= currentIndex 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {index < currentIndex ? '✓' : index + 1}
                    </div>
                    <p className={`text-xs mt-2 text-center ${
                      index <= currentIndex ? 'text-gray-900 font-medium' : 'text-gray-500'
                    }`}>
                      {status.label}
                    </p>
                  </div>
                  {index < statuses.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 ${
                      index < currentIndex ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Return Notice */}
        {request.status === "RETURNED_FOR_CORRECTION" && request.verificationNotes && (
          <div className="mb-6 bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-orange-800">Corrections Required</h3>
                <div className="mt-2 text-sm text-orange-700">
                  <p>{request.verificationNotes}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Notice */}
        {request.status === "REJECTED" && request.verificationNotes && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Request Rejected</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{request.verificationNotes}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Certificate Details */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-green-500">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Certificate Details</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Deceased Full Name</p>
                    <p className="font-semibold text-gray-900">{request.deceasedFullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date of Death</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(request.deceasedDateOfDeath).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Place of Death</p>
                    <p className="font-semibold text-gray-900">{request.deceasedPlaceOfDeath}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Requester Information */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Requester Information</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Requester Name</p>
                    <p className="font-semibold text-gray-900">{request.requesterName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Relationship to Deceased</p>
                    <p className="font-semibold text-gray-900">{request.requesterRelation}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Contact Number</p>
                    <p className="font-semibold text-gray-900">{request.requesterContactNumber}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Complete Address</p>
                    <p className="font-semibold text-gray-900">{request.requesterAddress}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Purpose of Request</p>
                    <p className="font-semibold text-gray-900">{request.purpose}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Number of Copies</p>
                    <p className="font-semibold text-gray-900">{request.numberOfCopies}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pickup Method</p>
                    <p className="font-semibold text-gray-900">Office Pickup Only</p>
                  </div>
                  {request.claimSchedule && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Scheduled Claim Date</p>
                      <p className="font-semibold text-gray-900">{request.claimSchedule}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Required Documents */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Submitted Documents</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">Valid ID</span>
                    </div>
                    <a
                      href={`/api/cemetery/view-document?filePath=${encodeURIComponent(request.validId)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Document
                    </a>
                  </div>
                  {request.authorizationLetter && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">Authorization Letter</span>
                      </div>
                      <a
                        href={`/api/cemetery/view-document?filePath=${encodeURIComponent(request.authorizationLetter)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View Document
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Section */}
            {canSubmitPayment && (
              <div className={`rounded-lg p-6 border-l-4 ${
                isReturned ? 'bg-red-50 border-l-4 border-red-500' : 'bg-green-50 border-l-4 border-green-500'
              }`}>
                <h3 className="text-lg font-bold text-gray-900 mb-4">💳 Payment Required</h3>
                <div className="bg-white p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Order of Payment:</span>
                    <span className="font-bold text-green-600">{request.orderOfPayment}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Amount:</span>
                    <span className="font-bold text-2xl text-gray-900">₱{totalFee.toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Instructions:</strong> Please proceed to the Cashier's Office and pay the fee. 
                    After payment, upload your proof of payment or provide your OR number below.
                  </p>
                </div>

                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  {/* Upload Mode Toggle */}
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setUploadMode("file")}
                      className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                        uploadMode === "file"
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      📎 Upload Receipt
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode("or")}
                      className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                        uploadMode === "or"
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      #️⃣ Enter OR Number
                    </button>
                  </div>

                  {uploadMode === "file" ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Proof of Payment <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required={uploadMode === "file"}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Accepted: Images (JPG, PNG) or PDF files
                      </p>
                      {proofFile && (
                        <p className="text-sm text-green-600 mt-2">
                          ✓ Selected: {proofFile.name}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Official Receipt (OR) Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={orNumber}
                        onChange={(e) => setOrNumber(e.target.value)}
                        placeholder="Enter OR number from cashier"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required={uploadMode === "or"}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter the OR number provided by the cashier
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || (uploadMode === "file" && !proofFile) || (uploadMode === "or" && !orNumber.trim())}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                  >
                    {submitting ? "Submitting..." : "Submit Payment Proof"}
                  </button>
                </form>
              </div>
            )}

            {/* Payment Status (if already submitted) */}
            {request.proofOfPayment && (
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <h3 className="font-bold text-gray-900 mb-4">Payment Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Order of Payment:</span>
                    <span className="font-semibold text-gray-900">{request.orderOfPayment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount Paid:</span>
                    <span className="font-semibold text-gray-900">₱{totalFee.toFixed(2)}</span>
                  </div>
                  {request.proofOfPayment.startsWith("OR:") ? (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">OR Number:</span>
                      <span className="font-semibold text-gray-900">{request.proofOfPayment.replace("OR:", "")}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Payment Proof:</span>
                      <a
                        href={`/api/cemetery/view-document?filePath=${encodeURIComponent(request.proofOfPayment)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm font-semibold"
                      >
                        View Receipt →
                      </a>
                    </div>
                  )}
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {request.status === "PAYMENT_SUBMITTED" 
                        ? "✓ Payment submitted. Waiting for employee confirmation."
                        : "✓ Payment confirmed. Your certificate is being processed."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Fee Summary */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-green-500">
                <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                  <h2 className="text-lg font-bold text-white">Fee Summary</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Number of Copies</span>
                      <span className="font-semibold text-gray-900">{request.numberOfCopies}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-sm text-gray-600">First Copy</span>
                      <span className="font-semibold text-gray-900">₱50.00</span>
                    </div>
                    {request.numberOfCopies > 1 && (
                      <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                        <span className="text-sm text-gray-600">Additional Copies ({request.numberOfCopies - 1})</span>
                        <span className="font-semibold text-gray-900">₱{((request.numberOfCopies - 1) * 50).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-bold text-gray-900">Total Fee</span>
                      <span className="font-bold text-green-600 text-xl">₱{totalFee.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Information */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">Status Information</h2>
                </div>
                <div className="p-6 space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Current Status</p>
                    <p className="font-semibold text-gray-900">{formatStatus(request.status)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Submitted By</p>
                    <p className="font-semibold text-gray-900">{request.user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">{request.user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Submitted On</p>
                    <p className="font-semibold text-gray-900">{formatDate(request.createdAt)}</p>
                  </div>
                  {request.verifiedAt && (
                    <div>
                      <p className="text-sm text-gray-600">Verified On</p>
                      <p className="font-semibold text-gray-900">{formatDate(request.verifiedAt)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Verification Checklist */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">Requirements Checklist</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-700">Valid ID</span>
                    </div>
                    <div className="flex items-center">
                      <svg className={`w-5 h-5 mr-2 ${request.authorizationLetter ? "text-green-500" : "text-gray-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-700">Authorization Letter {!request.authorizationLetter && "(Optional)"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
