import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Fetch permit and ensure it belongs to the user
    const permit = await prisma.burialPermit.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!permit) {
      return NextResponse.json({ error: "Permit not found" }, { status: 404 })
    }

    return NextResponse.json({ permit })

  } catch (error) {
    console.error("Fetch burial permit error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
