import type { ContentStatus, HintType } from "@prisma/client";
import {
  formatHintDifficulty,
  HINT_TYPE_LABELS,
  STATUS_LABELS,
} from "@/lib/content/constants";

export function formatPuzzleHintOptionLabel(hint: {
  text: string;
  type: HintType;
  status: ContentStatus;
  difficulty: number | null;
}) {
  const meta = [
    STATUS_LABELS[hint.status],
    HINT_TYPE_LABELS[hint.type],
    formatHintDifficulty(hint.difficulty),
  ].join(" · ");

  return `${hint.text} (${meta})`;
}
