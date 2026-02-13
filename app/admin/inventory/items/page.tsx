"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"


interface InventoryItem {
  id: string
  itemCode: string
  name: string
  description: string | null
  category: string
  unit: string
  currentStock: number
  reservedStock: number
  reorderLevel: number
  storageZone: string | null
  storageRack: string | null
  createdAt: string
  updatedAt: string
  _count: { deliveryItems: number; requisitionItems: number; stockAdjustments: number }
}

interface ItemDetail extends InventoryItem {
  deliveryItems: any[]
  requisitionItems: any[]
  stockAdjustments: any[]
}

interface Stats {
  totalItems: number
  totalStock: number
  lowStockItems: number
  reservedItems: number
}

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

const categories = ["SUPPLIES", "MATERIALS", "EQUIPMENT", "TOOLS", "FURNITURE", "IT_EQUIPMENT", "CHEMICALS", "OTHER"]
const units = ["pcs", "box", "pack", "ream", "roll", "bottle", "gallon", "kg", "liter", "meter", "set", "unit", "bag", "can", "pair", "sheet"]

export default function ItemsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [stats, setStats] = useState<Stats>({ totalItems: 0, totalStock: 0, lowStockItems: 0, reservedItems: 0 })
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ItemDetail | null>(null)
  const [processing, setProcessing] = useState(false)

  const [form, setForm] = useState({
    name: "", description: "", category: "SUPPLIES", unit: "pcs",
    currentStock: "0", reorderLevel: "5", storageZone: "", storageRack: "",
  })

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

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.set("search", searchTerm)
      if (categoryFilter) params.set("category", categoryFilter)
      const res = await fetch(`/api/admin/inventory/items?${params}`)
      const data = await res.json()
      setItems(data.items || [])
      setStats(data.stats || { totalItems: 0, totalStock: 0, lowStockItems: 0, reservedItems: 0 })
    } catch (error) {
      console.error("Fetch error:", error)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, categoryFilter])

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") fetchItems()
  }, [status, session, fetchItems])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.unit) { showToast("error", "Name and unit are required"); return }
    setProcessing(true)
    try {
      const res = await fetch("/api/admin/inventory/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (res.ok) {
        showToast("success", `Item ${data.item.itemCode} created`)
        setShowCreateModal(false)
        setForm({ name: "", description: "", category: "SUPPLIES", unit: "pcs", currentStock: "0", reorderLevel: "5", storageZone: "", storageRack: "" })
        fetchItems()
      } else {
        showToast("error", data.error)
      }
    } catch (error) {
      showToast("error", "Failed to create item")
    } finally {
      setProcessing(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return
    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/inventory/items/${selectedItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (res.ok) {
        showToast("success", "Item updated")
        setShowEditModal(false)
        fetchItems()
      } else {
        showToast("error", data.error)
      }
    } catch (error) {
      showToast("error", "Failed to update item")
    } finally {
      setProcessing(false)
    }
  }

  const viewItem = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/inventory/items/${id}`)
      const data = await res.json()
      if (data.item) {
        setSelectedItem(data.item)
        setShowDetailModal(true)
      }
    } catch (error) {
      showToast("error", "Failed to load item details")
    }
  }

  const openEdit = (item: InventoryItem) => {
    setForm({
      name: item.name, description: item.description || "", category: item.category, unit: item.unit,
      currentStock: item.currentStock.toString(), reorderLevel: item.reorderLevel.toString(),
      storageZone: item.storageZone || "", storageRack: item.storageRack || "",
    })
    setSelectedItem(item as any)
    setShowEditModal(true)
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return { label: "Out of Stock", color: "text-red-600 bg-red-50" }
    if (item.reorderLevel > 0 && item.currentStock <= item.reorderLevel) return { label: "Low Stock", color: "text-yellow-600 bg-yellow-50" }
    if (item.reservedStock > 0) return { label: "Reserved", color: "text-blue-600 bg-blue-50" }
    return { label: "Available", color: "text-green-600 bg-green-50" }
  }

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.message}
        </div>
      )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Items", value: stats.totalItems, color: "border-purple-500 bg-purple-50" },
            { label: "Total Stock", value: stats.totalStock, color: "border-blue-500 bg-blue-50" },
            { label: "Low Stock Alerts", value: stats.lowStockItems, color: "border-yellow-500 bg-yellow-50" },
            { label: "With Reservations", value: stats.reservedItems, color: "border-indigo-500 bg-indigo-50" },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-xl border-l-4 ${s.color} p-4 shadow-sm`}>
              <p className="text-xs text-gray-500 uppercase">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{s.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="text" placeholder="Search items by name, code, description..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" />
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
            </select>
            <button onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm whitespace-nowrap">
              + Add Item
            </button>
          </div>
        </div>

        {/* Items */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <span className="text-5xl mb-4 block">🏪</span>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-500 mb-4">Add items to your inventory</p>
            <button onClick={() => setShowCreateModal(true)} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
              Add First Item
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Code</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Item Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Stock</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Reserved</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Available</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Location</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const stockStatus = getStockStatus(item)
                    return (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{item.itemCode}</span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[item.category]}`}>
                            {item.category.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium">{item.currentStock} {item.unit}</td>
                        <td className="py-3 px-4 text-right text-gray-500">{item.reservedStock}</td>
                        <td className="py-3 px-4 text-right font-medium">{item.currentStock - item.reservedStock}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>{stockStatus.label}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-xs">
                          {item.storageZone || "-"}{item.storageRack ? ` / ${item.storageRack}` : ""}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button onClick={() => viewItem(item.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="View">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            <button onClick={() => openEdit(item)} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Add Inventory Item</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {categories.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                  <input type="number" value={form.currentStock} onChange={e => setForm({...form, currentStock: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                  <input type="number" value={form.reorderLevel} onChange={e => setForm({...form, reorderLevel: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" min="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Storage Zone</label>
                  <input type="text" value={form.storageZone} onChange={e => setForm({...form, storageZone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g., Zone A" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Storage Rack / Shelf</label>
                  <input type="text" value={form.storageRack} onChange={e => setForm({...form, storageRack: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g., Rack 1, Shelf 3" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={processing} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium">
                  {processing ? "Creating..." : "Create Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Edit Item ({selectedItem.itemCode})</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {categories.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                  <input type="number" value={form.reorderLevel} onChange={e => setForm({...form, reorderLevel: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" min="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Storage Zone</label>
                  <input type="text" value={form.storageZone} onChange={e => setForm({...form, storageZone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Storage Rack / Shelf</label>
                  <input type="text" value={form.storageRack} onChange={e => setForm({...form, storageRack: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={processing} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium">
                  {processing ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 mb-10">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-bold text-gray-900">{selectedItem.name}</h2>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{selectedItem.itemCode}</span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[selectedItem.category]}`}>
                    {selectedItem.category.replace(/_/g, " ")}
                  </span>
                  {selectedItem.storageZone && <span className="text-xs text-gray-500">📍 {selectedItem.storageZone}{selectedItem.storageRack ? ` / ${selectedItem.storageRack}` : ""}</span>}
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Stock Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-600 uppercase">Current Stock</p>
                  <p className="text-2xl font-bold text-blue-800">{selectedItem.currentStock}</p>
                  <p className="text-xs text-blue-600">{selectedItem.unit}</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-indigo-600 uppercase">Reserved</p>
                  <p className="text-2xl font-bold text-indigo-800">{selectedItem.reservedStock}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-600 uppercase">Available</p>
                  <p className="text-2xl font-bold text-green-800">{selectedItem.currentStock - selectedItem.reservedStock}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-yellow-600 uppercase">Reorder At</p>
                  <p className="text-2xl font-bold text-yellow-800">{selectedItem.reorderLevel}</p>
                </div>
              </div>

              {selectedItem.description && (
                <div>
                  <p className="text-sm text-gray-500 uppercase font-medium">Description</p>
                  <p className="text-sm text-gray-700 mt-1">{selectedItem.description}</p>
                </div>
              )}

              {/* Recent Deliveries */}
              {selectedItem.deliveryItems && selectedItem.deliveryItems.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Deliveries</h3>
                  <div className="space-y-2">
                    {selectedItem.deliveryItems.slice(0, 5).map((di: any) => (
                      <div key={di.id} className="flex justify-between items-center bg-gray-50 rounded-lg p-2 text-sm">
                        <span className="font-medium">{di.delivery?.deliveryNumber || "—"}</span>
                        <span>Qty: {di.verifiedQty ?? di.quantity} {selectedItem.unit}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${di.delivery?.status === "STORED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {di.delivery?.status?.replace(/_/g, " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Requisitions */}
              {selectedItem.requisitionItems && selectedItem.requisitionItems.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Requisitions</h3>
                  <div className="space-y-2">
                    {selectedItem.requisitionItems.slice(0, 5).map((ri: any) => (
                      <div key={ri.id} className="flex justify-between items-center bg-gray-50 rounded-lg p-2 text-sm">
                        <span className="font-medium">{ri.requisition?.risNumber || "—"}</span>
                        <span>{ri.requisition?.requestingOffice}</span>
                        <span>Qty: {ri.issuedQty ?? ri.approvedQty ?? ri.requestedQty}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${ri.requisition?.status === "ISSUED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {ri.requisition?.status?.replace(/_/g, " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Adjustments */}
              {selectedItem.stockAdjustments && selectedItem.stockAdjustments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Stock Adjustments</h3>
                  <div className="space-y-2">
                    {selectedItem.stockAdjustments.slice(0, 5).map((sa: any) => (
                      <div key={sa.id} className="flex justify-between items-center bg-gray-50 rounded-lg p-2 text-sm">
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-200">{sa.adjustmentType.replace(/_/g, " ")}</span>
                        <span>{sa.previousQty} → {sa.newQty}</span>
                        <span className={sa.difference >= 0 ? "text-green-600" : "text-red-600"}>
                          {sa.difference > 0 ? "+" : ""}{sa.difference}
                        </span>
                        <span className="text-gray-400">{new Date(sa.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <button onClick={() => setShowDetailModal(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
