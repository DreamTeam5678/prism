/*
  Warnings:

  - You are about to drop the column `location` on the `Suggestion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Suggestion" DROP COLUMN "location",
ADD COLUMN     "environment" TEXT;
