import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user || (user.role !== "ADMIN" && user.role !== "EMPLOYEE")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || ""
    const search = searchParams.get("search") || ""
    const office = searchParams.get("office") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const where: any = {}
    if (status) where.status = status
    if (office) where.requestingOffice = { contains: office, mode: "insensitive" }
    if (search) {
      where.OR = [
        { risNumber: { contains: search, mode: "insensitive" } },
        { requestingOffice: { contains: search, mode: "insensitive" } },
        { requestedBy: { contains: search, mode: "insensitive" } },
        { purpose: { contains: search, mode: "insensitive" } },
      ]
    }

    const [requisitions, total] = await Promise.all([
      prisma.requisition.findMany({
        where,
        include: {
          items: {
            include: { item: { select: { name: true, itemCode: true, currentStock: true, unit: true } } }
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.requisition.count({ where }),
    ])

    const stats = {
      pending: await prisma.requisition.count({ where: { status: "PENDING_APPROVAL" } }),
      approved: await prisma.requisition.count({ where: { status: "APPROVED" } }),
      forRelease: await prisma.requisition.count({ where: { status: "FOR_RELEASE" } }),
      issued: await prisma.requisition.count({ where: { status: "ISSUED" } }),
      rejected: await prisma.requisition.count({ where: { status: "REJECTED" } }),
    }

    return NextResponse.json({
      requisitions,
      stats,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error("Fetch requisitions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user || (user.role !== "ADMIN" && user.role !== "EMPLOYEE")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { requestingOffice, requestedBy, purpose, items } = body

    if (!requestingOffice || !requestedBy || !purpose || !items || items.length === 0) {
      return NextResponse.json({ error: "All fields and at least one item are required" }, { status: 400 })
    }

    // Validate items exist and have sufficient stock
    for (const item of items) {
      const invItem = await prisma.inventoryItem.findUnique({ where: { id: item.itemId } })
      if (!invItem) {
        return NextResponse.json({ error: `Item not found: ${item.itemId}` }, { status: 400 })
      }
    }

    // Generate RIS number
    const count = await prisma.requisition.count()
    const now = new Date()
    const risNumber = `RIS-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${String(count + 1).padStart(4, "0")}`

    const requisition = await prisma.requisition.create({
      data: {
        risNumber,
        requestingOffice,
        requestedBy,
        requestedById: user.id,
        purpose,
        status: "PENDING_APPROVAL",
        items: {
          create: items.map((item: any) => ({
            itemId: item.itemId,
            requestedQty: item.requestedQty,
            remarks: item.remarks || null,
          }))
        }
      },
      include: { items: { include: { item: true } } }
    })

    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.REQUISITION_SUBMITTED,
      entityType: "Requisition",
      entityId: requisition.id,
      details: { risNumber, requestingOffice, itemCount: items.length }
    })

    return NextResponse.json({ requisition }, { status: 201 })
  } catch (error) {
    console.error("Create requisition error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
