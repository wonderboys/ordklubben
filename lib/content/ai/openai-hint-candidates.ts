import {
  parseHintCandidatesResponse,
  type ParseHintCandidatesResult,
} from "@/lib/content/ai/parse-hint-candidates-response";
import type {
  GenerateHintCandidatesInput,
  GenerateHintCandidatesResult,
} from "@/lib/content/ai/types";

export const HINT_CANDIDATES_PROMPT_VERSION = "hint-candidates-v3";

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

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
  return `Du skapar korta svenska spelnycklar för ordspel (korsord, ordfläta, kedjespel).

Målet är korta spelnycklar — inte långa förklaringar eller uppslagsverkstext.

Regler:
- Skriv på svenska.
- Max 2–6 ord per nyckel om möjligt.
- Undvik hela meningar.
- Undvik formuleringar som "En form av…", "Hästar som…", "Rör sig…".
- Ledtråden ska kännas som korsord/ordspel.
- Prioritera kort, tydligt och spelbart.
- Returnera hellre 3 bra nycklar än 6 mediokra.
- Ledtråden får inte innehålla själva ordet.
- Ledtråden ska helst inte innehålla uppenbara böjningar av ordet.
- För vanliga ord: använd vardaglig betydelse först.
- För flertydiga ord: skapa gärna olika betydelser, men håll dem korta.
- Hoppa över en typ helt om den inte passar.
- Returnera strikt JSON utan annan text.

Nyckeltyper (högst en per typ):
- DEFINITION: Rak, kort betydelse. Inte en hel mening.
- PARAPHRASE: Beskrivande ledtråd, kortare och mer spelbar än en definition.
- ASSOCIATION: Något man förknippar med ordet, gärna konkret och kort.
- SYNONYM: Ett närliggande ord eller uttryck. Hoppa över om ingen bra synonym finns.
- WORDPLAY: Klurig, lekfull eller korsordsaktig ledtråd. Kort och spelbar.
- EXAMPLE: Kort situation eller kontext, utan att nämna ordet. Inte en hel mening.

Skapa aldrig generiska eller långa mallar som:
- "En typ av …"
- "En form av …"
- "Hästar som …"
- "Rör sig …"
- "… i kort ledtråd"
- "Kan förknippas med …"
- "En möjlig nyckel för …"

Exempel för ordet TRAV:
- DEFINITION: Snabb gångart
- PARAPHRASE: Hästsport på bana
- ASSOCIATION: Lopp med sulky
- WORDPLAY: Mellan skritt och galopp
- EXAMPLE: Spel på hästar
- SYNONYM: hoppa över om ingen bra synonym finns

Exempel för ordet KJOL:
- DEFINITION: Plagg nertill
- PARAPHRASE: Utan byxben
- ASSOCIATION: Snurrar på dansgolvet
- WORDPLAY: Inte byxor, nära benen
- EXAMPLE: Till skjorta
- SYNONYM: hoppa över om ingen bra synonym finns

Svara endast med JSON:
{
  "candidates": [
    { "type": "DEFINITION", "text": "..." },
    { "type": "PARAPHRASE", "text": "..." }
  ]
}`;
}

function buildUserPrompt(answer: string) {
  return `Skapa nyckelförslag för ordet: ${answer}

Returnera 2–4 starka kandidater. Utelämna typer som inte passar. Håll varje nyckel kort (helst 2–6 ord). Använd bara typerna DEFINITION, PARAPHRASE, ASSOCIATION, SYNONYM, WORDPLAY och EXAMPLE.`;
}

export function getOpenAiApiKey(): string | undefined {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  return apiKey && apiKey.length > 0 ? apiKey : undefined;
}

export function getOpenAiModel(): string {
  const model = process.env.OPENAI_MODEL?.trim();
  return model && model.length > 0 ? model : DEFAULT_OPENAI_MODEL;
}

export async function requestOpenAiHintCandidates(
  input: GenerateHintCandidatesInput,
): Promise<GenerateHintCandidatesResult> {
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
      temperature: 0.8,
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

  const parsed: ParseHintCandidatesResult = parseHintCandidatesResponse({
    rawContent,
    answer: input.answer,
    model,
    promptVersion: HINT_CANDIDATES_PROMPT_VERSION,
  });

  if (parsed.candidates.length === 0) {
    throw new Error(
      "AI returnerade inga giltiga nyckelförslag. Inga förslag skapades.",
    );
  }

  return {
    candidates: parsed.candidates,
    model,
    promptVersion: HINT_CANDIDATES_PROMPT_VERSION,
    stats: {
      rawFromAi: parsed.rawFromAi,
      accepted: parsed.candidates.length,
      skippedInvalid: parsed.skippedInvalid,
    },
  };
}
