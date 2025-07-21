-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "color" TEXT,
ALTER COLUMN "source" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Suggestion" ADD COLUMN     "end" TIMESTAMP(3),
ADD COLUMN     "priority" TEXT,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "start" TIMESTAMP(3),
ALTER COLUMN "timestamp" SET DEFAULT CURRENT_TIMESTAMP;
