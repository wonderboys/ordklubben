"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateHintCandidates } from "@/lib/content/ai/generate-hint-candidates";
import { partitionDuplicateHintCandidateDrafts } from "@/lib/content/ai/filter-hint-candidate-drafts";
import { logSkippedHintCandidates } from "@/lib/content/ai/hint-candidate-skip-log";
import { AiHintGenerationError } from "@/lib/content/ai/parse-hint-candidates-response";
import { approveCandidateAsHint } from "@/lib/content/hint-candidate";
import { normalizeHintText, trimHintText } from "@/lib/content/normalize-hint";
import {
  addThemeToWordSchema,
  approveEditedHintCandidateSchema,
  archiveWordSchema,
  bulkWordActionSchema,
  bulkWordThemeActionSchema,
  createHintCandidateSchema,
  createHintSchema,
  createLexicalEntrySchema,
  createThemeSchema,
  createWordSchema,
  deleteLexicalEntrySchema,
  generateHintCandidatesSchema,
  hintCandidateActionSchema,
  importContentSchema,
  removeThemeFromWordSchema,
  updateHintSchema,
  updateHintStatusSchema,
  updateLexicalEntrySchema,
  updateWordSchema,
} from "@/lib/content/validators";
import {
  normalizeApprovedHintMetadata,
  normalizeHintSource,
} from "@/lib/content/normalize-hint-metadata";
import { getPrisma } from "@/lib/db/prisma";
import {
  isValidAnswerFormat,
  isValidNormalizedAnswer,
  normalizeAnswer,
  normalizeNormalizedAnswerInput,
  slugifyThemeName,
} from "@/lib/content/normalize-answer";
import {
  normalizeWordSource,
  resolveWordSourceReference,
} from "@/lib/content/normalize-word-source";
import { importContent } from "@/lib/content/import-content";
import { importLexicon } from "@/lib/content/import-lexicon";
import { wordDetailPathFromForm } from "@/lib/content/word-detail-path";

function redirectToWord(
  wordId: string,
  formData: FormData,
  type: "error" | "success",
  message: string,
): never {
  redirectWithMessage(wordDetailPathFromForm(wordId, formData), type, message);
}

function redirectWithMessage(
  pathname: string,
  type: "error" | "success",
  message: string,
): never {
  const [basePath, queryString] = pathname.split("?");
  const searchParams = new URLSearchParams(queryString ?? "");
  searchParams.set(type, message);

  redirect(`${basePath}?${searchParams.toString()}`);
}

function getFormValues(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function getWordIdsFromForm(formData: FormData) {
  return formData.getAll("wordIds").map(String).filter(Boolean);
}

function getBulkReturnTo(formData: FormData) {
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  return returnTo.startsWith("/admin/words") ? returnTo : "/admin/words";
}

function redirectToWordsList(
  formData: FormData,
  type: "error" | "success",
  message: string,
): never {
  redirectWithMessage(getBulkReturnTo(formData), type, message);
}

function revalidateWordListPaths() {
  revalidatePath("/admin/words");
  revalidatePath("/admin/review");
  revalidatePath("/admin/themes");
}

function getValidationErrorMessage() {
  return "Kunde inte spara formuläret. Kontrollera fälten och försök igen.";
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

export async function createWord(formData: FormData) {
  const parsed = createWordSchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectWithMessage("/admin/words/new", "error", getValidationErrorMessage());
  }

  if (!isValidAnswerFormat(parsed.data.answer)) {
    redirectWithMessage(
      "/admin/words/new",
      "error",
      "Ord får bara innehålla svenska bokstäver, mellanslag, bindestreck och apostrofer.",
    );
  }

  const normalized = normalizeAnswer(parsed.data.answer);
  const prisma = getPrisma();

  try {
    const word = await prisma.word.create({
      data: {
        answer: normalized.answer,
        normalizedAnswer: normalized.normalizedAnswer,
        length: normalized.length,
        language: "sv",
        status: parsed.data.status,
        source: "manual",
        notes: parsed.data.notes,
      },
    });

    revalidatePath("/admin/words");
    redirectWithMessage(
      `/admin/words/${word.id}`,
      "success",
      "Ordet skapades.",
    );
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      redirectWithMessage(
        "/admin/words/new",
        "error",
        "Det finns redan ett ord med samma normaliserade form.",
      );
    }

    throw error;
  }
}

