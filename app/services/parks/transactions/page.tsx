"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Transaction {
  id: string
  type: string
  subType: string
  payer: string
  email: string
  date: string
  serviceDate: string
  amountDue: number | null
  amountPaid: number | null
  paymentStatus: string
  paymentMethod: string | null
  paymentReference: string | null
  bookingStatus: string
  guests: number
}

const paymentStatusColors: Record<string, string> = {
  PAID: "bg-green-100 text-green-800",
  UNPAID: "bg-gray-100 text-gray-800",
  WAIVED: "bg-blue-100 text-blue-800",
  EXEMPTED: "bg-purple-100 text-purple-800",
}

const typeLabels: Record<string, string> = {
  SWIMMING_ENTRANCE: "Swimming Entrance",
  COTTAGE: "Cottage",
  TABLE: "Table",
  ROOM: "Room",
  OTHER: "Other Amenity",
  PICNIC_GROUND: "Picnic Ground",
  COVERED_COURT: "Covered Court",
  AMPHITHEATER: "Amphitheater",
  EVENT_HALL: "Event Hall",
  MULTIPURPOSE_AREA: "Multipurpose Area",
  OTHER_VENUE: "Other Venue",
}

function formatLabel(str: string): string {
  return typeLabels[str] || str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export default function ParksTransactionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>("all")
  const [filterPayment, setFilterPayment] = useState<string>("all")
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
      const response = await fetch("/api/parks/transactions")
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
    const matchesType = filterType === "all" || txn.type === filterType
    const matchesPayment = filterPayment === "all" || txn.paymentStatus === filterPayment
    const matchesSearch = searchTerm === "" ||
      txn.payer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (txn.paymentReference || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesPayment && matchesSearch
  })

  const paidTransactions = transactions.filter(t => t.paymentStatus === 'PAID')
  const totalRevenue = paidTransactions.reduce((sum, t) => sum + (t.amountPaid || 0), 0)

  const today = new Date().toDateString()
  const todayTransactions = paidTransactions.filter(t => new Date(t.date).toDateString() === today)
  const todayRevenue = todayTransactions.reduce((sum, t) => sum + (t.amountPaid || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transactions...</p>
        </div>
      </div>
    )
  }

  const dashboardUrl = session?.user?.role === "ADMIN"
    ? "/services/parks/admin-dashboard"
    : "/services/parks/employee-dashboard"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-teal-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href={dashboardUrl} className="text-sm text-teal-100 hover:text-white mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold">Financial Transactions</h1>
              <p className="text-teal-100 mt-1">Complete record of all Parks & Recreation transactions</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-teal-100">Parks & Recreation Staff</p>
              <p className="font-semibold">{session?.user?.name}</p>
              <span className="inline-block mt-1 px-2 py-1 bg-teal-700 text-teal-100 text-xs font-medium rounded">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
              >
                <option value="all">All Types</option>
                <option value="AMENITY_RESERVATION">Amenity Reservation</option>
                <option value="VENUE_BOOKING">Venue Booking</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
              >
                <option value="all">All Statuses</option>
                <option value="PAID">Paid</option>
                <option value="WAIVED">Waived</option>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
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
                    <tr key={`${txn.type}-${txn.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(txn.date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                          txn.type === 'AMENITY_RESERVATION'
                            ? 'bg-cyan-100 text-cyan-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {txn.type === 'AMENITY_RESERVATION' ? 'Amenity' : 'Venue'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{txn.payer}</div>
                        <div className="text-xs text-gray-500">{txn.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatLabel(txn.subType)}</div>
                        <div className="text-xs text-gray-500">{txn.guests} guest{txn.guests !== 1 ? 's' : ''} • {new Date(txn.serviceDate).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-green-600">
                          {txn.amountPaid != null ? `₱${txn.amountPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {txn.paymentMethod || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${paymentStatusColors[txn.paymentStatus] || 'bg-gray-100 text-gray-800'}`}>
                          {txn.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                          txn.bookingStatus.includes('APPROVED') || txn.bookingStatus.includes('COMPLETED') || txn.bookingStatus === 'CHECKED_IN'
                            ? 'bg-green-100 text-green-800'
                            : txn.bookingStatus.includes('CANCEL') || txn.bookingStatus === 'NO_SHOW'
                            ? 'bg-red-100 text-red-800'
                            : txn.bookingStatus.includes('AWAITING')
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
