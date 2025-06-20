/*
  Warnings:

  - You are about to drop the `processing_jobs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "processing_jobs" DROP CONSTRAINT "processing_jobs_documentId_fkey";

-- DropForeignKey
ALTER TABLE "processing_jobs" DROP CONSTRAINT "processing_jobs_userId_fkey";

-- DropTable
DROP TABLE "processing_jobs";

-- DropEnum
DROP TYPE "ProcessingJobStatus";
