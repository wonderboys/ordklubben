import { allowedSvGeneratedWords } from '../data/generated/allowed-sv.generated.ts';
import { stegvisPuzzles } from '../data/stegvis/puzzles.ts';
import { allowedSvWords as allowedSvWordsManual } from '../data/words/allowed-sv.ts';

const allowedSvWords =
  allowedSvGeneratedWords.length > 0 ? allowedSvGeneratedWords : allowedSvWordsManual;
import {
  normalizeStegvisWordForCheck,
  validateStegvisSampleSolution,
} from './stegvis-puzzle-validation.ts';

const allowedWordSet = new Set(allowedSvWords.map((word) => normalizeStegvisWordForCheck(word)));

let hasErrors = false;

for (const puzzle of stegvisPuzzles) {
  const result = validateStegvisSampleSolution(puzzle, allowedWordSet);

  if (result.valid) {
    console.log(`✓ ${puzzle.id}`);
    continue;
  }

  hasErrors = true;
  console.error(`✗ ${puzzle.id}: ${result.message}`);
}

if (hasErrors) {
  process.exit(1);
}

console.log(`\nAlla ${stegvisPuzzles.length} Stegvis-pussel validerade.`);
