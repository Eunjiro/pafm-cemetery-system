"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { useDialog } from "@/app/components/DialogProvider"

const sanitizeText = (text: string) => text.replace(/<[^>]*>/g, '')

const FEE_MATRIX: Record<string, { full: number; installment?: number }> = {
  "13mm": { full: 3900, installment: 4200 },
  "20mm": { full: 21450 },
  "25mm": { full: 24700 },
  "40mm": { full: 33800 },
  "50mm": { full: 42250 },
  "100mm": { full: 81900 },
  "150mm": { full: 104000 },
  "200mm": { full: 158600 },
}

const PROPERTY_PROOF_TYPES = [
  "Land Title",
  "Deed of Sale / Donation / Contract to Sell",
  "Lease Contract",
  "Occupancy Permit",
  "Barangay Certificate (for informal settlers)",
  "Certification from Housing Developer",
  "Special Power of Attorney (if representative)",
]

export default function NewWaterConnectionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [showGuide, setShowGuide] = useState(false)
  const dialog = useDialog()

  const [formData, setFormData] = useState({
    applicantName: "",
    contactNumber: "",
    houseNumber: "",
    street: "",
    barangay: "",
    landmark: "",
    structureType: "RESIDENTIAL",
    propertyProofType: "",
  })

  const [files, setFiles] = useState<{ validId: File | null; propertyProof: File | null }>({
    validId: null,
    propertyProof: null,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: sanitizeText(value) }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: "validId" | "propertyProof") => {
    const file = e.target.files?.[0] || null
    if (file && file.size > 10 * 1024 * 1024) {
      setError("File size must be under 10MB")
      return
    }
    setFiles(prev => ({ ...prev, [field]: file }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    if (!files.validId || !files.propertyProof) {
      setError("Please upload both Valid ID and Proof of Property Possession")
      setIsSubmitting(false)
      return
    }

    try {
      const data = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value) data.append(key, value)
      })
      data.append("validId", files.validId)
      data.append("propertyProof", files.propertyProof)

      const response = await fetch("/api/water/connection", {
        method: "POST",
        body: data,
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to submit application")
        return
      }

      await dialog.success("Water connection application submitted successfully! You will receive an acknowledgment and tracking number via notification.")
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

  const structureTypes = [
    { value: "RESIDENTIAL", label: "Residential" },
    { value: "APARTMENT_TOWNHOUSE", label: "Apartment / Townhouse" },
    { value: "COMMERCIAL", label: "Commercial / Store" },
    { value: "SCHOOL_CHURCH_OTHERS", label: "School / Church / Others" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white py-6 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/services/water/user-dashboard" className="text-sm text-blue-100 hover:text-white mb-2 inline-block">
                ← Back to Water Services
              </Link>
              <h1 className="text-2xl font-bold">Apply for New Water Service Connection</h1>
              <p className="text-blue-100 mt-1">Submit your application for a new water connection</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">Logged in as</p>
              <p className="font-semibold">{session?.user?.name}</p>
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
          {/* Applicant Information */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Applicant Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name of Applicant <span className="text-red-500">*</span></label>
                <input type="text" name="applicantName" value={formData.applicantName} onChange={handleInputChange} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number <span className="text-red-500">*</span></label>
                <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} required placeholder="09XX-XXX-XXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" />
              </div>
            </div>
          </div>

          {/* Installation Address */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Installation Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">House / Lot Number</label>
                <input type="text" name="houseNumber" value={formData.houseNumber} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street <span className="text-red-500">*</span></label>
                <input type="text" name="street" value={formData.street} onChange={handleInputChange} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barangay <span className="text-red-500">*</span></label>
                <input type="text" name="barangay" value={formData.barangay} onChange={handleInputChange} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Landmark / Nearby Establishment</label>
                <input type="text" name="landmark" value={formData.landmark} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" />
              </div>
            </div>
          </div>

          {/* Structure Type */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Structure Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type of Structure <span className="text-red-500">*</span></label>
              <select name="structureType" value={formData.structureType} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900">
                {structureTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* Document Uploads */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Required Documents</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Government ID <span className="text-red-500">*</span></label>
                <p className="text-xs text-gray-500 mb-2">Passport, Driver&apos;s License, SSS, PhilHealth, Voter&apos;s ID, etc.</p>
                <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, "validId")} required
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proof of Property Possession <span className="text-red-500">*</span></label>
                <select name="propertyProofType" value={formData.propertyProofType} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 mb-2">
                  <option value="">-- Select type of proof --</option>
                  {PROPERTY_PROOF_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, "propertyProof")} required
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>
            </div>
          </div>

          {/* Fee Reference */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4 border-b border-blue-200 pb-2">Fee Reference (for information only)</h2>
            <p className="text-sm text-blue-700 mb-3">Payment will be made at the Cashier after inspection and billing. Fees depend on pipe size/distance.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-blue-200">
                    <th className="py-2 text-blue-900">Pipe Size</th>
                    <th className="py-2 text-blue-900">Fee (Full)</th>
                    <th className="py-2 text-blue-900">Installment</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(FEE_MATRIX).map(([size, fees]) => (
                    <tr key={size} className="border-b border-blue-100">
                      <td className="py-2 text-blue-800">{size} ({size === "13mm" ? '½"' : size === "20mm" ? '¾"' : size === "25mm" ? '1"' : size === "40mm" ? '1½"' : size === "50mm" ? '2"' : size === "100mm" ? '4"' : size === "150mm" ? '6"' : '8"'})</td>
                      <td className="py-2 text-blue-800">₱{fees.full.toLocaleString()}</td>
                      <td className="py-2 text-blue-800">{fees.installment ? `₱${fees.installment.toLocaleString()}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Link href="/services/water/user-dashboard" className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">
              Cancel
            </Link>
            <button type="submit" disabled={isSubmitting}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>

      {/* Help Button */}
      <button onClick={() => setShowGuide(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center text-2xl z-50">?</button>

      {showGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Water Connection Application Guide</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p><strong>Requirements:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Valid Government ID</li>
                <li>Proof of Property Possession (Land Title, Deed of Sale, Lease Contract, etc.)</li>
              </ul>
              <p><strong>Process:</strong></p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Submit application online</li>
                <li>Staff validates documents</li>
                <li>Inspector schedules site inspection</li>
                <li>Payment order generated based on pipe size</li>
                <li>Pay at the Cashier (over-the-counter only)</li>
                <li>Installation team dispatched</li>
                <li>Water connection activated</li>
              </ol>
              <p className="text-orange-600 font-medium">Payment is Cashier only — no online payment accepted.</p>
            </div>
            <button onClick={() => setShowGuide(false)} className="mt-6 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Got it!</button>
          </div>
        </div>
      )}
    </div>
  )
}
