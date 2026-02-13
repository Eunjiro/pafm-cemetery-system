"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

const statusColors: Record<string, string> = {
  PENDING_REVIEW: "bg-yellow-100 text-yellow-800",
  PENDING_EVALUATION: "bg-yellow-100 text-yellow-800",
  PENDING_INSPECTION: "bg-yellow-100 text-yellow-800",
  INSPECTION_SCHEDULED: "bg-blue-100 text-blue-800",
  INSPECTION_COMPLETED: "bg-indigo-100 text-indigo-800",
  FOR_APPROVAL: "bg-purple-100 text-purple-800",
  APPROVED_WITH_MATERIALS: "bg-green-100 text-green-800",
  PENDING_NO_MATERIALS: "bg-orange-100 text-orange-800",
  FOR_IMPLEMENTATION: "bg-teal-100 text-teal-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  RETURNED_INCOMPLETE: "bg-orange-100 text-orange-800",
  FOR_INSPECTION: "bg-blue-100 text-blue-800",
  FOR_BILLING: "bg-indigo-100 text-indigo-800",
  AWAITING_PAYMENT: "bg-yellow-100 text-yellow-800",
  PAYMENT_CONFIRMED: "bg-green-100 text-green-800",
  INSTALLATION_SCHEDULED: "bg-blue-100 text-blue-800",
  INSTALLATION_ONGOING: "bg-teal-100 text-teal-800",
  ACTIVE_CONNECTION: "bg-green-100 text-green-800",
  FOR_SITE_INSPECTION: "bg-blue-100 text-blue-800",
  RESOLVED_DUPLICATE: "bg-gray-100 text-gray-800",
  FOR_REPAIR: "bg-orange-100 text-orange-800",
  FOR_SCHEDULING: "bg-indigo-100 text-indigo-800",
  AWAITING_PARTS: "bg-yellow-100 text-yellow-800",
  REPAIR_IN_PROGRESS: "bg-teal-100 text-teal-800",
  RESOLVED: "bg-green-100 text-green-800",
  CANNOT_REPAIR: "bg-red-100 text-red-800",
  CLOSED: "bg-gray-100 text-gray-800",
}

export default function MySubmissionsPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [drainageRequests, setDrainageRequests] = useState<any[]>([])
  const [waterConnections, setWaterConnections] = useState<any[]>([])
  const [waterIssues, setWaterIssues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("drainage")

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchAll()
    }
  }, [authStatus])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [drainRes, connRes, issueRes] = await Promise.all([
        fetch("/api/water/drainage-request"),
        fetch("/api/water/connection"),
        fetch("/api/water/issue"),
      ])
      
      if (drainRes.ok) {
        const data = await drainRes.json()
        setDrainageRequests(data.requests || [])
      }
      if (connRes.ok) {
        const data = await connRes.json()
        setWaterConnections(data.connections || [])
      }
      if (issueRes.ok) {
        const data = await issueRes.json()
        setWaterIssues(data.issues || [])
      }
    } catch (error) {
      console.error("Failed to fetch submissions:", error)
    } finally {
      setLoading(false)
    }
  }

  if (authStatus === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-xl">Loading...</div></div>
  }

  if (authStatus === "unauthenticated") {
    router.push("/login")
    return null
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  const formatStatus = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())

  const tabs = [
    { key: "drainage", label: "Drainage Requests", count: drainageRequests.length },
    { key: "connection", label: "Water Connections", count: waterConnections.length },
    { key: "issues", label: "Water Issues", count: waterIssues.length },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/services/water/user-dashboard" className="text-sm text-blue-100 hover:text-white mb-2 inline-block">← Back to Water Services</Link>
          <h1 className="text-3xl font-bold">My Submissions</h1>
          <p className="text-blue-100 mt-1">Track your water and drainage service requests</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-200 rounded-lg p-1">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Drainage Requests Tab */}
        {activeTab === "drainage" && (
          <div className="space-y-4">
            {drainageRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">No drainage requests yet</div>
            ) : drainageRequests.map(req => (
              <Link key={req.id} href={`/services/water/drainage-submission/${req.id}`}>
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{req.issueType.replace(/_/g, " ")}</h3>
                      <p className="text-sm text-gray-600 mt-1">{req.street}, {req.barangay}</p>
                      <p className="text-xs text-gray-400 mt-1">Submitted: {formatDate(req.createdAt)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[req.status] || 'bg-gray-100 text-gray-800'}`}>
                      {formatStatus(req.status)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Water Connections Tab */}
        {activeTab === "connection" && (
          <div className="space-y-4">
            {waterConnections.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">No water connection applications yet</div>
            ) : waterConnections.map(conn => (
              <Link key={conn.id} href={`/services/water/connection-submission/${conn.id}`}>
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">New Water Connection</h3>
                      <p className="text-sm text-gray-600 mt-1">{conn.street}, {conn.barangay}</p>
                      <p className="text-sm text-gray-500">{conn.structureType.replace(/_/g, " ")}</p>
                      <p className="text-xs text-gray-400 mt-1">Submitted: {formatDate(conn.createdAt)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[conn.status] || 'bg-gray-100 text-gray-800'}`}>
                      {formatStatus(conn.status)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Water Issues Tab */}
        {activeTab === "issues" && (
          <div className="space-y-4">
            {waterIssues.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">No water issue reports yet</div>
            ) : waterIssues.map(issue => (
              <Link key={issue.id} href={`/services/water/issue-submission/${issue.id}`}>
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{issue.issueType.replace(/_/g, " ")}</h3>
                      <p className="text-sm text-gray-600 mt-1">{issue.address}</p>
                      <p className="text-xs text-gray-400 mt-1">Submitted: {formatDate(issue.createdAt)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[issue.status] || 'bg-gray-100 text-gray-800'}`}>
                      {formatStatus(issue.status)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
