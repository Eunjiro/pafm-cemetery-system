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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Pending Verification</p>
            <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
            <p className="text-xs text-gray-500 mt-1">Needs review</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Payment Submitted</p>
            <p className="text-3xl font-bold text-blue-600">{paymentSubmittedCount}</p>
            <p className="text-xs text-gray-500 mt-1">Awaiting confirmation</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">For Pickup</p>
            <p className="text-3xl font-bold text-green-600">{forPickupCount}</p>
            <p className="text-xs text-gray-500 mt-1">Ready for release</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Total Records</p>
            <p className="text-3xl font-bold text-gray-900">{totalCount}</p>
            <p className="text-xs text-gray-500 mt-1">All submissions</p>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Verify Submissions */}
          <Link href="/services/cemetery/verification">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-orange-500">
              <div className="flex items-start">
                <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-3xl">✓</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Verify Submissions</h3>
                  <p className="text-sm text-gray-600">Review and validate death registration applications</p>
                  {pendingCount > 0 && (
                    <span className="inline-block mt-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">
                      {pendingCount} pending
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>

          {/* Payment Confirmation */}
          <Link href="/services/cemetery/payment-confirmation">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-green-500">
              <div className="flex items-start">
                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-3xl">💰</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Confirmation</h3>
                  <p className="text-sm text-gray-600">Confirm payments and prepare certificates</p>
                  {paymentSubmittedCount > 0 && (
                    <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                      {paymentSubmittedCount} to confirm
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>

          {/* All Registrations */}
          <Link href="/services/cemetery/all-registrations">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500">
              <div className="flex items-start">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-3xl">📊</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">All Registrations</h3>
                  <p className="text-sm text-gray-600">View complete list of all submissions</p>
                </div>
              </div>
            </div>
          </Link>

        </div>

        {/* Quick Guide */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Employee Workflow</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center text-lg font-bold mb-3">1</div>
              <h3 className="font-bold text-gray-900 mb-2">Verification</h3>
              <p className="text-sm text-gray-600">Review submitted documents, check for completeness, and either approve or return for corrections. Generate Order of Payment for approved applications.</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center text-lg font-bold mb-3">2</div>
              <h3 className="font-bold text-gray-900 mb-2">Payment</h3>
              <p className="text-sm text-gray-600">Verify proof of payment or OR number. Confirm payment and tag record as "Registered - For Pickup".</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mb-3">3</div>
              <h3 className="font-bold text-gray-900 mb-2">Release</h3>
              <p className="text-sm text-gray-600">Print and prepare physical certificate for release. Mark as completed when picked up by applicant.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
