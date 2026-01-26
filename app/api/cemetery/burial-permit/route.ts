import { NextRequest, NextResponse } from "next/server"
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
    
    // Extract burial type and calculate fees
    const burialType = formData.get("burialType") as string
    const nicheType = formData.get("nicheType") as string | null
    const isFromAnotherLGU = formData.get("isFromAnotherLGU") === "true"
    
    let permitFee = 100.00
    let nicheFee = 0
    let totalFee = 100.00
    
    if (burialType === "NICHE" && nicheType) {
      nicheFee = nicheType === "CHILD" ? 750 : 1500
      totalFee = permitFee + nicheFee
    }
    
    // Extract text fields
    const data = {
      deceasedName: formData.get("deceasedName") as string,
      deceasedDateOfDeath: new Date(formData.get("deceasedDateOfDeath") as string),
      requesterName: formData.get("requesterName") as string,
      requesterRelation: formData.get("requesterRelation") as string,
      requesterContactNumber: formData.get("requesterContactNumber") as string,
      requesterAddress: formData.get("requesterAddress") as string,
      burialType: burialType as "BURIAL" | "ENTRANCE" | "NICHE",
      nicheType: nicheType as "CHILD" | "ADULT" | null,
      cemeteryLocation: formData.get("cemeteryLocation") as string,
      isFromAnotherLGU: isFromAnotherLGU,
      permitFee: permitFee,
      nicheFee: nicheFee > 0 ? nicheFee : null,
      totalFee: totalFee,
    }

    // Validate required fields
    if (!data.deceasedName || !data.requesterName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Handle file uploads
    const uploadDir = join(process.cwd(), "uploads", "burial-permits", user.id)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const files = {
      deathCertificate: formData.get("deathCertificate") as File,
      transferPermit: formData.get("transferPermit") as File | null,
      affidavitOfUndertaking: formData.get("affidavitOfUndertaking") as File | null,
      burialForm: formData.get("burialForm") as File,
      validId: formData.get("validId") as File,
    }

    if (!files.deathCertificate || !files.burialForm || !files.validId) {
      return NextResponse.json({ error: "Required documents missing" }, { status: 400 })
    }

    // Save files
    const timestamp = Date.now()
    const filePaths: any = {}

    // Save Death Certificate
    const deathCertBuffer = Buffer.from(await files.deathCertificate.arrayBuffer())
    const deathCertPath = join(uploadDir, `death_cert_${timestamp}_${files.deathCertificate.name}`)
    await writeFile(deathCertPath, deathCertBuffer)
    filePaths.deathCertificate = deathCertPath

    // Save Burial Form
    const burialFormBuffer = Buffer.from(await files.burialForm.arrayBuffer())
    const burialFormPath = join(uploadDir, `burial_form_${timestamp}_${files.burialForm.name}`)
    await writeFile(burialFormPath, burialFormBuffer)
    filePaths.burialForm = burialFormPath

    // Save Valid ID
    const validIdBuffer = Buffer.from(await files.validId.arrayBuffer())
    const validIdPath = join(uploadDir, `valid_id_${timestamp}_${files.validId.name}`)
    await writeFile(validIdPath, validIdBuffer)
    filePaths.validId = validIdPath

    // Save Transfer Permit (if provided)
    if (files.transferPermit) {
      const transferPermitBuffer = Buffer.from(await files.transferPermit.arrayBuffer())
      const transferPermitPath = join(uploadDir, `transfer_permit_${timestamp}_${files.transferPermit.name}`)
      await writeFile(transferPermitPath, transferPermitBuffer)
      filePaths.transferPermit = transferPermitPath
    }

    // Save Affidavit of Undertaking (if provided)
    if (files.affidavitOfUndertaking) {
      const affidavitBuffer = Buffer.from(await files.affidavitOfUndertaking.arrayBuffer())
      const affidavitPath = join(uploadDir, `affidavit_${timestamp}_${files.affidavitOfUndertaking.name}`)
      await writeFile(affidavitPath, affidavitBuffer)
      filePaths.affidavitOfUndertaking = affidavitPath
    }

    // Create burial permit record
    const permit = await prisma.burialPermit.create({
      data: {
        userId: user.id,
        ...data,
        deathCertificate: filePaths.deathCertificate,
        burialForm: filePaths.burialForm,
        validId: filePaths.validId,
        transferPermit: filePaths.transferPermit || null,
        affidavitOfUndertaking: filePaths.affidavitOfUndertaking || null,
        status: "PENDING_VERIFICATION"
      }
    })

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.BURIAL_PERMIT_SUBMITTED,
      entityType: "BurialPermit",
      entityId: permit.id,
      details: {
        burialType: data.burialType,
        totalFee: data.totalFee,
        deceasedName: data.deceasedName,
        requesterName: data.requesterName
      }
    })

    return NextResponse.json({
      message: "Burial permit request submitted successfully",
      permit: {
        id: permit.id,
        status: permit.status,
        totalFee: permit.totalFee,
        createdAt: permit.createdAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Burial permit submission error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET - Fetch user's burial permit submissions
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

    const permits = await prisma.burialPermit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ permits })

  } catch (error) {
    console.error("Fetch burial permits error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
