import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function WaterEmployeeDashboard() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const userRole = session.user?.role || "USER"
  
  if (userRole !== "EMPLOYEE" && userRole !== "ADMIN") {
    redirect("/services/water")
  }

  // Fetch drainage request statistics
  const drainageStats = await prisma.drainageRequest.groupBy({
    by: ['status'],
    _count: true
  })

  const drainagePending = drainageStats.find(s => s.status === 'PENDING_REVIEW')?._count || 0
  const drainageInspection = drainageStats.filter(s => ['INSPECTION_SCHEDULED', 'INSPECTION_COMPLETED'].includes(s.status)).reduce((a, s) => a + s._count, 0)
  const drainageInProgress = drainageStats.filter(s => ['FOR_IMPLEMENTATION', 'IN_PROGRESS'].includes(s.status)).reduce((a, s) => a + s._count, 0)
  const drainageTotal = drainageStats.reduce((acc, s) => acc + s._count, 0)

  // Fetch water connection statistics
  const connectionStats = await prisma.waterConnection.groupBy({
    by: ['status'],
    _count: true
  })

  const connectionPending = connectionStats.find(s => s.status === 'PENDING_EVALUATION')?._count || 0
  const connectionInspection = connectionStats.find(s => s.status === 'FOR_INSPECTION')?._count || 0
  const connectionPayment = connectionStats.find(s => s.status === 'AWAITING_PAYMENT')?._count || 0
  const connectionInstallation = connectionStats.filter(s => ['PAYMENT_CONFIRMED', 'INSTALLATION_SCHEDULED', 'INSTALLATION_ONGOING'].includes(s.status)).reduce((a, s) => a + s._count, 0)
  const connectionTotal = connectionStats.reduce((acc, s) => acc + s._count, 0)

  // Fetch water issue statistics
  const issueStats = await prisma.waterIssue.groupBy({
    by: ['status'],
    _count: true
  })

  const issuePending = issueStats.find(s => s.status === 'PENDING_INSPECTION')?._count || 0
  const issueRepair = issueStats.filter(s => ['FOR_REPAIR', 'FOR_SCHEDULING', 'REPAIR_IN_PROGRESS'].includes(s.status)).reduce((a, s) => a + s._count, 0)
  const issueTotal = issueStats.reduce((acc, s) => acc + s._count, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/services" className="text-sm text-indigo-100 hover:text-white mb-2 inline-block">
                ← Back to Services
              </Link>
              <h1 className="text-3xl font-bold">Water & Drainage - Employee Portal</h1>
              <p className="text-indigo-100 mt-1">Manage water connections, drainage requests, and issue reports</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-indigo-100">Staff Member</p>
              <p className="font-semibold">{session.user?.name}</p>
              <span className="inline-block mt-1 px-2 py-1 bg-indigo-700 text-indigo-100 text-xs font-medium rounded">
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
                {/* DRAINAGE REQUESTS */}
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">Pending Review</p>
                          {drainagePending > 0 && <p className="text-xs mt-0.5">{drainagePending} pending</p>}
                        </div>
                        {drainagePending > 0 && (
                          <span className="ml-2 px-2 py-1 bg-cyan-500 text-white text-xs font-bold rounded-full">{drainagePending}</span>
                        )}
                      </div>
                    </Link>
                    <Link href="/services/water/drainage-verification?status=IN_PROGRESS" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        drainageInProgress > 0 
                          ? 'bg-teal-50 border-l-4 border-teal-500 text-teal-700 hover:bg-teal-100' 
                          : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <div className="flex-1"><p className="font-medium text-sm">In Progress</p></div>
                        {drainageInProgress > 0 && <span className="ml-2 px-2 py-1 bg-teal-500 text-white text-xs font-bold rounded-full">{drainageInProgress}</span>}
                      </div>
                    </Link>
                  </nav>
                </div>

                {/* WATER CONNECTIONS */}
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1"><p className="font-medium text-sm">Pending Applications</p></div>
                        {connectionPending > 0 && <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">{connectionPending}</span>}
                      </div>
                    </Link>
                    <Link href="/services/water/connection-verification?status=AWAITING_PAYMENT" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        connectionPayment > 0 
                          ? 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 hover:bg-yellow-100' 
                          : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <div className="flex-1"><p className="font-medium text-sm">Awaiting Payment</p></div>
                        {connectionPayment > 0 && <span className="ml-2 px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full">{connectionPayment}</span>}
                      </div>
                    </Link>
                    <Link href="/services/water/connection-verification?status=PAYMENT_CONFIRMED" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        connectionInstallation > 0 
                          ? 'bg-green-50 border-l-4 border-green-500 text-green-700 hover:bg-green-100' 
                          : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        <div className="flex-1"><p className="font-medium text-sm">For Installation</p></div>
                        {connectionInstallation > 0 && <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">{connectionInstallation}</span>}
                      </div>
                    </Link>
                  </nav>
                </div>

                {/* WATER ISSUES */}
                <div className="mb-4">
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
                        <div className="flex-1"><p className="font-medium text-sm">Pending Issues</p></div>
                        {issuePending > 0 && <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">{issuePending}</span>}
                      </div>
                    </Link>
                    <Link href="/services/water/issue-verification?status=REPAIR_IN_PROGRESS" className="block">
                      <div className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                        issueRepair > 0 
                          ? 'bg-orange-50 border-l-4 border-orange-500 text-orange-700 hover:bg-orange-100' 
                          : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                      }`}>
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div className="flex-1"><p className="font-medium text-sm">Repairs / Active</p></div>
                        {issueRepair > 0 && <span className="ml-2 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">{issueRepair}</span>}
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
                <h3 className="text-sm font-medium text-gray-500">Drainage Requests</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{drainageTotal}</p>
                <p className="text-sm text-cyan-600 mt-1">{drainagePending} pending review</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <h3 className="text-sm font-medium text-gray-500">Water Connections</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{connectionTotal}</p>
                <p className="text-sm text-blue-600 mt-1">{connectionPending} pending evaluation</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
                <h3 className="text-sm font-medium text-gray-500">Water Issues</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{issueTotal}</p>
                <p className="text-sm text-red-600 mt-1">{issuePending} pending inspection</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/services/water/drainage-verification" className="p-4 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors">
                  <h3 className="font-medium text-cyan-800">Review Drainage Requests</h3>
                  <p className="text-sm text-cyan-600 mt-1">View and process incoming drainage concerns</p>
                </Link>
                <Link href="/services/water/connection-verification" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <h3 className="font-medium text-blue-800">Process Water Applications</h3>
                  <p className="text-sm text-blue-600 mt-1">Validate and process connection applications</p>
                </Link>
                <Link href="/services/water/issue-verification" className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                  <h3 className="font-medium text-red-800">Handle Water Issues</h3>
                  <p className="text-sm text-red-600 mt-1">Inspect and resolve reported issues</p>
                </Link>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Drainage Status Breakdown */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Drainage by Status</h3>
                <div className="space-y-2">
                  {drainageStats.map(s => (
                    <div key={s.status} className="flex justify-between text-sm">
                      <span className="text-gray-600">{s.status.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-gray-900">{s._count}</span>
                    </div>
                  ))}
                  {drainageStats.length === 0 && <p className="text-sm text-gray-400">No records yet</p>}
                </div>
              </div>

              {/* Connection Status Breakdown */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Connections by Status</h3>
                <div className="space-y-2">
                  {connectionStats.map(s => (
                    <div key={s.status} className="flex justify-between text-sm">
                      <span className="text-gray-600">{s.status.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-gray-900">{s._count}</span>
                    </div>
                  ))}
                  {connectionStats.length === 0 && <p className="text-sm text-gray-400">No records yet</p>}
                </div>
              </div>

              {/* Issue Status Breakdown */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Issues by Status</h3>
                <div className="space-y-2">
                  {issueStats.map(s => (
                    <div key={s.status} className="flex justify-between text-sm">
                      <span className="text-gray-600">{s.status.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-gray-900">{s._count}</span>
                    </div>
                  ))}
                  {issueStats.length === 0 && <p className="text-sm text-gray-400">No records yet</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
