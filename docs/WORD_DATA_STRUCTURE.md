# WORD_DATA_STRUCTURE

Senast uppdaterad: 2026-06-25

Det här dokumentet beskriver Ordklubbens data- och runtime-arkitektur.

## Översikt

```text
Content Pipeline          skriver till databasen (import, seed, admin, generatorer)
        ↓
Database                  enda sanningskällan
        ↓
Content Layer             läser från databasen
        ↓
Game Provider             bygger spelunderlag per spel
        ↓
Game Rules                ren spellogik
        ↓
UI                        rendering och lokal spelstate
```

Arkitekturen börjar i databasen. Runtime läser bara från databasen.

## Database

Enda sanningskällan för ord, spelkopplingar, profiler och publicerat innehåll.

| Begrepp              | Betydelse                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| `Word`               | Lexikal sanning — ordposten (text, normaliserad form, språk, längd, status)                                 |
| `Game`               | Spelet (`slug`, namn, status)                                                                               |
| `GameWord`           | Hur ett specifikt spel får använda ett ord (`canBeGuess`, `canBeSeed`, `blocked`, `priority`, `difficulty`) |
| `GameEdition`        | Publicerat innehåll för spel som använder publicerade omgångar                                              |
| `GameEditionWord`    | Ordens roller i en edition (`SOLUTION`, `START`, `STEP`, `TARGET`, `ENTRY`, …)                              |
| `Puzzle`             | Innehålls-/gridmodell (Ordfläta) — inte publiceringsmodell                                                  |
| `Hint`, `Lexicon`, … | Lexikal data och nycklar                                                                                    |

`Word` bär lexikal sanning. Spelstyrning ligger i `GameWord` och `GameEdition`, inte som generella fält på `Word`.

## Content Pipeline

Allt som **producerar innehåll före runtime** och skriver till databasen.

Exempel:

- `npm run import:words` — ordimport till `Word`
- `npm run seed:*` — dev-seed för editions och profiler
- generatorer i `lib/content/` (Stegvis, pussel)
- admin i `app/admin/`
- framtida automatiska jobb

Content Pipeline:

- läser ev. `data/raw` som importkälla
- skriver till Postgres
- körs utanför spelarens runtime-väg

Runtime anropar inte pipeline som fallback.

## Content Layer

Runtime-lagret som **läser innehåll från databasen**.

Typiska mappar:

- `lib/content/`
- `lib/server/words/`
- `lib/content/game-editions/` (DB-läsning och delade datumhjälpare)

Content Layer:

- hämtar ord, hints, lexikon, media, editions och profiler ur DB
- exponerar återanvändbara läsfunktioner

Content Layer ska **inte**:

- innehålla spellogik
- rendera UI
- avgöra vilket innehåll som är dagens publicerade omgång (det gör Game Provider)
- köra generatorer eller skapa publicerat innehåll
- läsa `data/raw`
- använda statiska ordlistor

## Game Provider

Ligger i `lib/games/<game>/content-provider.ts` eller `word-provider.ts`.

Bygger rätt spelunderlag för ett specifikt spel:

| Spel       | Provider              | Underlag                                       |
| ---------- | --------------------- | ---------------------------------------------- |
| Dagens Ord | `word-provider.ts`    | `GameEdition` → `GameEditionWord(SOLUTION)`    |
| Stegvis    | `content-provider.ts` | `GameEdition` → `GameEditionWord` (kedja)      |
| Ordfläta   | `content-provider.ts` | `GameEdition` → `metadata.puzzleId` → `Puzzle` |
| Ordstorm   | `word-provider.ts`    | `GameWord` (free play, ingen edition)          |

Game Provider:

## Speldata

- läser via Content Layer och DB
- tillämpar publiceringsregler (t.ex. Stockholm dayKey för dagens edition)
- väljer spelspecifikt urval (`canBeGuess`, roller, puzzle-koppling)
- innehåller varken UI eller ren spellogik

## Game Rules

Ligger i `lib/games/<game>/rules.ts`.

- ren spellogik på redan inläst data
- ingen DB-access
- inga imports från `data/`
- ingen publiceringslogik

## UI

- renderar spel och lokal spelstate
- väljer inte ord ur DB
- känner inte till `data/raw`
- får färdig katalog eller session från Game Provider

## `data/raw`

En tillfällig importyta för externa ordkällor (t.ex. Hunspell, Kelly).

`data/raw` är:

