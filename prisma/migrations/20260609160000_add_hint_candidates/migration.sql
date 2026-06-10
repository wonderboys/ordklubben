-- CreateEnum
CREATE TYPE "HintCandidateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "HintCandidate" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" "HintType" NOT NULL DEFAULT 'DEFINITION',
    "status" "HintCandidateStatus" NOT NULL DEFAULT 'PENDING',
    "difficulty" INTEGER,
    "tone" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual_candidate',
    "model" TEXT,
    "promptVersion" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "approvedHintId" TEXT,

    CONSTRAINT "HintCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HintCandidate_wordId_idx" ON "HintCandidate"("wordId");

-- CreateIndex
CREATE INDEX "HintCandidate_status_idx" ON "HintCandidate"("status");

-- AddForeignKey
ALTER TABLE "HintCandidate" ADD CONSTRAINT "HintCandidate_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HintCandidate" ADD CONSTRAINT "HintCandidate_approvedHintId_fkey" FOREIGN KEY ("approvedHintId") REFERENCES "Hint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
