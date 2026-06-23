# WORD_DATA_STRUCTURE

Senast uppdaterad: 2026-06-23

Det här dokumentet beskriver den DB-first modellen för orddata och råkällor i Ordklubben.

## Mål

- spel ska inte läsa från `data/*` i runtime
- `data/` ska bara innehålla externa råkällor och små manuella importregler
- import ska skriva till Postgres, inte till statiska ordlistor i repo:t
- samma ord ska kunna komma från flera källor utan att manuellt kuraterat innehåll skrivs över

## `data/`-struktur

```
data/
  raw/
    hunspell/
      sv_SE.dic
    kelly/
      Swedish-Kelly_M3_CEFR.csv
  seed/
    word-filters/
      allowed-abbrev-sv.ts
      never-allow-sv.ts
      never-seed-sv.ts
      preferred-seed-sv.ts
```

Det finns inga generated-filer, ingen `legacy/`, ingen `sources/`, inga kuraterade TS-listor och inga CSV-builds under `data/`.

## Runtime

Aktiv runtime läser från databasen via:

- `lib/server/words/`
- `lib/games/<game>/word-provider.ts` eller `content-provider.ts`

Ingen spelroute importerar från `data/`.

## Import

Aktivt importspår: `scripts/import-words.ts` (`npm run import:words`).

Scriptet:

- läser `data/raw/hunspell/*.dic` och `data/raw/kelly/*.csv`
- tillämpar `data/seed/word-filters/never-allow-sv.ts`
- skriver till Postgres (`Word`, `WordSourceRecord`, `ImportBatch`)
- stödjer `--source=all|hunspell|kelly` och `--mode=insert-missing|merge-safe|refresh-source-metadata`

Övriga filterfiler under `data/seed/word-filters/` finns kvar som manuella importregler och kan kopplas in i importscriptet vid behov.

## Datamodell

1. `Word` — canonical, spelbar vy
2. `WordSourceRecord` — provenance per källa/import
3. `WordEditorialOverride` — manuella redaktionella beslut

Importer ska upserta `Word` på `normalizedAnswer`, skapa/uppdatera källposter och reconciliara canonical fält via `resolveCanonicalWord`.

Rekommenderat default-läge: `merge-safe`.

## Speldata

Dagens Ord, Stegvis, Ordstorm och övriga spel hämtar ord och spelinnehåll från databasen — inte från filer under `data/`.
