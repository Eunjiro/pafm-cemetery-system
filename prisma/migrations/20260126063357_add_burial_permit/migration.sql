-- CreateEnum
CREATE TYPE "BurialType" AS ENUM ('BURIAL', 'ENTRANCE', 'NICHE');

-- CreateEnum
CREATE TYPE "NicheType" AS ENUM ('CHILD', 'ADULT');

-- CreateEnum
CREATE TYPE "BurialPermitStatus" AS ENUM ('PENDING_VERIFICATION', 'RETURNED_FOR_CORRECTION', 'APPROVED_FOR_PAYMENT', 'PAYMENT_SUBMITTED', 'REGISTERED_FOR_PICKUP', 'COMPLETED', 'REJECTED');

-- CreateTable
CREATE TABLE "BurialPermit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deceasedName" TEXT NOT NULL,
    "deceasedDateOfDeath" TIMESTAMP(3) NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterRelation" TEXT NOT NULL,
    "requesterContactNumber" TEXT NOT NULL,
    "requesterAddress" TEXT NOT NULL,
    "burialType" "BurialType" NOT NULL DEFAULT 'BURIAL',
    "nicheType" "NicheType",
    "cemeteryLocation" TEXT,
    "isFromAnotherLGU" BOOLEAN NOT NULL DEFAULT false,
    "deathCertificate" TEXT NOT NULL,
    "transferPermit" TEXT,
    "affidavitOfUndertaking" TEXT,
    "burialForm" TEXT NOT NULL,
    "validId" TEXT NOT NULL,
    "orderOfPayment" TEXT,
    "permitFee" DOUBLE PRECISION NOT NULL DEFAULT 100.00,
    "nicheFee" DOUBLE PRECISION,
    "totalFee" DOUBLE PRECISION NOT NULL DEFAULT 100.00,
    "proofOfPayment" TEXT,
    "paymentConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "status" "BurialPermitStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "remarks" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BurialPermit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BurialPermit_userId_idx" ON "BurialPermit"("userId");

-- CreateIndex
CREATE INDEX "BurialPermit_status_idx" ON "BurialPermit"("status");

-- CreateIndex
CREATE INDEX "BurialPermit_burialType_idx" ON "BurialPermit"("burialType");

-- AddForeignKey
ALTER TABLE "BurialPermit" ADD CONSTRAINT "BurialPermit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
