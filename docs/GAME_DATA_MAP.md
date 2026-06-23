# GAME_DATA_MAP

Senast uppdaterad: 2026-06-23

Det här dokumentet är en konkret audit av spelens datakällor i kodbasen just nu, med fokus på hur vi tar dem mot en gemensam Postgres-baserad innehållsmodell.

Målet på sikt:

- alla spel ska i möjligaste mån bygga på samma Postgres-källa
- `Word` ska vara grundobjektet för ord
- spelspecifika pussel ska modelleras ovanpå `Word` och dess metadata
- lokala TS-filer ska vara fallback eller migreringssteg, inte slutlig produktionskälla

## Översikt

| Spel       | Route              | Datakälla idag                                                 | Ska använda                | Status       |
| ---------- | ------------------ | -------------------------------------------------------------- | -------------------------- | ------------ |
| Dagens Ord | `/dagens-ord`      | importerade/lokala ordlistor + lokal daily state               | `Word`                     | ej kopplad   |
| Ordstorm   | `/ordstorm`        | importerade/genererade ordlistor + localStorage                | `Word`                     | ej kopplad   |
| Stegvis    | `/stegvis`         | generator + statiska pussel + `Word`/`Hint`                    | `Word` + `Hint`            | delvis       |
| Ordfläta   | `/ordflata`        | Prisma `Puzzle` + `PuzzleEntry` + `Hint` + `Word`              | `Word` + `Hint`            | beta         |
| Bildjakten | `/test/bildjakten` | Prisma `MediaAsset` + `Word`, fallback till lokal prototypdata | `Word` + `MediaAsset`      | kopplad test |
| Rebus      | `/emojirebus`      | Prisma `Word` + `RebusEntry`                                   | `Word` + `RebusEntry`      | test         |
| Kastet     | `/kastet`          | hårdkodade bokstavspar i kod                                   | `Word` senare              | test         |
| Skrapet    | `/skrapet`         | hårdkodade pussel i kod                                        | `Hint`/`MediaAsset` senare | test         |

## Delade byggstenar i Postgres idag

Följande Prisma-modeller finns redan och är relevanta för flera spel:

- `Word`
- `WordLanguageData`
- `WordRelation`
- `Hint`
- `HintCandidate`
- `RebusEntry`
- `MediaAsset`
- `Theme`
- `WordTheme`
- `Puzzle`
- `PuzzleEntry`
- `PuzzleBlockedCell`

Värt att notera:

- `PuzzleType` innehåller redan `DAILY_WORD` och `STEPWISE`
- i nuläget används `Puzzle` i praktiken bara konkret av Ordfläta-flödet
- Dagens Ord, Ordstorm, Kastet och Skrapet läser inte från Postgres i spelläget idag

## Dagens Ord

- Route: `/dagens-ord`
- Kodvägar:
  - `app/(games)/dagens-ord/page.tsx`
  - `lib/game/dagens-ord.ts`
  - `lib/game/dagens-ord-daily-session.ts`
  - `data/dagens-ord/solution-words.ts`
  - `data/words/index.ts`
  - `lib/storage/dagens-ord-daily.ts`

### Datakälla idag

- lösningsord kommer från lokal fil: `data/dagens-ord/solution-words.ts`
- giltiga gissningar kommer från `allowedSvWords` i `data/words/index.ts`
- dagens val görs via datumindex i kod, inte via publicerad DB-post
- daglig progress sparas i browser storage

### Önskad datakälla

- `Word` som källa för själva ordet
- en publicerad daglig pusselmodell i Postgres som pekar ut exakt vilket `Word` som gäller ett visst datum

### Modeller som behövs

- finns redan:
  - `Word`
  - eventuellt `WordLanguageData`
- saknas:
  - en spelbar daglig modell, till exempel `DailyWordPuzzle`
  - alternativt en utbyggnad av `Puzzle`/`PuzzleEntry` som faktiskt används för `PuzzleType.DAILY_WORD`

### Vad som saknas

- ingen DB-koppling i spelläget
- ingen publiceringsmodell för datum, status eller ersättningsord
- ingen relation mellan Dagens Ord och ett valt `Word`
- ingen redaktionell QA-kedja för dagliga lösningsord

