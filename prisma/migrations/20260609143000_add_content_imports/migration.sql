-- CreateEnum
CREATE TYPE "ImportBatchType" AS ENUM ('WORDS', 'HINTS', 'WORDS_AND_HINTS');

-- AlterTable
ALTER TABLE "ImportBatch"
ADD COLUMN "type" "ImportBatchType" NOT NULL DEFAULT 'WORDS',
ADD COLUMN "errorRows" JSONB,
ADD COLUMN "summary" JSONB;

-- CreateIndex / unique protection for duplicate hints per word
CREATE UNIQUE INDEX "Hint_wordId_text_key" ON "Hint"("wordId", "text");
