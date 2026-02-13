-- CreateEnum
CREATE TYPE "DrainageIssueType" AS ENUM ('DECLOGGING', 'DESILTING', 'MANHOLE_REPAIR', 'GUTTER_MAINTENANCE', 'INLET_MAINTENANCE', 'FLOODING', 'OTHER');

-- CreateEnum
CREATE TYPE "DrainageUrgency" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "DrainageRequestStatus" AS ENUM ('PENDING_REVIEW', 'INSPECTION_SCHEDULED', 'INSPECTION_COMPLETED', 'FOR_APPROVAL', 'APPROVED_WITH_MATERIALS', 'PENDING_NO_MATERIALS', 'FOR_IMPLEMENTATION', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "StructureType" AS ENUM ('RESIDENTIAL', 'APARTMENT_TOWNHOUSE', 'COMMERCIAL', 'SCHOOL_CHURCH_OTHERS');

-- CreateEnum
CREATE TYPE "WaterConnectionStatus" AS ENUM ('PENDING_EVALUATION', 'RETURNED_INCOMPLETE', 'FOR_INSPECTION', 'FOR_BILLING', 'AWAITING_PAYMENT', 'PAYMENT_CONFIRMED', 'INSTALLATION_SCHEDULED', 'INSTALLATION_ONGOING', 'ACTIVE_CONNECTION', 'REJECTED');

-- CreateEnum
CREATE TYPE "WaterIssueType" AS ENUM ('NO_WATER', 'LOW_PRESSURE', 'PIPE_LEAK', 'SERVICE_INTERRUPTION', 'METER_PROBLEM', 'OTHER');

-- CreateEnum
CREATE TYPE "WaterIssueStatus" AS ENUM ('PENDING_INSPECTION', 'FOR_SITE_INSPECTION', 'RESOLVED_DUPLICATE', 'FOR_REPAIR', 'FOR_SCHEDULING', 'AWAITING_PARTS', 'REPAIR_IN_PROGRESS', 'RESOLVED', 'CANNOT_REPAIR', 'CLOSED');

-- CreateTable
CREATE TABLE "DrainageRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "barangay" TEXT NOT NULL,
    "exactLocation" TEXT,
    "issueType" "DrainageIssueType" NOT NULL DEFAULT 'DECLOGGING',
    "description" TEXT,
    "urgency" "DrainageUrgency" NOT NULL DEFAULT 'NORMAL',
    "photo1" TEXT,
    "photo2" TEXT,
    "photo3" TEXT,
    "assignedTo" TEXT,
    "assignedAt" TIMESTAMP(3),
    "inspectionDate" TIMESTAMP(3),
    "inspectionNotes" TEXT,
    "inspectionPhotos" TEXT,
    "programOfWorks" TEXT,
    "materialsStatus" TEXT,
    "materialsNotes" TEXT,
    "workReport" TEXT,
    "beforePhoto" TEXT,
    "afterPhoto" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "citizenFeedback" TEXT,
    "citizenRating" INTEGER,
    "status" "DrainageRequestStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "remarks" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrainageRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "houseNumber" TEXT,
    "street" TEXT NOT NULL,
    "barangay" TEXT NOT NULL,
    "landmark" TEXT,
    "structureType" "StructureType" NOT NULL DEFAULT 'RESIDENTIAL',
    "validId" TEXT NOT NULL,
    "propertyProof" TEXT NOT NULL,
    "propertyProofType" TEXT,
    "assignedInspector" TEXT,
    "inspectionDate" TIMESTAMP(3),
    "mainlineAvailable" BOOLEAN,
    "tappingPointAvailable" BOOLEAN,
    "pipeDistance" DOUBLE PRECISION,
    "estimatedMaterials" TEXT,
    "inspectionNotes" TEXT,
    "inspectionPhotos" TEXT,
    "pipeSize" TEXT,
    "connectionFee" DOUBLE PRECISION,
    "paymentType" TEXT,
    "orNumber" TEXT,
    "paymentConfirmedBy" TEXT,
    "paymentConfirmedAt" TIMESTAMP(3),
    "assignedTeam" TEXT,
    "installationDate" TIMESTAMP(3),
    "installationStatus" TEXT,
    "installationNotes" TEXT,
    "status" "WaterConnectionStatus" NOT NULL DEFAULT 'PENDING_EVALUATION',
    "remarks" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaterConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterIssue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reporterName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "issueType" "WaterIssueType" NOT NULL DEFAULT 'NO_WATER',
    "description" TEXT,
    "photo1" TEXT,
    "photo2" TEXT,
    "photo3" TEXT,
    "assignedTo" TEXT,
    "assignedAt" TIMESTAMP(3),
    "confirmedIssueType" TEXT,
    "estimatedMaterials" TEXT,
    "inspectionNotes" TEXT,
    "inspectionPhotos" TEXT,
    "repairDate" TIMESTAMP(3),
    "repairNotes" TEXT,
    "completionPhoto" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "issueTag" TEXT,
    "status" "WaterIssueStatus" NOT NULL DEFAULT 'PENDING_INSPECTION',
    "remarks" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaterIssue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DrainageRequest_userId_idx" ON "DrainageRequest"("userId");

-- CreateIndex
CREATE INDEX "DrainageRequest_status_idx" ON "DrainageRequest"("status");

-- CreateIndex
CREATE INDEX "DrainageRequest_barangay_idx" ON "DrainageRequest"("barangay");

-- CreateIndex
CREATE INDEX "DrainageRequest_issueType_idx" ON "DrainageRequest"("issueType");

-- CreateIndex
CREATE INDEX "DrainageRequest_createdAt_idx" ON "DrainageRequest"("createdAt");

-- CreateIndex
CREATE INDEX "WaterConnection_userId_idx" ON "WaterConnection"("userId");

-- CreateIndex
CREATE INDEX "WaterConnection_status_idx" ON "WaterConnection"("status");

-- CreateIndex
CREATE INDEX "WaterConnection_barangay_idx" ON "WaterConnection"("barangay");

-- CreateIndex
CREATE INDEX "WaterConnection_createdAt_idx" ON "WaterConnection"("createdAt");

-- CreateIndex
CREATE INDEX "WaterIssue_userId_idx" ON "WaterIssue"("userId");

-- CreateIndex
CREATE INDEX "WaterIssue_status_idx" ON "WaterIssue"("status");

-- CreateIndex
CREATE INDEX "WaterIssue_issueType_idx" ON "WaterIssue"("issueType");

-- CreateIndex
CREATE INDEX "WaterIssue_createdAt_idx" ON "WaterIssue"("createdAt");

-- AddForeignKey
ALTER TABLE "DrainageRequest" ADD CONSTRAINT "DrainageRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterConnection" ADD CONSTRAINT "WaterConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterIssue" ADD CONSTRAINT "WaterIssue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
