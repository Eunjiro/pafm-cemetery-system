"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"


interface InventoryItem {
  id: string
  itemCode: string
  name: string
  category: string
  unit: string
  currentStock: number
  reservedStock: number
  reorderLevel: number
  storageZone: string | null
  storageRack: string | null
}

interface StockAdjustment {
  id: string
  itemId: string
  adjustmentType: string
  previousQty: number
  newQty: number
  difference: number
  reason: string
  performedBy: string
  performedByName: string | null
  createdAt: string
  item: { name: string; itemCode: string; unit: string }
}

const adjustmentTypes = ["PHYSICAL_COUNT", "CORRECTION", "DAMAGE", "LOSS", "RETURN", "INITIAL_STOCK"]

const categoryColors: Record<string, string> = {
  SUPPLIES: "bg-blue-100 text-blue-800",
  MATERIALS: "bg-green-100 text-green-800",
  EQUIPMENT: "bg-purple-100 text-purple-800",
  TOOLS: "bg-orange-100 text-orange-800",
  FURNITURE: "bg-pink-100 text-pink-800",
  IT_EQUIPMENT: "bg-indigo-100 text-indigo-800",
  CHEMICALS: "bg-red-100 text-red-800",
  OTHER: "bg-gray-100 text-gray-800",
}

