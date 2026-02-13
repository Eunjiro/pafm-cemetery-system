"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useDialog } from "@/app/components/DialogProvider"

interface WaterIssue {
  id: string
  reporterName: string
  contactNumber: string
  street: string
  barangay: string
  exactLocation: string | null
  issueType: string
  description: string
  photo1: string | null
  photo2: string | null
  photo3: string | null
  status: string
  remarks: string | null
  assignedTo: string | null
  assignedAt: string | null
  confirmedIssueType: string | null
  estimatedMaterials: string | null
  inspectionNotes: string | null
  repairDate: string | null
  repairNotes: string | null
  issueTag: string | null
  processedBy: string | null
  processedAt: string | null
  resolvedBy: string | null
  resolvedAt: string | null
  createdAt: string
  user: { name: string; email: string }
}

const statusFlow = [
  "PENDING_INSPECTION",
  "FOR_SCHEDULING",
  "FOR_REPAIR",
  "REPAIR_IN_PROGRESS",
  "RESOLVED",
  "CLOSED"
]

const statusColors: Record<string, string> = {
  PENDING_INSPECTION: "bg-yellow-100 text-yellow-800 border-yellow-300",
  FOR_SCHEDULING: "bg-blue-100 text-blue-800 border-blue-300",
  FOR_REPAIR: "bg-orange-100 text-orange-800 border-orange-300",
  REPAIR_IN_PROGRESS: "bg-teal-100 text-teal-800 border-teal-300",
  RESOLVED: "bg-green-100 text-green-800 border-green-300",
  CLOSED: "bg-gray-100 text-gray-800 border-gray-300",
}

const issueTypeOptions = [
  "NO_WATER",
  "LOW_PRESSURE",
  "PIPE_LEAK",
  "DIRTY_WATER",
  "METER_ISSUE",
  "ILLEGAL_CONNECTION",
  "BURST_PIPE",
  "OTHER",
]

