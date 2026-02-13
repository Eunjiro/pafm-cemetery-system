import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import CemeterySubmissionsTable from "./CemeterySubmissionsTable"

export default async function CemeteryIntegrationPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const userRole = session.user?.role || "USER"
  
  if (userRole !== "ADMIN" && userRole !== "EMPLOYEE") {
    redirect("/services/cemetery")
  }

  // Fetch cemetery submission statistics
  const pendingSubmissionCount = await prisma.cemeteryPermitSubmission.count({
    where: { status: 'PENDING_SUBMISSION' }
  })
  
  const submittedCount = await prisma.cemeteryPermitSubmission.count({
    where: { status: 'SUBMITTED' }
  })
  
  const assignedCount = await prisma.cemeteryPermitSubmission.count({
    where: { status: 'ASSIGNED' }
  })
  
  const rejectedCount = await prisma.cemeteryPermitSubmission.count({
    where: { status: 'REJECTED' }
  })
  
  const totalCount = await prisma.cemeteryPermitSubmission.count()

  // Fetch all cemetery submissions
  const submissions = await prisma.cemeteryPermitSubmission.findMany({
    orderBy: [
      { status: 'asc' },
      { createdAt: 'desc' }
    ]
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href={userRole === "ADMIN" ? "/services/cemetery/admin-dashboard" : "/services/cemetery/employee-dashboard"} className="text-sm text-green-100 hover:text-white mb-2 inline-block">
                ← Back to {userRole === "ADMIN" ? "Admin" : "Employee"} Dashboard
              </Link>
              <h1 className="text-3xl font-bold">Cemetery Plot Assignment Integration</h1>
              <p className="text-green-100 mt-1">Send approved burial permits to PAFM-C cemetery mapping system</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-100">{userRole === "ADMIN" ? "System Administrator" : "Cemetery Employee"}</p>
              <p className="font-semibold">{session.user?.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-yellow-100 mb-1">Pending Submission</p>
            <p className="text-4xl font-bold">{pendingSubmissionCount}</p>
            <p className="text-xs text-yellow-100 mt-2">Not yet sent to cemetery</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <p className="text-sm text-green-100 mb-1">Submitted</p>
            <p className="text-4xl font-bold">{submittedCount}</p>
            <p className="text-xs text-green-100 mt-2">Awaiting cemetery response</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-green-100 mb-1">Assigned</p>
            <p className="text-4xl font-bold">{assignedCount}</p>
            <p className="text-xs text-green-100 mt-2">Plot assigned</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-red-600 text-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-green-100 mb-1">Rejected</p>
            <p className="text-4xl font-bold">{rejectedCount}</p>
            <p className="text-xs text-green-100 mt-2">Not approved</p>
          </div>

          <div className="bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-300 mb-1">Total Permits</p>
            <p className="text-4xl font-bold">{totalCount}</p>
            <p className="text-xs text-gray-300 mt-2">All time</p>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Cemetery Plot Assignment Queue</h2>
            <p className="text-sm text-gray-600 mt-1">Send approved burial permits to PAFM-C cemetery system for plot assignment</p>
          </div>
          
          <CemeterySubmissionsTable submissions={submissions} />
        </div>

      </div>
    </div>
  )
}
