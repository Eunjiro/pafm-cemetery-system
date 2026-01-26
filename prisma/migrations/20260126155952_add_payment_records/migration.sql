-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL,
    "orNumber" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "serviceName" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "paymentLink" TEXT,
    "paidAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_orNumber_key" ON "PaymentRecord"("orNumber");

-- CreateIndex
CREATE INDEX "PaymentRecord_orNumber_idx" ON "PaymentRecord"("orNumber");

-- CreateIndex
CREATE INDEX "PaymentRecord_userId_idx" ON "PaymentRecord"("userId");

-- CreateIndex
CREATE INDEX "PaymentRecord_paymentStatus_idx" ON "PaymentRecord"("paymentStatus");
