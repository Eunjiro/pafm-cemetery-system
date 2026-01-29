import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
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
        role: "USER"
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
