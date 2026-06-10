-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "HintType" AS ENUM ('DEFINITION', 'SYNONYM', 'ASSOCIATION', 'WORDPLAY', 'THEME', 'OTHER');

-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "normalizedAnswer" TEXT NOT NULL,
    "length" INTEGER NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'sv',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "difficulty" INTEGER,
    "frequency" INTEGER,
    "crosswordScore" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hint" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" "HintType" NOT NULL DEFAULT 'DEFINITION',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "difficulty" INTEGER,
    "tone" TEXT,
    "source" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordTheme" (
    "wordId" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,

    CONSTRAINT "WordTheme_pkey" PRIMARY KEY ("wordId","themeId")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "filename" TEXT,
    "source" TEXT,
    "status" "ImportBatchStatus" NOT NULL DEFAULT 'PENDING',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "skippedRows" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Word_normalizedAnswer_key" ON "Word"("normalizedAnswer");

-- CreateIndex
CREATE INDEX "Word_answer_idx" ON "Word"("answer");

-- CreateIndex
CREATE INDEX "Word_status_idx" ON "Word"("status");

-- CreateIndex
CREATE INDEX "Hint_wordId_idx" ON "Hint"("wordId");

-- CreateIndex
CREATE INDEX "Hint_status_idx" ON "Hint"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Theme_slug_key" ON "Theme"("slug");

-- CreateIndex
CREATE INDEX "WordTheme_themeId_idx" ON "WordTheme"("themeId");

-- AddForeignKey
ALTER TABLE "Hint" ADD CONSTRAINT "Hint_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordTheme" ADD CONSTRAINT "WordTheme_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordTheme" ADD CONSTRAINT "WordTheme_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;
