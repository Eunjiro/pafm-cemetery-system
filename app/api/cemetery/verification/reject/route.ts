import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role
    if (userRole !== "EMPLOYEE" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { registrationId, remarks, processedBy } = await request.json()

    if (!registrationId || !remarks) {
      return NextResponse.json({ error: "Registration ID and remarks required" }, { status: 400 })
    }

    // Update registration
    const registration = await prisma.deathRegistration.update({
      where: { id: registrationId },
      data: {
        status: "RETURNED_FOR_CORRECTION",
        remarks: remarks,
        processedBy: processedBy,
        processedAt: new Date()
      }
    })

    return NextResponse.json({
      message: "Registration returned for correction",
      registration
    })

  } catch (error) {
    console.error("Rejection error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
