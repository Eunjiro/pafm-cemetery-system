# 🎯 Payment Integration Checklist

Use this checklist to integrate the payment gateway into your application.

## ✅ Setup (Do Once)

### Database Setup
- [ ] Run the migration: `npx prisma migrate dev`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Verify `paymentStatus` field exists in your models

### Environment Configuration
- [ ] Verify `.env` has `PAYMENT_GATEWAY_URL`
- [ ] Verify `.env` has `NEXTAUTH_URL`
- [ ] Update `NEXTAUTH_URL` for production deployment

### Verify Files Created
- [ ] `/app/api/payment/initiate/route.ts` exists
- [ ] `/app/api/payment/callback/route.ts` exists
- [ ] `/app/api/payment/status/route.ts` exists
- [ ] `/app/components/OnlinePaymentButton.tsx` exists
- [ ] `/lib/payment.ts` exists

## 🔧 Integration (Per Form)

For each form you want to add online payment to:

### 1. Import Components & Helpers
```tsx
import OnlinePaymentButton from '@/app/components/OnlinePaymentButton';
import { initiatePayment, generatePaymentReference } from '@/lib/payment';
```
- [ ] Added imports to your form file

### 2. Add State Management
```tsx
const [submittedRegistration, setSubmittedRegistration] = useState<{
  id: string;
  amount: number;
  deceasedName: string;
} | null>(null);
```
- [ ] Added state to track submitted registration

### 3. Update Form Submission
```tsx
// After successful form submission
setSubmittedRegistration({
  id: result.id,
  amount: 500.00,
  deceasedName: '...',
});
```
- [ ] Modified handleSubmit to save registration details

### 4. Add Payment UI
```tsx
{submittedRegistration ? (
  // Show payment button
  <OnlinePaymentButton
    entityType="DeathRegistration"
    entityId={submittedRegistration.id}
    amount={submittedRegistration.amount}
    deceasedName={submittedRegistration.deceasedName}
  />
) : (
  // Show form submit button
  <button type="submit">Submit</button>
)}
```
- [ ] Added conditional rendering for payment section

## 🧪 Testing

### Local Testing
- [ ] Start dev server: `npm run dev`
- [ ] Submit a test form
- [ ] Click "Pay Online" button
- [ ] Verify you're redirected (even if URL doesn't work yet)
- [ ] Check Transaction created in database with PENDING status

### Callback Testing
```bash
curl -X POST http://localhost:3000/api/payment/callback \
  -H "Content-Type: application/json" \
  -d '{
    "reference_id": "YOUR-REF-ID",
    "payment_status": "paid",
    "receipt_number": "RCPT-TEST-001",
    "payment_id": "PAY-TEST-123",
    "client_system": "cemetery",
    "amount": "500.00",
    "purpose": "Test Payment",
    "payment_method": "gcash",
    "paid_at": "2026-01-30 10:00:00"
  }'
```
- [ ] Test callback with manual curl
- [ ] Verify Transaction status changed to CONFIRMED
- [ ] Verify Entity paymentStatus changed to PAID
- [ ] Verify AuditLog entry created

### Status Check Testing
```bash
curl "http://localhost:3000/api/payment/status?referenceId=YOUR-REF-ID"
```
- [ ] Test status endpoint
- [ ] Verify returns correct transaction info

## 🚀 Production Deployment

### Pre-Deployment
- [ ] Update `.env` with production `NEXTAUTH_URL`
- [ ] Run migrations on production database
- [ ] Verify external gateway can reach your callback URL
- [ ] Test with staging/sandbox gateway first (if available)

### Post-Deployment
- [ ] Test full payment flow in production
- [ ] Verify callback receives payment confirmations
- [ ] Monitor logs for errors
- [ ] Test with small real payment (if possible)

## 📋 Forms to Integrate

Check off each form as you integrate payment:

- [ ] Death Registration (`/app/services/cemetery/death-registration/page.tsx`)
  - Entity Type: `DeathRegistration`
  - Amount: ₱500.00 (regular) / ₱750.00 (delayed)
  
