"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mockGenerateHintCandidates } from "@/lib/content/ai/mock-generate-hint-candidates";
import { approveCandidateAsHint } from "@/lib/content/hint-candidate";
import { trimHintText } from "@/lib/content/normalize-hint";
import {
  addThemeToWordSchema,
  approveEditedHintCandidateSchema,
  createHintCandidateSchema,
  createHintSchema,
  createThemeSchema,
  createWordSchema,
  generateMockHintCandidatesSchema,
  hintCandidateActionSchema,
  importContentSchema,
  removeThemeFromWordSchema,
  updateHintStatusSchema,
  updateWordSchema,
} from "@/lib/content/validators";
import { getPrisma } from "@/lib/db/prisma";
import {
  isValidAnswerFormat,
  normalizeAnswer,
  slugifyThemeName,
} from "@/lib/content/normalize-answer";
import { importContent } from "@/lib/content/import-content";
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
        status: parsed.data.status,
        difficulty: parsed.data.difficulty,
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

  const prisma = getPrisma();
  await prisma.word.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      difficulty: parsed.data.difficulty,
      crosswordScore: parsed.data.crosswordScore,
      notes: parsed.data.notes,
    },
  });

  revalidatePath("/admin/words");
  revalidatePath(`/admin/words/${parsed.data.id}`);
  redirectToWord(parsed.data.id, formData, "success", "Ordet uppdaterades.");
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
  await prisma.hint.create({
    data: {
      wordId: parsed.data.wordId,
      text: parsed.data.text,
      type: parsed.data.type,
      status: parsed.data.status,
      difficulty: parsed.data.difficulty,
      tone: parsed.data.tone,
      source: parsed.data.source,
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
  const result = await importContent({
    prisma,
    csvText,
    filename: file.name,
    importType: parsed.data.importType,
    defaultWordStatus: parsed.data.wordStatus,
    defaultHintStatus: parsed.data.hintStatus,
  });

  revalidatePath("/admin/import");
  revalidatePath("/admin/words");

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
  await prisma.hintCandidate.create({
    data: {
      wordId: parsed.data.wordId,
      text: trimHintText(parsed.data.text),
      type: parsed.data.type,
      difficulty: parsed.data.difficulty,
      tone: parsed.data.tone,
      notes: parsed.data.notes,
      source: "manual_candidate",
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
      difficulty: true,
      tone: true,
      source: true,
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
    difficulty: candidate.difficulty ?? undefined,
    tone: candidate.tone ?? undefined,
    source: candidate.source,
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
    select: { source: true },
  });

  if (!candidate) {
    redirectToWord(parsed.data.wordId, formData, "error", "Förslaget kunde inte hittas.");
  }

  const result = await approveCandidateAsHint(prisma, {
    wordId: parsed.data.wordId,
    candidateId: parsed.data.candidateId,
    text: parsed.data.text,
    type: parsed.data.type,
    difficulty: parsed.data.difficulty,
    tone: parsed.data.tone,
    source: candidate.source,
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

export async function generateMockHintCandidates(formData: FormData) {
  const parsed = generateMockHintCandidatesSchema.safeParse(getFormValues(formData));

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

  const generated = mockGenerateHintCandidates({
    wordId: word.id,
    answer: word.answer,
    normalizedAnswer: word.normalizedAnswer,
    language: word.language,
  });

  await prisma.hintCandidate.createMany({
    data: generated.candidates.map((candidate) => ({
      wordId: word.id,
      text: trimHintText(candidate.text),
      type: candidate.type,
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
    `${generated.candidates.length} testförslag skapades.`,
  );
}
