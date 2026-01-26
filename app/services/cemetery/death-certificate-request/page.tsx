"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"

export default function DeathCertificateRequestPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    deceasedFullName: "",
    deceasedDateOfDeath: "",
    deceasedPlaceOfDeath: "",
    requesterName: "",
    requesterRelation: "",
    requesterContactNumber: "",
    requesterAddress: "",
    purpose: "",
    numberOfCopies: "1",
  })

  const [files, setFiles] = useState({
    validId: null as File | null,
    authorizationLetter: null as File | null,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (!files.validId) {
        setError("Please upload your valid ID")
        setIsLoading(false)
        return
      }

      const submitData = new FormData()
      
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value)
      })

      submitData.append("validId", files.validId)
      if (files.authorizationLetter) {
        submitData.append("authorizationLetter", files.authorizationLetter)
      }

      const response = await fetch("/api/cemetery/death-certificate-request", {
        method: "POST",
        body: submitData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request")
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
      <div className="bg-green-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/services/cemetery" className="text-sm text-green-100 hover:text-white mb-2 inline-block">
                ← Back to Cemetery Services
              </Link>
              <h1 className="text-3xl font-bold">Request Death Certificate</h1>
              <p className="text-green-100 mt-1">Apply for certified copy of death certificate</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-100">Welcome</p>
              <p className="font-semibold">{session?.user?.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Deceased Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name of Deceased *
                </label>
                <input
                  type="text"
                  required
                  value={formData.deceasedFullName}
                  onChange={(e) => setFormData({...formData, deceasedFullName: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Death *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.deceasedDateOfDeath}
                    onChange={(e) => setFormData({...formData, deceasedDateOfDeath: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Place of Death *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.deceasedPlaceOfDeath}
                    onChange={(e) => setFormData({...formData, deceasedPlaceOfDeath: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Requester Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.requesterName}
                    onChange={(e) => setFormData({...formData, requesterName: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship to Deceased *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.requesterRelation}
                    onChange={(e) => setFormData({...formData, requesterRelation: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                    placeholder="e.g., Spouse, Child, Sibling"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.requesterContactNumber}
                  onChange={(e) => setFormData({...formData, requesterContactNumber: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                  placeholder="09XXXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Complete Address *
                </label>
                <textarea
                  required
                  value={formData.requesterAddress}
                  onChange={(e) => setFormData({...formData, requesterAddress: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Request Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose of Request *
                </label>
                <input
                  type="text"
                  required
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                  placeholder="e.g., Insurance claim, Legal purposes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Copies *
                </label>
                <select
                  required
                  value={formData.numberOfCopies}
                  onChange={(e) => setFormData({...formData, numberOfCopies: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                >
                  {[1,2,3,4,5].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'copy' : 'copies'} - ₱{50 * n}.00</option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  First copy: ₱50.00, Additional copies: +₱50.00 each
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Pickup Method:</strong> Office Pickup Only<br/>
                  You will be notified when the certificate is ready for claim at the Civil Registry Office.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Required Documents</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid ID (Requester) *
                </label>
                <input
                  type="file"
                  required
                  accept="image/*,.pdf"
                  onChange={(e) => setFiles({...files, validId: e.target.files?.[0] || null})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Authorization Letter (if not next of kin)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFiles({...files, authorizationLetter: e.target.files?.[0] || null})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Required if you are not an immediate family member
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-lg"
            >
              {isLoading ? "Submitting..." : "Submit Request"}
            </button>
            <Link
              href="/services/cemetery"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-lg text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
