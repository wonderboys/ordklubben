# GAME_DATA_MAP

Senast uppdaterad: 2026-06-23

Det här dokumentet mappar varje spel i repo:t till:

- route
- datakälla idag
- önskad datakälla
- modeller som behövs
- vad som saknas
- rekommenderad nästa åtgärd

Målet är att göra det tydligt vilka spel som redan har en riktig innehållsmodell, vilka som fortfarande drivs av lokala prototypdata och var nästa steg bör tas.

## Översikt

| Spel       | Route              | Datakälla idag                                                 | Mognad idag               |
| ---------- | ------------------ | -------------------------------------------------------------- | ------------------------- |
| Dagens Ord | `/dagens-ord`      | lokala ordfiler + lokal daglig state                           | lokal produktionsprototyp |
| Ordstorm   | `/ordstorm`        | genererade/manuella ordlistor + localStorage                   | lokal produktionsprototyp |
| Stegvis    | `/stegvis`         | hybrid: statiska pussel + DB-word bank                         | hybrid                    |
| Ordfläta   | `/ordflata`        | Prisma `Puzzle`/`PuzzleEntry`/`Hint`                           | DB-driven alpha           |
| Emojirebus | `/emojirebus`      | Prisma `Word` + `RebusEntry`                                   | DB-driven test            |
| Kastet     | `/kastet`          | hårdkodade bokstavspar i kod                                   | ren prototyp              |
| Skrapet    | `/skrapet`         | hårdkodade pussel i kod                                        | ren prototyp              |
| Bildjakten | `/test/bildjakten` | Prisma `MediaAsset` + `Word`, fallback till lokal prototypdata | hybrid                    |
| Daily      | `/daily`           | ingen speldata, endast placeholder                             | placeholder               |

## Dagens Ord

- Route: `/dagens-ord`
- Kodväg:
  - `app/(games)/dagens-ord/page.tsx`
  - `lib/game/dagens-ord.ts`
  - `lib/game/dagens-ord-daily-session.ts`
  - `data/dagens-ord/solution-words.ts`
  - `lib/storage/dagens-ord-daily.ts`

### Datakälla idag

- Lösningsord kommer från lokal, kurerad fil: `data/dagens-ord/solution-words.ts`
- Giltiga gissningar kommer från `allowedSvWords` via `data/words/index.ts`
- Daglig progress sparas i browser storage via `ordklubben:dagens-ord:daily`

### Önskad datakälla

- DB-driven daglig publicering
- Lösningsord bör hämtas från ordbanken (`Word`) men väljas via en publicerad daglig entitet, inte via datumindex över en fil
- Gissningslexikon kan fortsatt bygga på ordpipeline, men bör ha en tydlig publicerad källa eller snapshot för spelet

### Modeller som behövs

- Befintliga modeller som kan återanvändas:
  - `Word`
  - eventuellt `WordLanguageData`
- Nya modeller som saknas:
  - `DailyEdition` eller `GameEdition`
  - `DailyWordPuzzle` eller motsvarande spelspecifik modell
  - eventuell snapshot-tabell för dagens lösningsord och tillåtet lexikon

### Vad som saknas

- Ingen DB-modell för vilket ord som är “dagens ord”
- Ingen publiceringsmodell för datum, status, fallback, ersättningsord
- Ingen redaktionell kö eller QA för dagliga lösningsord
- Ingen relation mellan spelet och ett valt `Word`

### Rekommenderad nästa åtgärd

- Inför en minimal DB-modell för daglig publicering:
  - `DailyWordPuzzle(id, wordId, publishDate, status)`
- Behåll nuvarande lokala allowed-lista tills vidare, men flytta lösningsordet först

## Ordstorm

- Route: `/ordstorm`
- Kodväg:
  - `app/(games)/ordstorm/page.tsx`
  - `lib/game/ordstorm.ts`
  - `data/words/ordstorm-wordlists.ts`
  - `data/words/index.ts`
  - `lib/storage/ordstorm-stats.ts`

### Datakälla idag

- Seed-ord kommer från `seedWordsSvGenerated` med fallback till `data/words/seed-words-sv.ts`
- Tillåtna och vanliga ord kommer från genererade/manuella ordlistor i `data/words/`
- Rundor genereras helt i runtime från ordlistorna
- Statistik sparas i browser storage via `ordklubben:ordstorm:stats`

### Önskad datakälla

