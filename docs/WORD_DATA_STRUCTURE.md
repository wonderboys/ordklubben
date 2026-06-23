# WORD_DATA_STRUCTURE

Senast uppdaterad: 2026-06-23

Det här dokumentet beskriver en DB-first riktning för orddata och råkällor i Ordklubben.

Målet är:

- `data/raw/` ska leva kvar och vara hem för rådata
- spel ska inte läsa från `data/*` i runtime
- importscript ska skriva till Postgres, inte till `data/generated/*.ts`
- samma ord ska kunna komma från flera källor utan att manuellt kuraterat innehåll skrivs över
- spel som Dagens Ord och Stegvis ska byggas från den gemensamma ordbanken i DB, inte från egna curated råfiler

## Beslut i korthet

### Behåll

- `data/raw/`
- små manuella seed/filter-filer som importstöd

### Fasa ut som runtime

- `data/generated/*.generated.ts`
- `data/words/*.ts` som spelkälla
- spelspecifika ord- och pusselfiler i `data/` som används direkt av spel

### Flytta ansvar till DB

- canonical ord ska ligga i `Word`
- rå provenance ska ligga separat per källa/import
- spel ska läsa via DB-drivna providers
- spelspecifikt urval ska vara DB-frågor och spelmodeller, inte egna ordlistfiler

## Nuvarande råfiler

Filer i `data/raw/` idag:

- `data/raw/hunspell-sv/sv_SE.dic`
- `data/raw/kelly/Swedish-Kelly_M3_CEFR.csv`
- `data/raw/kelly/Swedish-Kelly_M3_CEFR.xls`

Bedömning:

- Hunspell-filen bör leva kvar som rå täckningskälla
- Kelly bör ha exakt ett canonical importformat i repo:t
- om CSV-filen innehåller allt ni behöver, behövs inte `.xls`

Rekommendation:

- behåll `CSV`
- ta bort `XLS` när CSV-formatet är verifierat

## Naming convention

### Kataloger

Använd:

- `data/raw/<source-family>/`
- `data/raw/curated/`
- `data/seed/<purpose>/`
- `data/import-manifests/`
- `data/legacy/`

### Filnamn

Använd:

- lowercase
- kebab-case
- källa först
- version i namnet bara när flera revisioner realistiskt behöver samexistera

Bra exempel:

- `data/raw/hunspell/sv-se.dic`
- `data/raw/kelly/kelly-cefr-v1.csv`
- `data/seed/word-filters/never-allow-sv.ts`

Undvik:

- `Swedish-Kelly_M3_CEFR.csv`
- blandning av versaler, understreck och produktnamn i filnamn

## Rekommenderad målstruktur

### `data/raw`

Här ska råfiler ligga som importeras till DB.

Exempel:

- `data/raw/hunspell/sv-se.dic`
- `data/raw/kelly/kelly-cefr-v1.csv`

### `data/seed`

Här ska manuella filter och bootstrapfiler ligga.

Exempel:

- `data/seed/word-filters/never-allow-sv.ts`
- `data/seed/word-filters/never-seed-sv.ts`
- `data/seed/word-filters/preferred-seed-sv.ts`
- `data/seed/word-filters/allowed-abbrev-sv.ts`

### `data/import-manifests`

Här kan ni lägga metadata om källor och importpolicy.

Exempel:

- `data/import-manifests/hunspell-sv.json`
- `data/import-manifests/kelly-cefr-v1.json`
- `data/import-manifests/dagens-ord-curated.json`

### `data/legacy`

Här kan tillfälliga migrationsfiler bo om ni måste ha kvar gamla runtime-filer en stund.

Exempel:

- `data/legacy/words/allowed-sv.ts`
- `data/legacy/words/common-sv.ts`
- `data/legacy/words/seed-words-sv.ts`

## Filklassning

### Ska leva kvar som råimport

- `data/raw/hunspell-sv/sv_SE.dic`
- `data/raw/kelly/Swedish-Kelly_M3_CEFR.csv`

### Kan bort när CSV räcker

- `data/raw/kelly/Swedish-Kelly_M3_CEFR.xls`

### Ska bort som datakälla

- `data/dagens-ord/solution-words.ts`
- `data/stegvis/puzzles.ts`

