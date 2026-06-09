import {
  createDailyRound,
  getDayKey,
  isDagensOrdLost,
  isDagensOrdWon,
  pickDailyWord,
  type DagensOrdRound,
} from "@/lib/game/dagens-ord";
import {
  loadDagensOrdDaily,
  saveDagensOrdDaily,
  type DagensOrdDailyStatus,
} from "@/lib/storage/dagens-ord-daily";

export function loadOrCreateDailyRound(date = new Date()): DagensOrdRound {
  const todayKey = getDayKey(date);
  const todayWord = pickDailyWord(date);
  const saved = loadDagensOrdDaily();

  if (
    saved.dayKey === todayKey &&
    saved.targetWord === todayWord &&
    saved.guesses.length > 0
  ) {
    return {
      dayKey: saved.dayKey,
      targetWord: saved.targetWord,
      guesses: saved.guesses,
      currentInput: "",
    };
  }

  return createDailyRound(date);
}

export function getSavedDailyStatus(date = new Date()): DagensOrdDailyStatus | null {
  const todayKey = getDayKey(date);
  const todayWord = pickDailyWord(date);
  const saved = loadDagensOrdDaily();

  if (saved.dayKey !== todayKey || saved.targetWord !== todayWord) {
    return null;
  }

  if (saved.status === "won" || saved.status === "lost") {
    return saved.status;
  }

  return saved.guesses.length > 0 ? "playing" : null;
}

export function persistDailyRound(
  round: DagensOrdRound,
  status: DagensOrdDailyStatus,
) {
  saveDagensOrdDaily({
    dayKey: round.dayKey,
    targetWord: round.targetWord,
    guesses: round.guesses,
    status,
  });
}

export function resolveDailyStatus(
  guesses: DagensOrdRound["guesses"],
  targetWord: string,
): DagensOrdDailyStatus {
  if (isDagensOrdWon(guesses, targetWord)) {
    return "won";
  }

  if (isDagensOrdLost(guesses, targetWord)) {
    return "lost";
  }

  return "playing";
}
