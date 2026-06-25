-- AlterTable
ALTER TABLE "Hint"
ADD COLUMN "importBatchId" TEXT;

-- AlterTable
ALTER TABLE "ImportBatch"
ADD COLUMN "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "importedBy" TEXT,
ADD COLUMN "sourceComment" TEXT,
ADD COLUMN "sourceLicense" TEXT,
ADD COLUMN "sourceName" TEXT,
ADD COLUMN "sourceReference" TEXT,
ADD COLUMN "sourceUrl" TEXT,
ADD COLUMN "sourceVersion" TEXT;

-- AlterTable
ALTER TABLE "WordLexicalEntry"
ADD COLUMN "importBatchId" TEXT;

-- CreateTable
CREATE TABLE "ImportBatchRow" (
    "id" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "outcome" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "answer" TEXT,
    "hint" TEXT,
    "value" TEXT,
    "reason" TEXT,
    "wordId" TEXT,
    "hintId" TEXT,
    "lexicalEntryId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportBatchRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Hint_importBatchId_idx" ON "Hint"("importBatchId");

-- CreateIndex
CREATE INDEX "WordLexicalEntry_importBatchId_idx" ON "WordLexicalEntry"("importBatchId");

-- CreateIndex
CREATE INDEX "ImportBatchRow_importBatchId_outcome_idx" ON "ImportBatchRow"("importBatchId", "outcome");

-- CreateIndex
CREATE INDEX "ImportBatchRow_importBatchId_entityType_idx" ON "ImportBatchRow"("importBatchId", "entityType");

-- CreateIndex
CREATE INDEX "ImportBatchRow_wordId_idx" ON "ImportBatchRow"("wordId");

-- CreateIndex
CREATE INDEX "ImportBatchRow_hintId_idx" ON "ImportBatchRow"("hintId");

-- CreateIndex
CREATE INDEX "ImportBatchRow_lexicalEntryId_idx" ON "ImportBatchRow"("lexicalEntryId");

-- AddForeignKey
ALTER TABLE "Hint"
ADD CONSTRAINT "Hint_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordLexicalEntry"
ADD CONSTRAINT "WordLexicalEntry_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatchRow"
ADD CONSTRAINT "ImportBatchRow_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatchRow"
ADD CONSTRAINT "ImportBatchRow_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatchRow"
ADD CONSTRAINT "ImportBatchRow_hintId_fkey" FOREIGN KEY ("hintId") REFERENCES "Hint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatchRow"
ADD CONSTRAINT "ImportBatchRow_lexicalEntryId_fkey" FOREIGN KEY ("lexicalEntryId") REFERENCES "WordLexicalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
