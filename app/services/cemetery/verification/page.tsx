import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function VerificationDashboard() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const userRole = session.user?.role || "USER"

  // Only EMPLOYEE and ADMIN can access
  if (userRole !== "EMPLOYEE" && userRole !== "ADMIN") {
    redirect("/services/cemetery")
  }

  // Fetch pending registrations
  const pendingRegistrations = await prisma.deathRegistration.findMany({
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
              <h1 className="text-3xl font-bold">Death Registration Verification</h1>
              <p className="text-orange-100 mt-1">Review and process pending submissions</p>
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
            <p className="text-3xl font-bold text-orange-600">{pendingRegistrations.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Regular Fee</p>
            <p className="text-3xl font-bold text-green-600">₱50.00</p>
            <p className="text-xs text-gray-500 mt-1">3-5 business days</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Delayed Fee</p>
            <p className="text-3xl font-bold text-orange-600">₱150.00</p>
            <p className="text-xs text-gray-500 mt-1">11 working days</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Your Role</p>
            <p className="text-2xl font-bold text-blue-600">{userRole}</p>
          </div>
        </div>

        {/* Pending Submissions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Submissions</h2>
          
          {pendingRegistrations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✓</div>
              <p className="text-gray-600">No pending submissions at the moment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deceased Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Informant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {reg.deceasedFirstName} {reg.deceasedMiddleName} {reg.deceasedLastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(reg.deceasedDateOfDeath).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                          reg.registrationType === "DELAYED" 
                            ? "bg-orange-100 text-orange-800" 
                            : "bg-green-100 text-green-800"
                        }`}>
                          {reg.registrationType === "DELAYED" ? "Delayed" : "Regular"}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          ₱{reg.registrationFee?.toFixed(2) || "50.00"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{reg.informantName}</div>
                        <div className="text-sm text-gray-500">{reg.informantRelation}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{reg.user.name}</div>
                        <div className="text-sm text-gray-500">{reg.user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(reg.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link href={`/services/cemetery/verification/${reg.id}`}>
                          <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                            Review
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
