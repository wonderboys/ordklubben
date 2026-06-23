# WORD_DATA_STRUCTURE

Senast uppdaterad: 2026-06-23

Det här dokumentet är en konkret audit av alla filer under `data/` som innehåller:

- ordlistor
- allowed words
- seed words
- speldata

Målet är att avgöra vilka filer som:

1. ska importeras till databasen
2. bara ska användas som seed/test
3. är legacy och kan fasas ut
4. används direkt av spel och därför måste ersättas av DB-provider

Dokumentet föreslår också en målstruktur:

- `data/sources`
- `data/seed`
- `data/legacy`
- `lib/words`
- `lib/games/<game>/rules.ts`
- `lib/games/<game>/word-provider.ts`

Status efter steg 1-4 i migreringen:

- inga aktiva spelrutter läser längre direkt från `data/`
- `data/words` har tagits bort som runtime-katalog
- aktiv runtime använder nu DB-baserade providers i `lib/server/words` och `lib/games/<game>/`
- detaljerade filsektioner längre ned beskriver fortfarande ursprungsfilerna som migrationsunderlag, men inte längre aktiv spelruntime

## Sammanfattning

### Filer som bör importeras till databasen

- `data/sources/raw/hunspell/sv_SE.dic`
- `data/sources/raw/kelly/Swedish-Kelly_M3_CEFR.csv`
- `data/sources/curated/stegvis/puzzles.ts`
- `data/sources/curated/dagens-ord/solution-words.ts`

### Filer som bör stanna som seed/test eller byggstöd

- `data/sources/raw/kelly/Swedish-Kelly_M3_CEFR.xls`
- `data/seed/word-filters/never-allow-sv.ts`
- `data/seed/word-filters/never-seed-sv.ts`
- `data/seed/word-filters/preferred-seed-sv.ts`
- `data/seed/word-filters/allowed-abbrev-sv.ts`

### Filer som är legacy eller bör fasas ut som runtime-källa

- `data/legacy/words/allowed-sv.ts`
- `data/legacy/words/common-sv.ts`
- `data/legacy/words/seed-words-sv.ts`
- `data/legacy/generated/allowed-sv.generated.ts`
- `data/legacy/generated/common-sv.generated.ts`
- `data/legacy/generated/seed-words-sv.generated.ts`

### Filer som tidigare användes direkt av spel och därför har ersatts av DB-provider

- `data/sources/curated/dagens-ord/solution-words.ts`
- `data/sources/curated/stegvis/puzzles.ts`
- tidigare `data/words/index.ts`
- tidigare `data/words/ordstorm-wordlists.ts`
- tidigare indirekt även:
  - `data/legacy/words/allowed-sv.ts`
  - `data/legacy/words/common-sv.ts`
  - `data/legacy/words/seed-words-sv.ts`
  - `data/legacy/generated/*.generated.ts`

## Nuvarande användning i kod

Direkta runtime-importer från spel/logik idag:

- inga aktiva spelrutter importerar längre från `data/`
- runtime använder i stället:
  - `lib/server/words/`
  - `lib/games/dagens-ord/word-provider.ts`
  - `lib/games/ordstorm/word-provider.ts`
  - `lib/games/stegvis/content-provider.ts`
  - `lib/games/kastet/content-provider.ts`
  - `lib/games/skrapet/content-provider.ts`
  - `lib/games/bildjakten/content-provider.ts`

Kuraterade källfiler i `data/sources/` finns kvar som migrations- och importunderlag, inte som aktiv runtime-källa.

Bygg/pipeline-beroenden idag:

- `scripts/build-wordlists.ts`
  - läser `data/sources/raw/*`
  - läser `data/seed/word-filters/never-allow-sv.ts`
  - läser `data/seed/word-filters/never-seed-sv.ts`
  - läser `data/seed/word-filters/preferred-seed-sv.ts`
  - läser `data/seed/word-filters/allowed-abbrev-sv.ts`
  - skriver `data/legacy/generated/*.generated.ts`

## Rekommenderad målstruktur

### `data/sources`

Används för råkällor och kuraterade importkällor som ska in i DB eller i ordpipeline.

Exempel:

- `data/sources/raw/hunspell/sv_SE.dic`
- `data/sources/raw/kelly/Swedish-Kelly_M3_CEFR.csv`
- `data/sources/raw/kelly/Swedish-Kelly_M3_CEFR.xls`
- `data/sources/curated/dagens-ord-solution-words.ts` eller hellre `.csv`
- `data/sources/curated/stegvis-puzzles.ts` eller hellre `.csv/.json`

