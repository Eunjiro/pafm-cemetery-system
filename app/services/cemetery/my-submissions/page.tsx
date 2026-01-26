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
  registrationFee?: number
}

interface BurialPermit {
  id: string
  deceasedName: string
  burialType: string
  nicheType: string | null
  status: string
  createdAt: string
  orderOfPayment: string | null
  totalFee: number
  cemeteryLocation: string
}

interface ExhumationPermit {
  id: string
  deceasedName: string
  deceasedPlaceOfBurial: string
  status: string
  createdAt: string
  orderOfPayment: string | null
  permitFee: number
  reasonForExhumation: string
}

type Submission = {
  type: 'death_registration' | 'burial_permit' | 'exhumation_permit'
  data: DeathRegistration | BurialPermit | ExhumationPermit
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING_VERIFICATION: { label: "Pending Verification", color: "text-yellow-700", bgColor: "bg-yellow-100" },
  RETURNED_FOR_CORRECTION: { label: "Returned for Correction", color: "text-red-700", bgColor: "bg-red-100" },
  APPROVED_FOR_PAYMENT: { label: "Approved - Awaiting Payment", color: "text-blue-700", bgColor: "bg-blue-100" },
  PAYMENT_SUBMITTED: { label: "Payment Submitted", color: "text-orange-700", bgColor: "bg-purple-100" },
  PAYMENT_CONFIRMED: { label: "Payment Confirmed", color: "text-green-700", bgColor: "bg-green-100" },
  REGISTERED_FOR_PICKUP: { label: "Ready for Pickup", color: "text-green-700", bgColor: "bg-green-100" },
  COMPLETED: { label: "Completed", color: "text-gray-700", bgColor: "bg-gray-100" },
  REJECTED: { label: "Rejected", color: "text-red-700", bgColor: "bg-red-100" },
}

