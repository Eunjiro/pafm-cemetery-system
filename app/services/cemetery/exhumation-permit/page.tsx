"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ExhumationPermitRequest() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    deceasedName: "",
    deceasedDateOfDeath: "",
    deceasedDateOfBurial: "",
    deceasedPlaceOfBurial: "",
    requesterName: "",
    requesterRelation: "",
    requesterContactNumber: "",
    requesterAddress: "",
    reasonForExhumation: "",
    exhumationLetter: null as File | null,
    deathCertificate: null as File | null,
    validId: null as File | null,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target
    if (files && files[0]) {
      setFormData({
        ...formData,
        [name]: files[0]
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const data = new FormData()
      
      // Text fields
      data.append("deceasedName", formData.deceasedName)
      data.append("deceasedDateOfDeath", formData.deceasedDateOfDeath)
      data.append("deceasedDateOfBurial", formData.deceasedDateOfBurial)
      data.append("deceasedPlaceOfBurial", formData.deceasedPlaceOfBurial)
      data.append("requesterName", formData.requesterName)
      data.append("requesterRelation", formData.requesterRelation)
      data.append("requesterContactNumber", formData.requesterContactNumber)
      data.append("requesterAddress", formData.requesterAddress)
      data.append("reasonForExhumation", formData.reasonForExhumation)

      // Required files
      if (formData.exhumationLetter) data.append("exhumationLetter", formData.exhumationLetter)
      if (formData.deathCertificate) data.append("deathCertificate", formData.deathCertificate)
      if (formData.validId) data.append("validId", formData.validId)

      const response = await fetch("/api/cemetery/exhumation-permit", {
        method: "POST",
        body: data
      })

      const result = await response.json()

      if (response.ok) {
        alert("Exhumation permit request submitted successfully!")
        router.push("/services/cemetery/my-submissions")
      } else {
        setError(result.error || "Submission failed")
      }
    } catch (err) {
      setError("An error occurred during submission")
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center">
      <p>Please log in to submit an exhumation permit request.</p>
    </div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/services/cemetery/user-dashboard" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
            ← Back to Cemetery Services
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Exhumation Permit Request</h1>
          <p className="text-gray-600 mt-2">Submit your exhumation permit application</p>
        </div>

        {/* Fee Information */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm mb-1">Permit Fee</p>
              <p className="text-4xl font-bold">₱100.00</p>
            </div>
            <div className="text-right">
              <svg className="w-16 h-16 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Deceased Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Deceased Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name of Deceased <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="deceasedName"
                  value={formData.deceasedName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Death <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  name="deceasedDateOfDeath"
                  value={formData.deceasedDateOfDeath}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Burial <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  name="deceasedDateOfBurial"
                  value={formData.deceasedDateOfBurial}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Place of Burial <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="deceasedPlaceOfBurial"
                  value={formData.deceasedPlaceOfBurial}
                  onChange={handleChange}
                  placeholder="Cemetery name, block, lot number"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Requester Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Requester Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="requesterName"
                  value={formData.requesterName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relation to Deceased <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="requesterRelation"
                  value={formData.requesterRelation}
                  onChange={handleChange}
                  placeholder="e.g., Son, Daughter, Spouse"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  name="requesterContactNumber"
                  value={formData.requesterContactNumber}
                  onChange={handleChange}
                  placeholder="09XX-XXX-XXXX"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="requesterAddress"
                  value={formData.requesterAddress}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Exhumation <span className="text-red-600">*</span>
                </label>
                <textarea
                  name="reasonForExhumation"
                  value={formData.reasonForExhumation}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Explain the purpose of exhumation (e.g., transfer to another location, family request)"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Required Documents */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Required Documents</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exhumation Letter (QC Health Department) <span className="text-red-600">*</span>
                </label>
                <input
                  type="file"
                  name="exhumationLetter"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">Accepted: PDF, JPG, PNG (Max 5MB)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certified Copy of Death Certificate <span className="text-red-600">*</span>
                </label>
                <input
                  type="file"
                  name="deathCertificate"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">Accepted: PDF, JPG, PNG (Max 5MB)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valid ID (Requester) <span className="text-red-600">*</span>
                </label>
                <input
                  type="file"
                  name="validId"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">Accepted: PDF, JPG, PNG (Max 5MB)</p>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-yellow-900 mb-3">📌 Important Notes</h3>
            <ul className="space-y-2 text-sm text-yellow-800">
              <li>• Exhumation letter from QC Health Department is mandatory</li>
              <li>• Processing time is 5-7 business days after payment confirmation</li>
              <li>• Permit fee is ₱100.00</li>
              <li>• All documents must be clear and readable</li>
              <li>• You will receive an Order of Payment after verification</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Link href="/services/cemetery/user-dashboard" className="flex-1">
              <button
                type="button"
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
