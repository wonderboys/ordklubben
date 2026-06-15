/** Active dice count in the prototype UI. */
export const KASTET_ACTIVE_DICE_COUNT = 3;

/** Letters shown on each die (pair length). */
export const KASTET_LETTERS_PER_DIE = 2;

/** Supported dice counts for future rounds. */
export const KASTET_SUPPORTED_DICE_COUNTS = [2, 3, 4] as const;

/** Supported letters-per-die for future rounds. */
export const KASTET_SUPPORTED_LETTERS_PER_DIE = [2, 3] as const;

export type KastetDiceCount = (typeof KASTET_SUPPORTED_DICE_COUNTS)[number];
export type KastetLettersPerDie = (typeof KASTET_SUPPORTED_LETTERS_PER_DIE)[number];

export function isSupportedKastetDiceCount(count: number): count is KastetDiceCount {
  return KASTET_SUPPORTED_DICE_COUNTS.includes(count as KastetDiceCount);
}

export function isSupportedKastetLettersPerDie(count: number): count is KastetLettersPerDie {
  return KASTET_SUPPORTED_LETTERS_PER_DIE.includes(count as KastetLettersPerDie);
}
