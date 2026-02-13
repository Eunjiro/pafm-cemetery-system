import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function FacilitiesAdminDashboard() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const userRole = session.user?.role || "USER"
  
  if (userRole !== "ADMIN") {
    redirect("/services/facilities")
  }

  // Fetch all statistics in parallel
  const [reservationStats, byFacilityType, byActivityType, facilityTypeStatusRaw, lguCount, recentLogs] = await Promise.all([
    prisma.facilityReservation.groupBy({ by: ['status'], _count: true }),
    prisma.facilityReservation.groupBy({
      by: ['facilityType'],
      _count: true,
      orderBy: { _count: { facilityType: 'desc' } }
    }),
    prisma.facilityReservation.groupBy({
      by: ['activityType'],
      _count: true,
      orderBy: { _count: { activityType: 'desc' } }
    }),
    prisma.facilityReservation.groupBy({
      by: ['facilityType', 'status'],
      _count: true
    }),
    prisma.facilityReservation.count({ where: { isLguEvent: true } }),
    prisma.auditLog.findMany({
      where: {
        OR: [
          { entityType: 'FacilityReservation' },
          { action: { startsWith: 'FACILITY_RESERVATION' } },
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: { user: { select: { name: true } } }
    }),
  ])

  const pendingReview = reservationStats.find(s => s.status === 'PENDING_REVIEW')?._count || 0
  const awaitingRequirements = reservationStats.find(s => s.status === 'AWAITING_REQUIREMENTS')?._count || 0
  const awaitingPayment = reservationStats.find(s => s.status === 'AWAITING_PAYMENT')?._count || 0
  const paymentVerified = reservationStats.find(s => s.status === 'PAYMENT_VERIFIED')?._count || 0
  const approved = reservationStats.find(s => s.status === 'APPROVED')?._count || 0
  const inUse = reservationStats.find(s => s.status === 'IN_USE')?._count || 0
  const completed = reservationStats.filter(s => ['COMPLETED', 'COMPLETED_WITH_DAMAGES'].includes(s.status)).reduce((a, s) => a + s._count, 0)
  const rejected = reservationStats.find(s => s.status === 'REJECTED')?._count || 0
  const cancelled = reservationStats.find(s => s.status === 'CANCELLED')?._count || 0
  const noShow = reservationStats.find(s => s.status === 'NO_SHOW')?._count || 0
  const withDamages = reservationStats.find(s => s.status === 'COMPLETED_WITH_DAMAGES')?._count || 0
  const totalReservations = reservationStats.reduce((acc, s) => acc + s._count, 0)

  const pendingAll = pendingReview + awaitingRequirements + awaitingPayment
  const activeAll = paymentVerified + approved + inUse
  const privateCount = totalReservations - lguCount

  // Helper to get status counts per facility type
  const getFacilityStatusCount = (facilityType: string, statuses: string[]) => {
    return facilityTypeStatusRaw
      .filter(r => r.facilityType === facilityType && statuses.includes(r.status))
      .reduce((sum, r) => sum + r._count, 0)
  }

  const facilityTypes = [
    { key: 'CONFERENCE_HALL', label: 'Conference Hall' },
    { key: 'GYMNASIUM', label: 'Gymnasium' },
    { key: 'TRAINING_ROOM', label: 'Training Room' },
    { key: 'AUDITORIUM', label: 'Auditorium' },
    { key: 'CULTURAL_CENTER', label: 'Cultural Center' },
    { key: 'MULTIPURPOSE_HALL', label: 'Multipurpose Hall' },
    { key: 'COVERED_COURT', label: 'Covered Court' },
    { key: 'OTHER_FACILITY', label: 'Other Facility' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-orange-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/services" className="text-sm text-orange-100 hover:text-white mb-2 inline-block">
                ← Back to Services
              </Link>
              <h1 className="text-3xl font-bold">Facility Management - Admin Portal</h1>
              <p className="text-orange-100 mt-1">Full system access and management controls</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-orange-100">System Administrator</p>
              <p className="font-semibold">{session.user?.name}</p>
              <span className="inline-block mt-1 px-2 py-1 bg-orange-700 text-orange-100 text-xs font-medium rounded">
                {userRole}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">

          {/* Sidebar */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-8">
              <div className="p-4">
                {/* FACILITY RESERVATIONS */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">1. Facility Reservations</h3>
                  <nav className="space-y-1">
                    <Link href="/services/facilities/employee-dashboard" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        pendingReview > 0 ? 'bg-orange-50 border-l-4 border-orange-500 text-orange-700 hover:bg-orange-100' : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">All Reservations</p>
                          {pendingReview > 0 && <p className="text-xs mt-0.5">{pendingReview} pending</p>}
                        </div>
                        {pendingReview > 0 && <span className="ml-2 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">{pendingReview}</span>}
                      </div>
                    </Link>
                  </nav>
                </div>

                {/* ADMIN TOOLS */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">Admin Tools</h3>
                  <nav className="space-y-1">
                    <Link href="/services/facilities/transactions" className="block">
                      <div className="flex items-center px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-all border-l-4 border-transparent hover:border-orange-300">
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="font-medium text-sm">Transactions</p>
                        <span className="ml-auto px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">Revenue</span>
                      </div>
                    </Link>
                    <Link href="/services/facilities/admin-dashboard/audit-logs" className="block">
                      <div className="flex items-center px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-all border-l-4 border-transparent hover:border-purple-300">
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="font-medium text-sm">Audit Logs</p>
                        <span className="ml-auto px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">Admin</span>
                      </div>
                    </Link>
                    <Link href="/services/facilities/employee-dashboard" className="block">
                      <div className="flex items-center px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-all border-l-4 border-transparent hover:border-orange-300">
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <p className="font-medium text-sm">Employee Dashboard</p>
                        <span className="ml-auto px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">Staff</span>
                      </div>
                    </Link>
                  </nav>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow-md p-6">
                <p className="text-sm text-orange-100 mb-1">Pending Review</p>
                <p className="text-4xl font-bold">{pendingAll}</p>
                <p className="text-xs text-orange-100 mt-2">Needs immediate review</p>
              </div>
              <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-lg shadow-md p-6">
                <p className="text-sm text-cyan-100 mb-1">In Progress</p>
                <p className="text-4xl font-bold">{activeAll}</p>
                <p className="text-xs text-cyan-100 mt-2">Active work items</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-md p-6">
                <p className="text-sm text-green-100 mb-1">Completed</p>
                <p className="text-4xl font-bold">{completed}</p>
                <p className="text-xs text-green-100 mt-2">Successfully resolved</p>
              </div>
              <div className="bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-300 mb-1">Total Records</p>
                <p className="text-4xl font-bold">{totalReservations}</p>
                <p className="text-xs text-gray-300 mt-2">All submissions</p>
              </div>
            </div>

            {/* Service Breakdown */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Reservation Status Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border-l-4 border-orange-500 pl-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">Pending Stage</h3>
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">{pendingAll} total</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Pending Review</span><span className="font-semibold text-orange-600">{pendingReview}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Awaiting Requirements</span><span className="font-semibold text-yellow-600">{awaitingRequirements}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Awaiting Payment</span><span className="font-semibold text-amber-600">{awaitingPayment}</span></div>
                  </div>
                </div>
                <div className="border-l-4 border-emerald-500 pl-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">Active Stage</h3>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">{activeAll + inUse} total</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Payment Verified</span><span className="font-semibold text-emerald-600">{paymentVerified}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Approved</span><span className="font-semibold text-green-600">{approved}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">In Use</span><span className="font-semibold text-blue-600">{inUse}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Completed</span><span className="font-semibold text-gray-600">{completed}</span></div>
                  </div>
                </div>
                <div className="border-l-4 border-red-500 pl-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">Incidents</h3>
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">{rejected + cancelled + noShow + withDamages} total</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Rejected</span><span className="font-semibold text-red-600">{rejected}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Cancelled</span><span className="font-semibold text-gray-600">{cancelled}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">No-Show</span><span className="font-semibold text-rose-600">{noShow}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">With Damages</span><span className="font-semibold text-amber-600">{withDamages}</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Utilization by Facility Type</h3>
                <div className="space-y-2">
                  {byFacilityType.map(t => {
                    const label = facilityTypes.find(f => f.key === t.facilityType)?.label || t.facilityType.replace(/_/g, ' ')
                    return (
                      <div key={t.facilityType} className="flex justify-between text-sm">
                        <span className="text-gray-600">{label}</span>
                        <span className="font-medium text-gray-900">{t._count}</span>
                      </div>
                    )
                  })}
                  {byFacilityType.length === 0 && <p className="text-sm text-gray-400">No data yet</p>}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Reservations by Activity Type</h3>
                <div className="space-y-2">
                  {byActivityType.map(t => (
                    <div key={t.activityType} className="flex justify-between text-sm">
                      <span className="text-gray-600">{t.activityType.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-gray-900">{t._count}</span>
                    </div>
                  ))}
                  {byActivityType.length === 0 && <p className="text-sm text-gray-400">No data yet</p>}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Facility Status Breakdown</h3>
                <div className="space-y-2">
                  {facilityTypes.map(f => {
                    const total = byFacilityType.find(t => t.facilityType === f.key)?._count || 0
                    if (total === 0) return null
                    const pending = getFacilityStatusCount(f.key, ['PENDING_REVIEW', 'AWAITING_REQUIREMENTS', 'AWAITING_PAYMENT'])
                    const active = getFacilityStatusCount(f.key, ['APPROVED', 'IN_USE', 'PAYMENT_VERIFIED'])
                    const done = getFacilityStatusCount(f.key, ['COMPLETED', 'COMPLETED_WITH_DAMAGES'])
                    return (
                      <div key={f.key} className="flex justify-between text-sm items-center">
                        <span className="text-gray-600">{f.label}</span>
                        <div className="flex gap-2">
                          <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">{pending} pending</span>
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">{active} active</span>
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">{done} done</span>
                        </div>
                      </div>
                    )
                  }).filter(Boolean)}
                  {byFacilityType.length === 0 && <p className="text-sm text-gray-400">No data yet</p>}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">LGU vs Private Usage</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">LGU / Government Events</span>
                    <span className="font-medium text-blue-600">{lguCount} ({totalReservations > 0 ? ((lguCount / totalReservations) * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${totalReservations > 0 ? (lguCount / totalReservations) * 100 : 0}%` }}></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Private / Organization</span>
                    <span className="font-medium text-purple-600">{privateCount} ({totalReservations > 0 ? ((privateCount / totalReservations) * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${totalReservations > 0 ? (privateCount / totalReservations) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Audit Logs */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <Link href="/services/facilities/admin-dashboard/audit-logs" className="text-sm text-orange-600 hover:text-orange-800 font-medium">
                  View All →
                </Link>
              </div>
              <div className="space-y-3">
                {recentLogs.length > 0 ? recentLogs.map(log => (
                  <div key={log.id} className="flex items-start space-x-3 py-2 border-b border-gray-100 last:border-0">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 font-medium">{log.action.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-500">{log.user?.name} · {new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-gray-400 text-center py-4">No activity yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
