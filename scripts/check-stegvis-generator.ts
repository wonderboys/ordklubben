import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import type { WordBankWordWithClues } from '../lib/content/word-bank/types.ts';
import type { StegvisGeneratedPuzzle } from '../lib/content/stegvis/generator/types.ts';
import {
  buildStegvisGeneratorCorpus,
  generateStegvisPuzzleFromCorpus,
} from './stegvis-generator-corpus.ts';

config();

type HintType = 'DEFINITION' | 'ASSOCIATION' | 'SYNONYM' | 'WORDPLAY' | 'OTHER' | 'THEME';

function createMockWord(
  answer: string,
  clueText: string | null,
  clueType: HintType = 'DEFINITION',
): WordBankWordWithClues {
  const normalizedAnswer = answer.toLocaleUpperCase('sv-SE');

  return {
    id: `mock-${normalizedAnswer.toLowerCase()}`,
    answer: normalizedAnswer,
    normalizedAnswer,
    length: normalizedAnswer.length,
    language: 'sv',
    difficulty: 2,
    frequency: 0.6,
    crosswordScore: 70,
    themes: [],
    clues: clueText
      ? [
          {
            id: `mock-clue-${normalizedAnswer.toLowerCase()}`,
            wordId: `mock-${normalizedAnswer.toLowerCase()}`,
            text: clueText,
            type: clueType,
            status: 'APPROVED',
            difficulty: 2,
            tone: null,
            source: null,
          },
        ]
      : [],
  };
}

function createOfflineCorpus(): WordBankWordWithClues[] {
  return [
    createMockWord('HORN', 'Sitter på vissa djur'),
    createMockWord('KORN', 'Odlas på åkern'),
    createMockWord('KORT', 'Liten pappersbit'),
    createMockWord('FORT', 'Skyddad plats'),
    createMockWord('PORT', 'Ingång i staket'),
    createMockWord('FART', 'Hastighet'),
    createMockWord('MARS', 'Fjärde planeten'),
    createMockWord('MAKT', 'Styrka att bestämma'),
    createMockWord('MAKA', 'Partner i äktenskap'),
    createMockWord('MARA', 'Besvärande dröm'),
    createMockWord('HAND', 'Kroppsdel längst ut'),
    createMockWord('BAND', 'Smalt streck eller grupp'),
    createMockWord('LAND', 'Territorium med gränser'),
    createMockWord('SAND', 'Fint material på strand'),
    createMockWord('SKAL', 'Skydd runt ägg', null),
  ];
}

function formatClue(slot: StegvisGeneratedPuzzle['start']): string {
  return slot.hasClue && slot.clue ? slot.clue : 'Nyckel saknas';
}

