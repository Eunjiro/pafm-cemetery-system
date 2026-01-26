import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const registration = await prisma.deathRegistration.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    return NextResponse.json({ registration })
  } catch (error) {
    console.error("Error fetching registration:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
