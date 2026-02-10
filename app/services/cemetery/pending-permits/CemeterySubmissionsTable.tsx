"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type CemeterySubmission = {
  id: string
  permitId: string
  permitType: string
  status: string
  deceasedFirstName: string
  deceasedMiddleName: string | null
  deceasedLastName: string
  dateOfDeath: Date
  applicantName: string
  preferredCemeteryId: string | null
  preferredPlotId: string | null
  preferredSection: string | null
  assignedPlotNumber: string | null
  assignedCemetery: string | null
  assignedCemeteryName: string | null
  rejectionReason: string | null
  submittedToCemeteryAt: Date | null
  createdAt: Date
}

export default function CemeterySubmissionsTable({ submissions }: { submissions: CemeterySubmission[] }) {
  const [filter, setFilter] = useState<string>("all")
  const [selectedSubmission, setSelectedSubmission] = useState<CemeterySubmission | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const router = useRouter()

  const filteredSubmissions = submissions.filter(submission => {
    if (filter === "all") return true
    if (filter === "pending") return submission.status === "PENDING_SUBMISSION"
    if (filter === "submitted") return submission.status === "SUBMITTED"
    if (filter === "assigned") return submission.status === "ASSIGNED"
    if (filter === "rejected") return submission.status === "REJECTED"
    return false
  })

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending_submission":
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">Pending</span>
      case "submitted":
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">Submitted</span>
      case "assigned":
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">Assigned</span>
      case "rejected":
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">Rejected</span>
      case "sync_error":
        return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">Error</span>
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">{status}</span>
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <>
      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-1 px-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              filter === "all"
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
            }`}
          >
            All ({submissions.length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              filter === "pending"
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
            }`}
          >
            Pending ({submissions.filter(s => s.status === "PENDING_SUBMISSION").length})
          </button>
          <button
            onClick={() => setFilter("submitted")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              filter === "submitted"
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
            }`}
          >
            Submitted ({submissions.filter(s => s.status === "SUBMITTED").length})
          </button>
          <button
            onClick={() => setFilter("assigned")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              filter === "assigned"
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
            }`}
          >
            Assigned ({submissions.filter(s => s.status === "ASSIGNED").length})
          </button>
          <button
            onClick={() => setFilter("rejected")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              filter === "rejected"
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
            }`}
          >
            Rejected ({submissions.filter(s => s.status === "REJECTED").length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Permit ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deceased
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Applicant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Received
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSubmissions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 font-medium">No submissions found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {filter === "all" 
                        ? "No permits have been approved for cemetery submission yet" 
                        : `No ${filter} submissions`}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredSubmissions.map((submission) => (
                <tr key={submission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{submission.permitId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {submission.deceasedFirstName} {submission.deceasedMiddleName} {submission.deceasedLastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      Died: {formatDate(submission.dateOfDeath)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{submission.applicantName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{submission.permitType.toLowerCase()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatDate(submission.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(submission.status)}
                    {submission.status === "ASSIGNED" && submission.assignedPlotNumber && (
                      <div className="text-xs text-gray-500 mt-1">
                        Plot: {submission.assignedPlotNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedSubmission(submission)
                        setShowDetailsModal(true)
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View
                    </button>
                    {submission.status === "PENDING_SUBMISSION" && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/cemetery/submit-to-pafm', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ submissionId: submission.id })
                            })

                            const data = await res.json()
                            if (!res.ok || !data?.success) {
                              alert('Failed to send to cemetery: ' + (data?.error || 'unknown'))
                              return
                            }

                            alert('Submission sent to cemetery successfully')
                            router.refresh()
                          } catch (err) {
                            console.error(err)
                            alert('Unexpected error sending to cemetery')
                          }
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        Send to Cemetery
                      </button>
                    )}
                    {submission.status === "SUBMITTED" && (
                      <button
                        onClick={() => {
                          alert("Check Status functionality coming soon!")
                        }}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Sync Status
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedSubmission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Cemetery Submission Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold">Permit ID:</span> {selectedSubmission.permitId}
              </div>
              <div>
                <span className="font-semibold">Type:</span> <span className="capitalize">{selectedSubmission.permitType.toLowerCase()}</span>
              </div>
              <div>
                <span className="font-semibold">Status:</span> {getStatusBadge(selectedSubmission.status)}
              </div>
              <div>
                <span className="font-semibold">Deceased:</span> {selectedSubmission.deceasedFirstName} {selectedSubmission.deceasedMiddleName} {selectedSubmission.deceasedLastName}
              </div>
              <div>
                <span className="font-semibold">Date of Death:</span> {formatDate(selectedSubmission.dateOfDeath)}
              </div>
              <div>
                <span className="font-semibold">Applicant:</span> {selectedSubmission.applicantName}
              </div>
              {selectedSubmission.preferredSection && (
                <div>
                  <span className="font-semibold">Preferred Section:</span> {selectedSubmission.preferredSection}
                </div>
              )}
              {selectedSubmission.assignedPlotNumber && (
                <div className="pt-3 border-t">
                  <span className="font-semibold">Assigned Plot:</span> {selectedSubmission.assignedPlotNumber}
                  {selectedSubmission.assignedCemeteryName && (
                    <div className="text-gray-600 mt-1">at {selectedSubmission.assignedCemeteryName}</div>
                  )}
                </div>
              )}
              {selectedSubmission.rejectionReason && (
                <div className="pt-3 border-t">
                  <span className="font-semibold">Rejection Reason:</span>
                  <div className="text-gray-600 mt-1">{selectedSubmission.rejectionReason}</div>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDetailsModal(false)
                  setSelectedSubmission(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