export async function updateWord(formData: FormData) {
  const parsed = updateWordSchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectToWord(
      String(formData.get("id") ?? ""),
      formData,
      "error",
      getValidationErrorMessage(),
    );
  }

  if (!isValidAnswerFormat(parsed.data.answer)) {
    redirectToWord(
      parsed.data.id,
      formData,
      "error",
      "Ord får bara innehålla svenska bokstäver, mellanslag, bindestreck och apostrofer.",
    );
  }

  const answerNormalized = normalizeAnswer(parsed.data.answer);
  const normalizedAnswer = parsed.data.normalizeFromAnswer
    ? answerNormalized.normalizedAnswer
    : normalizeNormalizedAnswerInput(parsed.data.normalizedAnswer);

  if (!isValidNormalizedAnswer(normalizedAnswer)) {
    redirectToWord(
      parsed.data.id,
      formData,
      "error",
      "Normaliserat ord måste bestå av svenska bokstäver utan mellanslag eller skiljetecken.",
    );
  }

  const prisma = getPrisma();

  try {
    await prisma.word.update({
      where: { id: parsed.data.id },
      data: {
        answer: answerNormalized.answer,
        normalizedAnswer,
        length: normalizedAnswer.length,
        status: parsed.data.status,
        language: parsed.data.language,
        source: normalizeWordSource(parsed.data.source),
        partOfSpeech: parsed.data.partOfSpeech,
        notes: parsed.data.notes,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      redirectToWord(
        parsed.data.id,
        formData,
        "error",
        "Det finns redan ett ord med samma normaliserade form.",
      );
    }

    throw error;
  }

  revalidatePath("/admin/words");
  revalidatePath(`/admin/words/${parsed.data.id}`);
  redirectToWord(parsed.data.id, formData, "success", "Ordet uppdaterades.");
}

export async function archiveWord(formData: FormData) {
  const parsed = archiveWordSchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectToWord(
      String(formData.get("wordId") ?? ""),
      formData,
      "error",
      getValidationErrorMessage(),
    );
  }

  const prisma = getPrisma();
  const word = await prisma.word.findUnique({
    where: { id: parsed.data.wordId },
    select: { id: true, status: true },
  });

  if (!word) {
    redirectToWord(parsed.data.wordId, formData, "error", "Ordet kunde inte hittas.");
  }

  if (word.status === "ARCHIVED") {
    redirectToWord(parsed.data.wordId, formData, "error", "Ordet är redan arkiverat.");
  }

  await prisma.word.update({
    where: { id: parsed.data.wordId },
    data: { status: "ARCHIVED" },
  });

  revalidatePath("/admin/words");
  revalidatePath(`/admin/words/${parsed.data.wordId}`);
  redirectWithMessage("/admin/words", "success", "Ordet arkiverades.");
}

