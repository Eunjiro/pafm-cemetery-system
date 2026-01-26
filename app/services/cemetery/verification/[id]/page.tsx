import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import VerificationActions from "./VerificationActions"

export default async function VerificationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const userRole = session.user?.role || "USER"
  
  if (userRole !== "EMPLOYEE" && userRole !== "ADMIN") {
    redirect("/services/cemetery")
  }

  const registration = await prisma.deathRegistration.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })

  if (!registration) {
    return <div>Registration not found</div>
  }

  const statusColors: Record<string, string> = {
    PENDING_VERIFICATION: "bg-yellow-100 text-yellow-800",
    RETURNED_FOR_CORRECTION: "bg-red-100 text-red-800",
    APPROVED_FOR_PAYMENT: "bg-blue-100 text-blue-800",
    PAYMENT_SUBMITTED: "bg-purple-100 text-purple-800",
    PAYMENT_CONFIRMED: "bg-green-100 text-green-800",
    REGISTERED_FOR_PICKUP: "bg-green-100 text-green-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    REJECTED: "bg-red-100 text-red-800"
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/services/cemetery/verification" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
            ← Back to Verification Queue
          </Link>
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Death Registration Review</h1>
              <p className="text-gray-600 mt-1">Application ID: {registration.id}</p>
            </div>
            <span className={`px-4 py-2 rounded-lg text-sm font-medium ${statusColors[registration.status]}`}>
              {registration.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Deceased Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Deceased Person Details</h2>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    registration.registrationType === "DELAYED" 
                      ? "bg-orange-100 text-orange-800" 
                      : "bg-green-100 text-green-800"
                  }`}>
                    {registration.registrationType === "DELAYED" ? "Delayed Registration" : "Regular Registration"}
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    ₱{registration.registrationFee?.toFixed(2) || "50.00"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="font-semibold text-gray-900">
                    {registration.deceasedFirstName} {registration.deceasedMiddleName} {registration.deceasedLastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gender</p>
                  <p className="font-semibold text-gray-900">{registration.deceasedGender}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date of Birth</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(registration.deceasedDateOfBirth).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date of Death</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(registration.deceasedDateOfDeath).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Place of Death</p>
                  <p className="font-semibold text-gray-900">{registration.deceasedPlaceOfDeath}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Cause of Death</p>
                  <p className="font-semibold text-gray-900">{registration.deceasedCauseOfDeath}</p>
                </div>
              </div>
            </div>

            {/* Informant Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Informant Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="font-semibold text-gray-900">{registration.informantName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Relation to Deceased</p>
                  <p className="font-semibold text-gray-900">{registration.informantRelation}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact Number</p>
                  <p className="font-semibold text-gray-900">{registration.informantContactNumber}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-semibold text-gray-900">{registration.informantAddress}</p>
                </div>
              </div>
            </div>

            {/* Submitted Documents */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Submitted Documents 
                {registration.registrationType === "DELAYED" && (
                  <span className="text-sm font-normal text-orange-600 ml-2">(Delayed Registration)</span>
                )}
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Municipal Form 103 (Death Certificate)</p>
                      <p className="text-sm text-gray-500">Required document</p>
                    </div>
                  </div>
                  <a 
                    href={`/api/cemetery/view-document?path=${encodeURIComponent(registration.municipalForm103)}`}
                    target="_blank"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    View
                  </a>
                </div>

                {/* Delayed Registration Additional Documents */}
                {registration.registrationType === "DELAYED" && (
                  <>
                    {registration.affidavitOfDelayed && (
                      <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Affidavit of Delayed Registration</p>
                            <p className="text-sm text-orange-600">Delayed - Required</p>
                          </div>
                        </div>
                        <a 
                          href={`/api/cemetery/view-document?path=${encodeURIComponent(registration.affidavitOfDelayed)}`}
                          target="_blank"
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                        >
                          View
                        </a>
                      </div>
                    )}

                    {registration.burialCertificate && (
                      <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Burial/Cremation Certificate</p>
                            <p className="text-sm text-orange-600">Delayed - Required</p>
                          </div>
                        </div>
                        <a 
                          href={`/api/cemetery/view-document?path=${encodeURIComponent(registration.burialCertificate)}`}
                          target="_blank"
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                        >
                          View
                        </a>
                      </div>
                    )}

                    {registration.funeralCertificate && (
                      <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Funeral Service Certificate</p>
                            <p className="text-sm text-orange-600">Delayed - Required</p>
                          </div>
                        </div>
                        <a 
                          href={`/api/cemetery/view-document?path=${encodeURIComponent(registration.funeralCertificate)}`}
                          target="_blank"
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                        >
                          View
                        </a>
                      </div>
                    )}

                    {registration.psaNoRecord && (
                      <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">PSA Certificate of No Record</p>
                            <p className="text-sm text-orange-600">Delayed - Required</p>
                          </div>
                        </div>
                        <a 
                          href={`/api/cemetery/view-document?path=${encodeURIComponent(registration.psaNoRecord)}`}
                          target="_blank"
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                        >
                          View
                        </a>
                      </div>
                    )}
                  </>
                )}

                {registration.swabTestResult && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Swab Test Result</p>
                        <p className="text-sm text-gray-500">Covid-related</p>
                      </div>
                    </div>
                    <a 
                      href={`/api/cemetery/view-document?path=${encodeURIComponent(registration.swabTestResult)}`}
                      target="_blank"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      View
                    </a>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Valid ID of Informant</p>
                      <p className="text-sm text-gray-500">Required document</p>
                    </div>
                  </div>
                  <a 
                    href={`/api/cemetery/view-document?path=${encodeURIComponent(registration.informantValidId)}`}
                    target="_blank"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    View
                  </a>
                </div>
              </div>
            </div>

            {/* Remarks History */}
            {registration.remarks && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="font-bold text-yellow-900 mb-2">Previous Remarks</h3>
                <p className="text-yellow-800">{registration.remarks}</p>
              </div>
            )}

          </div>

          {/* Sidebar - Right Side */}
          <div className="space-y-6">
            
            {/* Submission Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-gray-900 mb-4">Submission Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Submitted by</p>
                  <p className="font-semibold text-gray-900">{registration.user.name}</p>
                  <p className="text-gray-500">{registration.user.email}</p>
                </div>
                <div>
                  <p className="text-gray-600">Submitted on</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(registration.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {registration.processedBy && registration.processedAt && (
                  <div>
                    <p className="text-gray-600">Processed by</p>
                    <p className="font-semibold text-gray-900">{registration.processedBy}</p>
                    <p className="text-gray-500">
                      {new Date(registration.processedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Info */}
            {registration.orderOfPayment && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-bold text-blue-900 mb-3">Payment Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-blue-700">Order of Payment</p>
                    <p className="font-bold text-blue-900">{registration.orderOfPayment}</p>
                  </div>
                  <div>
                    <p className="text-blue-700">Amount</p>
                    <p className="font-bold text-blue-900">₱50.00</p>
                  </div>
                  <div>
                    <p className="text-blue-700">Status</p>
                    <p className={`font-semibold ${registration.paymentConfirmed ? 'text-green-700' : 'text-orange-700'}`}>
                      {registration.paymentConfirmed ? 'Confirmed' : 'Pending'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {registration.status === 'PENDING_VERIFICATION' && (
              <VerificationActions 
                registrationId={id}
                employeeName={session.user?.name || 'Unknown'}
              />
            )}

          </div>

        </div>
      </div>
    </div>
  )
}
