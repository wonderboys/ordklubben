-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'AUDIO', 'VIDEO');

-- CreateTable
CREATE TABLE "RebusEntry" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "difficulty" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "sourceReference" TEXT,
    "notes" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RebusEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL,
    "title" TEXT,
    "altText" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "sourceReference" TEXT,
    "attribution" TEXT,
    "license" TEXT,
    "notes" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- Migrate emoji hints to rebus entries
INSERT INTO "RebusEntry" (
    "id",
    "wordId",
    "value",
    "difficulty",
    "source",
    "sourceReference",
    "notes",
    "status",
    "createdAt",
    "updatedAt"
)
SELECT
    'rebus_' || h."id",
    h."wordId",
    h."text",
    h."difficulty",
    COALESCE(h."source", 'manual'),
    NULL,
    h."notes",
    h."status",
    h."createdAt",
    h."updatedAt"
FROM "Hint" h
WHERE h."format" = 'EMOJI';

-- Migrate image hints to media assets
INSERT INTO "MediaAsset" (
    "id",
    "wordId",
    "mediaType",
    "title",
    "altText",
    "source",
    "sourceReference",
    "attribution",
    "license",
    "notes",
    "status",
    "createdAt",
    "updatedAt"
)
SELECT
    'media_' || h."id",
    h."wordId",
    'IMAGE'::"MediaType",
    h."text",
    h."text",
    COALESCE(h."source", 'manual'),
    NULL,
    NULL,
    NULL,
    h."notes",
    h."status",
    h."createdAt",
    h."updatedAt"
FROM "Hint" h
WHERE h."format" = 'IMAGE';

-- Migrate audio hints to media assets
INSERT INTO "MediaAsset" (
    "id",
    "wordId",
    "mediaType",
    "title",
    "altText",
    "source",
    "sourceReference",
    "attribution",
    "license",
    "notes",
    "status",
    "createdAt",
    "updatedAt"
)
SELECT
    'media_' || h."id",
    h."wordId",
    'AUDIO'::"MediaType",
    h."text",
    h."text",
    COALESCE(h."source", 'manual'),
    NULL,
    NULL,
    NULL,
    h."notes",
    h."status",
    h."createdAt",
    h."updatedAt"
FROM "Hint" h
WHERE h."format" = 'AUDIO';

-- Remove migrated hints
DELETE FROM "Hint" WHERE "format" IN ('EMOJI', 'IMAGE', 'AUDIO');

-- Remove non-text hint candidates
DELETE FROM "HintCandidate" WHERE "format" IN ('EMOJI', 'IMAGE', 'AUDIO');

-- DropFormat
ALTER TABLE "Hint" DROP COLUMN "format";
ALTER TABLE "HintCandidate" DROP COLUMN "format";
DROP TYPE "HintFormat";

-- CreateIndex
CREATE UNIQUE INDEX "RebusEntry_wordId_value_key" ON "RebusEntry"("wordId", "value");
CREATE INDEX "RebusEntry_wordId_idx" ON "RebusEntry"("wordId");
CREATE INDEX "RebusEntry_status_idx" ON "RebusEntry"("status");
CREATE INDEX "MediaAsset_wordId_idx" ON "MediaAsset"("wordId");
CREATE INDEX "MediaAsset_status_idx" ON "MediaAsset"("status");
CREATE INDEX "MediaAsset_mediaType_idx" ON "MediaAsset"("mediaType");

-- AddForeignKey
ALTER TABLE "RebusEntry" ADD CONSTRAINT "RebusEntry_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;
