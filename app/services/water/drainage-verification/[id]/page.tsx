"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

interface DrainageRequest {
  id: string
  requesterName: string
  contactNumber: string
  street: string
  barangay: string
  exactLocation: string | null
  issueType: string
  description: string
  urgency: string
  photo1: string | null
  photo2: string | null
  photo3: string | null
  status: string
  remarks: string | null
  assignedTo: string | null
  assignedAt: string | null
  inspectionDate: string | null
  inspectionNotes: string | null
  materialsStatus: string | null
  materialsNotes: string | null
  workReport: string | null
  beforePhoto: string | null
  afterPhoto: string | null
  processedBy: string | null
  processedAt: string | null
  completedBy: string | null
  completedAt: string | null
  createdAt: string
  user: { name: string; email: string }
}

const statusFlow = [
  "PENDING_REVIEW",
  "INSPECTION_SCHEDULED",
  "INSPECTION_COMPLETED",
  "FOR_IMPLEMENTATION",
  "IN_PROGRESS",
  "COMPLETED"
]

const statusColors: Record<string, string> = {
  PENDING_REVIEW: "bg-yellow-100 text-yellow-800 border-yellow-300",
  INSPECTION_SCHEDULED: "bg-blue-100 text-blue-800 border-blue-300",
  INSPECTION_COMPLETED: "bg-indigo-100 text-indigo-800 border-indigo-300",
  FOR_IMPLEMENTATION: "bg-purple-100 text-purple-800 border-purple-300",
  IN_PROGRESS: "bg-teal-100 text-teal-800 border-teal-300",
  COMPLETED: "bg-green-100 text-green-800 border-green-300",
  REJECTED: "bg-red-100 text-red-800 border-red-300",
}

