/*
  Warnings:

  - The values [PENDING,FAILED] on the enum `DocumentExtractionStage` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "ProcessingJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- AlterEnum
BEGIN;
CREATE TYPE "DocumentExtractionStage_new" AS ENUM ('PDF_PARSE', 'PDF_LOADER', 'PER_PAGE');
ALTER TABLE "documents" ALTER COLUMN "extractionStage" DROP DEFAULT;
ALTER TABLE "documents" ALTER COLUMN "extractionStage" TYPE "DocumentExtractionStage_new" USING ("extractionStage"::text::"DocumentExtractionStage_new");
ALTER TYPE "DocumentExtractionStage" RENAME TO "DocumentExtractionStage_old";
ALTER TYPE "DocumentExtractionStage_new" RENAME TO "DocumentExtractionStage";
DROP TYPE "DocumentExtractionStage_old";
ALTER TABLE "documents" ALTER COLUMN "extractionStage" SET DEFAULT 'PDF_PARSE';
COMMIT;

-- CreateTable
CREATE TABLE "processing_jobs" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ProcessingJobStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processing_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "processing_jobs_documentId_key" ON "processing_jobs"("documentId");

-- CreateIndex
CREATE INDEX "processing_jobs_status_scheduledAt_idx" ON "processing_jobs"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "processing_jobs_userId_idx" ON "processing_jobs"("userId");

-- AddForeignKey
ALTER TABLE "processing_jobs" ADD CONSTRAINT "processing_jobs_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processing_jobs" ADD CONSTRAINT "processing_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
