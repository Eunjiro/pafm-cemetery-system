# Cemetery Integration Guide (PAFM-C)

**Version**: 1.0  
**Last Updated**: February 10, 2026  
**Target**: This Permit Management System integrating WITH external PAFM-C Cemetery Mapping System

---

## 🎯 Overview

This guide explains how your **Death Registration and Permit Management System** integrates with the external **PAFM-C Cemetery Mapping System** for burial plot assignments.

### System Roles

| System | Responsibilities |
|--------|-----------------|
| **This System (Permit Management)** | Death registrations, burial permits, applicant management, payments, document verification |
| **PAFM-C (Cemetery Mapping)** | Cemetery/plot database, physical plot management, burial assignments, plot availability tracking |

### Integration Flow

```
Citizen applies for burial permit
         ↓
Your System: Verify → Process Payment → Approve Permit
         ↓
Your System: Send approved permit to PAFM-C with preferences
         ↓
PAFM-C: Cemetery admin reviews and assigns plot
         ↓
Your System: Poll/receive plot assignment from PAFM-C
         ↓
Your System: Notify applicant of assigned plot
```

---

## 🔐 Setup & Configuration

### 1. Get Cemetery System API Credentials

Contact the PAFM-C administrator to obtain:
- API Base URL (e.g., `https://cemetery.example.com`)
- API Key (format: `pk_...`)

### 2. Configure Environment Variables

Add to your `.env .local` file:

``env
# PAFM-C Cemetery Mapping System Integration
CEMETERY_API_BASE_URL=https://cemetery.example.com
CEMETERY_API_KEY=pk_your_api_key_here_from_pafmc_admin
```

**Security**: Never commit these credentials to version control.

### 3. Test Connection

```typescript
import { checkCemeteryApiConnection } from '@/lib/cemetery-api';

const isConnected = await checkCemeteryApiConnection();
if (!isConnected) {
  console.error('Cannot connect to cemetery system');
}
```

---

## 📋 Integration Workflow

### Step 1: Applicant Submits Burial Permit

Standard burial permit application process in your system:
1. Citizen submits death registration
2. Death registration verified and approved
3. Citizen applies for burial permit
4. Upload required documents
5. Process payment
6. Admin verifies and approves burial permit

### Step 2: Queue Permit for Cemetery Submission

When a burial permit is **approved**, automatically create a cemetery submission record:

```typescript
import { prisma } from '@/lib/prisma';

// After approving burial permit
const cemeterySubmission = await prisma.cemeteryPermitSubmission.create({
  data: {
    permitId: burialPermit.id,
    permitType: 'BURIAL',
    status: 'PENDING_SUBMISSION',
    
    deceasedFirstName: burialPermit.deceasedFirstName,
    deceasedLastName: burialPermit.deceasedLastName,
    dateOfDeath: burialPermit.deceasedDateOfDeath,
    
    applicantName: burialPermit.applicantName,
    applicantEmail: burialPermit.applicantEmail,
    
    // Plot preferences from applicant
    preferredSection: burialPermit.preferredSection,
    preferredLayer: burialPermit.preferredLayer,
    
    permitApprovedAt: new Date(),
  },
});
```

### Step 3: Admin Sends to Cemetery System

Admin navigates to `/services/cemetery/pending-permits` and sends permit to PAFM-C:

```typescript
import { submitBurialPermitToCemetery } from '@/lib/cemetery-api';

const result = await submitBurialPermitToCemetery({
  permit_id: submission.permitId,
  permit_type: 'burial',
  
  deceased_first_name: submission.deceasedFirstName,
  deceased_last_name: submission.deceasedLastName,
  date_of_death: submission.dateOfDeath.toISOString(),
  
  applicant_name: submission.applicantName,
  applicant_email: submission.applicantEmail,
  
  preferred_section: submission.preferredSection,
  preferred_layer: submission.preferredLayer,
  
  permit_approved_at: submission.permitApprovedAt.toISOString(),
});

