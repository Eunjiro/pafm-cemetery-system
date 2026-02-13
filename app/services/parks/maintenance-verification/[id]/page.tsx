"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useDialog } from "@/app/components/DialogProvider"

interface MaintenanceRequest {
  id: string
  reporterName: string | null
  parkLocation: string
  issueCategory: string
  issueCategoryOther: string | null
  description: string
  photo1: string | null
  photo2: string | null
  photo3: string | null
  inspectionScheduled: string | null
  inspectionNotes: string | null
  inspectionPhotos: string | null
  urgencyLevel: string
  repairScale: string | null
  materialsStatus: string | null
  materialsNotes: string | null
  assignedTeam: string | null
  assignedTo: string | null
  assignedAt: string | null
  workStartedAt: string | null
  beforePhotos: string | null
  afterPhotos: string | null
  workReport: string | null
  completedAt: string | null
  completedBy: string | null
  status: string
  remarks: string | null
  processedBy: string | null
  processedAt: string | null
  createdAt: string
  user: { name: string; email: string }
}

const statusFlow = [
  "LOGGED",
  "PENDING_INSPECTION",
  "UNDER_INSPECTION",
  "APPROVED_FOR_REPAIR",
  "IN_PROGRESS",
  "COMPLETED",
  "CLOSED",
]

const statusColors: Record<string, string> = {
  LOGGED: "bg-yellow-100 text-yellow-800 border-yellow-300",
  PENDING_INSPECTION: "bg-yellow-100 text-yellow-800 border-yellow-300",
  UNDER_INSPECTION: "bg-blue-100 text-blue-800 border-blue-300",
  APPROVED_FOR_REPAIR: "bg-purple-100 text-purple-800 border-purple-300",
  PENDING_MATERIALS: "bg-orange-100 text-orange-800 border-orange-300",
  PENDING_CONTRACTOR: "bg-orange-100 text-orange-800 border-orange-300",
  IN_PROGRESS: "bg-teal-100 text-teal-800 border-teal-300",
  COMPLETED: "bg-green-100 text-green-800 border-green-300",
  CLOSED: "bg-gray-100 text-gray-800 border-gray-300",
  REJECTED: "bg-red-100 text-red-800 border-red-300",
}

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

