import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"
import { saveFile } from "@/lib/upload"
import { notifyFacilityReservationUpdate } from "@/lib/notifications"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const formData = await request.formData()
    
    const data = {
      applicantName: formData.get("applicantName") as string,
      organizationName: (formData.get("organizationName") as string) || null,
      contactPerson: formData.get("contactPerson") as string,
      contactNumber: formData.get("contactNumber") as string,
      activityType: formData.get("activityType") as string || "OTHER",
      activityTypeOther: (formData.get("activityTypeOther") as string) || null,
      description: (formData.get("description") as string) || null,
      facilityType: formData.get("facilityType") as string || "OTHER_FACILITY",
      facilityDetails: (formData.get("facilityDetails") as string) || null,
      desiredStartDate: formData.get("desiredStartDate") as string,
      desiredEndDate: formData.get("desiredEndDate") as string,
      estimatedParticipants: parseInt(formData.get("estimatedParticipants") as string) || 1,
      additionalNotes: (formData.get("additionalNotes") as string) || null,
      isLguEvent: formData.get("isLguEvent") === "true",
    }

    // Validate required fields
    if (!data.applicantName || !data.contactPerson || !data.contactNumber || !data.desiredStartDate || !data.desiredEndDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Handle file uploads
    const timestamp = Date.now()
    const folder = `facilities/reservations/${user.id}`
    let layoutFilePath: string | null = null
    let governmentPermitPath: string | null = null
    let barangayEndorsementPath: string | null = null

    const layoutFile = formData.get("layoutFile") as File | null
    if (layoutFile && layoutFile.size > 0) {
      layoutFilePath = await saveFile(layoutFile, folder, `layout_${timestamp}_${layoutFile.name}`)
    }

    const governmentPermit = formData.get("governmentPermit") as File | null
    if (governmentPermit && governmentPermit.size > 0) {
      governmentPermitPath = await saveFile(governmentPermit, folder, `permit_${timestamp}_${governmentPermit.name}`)
    }

    const barangayEndorsement = formData.get("barangayEndorsement") as File | null
    if (barangayEndorsement && barangayEndorsement.size > 0) {
      barangayEndorsementPath = await saveFile(barangayEndorsement, folder, `endorsement_${timestamp}_${barangayEndorsement.name}`)
    }

    // Check for schedule conflicts
    const startDate = new Date(data.desiredStartDate)
    const endDate = new Date(data.desiredEndDate)
    
    const existingReservations = await prisma.facilityReservation.findMany({
      where: {
        facilityType: data.facilityType as any,
        status: { in: ["PENDING_REVIEW", "AWAITING_REQUIREMENTS", "AWAITING_PAYMENT", "PAYMENT_VERIFIED", "APPROVED", "IN_USE"] },
        OR: [
          { desiredStartDate: { lte: endDate }, desiredEndDate: { gte: startDate } },
        ]
      }
    })

    // Set hold expiry (48 hours from now)
    const holdExpiresAt = new Date()
    holdExpiresAt.setHours(holdExpiresAt.getHours() + 48)

    const reservation = await prisma.facilityReservation.create({
      data: {
        userId: user.id,
        applicantName: data.applicantName,
        organizationName: data.organizationName,
        contactPerson: data.contactPerson,
        contactNumber: data.contactNumber,
        activityType: data.activityType as any,
        activityTypeOther: data.activityTypeOther,
        description: data.description,
        facilityType: data.facilityType as any,
        facilityDetails: data.facilityDetails,
        desiredStartDate: startDate,
        desiredEndDate: endDate,
        estimatedParticipants: data.estimatedParticipants,
        additionalNotes: data.additionalNotes,
        layoutFile: layoutFilePath,
        governmentPermit: governmentPermitPath,
        barangayEndorsement: barangayEndorsementPath,
        isLguEvent: data.isLguEvent,
        isPriority: data.isLguEvent,
        isPaymentExempted: data.isLguEvent,
        holdExpiresAt,
        status: "PENDING_REVIEW",
      }
    })

    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.FACILITY_RESERVATION_SUBMITTED,
      entityType: "FacilityReservation",
      entityId: reservation.id,
      details: {
        applicantName: data.applicantName,
        facilityType: data.facilityType,
        activityType: data.activityType,
        desiredStartDate: data.desiredStartDate,
        estimatedParticipants: data.estimatedParticipants,
      }
    })

    await notifyFacilityReservationUpdate(
      user.id,
      data.facilityType,
      "PENDING_REVIEW",
      reservation.id
    )

    return NextResponse.json({
      message: "Facility reservation submitted successfully",
      reservation: {
        id: reservation.id,
        status: reservation.status,
        createdAt: reservation.createdAt,
        hasConflicts: existingReservations.length > 0,
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Facility reservation submission error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.role === "EMPLOYEE" || user.role === "ADMIN") {
      const { searchParams } = new URL(request.url)
      const statusFilter = searchParams.get("status")
      const facilityFilter = searchParams.get("facilityType")
      
      const where: any = {}
      if (statusFilter) where.status = statusFilter
      if (facilityFilter) where.facilityType = facilityFilter

      const reservations = await prisma.facilityReservation.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" }
      })
      return NextResponse.json({ reservations })
    }

    // Regular users see their own reservations
    const reservations = await prisma.facilityReservation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ reservations })

  } catch (error) {
    console.error("Fetch facility reservations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
