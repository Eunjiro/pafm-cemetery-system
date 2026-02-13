"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

interface WaterConnection {
  id: string
  applicantName: string
  contactNumber: string
  email: string | null
  street: string
  barangay: string
  structureType: string
  validId: string | null
  propertyProof: string | null
  status: string
  remarks: string | null
  assignedInspector: string | null
  inspectionDate: string | null
  mainlineAvailable: boolean | null
  tappingPointAvailable: boolean | null
  pipeDistance: number | null
  estimatedMaterials: string | null
  inspectionNotes: string | null
  pipeSize: string | null
  connectionFee: number | null
  paymentType: string | null
  orNumber: string | null
  paymentConfirmedBy: string | null
  paymentConfirmedAt: string | null
  assignedTeam: string | null
  installationDate: string | null
  installationStatus: string | null
  installationNotes: string | null
  processedBy: string | null
  processedAt: string | null
  createdAt: string
  user: { name: string; email: string }
}

const FEE_MATRIX: Record<string, { full: number; installment?: number }> = {
  '13mm (½")': { full: 3900, installment: 4200 },
  '20mm (¾")': { full: 21450 },
  '25mm (1")': { full: 24700 },
  '40mm (1½")': { full: 33800 },
  '50mm (2")': { full: 42250 },
  '100mm (4")': { full: 81900 },
  '150mm (6")': { full: 104000 },
  '200mm (8")': { full: 158600 },
}

const statusFlow = [
  "PENDING_EVALUATION",
  "RETURNED_INCOMPLETE",
  "FOR_INSPECTION",
  "FOR_BILLING",
  "AWAITING_PAYMENT",
  "PAYMENT_CONFIRMED",
  "INSTALLATION_SCHEDULED",
  "INSTALLATION_ONGOING",
  "ACTIVE_CONNECTION"
]

const statusColors: Record<string, string> = {
  PENDING_EVALUATION: "bg-yellow-100 text-yellow-800 border-yellow-300",
  RETURNED_INCOMPLETE: "bg-orange-100 text-orange-800 border-orange-300",
  FOR_INSPECTION: "bg-blue-100 text-blue-800 border-blue-300",
  FOR_BILLING: "bg-indigo-100 text-indigo-800 border-indigo-300",
  AWAITING_PAYMENT: "bg-amber-100 text-amber-800 border-amber-300",
  PAYMENT_CONFIRMED: "bg-green-100 text-green-800 border-green-300",
  INSTALLATION_SCHEDULED: "bg-purple-100 text-purple-800 border-purple-300",
  INSTALLATION_ONGOING: "bg-teal-100 text-teal-800 border-teal-300",
  ACTIVE_CONNECTION: "bg-emerald-100 text-emerald-800 border-emerald-300",
  REJECTED: "bg-red-100 text-red-800 border-red-300",
}

