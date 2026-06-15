import { ChevronDown } from "lucide-react";
import {
  AdminActionGroup,
  AdminPanel,
  AdminPanelEmpty,
  AdminToolbar,
  AdminToolbarSection,
  Field,
  SelectInput,
  StatusBadge,
  SubmitButton,
  TextArea,
  TextInput,
  adminButtonTertiaryClass,
} from "@/components/admin/admin-ui";
import { GenerateMediaSuggestionButton } from "@/components/admin/generate-media-suggestion-button";
import {
  MediaAssetImageFields,
  MediaAssetImagePreview,
} from "@/components/admin/media-asset-image-fields";
import {
  createMediaAsset,
  deleteMediaAsset,
  updateMediaAsset,
} from "@/lib/content/actions";
import {
  CONTENT_STATUSES,
  MEDIA_TYPES,
  MEDIA_TYPE_LABELS,
  STATUS_LABELS,
  WORD_SOURCES,
  WORD_SOURCE_LABELS,
  formatMediaType,
  formatWordSourceWithReference,
} from "@/lib/content/constants";
import type { WordDetailData, WordDetailMediaAsset } from "@/components/admin/word-detail/types";
import { cn } from "@/lib/utils";

const MEDIA_TAB = "media";
const NEW_ASSET_FORM_ID = "new-media-asset";

