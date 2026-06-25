# WORD_DATA_STRUCTURE

Senast uppdaterad: 2026-06-25

Det här dokumentet beskriver den DB-first modellen för orddata och råkällor i Ordklubben.

## Mål

- spel ska inte läsa från `data/*` i runtime
- `data/` ska bara innehålla externa råkällor och tillfälliga manuella importregler
- import ska skriva till Postgres, inte till statiska ordlistor i repo:t
- samma ord ska kunna komma från flera källor utan att manuellt kuraterat innehåll skrivs över

## `data/`-struktur

```
data/
  raw/
    hunspell/
      sv_SE.dic
    kelly/
      Swedish-Kelly_M3_CEFR.csv
  seed/
    word-filters/
      never-allow-sv.ts
```

`data/raw/` innehåller externa råkällor (Hunspell, Kelly).

`data/seed/` är en temporär plats för `never-allow-sv.ts` tills DB-baserad blocklist eller editorial override finns. Målet är att ta bort `data/seed/` helt när blocklistan flyttat till databasen.

Algoritmiska importregler (t.ex. abbreviation-filter och etablerade förkortningar) ligger i `lib/dictionary/word-filters.ts`, inte i `data/`.

Ordstorm seed-kurering (block/prioritet) ska framåt ligga i databasen via `OrdstormWordProfile` — inte i `data/`.

Det finns inga generated-filer, ingen `legacy/`, ingen `sources/`, inga kuraterade TS-listor och inga CSV-builds under `data/`.

## Runtime

Aktiv runtime läser från databasen via:

- `lib/server/words/`
- `lib/games/<game>/word-provider.ts` eller `content-provider.ts`

Ingen spelroute importerar från `data/`.

## Import

Aktivt importspår: `scripts/import-words.ts` (`npm run import:words`).

Scriptet:

- läser `data/raw/hunspell/*.dic` och `data/raw/kelly/*.csv`
- tillämpar `data/seed/word-filters/never-allow-sv.ts`
- tillämpar abbreviation-filter för Hunspell med undantag från `lib/dictionary/word-filters.ts`
- skriver till Postgres (`Word`, `WordSourceRecord`, `ImportBatch`)
- stödjer `--source=all|hunspell|kelly` och `--mode=insert-missing|merge-safe|refresh-source-metadata`

## Datamodell

1. `Word` — canonical, spelbar vy
2. `WordSourceRecord` — provenance per källa/import
3. `WordEditorialOverride` — manuella redaktionella beslut
4. `ImportBatch` — importjobb med metadata för källa, fil och status
5. `ImportBatchRow` — radlogg för importerat, återanvänt, ignorerat och fel

Importer ska upserta `Word` på `normalizedAnswer`, skapa/uppdatera källposter och reconciliara canonical fält via `resolveCanonicalWord`.

Rekommenderat default-läge: `merge-safe`.

## Viktiga noteringar

### `ImportBatch` är just nu det faktiska importjobbet

I adminflödet används `ImportBatch` nu funktionellt som ett långlivat importjobb, även om modellnamnet fortfarande heter `ImportBatch` internt.

Det är avsiktligt.

Vi behöll det interna namnet för att undvika en onödigt riskfylld total rename i Prisma, serverkod och adminvyer samtidigt som importflödet byggdes om. Om vi senare vill byta namn till exempelvis `ImportJob` bör det göras som en separat, medveten refaktor.

### `importedBy` är tills vidare systemvärdet `Admin`

Fältet `importedBy` sätts automatiskt vid import och ska inte anges manuellt i adminformuläret.

Just nu används värdet `Admin`, eftersom adminflödet ännu inte har riktig användaridentitet eller sessionskoppling. När admin senare får autentisering bör `importedBy` börja spegla faktisk användare utan att ändra importens övriga proveniensmodell.

### Redaktionella ändringar ska fortsätta vara separata

Importmetadata och källspårning lever i `ImportBatch`, `ImportBatchRow` och `WordSourceRecord`.

Redaktionella beslut lever i `Word`, `WordEditorialOverride` och övriga innehållstabeller.

Den separationen är viktig: en ny import får uppdatera provenance och rå källinformation, men ska inte skriva över Ordklubbens redaktionella bedömningar.

## Speldata

Dagens Ord, Stegvis, Ordstorm och övriga spel hämtar ord och spelinnehåll från databasen — inte från filer under `data/`.
