import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// GET - Fetch current user profile
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mobile: true,
        birthdate: true,
        address: true,
        houseNumber: true,
        street: true,
        barangay: true,
        profileComplete: true,
        createdAt: true,
        password: true, // Need to check if user has a password (OAuth users don't)
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { password, ...userWithoutPassword } = user
    return NextResponse.json({
      ...userWithoutPassword,
      hasPassword: !!password && password.length > 0, // OAuth users have empty password
    })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json({ error: "An error occurred" }, { status: 500 })
  }
}

// PUT - Update profile information (requires current password for verification)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, name, email, mobile, birthdate, address, houseNumber, street, barangay } = body

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify identity: require current password if user has one (non-OAuth)
    const hasPassword = user.password && user.password.length > 0
    if (hasPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to verify your identity" },
          { status: 400 }
        )
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 403 }
        )
      }
    }

    // Validate name
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 }
      )
    }

    // Validate email if changed
    if (email && email !== user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        )
      }

      // Check if email is already taken
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })
      if (existingUser) {
        return NextResponse.json(
          { error: "This email is already in use by another account" },
          { status: 409 }
        )
      }
    }

    // Validate mobile
    if (mobile && !/^09\d{9}$/.test(mobile)) {
      return NextResponse.json(
        { error: "Mobile number must be in format 09XXXXXXXXX (11 digits)" },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      name: name.trim(),
    }

    if (email && email !== user.email) {
      updateData.email = email.trim()
    }
    if (mobile !== undefined) updateData.mobile = mobile || null
    if (birthdate !== undefined) updateData.birthdate = birthdate ? new Date(birthdate) : null
    if (address !== undefined) updateData.address = address || null
    if (houseNumber !== undefined) updateData.houseNumber = houseNumber || null
    if (street !== undefined) updateData.street = street || null
    if (barangay !== undefined) updateData.barangay = barangay || null

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mobile: true,
        birthdate: true,
        address: true,
        houseNumber: true,
        street: true,
        barangay: true,
        profileComplete: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "An error occurred" }, { status: 500 })
  }
}
