import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"
import { saveFile } from "@/lib/upload"
import { notifyDrainageRequestUpdate } from "@/lib/notifications"

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
      requesterName: formData.get("requesterName") as string,
      contactNumber: formData.get("contactNumber") as string,
      street: formData.get("street") as string,
      barangay: formData.get("barangay") as string,
      exactLocation: (formData.get("exactLocation") as string) || null,
      issueType: formData.get("issueType") as string || "DECLOGGING",
      description: (formData.get("description") as string) || null,
      urgency: formData.get("urgency") as string || "NORMAL",
    }

    // Validate required fields
    if (!data.requesterName || !data.contactNumber || !data.street || !data.barangay) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Handle optional photo uploads
    const timestamp = Date.now()
    const folder = `drainage-requests/${user.id}`
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

    const drainageRequest = await prisma.drainageRequest.create({
      data: {
        userId: user.id,
        requesterName: data.requesterName,
        contactNumber: data.contactNumber,
        street: data.street,
        barangay: data.barangay,
        exactLocation: data.exactLocation,
        issueType: data.issueType as any,
        description: data.description,
        urgency: data.urgency as any,
        photo1: filePaths.photo1 || null,
        photo2: filePaths.photo2 || null,
        photo3: filePaths.photo3 || null,
        status: "PENDING_REVIEW",
      }
    })

    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.DRAINAGE_REQUEST_SUBMITTED,
      entityType: "DrainageRequest",
      entityId: drainageRequest.id,
      details: {
        requesterName: data.requesterName,
        barangay: data.barangay,
        issueType: data.issueType,
      }
    })

    // Notify user of submission
    await notifyDrainageRequestUpdate(
      user.id,
      `${data.street}, ${data.barangay}`,
      "PENDING_REVIEW",
      drainageRequest.id
    )

    return NextResponse.json({
      message: "Drainage request submitted successfully",
      request: {
        id: drainageRequest.id,
        status: drainageRequest.status,
        createdAt: drainageRequest.createdAt,
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Drainage request submission error:", error)
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

    // Employees/Admins can see all requests
    if (user.role === "EMPLOYEE" || user.role === "ADMIN") {
      const { searchParams } = new URL(request.url)
      const statusFilter = searchParams.get("status")
      const barangayFilter = searchParams.get("barangay")
      
      const where: any = {}
      if (statusFilter) where.status = statusFilter
      if (barangayFilter) where.barangay = barangayFilter

      const requests = await prisma.drainageRequest.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" }
      })
      return NextResponse.json({ requests })
    }

    // Regular users see only their own
    const requests = await prisma.drainageRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ requests })

  } catch (error) {
    console.error("Fetch drainage requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
