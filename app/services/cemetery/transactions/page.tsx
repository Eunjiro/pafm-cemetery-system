"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Transaction {
  id: string
  transactionType: string
  amount: number
  orderOfPayment: string
  paymentMethod: string | null
  referenceNumber: string | null
  status: string
  confirmedAt: string
  entityType: string
  entityId: string
  remarks: string | null
  user: {
    name: string
    email: string
  }
}

const statusColors: Record<string, string> = {
  CONFIRMED: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-blue-100 text-blue-800",
}

export default function TransactionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>("all")
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
      fetchTransactions()
    }
  }, [status, session, router])

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/cemetery/transactions")
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
    const matchesType = filterType === "all" || txn.transactionType === filterType
    const matchesStatus = filterStatus === "all" || txn.status === filterStatus
    const matchesSearch = searchTerm === "" || 
      txn.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.orderOfPayment.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesType && matchesStatus && matchesSearch
  })

  const totalAmount = filteredTransactions.reduce((sum, txn) => sum + txn.amount, 0)
  const todayTransactions = transactions.filter(t => 
    new Date(t.confirmedAt).toDateString() === new Date().toDateString()
  )
  const todayAmount = todayTransactions.reduce((sum, txn) => sum + txn.amount, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transactions...</p>
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
              <h1 className="text-3xl font-bold">Financial Transactions</h1>
              <p className="text-orange-100 mt-1">Complete record of all monetary transactions</p>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
            <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">₱{totalAmount.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Today's Transactions</p>
            <p className="text-2xl font-bold text-blue-600">{todayTransactions.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Today's Revenue</p>
            <p className="text-2xl font-bold text-purple-600">₱{todayAmount.toFixed(2)}</p>
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
                placeholder="Search by name, email, or OR number..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              >
                <option value="all">All Types</option>
                <option value="DEATH_REGISTRATION_FEE">Death Registration Fee</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              >
                <option value="all">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PENDING">Pending</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Transactions Found</h3>
              <p className="text-gray-600">No transactions match your search criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      OR Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(txn.confirmedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-900">{txn.orderOfPayment}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{txn.user.name}</div>
                        <div className="text-xs text-gray-500">{txn.user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {txn.transactionType.replace(/_/g, ' ')}
                        </div>
                        {txn.remarks && (
                          <div className="text-xs text-gray-500">{txn.remarks}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-green-600">₱{txn.amount.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {txn.paymentMethod || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${statusColors[txn.status] || "bg-gray-100 text-gray-800"}`}>
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Export Button */}
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </div>
          <button
            onClick={() => alert('Export functionality coming soon!')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            📥 Export to Excel
          </button>
        </div>
      </div>
    </div>
  )
}
