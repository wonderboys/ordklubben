-- CreateEnum
CREATE TYPE "GrammaticalGender" AS ENUM ('EN', 'ETT');
CREATE TYPE "WordRelationType" AS ENUM ('SYNONYM', 'ANTONYM', 'RELATED', 'COMPOSED_OF', 'PART_OF');

-- CreateTable
CREATE TABLE "WordLanguageData" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "partOfSpeech" "PartOfSpeech",
    "gender" "GrammaticalGender",
    "lemma" TEXT,
    "pronunciation" TEXT,
    "inflections" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WordLanguageData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordRelation" (
    "id" TEXT NOT NULL,
    "sourceWordId" TEXT NOT NULL,
    "targetWordId" TEXT NOT NULL,
    "relationType" "WordRelationType" NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "sourceReference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WordRelation_pkey" PRIMARY KEY ("id")
);

-- Migrate existing partOfSpeech from Word to WordLanguageData
INSERT INTO "WordLanguageData" ("id", "wordId", "partOfSpeech", "createdAt", "updatedAt")
SELECT
    'wld_' || w."id",
    w."id",
    w."partOfSpeech",
    w."createdAt",
    w."updatedAt"
FROM "Word" w
WHERE w."partOfSpeech" IS NOT NULL;

-- DropColumn
ALTER TABLE "Word" DROP COLUMN "partOfSpeech";

-- CreateIndex
CREATE UNIQUE INDEX "WordLanguageData_wordId_key" ON "WordLanguageData"("wordId");
CREATE INDEX "WordLanguageData_partOfSpeech_idx" ON "WordLanguageData"("partOfSpeech");
CREATE UNIQUE INDEX "WordRelation_sourceWordId_targetWordId_relationType_key" ON "WordRelation"("sourceWordId", "targetWordId", "relationType");
CREATE INDEX "WordRelation_sourceWordId_idx" ON "WordRelation"("sourceWordId");
CREATE INDEX "WordRelation_targetWordId_idx" ON "WordRelation"("targetWordId");
CREATE INDEX "WordRelation_relationType_idx" ON "WordRelation"("relationType");

-- AddForeignKey
ALTER TABLE "WordLanguageData" ADD CONSTRAINT "WordLanguageData_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WordRelation" ADD CONSTRAINT "WordRelation_sourceWordId_fkey" FOREIGN KEY ("sourceWordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WordRelation" ADD CONSTRAINT "WordRelation_targetWordId_fkey" FOREIGN KEY ("targetWordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;
