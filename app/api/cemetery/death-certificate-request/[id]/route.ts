import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const certificateRequest = await prisma.deathCertificateRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!certificateRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // Check if user owns this request or is an employee/admin
    const userRole = session.user.role || "USER"
    if (certificateRequest.userId !== session.user.id && userRole === "USER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(certificateRequest)

  } catch (error) {
    console.error("Error fetching certificate request:", error)
    return NextResponse.json(
      { error: "Failed to fetch request" },
      { status: 500 }
    )
  }
}
