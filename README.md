# Ordklubben

Ordklubben är en svensk ordspelsplattform byggd som en fokuserad, mobil-först webbapp med fyra aktiva DB-drivna spel och ett växande content/admin-flöde för ord, teman, pussel och ledtrådar.

Målet med projektet:

- kännas snabbt, intelligent och polerat
- vara mobil-först
- vara enkelt att expandera med fler spel utan att göra kärnan tung eller rörig

Nuvarande fokus:

- stark svensk språkkvalitet i orddata, ledtrådar och pussel
- snabb, tydlig mobilupplevelse
- återanvändbara spelmönster för fler små spel utan att låsa arkitekturen för tidigt

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui-grundstruktur
- Framer Motion

## Nuvarande spel

Produktionsnära eller spelbara just nu:

- `Dagens Ord`: dagligt fem-bokstavsspel med sex försök
- `Ordstorm`: snabbt anagramspel med sex bokstäver — free play, obegränsat antal rundor
- `Stegvis`: dagligt ordkedjespel där ett ord förvandlas till ett annat
- `Ordfläta`: dagligt betatest med nycklar och flätad ordstruktur

Tidiga testspel (utanför den aktiva arkitekturfasen):

- `Emojirebus`
- `Kastet`
- `Skrapet`
- `Bildjakten`

## Projektstruktur

```text
app/
  (games)/
    dagens-ord/
    emojirebus/
    kastet/
    ordflata/
    ordstorm/
    skrapet/
    stegvis/
    test/bildjakten/
  admin/
  profile/
  stats/
components/
  admin/
  games/
  layout/
  ui/
data/
  raw/
    hunspell/
    kelly/
hooks/
  use-ordstorm-stats.ts
  use-stegvis-stats.ts
lib/
  content/
  db/
  dictionary/
  game/
  games/
  server/
  storage/
prisma/
scripts/
```

Arkitektur i korthet:

```text
Content Pipeline  →  Database  →  Content Layer  →  Game Provider  →  Game Rules  →  UI
```

- `app/` — routes och sidkomposition
- `components/games/` — spellayouter, HUD, spelspecifikt UI
- `lib/games/` — Game Providers och Game Rules per spel
- `lib/game/` — delade spelhjälpare mellan spel
- `lib/dictionary/` — svensk normalisering och språkregler
- `lib/content/` och `lib/server/words/` — **Content Layer** (läser DB)
- `lib/storage/` — browser storage
- `data/raw/` — tillfällig importyta för externa ordkällor (inte runtime)

## Ordstorm

Nuvarande gameplay:

- 6 bokstäver per runda
- 60 sekunder
- spelaren bygger svenska ord med 3 till 6 bokstäver
- ord måste kunna byggas av rundans sex bokstäver
- varje bokstav får bara användas så många gånger som den finns i brickorna
- Å, Ä och Ö stöds
- ord valideras case-insensitive efter trimning av whitespace
- redan hittade ord blockeras
- bindestreck, siffror och specialtecken tillåts inte
- poäng: `3 = 100`, `4 = 200`, `5 = 400`, `6 = 700 + 300 bonus`
- hittade ord visas live
- rundstatistik sparas i `localStorage`

## Låst arkitektur

Databasen är enda sanningskällan. Arkitekturen börjar i databasen — inte i filer.

```text
Content Pipeline     import, seed, admin, generatorer
        ↓
Database
        ↓
Content Layer        lib/content/, lib/server/words/
        ↓
Game Provider        lib/games/<game>/
        ↓
Game Rules           lib/games/<game>/rules.ts
        ↓
UI
```

| Lager             | Ansvar                                                                       |
| ----------------- | ---------------------------------------------------------------------------- |
| **Database**      | `Word`, `Game`, `GameWord`, `GameEdition`, `GameEditionWord`, `Puzzle`, …    |
| **Content Layer** | Läser DB. Ingen spellogik, UI, publiceringslogik, generator eller `data/raw` |
| **Game Provider** | Bygger spelunderlag per spel. Tillämpar publiceringsregler                   |
| **Game Rules**    | Ren spellogik utan DB                                                        |
| **UI**            | Rendering och lokal spelstate                                                |

### Begrepp

- `Word` — lexikal sanning
- `Game` — spel
- `GameWord` — hur ett specifikt spel använder ett ord
- `GameEdition` — publicerat innehåll för spel med publicerade omgångar
- `GameEditionWord` — ordens roller i en edition
- `Puzzle` — innehålls-/gridmodell (Ordfläta), inte publiceringsmodell

