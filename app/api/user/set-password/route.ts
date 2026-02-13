import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { rateLimit } from "@/lib/rate-limit"

// For OAuth users: set a password for the first time
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limit
    const { limited, retryAfter } = rateLimit(
      `set-password:${session.user.id}`,
      5,
      15 * 60 * 1000
    )
    if (limited) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      )
    }

    const { newPassword, confirmPassword } = await request.json()

    if (!newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      )
    }

    if (newPassword.length < 10) {
      return NextResponse.json(
        { error: "Password must be at least 10 characters long" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Only allow if user has no password (OAuth account)
    if (user.password && user.password.length > 0) {
      return NextResponse.json(
        { error: "You already have a password. Use the change password form instead." },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ message: "Password set successfully. You can now sign in with email and password." })
  } catch (error) {
    console.error("Set password error:", error)
    return NextResponse.json({ error: "An error occurred" }, { status: 500 })
  }
}
