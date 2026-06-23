console.error(
  [
    'scripts/build-wordlists.ts är inte längre den primära vägen för orddata.',
    'Ord ska importeras från data/sources/raw till Postgres via råimporten.',
    'Kör: npm run import:raw-words',
  ].join('\n'),
);

process.exitCode = 1;
