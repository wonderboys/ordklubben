import {
  getOpenAiApiKey,
  requestOpenAiHintCandidates,
} from "@/lib/content/ai/openai-hint-candidates";
import { AiHintGenerationError } from "@/lib/content/ai/parse-hint-candidates-response";
import type {
  GenerateHintCandidatesInput,
  GenerateHintCandidatesResult,
} from "@/lib/content/ai/types";

export function isAiProviderConfigured(): boolean {
  return Boolean(getOpenAiApiKey());
}

export async function generateHintCandidates(
  input: GenerateHintCandidatesInput,
): Promise<GenerateHintCandidatesResult> {
  if (!isAiProviderConfigured()) {
    throw new AiHintGenerationError(
      "AI-generatorn är inte konfigurerad. Sätt OPENAI_API_KEY i miljövariablerna.",
    );
  }

  try {
    return await requestOpenAiHintCandidates(input);
  } catch (error) {
    if (error instanceof AiHintGenerationError) {
      throw error;
    }

    const message =
      error instanceof Error
        ? error.message
        : "AI-generering misslyckades.";

    throw new AiHintGenerationError(message);
  }
}
