# GAME_DATA_MAP

Senast uppdaterad: 2026-06-25

Karta över de fyra aktiva spelens dataflöden i den gemensamma arkitekturen.

## Arkitektur

```text
Content Pipeline     import, seed, admin, generatorer → skriver till DB
        ↓
Database             Word, Game, GameWord, GameEdition, Puzzle, …
        ↓
Content Layer        lib/content/, lib/server/words/ — läser DB
        ↓
Game Provider        lib/games/<game>/ — bygger spelunderlag
        ↓
Game Rules           lib/games/<game>/rules.ts
        ↓
UI                   app/(games)/, components/games/
```

### Begrepp

| Begrepp           | Betydelse                                             |
| ----------------- | ----------------------------------------------------- |
| `Word`            | Lexikal sanning                                       |
| `Game`            | Spel                                                  |
| `GameWord`        | Hur ett specifikt spel använder ett ord               |
| `GameEdition`     | Publicerat innehåll för spel med publicerade omgångar |
| `GameEditionWord` | Ordens roller i en edition                            |
| `Puzzle`          | Innehålls-/gridmodell — inte publiceringsmodell       |

### Content Layer

Runtime-läsning från DB. Ingen spellogik, ingen UI, ingen publiceringslogik, ingen generatorlogik, ingen `data/raw`.

- `lib/server/words/` — ord och hints
- `lib/content/word-bank/` — queries, mappers
- `lib/content/game-editions/` — delade datumhjälpare för edition-läsning

### Content Pipeline

Producerar innehåll före runtime. Skriver till DB.

- `npm run import:words`
- `npm run seed:dagens-ord` · `seed:stegvis` · `seed:ordflata` · `seed:ordstorm`
- `lib/content/stegvis/generator/`, pusselgeneratorer
- `app/admin/`

### Principer

- runtime läser bara från databasen
- runtime skapar inte publicerat innehåll
- generatorer är pipeline — inte runtime
- dagliga editions matchas på Stockholm dayKey i Game Provider
- Ordstorm är free play — ingen `GameEdition` i normal runtime
- `Puzzle.status` styr inte Ordfläta-runtime — publicering via `GameEdition`
- testspel ligger utanför denna fas

## Aktiva spel

| Spel       | Route         | Game Provider         | Publicering                |
| ---------- | ------------- | --------------------- | -------------------------- |
| Dagens Ord | `/dagens-ord` | `word-provider.ts`    | `GameEdition` → `SOLUTION` |
| Stegvis    | `/stegvis`    | `content-provider.ts` | `GameEdition` → kedja      |
| Ordfläta   | `/ordflata`   | `content-provider.ts` | `GameEdition` → `Puzzle`   |
| Ordstorm   | `/ordstorm`   | `word-provider.ts`    | `GameWord` (free play)     |

## Dagens Ord

- Provider: `lib/games/dagens-ord/word-provider.ts`
- Rules: `lib/games/dagens-ord/rules.ts`

### Dataflöde

1. `Game(slug="dagens-ord")`
2. Dagens `PUBLISHED` `DAILY` `GameEdition` (Stockholm dayKey)
3. `GameEditionWord(role=SOLUTION)` → `Word`
4. Gissningspool från godkända 5-bokstavsord
5. Daglig progress i browser storage

### Pipeline

`npm run seed:dagens-ord`

### Öppet

- `GameWord` för `canBeGuess` / `canBeSolution`
- admin för editions

## Stegvis

- Provider: `lib/games/stegvis/content-provider.ts`
- Rules: `lib/games/stegvis/rules.ts`

### Dataflöde

1. Dagens `PUBLISHED` `DAILY` `GameEdition`
2. `GameEditionWord`: `START`, `STEP` (×5), `TARGET`
3. Ledtrådar från `Hint`
4. `fallbackBundles` = tidigare edition-dagar (inte generator)

### Pipeline

`npm run seed:stegvis` (använder generator i pipeline)

### Öppet

- admin för edition/publicering

## Ordfläta

- Provider: `lib/games/ordflata/content-provider.ts`
- Map: `lib/games/ordflata/map-puzzle.ts`
- Rules: `lib/games/ordflata/rules.ts`

### Dataflöde

1. Dagens `PUBLISHED` `DAILY` `GameEdition` (`slug="ordflata"`)
2. `metadata.puzzleId` → `Puzzle` (`WORD_GRID`)
3. `PuzzleEntry`, `PuzzleBlockedCell`, `Hint` → spelarvy

`Puzzle` är innehållsmodell. Publicering styrs av `GameEdition`.

### Pipeline

`npm run seed:ordflata`

### Öppet

- tema-koppling på pusselnivå
- admin för edition → puzzle

## Ordstorm

- Provider: `lib/games/ordstorm/word-provider.ts`
- Rules: `lib/games/ordstorm/rules.ts`

### Dataflöde

1. `GameWord` för `slug="ordstorm"`
2. `OrdstormWordCatalog` (`allowedWords`, `commonWords`, `seedWords`)
3. `createRound()` — slump seed per runda, obegränsat antal rundor
4. Statistik i browser storage

Free play. Ingen `GameEdition` i normal runtime.

### Pipeline

`npm run seed:ordstorm`

### Öppet

- admin för `GameWord`-kurering
- ev. `GameEdition` för framtida specialrundor (ej free play)

## Testspel (utanför denna fas)

| Spel       | Route              |
| ---------- | ------------------ |
| Bildjakten | `/test/bildjakten` |
| Emojirebus | `/emojirebus`      |
| Kastet     | `/kastet`          |
| Skrapet    | `/skrapet`         |

## Prioritering framåt

1. Admin/publicering för `GameEdition`
2. `GameWord`-kurering för Ordstorm
3. `GameWord` för Dagens Ord gissningspool
4. Testspel när prioriterade
