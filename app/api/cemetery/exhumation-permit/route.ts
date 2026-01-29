import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"

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
      deceasedDateOfBurial: new Date(formData.get("deceasedDateOfBurial") as string),
      deceasedPlaceOfBurial: formData.get("deceasedPlaceOfBurial") as string,
      requesterName: formData.get("requesterName") as string,
      requesterRelation: formData.get("requesterRelation") as string,
      requesterContactNumber: formData.get("requesterContactNumber") as string,
      requesterAddress: formData.get("requesterAddress") as string,
      reasonForExhumation: formData.get("reasonForExhumation") as string,
      permitFee: 100.00,
    }

    // Validate required fields
    if (!data.deceasedName || !data.requesterName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Handle file uploads
    const uploadDir = join(process.cwd(), "uploads", "exhumation-permits", user.id)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const files = {
      exhumationLetter: formData.get("exhumationLetter") as File,
      deathCertificate: formData.get("deathCertificate") as File,
      validId: formData.get("validId") as File,
    }

    if (!files.exhumationLetter || !files.deathCertificate || !files.validId) {
      return NextResponse.json({ error: "Required documents missing" }, { status: 400 })
    }

    // Save files
    const timestamp = Date.now()
    const filePaths: any = {}

    // Save Exhumation Letter
    const exhumationLetterBuffer = Buffer.from(await files.exhumationLetter.arrayBuffer())
    const exhumationLetterPath = join(uploadDir, `exhumation_letter_${timestamp}_${files.exhumationLetter.name}`)
    await writeFile(exhumationLetterPath, exhumationLetterBuffer)
    filePaths.exhumationLetter = exhumationLetterPath

    // Save Death Certificate
    const deathCertBuffer = Buffer.from(await files.deathCertificate.arrayBuffer())
    const deathCertPath = join(uploadDir, `death_cert_${timestamp}_${files.deathCertificate.name}`)
    await writeFile(deathCertPath, deathCertBuffer)
    filePaths.deathCertificate = deathCertPath

    // Save Valid ID
    const validIdBuffer = Buffer.from(await files.validId.arrayBuffer())
    const validIdPath = join(uploadDir, `valid_id_${timestamp}_${files.validId.name}`)
    await writeFile(validIdPath, validIdBuffer)
    filePaths.validId = validIdPath

    // Create exhumation permit record
    const permit = await prisma.exhumationPermit.create({
      data: {
        userId: user.id,
        ...data,
        exhumationLetter: filePaths.exhumationLetter,
        deathCertificate: filePaths.deathCertificate,
        validId: filePaths.validId,
        status: "PENDING_VERIFICATION"
      }
    })

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.EXHUMATION_PERMIT_SUBMITTED,
      entityType: "ExhumationPermit",
      entityId: permit.id,
      details: {
        deceasedName: data.deceasedName,
        requesterName: data.requesterName,
        permitFee: data.permitFee
      }
    })

    return NextResponse.json({
      message: "Exhumation permit request submitted successfully",
      permit: {
        id: permit.id,
        status: permit.status,
        permitFee: permit.permitFee,
        createdAt: permit.createdAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Exhumation permit submission error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET - Fetch user's exhumation permit submissions
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

    const permits = await prisma.exhumationPermit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ permits })

  } catch (error) {
    console.error("Fetch exhumation permits error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
