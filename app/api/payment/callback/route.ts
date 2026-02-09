import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const {
      reference_id,
      amount,
      purpose,
      receipt_number,
      paid_at,
      payment_id,
      client_system,
      payment_status,
      payment_method,
      phone,
    } = body;

    console.log("=".repeat(60));
    console.log("Payment callback received at:", new Date().toISOString());
    console.log("Callback data:", JSON.stringify(body, null, 2));
    console.log("=".repeat(60));

    // Validate required fields
    if (!reference_id || !payment_status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify this is for our system
    if (client_system && client_system !== "cemetery") {
      return NextResponse.json(
        { error: "Invalid client system" },
        { status: 400 }
      );
    }

    // Find the pending transaction by reference number
    const transaction = await prisma.transaction.findFirst({
      where: {
        referenceNumber: reference_id,
        status: "PENDING",
      },
      include: {
        user: true,
      },
    });

    if (!transaction) {
      console.error("❌ Transaction not found for reference:", reference_id);
      console.error("Available transactions:", await prisma.transaction.findMany({
        where: { referenceNumber: { contains: reference_id.substring(0, 10) } },
        select: { id: true, referenceNumber: true, status: true }
      }));
      return NextResponse.json(
        { error: "Transaction not found or already processed" },
        { status: 404 }
      );
    }

    console.log("✓ Transaction found:", {
      id: transaction.id,
      entityType: transaction.entityType,
      entityId: transaction.entityId,
      currentStatus: transaction.status
    });

    // Update transaction based on payment status
    if (payment_status === "paid") {
      // Update transaction to CONFIRMED
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "CONFIRMED",
          paymentMethod: payment_method?.toUpperCase() || "ONLINE",
          remarks: `Payment confirmed via external gateway. Receipt: ${receipt_number}, Payment ID: ${payment_id}, Paid at: ${paid_at}`,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: transaction.userId,
          action: "PAYMENT_CONFIRMED",
          entityType: "Transaction",
          entityId: transaction.id,
          details: `Payment confirmed for ${reference_id}. Receipt: ${receipt_number}, Method: ${payment_method}, Amount: ${amount}`,
        },
      });

      // Update related entity status based on entityType
      // Pass receipt info to store as proof of payment
      const receiptInfo = `ONLINE_PAYMENT: Receipt #${receipt_number}, Payment ID: ${payment_id}, Method: ${payment_method}, Paid at: ${paid_at}`;
      await updateEntityStatus(transaction.entityType, transaction.entityId, "PAID", receiptInfo);

      console.log("✓ Payment confirmed successfully for:", reference_id);
      console.log("✓ Entity updated:", transaction.entityType, transaction.entityId);

      return NextResponse.json({
        success: true,
        message: "Payment confirmed successfully",
        transactionId: transaction.id,
        referenceId: reference_id,
        entityType: transaction.entityType,
        entityId: transaction.entityId,
      });

    } else if (payment_status === "failed" || payment_status === "cancelled") {
      // Update transaction to CANCELLED
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "CANCELLED",
          remarks: `Payment ${payment_status} via external gateway. Payment ID: ${payment_id}`,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: transaction.userId,
          action: "PAYMENT_FAILED",
          entityType: "Transaction",
          entityId: transaction.id,
          details: `Payment ${payment_status} for ${reference_id}. Payment ID: ${payment_id}`,
        },
      });

      return NextResponse.json({
        success: false,
        message: `Payment ${payment_status}`,
        transactionId: transaction.id,
        referenceId: reference_id,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Callback received",
    });

  } catch (error) {
    console.error("Payment callback error:", error);
    return NextResponse.json(
      { error: "Failed to process payment callback" },
      { status: 500 }
    );
  }
}

// Helper function to update entity status
async function updateEntityStatus(
  entityType: string,
  entityId: string,
  status: string,
  receiptInfo?: string
) {
  try {
    switch (entityType) {
      case "DeathRegistration":
        await prisma.deathRegistration.update({
          where: { id: entityId },
          data: { 
            paymentStatus: status,
            status: "REGISTERED_FOR_PICKUP", // Skip manual confirmation for online payments
            paymentConfirmed: true,
            proofOfPayment: receiptInfo || null,
            processedAt: new Date()
          },
        });
        break;
      
      case "BurialPermit":
        await prisma.burialPermit.update({
          where: { id: entityId },
          data: { 
            paymentStatus: status,
            status: "REGISTERED_FOR_PICKUP", // Skip manual confirmation for online payments
            paymentConfirmed: true,
            proofOfPayment: receiptInfo || null,
            processedAt: new Date()
          },
        });
        break;
      
      case "ExhumationPermit":
        await prisma.exhumationPermit.update({
          where: { id: entityId },
          data: { 
            paymentStatus: status,
            status: "REGISTERED_FOR_PICKUP", // Skip manual confirmation for online payments
            paymentConfirmed: true,
            proofOfPayment: receiptInfo || null,
            processedAt: new Date()
          },
        });
        break;
      
      case "CremationPermit":
        await prisma.cremationPermit.update({
          where: { id: entityId },
          data: { 
            paymentStatus: status,
            status: "REGISTERED_FOR_PICKUP", // Skip manual confirmation for online payments
            paymentProof: receiptInfo || null,
            paymentSubmittedAt: new Date(),
            processedAt: new Date()
          },
        });
        break;
      
      case "DeathCertificateRequest":
        await prisma.deathCertificateRequest.update({
          where: { id: entityId },
          data: { 
            paymentStatus: status,
            status: "REGISTERED_FOR_PICKUP", // Skip manual confirmation for online payments
            paymentProof: receiptInfo || null,
            paymentSubmittedAt: new Date(),
            processedAt: new Date()
          },
        });
        break;
      
      default:
        console.warn(`Unknown entity type: ${entityType}`);
    }
  } catch (error) {
    console.error("Failed to update entity status:", error);
  }
}

// Allow the external gateway to call this endpoint
export const dynamic = "force-dynamic";
