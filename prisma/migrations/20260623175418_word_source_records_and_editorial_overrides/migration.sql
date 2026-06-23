-- CreateTable
CREATE TABLE "WordSourceRecord" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "importBatchId" TEXT,
    "sourceKey" TEXT NOT NULL,
    "sourceReference" TEXT,
    "rawValue" TEXT,
    "normalizedValue" TEXT NOT NULL,
    "observedAnswer" TEXT,
    "rank" INTEGER,
    "frequency" INTEGER,
    "cefr" TEXT,
    "metadata" JSONB,
    "isExcluded" BOOLEAN NOT NULL DEFAULT false,
    "firstImportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastImportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WordSourceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordEditorialOverride" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "answer" TEXT,
    "status" "ContentStatus",
    "difficulty" INTEGER,
    "frequency" INTEGER,
    "crosswordScore" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WordEditorialOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WordSourceRecord_wordId_sourceKey_sourceReference_key" ON "WordSourceRecord"("wordId", "sourceKey", "sourceReference");
CREATE INDEX "WordSourceRecord_wordId_idx" ON "WordSourceRecord"("wordId");
CREATE INDEX "WordSourceRecord_importBatchId_idx" ON "WordSourceRecord"("importBatchId");
CREATE INDEX "WordSourceRecord_sourceKey_idx" ON "WordSourceRecord"("sourceKey");
CREATE UNIQUE INDEX "WordEditorialOverride_wordId_key" ON "WordEditorialOverride"("wordId");

-- AddForeignKey
ALTER TABLE "WordSourceRecord" ADD CONSTRAINT "WordSourceRecord_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WordSourceRecord" ADD CONSTRAINT "WordSourceRecord_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WordEditorialOverride" ADD CONSTRAINT "WordEditorialOverride_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;
