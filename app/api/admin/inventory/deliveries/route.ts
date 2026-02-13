import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"
import { saveFile } from "@/lib/upload"

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
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const where: any = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { deliveryNumber: { contains: search, mode: "insensitive" } },
        { supplierName: { contains: search, mode: "insensitive" } },
        { purchaseOrderNumber: { contains: search, mode: "insensitive" } },
      ]
    }

    const [deliveries, total] = await Promise.all([
      prisma.delivery.findMany({
        where,
        include: {
          items: {
            include: { item: { select: { name: true, itemCode: true } } }
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.delivery.count({ where }),
    ])

    const stats = {
      pending: await prisma.delivery.count({ where: { status: "PENDING_VERIFICATION" } }),
      verified: await prisma.delivery.count({ where: { status: "VERIFIED" } }),
      stored: await prisma.delivery.count({ where: { status: "STORED" } }),
    }

    return NextResponse.json({
      deliveries,
      stats,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error("Fetch deliveries error:", error)
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

    const formData = await request.formData()

    const supplierName = formData.get("supplierName") as string
    const supplierContact = formData.get("supplierContact") as string || null
    const supplierAddress = formData.get("supplierAddress") as string || null
    const purchaseOrderNumber = formData.get("purchaseOrderNumber") as string
    const deliveryReceiptNumber = formData.get("deliveryReceiptNumber") as string || null
    const remarks = formData.get("remarks") as string || null
    const itemsJson = formData.get("items") as string

    if (!supplierName || !purchaseOrderNumber || !itemsJson) {
      return NextResponse.json({ error: "Supplier name, PO number, and items are required" }, { status: 400 })
    }

    let items: Array<{ itemId?: string; itemName: string; description?: string; quantity: number; unit: string }>
    try {
      items = JSON.parse(itemsJson)
    } catch {
      return NextResponse.json({ error: "Invalid items data" }, { status: 400 })
    }

    if (items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 })
    }

    // Generate delivery number
    const count = await prisma.delivery.count()
    const now = new Date()
    const deliveryNumber = `DEL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${String(count + 1).padStart(4, "0")}`

    const timestamp = Date.now()
    const folder = `inventory/deliveries/${deliveryNumber}`

    // Handle file uploads
    let purchaseOrderFile: string | null = null
    let deliveryReceiptFile: string | null = null
    let noticeOfDelivery: string | null = null

    const poFile = formData.get("purchaseOrderFile") as File | null
    if (poFile && poFile.size > 0) {
      purchaseOrderFile = await saveFile(poFile, folder, `po_${timestamp}_${poFile.name}`)
    }

    const drFile = formData.get("deliveryReceiptFile") as File | null
    if (drFile && drFile.size > 0) {
      deliveryReceiptFile = await saveFile(drFile, folder, `dr_${timestamp}_${drFile.name}`)
    }

    const nodFile = formData.get("noticeOfDelivery") as File | null
    if (nodFile && nodFile.size > 0) {
      noticeOfDelivery = await saveFile(nodFile, folder, `nod_${timestamp}_${nodFile.name}`)
    }

    const delivery = await prisma.delivery.create({
      data: {
        deliveryNumber,
        supplierName,
        supplierContact,
        supplierAddress,
        purchaseOrderNumber,
        purchaseOrderFile,
        deliveryReceiptNumber,
        deliveryReceiptFile,
        noticeOfDelivery,
        receivedBy: user.id,
        receivedByName: user.name,
        remarks,
        status: "PENDING_VERIFICATION",
        items: {
          create: items.map(item => ({
            itemId: item.itemId || null,
            itemName: item.itemName,
            description: item.description || null,
            quantity: item.quantity,
            unit: item.unit,
          }))
        }
      },
      include: { items: true }
    })

    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.DELIVERY_CREATED,
      entityType: "Delivery",
      entityId: delivery.id,
      details: { deliveryNumber, supplierName, purchaseOrderNumber, itemCount: items.length }
    })

    return NextResponse.json({ delivery }, { status: 201 })
  } catch (error) {
    console.error("Create delivery error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
