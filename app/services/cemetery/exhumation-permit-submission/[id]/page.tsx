"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

interface ExhumationPermit {
  id: string
  deceasedName: string
  deceasedDateOfDeath: string
  deceasedDateOfBurial: string
  deceasedPlaceOfBurial: string
  requesterName: string
  requesterRelation: string
  requesterContactNumber: string
  requesterAddress: string
  reasonForExhumation: string
  permitFee: number
  status: string
  createdAt: string
  orderOfPayment: string | null
  proofOfPayment: string | null
  paymentConfirmed: boolean
  remarks: string | null
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  PENDING_VERIFICATION: {
    label: "Pending Verification",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
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

export default function ExhumationPermitSubmission() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [permit, setPermit] = useState<ExhumationPermit | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadMode, setUploadMode] = useState<"file" | "or">("file")
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [orNumber, setOrNumber] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && params.id) {
      fetchPermit()
    }
  }, [status, params.id, router])

  const fetchPermit = async () => {
    try {
      const response = await fetch(`/api/cemetery/exhumation-permit/${params.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setPermit(data.permit)
      } else {
        console.error("Failed to fetch permit:", data.error)
      }
    } catch (error) {
      console.error("Error fetching permit:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSubmission = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (uploadMode === "file" && !proofFile) {
      alert("Please upload a proof of payment file")
      return
    }
    
    if (uploadMode === "or" && !orNumber.trim()) {
      alert("Please enter the OR number")
      return
    }
    
    setSubmitting(true)
    
    try {
      const formData = new FormData()
      formData.append("permitId", permit!.id)
      formData.append("permitType", "exhumation")
      
      if (uploadMode === "file" && proofFile) {
        formData.append("proofOfPayment", proofFile)
      } else if (uploadMode === "or") {
        formData.append("orNumber", orNumber)
      }
      
      const response = await fetch("/api/cemetery/exhumation-permit/submit-payment", {
        method: "POST",
        body: formData
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert("Payment submitted successfully!")
        fetchPermit()
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading permit details...</p>
        </div>
      </div>
    )
  }

  if (!permit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Permit Not Found</h2>
          <p className="text-gray-600 mb-6">The exhumation permit you're looking for doesn't exist or you don't have access to it.</p>
          <Link href="/services/cemetery/my-submissions">
            <button className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
              Back to My Submissions
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const statusInfo = statusConfig[permit.status] || statusConfig.PENDING_VERIFICATION
  const canSubmitPayment = permit.status === "APPROVED_FOR_PAYMENT" && permit.orderOfPayment && !permit.proofOfPayment

  // Status timeline
  const statuses = [
    { key: "PENDING_VERIFICATION", label: "Submitted" },
    { key: "APPROVED_FOR_PAYMENT", label: "Approved" },
    { key: "PAYMENT_SUBMITTED", label: "Payment" },
    { key: "REGISTERED_FOR_PICKUP", label: "Ready" },
    { key: "COMPLETED", label: "Completed" }
  ]
  
  const currentIndex = statuses.findIndex(s => s.key === permit.status)
  const isReturned = permit.status === "RETURNED_FOR_CORRECTION"
  const isRejected = permit.status === "REJECTED"

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/services/cemetery/my-submissions" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
            ← Back to My Submissions
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Exhumation Permit Details</h1>
          <p className="text-gray-600 mt-2">Track your exhumation permit request</p>
        </div>

        {/* Status Card */}
        <div className={`rounded-lg p-6 mb-6 ${statusInfo.bgColor} border-l-4 border-orange-600`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${statusInfo.color} flex items-center gap-2`}>
                <span>{statusInfo.icon}</span>
                {statusInfo.label}
              </h2>
              <p className="text-sm mt-2 text-gray-700">Permit ID: <span className="font-mono">{permit.id}</span></p>
              <p className="text-sm text-gray-700">Submitted: {new Date(permit.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-700">Permit Fee</p>
              <p className="text-3xl font-bold text-orange-600">₱{permit.permitFee.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        {!isReturned && !isRejected && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Processing Timeline</h3>
            <div className="flex items-center justify-between">
              {statuses.map((status, index) => {
                const isComplete = index <= currentIndex
                const isCurrent = index === currentIndex
                
                return (
                  <div key={status.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        isComplete ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-400'
                      }`}>
                        {isComplete ? '✓' : index + 1}
                      </div>
                      <p className={`text-xs mt-2 font-medium ${isCurrent ? 'text-orange-600' : 'text-gray-600'}`}>
                        {status.label}
                      </p>
                    </div>
                    {index < statuses.length - 1 && (
                      <div className={`h-1 flex-1 ${isComplete ? 'bg-orange-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Payment Section */}
        {canSubmitPayment && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-blue-500">
            <h3 className="text-xl font-bold text-gray-900 mb-4">💳 Submit Payment</h3>
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm font-medium text-blue-900">Order of Payment: {permit.orderOfPayment}</p>
              <p className="text-sm text-blue-700 mt-1">Amount Due: ₱{permit.permitFee.toFixed(2)}</p>
              <p className="text-xs text-blue-600 mt-2">Please pay at the cemetery office and submit proof of payment below.</p>
            </div>

            <form onSubmit={handlePaymentSubmission}>
              {/* Toggle Payment Mode */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode("file")
                    setOrNumber("")
                    setProofFile(null)
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    uploadMode === "file"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Upload Proof of Payment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode("or")
                    setOrNumber("")
                    setProofFile(null)
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    uploadMode === "or"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Enter OR Number
                </button>
              </div>

              {uploadMode === "file" ? (
                <div key="file-upload" className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Receipt/Proof of Payment
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  />
                  {proofFile && (
                    <p className="text-sm text-green-600 mt-2">Selected: {proofFile.name}</p>
                  )}
                </div>
              ) : (
                <div key="or-input" className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Official Receipt (OR) Number
                  </label>
                  <input
                    type="text"
                    value={orNumber}
                    onChange={(e) => setOrNumber(e.target.value)}
                    placeholder="Enter OR number"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                {submitting ? "Submitting..." : "Submit Payment"}
              </button>
            </form>
          </div>
        )}

        {/* Remarks Section */}
        {permit.remarks && (
          <div className={`rounded-lg p-6 mb-6 ${
            isReturned ? 'bg-red-50 border-l-4 border-red-500' : 'bg-yellow-50 border-l-4 border-yellow-500'
          }`}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {isReturned ? '⚠️ Action Required' : 'ℹ️ Remarks'}
            </h3>
            <p className="text-gray-700">{permit.remarks}</p>
            {isReturned && (
              <Link href="/services/cemetery/exhumation-permit">
                <button className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Submit New Application
                </button>
              </Link>
            )}
          </div>
        )}

        {/* Deceased Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Deceased Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Full Name</p>
              <p className="font-medium text-gray-900">{permit.deceasedName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date of Death</p>
              <p className="font-medium text-gray-900">{new Date(permit.deceasedDateOfDeath).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date of Burial</p>
              <p className="font-medium text-gray-900">{new Date(permit.deceasedDateOfBurial).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Place of Burial</p>
              <p className="font-medium text-gray-900">{permit.deceasedPlaceOfBurial}</p>
            </div>
          </div>
        </div>

        {/* Requester Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Requester Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Full Name</p>
              <p className="font-medium text-gray-900">{permit.requesterName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Relation to Deceased</p>
              <p className="font-medium text-gray-900">{permit.requesterRelation}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Contact Number</p>
              <p className="font-medium text-gray-900">{permit.requesterContactNumber}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">Address</p>
              <p className="font-medium text-gray-900">{permit.requesterAddress}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">Reason for Exhumation</p>
              <p className="font-medium text-gray-900">{permit.reasonForExhumation}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
