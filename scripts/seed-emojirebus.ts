import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { normalizeAnswer } from "../lib/content/normalize-answer.ts";

config();

type SeedEntry = {
  answer: string;
  emoji: string;
};

const SEED_ENTRIES: SeedEntry[] = [
  { answer: "BOKMÄL", emoji: "📚🐛" },
  { answer: "SOLROS", emoji: "☀️🌻" },
  { answer: "REGNBYXOR", emoji: "🌧️👖" },
  { answer: "DROTTNINGBI", emoji: "👑🐝" },
  { answer: "FISKE", emoji: "🐟🎣" },
  { answer: "SNÖBOLL", emoji: "❄️⚽" },
  { answer: "HUNDSKALL", emoji: "🐶🔊" },
  { answer: "KAFFEKOPP", emoji: "☕🏆" },
  { answer: "MÅNSKEN", emoji: "🌙✨" },
  { answer: "BILNYCKEL", emoji: "🚗🔑" },
];

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL saknas.");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

async function main() {
  const prisma = createPrismaClient();

  try {
    let createdWords = 0;
    let createdRebuses = 0;
    let updatedRebuses = 0;

    for (const entry of SEED_ENTRIES) {
      const normalized = normalizeAnswer(entry.answer);

      const word = await prisma.word.upsert({
        where: { normalizedAnswer: normalized.normalizedAnswer },
        create: {
          answer: normalized.answer,
          normalizedAnswer: normalized.normalizedAnswer,
          length: normalized.length,
          language: "sv",
          status: "APPROVED",
          source: "manual",
          sourceReference: "seed-emojirebus",
        },
        update: {
          answer: normalized.answer,
          length: normalized.length,
          status: "APPROVED",
          sourceReference: "seed-emojirebus",
        },
      });

      if (word.createdAt.getTime() === word.updatedAt.getTime()) {
        createdWords += 1;
      }

      const existingRebus = await prisma.rebusEntry.findUnique({
        where: {
          wordId_value: {
            wordId: word.id,
            value: entry.emoji,
          },
        },
      });

      await prisma.rebusEntry.upsert({
        where: {
          wordId_value: {
            wordId: word.id,
            value: entry.emoji,
          },
        },
        create: {
          wordId: word.id,
          value: entry.emoji,
          status: "APPROVED",
          source: "manual",
          sourceReference: "seed-emojirebus",
        },
        update: {
          status: "APPROVED",
          source: "manual",
          sourceReference: "seed-emojirebus",
        },
      });

      if (existingRebus) {
        updatedRebuses += 1;
      } else {
        createdRebuses += 1;
      }
    }

    console.log(
      `Emojirebus seed klar: ${SEED_ENTRIES.length} ord, ${createdWords} nya ord, ${createdRebuses} nya rebusar, ${updatedRebuses} uppdaterade rebusar.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
