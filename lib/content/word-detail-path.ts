export const WORD_DETAIL_TABS = [
  "overview",
  "lexicon",
  "keys",
  "themes",
  "history",
  "statistics",
] as const;

export type WordDetailTab = (typeof WORD_DETAIL_TABS)[number];

export function isWordDetailTab(value: string | undefined): value is WordDetailTab {
  return WORD_DETAIL_TABS.includes(value as WordDetailTab);
}

export function normalizeWordDetailTab(value: string | undefined): WordDetailTab {
  if (value === "proposals") {
    return "keys";
  }

  if (isWordDetailTab(value)) {
    return value;
  }

  return "overview";
}

export function wordDetailHref(
  wordId: string,
  tab: WordDetailTab = "overview",
  params?: Record<string, string | undefined>,
) {
  const search = new URLSearchParams();

  if (tab !== "overview") {
    search.set("tab", tab);
  }

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) {
      search.set(key, value);
    }
  }

  const query = search.toString();
  return query ? `/admin/words/${wordId}?${query}` : `/admin/words/${wordId}`;
}

export function wordDetailPathFromForm(wordId: string, formData: FormData) {
  const tab = formData.get("tab");
  const candidateStatus = formData.get("candidateStatus");
  const entryType = formData.get("entryType");

  const resolvedTab = normalizeWordDetailTab(typeof tab === "string" ? tab : undefined);

  const params: Record<string, string | undefined> = {};
  if (typeof candidateStatus === "string" && candidateStatus) {
    params.candidateStatus = candidateStatus;
  }
  if (typeof entryType === "string" && entryType) {
    params.entryType = entryType;
  }

  return wordDetailHref(wordId, resolvedTab, params);
}
