-- CreateTable
CREATE TABLE "PuzzleBlockedCell" (
    "id" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "col" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PuzzleBlockedCell_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PuzzleBlockedCell_puzzleId_idx" ON "PuzzleBlockedCell"("puzzleId");

-- CreateIndex
CREATE UNIQUE INDEX "PuzzleBlockedCell_puzzleId_row_col_key" ON "PuzzleBlockedCell"("puzzleId", "row", "col");

-- AddForeignKey
ALTER TABLE "PuzzleBlockedCell" ADD CONSTRAINT "PuzzleBlockedCell_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "Puzzle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
