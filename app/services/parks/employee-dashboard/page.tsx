import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function ParksEmployeeDashboard() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const userRole = session.user?.role || "USER"
  
  if (userRole !== "EMPLOYEE" && userRole !== "ADMIN") {
    redirect("/services/parks")
  }

  // Fetch all statistics in parallel
  const [amenityStats, venueStats, maintenanceStats] = await Promise.all([
    prisma.amenityReservation.groupBy({
      by: ['status'],
      _count: true
    }),
    prisma.venueBooking.groupBy({
      by: ['status'],
      _count: true
    }),
    prisma.parkMaintenanceRequest.groupBy({
      by: ['status'],
      _count: true
    }),
  ])

  const amenityPending = amenityStats.find(s => s.status === 'PENDING_REVIEW')?._count || 0
  const amenityAwaitingPayment = amenityStats.find(s => s.status === 'AWAITING_PAYMENT')?._count || 0
  const amenityApproved = amenityStats.find(s => s.status === 'APPROVED')?._count || 0
  const amenityTotal = amenityStats.reduce((acc, s) => acc + s._count, 0)

  const venuePending = venueStats.find(s => s.status === 'PENDING_REVIEW')?._count || 0
  const venueAwaitingPayment = venueStats.find(s => s.status === 'AWAITING_PAYMENT')?._count || 0
  const venueApproved = venueStats.find(s => s.status === 'APPROVED')?._count || 0
  const venueTotal = venueStats.reduce((acc, s) => acc + s._count, 0)

  const maintenanceLogged = maintenanceStats.find(s => s.status === 'LOGGED')?._count || 0
  const maintenanceInProgress = maintenanceStats.filter(s => ['UNDER_INSPECTION', 'APPROVED_FOR_REPAIR', 'IN_PROGRESS'].includes(s.status)).reduce((a, s) => a + s._count, 0)
  const maintenanceTotal = maintenanceStats.reduce((acc, s) => acc + s._count, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-teal-700 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/services" className="text-sm text-teal-100 hover:text-white mb-2 inline-block">
                ← Back to Services
              </Link>
              <h1 className="text-3xl font-bold">Parks & Recreation - Employee Portal</h1>
              <p className="text-teal-100 mt-1">Manage reservations, venue bookings, and maintenance requests</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-teal-100">Staff Member</p>
              <p className="font-semibold">{session.user?.name}</p>
              <span className="inline-block mt-1 px-2 py-1 bg-teal-800 text-teal-100 text-xs font-medium rounded">
                {userRole}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
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
                        amenityPending > 0 
                          ? 'bg-cyan-50 border-l-4 border-cyan-500 text-cyan-700 hover:bg-cyan-100' 
                          : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">Pending Review</p>
                          {amenityPending > 0 && <p className="text-xs mt-0.5">{amenityPending} pending</p>}
                        </div>
                        {amenityPending > 0 && (
                          <span className="ml-2 px-2 py-1 bg-cyan-500 text-white text-xs font-bold rounded-full">{amenityPending}</span>
                        )}
                      </div>
                    </Link>
                    <Link href="/services/parks/amenity-verification?status=AWAITING_PAYMENT" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        amenityAwaitingPayment > 0 
                          ? 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 hover:bg-yellow-100' 
                          : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <div className="flex-1"><p className="font-medium text-sm">Awaiting Payment</p></div>
                        {amenityAwaitingPayment > 0 && <span className="ml-2 px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full">{amenityAwaitingPayment}</span>}
                      </div>
                    </Link>
                    <Link href="/services/parks/amenity-verification?status=APPROVED" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        amenityApproved > 0 
                          ? 'bg-green-50 border-l-4 border-green-500 text-green-700 hover:bg-green-100' 
                          : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1"><p className="font-medium text-sm">Approved / Check-in</p></div>
                        {amenityApproved > 0 && <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">{amenityApproved}</span>}
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
                        venuePending > 0 
                          ? 'bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 hover:bg-emerald-100' 
                          : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">Pending Bookings</p>
                          {venuePending > 0 && <p className="text-xs mt-0.5">{venuePending} pending</p>}
                        </div>
                        {venuePending > 0 && (
                          <span className="ml-2 px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">{venuePending}</span>
                        )}
                      </div>
                    </Link>
                    <Link href="/services/parks/venue-verification?status=AWAITING_PAYMENT" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        venueAwaitingPayment > 0 
                          ? 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 hover:bg-yellow-100' 
                          : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <div className="flex-1"><p className="font-medium text-sm">Awaiting Payment</p></div>
                        {venueAwaitingPayment > 0 && <span className="ml-2 px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full">{venueAwaitingPayment}</span>}
                      </div>
                    </Link>
                    <Link href="/services/parks/venue-verification?status=APPROVED" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        venueApproved > 0 
                          ? 'bg-green-50 border-l-4 border-green-500 text-green-700 hover:bg-green-100' 
                          : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1"><p className="font-medium text-sm">Confirmed Events</p></div>
                        {venueApproved > 0 && <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">{venueApproved}</span>}
                      </div>
                    </Link>
                  </nav>
                </div>

                {/* MAINTENANCE REQUESTS */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">3. Maintenance Requests</h3>
                  <nav className="space-y-1">
                    <Link href="/services/parks/maintenance-verification" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        maintenanceLogged > 0 
                          ? 'bg-amber-50 border-l-4 border-amber-500 text-amber-700 hover:bg-amber-100' 
                          : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">New Reports</p>
                          {maintenanceLogged > 0 && <p className="text-xs mt-0.5">{maintenanceLogged} logged</p>}
                        </div>
                        {maintenanceLogged > 0 && (
                          <span className="ml-2 px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">{maintenanceLogged}</span>
                        )}
                      </div>
                    </Link>
                    <Link href="/services/parks/maintenance-verification?status=IN_PROGRESS" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        maintenanceInProgress > 0 
                          ? 'bg-orange-50 border-l-4 border-orange-500 text-orange-700 hover:bg-orange-100' 
                          : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <div className="flex-1"><p className="font-medium text-sm">Active Repairs</p></div>
                        {maintenanceInProgress > 0 && <span className="ml-2 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">{maintenanceInProgress}</span>}
                      </div>
                    </Link>
                  </nav>
                </div>

                {/* TOOLS */}
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">Tools</h3>
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
                  </nav>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Summary Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-cyan-500">
                <h3 className="text-sm font-medium text-gray-500">Amenity Reservations</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{amenityTotal}</p>
                <p className="text-sm text-cyan-600 mt-1">{amenityPending} pending review</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-500">
                <h3 className="text-sm font-medium text-gray-500">Venue Bookings</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{venueTotal}</p>
                <p className="text-sm text-emerald-600 mt-1">{venuePending} pending review</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-500">
                <h3 className="text-sm font-medium text-gray-500">Maintenance Requests</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{maintenanceTotal}</p>
                <p className="text-sm text-amber-600 mt-1">{maintenanceLogged} newly logged</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/services/parks/amenity-verification" className="p-4 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors">
                  <h3 className="font-medium text-cyan-800">Review Amenity Reservations</h3>
                  <p className="text-sm text-cyan-600 mt-1">Process swimming, cottage & table reservations</p>
                </Link>
                <Link href="/services/parks/venue-verification" className="p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                  <h3 className="font-medium text-emerald-800">Process Venue Bookings</h3>
                  <p className="text-sm text-emerald-600 mt-1">Validate and confirm event bookings</p>
                </Link>
                <Link href="/services/parks/maintenance-verification" className="p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
                  <h3 className="font-medium text-amber-800">Handle Maintenance Reports</h3>
                  <p className="text-sm text-amber-600 mt-1">Inspect and assign repair teams</p>
                </Link>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Amenity by Status</h3>
                <div className="space-y-2">
                  {amenityStats.map(s => (
                    <div key={s.status} className="flex justify-between text-sm">
                      <span className="text-gray-600">{s.status.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-gray-900">{s._count}</span>
                    </div>
                  ))}
                  {amenityStats.length === 0 && <p className="text-sm text-gray-400">No records yet</p>}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Venue by Status</h3>
                <div className="space-y-2">
                  {venueStats.map(s => (
                    <div key={s.status} className="flex justify-between text-sm">
                      <span className="text-gray-600">{s.status.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-gray-900">{s._count}</span>
                    </div>
                  ))}
                  {venueStats.length === 0 && <p className="text-sm text-gray-400">No records yet</p>}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Maintenance by Status</h3>
                <div className="space-y-2">
                  {maintenanceStats.map(s => (
                    <div key={s.status} className="flex justify-between text-sm">
                      <span className="text-gray-600">{s.status.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-gray-900">{s._count}</span>
                    </div>
                  ))}
                  {maintenanceStats.length === 0 && <p className="text-sm text-gray-400">No records yet</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
