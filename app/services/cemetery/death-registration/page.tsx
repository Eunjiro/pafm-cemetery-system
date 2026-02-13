"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"

export default function DeathRegistrationForm() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [registrationType, setRegistrationType] = useState<"REGULAR" | "DELAYED">("REGULAR")
  const [showGuide, setShowGuide] = useState(false)
  
  const [formData, setFormData] = useState({
    // Deceased Details
    deceasedFirstName: "",
    deceasedMiddleName: "",
    deceasedLastName: "",
    deceasedDateOfBirth: "",
    deceasedDateOfDeath: "",
    deceasedPlaceOfDeath: "",
    deceasedCauseOfDeath: "",
    deceasedGender: "MALE",
    
    // Informant Details
    informantName: "",
    informantRelation: "",
    informantContactNumber: "",
    informantAddress: "",
    
    // Regular Files
    municipalForm103: null as File | null,
    informantValidId: null as File | null,
    swabTestResult: null as File | null,
    
    // Delayed Registration Files
    affidavitOfDelayed: null as File | null,
    burialCertificate: null as File | null,
    funeralCertificate: null as File | null,
    psaNoRecord: null as File | null,
  })

  // Validation helper functions
  const sanitizeText = (text: string) => {
    // Remove any HTML tags and trim whitespace
    return text.replace(/<[^>]*>/g, '').trim()
  }

  const sanitizeName = (name: string) => {
    // Only allow letters, spaces, hyphens, and common name characters
    // Don't trim so users can type spaces naturally
    return name.replace(/[^a-zA-Z\s\-\.ñÑ]/g, '')
  }

  const validatePhoneNumber = (phone: string) => {
    // Philippine mobile format: 09XXXXXXXXX (11 digits)
    const phoneRegex = /^09\d{9}$/
    return phoneRegex.test(phone)
  }

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '')
    // Limit to 11 digits and ensure it starts with 09
    if (numbers.length === 0) return ''
    if (numbers[0] !== '0') return '0' + numbers.slice(0, 10)
    if (numbers.length > 1 && numbers[1] !== '9') return '09' + numbers.slice(2, 11)
    return numbers.slice(0, 11)
  }

  const handleNameChange = (field: string, value: string) => {
    const sanitized = sanitizeName(value)
    setFormData({ ...formData, [field]: sanitized })
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value)
    setFormData({ ...formData, informantContactNumber: formatted })
  }

  const handleTextChange = (field: string, value: string) => {
    const sanitized = sanitizeText(value)
    setFormData({ ...formData, [field]: sanitized })
  }

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session) {
    router.push("/login")
    return null
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0] || null
    setFormData({ ...formData, [fieldName]: file })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Validate phone number
    if (!validatePhoneNumber(formData.informantContactNumber)) {
      setError("Invalid phone number format. Please use format: 09XXXXXXXXX (11 digits)")
      setLoading(false)
      return
    }

    // Validate dates
    const birthDate = new Date(formData.deceasedDateOfBirth)
    const deathDate = new Date(formData.deceasedDateOfDeath)
    if (deathDate < birthDate) {
      setError("Date of death cannot be before date of birth")
      setLoading(false)
      return
    }

    // Validate names (no special characters except ñ, -, .)
    const nameFields = [
      { value: formData.deceasedFirstName.trim(), label: "First Name" },
      { value: formData.deceasedLastName.trim(), label: "Last Name" },
      { value: formData.informantName.trim(), label: "Informant Name" }
    ]
    
    for (const field of nameFields) {
      if (!field.value) {
        setError(`${field.label} cannot be empty`)
        setLoading(false)
        return
      }
      if (field.value && !/^[a-zA-Z\s\-\.ñÑ]+$/.test(field.value)) {
        setError(`${field.label} contains invalid characters`)
        setLoading(false)
        return
      }
    }

    setLoading(true)

    try {
      // Create FormData for file upload
      const submitData = new FormData()
      
      // Add registration type
      submitData.append('registrationType', registrationType)
      
      // Add text fields
      Object.keys(formData).forEach(key => {
        const fileKeys = ['municipalForm103', 'informantValidId', 'swabTestResult', 
                         'affidavitOfDelayed', 'burialCertificate', 'funeralCertificate', 'psaNoRecord']
        if (!fileKeys.includes(key)) {
          const value = formData[key as keyof typeof formData] as string
          // Trim name fields to remove leading/trailing spaces
          const nameKeys = ['deceasedFirstName', 'deceasedMiddleName', 'deceasedLastName', 'informantName']
          const finalValue = nameKeys.includes(key) && typeof value === 'string' ? value.trim() : value
          submitData.append(key, finalValue)
        }
      })
      
      // Add required files based on registration type
      if (formData.municipalForm103) submitData.append('municipalForm103', formData.municipalForm103)
      if (formData.informantValidId) submitData.append('informantValidId', formData.informantValidId)
      if (formData.swabTestResult) submitData.append('swabTestResult', formData.swabTestResult)
      
      // Add delayed registration files
      if (registrationType === 'DELAYED') {
        if (formData.affidavitOfDelayed) submitData.append('affidavitOfDelayed', formData.affidavitOfDelayed)
        if (formData.burialCertificate) submitData.append('burialCertificate', formData.burialCertificate)
        if (formData.funeralCertificate) submitData.append('funeralCertificate', formData.funeralCertificate)
        if (formData.psaNoRecord) submitData.append('psaNoRecord', formData.psaNoRecord)
      }

      const response = await fetch("/api/cemetery/death-registration", {
        method: "POST",
        body: submitData
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Submission failed")
        setLoading(false)
        return
      }

      router.push("/services/cemetery/my-submissions?success=true")
    } catch (err) {
      setError("An error occurred. Please try again.")
      setLoading(false)
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
              <h1 className="text-3xl font-bold">Death Registration Application</h1>
              <p className="text-green-100 mt-1">Submit your death registration form online</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-100">Welcome</p>
              <p className="font-semibold">{session?.user?.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Registration Type Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select Registration Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                onClick={() => setRegistrationType("REGULAR")}
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  registrationType === "REGULAR" 
                    ? "border-green-600 bg-green-50" 
                    : "border-gray-300 hover:border-green-300"
                }`}
              >
                <div className="flex items-center mb-2">
                  <input
                    type="radio"
                    checked={registrationType === "REGULAR"}
                    onChange={() => setRegistrationType("REGULAR")}
                    className="mr-3"
                  />
                  <h3 className="text-lg font-bold text-gray-900">Regular Registration</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">For deaths registered within 30 days</p>
                <p className="text-2xl font-bold text-green-600">₱50.00</p>
                <p className="text-xs text-gray-500 mt-2">Processing: 3-5 business days</p>
              </div>

              <div 
                onClick={() => setRegistrationType("DELAYED")}
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  registrationType === "DELAYED" 
                    ? "border-orange-600 bg-orange-50" 
                    : "border-gray-300 hover:border-orange-300"
                }`}
              >
                <div className="flex items-center mb-2">
                  <input
                    type="radio"
                    checked={registrationType === "DELAYED"}
                    onChange={() => setRegistrationType("DELAYED")}
                    className="mr-3"
                  />
                  <h3 className="text-lg font-bold text-gray-900">Delayed Registration</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">For deaths registered after 30 days</p>
                <p className="text-2xl font-bold text-orange-600">₱150.00</p>
                <p className="text-xs text-gray-500 mt-2">Processing: 11 working days</p>
              </div>
            </div>
          </div>

          {/* Deceased Details Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Deceased Person Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.deceasedFirstName}
                  onChange={(e) => handleNameChange('deceasedFirstName', e.target.value)}
                  title="Only letters, spaces, hyphens, and periods are allowed"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Middle Name
                </label>
                <input
                  type="text"
                  value={formData.deceasedMiddleName}
                  onChange={(e) => handleNameChange('deceasedMiddleName', e.target.value)}
                  title="Only letters, spaces, hyphens, and periods are allowed"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.deceasedLastName}
                  onChange={(e) => handleNameChange('deceasedLastName', e.target.value)}
                  title="Only letters, spaces, hyphens, and periods are allowed"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.deceasedDateOfBirth}
                  onChange={(e) => setFormData({ ...formData, deceasedDateOfBirth: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Death <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.deceasedDateOfDeath}
                  onChange={(e) => setFormData({ ...formData, deceasedDateOfDeath: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.deceasedGender}
                  onChange={(e) => setFormData({ ...formData, deceasedGender: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Place of Death <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.deceasedPlaceOfDeath}
                  onChange={(e) => handleTextChange('deceasedPlaceOfDeath', e.target.value)}
                  maxLength={200}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  placeholder="Hospital, Address, etc."
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cause of Death <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.deceasedCauseOfDeath}
                onChange={(e) => handleTextChange('deceasedCauseOfDeath', e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                placeholder="As stated in death certificate..."
              />
            </div>
          </div>

          {/* Informant Details Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Informant Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.informantName}
                  onChange={(e) => handleNameChange('informantName', e.target.value)}

                  title="Only letters, spaces, hyphens, and periods are allowed"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relation to Deceased <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.informantRelation}
                  onChange={(e) => handleTextChange('informantRelation', e.target.value)}
                  maxLength={50}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g., Spouse, Child, Sibling"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.informantContactNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  pattern="09[0-9]{9}"
                  maxLength={11}
                  title="Please enter a valid Philippine mobile number (09XXXXXXXXX)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  placeholder="09XXXXXXXXX"
                />
                {formData.informantContactNumber && !validatePhoneNumber(formData.informantContactNumber) && (
                  <p className="text-xs text-red-600 mt-1">Must be 11 digits starting with 09</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complete Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.informantAddress}
                  onChange={(e) => handleTextChange('informantAddress', e.target.value)}
                  maxLength={200}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Required Documents {registrationType === "DELAYED" && <span className="text-orange-600">(Delayed Registration)</span>}
            </h2>
            
            <div className="space-y-4">
              {/* Common for both types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Municipal Form 103 (Death Certificate) <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => handleFileChange(e, 'municipalForm103')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">Accepted formats: PDF, JPG, PNG (Max 5MB)</p>
              </div>

              {/* Delayed Registration Additional Documents */}
              {registrationType === "DELAYED" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Affidavit of Delayed Registration <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      required
                      onChange={(e) => handleFileChange(e, 'affidavitOfDelayed')}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    />
                    <p className="text-xs text-gray-500 mt-1">Notarized affidavit explaining reason for delay</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Burial or Cremation Certificate <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      required
                      onChange={(e) => handleFileChange(e, 'burialCertificate')}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    />
                    <p className="text-xs text-gray-500 mt-1">From cemetery or crematorium</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Funeral Service Certificate <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      required
                      onChange={(e) => handleFileChange(e, 'funeralCertificate')}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    />
                    <p className="text-xs text-gray-500 mt-1">From funeral service provider</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PSA Certificate of No Record <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      required
                      onChange={(e) => handleFileChange(e, 'psaNoRecord')}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    />
                    <p className="text-xs text-gray-500 mt-1">Proof that death was not previously registered with PSA</p>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Swab Test Result {registrationType === "DELAYED" ? "(if applicable)" : "(if Covid-related)"}
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, 'swabTestResult')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">Optional - only if cause of death is Covid-19 related</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valid ID of Informant <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => handleFileChange(e, 'informantValidId')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">Any government-issued ID</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between">
            <Link
              href="/services/cemetery"
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Submitting..." : "Submit Application"}
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
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-green-600 text-white px-8 py-6 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h2 className="text-2xl font-bold">Death Registration Guide</h2>
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
              
              {/* Regular Death Registration */}
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600">A</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Regular Death Registration</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4 italic">For Citizen / Funeral Home / Relative</p>

                <ol className="space-y-4">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-2">Submit Online Death Registration</p>
                      <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                        <p className="font-medium text-gray-800">Upload Required Documents:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                          <li>Municipal Form 103 (Death Certificate Form)</li>
                          <li>Valid ID of informant</li>
                          <li>Swab Test Result (if Covid-related)</li>
                        </ul>
                        <p className="font-medium text-gray-800 mt-3">Fill Required Information:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                          <li>Deceased Details (Name, Date of Birth, Date of Death, etc.)</li>
                          <li>Informant Details (Name, Relationship, Contact)</li>
                        </ul>
                      </div>
                    </div>
                  </li>

                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">Submit → Status: <span className="text-orange-600">Pending Verification</span></p>
                      <p className="text-sm text-gray-600">Wait for Civil Registry staff to review your submission</p>
                    </div>
                  </li>

                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">Receive Order of Payment (<span className="text-green-600 font-bold">₱50</span>)</p>
                      <p className="text-sm text-gray-600">You will receive the order of payment via notification</p>
                    </div>
                  </li>

                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">Upload Proof of Payment / Enter OR Number</p>
                      <p className="text-sm text-gray-600">Pay the registration fee and submit your payment proof</p>
                    </div>
                  </li>

                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">5</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">Wait for Status Update → <span className="text-green-600">"For Pickup"</span></p>
                      <p className="text-sm text-gray-600">Processing time: 1-3 working days</p>
                    </div>
                  </li>

                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">6</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">Pickup Physical Copy at Civil Registry Office</p>
                      <p className="text-sm text-gray-600">Bring valid ID for verification</p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Divider */}
              <div className="border-t-2 border-gray-200 my-8"></div>

              {/* Delayed Death Registration */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-purple-600">B</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Delayed Death Registration</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4 italic">For Citizen (Death occurred more than 30 days ago)</p>

                <ol className="space-y-4">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-2">Select "Delayed Registration"</p>
                      <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                        <p className="font-medium text-gray-800">Upload All Required Documents:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                          <li>Municipal Form 103</li>
                          <li>Affidavit of Delayed Registration</li>
                          <li>Burial/Cremation Certificate</li>
                          <li>Funeral Service Certificate</li>
                          <li>PSA Certificate of No Record</li>
                          <li>Swab result (if needed)</li>
                          <li>Valid ID of informant</li>
                        </ul>
                      </div>
                    </div>
                  </li>

                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">Submit → Status: <span className="text-orange-600">Pending Review</span></p>
                      <p className="text-sm text-gray-600">Staff will review all submitted documents carefully</p>
                    </div>
                  </li>

                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">Receive Order of Payment (<span className="text-green-600 font-bold">₱150</span>)</p>
                      <p className="text-sm text-gray-600">Higher fee for delayed registration processing</p>
                    </div>
                  </li>

                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">Upload Proof of Payment</p>
                      <p className="text-sm text-gray-600">Submit payment receipt or OR number</p>
                    </div>
                  </li>

                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">5</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">Status: <span className="text-blue-600">For Processing</span></p>
                      <p className="text-sm text-gray-600 font-semibold">Processing time: 11 working days</p>
                    </div>
                  </li>

                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">6</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">After Approval → Status: <span className="text-green-600">"For Pickup"</span></p>
                      <p className="text-sm text-gray-600">You will be notified when ready</p>
                    </div>
                  </li>

                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">7</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">Claim Physical Copy at Civil Registry Office</p>
                      <p className="text-sm text-gray-600">Bring valid ID for verification</p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Important Notes */}
              <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h4 className="font-bold text-yellow-900 mb-2">Important Reminders</h4>
                    <ul className="space-y-1 text-sm text-yellow-800">
                      <li>• All documents must be clear and readable (PDF, JPG, or PNG)</li>
                      <li>• Maximum file size: 5MB per document</li>
                      <li>• Track your application status in "My Submissions"</li>
                      <li>• Keep your contact number updated for notifications</li>
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
