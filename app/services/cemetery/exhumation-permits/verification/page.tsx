import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function ExhumationPermitVerification() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const userRole = session.user?.role || "USER"
  
  if (userRole !== "EMPLOYEE" && userRole !== "ADMIN") {
    redirect("/services/cemetery")
  }

  // Fetch pending exhumation permits
  const pendingPermits = await prisma.exhumationPermit.findMany({
    where: {
      status: "PENDING_VERIFICATION"
    },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  })

  // Fetch returned permits (for corrections)
  const returnedPermits = await prisma.exhumationPermit.findMany({
    where: {
      status: "RETURNED_FOR_CORRECTION"
    },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-orange-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/services/cemetery/employee-dashboard" className="text-sm text-orange-100 hover:text-white mb-2 inline-block">
                ← Back to Employee Dashboard
              </Link>
              <h1 className="text-3xl font-bold">Exhumation Permit Verification</h1>
              <p className="text-orange-100 mt-1">Review and verify exhumation permit requests</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-orange-100">Cemetery Staff</p>
              <p className="font-semibold">{session.user?.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-md p-6">
            <p className="text-sm text-orange-100 mb-1">Pending Verification</p>
            <p className="text-4xl font-bold">{pendingPermits.length}</p>
            <p className="text-xs text-orange-100 mt-2">Awaiting review</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg shadow-md p-6">
            <p className="text-sm text-red-100 mb-1">Returned for Correction</p>
            <p className="text-4xl font-bold">{returnedPermits.length}</p>
            <p className="text-xs text-red-100 mt-2">Waiting for resubmission</p>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8 rounded-lg">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-bold text-yellow-900 mb-2">Verification Checklist</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>✓ Verify QC Health Department exhumation letter is authentic and valid</li>
                <li>✓ Check certified copy of death certificate is complete</li>
                <li>✓ Verify valid ID matches requester name</li>
                <li>✓ Confirm burial location details are accurate</li>
                <li>✓ Review reason for exhumation is legitimate</li>
                <li>✓ Processing Fee: ₱100.00</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Pending Permits */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Pending Verification ({pendingPermits.length})
          </h2>
          
          {pendingPermits.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 mb-2 mt-4">All Caught Up!</h3>
              <p className="text-gray-600">No exhumation permits pending verification at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPermits.map((permit) => (
                <div key={permit.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-orange-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                          Exhumation Permit
                        </span>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                          Pending Verification
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{permit.deceasedName}</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Burial Location</p>
                          <p className="font-medium text-gray-900">{permit.deceasedPlaceOfBurial}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Requester</p>
                          <p className="font-medium text-gray-900">{permit.requesterName}</p>
                          <p className="text-xs text-gray-500">{permit.requesterRelation}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Submitted By</p>
                          <p className="font-medium text-gray-900">{permit.user.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Submission Date</p>
                          <p className="font-medium text-gray-900">
                            {new Date(permit.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="bg-orange-50 p-3 rounded-lg">
                        <p className="text-sm text-orange-900 font-medium mb-1">Reason for Exhumation:</p>
                        <p className="text-sm text-orange-800">{permit.reasonForExhumation}</p>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-3">
                        Permit ID: <span className="font-mono text-gray-900">{permit.id}</span>
                      </p>
                      <p className="text-sm font-medium text-orange-600 mt-1">
                        Permit Fee: ₱{permit.permitFee.toFixed(2)}
                      </p>
                    </div>
                    
                    <Link href={`/services/cemetery/exhumation-permits/verification/${permit.id}`}>
                      <button className="ml-4 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">
                        Review →
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Returned Permits */}
        {returnedPermits.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Returned for Correction ({returnedPermits.length})
            </h2>
            
            <div className="space-y-4">
              {returnedPermits.map((permit) => (
                <div key={permit.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500 opacity-75">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                          Exhumation Permit
                        </span>
                        <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                          Returned for Correction
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{permit.deceasedName}</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Requester</p>
                          <p className="font-medium text-gray-900">{permit.requesterName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Submitted By</p>
                          <p className="font-medium text-gray-900">{permit.user.name}</p>
                        </div>
                      </div>

                      {permit.remarks && (
                        <div className="bg-red-50 p-3 rounded-lg">
                          <p className="text-sm text-red-900 font-medium mb-1">Remarks:</p>
                          <p className="text-sm text-red-800">{permit.remarks}</p>
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-600 mt-3">
                        Permit ID: <span className="font-mono text-gray-900">{permit.id}</span>
                      </p>
                    </div>
                    
                    <Link href={`/services/cemetery/exhumation-permits/verification/${permit.id}`}>
                      <button className="ml-4 px-6 py-3 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium">
                        View
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
