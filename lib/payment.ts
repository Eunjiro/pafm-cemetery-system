/**
 * Payment Gateway Integration Utilities
 * For integrating with external payment system (revenuetreasury.goserveph.com)
 */

export interface PaymentInitiationRequest {
  referenceId: string;
  amount: number;
  purpose: string;
  entityType: string;
  entityId: string;
  transactionType?: string;
}

export interface PaymentCallbackData {
  reference_id: string;
  amount: string;
  purpose: string;
  receipt_number: string;
  paid_at: string;
  payment_id: string;
  client_system: string;
  payment_status: "paid" | "failed" | "cancelled" | "pending";
  payment_method: string;
  phone?: string;
}

export interface PaymentInitiationResponse {
  success: boolean;
  transactionId?: string;
  referenceId?: string;
  paymentUrl?: string;
  paymentData?: {
    system: string;
    ref: string;
    amount: string;
    purpose: string;
    callback: string;
  };
  message: string;
  error?: string;
  testMode?: boolean;
}

/**
 * Initiate payment with external gateway
 */
export async function initiatePayment(
  data: PaymentInitiationRequest
): Promise<PaymentInitiationResponse> {
  try {
    const response = await fetch("/api/payment/initiate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: result.error || "Failed to initiate payment",
      };
    }

    return result;
  } catch (error) {
    console.error("Payment initiation error:", error);
    return {
      success: false,
      message: "Failed to connect to payment gateway",
    };
  }
}

/**
 * Generate reference ID for payment
 */
export function generatePaymentReference(
  prefix: string,
  entityId: string
): string {
  const timestamp = Date.now();
  const shortId = entityId.substring(0, 8);
  return `${prefix}-${timestamp}-${shortId}`;
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Validate payment callback data
 */
export function validateCallbackData(data: any): boolean {
  const required = [
    "reference_id",
    "amount",
    "payment_status",
  ];
  
  return required.every(field => field in data && data[field] !== null);
}

/**
 * Get payment method display name
 */
export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    gcash: "GCash",
    paymaya: "PayMaya",
    cash: "Cash",
    online: "Online Payment",
    bank: "Bank Transfer",
  };
  
  return labels[method.toLowerCase()] || method;
}

/**
 * Generate payment purpose description
 */
export function generatePaymentPurpose(
  serviceType: string,
  details?: string
): string {
  const serviceLabels: Record<string, string> = {
    DeathRegistration: "Death Registration",
    BurialPermit: "Burial Permit",
    ExhumationPermit: "Exhumation Permit",
    CremationPermit: "Cremation Permit",
    DeathCertificateRequest: "Death Certificate Request",
  };
  
  const label = serviceLabels[serviceType] || serviceType;
  return details ? `${label} - ${details}` : label;
}
