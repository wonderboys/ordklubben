# WORD_DATA_STRUCTURE

Senast uppdaterad: 2026-06-23

Det här dokumentet beskriver den nuvarande DB-first riktningen för orddata och råkällor i Ordklubben efter migreringsstarten.

Målet är:

- spel ska inte läsa från `data/*` i runtime
- råkällor ska ligga kvar i repo:t som importunderlag
- importscript ska skriva till Postgres, inte till aktiva runtime-filer
- samma ord ska kunna komma från flera källor utan att manuellt kuraterat innehåll skrivs över
- Dagens Ord och Stegvis ska byggas från den gemensamma ordbanken i DB, inte från egna spelbundna ordlistor

## Status nu

- inga aktiva spelrutter läser längre direkt från `data/`
- `data/words` har tagits bort som runtime-katalog
- aktiv runtime använder DB-baserade providers i `lib/server/words` och `lib/games/<game>/`
- äldre generated-filer finns bara kvar under `data/legacy/`
- kuraterade filer under `data/sources/curated/` finns kvar som migrationsunderlag, inte som långsiktig spelruntime

## Beslut i korthet

### Behåll

- `data/sources/raw/`
- små manuella filterfiler under `data/seed/`
- `data/legacy/` så länge migrationen kräver referensmaterial

### Fasa ut som aktiv källa

- `data/legacy/generated/*.generated.ts`
- kuraterade temp/mock-filer som direkt styr spelbeteende

### Flytta ansvar till DB

- canonical ord ska ligga i `Word`
- rå provenance ska ligga separat per källa/import
- manuella redaktionella beslut ska ligga separat från råimporter
- spel ska läsa via DB-drivna providers och spelmodeller

## Nuvarande källstruktur

### Råkällor

- `data/sources/raw/hunspell/sv_SE.dic`
- `data/sources/raw/kelly/Swedish-Kelly_M3_CEFR.csv`

Bedömning:

- Hunspell är bred täckningskälla
- Kelly är frekvens- och spelbarhetskälla
- CSV-filen är nu den enda Kelly-källan i repo:t

### Kuraterade migrationsfiler

- `data/sources/curated/dagens-ord/solution-words.ts`
- `data/sources/curated/stegvis/puzzles.ts`

Bedömning:

- de ska inte bli ny canonical råmodell
- de finns kvar som migrationsunderlag och referens
- långsiktigt ska motsvarande spel välja innehåll från ordbanken i DB

### Seed och filter

- `data/seed/word-filters/never-allow-sv.ts`
- `data/seed/word-filters/never-seed-sv.ts`
- `data/seed/word-filters/preferred-seed-sv.ts`
- `data/seed/word-filters/allowed-abbrev-sv.ts`

Bedömning:

- de här är fortfarande rimliga som importstöd
- de är inte gameplay-data

### Legacy

- `data/legacy/words/*.ts`
- `data/legacy/generated/*.generated.ts`

Bedömning:

- endast referens och migrationsstöd
- inte aktiv runtime-källa

## Naming convention

### Kataloger

Använd:

- `data/sources/raw/<source-family>/`
- `data/sources/curated/<domain>/`
- `data/seed/<purpose>/`
- `data/import-manifests/`
- `data/legacy/`

### Filnamn

Använd:

- lowercase när ni skapar nya interna filer
- kebab-case för nya interna filnamn
- källa först
- versionssuffix bara när flera revisioner realistiskt behöver samexistera

Bra exempel för framtida interna namn:

- `data/sources/raw/hunspell/sv-se.dic`
- `data/sources/raw/kelly/kelly-cefr-v1.csv`
- `data/seed/word-filters/never-allow-sv.ts`

## Runtime-läge nu

Aktiv runtime använder inte längre `data/` direkt. I stället används:

- `lib/server/words/`
- `lib/games/dagens-ord/word-provider.ts`
- `lib/games/ordstorm/word-provider.ts`
- `lib/games/stegvis/content-provider.ts`
- `lib/games/kastet/content-provider.ts`
- `lib/games/skrapet/content-provider.ts`
- `lib/games/bildjakten/content-provider.ts`

Det är den riktning dokumentationen ska optimeras för framåt.

## DB-first importscript

Det aktiva importspåret är nu `scripts/import-words.ts`, som läser råkällor och skriver till Postgres.

Det bör:

- läsa `data/sources/raw/*`
- normalisera ord
- tillämpa filter och manuella block/allowlist-regler
- skriva till Postgres
- skapa `ImportBatch`
- spara provenance per ordkälla

Det bör inte:

- skapa nya aktiva runtime-filer
- återinföra `data/words` som spelkälla

`scripts/build-wordlists.ts` ska inte vara den primära vägen framåt.

## Rekommenderad datamodell

Den robusta modellen är tredelad:

1. `Word`
2. `WordSourceRecord`
3. `WordEditorialOverride`

### `Word`

`Word` är canonical, spelbar och query-vänlig vy.

Den ska vara:

- stabil för spel
- lätt att filtrera på
- resultatet av sammanställning, inte enda platsen för rå sanning

### `WordSourceRecord`

`WordSourceRecord` lagrar provenance per ord och källa/import.

Det gör att:

- samma ord kan komma från flera källor
- ni kan spåra exakt vilken import som gav vilken metadata
- importer blir additiva i stället för destruktiva

### `WordEditorialOverride`

`WordEditorialOverride` lagrar manuella beslut som ska vinna över importerad data.

Det är robustare än många permanenta låsflaggor på `Word`, eftersom:

- manuella avvikelser blir explicita
- det går att utöka utan att blåsa upp `Word`
- det är lättare att förklara varför ett ord ser ut som det gör

## Hur flera importer av samma ord ska hanteras

Rekommenderad regel:

- ett canonical `Word` per `normalizedAnswer`
- många `WordSourceRecord` per ord

Importer ska därför:

- upserta `Word` på `normalizedAnswer`
- skapa eller uppdatera källposter
- inte behandla senaste import som ensam sanning

### Prioritetsordning mellan källor

En rimlig standardordning:

1. manuella/editoriella overrides
2. kuraterade interna beslut
3. Kelly eller annan frekvenskälla
4. Hunspell/SFOL för täckning

### Viktig designregel

Importer ska inte “äga” `Word` direkt.

De ska:

- lägga till eller uppdatera källfakta
- trigga en sammanställning
- låta canonical `Word` räknas fram med tydlig prioritet

Det här är säkrare än att varje import skriver över samma fält på egen hand.

## Rekommenderade import modes

I stället för en enda overwrite-flagga:

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
- uppdatera härledda, ej manuellt överstyrda fält
- skriv inte över manuella overrides

## Speldata

För Dagens Ord och Stegvis gäller nu:

- deras gamla temp/mock-filer ska inte utvecklas vidare som canonical källor
- spelinnehållet ska framåt väljas från `Word` och framtida spelmodeller i DB
- eventuella kvarvarande kuraterade filer är bara övergångsmaterial

## Konkreta nästa steg

1. Fortsätt flytta all ordimport till `scripts/import-words.ts`.
2. Låt nya råkällor mappa till `WordSourceRecord`, inte direkt till `Word`.
3. Låt manuella beslut gå via `WordEditorialOverride`.
4. Modellera spelval och publicering ovanpå ordbanken i DB, inte via nya ordlistfiler i `data/`.
