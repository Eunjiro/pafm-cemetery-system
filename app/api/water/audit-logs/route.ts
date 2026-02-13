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

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden - Admin access only" }, { status: 403 })
  }

  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { entityType: { in: ['DrainageRequest', 'WaterConnection', 'WaterIssue'] } },
          { action: { startsWith: 'DRAINAGE_REQUEST' } },
          { action: { startsWith: 'WATER_' } },
        ]
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 500
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error("Error fetching water audit logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
