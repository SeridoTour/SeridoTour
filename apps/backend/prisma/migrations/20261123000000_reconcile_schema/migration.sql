-- Reconcilia somente alterações já presentes no schema da aplicação.
-- Os quatro arquivos anteriores e seus checksums permanecem intactos.
BEGIN;

-- A relação antiga tem IDs/datas que não cabem no modelo implícito atual.
-- Não apagar ou converter dados legados silenciosamente.
DO $$
BEGIN
  IF to_regclass('public."ItineraryPlace"') IS NOT NULL THEN
    LOCK TABLE "ItineraryPlace" IN ACCESS EXCLUSIVE MODE;
    IF EXISTS (SELECT 1 FROM "ItineraryPlace") THEN
      RAISE EXCEPTION 'ItineraryPlace contém dados: revisar a conversão dos vínculos antes de migrar.';
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE "Role" AS ENUM ('USER', 'GUIA');
  END IF;
END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" "Role" NOT NULL DEFAULT 'USER';
ALTER TABLE "Place" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "Place" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "Place" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
ALTER TABLE "Place" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "Place" WHERE "description" IS NULL OR "category" IS NULL OR "latitude" IS NULL OR "longitude" IS NULL) THEN
    RAISE EXCEPTION 'Locais legados precisam de descrição, categoria e coordenadas revisadas; não preencher por suposição.';
  END IF;
END $$;

ALTER TABLE "Place" ALTER COLUMN "description" SET NOT NULL;
ALTER TABLE "Place" ALTER COLUMN "category" SET NOT NULL;
ALTER TABLE "Place" ALTER COLUMN "latitude" SET NOT NULL;
ALTER TABLE "Place" ALTER COLUMN "longitude" SET NOT NULL;
ALTER TABLE "Itinerary" ALTER COLUMN "duracaoDias" DROP DEFAULT;

CREATE TABLE IF NOT EXISTS "Token" (
  "id" TEXT NOT NULL,
  "hash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "Token_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "_ItineraryToPlace" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL,
  CONSTRAINT "_ItineraryToPlace_AB_pkey" PRIMARY KEY ("A", "B"),
  CONSTRAINT "_ItineraryToPlace_A_fkey" FOREIGN KEY ("A") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "_ItineraryToPlace_B_fkey" FOREIGN KEY ("B") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "_ItineraryToPlace_B_index" ON "_ItineraryToPlace"("B");

-- A verificação inicial manteve a tabela bloqueada e comprovadamente vazia.
DROP TABLE IF EXISTS "ItineraryPlace";
COMMIT;
