import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function AdminDashboard() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const userRole = session.user?.role || "USER"
  
  if (userRole !== "ADMIN") {
    redirect("/services/cemetery")
  }

  // Fetch statistics
  const stats = await prisma.deathRegistration.groupBy({
    by: ['status'],
    _count: true
  })

  const totalCount = stats.reduce((acc, s) => acc + s._count, 0)
  const pendingCount = stats.find(s => s.status === 'PENDING_VERIFICATION')?._count || 0
  const approvedCount = stats.find(s => s.status === 'APPROVED_FOR_PAYMENT')?._count || 0
  const completedCount = stats.find(s => s.status === 'COMPLETED')?._count || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/dashboard" className="text-sm text-red-100 hover:text-white mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold">Cemetery Services - Admin Portal</h1>
              <p className="text-red-100 mt-1">Full system access and management controls</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-red-100">System Administrator</p>
              <p className="font-semibold">{session.user?.name}</p>
              <span className="inline-block mt-1 px-2 py-1 bg-red-700 text-red-100 text-xs font-bold rounded">
                ADMIN
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-gray-600">
            <p className="text-sm text-gray-600 mb-1">Total Records</p>
            <p className="text-3xl font-bold text-gray-900">{totalCount}</p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-600">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
            <p className="text-xs text-gray-500 mt-1">Awaiting action</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
            <p className="text-sm text-gray-600 mb-1">Approved</p>
            <p className="text-3xl font-bold text-blue-600">{approvedCount}</p>
            <p className="text-xs text-gray-500 mt-1">Processing</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-600">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-3xl font-bold text-green-600">{completedCount}</p>
            <p className="text-xs text-gray-500 mt-1">Finished</p>
          </div>
        </div>

        {/* Admin Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          
          {/* All Registrations */}
          <Link href="/services/cemetery/all-registrations">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-gray-500">
              <div className="flex items-start">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-3xl">📊</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">All Registrations</h3>
                  <p className="text-sm text-gray-600">View and manage all death registration records</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Verification Queue */}
          <Link href="/services/cemetery/verification">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-orange-500">
              <div className="flex items-start">
                <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-3xl">✓</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Verification Queue</h3>
                  <p className="text-sm text-gray-600">Review and override submission approvals</p>
                  {pendingCount > 0 && (
                    <span className="inline-block mt-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">
                      {pendingCount} pending
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>

          {/* Payment Management */}
          <Link href="/services/cemetery/payment-confirmation">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-green-500">
              <div className="flex items-start">
                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-3xl">💰</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Management</h3>
                  <p className="text-sm text-gray-600">Oversee payment confirmations and OR generation</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Edit Records */}
          <Link href="/services/cemetery/edit-records">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-red-500">
              <div className="flex items-start">
                <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-3xl">✏️</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Edit Records</h3>
                  <p className="text-sm text-gray-600">Modify or correct registration entries</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                    Admin Only
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Audit Logs */}
          <Link href="/services/cemetery/audit-logs">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-purple-500">
              <div className="flex items-start">
                <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-3xl">📋</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Audit Logs</h3>
                  <p className="text-sm text-gray-600">Track all system activities and changes</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                    Admin Only
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Staff Management */}
          <Link href="/services/cemetery/staff-management">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500">
              <div className="flex items-start">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-3xl">👥</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Staff Management</h3>
                  <p className="text-sm text-gray-600">Manage employee accounts and permissions</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    Admin Only
                  </span>
                </div>
              </div>
            </div>
          </Link>

        </div>

        {/* System Overview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Administrator Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Full Control</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Override any approval or rejection decision</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Edit and modify any registration entry</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Delete or archive records</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Generate custom reports and analytics</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-3">System Management</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>View complete audit trail of all activities</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Manage employee and user accounts</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Configure system settings and parameters</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Access to all modules and features</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Registration Status Breakdown</h2>
          <div className="space-y-3">
            {stats.map((stat) => {
              const percentage = totalCount > 0 ? ((stat._count / totalCount) * 100).toFixed(1) : 0
              return (
                <div key={stat.status} className="flex items-center">
                  <div className="w-48 text-sm font-medium text-gray-700">{stat.status.replace(/_/g, ' ')}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 mr-4">
                    <div 
                      className="bg-blue-600 h-4 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="w-16 text-right text-sm font-medium text-gray-900">{stat._count}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
