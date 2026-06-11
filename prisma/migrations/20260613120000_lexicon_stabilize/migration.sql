-- CreateEnum
CREATE TYPE "PartOfSpeech" AS ENUM ('SUBSTANTIV', 'VERB', 'ADJEKTIV', 'ADVERB', 'PRONOMEN', 'RAKNEORD', 'INTERJEKTION', 'FORKORTNING', 'OVRIGT');

-- AlterTable: Word
ALTER TABLE "Word" ADD COLUMN "sourceReference" TEXT;
ALTER TABLE "Word" ADD COLUMN "partOfSpeech" "PartOfSpeech";

-- Backfill legacy project-specific sources on Word
UPDATE "Word"
SET
  "source" = 'import',
  "sourceReference" = COALESCE("sourceReference", 'stegvis_seed')
WHERE "source" = 'stegvis_seed';

UPDATE "Word"
SET
  "source" = 'import',
  "sourceReference" = COALESCE("sourceReference", 'fotboll_seed')
WHERE "source" = 'fotboll_seed';

-- AlterTable: WordLexicalEntry — add columns before enum migration
ALTER TABLE "WordLexicalEntry" ADD COLUMN "sourceReference" TEXT;
ALTER TABLE "WordLexicalEntry" ADD COLUMN "linkedWordId" TEXT;

UPDATE "WordLexicalEntry"
SET
  "source" = 'import',
  "sourceReference" = COALESCE("sourceReference", 'stegvis_seed')
WHERE "source" = 'stegvis_seed';

UPDATE "WordLexicalEntry"
SET
  "source" = 'import',
  "sourceReference" = COALESCE("sourceReference", 'fotboll_seed')
WHERE "source" = 'fotboll_seed';

-- Remove lexical entries that stored ordklass as a post type
DELETE FROM "WordLexicalEntry" WHERE "type" = 'PART_OF_SPEECH';

-- Replace LexicalEntryType enum (drop PART_OF_SPEECH)
CREATE TYPE "LexicalEntryType_new" AS ENUM ('DEFINITION', 'SYNONYM', 'ANTONYM', 'EXPRESSION', 'RELATED');

ALTER TABLE "WordLexicalEntry"
  ALTER COLUMN "type" TYPE "LexicalEntryType_new"
  USING ("type"::text::"LexicalEntryType_new");

DROP TYPE "LexicalEntryType";
ALTER TYPE "LexicalEntryType_new" RENAME TO "LexicalEntryType";

-- AddForeignKey
ALTER TABLE "WordLexicalEntry"
  ADD CONSTRAINT "WordLexicalEntry_linkedWordId_fkey"
  FOREIGN KEY ("linkedWordId") REFERENCES "Word"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "WordLexicalEntry_linkedWordId_idx" ON "WordLexicalEntry"("linkedWordId");
