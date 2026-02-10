-- CreateEnum
CREATE TYPE "PlotType" AS ENUM ('LAWN', 'FAMILY', 'MAUSOLEUM', 'NICHE', 'COLUMBARIUM');

-- CreateEnum
CREATE TYPE "PlotStatus" AS ENUM ('AVAILABLE', 'PARTIALLY_OCCUPIED', 'FULLY_OCCUPIED', 'RESERVED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "PermitType" AS ENUM ('BURIAL', 'EXHUMATION', 'NICHE', 'ENTRANCE');

-- CreateEnum
CREATE TYPE "PermitStatus" AS ENUM ('PENDING', 'ASSIGNED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Cemetery" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "totalPlots" INTEGER NOT NULL DEFAULT 0,
    "availablePlots" INTEGER NOT NULL DEFAULT 0,
    "occupiedPlots" INTEGER NOT NULL DEFAULT 0,
    "sections" INTEGER NOT NULL DEFAULT 0,
    "coordinates" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cemetery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plot" (
    "id" TEXT NOT NULL,
    "plotNumber" TEXT NOT NULL,
    "plotType" "PlotType" NOT NULL DEFAULT 'LAWN',
    "status" "PlotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "cemeteryId" TEXT NOT NULL,
    "sectionId" TEXT,
    "sectionName" TEXT,
    "coordinates" JSONB,
    "totalLayers" INTEGER NOT NULL DEFAULT 3,
    "occupiedLayers" INTEGER NOT NULL DEFAULT 0,
    "availableLayers" JSONB,
    "burialCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Burial" (
    "id" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "deceasedFirstName" TEXT NOT NULL,
    "deceasedMiddleName" TEXT,
    "deceasedLastName" TEXT NOT NULL,
    "deceasedSuffix" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "dateOfDeath" TIMESTAMP(3) NOT NULL,
    "dateOfBurial" TIMESTAMP(3),
    "gender" TEXT,
    "layer" INTEGER NOT NULL DEFAULT 1,
    "relationship" TEXT,
    "notes" TEXT,
    "permitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Burial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingPermit" (
    "id" TEXT NOT NULL,
    "permitId" TEXT NOT NULL,
    "permitType" "PermitType" NOT NULL DEFAULT 'BURIAL',
    "status" "PermitStatus" NOT NULL DEFAULT 'PENDING',
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
    "assignedPlotNumber" TEXT,
    "assignedCemetery" TEXT,
    "assignedAt" TIMESTAMP(3),
    "assignedBy" TEXT,
    "burialId" TEXT,
    "rejectionReason" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "metadata" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingPermit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Cemetery_active_idx" ON "Cemetery"("active");

-- CreateIndex
CREATE INDEX "Plot_status_idx" ON "Plot"("status");

-- CreateIndex
CREATE INDEX "Plot_cemeteryId_idx" ON "Plot"("cemeteryId");

-- CreateIndex
CREATE UNIQUE INDEX "Plot_cemeteryId_plotNumber_key" ON "Plot"("cemeteryId", "plotNumber");

-- CreateIndex
CREATE INDEX "Burial_plotId_idx" ON "Burial"("plotId");

-- CreateIndex
CREATE INDEX "Burial_permitId_idx" ON "Burial"("permitId");

-- CreateIndex
CREATE UNIQUE INDEX "PendingPermit_permitId_key" ON "PendingPermit"("permitId");

-- CreateIndex
CREATE UNIQUE INDEX "PendingPermit_burialId_key" ON "PendingPermit"("burialId");

-- CreateIndex
CREATE INDEX "PendingPermit_status_idx" ON "PendingPermit"("status");

-- CreateIndex
CREATE INDEX "PendingPermit_permitType_idx" ON "PendingPermit"("permitType");

-- CreateIndex
CREATE INDEX "PendingPermit_createdAt_idx" ON "PendingPermit"("createdAt");

-- AddForeignKey
ALTER TABLE "Plot" ADD CONSTRAINT "Plot_cemeteryId_fkey" FOREIGN KEY ("cemeteryId") REFERENCES "Cemetery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Burial" ADD CONSTRAINT "Burial_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "Plot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
