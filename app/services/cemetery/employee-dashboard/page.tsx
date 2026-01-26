import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function EmployeeDashboard() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const userRole = session.user?.role || "USER"
  
  if (userRole !== "EMPLOYEE" && userRole !== "ADMIN") {
    redirect("/services/cemetery")
  }

  // Fetch statistics
  const stats = await prisma.deathRegistration.groupBy({
    by: ['status'],
    _count: true
  })

  const pendingCount = stats.find(s => s.status === 'PENDING_VERIFICATION')?._count || 0
  const paymentSubmittedCount = stats.find(s => s.status === 'PAYMENT_SUBMITTED')?._count || 0
  const forPickupCount = stats.find(s => s.status === 'REGISTERED_FOR_PICKUP')?._count || 0
  const totalCount = stats.reduce((acc, s) => acc + s._count, 0)

  // Fetch burial permit statistics
  const permitStats = await prisma.burialPermit.groupBy({
    by: ['status'],
    _count: true
  })

  const permitPendingCount = permitStats.find(s => s.status === 'PENDING_VERIFICATION')?._count || 0
  const permitPaymentSubmittedCount = permitStats.find(s => s.status === 'PAYMENT_SUBMITTED')?._count || 0
  const permitForPickupCount = permitStats.find(s => s.status === 'REGISTERED_FOR_PICKUP')?._count || 0
  const permitTotalCount = permitStats.reduce((acc, s) => acc + s._count, 0)

  // Fetch exhumation permit statistics
  const exhumationStats = await prisma.exhumationPermit.groupBy({
    by: ['status'],
    _count: true
  })

  const exhumationPendingCount = exhumationStats.find(s => s.status === 'PENDING_VERIFICATION')?._count || 0
  const exhumationPaymentSubmittedCount = exhumationStats.find(s => s.status === 'PAYMENT_SUBMITTED')?._count || 0
  const exhumationForPickupCount = exhumationStats.find(s => s.status === 'REGISTERED_FOR_PICKUP')?._count || 0
  const exhumationTotalCount = exhumationStats.reduce((acc, s) => acc + s._count, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-orange-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/dashboard" className="text-sm text-orange-100 hover:text-white mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold">Cemetery Services - Employee Portal</h1>
              <p className="text-orange-100 mt-1">Process death registrations and manage civil registry records</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-orange-100">Civil Registry Staff</p>
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
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
              
              {/* Death Registration Section */}
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Death Registration</h3>
                <nav className="space-y-2">
                  <Link href="/services/cemetery/verification">
                    <div className={`flex items-center p-3 rounded-lg transition-colors ${
                      pendingCount > 0 
                        ? 'bg-orange-50 text-orange-700 hover:bg-orange-100' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}>
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Verify</p>
                        {pendingCount > 0 && (
                          <p className="text-xs">{pendingCount} pending</p>
                        )}
                      </div>
                    </div>
                  </Link>

                  <Link href="/services/cemetery/payment-confirmation">
                    <div className={`flex items-center p-3 rounded-lg transition-colors ${
                      paymentSubmittedCount > 0 
                        ? 'bg-green-50 text-green-700 hover:bg-green-100' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}>
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Payments</p>
                        {paymentSubmittedCount > 0 && (
                          <p className="text-xs">{paymentSubmittedCount} to confirm</p>
                        )}
                      </div>
                    </div>
                  </Link>
                </nav>
              </div>

              {/* Burial Permits Section */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Burial Permits</h3>
                <nav className="space-y-2">
                  <Link href="/services/cemetery/burial-permits/verification">
                    <div className={`flex items-center p-3 rounded-lg transition-colors ${
                      permitPendingCount > 0 
                        ? 'bg-purple-50 text-purple-700 hover:bg-purple-100' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}>
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Permits</p>
                        {permitPendingCount > 0 && (
                          <p className="text-xs">{permitPendingCount} pending</p>
                        )}
                      </div>
                    </div>
                  </Link>
                </nav>
              </div>

              {/* Exhumation Permits Section */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Exhumation Permits</h3>
                <nav className="space-y-2">
                  <Link href="/services/cemetery/exhumation-permits/verification">
                    <div className={`flex items-center p-3 rounded-lg transition-colors ${
                      exhumationPendingCount > 0 
                        ? 'bg-orange-50 text-orange-700 hover:bg-orange-100' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}>
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Exhumation</p>
                        {exhumationPendingCount > 0 && (
                          <p className="text-xs">{exhumationPendingCount} pending</p>
                        )}
                      </div>
                    </div>
                  </Link>
                </nav>
              </div>

              {/* General Navigation */}
              <nav className="space-y-2">
                <Link href="/services/cemetery/all-registrations">
                  <div className="flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-medium text-sm">All Records</p>
                    </div>
                  </div>
                </Link>

                <Link href="/services/cemetery/transactions">
                  <div className="flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Transactions</p>
                    </div>
                  </div>
                </Link>

                {userRole === "ADMIN" && (
                  <Link href="/services/cemetery/audit-logs">
                    <div className="flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Audit Logs</p>
                      </div>
                    </div>
                  </Link>
                )}
              </nav>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Need Help?</h3>
                <div className="space-y-3">
                  <a href="#" className="flex items-center text-sm text-gray-600 hover:text-orange-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    User Guide
                  </a>
                  <a href="#" className="flex items-center text-sm text-gray-600 hover:text-orange-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    FAQs
                  </a>
                  <a href="#" className="flex items-center text-sm text-gray-600 hover:text-orange-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow-md p-6">
                <p className="text-sm text-orange-100 mb-1">Pending Verification</p>
                <p className="text-4xl font-bold">{pendingCount + permitPendingCount + exhumationPendingCount}</p>
                <p className="text-xs text-orange-100 mt-2">Needs immediate review</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md p-6">
                <p className="text-sm text-blue-100 mb-1">Payment Submitted</p>
                <p className="text-4xl font-bold">{paymentSubmittedCount + permitPaymentSubmittedCount + exhumationPaymentSubmittedCount}</p>
                <p className="text-xs text-blue-100 mt-2">Awaiting confirmation</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-md p-6">
                <p className="text-sm text-green-100 mb-1">For Pickup</p>
                <p className="text-4xl font-bold">{forPickupCount + permitForPickupCount + exhumationForPickupCount}</p>
                <p className="text-xs text-green-100 mt-2">Ready for release</p>
              </div>
              <div className="bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-300 mb-1">Total Records</p>
                <p className="text-4xl font-bold">{totalCount + permitTotalCount + exhumationTotalCount}</p>
                <p className="text-xs text-gray-300 mt-2">All submissions</p>
              </div>
            </div>

            {/* Service Breakdown Overview */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Service Status Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Death Registration */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">Death Registration</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">{totalCount} total</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pending Verification</span>
                      <span className="font-semibold text-orange-600">{pendingCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Payment Submitted</span>
                      <span className="font-semibold text-blue-600">{paymentSubmittedCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">For Pickup</span>
                      <span className="font-semibold text-green-600">{forPickupCount}</span>
                    </div>
                  </div>
                </div>

                {/* Burial Permits */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">Burial Permits</h3>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">{permitTotalCount} total</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pending Verification</span>
                      <span className="font-semibold text-orange-600">{permitPendingCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Payment Submitted</span>
                      <span className="font-semibold text-blue-600">{permitPaymentSubmittedCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">For Pickup</span>
                      <span className="font-semibold text-green-600">{permitForPickupCount}</span>
                    </div>
                  </div>
                </div>

                {/* Exhumation Permits */}
                <div className="border-l-4 border-orange-500 pl-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">Exhumation Permits</h3>
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">{exhumationTotalCount} total</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pending Verification</span>
                      <span className="font-semibold text-orange-600">{exhumationPendingCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Payment Submitted</span>
                      <span className="font-semibold text-blue-600">{exhumationPaymentSubmittedCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">For Pickup</span>
                      <span className="font-semibold text-green-600">{exhumationForPickupCount}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-md p-6 border border-orange-200">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-orange-600 text-white rounded-lg flex items-center justify-center mr-4">
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
                  <div className="bg-white rounded-lg p-3 border border-orange-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Pending Verifications</span>
                      <span className="text-2xl font-bold text-orange-600">{pendingCount + permitPendingCount + exhumationPendingCount}</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Payment Confirmations</span>
                      <span className="text-2xl font-bold text-blue-600">{paymentSubmittedCount + permitPaymentSubmittedCount + exhumationPaymentSubmittedCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md p-6 border border-green-200">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-600 text-white rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Ready for Release</h3>
                    <p className="text-sm text-gray-600">Completed documents</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">For Pickup Today</span>
                      <span className="text-2xl font-bold text-green-600">{forPickupCount + permitForPickupCount + exhumationForPickupCount}</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Total Processed</span>
                      <span className="text-2xl font-bold text-gray-900">{totalCount + permitTotalCount + exhumationTotalCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
