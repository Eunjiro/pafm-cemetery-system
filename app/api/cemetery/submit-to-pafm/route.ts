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

    // Build payload for PAFM-C
    const payload: any = {
      permit_id: submission.permitId,
      permit_type: submission.permitType.toLowerCase(),
      deceased_first_name: submission.deceasedFirstName,
      deceased_middle_name: submission.deceasedMiddleName || undefined,
      deceased_last_name: submission.deceasedLastName,
      deceased_suffix: submission.deceasedSuffix || undefined,
      date_of_death: submission.dateOfDeath.toISOString().split('T')[0],
      gender: submission.gender || undefined,
      applicant_name: submission.applicantName,
      applicant_email: submission.applicantEmail || undefined,
      applicant_phone: submission.applicantPhone || undefined,
      relationship_to_deceased: submission.relationshipToDeceased || undefined,
      preferred_cemetery_id: submission.preferredCemeteryId || undefined,
      preferred_plot_id: submission.preferredPlotId || undefined,
      preferred_section: submission.preferredSection || undefined,
      preferred_layer: submission.preferredLayer || undefined,
      permit_approved_at: submission.permitApprovedAt.toISOString(),
      permit_document_url: submission.permitDocumentUrl || undefined,
      metadata: submission.metadata || {}
    }

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
