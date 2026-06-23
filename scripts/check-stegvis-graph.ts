import {
  buildWordGraph,
  findShortestPath,
  getNeighbors,
  isOneLetterApart,
  normalizeGraphWord,
} from './stegvis-word-graph.ts';

type CheckResult = {
  name: string;
  pass: boolean;
  detail?: string;
};

const results: CheckResult[] = [];

function check(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail });

  if (pass) {
    console.log(`✓ ${name}`);
    return;
  }

  console.error(`✗ ${name}${detail ? `: ${detail}` : ''}`);
}

check('normalizeGraphWord maps horn to HORN', normalizeGraphWord('horn') === 'HORN');
check('normalizeGraphWord trims whitespace', normalizeGraphWord('  korn  ') === 'KORN');

check('HORN → KORN is one letter apart', isOneLetterApart('HORN', 'KORN'));
check('horn → korn is one letter apart', isOneLetterApart('horn', 'korn'));
check('HORN → PORT is not one letter apart', !isOneLetterApart('HORN', 'PORT'));
check('HORN → HORN is not one letter apart', !isOneLetterApart('HORN', 'HORN'));
check('HORN → HORNET is not one letter apart', !isOneLetterApart('HORN', 'HORNET'));

const chainWords = ['HORN', 'KORN', 'KORT', 'FORT', 'PORT', 'SAND', 'BAND', 'LAND'];
const graph = buildWordGraph(chainWords);

check(
  'graph contains all chain words',
  chainWords.every((word) => graph.has(word)),
);

const hornNeighbors = getNeighbors('HORN', chainWords);
check('HORN neighbors include KORN', hornNeighbors.includes('KORN'));
check('HORN neighbors exclude PORT', !hornNeighbors.includes('PORT'));

const hornToPort = findShortestPath('HORN', 'PORT', graph);
check(
  'shortest path HORN → PORT exists',
  hornToPort !== null && hornToPort[0] === 'HORN' && hornToPort.at(-1) === 'PORT',
  hornToPort?.join(' → '),
);

if (hornToPort) {
  for (let index = 0; index < hornToPort.length - 1; index += 1) {
    const left = hornToPort[index];
    const right = hornToPort[index + 1];
    check(`path step ${left} → ${right} is valid`, isOneLetterApart(left, right));
  }
}

check('no path between unrelated lengths', findShortestPath('HORN', 'HORNET', graph) === null);

const failed = results.filter((result) => !result.pass);

if (failed.length > 0) {
  process.exit(1);
}

console.log(`\nAlla ${results.length} Stegvis-grafkontroller godkända.`);
