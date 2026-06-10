import Link from "next/link";
import {
  AdminPanel,
  AdminPanelEmpty,
  SelectInput,
  SubmitButton,
} from "@/components/admin/admin-ui";
import { addThemeToWord, removeThemeFromWord } from "@/lib/content/actions";
import type { AvailableTheme, WordDetailData } from "@/components/admin/word-detail/types";

function AddThemeForm({
  wordId,
  unlinkedThemes,
}: {
  wordId: string;
  unlinkedThemes: AvailableTheme[];
}) {
  return (
    <form action={addThemeToWord} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="wordId" value={wordId} />
      <input type="hidden" name="tab" value="themes" />
      <SelectInput
        id="themeId"
        name="themeId"
        defaultValue=""
        required
        className="min-w-44"
        aria-label="Välj tema"
      >
        <option value="">Välj tema</option>
        {unlinkedThemes.map((theme) => (
          <option key={theme.id} value={theme.id}>
            {theme.name}
          </option>
        ))}
      </SelectInput>
      <SubmitButton variant="secondary">Lägg till</SubmitButton>
    </form>
  );
}

export function WordThemesSection({
  word,
  availableThemes,
}: {
  word: WordDetailData;
  availableThemes: AvailableTheme[];
}) {
  const unlinkedThemes = availableThemes.filter(
    (theme) => !word.themes.some((entry) => entry.theme.id === theme.id),
  );

  return (
    <AdminPanel>
      {word.themes.length > 0 ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {word.themes.map(({ theme }) => (
              <div
                key={theme.id}
                className="inline-flex items-center gap-1 rounded-sm border border-print-ink/15 bg-print-ink/[0.03] px-2 py-1 text-sm"
              >
                <Link
                  href={`/admin/themes/${theme.slug}`}
                  className="font-medium text-print-ink no-underline hover:underline"
                >
                  {theme.name}
                </Link>
                <form action={removeThemeFromWord}>
                  <input type="hidden" name="wordId" value={word.id} />
                  <input type="hidden" name="themeId" value={theme.id} />
                  <input type="hidden" name="tab" value="themes" />
                  <button
                    type="submit"
                    className="cursor-pointer text-xs text-print-red"
                    aria-label={`Ta bort temat ${theme.name}`}
                  >
                    ✕
                  </button>
                </form>
              </div>
            ))}
          </div>
          <AddThemeForm wordId={word.id} unlinkedThemes={unlinkedThemes} />
        </div>
      ) : (
        <AdminPanelEmpty message="Det här ordet är inte kopplat till några teman än.">
          <AddThemeForm wordId={word.id} unlinkedThemes={unlinkedThemes} />
        </AdminPanelEmpty>
      )}
    </AdminPanel>
  );
}
