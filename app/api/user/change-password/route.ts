import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limit: 5 password change attempts per 15 minutes per user
    const { limited, retryAfter } = rateLimit(
      `change-password:${session.user.id}`,
      5,
      15 * 60 * 1000
    )
    if (limited) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      )
    }

    const { currentPassword, newPassword, confirmPassword } = await request.json()

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New passwords do not match" },
        { status: 400 }
      )
    }

    if (newPassword.length < 10) {
      return NextResponse.json(
        { error: "New password must be at least 10 characters long" },
        { status: 400 }
      )
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "New password must be different from current password" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // OAuth users without a password cannot change password this way
    if (!user.password || user.password.length === 0) {
      return NextResponse.json(
        { error: "Your account uses Google sign-in and does not have a password. You can set one below." },
        { status: 400 }
      )
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 403 }
      )
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ message: "Password changed successfully" })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ error: "An error occurred" }, { status: 500 })
  }
}
