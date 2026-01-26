import { prisma } from "./prisma"

export interface AuditLogData {
  userId: string
  action: string
  entityType: string
  entityId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        details: data.details ? JSON.stringify(data.details) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
      }
    })
  } catch (error) {
    // Log error but don't throw - audit logging shouldn't break main functionality
    console.error("Failed to create audit log:", error)
  }
}

// Audit action constants
export const AUDIT_ACTIONS = {
  // Death Registration
  DEATH_REGISTRATION_SUBMITTED: "DEATH_REGISTRATION_SUBMITTED",
  DEATH_REGISTRATION_APPROVED: "DEATH_REGISTRATION_APPROVED",
  DEATH_REGISTRATION_REJECTED: "DEATH_REGISTRATION_REJECTED",
  DEATH_REGISTRATION_RETURNED: "DEATH_REGISTRATION_RETURNED",
  PAYMENT_SUBMITTED: "PAYMENT_SUBMITTED",
  PAYMENT_CONFIRMED: "PAYMENT_CONFIRMED",
  PAYMENT_REJECTED: "PAYMENT_REJECTED",
  CERTIFICATE_READY: "CERTIFICATE_READY",
  CERTIFICATE_COMPLETED: "CERTIFICATE_COMPLETED",
  
  // Burial Permit
  BURIAL_PERMIT_SUBMITTED: "BURIAL_PERMIT_SUBMITTED",
  BURIAL_PERMIT_APPROVED: "BURIAL_PERMIT_APPROVED",
  BURIAL_PERMIT_REJECTED: "BURIAL_PERMIT_REJECTED",
  BURIAL_PERMIT_PAYMENT_CONFIRMED: "BURIAL_PERMIT_PAYMENT_CONFIRMED",
  BURIAL_PERMIT_READY: "BURIAL_PERMIT_READY",
  BURIAL_PERMIT_COMPLETED: "BURIAL_PERMIT_COMPLETED",
  
  // Exhumation Permit
  EXHUMATION_PERMIT_SUBMITTED: "EXHUMATION_PERMIT_SUBMITTED",
  EXHUMATION_PERMIT_APPROVED: "EXHUMATION_PERMIT_APPROVED",
  EXHUMATION_PERMIT_REJECTED: "EXHUMATION_PERMIT_REJECTED",
  EXHUMATION_PERMIT_PAYMENT_CONFIRMED: "EXHUMATION_PERMIT_PAYMENT_CONFIRMED",
  EXHUMATION_PERMIT_READY: "EXHUMATION_PERMIT_READY",
  EXHUMATION_PERMIT_COMPLETED: "EXHUMATION_PERMIT_COMPLETED",
  
  // User Management
  USER_REGISTERED: "USER_REGISTERED",
  USER_LOGIN: "USER_LOGIN",
  USER_LOGOUT: "USER_LOGOUT",
  USER_UPDATED: "USER_UPDATED",
  USER_DELETED: "USER_DELETED",
} as const
