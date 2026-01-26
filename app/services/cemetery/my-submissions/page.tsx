"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

interface DeathRegistration {
  id: string
  deceasedFirstName: string
  deceasedMiddleName: string | null
  deceasedLastName: string
  status: string
  createdAt: string
  orderOfPayment: string | null
  paymentConfirmed: boolean
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

export default function MySubmissions() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [registrations, setRegistrations] = useState<DeathRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
    }
  }, [searchParams])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      fetchRegistrations()
    }
  }, [status, router])

  const fetchRegistrations = async () => {
    try {
      const response = await fetch("/api/cemetery/death-registration")
      const data = await response.json()
      setRegistrations(data.registrations || [])
    } catch (error) {
      console.error("Error fetching registrations:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your submissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/services/cemetery" className="text-green-600 hover:text-green-700 text-sm font-medium">
            ← Back to Cemetery Services
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">My Death Registration Submissions</h1>
          <p className="text-gray-600 mt-2">Track the status of your applications</p>
        </div>

        {/* Success Alert */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Application submitted successfully! You will receive updates via your registered contact number.
          </div>
        )}

        {/* New Application Button */}
        <div className="mb-6">
          <Link href="/services/cemetery/death-registration">
            <button className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
              + New Death Registration
            </button>
          </Link>
        </div>

        {/* Submissions List */}
        {registrations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No submissions yet</h3>
            <p className="text-gray-600 mb-6">You haven't submitted any death registration applications.</p>
            <Link href="/services/cemetery/death-registration">
              <button className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
                Submit Your First Application
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.map((reg) => {
              const statusInfo = statusConfig[reg.status] || statusConfig.PENDING_VERIFICATION
              const deceasedFullName = `${reg.deceasedFirstName} ${reg.deceasedMiddleName || ''} ${reg.deceasedLastName}`.trim()
              
              return (
                <div key={reg.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{deceasedFullName}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Application ID: <span className="font-mono">{reg.id}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Submitted: {new Date(reg.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      
                      {reg.orderOfPayment && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-blue-900">Order of Payment: {reg.orderOfPayment}</p>
                          <p className="text-sm text-blue-700">Amount: ₱50.00</p>
                        </div>
                      )}
                    </div>
                    
                    <Link href={`/services/cemetery/submission/${reg.id}`}>
                      <button className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors">
                        View Details
                      </button>
                    </Link>
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
