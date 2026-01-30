import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const referenceId = searchParams.get("referenceId");
    const transactionId = searchParams.get("transactionId");

    if (!referenceId && !transactionId) {
      return NextResponse.json(
        { error: "Missing referenceId or transactionId parameter" },
        { status: 400 }
      );
    }

    // Find transaction
    const transaction = await prisma.transaction.findFirst({
      where: {
        userId: session.user.id,
        ...(referenceId 
          ? { referenceNumber: referenceId } 
          : transactionId 
            ? { id: transactionId }
            : {}
        ),
      },
      select: {
        id: true,
        transactionType: true,
        amount: true,
        orderOfPayment: true,
        paymentMethod: true,
        referenceNumber: true,
        status: true,
        confirmedBy: true,
        confirmedAt: true,
        entityType: true,
        entityId: true,
        remarks: true,
        createdAt: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction: {
        ...transaction,
        isPending: transaction.status === "PENDING",
        isConfirmed: transaction.status === "CONFIRMED",
        isCancelled: transaction.status === "CANCELLED",
      },
    });

  } catch (error) {
    console.error("Payment status check error:", error);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    );
  }
}
