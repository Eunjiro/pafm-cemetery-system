# PAFM Cemetery Services - AI Agent Instructions

## Project Overview
Next.js 16 (App Router) application for Quezon City Cemetery and Burial Management. Handles death registrations (regular + delayed), burial permits, and exhumation permits with role-based workflows (USER, EMPLOYEE, ADMIN).

## Architecture & Key Components

### Authentication & Authorization
- **NextAuth v5 (beta.30)** with JWT strategy in `auth.ts`
- Session extended with `role` field (see `types/next-auth.d.ts`)
- All API routes require `await auth()` session check
- Role checks: `EMPLOYEE` and `ADMIN` can process submissions; `USER` submits applications
- Auth pages: `/login` (sign in), `/register` (new users), `/dashboard` (protected)

### Database Layer
- **Prisma ORM** with PostgreSQL (`lib/prisma.ts`)
- Models: `User`, `DeathRegistration`, `BurialPermit`, `ExhumationPermit`, `Transaction`, `AuditLog`
- Registration types: `REGULAR` (₱50) vs `DELAYED` (₱150, requires 4 extra documents)
- Burial types: `BURIAL`/`ENTRANCE` (₱100) vs `NICHE` (₱100 + ₱750/₱1500 niche fee)

### Status Workflow Pattern
All permit/registration models follow this state machine:
```
PENDING_VERIFICATION → (verification) 
  → APPROVED_FOR_PAYMENT (generates OR#)
  → PAYMENT_SUBMITTED (citizen uploads proof)
  → REGISTERED_FOR_PICKUP (employee confirms payment)
  → COMPLETED

Alternate paths: RETURNED_FOR_CORRECTION, REJECTED
```

Key insight: `PAYMENT_SUBMITTED` triggers employee payment confirmation workflow, not automatic processing.

### File Upload Pattern
- Stored in `uploads/{service-type}/{userId}/` directories
- API routes use `formData.get()` for files, save with `writeFile()` from `fs/promises`
- Naming: `{field}_${timestamp}_${originalName}`
- Required fields validated before attempting file operations
- Delayed registrations require 4 additional documents: affidavit, burial cert, funeral cert, PSA no-record

### Audit Logging
- Every state change requires `createAuditLog()` from `lib/auditLog.ts`
- Use constants from `AUDIT_ACTIONS` object (never hardcode action strings)
- Pattern: capture `userId`, `action`, `entityType`, `entityId`, and `details` object
- Logs are non-blocking (errors logged but don't throw)

### Transaction Recording
- Created when payment confirmed (status → `REGISTERED_FOR_PICKUP`)
- Must include: `transactionType`, `amount`, `orderOfPayment`, `entityType`, `entityId`
- Types follow pattern: `{SERVICE}_FEE` (e.g., `DEATH_REGISTRATION_FEE`, `BURIAL_PERMIT_FEE`)
- Delayed registrations use `DELAYED_DEATH_REGISTRATION_FEE`

## API Routes Structure
- **Submission**: `/api/cemetery/{service}/route.ts` (POST with FormData)
- **Verification**: `/api/cemetery/verification/{approve|reject}/route.ts` (POST)
- **Payment Submit**: `/api/cemetery/submit-payment/route.ts` (POST with proof)
- **Payment Confirm**: `/api/cemetery/confirm-payment/route.ts` (POST, employee-only)
- **Burial/Exhumation**: Same pattern under `/api/cemetery/{service}/...`

When creating new routes:
1. Check session + role authorization
2. Validate request data before DB operations
3. Handle file uploads to appropriate `uploads/` subdirectory
4. Update status atomically with `prisma.{model}.update()`
5. Create audit log entry
6. Return meaningful error messages with proper status codes

## Frontend Patterns

### Page Organization
- **Service entry**: `/app/services/cemetery/page.tsx`
- **Role dashboards**: `/app/services/cemetery/{user|employee|admin}-dashboard/page.tsx`
- **Form pages**: `/app/services/cemetery/{service}-submission/page.tsx`
- **Detail pages**: `/app/services/cemetery/{service}-submission/[id]/page.tsx`

Dashboard statistics use `prisma.{model}.groupBy({ by: ['status'], _count: true })`.

### Server Components
- Pages are async server components by default
- Use `await auth()` for session, `redirect()` for unauthorized users
- Fetch data directly with Prisma in component body
- Link between dashboards using `Link` from `next/link`

### Styling
- TailwindCSS 4 with orange theme (primary: `orange-600`, hover: `orange-700`)
- Status badges pattern: `bg-{color}-100 text-{color}-800` (yellow=pending, green=approved, blue=payment, red=rejected)
- Forms use consistent spacing: `space-y-6` for sections, `space-y-4` for fields

## Developer Workflows

### Database Changes
```bash
# After editing schema.prisma
npx prisma migrate dev --name descriptive_name
npx prisma generate
```

### Seeding (see `prisma/seed.ts`)
```bash
npm run seed  # Creates test users with different roles
```

### Running Locally
```bash
npm run dev  # http://localhost:3000
```

### Environment Setup
Required `.env`:
```
DATABASE_URL="postgresql://user:pass@localhost:5432/pafm"
NEXTAUTH_SECRET="generate-random-string"
NEXTAUTH_URL="http://localhost:3000"
```

## Common Patterns to Follow

### Order of Payment Generation
```typescript
const timestamp = Date.now()
const orderOfPayment = `OR-${timestamp}-${registrationId.substring(0, 8).toUpperCase()}`
```

### Working Days Calculation (Delayed Registrations)
See `app/api/cemetery/confirm-payment/route.ts` lines 42-51 for 11-working-day deadline logic (skip weekends).

### Role-Based Redirects
```typescript
const userRole = session.user?.role || "USER"
if (userRole !== "EMPLOYEE" && userRole !== "ADMIN") {
  redirect("/services/cemetery")
}
```

### Error Handling in API Routes
Always wrap in try-catch, return JSON errors:
```typescript
try {
  // operations
} catch (error) {
  console.error("Context:", error)
  return NextResponse.json({ error: "Specific message" }, { status: 500 })
}
```

## Critical Don'ts
- ❌ Don't modify status without creating audit log
- ❌ Don't skip file validation (check existence before saving)
- ❌ Don't hardcode fees (use schema defaults or calculate based on type)
- ❌ Don't forget to check `registrationType` for conditional document requirements
- ❌ Don't use backticks in file paths (Windows environment)
- ❌ Don't create transactions before payment confirmation

## Key Files Reference
- `auth.ts` - NextAuth configuration
- `lib/auditLog.ts` - Audit logging helpers + action constants
- `lib/prisma.ts` - Prisma client singleton
- `prisma/schema.prisma` - Full data model with enums and fees
- `app/api/cemetery/death-registration/route.ts` - Complete submission example
- `app/api/cemetery/verification/approve/route.ts` - Status update + OR generation
- `app/services/cemetery/employee-dashboard/page.tsx` - Multi-service dashboard pattern
