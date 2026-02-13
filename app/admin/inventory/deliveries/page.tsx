"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"


interface DeliveryItem {
  id: string
  itemId: string | null
  itemName: string
  description: string | null
  quantity: number
  unit: string
  verifiedQty: number | null
  remarks: string | null
  item: { name: string; itemCode: string } | null
}

interface Delivery {
  id: string
  deliveryNumber: string
  supplierName: string
  supplierContact: string | null
  supplierAddress: string | null
  purchaseOrderNumber: string
  purchaseOrderFile: string | null
  deliveryReceiptNumber: string | null
  deliveryReceiptFile: string | null
  noticeOfDelivery: string | null
  deliveryDate: string
  receivedByName: string | null
  remarks: string | null
  status: string
  verifiedBy: string | null
  verifiedAt: string | null
  storedAt: string | null
  createdAt: string
  items: DeliveryItem[]
}

interface Stats {
  pending: number
  verified: number
  stored: number
}

const statusColors: Record<string, string> = {
  PENDING_VERIFICATION: "bg-yellow-100 text-yellow-800 border-yellow-200",
  VERIFIED: "bg-blue-100 text-blue-800 border-blue-200",
  STORED: "bg-green-100 text-green-800 border-green-200",
}

const formatStatus = (s: string) => s.replace(/_/g, " ")

