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
      source: MOCK_SOURCE,
      model: MOCK_MODEL,
      promptVersion: MOCK_PROMPT_VERSION,
    },
    {
      text: `Kan förknippas med ${word}`,
      type: "ASSOCIATION",
      source: MOCK_SOURCE,
      model: MOCK_MODEL,
      promptVersion: MOCK_PROMPT_VERSION,
    },
    {
      text: `En möjlig nyckel för ${word}`,
      type: "OTHER",
      source: MOCK_SOURCE,
      model: MOCK_MODEL,
      promptVersion: MOCK_PROMPT_VERSION,
    },
    {
      text: `Ordlek kring ${word}`,
      type: "WORDPLAY",
      source: MOCK_SOURCE,
      model: MOCK_MODEL,
      promptVersion: MOCK_PROMPT_VERSION,
    },
    {
      text: `Synonym eller nära betydelse till ${word}`,
      type: "SYNONYM",
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
