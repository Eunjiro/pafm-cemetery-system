import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import ExhumationVerificationActions from "./ExhumationVerificationActions"

export default async function ExhumationPermitReview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const userRole = session.user?.role || "USER"
  
  if (userRole !== "EMPLOYEE" && userRole !== "ADMIN") {
    redirect("/services/cemetery")
  }

  const permit = await prisma.exhumationPermit.findUnique({
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

  if (!permit) {
    return <div>Exhumation permit not found</div>
  }

  const statusColors: Record<string, string> = {
    PENDING_VERIFICATION: "bg-yellow-100 text-yellow-800",
    RETURNED_FOR_CORRECTION: "bg-red-100 text-red-800",
    APPROVED_FOR_PAYMENT: "bg-blue-100 text-blue-800",
    PAYMENT_SUBMITTED: "bg-purple-100 text-purple-800",
    PAYMENT_CONFIRMED: "bg-green-100 text-green-800",
    READY_FOR_PICKUP: "bg-green-100 text-green-800",
    COMPLETED: "bg-gray-100 text-gray-800"
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/services/cemetery/exhumation-permits/verification" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
            ← Back to Verification Queue
          </Link>
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Exhumation Permit Review</h1>
              <p className="text-gray-600 mt-1">Permit ID: {permit.id}</p>
            </div>
            <span className={`px-4 py-2 rounded-lg text-sm font-medium ${statusColors[permit.status]}`}>
              {permit.status.replace(/_/g, ' ')}
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
                <span className="text-lg font-bold text-gray-900">
                  ₱{permit.permitFee.toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="font-semibold text-gray-900">{permit.deceasedName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Place of Burial</p>
                  <p className="font-semibold text-gray-900">{permit.deceasedPlaceOfBurial}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date of Death</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(permit.deceasedDateOfDeath).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date of Burial</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(permit.deceasedDateOfBurial).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Reason for Exhumation</p>
                  <p className="font-semibold text-gray-900 mt-1">{permit.reasonForExhumation}</p>
                </div>
              </div>
            </div>

            {/* Requester Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Requester Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="font-semibold text-gray-900">{permit.requesterName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Relation to Deceased</p>
                  <p className="font-semibold text-gray-900">{permit.requesterRelation}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact Number</p>
                  <p className="font-semibold text-gray-900">{permit.requesterContactNumber}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-semibold text-gray-900">{permit.requesterAddress}</p>
                </div>
              </div>
            </div>

            {/* Submitted Documents */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Submitted Documents</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">QC Health Department Letter</p>
                      <p className="text-sm text-orange-600">Required - Must be authentic</p>
                    </div>
                  </div>
                  <a 
                    href={`/api/cemetery/view-document?path=${encodeURIComponent(permit.exhumationLetter)}`}
                    target="_blank"
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                  >
                    View
                  </a>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Death Certificate</p>
                      <p className="text-sm text-gray-500">Required document</p>
                    </div>
                  </div>
                  <a 
                    href={`/api/cemetery/view-document?path=${encodeURIComponent(permit.deathCertificate)}`}
                    target="_blank"
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                  >
                    View
                  </a>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Valid ID of Requester</p>
                      <p className="text-sm text-gray-500">Required document</p>
                    </div>
                  </div>
                  <a 
                    href={`/api/cemetery/view-document?path=${encodeURIComponent(permit.validId)}`}
                    target="_blank"
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                  >
                    View
                  </a>
                </div>
              </div>
            </div>

            {/* Remarks History */}
            {permit.remarks && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="font-bold text-yellow-900 mb-2">Previous Remarks</h3>
                <p className="text-yellow-800">{permit.remarks}</p>
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
                  <p className="font-semibold text-gray-900">{permit.user.name}</p>
                  <p className="text-gray-500">{permit.user.email}</p>
                </div>
                <div>
                  <p className="text-gray-600">Submitted on</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(permit.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {permit.processedBy && permit.processedAt && (
                  <div>
                    <p className="text-gray-600">Processed by</p>
                    <p className="font-semibold text-gray-900">{permit.processedBy}</p>
                    <p className="text-gray-500">
                      {new Date(permit.processedAt).toLocaleDateString('en-US', {
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
            {permit.orderOfPayment && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h3 className="font-bold text-orange-900 mb-3">Payment Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-orange-700">Order of Payment</p>
                    <p className="font-bold text-orange-900">{permit.orderOfPayment}</p>
                  </div>
                  <div>
                    <p className="text-orange-700">Amount</p>
                    <p className="font-bold text-orange-900">₱{permit.permitFee.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-orange-700">Status</p>
                    <p className={`font-semibold ${permit.paymentConfirmed ? 'text-green-700' : 'text-orange-700'}`}>
                      {permit.paymentConfirmed ? 'Confirmed' : 'Pending'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {permit.status === 'PENDING_VERIFICATION' && (
              <ExhumationVerificationActions 
                permitId={id}
                employeeName={session.user?.name || 'Unknown'}
              />
            )}

          </div>

        </div>
      </div>
    </div>
  )
}