### Aktiva spel

| Spel       | Provider              | Publicering                |
| ---------- | --------------------- | -------------------------- |
| Dagens Ord | `word-provider.ts`    | `GameEdition` + `SOLUTION` |
| Stegvis    | `content-provider.ts` | `GameEdition` + kedja      |
| Ordfläta   | `content-provider.ts` | `GameEdition` → `Puzzle`   |
| Ordstorm   | `word-provider.ts`    | `GameWord` (free play)     |

All normalisering och validering i spel går via `lib/dictionary/` och rena spelregler:

- `normalize-swedish.ts`: trim, casing och stöd för svenska tecken
- `can-build-word.ts`: kontrollerar att ett ord faktiskt kan byggas av sexbokstavsrundan
- `validate-word.ts`: samlar Ordstorms ordregler i en ren, testbar funktion
- `letter-pool.ts`: bokstavsräkning och bokstavsblandning

## Content Pipeline

Allt som producerar innehåll före runtime och skriver till databasen.

- `npm run import:words` — ordimport
- `npm run seed:dagens-ord` · `seed:stegvis` · `seed:ordflata` · `seed:ordstorm`
- generatorer i `lib/content/`
- admin i `app/admin/`

Pipeline läser ev. `data/raw` som importkälla. Runtime läser bara från databasen.

### `data/raw`

En tillfällig importyta för externa ordkällor — inte ett datalager, inte runtime, inte del av spelens dataflöde.

Råfiler kan läggas i `data/raw/hunspell/` och `data/raw/kelly/` innan import.

Stödda filformat i nuvarande importspår:

- Hunspell `.dic`
- Kelly `.csv` (semikolonseparerad export)

Script:

```bash
npm run import:words
```

Valfria flaggor:

```bash
npm run import:words -- --source=kelly --mode=merge-safe
```

Scriptet:

- läser lokala råfiler från `data/raw/`
- normaliserar svenska ord till lowercase
- stödjer `å`, `ä`, `ö`
- filtrerar bort ogiltiga format och proper nouns
- kan tillfälligt tillämpa manuella importfilter innan motsvarande editorial override finns i DB
- tillämpar abbreviation-filter för Hunspell via `lib/dictionary/word-filters.ts`
- importerar ord och källmetadata till Postgres
- skapar `ImportBatch` och `WordSourceRecord` per källa

Importkällor (Hunspell, Kelly) beskriver provenance — inte aktivt spelinnehåll.

## Källor Och Licens

- Rådata laddas inte ner automatiskt av projektet
- Du ansvarar själv för att lägga rätt filer i `data/raw/`
- Kontrollera licensvillkor för Hunspell/SFOL, Kelly-listan och eventuella Språkbanken-exporter innan du distribuerar rådata eller importerad härledd data
- README och scriptet dokumenterar källorna — de är inte runtime-källa för spelen

## Lokalt utvecklingsflöde

```bash
npm install
npm run dev
```

