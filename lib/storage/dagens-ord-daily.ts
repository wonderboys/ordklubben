import { type DagensOrdGuess } from "@/lib/game/dagens-ord";
import { createGameStorage } from "@/lib/storage/create-game-storage";

export type DagensOrdDailyStatus = "playing" | "won" | "lost";

export type DagensOrdDailyState = {
  dayKey: string;
  targetWord: string;
  guesses: DagensOrdGuess[];
  status: DagensOrdDailyStatus;
};

export const defaultDagensOrdDailyState: DagensOrdDailyState = {
  dayKey: "",
  targetWord: "",
  guesses: [],
  status: "playing",
};

const dagensOrdDailyStorage = createGameStorage({
  storageKey: "ordklubben:dagens-ord:daily",
  changeEvent: "ordklubben:dagens-ord:daily-changed",
  defaultValue: defaultDagensOrdDailyState,
  logLabel: "DagensOrd",
});

export const loadDagensOrdDaily = dagensOrdDailyStorage.load;
export const saveDagensOrdDaily = dagensOrdDailyStorage.save;