export default function MaintenanceVerificationDetailPage() {
  const { id } = useParams()
  const [request, setRequest] = useState<MaintenanceRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const dialog = useDialog()

  // Form state
  const [status, setStatus] = useState("")
  const [remarks, setRemarks] = useState("")
  const [urgencyLevel, setUrgencyLevel] = useState("")
  const [repairScale, setRepairScale] = useState("")
  const [assignedTeam, setAssignedTeam] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
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
      const res = await fetch(`/api/parks/maintenance-request/${id}`)
      const data = await res.json()
      if (data.request) {
        setRequest(data.request)
        setStatus(data.request.status)
        setRemarks(data.request.remarks || "")
        setUrgencyLevel(data.request.urgencyLevel)
        setRepairScale(data.request.repairScale || "")
        setAssignedTeam(data.request.assignedTeam || "")
        setAssignedTo(data.request.assignedTo || "")
        setInspectionDate(data.request.inspectionScheduled ? new Date(data.request.inspectionScheduled).toISOString().split("T")[0] : "")
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
    if (!(await dialog.confirm("Are you sure you want to update this maintenance request?"))) return
    setSaving(true)
    try {
      const body: any = { status, remarks }
      if (urgencyLevel !== request?.urgencyLevel) body.urgencyLevel = urgencyLevel
      if (repairScale) body.repairScale = repairScale
      if (assignedTeam) body.assignedTeam = assignedTeam
      if (assignedTo) body.assignedTo = assignedTo
      if (inspectionDate) body.inspectionScheduled = inspectionDate
      if (inspectionNotes) body.inspectionNotes = inspectionNotes
      if (materialsStatus) body.materialsStatus = materialsStatus
      if (materialsNotes) body.materialsNotes = materialsNotes
      if (workReport) body.workReport = workReport

      const res = await fetch(`/api/parks/maintenance-request/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        await dialog.success("Maintenance request updated successfully!")
        fetchRequest()
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Request not found</p>
          <Link href="/services/parks/maintenance-verification" className="text-amber-600 hover:underline">Back to list</Link>
        </div>
      </div>
    )
  }

  const currentStep = statusFlow.indexOf(request.status)

  // Parse JSON photo arrays safely
  const parsePhotos = (json: string | null): string[] => {
    if (!json) return []
    try { return JSON.parse(json) } catch { return [] }
  }

  const inspPhotos = parsePhotos(request.inspectionPhotos)
  const beforePhotos = parsePhotos(request.beforePhotos)
  const afterPhotos = parsePhotos(request.afterPhotos)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-amber-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/services/parks/maintenance-verification" className="text-sm text-amber-100 hover:text-white mb-2 inline-block">
            ← Back to Maintenance Requests
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold">Maintenance Request - {request.parkLocation}</h1>
              <p className="text-amber-100 text-sm mt-1">ID: {request.id}</p>
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
                  i <= currentStep ? "bg-amber-600 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {i <= currentStep ? "✓" : i + 1}
                </div>
                <span className={`ml-2 text-xs hidden md:block ${i <= currentStep ? "text-amber-700 font-medium" : "text-gray-400"}`}>
                  {s.replace(/_/g, " ")}
                </span>
                {i < statusFlow.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${i < currentStep ? "bg-amber-600" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Request Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Reporter</p>
                  <p className="font-semibold">{request.reporterName || "Anonymous"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Park / Location</p>
                  <p className="font-semibold">{request.parkLocation}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Issue Category</p>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-amber-100 text-amber-800">
                    {categoryLabels[request.issueCategory] || request.issueCategory}
                    {request.issueCategoryOther && ` — ${request.issueCategoryOther}`}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Urgency</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                    request.urgencyLevel === "HAZARD" ? "bg-red-100 text-red-800" :
                    request.urgencyLevel === "PRIORITY" ? "bg-orange-100 text-orange-800" :
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {request.urgencyLevel}
                  </span>
                </div>
                {request.repairScale && (
                  <div>
                    <p className="text-xs text-gray-500">Repair Scale</p>
                    <p className="font-semibold">{request.repairScale}</p>
                  </div>
                )}
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

            {/* Submitted Photos */}
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

            {/* Inspection Details */}
            {request.inspectionScheduled && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Inspection Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Inspection Scheduled</p>
                    <p className="font-semibold">{new Date(request.inspectionScheduled).toLocaleDateString()}</p>
                  </div>
                  {request.assignedTo && (
                    <div>
                      <p className="text-xs text-gray-500">Inspector</p>
                      <p className="font-semibold">{request.assignedTo}</p>
                    </div>
                  )}
                  {request.inspectionNotes && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Inspection Notes</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.inspectionNotes}</p>
                    </div>
                  )}
                </div>
                {inspPhotos.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">Inspection Photos</p>
                    <div className="grid grid-cols-3 gap-3">
                      {inspPhotos.map((p, i) => (
                        <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={p} alt={`Inspection ${i + 1}`} className="w-full h-32 object-cover rounded-lg border" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Work Report */}
            {request.workReport && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Work Report</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.workReport}</p>
                {request.completedAt && (
                  <p className="text-xs text-gray-400 mt-3">Completed on {new Date(request.completedAt).toLocaleDateString()}</p>
                )}

                {/* Before/After Photos */}
                {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
                  <div className="mt-6 grid grid-cols-2 gap-6">
                    {beforePhotos.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2 font-medium">Before Photos</p>
                        <div className="space-y-2">
                          {beforePhotos.map((p, i) => (
                            <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="block">
                              <img src={p} alt={`Before ${i + 1}`} className="w-full h-32 object-cover rounded-lg border" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {afterPhotos.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2 font-medium">After Photos</p>
                        <div className="space-y-2">
                          {afterPhotos.map((p, i) => (
                            <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="block">
                              <img src={p} alt={`After ${i + 1}`} className="w-full h-32 object-cover rounded-lg border" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500">
                  <option value="LOGGED">Logged</option>
                  <option value="PENDING_INSPECTION">Pending Inspection</option>
                  <option value="UNDER_INSPECTION">Under Inspection</option>
                  <option value="APPROVED_FOR_REPAIR">Approved for Repair</option>
                  <option value="PENDING_MATERIALS">Pending Materials</option>
                  <option value="PENDING_CONTRACTOR">Pending Contractor</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CLOSED">Closed</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              {/* Urgency */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgency Level</label>
                <select value={urgencyLevel} onChange={(e) => setUrgencyLevel(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500">
                  <option value="NORMAL">Normal</option>
                  <option value="PRIORITY">Priority</option>
                  <option value="HAZARD">Hazard</option>
                </select>
              </div>

              {/* Repair Scale */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Repair Scale</label>
                <select value={repairScale} onChange={(e) => setRepairScale(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500">
                  <option value="">— Not Set —</option>
                  <option value="MINOR">Minor</option>
                  <option value="MAJOR">Major</option>
                </select>
              </div>

              {/* Assigned Team */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Team</label>
                <input type="text" value={assignedTeam} onChange={(e) => setAssignedTeam(e.target.value)}
                  placeholder="e.g., Parks Maintenance Crew A"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" />
              </div>

              {/* Assigned To */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To (Person)</label>
                <input type="text" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="e.g., Juan Dela Cruz"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" />
              </div>

              {/* Inspection Date */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Date</label>
                <input type="date" value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" />
              </div>

              {/* Inspection Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Notes</label>
                <textarea value={inspectionNotes} onChange={(e) => setInspectionNotes(e.target.value)} rows={3}
                  placeholder="Findings after site inspection..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" />
              </div>

              {/* Materials Status */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Materials Status</label>
                <select value={materialsStatus} onChange={(e) => setMaterialsStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500">
                  <option value="">— Select —</option>
                  <option value="Available">Available</option>
                  <option value="Needs Procurement">Needs Procurement</option>
                  <option value="Needs Contractor">Needs Contractor</option>
                  <option value="No Materials Needed">No Materials Needed</option>
                </select>
              </div>

              {/* Materials Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Materials Notes</label>
                <textarea value={materialsNotes} onChange={(e) => setMaterialsNotes(e.target.value)} rows={2}
                  placeholder="List required materials..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" />
              </div>

              {/* Work Report */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Report</label>
                <textarea value={workReport} onChange={(e) => setWorkReport(e.target.value)} rows={4}
                  placeholder="Summary of work done..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" />
              </div>

              {/* Remarks */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3}
                  placeholder="Any notes or remarks..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" />
              </div>

              <button onClick={handleUpdate} disabled={saving}
                className="w-full py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 font-semibold transition-colors">
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
                {request.assignedTeam && (
                  <div>
                    <p className="text-xs text-gray-500">Assigned Team</p>
                    <p className="text-gray-700">{request.assignedTeam}</p>
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
                {request.workStartedAt && (
                  <div>
                    <p className="text-xs text-gray-500">Work Started</p>
                    <p className="text-gray-700">{new Date(request.workStartedAt).toLocaleString()}</p>
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
