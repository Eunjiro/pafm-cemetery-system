"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"


interface RequisitionItem {
  id: string
  itemId: string
  requestedQty: number
  approvedQty: number | null
  issuedQty: number | null
  remarks: string | null
  item: { name: string; itemCode: string; currentStock: number; unit: string }
}

interface Requisition {
  id: string
  risNumber: string
  requestingOffice: string
  requestedBy: string
  purpose: string
  approvedBy: string | null
  approvedByName: string | null
  approvedAt: string | null
  rejectionReason: string | null
  issuedBy: string | null
  issuedByName: string | null
  issuedAt: string | null
  acknowledgement: string | null
  status: string
  remarks: string | null
  createdAt: string
  items: RequisitionItem[]
}

interface Stats {
  pending: number
  approved: number
  forRelease: number
  issued: number
  rejected: number
}

interface InventoryItemOption {
  id: string
  itemCode: string
  name: string
  currentStock: number
  unit: string
}

const statusColors: Record<string, string> = {
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-800 border-yellow-200",
  APPROVED: "bg-blue-100 text-blue-800 border-blue-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  PENDING_STOCK: "bg-orange-100 text-orange-800 border-orange-200",
  FOR_RELEASE: "bg-indigo-100 text-indigo-800 border-indigo-200",
  ISSUED: "bg-green-100 text-green-800 border-green-200",
}

const formatStatus = (s: string) => s.replace(/_/g, " ")

