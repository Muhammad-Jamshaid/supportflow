-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "trackingToken" TEXT NOT NULL DEFAULT gen_random_uuid();

-- CreateIndex
CREATE UNIQUE INDEX "tickets_trackingToken_key" ON "tickets"("trackingToken");

