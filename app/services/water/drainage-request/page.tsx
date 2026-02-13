"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { useDialog } from "@/app/components/DialogProvider"

const sanitizeText = (text: string) => text.replace(/<[^>]*>/g, '')

export default function DrainageRequestPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [showGuide, setShowGuide] = useState(false)
  const dialog = useDialog()

  const [formData, setFormData] = useState({
    requesterName: "",
    contactNumber: "",
    street: "",
    barangay: "",
    exactLocation: "",
    issueType: "DECLOGGING",
    description: "",
    urgency: "NORMAL",
  })

  const [photos, setPhotos] = useState<{ photo1: File | null; photo2: File | null; photo3: File | null }>({
    photo1: null,
    photo2: null,
    photo3: null,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: sanitizeText(value) }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: "photo1" | "photo2" | "photo3") => {
    const file = e.target.files?.[0] || null
    if (file && file.size > 10 * 1024 * 1024) {
      setError("File size must be under 10MB")
      return
    }
    setPhotos(prev => ({ ...prev, [field]: file }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const data = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value) data.append(key, value)
      })
      if (photos.photo1) data.append("photo1", photos.photo1)
      if (photos.photo2) data.append("photo2", photos.photo2)
      if (photos.photo3) data.append("photo3", photos.photo3)

      const response = await fetch("/api/water/drainage-request", {
        method: "POST",
        body: data,
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to submit request")
        return
      }

      await dialog.success("Drainage request submitted successfully! You will receive status updates via notifications.")
      router.push("/services/water/user-dashboard")

    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-xl">Loading...</div></div>
  }

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  const issueTypes = [
    { value: "DECLOGGING", label: "Declogging" },
    { value: "DESILTING", label: "Desilting" },
    { value: "MANHOLE_REPAIR", label: "Manhole Repair" },
    { value: "GUTTER_MAINTENANCE", label: "Gutter Maintenance" },
    { value: "INLET_MAINTENANCE", label: "Inlet Maintenance" },
    { value: "FLOODING", label: "Flooding" },
    { value: "OTHER", label: "Other" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-cyan-600 text-white py-6 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/services/water/user-dashboard" className="text-sm text-cyan-100 hover:text-white mb-2 inline-block">
                ← Back to Water Services
              </Link>
              <h1 className="text-2xl font-bold">Drainage Concern / Request</h1>
              <p className="text-cyan-100 mt-1">Declogging, Desilting, Manhole/Gutter Repair</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-cyan-100">Logged in as</p>
              <p className="font-semibold">{session?.user?.name}</p>
              <p className="text-xs text-cyan-200 mt-1">No fees required</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Requester Information */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Requester Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input type="text" name="requesterName" value={formData.requesterName} onChange={handleInputChange} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number <span className="text-red-500">*</span></label>
                <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} required placeholder="09XX-XXX-XXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900" />
              </div>
            </div>
          </div>

          {/* Location Details */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Exact Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street <span className="text-red-500">*</span></label>
                <input type="text" name="street" value={formData.street} onChange={handleInputChange} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barangay <span className="text-red-500">*</span></label>
                <input type="text" name="barangay" value={formData.barangay} onChange={handleInputChange} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Location Details / Landmark</label>
                <input type="text" name="exactLocation" value={formData.exactLocation} onChange={handleInputChange}
                  placeholder="e.g., Near corner of Main St and 5th Ave"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900" />
              </div>
            </div>
          </div>

          {/* Request Details */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Request Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type of Issue <span className="text-red-500">*</span></label>
                <select name="issueType" value={formData.issueType} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900">
                  {issueTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgency Level</label>
                <select name="urgency" value={formData.urgency} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900">
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High (Flooding Risk)</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={4}
                  placeholder="Please describe the drainage issue in detail..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900" />
              </div>
            </div>
          </div>

          {/* Photos (Optional) */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Photos <span className="text-sm font-normal text-gray-500">(Optional)</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["photo1", "photo2", "photo3"].map((key, i) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Photo {i + 1}</label>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, key as any)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100" />
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Link href="/services/water/user-dashboard" className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">
              Cancel
            </Link>
            <button type="submit" disabled={isSubmitting}
              className="px-8 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>

      {/* Help Button */}
      <button
        onClick={() => setShowGuide(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-cyan-600 text-white rounded-full shadow-lg hover:bg-cyan-700 flex items-center justify-center text-2xl z-50"
      >?</button>

      {showGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Drainage Request Guide</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p><strong>What can you request?</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Declogging of drainage channels</li>
                <li>Desilting of waterways</li>
                <li>Manhole repairs</li>
                <li>Gutter and inlet maintenance</li>
                <li>Flooding prevention</li>
              </ul>
              <p><strong>Process:</strong></p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Submit your request with location details</li>
                <li>Engineering staff reviews and schedules inspection</li>
                <li>Site inspection is conducted</li>
                <li>Work is approved and scheduled</li>
                <li>Work team dispatched for repair/maintenance</li>
                <li>Request marked as completed</li>
              </ol>
              <p><strong>No fees are required</strong> for drainage service requests.</p>
            </div>
            <button onClick={() => setShowGuide(false)} className="mt-6 w-full py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
