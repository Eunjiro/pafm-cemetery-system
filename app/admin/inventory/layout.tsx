"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"

interface SidebarStats {
  pendingDeliveries: number
  lowStockItems: number
  pendingRequisitions: number
  totalItems: number
  totalStock: number
  monthDeliveries: number
}

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [stats, setStats] = useState<SidebarStats | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    else if (status === "authenticated" && session?.user?.role !== "ADMIN") router.push("/dashboard")
  }, [status, session, router])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/inventory/dashboard")
      const data = await res.json()
      setStats({
        pendingDeliveries: data.stats?.pendingDeliveries || 0,
        lowStockItems: data.stats?.lowStockItems || 0,
        pendingRequisitions: data.stats?.pendingRequisitions || 0,
        totalItems: data.stats?.totalItems || 0,
        totalStock: data.stats?.totalStock || 0,
        monthDeliveries: data.stats?.monthDeliveries || 0,
      })
    } catch (e) {
      console.error("Sidebar stats error:", e)
    }
  }, [])

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") fetchStats()
  }, [status, session, fetchStats])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  const isActive = (href: string) => pathname === href
  const isSection = (prefix: string) => pathname.startsWith(prefix)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Big Header ── */}
      <div className="bg-purple-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/services" className="text-sm text-purple-200 hover:text-white mb-2 inline-flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Services
              </Link>
              <h1 className="text-3xl font-bold">Asset Inventory & Warehouse</h1>
              <p className="text-purple-200 mt-1">Full warehouse management, receiving, requisitions & reporting</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm text-purple-200">System Administrator</p>
              <p className="font-semibold">{session?.user?.name}</p>
              <span className="inline-block mt-1 px-2 py-1 bg-purple-700 text-purple-100 text-xs font-medium rounded">
                ADMIN
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content with Sidebar ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">

          {/* ── Sidebar ── */}
          <div className="w-72 flex-shrink-0 hidden lg:block">
            <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-8">
              <div className="p-4">

                {/* Dashboard */}
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">Dashboard</h3>
                  <nav className="space-y-1">
                    <Link href="/admin/inventory" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        isActive("/admin/inventory")
                          ? "bg-purple-50 border-l-4 border-purple-500 text-purple-700"
                          : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent"
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                        </svg>
                        <p className="font-medium text-sm">Overview</p>
                      </div>
                    </Link>
                  </nav>
                </div>

                {/* Receiving */}
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">A. Receiving</h3>
                  <nav className="space-y-1">
                    <Link href="/admin/inventory/deliveries" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        isSection("/admin/inventory/deliveries")
                          ? "bg-purple-50 border-l-4 border-purple-500 text-purple-700"
                          : (stats?.pendingDeliveries || 0) > 0
                            ? "bg-purple-50/50 border-l-4 border-purple-300 text-purple-600 hover:bg-purple-50"
                            : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent"
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">Deliveries</p>
                          {(stats?.pendingDeliveries || 0) > 0 && (
                            <p className="text-xs mt-0.5">{stats?.pendingDeliveries} pending verification</p>
                          )}
                        </div>
                        {(stats?.pendingDeliveries || 0) > 0 && (
                          <span className="ml-2 px-2 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">
                            {stats?.pendingDeliveries}
                          </span>
                        )}
                      </div>
                    </Link>
                  </nav>
                </div>

                {/* Storage & Items */}
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">B. Storage & Items</h3>
                  <nav className="space-y-1">
                    <Link href="/admin/inventory/items" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        isSection("/admin/inventory/items")
                          ? "bg-purple-50 border-l-4 border-purple-500 text-purple-700"
                          : (stats?.lowStockItems || 0) > 0
                            ? "bg-amber-50/50 border-l-4 border-amber-300 text-amber-600 hover:bg-amber-50"
                            : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent"
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">All Items</p>
                          {(stats?.lowStockItems || 0) > 0 && (
                            <p className="text-xs mt-0.5">{stats?.lowStockItems} low stock alerts</p>
                          )}
                        </div>
                        {(stats?.lowStockItems || 0) > 0 && (
                          <span className="ml-2 px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                            {stats?.lowStockItems}
                          </span>
                        )}
                      </div>
                    </Link>
                  </nav>
                </div>

                {/* Requisitions */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">C. Requisitions (RIS)</h3>
                  <nav className="space-y-1">
                    <Link href="/admin/inventory/requisitions" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        isSection("/admin/inventory/requisitions")
                          ? "bg-purple-50 border-l-4 border-purple-500 text-purple-700"
                          : (stats?.pendingRequisitions || 0) > 0
                            ? "bg-indigo-50/50 border-l-4 border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                            : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent"
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">All Requisitions</p>
                          {(stats?.pendingRequisitions || 0) > 0 && (
                            <p className="text-xs mt-0.5">{stats?.pendingRequisitions} pending approval</p>
                          )}
                        </div>
                        {(stats?.pendingRequisitions || 0) > 0 && (
                          <span className="ml-2 px-2 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full">
                            {stats?.pendingRequisitions}
                          </span>
                        )}
                      </div>
                    </Link>
                  </nav>
                </div>

                {/* Stock Validation */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">D. Stock Validation</h3>
                  <nav className="space-y-1">
                    <Link href="/admin/inventory/stock-validation" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        isSection("/admin/inventory/stock-validation")
                          ? "bg-purple-50 border-l-4 border-purple-500 text-purple-700"
                          : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent"
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <p className="font-medium text-sm">Physical Inventory</p>
                      </div>
                    </Link>
                  </nav>
                </div>

                {/* Reports */}
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">E. Reports</h3>
                  <nav className="space-y-1">
                    <Link href="/admin/inventory/reports" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        isSection("/admin/inventory/reports")
                          ? "bg-purple-50 border-l-4 border-purple-500 text-purple-700"
                          : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent"
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="font-medium text-sm">View Reports</p>
                      </div>
                    </Link>
                    <Link href="/admin/inventory/analytics" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        isSection("/admin/inventory/analytics")
                          ? "bg-purple-50 border-l-4 border-purple-500 text-purple-700"
                          : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent"
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="font-medium text-sm">Analytics</p>
                      </div>
                    </Link>
                  </nav>
                </div>
              </div>

              <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Info</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span>{stats?.totalItems || 0} items tracked</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18M7 16v-4m4 4V8m4 8v-6m4 6v-2" />
                    </svg>
                    <span>{stats?.totalStock?.toLocaleString() || 0} total units</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                    <span>{stats?.monthDeliveries || 0} deliveries this month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Main Content Area ── */}
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