- På kort sikt: fortsatt pipeline-byggda ordlistor
- På medellång sikt: DB-driven ordbank med spelprofil för Ordstorm
- Seed-ord bör vara kuraterbara och spårbara i datalagret, inte bara exporterade TS-listor

### Modeller som behövs

- Befintliga modeller som kan återanvändas:
  - `Word`
  - `WordLanguageData`
  - `Theme` / `WordTheme` om teman ska påverka rundor senare
- Nya modeller som saknas:
  - `WordGameProfile` eller `WordUsageProfile`
  - `OrdstormSeed` eller `OrdstormWordProfile`
  - eventuell `OrdstormDailyRound` om dagliga seedade rundor ska publiceras

### Vad som saknas

- Ingen DB-källa för seed-ord
- Ingen modell för Ordstorm-specifik kvalitet, fairness eller blocklist per ord
- Ingen versionerad snapshot av vilka ord som var giltiga när en runda spelades
- Ingen redaktionell yta för att kurera seed-poolen

### Rekommenderad nästa åtgärd

- Inför en enkel DB-profil för Ordstorm på ordnivå, t.ex.:
  - `OrdstormWordProfile(wordId, isSeedCandidate, seedPriority, playableScore, blocked)`
- Låt ordpipeline fortsatt mata data, men flytta seed-kureringen till DB först

## Stegvis

- Route: `/stegvis`
- Kodväg:
  - `app/(games)/stegvis/page.tsx`
  - `lib/content/stegvis/load-play-session.ts`
  - `lib/content/stegvis/load-puzzles.ts`
  - `lib/content/stegvis/load-puzzle-bundle.ts`
  - `lib/content/stegvis/resolve-play-bundle.ts`
  - `data/stegvis/puzzles.ts`
  - `lib/storage/stegvis-stats.ts`

### Datakälla idag

- Statisk fallbacklista med pussel ligger i `data/stegvis/puzzles.ts`
- Start- och målord kan slås upp i DB-word bank för ledtrådar via `getWordWithClues(...)`
- Om DB finns försöker spelet generera en spelbar kedja från `Word` + godkända `Hint`
- Om generatorn misslyckas används statiska pussel
- Statistik sparas i browser storage

### Önskad datakälla

- Fullt DB-drivet Stegvis-innehåll
- Publicerade kedjor bör lagras som riktiga innehållsenheter
- Generatorn kan fortsatt skapa förslag, men inte vara enda källan till spelbar data

### Modeller som behövs

- Befintliga modeller som kan återanvändas:
  - `Word`
  - `Hint`
  - `Theme` / `WordTheme`
- Nya modeller som saknas:
  - `StepwisePuzzle`
  - `StepwiseStep`
  - eventuell `StepwiseGenerationRun` / `StepwiseCandidate`
  - daglig publiceringsmodell om Stegvis ska vara dagligt i DB

### Vad som saknas

- Ingen Prisma-modell för själva Stegvis-pusslet
- Ingen ordnad relation för kedjans mellanord
- Ingen möjlighet att publicera, granska eller arkivera kedjor i DB
- Statisk fil används fortfarande som primär fallback och delvis primär innehållskälla

### Rekommenderad nästa åtgärd

- Modellera Stegvis först, innan ytterligare generatorarbete:
  - `StepwisePuzzle(id, title, startWordId, targetWordId, minimumSteps, publishDate, status)`
  - `StepwiseStep(puzzleId, wordId, position, clueSnapshot)`
- Migrera innehållet från `data/stegvis/puzzles.ts` till DB

## Ordfläta

- Route: `/ordflata`
- Kodväg:
  - `app/(games)/ordflata/page.tsx`
  - `lib/content/ordflata-alpha.ts`
  - `lib/content/puzzle-actions.ts`
  - `lib/content/puzzle/generate-puzzle.ts`

### Datakälla idag

- Hämtar från Prisma
- Route kräver `DATABASE_URL`
- Spelet läser senaste publicerade `Puzzle` med `type = WORD_GRID`
- Innehåll byggs av:
  - `Puzzle`
  - `PuzzleEntry`
  - `PuzzleBlockedCell`
  - `Hint`
  - `Word`

### Önskad datakälla

- Fortsatt DB-driven
- Men med tydligare spelspecifik modell eller åtminstone starkare semantik kring att `WORD_GRID` faktiskt är Ordfläta

### Modeller som behövs

- Befintliga modeller som redan används:
  - `Puzzle`
  - `PuzzleEntry`
  - `PuzzleBlockedCell`
  - `Word`
  - `Hint`
