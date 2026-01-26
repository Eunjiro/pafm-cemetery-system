import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function UserDashboard() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const userRole = session.user?.role || "USER"
  
  if (userRole !== "USER") {
    redirect("/services/cemetery")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/dashboard" className="text-sm text-green-100 hover:text-white mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold">Cemetery & Burial Services</h1>
              <p className="text-green-100 mt-1">Submit and track your death registration applications</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-100">Welcome</p>
              <p className="font-semibold">{session.user?.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* New Death Registration */}
          <Link href="/services/cemetery/death-registration">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500">
              <div className="flex items-start">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Death Registration</h3>
                  <p className="text-sm text-gray-600">Submit a new death certificate application</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Burial Permit */}
          <Link href="/services/cemetery/burial-permit">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-orange-500">
              <div className="flex items-start">
                <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Burial Permit</h3>
                  <p className="text-sm text-gray-600">Request burial, entrance, or niche permit</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Exhumation Permit */}
          <Link href="/services/cemetery/exhumation-permit">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-purple-500">
              <div className="flex items-start">
                <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Exhumation Permit</h3>
                  <p className="text-sm text-gray-600">Request permit for exhumation with QC Health letter</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Cremation Permit */}
          <Link href="/services/cemetery/cremation-permit">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-red-500">
              <div className="flex items-start">
                <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Cremation Permit</h3>
                  <p className="text-sm text-gray-600">Apply for cremation permit with QCHD form</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Death Certificate Request */}
          <Link href="/services/cemetery/death-certificate-request">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Death Certificate Request</h3>
                  <p className="text-sm text-gray-600">Request certified copy of death certificate</p>
                </div>
              </div>
            </div>
          </Link>

          {/* My Submissions */}
          <Link href="/services/cemetery/my-submissions">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-purple-500">
              <div className="flex items-start">
                <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">My Submissions</h3>
                  <p className="text-sm text-gray-600">View and track your applications</p>
                </div>
              </div>
            </div>
          </Link>

        </div>

        {/* Quick Stats */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Registration Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Registration Fee</p>
              <p className="text-2xl font-bold text-blue-600">₱50.00</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Processing Time</p>
              <p className="text-2xl font-bold text-green-600">1-3 Days</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600">Required Documents</p>
              <p className="text-2xl font-bold text-orange-600">3 Files</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">How to Register a Death Certificate</h2>
          <ol className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
              <div>
                <span className="font-semibold">Submit Application</span>
                <p className="text-sm text-gray-600">Complete the online form and upload required documents (Municipal Form 103, Valid ID, and Swab Test if applicable)</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
              <div>
                <span className="font-semibold">Wait for Verification</span>
                <p className="text-sm text-gray-600">Civil Registry staff will review your submission and generate an Order of Payment</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
              <div>
                <span className="font-semibold">Pay Registration Fee</span>
                <p className="text-sm text-gray-600">Pay ₱50.00 and upload proof of payment or enter your OR number</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
              <div>
                <span className="font-semibold">Pick Up Certificate</span>
                <p className="text-sm text-gray-600">Once approved, visit the Civil Registry Office to collect your physical death certificate</p>
              </div>
            </li>
          </ol>
        </div>

        {/* Important Notes */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-yellow-900 mb-3">📌 Important Notes</h3>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li>• All documents must be clear and readable (PDF, JPG, or PNG format)</li>
            <li>• Maximum file size: 5MB per document</li>
            <li>• Processing time may vary depending on completeness of documents</li>
            <li>• You will be notified via your contact number for any updates</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
