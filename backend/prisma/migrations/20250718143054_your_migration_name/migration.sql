/*
  Warnings:

  - You are about to drop the column `climate` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `environment` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `planningStyle` on the `UserProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "climate",
DROP COLUMN "environment",
DROP COLUMN "planningStyle";
