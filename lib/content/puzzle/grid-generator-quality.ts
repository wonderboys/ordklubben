import { normalizeAnswer } from "@/lib/content/normalize-answer";

/** Very short generic words — usable as gap fillers but heavily penalized. */
export const EMERGENCY_WORDS = new Set([
  "IS",
  "IK",
  "EM",
  "OS",
  "TÅ",
  "ÖS",
  "EN",
  "ET",
  "AT",
  "OM",
  "AV",
  "PÅ",
  "NÅ",
  "SÅ",
  "ÅT",
  "UT",
  "IN",
  "UP",
  "NU",
  "DE",
  "DU",
  "VI",
  "PÅ",
  "ÅR",
  "ÖR",
  "AR",
  "OR",
  "ER",
  "ES",
  "AS",
  "AD",
  "AK",
  "AL",
  "AN",
  "AP",
  "AX",
  "BY",
  "BO",
  "DA",
  "EG",
  "EK",
  "EL",
  "EN",
  "EX",
  "FA",
  "GÅ",
  "GÖ",
  "HA",
  "HE",
  "HO",
  "HY",
  "ID",
  "JA",
  "JO",
  "KO",
  "LA",
  "LE",
  "LO",
  "LY",
  "ME",
  "MI",
  "MO",
  "MY",
  "NE",
  "NI",
  "NO",
  "NY",
  "OJ",
  "OK",
  "ON",
  "OP",
  "RA",
  "RE",
  "RO",
  "RY",
  "SE",
  "SI",
  "SO",
  "SY",
  "TA",
  "TE",
  "TI",
  "TO",
  "TY",
  "UR",
  "VA",
  "VE",
  "VI",
  "VO",
  "VY",
]);

export function normalizeAnswerKey(answer: string) {
  return normalizeAnswer(answer).normalizedAnswer;
}

export function isEmergencyWord(answer: string) {
  return EMERGENCY_WORDS.has(normalizeAnswerKey(answer));
}

/** Minimal tie-breaker only — length mix is scored separately. */
export function scoreWordLengthBonus(length: number) {
  if (length <= 3) {
    return 2;
  }

  if (length <= 7) {
    return 4;
  }

  return 1;
}

export function scoreThemeWordBonus(themeSelected: boolean, hasThemeMatch: boolean) {
  if (!themeSelected) {
    return 0;
  }

  return hasThemeMatch ? 58 : -32;
}

export function scoreEmergencyWordPenalty(
  answer: string,
  phase: "anchor" | "crossing" | "gap",
) {
  if (!isEmergencyWord(answer)) {
    return 0;
  }

  if (phase === "gap") {
    return -32;
  }

  if (phase === "anchor") {
    return -80;
  }

  return -62;
}

export function countEmergencyWords(answers: string[]) {
  return answers.filter((answer) => isEmergencyWord(answer)).length;
}

export function computeThemeMetrics(options: {
  answers: string[];
  themeMatches: boolean[];
  themeSelected: boolean;
}) {
  const { answers, themeMatches, themeSelected } = options;
  let themeHitCount = 0;
  let themeScore = 0;

  for (let index = 0; index < answers.length; index += 1) {
    const hasThemeMatch = themeMatches[index] ?? false;

    if (hasThemeMatch) {
      themeHitCount += 1;
    }

    themeScore += scoreThemeWordBonus(themeSelected, hasThemeMatch);
  }

  return {
    themeHitCount,
    themeScore,
    emergencyWordCount: countEmergencyWords(answers),
  };
}

export function scoreGridThemeQuality(options: {
  themeHitCount: number;
  themeSelected: boolean;
  wordCount: number;
  emergencyWordCount: number;
  averageWordLength: number;
  longestWord: number;
}) {
  const {
    themeHitCount,
    themeSelected,
    wordCount,
    emergencyWordCount,
    averageWordLength,
    longestWord,
  } = options;

  if (wordCount === 0) {
    return 0;
  }

  let score = 0;

  if (themeSelected) {
    const themeRate = themeHitCount / wordCount;

    if (themeRate >= 0.65) {
      score += 90;
    } else if (themeRate >= 0.45) {
      score += 50;
    } else {
      score -= (0.45 - themeRate) * 180;
    }
  }

  score -= emergencyWordCount * 42;

  if (averageWordLength > 7.5) {
    score -= (averageWordLength - 7.5) * 18;
  }

  if (longestWord >= 10) {
    score -= (longestWord - 9) * 8;
  }

  return score;
}
