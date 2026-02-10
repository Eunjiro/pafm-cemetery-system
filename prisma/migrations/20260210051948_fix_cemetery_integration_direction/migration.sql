/*
  Warnings:

  - You are about to drop the `PendingPermit` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PermitSubmissionType" AS ENUM ('BURIAL', 'EXHUMATION');

-- CreateEnum
CREATE TYPE "CemeterySubmissionStatus" AS ENUM ('PENDING_SUBMISSION', 'SUBMITTED', 'ASSIGNED', 'REJECTED', 'SYNC_ERROR');

-- DropTable
DROP TABLE "PendingPermit";

-- DropEnum
DROP TYPE "PermitStatus";

-- DropEnum
DROP TYPE "PermitType";

-- CreateTable
CREATE TABLE "CemeteryPermitSubmission" (
    "id" TEXT NOT NULL,
    "permitId" TEXT NOT NULL,
    "permitType" "PermitSubmissionType" NOT NULL DEFAULT 'BURIAL',
    "status" "CemeterySubmissionStatus" NOT NULL DEFAULT 'PENDING_SUBMISSION',
    "deceasedFirstName" TEXT NOT NULL,
    "deceasedMiddleName" TEXT,
    "deceasedLastName" TEXT NOT NULL,
    "deceasedSuffix" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "dateOfDeath" TIMESTAMP(3) NOT NULL,
    "gender" TEXT,
    "applicantName" TEXT NOT NULL,
    "applicantEmail" TEXT,
    "applicantPhone" TEXT,
    "relationshipToDeceased" TEXT,
    "preferredCemeteryId" TEXT,
    "preferredPlotId" TEXT,
    "preferredSection" TEXT,
    "preferredLayer" INTEGER,
    "permitApprovedAt" TIMESTAMP(3) NOT NULL,
    "permitExpiryDate" TIMESTAMP(3),
    "permitDocumentUrl" TEXT,
    "submittedToCemeteryAt" TIMESTAMP(3),
    "cemeterySystemId" TEXT,
    "assignedPlotNumber" TEXT,
    "assignedCemetery" TEXT,
    "assignedCemeteryName" TEXT,
    "assignedAt" TIMESTAMP(3),
    "assignedBy" TEXT,
    "cemeteryBurialId" TEXT,
    "rejectionReason" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "lastSyncAttempt" TIMESTAMP(3),
    "syncError" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CemeteryPermitSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CemeteryPermitSubmission_permitId_key" ON "CemeteryPermitSubmission"("permitId");

-- CreateIndex
CREATE INDEX "CemeteryPermitSubmission_status_idx" ON "CemeteryPermitSubmission"("status");

-- CreateIndex
CREATE INDEX "CemeteryPermitSubmission_permitType_idx" ON "CemeteryPermitSubmission"("permitType");

-- CreateIndex
CREATE INDEX "CemeteryPermitSubmission_createdAt_idx" ON "CemeteryPermitSubmission"("createdAt");

-- CreateIndex
CREATE INDEX "CemeteryPermitSubmission_submittedToCemeteryAt_idx" ON "CemeteryPermitSubmission"("submittedToCemeteryAt");
