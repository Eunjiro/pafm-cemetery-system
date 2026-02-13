"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface DashboardStats {
  totalItems: number
  totalStock: number
  lowStockItems: number
  outOfStockItems: number
  pendingDeliveries: number
  monthDeliveries: number
  pendingRequisitions: number
  monthRequisitions: number
}

interface RecentDelivery {
  id: string
  deliveryNumber: string
  supplierName: string
  status: string
  createdAt: string
  items: { quantity: number }[]
}

interface RecentRequisition {
  id: string
  risNumber: string
  requestingOffice: string
  status: string
  createdAt: string
  items: { requestedQty: number }[]
}

interface RecentAdjustment {
  id: string
  adjustmentType: string
  previousQty: number
  newQty: number
  difference: number
  reason: string
  performedByName: string
  createdAt: string
  item: { name: string; itemCode: string }
}

const statusColors: Record<string, string> = {
  PENDING_VERIFICATION: "bg-yellow-100 text-yellow-800",
  VERIFIED: "bg-blue-100 text-blue-800",
  STORED: "bg-green-100 text-green-800",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  PENDING_STOCK: "bg-orange-100 text-orange-800",
  FOR_RELEASE: "bg-indigo-100 text-indigo-800",
  ISSUED: "bg-green-100 text-green-800",
}

const formatStatus = (s: string) => s.replace(/_/g, " ")

const categoryColors: Record<string, string> = {
  SUPPLIES: "bg-blue-100 text-blue-800 border-blue-200",
  MATERIALS: "bg-emerald-100 text-emerald-800 border-emerald-200",
  EQUIPMENT: "bg-purple-100 text-purple-800 border-purple-200",
  TOOLS: "bg-orange-100 text-orange-800 border-orange-200",
  FURNITURE: "bg-pink-100 text-pink-800 border-pink-200",
  IT_EQUIPMENT: "bg-indigo-100 text-indigo-800 border-indigo-200",
  CHEMICALS: "bg-red-100 text-red-800 border-red-200",
  OTHER: "bg-gray-100 text-gray-800 border-gray-200",
}