export default function IssueVerificationDetailPage() {
  const { id } = useParams()
  const [issue, setIssue] = useState<WaterIssue | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const dialog = useDialog()

  // Form state
  const [status, setStatus] = useState("")
  const [remarks, setRemarks] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const [confirmedIssueType, setConfirmedIssueType] = useState("")
  const [estimatedMaterials, setEstimatedMaterials] = useState("")
  const [inspectionNotes, setInspectionNotes] = useState("")
  const [repairDate, setRepairDate] = useState("")
  const [repairNotes, setRepairNotes] = useState("")
  const [issueTag, setIssueTag] = useState("")

  useEffect(() => { fetchIssue() }, [id])

  const fetchIssue = async () => {
    try {
      const res = await fetch(`/api/water/issue/${id}`)
      const data = await res.json()
      if (data.issue) {
        const i = data.issue
        setIssue(i)
        setStatus(i.status)
        setRemarks(i.remarks || "")
        setAssignedTo(i.assignedTo || "")
        setConfirmedIssueType(i.confirmedIssueType || "")
        setEstimatedMaterials(i.estimatedMaterials || "")
        setInspectionNotes(i.inspectionNotes || "")
        setRepairDate(i.repairDate ? new Date(i.repairDate).toISOString().split("T")[0] : "")
        setRepairNotes(i.repairNotes || "")
        setIssueTag(i.issueTag || "")
      }
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!(await dialog.confirm("Are you sure you want to update this issue report?"))) return
    setSaving(true)
    try {
      const body: any = { status, remarks }
      if (assignedTo) body.assignedTo = assignedTo
      if (confirmedIssueType) body.confirmedIssueType = confirmedIssueType
      if (estimatedMaterials) body.estimatedMaterials = estimatedMaterials
      if (inspectionNotes) body.inspectionNotes = inspectionNotes
      if (repairDate) body.repairDate = repairDate
      if (repairNotes) body.repairNotes = repairNotes
      if (issueTag) body.issueTag = issueTag

      const res = await fetch(`/api/water/issue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        await dialog.success("Issue report updated successfully!")
        fetchIssue()
      } else {
        const data = await res.json()
        await dialog.error(data.error || "Update failed")
      }
    } catch {
      await dialog.error("An error occurred")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Issue not found</p>
          <Link href="/services/water/issue-verification" className="text-red-600 hover:underline">Back to list</Link>
        </div>
      </div>
    )
  }

  const currentStep = statusFlow.indexOf(issue.status)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/services/water/issue-verification" className="text-sm text-red-100 hover:text-white mb-2 inline-block">
            ← Back to Issue Reports
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold">Water Issue - {issue.reporterName}</h1>
              <p className="text-red-100 text-sm mt-1">ID: {issue.id}</p>
            </div>
            <span className={`px-4 py-2 rounded-lg text-sm font-bold border ${statusColors[issue.status]}`}>
              {issue.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Tracker */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">RESOLUTION PROGRESS</h3>
          <div className="flex items-center justify-between">
            {statusFlow.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                  i <= currentStep ? "bg-red-600 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {i <= currentStep ? "✓" : i + 1}
                </div>
                <span className={`ml-2 text-xs hidden md:block ${i <= currentStep ? "text-red-700 font-medium" : "text-gray-400"}`}>
                  {s.replace(/_/g, " ")}
                </span>
                {i < statusFlow.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${i < currentStep ? "bg-red-600" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Issue Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Reporter Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Report Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Reporter</p>
                  <p className="font-semibold">{issue.reporterName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Contact</p>
                  <p className="font-semibold">{issue.contactNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Street</p>
                  <p className="font-semibold">{issue.street}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Barangay</p>
                  <p className="font-semibold">{issue.barangay}</p>
                </div>
                {issue.exactLocation && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Exact Location / Landmark</p>
                    <p className="font-semibold">{issue.exactLocation}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Reported Issue Type</p>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                    {issue.issueType.replace(/_/g, " ")}
                  </span>
                </div>
                {issue.confirmedIssueType && (
                  <div>
                    <p className="text-xs text-gray-500">Confirmed Issue Type</p>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                      {issue.confirmedIssueType.replace(/_/g, " ")}
                    </span>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Description</p>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{issue.description}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Submitted By</p>
                  <p className="font-semibold">{issue.user.name} ({issue.user.email})</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date Reported</p>
                  <p className="font-semibold">{new Date(issue.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
              </div>
            </div>

            {/* Photos */}
            {(issue.photo1 || issue.photo2 || issue.photo3) && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Submitted Photos</h2>
                <div className="grid grid-cols-3 gap-4">
                  {[issue.photo1, issue.photo2, issue.photo3].filter(Boolean).map((photo, i) => (
                    <a key={i} href={photo!} target="_blank" rel="noopener noreferrer" className="block">
                      <img src={photo!} alt={`Photo ${i + 1}`} className="w-full h-40 object-cover rounded-lg border hover:opacity-75 transition" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Inspection Details */}
            {issue.inspectionNotes && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Inspection Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Assigned To</p>
                    <p className="font-semibold">{issue.assignedTo || "—"}</p>
                  </div>
                  {issue.estimatedMaterials && (
                    <div>
                      <p className="text-xs text-gray-500">Estimated Materials</p>
                      <p className="text-sm whitespace-pre-wrap">{issue.estimatedMaterials}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Notes</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{issue.inspectionNotes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Repair Details */}
            {issue.repairNotes && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Repair Report</h2>
                <div className="grid grid-cols-2 gap-4">
                  {issue.repairDate && (
                    <div>
                      <p className="text-xs text-gray-500">Repair Date</p>
                      <p className="font-semibold">{new Date(issue.repairDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {issue.issueTag && (
                    <div>
                      <p className="text-xs text-gray-500">Issue Tag</p>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-800">{issue.issueTag}</span>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Repair Notes</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{issue.repairNotes}</p>
                  </div>
                  {issue.resolvedAt && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Resolved On</p>
                      <p className="font-semibold text-green-600">{new Date(issue.resolvedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right - Action Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Process Issue</h3>

              {/* Status */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                >
                  {statusFlow.map(s => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>

              {/* Assignment */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To (Person/Team)</label>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="e.g., Field Team A"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Confirmed Issue Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmed Issue Type</label>
                <select
                  value={confirmedIssueType}
                  onChange={(e) => setConfirmedIssueType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                >
                  <option value="">— same as reported —</option>
                  {issueTypeOptions.map(t => (
                    <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>

              {/* Inspection Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Notes</label>
                <textarea
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  rows={3}
                  placeholder="Site findings after inspection..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Estimated Materials */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Materials</label>
                <textarea
                  value={estimatedMaterials}
                  onChange={(e) => setEstimatedMaterials(e.target.value)}
                  rows={2}
                  placeholder="Materials needed for repair..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Repair Date */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Repair Date</label>
                <input
                  type="date"
                  value={repairDate}
                  onChange={(e) => setRepairDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Repair Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Repair Notes</label>
                <textarea
                  value={repairNotes}
                  onChange={(e) => setRepairNotes(e.target.value)}
                  rows={3}
                  placeholder="Work done, repairs completed..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Issue Tag */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Tag</label>
                <input
                  type="text"
                  value={issueTag}
                  onChange={(e) => setIssueTag(e.target.value)}
                  placeholder="e.g., Zone-3-Jan2025, Priority-Leak"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Remarks */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks / Notes to Citizen</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  placeholder="Message for the citizen..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <button
                onClick={handleUpdate}
                disabled={saving}
                className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold transition-colors"
              >
                {saving ? "Saving..." : "Update Issue"}
              </button>
            </div>

            {/* Processing Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">PROCESSING INFO</h3>
              <div className="space-y-2 text-sm">
                {issue.processedAt && (
                  <div>
                    <p className="text-xs text-gray-500">Last Processed</p>
                    <p className="text-gray-700">{new Date(issue.processedAt).toLocaleString()}</p>
                  </div>
                )}
                {issue.assignedTo && (
                  <div>
                    <p className="text-xs text-gray-500">Assigned To</p>
                    <p className="text-gray-700">{issue.assignedTo}</p>
                  </div>
                )}
                {issue.assignedAt && (
                  <div>
                    <p className="text-xs text-gray-500">Assigned At</p>
                    <p className="text-gray-700">{new Date(issue.assignedAt).toLocaleString()}</p>
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
