-- CreateEnum
CREATE TYPE "AmenityType" AS ENUM ('SWIMMING_ENTRANCE', 'COTTAGE', 'TABLE', 'ROOM', 'OTHER');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING_REVIEW', 'AWAITING_PAYMENT', 'PAYMENT_VERIFIED', 'APPROVED', 'REJECTED', 'CANCELLED', 'CHECKED_IN', 'NO_SHOW', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('UNPAID', 'AWAITING_PAYMENT', 'PAID', 'VERIFIED', 'EXEMPTED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('BIRTHDAY', 'ASSEMBLY', 'WEDDING', 'OUTREACH', 'LGU_EVENT', 'SPORTS', 'COMMERCIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "VenueType" AS ENUM ('PICNIC_GROUND', 'COVERED_COURT', 'AMPHITHEATER', 'CAFETERIA', 'EVENT_HALL', 'OTHER_VENUE');

-- CreateEnum
CREATE TYPE "VenueBookingStatus" AS ENUM ('PENDING_REVIEW', 'AWAITING_REQUIREMENTS', 'AWAITING_PAYMENT', 'PAYMENT_VERIFIED', 'APPROVED', 'REJECTED', 'CANCELLED', 'IN_USE', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "VenueDayStatus" AS ENUM ('IN_USE', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "MaintenanceCategory" AS ENUM ('DAMAGED_BENCH', 'FALLEN_TREE', 'PLAYGROUND_EQUIPMENT', 'VANDALISM', 'LIGHTING', 'CLEANLINESS', 'PATHWAY', 'FENCING', 'IRRIGATION', 'OTHER');

-- CreateEnum
CREATE TYPE "MaintenanceUrgency" AS ENUM ('NORMAL', 'PRIORITY', 'HAZARD');

-- CreateEnum
CREATE TYPE "RepairScale" AS ENUM ('MINOR', 'MAJOR');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('LOGGED', 'PENDING_INSPECTION', 'UNDER_INSPECTION', 'APPROVED_FOR_REPAIR', 'PENDING_MATERIALS', 'PENDING_CONTRACTOR', 'IN_PROGRESS', 'COMPLETED', 'CLOSED', 'REJECTED');

-- CreateTable
CREATE TABLE "AmenityReservation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "preferredDate" TIMESTAMP(3) NOT NULL,
    "preferredTime" TEXT NOT NULL,
    "numberOfGuests" INTEGER NOT NULL,
    "amenityType" "AmenityType" NOT NULL,
    "amenityDetails" TEXT,
    "proofOfResidency" TEXT,
    "specialRequests" TEXT,
    "paymentStatus" "PaymentType" NOT NULL DEFAULT 'UNPAID',
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "paymentProof" TEXT,
    "amountDue" DOUBLE PRECISION,
    "amountPaid" DOUBLE PRECISION,
    "exemptionMemo" TEXT,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "remarks" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "entryPassCode" TEXT,
    "entryPassUsed" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" TIMESTAMP(3),
    "checkedInBy" TEXT,
    "noShow" BOOLEAN NOT NULL DEFAULT false,
    "holdExpiresAt" TIMESTAMP(3),
    "autoCancelled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmenityReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueBooking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "organizationName" TEXT,
    "eventType" "EventType" NOT NULL,
    "eventTypeOther" TEXT,
    "venueType" "VenueType" NOT NULL,
    "venueDetails" TEXT,
    "desiredStartDate" TIMESTAMP(3) NOT NULL,
    "desiredEndDate" TIMESTAMP(3) NOT NULL,
    "estimatedAttendees" INTEGER NOT NULL,
    "layoutFile" TEXT,
    "contactPerson" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "governmentPermit" TEXT,
    "barangayEndorsement" TEXT,
    "paymentStatus" "PaymentType" NOT NULL DEFAULT 'UNPAID',
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "paymentProof" TEXT,
    "amountDue" DOUBLE PRECISION,
    "amountPaid" DOUBLE PRECISION,
    "exemptionMemo" TEXT,
    "status" "VenueBookingStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "remarks" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "gatePassCode" TEXT,
    "gatePassUsed" BOOLEAN NOT NULL DEFAULT false,
    "venueStatus" "VenueDayStatus",
    "markedCompletedAt" TIMESTAMP(3),
    "noShow" BOOLEAN NOT NULL DEFAULT false,
    "holdExpiresAt" TIMESTAMP(3),
    "autoCancelled" BOOLEAN NOT NULL DEFAULT false,
    "isLguSponsored" BOOLEAN NOT NULL DEFAULT false,
    "isPriority" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VenueBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParkMaintenanceRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reporterName" TEXT,
    "parkLocation" TEXT NOT NULL,
    "issueCategory" "MaintenanceCategory" NOT NULL,
    "issueCategoryOther" TEXT,
    "description" TEXT NOT NULL,
    "photo1" TEXT,
    "photo2" TEXT,
    "photo3" TEXT,
    "inspectionScheduled" TIMESTAMP(3),
    "inspectionNotes" TEXT,
    "inspectionPhotos" TEXT,
    "urgencyLevel" "MaintenanceUrgency" NOT NULL DEFAULT 'NORMAL',
    "repairScale" "RepairScale",
    "materialsStatus" TEXT,
    "materialsNotes" TEXT,
    "assignedTeam" TEXT,
    "assignedTo" TEXT,
    "assignedAt" TIMESTAMP(3),
    "workStartedAt" TIMESTAMP(3),
    "beforePhotos" TEXT,
    "afterPhotos" TEXT,
    "workReport" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'LOGGED',
    "remarks" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParkMaintenanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AmenityReservation_entryPassCode_key" ON "AmenityReservation"("entryPassCode");

-- CreateIndex
CREATE INDEX "AmenityReservation_userId_idx" ON "AmenityReservation"("userId");

-- CreateIndex
CREATE INDEX "AmenityReservation_status_idx" ON "AmenityReservation"("status");

-- CreateIndex
CREATE INDEX "AmenityReservation_preferredDate_idx" ON "AmenityReservation"("preferredDate");

-- CreateIndex
CREATE INDEX "AmenityReservation_amenityType_idx" ON "AmenityReservation"("amenityType");

-- CreateIndex
CREATE INDEX "AmenityReservation_entryPassCode_idx" ON "AmenityReservation"("entryPassCode");

-- CreateIndex
CREATE UNIQUE INDEX "VenueBooking_gatePassCode_key" ON "VenueBooking"("gatePassCode");

-- CreateIndex
CREATE INDEX "VenueBooking_userId_idx" ON "VenueBooking"("userId");

-- CreateIndex
CREATE INDEX "VenueBooking_status_idx" ON "VenueBooking"("status");

-- CreateIndex
CREATE INDEX "VenueBooking_desiredStartDate_idx" ON "VenueBooking"("desiredStartDate");

-- CreateIndex
CREATE INDEX "VenueBooking_venueType_idx" ON "VenueBooking"("venueType");

-- CreateIndex
CREATE INDEX "VenueBooking_gatePassCode_idx" ON "VenueBooking"("gatePassCode");

-- CreateIndex
CREATE INDEX "ParkMaintenanceRequest_userId_idx" ON "ParkMaintenanceRequest"("userId");

-- CreateIndex
CREATE INDEX "ParkMaintenanceRequest_status_idx" ON "ParkMaintenanceRequest"("status");

-- CreateIndex
CREATE INDEX "ParkMaintenanceRequest_parkLocation_idx" ON "ParkMaintenanceRequest"("parkLocation");

-- CreateIndex
CREATE INDEX "ParkMaintenanceRequest_issueCategory_idx" ON "ParkMaintenanceRequest"("issueCategory");

-- CreateIndex
CREATE INDEX "ParkMaintenanceRequest_urgencyLevel_idx" ON "ParkMaintenanceRequest"("urgencyLevel");

-- CreateIndex
CREATE INDEX "ParkMaintenanceRequest_createdAt_idx" ON "ParkMaintenanceRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "AmenityReservation" ADD CONSTRAINT "AmenityReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueBooking" ADD CONSTRAINT "VenueBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParkMaintenanceRequest" ADD CONSTRAINT "ParkMaintenanceRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
