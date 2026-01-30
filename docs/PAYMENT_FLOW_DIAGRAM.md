# Payment Integration Flow Diagram

## 📊 Complete Payment Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PAYMENT INTEGRATION FLOW                     │
└─────────────────────────────────────────────────────────────────────┘

STEP 1: USER SUBMITS FORM
┌──────────────┐
│   Browser    │
│  (User fills │
│     form)    │
└──────┬───────┘
       │ POST /api/cemetery/death-registration
       │ {deceasedName, documents, etc.}
       ▼
┌──────────────┐
│  Your API    │──┐
│   Handler    │  │ Creates record in database
└──────┬───────┘  │ Status: PENDING_VERIFICATION
       │          │ paymentStatus: PENDING
       │◄─────────┘
       │
       │ Returns: { id: "uuid-123", ... }
       ▼
┌──────────────┐
│   Browser    │
│ (Shows payment│
│    button)   │
└──────────────┘


STEP 2: USER CLICKS "PAY ONLINE"
┌──────────────┐
│   Browser    │
│ (Clicks Pay) │
└──────┬───────┘
       │ initiatePayment()
       │ POST /api/payment/initiate
       │ {
       │   referenceId: "REG-123456",
       │   amount: 500.00,
       │   purpose: "Death Registration - Juan Dela Cruz",
       │   entityType: "DeathRegistration",
       │   entityId: "uuid-123"
       │ }
       ▼
┌──────────────────────┐
│ /api/payment/initiate│
│                      │
│ 1. Creates Transaction record:
│    - status: PENDING
│    - referenceNumber: "REG-123456"
│    - amount: 500.00
│                      │
│ 2. Sends to external gateway:
│    POST revenuetreasury.goserveph.com
│    {
│      "system": "cemetery",
│      "ref": "REG-123456",
│      "amount": "500.00",
│      "purpose": "Death Registration - Juan Dela Cruz",
│      "callback": "https://yourdomain.com/api/payment/callback"
│    }
│                      │
│ 3. Returns payment URL
└──────┬───────────────┘
       │
       │ Returns: { paymentUrl: "https://gateway.com/pay/xxx" }
       ▼
┌──────────────┐
│   Browser    │
│ (Redirects)  │──► https://revenuetreasury.goserveph.com/pay/xxx
└──────────────┘


STEP 3: USER PAYS ON EXTERNAL GATEWAY
┌────────────────────┐
│  External Gateway  │
│                    │
│  User selects:     │
│  • GCash           │
│  • PayMaya         │
│  • Bank Transfer   │
│  • etc.            │
│                    │
│  Enters payment    │
│  details & confirms│
└────────┬───────────┘
         │
         │ Payment processed
         ▼
┌────────────────────┐
│  External Gateway  │
│  (Confirms payment)│
└────────┬───────────┘
         │
         │ POST https://yourdomain.com/api/payment/callback
         │ {
         │   "reference_id": "REG-123456",
         │   "amount": "500.00",
         │   "purpose": "Death Registration - Juan Dela Cruz",
         │   "receipt_number": "RCPT-20260130-1234",
         │   "paid_at": "2026-01-30 14:30:45",
         │   "payment_id": "PAY-ABCD123",
         │   "client_system": "cemetery",
         │   "payment_status": "paid",
         │   "payment_method": "gcash",
         │   "phone": "09171234567"
         │ }
         ▼


STEP 4: CALLBACK UPDATES YOUR SYSTEM
┌───────────────────────┐
│ /api/payment/callback │
│                       │
│ 1. Validates request:
│    ✓ client_system = "cemetery"
│    ✓ Transaction exists
│    ✓ Status is PENDING
│                       │
│ 2. Updates Transaction:
│    - status: PENDING → CONFIRMED
│    - paymentMethod: "GCASH"
│    - remarks: "Payment confirmed via external gateway..."
│                       │
│ 3. Updates Entity:
│    - DeathRegistration.paymentStatus: "PENDING" → "PAID"
│                       │
│ 4. Creates Audit Log:
│    - action: "PAYMENT_CONFIRMED"
│    - details: Receipt, amount, method
│                       │
│ 5. Returns success
└───────┬───────────────┘
        │
        │ Response: { success: true }
        ▼
┌────────────────────┐
│  External Gateway  │
│ (Shows success to  │
│      user)         │
└────────────────────┘


STEP 5: USER VIEWS CONFIRMATION
┌──────────────┐
│   Browser    │
│ (User returns│
│ to your site)│
└──────┬───────┘
       │ Goes to /dashboard
       ▼
┌──────────────┐
│  Dashboard   │
│              │
│ Shows:       │
│ ✓ Transaction: CONFIRMED
│ ✓ Receipt: RCPT-20260130-1234
│ ✓ Payment: GCash - ₱500.00
│ ✓ Status: Payment Verified
└──────────────┘
```

## 🗄️ Database Changes

```
BEFORE PAYMENT:
┌─────────────────────┐     ┌──────────────────┐
│ DeathRegistration   │     │   Transaction    │
├─────────────────────┤     ├──────────────────┤
│ id: uuid-123        │     │ (none created)   │
│ deceasedName: "..." │     │                  │
│ status: PENDING...  │     │                  │
│ paymentStatus: PENDING   │                  │
│ paymentConfirmed: false  │                  │
└─────────────────────┘     └──────────────────┘