- [ ] Burial Permit (`/app/services/cemetery/burial-permit/page.tsx`)
  - Entity Type: `BurialPermit`
  - Amount: ₱100.00 + niche fee (if applicable)
  
- [ ] Exhumation Permit (`/app/services/cemetery/exhumation-permit/page.tsx`)
  - Entity Type: `ExhumationPermit`
  - Amount: ₱100.00
  
- [ ] Cremation Permit (`/app/services/cemetery/cremation-permit/page.tsx`)
  - Entity Type: `CremationPermit`
  - Amount: ₱100.00
  
- [ ] Death Certificate Request (`/app/services/cemetery/death-certificate/page.tsx`)
  - Entity Type: `DeathCertificateRequest`
  - Amount: ₱50.00 (first copy) + ₱50.00 per additional copy

## 🔍 Verification Points

After integration, verify these work:

### User Journey
- [ ] User can submit form
- [ ] Payment button appears after submission
- [ ] Clicking payment button initiates payment
- [ ] User gets redirected to external gateway
- [ ] After payment, transaction updates automatically
- [ ] User can view payment status in dashboard

### Database
- [ ] Transaction created with PENDING status
- [ ] Transaction updates to CONFIRMED after callback
- [ ] Entity `paymentStatus` updates to PAID
- [ ] AuditLog entries created for all actions

### Error Handling
- [ ] Payment initiation failure shows error message
- [ ] Invalid callback data is rejected
- [ ] Duplicate callbacks don't cause issues
- [ ] User can retry failed payments

## 📞 External Gateway Coordination

If you need to coordinate with the payment gateway team:

- [ ] Provide your callback URL: `https://yourdomain.com/api/payment/callback`
- [ ] Provide your system identifier: `cemetery`
- [ ] Request sandbox/test credentials (if available)
- [ ] Request callback payload documentation
- [ ] Discuss webhook security (signatures, tokens)
- [ ] Confirm supported payment methods
- [ ] Test connectivity between systems

## 🛟 Troubleshooting

If something doesn't work:

### Payment Initiation Fails
1. [ ] Check console for errors
2. [ ] Verify `PAYMENT_GATEWAY_URL` in `.env`
3. [ ] Check network tab for failed requests
4. [ ] Verify user is authenticated

### Callback Not Working
1. [ ] Verify callback URL is publicly accessible
2. [ ] Check server logs for incoming requests
3. [ ] Verify `reference_id` matches existing transaction
4. [ ] Check transaction is in PENDING status
5. [ ] Verify `client_system` is "cemetery"

### Status Not Updating
1. [ ] Check Prisma schema has `paymentStatus` field
2. [ ] Verify migration ran successfully
3. [ ] Check entity type spelling matches model name
4. [ ] Look for errors in callback handler logs

## 📚 Documentation Reference

- **Full Integration Guide**: `/docs/PAYMENT_GATEWAY_INTEGRATION.md`
- **Form Examples**: `/docs/PAYMENT_INTEGRATION_EXAMPLE.md`
- **Quick Reference**: `/docs/PAYMENT_QUICK_START.md`
- **Flow Diagram**: `/docs/PAYMENT_FLOW_DIAGRAM.md`
- **Code Example**: `/app/components/examples/DeathRegistrationWithPayment.example.tsx`

## ✨ Optional Enhancements

Consider adding these features later:

- [ ] Email notification on payment confirmation
- [ ] SMS notification on payment confirmation
- [ ] Payment history page for users
- [ ] Export payment reports for admin
- [ ] Refund request workflow
- [ ] Payment retry mechanism
- [ ] Webhook signature verification
- [ ] Payment analytics dashboard

---

**Need Help?**
- Check the documentation in `/docs/`
- Look at the example: `/app/components/examples/DeathRegistrationWithPayment.example.tsx`
- Review the flow diagram: `/docs/PAYMENT_FLOW_DIAGRAM.md`
