import { canBuildWord } from "@/lib/dictionary/can-build-word";
import { createLetterPool } from "@/lib/dictionary/letter-pool";
import { normalizeSwedish } from "@/lib/dictionary/normalize-swedish";
import { validateWord } from "@/lib/dictionary/validate-word";

// Små exempel för framtida unit tests. Inget testframework behövs ännu eftersom
// funktionerna redan är rena och kan flyttas direkt in i riktiga tester senare.
export const dictionaryExamples = {
  normalized: normalizeSwedish("  VÄDER "),
  pool: createLetterPool(["V", "Ä", "D", "E", "R", "T"]),
  canBuild: canBuildWord("väder", ["V", "Ä", "D", "E", "R", "T"]),
  validation: validateWord({
    value: "väder",
    letters: ["V", "Ä", "D", "E", "R", "T"],
    allowedWords: new Set(["väder"]),
  }),
};