### `data/seed`

Används för manuella overrides, bootstrap och test-/seeddata till importer eller generators.

Exempel:

- `data/seed/word-filters/never-allow-sv.ts`
- `data/seed/word-filters/never-seed-sv.ts`
- `data/seed/word-filters/preferred-seed-sv.ts`
- `data/seed/word-filters/allowed-abbrev-sv.ts`

### `data/legacy`

Används för gamla runtime-filer som tillfälligt behöver finnas kvar under migrationen men inte ska vara den långsiktiga modellen.

Exempel:

- `data/legacy/words/allowed-sv.ts`
- `data/legacy/words/common-sv.ts`
- `data/legacy/words/seed-words-sv.ts`
- `data/legacy/generated/*.generated.ts`
- `data/legacy/stegvis/puzzles.ts` om DB-migrering redan har gjorts

### `lib/words`

Här bör runtime-lagret för ord flytta in.

Exempel:

- `lib/words/normalize.ts`
- `lib/words/allowed-word-provider.ts`
- `lib/words/common-word-provider.ts`
- `lib/words/seed-word-provider.ts`
- `lib/words/types.ts`

### `lib/games/<game>/rules.ts`

Spelspecifika regler ska ligga här, inte i `data/`.

Exempel:

- `lib/games/dagens-ord/rules.ts`
- `lib/games/ordstorm/rules.ts`
- `lib/games/stegvis/rules.ts`

### `lib/games/<game>/word-provider.ts`

Spelspecifika dataleverantörer ska ligga här och välja DB, seed eller fallback beroende på spel.

Exempel:

- `lib/games/dagens-ord/word-provider.ts`
- `lib/games/ordstorm/word-provider.ts`
- `lib/games/stegvis/word-provider.ts`

## Fil-för-fil-audit

### `data/dagens-ord/solution-words.ts`

- Innehåll:
  - handkuraterad lista med fem bokstäver för Dagens Ord
- Används idag av:
  - `lib/game/dagens-ord.ts`
  - testscript `scripts/check-dagens-ord-eval.ts`
- Klassificering:
  - används direkt av spel
  - bör importeras till databasen
- Bedömning:
  - detta är inte bara seeddata utan faktisk produktionskälla för spelet
  - den bör inte fortsätta styra dagligt innehåll direkt från `data/`
- Rekommenderad framtida plats:
  - kort sikt: `data/sources/curated/dagens-ord-solution-words.ts`
  - lång sikt: importerad till DB som dagligt pusselunderlag
- Rekommenderad DB-roll:
  - källa för `DailyWordPuzzle` eller motsvarande publicerad dagsmodell
- Rekommenderad status:
  - `ska importeras till databasen`

### `data/generated/allowed-sv.generated.ts`

- Innehåll:
  - genererad allowed-lista från `scripts/build-wordlists.ts`
- Används idag av:
  - `data/words/index.ts`
  - testscript för Dagens Ord och Stegvis
- Klassificering:
  - runtime-källa idag via aggregatfil
  - byggartefakt snarare än källa
- Bedömning:
  - bör inte importeras 1:1 till DB som “sanning”
  - bör ses som pipeline-output eller cache/snapshot
- Rekommenderad framtida plats:
  - `data/legacy/generated/allowed-sv.generated.ts` under migration
  - på sikt helst ingen repo-runtime-roll
- Rekommenderad status:
  - `legacy och kan fasas ut som runtime-källa`

### `data/generated/common-sv.generated.ts`

- Innehåll:
  - genererad lista med vanligare ord
- Används idag av:
  - `data/words/index.ts`
- Klassificering:
  - runtime-källa idag via aggregatfil
  - byggartefakt
- Bedömning:
  - bör ersättas av DB-driven common/provider-logik
- Rekommenderad framtida plats:
  - `data/legacy/generated/common-sv.generated.ts`
- Rekommenderad status:
  - `legacy och kan fasas ut som runtime-källa`

### `data/generated/seed-words-sv.generated.ts`

- Innehåll:
  - genererad seedlista för Ordstorm
- Används idag av:
  - `data/words/ordstorm-wordlists.ts`
- Klassificering:
  - runtime-källa idag via Ordstorm-wrapper
  - byggartefakt
- Bedömning:
  - bör ersättas av DB-provider eller åtminstone av ett tydligt seedlager utanför spelruntime
- Rekommenderad framtida plats:
  - `data/legacy/generated/seed-words-sv.generated.ts`
