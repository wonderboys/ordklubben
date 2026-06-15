import { seedWordsSvGenerated } from '@/data/generated/seed-words-sv.generated';
import { seedWordsSv as seedWordsSvManual } from '@/data/words/seed-words-sv';

export { allowedSvWords, commonSvWords } from '@/data/words';

export const seedWordsSv =
  seedWordsSvGenerated.length > 0 ? seedWordsSvGenerated : seedWordsSvManual;
