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

    // PHP gateways expect direct browser POST, not server-side API calls
    // We skip server-side validation and let the client POST the form directly
    const gatewayUrl = process.env.PAYMENT_GATEWAY_URL || 
      "https://revenuetreasury.goserveph.com/citizen_dashboard/digital/index.php";

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
        remarks: `Payment initiated via external gateway: ${purpose}`,
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

    // Return the payment URL and form data for client-side POST
    // PHP gateways expect direct browser form submission
    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      referenceId: referenceId,
      paymentUrl: gatewayUrl,
      paymentData: {
        system: paymentRequest.system,
        ref: paymentRequest.ref,
        amount: paymentRequest.amount,
        purpose: paymentRequest.purpose,
        callback: paymentRequest.callback,
      },
      message: "Payment initiated successfully. Redirecting to payment gateway...",
      testMode: false,
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
