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
  const [showGuide, setShowGuide] = useState(false)
  
  const [formData, setFormData] = useState({
    deceasedFirstName: "",
    deceasedMiddleName: "",
    deceasedLastName: "",
    deceasedSuffix: "",
    deceasedDateOfBirth: "",
    deceasedDateOfDeath: "",
    deceasedGender: "",
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
    setFormData({ ...formData, [e.target.name === 'funeralHomeContact' ? 'funeralHomeContact' : 'requesterContactNumber']: formatted })
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const sanitized = sanitizeText(e.target.value)
    setFormData({ ...formData, [e.target.name]: sanitized })
  }

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

      // Validate phone numbers
      if (!validatePhoneNumber(formData.requesterContactNumber)) {
        setError("Requester phone number must be 11 digits starting with 09")
        setIsLoading(false)
        return
      }

      if (formData.funeralHomeContact && !validatePhoneNumber(formData.funeralHomeContact)) {
        setError("Funeral home contact must be 11 digits starting with 09")
        setIsLoading(false)
        return
      }

      // Validate name fields
      const requiredNames = ['deceasedFirstName', 'deceasedLastName', 'requesterName']
      for (const field of requiredNames) {
        const value = formData[field as keyof typeof formData] as string
        const trimmedValue = value.trim()
        if (!trimmedValue) {
          setError(`${field.replace('Name', ' Name').replace('deceased', 'Deceased ').replace('requester', 'Requester').replace('First', 'First').replace('Last', 'Last')} is required`)
          setIsLoading(false)
          return
        }
        if (!/^[a-zA-Z\s\-\.\u00f1\u00d1]+$/.test(trimmedValue)) {
          setError(`${field.replace('Name', ' Name').replace('deceased', 'Deceased ').replace('requester', 'Requester')} contains invalid characters`)
          setIsLoading(false)
          return
        }
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      name="deceasedFirstName"
                      value={formData.deceasedFirstName}
                      onChange={handleNameChange}
                      title="Only letters, spaces, hyphens, periods, and ñ allowed"
                      maxLength={50}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      name="deceasedMiddleName"
                      value={formData.deceasedMiddleName}
                      onChange={handleNameChange}
                      title="Only letters, spaces, hyphens, periods, and ñ allowed"
                      maxLength={50}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      name="deceasedLastName"
                      value={formData.deceasedLastName}
                      onChange={handleNameChange}
                      title="Only letters, spaces, hyphens, periods, and ñ allowed"
                      maxLength={50}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="deceasedDateOfBirth"
                      value={formData.deceasedDateOfBirth}
                      onChange={(e) => setFormData({ ...formData, deceasedDateOfBirth: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      name="deceasedGender"
                      value={formData.deceasedGender}
                      onChange={(e) => setFormData({ ...formData, deceasedGender: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">Select...</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
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
                    max={new Date().toISOString().split('T')[0]}
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
                    name="requesterName"
                    value={formData.requesterName}
                    onChange={handleNameChange}
                    title="Only letters, spaces, hyphens, periods, and ñ allowed"
                    maxLength={100}
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
                    onChange={handleTextChange}
                    maxLength={50}
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
                    onChange={handlePhoneChange}
                    pattern="09[0-9]{9}"
                    maxLength={11}
                    title="Must be 11 digits starting with 09"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="09XXXXXXXXX"
                  />
                  {formData.requesterContactNumber && !validatePhoneNumber(formData.requesterContactNumber) && (
                    <p className="text-xs text-red-600 mt-1">Must be 11 digits starting with 09</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Complete Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={formData.requesterAddress}
                    onChange={handleTextChange}
                    maxLength={200}
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
                    onChange={handleTextChange}
                    maxLength={100}
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
                    onChange={handlePhoneChange}
                    pattern="09[0-9]{9}"
                    maxLength={11}
                    title="Must be 11 digits starting with 09"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="09XXXXXXXXX"
                  />
                  {formData.funeralHomeContact && !validatePhoneNumber(formData.funeralHomeContact) && (
                    <p className="text-xs text-red-600 mt-1">Must be 11 digits starting with 09</p>
                  )}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                </svg>
                <h2 className="text-2xl font-bold">Cremation Permit Guide</h2>
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
              <p className="text-sm text-gray-600 mb-6 italic">For Citizen / Family / Funeral Home</p>

              <ol className="space-y-4">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-2">Select "Cremation Permit Request"</p>
                    <p className="text-sm text-gray-600">Fill out the cremation permit application form</p>
                  </div>
                </li>

                <li className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-2">Upload Required Documents</p>
                    <div className="bg-red-50 rounded-lg p-4 space-y-2">
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                        <li>Death Certificate</li>
                        <li>Cremation Form (QCHD)</li>
                        <li>Transfer/Entrance Permit (if applicable)</li>
                        <li>Valid ID</li>
                      </ul>
                    </div>
                  </div>
                </li>

                <li className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">Submit → Status: <span className="text-orange-600">Pending</span></p>
                    <p className="text-sm text-gray-600">Wait for document verification</p>
                  </div>
                </li>

                <li className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">Receive Payment Order</p>
                    <div className="bg-green-50 rounded-lg p-3 mt-2">
                      <p className="text-sm font-semibold text-gray-800">Fee Range: <span className="text-green-600">₱100 – ₱200</span></p>
                      <p className="text-xs text-gray-600 mt-1">Fee depends on specific case requirements</p>
                    </div>
                  </div>
                </li>

                <li className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">5</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">Submit Proof/OR</p>
                    <p className="text-sm text-gray-600">Upload payment proof or Official Receipt number</p>
                  </div>
                </li>

                <li className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">6</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">Status: <span className="text-green-600">"For Pickup"</span></p>
                    <p className="text-sm text-gray-600">You will be notified when ready</p>
                  </div>
                </li>

                <li className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">7</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">Claim Hardcopy Permit</p>
                    <p className="text-sm text-gray-600">Visit office to collect your cremation permit</p>
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
                      <li>• QCHD cremation form is mandatory</li>
                      <li>• Transfer permit needed if deceased from another city</li>
                      <li>• All documents must be clear and readable</li>
                      <li>• Track your application in "My Submissions"</li>
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
