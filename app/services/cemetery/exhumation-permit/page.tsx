"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useDialog } from "@/app/components/DialogProvider"

export default function ExhumationPermitRequest() {
  const { data: session } = useSession()
  const router = useRouter()
  const dialog = useDialog()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showGuide, setShowGuide] = useState(false)

  const [formData, setFormData] = useState({
    deceasedFirstName: "",
    deceasedMiddleName: "",
    deceasedLastName: "",
    deceasedSuffix: "",
    deceasedDateOfBirth: "",
    deceasedDateOfDeath: "",
    deceasedDateOfBurial: "",
    deceasedPlaceOfBurial: "",
    deceasedGender: "",
    requesterName: "",
    requesterRelation: "",
    requesterContactNumber: "",
    requesterAddress: "",
    reasonForExhumation: "",
    exhumationLetter: null as File | null,
    deathCertificate: null as File | null,
    validId: null as File | null,
  })

  // Validation helper functions
  const sanitizeText = (text: string) => {
    return text.replace(/<[^>]*>/g, '').trim()
  }

  const sanitizeName = (name: string) => {
    // Don't trim so users can type spaces naturally
    return name.replace(/[^a-zA-Z\s\-\.ñÑ]/g, '')
  }

  const validatePhoneNumber = (phone: string) => {
    return /^09\d{9}$/.test(phone)
  }

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.slice(0, 11)
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeName(e.target.value)
    setFormData({ ...formData, [e.target.name]: sanitized })
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setFormData({ ...formData, requesterContactNumber: formatted })
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const sanitized = sanitizeText(e.target.value)
    setFormData({ ...formData, [e.target.name]: sanitized })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
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
      // Validate phone number
      if (!validatePhoneNumber(formData.requesterContactNumber)) {
        setError("Phone number must be 11 digits starting with 09")
        setLoading(false)
        return
      }

      // Validate name fields
      const requiredNames = ['deceasedFirstName', 'deceasedLastName', 'requesterName']
      for (const field of requiredNames) {
        const value = formData[field as keyof typeof formData] as string
        const trimmedValue = value.trim()
        if (!trimmedValue) {
          setError(`${field.replace('Name', ' Name').replace('deceased', 'Deceased ').replace('requester', 'Requester').replace('First', 'First').replace('Last', 'Last')} is required`)
          setLoading(false)
          return
        }
        if (!/^[a-zA-Z\s\-\.\u00f1\u00d1]+$/.test(trimmedValue)) {
          setError(`${field.replace('Name', ' Name').replace('deceased', 'Deceased ').replace('requester', 'Requester')} contains invalid characters`)
          setLoading(false)
          return
        }
      }

      // Validate dates
      if (new Date(formData.deceasedDateOfBurial) < new Date(formData.deceasedDateOfDeath)) {
        setError("Date of burial cannot be before date of death")
        setLoading(false)
        return
      }

      const data = new FormData()
      
      // Send individual name fields
      data.append("deceasedFirstName", formData.deceasedFirstName.trim())
      data.append("deceasedMiddleName", formData.deceasedMiddleName.trim())
      data.append("deceasedLastName", formData.deceasedLastName.trim())
      data.append("deceasedSuffix", formData.deceasedSuffix.trim())
      data.append("deceasedDateOfBirth", formData.deceasedDateOfBirth)
      data.append("deceasedDateOfDeath", formData.deceasedDateOfDeath)
      data.append("deceasedDateOfBurial", formData.deceasedDateOfBurial)
      data.append("deceasedPlaceOfBurial", formData.deceasedPlaceOfBurial)
      data.append("deceasedGender", formData.deceasedGender)
      data.append("requesterName", formData.requesterName.trim())
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
        await dialog.success("Exhumation permit request submitted successfully!")
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/services/cemetery" className="text-sm text-green-100 hover:text-white mb-2 inline-block">
                ← Back to Cemetery Services
              </Link>
              <h1 className="text-3xl font-bold">Exhumation Permit Request</h1>
              <p className="text-green-100 mt-1">Apply for an exhumation permit online</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-100">Welcome</p>
              <p className="font-semibold">{session?.user?.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Fee Information */}
        <div className="bg-green-600 rounded-lg shadow-md p-6 text-white mb-8">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="deceasedFirstName"
                      value={formData.deceasedFirstName}
                      onChange={handleNameChange}
                      title="Only letters, spaces, hyphens, periods, and ñ allowed"
                      maxLength={50}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      name="deceasedMiddleName"
                      value={formData.deceasedMiddleName}
                      onChange={handleNameChange}
                      title="Only letters, spaces, hyphens, periods, and ñ allowed"
                      maxLength={50}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="deceasedLastName"
                      value={formData.deceasedLastName}
                      onChange={handleNameChange}
                      title="Only letters, spaces, hyphens, periods, and ñ allowed"
                      maxLength={50}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Suffix
                    </label>
                    <input
                      type="text"
                      name="deceasedSuffix"
                      value={formData.deceasedSuffix}
                      onChange={handleNameChange}
                      placeholder="Jr., Sr., III"
                      title="Only letters, spaces, hyphens, periods, and ñ allowed"
                      maxLength={20}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="deceasedDateOfBirth"
                      value={formData.deceasedDateOfBirth}
                      onChange={handleChange}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      name="deceasedGender"
                      value={formData.deceasedGender}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400"
                    >
                      <option value="">Select...</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>
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
                  max={new Date().toISOString().split('T')[0]}
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
                  max={new Date().toISOString().split('T')[0]}
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
                  onChange={handleTextChange}
                  placeholder="Cemetery name, block, lot number"
                  maxLength={200}
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
                  onChange={handleNameChange}
                  title="Only letters, spaces, hyphens, periods, and ñ allowed"
                  maxLength={100}
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
                  onChange={handleTextChange}
                  placeholder="e.g., Son, Daughter, Spouse"
                  maxLength={50}
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
                  onChange={handlePhoneChange}
                  placeholder="09XX-XXX-XXXX"
                  pattern="09[0-9]{9}"
                  maxLength={11}
                  title="Must be 11 digits starting with 09"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400"
                />
                {formData.requesterContactNumber && !validatePhoneNumber(formData.requesterContactNumber) && (
                  <p className="text-xs text-red-600 mt-1">Must be 11 digits starting with 09</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="requesterAddress"
                  value={formData.requesterAddress}
                  onChange={handleTextChange}
                  maxLength={200}
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
                  onChange={handleTextChange}
                  rows={3}
                  placeholder="Explain the purpose of exhumation (e.g., transfer to another location, family request)"
                  maxLength={500}
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-green-900 mb-3">📌 Important Notes</h3>
            <ul className="space-y-2 text-sm text-green-800">
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

      {/* Floating Help Button */}
      <button
        onClick={() => setShowGuide(!showGuide)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 group"
        aria-label="Help Guide"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Guide Modal */}
      {showGuide && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-green-600 text-white px-8 py-6 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-2xl font-bold">Exhumation Permit Guide</h2>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="text-white hover:bg-green-700 rounded-full p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-8 py-6">
              <p className="text-sm text-gray-600 mb-6 italic">For Citizen / Family / Authorized Representative</p>

              <ol className="space-y-4">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-2">Select "Exhumation Permit Request"</p>
                    <p className="text-sm text-gray-600">Fill out the exhumation permit application form</p>
                  </div>
                </li>

                <li className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-2">Upload Required Documents</p>
                    <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                        <li>Exhumation Letter (QC Health Department)</li>
                        <li>Certified Death Certificate</li>
                        <li>Valid ID</li>
                      </ul>
                    </div>
                  </div>
                </li>

                <li className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">Submit → Status: <span className="text-orange-600">Pending Review</span></p>
                    <p className="text-sm text-gray-600">Staff will verify your documents and application</p>
                  </div>
                </li>

                <li className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">Receive Order of Payment (<span className="text-green-600 font-bold">₱100</span>)</p>
                    <p className="text-sm text-gray-600">Fixed fee for exhumation permit</p>
                  </div>
                </li>

                <li className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">5</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">Upload Proof of Payment</p>
                    <p className="text-sm text-gray-600">Submit payment receipt or OR number</p>
                  </div>
                </li>

                <li className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">6</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">Status: <span className="text-green-600">"For Pickup"</span></p>
                    <p className="text-sm text-gray-600">Wait for notification when permit is ready</p>
                  </div>
                </li>

                <li className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">7</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">Claim Permit at Office</p>
                    <p className="text-sm text-gray-600">Visit Civil Registry to collect your exhumation permit</p>
                  </div>
                </li>
              </ol>

              {/* Important Notes */}
              <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h4 className="font-bold text-yellow-900 mb-2">Important Reminders</h4>
                    <ul className="space-y-1 text-sm text-yellow-800">
                      <li>• QC Health Department letter is mandatory</li>
                      <li>• Death certificate must be certified/authenticated</li>
                      <li>• Processing time may vary based on document completeness</li>
                      <li>• Track application status in "My Submissions"</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-100 px-8 py-4 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setShowGuide(false)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