- Modeller som sannolikt behövs framåt:
  - relation till `Theme`
  - eventuell `OrdflataPuzzle` eller `WordGridPuzzle` om `Puzzle` blir för generell

### Vad som saknas

- Ingen explicit relation mellan pussel och tema
- Ingen tydlig spelspecifik modell för Ordfläta kontra andra pusseltyper
- `Puzzle` bär redan flera framtida speltyper, vilket riskerar att späda ut modellen

### Rekommenderad nästa åtgärd

- Minsta säkra steg:
  - lägg till tema-koppling på pusselnivå
  - definiera Ordfläta som primär konsument av `WORD_GRID`
- Nästa större steg:
  - dela ut `Puzzle` i generisk publicering + spelspecifik grid-modell

## Emojirebus

- Route: `/emojirebus`
- Kodväg:
  - `app/(games)/emojirebus/page.tsx`
  - `lib/content/emojirebus.ts`

### Datakälla idag

- Hämtar från Prisma
- Väljer första `Word` som har minst en godkänd `RebusEntry`
- Tar senaste godkända `RebusEntry` per ord
- Returnerar en enkel spelpayload: `wordId`, `answerLength`, `normalizedAnswer`, `emojiHint`

### Önskad datakälla

- DB-driven, men via en riktig spelmodell för rebusar
- Inte “första bästa ord med rebus”, utan publicerade rebuspussel

### Modeller som behövs

- Befintliga modeller som kan återanvändas:
  - `Word`
  - `RebusEntry`
- Nya modeller som saknas:
  - `RebusPuzzle`
  - eventuell `RebusPart` om rebusen ska bli mer strukturerad än en enda sträng
  - publiceringsmodell per rebus

### Vad som saknas

- Ingen modell för ordning, rotation eller publicering
- Ingen möjlighet att ha flera rebusar för samma ord med tydligt syfte
- Ingen metadata för svårighet, formatvariant eller spelkontext på pusselnivå

### Rekommenderad nästa åtgärd

- Inför en enkel `RebusPuzzle` som länkar ett ord till en vald rebus:
  - `RebusPuzzle(id, wordId, rebusEntryId, status, publishDate, difficulty)`
- Låt `RebusEntry` fortsätta vara råmaterial, men inte spelbar enhet

## Kastet

- Route: `/kastet`
- Kodväg:
  - `app/(games)/kastet/page.tsx`
  - `components/games/kastet/kastet-game.tsx`
  - `lib/game/kastet/pairs.ts`
  - `lib/game/kastet/config.ts`

### Datakälla idag

- Helt lokal prototypdata i kod
- Bokstavspar kommer från konstanten `KASTET_LETTER_PAIRS`
- Ingen DB
- Ingen ordbankskoppling
- Ingen sparad speldata för rundor eller statistik

### Önskad datakälla

- Om spelet ska vidare:
  - DB-kuraterad pool av starter/prefix eller tärningssidor
  - koppling till ordbanken för validering och scoring

### Modeller som behövs

- Inga Prisma-modeller används idag
- Troliga framtida modeller:
  - `KastetDieFace` eller `KastetPair`
  - `KastetRoundTemplate`
  - eventuell `WordGameProfile` för giltiga uppföljningsord

### Vad som saknas

- Ingen modell överhuvudtaget
- Ingen relation till `Word`
- Ingen kontroll över vilka bokstavspar som faktiskt ger bra spel
- Ingen kurateringsyta

### Rekommenderad nästa åtgärd

- Om Kastet ska tas vidare, börja inte med full puzzle-modell
- Börja med en kuraterad datakälla för bokstavspar:
  - `KastetPair(value, status, scoreHint, notes)`

## Skrapet

- Route: `/skrapet`
- Kodväg:
  - `app/(games)/skrapet/page.tsx`
  - `lib/game/skrapet/puzzles.ts`

### Datakälla idag

- Helt lokal prototyplista i `SKRAPET_PUZZLES`
- Varje pussel består av:
  - `word`
  - `clues[]`
- Slumpmässigt urval i runtime

### Önskad datakälla

- DB-driven ord + ledtrådar + publicerad spelbar variant
- Spelet behöver en riktig innehållsenhet för “det här är ett skrap-pussel”

### Modeller som behövs

- Befintliga modeller som kan återanvändas:
  - `Word`
  - `Hint`
  - eventuellt `MediaAsset` för ikon/emoji-ledtrådar i framtiden
- Nya modeller som saknas:
  - `SkrapetPuzzle`
  - `SkrapetClue` eller ordnad relation till flera ledtrådar

