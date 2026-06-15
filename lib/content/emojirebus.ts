import { getPrisma, isDatabaseConfigured } from '@/lib/db/prisma';

export type EmojirebusPuzzle = {
  wordId: string;
  answerLength: number;
  normalizedAnswer: string;
  emojiHint: string;
};

export async function loadEmojirebusPuzzle(): Promise<EmojirebusPuzzle | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const prisma = getPrisma();

  const word = await prisma.word.findFirst({
    where: {
      rebusEntries: {
        some: {
          status: 'APPROVED',
        },
      },
    },
    orderBy: { answer: 'asc' },
    select: {
      id: true,
      length: true,
      normalizedAnswer: true,
      rebusEntries: {
        where: {
          status: 'APPROVED',
        },
        orderBy: [{ updatedAt: 'desc' }],
        take: 1,
        select: {
          value: true,
        },
      },
    },
  });

  if (!word || word.rebusEntries.length === 0) {
    return null;
  }

  return {
    wordId: word.id,
    answerLength: word.length,
    normalizedAnswer: word.normalizedAnswer,
    emojiHint: word.rebusEntries[0].value,
  };
}
