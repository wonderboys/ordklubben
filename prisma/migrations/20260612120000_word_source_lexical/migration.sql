-- AlterEnum
ALTER TYPE "ContentStatus" ADD VALUE 'ARCHIVED';

-- CreateEnum
CREATE TYPE "LexicalEntryType" AS ENUM ('SYNONYM', 'ANTONYM', 'EXPRESSION', 'DEFINITION', 'RELATED', 'PART_OF_SPEECH');

-- AlterTable
ALTER TABLE "Word" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'manual';

-- CreateIndex
CREATE INDEX "Word_source_idx" ON "Word"("source");

-- CreateTable
CREATE TABLE "WordLexicalEntry" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "type" "LexicalEntryType" NOT NULL,
    "value" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WordLexicalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WordLexicalEntry_wordId_idx" ON "WordLexicalEntry"("wordId");

-- CreateIndex
CREATE INDEX "WordLexicalEntry_type_idx" ON "WordLexicalEntry"("type");

-- CreateIndex
CREATE UNIQUE INDEX "WordLexicalEntry_wordId_type_value_key" ON "WordLexicalEntry"("wordId", "type", "value");

-- AddForeignKey
ALTER TABLE "WordLexicalEntry" ADD CONSTRAINT "WordLexicalEntry_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;
