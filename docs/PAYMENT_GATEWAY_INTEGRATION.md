# Payment Gateway Integration

This project integrates with an external payment gateway at `revenuetreasury.goserveph.com`.

## Setup

### 1. Environment Variables

Add the following to your `.env` file:

```env
# Payment Gateway Configuration
PAYMENT_GATEWAY_URL=https://revenuetreasury.goserveph.com/citizen_dashboard/digital/index.php
NEXTAUTH_URL=http://localhost:3000  # Update with your production URL
```

### 2. Payment Flow

#### Step 1: Initiate Payment

When a user wants to pay for a service, call the initiation endpoint:

```typescript
import { initiatePayment } from '@/lib/payment';

const result = await initiatePayment({
  referenceId: 'REG-123456',
  amount: 2500.00,
  purpose: 'Death Registration - Juan Dela Cruz',
  entityType: 'DeathRegistration',
  entityId: 'uuid-of-registration',
  transactionType: 'DEATH_REGISTRATION_FEE'
});

if (result.success && result.paymentUrl) {
  // Redirect user to payment gateway
  window.location.href = result.paymentUrl;
}
```

#### Step 2: Payment Request to External Gateway

The system sends this JSON to the external gateway:

```json
{
  "system": "cemetery",
  "ref": "REG-123456",
  "amount": "2500.00",
  "purpose": "Death Registration - Juan Dela Cruz",
  "callback": "https://yourdomain.com/api/payment/callback"
}
```

#### Step 3: Callback from External Gateway

After payment is processed, the external gateway sends a callback:

```json
{
  "reference_id": "REG-123456",
  "amount": "2500.00",
  "purpose": "Death Registration - Juan Dela Cruz",
  "receipt_number": "RCPT-20241225143045-1234",
  "paid_at": "2024-12-25 14:30:45",
  "payment_id": "PAY-1234567890ABCDEF",
  "client_system": "cemetery",
  "payment_status": "paid",
  "payment_method": "gcash",
  "phone": "09171234567"
}
```

The callback automatically:
- Updates transaction status to CONFIRMED
- Updates the related entity (Death Registration, Permit, etc.)
- Creates audit logs
- Sends notifications (if configured)

## API Endpoints

### POST /api/payment/initiate
Initiates a payment with the external gateway.

**Request Body:**
```json
{
  "referenceId": "REG-123456",
  "amount": 2500.00,
  "purpose": "Death Registration",
  "entityType": "DeathRegistration",
  "entityId": "uuid",
  "transactionType": "DEATH_REGISTRATION_FEE"
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "transaction-uuid",
  "referenceId": "REG-123456",
  "paymentUrl": "https://gateway-url/pay/xxx",
  "message": "Payment initiated successfully"
}
```

### POST /api/payment/callback
Receives payment confirmation from external gateway (called by gateway, not by your app).

**Request Body:** (from external gateway)
```json
{
  "reference_id": "REG-123456",
  "payment_status": "paid",
  "receipt_number": "RCPT-123",
  "payment_id": "PAY-123",
  ...
}
```

## Integration Examples

### In a Form Component

```typescript
'use client';

import { useState } from 'react';
import { initiatePayment, generatePaymentReference } from '@/lib/payment';

export default function DeathRegistrationForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: any) {
    // 1. Submit registration data
    const response = await fetch('/api/cemetery/death-registration', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    
    const registration = await response.json();
    
    // 2. Initiate payment
    setLoading(true);
    const paymentResult = await initiatePayment({
      referenceId: generatePaymentReference('REG', registration.id),
      amount: 500.00,
      purpose: `Death Registration - ${formData.deceasedName}`,
      entityType: 'DeathRegistration',
      entityId: registration.id,
      transactionType: 'DEATH_REGISTRATION_FEE'
    });
    
    if (paymentResult.success && paymentResult.paymentUrl) {
      // Redirect to payment gateway
      window.location.href = paymentResult.paymentUrl;
    } else {
      alert('Failed to initiate payment');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : 'Submit & Pay'}
      </button>
    </form>
  );
}
```

## Payment Status

The Transaction model supports these statuses:
- `PENDING` - Payment initiated, waiting for confirmation
- `CONFIRMED` - Payment successful
- `CANCELLED` - Payment cancelled or failed
- `REFUNDED` - Payment refunded

## Security Notes

1. The callback endpoint validates the `client_system` field
2. Only processes transactions in PENDING status
3. All payment actions are logged in audit logs
4. Consider adding webhook signature verification for production

## Testing

For development/testing, you can manually trigger callbacks:

```bash
curl -X POST http://localhost:3000/api/payment/callback \
  -H "Content-Type: application/json" \
  -d '{
    "reference_id": "REG-123456",
    "amount": "2500.00",
    "purpose": "Test Payment",
    "receipt_number": "RCPT-TEST-123",
    "paid_at": "2024-01-30 10:00:00",
    "payment_id": "PAY-TEST-123",
    "client_system": "cemetery",
    "payment_status": "paid",
    "payment_method": "gcash"
  }'
```
