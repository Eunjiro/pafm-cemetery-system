"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useDialog } from "@/app/components/DialogProvider"

type SubmissionType = "DEATH_REGISTRATION" | "BURIAL_PERMIT" | "CREMATION_PERMIT" | "EXHUMATION_PERMIT" | "DEATH_CERTIFICATE"

interface Submission {
  id: string
  type: SubmissionType
  typeLabel: string
  deceasedName: string
  applicantName: string
  status: string
  orderOfPayment: string | null
  fee: number
  registrationType: string | null
  processingDeadline: string | null
  createdAt: string
  user: {
    name: string
    email: string
  }
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

const typeColors: Record<SubmissionType, { bg: string; text: string }> = {
  DEATH_REGISTRATION: { bg: "bg-gray-100", text: "text-gray-800" },
  BURIAL_PERMIT: { bg: "bg-amber-100", text: "text-amber-800" },
  CREMATION_PERMIT: { bg: "bg-orange-100", text: "text-orange-800" },
  EXHUMATION_PERMIT: { bg: "bg-rose-100", text: "text-rose-800" },
  DEATH_CERTIFICATE: { bg: "bg-indigo-100", text: "text-indigo-800" },
}

function getDetailLink(submission: Submission): string {
  switch (submission.type) {
    case "DEATH_REGISTRATION":
      return `/services/cemetery/verification/${submission.id}`
    case "BURIAL_PERMIT":
      return `/services/cemetery/burial-permits/verification/${submission.id}`
    case "CREMATION_PERMIT":
      return `/services/cemetery/cremation-permits/verification/${submission.id}`
    case "EXHUMATION_PERMIT":
      return `/services/cemetery/exhumation-permits/verification/${submission.id}`
    case "DEATH_CERTIFICATE":
      return `/services/cemetery/certificate-requests/verification/${submission.id}`
    default:
      return "#"
  }
}

export default function AllRegistrations() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const dialog = useDialog()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

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
      const response = await fetch("/api/cemetery/all-registrations")
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

  const filteredSubmissions = submissions.filter(sub => {
    const matchesStatus = filterStatus === "all" || sub.status === filterStatus
    const matchesType = filterType === "all" || sub.type === filterType
    const matchesSearch = searchTerm === "" || 
      sub.deceasedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.orderOfPayment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.typeLabel.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesType && matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading all submissions...</p>
        </div>
      </div>
    )
  }

  const stats = {
    total: submissions.length,
    deathRegistrations: submissions.filter(s => s.type === "DEATH_REGISTRATION").length,
    burialPermits: submissions.filter(s => s.type === "BURIAL_PERMIT").length,
    cremationPermits: submissions.filter(s => s.type === "CREMATION_PERMIT").length,
    exhumationPermits: submissions.filter(s => s.type === "EXHUMATION_PERMIT").length,
    certificateRequests: submissions.filter(s => s.type === "DEATH_CERTIFICATE").length,
    pending: submissions.filter(s => s.status === 'PENDING_VERIFICATION').length,
    completed: submissions.filter(s => s.status === 'COMPLETED' || s.status === 'REGISTERED_FOR_PICKUP').length,
  }

