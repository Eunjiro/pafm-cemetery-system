"use client"

import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"

export default function DashboardPage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    redirect("/login")
  }

  const userRole = session?.user?.role || "USER"

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">P</span>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">PAFM</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, <strong>{session?.user?.name}</strong>
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                userRole === 'ADMIN' ? 'bg-red-100 text-red-800' :
                userRole === 'EMPLOYEE' ? 'bg-orange-100 text-orange-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {userRole}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {userRole === 'ADMIN' ? 'Administrator Dashboard' : 
           userRole === 'EMPLOYEE' ? 'Employee Dashboard' : 
           'My Dashboard'}
        </h1>
        <p className="text-gray-600 mb-8">
          {userRole === 'ADMIN' ? 'Full system access and management controls' : 
           userRole === 'EMPLOYEE' ? 'Process requests and manage municipal services' : 
           'Access municipal services and track your applications'}
        </p>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <Link href="/services/cemetery">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-green-600">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">🪦</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Cemetery & Burial</h3>
                  <p className="text-sm text-gray-600">Death registration and burial records</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/services/water">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-600">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">💧</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Water Supply</h3>
                  <p className="text-sm text-gray-600">Water and drainage requests</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/services/inventory">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-purple-600">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">📦</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Assets Inventory</h3>
                  <p className="text-sm text-gray-600">Track municipal assets and equipment</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/services/parks">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-teal-600">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">🌳</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Parks & Recreation</h3>
                  <p className="text-sm text-gray-600">Schedule facilities and events</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/services/facilities">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-orange-600">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">🏢</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Facility Management</h3>
                  <p className="text-sm text-gray-600">Manage public facilities</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Admin-specific quick links */}
          {userRole === 'ADMIN' && (
            <Link href="/admin/users">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-red-600">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">User Management</h3>
                    <p className="text-sm text-gray-600">Manage accounts and permissions</p>
                    <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                      Admin Only
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )}

        </div>

        {/* Role-specific quick info */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {userRole === 'ADMIN' ? 'System Overview' : 
             userRole === 'EMPLOYEE' ? 'Your Responsibilities' : 
             'Getting Started'}
          </h2>
          
          {userRole === 'USER' && (
            <div className="space-y-3">
              <p className="text-gray-700">Welcome to PAFM! Here you can:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Submit death registration applications online</li>
                <li>Track the status of your submitted applications</li>
                <li>Request water supply and drainage services</li>
                <li>Book public facilities and recreational areas</li>
              </ul>
            </div>
          )}

          {userRole === 'EMPLOYEE' && (
            <div className="space-y-3">
              <p className="text-gray-700">As a Civil Registry Staff member, you can:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Review and verify death registration submissions</li>
                <li>Approve or return applications for correction</li>
                <li>Generate orders of payment and confirm payments</li>
                <li>Prepare certificates for release to applicants</li>
              </ul>
            </div>
          )}

          {userRole === 'ADMIN' && (
            <div className="space-y-3">
              <p className="text-gray-700">As a System Administrator, you have:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Full access to all modules and features</li>
                <li>Ability to override any approval or rejection</li>
                <li>Edit and modify registration entries</li>
                <li>Manage employee and user accounts</li>
                <li>Access to complete audit logs and system analytics</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
