'use client';

import { Loader2, Sparkles } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { SubmitButton } from '@/components/admin/admin-ui';
import { generateMediaSuggestionAction } from '@/lib/content/actions';

type GenerateMediaSuggestionButtonProps = {
  wordId: string;
  tab: string;
};

function GenerateMediaSuggestionFormBody() {
  const { pending } = useFormStatus();

  return (
    <>
      <SubmitButton variant="secondary" disabled={pending} className="min-w-[11.5rem] gap-1.5">
        {pending ? (
          <>
            <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
            Genererar…
          </>
        ) : (
          <>
            <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />
            Generera mediaförslag
          </>
        )}
      </SubmitButton>
      {pending ? (
        <p className="mt-1.5 text-xs text-print-muted">Det kan ta några sekunder.</p>
      ) : null}
    </>
  );
}

export function GenerateMediaSuggestionButton({ wordId, tab }: GenerateMediaSuggestionButtonProps) {
  return (
    <form action={generateMediaSuggestionAction} className="inline-flex flex-col items-start">
      <input type="hidden" name="wordId" value={wordId} />
      <input type="hidden" name="tab" value={tab} />
      <GenerateMediaSuggestionFormBody />
    </form>
  );
}
