import type { HintCandidateStatus } from "@prisma/client";
import { ChevronDown, Sparkles } from "lucide-react";
import { HintMetadataFields } from "@/components/admin/hint-metadata-fields";
import {
  AdminActionGroup,
  AdminPanel,
  AdminPanelEmpty,
  AdminToggleLabel,
  AdminToolbar,
  AdminToolbarDivider,
  AdminToolbarSection,
  Field,
  HintCandidateStatusBadge,
  SelectInput,
  StatusBadge,
  SubmitButton,
  TextArea,
  TextInput,
  adminButtonTertiaryClass,
} from "@/components/admin/admin-ui";
import {
  approveEditedHintCandidate,
  approveHintCandidate,
  createHintCandidate,
  deleteHintCandidate,
  generateMockHintCandidates,
  rejectHintCandidate,
  updateHintStatus,
} from "@/lib/content/actions";
import {
  CONTENT_STATUSES,
  HINT_CANDIDATE_STATUSES,
  HINT_CANDIDATE_STATUS_LABELS,
  HINT_TYPE_LABELS,
  STATUS_LABELS,
  formatHintDifficulty,
  formatHintTone,
} from "@/lib/content/constants";
import type { WordDetailData } from "@/components/admin/word-detail/types";
import { cn } from "@/lib/utils";

const PROPOSE_FORM_ID = "show-propose-form";
const KEYS_TAB = "keys";

