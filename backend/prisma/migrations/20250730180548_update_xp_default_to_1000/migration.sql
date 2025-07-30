/*
  Warnings:

  - You are about to drop the `SpotifyTokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SpotifyTokens" DROP CONSTRAINT "SpotifyTokens_userId_fkey";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "xp" SET DEFAULT 1000;

-- DropTable
DROP TABLE "SpotifyTokens";
