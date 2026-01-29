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

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const formData = await request.formData()
    
    // Extract registration type
    const registrationType = (formData.get("registrationType") as string) || "REGULAR"
    const isDelayed = registrationType === "DELAYED"
    
    // Extract text fields
    const data = {
      deceasedFirstName: formData.get("deceasedFirstName") as string,
      deceasedMiddleName: formData.get("deceasedMiddleName") as string || null,
      deceasedLastName: formData.get("deceasedLastName") as string,
      deceasedDateOfBirth: new Date(formData.get("deceasedDateOfBirth") as string),
      deceasedDateOfDeath: new Date(formData.get("deceasedDateOfDeath") as string),
      deceasedPlaceOfDeath: formData.get("deceasedPlaceOfDeath") as string,
      deceasedCauseOfDeath: formData.get("deceasedCauseOfDeath") as string,
      deceasedGender: formData.get("deceasedGender") as string,
      informantName: formData.get("informantName") as string,
      informantRelation: formData.get("informantRelation") as string,
      informantContactNumber: formData.get("informantContactNumber") as string,
      informantAddress: formData.get("informantAddress") as string,
      registrationType: registrationType as "REGULAR" | "DELAYED",
      registrationFee: isDelayed ? 150.00 : 50.00,
    }

    // Validate required fields
    if (!data.deceasedFirstName || !data.deceasedLastName || !data.informantName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Handle file uploads
    const files = {
      municipalForm103: formData.get("municipalForm103") as File,
      informantValidId: formData.get("informantValidId") as File,
      swabTestResult: formData.get("swabTestResult") as File | null,
      // Delayed registration additional documents
      affidavitOfDelayed: isDelayed ? formData.get("affidavitOfDelayed") as File : null,
      burialCertificate: isDelayed ? formData.get("burialCertificate") as File : null,
      funeralCertificate: isDelayed ? formData.get("funeralCertificate") as File : null,
      psaNoRecord: isDelayed ? formData.get("psaNoRecord") as File : null,
    }

    if (!files.municipalForm103 || !files.informantValidId) {
      return NextResponse.json({ error: "Required documents missing" }, { status: 400 })
    }

    // Validate delayed registration documents
    if (isDelayed) {
      if (!files.affidavitOfDelayed || !files.burialCertificate || !files.funeralCertificate || !files.psaNoRecord) {
        return NextResponse.json({ error: "All delayed registration documents are required" }, { status: 400 })
      }
    }

    // Save files using Vercel Blob or local storage
    const timestamp = Date.now()
    const folder = `death-registrations/${user.id}`
    const filePaths: any = {}

    // Save Municipal Form 103
    filePaths.municipalForm103 = await saveFile(
      files.municipalForm103,
      folder,
      `form103_${timestamp}_${files.municipalForm103.name}`
    )

    // Save Valid ID
    filePaths.informantValidId = await saveFile(
      files.informantValidId,
      folder,
      `valid_id_${timestamp}_${files.informantValidId.name}`
    )

    // Save Swab Test (if provided)
    if (files.swabTestResult) {
      filePaths.swabTestResult = await saveFile(
        files.swabTestResult,
        folder,
        `swab_test_${timestamp}_${files.swabTestResult.name}`
      )
    }

    // Save delayed registration documents
    if (isDelayed) {
      if (files.affidavitOfDelayed) {
        filePaths.affidavitOfDelayed = await saveFile(
          files.affidavitOfDelayed,
          folder,
          `affidavit_${timestamp}_${files.affidavitOfDelayed.name}`
        )
      }

      if (files.burialCertificate) {
        filePaths.burialCertificate = await saveFile(
          files.burialCertificate,
          folder,
          `burial_${timestamp}_${files.burialCertificate.name}`
        )
      }

      if (files.funeralCertificate) {
        filePaths.funeralCertificate = await saveFile(
          files.funeralCertificate,
          folder,
          `funeral_${timestamp}_${files.funeralCertificate.name}`
        )
      }

      if (files.psaNoRecord) {
        filePaths.psaNoRecord = await saveFile(
          files.psaNoRecord,
          folder,
          `psa_no_record_${timestamp}_${files.psaNoRecord.name}`
        )
      }
    }

    // Create death registration record
    const registration = await prisma.deathRegistration.create({
      data: {
        userId: user.id,
        ...data,
        municipalForm103: filePaths.municipalForm103,
        informantValidId: filePaths.informantValidId,
        swabTestResult: filePaths.swabTestResult || null,
        affidavitOfDelayed: filePaths.affidavitOfDelayed || null,
        burialCertificate: filePaths.burialCertificate || null,
        funeralCertificate: filePaths.funeralCertificate || null,
        psaNoRecord: filePaths.psaNoRecord || null,
        status: "PENDING_VERIFICATION"
      }
    })

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: isDelayed ? AUDIT_ACTIONS.DEATH_REGISTRATION_SUBMITTED : AUDIT_ACTIONS.DEATH_REGISTRATION_SUBMITTED,
      entityType: "DeathRegistration",
      entityId: registration.id,
      details: {
        registrationType: registrationType,
        registrationFee: data.registrationFee,
        deceasedName: `${data.deceasedFirstName} ${data.deceasedLastName}`,
        informantName: data.informantName
      }
    })

    return NextResponse.json({
      message: "Death registration submitted successfully",
      registration: {
        id: registration.id,
        status: registration.status,
        createdAt: registration.createdAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Death registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET - Fetch user's submissions
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

    const registrations = await prisma.deathRegistration.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ registrations })

  } catch (error) {
    console.error("Fetch registrations error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
