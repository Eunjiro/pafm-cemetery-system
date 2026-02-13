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
    const userSelect = { select: { name: true, email: true } }

    const [deathRegistrations, burialPermits, cremationPermits, exhumationPermits, certificateRequests] = await Promise.all([
      prisma.deathRegistration.findMany({
        include: { user: userSelect },
        orderBy: { createdAt: "desc" }
      }),
      prisma.burialPermit.findMany({
        include: { user: userSelect },
        orderBy: { createdAt: "desc" }
      }),
      prisma.cremationPermit.findMany({
        include: { user: userSelect },
        orderBy: { createdAt: "desc" }
      }),
      prisma.exhumationPermit.findMany({
        include: { user: userSelect },
        orderBy: { createdAt: "desc" }
      }),
      prisma.deathCertificateRequest.findMany({
        include: { user: userSelect },
        orderBy: { createdAt: "desc" }
      }),
    ])

    // Normalize all records into a unified shape
    const submissions = [
      ...deathRegistrations.map(r => ({
        id: r.id,
        type: "DEATH_REGISTRATION" as const,
        typeLabel: "Death Registration",
        deceasedName: `${r.deceasedFirstName} ${r.deceasedMiddleName || ""} ${r.deceasedLastName}`.trim(),
        applicantName: r.informantName,
        status: r.status,
        orderOfPayment: r.orderOfPayment,
        fee: r.registrationFee,
        registrationType: r.registrationType,
        processingDeadline: r.processingDeadline,
        createdAt: r.createdAt,
        user: r.user,
      })),
      ...burialPermits.map(r => ({
        id: r.id,
        type: "BURIAL_PERMIT" as const,
        typeLabel: "Burial Permit",
        deceasedName: r.deceasedFirstName
          ? `${r.deceasedFirstName} ${r.deceasedMiddleName || ""} ${r.deceasedLastName || ""}`.trim()
          : r.deceasedName || "N/A",
        applicantName: r.requesterName,
        status: r.status,
        orderOfPayment: r.orderOfPayment,
        fee: r.totalFee,
        registrationType: null,
        processingDeadline: null,
        createdAt: r.createdAt,
        user: r.user,
      })),
      ...cremationPermits.map(r => ({
        id: r.id,
        type: "CREMATION_PERMIT" as const,
        typeLabel: "Cremation Permit",
        deceasedName: r.deceasedFirstName
          ? `${r.deceasedFirstName} ${r.deceasedMiddleName || ""} ${r.deceasedLastName || ""}`.trim()
          : r.deceasedName || "N/A",
        applicantName: r.requesterName,
        status: r.status,
        orderOfPayment: r.orderOfPayment,
        fee: r.permitFee,
        registrationType: null,
        processingDeadline: null,
        createdAt: r.createdAt,
        user: r.user,
      })),
      ...exhumationPermits.map(r => ({
        id: r.id,
        type: "EXHUMATION_PERMIT" as const,
        typeLabel: "Exhumation Permit",
        deceasedName: r.deceasedFirstName
          ? `${r.deceasedFirstName} ${r.deceasedMiddleName || ""} ${r.deceasedLastName || ""}`.trim()
          : r.deceasedName || "N/A",
        applicantName: r.requesterName,
        status: r.status,
        orderOfPayment: r.orderOfPayment,
        fee: r.permitFee,
        registrationType: null,
        processingDeadline: null,
        createdAt: r.createdAt,
        user: r.user,
      })),
      ...certificateRequests.map(r => ({
        id: r.id,
        type: "DEATH_CERTIFICATE" as const,
        typeLabel: "Death Certificate",
        deceasedName: r.deceasedFullName,
        applicantName: r.requesterName,
        status: r.status,
        orderOfPayment: r.orderOfPayment,
        fee: r.totalFee,
        registrationType: null,
        processingDeadline: null,
        createdAt: r.createdAt,
        user: r.user,
      })),
    ]

    // Sort all by date descending
    submissions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error("Error fetching all submissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
