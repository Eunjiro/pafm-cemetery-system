"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import OnlinePaymentButton from "@/app/components/OnlinePaymentButton"

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
  registrationType: string
  registrationFee: number
  status: string
  orderOfPayment: string | null
  proofOfPayment: string | null
  paymentConfirmed: boolean
  remarks: string | null
  createdAt: string
  processedBy: string | null
  processedAt: string | null
  processingDeadline: string | null
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

export default function DeathRegistrationSubmission() {
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
    } else if (status === "authenticated" && params.id) {
      fetchRegistration()
    }
  }, [status, params.id, router])

  const fetchRegistration = async () => {
    try {
      const response = await fetch(`/api/cemetery/submission/${params.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setRegistration(data.registration)
      } else {
        console.error("Failed to fetch registration:", data.error)
      }
    } catch (error) {
      console.error("Error fetching registration:", error)
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
      formData.append("registrationId", registration!.id)
      
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
        alert("Payment submitted successfully!")
        fetchRegistration()
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
          <p className="mt-4 text-gray-600">Loading registration details...</p>
        </div>
      </div>
    )
  }

  if (!registration) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Not Found</h2>
          <p className="text-gray-600 mb-6">The death registration you're looking for doesn't exist or you don't have access to it.</p>
          <Link href="/services/cemetery/my-submissions">
            <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Back to My Submissions
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const statusInfo = statusConfig[registration.status] || statusConfig.PENDING_VERIFICATION
  const canSubmitPayment = registration.status === "APPROVED_FOR_PAYMENT" && registration.orderOfPayment && !registration.proofOfPayment
  const deceasedFullName = `${registration.deceasedFirstName} ${registration.deceasedMiddleName || ''} ${registration.deceasedLastName}`.trim()

  // Status timeline
  const statuses = [
    { key: "PENDING_VERIFICATION", label: "Submitted" },
    { key: "APPROVED_FOR_PAYMENT", label: "Approved" },
    { key: "PAYMENT_SUBMITTED", label: "Payment" },
    { key: "REGISTERED_FOR_PICKUP", label: "Ready" },
    { key: "COMPLETED", label: "Completed" }
  ]
  
  const currentIndex = statuses.findIndex(s => s.key === registration.status)
  const isReturned = registration.status === "RETURNED_FOR_CORRECTION"
  const isRejected = registration.status === "REJECTED"

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
              <h1 className="text-3xl font-bold">Death Registration Details</h1>
              <p className="text-green-100 mt-1">Track your death registration request</p>
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
              <p className="text-sm mt-2 text-gray-700">Registration ID: <span className="font-mono">{registration.id}</span></p>
              <p className="text-sm text-gray-700">Submitted: {new Date(registration.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
              {registration.registrationType === "DELAYED" && registration.processingDeadline && (
                <p className="text-sm text-gray-700">Processing Deadline: {new Date(registration.processingDeadline).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric'
                })}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-700">Registration Fee</p>
              <p className="text-3xl font-bold text-green-600">₱{registration.registrationFee.toFixed(2)}</p>
              {registration.registrationType === "DELAYED" && (
                <p className="text-xs text-green-600 mt-1">Delayed Registration</p>
              )}
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
                        isComplete ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'
                      }`}>
                        {isComplete ? '✓' : index + 1}
                      </div>
                      <p className={`text-xs mt-2 font-medium ${isCurrent ? 'text-green-600' : 'text-gray-600'}`}>
                        {status.label}
                      </p>
                    </div>
                    {index < statuses.length - 1 && (
                      <div className={`h-1 flex-1 ${isComplete ? 'bg-green-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Online Payment Section */}
        {canSubmitPayment && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-md p-6 mb-6 border-2 border-green-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">💳 Pay Online</h3>
            <p className="text-sm text-gray-600 mb-4">
              Pay securely online using GCash, PayMaya, or other payment methods
            </p>
            <OnlinePaymentButton
              entityType="DeathRegistration"
              entityId={registration.id}
              amount={registration.registrationFee}
              deceasedName={deceasedFullName}
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
        {canSubmitPayment && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-blue-500">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🏢 Submit Manual Payment</h3>
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm font-medium text-blue-900">Order of Payment: {registration.orderOfPayment}</p>
              <p className="text-sm text-blue-700 mt-1">Amount Due: ₱{registration.registrationFee.toFixed(2)}</p>
              <p className="text-xs text-blue-600 mt-2">Please pay at the civil registry office and submit proof of payment below.</p>
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
        {registration.remarks && (
          <div className={`rounded-lg p-6 mb-6 ${
            isReturned ? 'bg-red-50 border-l-4 border-red-500' : 'bg-green-50 border-l-4 border-green-500'
          }`}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {isReturned ? '⚠️ Action Required' : 'ℹ️ Remarks'}
            </h3>
            <p className="text-gray-700">{registration.remarks}</p>
            {isReturned && (
              <Link href="/services/cemetery/death-registration">
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
              <p className="font-medium text-gray-900">{deceasedFullName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gender</p>
              <p className="font-medium text-gray-900">{registration.deceasedGender}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date of Birth</p>
              <p className="font-medium text-gray-900">{new Date(registration.deceasedDateOfBirth).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date of Death</p>
              <p className="font-medium text-gray-900">{new Date(registration.deceasedDateOfDeath).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Place of Death</p>
              <p className="font-medium text-gray-900">{registration.deceasedPlaceOfDeath}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Cause of Death</p>
              <p className="font-medium text-gray-900">{registration.deceasedCauseOfDeath}</p>
            </div>
          </div>
        </div>

        {/* Informant Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Informant Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Full Name</p>
              <p className="font-medium text-gray-900">{registration.informantName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Relation to Deceased</p>
              <p className="font-medium text-gray-900">{registration.informantRelation}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Contact Number</p>
              <p className="font-medium text-gray-900">{registration.informantContactNumber}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">Address</p>
              <p className="font-medium text-gray-900">{registration.informantAddress}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
