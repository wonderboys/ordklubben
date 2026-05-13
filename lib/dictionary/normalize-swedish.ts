const SWEDISH_WORD_PATTERN = /^[a-zåäö]+$/;

export function normalizeSwedish(value: string) {
  return value.trim().toLocaleLowerCase("sv-SE").normalize("NFC");
}

export function hasOnlySwedishLetters(value: string) {
  return SWEDISH_WORD_PATTERN.test(value);
}