  const dashboardUrl = session?.user?.role === "ADMIN" 
    ? "/services/cemetery/admin-dashboard" 
    : "/services/cemetery/employee-dashboard"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href={dashboardUrl} className="text-sm text-green-100 hover:text-white mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold">All Cemetery Submissions</h1>
              <p className="text-green-100 mt-1">Complete list of all submitted applications across all services</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-100">
                {session?.user?.role === "ADMIN" ? "System Administrator" : "Civil Registry Staff"}
              </p>
              <p className="font-semibold">{session?.user?.name}</p>
              <span className="inline-block mt-1 px-2 py-1 bg-green-700 text-green-100 text-xs font-medium rounded">
                {session?.user?.role || 'EMPLOYEE'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Type Breakdown Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
            <p className="text-xs text-gray-500 uppercase font-medium">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-gray-400">
            <p className="text-xs text-gray-500 uppercase font-medium">Death Reg.</p>
            <p className="text-2xl font-bold text-gray-800">{stats.deathRegistrations}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-amber-400">
            <p className="text-xs text-gray-500 uppercase font-medium">Burial</p>
            <p className="text-2xl font-bold text-amber-700">{stats.burialPermits}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-400">
            <p className="text-xs text-gray-500 uppercase font-medium">Cremation</p>
            <p className="text-2xl font-bold text-orange-700">{stats.cremationPermits}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-rose-400">
            <p className="text-xs text-gray-500 uppercase font-medium">Exhumation</p>
            <p className="text-2xl font-bold text-rose-700">{stats.exhumationPermits}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-indigo-400">
            <p className="text-xs text-gray-500 uppercase font-medium">Certificate</p>
            <p className="text-2xl font-bold text-indigo-700">{stats.certificateRequests}</p>
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-md p-4">
            <p className="text-sm text-green-100">Total Submissions</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg shadow-md p-4">
            <p className="text-sm text-yellow-100">Pending Review</p>
            <p className="text-3xl font-bold">{stats.pending}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-lg shadow-md p-4">
            <p className="text-sm text-emerald-100">Completed / Ready</p>
            <p className="text-3xl font-bold">{stats.completed}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, type, or OR number..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              >
                <option value="all">All Types</option>
                <option value="DEATH_REGISTRATION">Death Registration</option>
                <option value="BURIAL_PERMIT">Burial Permit</option>
                <option value="CREMATION_PERMIT">Cremation Permit</option>
                <option value="EXHUMATION_PERMIT">Exhumation Permit</option>
                <option value="DEATH_CERTIFICATE">Death Certificate Request</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              >
                <option value="all">All Statuses</option>
                <option value="PENDING_VERIFICATION">Pending Verification</option>
                <option value="APPROVED_FOR_PAYMENT">Approved - Awaiting Payment</option>
                <option value="PAYMENT_SUBMITTED">Payment Submitted</option>
                <option value="PAYMENT_CONFIRMED">Payment Confirmed</option>
                <option value="REGISTERED_FOR_PICKUP">Ready for Pickup</option>
                <option value="COMPLETED">Completed</option>
                <option value="RETURNED_FOR_CORRECTION">Returned for Correction</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Submissions Found</h3>
              <p className="text-gray-600">No submissions match your search criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deceased / Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      OR Number / Fee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubmissions.map((sub) => {
                    const statusInfo = statusConfig[sub.status] || statusConfig.PENDING_VERIFICATION
                    const typeColor = typeColors[sub.type] || typeColors.DEATH_REGISTRATION
                    
                    return (
                      <tr key={`${sub.type}-${sub.id}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{sub.deceasedName}</div>
                          <div className="text-xs text-gray-500 font-mono">{sub.id.substring(0, 8)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${typeColor.bg} ${typeColor.text}`}>
                            {sub.typeLabel}
                          </span>
                          {sub.registrationType === "DELAYED" && (
                            <div className="text-xs text-yellow-600 font-medium mt-1">Delayed</div>
                          )}
                          {sub.processingDeadline && (
                            <div className="text-xs text-gray-500 mt-1">
                              Due: {new Date(sub.processingDeadline).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{sub.user.name}</div>
                          <div className="text-xs text-gray-500">{sub.user.email}</div>
                          <div className="text-xs text-gray-400">{sub.applicantName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${statusInfo.bgColor} ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {sub.orderOfPayment ? (
                            <>
                              <div className="text-sm font-mono text-gray-900">{sub.orderOfPayment}</div>
                              <div className="text-xs font-bold text-green-600">₱{sub.fee.toFixed(2)}</div>
                            </>
                          ) : (
                            <>
                              <span className="text-xs text-gray-400">Not generated</span>
                              <div className="text-xs text-gray-600">Fee: ₱{sub.fee.toFixed(2)}</div>
                            </>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link href={getDetailLink(sub)}>
                            <button className={`px-3 py-1 text-white rounded text-xs font-medium ${
                              sub.status === 'PENDING_VERIFICATION'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}>
                              {sub.status === 'PENDING_VERIFICATION' ? 'Review' : 'View Details'}
                            </button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {filteredSubmissions.length} of {submissions.length} total submissions
          </p>
          <button
            onClick={async () => await dialog.info('Export functionality coming soon!')}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            📥 Export to CSV
          </button>
        </div>
      </div>
    </div>
  )
}
