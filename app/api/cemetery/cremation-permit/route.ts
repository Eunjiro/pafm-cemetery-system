import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { saveFile } from "@/lib/upload"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"

export async function GET() {
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

    const permits = await prisma.cremationPermit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ permits })
  } catch (error) {
    console.error("Error fetching cremation permits:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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
    
    // Extract text fields
    const data = {
      deceasedName: formData.get("deceasedName") as string,
      deceasedDateOfDeath: new Date(formData.get("deceasedDateOfDeath") as string),
      requesterName: formData.get("requesterName") as string,
      requesterRelation: formData.get("requesterRelation") as string,
      requesterContactNumber: formData.get("requesterContactNumber") as string,
      requesterAddress: formData.get("requesterAddress") as string,
      funeralHomeName: (formData.get("funeralHomeName") as string) || null,
      funeralHomeContact: (formData.get("funeralHomeContact") as string) || null,
    }

    // Validate required fields
    if (!data.deceasedName || !data.requesterName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Handle file uploads
    const files = {
      deathCertificate: formData.get("deathCertificate") as File,
      cremationForm: formData.get("cremationForm") as File,
      transferPermit: formData.get("transferPermit") as File | null,
      validId: formData.get("validId") as File,
    }

    if (!files.deathCertificate || !files.cremationForm || !files.validId) {
      return NextResponse.json({ error: "Required documents missing" }, { status: 400 })
    }

    // Save files using Vercel Blob storage
    const timestamp = Date.now()
    const folder = `cremation-permits/${user.id}`
    const filePaths: any = {}

    // Death Certificate
    filePaths.deathCertificate = await saveFile(
      files.deathCertificate,
      folder,
      `death_cert_${timestamp}_${files.deathCertificate.name}`
    )

    // Cremation Form
    filePaths.cremationForm = await saveFile(
      files.cremationForm,
      folder,
      `cremation_form_${timestamp}_${files.cremationForm.name}`
    )

    // Transfer Permit (optional)
    if (files.transferPermit) {
      filePaths.transferPermit = await saveFile(
        files.transferPermit,
        folder,
        `transfer_${timestamp}_${files.transferPermit.name}`
      )
    }

    // Valid ID
    filePaths.validId = await saveFile(
      files.validId,
      folder,
      `valid_id_${timestamp}_${files.validId.name}`
    )

    // Create cremation permit
    const permit = await prisma.cremationPermit.create({
      data: {
        userId: user.id,
        ...data,
        ...filePaths,
        status: "PENDING_VERIFICATION",
        permitFee: 100.00,
      }
    })

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: "CREMATION_PERMIT_SUBMITTED",
      entityType: "CremationPermit",
      entityId: permit.id,
      details: {
        deceasedName: data.deceasedName,
        requesterName: data.requesterName,
      }
    })

    return NextResponse.json({
      message: "Cremation permit submitted successfully",
      permit
    })

  } catch (error) {
    console.error("Cremation permit submission error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