export async function createLexicalEntry(formData: FormData) {
  const parsed = createLexicalEntrySchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectToWord(
      String(formData.get("wordId") ?? ""),
      formData,
      "error",
      getValidationErrorMessage(),
    );
  }

  const value = parsed.data.value.trim().replace(/\s+/g, " ");
  const prisma = getPrisma();

  try {
    await prisma.wordLexicalEntry.create({
      data: {
        wordId: parsed.data.wordId,
        type: parsed.data.type,
        value,
        source: normalizeWordSource(parsed.data.source),
        notes: parsed.data.notes,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      redirectToWord(
        parsed.data.wordId,
        formData,
        "error",
        "En lexikal post med samma typ och värde finns redan.",
      );
    }

    throw error;
  }

  revalidateWordPage(parsed.data.wordId);
  redirectToWord(parsed.data.wordId, formData, "success", "Lexikal post skapades.");
}

export async function updateLexicalEntry(formData: FormData) {
  const parsed = updateLexicalEntrySchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectToWord(
      String(formData.get("wordId") ?? ""),
      formData,
      "error",
      getValidationErrorMessage(),
    );
  }

  const value = parsed.data.value.trim().replace(/\s+/g, " ");
  const prisma = getPrisma();

  try {
    await prisma.wordLexicalEntry.update({
      where: { id: parsed.data.entryId },
      data: {
        type: parsed.data.type,
        value,
        source: normalizeWordSource(parsed.data.source),
        notes: parsed.data.notes,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      redirectToWord(
        parsed.data.wordId,
        formData,
        "error",
        "En lexikal post med samma typ och värde finns redan.",
      );
    }

    throw error;
  }

  revalidateWordPage(parsed.data.wordId);
  redirectToWord(parsed.data.wordId, formData, "success", "Lexikal post uppdaterades.");
}

export async function deleteLexicalEntry(formData: FormData) {
  const parsed = deleteLexicalEntrySchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectToWord(
      String(formData.get("wordId") ?? ""),
      formData,
      "error",
      getValidationErrorMessage(),
    );
  }

  const prisma = getPrisma();
  const entry = await prisma.wordLexicalEntry.findUnique({
    where: { id: parsed.data.entryId },
    select: { wordId: true },
  });

  if (!entry || entry.wordId !== parsed.data.wordId) {
    redirectToWord(parsed.data.wordId, formData, "error", "Posten kunde inte hittas.");
  }

  await prisma.wordLexicalEntry.delete({
    where: { id: parsed.data.entryId },
  });

  revalidateWordPage(parsed.data.wordId);
  redirectToWord(parsed.data.wordId, formData, "success", "Lexikal post togs bort.");
}

export async function createHint(formData: FormData) {
  const parsed = createHintSchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectToWord(
      String(formData.get("wordId") ?? ""),
      formData,
      "error",
      getValidationErrorMessage(),
    );
  }

  const prisma = getPrisma();
  const metadata = normalizeApprovedHintMetadata({
    type: parsed.data.type,
    format: parsed.data.format,
    difficulty: parsed.data.difficulty,
    tone: parsed.data.tone,
  });

  await prisma.hint.create({
    data: {
      wordId: parsed.data.wordId,
      text: parsed.data.text,
      type: metadata.type,
      format: metadata.format,
      status: parsed.data.status,
      difficulty: metadata.difficulty,
      tone: metadata.tone,
      source: normalizeHintSource(parsed.data.source, "manual"),
      notes: parsed.data.notes,
    },
  });

  revalidatePath(`/admin/words/${parsed.data.wordId}`);
  revalidatePath("/admin/words");
  redirectToWord(parsed.data.wordId, formData, "success", "Nyckeln skapades.");
}

export async function updateHintStatus(formData: FormData) {
  const parsed = updateHintStatusSchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectToWord(
      String(formData.get("wordId") ?? ""),
      formData,
      "error",
      getValidationErrorMessage(),
    );
  }

  const prisma = getPrisma();
  await prisma.hint.update({
    where: { id: parsed.data.hintId },
    data: {
      status: parsed.data.status,
    },
  });

  revalidatePath(`/admin/words/${parsed.data.wordId}`);
  revalidatePath("/admin/words");
  redirectToWord(parsed.data.wordId, formData, "success", "Nyckelstatus uppdaterades.");
}

export async function updateHint(formData: FormData) {
  const parsed = updateHintSchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectToWord(
      String(formData.get("wordId") ?? ""),
      formData,
      "error",
      getValidationErrorMessage(),
    );
  }

  const metadata = normalizeApprovedHintMetadata({
    type: parsed.data.type,
    format: parsed.data.format,
    difficulty: parsed.data.difficulty,
    tone: parsed.data.tone,
  });

  const prisma = getPrisma();
  await prisma.hint.update({
    where: { id: parsed.data.hintId },
    data: {
      text: trimHintText(parsed.data.text),
      type: metadata.type,
      format: metadata.format,
      difficulty: metadata.difficulty,
      tone: metadata.tone,
      notes: parsed.data.notes,
    },
  });

  revalidatePath(`/admin/words/${parsed.data.wordId}`);
  revalidatePath("/admin/words");
  redirectToWord(parsed.data.wordId, formData, "success", "Nyckeln uppdaterades.");
}

export async function createTheme(formData: FormData) {
  const parsed = createThemeSchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectWithMessage("/admin/themes", "error", getValidationErrorMessage());
  }

  const slug = slugifyThemeName(parsed.data.slug ?? parsed.data.name);

  if (slug.length === 0) {
    redirectWithMessage(
      "/admin/themes",
      "error",
      "Temat behöver ett giltigt slugvärde.",
    );
  }

  try {
    const prisma = getPrisma();
    await prisma.theme.create({
      data: {
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
      },
    });

    revalidatePath("/admin/themes");
    redirectWithMessage("/admin/themes", "success", "Temat skapades.");
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      redirectWithMessage(
        "/admin/themes",
        "error",
        "Det finns redan ett tema med samma slug.",
      );
    }

    throw error;
  }
}

