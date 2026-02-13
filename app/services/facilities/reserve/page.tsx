"use client"

import { useSession } from "next-auth/react"
import { redirect, useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"

const ACTIVITY_TYPES = [
  { value: "MEETING", label: "Meeting" },
  { value: "SEMINAR", label: "Seminar" },
  { value: "SPORTS_EVENT", label: "Sports Event" },
  { value: "OUTREACH", label: "Outreach" },
  { value: "EXHIBIT", label: "Exhibit" },
  { value: "TRAINING", label: "Training" },
  { value: "WEDDING", label: "Wedding" },
  { value: "ASSEMBLY", label: "Assembly" },
  { value: "LGU_EVENT", label: "LGU Event" },
  { value: "CULTURAL_EVENT", label: "Cultural Event" },
  { value: "OTHER", label: "Other" },
]

const FACILITY_TYPES = [
  { value: "CONFERENCE_HALL", label: "Conference Hall" },
  { value: "GYMNASIUM", label: "Gymnasium" },
  { value: "TRAINING_ROOM", label: "Training Room" },
  { value: "AUDITORIUM", label: "Auditorium" },
  { value: "CULTURAL_CENTER", label: "Cultural Center" },
  { value: "MULTIPURPOSE_HALL", label: "Multipurpose Hall" },
  { value: "COVERED_COURT", label: "Covered Court" },
  { value: "OTHER_FACILITY", label: "Other Facility" },
]

export default function FacilityReservationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [activityType, setActivityType] = useState("")

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
      const response = await fetch("/api/facilities/reservation", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit reservation")
      }

      const result = await response.json()
      if (result.reservation?.hasConflicts) {
        setError("Note: There may be schedule conflicts with existing reservations. Staff will review and confirm.")
      }
      setSuccess(true)
      setTimeout(() => router.push("/services/facilities/my-reservations"), 2000)
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reservation Submitted!</h2>
          <p className="text-gray-600">Your facility reservation has been submitted and is pending review. Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-orange-600 text-white py-6 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/services/facilities/user-dashboard" className="text-sm text-orange-100 hover:text-white mb-2 inline-block">
            ← Back to Facility Management
          </Link>
          <h1 className="text-3xl font-bold">Facility Reservation / Usage Request</h1>
          <p className="text-orange-100 mt-1">Reserve conference halls, gymnasiums, training rooms, auditoriums & more</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Applicant Information */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
              Applicant / Organization Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Applicant Name *</label>
                <input
                  type="text"
                  name="applicantName"
                  required
                  defaultValue={session?.user?.name || ""}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name (Optional)</label>
                <input
                  type="text"
                  name="organizationName"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
                <input
                  type="text"
                  name="contactPerson"
                  required
                  defaultValue={session?.user?.name || ""}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                <input
                  type="tel"
                  name="contactNumber"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  placeholder="e.g., 09171234567"
                />
              </div>
            </div>
          </div>

          {/* Activity / Purpose */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
              Activity / Purpose
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type of Activity / Purpose *</label>
                <select
                  name="activityType"
                  required
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                >
                  <option value="">Select activity type...</option>
                  {ACTIVITY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              {activityType === "OTHER" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Please specify activity type *</label>
                  <input
                    type="text"
                    name="activityTypeOther"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description / Details (Optional)</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  placeholder="Describe your activity or event..."
                />
              </div>
              <div className="flex items-center space-x-3">
                <input type="checkbox" name="isLguEvent" value="true" id="isLguEvent" className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500" />
                <label htmlFor="isLguEvent" className="text-sm text-gray-700">This is an LGU / Government-sponsored event (may be priority or payment-exempted)</label>
              </div>
            </div>
          </div>

          {/* Facility & Schedule */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
              Facility & Schedule
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Facility *</label>
                <select
                  name="facilityType"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                >
                  <option value="">Select facility...</option>
                  {FACILITY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facility Details (Optional)</label>
                <input
                  type="text"
                  name="facilityDetails"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  placeholder="Specific room, wing, or instructions..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Participants *</label>
                <input
                  type="number"
                  name="estimatedParticipants"
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  placeholder="e.g., 50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time *</label>
                <input
                  type="datetime-local"
                  name="desiredStartDate"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time *</label>
                <input
                  type="datetime-local"
                  name="desiredEndDate"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Document Uploads */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">4</span>
              Documents & Attachments (Optional)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Layout / Equipment Requirements
                  <span className="text-xs text-gray-400 ml-1">(chairs, sound system, projector, stage, etc.)</span>
                </label>
                <input
                  type="file"
                  name="layoutFile"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Government Permit / Endorsement
                  <span className="text-xs text-gray-400 ml-1">(required for large / public events)</span>
                </label>
                <input
                  type="file"
                  name="governmentPermit"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Barangay Endorsement
                  <span className="text-xs text-gray-400 ml-1">(for private or large gatherings)</span>
                </label>
                <input
                  type="file"
                  name="barangayEndorsement"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">5</span>
              Additional Notes / Remarks
            </h2>
            <textarea
              name="additionalNotes"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
              placeholder="Any additional notes or special requests..."
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <Link href="/services/facilities/user-dashboard" className="text-gray-600 hover:text-gray-800">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-3 rounded-lg font-semibold text-white transition-colors ${
                isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"
              }`}
            >
              {isSubmitting ? "Submitting..." : "Submit Reservation Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
