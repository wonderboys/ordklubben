"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useFormStatus } from "react-dom";
import {
  SubmitButton,
  adminButtonSecondaryClass,
} from "@/components/admin/admin-ui";
import { generateHintCandidatesAction } from "@/lib/content/actions";
import { cn } from "@/lib/utils";

type ProposalActionsProps = {
  wordId: string;
  tab: string;
  manualToggleId: string;
};

function ProposalActionsFormBody({ manualToggleId }: { manualToggleId: string }) {
  const { pending } = useFormStatus();

  function toggleManualProposalForm() {
    const checkbox = document.getElementById(manualToggleId);
    if (checkbox instanceof HTMLInputElement) {
      checkbox.checked = !checkbox.checked;
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-start gap-2">
        <SubmitButton
          variant="secondary"
          disabled={pending}
          className="min-w-[11.5rem] gap-1.5"
        >
          {pending ? (
            <>
              <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
              Genererar…
            </>
          ) : (
            <>
              <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />
              Generera förslag
            </>
          )}
        </SubmitButton>
        <button
          type="button"
          disabled={pending}
          onClick={toggleManualProposalForm}
          className={cn(adminButtonSecondaryClass)}
        >
          Föreslå manuellt
        </button>
      </div>
      {pending ? (
        <p className="mt-1.5 text-xs text-print-muted">Det kan ta några sekunder.</p>
      ) : null}
    </>
  );
}

export function ProposalActions({ wordId, tab, manualToggleId }: ProposalActionsProps) {
  return (
    <form action={generateHintCandidatesAction} className="inline-flex flex-col items-start">
      <input type="hidden" name="wordId" value={wordId} />
      <input type="hidden" name="tab" value={tab} />
      <ProposalActionsFormBody manualToggleId={manualToggleId} />
    </form>
  );
}
