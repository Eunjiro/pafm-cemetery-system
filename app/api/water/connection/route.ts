import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"
import { saveFile } from "@/lib/upload"
import { notifyWaterConnectionUpdate } from "@/lib/notifications"

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
      applicantName: formData.get("applicantName") as string,
      contactNumber: formData.get("contactNumber") as string,
      houseNumber: (formData.get("houseNumber") as string) || null,
      street: formData.get("street") as string,
      barangay: formData.get("barangay") as string,
      landmark: (formData.get("landmark") as string) || null,
      structureType: formData.get("structureType") as string || "RESIDENTIAL",
      propertyProofType: (formData.get("propertyProofType") as string) || null,
    }

    // Validate required fields
    if (!data.applicantName || !data.contactNumber || !data.street || !data.barangay) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Handle file uploads
    const validId = formData.get("validId") as File
    const propertyProof = formData.get("propertyProof") as File

    if (!validId || !propertyProof) {
      return NextResponse.json({ error: "Valid ID and Proof of Property are required" }, { status: 400 })
    }

    const timestamp = Date.now()
    const folder = `water-connections/${user.id}`

    const validIdPath = await saveFile(validId, folder, `valid_id_${timestamp}_${validId.name}`)
    const propertyProofPath = await saveFile(propertyProof, folder, `property_proof_${timestamp}_${propertyProof.name}`)

    const connection = await prisma.waterConnection.create({
      data: {
        userId: user.id,
        applicantName: data.applicantName,
        contactNumber: data.contactNumber,
        houseNumber: data.houseNumber,
        street: data.street,
        barangay: data.barangay,
        landmark: data.landmark,
        structureType: data.structureType as any,
        validId: validIdPath,
        propertyProof: propertyProofPath,
        propertyProofType: data.propertyProofType,
        status: "PENDING_EVALUATION",
      }
    })

    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.WATER_CONNECTION_SUBMITTED,
      entityType: "WaterConnection",
      entityId: connection.id,
      details: {
        applicantName: data.applicantName,
        barangay: data.barangay,
        structureType: data.structureType,
      }
    })

    await notifyWaterConnectionUpdate(
      user.id,
      data.applicantName,
      "PENDING_EVALUATION",
      connection.id
    )

    return NextResponse.json({
      message: "Water connection application submitted successfully",
      connection: {
        id: connection.id,
        status: connection.status,
        createdAt: connection.createdAt,
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Water connection submission error:", error)
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
      const barangayFilter = searchParams.get("barangay")
      
      const where: any = {}
      if (statusFilter) where.status = statusFilter
      if (barangayFilter) where.barangay = barangayFilter

      const connections = await prisma.waterConnection.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" }
      })
      return NextResponse.json({ connections })
    }

    const connections = await prisma.waterConnection.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ connections })

  } catch (error) {
    console.error("Fetch water connections error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