Bedömning:

- de är temp/mock/prototypdata
- de bör inte flyttas till nya canonical råfiler
- innehållet bör ersättas av DB-drivet urval från `Word` och framtida spelmodeller

### Ska inte vara runtime-källa framåt

- `data/generated/allowed-sv.generated.ts`
- `data/generated/common-sv.generated.ts`
- `data/generated/seed-words-sv.generated.ts`
- `data/words/index.ts`
- `data/words/ordstorm-wordlists.ts`
- `data/words/allowed-sv.ts`
- `data/words/common-sv.ts`
- `data/words/seed-words-sv.ts`

## DB-first importscript

Nuvarande script [scripts/build-wordlists.ts](/Users/stefan/Projects/wonderboys/ordklubben/scripts/build-wordlists.ts) läser rådata och skriver genererade TypeScript-filer.

Det är bra som prototyp, men fel slutarkitektur.

Det nya importscriptet bör i stället:

- läsa `data/raw/*`
- normalisera ord
- tillämpa filter och manuella block/allowlist-regler
- skriva till Postgres
- skapa `ImportBatch`
- skriva importsammanfattning och felrader i DB

Det bör inte:

- skriva `data/generated/*.generated.ts`
- vara del av spelruntime

## Importmodell i databasen

Det som finns idag räcker som start:

- `Word`
- `ImportBatch`
- `source`
- `sourceReference`

Men för flera samtidiga källor räcker inte ett enda `source`-fält på `Word`.

### Rekommenderad utbyggnad

Lägg till en separat provenance-modell, till exempel:

- `WordSourceRecord`

Förslag på fält:

- `id`
- `wordId`
- `importBatchId`
- `sourceKey`
- `sourceReference`
- `rawValue`
- `normalizedValue`
- `rank`
- `frequency`
- `cefr`
- `metadata`
- `createdAt`
- `updatedAt`

Det gör att:

- samma `Word` kan ha många källor
- ni kan spåra exakt vilken import som gav vilken metadata
- framtida källor kan läggas till utan att ni förstör tidigare provenance

### Är `WordSourceRecord` rätt modell?

Ja, i princip. Det robusta i modellen är inte just namnet, utan separationen mellan tre nivåer:

1. canonical ord
2. importerade källobservationer
3. manuella/editoriella beslut

Den separationen är viktig eftersom den undviker att ett och samma fält försöker vara:

- rå källa
- sammanställd sanning
- redaktionellt beslut

Det är just den sammanblandningen som brukar skapa problem senare.

## Behövs en flagga så importer inte skriver över manuellt redigerade ord?

Ja, men helst inte som en enda grov “overwrite/no-overwrite”-flagga.

Bättre modell:

- importer ska vara additive
- manuella redigeringar ska ha företräde
- derivatfält ska kunna räknas om utan att manuella beslut försvinner

### Rekommenderat upplägg

Antingen:

- låsfält på `Word`

Exempel:

- `statusLocked`
- `difficultyLocked`
- `frequencyLocked`
- `notesLocked`

Eller bättre:

- separat modell för manuella overrides, till exempel `WordEditorialOverride`

Fältidé:

- `wordId`
- `status`
- `difficulty`
- `frequency`
- `notes`
- `reviewedBy`
- `reviewedAt`

Rekommendation:

- använd `Word` som aktuell sammanställd vy
- använd `WordSourceRecord` för rå importprovenance
- använd `WordEditorialOverride` för manuella avvikelser som alltid vinner

### Är `WordEditorialOverride` rätt modell?

Ja, oftast bättre än många separata låsfält om ni vill vara robusta över tid.

Varför:

- den gör manuella beslut explicita
- den gör det lättare att se vad som faktiskt avviker från importerad data
- den går att utöka utan att blåsa upp `Word` med många specialfält

När låsfält räcker:

- om ni bara behöver skydda 1-2 enkla fält under en kortare migrationsfas

När override-modell är bättre:

- om flera personer ska kurera data
- om ni vill kunna förklara varför ett ord ser ut som det gör
- om ni vill kunna lägga till fler importer senare
- om ni vill kunna bygga adminhistorik och review-flöden

Min mer genomtänkta rekommendation är därför:

