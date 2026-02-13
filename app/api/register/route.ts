import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 registrations per 15 minutes per IP
    const ip = getClientIp(request)
    const { limited, retryAfter } = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000)
    if (limited) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      )
    }

    const { email, password, name, mobile, birthdate, address, houseNumber, street, barangay } = await request.json()

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Enforce password strength
    if (password.length < 10) {
      return NextResponse.json(
        { error: "Password must be at least 10 characters long" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user with USER role (admin/employee accounts must be created via seed)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "USER",
        mobile,
        birthdate: birthdate ? new Date(birthdate) : null,
        address,
        houseNumber,
        street,
        barangay,
        profileComplete: true, // Regular registration includes all info
      }
    })

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.USER_REGISTERED,
      entityType: "User",
      entityId: user.id,
      details: {
        email: user.email,
        name: user.name,
        role: user.role
      }
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      { user: userWithoutPassword, message: "User created successfully" },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
