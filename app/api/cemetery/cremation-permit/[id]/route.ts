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

    const permit = await prisma.cremationPermit.findUnique({
      where: { id }
    })

    if (!permit) {
      return NextResponse.json({ error: "Cremation permit not found" }, { status: 404 })
    }

    // Check if user has permission to view this permit
    if (permit.userId !== user.id && user.role !== "EMPLOYEE" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 })
    }

    return NextResponse.json({ permit })
  } catch (error) {
    console.error("Error fetching cremation permit:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
