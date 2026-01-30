'use client';

import { useState } from 'react';
import { initiatePayment, generatePaymentReference, generatePaymentPurpose } from '@/lib/payment';

interface OnlinePaymentButtonProps {
  entityType: 'DeathRegistration' | 'BurialPermit' | 'ExhumationPermit' | 'CremationPermit' | 'DeathCertificateRequest';
  entityId: string;
  amount: number;
  purpose?: string;
  deceasedName?: string;
  onPaymentInitiated?: (transactionId: string) => void;
  disabled?: boolean;
}

export default function OnlinePaymentButton({
  entityType,
  entityId,
  amount,
  purpose,
  deceasedName,
  onPaymentInitiated,
  disabled = false,
}: OnlinePaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePayment() {
    try {
      setLoading(true);
      setError(null);

      // Generate unique reference ID
      const referenceId = generatePaymentReference(
        entityType.substring(0, 3).toUpperCase(),
        entityId
      );

      // Generate payment purpose
      const paymentPurpose = purpose || generatePaymentPurpose(
        entityType,
        deceasedName
      );

      // Initiate payment
      const result = await initiatePayment({
        referenceId,
        amount,
        purpose: paymentPurpose,
        entityType,
        entityId,
        transactionType: `${entityType.toUpperCase()}_FEE`,
      });

      if (result.success && result.paymentUrl) {
        // Notify parent component
        if (onPaymentInitiated && result.transactionId) {
          onPaymentInitiated(result.transactionId);
        }

        // Show appropriate message based on test mode
        const message = result.testMode 
          ? '⚠️ Test Mode: External gateway unavailable. You will be redirected to a test payment page.'
          : '✓ Payment initiated! Redirecting to payment gateway...';
        
        alert(message);

        // For PHP gateway, submit form with POST data
        if (result.paymentData && !result.testMode) {
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = result.paymentUrl;
          
          // Add form fields
          Object.entries(result.paymentData).forEach(([key, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = String(value);
            form.appendChild(input);
          });
          
          document.body.appendChild(form);
          form.submit();
        } else {
          // Test mode - just redirect
          window.location.href = result.paymentUrl;
        }
      } else {
        const errorMsg = result.error || result.message || 'Failed to initiate payment';
        console.error('Payment initiation failed:', result);
        setError(errorMsg);
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      const errorMsg = err.message || 'An error occurred while processing your payment';
      setError(errorMsg);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handlePayment}
        disabled={disabled || loading}
        className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          `Pay Online - ₱${amount.toFixed(2)}`
        )}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="text-xs text-gray-500 text-center">
        Secure payment via revenuetreasury.goserveph.com
      </div>
    </div>
  );
}
