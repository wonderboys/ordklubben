import type {
  GenerateHintCandidatesInput,
  GenerateHintCandidatesResult,
  HintCandidateDraft,
} from "@/lib/content/ai/types";

const MOCK_SOURCE = "mock_generator";
const MOCK_MODEL = "mock";
const MOCK_PROMPT_VERSION = "mock-v1";

export function mockGenerateHintCandidates(
  input: GenerateHintCandidatesInput,
): GenerateHintCandidatesResult {
  const word = input.answer.trim();

  const templates: HintCandidateDraft[] = [
    {
      text: `${word} i kort ledtråd`,
      type: "DEFINITION",
      format: "TEXT",
      source: MOCK_SOURCE,
      model: MOCK_MODEL,
      promptVersion: MOCK_PROMPT_VERSION,
    },
    {
      text: `Kan förknippas med ${word}`,
      type: "ASSOCIATION",
      format: "TEXT",
      source: MOCK_SOURCE,
      model: MOCK_MODEL,
      promptVersion: MOCK_PROMPT_VERSION,
    },
    {
      text: `Exempel på användning av ${word}`,
      type: "EXAMPLE",
      format: "TEXT",
      source: MOCK_SOURCE,
      model: MOCK_MODEL,
      promptVersion: MOCK_PROMPT_VERSION,
    },
    {
      text: `Ordlek kring ${word}`,
      type: "WORDPLAY",
      format: "TEXT",
      source: MOCK_SOURCE,
      model: MOCK_MODEL,
      promptVersion: MOCK_PROMPT_VERSION,
    },
    {
      text: `Synonym eller nära betydelse till ${word}`,
      type: "SYNONYM",
      format: "TEXT",
      source: MOCK_SOURCE,
      model: MOCK_MODEL,
      promptVersion: MOCK_PROMPT_VERSION,
    },
  ];

  return {
    candidates: templates,
    model: MOCK_MODEL,
    promptVersion: MOCK_PROMPT_VERSION,
  };
}
