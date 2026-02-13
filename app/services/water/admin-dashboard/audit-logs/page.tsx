"use client"

import { useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const PAGE_SIZE = 10

interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string | null
  details: string | null
  createdAt: string
  user: {
    name: string
    email: string
    role: string
  }
}

const actionLabels: Record<string, { label: string; color: string }> = {
  DRAINAGE_REQUEST_SUBMITTED: { label: "Drainage Submitted", color: "bg-cyan-100 text-cyan-800" },
  DRAINAGE_REQUEST_UPDATED: { label: "Drainage Updated", color: "bg-cyan-100 text-cyan-800" },
  WATER_CONNECTION_SUBMITTED: { label: "Connection Submitted", color: "bg-blue-100 text-blue-800" },
  WATER_CONNECTION_UPDATED: { label: "Connection Updated", color: "bg-blue-100 text-blue-800" },
  WATER_CONNECTION_RETURNED: { label: "Connection Returned", color: "bg-yellow-100 text-yellow-800" },
  WATER_CONNECTION_INSPECTION_SCHEDULED: { label: "Inspection Scheduled", color: "bg-indigo-100 text-indigo-800" },
  WATER_CONNECTION_BILLING: { label: "Billing Set", color: "bg-orange-100 text-orange-800" },
  WATER_CONNECTION_PAYMENT_CONFIRMED: { label: "Payment Confirmed", color: "bg-green-100 text-green-800" },
  WATER_CONNECTION_INSTALLATION_SCHEDULED: { label: "Installation Scheduled", color: "bg-purple-100 text-purple-800" },
  WATER_CONNECTION_ACTIVE: { label: "Connection Active", color: "bg-green-100 text-green-800" },
  WATER_CONNECTION_REJECTED: { label: "Connection Rejected", color: "bg-red-100 text-red-800" },
  WATER_ISSUE_SUBMITTED: { label: "Issue Reported", color: "bg-red-100 text-red-800" },
  WATER_ISSUE_UPDATED: { label: "Issue Updated", color: "bg-amber-100 text-amber-800" },
  WATER_ISSUE_ASSIGNED: { label: "Issue Assigned", color: "bg-indigo-100 text-indigo-800" },
  WATER_ISSUE_INSPECTION_SCHEDULED: { label: "Inspection Scheduled", color: "bg-indigo-100 text-indigo-800" },
  WATER_ISSUE_REPAIR_SCHEDULED: { label: "Repair Scheduled", color: "bg-purple-100 text-purple-800" },
  WATER_ISSUE_RESOLVED: { label: "Issue Resolved", color: "bg-green-100 text-green-800" },
  WATER_ISSUE_CANNOT_REPAIR: { label: "Cannot Repair", color: "bg-red-100 text-red-800" },
  WATER_ISSUE_CLOSED: { label: "Issue Closed", color: "bg-gray-100 text-gray-800" },
}

export default function WaterAuditLogs() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      if (session?.user?.role !== "ADMIN") {
        router.push("/dashboard")
        return
      }
      fetchLogs()
    }
  }, [status, session, router])

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/water/audit-logs")
      const data = await response.json()
      if (data.logs) {
        setLogs(data.logs)
      }
    } catch (error) {
      console.error("Error fetching logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = useMemo(() => logs.filter(log => {
    const matchesFilter = filter === "all" || log.entityType === filter
    const matchesSearch = searchTerm === "" ||
      log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesFilter && matchesSearch
  }), [logs, filter, searchTerm])

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE)
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredLogs.slice(start, start + PAGE_SIZE)
  }, [filteredLogs, currentPage])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, searchTerm])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading audit logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/services/water/admin-dashboard" className="text-sm text-blue-100 hover:text-white mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold">Water & Drainage - Audit Logs</h1>
              <p className="text-blue-100 mt-1">Complete activity trail of all water service actions</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">System Administrator</p>
              <p className="font-semibold">{session?.user?.name}</p>
              <span className="inline-block mt-1 px-2 py-1 bg-blue-700 text-blue-100 text-xs font-medium rounded">
                ADMIN
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by user name, email, or action..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="all">All Activities</option>
                <option value="DrainageRequest">Drainage Requests</option>
                <option value="WaterConnection">Water Connections</option>
                <option value="WaterIssue">Water Issues</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">Total Logs</p>
            <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">Drainage</p>
            <p className="text-2xl font-bold text-cyan-600">
              {logs.filter(l => l.entityType === "DrainageRequest").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">Connections</p>
            <p className="text-2xl font-bold text-blue-600">
              {logs.filter(l => l.entityType === "WaterConnection").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">Issues</p>
            <p className="text-2xl font-bold text-red-600">
              {logs.filter(l => l.entityType === "WaterIssue").length}
            </p>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Logs Found</h3>
              <p className="text-gray-600">No audit logs match your search criteria.</p>
            </div>
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entity Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedLogs.map((log) => {
                    const actionInfo = actionLabels[log.action] || { label: log.action.replace(/_/g, " "), color: "bg-gray-100 text-gray-800" }
                    let details: Record<string, unknown> | string | null = null
                    try {
                      details = log.details ? JSON.parse(log.details) : null
                    } catch {
                      details = log.details
                    }

                    return (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{log.user.name}</div>
                          <div className="text-sm text-gray-500">{log.user.email}</div>
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                            {log.user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${actionInfo.color}`}>
                            {actionInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.entityType}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {log.entityId && (
                            <div className="mb-1">
                              <span className="font-medium">ID:</span> <span className="font-mono text-xs">{log.entityId}</span>
                            </div>
                          )}
                          {details && typeof details === 'object' && (
                            <div className="text-xs text-gray-600 max-w-md">
                              {Object.entries(details as Record<string, unknown>).map(([key, value]) => (
                                <div key={key}>
                                  <span className="font-medium">{key}:</span> {String(value)}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length} logs
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce<(number | string)[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...")
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, idx) =>
                      typeof p === "string" ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`px-3 py-1.5 text-sm rounded-lg border ${
                            currentPage === p
                              ? "bg-blue-600 text-white border-blue-600"
                              : "border-gray-300 hover:bg-gray-100"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
