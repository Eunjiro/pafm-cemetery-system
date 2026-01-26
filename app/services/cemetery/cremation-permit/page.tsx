"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"

export default function CremationPermitPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    deceasedName: "",
    deceasedDateOfDeath: "",
    requesterName: "",
    requesterRelation: "",
    requesterContactNumber: "",
    requesterAddress: "",
    funeralHomeName: "",
    funeralHomeContact: "",
  })

  const [files, setFiles] = useState({
    deathCertificate: null as File | null,
    cremationForm: null as File | null,
    transferPermit: null as File | null,
    validId: null as File | null,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Validate required files
      if (!files.deathCertificate || !files.cremationForm || !files.validId) {
        setError("Please upload all required documents")
        setIsLoading(false)
        return
      }

      const submitData = new FormData()
      
      // Add text fields
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value)
      })

      // Add files
      submitData.append("deathCertificate", files.deathCertificate)
      submitData.append("cremationForm", files.cremationForm)
      if (files.transferPermit) {
        submitData.append("transferPermit", files.transferPermit)
      }
      submitData.append("validId", files.validId)

      const response = await fetch("/api/cemetery/cremation-permit", {
        method: "POST",
        body: submitData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit cremation permit")
      }

      router.push("/services/cemetery/my-submissions")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/services/cemetery" className="text-sm text-green-100 hover:text-white mb-2 inline-block">
                ← Back to Cemetery Services
              </Link>
              <h1 className="text-3xl font-bold">Cremation Permit Application</h1>
              <p className="text-green-100 mt-1">Submit your cremation permit application</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-100">Welcome</p>
              <p className="font-semibold">{session?.user?.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Information Notice */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Important Information</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Permit Fee: ₱100.00</li>
                    <li>Required: Death Certificate, Cremation Form (QCHD), Valid ID</li>
                    <li>Optional: Transfer Permit (if applicable)</li>
                    <li>Processing time: 2-3 business days</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Deceased Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Deceased Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name of Deceased <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.deceasedName}
                    onChange={(e) => setFormData({ ...formData, deceasedName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Death <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.deceasedDateOfDeath}
                    onChange={(e) => setFormData({ ...formData, deceasedDateOfDeath: e.target.value })}
                    className="max-w-xs px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Requester Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Requester Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.requesterName}
                    onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relation to Deceased <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.requesterRelation}
                    onChange={(e) => setFormData({ ...formData, requesterRelation: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., Spouse, Child, Parent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.requesterContactNumber}
                    onChange={(e) => setFormData({ ...formData, requesterContactNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="09XXXXXXXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Complete Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={formData.requesterAddress}
                    onChange={(e) => setFormData({ ...formData, requesterAddress: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Funeral Home Information (Optional) */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Funeral Home Information</h2>
              <p className="text-sm text-gray-600 mb-4">(Optional - if applicable)</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Funeral Home Name
                  </label>
                  <input
                    type="text"
                    value={formData.funeralHomeName}
                    onChange={(e) => setFormData({ ...formData, funeralHomeName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Funeral Home Contact Number
                  </label>
                  <input
                    type="tel"
                    value={formData.funeralHomeContact}
                    onChange={(e) => setFormData({ ...formData, funeralHomeContact: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="09XXXXXXXXX"
                  />
                </div>
              </div>
            </div>

            {/* Document Uploads */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Required Documents</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Death Certificate <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setFiles({ ...files, deathCertificate: e.target.files?.[0] || null })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                  <p className="mt-1 text-sm text-gray-500">PDF, JPG, or PNG format</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cremation Form (QCHD) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setFiles({ ...files, cremationForm: e.target.files?.[0] || null })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                  <p className="mt-1 text-sm text-gray-500">PDF, JPG, or PNG format</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transfer Permit (if applicable)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setFiles({ ...files, transferPermit: e.target.files?.[0] || null })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                  <p className="mt-1 text-sm text-gray-500">PDF, JPG, or PNG format</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setFiles({ ...files, validId: e.target.files?.[0] || null })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                  <p className="mt-1 text-sm text-gray-500">PDF, JPG, or PNG format</p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-4">
              <Link
                href="/services/cemetery/user-dashboard"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isLoading ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
