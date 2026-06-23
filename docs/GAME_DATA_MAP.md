# GAME_DATA_MAP

Senast uppdaterad: 2026-06-23

Det här dokumentet är en konkret audit av spelens datakällor i kodbasen just nu, med fokus på hur vi tar dem mot en gemensam Postgres-baserad innehållsmodell.

Status efter steg 1-4 i migreringen:

- inga spelrutter läser längre direkt från `data/`
- aktiva spelrutter läser nu via `lib/games/<game>/word-provider.ts` eller `content-provider.ts`
- kvarvarande gap ligger främst i publiceringslager och spelspecifika Prisma-modeller, inte i filbaserad runtime

Målet på sikt:

- alla spel ska i möjligaste mån bygga på samma Postgres-källa
- `Word` ska vara grundobjektet för ord
- spelspecifika pussel ska modelleras ovanpå `Word` och dess metadata
- lokala TS-filer ska vara fallback eller migreringssteg, inte slutlig produktionskälla

## Översikt

| Spel       | Route              | Datakälla idag                                              | Ska använda                              | Status                                    |
| ---------- | ------------------ | ----------------------------------------------------------- | ---------------------------------------- | ----------------------------------------- |
| Dagens Ord | `/dagens-ord`      | Prisma `Word` via `lib/games/dagens-ord/word-provider.ts`   | `Word` + publicerad dagsmodell           | runtime kopplad, saknar publiceringslager |
| Ordstorm   | `/ordstorm`        | Prisma `Word` via `lib/games/ordstorm/word-provider.ts`     | `Word` + Ordstorm-specifik profil        | runtime kopplad, saknar spelprofil        |
| Stegvis    | `/stegvis`         | generator + Prisma `Word`/`Hint` via content-provider       | `Word` + `Hint` + publicerad kedjemodell | runtime kopplad, saknar publiceringslager |
| Ordfläta   | `/ordflata`        | Prisma `Puzzle` + `PuzzleEntry` + `Hint` + `Word`           | `Puzzle` + `Word` + `Hint`               | beta, redan DB-driven                     |
| Bildjakten | `/test/bildjakten` | Prisma `MediaAsset` + `Word` via content-provider           | `Word` + `MediaAsset` + spelmodell       | runtime kopplad, saknar publiceringslager |
| Rebus      | `/emojirebus`      | Prisma `Word` + `RebusEntry`                                | `Word` + `RebusEntry` + spelmodell       | kopplad, saknar publiceringslager         |
| Kastet     | `/kastet`          | Prisma `Word` via derivat av bokstavspar i content-provider | `Word` + kuraterad parmodell             | runtime kopplad, saknar egen modell       |
| Skrapet    | `/skrapet`         | Prisma `Word` + `Hint` via content-provider                 | `Word` + `Hint` + pusselmodell           | runtime kopplad, saknar egen modell       |

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
- Dagens Ord, Ordstorm, Stegvis, Kastet och Skrapet är nu kopplade till Postgres i spelläget via nya providers
- det som fortfarande saknas är främst publicering, kurering och spelspecifik metadata i Prisma

## Dagens Ord

- Route: `/dagens-ord`
- Kodvägar:
  - `app/(games)/dagens-ord/page.tsx`
  - `lib/games/dagens-ord/rules.ts`
  - `lib/games/dagens-ord/word-provider.ts`
  - `lib/game/dagens-ord.ts`
  - `lib/storage/dagens-ord-daily.ts`

### Datakälla idag

- lösningsord och giltiga gissningar laddas från Prisma `Word`
- urvalet görs i `lib/games/dagens-ord/word-provider.ts`
- dagens val görs fortfarande via datumindex i kod, inte via publicerad DB-post
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

- spelläget är nu kopplat till DB
- ingen publiceringsmodell för datum, status eller ersättningsord
- ingen relation mellan Dagens Ord och ett valt `Word`
- ingen redaktionell QA-kedja för dagliga lösningsord

### Rekommenderad nästa åtgärd

- nästa steg är ett publiceringslager:
  - `DailyWordPuzzle(id, wordId, publishDate, status)`
- därefter kan kuratering, ersättningsord och QA-flöde läggas ovanpå

## Ordstorm

- Route: `/ordstorm`
- Kodvägar:
  - `app/(games)/ordstorm/page.tsx`
  - `lib/games/ordstorm/rules.ts`
  - `lib/games/ordstorm/word-provider.ts`
  - `lib/game/ordstorm.ts`
  - `lib/storage/ordstorm-stats.ts`

