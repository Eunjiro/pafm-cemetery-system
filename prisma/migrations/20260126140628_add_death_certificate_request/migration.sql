-- CreateEnum
CREATE TYPE "DeathCertificateRequestStatus" AS ENUM ('PENDING_VERIFICATION', 'RETURNED_FOR_CORRECTION', 'APPROVED_FOR_PAYMENT', 'PAYMENT_SUBMITTED', 'REGISTERED_FOR_PICKUP', 'COMPLETED', 'REJECTED');

-- CreateTable
CREATE TABLE "DeathCertificateRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deceasedFullName" TEXT NOT NULL,
    "deceasedDateOfDeath" TIMESTAMP(3) NOT NULL,
    "deceasedPlaceOfDeath" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterRelation" TEXT NOT NULL,
    "requesterContactNumber" TEXT NOT NULL,
    "requesterAddress" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "numberOfCopies" INTEGER NOT NULL DEFAULT 1,
    "pickupMethod" TEXT NOT NULL DEFAULT 'PICKUP_ONLY',
    "validId" TEXT NOT NULL,
    "authorizationLetter" TEXT,
    "orderOfPayment" TEXT,
    "certificateFee" DOUBLE PRECISION NOT NULL,
    "additionalCopiesFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFee" DOUBLE PRECISION NOT NULL,
    "submittedOrderNumber" TEXT,
    "paymentProof" TEXT,
    "paymentSubmittedAt" TIMESTAMP(3),
    "paymentVerifiedBy" TEXT,
    "paymentVerifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationNotes" TEXT,
    "certificatePrintedBy" TEXT,
    "certificatePrintedAt" TIMESTAMP(3),
    "claimSchedule" TEXT,
    "status" "DeathCertificateRequestStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "remarks" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeathCertificateRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeathCertificateRequest_userId_idx" ON "DeathCertificateRequest"("userId");

-- CreateIndex
CREATE INDEX "DeathCertificateRequest_status_idx" ON "DeathCertificateRequest"("status");

-- AddForeignKey
ALTER TABLE "DeathCertificateRequest" ADD CONSTRAINT "DeathCertificateRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
