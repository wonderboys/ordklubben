import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    files: [
      'app/(games)/**/*.{ts,tsx}',
      'components/games/**/*.{ts,tsx}',
      'lib/game/**/*.{ts,tsx}',
      'lib/games/**/rules.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/data/*', '../data/*', '../../data/*', '../../../data/*'],
              message: 'Spel och runtimekod får inte läsa direkt från data/. Använd providers.',
            },
          ],
          paths: [
            {
              name: '@/lib/db/prisma',
              message: 'Använd DB-access via lib/server/* eller spelspecifika providers.',
            },
            {
              name: '@prisma/client',
              message: 'Prisma-typer och klient ska hållas i lib/server/* eller lib/db/*.',
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