export default function StockValidationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [showCountModal, setShowCountModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [processing, setProcessing] = useState(false)

  // Physical count state
  const [countItems, setCountItems] = useState<Array<{ item: InventoryItem; actualCount: string; hasDiscrepancy: boolean }>>([])

  // Adjustment form
  const [adjForm, setAdjForm] = useState({ adjustmentType: "PHYSICAL_COUNT", newQty: "", reason: "" })

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    else if (status === "authenticated" && session?.user?.role !== "ADMIN") router.push("/dashboard")
  }, [status, session, router])

  useEffect(() => {
    if (searchParams.get("new") === "true") startPhysicalCount()
  }, [searchParams])

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [itemsRes, adjRes] = await Promise.all([
        fetch(`/api/admin/inventory/items?limit=500${searchTerm ? `&search=${searchTerm}` : ""}`),
        fetch("/api/admin/inventory/adjustments?limit=50")
      ])
      const itemsData = await itemsRes.json()
      const adjData = await adjRes.json()
      setItems(itemsData.items || [])
      setAdjustments(adjData.adjustments || [])
    } catch (error) {
      console.error("Fetch error:", error)
    } finally {
      setLoading(false)
    }
  }, [searchTerm])

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") fetchData()
  }, [status, session, fetchData])

  const startPhysicalCount = () => {
    const countList = items.map(item => ({
      item,
      actualCount: "",
      hasDiscrepancy: false,
    }))
    setCountItems(countList)
    setShowCountModal(true)
  }

  const updateCount = (idx: number, value: string) => {
    const updated = [...countItems]
    const actual = parseInt(value) || 0
    updated[idx] = {
      ...updated[idx],
      actualCount: value,
      hasDiscrepancy: value !== "" && actual !== updated[idx].item.currentStock,
    }
    setCountItems(updated)
  }

  const submitPhysicalCount = async () => {
    const discrepancies = countItems.filter(c => c.hasDiscrepancy && c.actualCount !== "")
    if (discrepancies.length === 0) {
      showToast("success", "Physical count complete — all items balanced!")
      setShowCountModal(false)
      return
    }

    setProcessing(true)
    try {
      for (const disc of discrepancies) {
        await fetch("/api/admin/inventory/adjustments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId: disc.item.id,
            adjustmentType: "PHYSICAL_COUNT",
            newQty: parseInt(disc.actualCount),
            reason: `Physical inventory count - discrepancy found (system: ${disc.item.currentStock}, actual: ${disc.actualCount})`,
          })
        })
      }
      showToast("success", `Physical count complete — ${discrepancies.length} discrepancies recorded and stock updated`)
      setShowCountModal(false)
      fetchData()
    } catch (error) {
      showToast("error", "Failed to submit adjustments")
    } finally {
      setProcessing(false)
    }
  }

  const openAdjustment = (item: InventoryItem) => {
    setSelectedItem(item)
    setAdjForm({ adjustmentType: "CORRECTION", newQty: item.currentStock.toString(), reason: "" })
    setShowAdjustModal(true)
  }

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem || !adjForm.reason || adjForm.newQty === "") {
      showToast("error", "All fields are required"); return
    }
    setProcessing(true)
    try {
      const res = await fetch("/api/admin/inventory/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: selectedItem.id,
          adjustmentType: adjForm.adjustmentType,
          newQty: adjForm.newQty,
          reason: adjForm.reason,
        })
      })
      const data = await res.json()
      if (res.ok) {
        showToast("success", `Stock adjusted for ${selectedItem.name}`)
        setShowAdjustModal(false)
        fetchData()
      } else {
        showToast("error", data.error)
      }
    } catch (error) {
      showToast("error", "Failed to adjust stock")
    } finally {
      setProcessing(false)
    }
  }

  const discrepancyCount = countItems.filter(c => c.hasDiscrepancy).length
  const balancedCount = countItems.filter(c => c.actualCount !== "" && !c.hasDiscrepancy).length

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.message}
        </div>
      )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Items for counting */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input type="text" placeholder="Search items..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" />
                <button onClick={startPhysicalCount} disabled={items.length === 0}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm whitespace-nowrap disabled:opacity-50">
                  🔍 Start Physical Count
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <h2 className="text-sm font-semibold text-gray-700">Current Inventory ({items.length} items)</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Code</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Item</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Category</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-500">System Qty</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Location</th>
                        <th className="text-center py-2 px-3 font-medium text-gray-500">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3"><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{item.itemCode}</span></td>
                          <td className="py-2 px-3 font-medium text-gray-900">{item.name}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[item.category]}`}>
                              {item.category.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-medium">
                            {item.currentStock} {item.unit}
                            {item.reorderLevel > 0 && item.currentStock <= item.reorderLevel && (
                              <span className="ml-1 text-yellow-600">⚠️</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-gray-500 text-xs">
                            {item.storageZone || "-"}{item.storageRack ? ` / ${item.storageRack}` : ""}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button onClick={() => openAdjustment(item)}
                              className="px-3 py-1 text-xs bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 font-medium">
                              Adjust
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Recent Adjustments */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Adjustments</h2>
              {adjustments.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {adjustments.map(adj => (
                    <div key={adj.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900">{adj.item.name}</p>
                        <span className={`text-xs font-medium ${adj.difference >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {adj.difference > 0 ? "+" : ""}{adj.difference}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="px-1.5 py-0.5 bg-gray-200 rounded">{adj.adjustmentType.replace(/_/g, " ")}</span>
                        <span>{adj.previousQty} → {adj.newQty}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{adj.reason}</p>
                      <p className="text-xs text-gray-400">{adj.performedByName} · {new Date(adj.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No adjustments yet</p>
              )}
            </div>
          </div>
        </div>

      {/* Adjustment Modal */}
      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Adjust Stock</h2>
                <p className="text-sm text-gray-500">{selectedItem.itemCode} — {selectedItem.name}</p>
              </div>
              <button onClick={() => setShowAdjustModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAdjustment} className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xs text-blue-600 uppercase">Current System Stock</p>
                <p className="text-3xl font-bold text-blue-800">{selectedItem.currentStock} <span className="text-sm font-normal">{selectedItem.unit}</span></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type</label>
                <select value={adjForm.adjustmentType} onChange={e => setAdjForm({...adjForm, adjustmentType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {adjustmentTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actual / New Quantity *</label>
                <input type="number" value={adjForm.newQty} onChange={e => setAdjForm({...adjForm, newQty: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" min="0" required />
                {adjForm.newQty !== "" && (
                  <p className={`text-xs mt-1 font-medium ${parseInt(adjForm.newQty) - selectedItem.currentStock >= 0 ? "text-green-600" : "text-red-600"}`}>
                    Difference: {parseInt(adjForm.newQty) - selectedItem.currentStock > 0 ? "+" : ""}{parseInt(adjForm.newQty) - selectedItem.currentStock} {selectedItem.unit}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <textarea value={adjForm.reason} onChange={e => setAdjForm({...adjForm, reason: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows={3} required
                  placeholder="Explain reason for adjustment..." />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setShowAdjustModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={processing} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium">
                  {processing ? "Adjusting..." : "Submit Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Physical Count Modal */}
      {showCountModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 mb-10">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-2xl z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Physical Inventory Count</h2>
                <p className="text-sm text-gray-500">Enter actual quantity for each item. Leave blank to skip.</p>
                <div className="flex space-x-4 mt-2 text-xs">
                  <span className="text-green-600 font-medium">✓ Balanced: {balancedCount}</span>
                  <span className="text-red-600 font-medium">⚠ Discrepancies: {discrepancyCount}</span>
                  <span className="text-gray-400">Pending: {countItems.filter(c => c.actualCount === "").length}</span>
                </div>
              </div>
              <button onClick={() => setShowCountModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Code</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Item</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Location</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-500">System Qty</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-500">Actual Count</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {countItems.map((ci, idx) => (
                      <tr key={ci.item.id} className={`border-b border-gray-100 ${ci.hasDiscrepancy ? "bg-red-50" : ci.actualCount !== "" ? "bg-green-50" : ""}`}>
                        <td className="py-2 px-3"><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{ci.item.itemCode}</span></td>
                        <td className="py-2 px-3 font-medium">{ci.item.name}</td>
                        <td className="py-2 px-3 text-xs text-gray-500">{ci.item.storageZone || "-"}{ci.item.storageRack ? ` / ${ci.item.storageRack}` : ""}</td>
                        <td className="py-2 px-3 text-right">{ci.item.currentStock} {ci.item.unit}</td>
                        <td className="py-2 px-3 text-right">
                          <input type="number" value={ci.actualCount} min="0"
                            onChange={e => updateCount(idx, e.target.value)}
                            className={`w-20 px-2 py-1 border rounded text-sm text-right ${ci.hasDiscrepancy ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                            placeholder="—" />
                        </td>
                        <td className="py-2 px-3 text-center">
                          {ci.actualCount === "" ? (
                            <span className="text-xs text-gray-400">—</span>
                          ) : ci.hasDiscrepancy ? (
                            <span className="text-xs text-red-600 font-medium">⚠ Discrepancy ({parseInt(ci.actualCount) - ci.item.currentStock > 0 ? "+" : ""}{parseInt(ci.actualCount) - ci.item.currentStock})</span>
                          ) : (
                            <span className="text-xs text-green-600 font-medium">✓ Balanced</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                <button onClick={() => setShowCountModal(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={submitPhysicalCount} disabled={processing}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium">
                  {processing ? "Submitting..." : `Submit Count (${discrepancyCount} discrepancies)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
