import { NextRequest, NextResponse } from "next/server";

/**
 * Test/Demo Payment Page
 * This page simulates the external payment gateway for development/testing
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const transactionId = searchParams.get("transactionId");
  const ref = searchParams.get("ref");
  const amount = searchParams.get("amount");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Payment Gateway</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
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
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 48px;
      margin-bottom: 10px;
    }
    h1 {
      color: #333;
      font-size: 24px;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #666;
      font-size: 14px;
    }
    .alert {
      background: #fff3cd;
      border: 2px solid #ffc107;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      color: #856404;
    }
    .alert-title {
      font-weight: bold;
      margin-bottom: 8px;
    }
    .payment-details {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #dee2e6;
    }
    .detail-row:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
      font-size: 20px;
      font-weight: bold;
      color: #28a745;
    }
    .detail-label {
      color: #666;
    }
    .detail-value {
      font-weight: 600;
      color: #333;
    }
    .payment-methods {
      margin-bottom: 24px;
    }
    .method-title {
      font-weight: 600;
      margin-bottom: 12px;
      color: #333;
    }
    .method-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .method-btn {
      border: 2px solid #e0e0e0;
      background: white;
      padding: 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
      font-weight: 600;
    }
    .method-btn:hover {
      border-color: #667eea;
      background: #f8f9ff;
    }
    .method-btn.selected {
      border-color: #667eea;
      background: #667eea;
      color: white;
    }
    .action-buttons {
      display: flex;
      gap: 12px;
    }
    .btn {
      flex: 1;
      padding: 16px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-success {
      background: #28a745;
      color: white;
    }
    .btn-success:hover {
      background: #218838;
    }
    .btn-danger {
      background: #dc3545;
      color: white;
    }
    .btn-danger:hover {
      background: #c82333;
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .loading {
      text-align: center;
      color: #666;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">💳</div>
      <h1>Test Payment Gateway</h1>
      <p class="subtitle">Development/Testing Mode</p>
    </div>

    <div class="alert">
      <div class="alert-title">⚠️ Test Mode</div>
      This is a simulated payment gateway for testing. The external payment gateway is not available or not configured.
    </div>

    <div class="payment-details">
      <div class="detail-row">
        <span class="detail-label">Reference ID:</span>
        <span class="detail-value">${ref}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Transaction ID:</span>
        <span class="detail-value">${transactionId}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Amount to Pay:</span>
        <span class="detail-value">₱${parseFloat(amount || "0").toFixed(2)}</span>
      </div>
    </div>

    <div class="payment-methods">
      <div class="method-title">Select Payment Method:</div>
      <div class="method-buttons">
        <button class="method-btn selected" data-method="gcash">GCash</button>
        <button class="method-btn" data-method="paymaya">PayMaya</button>
        <button class="method-btn" data-method="bank">Bank</button>
        <button class="method-btn" data-method="cash">Cash</button>
      </div>
    </div>

    <div class="action-buttons">
      <button class="btn btn-success" onclick="processPayment('paid')">
        ✓ Simulate Successful Payment
      </button>
      <button class="btn btn-danger" onclick="processPayment('failed')">
        ✗ Simulate Failed Payment
      </button>
    </div>

    <div class="loading" id="loading" style="display: none;">
      Processing payment...
    </div>
  </div>

  <script>
    let selectedMethod = 'gcash';

    // Handle payment method selection
    document.querySelectorAll('.method-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
        selectedMethod = this.dataset.method;
      });
    });

    async function processPayment(status) {
      const loading = document.getElementById('loading');
      const buttons = document.querySelectorAll('.btn');
      
      buttons.forEach(btn => btn.disabled = true);
      loading.style.display = 'block';

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Send callback to your server
      try {
        const callbackData = {
          reference_id: "${ref}",
          amount: "${amount}",
          purpose: "Test Payment",
          receipt_number: "RCPT-TEST-" + Date.now(),
          paid_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          payment_id: "PAY-TEST-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
          client_system: "cemetery",
          payment_status: status,
          payment_method: selectedMethod,
          phone: "09171234567"
        };

        const response = await fetch('/api/payment/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(callbackData)
        });

        if (response.ok) {
          alert(status === 'paid' 
            ? '✓ Payment successful! You can close this window and check your dashboard.' 
            : '✗ Payment failed. Transaction has been cancelled.'
          );
          window.close();
        } else {
          alert('Error processing callback. Please check the console.');
          console.error('Callback error:', await response.text());
        }
      } catch (error) {
        alert('Error: ' + error.message);
        console.error('Payment error:', error);
      } finally {
        buttons.forEach(btn => btn.disabled = false);
        loading.style.display = 'none';
      }
    }
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