export default function MySubmissions() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'death' | 'burial' | 'exhumation'>('all')

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
      fetchSubmissions()
    }
  }, [status, router])

  const fetchSubmissions = async () => {
    try {
      // Fetch death registrations
      const deathResponse = await fetch("/api/cemetery/death-registration")
      const deathData = await deathResponse.json()
      const deathRegistrations = (deathData.registrations || []).map((reg: DeathRegistration) => ({
        type: 'death_registration' as const,
        data: reg
      }))

      // Fetch burial permits
      const burialResponse = await fetch("/api/cemetery/burial-permit")
      const burialData = await burialResponse.json()
      const burialPermits = (burialData.permits || []).map((permit: BurialPermit) => ({
        type: 'burial_permit' as const,
        data: permit
      }))

      // Fetch exhumation permits
      const exhumationResponse = await fetch("/api/cemetery/exhumation-permit")
      const exhumationData = await exhumationResponse.json()
      const exhumationPermits = (exhumationData.permits || []).map((permit: ExhumationPermit) => ({
        type: 'exhumation_permit' as const,
        data: permit
      }))

      // Combine and sort by date
      const allSubmissions = [...deathRegistrations, ...burialPermits, ...exhumationPermits].sort((a, b) => {
        return new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime()
      })

      setSubmissions(allSubmissions)
    } catch (error) {
      console.error("Error fetching submissions:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSubmissions = submissions.filter(sub => {
    if (activeTab === 'all') return true
    if (activeTab === 'death') return sub.type === 'death_registration'
    if (activeTab === 'burial') return sub.type === 'burial_permit'
    if (activeTab === 'exhumation') return sub.type === 'exhumation_permit'
    return true
  })

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
          <h1 className="text-3xl font-bold text-gray-900 mt-4">My Submissions</h1>
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

        {/* Action Buttons */}
        <div className="mb-6 flex gap-3">
          <Link href="/services/cemetery/death-registration">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Death Registration
            </button>
          </Link>
          <Link href="/services/cemetery/burial-permit">
            <button className="px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Burial Permit
            </button>
          </Link>
          <Link href="/services/cemetery/exhumation-permit">
            <button className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Exhumation Permit
            </button>
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-4 border-b-2 font-medium transition-colors ${
                activeTab === 'all'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              All Submissions ({submissions.length})
            </button>
            <button
              onClick={() => setActiveTab('death')}
              className={`pb-4 border-b-2 font-medium transition-colors ${
                activeTab === 'death'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Death Registrations ({submissions.filter(s => s.type === 'death_registration').length})
            </button>
            <button
              onClick={() => setActiveTab('burial')}
              className={`pb-4 border-b-2 font-medium transition-colors ${
                activeTab === 'burial'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Burial Permits ({submissions.filter(s => s.type === 'burial_permit').length})
            </button>
            <button
              onClick={() => setActiveTab('exhumation')}
              className={`pb-4 border-b-2 font-medium transition-colors ${
                activeTab === 'exhumation'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Exhumation Permits ({submissions.filter(s => s.type === 'exhumation_permit').length})
            </button>
          </nav>
        </div>

        {/* Submissions List */}
        {filteredSubmissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-900 mb-2 mt-4">No submissions yet</h3>
            <p className="text-gray-600 mb-6">You haven't submitted any applications.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/services/cemetery/death-registration">
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Submit Death Registration
                </button>
              </Link>
              <Link href="/services/cemetery/burial-permit">
                <button className="px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors">
                  Request Burial Permit
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => {
              const statusInfo = statusConfig[submission.data.status] || statusConfig.PENDING_VERIFICATION
              
              if (submission.type === 'death_registration') {
                const reg = submission.data as DeathRegistration
                const deceasedFullName = `${reg.deceasedFirstName} ${reg.deceasedMiddleName || ''} ${reg.deceasedLastName}`.trim()
                
                return (
                  <div key={`death-${reg.id}`} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                            Death Registration
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{deceasedFullName}</h3>
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
                            <p className="text-sm text-blue-700">Amount: ₱{reg.registrationFee?.toFixed(2) || '50.00'}</p>
                          </div>
                        )}
                      </div>
                      
                      <Link href={`/services/cemetery/submission/${reg.id}`}>
                        <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                          View Details
                        </button>
                      </Link>
                    </div>
                  </div>
                )
              } else if (submission.type === 'burial_permit') {
                const permit = submission.data as BurialPermit
                
                return (
                  <div key={`burial-${permit.id}`} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-orange-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                            Burial Permit
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{permit.deceasedName}</h3>
                        <div className="flex items-center gap-4 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            permit.burialType === 'BURIAL' ? 'bg-green-100 text-green-700' :
                            permit.burialType === 'ENTRANCE' ? 'bg-blue-100 text-blue-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {permit.burialType}
                            {permit.burialType === 'NICHE' && permit.nicheType && ` (${permit.nicheType})`}
                          </span>
                          <span className="text-sm text-gray-600">📍 {permit.cemeteryLocation}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          Permit ID: <span className="font-mono">{permit.id}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Submitted: {new Date(permit.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        
                        {permit.orderOfPayment && (
                          <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                            <p className="text-sm font-medium text-orange-900">Order of Payment: {permit.orderOfPayment}</p>
                            <p className="text-sm text-orange-700">Amount: ₱{permit.totalFee.toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                      
                      <Link href={`/services/cemetery/burial-permit-submission/${permit.id}`}>
                        <button className="px-4 py-2 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors">
                          View Details
                        </button>
                      </Link>
                    </div>
                  </div>
                )
              } else if (submission.type === 'exhumation_permit') {
                const permit = submission.data as ExhumationPermit
                
                return (
                  <div key={`exhumation-${permit.id}`} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-orange-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                            Exhumation Permit
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{permit.deceasedName}</h3>
                        <p className="text-sm text-gray-600 mb-1">📍 Burial Site: {permit.deceasedPlaceOfBurial}</p>
                        <p className="text-sm text-gray-600 mb-1">
                          Permit ID: <span className="font-mono">{permit.id}</span>
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          Submitted: {new Date(permit.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-sm text-gray-600 italic">"{permit.reasonForExhumation.substring(0, 100)}{permit.reasonForExhumation.length > 100 ? '...' : ''}"</p>
                        
                        {permit.orderOfPayment && (
                          <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                            <p className="text-sm font-medium text-orange-900">Order of Payment: {permit.orderOfPayment}</p>
                            <p className="text-sm text-orange-700">Amount: ₱{permit.permitFee.toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                      
                      <Link href={`/services/cemetery/exhumation-permit-submission/${permit.id}`}>
                        <button className="px-4 py-2 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors">
                          View Details
                        </button>
                      </Link>
                    </div>
                  </div>
                )
              }
              
              return null
            })}
          </div>
        )}
      </div>
    </div>
  )
}