export async function importContentAction(formData: FormData) {
  const parsed = importContentSchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectWithMessage("/admin/import", "error", getValidationErrorMessage());
  }

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirectWithMessage("/admin/import", "error", "Välj en CSV-fil att importera.");
  }

  const csvText = await file.text();
  const prisma = getPrisma();

  const result =
    parsed.data.importType === "LEXICON"
      ? await importLexicon({
          prisma,
          csvText,
          filename: file.name,
        })
      : await importContent({
          prisma,
          csvText,
          filename: file.name,
          importType: parsed.data.importType,
          defaultWordStatus: parsed.data.wordStatus ?? "DRAFT",
          defaultHintStatus: parsed.data.hintStatus ?? "DRAFT",
        });

  revalidatePath("/admin/import");
  revalidatePath("/admin/words");
  revalidatePath("/admin/themes");

  redirectWithMessage(
    `/admin/import?batchId=${result.batchId}`,
    result.status === "FAILED" ? "error" : "success",
    result.status === "FAILED"
      ? "Importen slutfördes med fel."
      : "Importen är klar.",
  );
}

export async function addThemeToWord(formData: FormData) {
  const parsed = addThemeToWordSchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectToWord(
      String(formData.get("wordId") ?? ""),
      formData,
      "error",
      getValidationErrorMessage(),
    );
  }

  const prisma = getPrisma();
  const [word, theme, existingRelation] = await Promise.all([
    prisma.word.findUnique({
      where: { id: parsed.data.wordId },
      select: { id: true },
    }),
    prisma.theme.findUnique({
      where: { id: parsed.data.themeId },
      select: { id: true, slug: true },
    }),
    prisma.wordTheme.findUnique({
      where: {
        wordId_themeId: {
          wordId: parsed.data.wordId,
          themeId: parsed.data.themeId,
        },
      },
      select: { wordId: true },
    }),
  ]);

  if (!word) {
    redirectToWord(parsed.data.wordId, formData, "error", "Ordet kunde inte hittas.");
  }

  if (!theme) {
    redirectToWord(parsed.data.wordId, formData, "error", "Temat kunde inte hittas.");
  }

  if (existingRelation) {
    redirectToWord(parsed.data.wordId, formData, "error", "Temat är redan kopplat till ordet.");
  }

  await prisma.wordTheme.create({
    data: {
      wordId: parsed.data.wordId,
      themeId: parsed.data.themeId,
    },
  });

  const themeSlug = theme.slug;

  revalidatePath(`/admin/words/${parsed.data.wordId}`);
  revalidatePath("/admin/words");
  revalidatePath("/admin/themes");
  revalidatePath(`/admin/themes/${themeSlug}`);
  redirectToWord(parsed.data.wordId, formData, "success", "Temat lades till på ordet.");
}

export async function removeThemeFromWord(formData: FormData) {
  const parsed = removeThemeFromWordSchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectToWord(
      String(formData.get("wordId") ?? ""),
      formData,
      "error",
      getValidationErrorMessage(),
    );
  }

  const prisma = getPrisma();
  const relation = await prisma.wordTheme.findUnique({
    where: {
      wordId_themeId: {
        wordId: parsed.data.wordId,
        themeId: parsed.data.themeId,
      },
    },
    select: { wordId: true },
  });

  if (!relation) {
    redirectToWord(parsed.data.wordId, formData, "error", "Temakopplingen finns inte längre.");
  }

  const theme = await prisma.theme.findUnique({
    where: { id: parsed.data.themeId },
    select: { slug: true },
  });

  await prisma.wordTheme.delete({
    where: {
      wordId_themeId: {
        wordId: parsed.data.wordId,
        themeId: parsed.data.themeId,
      },
    },
  });

  revalidatePath(`/admin/words/${parsed.data.wordId}`);
  revalidatePath("/admin/words");
  revalidatePath("/admin/themes");
  if (theme?.slug) {
    revalidatePath(`/admin/themes/${theme.slug}`);
  }
  redirectToWord(parsed.data.wordId, formData, "success", "Temat togs bort från ordet.");
}

function revalidateWordPage(wordId: string) {
  revalidatePath(`/admin/words/${wordId}`);
  revalidatePath("/admin/words");
}

