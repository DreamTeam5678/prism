-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastCompletionDate" TIMESTAMP(3),
ADD COLUMN     "streak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "xp" INTEGER NOT NULL DEFAULT 0;
