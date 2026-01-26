-- CreateEnum
CREATE TYPE "CremationPermitStatus" AS ENUM ('PENDING_VERIFICATION', 'RETURNED_FOR_CORRECTION', 'APPROVED_FOR_PAYMENT', 'PAYMENT_SUBMITTED', 'REGISTERED_FOR_PICKUP', 'COMPLETED', 'REJECTED');

-- CreateTable
CREATE TABLE "CremationPermit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deceasedName" TEXT NOT NULL,
    "deceasedDateOfDeath" TIMESTAMP(3) NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterRelation" TEXT NOT NULL,
    "requesterContactNumber" TEXT NOT NULL,
    "requesterAddress" TEXT NOT NULL,
    "funeralHomeName" TEXT,
    "funeralHomeContact" TEXT,
    "deathCertificate" TEXT NOT NULL,
    "cremationForm" TEXT NOT NULL,
    "transferPermit" TEXT,
    "validId" TEXT NOT NULL,
    "orderOfPayment" TEXT,
    "permitFee" DOUBLE PRECISION NOT NULL DEFAULT 100.00,
    "proofOfPayment" TEXT,
    "paymentConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "status" "CremationPermitStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "remarks" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CremationPermit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CremationPermit_userId_idx" ON "CremationPermit"("userId");

-- CreateIndex
CREATE INDEX "CremationPermit_status_idx" ON "CremationPermit"("status");

-- AddForeignKey
ALTER TABLE "CremationPermit" ADD CONSTRAINT "CremationPermit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