### Rekommenderad nästa åtgärd

- koppla först lösningsordet till Postgres
- minsta rimliga steg:
  - inför `DailyWordPuzzle(id, wordId, publishDate, status)`
- behåll tillåtna gissningar från ordpipeline tills lösningsordskopplingen är stabil

## Ordstorm

- Route: `/ordstorm`
- Kodvägar:
  - `app/(games)/ordstorm/page.tsx`
  - `lib/game/ordstorm.ts`
  - `data/words/ordstorm-wordlists.ts`
  - `data/words/index.ts`
  - `lib/storage/ordstorm-stats.ts`

### Datakälla idag

- seed-ord kommer från `seedWordsSvGenerated` med fallback till `data/words/seed-words-sv.ts`
- giltiga ord kommer från `commonSvWords` + `allowedSvWords`
- hela rundan genereras i runtime direkt från ordlistorna
- statistik sparas i browser storage

### Önskad datakälla

- `Word` som gemensam ordbank
- en spelprofil ovanpå `Word` som anger vilka ord som får vara seed, hur bra de spelar och om de ska blockeras

### Modeller som behövs

- finns redan:
  - `Word`
  - `WordLanguageData`
  - `Theme` och `WordTheme` om teman senare ska styra rundor
- saknas:
  - `OrdstormWordProfile` eller liknande
  - eventuell `OrdstormRoundTemplate` om rundor ska kunna publiceras i förväg

### Vad som saknas

- ingen Postgres-källa i spelläget
- ingen DB-modell för seed-kurering
- ingen Ordstorm-specifik metadata för fairness, svårighet eller blocklist
- ingen spårbar version av vilka ord som var giltiga vid en viss tidpunkt

### Rekommenderad nästa åtgärd

- flytta seed-kureringen till Postgres först
- minsta rimliga steg:
  - `OrdstormWordProfile(wordId, isSeedCandidate, seedPriority, playableScore, blocked)`
- låt ordpipeline fortsätta leverera bulklexikon tills senare

## Stegvis

- Route: `/stegvis`
- Kodvägar:
  - `app/(games)/stegvis/page.tsx`
  - `lib/content/stegvis/load-play-session.ts`
  - `lib/content/stegvis/load-puzzle-bundle.ts`
  - `lib/content/stegvis/resolve-play-bundle.ts`
  - `lib/content/stegvis/generator/`
  - `data/stegvis/puzzles.ts`
  - `lib/content/word-bank/api.ts`

### Datakälla idag

- statiska fallbackpussel ligger i `data/stegvis/puzzles.ts`
- när DB finns hämtas ord och nycklar via word-bank:
  - `Word`
  - godkända `Hint`
- generatorn försöker bygga en spelbar kedja från ordbanken
- om generatorn misslyckas används statiska pussel
- dagligt val görs fortfarande via datumindex över en lokal lista

### Önskad datakälla

- `Word` + `Hint` som bas
- en riktig publicerad Stegvis-modell i Postgres för kedjor, stegordning och publicering
- generatorn ska producera kandidater, inte vara enda spelkälla

### Modeller som behövs

- finns redan:
  - `Word`
  - `Hint`
  - `Theme` och `WordTheme`
  - enum-stöd finns redan i `PuzzleType.STEPWISE`
- saknas:
  - `StepwisePuzzle`
  - `StepwiseStep`
  - eventuell `StepwiseCandidate` eller `StepwiseGenerationRun`

### Vad som saknas

- ingen Prisma-modell för själva Stegvis-pusslet
- ingen ordnad relation för kedjans mellanord
- ingen publiceringsmodell för dagliga eller utvalda kedjor
- lokal fallbacklista är fortfarande viktig del av produktionsflödet

### Rekommenderad nästa åtgärd

- detta är det viktigaste modellsteget efter ord-basen
- minsta rimliga steg:
  - `StepwisePuzzle(id, startWordId, targetWordId, minimumSteps, publishDate, status)`
  - `StepwiseStep(puzzleId, wordId, position, clueSnapshot)`
- migrera sedan innehållet från `data/stegvis/puzzles.ts`

## Ordfläta

