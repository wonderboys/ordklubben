#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const TARGET_DIRS = ['app', 'components'];
const FILE_PATTERN = /\.(tsx|ts)$/;

const LEGACY_PATTERNS = [
  { name: 'rounded-2xl', regex: /\brounded-2xl\b/ },
  { name: 'rounded-full', regex: /\brounded-full\b/ },
  { name: 'rounded-xl', regex: /\brounded-xl\b/ },
  { name: 'rounded-[…]', regex: /\brounded-\[/ },
  { name: 'bg-accent-soft', regex: /\bbg-accent-soft\b/ },
  { name: 'bg-surface-strong', regex: /\bbg-surface-strong\b/ },
  { name: 'bg-surface', regex: /\bbg-surface(?!-)/ },
  { name: 'border-border', regex: /\bborder-border\b/ },
  { name: 'text-muted', regex: /\btext-muted\b/ },
];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      if (entry === 'node_modules') continue;
      walk(path, files);
      continue;
    }
    if (FILE_PATTERN.test(entry)) files.push(path);
  }
  return files;
}

const matches = [];

for (const dir of TARGET_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const content = readFileSync(file, 'utf8');
    const lines = content.split('\n');

    for (const pattern of LEGACY_PATTERNS) {
      lines.forEach((line, index) => {
        if (pattern.regex.test(line)) {
          matches.push({
            file: relative(ROOT, file),
            line: index + 1,
            pattern: pattern.name,
            text: line.trim(),
          });
        }
      });
    }
  }
}

if (matches.length > 0) {
  console.error('Legacy design patterns found in app/components:\n');
  for (const match of matches) {
    console.error(`${match.file}:${match.line} [${match.pattern}] ${match.text}`);
  }
  console.error('\nUse Print Theme tokens instead. See docs/design-foundation.md § Guardrails.');
  process.exit(1);
}

console.log('No legacy design patterns in app/components.');
