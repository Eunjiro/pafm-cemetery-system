import { NextRequest, NextResponse } from "next/server";

/**
 * Manual callback trigger for testing when external gateway can't reach localhost
 * Use this to manually complete payment after paying on the external gateway
 */
export async function GET(req: NextRequest) {
  // Block test endpoints in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: "Manual callback page is disabled in production" },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(req.url);
  const ref = searchParams.get("ref") || "";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Manual Payment Callback</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 600px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo { font-size: 48px; margin-bottom: 10px; }
    h1 { color: #333; font-size: 24px; margin-bottom: 8px; }
    .subtitle { color: #666; font-size: 14px; margin-bottom: 20px; }
    .alert {
      background: #fff3cd;
      border: 2px solid #ffc107;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      color: #856404;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      color: #333;
    }
    input, select {
      width: 100%;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 14px;
    }
    input:focus, select:focus {
      outline: none;
      border-color: #667eea;
    }
    .btn {
      width: 100%;
      padding: 16px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      background: #28a745;
      color: white;
    }
    .btn:hover { background: #218838; }
    .btn:disabled { background: #ccc; cursor: not-allowed; }
    .loading { display: none; text-align: center; color: #667eea; font-weight: 600; }
    .result { margin-top: 20px; padding: 16px; border-radius: 8px; display: none; }
    .result.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .result.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">💳</div>
      <h1>Manual Payment Callback</h1>
      <div class="subtitle">Complete payment after external gateway payment</div>
    </div>

    <div class="alert">
      <strong>⚠️ Testing Tool</strong><br>
      Use this when the external payment gateway cannot reach your localhost server.
      After completing payment on revenuetreasury.goserveph.com, return here and submit the payment details.
    </div>

    <form id="callbackForm">
      <div class="form-group">
        <label>Reference ID *</label>
        <input type="text" id="reference_id" value="${ref}" required placeholder="e.g., DEA-1234567890-abc123">
      </div>

      <div class="form-group">
        <label>Payment Status *</label>
        <select id="payment_status" required>
          <option value="paid">Paid (Success)</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div class="form-group">
        <label>Payment Method</label>
        <select id="payment_method">
          <option value="gcash">GCash</option>
          <option value="paymaya">PayMaya</option>
          <option value="bank">Bank Transfer</option>
          <option value="cash">Cash</option>
          <option value="online">Online Payment</option>
        </select>
      </div>

      <div class="form-group">
        <label>Receipt Number (Optional)</label>
        <input type="text" id="receipt_number" placeholder="e.g., RCPT-123456">
      </div>

      <div class="form-group">
        <label>Payment ID (Optional)</label>
        <input type="text" id="payment_id" placeholder="e.g., PAY-ABC123">
      </div>

      <button type="submit" class="btn">Submit Payment Callback</button>
    </form>

    <div class="loading" id="loading">Processing callback...</div>
    <div class="result" id="result"></div>
  </div>

  <script>
    document.getElementById('callbackForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const form = e.target;
      const loading = document.getElementById('loading');
      const result = document.getElementById('result');
      const submitBtn = form.querySelector('button');
      
      submitBtn.disabled = true;
      loading.style.display = 'block';
      result.style.display = 'none';
      
      const callbackData = {
        reference_id: document.getElementById('reference_id').value,
        payment_status: document.getElementById('payment_status').value,
        payment_method: document.getElementById('payment_method').value,
        receipt_number: document.getElementById('receipt_number').value || 'MANUAL-' + Date.now(),
        payment_id: document.getElementById('payment_id').value || 'PAY-MANUAL-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        amount: "0",
        purpose: "Manual callback",
        paid_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        client_system: "cemetery",
        phone: "09171234567"
      };

      try {
        const response = await fetch('/api/payment/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(callbackData)
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
          result.className = 'result success';
          result.textContent = '✓ Payment callback processed successfully! Redirecting to submission...';
          result.style.display = 'block';
          
          // Redirect to the submission page
          setTimeout(() => {
            if (data.entityType && data.entityId) {
              const urlMap = {
                'DeathRegistration': '/services/cemetery/death-registration-submission',
                'BurialPermit': '/services/cemetery/burial-permit-submission',
                'ExhumationPermit': '/services/cemetery/exhumation-permit-submission',
                'CremationPermit': '/services/cemetery/cremation-permit-submission',
                'DeathCertificateRequest': '/services/cemetery/death-certificate-request-submission'
              };
              
              if (urlMap[data.entityType]) {
                window.location.href = urlMap[data.entityType] + '/' + data.entityId + '?payment=success';
                return;
              }
            }
            window.location.href = '/services/cemetery/my-submissions?payment=success';
          }, 2000);
        } else {
          result.className = 'result error';
          result.textContent = '✗ Error: ' + (data.error || data.message || 'Failed to process callback');
          result.style.display = 'block';
          submitBtn.disabled = false;
        }
      } catch (error) {
        result.className = 'result error';
        result.textContent = '✗ Error: ' + error.message;
        result.style.display = 'block';
        submitBtn.disabled = false;
      } finally {
        loading.style.display = 'none';
      }
    });
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
