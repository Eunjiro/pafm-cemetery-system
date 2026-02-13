"use client"

import { useSession } from "next-auth/react"
import { redirect, useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"

const PARK_LOCATIONS = [
  "Municipal Water Park",
  "Central Park",
  "Riverside Park",
  "Heritage Park",
  "Children's Playground Area",
  "Sports Complex Grounds",
  "Amphitheater Garden",
  "Picnic Grounds",
  "Nature Trail Park",
  "Community Garden",
  "Other",
]

const ISSUE_CATEGORIES = [
  { value: "DAMAGED_BENCH", label: "Damaged Bench" },
  { value: "FALLEN_TREE", label: "Fallen Tree" },
  { value: "PLAYGROUND_EQUIPMENT", label: "Playground Equipment" },
  { value: "VANDALISM", label: "Vandalism" },
  { value: "LIGHTING", label: "Lighting Issue" },
  { value: "CLEANLINESS", label: "Cleanliness / Sanitation" },
  { value: "PATHWAY", label: "Pathway / Walkway Damage" },
  { value: "FENCING", label: "Fencing / Barrier" },
  { value: "IRRIGATION", label: "Irrigation / Sprinkler" },
  { value: "OTHER", label: "Other" },
]

export default function MaintenanceReportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [issueCategory, setIssueCategory] = useState("")

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-xl">Loading...</div></div>
  }
  if (status === "unauthenticated") redirect("/login")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    const formData = new FormData(e.currentTarget)

    try {
      const response = await fetch("/api/parks/maintenance-request", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit report")
      }

      setSuccess(true)
      setTimeout(() => router.push("/services/parks/my-submissions"), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Submitted!</h2>
          <p className="text-gray-600">Your maintenance report has been logged and will be reviewed. Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-amber-600 text-white py-6 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/services/parks/user-dashboard" className="text-sm text-amber-100 hover:text-white mb-2 inline-block">
            ← Back to Parks & Recreation
          </Link>
          <h1 className="text-3xl font-bold">Park Maintenance / Repair Report</h1>
          <p className="text-amber-100 mt-1">Report park maintenance issues, damages, or concerns</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Reporter Info */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Reporter Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (optional)</label>
              <input type="text" name="reporterName" defaultValue={session?.user?.name || ""} placeholder="Leave blank for anonymous report"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" />
              <p className="text-xs text-gray-500 mt-1">You may leave this blank to submit anonymously</p>
            </div>
          </div>

          {/* Issue Details */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Issue Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Park / Location *</label>
                <select name="parkLocation" required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm">
                  <option value="">Select park or location</option>
                  {PARK_LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type of Issue *</label>
                <select name="issueCategory" required value={issueCategory} onChange={e => setIssueCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm">
                  <option value="">Select issue type</option>
                  {ISSUE_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              {issueCategory === "OTHER" && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specify Issue Type *</label>
                  <input type="text" name="issueCategoryOther" required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" />
                </div>
              )}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description of Concern *</label>
                <textarea name="description" required rows={4} placeholder="Describe the issue in detail..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" />
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Photos (optional but encouraged)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo 1</label>
                <input type="file" name="photo1" accept="image/*,video/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo 2</label>
                <input type="file" name="photo2" accept="image/*,video/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo 3</label>
                <input type="file" name="photo3" accept="image/*,video/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Photos help us assess the issue faster. Accepted: images and videos.</p>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Link href="/services/parks/user-dashboard" className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
              Cancel
            </Link>
            <button type="submit" disabled={isSubmitting}
              className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-400 font-medium transition-colors">
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