Öppna sedan [http://localhost:3000](http://localhost:3000).

Vanliga verifieringar:

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run build
```

Git hooks:

- `npm install` kör `prepare` och aktiverar repo:ts Husky-hooks lokalt
- `pre-commit` kör `lint-staged`
- staged kod- och textfiler formatteras med Prettier
- staged `js`/`ts`-filer lintas sedan med autofix och commiten stoppas vid kvarvarande warnings eller fel

När du arbetar med orddata:

```bash
npm run import:words
```

När du arbetar med speldata i dev:

```bash
npm run seed:dagens-ord
npm run seed:stegvis
npm run seed:ordflata
npm run seed:ordstorm
```

## Contentdatabas

Första versionen av contentdatabasen använder Prisma + Postgres och innehåller:

- `Word` för ord
- framtida `Language`-lager för språkregler och språkkontext
- framtida `Lexicon`-lager för lexikal information som inte är spelstyrning
- `WordSourceRecord` för provenance per råkälla/import
- `WordEditorialOverride` för manuella redaktionella avvikelser
- `Hint` för teknisk hintmodell, som i UI visas som `Nyckel`
- `HintCandidate` för föreslagna nycklar som granskas innan de blir riktiga nycklar
- `Theme` och `WordTheme` för teman
- `ImportBatch` för enkel importspårning

På sikt utökas databasen med tydligare `Language`/`Lexicon`-lager. Publicering sker via `Game`, `GameEdition` och `GameWord`.

Miljövariabel:

```bash
cp .env.example .env
```

### Postgres med Docker (samma setup som lokalt)

```bash
docker compose up -d
npm run prisma:deploy
```

Det startar Postgres med:

- användare: `postgres`
- lösenord: `postgres`
- databas: `ordklubben`
- port: `5432`

`.env.example` innehåller motsvarande `DATABASE_URL`.

Sätt annars `DATABASE_URL` till din egen Postgres-databas.

Generera Prisma Client:

```bash
npm run prisma:generate
```

Kör migrationer lokalt:

```bash
npm run prisma:migrate -- --name init_content_db
```

Applicera migrationer i miljöer där migrationerna redan finns:

```bash
npm run prisma:deploy
```

Importera ord från CSV med kolumnen `answer`:

```bash
npm run import:words -- ./path/to/words.csv
```

Valfri källa kan skickas som andra argument:

```bash
npm run import:words -- ./path/to/words.csv kelly
```

Adminvyer som finns i nuläget:

- `/admin/words`
- `/admin/words/new`
- `/admin/words/[id]`
- `/admin/review`
- `/admin/proposals`
- `/admin/puzzles`
- `/admin/puzzles/new`
- `/admin/puzzles/[id]`
- `/admin/themes`
- `/admin/themes/[slug]`
- `/admin/import`

### Nyckelkandidater

`HintCandidate` är ett mellanlager mellan förslag och riktiga `Hint`-rader.

Flöde:

1. Skapa kandidater manuellt på ordsidan, eller kör `Generera testkandidater`.
2. Granska kandidater med status `PENDING`, `APPROVED` eller `REJECTED`.
3. Godkänn en kandidat för att skapa en riktig nyckel kopplad till ordet.
4. Avvisa eller ta bort kandidater som inte ska bli nycklar.

AI är ännu inte kopplat. Mock-generatorn i `lib/content/ai/mock-generate-hint-candidates.ts` finns bara för att testa UI och granskningsflödet utan extern tjänst.

Provider-agnostisk struktur ligger i `lib/content/ai/`:

- `types.ts` delade typer för framtida AI-svar
- `generate-hint-candidates.ts` riktig AI-ingång, kastar `AI provider not configured` tills en leverantör kopplas in
- `mock-generate-hint-candidates.ts` lokala testförslag med `source = mock_generator`

Framtida AI-koppling kräver en konfigurerad provider och API-nyckel i miljön, till exempel OpenAI eller annan leverantör. Ingen API-nyckelhantering ingår i detta steg.

CSV-exempel för ord:

```csv
answer
SNÖ
IS
SOL
```

CSV-exempel för ordimport med metadata:

```csv
answer,difficulty,crosswordScore,notes
SNÖ,1,12,Vanligt vinterord
IS,1,10,
SOL,1,8,
```

CSV-exempel för nycklar eller ord + nycklar:

```csv
answer,hint,type,difficulty,source
SNÖ,Vitt vinterväder,DEFINITION,1,manual_csv
SNÖ,Kan skottas,ASSOCIATION,1,manual_csv
IS,Fruset vatten,DEFINITION,1,manual_csv
```

Rekommenderat testflöde:

1. Skapa en CSV med 5 ord och 8 nycklar.
2. Kör importen via `/admin/import`.
3. Öppna den skapade importbatchen och kontrollera sammanfattning + felrader.
4. Öppna ett importerat ord och kontrollera att nycklarna ligger rätt.
5. Kör samma CSV igen och kontrollera att dubletter på ord och nycklar hoppas över.

## Arkitekturprinciper

- Content Layer läser DB — utan spelspecifikt urval, spellogik eller UI
- Game Provider bygger rätt underlag per spel
- Game Rules håller ren spelogik utan DB-access
- Content Pipeline (import, seed, admin, generatorer) skriver till DB — anropas inte av runtime
- `data/raw` är importyta, inte arkitektur

## Nästa steg

- admin/publicerings-UI för `GameEdition` och `GameWord`
- `GameWord` för Dagens Ord gissningspool
- flytta kvarvarande manuella importregler till databasen
- skapa gemensam statistikmodell för fler spel
- lägga till lättare ljud eller haptik för ännu skarpare mobil feedback
