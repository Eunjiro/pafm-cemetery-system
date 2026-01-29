"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface DeathRegistration {
  id: string
  deceasedFirstName: string
  deceasedMiddleName: string | null
  deceasedLastName: string
  status: string
  orderOfPayment: string | null
  paymentConfirmed: boolean
  registrationType: string
  registrationFee: number
  processingDeadline: string | null
  createdAt: string
  processedAt: string | null
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

export default function AllRegistrations() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [registrations, setRegistrations] = useState<DeathRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      if (session?.user?.role !== "EMPLOYEE" && session?.user?.role !== "ADMIN") {
        router.push("/dashboard")
        return
      }
      fetchRegistrations()
    }
  }, [status, session, router])

  const fetchRegistrations = async () => {
    try {
      const response = await fetch("/api/cemetery/all-registrations")
      const data = await response.json()
      if (data.registrations) {
        setRegistrations(data.registrations)
      }
    } catch (error) {
      console.error("Error fetching registrations:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRegistrations = registrations.filter(reg => {
    const matchesStatus = filterStatus === "all" || reg.status === filterStatus
    const deceasedName = `${reg.deceasedFirstName} ${reg.deceasedMiddleName || ''} ${reg.deceasedLastName}`.toLowerCase()
    const matchesSearch = searchTerm === "" || 
      deceasedName.includes(searchTerm.toLowerCase()) ||
      reg.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.orderOfPayment?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading registrations...</p>
        </div>
      </div>
    )
  }

  const stats = {
    total: registrations.length,
    pending: registrations.filter(r => r.status === 'PENDING_VERIFICATION').length,
    approved: registrations.filter(r => r.status === 'APPROVED_FOR_PAYMENT').length,
    paymentPending: registrations.filter(r => r.status === 'PAYMENT_SUBMITTED').length,
    completed: registrations.filter(r => r.status === 'COMPLETED' || r.status === 'REGISTERED_FOR_PICKUP').length,
  }

  const dashboardUrl = session?.user?.role === "ADMIN" 
    ? "/services/cemetery/admin-dashboard" 
    : "/services/cemetery/employee-dashboard"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-orange-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href={dashboardUrl} className="text-sm text-orange-100 hover:text-white mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold">All Death Registrations</h1>
              <p className="text-orange-100 mt-1">Complete list of all submitted applications</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-orange-100">
                {session?.user?.role === "ADMIN" ? "System Administrator" : "Civil Registry Staff"}
              </p>
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

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">Payment Review</p>
            <p className="text-2xl font-bold text-purple-600">{stats.paymentPending}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or OR number..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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

        {/* Registrations Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredRegistrations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Registrations Found</h3>
              <p className="text-gray-600">No registrations match your search criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deceased Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
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
                  {filteredRegistrations.map((reg) => {
                    const statusInfo = statusConfig[reg.status] || statusConfig.PENDING_VERIFICATION
                    const deceasedName = `${reg.deceasedFirstName} ${reg.deceasedMiddleName || ''} ${reg.deceasedLastName}`.trim()
                    
                    return (
                      <tr key={reg.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{deceasedName}</div>
                          <div className="text-xs text-gray-500 font-mono">{reg.id.substring(0, 8)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                            reg.registrationType === "DELAYED" 
                              ? "bg-orange-100 text-orange-800" 
                              : "bg-green-100 text-green-800"
                          }`}>
                            {reg.registrationType === "DELAYED" ? "Delayed" : "Regular"}
                          </span>
                          {reg.processingDeadline && (
                            <div className="text-xs text-gray-500 mt-1">
                              Due: {new Date(reg.processingDeadline).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{reg.user.name}</div>
                          <div className="text-xs text-gray-500">{reg.user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${statusInfo.bgColor} ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {reg.orderOfPayment ? (
                            <>
                              <div className="text-sm font-mono text-gray-900">{reg.orderOfPayment}</div>
                              <div className="text-xs font-bold text-green-600">₱{reg.registrationFee.toFixed(2)}</div>
                            </>
                          ) : (
                            <>
                              <span className="text-xs text-gray-400">Not generated</span>
                              <div className="text-xs text-gray-600">Fee: ₱{reg.registrationFee.toFixed(2)}</div>
                            </>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(reg.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {reg.status === 'PENDING_VERIFICATION' ? (
                            <Link href={`/services/cemetery/verification/${reg.id}`}>
                              <button className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 text-xs font-medium">
                                Review
                              </button>
                            </Link>
                          ) : reg.status === 'PAYMENT_SUBMITTED' ? (
                            <Link href={`/services/cemetery/payment-confirmation`}>
                              <button className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium">
                                Confirm Payment
                              </button>
                            </Link>
                          ) : (
                            <Link href={`/services/cemetery/verification/${reg.id}`}>
                              <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium">
                                View Details
                              </button>
                            </Link>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Export Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => alert('Export functionality coming soon!')}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            📥 Export to CSV
          </button>
        </div>
      </div>
    </div>
  )
}
