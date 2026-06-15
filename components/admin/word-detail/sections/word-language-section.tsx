import {
  AdminDefinitionList,
  AdminPanel,
  Field,
  SelectInput,
  SubmitButton,
  TextInput,
} from '@/components/admin/admin-ui';
import { upsertWordLanguageData } from '@/lib/content/actions';
import {
  GRAMMATICAL_GENDERS,
  GRAMMATICAL_GENDER_LABELS,
  PART_OF_SPEECH_LABELS,
  PART_OF_SPEECH_VALUES,
  formatGrammaticalGender,
  formatPartOfSpeech,
} from '@/lib/content/constants';
import type { WordDetailData } from '@/components/admin/word-detail/types';
import { WORD_LANGUAGE_INFLECTION_GROUPS } from '@/lib/content/word-language';

const LANGUAGE_TAB = 'language';

function LanguageInfoBox() {
  return (
    <div className="mb-6 rounded-sm border border-print-ink/10 bg-print-ink/[0.02] px-3 py-3 text-sm leading-relaxed text-print-muted">
      <p className="font-medium text-print-ink">Exempel på språkdata:</p>
      <ul className="mt-2 list-inside list-disc space-y-0.5">
        <li>ordklass</li>
        <li>genus</li>
        <li>lemma</li>
        <li>uttal</li>
        <li>böjningar</li>
      </ul>
      <p className="mt-2">
        Denna data beskriver hur ordet används språkligt och är skild från betydelser (Lexikon) och
        spelledtrådar (Nycklar).
      </p>
    </div>
  );
}

function LanguageDisplay({ word }: { word: WordDetailData }) {
  const data = word.languageData;
  const inflections = data?.inflections ?? {};

  const coreItems = [
    { label: 'Ordklass', value: formatPartOfSpeech(data?.partOfSpeech) },
    { label: 'Genus', value: formatGrammaticalGender(data?.gender) },
    { label: 'Lemma', value: data?.lemma?.trim() || '—' },
    { label: 'Uttal', value: data?.pronunciation?.trim() || '—' },
  ];

  const inflectionItems = WORD_LANGUAGE_INFLECTION_GROUPS.flatMap((group) =>
    group.fields.map((field) => ({
      label: field.label,
      value: inflections[field.key]?.trim() || '—',
    })),
  );

  const hasAnyData = [...coreItems, ...inflectionItems].some((item) => item.value !== '—');

  if (!hasAnyData) {
    return (
      <p className="text-sm text-print-muted">
        Ingen språkdata finns ännu. Grammatik och böjningar hör hit — inte betydelser eller
        spelnycklar.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.04em] text-print-muted">
          Grunddata
        </p>
        <AdminDefinitionList items={coreItems} />
      </div>
      {inflectionItems.some((item) => item.value !== '—') ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.04em] text-print-muted">
            Böjningar
          </p>
          <AdminDefinitionList items={inflectionItems} />
        </div>
      ) : null}
    </div>
  );
}

function LanguageEditForm({ word }: { word: WordDetailData }) {
  const data = word.languageData;
  const inflections = data?.inflections ?? {};

  return (
    <form action={upsertWordLanguageData} className="grid gap-6">
      <input type="hidden" name="wordId" value={word.id} />
      <input type="hidden" name="tab" value={LANGUAGE_TAB} />

      <section className="grid gap-3">
        <p className="text-sm font-medium text-print-ink">Grunddata</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Ordklass" htmlFor="language-partOfSpeech">
            <SelectInput
              id="language-partOfSpeech"
              name="partOfSpeech"
              defaultValue={data?.partOfSpeech ?? ''}
            >
              <option value="">Ej satt</option>
              {PART_OF_SPEECH_VALUES.map((value) => (
                <option key={value} value={value}>
                  {PART_OF_SPEECH_LABELS[value]}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Genus" htmlFor="language-gender">
            <SelectInput id="language-gender" name="gender" defaultValue={data?.gender ?? ''}>
              <option value="">Ej satt</option>
              {GRAMMATICAL_GENDERS.map((value) => (
                <option key={value} value={value}>
                  {GRAMMATICAL_GENDER_LABELS[value]}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Lemma" htmlFor="language-lemma" hint="Grundform">
            <TextInput
              id="language-lemma"
              name="lemma"
              defaultValue={data?.lemma ?? ''}
              placeholder={word.answer.toLocaleLowerCase('sv-SE')}
            />
          </Field>
          <Field label="Uttal" htmlFor="language-pronunciation" hint="Valfritt">
            <TextInput
              id="language-pronunciation"
              name="pronunciation"
              defaultValue={data?.pronunciation ?? ''}
            />
          </Field>
        </div>
      </section>

      {WORD_LANGUAGE_INFLECTION_GROUPS.map((group) => (
        <section key={group.id} className="grid gap-3">
          <p className="text-sm font-medium text-print-ink">{group.label}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.fields.map((field) => (
              <Field key={field.key} label={field.label} htmlFor={`language-${field.key}`}>
                <TextInput
                  id={`language-${field.key}`}
                  name={field.key}
                  defaultValue={inflections[field.key] ?? ''}
                />
              </Field>
            ))}
          </div>
        </section>
      ))}

      <SubmitButton variant="secondary">Spara språkdata</SubmitButton>
    </form>
  );
}

export function WordLanguageSection({ word }: { word: WordDetailData }) {
  return (
    <>
      <LanguageInfoBox />
      <LanguageDisplay word={word} />
      <div className="mt-6 border-t border-print-ink/10 pt-6">
        <p className="mb-4 text-sm font-medium text-print-ink">Redigera språkdata</p>
        <LanguageEditForm word={word} />
      </div>
    </>
  );
}

export function WordLanguagePanel({ word }: { word: WordDetailData }) {
  return (
    <AdminPanel title="Språk">
      <div className="mb-4 text-sm leading-relaxed text-print-muted">
        <p>Grammatiska egenskaper, böjningar och språklig metadata för ordet.</p>
      </div>
      <WordLanguageSection word={word} />
    </AdminPanel>
  );
}