function printGeneratedPuzzle(puzzle: StegvisGeneratedPuzzle, label: string) {
  console.log(`\n${label}`);
  console.log('');
  console.log(`Start: ${puzzle.start.answer} — ${formatClue(puzzle.start)}`);
  console.log(`Target: ${puzzle.target.answer} — ${formatClue(puzzle.target)}`);
  console.log('');
  console.log('Path:');
  console.log(puzzle.path.map((slot) => slot.answer).join(' → '));
  console.log('');
  console.log('Clues:');
  for (const slot of puzzle.path) {
    console.log(`${slot.answer}: ${formatClue(slot)}`);
  }
  console.log('');
  console.log('Stats:');
  console.log(`  length: ${puzzle.stats.length}`);
  console.log(`  steps: ${puzzle.stats.steps}`);
  console.log(`  candidates: ${puzzle.stats.candidates}`);
  console.log(`  pathsTried: ${puzzle.stats.pathsTried}`);
  console.log(`  missingClues: ${puzzle.stats.missingClues}`);
  console.log(`  score: ${puzzle.stats.score}`);
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL saknas.');
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

async function loadApprovedWordsFromDatabase(length: number): Promise<WordBankWordWithClues[]> {
  const prisma = createPrismaClient();

  try {
    const rows = await prisma.word.findMany({
      where: {
        status: 'APPROVED',
        length,
      },
      select: {
        id: true,
        answer: true,
        normalizedAnswer: true,
        length: true,
        language: true,
        difficulty: true,
        frequency: true,
        crosswordScore: true,
        themes: {
          select: {
            theme: {
              select: {
                id: true,
                slug: true,
                name: true,
              },
            },
          },
        },
        hints: {
          where: {
            status: 'APPROVED',
          },
          select: {
            id: true,
            wordId: true,
            text: true,
            type: true,
            status: true,
            difficulty: true,
            tone: true,
            source: true,
          },
          orderBy: [{ difficulty: 'asc' }, { type: 'asc' }, { text: 'asc' }],
        },
      },
      orderBy: [{ length: 'asc' }, { answer: 'asc' }],
    });

    return rows.map((row) => ({
      id: row.id,
      answer: row.answer,
      normalizedAnswer: row.normalizedAnswer,
      length: row.length,
      language: row.language,
      difficulty: row.difficulty,
      frequency: row.frequency,
      crosswordScore: row.crosswordScore,
      themes: row.themes.map((entry) => entry.theme),
      clues: row.hints,
    }));
  } finally {
    await prisma.$disconnect();
  }
}

let hasErrors = false;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✓ ${message}`);
    return;
  }

  hasErrors = true;
  console.error(`✗ ${message}`);
}

const offlineCorpus = buildStegvisGeneratorCorpus(createOfflineCorpus());
const offlineResult = generateStegvisPuzzleFromCorpus(offlineCorpus, {
  minSteps: 3,
  maxSteps: 6,
  seed: 42,
});

assert(offlineResult.ok, 'offline corpus generates a puzzle');

if (offlineResult.ok) {
  printGeneratedPuzzle(offlineResult.puzzle, 'Generated Stegvis puzzle (offline demo)');

  assert(
    offlineResult.puzzle.path.every(
      (slot, index, path) => index === 0 || slot.answer.length === path[index - 1].answer.length,
    ),
    'all path words share length',
  );

  assert(offlineResult.puzzle.stats.steps >= 3, 'offline puzzle meets minimum steps');
} else {
  console.error(`Offline generation failed: ${offlineResult.reason}`);
  hasErrors = true;
}

if (process.env.DATABASE_URL) {
  console.log('\nLoading approved words from ordbanken...');

  try {
    const bankWords = await loadApprovedWordsFromDatabase(4);
    const bankCorpus = buildStegvisGeneratorCorpus(bankWords);
    const bankResult = generateStegvisPuzzleFromCorpus(bankCorpus, {
      length: 4,
      minSteps: 4,
      maxSteps: 7,
      seed: 7,
    });

    if (bankResult.ok) {
      printGeneratedPuzzle(bankResult.puzzle, 'Generated Stegvis puzzle (ordbanken)');
      assert(true, 'ordbanken corpus generates a puzzle');
    } else {
      console.warn(`Ordbanken: kunde inte generera pussel (${bankResult.reason}).`);
      console.warn(
        `  candidates: ${bankResult.stats.candidates}, pathsTried: ${bankResult.stats.pathsTried}`,
      );

      if (bankResult.stats.candidates >= 2) {
        const relaxed = generateStegvisPuzzleFromCorpus(bankCorpus, {
          length: 4,
          minSteps: 1,
          maxSteps: 10,
          seed: 11,
        });

        if (relaxed.ok) {
          printGeneratedPuzzle(relaxed.puzzle, 'Generated Stegvis puzzle (ordbanken, relaxed)');
          assert(true, 'ordbanken generates puzzle with relaxed steps');
        } else {
          console.warn(`Ordbanken: inget pussel med nuvarande ordmängd (${relaxed.reason}).`);
          console.warn('  Lägg till fler APPROVED 4-bokstavsord med grannar för full validering.');
        }
      } else {
        console.warn(`Ordbanken: för få ord (${bankResult.stats.candidates}) för generering.`);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Ordbankstest misslyckades: ${message}`);
    console.warn('Offline-demo räcker för denna körning.');
  }
} else {
  console.log('\nDATABASE_URL saknas — hoppar över ordbankstest.');
}

if (hasErrors) {
  process.exit(1);
}

console.log('\nStegvis-generatorkontroll klar.');