- Rekommenderad status:
  - `legacy och kan fasas ut som runtime-källa`

### `data/raw/hunspell-sv/.gitkeep`

- Innehåll:
  - placeholder för tom katalog
- Används idag av:
  - repo-struktur
- Klassificering:
  - strukturfil
- Bedömning:
  - behåll så länge katalogen finns
- Rekommenderad framtida plats:
  - `data/sources/raw/hunspell/.gitkeep`
- Rekommenderad status:
  - `seed/strukturstöd`

### `data/raw/hunspell-sv/sv_SE.dic`

- Innehåll:
  - rå extern ordkälla
- Används idag av:
  - `scripts/build-wordlists.ts`
- Klassificering:
  - råimportkälla
- Bedömning:
  - ska inte läsas av spel direkt
  - bör fortsätta vara importkälla till pipeline eller DB-import
- Rekommenderad framtida plats:
  - `data/sources/raw/hunspell/sv_SE.dic`
- Rekommenderad status:
  - `ska importeras till databasen` eller användas som primär källa i ordpipeline som matar DB

### `data/raw/kelly/.gitkeep`

- Innehåll:
  - placeholder för tom katalog
- Används idag av:
  - repo-struktur
- Rekommenderad framtida plats:
  - `data/sources/raw/kelly/.gitkeep`
- Rekommenderad status:
  - `seed/strukturstöd`

### `data/raw/kelly/Swedish-Kelly_M3_CEFR.csv`

- Innehåll:
  - rå Kelly/Språkbanken-liknande frekvenskälla
- Används idag av:
  - `scripts/build-wordlists.ts`
- Klassificering:
  - råimportkälla
- Bedömning:
  - viktig som underlag för common/frequency/seed-prioritering
  - bör fortsätta vara source, inte runtime-fil
- Rekommenderad framtida plats:
  - `data/sources/raw/kelly/Swedish-Kelly_M3_CEFR.csv`
- Rekommenderad status:
  - `ska importeras till databasen` eller användas som källa för DB-berikning

### `data/raw/kelly/Swedish-Kelly_M3_CEFR.xls`

- Innehåll:
  - alternativ råexport av samma källa
- Används idag av:
  - ingen kod hittad
- Klassificering:
  - rå backup/alternativkälla
- Bedömning:
  - behövs sannolikt bara som referens eller manuell fallback
- Rekommenderad framtida plats:
  - `data/sources/raw/kelly/Swedish-Kelly_M3_CEFR.xls`
- Rekommenderad status:
  - `bara seed/test eller backup`

### `data/stegvis/puzzles.ts`

- Innehåll:
  - statiska Stegvis-pussel med start, mål, titel, minsta steg och provlösning
- Används idag av:
  - `lib/content/stegvis/load-puzzles.ts`
  - `lib/content/stegvis/load-puzzle-bundle.ts`
  - `lib/game/stegvis.ts`
  - valideringsscript
- Klassificering:
  - används direkt av spel
  - bör importeras till databasen
- Bedömning:
  - det här är riktig speldata, inte bara testdata
  - måste ersättas av DB-provider när Stegvis får modell
- Rekommenderad framtida plats:
  - kort sikt: `data/sources/curated/stegvis-puzzles.ts`
  - lång sikt: importerad till DB
- Rekommenderad status:
  - `ska importeras till databasen`
  - `används direkt av spel och måste ersättas av DB-provider`

### `data/words/allowed-abbrev-sv.ts`

- Innehåll:
  - manuell allowlist för förkortningar som ska överleva filtret
- Används idag av:
  - `scripts/build-wordlists.ts`
- Klassificering:
  - seed/override för pipeline
- Bedömning:
  - detta är inte runtime-speldata
  - bra kandidat för seed/override-struktur
- Rekommenderad framtida plats:
  - `data/seed/word-filters/allowed-abbrev-sv.ts`
- Rekommenderad status:
  - `bara seed/test`

### `data/words/allowed-sv.ts`

- Innehåll:
  - liten manuell fallbacklista för allowed words
- Används idag av:
  - `data/words/index.ts`
  - testscript
- Klassificering:
  - runtime-fallback idag
  - legacy när generated/DB finns
- Bedömning:
  - bör inte vara långsiktig källa
  - kan fungera som bootstrap/seed under migration
- Rekommenderad framtida plats:
  - `data/legacy/words/allowed-sv.ts`
  - alternativt `data/seed/bootstrap/allowed-sv.ts` om ni vill behålla den som nödbroms