export default function ConnectionVerificationDetailPage() {
  const { id } = useParams()
  const [conn, setConn] = useState<WaterConnection | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"status" | "inspection" | "billing" | "installation">("status")

  // Form states
  const [status, setStatus] = useState("")
  const [remarks, setRemarks] = useState("")
  const [assignedInspector, setAssignedInspector] = useState("")
  const [inspectionDate, setInspectionDate] = useState("")
  const [mainlineAvailable, setMainlineAvailable] = useState<boolean | null>(null)
  const [tappingPointAvailable, setTappingPointAvailable] = useState<boolean | null>(null)
  const [pipeDistance, setPipeDistance] = useState("")
  const [estimatedMaterials, setEstimatedMaterials] = useState("")
  const [inspectionNotes, setInspectionNotes] = useState("")
  const [pipeSize, setPipeSize] = useState("")
  const [connectionFee, setConnectionFee] = useState("")
  const [paymentType, setPaymentType] = useState("")
  const [orNumber, setOrNumber] = useState("")
  const [assignedTeam, setAssignedTeam] = useState("")
  const [installationDate, setInstallationDate] = useState("")
  const [installationStatus, setInstallationStatus] = useState("")
  const [installationNotes, setInstallationNotes] = useState("")

  useEffect(() => { fetchConnection() }, [id])

  const fetchConnection = async () => {
    try {
      const res = await fetch(`/api/water/connection/${id}`)
      const data = await res.json()
      if (data.connection) {
        const c = data.connection
        setConn(c)
        setStatus(c.status)
        setRemarks(c.remarks || "")
        setAssignedInspector(c.assignedInspector || "")
        setInspectionDate(c.inspectionDate ? new Date(c.inspectionDate).toISOString().split("T")[0] : "")
        setMainlineAvailable(c.mainlineAvailable)
        setTappingPointAvailable(c.tappingPointAvailable)
        setPipeDistance(c.pipeDistance?.toString() || "")
        setEstimatedMaterials(c.estimatedMaterials || "")
        setInspectionNotes(c.inspectionNotes || "")
        setPipeSize(c.pipeSize || "")
        setConnectionFee(c.connectionFee?.toString() || "")
        setPaymentType(c.paymentType || "")
        setOrNumber(c.orNumber || "")
        setAssignedTeam(c.assignedTeam || "")
        setInstallationDate(c.installationDate ? new Date(c.installationDate).toISOString().split("T")[0] : "")
        setInstallationStatus(c.installationStatus || "")
        setInstallationNotes(c.installationNotes || "")
      }
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (updateBody: any) => {
    if (!confirm("Are you sure you want to update this application?")) return
    setSaving(true)
    try {
      const res = await fetch(`/api/water/connection/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateBody),
      })
      if (res.ok) {
        alert("Application updated successfully!")
        fetchConnection()
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

  const handleStatusUpdate = () => {
    handleUpdate({ status, remarks })
  }

  const handleInspectionUpdate = () => {
    const body: any = {
      status: "FOR_BILLING",
      assignedInspector,
      inspectionNotes,
    }
    if (inspectionDate) body.inspectionDate = inspectionDate
    if (mainlineAvailable !== null) body.mainlineAvailable = mainlineAvailable
    if (tappingPointAvailable !== null) body.tappingPointAvailable = tappingPointAvailable
    if (pipeDistance) body.pipeDistance = parseFloat(pipeDistance)
    if (estimatedMaterials) body.estimatedMaterials = estimatedMaterials
    handleUpdate(body)
  }

  const handleBillingUpdate = () => {
    const body: any = {
      status: "AWAITING_PAYMENT",
      pipeSize,
      paymentType,
      remarks,
    }
    if (connectionFee) body.connectionFee = parseFloat(connectionFee)
    handleUpdate(body)
  }

  const handlePaymentConfirm = () => {
    if (!orNumber.trim()) {
      alert("Please enter the Official Receipt (OR) number")
      return
    }
    handleUpdate({ orNumber })
  }

  const handleInstallationUpdate = () => {
    const body: any = {
      status,
      assignedTeam,
      installationNotes,
    }
    if (installationDate) body.installationDate = installationDate
    if (installationStatus) body.installationStatus = installationStatus
    handleUpdate(body)
  }

  // Auto-fill fee when pipe size changes
  const handlePipeSizeChange = (size: string) => {
    setPipeSize(size)
    const fee = FEE_MATRIX[size]
    if (fee) {
      if (paymentType === "INSTALLMENT" && fee.installment) {
        setConnectionFee(fee.installment.toString())
      } else {
        setConnectionFee(fee.full.toString())
      }
    }
  }

  const handlePaymentTypeChange = (type: string) => {
    setPaymentType(type)
    const fee = FEE_MATRIX[pipeSize]
    if (fee) {
      if (type === "INSTALLMENT" && fee.installment) {
        setConnectionFee(fee.installment.toString())
      } else {
        setConnectionFee(fee.full.toString())
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!conn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Application not found</p>
          <Link href="/services/water/connection-verification" className="text-blue-600 hover:underline">Back to list</Link>
        </div>
      </div>
    )
  }

  const currentStep = statusFlow.indexOf(conn.status)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/services/water/connection-verification" className="text-sm text-blue-100 hover:text-white mb-2 inline-block">
            ← Back to Applications
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold">Water Connection - {conn.applicantName}</h1>
              <p className="text-blue-100 text-sm mt-1">ID: {conn.id}</p>
            </div>
            <span className={`px-4 py-2 rounded-lg text-sm font-bold border ${statusColors[conn.status]}`}>
              {conn.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Tracker */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 overflow-x-auto">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">APPLICATION WORKFLOW</h3>
          <div className="flex items-center min-w-[700px]">
            {statusFlow.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 ${
                  i <= currentStep ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {i <= currentStep ? "✓" : i + 1}
                </div>
                <span className={`ml-1 text-[10px] ${i <= currentStep ? "text-blue-700 font-medium" : "text-gray-400"}`}>
                  {s.replace(/_/g, " ")}
                </span>
                {i < statusFlow.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${i < currentStep ? "bg-blue-600" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Application Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Applicant Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Applicant Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Applicant Name</p>
                  <p className="font-semibold">{conn.applicantName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Contact</p>
                  <p className="font-semibold">{conn.contactNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Installation Street</p>
                  <p className="font-semibold">{conn.street}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Installation Barangay</p>
                  <p className="font-semibold">{conn.barangay}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Structure Type</p>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                    {conn.structureType.replace(/_/g, " ")}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Submitted By</p>
                  <p className="font-semibold">{conn.user.name}</p>
                  <p className="text-xs text-gray-500">{conn.user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date Applied</p>
                  <p className="font-semibold">{new Date(conn.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Uploaded Documents</h2>
              <div className="grid grid-cols-2 gap-4">
                {conn.validId && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Valid ID</p>
                    <a href={conn.validId} target="_blank" rel="noopener noreferrer" className="block">
                      {conn.validId.toLowerCase().endsWith(".pdf") ? (
                        <div className="w-full h-40 flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition">
                          <svg className="w-10 h-10 text-red-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                          <span className="text-sm text-gray-600 font-medium">View PDF</span>
                        </div>
                      ) : (
                        <img src={conn.validId} alt="Valid ID" className="w-full h-40 object-cover rounded-lg border hover:opacity-75 transition" />
                      )}
                    </a>
                  </div>
                )}
                {conn.propertyProof && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Property Proof</p>
                    <a href={conn.propertyProof} target="_blank" rel="noopener noreferrer" className="block">
                      {conn.propertyProof.toLowerCase().endsWith(".pdf") ? (
                        <div className="w-full h-40 flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition">
                          <svg className="w-10 h-10 text-red-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                          <span className="text-sm text-gray-600 font-medium">View PDF</span>
                        </div>
                      ) : (
                        <img src={conn.propertyProof} alt="Property Proof" className="w-full h-40 object-cover rounded-lg border hover:opacity-75 transition" />
                      )}
                    </a>
                  </div>
                )}
                {!conn.validId && !conn.propertyProof && (
                  <div className="col-span-2 text-center py-8 text-gray-400">
                    <p>No documents uploaded</p>
                  </div>
                )}
              </div>
            </div>

            {/* Inspection Results (if done) */}
            {conn.inspectionDate && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Inspection Results</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Inspector</p>
                    <p className="font-semibold">{conn.assignedInspector || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Inspection Date</p>
                    <p className="font-semibold">{new Date(conn.inspectionDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Mainline Available</p>
                    <p className={`font-semibold ${conn.mainlineAvailable ? "text-green-600" : "text-red-600"}`}>
                      {conn.mainlineAvailable === null ? "—" : conn.mainlineAvailable ? "Yes" : "No"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tapping Point Available</p>
                    <p className={`font-semibold ${conn.tappingPointAvailable ? "text-green-600" : "text-red-600"}`}>
                      {conn.tappingPointAvailable === null ? "—" : conn.tappingPointAvailable ? "Yes" : "No"}
                    </p>
                  </div>
                  {conn.pipeDistance !== null && (
                    <div>
                      <p className="text-xs text-gray-500">Pipe Distance (meters)</p>
                      <p className="font-semibold">{conn.pipeDistance}m</p>
                    </div>
                  )}
                  {conn.estimatedMaterials && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Estimated Materials</p>
                      <p className="text-sm whitespace-pre-wrap">{conn.estimatedMaterials}</p>
                    </div>
                  )}
                  {conn.inspectionNotes && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Notes</p>
                      <p className="text-sm whitespace-pre-wrap">{conn.inspectionNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Info (if set) */}
            {conn.connectionFee && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Billing & Payment</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Pipe Size</p>
                    <p className="font-semibold">{conn.pipeSize || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Connection Fee</p>
                    <p className="font-semibold text-lg text-blue-700">₱{conn.connectionFee.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Payment Type</p>
                    <p className="font-semibold">{conn.paymentType || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">OR Number</p>
                    <p className={`font-semibold ${conn.orNumber ? "text-green-600" : "text-gray-400"}`}>
                      {conn.orNumber || "Not yet paid"}
                    </p>
                  </div>
                  {conn.paymentConfirmedAt && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Payment Confirmed On</p>
                      <p className="font-semibold text-green-600">{new Date(conn.paymentConfirmedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right - Action Panel */}
          <div className="space-y-6">
            {/* Tab Buttons */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="grid grid-cols-2 gap-0">
                {[
                  { key: "status", label: "Status" },
                  { key: "inspection", label: "Inspection" },
                  { key: "billing", label: "Billing" },
                  { key: "installation", label: "Install" },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? "bg-blue-600 text-white"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* STATUS TAB */}
                {activeTab === "status" && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4">Update Status</h3>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                        {statusFlow.map(s => (
                          <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                        ))}
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                      <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Notes for the applicant..." />
                    </div>
                    <button onClick={handleStatusUpdate} disabled={saving} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold">
                      {saving ? "Saving..." : "Update Status"}
                    </button>
                  </div>
                )}

                {/* INSPECTION TAB */}
                {activeTab === "inspection" && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4">Inspection Details</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Inspector Name</label>
                        <input type="text" value={assignedInspector} onChange={(e) => setAssignedInspector(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Inspector assigned" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Date</label>
                        <input type="date" value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mainline?</label>
                          <select value={mainlineAvailable === null ? "" : mainlineAvailable ? "yes" : "no"} onChange={(e) => setMainlineAvailable(e.target.value === "yes" ? true : e.target.value === "no" ? false : null)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="">—</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tapping Point?</label>
                          <select value={tappingPointAvailable === null ? "" : tappingPointAvailable ? "yes" : "no"} onChange={(e) => setTappingPointAvailable(e.target.value === "yes" ? true : e.target.value === "no" ? false : null)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="">—</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pipe Distance (m)</label>
                        <input type="number" value={pipeDistance} onChange={(e) => setPipeDistance(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Distance in meters" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Materials</label>
                        <textarea value={estimatedMaterials} onChange={(e) => setEstimatedMaterials(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="List of materials..." />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Notes</label>
                        <textarea value={inspectionNotes} onChange={(e) => setInspectionNotes(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Findings and recommendations..." />
                      </div>
                      <button onClick={handleInspectionUpdate} disabled={saving} className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold">
                        {saving ? "Saving..." : "Submit Inspection"}
                      </button>
                    </div>
                  </div>
                )}

                {/* BILLING TAB */}
                {activeTab === "billing" && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4">Generate Billing</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pipe Size *</label>
                        <select value={pipeSize} onChange={(e) => handlePipeSizeChange(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                          <option value="">Select pipe size</option>
                          {Object.keys(FEE_MATRIX).map(size => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type *</label>
                        <select value={paymentType} onChange={(e) => handlePaymentTypeChange(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                          <option value="">Select type</option>
                          <option value="FULL_PAYMENT">Full Payment</option>
                          <option value="INSTALLMENT">Installment (13mm only)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Connection Fee (₱)</label>
                        <input type="number" value={connectionFee} onChange={(e) => setConnectionFee(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold text-blue-700" />
                      </div>

                      {/* Fee Reference */}
                      <div className="bg-blue-50 rounded-lg p-3 mt-3">
                        <p className="text-xs font-semibold text-blue-800 mb-2">Fee Matrix Reference:</p>
                        <div className="space-y-1 text-xs text-blue-700">
                          {Object.entries(FEE_MATRIX).map(([size, fee]) => (
                            <div key={size} className="flex justify-between">
                              <span>{size}</span>
                              <span>₱{fee.full.toLocaleString()}{fee.installment ? ` / ₱${fee.installment.toLocaleString()}` : ""}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button onClick={handleBillingUpdate} disabled={saving || !pipeSize || !connectionFee} className="w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-semibold">
                        {saving ? "Saving..." : "Generate Billing & Notify"}
                      </button>

                      {/* Payment Confirmation */}
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Cashier Payment Confirmation</h4>
                        <p className="text-xs text-gray-500 mb-2">Enter the OR number after the citizen has paid at the cashier window.</p>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">OR Number *</label>
                          <input type="text" value={orNumber} onChange={(e) => setOrNumber(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g., 2025-001234" />
                        </div>
                        <button onClick={handlePaymentConfirm} disabled={saving || !orNumber.trim()} className="w-full mt-3 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold">
                          {saving ? "Confirming..." : "Confirm Payment (Cashier)"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* INSTALLATION TAB */}
                {activeTab === "installation" && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4">Installation</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                          <option value="INSTALLATION_SCHEDULED">Installation Scheduled</option>
                          <option value="INSTALLATION_ONGOING">Installation Ongoing</option>
                          <option value="ACTIVE_CONNECTION">Active Connection</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Team</label>
                        <input type="text" value={assignedTeam} onChange={(e) => setAssignedTeam(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Installation team name" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Installation Date</label>
                        <input type="date" value={installationDate} onChange={(e) => setInstallationDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Installation Status</label>
                        <input type="text" value={installationStatus} onChange={(e) => setInstallationStatus(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g., Pipe laying complete" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea value={installationNotes} onChange={(e) => setInstallationNotes(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Installation progress notes..." />
                      </div>
                      <button onClick={handleInstallationUpdate} disabled={saving} className="w-full py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 font-semibold">
                        {saving ? "Saving..." : "Update Installation"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Processing Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">PROCESSING INFO</h3>
              <div className="space-y-2 text-sm">
                {conn.processedAt && (
                  <div>
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <p className="text-gray-700">{new Date(conn.processedAt).toLocaleString()}</p>
                  </div>
                )}
                {conn.remarks && (
                  <div>
                    <p className="text-xs text-gray-500">Remarks</p>
                    <p className="text-gray-700">{conn.remarks}</p>
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
