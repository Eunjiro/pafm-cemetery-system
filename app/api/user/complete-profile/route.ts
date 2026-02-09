import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { mobile, birthdate, address, houseNumber, street, barangay } = await request.json()

    // Validate required fields
    if (!mobile || !birthdate || !address || !houseNumber || !street || !barangay) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // Validate mobile format
    if (!/^09\d{9}$/.test(mobile)) {
      return NextResponse.json(
        { error: "Invalid mobile number format" },
        { status: 400 }
      )
    }

    // Update user profile
    await prisma.user.update({
      where: { email: session.user.email! },
      data: {
        mobile,
        birthdate: new Date(birthdate),
        address,
        houseNumber,
        street,
        barangay,
        profileComplete: true,
      }
    })

    return NextResponse.json(
      { message: "Profile completed successfully" },
      { status: 200 }
    )

  } catch (error) {
    console.error("Complete profile error:", error)
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    )
  }
}