- Rekommenderad status:
  - `legacy och kan fasas ut`

### `data/words/common-sv.ts`

- Innehåll:
  - liten manuell fallbacklista för common words
- Används idag av:
  - `data/words/index.ts`
- Klassificering:
  - runtime-fallback idag
  - legacy när DB/common-provider finns
- Bedömning:
  - bör ersättas av DB eller provider över importerad ordbank
- Rekommenderad framtida plats:
  - `data/legacy/words/common-sv.ts`
- Rekommenderad status:
  - `legacy och kan fasas ut`

### `data/words/index.ts`

- Innehåll:
  - runtime-aggregat som väljer generated eller manual fallback
- Används idag av:
  - `lib/game/dagens-ord.ts`
  - `lib/game/ordstorm.ts`
  - `lib/game/stegvis.ts`
- Klassificering:
  - används direkt av spel
  - måste ersättas av provider-lager
- Bedömning:
  - detta är en central övergångsfil men den håller kvar spel i `data/`-beroenden
- Rekommenderad framtida plats:
  - flytta logiken till `lib/words/allowed-word-provider.ts` och `lib/words/common-word-provider.ts`
- Rekommenderad status:
  - `används direkt av spel och därför måste ersättas av DB-provider`

### `data/words/never-allow-sv.ts`

- Innehåll:
  - manuell blocklista för allowed-listan
- Används idag av:
  - `scripts/build-wordlists.ts`
- Klassificering:
  - seed/override för pipeline
- Bedömning:
  - inte runtime-data
  - bör stanna som seed/override tills motsvarande adminflöde finns
- Rekommenderad framtida plats:
  - `data/seed/word-filters/never-allow-sv.ts`
- Rekommenderad status:
  - `bara seed/test`

### `data/words/never-seed-sv.ts`

- Innehåll:
  - manuell blocklista för seedord
- Används idag av:
  - `scripts/build-wordlists.ts`
- Klassificering:
  - seed/override
- Bedömning:
  - bra kandidat för seed/override-lager
- Rekommenderad framtida plats:
  - `data/seed/word-filters/never-seed-sv.ts`
- Rekommenderad status:
  - `bara seed/test`

### `data/words/ordstorm-wordlists.ts`

- Innehåll:
  - runtime-wrapper som exporterar allowed/common samt väljer generated/manual seedlista
- Används idag av:
  - `lib/game/ordstorm.ts`
- Klassificering:
  - används direkt av spel
  - måste ersättas av Ordstorm-provider
- Bedömning:
  - detta är idag en speladapter, men den ligger fel i `data/`
- Rekommenderad framtida plats:
  - `lib/games/ordstorm/word-provider.ts`
- Rekommenderad status:
  - `används direkt av spel och därför måste ersättas av DB-provider`

### `data/words/preferred-seed-sv.ts`

- Innehåll:
  - manuell prioriteringslista för seedord
- Används idag av:
  - `scripts/build-wordlists.ts`
- Klassificering:
  - seed/override
- Bedömning:
  - inte runtime-speldata
  - behåll som kurateringsinput tills DB-stöd finns
- Rekommenderad framtida plats:
  - `data/seed/word-filters/preferred-seed-sv.ts`
- Rekommenderad status:
  - `bara seed/test`

### `data/words/seed-words-sv.ts`

- Innehåll:
  - manuell fallbacklista för Ordstorm-seedord
- Används idag av:
  - `data/words/ordstorm-wordlists.ts`
- Klassificering:
  - runtime-fallback idag
  - legacy/bootstrap
- Bedömning:
  - bör inte fortsätta vara spelkälla på sikt
  - kan användas som bootstrap-seed till DB eller provider
- Rekommenderad framtida plats:
  - `data/legacy/words/seed-words-sv.ts`
  - alternativt `data/seed/bootstrap/seed-words-sv.ts`
- Rekommenderad status:
  - `legacy och kan fasas ut`

## Mapprekommendation per fil

