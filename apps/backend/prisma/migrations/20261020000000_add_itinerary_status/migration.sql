-- CreateEnum
CREATE TYPE "ItineraryStatus" AS ENUM ('RASCUNHO', 'EM_ANALISE', 'PUBLICADO', 'REJEITADO');

-- AlterTable
ALTER TABLE "Itinerary"
ADD COLUMN "status" "ItineraryStatus" NOT NULL DEFAULT 'RASCUNHO',
ADD COLUMN "rejectionReason" TEXT;

-- CreateIndex
CREATE INDEX "Itinerary_status_idx" ON "Itinerary"("status");
