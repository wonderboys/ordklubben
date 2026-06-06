import { allowedSvGeneratedWords } from "@/data/generated/allowed-sv.generated";
import { commonSvGeneratedWords } from "@/data/generated/common-sv.generated";
import { seedWordsSvGenerated } from "@/data/generated/seed-words-sv.generated";
import { allowedSvWords as allowedSvWordsManual } from "@/data/words/allowed-sv";
import { commonSvWords as commonSvWordsManual } from "@/data/words/common-sv";
import { seedWordsSv as seedWordsSvManual } from "@/data/words/seed-words-sv";

export const allowedSvWords =
  allowedSvGeneratedWords.length > 0
    ? allowedSvGeneratedWords
    : allowedSvWordsManual;

export const commonSvWords =
  commonSvGeneratedWords.length > 0 ? commonSvGeneratedWords : commonSvWordsManual;

export const seedWordsSv =
  seedWordsSvGenerated.length > 0 ? seedWordsSvGenerated : seedWordsSvManual;
