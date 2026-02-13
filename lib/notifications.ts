import { prisma } from "./prisma"

/**
 * Helper function to create a notification for a user
 */
export async function createNotification({
  userId,
  title,
  message,
  type,
  entityId,
  entityType,
  status,
}: {
  userId: string
  title: string
  message: string
  type: string
  entityId?: string
  entityType?: string
  status?: string
}) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        entityId,
        entityType,
        status,
      },
    })
  } catch (error) {
    console.error("Failed to create notification:", error)
  }
}

/**
 * Create notification for death registration status change
 */
export async function notifyDeathRegistrationUpdate(
  userId: string,
  deceasedName: string,
  status: string,
  registrationId: string
) {
  return createNotification({
    userId,
    title: "Death Registration Update",
    message: `Your death registration for ${deceasedName} is now ${status.replace(/_/g, ' ').toLowerCase()}`,
    type: "death_registration",
    entityId: registrationId,
    entityType: "DeathRegistration",
    status,
  })
}

/**
 * Create notification for burial permit status change
 */
export async function notifyBurialPermitUpdate(
  userId: string,
  deceasedName: string,
  status: string,
  permitId: string
) {
  return createNotification({
    userId,
    title: "Burial Permit Update",
    message: `Your burial permit for ${deceasedName} is now ${status.replace(/_/g, ' ').toLowerCase()}`,
    type: "burial_permit",
    entityId: permitId,
    entityType: "BurialPermit",
    status,
  })
}

/**
 * Create notification for exhumation permit status change
 */
export async function notifyExhumationPermitUpdate(
  userId: string,
  deceasedName: string,
  status: string,
  permitId: string
) {
  return createNotification({
    userId,
    title: "Exhumation Permit Update",
    message: `Your exhumation permit for ${deceasedName} is now ${status.replace(/_/g, ' ').toLowerCase()}`,
    type: "exhumation_permit",
    entityId: permitId,
    entityType: "ExhumationPermit",
    status,
  })
}

/**
 * Create notification for cremation permit status change
 */
export async function notifyCremationPermitUpdate(
  userId: string,
  deceasedName: string,
  status: string,
  permitId: string
) {
  return createNotification({
    userId,
    title: "Cremation Permit Update",
    message: `Your cremation permit for ${deceasedName} is now ${status.replace(/_/g, ' ').toLowerCase()}`,
    type: "cremation_permit",
    entityId: permitId,
    entityType: "CremationPermit",
    status,
  })
}

/**
 * Create notification for death certificate request status change
 */
export async function notifyDeathCertificateUpdate(
  userId: string,
  deceasedName: string,
  status: string,
  requestId: string
) {
  return createNotification({
    userId,
    title: "Death Certificate Request Update",
    message: `Your death certificate request for ${deceasedName} is now ${status.replace(/_/g, ' ').toLowerCase()}`,
    type: "death_certificate_request",
    entityId: requestId,
    entityType: "DeathCertificateRequest",
    status,
  })
}

/**
 * Create notification for drainage request status change
 */
export async function notifyDrainageRequestUpdate(
  userId: string,
  location: string,
  status: string,
  requestId: string
) {
  const statusMessages: Record<string, string> = {
    PENDING_REVIEW: "pending review",
    INSPECTION_SCHEDULED: "scheduled for inspection",
    INSPECTION_COMPLETED: "inspection completed",
    FOR_APPROVAL: "for approval",
    APPROVED_WITH_MATERIALS: "approved – materials available",
    PENDING_NO_MATERIALS: "pending – awaiting materials",
    FOR_IMPLEMENTATION: "approved for implementation",
    IN_PROGRESS: "work in progress",
    COMPLETED: "completed",
    REJECTED: "rejected",
  }
  return createNotification({
    userId,
    title: "Drainage Request Update",
    message: `Your drainage request for ${location} is now ${statusMessages[status] || status.replace(/_/g, ' ').toLowerCase()}`,
    type: "drainage_request",
    entityId: requestId,
    entityType: "DrainageRequest",
    status,
  })
}

/**
 * Create notification for water connection application status change
 */
export async function notifyWaterConnectionUpdate(
  userId: string,
  applicantName: string,
  status: string,
  connectionId: string
) {
  const statusMessages: Record<string, string> = {
    PENDING_EVALUATION: "pending evaluation",
    RETURNED_INCOMPLETE: "returned – incomplete requirements",
    FOR_INSPECTION: "scheduled for inspection",
    FOR_BILLING: "for billing/quotation",
    AWAITING_PAYMENT: "awaiting payment at cashier",
    PAYMENT_CONFIRMED: "payment confirmed – for installation",
    INSTALLATION_SCHEDULED: "installation scheduled",
    INSTALLATION_ONGOING: "installation in progress",
    ACTIVE_CONNECTION: "active connection installed",
    REJECTED: "rejected",
  }
  return createNotification({
    userId,
    title: "Water Connection Update",
    message: `Your water connection application is now ${statusMessages[status] || status.replace(/_/g, ' ').toLowerCase()}`,
    type: "water_connection",
    entityId: connectionId,
    entityType: "WaterConnection",
    status,
  })
}

/**
 * Create notification for water issue report status change
 */
