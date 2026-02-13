"use client"

import { useEffect, useState, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"

interface WaterConnection {
  id: string
  applicantName: string
  contactNumber: string
  street: string
  barangay: string
  structureType: string
  status: string
  pipeSize: string | null
  connectionFee: number | null
  orNumber: string | null
  createdAt: string
  user: { name: string; email: string }
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PENDING_EVALUATION", label: "Pending Evaluation" },
  { value: "FOR_INSPECTION", label: "For Inspection" },
  { value: "RETURNED_INCOMPLETE", label: "Returned Incomplete" },
  { value: "FOR_BILLING", label: "For Billing" },
  { value: "AWAITING_PAYMENT", label: "Awaiting Payment" },
  { value: "PAYMENT_CONFIRMED", label: "Payment Confirmed" },
  { value: "INSTALLATION_SCHEDULED", label: "Installation Scheduled" },
  { value: "INSTALLATION_ONGOING", label: "Installation Ongoing" },
  { value: "ACTIVE_CONNECTION", label: "Active Connection" },
  { value: "REJECTED", label: "Rejected" },
]

const statusColors: Record<string, string> = {
  PENDING_EVALUATION: "bg-yellow-100 text-yellow-800",
  FOR_INSPECTION: "bg-blue-100 text-blue-800",
  RETURNED_INCOMPLETE: "bg-orange-100 text-orange-800",
  FOR_BILLING: "bg-indigo-100 text-indigo-800",
  AWAITING_PAYMENT: "bg-amber-100 text-amber-800",
  PAYMENT_CONFIRMED: "bg-green-100 text-green-800",
  INSTALLATION_SCHEDULED: "bg-purple-100 text-purple-800",
  INSTALLATION_ONGOING: "bg-teal-100 text-teal-800",
  ACTIVE_CONNECTION: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
}

export default function ConnectionVerificationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
      <ConnectionVerificationContent />
    </Suspense>
  )
}

function ConnectionVerificationContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [connections, setConnections] = useState<WaterConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "")
  const [barangayFilter, setBarangayFilter] = useState("")
  const [nameSearch, setNameSearch] = useState("")
  const dashboardUrl = session?.user?.role === "ADMIN" ? "/services/water/admin-dashboard" : "/services/water/employee-dashboard"

  useEffect(() => {
    fetchConnections()
  }, [statusFilter, barangayFilter])

  const fetchConnections = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      if (barangayFilter) params.set("barangay", barangayFilter)
      const res = await fetch(`/api/water/connection?${params.toString()}`)
      const data = await res.json()
      setConnections(data.connections || [])
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredConnections = useMemo(() => {
    if (!nameSearch.trim()) return connections
    const search = nameSearch.toLowerCase()
    return connections.filter((c) => c.applicantName.toLowerCase().includes(search))
  }, [connections, nameSearch])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href={dashboardUrl} className="text-sm text-blue-100 hover:text-white mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Water Connection Applications</h1>
          <p className="text-blue-100 mt-1">Process new water connection applications</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Search by Name</label>
            <input
              type="text"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              placeholder="Applicant name..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Barangay</label>
            <input
              type="text"
              value={barangayFilter}
              onChange={(e) => setBarangayFilter(e.target.value)}
              placeholder="Filter by barangay..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button onClick={fetchConnections} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              Refresh
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Applications ({filteredConnections.length})</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading...</div>
          ) : filteredConnections.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-3">✓</div>
              <p className="text-gray-500">No applications found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Structure</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee / OR</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredConnections.map((conn) => (
                    <tr key={conn.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{conn.applicantName}</div>
                        <div className="text-xs text-gray-500">{conn.contactNumber}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{conn.street}</div>
                        <div className="text-xs text-gray-500">{conn.barangay}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {conn.structureType.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${statusColors[conn.status] || "bg-gray-100"}`}>
                          {conn.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {conn.connectionFee ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">₱{conn.connectionFee.toLocaleString()}</div>
                            {conn.orNumber && <div className="text-xs text-green-600">OR: {conn.orNumber}</div>}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(conn.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/services/water/connection-verification/${conn.id}`}>
                          <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                            Process
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}