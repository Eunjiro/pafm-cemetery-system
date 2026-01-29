import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    // Get API key from header
    const apiKey = req.headers.get("x-api-key")
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required. Include 'x-api-key' header." },
        { status: 401 }
      )
    }

    // Verify API key
    const validKey = await prisma.apiKey.findUnique({
      where: { key: apiKey, isActive: true }
    })

    if (!validKey) {
      return NextResponse.json(
        { error: "Invalid or inactive API key" },
        { status: 403 }
      )
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: validKey.id },
      data: { lastUsedAt: new Date() }
    })

    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const upcoming = searchParams.get("upcoming") // "true" for upcoming events only
    const limit = parseInt(searchParams.get("limit") || "100")

    // Build query filters
    const where: any = {}

    if (category) {
      where.category = category
    }

    if (startDate || endDate) {
      where.eventDate = {}
      if (startDate) {
        where.eventDate.gte = new Date(startDate)
      }
      if (endDate) {
        where.eventDate.lte = new Date(endDate)
      }
    }

    if (upcoming === "true") {
      where.eventDate = {
        ...where.eventDate,
        gte: new Date()
      }
    }

    // Fetch events
    const events = await prisma.event.findMany({
      where,
      orderBy: {
        eventDate: "asc"
      },
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        eventDate: true,
        location: true,
        category: true,
        createdAt: true
      }
    })

    // Format response for notifications
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      eventDate: event.eventDate.toISOString(),
      location: event.location,
      category: event.category,
      // Notification-friendly fields
      notificationTitle: `Cemetery Event: ${event.title}`,
      notificationBody: `${event.description} - ${event.location} on ${new Date(event.eventDate).toLocaleDateString()}`,
      daysUntilEvent: Math.ceil((event.eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    }))

    return NextResponse.json({
      success: true,
      count: formattedEvents.length,
      events: formattedEvents,
      metadata: {
        generatedAt: new Date().toISOString(),
        filters: {
          category: category || "all",
          startDate: startDate || null,
          endDate: endDate || null,
          upcoming: upcoming === "true"
        }
      }
    })

  } catch (error) {
    console.error("Error fetching public events:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
