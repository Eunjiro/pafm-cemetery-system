import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function ParksAdminDashboard() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const userRole = session.user?.role || "USER"
  
  if (userRole !== "ADMIN") {
    redirect("/services/parks")
  }

  // Amenity reservation stats
  const amenityStats = await prisma.amenityReservation.groupBy({ by: ['status'], _count: true })
  const amenityPending = amenityStats.find(s => s.status === 'PENDING_REVIEW')?._count || 0
  const amenityAwaitingPayment = amenityStats.find(s => s.status === 'AWAITING_PAYMENT')?._count || 0
  const amenityApproved = amenityStats.find(s => s.status === 'APPROVED')?._count || 0
  const amenityCompleted = amenityStats.filter(s => ['COMPLETED', 'CHECKED_IN'].includes(s.status)).reduce((a, s) => a + s._count, 0)
  const amenityTotal = amenityStats.reduce((acc, s) => acc + s._count, 0)

  // Venue booking stats
  const venueStats = await prisma.venueBooking.groupBy({ by: ['status'], _count: true })
  const venuePending = venueStats.find(s => s.status === 'PENDING_REVIEW')?._count || 0
  const venueAwaitingPayment = venueStats.find(s => s.status === 'AWAITING_PAYMENT')?._count || 0
  const venueApproved = venueStats.find(s => s.status === 'APPROVED')?._count || 0
  const venueCompleted = venueStats.filter(s => ['COMPLETED', 'IN_USE'].includes(s.status)).reduce((a, s) => a + s._count, 0)
  const venueTotal = venueStats.reduce((acc, s) => acc + s._count, 0)

  // Maintenance stats
  const maintenanceStats = await prisma.parkMaintenanceRequest.groupBy({ by: ['status'], _count: true })
  const maintenanceLogged = maintenanceStats.find(s => s.status === 'LOGGED')?._count || 0
  const maintenanceInProgress = maintenanceStats.filter(s => ['UNDER_INSPECTION', 'APPROVED_FOR_REPAIR', 'IN_PROGRESS'].includes(s.status)).reduce((a, s) => a + s._count, 0)
  const maintenanceCompleted = maintenanceStats.filter(s => ['COMPLETED', 'CLOSED'].includes(s.status)).reduce((a, s) => a + s._count, 0)
  const maintenanceTotal = maintenanceStats.reduce((acc, s) => acc + s._count, 0)

  // Amenity by type
  const amenityByType = await prisma.amenityReservation.groupBy({
    by: ['amenityType'],
    _count: true,
    orderBy: { _count: { amenityType: 'desc' } }
  })

  // Venue by type
  const venueByType = await prisma.venueBooking.groupBy({
    by: ['venueType'],
    _count: true,
    orderBy: { _count: { venueType: 'desc' } }
  })

  // Maintenance by category
  const maintenanceByCategory = await prisma.parkMaintenanceRequest.groupBy({
    by: ['issueCategory'],
    _count: true,
    orderBy: { _count: { issueCategory: 'desc' } }
  })

  // Maintenance by location
  const maintenanceByLocation = await prisma.parkMaintenanceRequest.groupBy({
    by: ['parkLocation'],
    _count: true,
    orderBy: { _count: { parkLocation: 'desc' } },
    take: 10
  })

  // Recent audit logs
  const recentLogs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entityType: { in: ['AmenityReservation', 'VenueBooking', 'ParkMaintenanceRequest'] } },
        { action: { startsWith: 'AMENITY_RESERVATION' } },
        { action: { startsWith: 'VENUE_BOOKING' } },
        { action: { startsWith: 'PARK_MAINTENANCE' } },
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 15,
    include: { user: { select: { name: true } } }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-teal-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/services" className="text-sm text-teal-100 hover:text-white mb-2 inline-block">
                ← Back to Services
              </Link>
              <h1 className="text-3xl font-bold">Parks & Recreation - Admin Portal</h1>
              <p className="text-teal-100 mt-1">Full system access and management controls</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-teal-100">System Administrator</p>
              <p className="font-semibold">{session.user?.name}</p>
              <span className="inline-block mt-1 px-2 py-1 bg-teal-700 text-teal-100 text-xs font-medium rounded">
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
                {/* AMENITY RESERVATIONS */}
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">1. Amenity Reservations</h3>
                  <nav className="space-y-1">
                    <Link href="/services/parks/amenity-verification" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        amenityPending > 0 ? 'bg-cyan-50 border-l-4 border-cyan-500 text-cyan-700 hover:bg-cyan-100' : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">All Reservations</p>
                          {amenityPending > 0 && <p className="text-xs mt-0.5">{amenityPending} pending</p>}
                        </div>
                        {amenityPending > 0 && <span className="ml-2 px-2 py-1 bg-cyan-500 text-white text-xs font-bold rounded-full">{amenityPending}</span>}
                      </div>
                    </Link>
                  </nav>
                </div>

                {/* VENUE BOOKINGS */}
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">2. Venue Bookings</h3>
                  <nav className="space-y-1">
                    <Link href="/services/parks/venue-verification" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        venuePending > 0 ? 'bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 hover:bg-emerald-100' : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">All Bookings</p>
                          {venuePending > 0 && <p className="text-xs mt-0.5">{venuePending} pending</p>}
                        </div>
                        {venuePending > 0 && <span className="ml-2 px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">{venuePending}</span>}
                      </div>
                    </Link>
                  </nav>
                </div>

                {/* MAINTENANCE */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">3. Maintenance</h3>
                  <nav className="space-y-1">
                    <Link href="/services/parks/maintenance-verification" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        maintenanceLogged > 0 ? 'bg-amber-50 border-l-4 border-amber-500 text-amber-700 hover:bg-amber-100' : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">All Reports</p>
                          {maintenanceLogged > 0 && <p className="text-xs mt-0.5">{maintenanceLogged} new</p>}
                        </div>
                        {maintenanceLogged > 0 && <span className="ml-2 px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">{maintenanceLogged}</span>}
                      </div>
                    </Link>
                  </nav>
                </div>

                {/* ADMIN TOOLS */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">Admin Tools</h3>
                  <nav className="space-y-1">
                    <Link href="/services/parks/transactions" className="block">
                      <div className="flex items-center px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-all border-l-4 border-transparent hover:border-teal-300">
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="font-medium text-sm">Transactions</p>
                        <span className="ml-auto px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-medium rounded">Revenue</span>
                      </div>
                    </Link>
                    <Link href="/services/parks/admin-dashboard/audit-logs" className="block">
                      <div className="flex items-center px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-all border-l-4 border-transparent hover:border-purple-300">
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="font-medium text-sm">Audit Logs</p>
                        <span className="ml-auto px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">Admin</span>
                      </div>
                    </Link>
                    <Link href="/services/parks/employee-dashboard" className="block">
                      <div className="flex items-center px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-all border-l-4 border-transparent hover:border-teal-300">
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <p className="font-medium text-sm">Employee Dashboard</p>
                        <span className="ml-auto px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-medium rounded">Staff</span>
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
              <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-lg shadow-md p-6">
                <p className="text-sm text-teal-100 mb-1">Pending Review</p>
                <p className="text-4xl font-bold">{amenityPending + venuePending + maintenanceLogged}</p>
                <p className="text-xs text-teal-100 mt-2">Needs immediate review</p>
              </div>
              <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-lg shadow-md p-6">
                <p className="text-sm text-cyan-100 mb-1">In Progress</p>
                <p className="text-4xl font-bold">{amenityAwaitingPayment + venueAwaitingPayment + maintenanceInProgress}</p>
                <p className="text-xs text-cyan-100 mt-2">Active work items</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-md p-6">
                <p className="text-sm text-green-100 mb-1">Completed</p>
                <p className="text-4xl font-bold">{amenityCompleted + venueCompleted + maintenanceCompleted}</p>
                <p className="text-xs text-green-100 mt-2">Successfully resolved</p>
              </div>
              <div className="bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-300 mb-1">Total Records</p>
                <p className="text-4xl font-bold">{amenityTotal + venueTotal + maintenanceTotal}</p>
                <p className="text-xs text-gray-300 mt-2">All submissions</p>
              </div>
            </div>

            {/* Service Breakdown */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Service Status Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border-l-4 border-cyan-500 pl-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">Amenity</h3>
                    <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs font-medium rounded">{amenityTotal} total</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Pending</span><span className="font-semibold text-cyan-600">{amenityPending}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Awaiting Payment</span><span className="font-semibold text-yellow-600">{amenityAwaitingPayment}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Approved</span><span className="font-semibold text-green-600">{amenityApproved}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Completed</span><span className="font-semibold text-gray-600">{amenityCompleted}</span></div>
                  </div>
                </div>
                <div className="border-l-4 border-emerald-500 pl-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">Venue</h3>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">{venueTotal} total</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Pending</span><span className="font-semibold text-emerald-600">{venuePending}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Awaiting Payment</span><span className="font-semibold text-yellow-600">{venueAwaitingPayment}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Approved</span><span className="font-semibold text-green-600">{venueApproved}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Completed</span><span className="font-semibold text-gray-600">{venueCompleted}</span></div>
                  </div>
                </div>
                <div className="border-l-4 border-amber-500 pl-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">Maintenance</h3>
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">{maintenanceTotal} total</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Logged</span><span className="font-semibold text-amber-600">{maintenanceLogged}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">In Progress</span><span className="font-semibold text-orange-600">{maintenanceInProgress}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Completed</span><span className="font-semibold text-green-600">{maintenanceCompleted}</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Amenity Utilization by Type</h3>
                <div className="space-y-2">
                  {amenityByType.map(t => (
                    <div key={t.amenityType} className="flex justify-between text-sm">
                      <span className="text-gray-600">{t.amenityType.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-gray-900">{t._count}</span>
                    </div>
                  ))}
                  {amenityByType.length === 0 && <p className="text-sm text-gray-400">No data yet</p>}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Venue Utilization by Type</h3>
                <div className="space-y-2">
                  {venueByType.map(t => (
                    <div key={t.venueType} className="flex justify-between text-sm">
                      <span className="text-gray-600">{t.venueType.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-gray-900">{t._count}</span>
                    </div>
                  ))}
                  {venueByType.length === 0 && <p className="text-sm text-gray-400">No data yet</p>}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Maintenance by Issue Category</h3>
                <div className="space-y-2">
                  {maintenanceByCategory.map(c => (
                    <div key={c.issueCategory} className="flex justify-between text-sm">
                      <span className="text-gray-600">{c.issueCategory.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-gray-900">{c._count}</span>
                    </div>
                  ))}
                  {maintenanceByCategory.length === 0 && <p className="text-sm text-gray-400">No data yet</p>}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Maintenance by Park Location</h3>
                <div className="space-y-2">
                  {maintenanceByLocation.map(l => (
                    <div key={l.parkLocation} className="flex justify-between text-sm">
                      <span className="text-gray-600">{l.parkLocation}</span>
                      <span className="font-medium text-gray-900">{l._count}</span>
                    </div>
                  ))}
                  {maintenanceByLocation.length === 0 && <p className="text-sm text-gray-400">No data yet</p>}
                </div>
              </div>
            </div>

            {/* Recent Audit Logs */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <Link href="/services/parks/admin-dashboard/audit-logs" className="text-sm text-teal-600 hover:text-teal-800 font-medium">
                  View All →
                </Link>
              </div>
              <div className="space-y-3">
                {recentLogs.length > 0 ? recentLogs.map(log => (
                  <div key={log.id} className="flex items-start space-x-3 py-2 border-b border-gray-100 last:border-0">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
