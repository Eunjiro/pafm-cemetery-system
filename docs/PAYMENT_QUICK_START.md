# Payment Gateway Integration - Quick Start Guide

## 🎯 Overview

Your cemetery management system now integrates with the external payment gateway at **revenuetreasury.goserveph.com**.

## 📁 Files Created

### API Endpoints
1. **`/app/api/payment/initiate/route.ts`** - Initiates payment with external gateway
2. **`/app/api/payment/callback/route.ts`** - Receives payment confirmations
3. **`/app/api/payment/status/route.ts`** - Checks payment status

### Components
4. **`/app/components/OnlinePaymentButton.tsx`** - Reusable payment button component

### Utilities
5. **`/lib/payment.ts`** - Payment helper functions

### Documentation
6. **`/docs/PAYMENT_GATEWAY_INTEGRATION.md`** - Complete integration guide
7. **`/docs/PAYMENT_INTEGRATION_EXAMPLE.md`** - Form integration examples

## ⚙️ Configuration

Added to `.env`:
```env
PAYMENT_GATEWAY_URL="https://revenuetreasury.goserveph.com/citizen_dashboard/digital/index.php"
```

## 🔄 How It Works

### 1. User Submits Form
```typescript
// User fills out Death Registration form
const response = await fetch('/api/cemetery/death-registration', {
  method: 'POST',
  body: formData
});
const result = await response.json();
// result.id = "uuid-of-registration"
```

### 2. Initiate Payment
```typescript
import { initiatePayment, generatePaymentReference } from '@/lib/payment';

const paymentResult = await initiatePayment({
  referenceId: generatePaymentReference('REG', result.id),
  amount: 500.00,
  purpose: 'Death Registration - Juan Dela Cruz',
  entityType: 'DeathRegistration',
  entityId: result.id,
  transactionType: 'DEATH_REGISTRATION_FEE'
});

// Redirect user to payment gateway
window.location.href = paymentResult.paymentUrl;
```

### 3. External Gateway Processes Payment
User pays via GCash, PayMaya, etc. on the external gateway.

### 4. Callback Confirms Payment
External gateway sends callback to `/api/payment/callback`:
```json
{
  "reference_id": "REG-123456",
  "payment_status": "paid",
  "receipt_number": "RCPT-xxx",
  "payment_method": "gcash"
}
```

### 5. Automatic Updates
- Transaction status → CONFIRMED
- DeathRegistration.paymentStatus → PAID
- Audit log created
- User can view in dashboard

## 🎨 Using the Payment Button

### Simple Integration
```tsx
import OnlinePaymentButton from '@/app/components/OnlinePaymentButton';

<OnlinePaymentButton
  entityType="DeathRegistration"
  entityId="uuid-of-registration"
  amount={500.00}
  deceasedName="Juan Dela Cruz"
/>
```

### Available Entity Types
- `DeathRegistration`
- `BurialPermit`
- `ExhumationPermit`
- `CremationPermit`
- `DeathCertificateRequest`

## 🔍 Check Payment Status

### Via API
```typescript
const response = await fetch('/api/payment/status?referenceId=REG-123456');
const { transaction } = await response.json();

console.log(transaction.status); // PENDING, CONFIRMED, CANCELLED
```

### Status Values
- **PENDING** - Payment initiated, waiting for confirmation
- **CONFIRMED** - Payment successful ✅
- **CANCELLED** - Payment failed or cancelled ❌
- **REFUNDED** - Payment refunded

## 🧪 Testing

### Test the Callback Manually
```bash
curl -X POST http://localhost:3000/api/payment/callback \
  -H "Content-Type: application/json" \
  -d '{
    "reference_id": "REG-123456",
    "amount": "500.00",
    "purpose": "Death Registration - Test",
    "receipt_number": "RCPT-TEST-001",
    "paid_at": "2026-01-30 10:00:00",
    "payment_id": "PAY-TEST-123",
    "client_system": "cemetery",
    "payment_status": "paid",
    "payment_method": "gcash",
    "phone": "09171234567"
  }'
```

## 📋 Integration Checklist

- [x] API endpoints created
- [x] Payment button component created
- [x] Helper functions added
- [x] Environment variables configured
- [x] Documentation written

### Next Steps for You:

1. **Update your forms** to include the OnlinePaymentButton component
2. **Test the integration** with the external gateway
3. **Configure production URL** in `.env` (update NEXTAUTH_URL)
4. **Add webhook security** (optional: verify signatures from gateway)
5. **Set up notifications** (optional: email/SMS on payment confirmation)

## 🔐 Security Notes

- Callback validates `client_system` field
- Only processes PENDING transactions
- All actions logged in audit logs
- Consider adding HMAC signature verification in production

## 📞 Payment Gateway Details

- **URL**: `https://revenuetreasury.goserveph.com/citizen_dashboard/digital/index.php`
- **Method**: POST
- **System Identifier**: `cemetery`
- **Callback URL**: `https://yourdomain.com/api/payment/callback`

## 💡 Example Integration Flow

```
User fills form → Submit → Create record → Initiate payment →
Redirect to gateway → User pays → Gateway callback →
Update transaction → Update entity → User sees confirmation
```

## 📚 Full Documentation

See `/docs/PAYMENT_GATEWAY_INTEGRATION.md` for complete API documentation and examples.

---

**Ready to integrate!** Start by adding the OnlinePaymentButton to your Death Registration form.
