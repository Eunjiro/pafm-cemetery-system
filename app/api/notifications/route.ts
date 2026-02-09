import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Fetch user's death registrations with their status updates
    const deathRegistrations = await prisma.deathRegistration.findMany({
      where: { userId },
      select: {
        id: true,
        deceasedFirstName: true,
        deceasedLastName: true,
        status: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    })

    // Fetch user's burial permits
    const burialPermits = await prisma.burialPermit.findMany({
      where: { userId },
      select: {
        id: true,
        deceasedName: true,
        status: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    })

    // Fetch user's exhumation permits
    const exhumationPermits = await prisma.exhumationPermit.findMany({
      where: { userId },
      select: {
        id: true,
        deceasedName: true,
        status: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    })

    // Fetch user's cremation permits
    const cremationPermits = await prisma.cremationPermit.findMany({
      where: { userId },
      select: {
        id: true,
        deceasedName: true,
        status: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    })

    // Format notifications
    const notifications: any[] = []

    deathRegistrations.forEach((reg) => {
      notifications.push({
        title: "Death Registration Update",
        message: `Your death registration for ${reg.deceasedFirstName} ${reg.deceasedLastName} is ${reg.status.replace(/_/g, ' ').toLowerCase()}`,
        time: formatTimeAgo(reg.updatedAt),
        type: "death_registration",
        id: reg.id,
        status: reg.status,
      })
    })

    burialPermits.forEach((permit) => {
      notifications.push({
        title: "Burial Permit Update",
        message: `Your burial permit for ${permit.deceasedName} is ${permit.status.replace(/_/g, ' ').toLowerCase()}`,
        time: formatTimeAgo(permit.updatedAt),
        type: "burial_permit",
        id: permit.id,
        status: permit.status,
      })
    })

    exhumationPermits.forEach((permit) => {
      notifications.push({
        title: "Exhumation Permit Update",
        message: `Your exhumation permit for ${permit.deceasedName} is ${permit.status.replace(/_/g, ' ').toLowerCase()}`,
        time: formatTimeAgo(permit.updatedAt),
        type: "exhumation_permit",
        id: permit.id,
        status: permit.status,
      })
    })

    cremationPermits.forEach((permit) => {
      notifications.push({
        title: "Cremation Permit Update",
        message: `Your cremation permit for ${permit.deceasedName} is ${permit.status.replace(/_/g, ' ').toLowerCase()}`,
        time: formatTimeAgo(permit.updatedAt),
        type: "cremation_permit",
        id: permit.id,
        status: permit.status,
      })
    })

    // Sort by most recent
    notifications.sort((a, b) => {
      const aTime = new Date(a.time)
      const bTime = new Date(b.time)
      return bTime.getTime() - aTime.getTime()
    })

    // Count unread (items updated in last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const unreadCount = notifications.filter((n) => {
      return new Date(n.time) > sevenDaysAgo
    }).length

    return NextResponse.json(
      { notifications: notifications.slice(0, 10), unreadCount },
      { status: 200 }
    )

  } catch (error) {
    console.error("Notifications error:", error)
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    )
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return date.toLocaleDateString()
}