export async function createHintCandidate(formData: FormData) {
  const parsed = createHintCandidateSchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectToWord(
      String(formData.get("wordId") ?? ""),
      formData,
      "error",
      getValidationErrorMessage(),
    );
  }

  const prisma = getPrisma();
  const metadata = normalizeApprovedHintMetadata({
    type: parsed.data.type,
    format: parsed.data.format,
    difficulty: parsed.data.difficulty,
    tone: parsed.data.tone,
  });

  await prisma.hintCandidate.create({
    data: {
      wordId: parsed.data.wordId,
      text: trimHintText(parsed.data.text),
      type: metadata.type,
      format: metadata.format,
      difficulty: metadata.difficulty,
      tone: metadata.tone,
      notes: parsed.data.notes,
      source: "manual",
    },
  });

  revalidateWordPage(parsed.data.wordId);
  redirectToWord(parsed.data.wordId, formData, "success", "Nyckelförslaget sparades.");
}

export async function approveHintCandidate(formData: FormData) {
  const parsed = hintCandidateActionSchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectToWord(
      String(formData.get("wordId") ?? ""),
      formData,
      "error",
      getValidationErrorMessage(),
    );
  }

  const prisma = getPrisma();
  const candidate = await prisma.hintCandidate.findFirst({
    where: {
      id: parsed.data.candidateId,
      wordId: parsed.data.wordId,
    },
    select: {
      text: true,
      type: true,
      format: true,
      difficulty: true,
      tone: true,
      source: true,
      notes: true,
    },
  });

  if (!candidate) {
    redirectToWord(parsed.data.wordId, formData, "error", "Förslaget kunde inte hittas.");
  }

  const result = await approveCandidateAsHint(prisma, {
    wordId: parsed.data.wordId,
    candidateId: parsed.data.candidateId,
    text: candidate.text,
    type: candidate.type,
    format: candidate.format,
    difficulty: candidate.difficulty ?? undefined,
    tone: candidate.tone ?? undefined,
    source: candidate.source,
    notes: candidate.notes,
  });

  if (!result.ok) {
    redirectToWord(parsed.data.wordId, formData, "error", result.error);
  }

  revalidateWordPage(parsed.data.wordId);
  redirectToWord(parsed.data.wordId, formData, "success", "Förslaget godkändes och blev en nyckel.");
}

export async function approveEditedHintCandidate(formData: FormData) {
  const parsed = approveEditedHintCandidateSchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectToWord(
      String(formData.get("wordId") ?? ""),
      formData,
      "error",
      getValidationErrorMessage(),
    );
  }

  const prisma = getPrisma();
  const candidate = await prisma.hintCandidate.findFirst({
    where: {
      id: parsed.data.candidateId,
      wordId: parsed.data.wordId,
    },
    select: { source: true, notes: true },
  });

  if (!candidate) {
    redirectToWord(parsed.data.wordId, formData, "error", "Förslaget kunde inte hittas.");
  }

  const result = await approveCandidateAsHint(prisma, {
    wordId: parsed.data.wordId,
    candidateId: parsed.data.candidateId,
    text: parsed.data.text,
    type: parsed.data.type,
    format: parsed.data.format,
    difficulty: parsed.data.difficulty,
    tone: parsed.data.tone,
    source: candidate.source,
    notes: parsed.data.notes ?? candidate.notes,
  });

  if (!result.ok) {
    redirectToWord(parsed.data.wordId, formData, "error", result.error);
  }

  revalidateWordPage(parsed.data.wordId);
  redirectToWord(
    parsed.data.wordId,
    formData,
    "success",
    "Förslaget redigerades och godkändes som nyckel.",
  );
}

export async function rejectHintCandidate(formData: FormData) {
  const parsed = hintCandidateActionSchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectToWord(
      String(formData.get("wordId") ?? ""),
      formData,
      "error",
      getValidationErrorMessage(),
    );
  }

  const prisma = getPrisma();
  const candidate = await prisma.hintCandidate.findFirst({
    where: {
      id: parsed.data.candidateId,
      wordId: parsed.data.wordId,
    },
    select: { status: true },
  });

  if (!candidate) {
    redirectToWord(parsed.data.wordId, formData, "error", "Förslaget kunde inte hittas.");
  }

  if (candidate.status !== "PENDING") {
    redirectToWord(parsed.data.wordId, formData, "error", "Förslaget är redan granskat.");
  }

  await prisma.hintCandidate.update({
    where: { id: parsed.data.candidateId },
    data: {
      status: "REJECTED",
      reviewedAt: new Date(),
    },
  });

  revalidateWordPage(parsed.data.wordId);
  redirectToWord(parsed.data.wordId, formData, "success", "Förslaget avvisades.");
}

