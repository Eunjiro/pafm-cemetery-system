import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'

import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "EMPLOYEE" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const baseUrl = process.env.CEMETERY_API_BASE_URL
    const apiKey = process.env.CEMETERY_API_KEY

    if (!baseUrl || !apiKey) {
      return NextResponse.json({
        success: false,
        error: "CEMETERY_API_BASE_URL or CEMETERY_API_KEY not configured",
        env: {
          baseUrl: baseUrl ? "configured" : "missing",
          apiKey: apiKey ? "configured" : "missing"
        }
      })
    }

    console.log(`[Test] Attempting to connect to ${baseUrl}/api/external/cemeteries`)

    const response = await fetch(`${baseUrl}/api/external/cemeteries?active=true`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    const responseText = await response.text()
    console.log(`[Test] Response status: ${response.status}`)
    console.log(`[Test] Response text: ${responseText.substring(0, 500)}`)

    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.warn(`[Test] Failed to parse JSON: ${e}`)
      data = { raw: responseText }
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      data,
      message: response.ok ? "Connection successful" : "Connection failed"
    })

  } catch (error: any) {
    console.error('Test connection error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    })
  }
}
