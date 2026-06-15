import { parseMediaSuggestionResponse } from "@/lib/content/ai/parse-media-suggestion-response";
import type {
  GenerateMediaSuggestionInput,
  GenerateMediaSuggestionResult,
} from "@/lib/content/ai/types";
import { getOpenAiApiKey, getOpenAiModel } from "@/lib/content/ai/openai-hint-candidates";

export const MEDIA_SUGGESTION_PROMPT_VERSION = "media-suggestion-v1";

type OpenAiChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

function buildSystemPrompt() {
  return `Du skapar metadata och bildprompts för ordspel.

Målet är en enkel, tydlig bildidé som kan användas som illustration till ett svenskt ord i ordspel.

Regler:
- Skriv på svenska.
- Skapa bildidéer som är tydliga och användbara i ordspel.
- Undvik text i bilden.
- Undvik för mycket detaljer.
- Prioritera enkel symbolisk bild.
- Returnera strikt JSON utan annan text.

Fält:
- title: Kort titel för mediaobjektet, t.ex. "Illustration av bilnyckel".
- altText: Kort tillgänglighetsbeskrivning av bilden.
- prompt: Detaljerad bildprompt för senare bildgenerering. Beskriv stil, motiv och komposition.
- notes: Valfria redaktörsanteckningar om bildidén.

Exempel för ordet BILNYCKEL:
{
  "title": "Illustration av bilnyckel",
  "altText": "En bilnyckel med en liten bilsymbol",
  "prompt": "En enkel tydlig illustration av en bilnyckel, i ren grafisk stil, utan text, centrerad på ljus bakgrund.",
  "notes": "Symbolisk nyckel som fungerar i ordspel."
}

Svara endast med JSON:
{
  "title": "...",
  "altText": "...",
  "prompt": "...",
  "notes": "..."
}`;
}

function buildUserPrompt(answer: string) {
  return `Skapa ett bildförslag (IMAGE) för ordet: ${answer}

Returnera title, altText, prompt och notes enligt reglerna.`;
}

export async function requestOpenAiMediaSuggestion(
  input: GenerateMediaSuggestionInput,
): Promise<GenerateMediaSuggestionResult> {
  const apiKey = getOpenAiApiKey();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY saknas.");
  }

  const model = getOpenAiModel();

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(input.answer) },
      ],
    }),
  });

  const payload = (await response.json()) as OpenAiChatResponse;

  if (!response.ok) {
    const message =
      payload.error?.message ??
      `OpenAI svarade med status ${response.status}.`;

    throw new Error(message);
  }

  const rawContent = payload.choices?.[0]?.message?.content;

  if (!rawContent) {
    throw new Error("OpenAI returnerade inget innehåll.");
  }

  const suggestion = parseMediaSuggestionResponse({
    rawContent,
    answer: input.answer,
  });

  return {
    suggestion,
    model,
    promptVersion: MEDIA_SUGGESTION_PROMPT_VERSION,
  };
}
