-- CreateEnum
CREATE TYPE "DeathRegistrationStatus" AS ENUM ('PENDING_VERIFICATION', 'RETURNED_FOR_CORRECTION', 'APPROVED_FOR_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_CONFIRMED', 'REGISTERED_FOR_PICKUP', 'COMPLETED', 'REJECTED');

-- CreateTable
CREATE TABLE "DeathRegistration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deceasedFirstName" TEXT NOT NULL,
    "deceasedMiddleName" TEXT,
    "deceasedLastName" TEXT NOT NULL,
    "deceasedDateOfBirth" TIMESTAMP(3) NOT NULL,
    "deceasedDateOfDeath" TIMESTAMP(3) NOT NULL,
    "deceasedPlaceOfDeath" TEXT NOT NULL,
    "deceasedCauseOfDeath" TEXT NOT NULL,
    "deceasedGender" TEXT NOT NULL,
    "informantName" TEXT NOT NULL,
    "informantRelation" TEXT NOT NULL,
    "informantContactNumber" TEXT NOT NULL,
    "informantAddress" TEXT NOT NULL,
    "municipalForm103" TEXT NOT NULL,
    "informantValidId" TEXT NOT NULL,
    "swabTestResult" TEXT,
    "orderOfPayment" TEXT,
    "proofOfPayment" TEXT,
    "paymentConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "status" "DeathRegistrationStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "remarks" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeathRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeathRegistration_userId_idx" ON "DeathRegistration"("userId");

-- CreateIndex
CREATE INDEX "DeathRegistration_status_idx" ON "DeathRegistration"("status");

-- AddForeignKey
ALTER TABLE "DeathRegistration" ADD CONSTRAINT "DeathRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