if (result.success) {
  // Update submission status
  await prisma.cemeteryPermitSubmission.update({
    where: { id: submission.id },
    data: {
      status: 'SUBMITTED',
      submittedToCemeteryAt: new Date(),
      cemeterySystemId: result.data.permit.id,
    },
  });
}
```

### Step 4: Poll for Plot Assignment

Periodically check with PAFM-C for plot assignments:

```typescript
import { checkPermitStatus } from '@/lib/cemetery-api';

// Run this as a scheduled job (e.g., every 10 minutes)
const pendingSubmissions = await prisma.cemeteryPermitSubmission.findMany({
  where: { status: 'SUBMITTED' },
});

for (const submission of pendingSubmissions) {
  const result = await checkPermitStatus(submission.permitId);
  
  if (result.success && result.data.status === 'assigned') {
    // Update with plot assignment
    await prisma.cemeteryPermitSubmission.update({
      where: { id: submission.id },
      data: {
        status: 'ASSIGNED',
        assignedPlotNumber: result.data.assigned_plot,
        assignedCemetery: result.data.assigned_cemetery,
        assignedAt: new Date(result.data.assigned_at),
      },
    });
    
    // Notify applicant
    await sendPlotAssignmentEmail(submission);
  }
}
```

### Step 5: Notify Applicant

When plot is assigned, send notification to applicant:

```typescript
async function sendPlotAssignmentEmail(submission: CemeteryPermitSubmission) {
  await sendEmail({
    to: submission.applicantEmail,
    subject: 'Burial Plot Assigned',
    body: `
      Your burial permit (${submission.permitId}) has been assigned to:
      
      Cemetery: ${submission.assignedCemeteryName}
      Plot Number: ${submission.assignedPlotNumber}
      
      Please proceed with burial arrangements.
    `,
  });
}
```

---

## 🔌 API Client Library

The cemetery API client is located at [`lib/cemetery-api.ts`](./lib/cemetery-api.ts).

### Available Functions

#### `fetchAvailableCemeteries()`
Get list of active cemeteries from PAFM-C.

```typescript
const result = await fetchAvailableCemeteries();
if (result.success) {
  console.log(result.data); // Array of cemeteries
}
```

#### `fetchAvailablePlots(cemeteryId?)`
Get list of available plots, optionally filtered by cemetery.

```typescript
const result = await fetchAvailablePlots('cemetery-id-123');
if (result.success) {
  console.log(result.data); // Array of plots
}
```

#### `submitBurialPermitToCemetery(permit)`
Send approved burial permit to PAFM-C for plot assignment.

```typescript
const result = await submitBurialPermitToCemetery({
  permit_id: 'PERMIT-2026-001',
  permit_type: 'burial',
  deceased_first_name: 'Juan',
  deceased_last_name: 'Dela Cruz',
  date_of_death: '2026-02-01',
  applicant_name: 'Maria Dela Cruz',
  permit_approved_at: new Date().toISOString(),
});
```

#### `checkPermitStatus(permitId)`
Check if PAFM-C has assigned a plot to the permit.

```typescript
const result = await checkPermitStatus('PERMIT-2026-001');
if (result.success && result.data.status === 'assigned') {
  console.log(`Plot assigned: ${result.data.assigned_plot}`);
}
```

#### `checkCemeteryApiConnection()`
Test if cemetery API is configured and  reachable.

```typescript
const isConnected = await checkCemeteryApiConnection();
```

---

## 🗄️ Database Schema

### `CemeteryPermitSubmission` Model

Tracks permits sent to PAFM-C for plot assignment.

**Key Fields:**
- `permitId` - Reference to our internal burial permit
- `status` - Submission status (see below)
- `submittedToCemeteryAt` - When sent to PAFM-C
- `cemeterySystemId` - PAFM-C's ID for this permit
- `assignedPlotNumber` - Plot assigned by cemetery
- `assignedCemetery` - Cemetery name from PAFM-C

**Status Values:**
- `PENDING_SUBMISSION` - Approved here, not yet sent to cemetery
- `SUBMITTED` - Sent to PAFM-C, awaiting plot assignment
- `ASSIGNED` - Cemetery assigned plot
- `REJECTED` - Cemetery rejected (rare)
- `SYNC_ERROR` - API communication error

---

## 🛠️ Admin Interface

### Cemetery Submissions Dashboard

**URL**: `/services/cemetery/pending-permits`

**Features:**
- View all submissions by status
- Send pending permits to cemetery
- Sync status updates from PAFM-C
- View plot assignment details
- Track submission errors

**Access**: Admin role required

---

## ⚙️ Scheduled Tasks

### Plot Assignment Sync Job

Create a scheduled task to poll PAFM-C for plot assignments:

```typescript
// Run every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  const submissions = await prisma.cemeteryPermitSubmission.findMany({
    where: { status: 'SUBMITTED' },
  });

  for (const submission of submissions) {
    try {
      const result = await checkPermitStatus(submission.permitId);
      
      if (result.success) {
        if (result.data.status === 'assigned') {
          await updateWithAssignment(submission, result.data);
        } else if (result.data.status === 'rejected') {
          await handleRejection(submission, result.data);
        }
      }
      
      // Update last sync attempt
      await prisma.cemeteryPermitSubmission.update({
        where: { id: submission.id },
        data: { lastSyncAttempt: new Date() },
      });
    } catch (error) {
      console.error(`Sync error for ${submission.permitId}:`, error);
    }
  }
});
```

---

## 🐛 Troubleshooting

### "Cemetery API not configured"

**Problem**: Missing environment variables  
**Solution**: Set `CEMETERY_API_BASE_URL` and `CEMETERY_API_KEY` in `.env.local`

### "Failed to submit permit: 401"

**Problem**: Invalid or expired API key  
**Solution**: Contact PAFM-C admin for new API key

### "Failed to submit permit: 409 Conflict"

**Problem**: Permit with same ID already submitted  
**Solution**: Check if permit was already sent. Use a different permit ID if resubmitting.

### Submissions Stuck in "SUBMITTED" Status

**Problem**: Plot assignment sync not running  
**Solution**: 
1. Check if sync job is running
2. Manually sync via admin dashboard
3. Verify cemetery API connection

### "SYNC_ERROR" Status

**Problem**: Network issues or API errors  
**Solution**:
1. Check `syncError` field in database
2. Verify cemetery API is online
3. Retry submission after fixing issue

---

## ✅ Integration Checklist

### Initial Setup
- [ ] Received API credentials from PAFM-C administrator
- [ ] Added `CEMETERY_API_BASE_URL` and `CEMETERY_API_KEY` to `.env.local`
- [ ] Tested connection with `checkCemeteryApiConnection()`
- [ ] Ran database migrations

### Burial Permit Approval Workflow
- [ ] Create `CemeteryPermitSubmission` record when permit approved
- [ ] Queue permit with status `PENDING_SUBMISSION`
- [ ] Admin dashboard shows pending cemetery submissions

### Cemetery Submission
- [ ] Admin can view `/services/cemetery/pending-permits`
- [ ] "Send to Cemetery" button submits to PAFM-C
- [ ] Submission status updates to `SUBMITTED`
- [ ] Success/error messages displayed

### Plot Assignment Sync
- [ ] Scheduled job polls PAFM-C every 10 minutes
- [ ] Assigned plots update submission status to `ASSIGNED`
- [ ] Applicant receives email notification
- [ ] Plot details displayed in permit record

### Error Handling
- [ ] Network errors logged and retried
- [ ] Invalid submissions show clear error messages
- [ ] Sync errors tracked with `SYNC_ERROR` status
- [ ] Admins can manually retry failed submissions

---

## 📞 Support

### PAFM-C Cemetery System
- Contact cemetery system administrator for API access
- Report API issues or outages to cemetery support
- Request plot availability data from cemetery team

### Internal Issues
- Check cemetery API client library: `lib/cemetery-api.ts`
- Review submission records in database
- Check application logs for API errors

---

## 📚 Related Documentation

- [Cemetery API Client](./lib/cemetery-api.ts) - API functions
- [Database Schema](./prisma/schema.prisma) - `CemeteryPermitSubmission` model
- [Admin Dashboard](./app/services/cemetery/pending-permits/) - UI components

---

**Integration Complete!** 🎉

Your permit system is now connected to PAFM-C for automated cemetery plot assignments.