- Route: `/ordflata`
- Kodvägar:
  - `app/(games)/ordflata/page.tsx`
  - `lib/content/ordflata-alpha.ts`
  - `lib/content/puzzle-actions.ts`
  - `lib/content/puzzle/generate-puzzle.ts`

### Datakälla idag

- fullt DB-läst i spelläget när `DATABASE_URL` finns
- spelet hämtar senaste spelbara `Puzzle` med:
  - `type = WORD_GRID`
  - publicerat först, annars senaste utkast/review
- pusslet byggs av:
  - `Puzzle`
  - `PuzzleEntry`
  - `PuzzleBlockedCell`
  - `Word`
  - `Hint`

### Önskad datakälla

- fortsatt Postgres-driven
- fortsatt byggd på `Word` + `Hint`
- tydligare semantik kring att `WORD_GRID` faktiskt är Ordfläta i den här produkten

### Modeller som behövs

- används redan:
  - `Puzzle`
  - `PuzzleEntry`
  - `PuzzleBlockedCell`
  - `Word`
  - `Hint`
- saknas eller är svagt modellerat:
  - relation mellan pussel och `Theme`
  - eventuellt spelspecifik wrapper kring `Puzzle`

### Vad som saknas

- ingen tydlig tema-koppling på pusselnivå
- `Puzzle` är generell men produkten saknar ännu tydlig spelsemantik ovanpå modellen
- ingen separat modell för när andra gridspel behöver annan logik än Ordfläta

### Rekommenderad nästa åtgärd

- behåll nuvarande modell, eftersom det här redan är närmast målbilden
- nästa steg:
  - koppla tema till pussel
  - definiera `WORD_GRID` tydligt som Ordfläta i produktflödet

## Bildjakten

- Route: `/test/bildjakten`
- Kodvägar:
  - `app/(games)/test/bildjakten/page.tsx`
  - `lib/game/bildjakten/provider.ts`
  - `lib/game/bildjakten/puzzles.ts`
  - `lib/game/bildjakten/types.ts`

### Datakälla idag

- försöker först ladda från Prisma:
  - `MediaAsset` där `mediaType = IMAGE` och `status = APPROVED`
  - kopplad `Word` måste också vara `APPROVED`
- om inget spelbart hittas används lokal fallback:
  - `BILDJAKT_PROTOTYPE_PUZZLES`
- asset-URL löses från `filePath`, annars `sourceReference`, annars `notes`

### Önskad datakälla

- `Word` + `MediaAsset`
- en riktig spelmodell som väljer vilka assets som hör till Bildjakten

### Modeller som behövs

- finns redan:
  - `Word`
  - `MediaAsset`
- saknas:
  - `ImagePuzzle` eller `BildjaktenPuzzle`
  - publiceringsfält på spelnivå, inte bara assetnivå

### Vad som saknas

- ingen spelmodell för urval, ordning eller publicering
- varje godkänd bild kan i praktiken bli spelbar, även om den inte är kuraterad för Bildjakten
- fallback till lokal prototypdata visar att DB-kopplingen ännu inte är komplett
- assetupplösning via fria textfält visar att modellen ännu är lös

### Rekommenderad nästa åtgärd

- inför en explicit spelmodell ovanpå assets:
  - `ImagePuzzle(id, wordId, mediaAssetId, publishDate, status, difficulty)`
- behåll `MediaAsset` som bibliotek, inte som spelbar enhet i sig

## Rebus

- Route: `/emojirebus`
- Kodvägar:
  - `app/(games)/emojirebus/page.tsx`
  - `lib/content/emojirebus.ts`

### Datakälla idag

- läser från Prisma
- väljer första `Word` som har minst en godkänd `RebusEntry`
- väljer senaste godkända `RebusEntry` för det ordet
- ingen publiceringsordning, ingen rotation, ingen spelspecifik urvalsmodell

### Önskad datakälla

- `Word` + `RebusEntry`
- en riktig publicerad rebusmodell där rå rebusar och spelbara rebusar är olika nivåer

### Modeller som behövs

- finns redan:
  - `Word`
  - `RebusEntry`
- saknas:
  - `RebusPuzzle`
  - eventuell `RebusPart` om formatet blir mer strukturerat

### Vad som saknas