export default function DeliveriesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [stats, setStats] = useState<Stats>({ pending: 0, verified: 0, stored: 0 })
  const [statusFilter, setStatusFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [processing, setProcessing] = useState(false)

  // Create form
  const [form, setForm] = useState({
    supplierName: "", supplierContact: "", supplierAddress: "",
    purchaseOrderNumber: "", deliveryReceiptNumber: "", remarks: "",
  })
  const [formItems, setFormItems] = useState<Array<{ itemName: string; description: string; quantity: string; unit: string }>>([
    { itemName: "", description: "", quantity: "", unit: "pcs" }
  ])
  const [poFile, setPoFile] = useState<File | null>(null)
  const [drFile, setDrFile] = useState<File | null>(null)
  const [nodFile, setNodFile] = useState<File | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    else if (status === "authenticated" && session?.user?.role !== "ADMIN") router.push("/dashboard")
  }, [status, session, router])

  useEffect(() => {
    if (searchParams.get("new") === "true") setShowCreateModal(true)
  }, [searchParams])

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      if (searchTerm) params.set("search", searchTerm)
      const res = await fetch(`/api/admin/inventory/deliveries?${params}`)
      const data = await res.json()
      setDeliveries(data.deliveries || [])
      setStats(data.stats || { pending: 0, verified: 0, stored: 0 })
    } catch (error) {
      console.error("Fetch error:", error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchTerm])

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") fetchDeliveries()
  }, [status, session, fetchDeliveries])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.supplierName || !form.purchaseOrderNumber || formItems.some(i => !i.itemName || !i.quantity)) {
      showToast("error", "Please fill all required fields")
      return
    }

    setProcessing(true)
    try {
      const fd = new FormData()
      fd.append("supplierName", form.supplierName)
      fd.append("supplierContact", form.supplierContact)
      fd.append("supplierAddress", form.supplierAddress)
      fd.append("purchaseOrderNumber", form.purchaseOrderNumber)
      fd.append("deliveryReceiptNumber", form.deliveryReceiptNumber)
      fd.append("remarks", form.remarks)
      fd.append("items", JSON.stringify(formItems.map(i => ({
        itemName: i.itemName, description: i.description,
        quantity: parseInt(i.quantity), unit: i.unit,
      }))))
      if (poFile) fd.append("purchaseOrderFile", poFile)
      if (drFile) fd.append("deliveryReceiptFile", drFile)
      if (nodFile) fd.append("noticeOfDelivery", nodFile)

      const res = await fetch("/api/admin/inventory/deliveries", { method: "POST", body: fd })
      const data = await res.json()

      if (res.ok) {
        showToast("success", `Delivery ${data.delivery.deliveryNumber} recorded successfully`)
        setShowCreateModal(false)
        setForm({ supplierName: "", supplierContact: "", supplierAddress: "", purchaseOrderNumber: "", deliveryReceiptNumber: "", remarks: "" })
        setFormItems([{ itemName: "", description: "", quantity: "", unit: "pcs" }])
        setPoFile(null); setDrFile(null); setNodFile(null)
        fetchDeliveries()
      } else {
        showToast("error", data.error || "Failed to record delivery")
      }
    } catch (error) {
      showToast("error", "Failed to record delivery")
    } finally {
      setProcessing(false)
    }
  }

  const handleVerify = async (delivery: Delivery) => {
    setProcessing(true)
    try {
      const verifiedItems = delivery.items.map(item => ({
        id: item.id,
        verifiedQty: item.verifiedQty ?? item.quantity,
        remarks: item.remarks,
      }))

      const res = await fetch(`/api/admin/inventory/deliveries/${delivery.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", verifiedItems })
      })
      const data = await res.json()
      if (res.ok) {
        showToast("success", `Delivery ${delivery.deliveryNumber} verified`)
        setShowDetailModal(false)
        fetchDeliveries()
      } else {
        showToast("error", data.error || "Failed to verify")
      }
    } catch (error) {
      showToast("error", "Failed to verify delivery")
    } finally {
      setProcessing(false)
    }
  }

  const handleStore = async (delivery: Delivery) => {
    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/inventory/deliveries/${delivery.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "store" })
      })
      const data = await res.json()
      if (res.ok) {
        showToast("success", `Delivery ${delivery.deliveryNumber} stored and inventory updated`)
        setShowDetailModal(false)
        fetchDeliveries()
      } else {
        showToast("error", data.error || "Failed to store")
      }
    } catch (error) {
      showToast("error", "Failed to store delivery")
    } finally {
      setProcessing(false)
    }
  }

  const addItem = () => setFormItems([...formItems, { itemName: "", description: "", quantity: "", unit: "pcs" }])
  const removeItem = (idx: number) => { if (formItems.length > 1) setFormItems(formItems.filter((_, i) => i !== idx)) }
  const updateItem = (idx: number, field: string, value: string) => {
    const updated = [...formItems]
    updated[idx] = { ...updated[idx], [field]: value }
    setFormItems(updated)
  }

  const viewDelivery = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/inventory/deliveries/${id}`)
      const data = await res.json()
      if (data.delivery) {
        setSelectedDelivery(data.delivery)
        setShowDetailModal(true)
      }
    } catch (error) {
      showToast("error", "Failed to load delivery details")
    }
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.message}
        </div>
      )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Pending Verification", value: stats.pending, color: "border-yellow-500 bg-yellow-50" },
            { label: "Verified", value: stats.verified, color: "border-blue-500 bg-blue-50" },
            { label: "Stored / Recorded", value: stats.stored, color: "border-green-500 bg-green-50" },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-xl border-l-4 ${s.color} p-4 shadow-sm`}>
              <p className="text-xs text-gray-500 uppercase">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters & Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text" placeholder="Search by delivery #, supplier, PO #..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm">
              <option value="">All Status</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
              <option value="VERIFIED">Verified</option>
              <option value="STORED">Stored</option>
            </select>
            <button onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm whitespace-nowrap">
              + Record Delivery
            </button>
          </div>
        </div>

        {/* Deliveries List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <span className="text-5xl mb-4 block">📦</span>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No deliveries found</h3>
            <p className="text-gray-500 mb-4">Start by recording a new supplier delivery</p>
            <button onClick={() => setShowCreateModal(true)} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
              Record First Delivery
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {deliveries.map(delivery => (
              <div key={delivery.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => viewDelivery(delivery.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="text-base font-semibold text-gray-900">{delivery.deliveryNumber}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[delivery.status]}`}>
                        {formatStatus(delivery.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Supplier:</span> {delivery.supplierName} · 
                      <span className="font-medium ml-2">PO:</span> {delivery.purchaseOrderNumber} · 
                      <span className="font-medium ml-2">Items:</span> {delivery.items.length}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Received by {delivery.receivedByName} on {new Date(delivery.deliveryDate).toLocaleDateString()}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 mb-10">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Record New Delivery</h2>
                <p className="text-sm text-gray-500">Encode supplier delivery details</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-6">
              {/* Supplier Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Supplier Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                    <input type="text" value={form.supplierName} onChange={e => setForm({...form, supplierName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <input type="text" value={form.supplierContact} onChange={e => setForm({...form, supplierContact: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input type="text" value={form.supplierAddress} onChange={e => setForm({...form, supplierAddress: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" />
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Order # *</label>
                    <input type="text" value={form.purchaseOrderNumber} onChange={e => setForm({...form, purchaseOrderNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Receipt #</label>
                    <input type="text" value={form.deliveryReceiptNumber} onChange={e => setForm({...form, deliveryReceiptNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PO Document (Upload)</label>
                    <input type="file" onChange={e => setPoFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" accept=".pdf,.jpg,.jpeg,.png" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">DR Document (Upload)</label>
                    <input type="file" onChange={e => setDrFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" accept=".pdf,.jpg,.jpeg,.png" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notice of Delivery (if applicable)</label>
                    <input type="file" onChange={e => setNodFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" accept=".pdf,.jpg,.jpeg,.png" />
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Delivered Items</h3>
                  <button type="button" onClick={addItem} className="text-sm text-purple-600 hover:text-purple-800 font-medium">+ Add Item</button>
                </div>
                <div className="space-y-3">
                  {formItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg">
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                        <input type="text" placeholder="Item Name *" value={item.itemName}
                          onChange={e => updateItem(idx, "itemName", e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
                        <input type="text" placeholder="Description" value={item.description}
                          onChange={e => updateItem(idx, "description", e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        <input type="number" placeholder="Qty *" value={item.quantity} min="1"
                          onChange={e => updateItem(idx, "quantity", e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
                        <select value={item.unit} onChange={e => updateItem(idx, "unit", e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                          {["pcs", "box", "pack", "ream", "roll", "bottle", "gallon", "kg", "liter", "meter", "set", "unit", "bag", "can", "pair", "sheet"].map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                      {formItems.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" rows={2} />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium">Cancel</button>
                <button type="submit" disabled={processing}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium">
                  {processing ? "Recording..." : "Record Delivery"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 mb-10">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedDelivery.deliveryNumber}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[selectedDelivery.status]}`}>
                    {formatStatus(selectedDelivery.status)}
                  </span>
                  <span className="text-sm text-gray-500">PO: {selectedDelivery.purchaseOrderNumber}</span>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Supplier Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Supplier</p>
                  <p className="text-sm font-medium">{selectedDelivery.supplierName}</p>
                  {selectedDelivery.supplierContact && <p className="text-xs text-gray-500">{selectedDelivery.supplierContact}</p>}
                  {selectedDelivery.supplierAddress && <p className="text-xs text-gray-500">{selectedDelivery.supplierAddress}</p>}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Delivery Date</p>
                  <p className="text-sm font-medium">{new Date(selectedDelivery.deliveryDate).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-500">Received by: {selectedDelivery.receivedByName}</p>
                </div>
                {selectedDelivery.deliveryReceiptNumber && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">DR Number</p>
                    <p className="text-sm font-medium">{selectedDelivery.deliveryReceiptNumber}</p>
                  </div>
                )}
                {selectedDelivery.remarks && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Remarks</p>
                    <p className="text-sm">{selectedDelivery.remarks}</p>
                  </div>
                )}
              </div>

              {/* Documents */}
              {(selectedDelivery.purchaseOrderFile || selectedDelivery.deliveryReceiptFile || selectedDelivery.noticeOfDelivery) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Uploaded Documents</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedDelivery.purchaseOrderFile && (
                      <a href={selectedDelivery.purchaseOrderFile} target="_blank" rel="noreferrer"
                        className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100">
                        📄 Purchase Order
                      </a>
                    )}
                    {selectedDelivery.deliveryReceiptFile && (
                      <a href={selectedDelivery.deliveryReceiptFile} target="_blank" rel="noreferrer"
                        className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100">
                        📄 Delivery Receipt
                      </a>
                    )}
                    {selectedDelivery.noticeOfDelivery && (
                      <a href={selectedDelivery.noticeOfDelivery} target="_blank" rel="noreferrer"
                        className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100">
                        📄 Notice of Delivery
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Items */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Delivered Items ({selectedDelivery.items.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left py-2 px-3">Item</th>
                        <th className="text-right py-2 px-3">Qty</th>
                        <th className="text-right py-2 px-3">Verified Qty</th>
                        <th className="text-left py-2 px-3">Unit</th>
                        <th className="text-left py-2 px-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDelivery.items.map(item => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-2 px-3">
                            <p className="font-medium">{item.itemName}</p>
                            {item.item && <p className="text-xs text-gray-400">{item.item.itemCode}</p>}
                            {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                          </td>
                          <td className="py-2 px-3 text-right">{item.quantity}</td>
                          <td className="py-2 px-3 text-right font-medium">{item.verifiedQty ?? "-"}</td>
                          <td className="py-2 px-3">{item.unit}</td>
                          <td className="py-2 px-3 text-gray-500">{item.remarks || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Status Timeline</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <p className="text-sm"><span className="font-medium">Received</span> — {new Date(selectedDelivery.createdAt).toLocaleString()}</p>
                  </div>
                  {selectedDelivery.verifiedAt && (
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <p className="text-sm"><span className="font-medium">Verified</span> — {new Date(selectedDelivery.verifiedAt).toLocaleString()}</p>
                    </div>
                  )}
                  {selectedDelivery.storedAt && (
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <p className="text-sm"><span className="font-medium">Stored</span> — {new Date(selectedDelivery.storedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Close</button>
                {selectedDelivery.status === "PENDING_VERIFICATION" && (
                  <button onClick={() => handleVerify(selectedDelivery)} disabled={processing}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
                    {processing ? "Verifying..." : "✓ Verify Delivery"}
                  </button>
                )}
                {selectedDelivery.status === "VERIFIED" && (
                  <button onClick={() => handleStore(selectedDelivery)} disabled={processing}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium">
                    {processing ? "Storing..." : "📥 Store & Record Inventory"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
