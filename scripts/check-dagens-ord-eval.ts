import { dagensOrdSolutionWords } from '../data/sources/curated/dagens-ord/solution-words.ts';
import { allowedSvGeneratedWords } from '../data/legacy/generated/allowed-sv.generated.ts';
import { allowedSvWords as allowedSvWordsManual } from '../data/legacy/words/allowed-sv.ts';
import { hasOnlySwedishLetters, normalizeSwedish } from '../lib/dictionary/normalize-swedish.ts';

type LetterFeedback = 'correct' | 'present' | 'absent';

const allowedSvWords =
  allowedSvGeneratedWords.length > 0 ? allowedSvGeneratedWords : allowedSvWordsManual;

const allowedSet = new Set(allowedSvWords.map((word) => normalizeSwedish(word)));

function evaluateGuess(guess: string, target: string): LetterFeedback[] {
  const normalizedGuess = normalizeSwedish(guess);
  const normalizedTarget = normalizeSwedish(target);
  const feedback = Array<LetterFeedback>(normalizedGuess.length).fill('absent');
  const remainingLetters = new Map<string, number>();

  for (const letter of normalizedTarget) {
    remainingLetters.set(letter, (remainingLetters.get(letter) ?? 0) + 1);
  }

  for (let index = 0; index < normalizedGuess.length; index += 1) {
    if (normalizedGuess[index] !== normalizedTarget[index]) {
      continue;
    }

    feedback[index] = 'correct';
    const letter = normalizedGuess[index];
    remainingLetters.set(letter, (remainingLetters.get(letter) ?? 0) - 1);
  }

  for (let index = 0; index < normalizedGuess.length; index += 1) {
    if (feedback[index] === 'correct') {
      continue;
    }

    const letter = normalizedGuess[index];
    const remaining = remainingLetters.get(letter) ?? 0;

    if (remaining > 0) {
      feedback[index] = 'present';
      remainingLetters.set(letter, remaining - 1);
    }
  }

  return feedback;
}

function assertEqual(label: string, actual: LetterFeedback[], expected: LetterFeedback[]) {
  const actualLabel = actual.join(',');
  const expectedLabel = expected.join(',');

  if (actualLabel !== expectedLabel) {
    console.error(`✗ ${label}`);
    console.error(`  expected: ${expectedLabel}`);
    console.error(`  actual:   ${actualLabel}`);
    process.exitCode = 1;
    return;
  }

  console.log(`✓ ${label}`);
}

let solutionErrors = false;

for (const word of dagensOrdSolutionWords) {
  const normalized = normalizeSwedish(word);

  if (
    normalized.length !== 5 ||
    !hasOnlySwedishLetters(normalized) ||
    !allowedSet.has(normalized)
  ) {
    console.error(`✗ solution word invalid: ${word}`);
    solutionErrors = true;
    process.exitCode = 1;
  }
}

if (!solutionErrors) {
  console.log(`✓ ${dagensOrdSolutionWords.length} solution words validated`);
}

assertEqual('mamma vs momma', evaluateGuess('momma', 'mamma'), [
  'correct',
  'absent',
  'correct',
  'correct',
  'correct',
]);

assertEqual('mamma vs ammma', evaluateGuess('ammma', 'mamma'), [
  'present',
  'present',
  'correct',
  'correct',
  'correct',
]);

assertEqual('krets vs press', evaluateGuess('press', 'krets'), [
  'absent',
  'correct',
  'correct',
  'absent',
  'correct',
]);

assertEqual('exact match', evaluateGuess('storm', 'storm'), [
  'correct',
  'correct',
  'correct',
  'correct',
  'correct',
]);

if (process.exitCode) {
  process.exit(1);
}

console.log('\nDagens Ord evaluateGuess checks passed.');
