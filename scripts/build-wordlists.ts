console.error(
  [
    'scripts/build-wordlists.ts är avvecklat.',
    'Orddata ska nu importeras från data/raw till Postgres i stället för att generera TypeScript-filer.',
    'Kör: npm run import:raw-words',
  ].join('\n'),
);

process.exitCode = 1;
