-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "barangay" TEXT,
ADD COLUMN     "birthdate" TIMESTAMP(3),
ADD COLUMN     "houseNumber" TEXT,
ADD COLUMN     "mobile" TEXT,
ADD COLUMN     "profileComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "street" TEXT;
