import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user || (user.role !== "EMPLOYEE" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden - Employee/Admin access only" }, { status: 403 })
  }

  try {
    const amenityReservations = await prisma.amenityReservation.findMany({
      where: {
        paymentStatus: { not: "UNPAID" }
      },
      select: {
        id: true,
        requesterName: true,
        amenityType: true,
        preferredDate: true,
        numberOfGuests: true,
        paymentStatus: true,
        paymentMethod: true,
        paymentReference: true,
        amountDue: true,
        amountPaid: true,
        status: true,
        createdAt: true,
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const venueBookings = await prisma.venueBooking.findMany({
      where: {
        paymentStatus: { not: "UNPAID" }
      },
      select: {
        id: true,
        applicantName: true,
        venueType: true,
        eventType: true,
        desiredStartDate: true,
        estimatedAttendees: true,
        paymentStatus: true,
        paymentMethod: true,
        paymentReference: true,
        amountDue: true,
        amountPaid: true,
        status: true,
        createdAt: true,
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const transactions = [
      ...amenityReservations.map(r => ({
        id: r.id,
        type: 'AMENITY_RESERVATION',
        subType: r.amenityType,
        payer: r.requesterName || r.user.name,
        email: r.user.email,
        date: r.createdAt,
        serviceDate: r.preferredDate,
        amountDue: r.amountDue,
        amountPaid: r.amountPaid,
        paymentStatus: r.paymentStatus,
        paymentMethod: r.paymentMethod,
        paymentReference: r.paymentReference,
        bookingStatus: r.status,
        guests: r.numberOfGuests,
      })),
      ...venueBookings.map(r => ({
        id: r.id,
        type: 'VENUE_BOOKING',
        subType: r.venueType,
        payer: r.applicantName || r.user.name,
        email: r.user.email,
        date: r.createdAt,
        serviceDate: r.desiredStartDate,
        amountDue: r.amountDue,
        amountPaid: r.amountPaid,
        paymentStatus: r.paymentStatus,
        paymentMethod: r.paymentMethod,
        paymentReference: r.paymentReference,
        bookingStatus: r.status,
        guests: r.estimatedAttendees,
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error("Error fetching parks transactions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
