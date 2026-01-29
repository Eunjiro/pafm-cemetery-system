"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
  DEATH_REGISTRATION_SUBMITTED: { label: "Registration Submitted", color: "bg-blue-100 text-blue-800" },
  DEATH_REGISTRATION_APPROVED: { label: "Registration Approved", color: "bg-green-100 text-green-800" },
  DEATH_REGISTRATION_REJECTED: { label: "Registration Rejected", color: "bg-red-100 text-red-800" },
  DEATH_REGISTRATION_RETURNED: { label: "Returned for Correction", color: "bg-yellow-100 text-yellow-800" },
  PAYMENT_SUBMITTED: { label: "Payment Submitted", color: "bg-purple-100 text-purple-800" },
  PAYMENT_CONFIRMED: { label: "Payment Confirmed", color: "bg-green-100 text-green-800" },
  PAYMENT_REJECTED: { label: "Payment Rejected", color: "bg-red-100 text-red-800" },
  CERTIFICATE_READY: { label: "Certificate Ready", color: "bg-green-100 text-green-800" },
  USER_REGISTERED: { label: "User Registered", color: "bg-indigo-100 text-indigo-800" },
  USER_LOGIN: { label: "User Login", color: "bg-gray-100 text-gray-800" },
}

export default function AuditLogs() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

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
      const response = await fetch("/api/cemetery/audit-logs")
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

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === "all" || log.entityType === filter
    const matchesSearch = searchTerm === "" || 
      log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading audit logs...</p>
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
              <Link href="/services/cemetery/admin-dashboard" className="text-sm text-orange-100 hover:text-white mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold">System Audit Logs</h1>
              <p className="text-orange-100 mt-1">Complete activity trail of all system actions</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-orange-100">System Administrator</p>
              <p className="font-semibold">{session?.user?.name}</p>
              <span className="inline-block mt-1 px-2 py-1 bg-orange-700 text-orange-100 text-xs font-medium rounded">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              >
                <option value="all">All Activities</option>
                <option value="DeathRegistration">Death Registrations</option>
                <option value="User">User Activities</option>
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
            <p className="text-sm text-gray-600">Today</p>
            <p className="text-2xl font-bold text-blue-600">
              {logs.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString()).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">Registrations</p>
            <p className="text-2xl font-bold text-green-600">
              {logs.filter(l => l.entityType === "DeathRegistration").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">User Actions</p>
            <p className="text-2xl font-bold text-purple-600">
              {logs.filter(l => l.entityType === "User").length}
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
                  {filteredLogs.map((log) => {
                    const actionInfo = actionLabels[log.action] || { label: log.action, color: "bg-gray-100 text-gray-800" }
                    let details = null
                    try {
                      details = log.details ? JSON.parse(log.details) : null
                    } catch (e) {
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
                              {Object.entries(details).map(([key, value]) => (
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
          )}
        </div>
      </div>
    </div>
  )
}
