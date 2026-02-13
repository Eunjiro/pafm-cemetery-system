"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"

interface MaintenanceRequest {
  id: string
  reporterName: string | null
  parkLocation: string
  issueCategory: string
  issueCategoryOther: string | null
  description: string
  urgencyLevel: string
  status: string
  assignedTeam: string | null
  createdAt: string
  user: { name: string; email: string }
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "LOGGED", label: "Logged" },
  { value: "PENDING_INSPECTION", label: "Pending Inspection" },
  { value: "UNDER_INSPECTION", label: "Under Inspection" },
  { value: "APPROVED_FOR_REPAIR", label: "Approved for Repair" },
  { value: "PENDING_MATERIALS", label: "Pending Materials" },
  { value: "PENDING_CONTRACTOR", label: "Pending Contractor" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CLOSED", label: "Closed" },
  { value: "REJECTED", label: "Rejected" },
]

const categoryLabels: Record<string, string> = {
  DAMAGED_BENCH: "Damaged Bench",
  FALLEN_TREE: "Fallen Tree",
  PLAYGROUND_EQUIPMENT: "Playground Equipment",
  VANDALISM: "Vandalism",
  LIGHTING: "Lighting Issue",
  CLEANLINESS: "Cleanliness / Sanitation",
  PATHWAY: "Pathway / Walkway",
  FENCING: "Fencing / Barrier",
  IRRIGATION: "Irrigation / Sprinkler",
  OTHER: "Other",
}

const urgencyColors: Record<string, string> = {
  NORMAL: "bg-blue-100 text-blue-700",
  PRIORITY: "bg-orange-100 text-orange-700",
  HAZARD: "bg-red-100 text-red-700",
}

const statusColors: Record<string, string> = {
  LOGGED: "bg-yellow-100 text-yellow-800",
  PENDING_INSPECTION: "bg-yellow-100 text-yellow-800",
  UNDER_INSPECTION: "bg-blue-100 text-blue-800",
  APPROVED_FOR_REPAIR: "bg-purple-100 text-purple-800",
  PENDING_MATERIALS: "bg-orange-100 text-orange-800",
  PENDING_CONTRACTOR: "bg-orange-100 text-orange-800",
  IN_PROGRESS: "bg-teal-100 text-teal-800",
  COMPLETED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
  REJECTED: "bg-red-100 text-red-800",
}

function MaintenanceVerificationContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "")
  const [locationFilter, setLocationFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const dashboardUrl = session?.user?.role === "ADMIN" ? "/services/parks/admin-dashboard" : "/services/parks/employee-dashboard"

  useEffect(() => {
    fetchRequests()
  }, [statusFilter, locationFilter, categoryFilter])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      if (locationFilter) params.set("location", locationFilter)
      if (categoryFilter) params.set("category", categoryFilter)
      const res = await fetch(`/api/parks/maintenance-request?${params.toString()}`)
      const data = await res.json()
      setRequests(data.requests || [])
    } catch (err) {
      console.error("Error fetching requests:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-amber-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href={dashboardUrl} className="text-sm text-amber-100 hover:text-white mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold">Maintenance Request Management</h1>
              <p className="text-amber-100 mt-1">Review and process park maintenance reports</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500">
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500">
              <option value="">All Categories</option>
              {Object.entries(categoryLabels).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
            <input type="text" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Filter by park..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" />
          </div>
          <div className="flex items-end">
            <button onClick={fetchRequests} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm">
              Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Maintenance Requests ({requests.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-3">✓</div>
              <p className="text-gray-500">No maintenance requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reporter</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urgency</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{req.reporterName || "Anonymous"}</div>
                        {req.reporterName && <div className="text-xs text-gray-500">{req.user?.email}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{req.parkLocation}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">
                          {categoryLabels[req.issueCategory] || req.issueCategory}
                          {req.issueCategoryOther && ` (${req.issueCategoryOther})`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${urgencyColors[req.urgencyLevel] || "bg-gray-100"}`}>
                          {req.urgencyLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{req.assignedTeam || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${statusColors[req.status] || "bg-gray-100"}`}>
                          {req.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/services/parks/maintenance-verification/${req.id}`}>
                          <button className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm">
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

export default function MaintenanceVerificationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>}>
      <MaintenanceVerificationContent />
    </Suspense>
  )
}
