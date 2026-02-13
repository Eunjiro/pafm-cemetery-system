import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"
import { saveFile } from "@/lib/upload"
import { notifyWaterIssueUpdate } from "@/lib/notifications"

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
      reporterName: formData.get("reporterName") as string,
      address: formData.get("address") as string,
      contactNumber: formData.get("contactNumber") as string,
      issueType: formData.get("issueType") as string || "NO_WATER",
      description: (formData.get("description") as string) || null,
    }

    // Validate required fields
    if (!data.reporterName || !data.address || !data.contactNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Handle optional photo uploads
    const timestamp = Date.now()
    const folder = `water-issues/${user.id}`
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

    const issue = await prisma.waterIssue.create({
      data: {
        userId: user.id,
        reporterName: data.reporterName,
        address: data.address,
        contactNumber: data.contactNumber,
        issueType: data.issueType as any,
        description: data.description,
        photo1: filePaths.photo1 || null,
        photo2: filePaths.photo2 || null,
        photo3: filePaths.photo3 || null,
        status: "PENDING_INSPECTION",
      }
    })

    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.WATER_ISSUE_SUBMITTED,
      entityType: "WaterIssue",
      entityId: issue.id,
      details: {
        reporterName: data.reporterName,
        address: data.address,
        issueType: data.issueType,
      }
    })

    await notifyWaterIssueUpdate(
      user.id,
      data.issueType,
      "PENDING_INSPECTION",
      issue.id
    )

    return NextResponse.json({
      message: "Water issue report submitted successfully",
      issue: {
        id: issue.id,
        status: issue.status,
        createdAt: issue.createdAt,
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Water issue submission error:", error)
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
      const issueTypeFilter = searchParams.get("issueType")
      
      const where: any = {}
      if (statusFilter) where.status = statusFilter
      if (issueTypeFilter) where.issueType = issueTypeFilter

      const issues = await prisma.waterIssue.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" }
      })
      return NextResponse.json({ issues })
    }

    const issues = await prisma.waterIssue.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ issues })

  } catch (error) {
    console.error("Fetch water issues error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
