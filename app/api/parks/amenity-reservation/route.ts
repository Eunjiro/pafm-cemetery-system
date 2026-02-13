import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"
import { saveFile } from "@/lib/upload"
import { notifyAmenityReservationUpdate } from "@/lib/notifications"

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
      requesterName: formData.get("requesterName") as string,
      contactNumber: formData.get("contactNumber") as string,
      preferredDate: formData.get("preferredDate") as string,
      preferredTime: formData.get("preferredTime") as string,
      numberOfGuests: parseInt(formData.get("numberOfGuests") as string) || 1,
      amenityType: formData.get("amenityType") as string || "SWIMMING_ENTRANCE",
      amenityDetails: (formData.get("amenityDetails") as string) || null,
      specialRequests: (formData.get("specialRequests") as string) || null,
    }

    // Validate required fields
    if (!data.requesterName || !data.contactNumber || !data.preferredDate || !data.preferredTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Handle file uploads
    const timestamp = Date.now()
    const folder = `parks/amenity-reservations/${user.id}`
    let proofOfResidencyPath: string | null = null

    const proofOfResidency = formData.get("proofOfResidency") as File | null
    if (proofOfResidency && proofOfResidency.size > 0) {
      proofOfResidencyPath = await saveFile(proofOfResidency, folder, `residency_${timestamp}_${proofOfResidency.name}`)
    }

    // Check for schedule conflicts
    const requestedDate = new Date(data.preferredDate)
    const existingReservations = await prisma.amenityReservation.findMany({
      where: {
        preferredDate: requestedDate,
        preferredTime: data.preferredTime,
        amenityType: data.amenityType as any,
        status: { in: ["PENDING_REVIEW", "AWAITING_PAYMENT", "PAYMENT_VERIFIED", "APPROVED"] },
      }
    })

    // Set hold expiry (24 hours from now)
    const holdExpiresAt = new Date()
    holdExpiresAt.setHours(holdExpiresAt.getHours() + 24)

    const reservation = await prisma.amenityReservation.create({
      data: {
        userId: user.id,
        requesterName: data.requesterName,
        contactNumber: data.contactNumber,
        preferredDate: requestedDate,
        preferredTime: data.preferredTime,
        numberOfGuests: data.numberOfGuests,
        amenityType: data.amenityType as any,
        amenityDetails: data.amenityDetails,
        specialRequests: data.specialRequests,
        proofOfResidency: proofOfResidencyPath,
        holdExpiresAt,
        status: "PENDING_REVIEW",
      }
    })

    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.AMENITY_RESERVATION_SUBMITTED,
      entityType: "AmenityReservation",
      entityId: reservation.id,
      details: {
        requesterName: data.requesterName,
        amenityType: data.amenityType,
        preferredDate: data.preferredDate,
        numberOfGuests: data.numberOfGuests,
      }
    })

    await notifyAmenityReservationUpdate(
      user.id,
      data.amenityType,
      "PENDING_REVIEW",
      reservation.id
    )

    return NextResponse.json({
      message: "Amenity reservation submitted successfully",
      reservation: {
        id: reservation.id,
        status: reservation.status,
        createdAt: reservation.createdAt,
        hasConflicts: existingReservations.length > 0,
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Amenity reservation submission error:", error)
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
      const amenityFilter = searchParams.get("amenityType")
      
      const where: any = {}
      if (statusFilter) where.status = statusFilter
      if (amenityFilter) where.amenityType = amenityFilter

      const reservations = await prisma.amenityReservation.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" }
      })
      return NextResponse.json({ reservations })
    }

    const reservations = await prisma.amenityReservation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ reservations })

  } catch (error) {
    console.error("Fetch amenity reservations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
