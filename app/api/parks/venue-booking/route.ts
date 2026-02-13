import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"
import { saveFile } from "@/lib/upload"
import { notifyVenueBookingUpdate } from "@/lib/notifications"

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
      eventType: formData.get("eventType") as string || "OTHER",
      eventTypeOther: (formData.get("eventTypeOther") as string) || null,
      venueType: formData.get("venueType") as string || "OTHER_VENUE",
      venueDetails: (formData.get("venueDetails") as string) || null,
      desiredStartDate: formData.get("desiredStartDate") as string,
      desiredEndDate: formData.get("desiredEndDate") as string,
      estimatedAttendees: parseInt(formData.get("estimatedAttendees") as string) || 1,
      contactPerson: formData.get("contactPerson") as string,
      contactNumber: formData.get("contactNumber") as string,
      isLguSponsored: formData.get("isLguSponsored") === "true",
    }

    if (!data.applicantName || !data.desiredStartDate || !data.desiredEndDate || !data.contactPerson || !data.contactNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const timestamp = Date.now()
    const folder = `parks/venue-bookings/${user.id}`
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

    // Set hold expiry (48 hours)
    const holdExpiresAt = new Date()
    holdExpiresAt.setHours(holdExpiresAt.getHours() + 48)

    const booking = await prisma.venueBooking.create({
      data: {
        userId: user.id,
        applicantName: data.applicantName,
        organizationName: data.organizationName,
        eventType: data.eventType as any,
        eventTypeOther: data.eventTypeOther,
        venueType: data.venueType as any,
        venueDetails: data.venueDetails,
        desiredStartDate: new Date(data.desiredStartDate),
        desiredEndDate: new Date(data.desiredEndDate),
        estimatedAttendees: data.estimatedAttendees,
        contactPerson: data.contactPerson,
        contactNumber: data.contactNumber,
        layoutFile: layoutFilePath,
        governmentPermit: governmentPermitPath,
        barangayEndorsement: barangayEndorsementPath,
        isLguSponsored: data.isLguSponsored,
        isPriority: data.isLguSponsored,
        holdExpiresAt,
        status: "PENDING_REVIEW",
      }
    })

    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.VENUE_BOOKING_SUBMITTED,
      entityType: "VenueBooking",
      entityId: booking.id,
      details: {
        applicantName: data.applicantName,
        venueType: data.venueType,
        eventType: data.eventType,
        desiredStartDate: data.desiredStartDate,
      }
    })

    await notifyVenueBookingUpdate(
      user.id,
      data.venueType,
      "PENDING_REVIEW",
      booking.id
    )

    return NextResponse.json({
      message: "Venue booking submitted successfully",
      booking: {
        id: booking.id,
        status: booking.status,
        createdAt: booking.createdAt,
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Venue booking submission error:", error)
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
      const venueFilter = searchParams.get("venueType")
      
      const where: any = {}
      if (statusFilter) where.status = statusFilter
      if (venueFilter) where.venueType = venueFilter

      const bookings = await prisma.venueBooking.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" }
      })
      return NextResponse.json({ bookings })
    }

    const bookings = await prisma.venueBooking.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ bookings })

  } catch (error) {
    console.error("Fetch venue bookings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
