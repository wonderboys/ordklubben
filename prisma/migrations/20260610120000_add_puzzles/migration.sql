-- CreateEnum
CREATE TYPE "PuzzleType" AS ENUM ('WORD_GRID', 'DAILY_WORD', 'STEPWISE', 'CROSSWORD');

-- CreateEnum
CREATE TYPE "PuzzleStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PuzzleDirection" AS ENUM ('ACROSS', 'DOWN');

-- CreateTable
CREATE TABLE "Puzzle" (
    "id" TEXT NOT NULL,
    "type" "PuzzleType" NOT NULL DEFAULT 'WORD_GRID',
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "status" "PuzzleStatus" NOT NULL DEFAULT 'DRAFT',
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "description" TEXT,
    "publishDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Puzzle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PuzzleEntry" (
    "id" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "hintId" TEXT,
    "answerSnapshot" TEXT NOT NULL,
    "hintSnapshot" TEXT,
    "row" INTEGER NOT NULL,
    "col" INTEGER NOT NULL,
    "direction" "PuzzleDirection" NOT NULL,
    "number" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PuzzleEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Puzzle_slug_key" ON "Puzzle"("slug");

-- CreateIndex
CREATE INDEX "Puzzle_status_idx" ON "Puzzle"("status");

-- CreateIndex
CREATE INDEX "Puzzle_type_idx" ON "Puzzle"("type");

-- CreateIndex
CREATE INDEX "PuzzleEntry_puzzleId_idx" ON "PuzzleEntry"("puzzleId");

-- CreateIndex
CREATE INDEX "PuzzleEntry_wordId_idx" ON "PuzzleEntry"("wordId");

-- CreateIndex
CREATE UNIQUE INDEX "PuzzleEntry_puzzleId_wordId_key" ON "PuzzleEntry"("puzzleId", "wordId");

-- AddForeignKey
ALTER TABLE "PuzzleEntry" ADD CONSTRAINT "PuzzleEntry_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "Puzzle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuzzleEntry" ADD CONSTRAINT "PuzzleEntry_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuzzleEntry" ADD CONSTRAINT "PuzzleEntry_hintId_fkey" FOREIGN KEY ("hintId") REFERENCES "Hint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
