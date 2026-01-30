import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      referenceId,
      amount,
      purpose,
      entityType,
      entityId,
      transactionType,
    } = body;

    // Validate required fields
    if (!referenceId || !amount || !purpose || !entityType || !entityId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the base URL for the callback
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const callbackUrl = `${baseUrl}/api/payment/callback`;

    // Prepare payment request for external gateway (match their exact format)
    const paymentRequest = {
      system: "cemetery", // Your system identifier (they use "market")
      ref: referenceId,
      amount: parseFloat(amount).toFixed(2), // Must be string with 2 decimals
      purpose: purpose,
      callback: callbackUrl,
    };

    console.log("Sending payment request to gateway:", JSON.stringify(paymentRequest, null, 2));

    // Send payment request to external gateway
    const gatewayUrl = process.env.PAYMENT_GATEWAY_URL || 
      "https://revenuetreasury.goserveph.com/citizen_dashboard/digital/index.php";

    let gatewayResponse: any = {};
    let gatewayError: string | null = null;

    try {
      // Convert to form-encoded data for PHP gateway
      const formData = new URLSearchParams({
        system: paymentRequest.system,
        ref: paymentRequest.ref,
        amount: paymentRequest.amount,
        purpose: paymentRequest.purpose,
        callback: paymentRequest.callback,
      });

      const response = await fetch(gatewayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      console.log("Gateway response status:", response.status);

      if (!response.ok) {
        const responseText = await response.text();
        console.log("Gateway error response:", responseText.substring(0, 200));
        gatewayError = `Gateway responded with status ${response.status}`;
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          gatewayResponse = await response.json();
          console.log("Gateway success response:", gatewayResponse);
        } else {
          const responseText = await response.text();
          console.log("Gateway returned non-JSON response:", responseText.substring(0, 200));
          gatewayError = "Gateway returned invalid response format";
        }
      }
    } catch (fetchError: any) {
      gatewayError = fetchError.message;
      console.warn("External gateway fetch error:", fetchError.message);
    }

    // Create a pending transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        transactionType: transactionType || "CEMETERY_SERVICE",
        amount: parseFloat(amount),
        orderOfPayment: referenceId,
        paymentMethod: "ONLINE",
        referenceNumber: referenceId,
        status: "PENDING",
        entityType: entityType,
        entityId: entityId,
        remarks: `Payment initiated via external gateway: ${purpose}${gatewayError ? ` (Gateway Error: ${gatewayError})` : ''}`,
      },
    });

    // Log the payment initiation
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PAYMENT_INITIATED",
        entityType: "Transaction",
        entityId: transaction.id,
        details: `Payment initiated for ${referenceId} - Amount: ${amount}`,
      },
    });

    // If gateway is accessible, return the payment URL and form data for client-side POST
    // PHP gateways expect direct browser form submission
    const paymentUrl = gatewayError 
      ? `${baseUrl}/api/payment/test-payment?transactionId=${transaction.id}&ref=${referenceId}&amount=${amount}`
      : gatewayUrl;

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      referenceId: referenceId,
      paymentUrl: paymentUrl,
      paymentData: {
        system: paymentRequest.system,
        ref: paymentRequest.ref,
        amount: paymentRequest.amount,
        purpose: paymentRequest.purpose,
        callback: paymentRequest.callback,
      },
      message: gatewayError 
        ? "Payment initiated in test mode (external gateway unavailable). Click to simulate payment."
        : "Payment initiated successfully. Redirecting to payment gateway...",
      testMode: !!gatewayError,
    });

  } catch (error) {
    console.error("Payment initiation error:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    
    return NextResponse.json(
      { 
        error: "Failed to initiate payment",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
