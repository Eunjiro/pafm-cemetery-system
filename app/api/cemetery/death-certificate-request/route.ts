import { auth } from "@/auth"
export const dynamic = 'force-dynamic'
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { saveFile } from "@/lib/upload"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog"

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    
    // Extract form data
    const deceasedFullName = formData.get("deceasedFullName") as string
    const deceasedDateOfDeath = formData.get("deceasedDateOfDeath") as string
    const deceasedPlaceOfDeath = formData.get("deceasedPlaceOfDeath") as string
    const requesterName = formData.get("requesterName") as string
    const requesterRelation = formData.get("requesterRelation") as string
    const requesterContactNumber = formData.get("requesterContactNumber") as string
    const requesterAddress = formData.get("requesterAddress") as string
    const purpose = formData.get("purpose") as string
    const numberOfCopies = parseInt(formData.get("numberOfCopies") as string) || 1
    
    // Files
    const validIdFile = formData.get("validId") as File
    const authorizationLetterFile = formData.get("authorizationLetter") as File | null
    
    // Validate required fields
    if (!deceasedFullName || !deceasedDateOfDeath || !deceasedPlaceOfDeath ||
        !requesterName || !requesterRelation || !requesterContactNumber ||
        !requesterAddress || !purpose || !validIdFile) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 }
      )
    }

    // Save files using Vercel Blob storage
    const folder = `death-certificate-requests/${session.user.id!}`
    const timestamp = Date.now()
    
    const validIdPath = await saveFile(
      validIdFile,
      folder,
      `validId_${timestamp}_${validIdFile.name}`
    )
    
    let authorizationLetterPath = null
    if (authorizationLetterFile) {
      authorizationLetterPath = await saveFile(
        authorizationLetterFile,
        folder,
        `authLetter_${timestamp}_${authorizationLetterFile.name}`
      )
    }

    // Calculate fees
    const certificateFee = 50.00 // First copy
    const additionalCopiesFee = (numberOfCopies - 1) * 50.00
    const totalFee = certificateFee + additionalCopiesFee

    // Create death certificate request
    const certificateRequest = await prisma.deathCertificateRequest.create({
      data: {
        userId: session.user.id!,
        deceasedFullName,
        deceasedDateOfDeath: new Date(deceasedDateOfDeath),
        deceasedPlaceOfDeath,
        requesterName,
        requesterRelation,
        requesterContactNumber,
        requesterAddress,
        purpose,
        numberOfCopies,
        validId: validIdPath,
        authorizationLetter: authorizationLetterPath,
        certificateFee,
        additionalCopiesFee,
        totalFee,
        status: "PENDING_VERIFICATION"
      }
    })

    // Create audit log
    await createAuditLog({
      userId: session.user.id!,
      action: AUDIT_ACTIONS.DEATH_CERTIFICATE_REQUEST_SUBMITTED,
      entityType: "DeathCertificateRequest",
      entityId: certificateRequest.id,
      details: {
        deceasedFullName,
        numberOfCopies,
        totalFee,
        requesterRelation
      }
    })

    return NextResponse.json({
      success: true,
      requestId: certificateRequest.id,
      message: "Death certificate request submitted successfully"
    })

  } catch (error) {
    console.error("Error submitting death certificate request:", error)
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 }
    )
  }
}

// GET - Fetch user's certificate requests
export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const requests = await prisma.deathCertificateRequest.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({ requests })

  } catch (error) {
    console.error("Error fetching certificate requests:", error)
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    )
  }
}
