"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import OnlinePaymentButton from "@/app/components/OnlinePaymentButton"

interface CremationPermit {
  id: string
  deceasedName: string
  deceasedDateOfDeath: string
  requesterName: string
  requesterRelation: string
  requesterContactNumber: string
  requesterAddress: string
  funeralHomeName: string | null
  funeralHomeContact: string | null
  permitFee: number
  status: string
  createdAt: string
  orderOfPayment: string | null
  submittedOrderNumber: string | null
  paymentProof: string | null
  verificationNotes: string | null
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

export default function CremationPermitSubmission() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [permit, setPermit] = useState<CremationPermit | null>(null)
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
      const response = await fetch(`/api/cemetery/cremation-permit/${params.id}`)
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

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (uploadMode === "file" && !proofFile) {
      alert("Please select a file to upload")
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
      
      if (uploadMode === "file" && proofFile) {
        formData.append("paymentProof", proofFile)
      } else if (uploadMode === "or") {
        formData.append("submittedOrderNumber", orNumber)
      }

      const response = await fetch("/api/cemetery/cremation-permit/submit-payment", {
        method: "POST",
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        alert("Payment submitted successfully!")
        fetchPermit() // Refresh the permit data
        setProofFile(null)
        setOrNumber("")
      } else {
        alert(data.error || "Failed to submit payment")
      }
    } catch (error) {
      console.error("Error submitting payment:", error)
      alert("An error occurred while submitting payment")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading permit details...</p>
        </div>
      </div>
    )
  }

