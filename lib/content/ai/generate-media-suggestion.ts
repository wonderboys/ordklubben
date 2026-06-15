import { getOpenAiApiKey } from "@/lib/content/ai/openai-hint-candidates";
import { requestOpenAiMediaSuggestion } from "@/lib/content/ai/openai-media-suggestion";
import { AiMediaGenerationError } from "@/lib/content/ai/parse-media-suggestion-response";
import type {
  GenerateMediaSuggestionInput,
  GenerateMediaSuggestionResult,
} from "@/lib/content/ai/types";

export function isAiProviderConfigured(): boolean {
  return Boolean(getOpenAiApiKey());
}

export async function generateMediaSuggestion(
  input: GenerateMediaSuggestionInput,
): Promise<GenerateMediaSuggestionResult> {
  if (!isAiProviderConfigured()) {
    throw new AiMediaGenerationError(
      "AI-generatorn är inte konfigurerad. Sätt OPENAI_API_KEY i miljövariablerna.",
    );
  }

  try {
    return await requestOpenAiMediaSuggestion(input);
  } catch (error) {
    if (error instanceof AiMediaGenerationError) {
      throw error;
    }

    const message =
      error instanceof Error
        ? error.message
        : "AI-generering misslyckades.";

    throw new AiMediaGenerationError(message);
  }
}
