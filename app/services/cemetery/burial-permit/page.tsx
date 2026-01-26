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
                  required
                  value={formData.deceasedName}
                  onChange={(e) => setFormData({ ...formData, deceasedName: e.target.value })}
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
                  required
                  value={formData.requesterName}
                  onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relation to Deceased <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.requesterRelation}
                  onChange={(e) => setFormData({ ...formData, requesterRelation: e.target.value })}
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
                  required
                  value={formData.requesterContactNumber}
                  onChange={(e) => setFormData({ ...formData, requesterContactNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                  value={formData.requesterAddress}
                  onChange={(e) => setFormData({ ...formData, requesterAddress: e.target.value })}
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
    </div>
  )
}
