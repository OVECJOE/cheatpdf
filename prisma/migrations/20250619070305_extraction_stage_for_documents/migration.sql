/*
  Warnings:

  - You are about to drop the column `company` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DocumentExtractionStage" AS ENUM ('PDF_PARSE', 'PDF_LOADER', 'PER_PAGE');

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "extractionStage" "DocumentExtractionStage" NOT NULL DEFAULT 'PDF_PARSE';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "company",
DROP COLUMN "role";
