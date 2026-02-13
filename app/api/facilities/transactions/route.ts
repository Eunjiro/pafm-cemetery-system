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
    const reservations = await prisma.facilityReservation.findMany({
      where: {
        paymentStatus: { not: "UNPAID" }
      },
      select: {
        id: true,
        applicantName: true,
        organizationName: true,
        facilityType: true,
        activityType: true,
        desiredStartDate: true,
        estimatedParticipants: true,
        paymentStatus: true,
        paymentMethod: true,
        paymentReference: true,
        amountDue: true,
        amountPaid: true,
        isPaymentExempted: true,
        status: true,
        createdAt: true,
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const transactions = reservations.map(r => ({
      id: r.id,
      type: 'FACILITY_RESERVATION',
      subType: r.facilityType,
      activityType: r.activityType,
      payer: r.applicantName || r.user.name,
      organization: r.organizationName,
      email: r.user.email,
      date: r.createdAt,
      serviceDate: r.desiredStartDate,
      amountDue: r.amountDue,
      amountPaid: r.amountPaid,
      paymentStatus: r.paymentStatus,
      paymentMethod: r.paymentMethod,
      paymentReference: r.paymentReference,
      isExempted: r.isPaymentExempted,
      bookingStatus: r.status,
      participants: r.estimatedParticipants,
    }))

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error("Error fetching facility transactions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