- ingen modell för vilket rebus som ska spelas när
- ingen tydlig skillnad mellan rå innehållspost och publicerat spel
- ingen metadata för svårighet, variant eller spelkontext

### Rekommenderad nästa åtgärd

- inför en tunn publiceringsmodell:
  - `RebusPuzzle(id, wordId, rebusEntryId, publishDate, status, difficulty)`
- låt `RebusEntry` fortsätta vara råmaterial i admin

## Kastet

- Route: `/kastet`
- Kodvägar:
  - `app/(games)/kastet/page.tsx`
  - `components/games/kastet/kastet-game.tsx`
  - `lib/game/kastet/pairs.ts`
  - `lib/game/kastet/config.ts`

### Datakälla idag

- helt hårdkodad prototyp
- bokstavspar kommer från `KASTET_LETTER_PAIRS`
- ingen Postgres
- ingen koppling till `Word`

### Önskad datakälla

- på sikt `Word`, men först när spelets kärnloop är värd att modellera
- när spelet mognar behövs åtminstone en kuraterad källa för bokstavspar eller tärningssidor

### Modeller som behövs

- finns idag: inga
- kan behövas senare:
  - `KastetPair`
  - eventuell `KastetRoundTemplate`
  - senare eventuellt koppling till `Word`

### Vad som saknas

- ingen datamodell alls
- ingen mätning eller kurering av vilka bokstavspar som ger bra spel
- ingen länk till gemensam ordbank

### Rekommenderad nästa åtgärd

- vänta med större modellering tills spelet är tydligare prioriterat
- om ni vill ta ett minimisteg:
  - `KastetPair(value, status, notes)`

## Skrapet

- Route: `/skrapet`
- Kodvägar:
  - `app/(games)/skrapet/page.tsx`
  - `lib/game/skrapet/puzzles.ts`

### Datakälla idag

- helt hårdkodad prototyplista
- varje pussel är ett lokalt objekt med:
  - `word`
  - `clues[]`
- slumpval i runtime

### Önskad datakälla

- i första hand `Word` + `Hint`
- senare eventuellt `MediaAsset` för bild- eller emoji-ledtrådar
- en riktig pusselmodell som håller ordning på clue-sekvensen

### Modeller som behövs

- finns redan som bas:
  - `Word`
  - `Hint`
  - eventuellt `MediaAsset`
- saknas:
  - `SkrapetPuzzle`
  - `SkrapetPuzzleClue`

### Vad som saknas

- ingen DB-modell
- inga typade ledtrådar
- ingen relation till underliggande `Word`
- ingen publicering eller kurering

### Rekommenderad nästa åtgärd

- vänta med större investering tills spelet är tydligare prioriterat
- om ni går vidare:
  - `SkrapetPuzzle(id, wordId, status, difficulty)`
  - `SkrapetPuzzleClue(puzzleId, position, clueText, clueType)`

## Övrig route: Daily

- Route: `/daily`
- Kodväg:
  - `app/(games)/daily/page.tsx`

Det här är inte ett eget spel ännu, utan en placeholder för en möjlig daglig hub. Den har ingen egen speldata idag och bör inte styra modelleringen nu.

## Tvärgående slutsatser

### Vad som redan är nära målbilden

- Ordfläta är tydligast DB-driven i faktiskt spelläge
- Bildjakten och Rebus återanvänder redan Postgres-innehåll, men saknar publicerad spelmodell
- Stegvis återanvänder redan `Word` och `Hint`, men saknar sin egen pusselmodell

### Var gapet är störst

- Dagens Ord och Ordstorm använder fortfarande inga Postgres-modeller i spelläget
- Stegvis har avancerad logik men ingen riktig spelmodell i Prisma
- Kastet och Skrapet är rena kodprototyper

### Rekommenderad prioriteringsordning

1. Modellera `StepwisePuzzle` och flytta bort från `data/stegvis/puzzles.ts`
2. Modellera `DailyWordPuzzle` för Dagens Ord
3. Inför `RebusPuzzle` och `ImagePuzzle`
4. Lägg till tydligare semantik och tema-koppling runt Ordfläta
5. Låt Ordstorm få en enkel `OrdstormWordProfile` för seed-kurering
6. Vänta med Kastet och Skrapet tills de är tydligare prioriterade
