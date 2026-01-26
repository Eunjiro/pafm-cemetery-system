import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import CertificateRequestVerificationActions from "./CertificateRequestVerificationActions"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CertificateRequestVerificationDetailPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const userRole = session.user?.role || "USER"
  if (userRole !== "EMPLOYEE" && userRole !== "ADMIN") {
    redirect("/services/cemetery")
  }

  const { id } = await params
  const request = await prisma.deathCertificateRequest.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-orange-600 mb-4">Request Not Found</h1>
          <p className="text-gray-600 mb-6">The certificate request you're looking for doesn't exist.</p>
          <Link href="/services/cemetery/certificate-requests/verification" className="text-orange-600 hover:underline">
            Return to Verification List
          </Link>
        </div>
      </div>
    )
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING_VERIFICATION":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "APPROVED_FOR_PAYMENT":
        return "bg-orange-200 text-orange-900 border-orange-400"
      case "RETURNED_FOR_CORRECTION":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "REJECTED":
        return "bg-orange-200 text-orange-900 border-orange-400"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/services/cemetery/certificate-requests/verification" className="text-orange-600 hover:underline mb-2 inline-block">
            ← Back to Verification List
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Certificate Request Verification</h1>
              <p className="text-sm text-gray-600 mt-1">Request ID: {request.id}</p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(request.status)}`}>
              {formatStatus(request.status)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deceased Information */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-orange-500">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Deceased Information</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-semibold text-gray-900 text-lg">{request.deceasedFullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date of Death</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(request.deceasedDateOfDeath).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Place of Death</p>
                    <p className="font-semibold text-gray-900">{request.deceasedPlaceOfDeath}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Requester Information */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Requester Information</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Requester Name</p>
                    <p className="font-semibold text-gray-900">{request.requesterName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Relationship to Deceased</p>
                    <p className="font-semibold text-gray-900">{request.requesterRelation}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Contact Number</p>
                    <p className="font-semibold text-gray-900">{request.requesterContactNumber}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Complete Address</p>
                    <p className="font-semibold text-gray-900">{request.requesterAddress}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Purpose of Request</p>
                    <p className="font-semibold text-gray-900">{request.purpose}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Number of Copies</p>
                    <p className="font-semibold text-gray-900">{request.numberOfCopies}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pickup Method</p>
                    <p className="font-semibold text-gray-900">Office Pickup Only</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Additional Information</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Submitted By</span>
                    <span className="font-semibold text-gray-900">{request.user.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Email</span>
                    <span className="font-semibold text-gray-900">{request.user.email}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-600">Submitted On</span>
                    <span className="font-semibold text-gray-900">{formatDate(request.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submitted Documents */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Submitted Documents</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <svg className="w-8 h-8 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">Valid ID</p>
                        <p className="text-xs text-gray-500">Required document</p>
                      </div>
                    </div>
                    <a
                      href={`/api/cemetery/view-document?filePath=${encodeURIComponent(request.validId)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-semibold"
                    >
                      View Document
                    </a>
                  </div>

                  {request.authorizationLetter ? (
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <svg className="w-8 h-8 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-900">Authorization Letter</p>
                          <p className="text-xs text-gray-500">Optional document</p>
                        </div>
                      </div>
                      <a
                        href={`/api/cemetery/view-document?filePath=${encodeURIComponent(request.authorizationLetter)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-semibold"
                      >
                        View Document
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg border border-gray-300">
                      <div className="flex items-center">
                        <svg className="w-8 h-8 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-500">Authorization Letter</p>
                          <p className="text-xs text-gray-400">Not provided (optional)</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Verification Actions */}
              {request.status === "PENDING_VERIFICATION" && (
                <CertificateRequestVerificationActions requestId={request.id} />
              )}

              {/* Fee Summary */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-orange-500">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                  <h2 className="text-lg font-bold text-white">Fee Summary</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Certificate Fee</span>
                      <span className="font-semibold text-gray-900">₱{request.certificateFee.toFixed(2)}</span>
                    </div>
                    {request.additionalCopiesFee > 0 && (
                      <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                        <span className="text-sm text-gray-600">Additional Copies ({request.numberOfCopies - 1})</span>
                        <span className="font-semibold text-gray-900">₱{request.additionalCopiesFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-bold text-gray-900">Total Fee</span>
                      <span className="font-bold text-orange-600 text-xl">₱{request.totalFee.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">Status Timeline</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex">
                      <div className="flex flex-col items-center mr-4">
                        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="w-0.5 h-12 bg-gray-300"></div>
                      </div>
                      <div className="pb-8">
                        <p className="font-semibold text-gray-900">Submitted</p>
                        <p className="text-sm text-gray-500">{formatDate(request.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex">
                      <div className="flex flex-col items-center mr-4">
                        <div className={`w-8 h-8 rounded-full ${request.verifiedAt ? 'bg-orange-500' : 'bg-gray-300'} flex items-center justify-center`}>
                          {request.verifiedAt ? (
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <div className="pb-8">
                        <p className={`font-semibold ${request.verifiedAt ? 'text-gray-900' : 'text-gray-400'}`}>Verified</p>
                        {request.verifiedAt && <p className="text-sm text-gray-500">{formatDate(request.verifiedAt)}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Checklist */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">Verification Checklist</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-700">Deceased information complete</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-700">Requester information complete</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-700">Valid ID submitted</span>
                    </div>
                    <div className="flex items-center">
                      <svg className={`w-5 h-5 mr-2 ${request.authorizationLetter ? 'text-orange-500' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-700">Authorization letter {!request.authorizationLetter && '(optional)'}</span>
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
