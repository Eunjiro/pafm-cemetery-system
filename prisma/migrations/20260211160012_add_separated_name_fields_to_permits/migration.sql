-- AlterTable
ALTER TABLE "CremationPermit" ADD COLUMN     "deceasedDateOfBirth" TIMESTAMP(3),
ADD COLUMN     "deceasedFirstName" TEXT,
ADD COLUMN     "deceasedGender" TEXT,
ADD COLUMN     "deceasedLastName" TEXT,
ADD COLUMN     "deceasedMiddleName" TEXT,
ADD COLUMN     "deceasedSuffix" TEXT,
ALTER COLUMN "deceasedName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ExhumationPermit" ADD COLUMN     "deceasedDateOfBirth" TIMESTAMP(3),
ADD COLUMN     "deceasedFirstName" TEXT,
ADD COLUMN     "deceasedGender" TEXT,
ADD COLUMN     "deceasedLastName" TEXT,
ADD COLUMN     "deceasedMiddleName" TEXT,
ADD COLUMN     "deceasedSuffix" TEXT,
ALTER COLUMN "deceasedName" DROP NOT NULL;
