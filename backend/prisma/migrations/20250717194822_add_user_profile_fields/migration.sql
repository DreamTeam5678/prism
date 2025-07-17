/*
  Warnings:

  - You are about to drop the column `energyAccess` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `locationType` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `supportStyle` on the `UserProfile` table. All the data in the column will be lost.
  - The `planningStyle` column on the `UserProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `climate` column on the `UserProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "energyAccess",
DROP COLUMN "locationType",
DROP COLUMN "role",
DROP COLUMN "supportStyle",
ADD COLUMN     "behaviorTags" TEXT[],
ADD COLUMN     "currentMode" TEXT[],
ADD COLUMN     "environment" TEXT[],
DROP COLUMN "planningStyle",
ADD COLUMN     "planningStyle" TEXT[],
DROP COLUMN "climate",
ADD COLUMN     "climate" TEXT[];
