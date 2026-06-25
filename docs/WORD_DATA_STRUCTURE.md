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
