import type { HintType, PrismaClient } from '@prisma/client';
import { hintTextsMatch, trimHintText } from '@/lib/content/normalize-hint';
import { normalizeApprovedHintMetadata } from '@/lib/content/normalize-hint-metadata';

type ApproveCandidateInput = {
  wordId: string;
  candidateId: string;
  text: string;
  type: HintType;
  difficulty?: number;
  tone?: string;
  source?: string;
  notes?: string | null;
};

export async function approveCandidateAsHint(
  prisma: PrismaClient,
  input: ApproveCandidateInput,
): Promise<{ ok: true; hintId: string } | { ok: false; error: string }> {
  const candidate = await prisma.hintCandidate.findFirst({
    where: {
      id: input.candidateId,
      wordId: input.wordId,
    },
    select: {
      id: true,
      status: true,
      source: true,
      notes: true,
    },
  });

  if (!candidate) {
    return { ok: false, error: 'Förslaget kunde inte hittas.' };
  }

  if (candidate.status !== 'PENDING') {
    return { ok: false, error: 'Förslaget är redan granskat.' };
  }

  const text = trimHintText(input.text);

  if (text.length === 0) {
    return { ok: false, error: 'Nyckeltexten får inte vara tom.' };
  }

  const metadata = normalizeApprovedHintMetadata({
    type: input.type,
    difficulty: input.difficulty,
    tone: input.tone,
  });

  const existingHints = await prisma.hint.findMany({
    where: { wordId: input.wordId },
    select: { text: true },
  });

  if (existingHints.some((hint) => hintTextsMatch(hint.text, text))) {
    return {
      ok: false,
      error: 'En nyckel med samma text finns redan för ordet.',
    };
  }

  const reviewedAt = new Date();

  const hint = await prisma.$transaction(async (tx) => {
    const createdHint = await tx.hint.create({
      data: {
        wordId: input.wordId,
        text,
        type: metadata.type,
        status: 'DRAFT',
        difficulty: metadata.difficulty,
        tone: metadata.tone,
        source: input.source ?? candidate.source,
        notes: input.notes ?? candidate.notes,
      },
    });

    await tx.hintCandidate.update({
      where: { id: candidate.id },
      data: {
        status: 'APPROVED',
        reviewedAt,
        approvedHintId: createdHint.id,
        text,
        type: metadata.type,
        difficulty: metadata.difficulty,
        tone: metadata.tone,
        notes: input.notes ?? candidate.notes,
      },
    });

    return createdHint;
  });

  return { ok: true, hintId: hint.id };
}
