import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { auth } from "@/auth"
import { readFile } from "fs/promises"
import { existsSync } from "fs"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const filePath = searchParams.get("path")

    if (!filePath) {
      return NextResponse.json({ error: "File path required" }, { status: 400 })
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Read file
    const fileBuffer = await readFile(filePath)
    
    // Determine content type based on file extension
    const extension = filePath.split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'
    
    if (extension === 'pdf') {
      contentType = 'application/pdf'
    } else if (extension === 'jpg' || extension === 'jpeg') {
      contentType = 'image/jpeg'
    } else if (extension === 'png') {
      contentType = 'image/png'
    }

    // Return file
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filePath.split('/').pop()}"`,
      },
    })

  } catch (error) {
    console.error("View document error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
