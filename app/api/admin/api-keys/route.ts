import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"

// Force dynamic rendering - don't try to build statically
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const apiKeys = await prisma.apiKey.findMany({
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({ apiKeys })
  } catch (error) {
    console.error("Error fetching API keys:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Generate a secure random API key
    const key = `pafm_${randomBytes(32).toString('hex')}`

    const apiKey = await prisma.apiKey.create({
      data: {
        name: name.trim(),
        key,
        isActive: true,
        createdBy: session.user.id || session.user.email || "admin"
      }
    })

    return NextResponse.json({ 
      message: "API key created successfully",
      key: apiKey.key,
      id: apiKey.id
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating API key:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { id, isActive } = body

    if (!id) {
      return NextResponse.json({ error: "API key ID is required" }, { status: 400 })
    }

    await prisma.apiKey.update({
      where: { id },
      data: { isActive }
    })

    return NextResponse.json({ message: "API key updated successfully" })
  } catch (error) {
    console.error("Error updating API key:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "API key ID is required" }, { status: 400 })
    }

    await prisma.apiKey.delete({
      where: { id }
    })

    return NextResponse.json({ message: "API key deleted successfully" })
  } catch (error) {
    console.error("Error deleting API key:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