function HintCard({
  wordId,
  hint,
}: {
  wordId: string;
  hint: WordDetailData["hints"][number];
}) {
  return (
    <article className="rounded-sm border border-print-ink/10 bg-print-ink/[0.015] p-3">
      <p className="text-base font-medium leading-snug text-print-ink">{hint.text}</p>
      <dl className="mt-2.5 grid gap-2 text-xs sm:grid-cols-3">
        <div>
          <dt className="text-print-muted">Typ</dt>
          <dd className="mt-0.5 text-print-ink">{HINT_TYPE_LABELS[hint.type]}</dd>
        </div>
        <div>
          <dt className="text-print-muted">Svårighet</dt>
          <dd className="mt-0.5 text-print-ink">{formatHintDifficulty(hint.difficulty)}</dd>
        </div>
        <div>
          <dt className="text-print-muted">Status</dt>
          <dd className="mt-0.5">
            <StatusBadge status={hint.status} />
          </dd>
        </div>
      </dl>
      <form
        action={updateHintStatus}
        className="mt-3 flex flex-wrap items-center gap-2 border-t border-print-ink/10 pt-3"
      >
        <input type="hidden" name="wordId" value={wordId} />
        <input type="hidden" name="hintId" value={hint.id} />
        <input type="hidden" name="tab" value={KEYS_TAB} />
        <SelectInput
          name="status"
          defaultValue={hint.status}
          className="min-w-32"
          aria-label={`Status för ${hint.text}`}
        >
          {CONTENT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </SelectInput>
        <SubmitButton variant="secondary">Ändra status</SubmitButton>
      </form>
    </article>
  );
}

function ProposalActions({ wordId }: { wordId: string }) {
  return (
    <>
      <form action={generateMockHintCandidates} className="inline-flex">
        <input type="hidden" name="wordId" value={wordId} />
        <input type="hidden" name="tab" value={KEYS_TAB} />
        <SubmitButton variant="secondary" className="gap-1.5">
          <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />
          Generera förslag
        </SubmitButton>
      </form>
      <AdminToggleLabel htmlFor={PROPOSE_FORM_ID} variant="secondary">
        Föreslå manuellt
      </AdminToggleLabel>
    </>
  );
}

function ProposalMetadata({
  proposal,
}: {
  proposal: WordDetailData["hintCandidates"][number];
}) {
  return (
    <dl className="grid gap-2 text-xs text-print-muted sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <dt>Typ</dt>
        <dd className="mt-0.5 text-print-ink">{HINT_TYPE_LABELS[proposal.type]}</dd>
      </div>
      <div>
        <dt>Svårighet</dt>
        <dd className="mt-0.5 text-print-ink">{formatHintDifficulty(proposal.difficulty)}</dd>
      </div>
      <div>
        <dt>Ton</dt>
        <dd className="mt-0.5 text-print-ink">{formatHintTone(proposal.tone)}</dd>
      </div>
      <div>
        <dt>Källa</dt>
        <dd className="mt-0.5 text-print-ink">{proposal.source}</dd>
      </div>
      <div>
        <dt>Skapad</dt>
        <dd className="mt-0.5 text-print-ink">
          {proposal.createdAt.toLocaleDateString("sv-SE")}
        </dd>
      </div>
    </dl>
  );
}

function ProposalCard({
  wordId,
  proposal,
}: {
  wordId: string;
  proposal: WordDetailData["hintCandidates"][number];
}) {
  const editFormId = `proposal-edit-${proposal.id}`;

  return (
    <article className="rounded-sm border border-print-ink/10 bg-print-ink/[0.015]">
      <div className="px-3 py-3">
        <p className="text-base font-medium leading-snug text-print-ink">{proposal.text}</p>
        <div className="mt-2">
          <HintCandidateStatusBadge status={proposal.status} />
        </div>
      </div>

      {proposal.status === "PENDING" ? (
        <div className="border-t border-print-ink/10 px-3 py-3">
          <AdminActionGroup>
            <form action={approveHintCandidate}>
              <input type="hidden" name="wordId" value={wordId} />
              <input type="hidden" name="candidateId" value={proposal.id} />
              <input type="hidden" name="tab" value={KEYS_TAB} />
              <SubmitButton variant="primary">Godkänn</SubmitButton>
            </form>
            <form action={rejectHintCandidate}>
              <input type="hidden" name="wordId" value={wordId} />
              <input type="hidden" name="candidateId" value={proposal.id} />
              <input type="hidden" name="tab" value={KEYS_TAB} />
              <SubmitButton variant="secondary">Avvisa</SubmitButton>
            </form>
            <form action={deleteHintCandidate}>
              <input type="hidden" name="wordId" value={wordId} />
              <input type="hidden" name="candidateId" value={proposal.id} />
              <input type="hidden" name="tab" value={KEYS_TAB} />
              <SubmitButton variant="tertiary">Ta bort</SubmitButton>
            </form>
          </AdminActionGroup>
        </div>
      ) : null}

      <div className="border-t border-print-ink/10 bg-print-ink/[0.02] px-3 py-2.5">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.04em] text-print-muted">
          Metadata
        </p>
        <ProposalMetadata proposal={proposal} />
      </div>

      {proposal.status === "PENDING" ? (
        <>
          <input id={editFormId} type="checkbox" className="peer/edit sr-only" />

          <div className="border-t border-print-ink/10 px-3 py-2.5 peer-checked/edit:[&_svg]:rotate-180">
            <label
              htmlFor={editFormId}
              className={cn(adminButtonTertiaryClass, "inline-flex items-center gap-1.5")}
            >
              <ChevronDown aria-hidden className="size-3.5 shrink-0 transition-transform" />
              Redigera innan godkännande
            </label>
          </div>

          <div className="hidden border-t border-print-ink/10 px-3 py-3 peer-checked/edit:block">
            <form action={approveEditedHintCandidate} className="grid gap-3">
              <input type="hidden" name="wordId" value={wordId} />
              <input type="hidden" name="candidateId" value={proposal.id} />
              <input type="hidden" name="tab" value={KEYS_TAB} />
              <Field label="Nyckeltext" htmlFor={`proposal-edit-text-${proposal.id}`}>
                <TextInput
                  id={`proposal-edit-text-${proposal.id}`}
                  name="text"
                  defaultValue={proposal.text}
                  required
                />
              </Field>
              <HintMetadataFields
                idPrefix={`proposal-edit-${proposal.id}`}
                typeDefaultValue={proposal.type}
                difficultyDefaultValue={proposal.difficulty}
                toneDefaultValue={proposal.tone}
                compact
              />
              <SubmitButton variant="secondary">Redigera och godkänn</SubmitButton>
            </form>
          </div>
        </>
      ) : proposal.status === "REJECTED" ? (
        <div className="border-t border-print-ink/10 px-3 py-3">
          <form action={deleteHintCandidate}>
            <input type="hidden" name="wordId" value={wordId} />
            <input type="hidden" name="candidateId" value={proposal.id} />
            <input type="hidden" name="tab" value={KEYS_TAB} />
            <SubmitButton variant="tertiary">Ta bort</SubmitButton>
          </form>
        </div>
      ) : (
        <div className="border-t border-print-ink/10 px-3 py-3">
          <p className="text-xs text-print-muted">
            {proposal.approvedHintId ? "Skapade nyckel." : "Godkänd."}
          </p>
        </div>
      )}
    </article>
  );
}

function ProposalList({
  wordId,
  proposals,
}: {
  wordId: string;
  proposals: WordDetailData["hintCandidates"];
}) {
  if (proposals.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3">
      {proposals.map((proposal) => (
        <ProposalCard key={proposal.id} wordId={wordId} proposal={proposal} />
      ))}
    </div>
  );
}

