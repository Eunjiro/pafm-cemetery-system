import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "EMPLOYEE" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    // Fetch death registrations with payment submitted
    const deathRegistrations = await prisma.deathRegistration.findMany({
      where: {
        status: "PAYMENT_SUBMITTED"
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    })

    // Fetch burial permits with payment submitted
    const burialPermits = await prisma.burialPermit.findMany({
      where: {
        status: "PAYMENT_SUBMITTED"
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    })

    // Fetch exhumation permits with payment submitted
    const exhumationPermits = await prisma.exhumationPermit.findMany({
      where: {
        status: "PAYMENT_SUBMITTED"
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    })

    // Combine all submissions with type indicator
    const allSubmissions = [
      ...deathRegistrations.map(reg => ({ ...reg, type: 'death_registration' as const })),
      ...burialPermits.map(permit => ({ ...permit, type: 'burial_permit' as const })),
      ...exhumationPermits.map(permit => ({ ...permit, type: 'exhumation_permit' as const }))
    ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    return NextResponse.json({ submissions: allSubmissions })
  } catch (error) {
    console.error("Error fetching payment submissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
