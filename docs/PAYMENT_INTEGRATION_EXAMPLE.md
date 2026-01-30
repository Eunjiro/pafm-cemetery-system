# Example: Integrating Online Payment into Death Registration Form

Here's how to add the online payment button to your existing Death Registration form:

## Step 1: Import the Component

```typescript
import OnlinePaymentButton from '@/app/components/OnlinePaymentButton';
```

## Step 2: Track Submission State

Add state to track the submitted registration:

```typescript
const [submittedRegistration, setSubmittedRegistration] = useState<{
  id: string;
  amount: number;
  deceasedName: string;
} | null>(null);
```

## Step 3: Update Form Submission

Modify your form submission to save the registration ID:

```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    // ... your existing validation code ...

    const response = await fetch("/api/cemetery/death-registration", {
      method: "POST",
      body: formDataToSend,
    });

    if (!response.ok) {
      throw new Error("Failed to submit registration");
    }

    const result = await response.json();
    
    // Save registration details for payment
    setSubmittedRegistration({
      id: result.id,
      amount: registrationType === "REGULAR" ? 500 : 750,
      deceasedName: \`\${formData.deceasedFirstName} \${formData.deceasedLastName}\`,
    });

    alert("Registration submitted successfully! Please proceed with payment.");
    
  } catch (error) {
    setError(error.message || "Failed to submit registration");
  } finally {
    setLoading(false);
  }
}
```

## Step 4: Add Payment Section

Add this section after the form (or replace the submit button):

```typescript
{submittedRegistration ? (
  // Show payment button after submission
  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
    <h3 className="text-lg font-semibold text-green-900 mb-4">
      Registration Submitted Successfully!
    </h3>
    <p className="text-gray-700 mb-4">
      Reference: <span className="font-mono font-bold">{submittedRegistration.id}</span>
    </p>
    <p className="text-gray-700 mb-6">
      Please proceed with payment to complete your registration.
    </p>
    
    <OnlinePaymentButton
      entityType="DeathRegistration"
      entityId={submittedRegistration.id}
      amount={submittedRegistration.amount}
      deceasedName={submittedRegistration.deceasedName}
      onPaymentInitiated={(transactionId) => {
        console.log('Payment initiated:', transactionId);
      }}
    />
    
    <div className="mt-4 text-center">
      <Link 
        href="/dashboard" 
        className="text-blue-600 hover:underline text-sm"
      >
        Skip payment and continue to dashboard
      </Link>
    </div>
  </div>
) : (
  // Show form submit button
  <button
    type="submit"
    disabled={loading}
    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
  >
    {loading ? "Submitting..." : "Submit Registration"}
  </button>
)}
```

## Complete Example Component Structure

\`\`\`typescript
export default function DeathRegistrationForm() {
  const [submittedRegistration, setSubmittedRegistration] = useState(null);
  
  async function handleSubmit(e) {
    // ... submit form ...
    // Then set submittedRegistration with the result
  }
  
  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* Your existing form fields */}
        
        {!submittedRegistration && (
          <button type="submit">Submit Registration</button>
        )}
      </form>
      
      {submittedRegistration && (
        <div className="payment-section">
          <OnlinePaymentButton
            entityType="DeathRegistration"
            entityId={submittedRegistration.id}
            amount={submittedRegistration.amount}
            deceasedName={submittedRegistration.deceasedName}
          />
        </div>
      )}
    </div>
  );
}
\`\`\`

## Alternative: Direct Payment on Submit

If you want users to be redirected to payment immediately after submission:

\`\`\`typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);

  try {
    // Submit registration
    const response = await fetch("/api/cemetery/death-registration", {
      method: "POST",
      body: formDataToSend,
    });
    
    const result = await response.json();
    
    // Immediately initiate payment
    const paymentResult = await initiatePayment({
      referenceId: generatePaymentReference('REG', result.id),
      amount: registrationType === "REGULAR" ? 500 : 750,
      purpose: \`Death Registration - \${formData.deceasedFirstName} \${formData.deceasedLastName}\`,
      entityType: 'DeathRegistration',
      entityId: result.id,
      transactionType: 'DEATH_REGISTRATION_FEE'
    });
    
    if (paymentResult.success && paymentResult.paymentUrl) {
      window.location.href = paymentResult.paymentUrl;
    }
    
  } catch (error) {
    setError(error.message);
    setLoading(false);
  }
}
\`\`\`

## Checking Payment Status

Users can check their payment status in the dashboard. The transaction will show:
- PENDING - Waiting for payment
- CONFIRMED - Payment successful
- CANCELLED - Payment failed

When payment is confirmed via callback, the Death Registration status automatically updates to "PAID".