function MediaAssetCard({
  wordId,
  asset,
}: {
  wordId: string;
  asset: WordDetailMediaAsset;
}) {
  const editFormId = `media-edit-${asset.id}`;

  return (
    <article className="rounded-sm border border-print-ink/10 bg-print-ink/[0.015]">
      <div className="px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-sm bg-print-ink/[0.06] px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.04em] text-print-muted">
            {formatMediaType(asset.mediaType)}
          </span>
          <StatusBadge status={asset.status} />
          <span className="text-xs text-print-muted">
            {formatWordSourceWithReference(asset.source, asset.sourceReference)}
          </span>
        </div>
        {asset.title ? (
          <p className="mt-2 text-base font-medium leading-snug text-print-ink">{asset.title}</p>
        ) : (
          <p className="mt-2 text-sm text-print-muted">Ingen titel</p>
        )}
        {asset.altText ? (
          <p className="mt-1 text-sm text-print-muted">{asset.altText}</p>
        ) : null}
        {asset.prompt ? (
          <p className="mt-2 text-sm text-print-muted">
            <span className="font-medium text-print-ink">Prompt: </span>
            {asset.prompt}
          </p>
        ) : null}
        {asset.notes ? (
          <p className="mt-2 text-sm text-print-muted">{asset.notes}</p>
        ) : null}
        {asset.mediaType === "IMAGE" && asset.filePath ? (
          <MediaAssetImagePreview filePath={asset.filePath} altText={asset.altText} />
        ) : null}
      </div>

      <input id={editFormId} type="checkbox" className="peer/edit sr-only" />
      <div className="border-t border-print-ink/10 px-3 py-2.5 peer-checked/edit:[&_svg]:rotate-180">
        <label
          htmlFor={editFormId}
          className={cn(adminButtonTertiaryClass, "inline-flex items-center gap-1.5")}
        >
          <ChevronDown aria-hidden className="size-3.5 shrink-0 transition-transform" />
          Redigera
        </label>
      </div>
      <div className="hidden border-t border-print-ink/10 px-3 py-3 peer-checked/edit:block">
        <form action={updateMediaAsset} className="grid gap-3">
          <input type="hidden" name="wordId" value={wordId} />
          <input type="hidden" name="assetId" value={asset.id} />
          <input type="hidden" name="tab" value={MEDIA_TAB} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Typ" htmlFor={`media-type-${asset.id}`}>
              <SelectInput
                id={`media-type-${asset.id}`}
                name="mediaType"
                defaultValue={asset.mediaType}
              >
                {MEDIA_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {MEDIA_TYPE_LABELS[value]}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Status" htmlFor={`media-status-${asset.id}`}>
              <SelectInput
                id={`media-status-${asset.id}`}
                name="status"
                defaultValue={asset.status}
              >
                {CONTENT_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Källa" htmlFor={`media-source-${asset.id}`}>
              <SelectInput
                id={`media-source-${asset.id}`}
                name="source"
                defaultValue={asset.source}
              >
                {WORD_SOURCES.map((value) => (
                  <option key={value} value={value}>
                    {WORD_SOURCE_LABELS[value]}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <Field label="Titel" htmlFor={`media-title-${asset.id}`} hint="Valfritt">
            <TextInput id={`media-title-${asset.id}`} name="title" defaultValue={asset.title ?? ""} />
          </Field>
          <Field label="Alt-text" htmlFor={`media-alt-${asset.id}`} hint="Valfritt">
            <TextInput id={`media-alt-${asset.id}`} name="altText" defaultValue={asset.altText ?? ""} />
          </Field>
          <MediaAssetImageFields
            mediaTypeFieldId={`media-type-${asset.id}`}
            initialMediaType={asset.mediaType}
            filePath={asset.filePath}
          />
          <Field label="Bildprompt" htmlFor={`media-prompt-${asset.id}`} hint="Valfritt">
            <TextArea
              id={`media-prompt-${asset.id}`}
              name="prompt"
              defaultValue={asset.prompt ?? ""}
              className="min-h-16"
            />
          </Field>
          <Field label="Attribution" htmlFor={`media-attribution-${asset.id}`} hint="Valfritt">
            <TextInput
              id={`media-attribution-${asset.id}`}
              name="attribution"
              defaultValue={asset.attribution ?? ""}
            />
          </Field>
          <Field label="Licens" htmlFor={`media-license-${asset.id}`} hint="Valfritt">
            <TextInput id={`media-license-${asset.id}`} name="license" defaultValue={asset.license ?? ""} />
          </Field>
          <Field label="Anteckningar" htmlFor={`media-notes-${asset.id}`} hint="Valfritt">
            <TextArea
              id={`media-notes-${asset.id}`}
              name="notes"
              defaultValue={asset.notes ?? ""}
              className="min-h-16"
            />
          </Field>
          <AdminActionGroup>
            <SubmitButton variant="secondary">Spara</SubmitButton>
          </AdminActionGroup>
        </form>
      </div>

      <div className="border-t border-print-ink/10 px-3 py-3">
        <form action={deleteMediaAsset}>
          <input type="hidden" name="wordId" value={wordId} />
          <input type="hidden" name="assetId" value={asset.id} />
          <input type="hidden" name="tab" value={MEDIA_TAB} />
          <SubmitButton variant="tertiary">Ta bort</SubmitButton>
        </form>
      </div>
    </article>
  );
}

export function WordMediaSection({ word }: { word: WordDetailData }) {
  return (
    <>
      <AdminToolbar className="mb-4">
        <AdminToolbarSection label="AI-generering">
          <GenerateMediaSuggestionButton wordId={word.id} tab={MEDIA_TAB} />
        </AdminToolbarSection>
        <AdminToolbarSection label="Nytt mediaobjekt">
          <label
            htmlFor={NEW_ASSET_FORM_ID}
            className="admin-control inline-flex h-8 cursor-pointer items-center rounded-sm border border-print-ink/15 bg-print-surface px-2.5 text-sm font-medium text-print-ink hover:bg-print-ink/[0.04]"
          >
            Lägg till media
          </label>
        </AdminToolbarSection>
      </AdminToolbar>

      <input id={NEW_ASSET_FORM_ID} type="checkbox" className="peer sr-only" />
      <div className="mb-4 hidden rounded-sm border border-print-ink/10 bg-print-ink/[0.02] p-3 peer-checked:block">
        <p className="mb-3 text-sm font-medium text-print-ink">Nytt mediaobjekt</p>
        <p className="mb-3 text-xs text-print-muted">
          Metadata och bilduppladdning för media kopplat till ordet.
        </p>
        <form action={createMediaAsset} className="grid gap-3">
          <input type="hidden" name="wordId" value={word.id} />
          <input type="hidden" name="tab" value={MEDIA_TAB} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Typ" htmlFor="media-new-type">
              <SelectInput id="media-new-type" name="mediaType" defaultValue="IMAGE">
                {MEDIA_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {MEDIA_TYPE_LABELS[value]}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Status" htmlFor="media-new-status">
              <SelectInput id="media-new-status" name="status" defaultValue="DRAFT">
                {CONTENT_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Källa" htmlFor="media-new-source">
              <SelectInput id="media-new-source" name="source" defaultValue="manual">
                {WORD_SOURCES.map((value) => (
                  <option key={value} value={value}>
                    {WORD_SOURCE_LABELS[value]}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <Field label="Titel" htmlFor="media-new-title" hint="Valfritt">
            <TextInput id="media-new-title" name="title" />
          </Field>
          <Field label="Alt-text" htmlFor="media-new-alt" hint="Valfritt">
            <TextInput id="media-new-alt" name="altText" />
          </Field>
          <MediaAssetImageFields
            mediaTypeFieldId="media-new-type"
            initialMediaType="IMAGE"
          />
          <Field label="Anteckningar" htmlFor="media-new-notes" hint="Valfritt">
            <TextArea id="media-new-notes" name="notes" className="min-h-16" />
          </Field>
          <SubmitButton variant="primary">Spara mediaobjekt</SubmitButton>
        </form>
      </div>

      {word.mediaAssets.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {word.mediaAssets.map((asset) => (
            <MediaAssetCard key={asset.id} wordId={word.id} asset={asset} />
          ))}
        </div>
      ) : (
        <AdminPanelEmpty message="Inga mediaobjekt finns ännu." />
      )}
    </>
  );
}

export function WordMediaPanel({ word }: { word: WordDetailData }) {
  return (
    <AdminPanel title="Media">
      <div className="mb-4 text-sm leading-relaxed text-print-muted">
        <p>Media beskriver hur ordet kan visas, höras eller upplevas.</p>
        <p className="mt-2 text-xs">
          Bilder kan laddas upp direkt på IMAGE-objekt och används i Bildjakten när de är godkända.
        </p>
      </div>
      <WordMediaSection word={word} />
    </AdminPanel>
  );
}