export async function notifyWaterIssueUpdate(
  userId: string,
  issueType: string,
  status: string,
  issueId: string
) {
  const statusMessages: Record<string, string> = {
    PENDING_INSPECTION: "logged – pending inspection",
    FOR_SITE_INSPECTION: "scheduled for site inspection",
    RESOLVED_DUPLICATE: "resolved (duplicate report)",
    FOR_REPAIR: "for repair",
    FOR_SCHEDULING: "scheduling repair",
    AWAITING_PARTS: "awaiting parts/materials",
    REPAIR_IN_PROGRESS: "repair in progress",
    RESOLVED: "resolved",
    CANNOT_REPAIR: "escalated to engineering team",
    CLOSED: "closed",
  }
  return createNotification({
    userId,
    title: "Water Issue Report Update",
    message: `Your water issue report (${issueType.replace(/_/g, ' ').toLowerCase()}) is now ${statusMessages[status] || status.replace(/_/g, ' ').toLowerCase()}`,
    type: "water_issue",
    entityId: issueId,
    entityType: "WaterIssue",
    status,
  })
}

/**
 * Create notification for amenity reservation status change
 */
export async function notifyAmenityReservationUpdate(
  userId: string,
  amenityType: string,
  status: string,
  reservationId: string
) {
  const statusMessages: Record<string, string> = {
    PENDING_REVIEW: "pending review",
    AWAITING_PAYMENT: "awaiting payment",
    PAYMENT_VERIFIED: "payment verified",
    APPROVED: "approved – reservation confirmed",
    REJECTED: "rejected – slot unavailable",
    CANCELLED: "cancelled",
    CHECKED_IN: "checked in",
    NO_SHOW: "marked as no-show",
    COMPLETED: "completed",
  }
  return createNotification({
    userId,
    title: "Amenity Reservation Update",
    message: `Your ${amenityType.replace(/_/g, ' ').toLowerCase()} reservation is now ${statusMessages[status] || status.replace(/_/g, ' ').toLowerCase()}`,
    type: "amenity_reservation",
    entityId: reservationId,
    entityType: "AmenityReservation",
    status,
  })
}

/**
 * Create notification for venue booking status change
 */
export async function notifyVenueBookingUpdate(
  userId: string,
  venueName: string,
  status: string,
  bookingId: string
) {
  const statusMessages: Record<string, string> = {
    PENDING_REVIEW: "pending review",
    AWAITING_REQUIREMENTS: "awaiting requirements",
    AWAITING_PAYMENT: "awaiting payment",
    PAYMENT_VERIFIED: "payment verified",
    APPROVED: "approved – reservation confirmed",
    REJECTED: "rejected – date unavailable",
    CANCELLED: "cancelled",
    IN_USE: "venue currently in use",
    COMPLETED: "completed",
    NO_SHOW: "marked as no-show",
  }
  return createNotification({
    userId,
    title: "Venue Booking Update",
    message: `Your venue booking for ${venueName.replace(/_/g, ' ').toLowerCase()} is now ${statusMessages[status] || status.replace(/_/g, ' ').toLowerCase()}`,
    type: "venue_booking",
    entityId: bookingId,
    entityType: "VenueBooking",
    status,
  })
}

/**
 * Create notification for facility reservation status change
 */
export async function notifyFacilityReservationUpdate(
  userId: string,
  facilityType: string,
  status: string,
  reservationId: string
) {
  const statusMessages: Record<string, string> = {
    PENDING_REVIEW: "submitted – under review",
    AWAITING_REQUIREMENTS: "awaiting additional requirements",
    AWAITING_PAYMENT: "awaiting payment",
    PAYMENT_VERIFIED: "payment verified",
    APPROVED: "approved – booking confirmed",
    REJECTED: "rejected – schedule unavailable or incomplete requirements",
    CANCELLED: "cancelled",
    IN_USE: "facility currently in use",
    COMPLETED: "completed – no issues",
    COMPLETED_WITH_DAMAGES: "completed – with damages noted",
    NO_SHOW: "marked as no-show",
  }
  return createNotification({
    userId,
    title: "Facility Reservation Update",
    message: `Your facility reservation for ${facilityType.replace(/_/g, ' ').toLowerCase()} is now ${statusMessages[status] || status.replace(/_/g, ' ').toLowerCase()}`,
    type: "facility_reservation",
    entityId: reservationId,
    entityType: "FacilityReservation",
    status,
  })
}

/**
 * Create notification for park maintenance request status change
 */
export async function notifyParkMaintenanceUpdate(
  userId: string,
  parkLocation: string,
  status: string,
  requestId: string
) {
  const statusMessages: Record<string, string> = {
    LOGGED: "logged – pending inspection",
    PENDING_INSPECTION: "pending inspection",
    UNDER_INSPECTION: "under inspection",
    APPROVED_FOR_REPAIR: "approved for repair",
    PENDING_MATERIALS: "pending materials / budget",
    PENDING_CONTRACTOR: "pending contractor",
    IN_PROGRESS: "repair in progress",
    COMPLETED: "completed",
    CLOSED: "closed",
    REJECTED: "rejected",
  }
  return createNotification({
    userId,
    title: "Park Maintenance Update",
    message: `Your maintenance report for ${parkLocation} is now ${statusMessages[status] || status.replace(/_/g, ' ').toLowerCase()}`,
    type: "park_maintenance",
    entityId: requestId,
    entityType: "ParkMaintenanceRequest",
    status,
  })
}
