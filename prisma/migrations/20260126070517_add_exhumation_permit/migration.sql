-- CreateEnum
CREATE TYPE "ExhumationPermitStatus" AS ENUM ('PENDING_VERIFICATION', 'RETURNED_FOR_CORRECTION', 'APPROVED_FOR_PAYMENT', 'PAYMENT_SUBMITTED', 'REGISTERED_FOR_PICKUP', 'COMPLETED', 'REJECTED');

-- CreateTable
CREATE TABLE "ExhumationPermit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deceasedName" TEXT NOT NULL,
    "deceasedDateOfDeath" TIMESTAMP(3) NOT NULL,
    "deceasedDateOfBurial" TIMESTAMP(3) NOT NULL,
    "deceasedPlaceOfBurial" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterRelation" TEXT NOT NULL,
    "requesterContactNumber" TEXT NOT NULL,
    "requesterAddress" TEXT NOT NULL,
    "reasonForExhumation" TEXT NOT NULL,
    "exhumationLetter" TEXT NOT NULL,
    "deathCertificate" TEXT NOT NULL,
    "validId" TEXT NOT NULL,
    "orderOfPayment" TEXT,
    "permitFee" DOUBLE PRECISION NOT NULL DEFAULT 100.00,
    "proofOfPayment" TEXT,
    "paymentConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "status" "ExhumationPermitStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "remarks" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExhumationPermit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExhumationPermit_userId_idx" ON "ExhumationPermit"("userId");

-- CreateIndex
CREATE INDEX "ExhumationPermit_status_idx" ON "ExhumationPermit"("status");

-- AddForeignKey
ALTER TABLE "ExhumationPermit" ADD CONSTRAINT "ExhumationPermit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
