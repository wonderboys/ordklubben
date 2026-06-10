import type {
  GenerateHintCandidatesInput,
  GenerateHintCandidatesResult,
} from "@/lib/content/ai/types";

const AI_PROVIDER_NOT_CONFIGURED = "AI provider not configured";

export async function generateHintCandidates(
  input: GenerateHintCandidatesInput,
): Promise<GenerateHintCandidatesResult> {
  void input;
  throw new Error(AI_PROVIDER_NOT_CONFIGURED);
}

export function isAiProviderConfigured(): boolean {
  return false;
}