- undvik att låta `Word` bära all sanning själv
- undvik många permanenta `...Locked`-fält om ni redan vet att systemet ska växa
- använd hellre en separat editorial-modell för manuella beslut

## Hur hanterar vi flera importer där samma ord finns i flera källor?

Rekommenderad regel:

- ett canonical `Word` per `normalizedAnswer`
- många `WordSourceRecord` per ord

Importer ska därför:

- upserta `Word` på `normalizedAnswer`
- skapa eller uppdatera källpost per källa och import
- inte behandla senaste import som ensam sanning

### Prioritetsordning mellan källor

En rimlig standardordning:

1. manuella/editoriella overrides
2. curated interna källor
3. Kelly eller annan frekvenskälla
4. Hunspell/SFOL för täckning

Det betyder:

- Hunspell är bra för “ordet finns”
- Kelly är bra för frekvens och spelbarhet
- curated filer är bra för spelspecifika beslut

### Merge-strategi per fält

- `Word.answer`
  - canonical visningsform från editorial override eller första betrodda källa
- `Word.frequency`
  - från bästa tillgängliga frekvenskälla
- `Word.difficulty`
  - härledd eller manuellt satt
- `Word.status`
  - ska inte nedgraderas automatiskt av ny råimport
- `Word.source`
  - bör inte längre vara enda sanningen, utan snarare “primary provenance label” om fältet behålls

### Viktig designregel

Importer ska inte “äga” `Word` direkt.

De ska i stället:

- lägga till eller uppdatera källfakta
- trigga en sammanställning
- låta canonical `Word` räknas fram med tydlig prioritet

Det är säkrare än att varje import direkt muterar samma fält med olika logik.

## Rekommenderad robust modell

Den mest robusta formen här är:

- `Word`
  - canonical, spelbar och query-vänlig vy
- `WordSourceRecord`
  - en post per ord och källa eller per ord och importkörning
- `WordEditorialOverride`
  - redaktionella beslut som vinner över importer

Om ni vill gå ännu mer robust:

- lägg till ett sammanställningssteg där `Word` uppdateras från `WordSourceRecord` + `WordEditorialOverride`
- behandla `Word` som materialiserad produktvy, inte som rå lagerplats

Det ger en tydlig kedja:

1. rå källa importeras
2. provenance sparas
3. editorial overrides appliceras
4. canonical `Word` uppdateras

Det här skalar bättre än:

- bara `Word.source`
- bara låsflaggor
- eller att importscript skriver direkt över allt

## Rekommenderade import modes

I stället för en enda overwrite-flagga, använd tydliga importlägen:

- `insert-missing`
- `merge-safe`
- `refresh-source-metadata`
- `rebuild-derived-fields`
- `force-overwrite-derived`

Rekommenderat default:

- `merge-safe`

Det ska betyda:

- skapa ord som saknas
- uppdatera provenance
- uppdatera härledda, ej låsta fält
- skriv inte över manuella overrides

## Konsekvens för nuvarande spelfiler

Filer som idag används direkt av spel men bör bli importer eller DB-data:

- `data/dagens-ord/solution-words.ts`
- `data/stegvis/puzzles.ts`
- `data/words/index.ts`
- `data/words/ordstorm-wordlists.ts`

Spel ska i stället läsa via providers i `lib/` som använder DB som förstahandskälla.

För Dagens Ord och Stegvis betyder det:

- ingen ny curated råfil behövs
- spelet ska välja från `Word` och relaterade spelmodeller i DB
- temp/mock-filerna ska bara ses som övergångsmaterial som kan tas bort

## Konkreta nästa steg

1. Bestäm canonical Kelly-fil och ta bort `.xls` om CSV räcker.
2. Byt namn på råkataloger och filer till lowercase kebab-case.
3. Ersätt `build-wordlists`-output till `data/generated/*` med DB-import.
4. Inför `WordSourceRecord` för flera källor per ord.
5. Inför låsfält eller `WordEditorialOverride` för manuellt kuraterade värden.
6. Ta bort beroendet på temp/mock-filer för Dagens Ord och Stegvis i stället för att flytta dem till nya råfiler.
7. Flytta spel från `data/*` till DB-drivna providers och spelmodeller.