- en plats att lägga råfiler innan `import:words`
- **inte** ett datalager
- **inte** en del av runtime-arkitekturen
- **inte** en del av spelens dataflöde

Den långsiktiga arkitekturen börjar i databasen.

## Import

1. `Word` — canonical, spelbar vy
2. `WordSourceRecord` — provenance per källa/import
3. `WordEditorialOverride` — manuella redaktionella beslut
4. `ImportBatch` — importjobb med metadata för källa, fil och status
5. `ImportBatchRow` — radlogg för importerat, återanvänt, ignorerat och fel

Det finns just nu två aktiva importspår:

- adminimporten i `app/admin/import`, `lib/content/import-content.ts` och `lib/content/import-lexicon.ts`
- råimports-scriptet `scripts/import-words.ts` (`npm run import:words`)

Adminimporten:

- skapar `ImportBatch` med källmetadata (`sourceName`, `sourceVersion`, `sourceLicense`, `sourceUrl`, `sourceReference`, `sourceComment`)
- sätter `importedBy` automatiskt till `Admin` tills riktig adminidentitet finns
- loggar radutfall i `ImportBatchRow`
- kopplar importerade hints och lexikonposter tillbaka till sitt `ImportBatch`
- uppdaterar `WordSourceRecord` utan att skriva över redaktionella beslut

Råimports-scriptet:

- läser `data/raw/hunspell/*.dic` och `data/raw/kelly/*.csv`
- tillämpar `data/seed/word-filters/never-allow-sv.ts`
- tillämpar abbreviation-filter för Hunspell med undantag från `lib/dictionary/word-filters.ts`
- skriver till Postgres (`Word`, `WordSourceRecord`, `ImportBatch`)
- stödjer `--source=all|hunspell|kelly` och `--mode=insert-missing|merge-safe|refresh-source-metadata`

Det äldre råimports-scriptet använder alltså samma kärnmodeller, men det loggar ännu inte hela adminflödets detaljnivå i `ImportBatchRow` och sätter inte samma källmetadatafält som adminimporten gör.

## Viktiga noteringar

### `ImportBatch` är just nu det faktiska importjobbet

I adminflödet används `ImportBatch` nu funktionellt som ett långlivat importjobb, även om modellnamnet fortfarande heter `ImportBatch` internt.

Det är avsiktligt.

Vi behöll det interna namnet för att undvika en onödigt riskfylld total rename i Prisma, serverkod och adminvyer samtidigt som importflödet byggdes om. Om vi senare vill byta namn till exempelvis `ImportJob` bör det göras som en separat, medveten refaktor.

### `importedBy` är tills vidare systemvärdet `Admin`

Fältet `importedBy` sätts automatiskt vid import och ska inte anges manuellt i adminformuläret.

Just nu används värdet `Admin` i adminimporten, eftersom adminflödet ännu inte har riktig användaridentitet eller sessionskoppling. När admin senare får autentisering bör `importedBy` börja spegla faktisk användare utan att ändra importens övriga proveniensmodell.

### Redaktionella ändringar ska fortsätta vara separata

Importmetadata och källspårning lever i `ImportBatch`, `ImportBatchRow` och `WordSourceRecord`.

Redaktionella beslut lever i `Word`, `WordEditorialOverride` och övriga innehållstabeller.

Den separationen är viktig: en ny import får uppdatera provenance och rå källinformation, men ska inte skriva över Ordklubbens redaktionella bedömningar.

## Aktiva spel

| Spel       | Publicering                | Runtime                            |
| ---------- | -------------------------- | ---------------------------------- |
| Dagens Ord | `GameEdition` + `SOLUTION` | Dagens lösningsord + gissningspool |
| Stegvis    | `GameEdition` + kedja      | Dagens publicerade kedja           |
| Ordfläta   | `GameEdition` → `Puzzle`   | Dagens grid via `puzzleId`         |
| Ordstorm   | ingen edition              | `GameWord`, obegränsade rundor     |

Testspel (`Emojirebus`, `Kastet`, `Skrapet`, `Bildjakten`) ligger utanför denna arkitekturfas.

## Dev-seed

```bash
npm run seed:dagens-ord
npm run seed:stegvis
npm run seed:ordflata
npm run seed:ordstorm
```

Seed-script är Content Pipeline — inte runtime.

## Flöde i runtime

1. Game Provider hämtar edition, profiler eller puzzle-referens via Content Layer
2. Game Rules arbetar på det inlästa underlaget
3. UI renderar resultatet
