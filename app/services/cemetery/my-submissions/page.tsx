"use client"

import { useEffect, useState, Suspense } from "react"
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

interface CremationPermit {
  id: string
  deceasedName: string
  requesterName: string
  status: string
  createdAt: string
  orderOfPayment: string | null
  permitFee: number
}

interface DeathCertificateRequest {
  id: string
  deceasedFullName: string
  requesterName: string
  numberOfCopies: number
  status: string
  createdAt: string
  orderOfPayment: string | null
  totalFee: number
}

type Submission = {
  type: 'death_registration' | 'burial_permit' | 'exhumation_permit' | 'cremation_permit' | 'death_certificate'
  data: DeathRegistration | BurialPermit | ExhumationPermit | CremationPermit | DeathCertificateRequest
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING_VERIFICATION: { label: "Pending Verification", color: "text-green-700", bgColor: "bg-green-100" },
  RETURNED_FOR_CORRECTION: { label: "Returned for Correction", color: "text-red-700", bgColor: "bg-red-100" },
  APPROVED_FOR_PAYMENT: { label: "Approved - Awaiting Payment", color: "text-blue-700", bgColor: "bg-blue-100" },
  PAYMENT_SUBMITTED: { label: "Payment Submitted", color: "text-orange-700", bgColor: "bg-purple-100" },
  PAYMENT_CONFIRMED: { label: "Payment Confirmed", color: "text-green-700", bgColor: "bg-green-100" },
  REGISTERED_FOR_PICKUP: { label: "Ready for Pickup", color: "text-green-700", bgColor: "bg-green-100" },
  COMPLETED: { label: "Completed", color: "text-gray-700", bgColor: "bg-gray-100" },
  REJECTED: { label: "Rejected", color: "text-red-700", bgColor: "bg-red-100" },
}

function MySubmissionsContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'death' | 'burial' | 'exhumation' | 'cremation' | 'certificate'>('all')

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

      // Fetch cremation permits
      const cremationResponse = await fetch("/api/cemetery/cremation-permit")
      const cremationData = await cremationResponse.json()
      const cremationPermits = (cremationData.permits || []).map((permit: CremationPermit) => ({
        type: 'cremation_permit' as const,
        data: permit
      }))

      // Fetch death certificate requests
      const certificateResponse = await fetch("/api/cemetery/death-certificate-request")
      const certificateData = await certificateResponse.json()
      const certificateRequests = (certificateData.requests || []).map((request: DeathCertificateRequest) => ({
        type: 'death_certificate' as const,
        data: request
      }))

      // Combine and sort by date
      const allSubmissions = [...deathRegistrations, ...burialPermits, ...exhumationPermits, ...cremationPermits, ...certificateRequests].sort((a, b) => {
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
    if (activeTab === 'cremation') return sub.type === 'cremation_permit'
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/services/cemetery" className="text-sm text-green-100 hover:text-white mb-2 inline-block">
                ← Back to Cemetery Services
              </Link>
              <h1 className="text-3xl font-bold">My Submissions</h1>
              <p className="text-green-100 mt-1">Track the status of your applications</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-100">Welcome</p>
              <p className="font-semibold">{session?.user?.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Alert */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Application submitted successfully! You will receive updates via your registered contact number.
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Link href="/services/cemetery/death-registration">
              <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex flex-col items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm">Death Registration</span>
              </button>
            </Link>
            <Link href="/services/cemetery/burial-permit">
              <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex flex-col items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span className="text-sm">Burial Permit</span>
              </button>
            </Link>
            <Link href="/services/cemetery/exhumation-permit">
              <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex flex-col items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span className="text-sm">Exhumation Permit</span>
              </button>
            </Link>
            <Link href="/services/cemetery/cremation-permit">
              <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex flex-col items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
                <span className="text-sm">Cremation Permit</span>
              </button>
            </Link>
            <Link href="/services/cemetery/death-certificate-request">
              <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex flex-col items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm">Death Certificate</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({submissions.length})
              </button>
              <button
                onClick={() => setActiveTab('death')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'death'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Death ({submissions.filter(s => s.type === 'death_registration').length})
              </button>
              <button
                onClick={() => setActiveTab('burial')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'burial'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Burial ({submissions.filter(s => s.type === 'burial_permit').length})
              </button>
              <button
                onClick={() => setActiveTab('exhumation')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'exhumation'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Exhumation ({submissions.filter(s => s.type === 'exhumation_permit').length})
              </button>
              <button
                onClick={() => setActiveTab('cremation')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'cremation'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cremation ({submissions.filter(s => s.type === 'cremation_permit').length})
              </button>
              <button
                onClick={() => setActiveTab('certificate')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'certificate'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Certificate ({submissions.filter(s => s.type === 'death_certificate').length})
              </button>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        {filteredSubmissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-900 mb-2 mt-4">No submissions yet</h3>
            <p className="text-gray-600 mb-6">You haven't submitted any applications.</p>
            <Link href="/services/cemetery/user-dashboard">
              <button className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
                Go to Services
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => {
              const statusInfo = statusConfig[submission.data.status] || statusConfig.PENDING_VERIFICATION
              
              if (submission.type === 'death_registration') {
                const reg = submission.data as DeathRegistration
                const deceasedFullName = `${reg.deceasedFirstName} ${reg.deceasedMiddleName || ''} ${reg.deceasedLastName}`.trim()
                
                return (
                  <div key={`death-${reg.id}`} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
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
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <p className="text-sm font-medium text-green-900">Order of Payment: {reg.orderOfPayment}</p>
                            <p className="text-sm text-green-700">Amount: ₱{reg.registrationFee?.toFixed(2) || '50.00'}</p>
                          </div>
                        )}
                      </div>
                      
                      <Link href={`/services/cemetery/death-registration-submission/${reg.id}`}>
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                          View Details
                        </button>
                      </Link>
                    </div>
                  </div>
                )
              } else if (submission.type === 'burial_permit') {
                const permit = submission.data as BurialPermit
                
                return (
                  <div key={`burial-${permit.id}`} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
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
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <p className="text-sm font-medium text-green-900">Order of Payment: {permit.orderOfPayment}</p>
                            <p className="text-sm text-green-700">Amount: ₱{permit.totalFee.toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                      
                      <Link href={`/services/cemetery/burial-permit-submission/${permit.id}`}>
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                          View Details
                        </button>
                      </Link>
                    </div>
                  </div>
                )
              } else if (submission.type === 'exhumation_permit') {
                const permit = submission.data as ExhumationPermit
                
                return (
                  <div key={`exhumation-${permit.id}`} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
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
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <p className="text-sm font-medium text-green-900">Order of Payment: {permit.orderOfPayment}</p>
                            <p className="text-sm text-green-700">Amount: ₱{permit.permitFee.toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                      
                      <Link href={`/services/cemetery/exhumation-permit-submission/${permit.id}`}>
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                          View Details
                        </button>
                      </Link>
                    </div>
                  </div>
                )
              } else if (submission.type === 'cremation_permit') {
                const permit = submission.data as CremationPermit
                
                return (
                  <div key={`cremation-${permit.id}`} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            Cremation Permit
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{permit.deceasedName}</h3>
                        <p className="text-sm text-gray-600 mb-1">👤 Requester: {permit.requesterName}</p>
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
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <p className="text-sm font-medium text-green-900">Order of Payment: {permit.orderOfPayment}</p>
                            <p className="text-sm text-green-700">Amount: ₱{permit.permitFee.toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                      
                      <Link href={`/services/cemetery/cremation-permit-submission/${permit.id}`}>
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                          View Details
                        </button>
                      </Link>
                    </div>
                  </div>
                )
              } else if (submission.type === 'death_certificate') {
                const request = submission.data as DeathCertificateRequest
                
                return (
                  <div key={`certificate-${request.id}`} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                            Death Certificate Request
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{request.deceasedFullName}</h3>
                        <p className="text-sm text-gray-600 mb-1">👤 Requester: {request.requesterName}</p>
                        <p className="text-sm text-gray-600 mb-1">📄 Copies: {request.numberOfCopies}</p>
                        <p className="text-sm text-gray-600 mb-1">
                          Request ID: <span className="font-mono">{request.id}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Submitted: {new Date(request.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        
                        {request.orderOfPayment && (
                          <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                            <p className="text-sm font-medium text-yellow-900">Order of Payment: {request.orderOfPayment}</p>
                            <p className="text-sm text-yellow-700">Amount: ₱{request.totalFee.toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                      
                      <Link href={`/services/cemetery/death-certificate-request-submission/${request.id}`}>
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
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

export default function MySubmissions() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <MySubmissionsContent />
    </Suspense>
  )
}
