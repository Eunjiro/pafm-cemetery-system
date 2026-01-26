import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import CremationPermitVerificationActions from "./CremationPermitVerificationActions"

export default async function CremationPermitVerificationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const userRole = session.user?.role || "USER"
  
  if (userRole !== "EMPLOYEE" && userRole !== "ADMIN") {
    redirect("/services/cemetery")
  }

  const permit = await prisma.cremationPermit.findUnique({
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
    return <div>Permit not found</div>
  }

  const statusColors: Record<string, string> = {
    PENDING_VERIFICATION: "bg-orange-100 text-orange-800",
    RETURNED_FOR_CORRECTION: "bg-orange-200 text-orange-900",
    APPROVED_FOR_PAYMENT: "bg-orange-100 text-orange-800",
    PAYMENT_SUBMITTED: "bg-orange-200 text-orange-900",
    PAYMENT_CONFIRMED: "bg-orange-300 text-orange-900",
    REGISTERED_FOR_PICKUP: "bg-orange-300 text-orange-900",
    COMPLETED: "bg-gray-100 text-gray-800",
    REJECTED: "bg-orange-200 text-orange-900"
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/services/cemetery/cremation-permits/verification" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
            ← Back to Verification Queue
          </Link>
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cremation Permit Review</h1>
              <p className="text-gray-600 mt-1">Permit ID: {permit.id}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-lg text-sm font-medium ${statusColors[permit.status]}`}>
                {permit.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Permit Type & Fee */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm mb-1">Permit Type</p>
                  <p className="text-2xl font-bold">CREMATION PERMIT</p>
                </div>
                <div className="text-right">
                  <p className="text-orange-100 text-sm mb-1">Permit Fee</p>
                  <p className="text-4xl font-bold">₱{permit.permitFee.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Deceased Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Deceased Person Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="font-semibold text-gray-900 text-lg">{permit.deceasedName}</p>
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

            {/* Additional Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Information</h2>
              <div className="space-y-3">
                {permit.funeralHomeName && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-gray-600">Funeral Home:</span>
                    <span className="font-semibold text-gray-900">{permit.funeralHomeName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Submitted By:</span>
                  <span className="font-semibold text-gray-900">{permit.user.name}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-semibold text-gray-900">{permit.user.email}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Submitted Date:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(permit.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Submitted Documents</h2>
              <div className="space-y-3">
                
                {/* Death Certificate */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">Certified Copy of Death Certificate</p>
                      <p className="text-xs text-gray-500">Required Document</p>
                    </div>
                  </div>
                  <a 
                    href={`/api/view-document?path=${encodeURIComponent(permit.deathCertificate)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-800 font-medium text-sm"
                  >
                    View →
                  </a>
                </div>

                {/* Cremation Authorization Form */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">Cremation Authorization Form</p>
                      <p className="text-xs text-gray-500">Required Document</p>
                    </div>
                  </div>
                  <a 
                    href={`/api/view-document?path=${encodeURIComponent(permit.cremationForm)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    View →
                  </a>
                </div>

                {/* Valid ID */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">Valid ID (Requester)</p>
                      <p className="text-xs text-gray-500">Required Document</p>
                    </div>
                  </div>
                  <a 
                    href={`/api/view-document?path=${encodeURIComponent(permit.validId)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    View →
                  </a>
                </div>

                {/* Transfer Permit (if applicable) */}
                {permit.transferPermit && (
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">Transfer Permit</p>
                        <p className="text-xs text-orange-600">Optional Document</p>
                      </div>
                    </div>
                    <a 
                      href={`/api/view-document?path=${encodeURIComponent(permit.transferPermit)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      View →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Actions Card */}
            {permit.status === "PENDING_VERIFICATION" && (
              <CremationPermitVerificationActions permitId={permit.id} />
            )}

            {/* Status History */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Status Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Submitted</p>
                    <p className="text-sm text-gray-500">
                      {new Date(permit.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {permit.status !== "PENDING_VERIFICATION" && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">Verified</p>
                      <p className="text-sm text-gray-500">
                        {new Date(permit.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fee Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Fee Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cremation Permit Fee:</span>
                  <span className="font-medium">₱{permit.permitFee.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-red-600">₱{permit.permitFee.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-blue-900 mb-3">Verification Checklist</h3>
              <ul className="space-y-2 text-xs text-blue-800">
                <li>✓ Death certificate is valid and legible</li>
                <li>✓ Cremation authorization form is complete</li>
                <li>✓ Valid ID matches requester name</li>
                <li>✓ Requester details are complete</li>
                <li>✓ Fee is correct (₱100)</li>
                {permit.transferPermit && <li>✓ Transfer permit verified (if provided)</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
