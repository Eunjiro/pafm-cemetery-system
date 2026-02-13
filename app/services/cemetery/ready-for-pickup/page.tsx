"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useDialog } from "@/app/components/DialogProvider"

type SubmissionType = 'death_registration' | 'burial_permit' | 'exhumation_permit' | 'cremation_permit' | 'death_certificate_request'

interface BaseSubmission {
  id: string
  orderOfPayment: string
  proofOfPayment: string
  createdAt: string
  type: SubmissionType
  user: {
    name: string
    email: string
  }
}

type PaymentSubmission = BaseSubmission & Record<string, any>

export default function ReadyForPickup() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const dialog = useDialog()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      if (session?.user?.role !== "EMPLOYEE" && session?.user?.role !== "ADMIN") {
        router.push("/dashboard")
        return
      }
      fetchSubmissions()
    }
  }, [status, session, router])

  const fetchSubmissions = async () => {
    try {
      const response = await fetch("/api/cemetery/payment-confirmation")
      const data = await response.json()
      if (data.submissions) {
        setSubmissions(data.submissions)
      }
    } catch (error) {
      console.error("Error fetching submissions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkReady = async (id: string, type: SubmissionType) => {
    if (!(await dialog.confirm("Mark this paid request as ready for pickup?"))) return

    try {
      let endpoint = ""
      let body = {}
      
      if (type === 'death_registration') {
        endpoint = "/api/cemetery/confirm-payment"
        body = { registrationId: id }
      } else if (type === 'burial_permit') {
        endpoint = "/api/cemetery/burial-permit/confirm-payment"
        body = { permitId: id }
      } else if (type === 'exhumation_permit') {
        endpoint = "/api/cemetery/exhumation-permit/confirm-payment"
        body = { permitId: id }
      } else if (type === 'cremation_permit') {
        endpoint = "/api/cemetery/cremation-permit/confirm-payment"
        body = { permitId: id }
      } else if (type === 'death_certificate_request') {
        endpoint = "/api/cemetery/confirm-payment"
        body = { requestId: id }
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        await dialog.success("Marked as ready for pickup")
        fetchSubmissions()
      } else {
        await dialog.error(data.error || "Operation failed")
      }
    } catch (error) {
      await dialog.error("An error occurred")
    }
  }

  const viewProof = async (proofPath: string) => {
    if (!proofPath) {
      await dialog.warning('No proof of payment available')
      return
    }
    
    if (proofPath.startsWith("OR:")) {
      const orNumber = proofPath.substring(3)
      await dialog.info(`OR Number entered: ${orNumber}`)
      return
    }
    
    const encodedPath = encodeURIComponent(proofPath)
    window.open(`/api/cemetery/view-document?path=${encodedPath}`, "_blank")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const dashboardUrl = session?.user?.role === "ADMIN" 
    ? "/services/cemetery/admin-dashboard" 
    : "/services/cemetery/employee-dashboard"
  const headerColor = session?.user?.role === "ADMIN" ? "red" : "orange"

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`bg-${headerColor}-600 text-white py-6 shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href={dashboardUrl} className={`text-sm text-${headerColor}-100 hover:text-white mb-2 inline-block`}>
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold">Ready for Pickup</h1>
              <p className={`text-${headerColor}-100 mt-1`}>Mark paid requests as ready for pickup</p>
            </div>
            <div className="text-right">
              <p className={`text-sm text-${headerColor}-100`}>{session?.user?.role === "ADMIN" ? "System Administrator" : "Civil Registry Staff"}</p>
              <p className="font-semibold">{session?.user?.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {submissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Paid Requests</h2>
            <p className="text-gray-600">No payment-submitted requests to mark as ready.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {submissions.map((submission) => {
              const isORNumber = submission.proofOfPayment?.startsWith("OR:") || false

              return (
                <div key={submission.id} className="bg-white rounded-lg shadow p-4 flex items-start justify-between">
                  <div>
                    <div className="text-sm text-gray-500">{new Date(submission.createdAt).toLocaleString()}</div>
                    <div className="text-lg font-semibold">{submission.user?.name || submission.requesterName || submission.applicantName || 'Unknown'}</div>
                    <div className="text-sm text-gray-600">Type: {submission.type}</div>
                    <div className="text-sm text-gray-600 mt-2">OOP: {submission.orderOfPayment}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button onClick={() => viewProof(submission.proofOfPayment)} className="px-3 py-2 border rounded bg-white hover:bg-gray-50">View Proof</button>
                    <button onClick={() => handleMarkReady(submission.id, submission.type)} className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">Mark Ready for Pickup</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