export default function DrainageVerificationDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [request, setRequest] = useState<DrainageRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [status, setStatus] = useState("")
  const [remarks, setRemarks] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const [urgency, setUrgency] = useState("")
  const [inspectionDate, setInspectionDate] = useState("")
  const [inspectionNotes, setInspectionNotes] = useState("")
  const [materialsStatus, setMaterialsStatus] = useState("")
  const [materialsNotes, setMaterialsNotes] = useState("")
  const [workReport, setWorkReport] = useState("")

  useEffect(() => {
    fetchRequest()
  }, [id])

  const fetchRequest = async () => {
    try {
      const res = await fetch(`/api/water/drainage-request/${id}`)
      const data = await res.json()
      if (data.request) {
        setRequest(data.request)
        setStatus(data.request.status)
        setRemarks(data.request.remarks || "")
        setAssignedTo(data.request.assignedTo || "")
        setUrgency(data.request.urgency)
        setInspectionDate(data.request.inspectionDate ? new Date(data.request.inspectionDate).toISOString().split("T")[0] : "")
        setInspectionNotes(data.request.inspectionNotes || "")
        setMaterialsStatus(data.request.materialsStatus || "")
        setMaterialsNotes(data.request.materialsNotes || "")
        setWorkReport(data.request.workReport || "")
      }
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!confirm("Are you sure you want to update this drainage request?")) return
    setSaving(true)
    try {
      const body: any = { status, remarks }
      if (assignedTo) body.assignedTo = assignedTo
      if (urgency !== request?.urgency) body.urgency = urgency
      if (inspectionDate) body.inspectionDate = inspectionDate
      if (inspectionNotes) body.inspectionNotes = inspectionNotes
      if (materialsStatus) body.materialsStatus = materialsStatus
      if (materialsNotes) body.materialsNotes = materialsNotes
      if (workReport) body.workReport = workReport

      const res = await fetch(`/api/water/drainage-request/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        alert("Drainage request updated successfully!")
        fetchRequest()
      } else {
        const data = await res.json()
        alert(data.error || "Update failed")
      }
    } catch {
      alert("An error occurred")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Request not found</p>
          <Link href="/services/water/drainage-verification" className="text-cyan-600 hover:underline">Back to list</Link>
        </div>
      </div>
    )
  }

  const currentStep = statusFlow.indexOf(request.status)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-cyan-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/services/water/drainage-verification" className="text-sm text-cyan-100 hover:text-white mb-2 inline-block">
            ← Back to Drainage Requests
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold">Drainage Request - {request.requesterName}</h1>
              <p className="text-cyan-100 text-sm mt-1">ID: {request.id}</p>
            </div>
            <span className={`px-4 py-2 rounded-lg text-sm font-bold border ${statusColors[request.status]}`}>
              {request.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Tracker */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">WORKFLOW PROGRESS</h3>
          <div className="flex items-center justify-between">
            {statusFlow.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                  i <= currentStep ? "bg-cyan-600 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {i <= currentStep ? "✓" : i + 1}
                </div>
                <span className={`ml-2 text-xs hidden md:block ${i <= currentStep ? "text-cyan-700 font-medium" : "text-gray-400"}`}>
                  {s.replace(/_/g, " ")}
                </span>
                {i < statusFlow.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${i < currentStep ? "bg-cyan-600" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Request Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Request Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Requester</p>
                  <p className="font-semibold">{request.requesterName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Contact</p>
                  <p className="font-semibold">{request.contactNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Street</p>
                  <p className="font-semibold">{request.street}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Barangay</p>
                  <p className="font-semibold">{request.barangay}</p>
                </div>
                {request.exactLocation && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Exact Location / Landmark</p>
                    <p className="font-semibold">{request.exactLocation}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Issue Type</p>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-cyan-100 text-cyan-800">
                    {request.issueType.replace(/_/g, " ")}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Urgency</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                    request.urgency === "EMERGENCY" ? "bg-red-100 text-red-800" :
                    request.urgency === "HIGH" ? "bg-orange-100 text-orange-800" :
                    request.urgency === "NORMAL" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {request.urgency}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Description</p>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{request.description}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Submitted By</p>
                  <p className="font-semibold">{request.user.name} ({request.user.email})</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date Submitted</p>
                  <p className="font-semibold">{new Date(request.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
              </div>
            </div>

            {/* Photos */}
            {(request.photo1 || request.photo2 || request.photo3) && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Submitted Photos</h2>
                <div className="grid grid-cols-3 gap-4">
                  {[request.photo1, request.photo2, request.photo3].filter(Boolean).map((photo, i) => (
                    <a key={i} href={photo!} target="_blank" rel="noopener noreferrer" className="block">
                      <img src={photo!} alt={`Photo ${i + 1}`} className="w-full h-40 object-cover rounded-lg border hover:opacity-75 transition" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Inspection Details (if started) */}
            {request.inspectionDate && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Inspection Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Assigned To</p>
                    <p className="font-semibold">{request.assignedTo || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Inspection Date</p>
                    <p className="font-semibold">{new Date(request.inspectionDate).toLocaleDateString()}</p>
                  </div>
                  {request.inspectionNotes && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Inspection Notes</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.inspectionNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Work Report (if done) */}
            {request.workReport && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Work Report</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.workReport}</p>
                {request.completedAt && (
                  <p className="text-xs text-gray-400 mt-3">Completed on {new Date(request.completedAt).toLocaleDateString()}</p>
                )}
              </div>
            )}
          </div>

          {/* Right - Action Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Process Request</h3>
              
              {/* Status */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="INSPECTION_SCHEDULED">Inspection Scheduled</option>
                  <option value="INSPECTION_COMPLETED">Inspection Completed</option>
                  <option value="FOR_IMPLEMENTATION">For Implementation</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              {/* Urgency Override */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>

              {/* Assignment */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To (Person/Team)</label>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="e.g., District Engineer - Zone A"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Inspection Date */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Date</label>
                <input
                  type="date"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Inspection Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Notes</label>
                <textarea
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  rows={3}
                  placeholder="Findings after site inspection..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Materials */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Materials Status</label>
                <select
                  value={materialsStatus}
                  onChange={(e) => setMaterialsStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">— Select —</option>
                  <option value="NOT_NEEDED">Not Needed</option>
                  <option value="REQUESTED">Requested</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="DELIVERED">Delivered to Site</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Materials Notes</label>
                <textarea
                  value={materialsNotes}
                  onChange={(e) => setMaterialsNotes(e.target.value)}
                  rows={2}
                  placeholder="List of materials needed..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Work Report */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Report</label>
                <textarea
                  value={workReport}
                  onChange={(e) => setWorkReport(e.target.value)}
                  rows={4}
                  placeholder="Summary of work done, area covered, results..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Remarks */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks / Notes to Citizen</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  placeholder="Any message or note for the citizen..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <button
                onClick={handleUpdate}
                disabled={saving}
                className="w-full py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 font-semibold transition-colors"
              >
                {saving ? "Saving..." : "Update Request"}
              </button>
            </div>

            {/* Audit Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">PROCESSING INFO</h3>
              <div className="space-y-2 text-sm">
                {request.processedAt && (
                  <div>
                    <p className="text-xs text-gray-500">Last Processed</p>
                    <p className="text-gray-700">{new Date(request.processedAt).toLocaleString()}</p>
                  </div>
                )}
                {request.assignedTo && (
                  <div>
                    <p className="text-xs text-gray-500">Assigned To</p>
                    <p className="text-gray-700">{request.assignedTo}</p>
                  </div>
                )}
                {request.assignedAt && (
                  <div>
                    <p className="text-xs text-gray-500">Assigned At</p>
                    <p className="text-gray-700">{new Date(request.assignedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
