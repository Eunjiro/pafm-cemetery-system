-- CreateEnum
CREATE TYPE "RegistrationType" AS ENUM ('REGULAR', 'DELAYED');

-- AlterTable
ALTER TABLE "DeathRegistration" ADD COLUMN     "affidavitOfDelayed" TEXT,
ADD COLUMN     "burialCertificate" TEXT,
ADD COLUMN     "funeralCertificate" TEXT,
ADD COLUMN     "processingDeadline" TIMESTAMP(3),
ADD COLUMN     "psaNoRecord" TEXT,
ADD COLUMN     "registrationFee" DOUBLE PRECISION NOT NULL DEFAULT 50.00,
ADD COLUMN     "registrationType" "RegistrationType" NOT NULL DEFAULT 'REGULAR';

-- CreateIndex
CREATE INDEX "DeathRegistration_registrationType_idx" ON "DeathRegistration"("registrationType");