export async function deleteHintCandidate(formData: FormData) {
  const parsed = hintCandidateActionSchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectToWord(
      String(formData.get("wordId") ?? ""),
      formData,
      "error",
      getValidationErrorMessage(),
    );
  }

  const prisma = getPrisma();
  const candidate = await prisma.hintCandidate.findFirst({
    where: {
      id: parsed.data.candidateId,
      wordId: parsed.data.wordId,
    },
    select: { status: true },
  });

  if (!candidate) {
    redirectToWord(parsed.data.wordId, formData, "error", "Förslaget kunde inte hittas.");
  }

  if (candidate.status === "APPROVED") {
    redirectToWord(parsed.data.wordId, formData, "error", "Godkända förslag kan inte tas bort.");
  }

  await prisma.hintCandidate.delete({
    where: { id: parsed.data.candidateId },
  });

  revalidateWordPage(parsed.data.wordId);
  redirectToWord(parsed.data.wordId, formData, "success", "Förslaget togs bort.");
}

async function loadExistingHintTextKeys(wordId: string) {
  const prisma = getPrisma();
  const [hints, pendingCandidates] = await Promise.all([
    prisma.hint.findMany({
      where: { wordId },
      select: { text: true },
    }),
    prisma.hintCandidate.findMany({
      where: { wordId, status: "PENDING" },
      select: { text: true },
    }),
  ]);

  return [
    ...hints.map((hint) => normalizeHintText(hint.text)),
    ...pendingCandidates.map((candidate) => normalizeHintText(candidate.text)),
  ];
}

function buildHintGenerationSuccessMessage(
  createdCount: number,
  skippedCount: number,
) {
  const countLabel = createdCount === 1 ? "förslag" : "förslag";
  let message = `${createdCount} ${countLabel} skapades.`;

  if (skippedCount > 0) {
    const skippedLabel = skippedCount === 1 ? "förslag" : "förslag";
    message += ` ${skippedCount} ${skippedLabel} hoppades över eftersom de var ogiltiga eller dubbletter.`;
  }

  return message;
}

export async function generateHintCandidatesAction(formData: FormData) {
  const parsed = generateHintCandidatesSchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectToWord(
      String(formData.get("wordId") ?? ""),
      formData,
      "error",
      getValidationErrorMessage(),
    );
  }

  const prisma = getPrisma();
  const word = await prisma.word.findUnique({
    where: { id: parsed.data.wordId },
    select: {
      id: true,
      answer: true,
      normalizedAnswer: true,
      language: true,
    },
  });

  if (!word) {
    redirectToWord(parsed.data.wordId, formData, "error", "Ordet kunde inte hittas.");
  }

  let generated;

  try {
    generated = await generateHintCandidates({
      wordId: word.id,
      answer: word.answer,
      normalizedAnswer: word.normalizedAnswer,
      language: word.language,
    });
  } catch (error) {
    const message =
      error instanceof AiHintGenerationError
        ? error.message
        : error instanceof Error
          ? error.message
          : "AI-generering misslyckades. Inga förslag skapades.";

    redirectToWord(parsed.data.wordId, formData, "error", message);
  }

  const existingTexts = await loadExistingHintTextKeys(word.id);
  const { accepted: uniqueCandidates, skipped: skippedDuplicates } =
    partitionDuplicateHintCandidateDrafts(generated.candidates, existingTexts);

  logSkippedHintCandidates(
    "Filtrerade befintliga dubbletter",
    word.answer,
    skippedDuplicates,
  );

  const skippedDuplicate = skippedDuplicates.length;
  const skippedInvalid = generated.stats?.skippedInvalid ?? 0;
  const skippedTotal = skippedInvalid + skippedDuplicate;

  if (uniqueCandidates.length === 0) {
    redirectToWord(
      parsed.data.wordId,
      formData,
      "error",
      skippedTotal > 0
        ? "AI-generering gav inga nya förslag. Alla ledtrådar var ogiltiga eller fanns redan."
        : "AI skapade inga nya förslag.",
    );
  }

  await prisma.hintCandidate.createMany({
    data: uniqueCandidates.map((candidate) => ({
      wordId: word.id,
      text: trimHintText(candidate.text),
      type: candidate.type,
      format: candidate.format ?? "TEXT",
      difficulty: candidate.difficulty,
      tone: candidate.tone,
      source: candidate.source,
      model: candidate.model,
      promptVersion: candidate.promptVersion,
      notes: candidate.notes,
    })),
  });

  revalidateWordPage(parsed.data.wordId);
  redirectToWord(
    parsed.data.wordId,
    formData,
    "success",
    buildHintGenerationSuccessMessage(uniqueCandidates.length, skippedTotal),
  );
}

