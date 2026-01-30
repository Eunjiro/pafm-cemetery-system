# Testing the Payment Integration

## 🧪 Test Mode Enabled

The payment system now has a **test mode** that automatically activates when the external payment gateway is unavailable.

## How It Works

### When External Gateway is Available:
1. User clicks "Pay Online"
2. Redirected to actual payment gateway (revenuetreasury.goserveph.com)
3. User pays with real payment methods
4. Gateway sends callback to confirm payment

### When External Gateway is Unavailable (Test Mode):
1. User clicks "Pay Online"
2. Redirected to **Test Payment Gateway** page
3. User can simulate successful or failed payments
4. Test page sends callback to your system
5. Transaction updates automatically

## 🎯 Testing Steps

### 1. Submit a Service Request
- Go to Death Registration, Burial Permit, etc.
- Fill out and submit the form
- Wait for approval (or approve it yourself if admin)

### 2. Navigate to Submission Details
- Go to "My Submissions"
- Click on your submission
- You should see status: "Approved - Awaiting Payment"

### 3. Click "Pay Online"
- You'll see the green payment button
- Click it to initiate payment
- Transaction record is created with PENDING status

### 4. Use Test Payment Page
Since the external gateway is not accessible, you'll see:

**Test Payment Gateway Page** with:
- Reference ID
- Transaction ID  
- Amount to pay
- Payment method options (GCash, PayMaya, Bank, Cash)
- Two buttons:
  - ✓ **Simulate Successful Payment** - Marks payment as PAID
  - ✗ **Simulate Failed Payment** - Marks payment as CANCELLED

### 5. Verify Payment Status
After clicking one of the buttons:
- Transaction status updates automatically
- Entity (Death Registration, etc.) paymentStatus updates
- Audit log is created
- You can view it in your dashboard

## 📊 What Gets Updated

### On Successful Payment:
- ✅ Transaction.status: PENDING → CONFIRMED
- ✅ Entity.paymentStatus: PENDING → PAID
- ✅ Audit log created with payment details
- ✅ Receipt number generated

### On Failed Payment:
- ❌ Transaction.status: PENDING → CANCELLED
- ❌ Entity.paymentStatus: PENDING → FAILED
- ❌ Audit log created with failure reason

## 🔍 Checking Results

### View Transaction:
\`\`\`
Go to Dashboard → View your submission → Payment details
\`\`\`

### View in Database:
\`\`\`sql
-- Check transaction
SELECT * FROM "Transaction" WHERE "referenceNumber" = 'YOUR-REF-ID';

-- Check entity status
SELECT id, "paymentStatus", status FROM "DeathRegistration" WHERE id = 'YOUR-ENTITY-ID';

-- Check audit logs
SELECT * FROM "AuditLog" WHERE action LIKE '%PAYMENT%' ORDER BY "createdAt" DESC;
\`\`\`

## 🚀 Production Setup

When deploying to production with the real gateway:

1. **Update .env:**
   \`\`\`env
   PAYMENT_GATEWAY_URL="https://revenuetreasury.goserveph.com/citizen_dashboard/digital/index.php"
   NEXTAUTH_URL="https://yourdomain.com"
   \`\`\`

2. **Ensure callback is publicly accessible:**
   - Your callback URL: \`https://yourdomain.com/api/payment/callback\`
   - External gateway must be able to reach this URL

3. **Test with real gateway:**
   - The system will automatically detect when the gateway is available
   - Test mode will be disabled
   - Real payments will be processed

## 🐛 Troubleshooting

### Error: "Failed to initiate payment"
- **Old Error**: System would crash if gateway was unavailable
- **New Behavior**: Automatically switches to test mode

### Callback not working in test mode?
- Check browser console for errors
- Ensure \`/api/payment/callback\` is accessible
- Check server logs for callback processing

### Transaction created but no redirect?
- Payment URL is returned in the response
- Check if \`window.location.href\` redirect works
- Try opening the payment URL in a new tab

## 💡 Tips

1. **Test both scenarios:**
   - Successful payment flow
   - Failed payment flow

2. **Check all entity types:**
   - Death Registration
   - Burial Permit
   - Exhumation Permit
   - Cremation Permit

3. **Verify audit logs:**
   - Every payment action should be logged
   - Check timestamps and user IDs

4. **Test the callback manually:**
   \`\`\`bash
   curl -X POST http://localhost:3000/api/payment/callback \\
     -H "Content-Type: application/json" \\
     -d '{
       "reference_id": "YOUR-REF-ID",
       "payment_status": "paid",
       "receipt_number": "RCPT-123",
       "payment_id": "PAY-123",
       "client_system": "cemetery",
       "amount": "500.00",
       "purpose": "Test",
       "payment_method": "gcash",
       "paid_at": "2026-01-30 10:00:00"
     }'
   \`\`\`

---

**Ready to test!** Click "Pay Online" on any approved submission to see it in action! 🎉
