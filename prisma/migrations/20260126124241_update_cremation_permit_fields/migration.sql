/*
  Warnings:

  - You are about to drop the column `paymentConfirmed` on the `CremationPermit` table. All the data in the column will be lost.
  - You are about to drop the column `proofOfPayment` on the `CremationPermit` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CremationPermit" DROP COLUMN "paymentConfirmed",
DROP COLUMN "proofOfPayment",
ADD COLUMN     "paymentProof" TEXT,
ADD COLUMN     "paymentSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "paymentVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "paymentVerifiedBy" TEXT,
ADD COLUMN     "submittedOrderNumber" TEXT,
ADD COLUMN     "verificationNotes" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT;
