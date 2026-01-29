import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"
import { saveFile } from "@/lib/upload"

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
    const files = {
      exhumationLetter: formData.get("exhumationLetter") as File,
      deathCertificate: formData.get("deathCertificate") as File,
      validId: formData.get("validId") as File,
    }

    if (!files.exhumationLetter || !files.deathCertificate || !files.validId) {
      return NextResponse.json({ error: "Required documents missing" }, { status: 400 })
    }

    // Save files using Vercel Blob or local storage
    const timestamp = Date.now()
    const folder = `exhumation-permits/${user.id}`
    const filePaths: any = {}

    // Save Exhumation Letter
    filePaths.exhumationLetter = await saveFile(
      files.exhumationLetter,
      folder,
      `exhumation_letter_${timestamp}_${files.exhumationLetter.name}`
    )

    // Save Death Certificate
    filePaths.deathCertificate = await saveFile(
      files.deathCertificate,
      folder,
      `death_cert_${timestamp}_${files.deathCertificate.name}`
    )

    // Save Valid ID
    filePaths.validId = await saveFile(
      files.validId,
      folder,
      `valid_id_${timestamp}_${files.validId.name}`
    )

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
