'use client';

/**
 * EXAMPLE: How to integrate online payment into Death Registration Form
 * 
 * This is a simplified example showing the key changes needed.
 * Copy the relevant parts into your actual form.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import OnlinePaymentButton from '@/app/components/OnlinePaymentButton';

export default function DeathRegistrationFormWithPayment() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submittedRegistration, setSubmittedRegistration] = useState<{
    id: string;
    amount: number;
    deceasedName: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    deceasedFirstName: '',
    deceasedLastName: '',
    // ... other fields
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Prepare form data (your existing logic)
      const formDataToSend = new FormData();
      formDataToSend.append('deceasedFirstName', formData.deceasedFirstName);
      // ... append all other fields

      // 2. Submit registration
      const response = await fetch('/api/cemetery/death-registration', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Failed to submit registration');
      }

      const result = await response.json();

      // 3. Save registration info for payment
      setSubmittedRegistration({
        id: result.id,
        amount: 500.00, // or 750 for delayed registration
        deceasedName: `${formData.deceasedFirstName} ${formData.deceasedLastName}`,
      });

      // 4. Show success message
      alert('Registration submitted successfully! Please proceed with payment.');

    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit registration');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Death Registration</h1>

      {!submittedRegistration ? (
        // SHOW FORM
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Your existing form fields */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Deceased First Name
            </label>
            <input
              type="text"
              value={formData.deceasedFirstName}
              onChange={(e) => setFormData({ ...formData, deceasedFirstName: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          {/* ... more form fields ... */}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Submitting...' : 'Submit Registration'}
          </button>
        </form>
      ) : (
        // SHOW PAYMENT SECTION
        <div className="space-y-6">
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-bold text-green-900">
                Registration Submitted Successfully!
              </h2>
            </div>

            <div className="space-y-2 mb-6">
              <p className="text-gray-700">
                <span className="font-medium">Reference ID:</span>{' '}
                <span className="font-mono font-bold">{submittedRegistration.id}</span>
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Deceased Name:</span>{' '}
                {submittedRegistration.deceasedName}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Amount to Pay:</span>{' '}
                ₱{submittedRegistration.amount.toFixed(2)}
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Please proceed with payment to complete your registration.
                You will be redirected to the payment gateway.
              </p>
            </div>

            {/* THE PAYMENT BUTTON */}
            <OnlinePaymentButton
              entityType="DeathRegistration"
              entityId={submittedRegistration.id}
              amount={submittedRegistration.amount}
              deceasedName={submittedRegistration.deceasedName}
              onPaymentInitiated={(transactionId) => {
                console.log('Payment initiated, transaction:', transactionId);
                // Optional: track the transaction ID
              }}
            />

            {/* Alternative options */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4 text-center">
                Or choose another option:
              </p>
              
              <div className="flex gap-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200 text-sm"
                >
                  Pay Later (Go to Dashboard)
                </button>
                
                <button
                  onClick={() => setSubmittedRegistration(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200 text-sm"
                >
                  Submit Another Registration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ALTERNATIVE APPROACH: Direct redirect without showing payment page
 * 
 * If you want to redirect users immediately after form submission:
 */

/*
import { initiatePayment, generatePaymentReference } from '@/lib/payment';

async function handleSubmitWithDirectPayment(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);

  try {
    // Submit form
    const response = await fetch('/api/cemetery/death-registration', {
      method: 'POST',
      body: formDataToSend,
    });
    const result = await response.json();
    
    // Immediately initiate payment
    const paymentResult = await initiatePayment({
      referenceId: generatePaymentReference('REG', result.id),
      amount: 500.00,
      purpose: `Death Registration - ${formData.deceasedFirstName} ${formData.deceasedLastName}`,
      entityType: 'DeathRegistration',
      entityId: result.id,
      transactionType: 'DEATH_REGISTRATION_FEE'
    });
    
    if (paymentResult.success && paymentResult.paymentUrl) {
      // Redirect to payment gateway
      window.location.href = paymentResult.paymentUrl;
    } else {
      throw new Error('Payment initiation failed');
    }
    
  } catch (error) {
    setError(error.message);
    setLoading(false);
  }
}
*/
