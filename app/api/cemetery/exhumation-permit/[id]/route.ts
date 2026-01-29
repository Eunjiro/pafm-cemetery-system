import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const permit = await prisma.exhumationPermit.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!permit) {
      return NextResponse.json(
        { error: "Exhumation permit not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ permit })

  } catch (error) {
    console.error("Fetch exhumation permit error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
