-- Hint format enum and column
CREATE TYPE "HintFormat" AS ENUM ('TEXT', 'IMAGE', 'AUDIO', 'EMOJI', 'HYBRID');

ALTER TABLE "Hint" ADD COLUMN "format" "HintFormat" NOT NULL DEFAULT 'TEXT';
ALTER TABLE "HintCandidate" ADD COLUMN "format" "HintFormat" NOT NULL DEFAULT 'TEXT';

-- New hint types
ALTER TYPE "HintType" ADD VALUE IF NOT EXISTS 'PARAPHRASE';
ALTER TYPE "HintType" ADD VALUE IF NOT EXISTS 'EXAMPLE';

-- Legacy type migration
UPDATE "Hint" SET "type" = 'PARAPHRASE' WHERE "type" = 'OTHER';
UPDATE "HintCandidate" SET "type" = 'PARAPHRASE' WHERE "type" = 'OTHER';

-- Source normalization
UPDATE "Hint" SET "source" = 'manual' WHERE "source" IS NULL OR "source" = 'manual_candidate';
UPDATE "Hint" SET "source" = 'import' WHERE "source" = 'admin_csv';
UPDATE "HintCandidate" SET "source" = 'manual' WHERE "source" = 'manual_candidate';
UPDATE "HintCandidate" SET "source" = 'import' WHERE "source" = 'admin_csv';

-- Candidate default source
ALTER TABLE "HintCandidate" ALTER COLUMN "source" SET DEFAULT 'manual';
