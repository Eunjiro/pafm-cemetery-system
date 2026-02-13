-- CreateEnum
CREATE TYPE "FacilityActivityType" AS ENUM ('MEETING', 'SEMINAR', 'SPORTS_EVENT', 'OUTREACH', 'EXHIBIT', 'TRAINING', 'WEDDING', 'ASSEMBLY', 'LGU_EVENT', 'CULTURAL_EVENT', 'OTHER');

-- CreateEnum
CREATE TYPE "FacilityType" AS ENUM ('CONFERENCE_HALL', 'GYMNASIUM', 'TRAINING_ROOM', 'AUDITORIUM', 'CULTURAL_CENTER', 'MULTIPURPOSE_HALL', 'COVERED_COURT', 'OTHER_FACILITY');

-- CreateEnum
CREATE TYPE "FacilityReservationStatus" AS ENUM ('PENDING_REVIEW', 'AWAITING_REQUIREMENTS', 'AWAITING_PAYMENT', 'PAYMENT_VERIFIED', 'APPROVED', 'REJECTED', 'CANCELLED', 'IN_USE', 'COMPLETED', 'COMPLETED_WITH_DAMAGES', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "FacilityDayStatus" AS ENUM ('IN_USE', 'COMPLETED', 'COMPLETED_WITH_DAMAGES', 'NO_SHOW');

-- CreateTable
CREATE TABLE "FacilityReservation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "organizationName" TEXT,
    "contactPerson" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "activityType" "FacilityActivityType" NOT NULL,
    "activityTypeOther" TEXT,
    "description" TEXT,
    "facilityType" "FacilityType" NOT NULL,
    "facilityDetails" TEXT,
    "desiredStartDate" TIMESTAMP(3) NOT NULL,
    "desiredEndDate" TIMESTAMP(3) NOT NULL,
    "estimatedParticipants" INTEGER NOT NULL,
    "layoutFile" TEXT,
    "governmentPermit" TEXT,
    "barangayEndorsement" TEXT,
    "additionalNotes" TEXT,
    "paymentStatus" "PaymentType" NOT NULL DEFAULT 'UNPAID',
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "paymentProof" TEXT,
    "amountDue" DOUBLE PRECISION,
    "amountPaid" DOUBLE PRECISION,
    "exemptionMemo" TEXT,
    "status" "FacilityReservationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "remarks" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "gatePassCode" TEXT,
    "gatePassUsed" BOOLEAN NOT NULL DEFAULT false,
    "facilityDayStatus" "FacilityDayStatus",
    "markedCompletedAt" TIMESTAMP(3),
    "noShow" BOOLEAN NOT NULL DEFAULT false,
    "inspectionNotes" TEXT,
    "hasDamages" BOOLEAN NOT NULL DEFAULT false,
    "damageDescription" TEXT,
    "additionalBilling" DOUBLE PRECISION,
    "holdExpiresAt" TIMESTAMP(3),
    "autoCancelled" BOOLEAN NOT NULL DEFAULT false,
    "isLguEvent" BOOLEAN NOT NULL DEFAULT false,
    "isPriority" BOOLEAN NOT NULL DEFAULT false,
    "isPaymentExempted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacilityReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FacilityReservation_gatePassCode_key" ON "FacilityReservation"("gatePassCode");

-- CreateIndex
CREATE INDEX "FacilityReservation_userId_idx" ON "FacilityReservation"("userId");

-- CreateIndex
CREATE INDEX "FacilityReservation_status_idx" ON "FacilityReservation"("status");

-- CreateIndex
CREATE INDEX "FacilityReservation_desiredStartDate_idx" ON "FacilityReservation"("desiredStartDate");

-- CreateIndex
CREATE INDEX "FacilityReservation_facilityType_idx" ON "FacilityReservation"("facilityType");

-- CreateIndex
CREATE INDEX "FacilityReservation_gatePassCode_idx" ON "FacilityReservation"("gatePassCode");

-- CreateIndex
CREATE INDEX "FacilityReservation_createdAt_idx" ON "FacilityReservation"("createdAt");

-- AddForeignKey
ALTER TABLE "FacilityReservation" ADD CONSTRAINT "FacilityReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