export async function bulkApproveWords(formData: FormData) {
  const parsed = bulkWordActionSchema.safeParse({
    wordIds: getWordIdsFromForm(formData),
    returnTo: formData.get("returnTo"),
  });

  if (!parsed.success) {
    redirectToWordsList(formData, "error", getValidationErrorMessage());
  }

  const prisma = getPrisma();
  const result = await prisma.word.updateMany({
    where: { id: { in: parsed.data.wordIds } },
    data: { status: "APPROVED" },
  });

  revalidateWordListPaths();
  redirectToWordsList(
    formData,
    "success",
    `${result.count} ord godkändes.`,
  );
}

export async function bulkDraftWords(formData: FormData) {
  const parsed = bulkWordActionSchema.safeParse({
    wordIds: getWordIdsFromForm(formData),
    returnTo: formData.get("returnTo"),
  });

  if (!parsed.success) {
    redirectToWordsList(formData, "error", getValidationErrorMessage());
  }

  const prisma = getPrisma();
  const result = await prisma.word.updateMany({
    where: { id: { in: parsed.data.wordIds } },
    data: { status: "DRAFT" },
  });

  revalidateWordListPaths();
  redirectToWordsList(
    formData,
    "success",
    `${result.count} ord sattes som utkast.`,
  );
}

export async function bulkAddThemeToWords(formData: FormData) {
  const parsed = bulkWordThemeActionSchema.safeParse({
    wordIds: getWordIdsFromForm(formData),
    themeId: formData.get("themeId"),
    returnTo: formData.get("returnTo"),
  });

  if (!parsed.success) {
    redirectToWordsList(formData, "error", getValidationErrorMessage());
  }

  const prisma = getPrisma();
  const theme = await prisma.theme.findUnique({
    where: { id: parsed.data.themeId },
    select: { id: true, slug: true },
  });

  if (!theme) {
    redirectToWordsList(formData, "error", "Temat kunde inte hittas.");
  }

  const result = await prisma.wordTheme.createMany({
    data: parsed.data.wordIds.map((wordId) => ({
      wordId,
      themeId: parsed.data.themeId,
    })),
    skipDuplicates: true,
  });

  revalidateWordListPaths();
  revalidatePath(`/admin/themes/${theme.slug}`);
  redirectToWordsList(
    formData,
    "success",
    `Tema lades till på ${result.count} ord.`,
  );
}

export async function bulkRemoveThemeFromWords(formData: FormData) {
  const parsed = bulkWordThemeActionSchema.safeParse({
    wordIds: getWordIdsFromForm(formData),
    themeId: formData.get("themeId"),
    returnTo: formData.get("returnTo"),
  });

  if (!parsed.success) {
    redirectToWordsList(formData, "error", getValidationErrorMessage());
  }

  const prisma = getPrisma();
  const theme = await prisma.theme.findUnique({
    where: { id: parsed.data.themeId },
    select: { id: true, slug: true },
  });

  if (!theme) {
    redirectToWordsList(formData, "error", "Temat kunde inte hittas.");
  }

  const result = await prisma.wordTheme.deleteMany({
    where: {
      themeId: parsed.data.themeId,
      wordId: { in: parsed.data.wordIds },
    },
  });

  revalidateWordListPaths();
  revalidatePath(`/admin/themes/${theme.slug}`);
  redirectToWordsList(
    formData,
    "success",
    `Tema togs bort från ${result.count} ord.`,
  );
}

export async function approveAllDraftWords() {
  const prisma = getPrisma();
  const result = await prisma.word.updateMany({
    where: { status: "DRAFT" },
    data: { status: "APPROVED" },
  });

  revalidateWordListPaths();
  redirectWithMessage(
    "/admin/review",
    "success",
    `${result.count} utkast godkändes.`,
  );
}
