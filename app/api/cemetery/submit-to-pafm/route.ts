import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { submitBurialPermitToCemetery } from "@/lib/cemetery-api"

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "EMPLOYEE" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { submissionId } = await req.json()
    if (!submissionId) {
      return NextResponse.json({ error: "submissionId is required" }, { status: 400 })
    }

    const submission = await prisma.cemeteryPermitSubmission.findUnique({ where: { id: submissionId } })
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    if (submission.status !== "PENDING_SUBMISSION") {
      return NextResponse.json({ error: "Submission is not pending" }, { status: 400 })
    }

    // Map permit type to cemetery system format
    const permitTypeMap: Record<string, string> = {
      'BURIAL': 'burial',
      'EXHUMATION': 'exhumation',
      'NICHE': 'niche',
      'ENTRANCE': 'entrance'
    }
    const mappedPermitType = permitTypeMap[submission.permitType] || 'burial'

    // Helper to check if string is non-empty
    const hasValue = (val: any) => val !== null && val !== undefined && val !== ''

    // Helper to validate email format
    const isValidEmail = (email: string) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }

    // Helper to validate URL format
    const isValidUrl = (url: string) => {
      try {
        new URL(url)
        return url.startsWith('http://') || url.startsWith('https://')
      } catch {
        return false
      }
    }

    // Build payload for PAFM-C - strict format per cemetery system requirements
    const payload: any = {
      permit_id: submission.permitId,
      permit_type: mappedPermitType,
      deceased_first_name: submission.deceasedFirstName,
      deceased_last_name: submission.deceasedLastName || 'Unknown',
      date_of_death: submission.dateOfDeath.toISOString().split('T')[0],
      applicant_name: submission.applicantName,
      permit_approved_at: submission.permitApprovedAt.toISOString(),
    }

    // Only include optional fields if they have values AND are valid
    if (hasValue(submission.deceasedMiddleName)) payload.deceased_middle_name = submission.deceasedMiddleName
    if (hasValue(submission.deceasedSuffix)) payload.deceased_suffix = submission.deceasedSuffix
    if (submission.dateOfBirth) payload.date_of_birth = submission.dateOfBirth.toISOString().split('T')[0]
    if (hasValue(submission.gender)) payload.gender = submission.gender
    
    // Validate email before including
    if (hasValue(submission.applicantEmail) && isValidEmail(submission.applicantEmail)) {
      payload.applicant_email = submission.applicantEmail
    }
    
    if (hasValue(submission.applicantPhone)) payload.applicant_phone = submission.applicantPhone
    if (hasValue(submission.relationshipToDeceased)) payload.relationship_to_deceased = submission.relationshipToDeceased
    
    // Only include IDs if they are valid numbers
    if (hasValue(submission.preferredCemeteryId)) {
      const cemeteryId = parseInt(submission.preferredCemeteryId)
      if (!isNaN(cemeteryId)) payload.preferred_cemetery_id = cemeteryId
    }
    if (hasValue(submission.preferredPlotId)) {
      const plotId = parseInt(submission.preferredPlotId)
      if (!isNaN(plotId)) payload.preferred_plot_id = plotId
    }
    
    if (hasValue(submission.preferredSection)) payload.preferred_section = submission.preferredSection
    if (submission.preferredLayer) payload.preferred_layer = submission.preferredLayer
    if (submission.permitExpiryDate) payload.permit_expiry_date = submission.permitExpiryDate.toISOString().split('T')[0]
    
    // Validate URL before including
    if (hasValue(submission.permitDocumentUrl) && isValidUrl(submission.permitDocumentUrl)) {
      payload.permit_document_url = submission.permitDocumentUrl
    }
    
    if (submission.metadata && Object.keys(submission.metadata).length > 0) payload.metadata = submission.metadata

    console.log('[Cemetery Submit] Sending payload:', JSON.stringify(payload, null, 2))

    const result = await submitBurialPermitToCemetery(payload)

    if (!result.success) {
      // mark as sync error but keep for retry
      await prisma.cemeteryPermitSubmission.update({
        where: { id: submissionId },
        data: {
          status: "SYNC_ERROR",
          lastSyncAttempt: new Date(),
          syncError: result.error || 'Unknown error',
          retryCount: { increment: 1 }
        }
      })

      return NextResponse.json({ success: false, error: result.error })
    }

    // On success, record returned cemetery system id and mark SUBMITTED
    const remoteId = result.data?.permit?.id || result.data?.permit_id || null

    await prisma.cemeteryPermitSubmission.update({
      where: { id: submissionId },
      data: {
        status: "SUBMITTED",
        submittedToCemeteryAt: new Date(),
        cemeterySystemId: remoteId ? String(remoteId) : null,
        lastSyncAttempt: new Date(),
        syncError: null
      }
    })

    return NextResponse.json({ success: true, data: result.data })

  } catch (error) {
    console.error('Error submitting to PAFM-C:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
