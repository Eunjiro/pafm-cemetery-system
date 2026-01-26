import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function BurialPermitVerificationDashboard() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const userRole = session.user?.role || "USER"

  // Only EMPLOYEE and ADMIN can access
  if (userRole !== "EMPLOYEE" && userRole !== "ADMIN") {
    redirect("/services/cemetery")
  }

  // Fetch pending burial permits
  const pendingPermits = await prisma.burialPermit.findMany({
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-orange-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/services/cemetery/employee-dashboard" className="text-sm text-orange-100 hover:text-white mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold">Burial Permit Verification</h1>
              <p className="text-orange-100 mt-1">Review and process pending permit requests</p>
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
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Pending Verification</p>
            <p className="text-3xl font-bold text-orange-600">{pendingPermits.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Burial/Entrance</p>
            <p className="text-3xl font-bold text-green-600">₱100</p>
            <p className="text-xs text-gray-500 mt-1">Base permit fee</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Niche (Child)</p>
            <p className="text-3xl font-bold text-blue-600">₱850</p>
            <p className="text-xs text-gray-500 mt-1">₱100 + ₱750</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Niche (Adult)</p>
            <p className="text-3xl font-bold text-purple-600">₱1,600</p>
            <p className="text-xs text-gray-500 mt-1">₱100 + ₱1,500</p>
          </div>
        </div>

        {/* Pending Submissions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Permit Requests</h2>
          
          {pendingPermits.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-600 mt-4">No pending permit requests at the moment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deceased Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requester
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permit Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cemetery
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Fee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingPermits.map((permit) => (
                    <tr key={permit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(permit.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{permit.deceasedName}</div>
                        <div className="text-sm text-gray-500">
                          Died: {new Date(permit.deceasedDateOfDeath).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{permit.requesterName}</div>
                        <div className="text-sm text-gray-500">{permit.requesterRelation}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          permit.burialType === 'BURIAL' ? 'bg-green-100 text-green-800' :
                          permit.burialType === 'ENTRANCE' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {permit.burialType}
                          {permit.burialType === 'NICHE' && permit.nicheType && ` (${permit.nicheType})`}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {permit.cemeteryLocation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">₱{permit.totalFee.toFixed(2)}</div>
                        {permit.nicheFee && (
                          <div className="text-xs text-gray-500">
                            ₱{permit.permitFee.toFixed(2)} + ₱{permit.nicheFee.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/services/cemetery/burial-permits/verification/${permit.id}`}
                          className="text-orange-600 hover:text-orange-900 font-medium"
                        >
                          Review →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Verification Instructions</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Click "Review" to see full details and documents</li>
            <li>• Verify all required documents are complete and valid</li>
            <li>• For ENTRANCE permits, ensure Transfer Permit is provided</li>
            <li>• For Bagbag/Novaliches, verify Affidavit of Undertaking</li>
            <li>• Verify fee calculation matches permit type</li>
            <li>• Approve to generate Order of Payment or reject with reason</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
