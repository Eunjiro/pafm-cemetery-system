import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
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
    const uploadDir = join(process.cwd(), "uploads", "cremation-permits", user.id)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const files = {
      deathCertificate: formData.get("deathCertificate") as File,
      cremationForm: formData.get("cremationForm") as File,
      transferPermit: formData.get("transferPermit") as File | null,
      validId: formData.get("validId") as File,
    }

    if (!files.deathCertificate || !files.cremationForm || !files.validId) {
      return NextResponse.json({ error: "Required documents missing" }, { status: 400 })
    }

    // Save files
    const timestamp = Date.now()
    const filePaths: any = {}

    // Death Certificate
    const deathCertBuffer = Buffer.from(await files.deathCertificate.arrayBuffer())
    const deathCertPath = join(uploadDir, `death_cert_${timestamp}_${files.deathCertificate.name}`)
    await writeFile(deathCertPath, deathCertBuffer)
    filePaths.deathCertificate = deathCertPath

    // Cremation Form
    const cremationFormBuffer = Buffer.from(await files.cremationForm.arrayBuffer())
    const cremationFormPath = join(uploadDir, `cremation_form_${timestamp}_${files.cremationForm.name}`)
    await writeFile(cremationFormPath, cremationFormBuffer)
    filePaths.cremationForm = cremationFormPath

    // Transfer Permit (optional)
    if (files.transferPermit) {
      const transferBuffer = Buffer.from(await files.transferPermit.arrayBuffer())
      const transferPath = join(uploadDir, `transfer_${timestamp}_${files.transferPermit.name}`)
      await writeFile(transferPath, transferBuffer)
      filePaths.transferPermit = transferPath
    }

    // Valid ID
    const validIdBuffer = Buffer.from(await files.validId.arrayBuffer())
    const validIdPath = join(uploadDir, `valid_id_${timestamp}_${files.validId.name}`)
    await writeFile(validIdPath, validIdBuffer)
    filePaths.validId = validIdPath

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
