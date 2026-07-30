-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "tickets_archived_idx" ON "tickets"("archived");
