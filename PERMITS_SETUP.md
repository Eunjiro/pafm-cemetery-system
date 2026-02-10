# Pending Permits Feature - Setup Guide

## 🎯 Overview

Integration with external permit system to receive approved burial permits and assign them to cemetery plots.

## 📋 Setup Instructions

### 1. Run Database Migration

```bash
npm run db:migrate:permits
```

This creates:
- `pending_permits` table (stores approved permits from permit system)
- `api_keys` table (manages API key authentication)

### 2. Generate API Key for Permit System

```bash
npm run db:seed:api-key
```

**IMPORTANT**: Save the generated API key securely and provide it to the Permit System administrator.

Example output:
```
================================================================================
🔐 PERMIT SYSTEM API KEY (Save this securely!)
================================================================================

pk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0

================================================================================
```

### 3. Share Integration Documentation

Provide `PERMIT_SYSTEM_INTEGRATION.md` to the permit system development team. This file contains:
- Complete API documentation
- Authentication setup
- Example code
- Integration flow

## 🔗 Available Endpoints

### External API (for Permit System)
- `GET /api/external/cemeteries` - List active cemeteries
- `GET /api/external/plots` - List available plots
- `POST /api/external/permits` - Receive approved permits
- `GET /api/external/permits?permit_id={id}` - Check permit status

### Internal API (for PAFM-C Admins)
- `GET /api/permits?status=pending` - List pending permits
- `PUT /api/permits/:id` - Assign or reject permits

## 📊 Dashboard Access

**Pending Permits Page**: `/dashboard/permits`

Features:
- View all pending permits
- Filter by status (pending, assigned, rejected)
- Assign burial plots
- Add admin notes
- Reject permits with reason

## 🔐 Security

- API key authentication required for external endpoints
- Rate limiting enabled (inherits from middleware)
- All actions logged in activity logs
- IP whitelisting supported (optional)

## 📝 Workflow

1. **Permit System** submits approved permit via `POST /api/external/permits`
2. **PAFM-C** creates pending permit record
3. **PAFM-C Admin** reviews permit in dashboard at `/dashboard/permits`
4. **Admin** assigns plot or rejects permit
5. System automatically:
   - Creates deceased person record
   - Creates burial record
   - Logs activity
   - (Optional) Sends webhook notification to permit system

## 🔄 Integration Flow

```
[Permit System] --POST--> [PAFM-C API] --stores--> [pending_permits table]
                                                           │
                                                           ▼
                                                   [Admin Dashboard]
                                                           │
                                                           ▼
                                                   [Assign to Plot]
                                                           │
                                                           ▼
                                               [burial + deceased records]
```

## 📖 Files Created

### Database
- `database/pending-permits-schema.sql` - Database schema
- `scripts/migrate-pending-permits.ts` - Migration script
- `scripts/seed-api-key.ts` - API key generator

### API Routes
- `app/api/external/cemeteries/route.ts` - Public cemetery API
- `app/api/external/plots/route.ts` - Public plots API
- `app/api/external/permits/route.ts` - Permit webhook
- `app/api/permits/route.ts` - Internal permit management

### Libraries
- `lib/api-auth.ts` - API key authentication middleware

### UI Components
- `app/dashboard/permits/page.tsx` - Pending permits management page
- `app/dashboard/page.tsx` - Updated with pending permits widget

### Documentation
- `PERMIT_SYSTEM_INTEGRATION.md` - Complete integration guide for permit system team

## 🧪 Testing

### 1. Test API Connection (from permit system)
```bash
curl -H "Authorization: Bearer pk_your_api_key" \
  http://localhost:3000/api/external/cemeteries
```

### 2. Test Permit Submission
```bash
curl -X POST http://localhost:3000/api/external/permits \
  -H "Authorization: Bearer pk_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "permit_id": "TEST-001",
    "permit_type": "burial",
    "deceased_first_name": "Test",
    "deceased_last_name": "User",
    "date_of_death": "2026-02-01",
    "applicant_name": "Test Applicant",
    "preferred_cemetery_id": 1,
    "preferred_plot_id": 1,
    "permit_approved_at": "2026-02-10T10:00:00Z"
  }'
```

### 3. Check Dashboard
Visit `http://localhost:3000/dashboard/permits` to see the submitted permit.

## ⚙️ Configuration

### API Key Permissions
Edit `api_keys` table to configure:
- `permissions.read` - Allow GET requests
- `permissions.write` - Allow POST/PUT requests
- `permissions.endpoints` - Restrict to specific endpoints
- `allowed_ips` - IP whitelist (array)
- `expires_at` - Set expiration date

### Example: Restrict to Read-Only
```sql
UPDATE api_keys 
SET permissions = '{"read": true, "write": false}'::jsonb
WHERE system_name = 'permit_system';
```

## 📞 Support

For issues or questions:
- Check [PERMIT_SYSTEM_INTEGRATION.md](./PERMIT_SYSTEM_INTEGRATION.md)
- Review activity logs at `/dashboard/logs`
- Check database tables: `pending_permits`, `api_keys`

## 🔄 Next Steps

1. ✅ Run migrations
2. ✅ Generate API key
3. ✅ Share integration docs with permit system team
4. ⏳ Test integration with permit system (staging)
5. ⏳ Monitor pending permits in dashboard
6. ⏳ Go live!
