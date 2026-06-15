const MULTIPLE_SPACES_PATTERN = /\s+/g;

export function trimHintText(text: string): string {
  return text.trim().replace(MULTIPLE_SPACES_PATTERN, ' ');
}

export function normalizeHintText(text: string): string {
  return trimHintText(text).toLocaleLowerCase('sv-SE');
}

export function hintTextsMatch(a: string, b: string): boolean {
  return normalizeHintText(a) === normalizeHintText(b);
}