| Nuvarande fil                               | Rekommenderad plats                                                               | Roll framåt           |
| ------------------------------------------- | --------------------------------------------------------------------------------- | --------------------- |
| `data/dagens-ord/solution-words.ts`         | `data/sources/curated/dagens-ord-solution-words.ts`                               | importkälla till DB   |
| `data/generated/allowed-sv.generated.ts`    | `data/legacy/generated/allowed-sv.generated.ts`                                   | legacy/build artifact |
| `data/generated/common-sv.generated.ts`     | `data/legacy/generated/common-sv.generated.ts`                                    | legacy/build artifact |
| `data/generated/seed-words-sv.generated.ts` | `data/legacy/generated/seed-words-sv.generated.ts`                                | legacy/build artifact |
| `data/raw/hunspell-sv/sv_SE.dic`            | `data/sources/raw/hunspell/sv_SE.dic`                                             | importkälla           |
| `data/raw/kelly/Swedish-Kelly_M3_CEFR.csv`  | `data/sources/raw/kelly/Swedish-Kelly_M3_CEFR.csv`                                | importkälla           |
| `data/raw/kelly/Swedish-Kelly_M3_CEFR.xls`  | `data/sources/raw/kelly/Swedish-Kelly_M3_CEFR.xls`                                | backup/reference      |
| `data/stegvis/puzzles.ts`                   | `data/sources/curated/stegvis-puzzles.ts`                                         | importkälla till DB   |
| `data/words/allowed-abbrev-sv.ts`           | `data/seed/word-filters/allowed-abbrev-sv.ts`                                     | seed/override         |
| `data/words/allowed-sv.ts`                  | `data/legacy/words/allowed-sv.ts`                                                 | legacy fallback       |
| `data/words/common-sv.ts`                   | `data/legacy/words/common-sv.ts`                                                  | legacy fallback       |
| `data/words/index.ts`                       | `lib/words/*-provider.ts`                                                         | flyttas ut ur `data`  |
| `data/words/never-allow-sv.ts`              | `data/seed/word-filters/never-allow-sv.ts`                                        | seed/override         |
| `data/words/never-seed-sv.ts`               | `data/seed/word-filters/never-seed-sv.ts`                                         | seed/override         |
| `data/words/ordstorm-wordlists.ts`          | `lib/games/ordstorm/word-provider.ts`                                             | spelprovider          |
| `data/words/preferred-seed-sv.ts`           | `data/seed/word-filters/preferred-seed-sv.ts`                                     | seed/override         |
| `data/words/seed-words-sv.ts`               | `data/legacy/words/seed-words-sv.ts` eller `data/seed/bootstrap/seed-words-sv.ts` | bootstrap/legacy      |

## Rekommenderade nya runtime-gränser

### `lib/words`

Skapa ett neutralt ordlager som ersätter `data/words/index.ts`.

Föreslagna filer:

- `lib/words/allowed-word-provider.ts`
- `lib/words/common-word-provider.ts`
- `lib/words/seed-word-provider.ts`
- `lib/words/types.ts`

Ansvar:

- välja DB eller fallback-källa
- exponera ordlistor till spel utan att spel känner till `data/`
- kapsla fallback under migration

### `lib/games/dagens-ord/rules.ts`

Hit bör ren spelregel-logik flytta från dagens blandning mellan spel och data.

Separat provider:

- `lib/games/dagens-ord/word-provider.ts`

Ansvar:

- hämta dagens publicerade ord
- hämta allowed lexikon

### `lib/games/ordstorm/rules.ts`

Separat provider:

- `lib/games/ordstorm/word-provider.ts`

Ansvar:

- hämta seed-pool
- hämta allowed/common pool
- senare hämta Ordstorm-specifika profiler från DB

### `lib/games/stegvis/rules.ts`

Separat provider:

- `lib/games/stegvis/word-provider.ts`

Ansvar:

- hämta publicerade Stegvis-pussel
- hämta allowed ord och clue-data

## Prioriterad migreringsordning

1. Flytta ansvar från `data/words/index.ts` till `lib/words/*-provider.ts`
2. Flytta `data/words/ordstorm-wordlists.ts` till `lib/games/ordstorm/word-provider.ts`
3. Migrera `data/stegvis/puzzles.ts` till DB och låt Stegvis läsa via provider
4. Migrera `data/dagens-ord/solution-words.ts` till DB-driven daglig publicering
5. Flytta manuella filterfiler till `data/seed/word-filters`
6. Märk `data/generated/*` och manuella fallbacklistor som legacy under övergången

## Slutsats

Den viktigaste gränsdragningen framåt är:

- `data/` ska vara källor, seed och legacy
- `lib/` ska vara runtime
- spel ska inte läsa ordlistor direkt från `data/`

Idag är de största direkta runtime-beroendena som bör brytas först:

- `data/words/index.ts`
- `data/words/ordstorm-wordlists.ts`
- `data/stegvis/puzzles.ts`
- `data/dagens-ord/solution-words.ts`
