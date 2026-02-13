"use client"

import { useSession } from "next-auth/react"
import { redirect, useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"

const EVENT_TYPES = [
  { value: "BIRTHDAY", label: "Birthday" },
  { value: "ASSEMBLY", label: "Assembly" },
  { value: "WEDDING", label: "Wedding" },
  { value: "OUTREACH", label: "Outreach" },
  { value: "LGU_EVENT", label: "LGU Event" },
  { value: "SPORTS", label: "Sports" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "OTHER", label: "Other" },
]

const VENUE_TYPES = [
  { value: "PICNIC_GROUND", label: "Picnic Ground" },
  { value: "COVERED_COURT", label: "Covered Court" },
  { value: "AMPHITHEATER", label: "Amphitheater" },
  { value: "CAFETERIA", label: "Cafeteria" },
  { value: "EVENT_HALL", label: "Event Hall" },
  { value: "OTHER_VENUE", label: "Other" },
]

export default function VenueBookingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [eventType, setEventType] = useState("")

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
      const response = await fetch("/api/parks/venue-booking", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit booking")
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Submitted!</h2>
          <p className="text-gray-600">Your venue booking has been submitted and is pending review. Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-emerald-600 text-white py-6 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/services/parks/user-dashboard" className="text-sm text-emerald-100 hover:text-white mb-2 inline-block">
            ← Back to Parks & Recreation
          </Link>
          <h1 className="text-3xl font-bold">Venue Rental / Event Booking</h1>
          <p className="text-emerald-100 mt-1">Book picnic grounds, covered court, amphitheater, event hall & more</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Applicant Information */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Applicant Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name of Applicant *</label>
                <input type="text" name="applicantName" required defaultValue={session?.user?.name || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name (if any)</label>
                <input type="text" name="organizationName" placeholder="Organization or group name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
                <input type="text" name="contactPerson" required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                <input type="tel" name="contactNumber" required placeholder="09xxxxxxxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm" />
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Event Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type *</label>
                <select name="eventType" required value={eventType} onChange={e => setEventType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm">
                  <option value="">Select event type</option>
                  {EVENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              {eventType === "OTHER" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specify Event Type *</label>
                  <input type="text" name="eventTypeOther" required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Venue *</label>
                <select name="venueType" required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm">
                  <option value="">Select venue</option>
                  {VENUE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specific Venue Details (optional)</label>
                <input type="text" name="venueDetails" placeholder="e.g., Court A, Hall B"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time *</label>
                <input type="datetime-local" name="desiredStartDate" required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time *</label>
                <input type="datetime-local" name="desiredEndDate" required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Number of Attendees *</label>
                <input type="number" name="estimatedAttendees" required min="1" max="5000" defaultValue="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm" />
              </div>
              <div className="flex items-center pt-6">
                <input type="checkbox" name="isLguSponsored" value="true" id="lguSponsored"
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500" />
                <label htmlFor="lguSponsored" className="ml-2 text-sm text-gray-700">This is an LGU-Sponsored Event</label>
              </div>
            </div>
          </div>

          {/* File Uploads */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Documents & Uploads</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Layout or Setup Requirements (optional)</label>
                <input type="file" name="layoutFile" accept="image/*,.pdf,.doc,.docx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm" />
                <p className="text-xs text-gray-500 mt-1">Upload event layout plan if available</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Government Permit (for large-scale/commercial events)</label>
                <input type="file" name="governmentPermit" accept="image/*,.pdf"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barangay Endorsement (if applicable)</label>
                <input type="file" name="barangayEndorsement" accept="image/*,.pdf"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm" />
              </div>
            </div>
          </div>

          {/* Notice */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-emerald-800 font-medium">Booking Policy</p>
                <ul className="text-xs text-emerald-700 mt-1 space-y-1 list-disc list-inside">
                  <li>Venue bookings are subject to availability confirmation</li>
                  <li>Payment/requirements must be submitted within 48 hours</li>
                  <li>Auto-cancellation applies if no payment is received within the hold period</li>
                  <li>Large-scale or commercial events require government permit and/or barangay endorsement</li>
                  <li>LGU-sponsored events may be exempted from payment</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Link href="/services/parks/user-dashboard" className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
              Cancel
            </Link>
            <button type="submit" disabled={isSubmitting}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 font-medium transition-colors">
              {isSubmitting ? "Submitting..." : "Submit Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