AFTER INITIATE:
┌─────────────────────┐     ┌──────────────────────────┐
│ DeathRegistration   │     │   Transaction            │
├─────────────────────┤     ├──────────────────────────┤
│ id: uuid-123        │     │ id: txn-uuid             │
│ status: PENDING...  │     │ referenceNumber: REG-123 │
│ paymentStatus: PENDING   │ amount: 500.00           │
└─────────────────────┘     │ status: PENDING ◄────────
                            │ entityId: uuid-123       │
                            │ entityType: DeathReg...  │
                            └──────────────────────────┘


AFTER CALLBACK (PAID):
┌─────────────────────┐     ┌──────────────────────────┐
│ DeathRegistration   │     │   Transaction            │
├─────────────────────┤     ├──────────────────────────┤
│ id: uuid-123        │     │ id: txn-uuid             │
│ status: PENDING...  │     │ referenceNumber: REG-123 │
│ paymentStatus: PAID ◄─┐   │ amount: 500.00           │
└─────────────────────┘ │   │ status: CONFIRMED ◄──────
                        │   │ paymentMethod: GCASH     │
                        └───┤ entityId: uuid-123       │
                            └──────────────────────────┘

                            ┌──────────────────────────┐
                            │   AuditLog               │
                            ├──────────────────────────┤
                            │ action: PAYMENT_CONFIRMED│
                            │ entityId: txn-uuid       │
                            │ details: "Receipt: ..."  │
                            └──────────────────────────┘
```

## 🔄 Status Transitions

### Transaction Status
```
PENDING ──► CONFIRMED ──► (completed)
   │
   └──────► CANCELLED
```

### Entity Payment Status
```
PENDING ──► PAID ──► (completed)
   │
   └──────► FAILED
```

## 📁 File Structure

```
your-project/
├── app/
│   ├── api/
│   │   ├── payment/
│   │   │   ├── initiate/
│   │   │   │   └── route.ts .............. Starts payment
│   │   │   ├── callback/
│   │   │   │   └── route.ts .............. Receives confirmation
│   │   │   └── status/
│   │   │       └── route.ts .............. Checks payment status
│   │   │
│   │   └── cemetery/
│   │       └── death-registration/
│   │           └── route.ts .............. Your existing form handler
│   │
│   └── components/
│       ├── OnlinePaymentButton.tsx ....... Reusable payment button
│       └── examples/
│           └── DeathRegistrationWith
│               Payment.example.tsx ........ Integration example
│
├── lib/
│   └── payment.ts ........................ Helper functions
│
├── prisma/
│   ├── schema.prisma ..................... Updated models
│   └── migrations/
│       └── 20260130000000_add_
│           payment_status/
│           └── migration.sql ............. Database changes
│
└── docs/
    ├── PAYMENT_GATEWAY_INTEGRATION.md .... Full technical docs
    ├── PAYMENT_INTEGRATION_EXAMPLE.md .... Form examples
    ├── PAYMENT_QUICK_START.md ............ Quick reference
    └── PAYMENT_FLOW_DIAGRAM.md ........... This file!
```

## 🎯 Key Components

### 1. Payment Initiation
**File:** `/app/api/payment/initiate/route.ts`
- Receives payment request from your app
- Creates Transaction record (PENDING)
- Sends payment request to external gateway
- Returns payment URL

### 2. Payment Callback
**File:** `/app/api/payment/callback/route.ts`
- Receives confirmation from external gateway
- Updates Transaction (PENDING → CONFIRMED)
- Updates Entity (paymentStatus: PENDING → PAID)
- Creates audit log

### 3. Payment Button
**File:** `/app/components/OnlinePaymentButton.tsx`
- Reusable React component
- Handles loading states
- Initiates payment
- Redirects to gateway

### 4. Helper Functions
**File:** `/lib/payment.ts`
- `initiatePayment()` - Start payment
- `generatePaymentReference()` - Create reference ID
- `generatePaymentPurpose()` - Format description

## 🔐 Security Validation

```
External Gateway Callback
         │
         ▼
┌─────────────────────┐
│ Validate Request    │
├─────────────────────┤
│ 1. Check client_system = "cemetery"
│ 2. Find transaction by reference_id
│ 3. Verify status is PENDING
│ 4. Check user owns transaction
└─────────┬───────────┘
          │
    Valid │ Invalid
          │         │
          ▼         ▼
    Process    Return 400
    Payment    Error
```

## 📊 Data Flow Summary

1. **User Input** → Form Data
2. **Form Submit** → Create Record (DB)
3. **Payment Init** → Create Transaction (DB) + External Gateway Request
4. **Gateway** → User Payment
5. **Callback** → Update Transaction + Entity (DB)
6. **Dashboard** → Show Confirmation

---

**Questions?** Check the full documentation in `/docs/PAYMENT_GATEWAY_INTEGRATION.md`
