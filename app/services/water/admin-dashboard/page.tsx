import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function WaterAdminDashboard() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const userRole = session.user?.role || "USER"
  
  if (userRole !== "ADMIN") {
    redirect("/services/water")
  }

  // Fetch all statistics in parallel
  const [drainageStats, connectionStats, issueStats, drainageByBarangay, connectionByBarangay, issuesByType, allRecentLogs] = await Promise.all([
    prisma.drainageRequest.groupBy({
      by: ['status'],
      _count: true
    }),
    prisma.waterConnection.groupBy({
      by: ['status'],
      _count: true
    }),
    prisma.waterIssue.groupBy({
      by: ['status'],
      _count: true
    }),
    prisma.drainageRequest.groupBy({
      by: ['barangay'],
      _count: true,
      orderBy: { _count: { barangay: 'desc' } },
      take: 10
    }),
    prisma.waterConnection.groupBy({
      by: ['barangay'],
      _count: true,
      orderBy: { _count: { barangay: 'desc' } },
      take: 10
    }),
    prisma.waterIssue.groupBy({
      by: ['issueType'],
      _count: true,
      orderBy: { _count: { issueType: 'desc' } }
    }),
    prisma.auditLog.findMany({
      where: {
        OR: [
          { entityType: { in: ['DrainageRequest', 'WaterConnection', 'WaterIssue'] } },
          { action: { startsWith: 'DRAINAGE_REQUEST' } },
          { action: { startsWith: 'WATER_' } },
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: { user: { select: { name: true } } }
    }),
  ])

  const drainagePending = drainageStats.find(s => s.status === 'PENDING_REVIEW')?._count || 0
  const drainageInProgress = drainageStats.filter(s => ['FOR_IMPLEMENTATION', 'IN_PROGRESS'].includes(s.status)).reduce((a, s) => a + s._count, 0)
  const drainageCompleted = drainageStats.find(s => s.status === 'COMPLETED')?._count || 0
  const drainageTotal = drainageStats.reduce((acc, s) => acc + s._count, 0)

  const connectionPending = connectionStats.find(s => s.status === 'PENDING_EVALUATION')?._count || 0
  const connectionPayment = connectionStats.find(s => s.status === 'AWAITING_PAYMENT')?._count || 0
  const connectionInstallation = connectionStats.filter(s => ['PAYMENT_CONFIRMED', 'INSTALLATION_SCHEDULED', 'INSTALLATION_ONGOING'].includes(s.status)).reduce((a, s) => a + s._count, 0)
  const connectionActive = connectionStats.find(s => s.status === 'ACTIVE_CONNECTION')?._count || 0
  const connectionTotal = connectionStats.reduce((acc, s) => acc + s._count, 0)

  const issuePending = issueStats.find(s => s.status === 'PENDING_INSPECTION')?._count || 0
  const issueRepair = issueStats.filter(s => ['FOR_REPAIR', 'FOR_SCHEDULING', 'REPAIR_IN_PROGRESS'].includes(s.status)).reduce((a, s) => a + s._count, 0)
  const issueResolved = issueStats.filter(s => ['RESOLVED', 'CLOSED'].includes(s.status)).reduce((a, s) => a + s._count, 0)
  const issueTotal = issueStats.reduce((acc, s) => acc + s._count, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/services" className="text-sm text-blue-100 hover:text-white mb-2 inline-block">
                ← Back to Services
              </Link>
              <h1 className="text-3xl font-bold">Water & Drainage - Admin Portal</h1>
              <p className="text-blue-100 mt-1">Full system access and management controls</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">System Administrator</p>
              <p className="font-semibold">{session.user?.name}</p>
              <span className="inline-block mt-1 px-2 py-1 bg-blue-700 text-blue-100 text-xs font-medium rounded">
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
                {/* 1. DRAINAGE REQUESTS */}
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">1. Drainage Requests</h3>
                  <nav className="space-y-1">
                    <Link href="/services/water/drainage-verification" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        drainagePending > 0
                          ? 'bg-cyan-50 border-l-4 border-cyan-500 text-cyan-700 hover:bg-cyan-100'
                          : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">All Drainage</p>
                          {drainagePending > 0 && (
                            <p className="text-xs mt-0.5">{drainagePending} pending review</p>
                          )}
                        </div>
                        {drainagePending > 0 && (
                          <span className="ml-2 px-2 py-1 bg-cyan-500 text-white text-xs font-bold rounded-full">
                            {drainagePending}
                          </span>
                        )}
                      </div>
                    </Link>
                  </nav>
                </div>

                {/* 2. WATER CONNECTIONS */}
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">2. Water Connections</h3>
                  <nav className="space-y-1">
                    <Link href="/services/water/connection-verification" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        connectionPending > 0
                          ? 'bg-blue-50 border-l-4 border-blue-500 text-blue-700 hover:bg-blue-100'
                          : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">New Applications</p>
                          {connectionPending > 0 && (
                            <p className="text-xs mt-0.5">{connectionPending} pending evaluation</p>
                          )}
                        </div>
                        {connectionPending > 0 && (
                          <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                            {connectionPending}
                          </span>
                        )}
                      </div>
                    </Link>

                    <Link href="/services/water/connection-verification?status=AWAITING_PAYMENT" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        connectionPayment > 0
                          ? 'bg-orange-50 border-l-4 border-orange-500 text-orange-700 hover:bg-orange-100'
                          : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">Awaiting Payment</p>
                          {connectionPayment > 0 && (
                            <p className="text-xs mt-0.5">{connectionPayment} awaiting</p>
                          )}
                        </div>
                        {connectionPayment > 0 && (
                          <span className="ml-2 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                            {connectionPayment}
                          </span>
                        )}
                      </div>
                    </Link>

                    <Link href="/services/water/connection-verification?status=INSTALLATION" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        connectionInstallation > 0
                          ? 'bg-purple-50 border-l-4 border-purple-500 text-purple-700 hover:bg-purple-100'
                          : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">Installation</p>
                          {connectionInstallation > 0 && (
                            <p className="text-xs mt-0.5">{connectionInstallation} in progress</p>
                          )}
                        </div>
                        {connectionInstallation > 0 && (
                          <span className="ml-2 px-2 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">
                            {connectionInstallation}
                          </span>
                        )}
                      </div>
                    </Link>
                  </nav>
                </div>

                {/* 3. WATER ISSUES */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">3. Water Issues</h3>
                  <nav className="space-y-1">
                    <Link href="/services/water/issue-verification" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        issuePending > 0
                          ? 'bg-red-50 border-l-4 border-red-500 text-red-700 hover:bg-red-100'
                          : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">Reported Issues</p>
                          {issuePending > 0 && (
                            <p className="text-xs mt-0.5">{issuePending} pending inspection</p>
                          )}
                        </div>
                        {issuePending > 0 && (
                          <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                            {issuePending}
                          </span>
                        )}
                      </div>
                    </Link>

                    <Link href="/services/water/issue-verification?status=FOR_REPAIR" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        issueRepair > 0
                          ? 'bg-amber-50 border-l-4 border-amber-500 text-amber-700 hover:bg-amber-100'
                          : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">Under Repair</p>
                          {issueRepair > 0 && (
                            <p className="text-xs mt-0.5">{issueRepair} in repair</p>
                          )}
                        </div>
                        {issueRepair > 0 && (
                          <span className="ml-2 px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                            {issueRepair}
                          </span>
                        )}
                      </div>
                    </Link>
                  </nav>
                </div>

                {/* ADMIN TOOLS */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">Admin Tools</h3>
                  <nav className="space-y-1">
                    <Link href="/services/water/admin-dashboard/audit-logs" className="block">
                      <div className="flex items-center px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-all border-l-4 border-transparent hover:border-purple-300">
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="font-medium text-sm">Audit Logs</p>
                        <span className="ml-auto px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">Admin</span>
                      </div>
                    </Link>

                    <Link href="/services/water/employee-dashboard" className="block">
                      <div className="flex items-center px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-all border-l-4 border-transparent hover:border-blue-300">
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <p className="font-medium text-sm">Employee Dashboard</p>
                        <span className="ml-auto px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">Staff</span>
                      </div>
                    </Link>

                    <Link href="/services/water/admin-dashboard/analytics" className="block">
                      <div className="flex items-center px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-all border-l-4 border-transparent hover:border-blue-300">
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="font-medium text-sm">Analytics</p>
                        <span className="ml-auto px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">Reports</span>
                      </div>
                    </Link>
                  </nav>
                </div>

                {/* OTHER ACTIONS */}
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">Other Actions</h3>
                  <nav className="space-y-1">
                    <Link href="/services/water/drainage-verification" className="block">
                      <div className="flex items-center px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-all border-l-4 border-transparent hover:border-gray-300">
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="font-medium text-sm">All Records</p>
                      </div>
                    </Link>
                  </nav>
                </div>
              </div>

              <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Need Help?</h3>
                <div className="space-y-2">
                  <a href="#" className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Admin Guide
                  </a>
                  <a href="#" className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    FAQs
                  </a>
                  <a href="#" className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact Support
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md p-6">
                <p className="text-sm text-blue-100 mb-1">Pending Review</p>
                <p className="text-4xl font-bold">{drainagePending + connectionPending + issuePending}</p>
                <p className="text-xs text-blue-100 mt-2">Needs immediate review</p>
              </div>
              <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-lg shadow-md p-6">
                <p className="text-sm text-cyan-100 mb-1">In Progress</p>
                <p className="text-4xl font-bold">{drainageInProgress + connectionInstallation + issueRepair}</p>
                <p className="text-xs text-cyan-100 mt-2">Active work items</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-md p-6">
                <p className="text-sm text-green-100 mb-1">Completed</p>
                <p className="text-4xl font-bold">{drainageCompleted + connectionActive + issueResolved}</p>
                <p className="text-xs text-green-100 mt-2">Successfully resolved</p>
              </div>
              <div className="bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-300 mb-1">Total Records</p>
                <p className="text-4xl font-bold">{drainageTotal + connectionTotal + issueTotal}</p>
                <p className="text-xs text-gray-300 mt-2">All submissions</p>
              </div>
            </div>

            {/* Service Breakdown Overview */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Service Status Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Drainage Requests */}
                <div className="border-l-4 border-cyan-500 pl-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">Drainage</h3>
                    <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs font-medium rounded">{drainageTotal} total</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pending Review</span>
                      <span className="font-semibold text-cyan-600">{drainagePending}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">In Progress</span>
                      <span className="font-semibold text-cyan-500">{drainageInProgress}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Completed</span>
                      <span className="font-semibold text-green-500">{drainageCompleted}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    {drainageStats.map(s => {
                      const pct = drainageTotal > 0 ? Math.round((s._count / drainageTotal) * 100) : 0
                      return (
                        <div key={s.status} className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">{s.status.replace(/_/g, " ")}</span>
                            <span className="font-medium text-gray-700">{pct}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Water Connections */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">Connections</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">{connectionTotal} total</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pending</span>
                      <span className="font-semibold text-blue-600">{connectionPending}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Awaiting Payment</span>
                      <span className="font-semibold text-orange-500">{connectionPayment}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Installation</span>
                      <span className="font-semibold text-purple-500">{connectionInstallation}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Active</span>
                      <span className="font-semibold text-green-500">{connectionActive}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    {connectionStats.map(s => {
                      const pct = connectionTotal > 0 ? Math.round((s._count / connectionTotal) * 100) : 0
                      return (
                        <div key={s.status} className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">{s.status.replace(/_/g, " ")}</span>
                            <span className="font-medium text-gray-700">{pct}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Water Issues */}
                <div className="border-l-4 border-red-500 pl-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">Issues</h3>
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">{issueTotal} total</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pending</span>
                      <span className="font-semibold text-red-600">{issuePending}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Under Repair</span>
                      <span className="font-semibold text-amber-500">{issueRepair}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Resolved</span>
                      <span className="font-semibold text-green-500">{issueResolved}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    {issueStats.map(s => {
                      const pct = issueTotal > 0 ? Math.round((s._count / issueTotal) * 100) : 0
                      return (
                        <div key={s.status} className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">{s.status.replace(/_/g, " ")}</span>
                            <span className="font-medium text-gray-700">{pct}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-6 border border-blue-200">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center mr-4">
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
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Pending Reviews</span>
                      <span className="text-2xl font-bold text-blue-600">{drainagePending + connectionPending + issuePending}</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Awaiting Payment</span>
                      <span className="text-2xl font-bold text-orange-600">{connectionPayment}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-6 border border-blue-200">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Barangay Distribution</h3>
                    <p className="text-sm text-gray-600">Top areas by request volume</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Drainage by Area</h4>
                    {drainageByBarangay.length === 0 && <p className="text-xs text-gray-400">No data</p>}
                    {drainageByBarangay.slice(0, 5).map(b => (
                      <div key={b.barangay} className="flex justify-between text-sm py-0.5">
                        <span className="text-gray-600 truncate mr-2">{b.barangay}</span>
                        <span className="font-semibold text-gray-900">{b._count as number}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Connections by Area</h4>
                    {connectionByBarangay.length === 0 && <p className="text-xs text-gray-400">No data</p>}
                    {connectionByBarangay.slice(0, 5).map(b => (
                      <div key={b.barangay} className="flex justify-between text-sm py-0.5">
                        <span className="text-gray-600 truncate mr-2">{b.barangay}</span>
                        <span className="font-semibold text-gray-900">{b._count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Issues by Type + Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Issues by Type</h3>
                <div className="space-y-3">
                  {issuesByType.length === 0 && <p className="text-sm text-gray-400">No data</p>}
                  {issuesByType.map(t => {
                    const pct = issueTotal > 0 ? Math.round(((t._count as number) / issueTotal) * 100) : 0
                    return (
                      <div key={t.issueType}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">{t.issueType.replace(/_/g, " ")}</span>
                          <span className="font-medium text-gray-900">{t._count as number} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity Log</h3>
                {allRecentLogs.length === 0 ? (
                  <p className="text-sm text-gray-400">No activity yet</p>
                ) : (
                  <div className="space-y-3">
                    {allRecentLogs.slice(0, 8).map(log => (
                      <div key={log.id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{log.action.replace(/_/g, " ")}</p>
                          <p className="text-xs text-gray-500">{log.user.name} &middot; {log.entityType}</p>
                          <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
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
