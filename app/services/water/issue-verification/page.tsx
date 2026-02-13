"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"

interface WaterIssue {
  id: string
  reporterName: string
  contactNumber: string
  street: string
  barangay: string
  issueType: string
  status: string
  assignedTo: string | null
  createdAt: string
  user: { name: string; email: string }
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PENDING_INSPECTION", label: "Pending Inspection" },
  { value: "FOR_SCHEDULING", label: "For Scheduling" },
  { value: "FOR_REPAIR", label: "For Repair" },
  { value: "REPAIR_IN_PROGRESS", label: "Repair In Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
]

const statusColors: Record<string, string> = {
  PENDING_INSPECTION: "bg-yellow-100 text-yellow-800",
  FOR_SCHEDULING: "bg-blue-100 text-blue-800",
  FOR_REPAIR: "bg-orange-100 text-orange-800",
  REPAIR_IN_PROGRESS: "bg-teal-100 text-teal-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
}

const issueTypeColors: Record<string, string> = {
  NO_WATER: "bg-red-100 text-red-800",
  LOW_PRESSURE: "bg-orange-100 text-orange-800",
  PIPE_LEAK: "bg-blue-100 text-blue-800",
  DIRTY_WATER: "bg-yellow-100 text-yellow-800",
  METER_ISSUE: "bg-purple-100 text-purple-800",
  ILLEGAL_CONNECTION: "bg-red-100 text-red-800",
  BURST_PIPE: "bg-red-100 text-red-800",
  OTHER: "bg-gray-100 text-gray-800",
}

function IssueVerificationPageContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [issues, setIssues] = useState<WaterIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "")
  const [barangayFilter, setBarangayFilter] = useState("")
  const dashboardUrl = session?.user?.role === "ADMIN" ? "/services/water/admin-dashboard" : "/services/water/employee-dashboard"

  useEffect(() => {
    fetchIssues()
  }, [statusFilter, barangayFilter])

  const fetchIssues = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      if (barangayFilter) params.set("barangay", barangayFilter)
      const res = await fetch(`/api/water/issue?${params.toString()}`)
      const data = await res.json()
      setIssues(data.issues || [])
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-red-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href={dashboardUrl} className="text-sm text-red-100 hover:text-white mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Water Issue Reports</h1>
          <p className="text-red-100 mt-1">Inspect and resolve citizen-reported water issues</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
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
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex items-end">
            <button onClick={fetchIssues} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
              Refresh
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Issue Reports ({issues.length})</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading...</div>
          ) : issues.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-3">✓</div>
              <p className="text-gray-500">No issue reports found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reporter</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {issues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{issue.reporterName}</div>
                        <div className="text-xs text-gray-500">{issue.contactNumber}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{issue.street}</div>
                        <div className="text-xs text-gray-500">{issue.barangay}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${issueTypeColors[issue.issueType] || "bg-gray-100"}`}>
                          {issue.issueType.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${statusColors[issue.status] || "bg-gray-100"}`}>
                          {issue.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {issue.assignedTo || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(issue.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/services/water/issue-verification/${issue.id}`}>
                          <button className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
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

export default function IssueVerificationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>}>
      <IssueVerificationPageContent />
    </Suspense>
  )
}
