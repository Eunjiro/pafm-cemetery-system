import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"
import { saveFile } from "@/lib/upload"
import { notifyParkMaintenanceUpdate } from "@/lib/notifications"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const formData = await request.formData()
    
    const data = {
      reporterName: (formData.get("reporterName") as string) || null,
      parkLocation: formData.get("parkLocation") as string,
      issueCategory: formData.get("issueCategory") as string || "OTHER",
      issueCategoryOther: (formData.get("issueCategoryOther") as string) || null,
      description: formData.get("description") as string,
    }

    if (!data.parkLocation || !data.description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Handle photo uploads
    const timestamp = Date.now()
    const folder = `parks/maintenance-requests/${user.id}`
    const filePaths: any = {}

    const photo1 = formData.get("photo1") as File | null
    const photo2 = formData.get("photo2") as File | null
    const photo3 = formData.get("photo3") as File | null

    if (photo1 && photo1.size > 0) {
      filePaths.photo1 = await saveFile(photo1, folder, `photo1_${timestamp}_${photo1.name}`)
    }
    if (photo2 && photo2.size > 0) {
      filePaths.photo2 = await saveFile(photo2, folder, `photo2_${timestamp}_${photo2.name}`)
    }
    if (photo3 && photo3.size > 0) {
      filePaths.photo3 = await saveFile(photo3, folder, `photo3_${timestamp}_${photo3.name}`)
    }

    const maintenanceRequest = await prisma.parkMaintenanceRequest.create({
      data: {
        userId: user.id,
        reporterName: data.reporterName,
        parkLocation: data.parkLocation,
        issueCategory: data.issueCategory as any,
        issueCategoryOther: data.issueCategoryOther,
        description: data.description,
        photo1: filePaths.photo1 || null,
        photo2: filePaths.photo2 || null,
        photo3: filePaths.photo3 || null,
        status: "LOGGED",
      }
    })

    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.PARK_MAINTENANCE_SUBMITTED,
      entityType: "ParkMaintenanceRequest",
      entityId: maintenanceRequest.id,
      details: {
        parkLocation: data.parkLocation,
        issueCategory: data.issueCategory,
      }
    })

    await notifyParkMaintenanceUpdate(
      user.id,
      data.parkLocation,
      "LOGGED",
      maintenanceRequest.id
    )

    return NextResponse.json({
      message: "Maintenance request submitted successfully",
      request: {
        id: maintenanceRequest.id,
        status: maintenanceRequest.status,
        createdAt: maintenanceRequest.createdAt,
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Park maintenance request submission error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.role === "EMPLOYEE" || user.role === "ADMIN") {
      const { searchParams } = new URL(request.url)
      const statusFilter = searchParams.get("status")
      const locationFilter = searchParams.get("parkLocation")
      const categoryFilter = searchParams.get("issueCategory")
      
      const where: any = {}
      if (statusFilter) where.status = statusFilter
      if (locationFilter) where.parkLocation = locationFilter
      if (categoryFilter) where.issueCategory = categoryFilter

      const requests = await prisma.parkMaintenanceRequest.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" }
      })
      return NextResponse.json({ requests })
    }

    const requests = await prisma.parkMaintenanceRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ requests })

  } catch (error) {
    console.error("Fetch park maintenance requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
