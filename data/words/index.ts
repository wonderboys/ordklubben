import { allowedSvGeneratedWords } from '@/data/generated/allowed-sv.generated';
import { commonSvGeneratedWords } from '@/data/generated/common-sv.generated';
import { allowedSvWords as allowedSvWordsManual } from '@/data/words/allowed-sv';
import { commonSvWords as commonSvWordsManual } from '@/data/words/common-sv';

export const allowedSvWords =
  allowedSvGeneratedWords.length > 0 ? allowedSvGeneratedWords : allowedSvWordsManual;

export const commonSvWords =
  commonSvGeneratedWords.length > 0 ? commonSvGeneratedWords : commonSvWordsManual;
