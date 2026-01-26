"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type SubmissionType = 'death_registration' | 'burial_permit' | 'exhumation_permit'

interface BaseSubmission {
  id: string
  orderOfPayment: string
  proofOfPayment: string
  createdAt: string
  type: SubmissionType
  user: {
    name: string
    email: string
  }
}

interface DeathRegistrationSubmission extends BaseSubmission {
  type: 'death_registration'
  deceasedFirstName: string
  deceasedMiddleName: string | null
  deceasedLastName: string
  informantName: string
  informantContactNumber: string
  registrationType: string
  registrationFee: number
}

interface BurialPermitSubmission extends BaseSubmission {
  type: 'burial_permit'
  deceasedName: string
  requesterName: string
  requesterContactNumber: string
  burialType: string
  totalFee: number
  cemeteryLocation: string
}

interface ExhumationPermitSubmission extends BaseSubmission {
  type: 'exhumation_permit'
  deceasedName: string
  requesterName: string
  requesterContactNumber: string
  permitFee: number
  deceasedPlaceOfBurial: string
}

type PaymentSubmission = DeathRegistrationSubmission | BurialPermitSubmission | ExhumationPermitSubmission

export default function PaymentConfirmation() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      if (session?.user?.role !== "EMPLOYEE" && session?.user?.role !== "ADMIN") {
        router.push("/dashboard")
        return
      }
      fetchSubmissions()
    }
  }, [status, session, router])

  const fetchSubmissions = async () => {
    try {
      const response = await fetch("/api/cemetery/payment-confirmation")
      const data = await response.json()
      if (data.submissions) {
        setSubmissions(data.submissions)
      }
    } catch (error) {
      console.error("Error fetching submissions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmPayment = async (id: string, type: SubmissionType) => {
    if (!confirm("Are you sure you want to confirm this payment?")) return

    try {
      let endpoint = ""
      let body = {}
      
      if (type === 'death_registration') {
        endpoint = "/api/cemetery/confirm-payment"
        body = { registrationId: id }
      } else if (type === 'burial_permit') {
        endpoint = "/api/cemetery/burial-permit/confirm-payment"
        body = { permitId: id }
      } else if (type === 'exhumation_permit') {
        endpoint = "/api/cemetery/exhumation-permit/confirm-payment"
        body = { permitId: id }
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        alert("Payment confirmed successfully!")
        fetchSubmissions()
      } else {
        alert(data.error || "Confirmation failed")
      }
    } catch (error) {
      alert("An error occurred")
    }
  }

  const handleRejectPayment = async (id: string, type: SubmissionType) => {
    const reason = prompt("Enter rejection reason:")
    if (!reason || !reason.trim()) return

    try {
      let endpoint = ""
      let body = {}
      
      if (type === 'death_registration') {
        endpoint = "/api/cemetery/reject-payment"
        body = { registrationId: id, remarks: reason }
      } else if (type === 'burial_permit') {
        endpoint = "/api/cemetery/burial-permit/reject-payment"
        body = { permitId: id, remarks: reason }
      } else if (type === 'exhumation_permit') {
        endpoint = "/api/cemetery/exhumation-permit/reject-payment"
        body = { permitId: id, remarks: reason }
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        alert("Payment rejected. User will need to resubmit.")
        fetchSubmissions()
      } else {
        alert(data.error || "Rejection failed")
      }
    } catch (error) {
      alert("An error occurred")
    }
  }

  const viewProof = (proofPath: string) => {
    if (proofPath.startsWith("OR:")) {
      const orNumber = proofPath.substring(3)
      alert(`OR Number entered: ${orNumber}`)
      return
    }
    
    const encodedPath = encodeURIComponent(proofPath)
    window.open(`/api/cemetery/view-document?path=${encodedPath}`, "_blank")
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-orange-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/services/cemetery/employee-dashboard" className="text-sm text-orange-100 hover:text-white mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold">Payment Confirmation Queue</h1>
              <p className="text-orange-100 mt-1">Verify and confirm payment submissions from citizens</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-orange-100">Civil Registry Staff</p>
              <p className="font-semibold">{session?.user?.name}</p>
              <span className="inline-block mt-1 px-2 py-1 bg-orange-700 text-orange-100 text-xs font-medium rounded">
                {session?.user?.role || 'EMPLOYEE'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {submissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Pending Payments</h2>
            <p className="text-gray-600">All payment submissions have been processed.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {submissions.map((submission) => {
              const isORNumber = submission.proofOfPayment.startsWith("OR:")
              
              // Render different card based on type
              if (submission.type === 'death_registration') {
                const deathSub = submission as DeathRegistrationSubmission
                const deceasedName = `${deathSub.deceasedFirstName} ${deathSub.deceasedMiddleName || ''} ${deathSub.deceasedLastName}`.trim()
                
                return (
                  <div key={submission.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">Death Registration</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{deceasedName}</h3>
                        <p className="text-sm text-gray-600 mt-1">Submitted by: {submission.user.name}</p>
                        <p className="text-sm text-gray-600">Contact: {deathSub.informantContactNumber}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium block mb-2">
                          Payment Submitted
                        </span>
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium inline-block ${
                          deathSub.registrationType === "DELAYED" 
                            ? "bg-orange-100 text-orange-800" 
                            : "bg-green-100 text-green-800"
                        }`}>
                          {deathSub.registrationType === "DELAYED" ? "Delayed" : "Regular"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-xs text-blue-700">Order of Payment</p>
                        <p className="font-bold text-blue-900">{submission.orderOfPayment}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <p className="text-xs text-green-700">Amount</p>
                        <p className="font-bold text-green-900">₱{deathSub.registrationFee.toFixed(2)}</p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded">
                        <p className="text-xs text-purple-700">Submitted</p>
                        <p className="font-bold text-purple-900 text-sm">
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <p className="text-sm font-medium text-gray-700 mb-2">Payment Proof:</p>
                      {isORNumber ? (
                        <p className="text-lg font-bold text-gray-900">
                          OR: {submission.proofOfPayment.substring(3)}
                        </p>
                      ) : (
                        <button
                          onClick={() => viewProof(submission.proofOfPayment)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                        >
                          📄 View Payment Receipt
                        </button>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleConfirmPayment(submission.id, submission.type)}
                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                      >
                        ✅ Confirm Payment
                      </button>
                      <button
                        onClick={() => handleRejectPayment(submission.id, submission.type)}
                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                      >
                        ❌ Reject Payment
                      </button>
                    </div>
                  </div>
                )
              } else if (submission.type === 'burial_permit') {
                const burialSub = submission as BurialPermitSubmission
                
                return (
                  <div key={submission.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">Burial Permit</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">{burialSub.burialType}</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{burialSub.deceasedName}</h3>
                        <p className="text-sm text-gray-600 mt-1">Submitted by: {submission.user.name}</p>
                        <p className="text-sm text-gray-600">Contact: {burialSub.requesterContactNumber}</p>
                        <p className="text-sm text-gray-600">📍 {burialSub.cemeteryLocation}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium block">
                          Payment Submitted
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-xs text-blue-700">Order of Payment</p>
                        <p className="font-bold text-blue-900">{submission.orderOfPayment}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <p className="text-xs text-green-700">Total Fee</p>
                        <p className="font-bold text-green-900">₱{burialSub.totalFee.toFixed(2)}</p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded">
                        <p className="text-xs text-purple-700">Submitted</p>
                        <p className="font-bold text-purple-900 text-sm">
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <p className="text-sm font-medium text-gray-700 mb-2">Payment Proof:</p>
                      {isORNumber ? (
                        <p className="text-lg font-bold text-gray-900">
                          OR: {submission.proofOfPayment.substring(3)}
                        </p>
                      ) : (
                        <button
                          onClick={() => viewProof(submission.proofOfPayment)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                        >
                          📄 View Payment Receipt
                        </button>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleConfirmPayment(submission.id, submission.type)}
                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                      >
                        ✅ Confirm Payment
                      </button>
                      <button
                        onClick={() => handleRejectPayment(submission.id, submission.type)}
                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                      >
                        ❌ Reject Payment
                      </button>
                    </div>
                  </div>
                )
              } else {
                // Exhumation permit
                const exhumationSub = submission as ExhumationPermitSubmission
                
                return (
                  <div key={submission.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">Exhumation Permit</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{exhumationSub.deceasedName}</h3>
                        <p className="text-sm text-gray-600 mt-1">Submitted by: {submission.user.name}</p>
                        <p className="text-sm text-gray-600">Contact: {exhumationSub.requesterContactNumber}</p>
                        <p className="text-sm text-gray-600">📍 {exhumationSub.deceasedPlaceOfBurial}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium block">
                          Payment Submitted
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-xs text-blue-700">Order of Payment</p>
                        <p className="font-bold text-blue-900">{submission.orderOfPayment}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <p className="text-xs text-green-700">Permit Fee</p>
                        <p className="font-bold text-green-900">₱{exhumationSub.permitFee.toFixed(2)}</p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded">
                        <p className="text-xs text-purple-700">Submitted</p>
                        <p className="font-bold text-purple-900 text-sm">
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <p className="text-sm font-medium text-gray-700 mb-2">Payment Proof:</p>
                      {isORNumber ? (
                        <p className="text-lg font-bold text-gray-900">
                          OR: {submission.proofOfPayment.substring(3)}
                        </p>
                      ) : (
                        <button
                          onClick={() => viewProof(submission.proofOfPayment)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                        >
                          📄 View Payment Receipt
                        </button>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleConfirmPayment(submission.id, submission.type)}
                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                      >
                        ✅ Confirm Payment
                      </button>
                      <button
                        onClick={() => handleRejectPayment(submission.id, submission.type)}
                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                      >
                        ❌ Reject Payment
                      </button>
                    </div>
                  </div>
                )
              }
            })}
          </div>
        )}
      </div>
    </div>
  )
}
