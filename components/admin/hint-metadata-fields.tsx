import type { HintType } from '@prisma/client';
import { Field, SelectInput } from '@/components/admin/admin-ui';
import {
  DEFAULT_HINT_TONE,
  DEFAULT_HINT_TYPE,
  HINT_DIFFICULTY_OPTIONS,
  HINT_TONE_LABELS,
  HINT_TONES,
  HINT_TYPE_LABELS,
  HINT_TYPE_SELECT_OPTIONS,
  formatHintSource,
  isSelectableHintType,
} from '@/lib/content/constants';

type HintMetadataFieldsProps = {
  idPrefix: string;
  typeDefaultValue?: HintType;
  difficultyDefaultValue?: number | null;
  toneDefaultValue?: string | null;
  source?: string | null;
  compact?: boolean;
};

export function HintMetadataFields({
  idPrefix,
  typeDefaultValue = DEFAULT_HINT_TYPE,
  difficultyDefaultValue = null,
  toneDefaultValue = DEFAULT_HINT_TONE,
  source,
  compact = false,
}: HintMetadataFieldsProps) {
  const typeValue = isSelectableHintType(typeDefaultValue) ? typeDefaultValue : DEFAULT_HINT_TYPE;

  const toneValue =
    toneDefaultValue && (HINT_TONES as readonly string[]).includes(toneDefaultValue)
      ? toneDefaultValue
      : DEFAULT_HINT_TONE;

  return (
    <div className="space-y-3">
      <div className={compact ? 'grid gap-3 sm:grid-cols-2' : 'grid gap-3 sm:grid-cols-2'}>
        <Field label="Typ" htmlFor={`${idPrefix}-type`} hint={compact ? 'Valfritt' : undefined}>
          <SelectInput id={`${idPrefix}-type`} name="type" defaultValue={typeValue}>
            {HINT_TYPE_SELECT_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {HINT_TYPE_LABELS[value]}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field
          label="Svårighet"
          htmlFor={`${idPrefix}-difficulty`}
          hint={compact ? 'Valfritt' : undefined}
        >
          <SelectInput
            id={`${idPrefix}-difficulty`}
            name="difficulty"
            defaultValue={difficultyDefaultValue == null ? '' : String(difficultyDefaultValue)}
          >
            {HINT_DIFFICULTY_OPTIONS.map((option) => (
              <option key={option.value || 'unset'} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Ton" htmlFor={`${idPrefix}-tone`} hint={compact ? 'Valfritt' : undefined}>
          <SelectInput id={`${idPrefix}-tone`} name="tone" defaultValue={toneValue}>
            {HINT_TONES.map((value) => (
              <option key={value} value={value}>
                {HINT_TONE_LABELS[value]}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>
      {source !== undefined ? (
        <Field label="Källa" htmlFor={`${idPrefix}-source`}>
          <p
            id={`${idPrefix}-source`}
            className="rounded-sm border border-print-ink/10 bg-print-ink/[0.02] px-3 py-2 text-sm text-print-ink"
          >
            {formatHintSource(source)}
          </p>
        </Field>
      ) : null}
    </div>
  );
}
