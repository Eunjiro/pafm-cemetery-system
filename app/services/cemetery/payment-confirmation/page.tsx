"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface PaymentSubmission {
  id: string
  deceasedFirstName: string
  deceasedMiddleName: string | null
  deceasedLastName: string
  orderOfPayment: string
  proofOfPayment: string
  informantName: string
  informantContactNumber: string
  createdAt: string
  user: {
    name: string
    email: string
  }
}

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

  const handleConfirmPayment = async (id: string) => {
    if (!confirm("Are you sure you want to confirm this payment?")) return

    try {
      const response = await fetch("/api/cemetery/confirm-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: id })
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

  const handleRejectPayment = async (id: string) => {
    const reason = prompt("Enter rejection reason:")
    if (!reason || !reason.trim()) return

    try {
      const response = await fetch("/api/cemetery/reject-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: id, remarks: reason })
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/services/cemetery/employee-dashboard" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Payment Confirmation Queue</h1>
          <p className="text-gray-600 mt-2">Verify and confirm payment submissions from citizens</p>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Pending Payments</h2>
            <p className="text-gray-600">All payment submissions have been processed.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {submissions.map((submission) => {
              const deceasedName = `${submission.deceasedFirstName} ${submission.deceasedMiddleName || ''} ${submission.deceasedLastName}`.trim()
              const isORNumber = submission.proofOfPayment.startsWith("OR:")
              
              return (
                <div key={submission.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{deceasedName}</h3>
                      <p className="text-sm text-gray-600 mt-1">Submitted by: {submission.user.name} ({submission.user.email})</p>
                      <p className="text-sm text-gray-600">Contact: {submission.informantContactNumber}</p>
                    </div>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                      Payment Submitted
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-xs text-blue-700">Order of Payment</p>
                      <p className="font-bold text-blue-900">{submission.orderOfPayment}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <p className="text-xs text-green-700">Amount</p>
                      <p className="font-bold text-green-900">₱50.00</p>
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
                        {submission.proofOfPayment.substring(3)}
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
                      onClick={() => handleConfirmPayment(submission.id)}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                    >
                      ✅ Confirm Payment
                    </button>
                    <button
                      onClick={() => handleRejectPayment(submission.id)}
                      className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                    >
                      ❌ Reject Payment
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