export default function RequisitionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, forRelease: 0, issued: 0, rejected: 0 })
  const [statusFilter, setStatusFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null)
  const [processing, setProcessing] = useState(false)
  const [availableItems, setAvailableItems] = useState<InventoryItemOption[]>([])

  const [form, setForm] = useState({ requestingOffice: "", requestedBy: "", purpose: "" })
  const [formItems, setFormItems] = useState<Array<{ itemId: string; requestedQty: string; remarks: string }>>([
    { itemId: "", requestedQty: "", remarks: "" }
  ])

  // Action modals
  const [actionModal, setActionModal] = useState<"approve" | "reject" | "release" | "issue" | null>(null)
  const [actionRemarks, setActionRemarks] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [acknowledgement, setAcknowledgement] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    else if (status === "authenticated" && session?.user?.role !== "ADMIN") router.push("/dashboard")
  }, [status, session, router])

  useEffect(() => {
    if (searchParams.get("new") === "true") openCreateModal()
  }, [searchParams])

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchRequisitions = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      if (searchTerm) params.set("search", searchTerm)
      const res = await fetch(`/api/admin/inventory/requisitions?${params}`)
      const data = await res.json()
      setRequisitions(data.requisitions || [])
      setStats(data.stats || { pending: 0, approved: 0, forRelease: 0, issued: 0, rejected: 0 })
    } catch (error) {
      console.error("Fetch error:", error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchTerm])

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") fetchRequisitions()
  }, [status, session, fetchRequisitions])

  const fetchAvailableItems = async () => {
    try {
      const res = await fetch("/api/admin/inventory/items?limit=500")
      const data = await res.json()
      setAvailableItems((data.items || []).filter((i: any) => i.currentStock > 0))
    } catch (error) {
      console.error("Fetch items error:", error)
    }
  }

  const openCreateModal = async () => {
    await fetchAvailableItems()
    setShowCreateModal(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.requestingOffice || !form.requestedBy || !form.purpose || formItems.some(i => !i.itemId || !i.requestedQty)) {
      showToast("error", "Fill all required fields"); return
    }
    setProcessing(true)
    try {
      const res = await fetch("/api/admin/inventory/requisitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: formItems.map(i => ({ itemId: i.itemId, requestedQty: parseInt(i.requestedQty), remarks: i.remarks }))
        })
      })
      const data = await res.json()
      if (res.ok) {
        showToast("success", `Requisition ${data.requisition.risNumber} submitted`)
        setShowCreateModal(false)
        setForm({ requestingOffice: "", requestedBy: "", purpose: "" })
        setFormItems([{ itemId: "", requestedQty: "", remarks: "" }])
        fetchRequisitions()
      } else {
        showToast("error", data.error)
      }
    } catch (error) {
      showToast("error", "Failed to create requisition")
    } finally {
      setProcessing(false)
    }
  }

  const viewRequisition = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/inventory/requisitions/${id}`)
      const data = await res.json()
      if (data.requisition) {
        setSelectedReq(data.requisition)
        setShowDetailModal(true)
      }
    } catch (error) {
      showToast("error", "Failed to load requisition")
    }
  }

  const handleAction = async (action: string) => {
    if (!selectedReq) return
    setProcessing(true)
    try {
      const body: any = { action, remarks: actionRemarks }
      if (action === "reject") body.rejectionReason = rejectionReason
      if (action === "issue") body.acknowledgement = acknowledgement

      const res = await fetch(`/api/admin/inventory/requisitions/${selectedReq.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (res.ok) {
        const messages: Record<string, string> = {
          approve: "Requisition approved",
          reject: "Requisition rejected",
          release: "Requisition prepared for release",
          issue: "Items issued successfully",
        }
        showToast("success", messages[action] || "Action completed")
        setActionModal(null)
        setShowDetailModal(false)
        setActionRemarks("")
        setRejectionReason("")
        setAcknowledgement("")
        fetchRequisitions()
      } else {
        showToast("error", data.error)
      }
    } catch (error) {
      showToast("error", "Action failed")
    } finally {
      setProcessing(false)
    }
  }

  const addItem = () => setFormItems([...formItems, { itemId: "", requestedQty: "", remarks: "" }])
  const removeItem = (idx: number) => { if (formItems.length > 1) setFormItems(formItems.filter((_, i) => i !== idx)) }
  const updateItem = (idx: number, field: string, value: string) => {
    const updated = [...formItems]
    updated[idx] = { ...updated[idx], [field]: value }
    setFormItems(updated)
  }

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Requisitions & Issuance (RIS)</h2>
      </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[
            { label: "Pending", value: stats.pending, color: "border-yellow-500 bg-yellow-50", filter: "PENDING_APPROVAL" },
            { label: "Approved", value: stats.approved, color: "border-blue-500 bg-blue-50", filter: "APPROVED" },
            { label: "For Release", value: stats.forRelease, color: "border-indigo-500 bg-indigo-50", filter: "FOR_RELEASE" },
            { label: "Issued", value: stats.issued, color: "border-green-500 bg-green-50", filter: "ISSUED" },
            { label: "Rejected", value: stats.rejected, color: "border-red-500 bg-red-50", filter: "REJECTED" },
          ].map(s => (
            <button key={s.label} onClick={() => setStatusFilter(statusFilter === s.filter ? "" : s.filter)}
              className={`bg-white rounded-xl border-l-4 ${s.color} p-3 shadow-sm text-left hover:shadow-md transition-shadow ${statusFilter === s.filter ? "ring-2 ring-purple-500" : ""}`}>
              <p className="text-xs text-gray-500 uppercase">{s.label}</p>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="text" placeholder="Search by RIS #, office, staff..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm">
              <option value="">All Status</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="FOR_RELEASE">For Release</option>
              <option value="ISSUED">Issued</option>
              <option value="REJECTED">Rejected</option>
              <option value="PENDING_STOCK">Pending Stock</option>
            </select>
            <button onClick={openCreateModal}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm whitespace-nowrap">
              + New Requisition
            </button>
          </div>
        </div>

        {/* Requisitions List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : requisitions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <span className="text-5xl mb-4 block">📋</span>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No requisitions found</h3>
            <p className="text-gray-500 mb-4">Create a new Requisition and Issue Slip (RIS)</p>
            <button onClick={openCreateModal} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
              Submit First Requisition
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {requisitions.map(req => (
              <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => viewRequisition(req.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="text-base font-semibold text-gray-900">{req.risNumber}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[req.status]}`}>
                        {formatStatus(req.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Office:</span> {req.requestingOffice} · 
                      <span className="font-medium ml-2">By:</span> {req.requestedBy} · 
                      <span className="font-medium ml-2">Items:</span> {req.items.length}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{req.purpose}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</p>
                    <svg className="w-5 h-5 text-gray-400 mt-2 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 mb-10">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">New Requisition & Issue Slip (RIS)</h2>
                <p className="text-sm text-gray-500">Submit an inter-departmental asset request</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Requesting Office / Department *</label>
                  <input type="text" value={form.requestingOffice} onChange={e => setForm({...form, requestingOffice: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" required
                    placeholder="e.g., City Engineering Office" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Requested By *</label>
                  <input type="text" value={form.requestedBy} onChange={e => setForm({...form, requestedBy: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose / Justification *</label>
                <textarea value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" rows={2} required />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase">Requested Items</h3>
                  <button type="button" onClick={addItem} className="text-sm text-purple-600 hover:text-purple-800 font-medium">+ Add Item</button>
                </div>
                <div className="space-y-3">
                  {formItems.map((item, idx) => {
                    const selected = availableItems.find(i => i.id === item.itemId)
                    return (
                      <div key={idx} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                          <select value={item.itemId} onChange={e => updateItem(idx, "itemId", e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm" required>
                            <option value="">Select Item...</option>
                            {availableItems.map(i => (
                              <option key={i.id} value={i.id}>{i.itemCode} - {i.name} (Stock: {i.currentStock} {i.unit})</option>
                            ))}
                          </select>
                          <input type="number" placeholder={`Qty${selected ? ` (max: ${selected.currentStock})` : ""}`}
                            value={item.requestedQty} min="1" max={selected?.currentStock}
                            onChange={e => updateItem(idx, "requestedQty", e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
                          <input type="text" placeholder="Remarks (optional)" value={item.remarks}
                            onChange={e => updateItem(idx, "remarks", e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                        {formItems.length > 1 && (
                          <button type="button" onClick={() => removeItem(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={processing} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium">
                  {processing ? "Submitting..." : "Submit RIS"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedReq && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 mb-10">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedReq.risNumber}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[selectedReq.status]}`}>
                    {formatStatus(selectedReq.status)}
                  </span>
                  <span className="text-sm text-gray-500">{selectedReq.requestingOffice}</span>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Requested By</p>
                  <p className="text-sm font-medium">{selectedReq.requestedBy}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Date Submitted</p>
                  <p className="text-sm font-medium">{new Date(selectedReq.createdAt).toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 uppercase">Purpose</p>
                  <p className="text-sm">{selectedReq.purpose}</p>
                </div>
                {selectedReq.approvedByName && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">{selectedReq.status === "REJECTED" ? "Rejected" : "Approved"} By</p>
                    <p className="text-sm font-medium">{selectedReq.approvedByName}</p>
                    <p className="text-xs text-gray-400">{selectedReq.approvedAt && new Date(selectedReq.approvedAt).toLocaleString()}</p>
                  </div>
                )}
                {selectedReq.rejectionReason && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Rejection Reason</p>
                    <p className="text-sm text-red-600">{selectedReq.rejectionReason}</p>
                  </div>
                )}
                {selectedReq.issuedByName && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Issued By</p>
                    <p className="text-sm font-medium">{selectedReq.issuedByName}</p>
                    <p className="text-xs text-gray-400">{selectedReq.issuedAt && new Date(selectedReq.issuedAt).toLocaleString()}</p>
                  </div>
                )}
                {selectedReq.remarks && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Remarks</p>
                    <p className="text-sm">{selectedReq.remarks}</p>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Requested Items ({selectedReq.items.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left py-2 px-3">Item</th>
                        <th className="text-right py-2 px-3">Stock</th>
                        <th className="text-right py-2 px-3">Requested</th>
                        <th className="text-right py-2 px-3">Approved</th>
                        <th className="text-right py-2 px-3">Issued</th>
                        <th className="text-left py-2 px-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReq.items.map(item => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-2 px-3">
                            <p className="font-medium">{item.item.name}</p>
                            <p className="text-xs text-gray-400">{item.item.itemCode}</p>
                          </td>
                          <td className="py-2 px-3 text-right text-gray-500">{item.item.currentStock} {item.item.unit}</td>
                          <td className="py-2 px-3 text-right">{item.requestedQty}</td>
                          <td className="py-2 px-3 text-right font-medium">{item.approvedQty ?? "-"}</td>
                          <td className="py-2 px-3 text-right font-medium">{item.issuedQty ?? "-"}</td>
                          <td className="py-2 px-3 text-gray-500">{item.remarks || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status Timeline */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Timeline</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <p className="text-sm"><span className="font-medium">Submitted</span> — {new Date(selectedReq.createdAt).toLocaleString()}</p>
                  </div>
                  {selectedReq.approvedAt && (
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${selectedReq.status === "REJECTED" ? "bg-red-500" : "bg-blue-500"}`}></div>
                      <p className="text-sm"><span className="font-medium">{selectedReq.status === "REJECTED" ? "Rejected" : "Approved"}</span> by {selectedReq.approvedByName} — {new Date(selectedReq.approvedAt).toLocaleString()}</p>
                    </div>
                  )}
                  {selectedReq.issuedAt && (
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <p className="text-sm"><span className="font-medium">Issued</span> by {selectedReq.issuedByName} — {new Date(selectedReq.issuedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Close</button>
                {selectedReq.status === "PENDING_APPROVAL" && (<>
                  <button onClick={() => setActionModal("reject")} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">Reject</button>
                  <button onClick={() => setActionModal("approve")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Approve</button>
                </>)}
                {selectedReq.status === "APPROVED" && (<>
                  <button onClick={() => setActionModal("release")} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Prepare for Release</button>
                  <button onClick={() => setActionModal("issue")} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">Issue Items</button>
                </>)}
                {selectedReq.status === "FOR_RELEASE" && (
                  <button onClick={() => setActionModal("issue")} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">Issue Items</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {actionModal === "approve" && "Approve Requisition"}
                {actionModal === "reject" && "Reject Requisition"}
                {actionModal === "release" && "Prepare for Release"}
                {actionModal === "issue" && "Issue Items"}
              </h3>

              {actionModal === "reject" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
                  <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows={3} required
                    placeholder="Provide reason for rejection..." />
                </div>
              )}

              {actionModal === "issue" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Acknowledgement</label>
                  <textarea value={acknowledgement} onChange={e => setAcknowledgement(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows={2}
                    placeholder="Received by / digital acknowledgement..." />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea value={actionRemarks} onChange={e => setActionRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows={2} />
              </div>

              <div className="flex justify-end space-x-3">
                <button onClick={() => setActionModal(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={() => handleAction(actionModal)} disabled={processing || (actionModal === "reject" && !rejectionReason)}
                  className={`px-6 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 ${
                    actionModal === "reject" ? "bg-red-600 hover:bg-red-700" :
                    actionModal === "issue" ? "bg-green-600 hover:bg-green-700" :
                    "bg-blue-600 hover:bg-blue-700"
                  }`}>
                  {processing ? "Processing..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
