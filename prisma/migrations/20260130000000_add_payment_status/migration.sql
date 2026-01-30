-- Add paymentStatus field to all cemetery service models for better payment tracking

-- Add to DeathRegistration
ALTER TABLE "DeathRegistration" ADD COLUMN "paymentStatus" TEXT DEFAULT 'PENDING';

-- Add to BurialPermit
ALTER TABLE "BurialPermit" ADD COLUMN "paymentStatus" TEXT DEFAULT 'PENDING';

-- Add to ExhumationPermit
ALTER TABLE "ExhumationPermit" ADD COLUMN "paymentStatus" TEXT DEFAULT 'PENDING';

-- Add to CremationPermit (if exists)
ALTER TABLE "CremationPermit" ADD COLUMN "paymentStatus" TEXT DEFAULT 'PENDING';

-- Add to DeathCertificateRequest
ALTER TABLE "DeathCertificateRequest" ADD COLUMN "paymentStatus" TEXT DEFAULT 'PENDING';

-- Create index for faster payment status queries
CREATE INDEX "DeathRegistration_paymentStatus_idx" ON "DeathRegistration"("paymentStatus");
CREATE INDEX "BurialPermit_paymentStatus_idx" ON "BurialPermit"("paymentStatus");
CREATE INDEX "ExhumationPermit_paymentStatus_idx" ON "ExhumationPermit"("paymentStatus");
CREATE INDEX "CremationPermit_paymentStatus_idx" ON "CremationPermit"("paymentStatus");
CREATE INDEX "DeathCertificateRequest_paymentStatus_idx" ON "DeathCertificateRequest"("paymentStatus");
