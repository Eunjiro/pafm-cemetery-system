# Notification System

This document explains how the notification system works and how to use it.

## Features

✅ **Real-time notifications** - Users receive notifications when their application status changes
✅ **Unread badge counter** - Shows the number of unread notifications
✅ **Mark as read** - Users can mark individual notifications as read
✅ **Delete notifications** - Users can delete notifications they don't want anymore
✅ **Auto-refresh** - Notifications refresh automatically every 30 seconds

## Database Model

The notification system uses a dedicated `Notification` model:

```prisma
model Notification {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  title       String
  message     String
  type        String   // e.g., "death_registration", "burial_permit"
  entityId    String?  // ID of related entity
  entityType  String?  // Type of related entity
  status      String?  // Status value from the entity
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## API Endpoints

### GET `/api/notifications`
Fetches all notifications for the authenticated user.

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "title": "Death Registration Update",
      "message": "Your death registration for John Doe is now approved for payment",
      "time": "2 hours ago",
      "type": "death_registration",
      "entityId": "registration-id",
      "status": "APPROVED_FOR_PAYMENT",
      "isRead": false,
      "createdAt": "2026-02-13T10:00:00Z"
    }
  ],
  "unreadCount": 3
}
```

### POST `/api/notifications`
Creates a new notification.

**Request Body:**
```json
{
  "userId": "user-id",
  "title": "Notification Title",
  "message": "Notification message",
  "type": "notification_type",
  "entityId": "entity-id",
  "entityType": "EntityType",
  "status": "STATUS"
}
```

### PATCH `/api/notifications/[id]`
Marks a notification as read.

**Response:**
```json
{
  "notification": { /* updated notification */ }
}
```

### DELETE `/api/notifications/[id]`
Deletes a notification.

**Response:**
```json
{
  "message": "Notification deleted successfully"
}
```

## Helper Functions

Use the helper functions in `lib/notifications.ts` to create notifications automatically:

```typescript
import {
  notifyDeathRegistrationUpdate,
  notifyBurialPermitUpdate,
  notifyExhumationPermitUpdate,
  notifyCremationPermitUpdate,
  notifyDeathCertificateUpdate,
} from "@/lib/notifications"

// Example: When updating a death registration status
await notifyDeathRegistrationUpdate(
  userId,
  "John Doe",
  "APPROVED_FOR_PAYMENT",
  registrationId
)

// Example: When updating a burial permit status
await notifyBurialPermitUpdate(
  userId,
  "Jane Smith",
  "REGISTERED_FOR_PICKUP",
  permitId
)
```

## UI Components

### Navbar Component
The main navbar (`app/components/Navbar.tsx`) includes:
- Notification bell icon with unread badge
- Dropdown panel showing recent notifications
- Mark as read and delete buttons for each notification

### Services Page
The services page and cemetery dashboard also have notification dropdowns with full functionality.

## Usage in Status Updates

When updating the status of any application (death registration, permits, etc.), create a notification:

```typescript
// In your API route for status updates
import { notifyDeathRegistrationUpdate } from "@/lib/notifications"

// After updating the registration status
await prisma.deathRegistration.update({
  where: { id: registrationId },
  data: { status: newStatus }
})

// Create notification
await notifyDeathRegistrationUpdate(
  registration.userId,
  `${registration.deceasedFirstName} ${registration.deceasedLastName}`,
  newStatus,
  registrationId
)
```

## Visual Indicators

- **Unread notifications** have a blue background (`bg-blue-50`)
- **Unread count badge** shows on the notification bell (red badge)
- **99+ indicator** when there are more than 99 unread notifications
- **Button states** have hover effects for better UX

## Auto-refresh

Notifications automatically refresh:
- Every 30 seconds when user is on the page
- Immediately after marking as read or deleting
- When the dropdown is opened

## Notes

- Notifications are user-specific (each user only sees their own)
- Only authenticated users can access notifications
- Deleted notifications are permanently removed
- Mark as read is reversible (notifications stay in the list)
