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
    
    // Files
    municipalForm103: null as File | null,
    informantValidId: null as File | null,
    swabTestResult: null as File | null,
  })

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
    setLoading(true)

    try {
      // Create FormData for file upload
      const submitData = new FormData()
      
      // Add text fields
      Object.keys(formData).forEach(key => {
        if (key !== 'municipalForm103' && key !== 'informantValidId' && key !== 'swabTestResult') {
          submitData.append(key, formData[key as keyof typeof formData] as string)
        }
      })
      
      // Add files
      if (formData.municipalForm103) submitData.append('municipalForm103', formData.municipalForm103)
      if (formData.informantValidId) submitData.append('informantValidId', formData.informantValidId)
      if (formData.swabTestResult) submitData.append('swabTestResult', formData.swabTestResult)

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/services/cemetery" className="text-green-600 hover:text-green-700 text-sm font-medium">
            ← Back to Cemetery Services
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Death Registration Application</h1>
          <p className="text-gray-600 mt-2">Submit your death registration form online</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

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
                  onChange={(e) => setFormData({ ...formData, deceasedFirstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Middle Name
                </label>
                <input
                  type="text"
                  value={formData.deceasedMiddleName}
                  onChange={(e) => setFormData({ ...formData, deceasedMiddleName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
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
                  onChange={(e) => setFormData({ ...formData, deceasedLastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
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
                  onChange={(e) => setFormData({ ...formData, deceasedPlaceOfDeath: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
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
                onChange={(e) => setFormData({ ...formData, deceasedCauseOfDeath: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
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
                  onChange={(e) => setFormData({ ...formData, informantName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
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
                  onChange={(e) => setFormData({ ...formData, informantRelation: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
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
                  onChange={(e) => setFormData({ ...formData, informantContactNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  placeholder="09XXXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complete Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.informantAddress}
                  onChange={(e) => setFormData({ ...formData, informantAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Required Documents</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Municipal Form 103 (Death Certificate) <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => handleFileChange(e, 'municipalForm103')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Accepted formats: PDF, JPG, PNG (Max 5MB)</p>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Any government-issued ID</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Swab Test Result (if Covid-related)
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, 'swabTestResult')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Optional - only if cause of death is Covid-19 related</p>
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
    </div>
  )
}