  if (!permit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Permit Not Found</h2>
          <p className="mt-2 text-gray-600">The cremation permit you're looking for doesn't exist.</p>
          <Link
            href="/services/cemetery/my-submissions"
            className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Back to My Submissions
          </Link>
        </div>
      </div>
    )
  }

  const currentStatus = statusConfig[permit.status] || statusConfig.PENDING_VERIFICATION

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
              <h1 className="text-3xl font-bold">Cremation Permit Details</h1>
              <p className="text-green-100 mt-1">Track your cremation permit request</p>
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
        <div className={`rounded-lg p-6 mb-6 ${currentStatus.bgColor} border-l-4 border-green-600`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${currentStatus.color} flex items-center gap-2`}>
                <span>{currentStatus.icon}</span>
                {currentStatus.label}
              </h2>
              <p className="text-sm mt-2 text-gray-700">Permit ID: <span className="font-mono">{permit.id}</span></p>
              <p className="text-sm text-gray-700">Submitted: {new Date(permit.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
              {permit.verificationNotes && (
                <p className="text-sm text-gray-700 mt-2"><strong>Notes:</strong> {permit.verificationNotes}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-700">Permit Fee</p>
              <p className="text-3xl font-bold text-green-600">₱{permit.permitFee.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        {permit.status !== "RETURNED_FOR_CORRECTION" && permit.status !== "REJECTED" && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Processing Timeline</h3>
            <div className="flex items-center justify-between">
              {[
                { key: "PENDING_VERIFICATION", label: "Submitted" },
                { key: "APPROVED_FOR_PAYMENT", label: "Approved" },
                { key: "PAYMENT_SUBMITTED", label: "Payment" },
                { key: "REGISTERED_FOR_PICKUP", label: "Ready" },
                { key: "COMPLETED", label: "Completed" }
              ].map((status, index) => {
                const statuses = ["PENDING_VERIFICATION", "APPROVED_FOR_PAYMENT", "PAYMENT_SUBMITTED", "REGISTERED_FOR_PICKUP", "COMPLETED"]
                const currentIndex = statuses.indexOf(permit.status)
                const isComplete = index <= currentIndex
                const isCurrent = index === currentIndex
                
                return (
                  <div key={status.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        isComplete ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'
                      }`}>
                        {isComplete ? '✓' : index + 1}
                      </div>
                      <p className={`text-xs mt-2 font-medium ${isCurrent ? 'text-green-600' : 'text-gray-600'}`}>
                        {status.label}
                      </p>
                    </div>
                    {index < 4 && (
                      <div className={`h-1 flex-1 ${isComplete ? 'bg-green-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Permit Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Permit Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Deceased Information */}
            <div className="border-b md:border-b-0 md:border-r border-gray-200 pb-6 md:pb-0 md:pr-6">
              <h3 className="font-medium text-gray-900 mb-3">Deceased Information</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-600">Name</dt>
                  <dd className="text-sm font-medium text-gray-900">{permit.deceasedName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Date of Death</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {new Date(permit.deceasedDateOfDeath).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Requester Information */}
            <div className="pl-0 md:pl-6">
              <h3 className="font-medium text-gray-900 mb-3">Requester Information</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-600">Name</dt>
                  <dd className="text-sm font-medium text-gray-900">{permit.requesterName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Relation</dt>
                  <dd className="text-sm font-medium text-gray-900">{permit.requesterRelation}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Contact Number</dt>
                  <dd className="text-sm font-medium text-gray-900">{permit.requesterContactNumber}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Address</dt>
                  <dd className="text-sm font-medium text-gray-900">{permit.requesterAddress}</dd>
                </div>
              </dl>
            </div>
          </div>

          {(permit.funeralHomeName || permit.funeralHomeContact) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Funeral Home Information</h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permit.funeralHomeName && (
                  <div>
                    <dt className="text-sm text-gray-600">Name</dt>
                    <dd className="text-sm font-medium text-gray-900">{permit.funeralHomeName}</dd>
                  </div>
                )}
                {permit.funeralHomeContact && (
                  <div>
                    <dt className="text-sm text-gray-600">Contact</dt>
                    <dd className="text-sm font-medium text-gray-900">{permit.funeralHomeContact}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-600">Permit Fee</dt>
                <dd className="text-lg font-bold text-gray-900">₱{permit.permitFee.toFixed(2)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Submission Date</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {new Date(permit.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Online Payment Section */}
        {permit.status === "APPROVED_FOR_PAYMENT" && permit.orderOfPayment && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-md p-6 mb-6 border-2 border-green-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">💳 Pay Online</h3>
            <p className="text-sm text-gray-600 mb-4">
              Pay securely online using GCash, PayMaya, or other payment methods
            </p>
            <OnlinePaymentButton
              entityType="CremationPermit"
              entityId={permit.id}
              amount={permit.permitFee}
              deceasedName={permit.deceasedName}
              onPaymentInitiated={(transactionId) => {
                console.log('Payment initiated:', transactionId);
              }}
            />
            <div className="mt-4 pt-4 border-t border-gray-300">
              <p className="text-xs text-gray-500 text-center">
                Or pay at the office and submit proof below
              </p>
            </div>
          </div>
        )}

        {/* Payment Section */}
        {permit.status === "APPROVED_FOR_PAYMENT" && permit.orderOfPayment && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🏢 Submit Manual Payment</h2>
            
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Order of Payment:</strong> {permit.orderOfPayment}
              </p>
              <p className="text-sm text-blue-900 mt-2">
                <strong>Amount:</strong> ₱{permit.permitFee.toFixed(2)}
              </p>
              <p className="text-xs text-blue-700 mt-3">
                Please proceed to the City Treasurer's Office to make the payment, or submit your payment proof below.
              </p>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="flex space-x-4 mb-4">
                <button
                  type="button"
                  onClick={() => setUploadMode("file")}
                  className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                    uploadMode === "file"
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Upload Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode("or")}
                  className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                    uploadMode === "or"
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Enter OR Number
                </button>
              </div>

              {uploadMode === "file" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Payment Receipt
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {proofFile && (
                    <p className="mt-2 text-sm text-gray-600">Selected: {proofFile.name}</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Official Receipt (OR) Number
                  </label>
                  <input
                    type="text"
                    value={orNumber}
                    onChange={(e) => setOrNumber(e.target.value)}
                    placeholder="Enter OR number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || (uploadMode === "file" && !proofFile) || (uploadMode === "or" && !orNumber.trim())}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {submitting ? "Submitting..." : "Submit Payment"}
              </button>
            </form>
          </div>
        )}

        {/* Payment Submitted Status */}
        {permit.status === "PAYMENT_SUBMITTED" && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Status</h2>
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-900">
                Your payment has been submitted and is currently being verified by our staff.
              </p>
              {permit.submittedOrderNumber && (
                <p className="text-sm text-orange-900 mt-2">
                  <strong>Submitted OR Number:</strong> {permit.submittedOrderNumber}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Ready for Pickup */}
        {permit.status === "REGISTERED_FOR_PICKUP" && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Permit Ready</h2>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-900">
                Your cremation permit is ready for pickup at the Cemetery Services Office.
              </p>
              <p className="text-sm text-green-900 mt-2">
                Please bring a valid ID and this reference number: <strong>{permit.id.slice(0, 8).toUpperCase()}</strong>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