export default function InventoryDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [categoryBreakdown, setCategoryBreakdown] = useState<Record<string, { count: number; stock: number }>>({})
  const [recentDeliveries, setRecentDeliveries] = useState<RecentDelivery[]>([])
  const [recentRequisitions, setRecentRequisitions] = useState<RecentRequisition[]>([])
  const [recentAdjustments, setRecentAdjustments] = useState<RecentAdjustment[]>([])

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    else if (status === "authenticated" && session?.user?.role !== "ADMIN") router.push("/dashboard")
  }, [status, session, router])

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/inventory/dashboard")
      const data = await res.json()
      setStats(data.stats)
      setCategoryBreakdown(data.categoryBreakdown || {})
      setRecentDeliveries(data.recentDeliveries || [])
      setRecentRequisitions(data.recentRequisitions || [])
      setRecentAdjustments(data.recentAdjustments || [])
    } catch (error) {
      console.error("Dashboard fetch error:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") fetchDashboard()
  }, [status, session, fetchDashboard])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  <p className="text-sm text-purple-100">Total Items</p>
                </div>
                <p className="text-4xl font-bold">{stats?.totalItems || 0}</p>
                <p className="text-xs text-purple-200 mt-2">{stats?.totalStock?.toLocaleString() || 0} total units in stock</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-amber-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                  <p className="text-sm text-amber-100">Low / Out of Stock</p>
                </div>
                <p className="text-4xl font-bold">{(stats?.lowStockItems || 0) + (stats?.outOfStockItems || 0)}</p>
                <p className="text-xs text-amber-200 mt-2">{stats?.lowStockItems || 0} low &middot; {stats?.outOfStockItems || 0} out of stock</p>
              </div>
              <div className="bg-gradient-to-br from-purple-400 to-purple-500 text-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
                  <p className="text-sm text-purple-100">Pending Deliveries</p>
                </div>
                <p className="text-4xl font-bold">{stats?.pendingDeliveries || 0}</p>
                <p className="text-xs text-purple-200 mt-2">{stats?.monthDeliveries || 0} delivered this month</p>
              </div>
              <div className="bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                  <p className="text-sm text-gray-300">Pending Requests</p>
                </div>
                <p className="text-4xl font-bold">{stats?.pendingRequisitions || 0}</p>
                <p className="text-xs text-gray-300 mt-2">{stats?.monthRequisitions || 0} issued this month</p>
              </div>
            </div>

            {/* Category Breakdown */}
            {Object.keys(categoryBreakdown).length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Inventory by Category</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(categoryBreakdown).map(([cat, data]) => (
                    <div key={cat} className={`rounded-lg border p-4 ${categoryColors[cat] || "bg-gray-50 text-gray-800 border-gray-200"}`}>
                      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{cat.replace(/_/g, " ")}</p>
                      <p className="text-2xl font-bold mt-1">{data.count}</p>
                      <p className="text-xs opacity-70 mt-0.5">{data.stock.toLocaleString()} total units</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity - Two Column */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Recent Deliveries */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Recent Deliveries</h2>
                  <Link href="/admin/inventory/deliveries" className="text-sm text-purple-600 hover:text-purple-800 font-medium">
                    View All &rarr;
                  </Link>
                </div>
                {recentDeliveries.length > 0 ? (
                  <div className="space-y-3">
                    {recentDeliveries.map(d => (
                      <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{d.deliveryNumber}</p>
                          <p className="text-xs text-gray-500">{d.supplierName} &middot; {d.items.reduce((s, i) => s + i.quantity, 0)} items</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColors[d.status] || "bg-gray-100 text-gray-800"}`}>
                            {formatStatus(d.status)}
                          </span>
                          <p className="text-xs text-gray-400 mt-1">{new Date(d.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">No deliveries yet</p>
                )}
              </div>

              {/* Recent Requisitions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Recent Requisitions</h2>
                  <Link href="/admin/inventory/requisitions" className="text-sm text-purple-600 hover:text-purple-800 font-medium">
                    View All &rarr;
                  </Link>
                </div>
                {recentRequisitions.length > 0 ? (
                  <div className="space-y-3">
                    {recentRequisitions.map(r => (
                      <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{r.risNumber}</p>
                          <p className="text-xs text-gray-500">{r.requestingOffice} &middot; {r.items.reduce((s, i) => s + i.requestedQty, 0)} items</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColors[r.status] || "bg-gray-100 text-gray-800"}`}>
                            {formatStatus(r.status)}
                          </span>
                          <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">No requisitions yet</p>
                )}
              </div>
            </div>

            {/* Recent Adjustments */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Recent Stock Adjustments</h2>
                <Link href="/admin/inventory/stock-validation" className="text-sm text-purple-600 hover:text-purple-800 font-medium">
                  View All &rarr;
                </Link>
              </div>
              {recentAdjustments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 text-gray-500 font-medium">Item</th>
                        <th className="text-left py-2 px-3 text-gray-500 font-medium">Type</th>
                        <th className="text-right py-2 px-3 text-gray-500 font-medium">Previous</th>
                        <th className="text-right py-2 px-3 text-gray-500 font-medium">New</th>
                        <th className="text-right py-2 px-3 text-gray-500 font-medium">Diff</th>
                        <th className="text-left py-2 px-3 text-gray-500 font-medium">By</th>
                        <th className="text-left py-2 px-3 text-gray-500 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAdjustments.map(a => (
                        <tr key={a.id} className="border-b border-gray-100">
                          <td className="py-2 px-3">
                            <p className="font-medium text-gray-900">{a.item.name}</p>
                            <p className="text-xs text-gray-400">{a.item.itemCode}</p>
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100">{a.adjustmentType.replace(/_/g, " ")}</span>
                          </td>
                          <td className="py-2 px-3 text-right">{a.previousQty}</td>
                          <td className="py-2 px-3 text-right font-medium">{a.newQty}</td>
                          <td className={`py-2 px-3 text-right font-medium ${a.difference >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {a.difference > 0 ? "+" : ""}{a.difference}
                          </td>
                          <td className="py-2 px-3 text-gray-600">{a.performedByName}</td>
                          <td className="py-2 px-3 text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No stock adjustments yet</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-md p-6 border border-purple-200">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-600 text-white rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Priority Tasks</h3>
                    <p className="text-sm text-gray-600">Items needing attention</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Pending Deliveries</span>
                      <span className="text-2xl font-bold text-purple-600">{stats?.pendingDeliveries || 0}</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Pending Requisitions</span>
                      <span className="text-2xl font-bold text-purple-600">{stats?.pendingRequisitions || 0}</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Low Stock Alerts</span>
                      <span className="text-2xl font-bold text-amber-600">{stats?.lowStockItems || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-md p-6 border border-purple-200">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-600 text-white rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">This Month</h3>
                    <p className="text-sm text-gray-600">Monthly activity summary</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Deliveries Received</span>
                      <span className="text-2xl font-bold text-purple-600">{stats?.monthDeliveries || 0}</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Requisitions Issued</span>
                      <span className="text-2xl font-bold text-purple-600">{stats?.monthRequisitions || 0}</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Total Inventory Items</span>
                      <span className="text-2xl font-bold text-gray-900">{stats?.totalItems || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

    </>
  )
}
