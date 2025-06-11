-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DonationFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'BIANNUAL');

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "donorEmail" TEXT NOT NULL,
    "donorName" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "stripeSessionId" TEXT,
    "stripePaymentId" TEXT,
    "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
    "targetCountry" TEXT,
    "targetLanguage" TEXT,
    "studentsToHelp" INTEGER NOT NULL,
    "donationFrequency" "DonationFrequency" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_beneficiaries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "donationId" TEXT NOT NULL,
    "monthsGranted" INTEGER NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_beneficiaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation_stats" (
    "id" TEXT NOT NULL,
    "totalDonations" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalStudentsHelped" INTEGER NOT NULL DEFAULT 0,
    "currentMonthDonations" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentMonthStudents" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donation_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "donations_stripeSessionId_key" ON "donations"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "donations_stripePaymentId_key" ON "donations"("stripePaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "student_beneficiaries_userId_donationId_key" ON "student_beneficiaries"("userId", "donationId");

-- AddForeignKey
ALTER TABLE "student_beneficiaries" ADD CONSTRAINT "student_beneficiaries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_beneficiaries" ADD CONSTRAINT "student_beneficiaries_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "donations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
