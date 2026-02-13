"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Transaction {
  id: string
  type: string
  subType: string
  activityType: string
  payer: string
  email: string
  organization: string | null
  date: string
  serviceDate: string
  amountDue: number | null
  amountPaid: number | null
  paymentStatus: string
  paymentMethod: string | null
  paymentReference: string | null
  bookingStatus: string
  participants: number
  isExempted: boolean
}

const paymentStatusColors: Record<string, string> = {
  PAID: "bg-green-100 text-green-800",
  VERIFIED: "bg-green-100 text-green-800",
  UNPAID: "bg-gray-100 text-gray-800",
  AWAITING_PAYMENT: "bg-yellow-100 text-yellow-800",
  EXEMPTED: "bg-purple-100 text-purple-800",
}

const facilityLabels: Record<string, string> = {
  CONFERENCE_HALL: "Conference Hall",
  GYMNASIUM: "Gymnasium",
  TRAINING_ROOM: "Training Room",
  AUDITORIUM: "Auditorium",
  CULTURAL_CENTER: "Cultural Center",
  MULTIPURPOSE_HALL: "Multipurpose Hall",
  COVERED_COURT: "Covered Court",
  OTHER_FACILITY: "Other Facility",
}

const activityLabels: Record<string, string> = {
  MEETING: "Meeting",
  SEMINAR: "Seminar",
  SPORTS_EVENT: "Sports Event",
  OUTREACH: "Outreach",
  EXHIBIT: "Exhibit",
  TRAINING: "Training",
  WEDDING: "Wedding",
  ASSEMBLY: "Assembly",
  LGU_EVENT: "LGU Event",
  CULTURAL_EVENT: "Cultural Event",
  OTHER: "Other",
}

function formatLabel(str: string): string {
  return facilityLabels[str] || str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export default function FacilitiesTransactionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filterPayment, setFilterPayment] = useState<string>("all")
  const [filterFacility, setFilterFacility] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      if (session?.user?.role !== "EMPLOYEE" && session?.user?.role !== "ADMIN") {
        router.push("/dashboard")
        return
      }
      fetchTransactions()
    }
  }, [status, session, router])

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/facilities/transactions")
      const data = await response.json()
      if (data.transactions) {
        setTransactions(data.transactions)
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter(txn => {
    const matchesFacility = filterFacility === "all" || txn.subType === filterFacility
    const matchesPayment = filterPayment === "all" || txn.paymentStatus === filterPayment
    const matchesSearch = searchTerm === "" ||
      txn.payer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (txn.paymentReference || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFacility && matchesPayment && matchesSearch
  })

  const paidTransactions = transactions.filter(t => t.paymentStatus === 'PAID' || t.paymentStatus === 'VERIFIED')
  const totalRevenue = paidTransactions.reduce((sum, t) => sum + (t.amountPaid || 0), 0)

  const today = new Date().toDateString()
  const todayTransactions = paidTransactions.filter(t => new Date(t.date).toDateString() === today)
  const todayRevenue = todayTransactions.reduce((sum, t) => sum + (t.amountPaid || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transactions...</p>
        </div>
      </div>
    )
  }

  const dashboardUrl = session?.user?.role === "ADMIN"
    ? "/services/facilities/admin-dashboard"
    : "/services/facilities/employee-dashboard"

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
              <h1 className="text-3xl font-bold">Financial Transactions</h1>
              <p className="text-orange-100 mt-1">Complete record of all Facility Management transactions</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-orange-100">Facility Management Staff</p>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
            <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">₱{totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Today&apos;s Transactions</p>
            <p className="text-2xl font-bold text-blue-600">{todayTransactions.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Today&apos;s Revenue</p>
            <p className="text-2xl font-bold text-purple-600">₱{todayRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
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
                placeholder="Search by name, email, or reference..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Facility Type</label>
              <select
                value={filterFacility}
                onChange={(e) => setFilterFacility(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
              >
                <option value="all">All Facilities</option>
                {Object.entries(facilityLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
              >
                <option value="all">All Statuses</option>
                <option value="PAID">Paid</option>
                <option value="VERIFIED">Verified</option>
                <option value="EXEMPTED">Exempted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Transactions Found</h3>
              <p className="text-gray-600">No transactions match your search criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facility</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(txn.date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-orange-100 text-orange-800">
                          {formatLabel(txn.subType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{txn.payer}</div>
                        <div className="text-xs text-gray-500">{txn.email}</div>
                        {txn.organization && <div className="text-xs text-gray-400">{txn.organization}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{activityLabels[txn.activityType] || txn.activityType}</div>
                        <div className="text-xs text-gray-500">{txn.participants} participant{txn.participants !== 1 ? 's' : ''} · {new Date(txn.serviceDate).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-green-600">
                          {txn.amountPaid != null ? `₱${txn.amountPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—'}
                        </span>
                        {txn.amountDue != null && (
                          <div className="text-xs text-gray-500">Due: ₱{txn.amountDue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {txn.paymentMethod || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${paymentStatusColors[txn.paymentStatus] || 'bg-gray-100 text-gray-800'}`}>
                          {txn.paymentStatus}
                        </span>
                        {txn.isExempted && <span className="ml-1 text-xs text-purple-600">(Exempt)</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                          txn.bookingStatus.includes('APPROVED') || txn.bookingStatus.includes('COMPLETED')
                            ? 'bg-green-100 text-green-800'
                            : txn.bookingStatus.includes('CANCEL') || txn.bookingStatus === 'NO_SHOW'
                            ? 'bg-red-100 text-red-800'
                            : txn.bookingStatus.includes('AWAITING') || txn.bookingStatus === 'PENDING_REVIEW'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {txn.bookingStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </div>
        </div>
      </div>
    </div>
  )
}
