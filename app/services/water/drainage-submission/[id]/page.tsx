"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

const statusColors: Record<string, string> = {
  PENDING_REVIEW: "bg-yellow-100 text-yellow-800",
  INSPECTION_SCHEDULED: "bg-blue-100 text-blue-800",
  INSPECTION_COMPLETED: "bg-indigo-100 text-indigo-800",
  FOR_APPROVAL: "bg-purple-100 text-purple-800",
  APPROVED_WITH_MATERIALS: "bg-green-100 text-green-800",
  PENDING_NO_MATERIALS: "bg-orange-100 text-orange-800",
  FOR_IMPLEMENTATION: "bg-teal-100 text-teal-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
}

const statusSteps = [
  "PENDING_REVIEW",
  "INSPECTION_SCHEDULED",
  "INSPECTION_COMPLETED",
  "FOR_APPROVAL",
  "FOR_IMPLEMENTATION",
  "IN_PROGRESS",
  "COMPLETED",
]

export default function DrainageSubmissionDetailPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const params = useParams()
  const [request, setRequest] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState("")
  const [rating, setRating] = useState(0)

  useEffect(() => {
    if (authStatus === "authenticated" && params.id) {
      fetchRequest()
    }
  }, [authStatus, params.id])

  const fetchRequest = async () => {
    try {
      const response = await fetch(`/api/water/drainage-request/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setRequest(data.request)
      }
    } catch (error) {
      console.error("Failed to fetch request:", error)
    } finally {
      setLoading(false)
    }
  }

  if (authStatus === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-xl">Loading...</div></div>
  }

  if (!request) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-xl text-red-600">Request not found</div></div>
  }

  const formatDate = (date: string) => date ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"
  const formatStatus = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
  const currentStepIndex = statusSteps.indexOf(request.status)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-cyan-600 text-white py-6 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/services/water/my-submissions" className="text-sm text-cyan-100 hover:text-white mb-2 inline-block">← Back to My Submissions</Link>
          <h1 className="text-2xl font-bold">Drainage Request Details</h1>
          <p className="text-cyan-100 mt-1">Tracking ID: {request.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Status Progress */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Progress</h2>
          <div className="flex items-center justify-between">
            {statusSteps.map((step, i) => {
              const isActive = i <= currentStepIndex
              const isCurrent = step === request.status
              return (
                <div key={step} className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isCurrent ? 'bg-cyan-600 text-white ring-4 ring-cyan-200' : isActive ? 'bg-cyan-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {isActive ? '✓' : i + 1}
                  </div>
                  <p className={`text-xs mt-1 text-center ${isCurrent ? 'text-cyan-700 font-semibold' : isActive ? 'text-cyan-600' : 'text-gray-400'}`}>
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
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors[request.status] || 'bg-gray-100'}`}>
              {formatStatus(request.status)}
            </span>
          </div>
          {request.remarks && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600"><strong>Remarks:</strong> {request.remarks}</p>
            </div>
          )}
        </div>

        {/* Request Info */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Request Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Requester:</span> <span className="text-gray-900 font-medium ml-2">{request.requesterName}</span></div>
            <div><span className="text-gray-500">Contact:</span> <span className="text-gray-900 font-medium ml-2">{request.contactNumber}</span></div>
            <div><span className="text-gray-500">Street:</span> <span className="text-gray-900 font-medium ml-2">{request.street}</span></div>
            <div><span className="text-gray-500">Barangay:</span> <span className="text-gray-900 font-medium ml-2">{request.barangay}</span></div>
            <div><span className="text-gray-500">Issue Type:</span> <span className="text-gray-900 font-medium ml-2">{request.issueType.replace(/_/g, " ")}</span></div>
            <div><span className="text-gray-500">Urgency:</span> <span className="text-gray-900 font-medium ml-2">{request.urgency}</span></div>
            {request.exactLocation && <div className="md:col-span-2"><span className="text-gray-500">Location Details:</span> <span className="text-gray-900 font-medium ml-2">{request.exactLocation}</span></div>}
            {request.description && <div className="md:col-span-2"><span className="text-gray-500">Description:</span> <span className="text-gray-900 font-medium ml-2">{request.description}</span></div>}
            <div><span className="text-gray-500">Submitted:</span> <span className="text-gray-900 font-medium ml-2">{formatDate(request.createdAt)}</span></div>
          </div>
        </div>

        {/* Inspection Details (if available) */}
        {request.inspectionDate && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Inspection Details</h2>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">Inspection Date:</span> <span className="ml-2">{formatDate(request.inspectionDate)}</span></div>
              {request.inspectionNotes && <div><span className="text-gray-500">Notes:</span> <span className="ml-2">{request.inspectionNotes}</span></div>}
              {request.materialsStatus && <div><span className="text-gray-500">Materials:</span> <span className="ml-2">{request.materialsStatus.replace(/_/g, " ")}</span></div>}
            </div>
          </div>
        )}

        {/* Work Report (if completed) */}
        {request.workReport && (
          <div className="bg-green-50 rounded-xl border border-green-200 p-6">
            <h2 className="text-lg font-semibold text-green-900 mb-4 border-b border-green-200 pb-2">Work Report</h2>
            <p className="text-sm text-green-800">{request.workReport}</p>
            {request.completedAt && <p className="text-xs text-green-600 mt-2">Completed: {formatDate(request.completedAt)}</p>}
          </div>
        )}

        {/* Photos */}
        {(request.photo1 || request.photo2 || request.photo3) && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Submitted Photos</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[request.photo1, request.photo2, request.photo3].filter(Boolean).map((photo: string, i: number) => (
                <img key={i} src={photo} alt={`Photo ${i + 1}`} className="rounded-lg border w-full h-48 object-cover" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
