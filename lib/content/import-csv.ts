export type CsvRow = Record<string, string>;

export type ParsedCsv = {
  headers: string[];
  rows: CsvRow[];
};

function parseCsvRow(line: string) {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

export function parseCsv(csvText: string): ParsedCsv {
  const lines = csvText
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    throw new Error('CSV-filen är tom.');
  }

  const headers = parseCsvRow(lines[0]).map((header) => header.trim().toLocaleLowerCase('sv-SE'));

  const rows = lines.slice(1).map((line) => {
    const values = parseCsvRow(line);
    const row: CsvRow = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });

    return row;
  });

  return { headers, rows };
}

export function requireCsvHeaders(headers: string[], requiredHeaders: string[]) {
  const missing = requiredHeaders.filter((header) => !headers.includes(header));

  if (missing.length > 0) {
    throw new Error(`CSV-filen saknar kolumn(er): ${missing.join(', ')}.`);
  }
}
