"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

const statusColors: Record<string, string> = {
  PENDING_INSPECTION: "bg-yellow-100 text-yellow-800",
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

const statusSteps = [
  "PENDING_INSPECTION",
  "FOR_SITE_INSPECTION",
  "FOR_REPAIR",
  "REPAIR_IN_PROGRESS",
  "RESOLVED",
]

export default function IssueSubmissionDetailPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const params = useParams()
  const [issue, setIssue] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authStatus === "authenticated" && params.id) {
      fetchIssue()
    }
  }, [authStatus, params.id])

  const fetchIssue = async () => {
    try {
      const response = await fetch(`/api/water/issue/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setIssue(data.issue)
      }
    } catch (error) {
      console.error("Failed to fetch issue:", error)
    } finally {
      setLoading(false)
    }
  }

  if (authStatus === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-xl">Loading...</div></div>
  }

  if (!issue) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-xl text-red-600">Issue not found</div></div>
  }

  const formatDate = (date: string) => date ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"
  const formatStatus = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
  const currentStepIndex = statusSteps.indexOf(issue.status)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-red-600 text-white py-6 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/services/water/my-submissions" className="text-sm text-red-100 hover:text-white mb-2 inline-block">← Back to My Submissions</Link>
          <h1 className="text-2xl font-bold">Water Issue Report</h1>
          <p className="text-red-100 mt-1">Tracking ID: {issue.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Status Progress */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Progress</h2>
          <div className="flex items-center justify-between">
            {statusSteps.map((step, i) => {
              const isActive = i <= currentStepIndex && currentStepIndex >= 0
              const isCurrent = step === issue.status
              return (
                <div key={step} className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isCurrent ? 'bg-red-600 text-white ring-4 ring-red-200' : isActive ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {isActive ? '✓' : i + 1}
                  </div>
                  <p className={`text-xs mt-1 text-center ${isCurrent ? 'text-red-700 font-semibold' : isActive ? 'text-red-600' : 'text-gray-400'}`}>
                    {formatStatus(step)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Current Status</h2>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors[issue.status] || 'bg-gray-100'}`}>
              {formatStatus(issue.status)}
            </span>
          </div>
          {issue.status === "CANNOT_REPAIR" && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">This issue has been escalated to the Engineering Team.</p>
              {issue.remarks && <p className="text-sm text-red-700 mt-1">{issue.remarks}</p>}
            </div>
          )}
          {issue.remarks && issue.status !== "CANNOT_REPAIR" && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600"><strong>Remarks:</strong> {issue.remarks}</p>
            </div>
          )}
        </div>

        {/* Report Info */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Report Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Reporter:</span> <span className="text-gray-900 font-medium ml-2">{issue.reporterName}</span></div>
            <div><span className="text-gray-500">Contact:</span> <span className="text-gray-900 font-medium ml-2">{issue.contactNumber}</span></div>
            <div><span className="text-gray-500">Address:</span> <span className="text-gray-900 font-medium ml-2">{issue.address}</span></div>
            <div><span className="text-gray-500">Issue Type:</span> <span className="text-gray-900 font-medium ml-2">{issue.issueType.replace(/_/g, " ")}</span></div>
            {issue.description && <div className="md:col-span-2"><span className="text-gray-500">Description:</span> <span className="text-gray-900 font-medium ml-2">{issue.description}</span></div>}
            <div><span className="text-gray-500">Submitted:</span> <span className="text-gray-900 font-medium ml-2">{formatDate(issue.createdAt)}</span></div>
            {issue.confirmedIssueType && <div><span className="text-gray-500">Confirmed Issue:</span> <span className="text-gray-900 font-medium ml-2">{issue.confirmedIssueType.replace(/_/g, " ")}</span></div>}
          </div>
        </div>

        {/* Inspection/Repair Details */}
        {(issue.inspectionNotes || issue.repairDate) && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Inspection & Repair Details</h2>
            <div className="space-y-2 text-sm">
              {issue.inspectionNotes && <div><span className="text-gray-500">Inspection Notes:</span> <span className="ml-2">{issue.inspectionNotes}</span></div>}
              {issue.repairDate && <div><span className="text-gray-500">Repair Scheduled:</span> <span className="ml-2">{formatDate(issue.repairDate)}</span></div>}
              {issue.repairNotes && <div><span className="text-gray-500">Repair Notes:</span> <span className="ml-2">{issue.repairNotes}</span></div>}
              {issue.resolvedAt && <div><span className="text-gray-500">Resolved:</span> <span className="ml-2">{formatDate(issue.resolvedAt)}</span></div>}
            </div>
          </div>
        )}

        {/* Photos */}
        {(issue.photo1 || issue.photo2 || issue.photo3) && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Submitted Photos</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[issue.photo1, issue.photo2, issue.photo3].filter(Boolean).map((photo: string, i: number) => (
                <img key={i} src={photo} alt={`Photo ${i + 1}`} className="rounded-lg border w-full h-48 object-cover" />
              ))}
            </div>
          </div>
        )}

        {/* Resolved */}
        {issue.status === "RESOLVED" && (
          <div className="bg-green-50 rounded-xl border border-green-200 p-6 text-center">
            <div className="text-4xl mb-2">✅</div>
            <h3 className="text-lg font-bold text-green-800">Issue Resolved</h3>
            <p className="text-sm text-green-600 mt-1">Your water supply issue has been resolved.</p>
          </div>
        )}
      </div>
    </div>
  )
}
