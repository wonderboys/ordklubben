-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('ACTIVE', 'HIDDEN', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EditionStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EditionType" AS ENUM ('DAILY', 'WEEKLY', 'FEATURED', 'TEST', 'STATIC');

-- CreateEnum
CREATE TYPE "GameEditionWordRole" AS ENUM ('SOLUTION', 'SEED', 'START', 'TARGET', 'STEP', 'ENTRY');

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameWord" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "canBeGuess" BOOLEAN NOT NULL DEFAULT false,
    "canBeSolution" BOOLEAN NOT NULL DEFAULT false,
    "canBeSeed" BOOLEAN NOT NULL DEFAULT false,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER,
    "difficulty" INTEGER,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameEdition" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "title" TEXT,
    "editionType" "EditionType" NOT NULL,
    "status" "EditionStatus" NOT NULL DEFAULT 'DRAFT',
    "publishAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameEdition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameEditionWord" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "role" "GameEditionWordRole" NOT NULL,
    "position" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameEditionWord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "GameWord_gameId_wordId_key" ON "GameWord"("gameId", "wordId");

-- CreateIndex
CREATE INDEX "GameWord_gameId_blocked_idx" ON "GameWord"("gameId", "blocked");

-- CreateIndex
CREATE INDEX "GameWord_gameId_canBeGuess_idx" ON "GameWord"("gameId", "canBeGuess");

-- CreateIndex
CREATE INDEX "GameWord_gameId_canBeSolution_idx" ON "GameWord"("gameId", "canBeSolution");

-- CreateIndex
CREATE INDEX "GameWord_gameId_canBeSeed_idx" ON "GameWord"("gameId", "canBeSeed");

-- CreateIndex
CREATE INDEX "GameWord_wordId_idx" ON "GameWord"("wordId");

-- CreateIndex
CREATE INDEX "GameEdition_gameId_status_idx" ON "GameEdition"("gameId", "status");

-- CreateIndex
CREATE INDEX "GameEdition_gameId_publishAt_idx" ON "GameEdition"("gameId", "publishAt");

-- CreateIndex
CREATE UNIQUE INDEX "GameEditionWord_editionId_wordId_role_key" ON "GameEditionWord"("editionId", "wordId", "role");

-- CreateIndex
CREATE INDEX "GameEditionWord_editionId_role_position_idx" ON "GameEditionWord"("editionId", "role", "position");

-- CreateIndex
CREATE INDEX "GameEditionWord_wordId_idx" ON "GameEditionWord"("wordId");

-- AddForeignKey
ALTER TABLE "GameWord" ADD CONSTRAINT "GameWord_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameWord" ADD CONSTRAINT "GameWord_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameEdition" ADD CONSTRAINT "GameEdition_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameEditionWord" ADD CONSTRAINT "GameEditionWord_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "GameEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameEditionWord" ADD CONSTRAINT "GameEditionWord_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
