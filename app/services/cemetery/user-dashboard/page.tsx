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
      <div className="bg-blue-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/dashboard" className="text-sm text-blue-100 hover:text-white mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold">Cemetery & Burial Services</h1>
              <p className="text-blue-100 mt-1">Submit and track your death registration applications</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">Welcome</p>
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
                  <span className="text-3xl">📋</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">New Death Registration</h3>
                  <p className="text-sm text-gray-600">Submit a new death certificate application</p>
                </div>
              </div>
            </div>
          </Link>

          {/* My Submissions */}
          <Link href="/services/cemetery/my-submissions">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-purple-500">
              <div className="flex items-start">
                <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-3xl">📄</span>
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
