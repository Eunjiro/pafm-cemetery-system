"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

const statusColors: Record<string, string> = {
  PENDING_EVALUATION: "bg-yellow-100 text-yellow-800",
  RETURNED_INCOMPLETE: "bg-orange-100 text-orange-800",
  FOR_INSPECTION: "bg-blue-100 text-blue-800",
  FOR_BILLING: "bg-indigo-100 text-indigo-800",
  AWAITING_PAYMENT: "bg-yellow-100 text-yellow-800",
  PAYMENT_CONFIRMED: "bg-green-100 text-green-800",
  INSTALLATION_SCHEDULED: "bg-blue-100 text-blue-800",
  INSTALLATION_ONGOING: "bg-teal-100 text-teal-800",
  ACTIVE_CONNECTION: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
}

const statusSteps = [
  "PENDING_EVALUATION",
  "FOR_INSPECTION",
  "FOR_BILLING",
  "AWAITING_PAYMENT",
  "PAYMENT_CONFIRMED",
  "INSTALLATION_SCHEDULED",
  "ACTIVE_CONNECTION",
]

export default function ConnectionSubmissionDetailPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const params = useParams()
  const [connection, setConnection] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authStatus === "authenticated" && params.id) {
      fetchConnection()
    }
  }, [authStatus, params.id])

  const fetchConnection = async () => {
    try {
      const response = await fetch(`/api/water/connection/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setConnection(data.connection)
      }
    } catch (error) {
      console.error("Failed to fetch connection:", error)
    } finally {
      setLoading(false)
    }
  }

  if (authStatus === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-xl">Loading...</div></div>
  }

  if (!connection) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-xl text-red-600">Application not found</div></div>
  }

  const formatDate = (date: string) => date ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"
  const formatStatus = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
  const currentStepIndex = statusSteps.indexOf(connection.status)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white py-6 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/services/water/my-submissions" className="text-sm text-blue-100 hover:text-white mb-2 inline-block">← Back to My Submissions</Link>
          <h1 className="text-2xl font-bold">Water Connection Application</h1>
          <p className="text-blue-100 mt-1">Tracking ID: {connection.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Status Progress */}
        <div className="bg-white rounded-xl shadow-md p-6 overflow-x-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Progress</h2>
          <div className="flex items-center justify-between min-w-[600px]">
            {statusSteps.map((step, i) => {
              const isActive = i <= currentStepIndex && currentStepIndex >= 0
              const isCurrent = step === connection.status
              return (
                <div key={step} className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-200' : isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {isActive ? '✓' : i + 1}
                  </div>
                  <p className={`text-xs mt-1 text-center ${isCurrent ? 'text-blue-700 font-semibold' : isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                    {formatStatus(step)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Current Status</h2>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors[connection.status] || 'bg-gray-100'}`}>
              {formatStatus(connection.status)}
            </span>
          </div>
          {connection.status === "RETURNED_INCOMPLETE" && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800 font-medium">Your application was returned for incomplete requirements.</p>
              {connection.remarks && <p className="text-sm text-orange-700 mt-1">{connection.remarks}</p>}
            </div>
          )}
          {connection.status === "AWAITING_PAYMENT" && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium">Please proceed to the Cashier to make your payment.</p>
              {connection.connectionFee && <p className="text-sm text-yellow-700 mt-1">Amount: ₱{connection.connectionFee.toLocaleString()}</p>}
              <p className="text-xs text-yellow-600 mt-1">Payment is over-the-counter only. No online payment accepted.</p>
            </div>
          )}
          {connection.remarks && connection.status !== "RETURNED_INCOMPLETE" && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600"><strong>Remarks:</strong> {connection.remarks}</p>
            </div>
          )}
        </div>

        {/* Applicant Info */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Application Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Applicant:</span> <span className="text-gray-900 font-medium ml-2">{connection.applicantName}</span></div>
            <div><span className="text-gray-500">Contact:</span> <span className="text-gray-900 font-medium ml-2">{connection.contactNumber}</span></div>
            <div><span className="text-gray-500">Address:</span> <span className="text-gray-900 font-medium ml-2">{[connection.houseNumber, connection.street, connection.barangay].filter(Boolean).join(", ")}</span></div>
            <div><span className="text-gray-500">Structure Type:</span> <span className="text-gray-900 font-medium ml-2">{connection.structureType.replace(/_/g, " ")}</span></div>
            {connection.landmark && <div><span className="text-gray-500">Landmark:</span> <span className="text-gray-900 font-medium ml-2">{connection.landmark}</span></div>}
            <div><span className="text-gray-500">Submitted:</span> <span className="text-gray-900 font-medium ml-2">{formatDate(connection.createdAt)}</span></div>
          </div>
        </div>

        {/* Inspection & Billing (if available) */}
        {(connection.pipeSize || connection.connectionFee || connection.inspectionDate) && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Inspection & Billing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {connection.inspectionDate && <div><span className="text-gray-500">Inspection Date:</span> <span className="ml-2">{formatDate(connection.inspectionDate)}</span></div>}
              {connection.pipeSize && <div><span className="text-gray-500">Pipe Size:</span> <span className="ml-2">{connection.pipeSize}</span></div>}
              {connection.connectionFee && <div><span className="text-gray-500">Connection Fee:</span> <span className="ml-2 font-semibold">₱{connection.connectionFee.toLocaleString()}</span></div>}
              {connection.paymentType && <div><span className="text-gray-500">Payment Type:</span> <span className="ml-2">{connection.paymentType}</span></div>}
              {connection.orNumber && <div><span className="text-gray-500">OR Number:</span> <span className="ml-2">{connection.orNumber}</span></div>}
              {connection.inspectionNotes && <div className="md:col-span-2"><span className="text-gray-500">Inspection Notes:</span> <span className="ml-2">{connection.inspectionNotes}</span></div>}
            </div>
          </div>
        )}

        {/* Installation (if available) */}
        {connection.installationDate && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Installation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Installation Date:</span> <span className="ml-2">{formatDate(connection.installationDate)}</span></div>
              {connection.installationStatus && <div><span className="text-gray-500">Status:</span> <span className="ml-2">{connection.installationStatus}</span></div>}
              {connection.installationNotes && <div className="md:col-span-2"><span className="text-gray-500">Notes:</span> <span className="ml-2">{connection.installationNotes}</span></div>}
            </div>
          </div>
        )}

        {/* Active Connection notice */}
        {connection.status === "ACTIVE_CONNECTION" && (
          <div className="bg-green-50 rounded-xl border border-green-200 p-6 text-center">
            <div className="text-4xl mb-2">💧</div>
            <h3 className="text-lg font-bold text-green-800">Your Water Connection is Active!</h3>
            <p className="text-sm text-green-600 mt-1">Your water service has been successfully installed and is now operational.</p>
          </div>
        )}
      </div>
    </div>
  )
}