### Datakälla idag

- seed-ord, allowed words och common-urval härleds nu från Prisma `Word`
- hela rundan genereras fortfarande i runtime, men från DB-baserad katalog
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

- spelläget är nu kopplat till DB
- ingen DB-modell för seed-kurering
- ingen Ordstorm-specifik metadata för fairness, svårighet eller blocklist
- ingen spårbar version av vilka ord som var giltiga vid en viss tidpunkt

### Rekommenderad nästa åtgärd

- nästa steg är att modellera kureringen:
  - `OrdstormWordProfile(wordId, isSeedCandidate, seedPriority, playableScore, blocked)`
- publiceringslager behövs bara om ni senare vill förpublicera rundor eller dagsinnehåll

## Stegvis

- Route: `/stegvis`
- Kodvägar:
  - `app/(games)/stegvis/page.tsx`
  - `lib/games/stegvis/rules.ts`
  - `lib/games/stegvis/content-provider.ts`
  - `lib/content/stegvis/load-puzzle-bundle.ts`
  - `lib/content/stegvis/resolve-play-bundle.ts`
  - `lib/content/stegvis/generator/`
  - `lib/server/words/`

### Datakälla idag

- aktiv route laddar nu från DB-only provider
- ord och nycklar hämtas via `Word` och godkända `Hint`
- generatorn bygger en spelbar kedja från ordbanken i databasen

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
- generatorn är fortfarande produktionskälla i stället för ett publicerat lager

### Rekommenderad nästa åtgärd

- detta är fortfarande ett av de viktigaste modellstegen
- minsta rimliga steg:
  - `StepwisePuzzle(id, startWordId, targetWordId, minimumSteps, publishDate, status)`
  - `StepwiseStep(puzzleId, wordId, position, clueSnapshot)`
- låt generatorn producera kandidater till denna modell i stället för att vara slutkälla

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
  - `lib/games/bildjakten/content-provider.ts`
  - `lib/games/bildjakten/rules.ts`

### Datakälla idag

- laddar från Prisma:
  - `MediaAsset` där `mediaType = IMAGE` och `status = APPROVED`
  - kopplad `Word` måste också vara `APPROVED`
- ingen lokal fallback används längre i route-flödet
- asset-URL löses fortfarande från `filePath`, annars `sourceReference`, annars `notes`

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
  - `lib/games/kastet/rules.ts`
  - `lib/games/kastet/content-provider.ts`

### Datakälla idag

- bokstavspar härleds nu från aktiva `Word` i DB
- urvalet görs i `lib/games/kastet/content-provider.ts`
- spelet saknar fortfarande en egen kuraterad innehållsmodell

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

- ingen egen datamodell alls
- ingen mätning eller kurering av vilka bokstavspar som ger bra spel
- derivatet från ordbanken är ännu inte redaktionellt kontrollerat

### Rekommenderad nästa åtgärd

- minsta rimliga nästa steg:
  - `KastetPair(value, status, notes)`
- därefter kan pair-poolen sluta härledas direkt från hela ordbanken

## Skrapet

- Route: `/skrapet`
- Kodvägar:
  - `app/(games)/skrapet/page.tsx`
  - `lib/games/skrapet/rules.ts`
  - `lib/games/skrapet/content-provider.ts`

### Datakälla idag

- pussel byggs nu från Prisma `Word` med godkända `Hint`
- route-flödet använder DB-only provider
- slumpval sker fortfarande i runtime från en laddad pussellista

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

- ingen spelspecifik DB-modell
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

- Ordfläta är fortsatt tydligast DB-driven i faktiskt spelläge
- Dagens Ord och Ordstorm läser nu från DB via spelproviders
- Stegvis, Bildjakten, Kastet och Skrapet har nu DB-baserade route-flöden

### Var gapet är störst

- flera spel saknar fortfarande publiceringslager ovanpå rå innehållsdata
- Stegvis har avancerad logik men ingen riktig spelmodell i Prisma
- Ordstorm saknar spelspecifik kurering för seed/fairness

### Rekommenderad prioriteringsordning

1. Modellera `StepwisePuzzle` och låt generatorn mata den modellen
2. Modellera `DailyWordPuzzle` för Dagens Ord
3. Inför `RebusPuzzle` och `ImagePuzzle`
4. Lägg till `OrdstormWordProfile` för seed-kurering och blocklist
5. Lägg till tydligare semantik och tema-koppling runt Ordfläta
6. Modellera `KastetPair` och `SkrapetPuzzle` när spelen prioriteras redaktionellt
