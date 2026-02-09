"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function BurialPermitRequest() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showGuide, setShowGuide] = useState(false)
  
  const [burialType, setBurialType] = useState<"BURIAL" | "ENTRANCE" | "NICHE">("BURIAL")
  const [nicheType, setNicheType] = useState<"CHILD" | "ADULT">("ADULT")
  const [isFromAnotherLGU, setIsFromAnotherLGU] = useState(false)
  const [cemeteryLocation, setCemeteryLocation] = useState("")
  
  const [formData, setFormData] = useState({
    deceasedName: "",
    deceasedDateOfDeath: "",
    requesterName: "",
    requesterRelation: "",
    requesterContactNumber: "",
    requesterAddress: "",
    deathCertificate: null as File | null,
    transferPermit: null as File | null,
    affidavitOfUndertaking: null as File | null,
    burialForm: null as File | null,
    validId: null as File | null,
  })

  // Validation helper functions
  const sanitizeText = (text: string) => {
    return text.replace(/<[^>]*>/g, '').trim()
  }

  const sanitizeName = (name: string) => {
    return name.replace(/[^a-zA-Z\s\-\.ñÑ]/g, '').trim()
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

  const calculateFee = () => {
    let base = 100 // Burial or Entrance permit base
    if (burialType === "NICHE") {
      const nicheFee = nicheType === "CHILD" ? 750 : 1500
      return base + nicheFee
    }
    return base
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0] || null
    setFormData({ ...formData, [field]: file })
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
      const nameFields = ['deceasedName', 'requesterName']
      for (const field of nameFields) {
        const value = formData[field as keyof typeof formData] as string
        if (!/^[a-zA-Z\s\-\.ñÑ]+$/.test(value)) {
          setError(`${field.replace('Name', ' Name')} contains invalid characters`)
          setLoading(false)
          return
        }
      }

      const data = new FormData()
      
      // Text fields
      data.append("deceasedName", formData.deceasedName)
      data.append("deceasedDateOfDeath", formData.deceasedDateOfDeath)
      data.append("requesterName", formData.requesterName)
      data.append("requesterRelation", formData.requesterRelation)
      data.append("requesterContactNumber", formData.requesterContactNumber)
      data.append("requesterAddress", formData.requesterAddress)
      data.append("burialType", burialType)
      data.append("isFromAnotherLGU", String(isFromAnotherLGU))
      data.append("cemeteryLocation", cemeteryLocation)
      
      if (burialType === "NICHE") {
        data.append("nicheType", nicheType)
      }

      // Required files
      if (formData.deathCertificate) data.append("deathCertificate", formData.deathCertificate)
      if (formData.burialForm) data.append("burialForm", formData.burialForm)
      if (formData.validId) data.append("validId", formData.validId)
      
      // Conditional files
      if (isFromAnotherLGU && formData.transferPermit) {
        data.append("transferPermit", formData.transferPermit)
      }
      if ((cemeteryLocation === "BAGBAG" || cemeteryLocation === "NOVALICHES") && formData.affidavitOfUndertaking) {
        data.append("affidavitOfUndertaking", formData.affidavitOfUndertaking)
      }

      const response = await fetch("/api/cemetery/burial-permit", {
        method: "POST",
        body: data
      })

      const result = await response.json()

      if (response.ok) {
        alert("Burial permit request submitted successfully!")
        router.push("/services/cemetery/user-dashboard")
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
      <p>Please log in to submit a burial permit request.</p>
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
              <h1 className="text-3xl font-bold">Burial Permit Request</h1>
              <p className="text-green-100 mt-1">Apply for a burial permit online</p>
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

          {/* Burial Type Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select Permit Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                onClick={() => setBurialType("BURIAL")}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  burialType === "BURIAL" 
                    ? "border-blue-600 bg-blue-50" 
                    : "border-gray-300 hover:border-blue-300"
                }`}
              >
                <input
                  type="radio"
                  checked={burialType === "BURIAL"}
                  onChange={() => setBurialType("BURIAL")}
                  className="mb-2"
                />
                <h3 className="font-bold text-gray-900">Burial Permit</h3>
                <p className="text-2xl font-bold text-blue-600">₱100.00</p>
                <p className="text-xs text-gray-500 mt-1">Regular burial</p>
              </div>

              <div 
                onClick={() => setBurialType("ENTRANCE")}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  burialType === "ENTRANCE" 
                    ? "border-green-600 bg-green-50" 
                    : "border-gray-300 hover:border-green-300"
                }`}
              >
                <input
                  type="radio"
                  checked={burialType === "ENTRANCE"}
                  onChange={() => setBurialType("ENTRANCE")}
                  className="mb-2"
                />
                <h3 className="font-bold text-gray-900">Entrance Permit</h3>
                <p className="text-2xl font-bold text-green-600">₱100.00</p>
                <p className="text-xs text-gray-500 mt-1">From another LGU</p>
              </div>

              <div 
                onClick={() => setBurialType("NICHE")}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  burialType === "NICHE" 
                    ? "border-purple-600 bg-purple-50" 
                    : "border-gray-300 hover:border-purple-300"
                }`}
              >
                <input
                  type="radio"
                  checked={burialType === "NICHE"}
                  onChange={() => setBurialType("NICHE")}
                  className="mb-2"
                />
                <h3 className="font-bold text-gray-900">Niche/Columbarium</h3>
                <p className="text-2xl font-bold text-purple-600">₱{calculateFee()}.00</p>
                <p className="text-xs text-gray-500 mt-1">₱100 + niche fee</p>
              </div>
            </div>

            {burialType === "NICHE" && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">Niche Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={nicheType === "CHILD"}
                      onChange={() => setNicheType("CHILD")}
                      className="mr-2"
                    />
                    <span className="text-sm">Child (₱750)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={nicheType === "ADULT"}
                      onChange={() => setNicheType("ADULT")}
                      className="mr-2"
                    />
                    <span className="text-sm">Adult (₱1,500)</span>
                  </label>
                </div>
              </div>
            )}

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-lg font-bold text-gray-900">Total Fee: ₱{calculateFee()}.00</p>
            </div>
          </div>

          {/* Deceased Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Deceased Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name of Deceased <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="deceasedName"
                  required
                  value={formData.deceasedName}
                  onChange={handleNameChange}
                  pattern="[a-zA-Z\s\-\.ñÑ]+"
                  title="Only letters, spaces, hyphens, periods, and ñ allowed"
                  maxLength={100}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="requesterName"
                  required
                  value={formData.requesterName}
                  onChange={handleNameChange}
                  pattern="[a-zA-Z\s\-\.ñÑ]+"
                  title="Only letters, spaces, hyphens, periods, and ñ allowed"
                  maxLength={100}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relation to Deceased <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="requesterRelation"
                  required
                  value={formData.requesterRelation}
                  onChange={handleTextChange}
                  maxLength={50}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="e.g., Spouse, Child, Funeral Home Representative"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="requesterContactNumber"
                  required
                  value={formData.requesterContactNumber}
                  onChange={handlePhoneChange}
                  pattern="09[0-9]{9}"
                  maxLength={11}
                  title="Must be 11 digits starting with 09"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="09XXXXXXXXX"
                />
                {formData.requesterContactNumber && !validatePhoneNumber(formData.requesterContactNumber) && (
                  <p className="text-xs text-red-600 mt-1">Must be 11 digits starting with 09</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complete Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="requesterAddress"
                  required
                  value={formData.requesterAddress}
                  onChange={handleTextChange}
                  maxLength={200}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Burial Location */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Burial Details</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cemetery Location <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={cemeteryLocation}
                onChange={(e) => setCemeteryLocation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="">Select cemetery location</option>
                <option value="BAGBAG">Bagbag Public Cemetery</option>
                <option value="NOVALICHES">Novaliches Public Cemetery</option>
                <option value="OTHER">Other Cemetery</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={isFromAnotherLGU}
                onChange={(e) => setIsFromAnotherLGU(e.target.checked)}
                className="mr-2"
              />
              <label className="text-sm text-gray-700">
                Deceased is from another LGU (requires Transfer/Entrance Permit)
              </label>
            </div>
          </div>

          {/* Document Upload */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Required Documents</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certified Copy of Death Certificate <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => handleFileChange(e, 'deathCertificate')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">PSA or Local Civil Registry copy</p>
              </div>

              {isFromAnotherLGU && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transfer/Entrance Permit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    required={isFromAnotherLGU}
                    onChange={(e) => handleFileChange(e, 'transferPermit')}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">From originating LGU</p>
                </div>
              )}

              {(cemeteryLocation === "BAGBAG" || cemeteryLocation === "NOVALICHES") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Affidavit of Undertaking <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    required={cemeteryLocation === "BAGBAG" || cemeteryLocation === "NOVALICHES"}
                    onChange={(e) => handleFileChange(e, 'affidavitOfUndertaking')}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">Notarized affidavit for Bagbag/Novaliches cemetery</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Burial Form (QCHD) <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => handleFileChange(e, 'burialForm')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Quezon City Health Department form</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valid ID of Requester <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => handleFileChange(e, 'validId')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-2xl font-bold">Burial Permit Request Guide</h2>
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
                    <p className="font-semibold text-gray-900 mb-2">Select "Burial Permit Request"</p>
                    <p className="text-sm text-gray-600">Choose the appropriate permit type (Burial, Entrance, or Niche)</p>
                  </div>
                </li>

                <li className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-2">Upload Required Documents</p>
                    <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                        <li>Certified Copy of Death Certificate</li>
                        <li>Transfer/Entrance Permit (if from another LGU)</li>
                        <li>Affidavit of Undertaking (if Bagbag/Novaliches)</li>
                        <li>Burial Form (QCHD)</li>
                        <li>Valid ID</li>
                      </ul>
                    </div>
                  </div>
                </li>

                <li className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">Submit → Status: <span className="text-orange-600">Pending Review</span></p>
                    <p className="text-sm text-gray-600">Civil Registry staff will review your documents</p>
                  </div>
                </li>

                <li className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">Receive Order of Payment</p>
                    <div className="bg-green-50 rounded-lg p-3 mt-2">
                      <p className="text-sm font-semibold text-gray-800">Fee Range: <span className="text-green-600">₱100 – ₱1,500</span></p>
                      <ul className="text-xs text-gray-600 mt-2 space-y-1">
                        <li>• Burial/Entrance: ₱100</li>
                        <li>• Niche (Child): ₱850 (₱100 + ₱750)</li>
                        <li>• Niche (Adult): ₱1,600 (₱100 + ₱1,500)</li>
                      </ul>
                    </div>
                  </div>
                </li>

                <li className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">5</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">Upload Proof of Payment / OR Number</p>
                    <p className="text-sm text-gray-600">Submit payment receipt or Official Receipt number</p>
                  </div>
                </li>

                <li className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">6</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">Wait for Status Update → <span className="text-green-600">"For Pickup"</span></p>
                    <p className="text-sm text-gray-600">You will be notified when ready</p>
                  </div>
                </li>

                <li className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">7</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">Claim Physical Burial Permit</p>
                    <p className="text-sm text-gray-600">Visit the office to collect your permit (serves as OR)</p>
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
                      <li>• Ensure death certificate is certified/authenticated</li>
                      <li>• Transfer permit required if deceased is from another city</li>
                      <li>• Affidavit needed for Bagbag/Novaliches residents</li>
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
