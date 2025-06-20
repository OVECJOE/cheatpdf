/*
  Warnings:

  - You are about to drop the column `currentMonthDonations` on the `donation_stats` table. All the data in the column will be lost.
  - You are about to drop the column `currentMonthStudents` on the `donation_stats` table. All the data in the column will be lost.
  - You are about to drop the column `totalStudentsHelped` on the `donation_stats` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "donation_stats" DROP COLUMN "currentMonthDonations",
DROP COLUMN "currentMonthStudents",
DROP COLUMN "totalStudentsHelped",
ADD COLUMN     "monthlyRecurring" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalDonors" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_userId_endpoint_key" ON "push_subscriptions"("userId", "endpoint");