function ProposalsWorkspace({
  word,
  candidateStatus,
}: {
  word: WordDetailData;
  candidateStatus?: HintCandidateStatus;
}) {
  const filteredProposals = candidateStatus
    ? word.hintCandidates.filter((proposal) => proposal.status === candidateStatus)
    : word.hintCandidates;

  const pendingProposals = filteredProposals.filter(
    (proposal) => proposal.status === "PENDING",
  );
  const otherProposals = candidateStatus
    ? []
    : filteredProposals.filter((proposal) => proposal.status !== "PENDING");

  return (
    <>
      <AdminToolbar className="mb-4">
        <AdminToolbarSection label="Nytt förslag">
          <AdminActionGroup>
            <ProposalActions wordId={word.id} />
          </AdminActionGroup>
        </AdminToolbarSection>

        {word.hintCandidates.length > 0 ? (
          <>
            <AdminToolbarDivider />
            <AdminToolbarSection label="Filtrera">
              <form method="get">
                <AdminActionGroup>
                  <input type="hidden" name="tab" value={KEYS_TAB} />
                  <SelectInput
                    name="candidateStatus"
                    defaultValue={candidateStatus ?? ""}
                    className="min-w-44"
                  >
                    <option value="">Alla statusar</option>
                    {HINT_CANDIDATE_STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {HINT_CANDIDATE_STATUS_LABELS[value]}
                      </option>
                    ))}
                  </SelectInput>
                  <SubmitButton variant="secondary">Filtrera</SubmitButton>
                </AdminActionGroup>
              </form>
            </AdminToolbarSection>
          </>
        ) : null}
      </AdminToolbar>

      <input id={PROPOSE_FORM_ID} type="checkbox" className="peer sr-only" />

      <div className="mb-4 hidden rounded-sm border border-print-ink/10 bg-print-ink/[0.02] p-3 peer-checked:block">
        <p className="mb-3 text-sm font-medium text-print-ink">Manuellt förslag</p>
        <form action={createHintCandidate} className="grid gap-3">
          <input type="hidden" name="wordId" value={word.id} />
          <input type="hidden" name="tab" value={KEYS_TAB} />
          <Field label="Nyckeltext" htmlFor="proposal-text">
            <TextInput id="proposal-text" name="text" required />
          </Field>
          <div>
            <p className="mb-2 text-xs font-medium text-print-muted">Valfri metadata</p>
            <HintMetadataFields idPrefix="proposal" compact />
          </div>
          <Field label="Anteckningar" htmlFor="proposal-notes" hint="Valfritt">
            <TextArea id="proposal-notes" name="notes" className="min-h-20" />
          </Field>
          <div>
            <SubmitButton variant="primary">Spara förslag</SubmitButton>
          </div>
        </form>
      </div>

      {filteredProposals.length > 0 ? (
        <div className="space-y-5">
          {!candidateStatus ? (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-print-muted">
                Väntar på granskning
              </h3>
              {pendingProposals.length > 0 ? (
                <ProposalList wordId={word.id} proposals={pendingProposals} />
              ) : (
                <p className="text-sm text-print-muted">Inga förslag väntar på granskning.</p>
              )}
            </section>
          ) : null}

          {candidateStatus ? (
            <ProposalList wordId={word.id} proposals={filteredProposals} />
          ) : otherProposals.length > 0 ? (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-print-muted">
                Övriga förslag
              </h3>
              <ProposalList wordId={word.id} proposals={otherProposals} />
            </section>
          ) : null}
        </div>
      ) : (
        <AdminPanelEmpty message="Inga förslag finns ännu." />
      )}
    </>
  );
}

export function WordKeysSection({
  word,
  candidateStatus,
}: {
  word: WordDetailData;
  candidateStatus?: HintCandidateStatus;
}) {
  return (
    <div className="space-y-8">
      <AdminPanel title="Godkända nycklar">
        {word.hints.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {word.hints.map((hint) => (
              <HintCard key={hint.id} wordId={word.id} hint={hint} />
            ))}
          </div>
        ) : (
          <AdminPanelEmpty message="Inga nycklar finns ännu. Godkänn ett förslag nedan för att skapa en nyckel." />
        )}
      </AdminPanel>

      <AdminPanel title="Förslag">
        <ProposalsWorkspace word={word} candidateStatus={candidateStatus} />
      </AdminPanel>
    </div>
  );
}