### Vad som saknas

- Ingen DB-modell
- Ingen ordning eller typning på ledtrådarna
- Ingen status/publicering
- Ingen relation till ett underliggande `Word`

### Rekommenderad nästa åtgärd

- Modellera Skrapet som egen pusseltyp innan mer innehåll produceras:
  - `SkrapetPuzzle(id, wordId, status, difficulty)`
  - `SkrapetPuzzleClue(puzzleId, position, clueText, clueType)`

## Bildjakten

- Route: `/test/bildjakten`
- Kodväg:
  - `app/(games)/test/bildjakten/page.tsx`
  - `lib/game/bildjakten/provider.ts`
  - `lib/game/bildjakten/puzzles.ts`
  - `lib/game/bildjakten/types.ts`

### Datakälla idag

- Försöker först ladda från Prisma:
  - `MediaAsset` där `mediaType = IMAGE` och `status = APPROVED`
  - kopplad `Word` måste också vara `APPROVED`
- Om DB inte ger spelbara bilder används lokal fallback i `BILDJAKT_PROTOTYPE_PUZZLES`
- Bild-URL extraheras från:
  - `filePath`
  - annars `sourceReference`
  - annars `notes`

### Önskad datakälla

- DB-driven bildpusselmodell
- `MediaAsset` bör vara asset-lager, inte spel-pussel i sig

### Modeller som behövs

- Befintliga modeller som kan återanvändas:
  - `Word`
  - `MediaAsset`
- Nya modeller som saknas:
  - `BildjaktenPuzzle` eller generell `ImagePuzzle`
  - publiceringsmodell
  - eventuell relation mellan pussel och valt asset

### Vad som saknas

- Ingen spelmodell för vilka bilder som hör till Bildjakten
- Ingen kuraterad ordning eller publicering
- Ingen garanti att varje `MediaAsset` är avsedd för just detta spel
- Asset-upplösning via `notes`/`sourceReference` visar att assetmodellen är för lös

### Rekommenderad nästa åtgärd

- Inför en explicit spelmodell:
  - `ImagePuzzle(id, wordId, mediaAssetId, status, publishDate, difficulty)`
- Behåll `MediaAsset` som innehållslager, men sluta låta spelet läsa “alla godkända bilder”

## Daily

- Route: `/daily`
- Kodväg:
  - `app/(games)/daily/page.tsx`

### Datakälla idag

- Ingen speldata
- Endast placeholder-sida

### Önskad datakälla

- Ingen egen datakälla om routen bara ska fungera som ingång till dagliga spel
- Alternativt en samlande publiceringsmodell för “dagens aktiva utmaningar”

### Modeller som behövs

- Om routen ska leva vidare:
  - `DailyEdition` / `GameEdition`
  - relationer till Dagens Ord, Stegvis, Ordfläta eller framtida dagliga spel

### Vad som saknas

- Ingen funktionell roll i innehållsmodellen ännu

### Rekommenderad nästa åtgärd

- Bestäm om `/daily` ska vara:
  - en hub för dagliga spel, eller
  - tas bort tills den behövs

## Tvärgående observationer

### 1. Tre olika datalager används parallellt idag

- Lokala filer i `data/`
- Prisma/Postgres
- Browser storage

Det fungerar, men gör att varje spel har olika nivå av publicerbarhet och redaktionell kontroll.

### 2. Ordbanken är stark, spelmodellerna är ojämna

- `Word`, `Hint`, `Theme`, `RebusEntry`, `MediaAsset` och `Puzzle` räcker redan långt
- Det som främst saknas är spelspecifika, publicerbara innehållsenheter

### 3. De mest DB-mogna spelen idag

- Ordfläta
- Emojirebus
- Bildjakten (men med svag spelmodell)

### 4. De största innehållsgapen

- Dagens Ord saknar daglig publiceringsmodell
- Stegvis saknar riktig Prisma-modell trots relativt avancerad logik
- Skrapet och Kastet saknar helt innehållsmodell

## Rekommenderad prioriteringsordning

1. Modellera `StepwisePuzzle` och migrera bort från `data/stegvis/puzzles.ts`
2. Modellera `DailyWordPuzzle` för Dagens Ord
3. Inför explicit `ImagePuzzle` och `RebusPuzzle`
4. Stärk `Puzzle`-familjen runt Ordfläta med tema/publicering
5. Vänta med Kastet och Skrapet tills det är beslutat att de ska vidare
