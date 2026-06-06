# Ordklubben

Ordklubben är en liten webbaserad svensk spelplattform byggd för flera framtida ordspel, med första fokus på `Ordstorm`, ett snabbt anagramliknande spel inspirerat av Anagram Race.

Målet med projektet:

- kännas snabbt, intelligent och polerat
- vara mobil-först
- vara enkelt att expandera med fler spel utan tung state management eller backend

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui-grundstruktur
- Framer Motion

## Spelstruktur

```text
app/
  (games)/
    connections/
    daily/
    ladder/
    ordstorm/
  profile/
  stats/
components/
  games/
  layout/
  ui/
data/
  generated/
    allowed-sv.generated.ts
    common-sv.generated.ts
    seed-words-sv.generated.ts
  raw/
    hunspell-sv/
    kelly/
  words/
    allowed-sv.ts
    common-sv.ts
    seed-words-sv.ts
hooks/
  use-ordstorm-stats.ts
lib/
  dictionary/
  game/
  storage/
```

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

## Ordlistor

Ordstorm använder tre separata ordfiler:

- `data/words/seed-words-sv.ts`: sexbokstavsord som används för att skapa rundans bokstäver
- `data/words/common-sv.ts`: vanliga svenska ord som flera framtida spel kan återanvända
- `data/words/allowed-sv.ts`: extra godkända ord som breddar spelbarheten

Den långsiktiga pipelinen använder i stället genererade listor i `data/generated/`:

- `allowed-sv.generated.ts`: maskinbyggd allowed-lista för Ordstorm
- `common-sv.generated.ts`: maskinbyggd lista med vanligare svenska ord
- `seed-words-sv.generated.ts`: sexbokstavsord prioriterade för spelbarhet

Runtime-fallback:

- Om en generated-lista är tom används nuvarande manuella listor i `data/words/`
- Det gör att appen fortsätter fungera innan rådata lagts in eller scriptet körts

All normalisering och validering går via `lib/dictionary/`:

- `normalize-swedish.ts`: trim, casing och stöd för svenska tecken
- `can-build-word.ts`: kontrollerar att ett ord faktiskt kan byggas av sexbokstavsrundan
- `validate-word.ts`: samlar Ordstorms ordregler i en ren, testbar funktion
- `letter-pool.ts`: bokstavsräkning och bokstavsblandning
- `word-filters.ts`: filterregler för importerade ordlistor
- `wordlist-types.ts`: typer för pipeline, rapport och seed-kandidater

## Orddatapipeline

Rådata läggs lokalt i:

- `data/raw/hunspell-sv/`
- `data/raw/kelly/`

Stödda källor:

- Hunspell/SFOL för `allowed`-ord
- Kelly-listan eller annan Språkbanken-export för `common`-ord

Stödda filformat:

- Hunspell `.dic`
- enkel `.txt`
- enkel `.csv`

Script:

```bash
npm run build:wordlists
```

Scriptet:

- läser lokala råfiler från `data/raw/`
- normaliserar svenska ord till lowercase
- stödjer `å`, `ä`, `ö`
- filtrerar bort siffror, bindestreck, specialtecken och för korta ord
- försöker filtrera bort namn/proper nouns
- filtrerar bort störande tekniska/organisatoriska förkortningar från `allowed` (t.ex. `dns`, `nsa`, `ssl`) med ett konservativt mönsterfilter ankrat i Kelly och en manuell allowlist i `data/words/allowed-abbrev-sv.ts`
- bygger `allowed`, `common` och spelbara `seed`-ord
- skriver resultat till `data/generated/`
- skriver en rapport i terminalen med volymer, topp-seeds och filtrerade exempel

Seed-regler i pipelinen:

- exakt 6 bokstäver
- prioriteras från `common`-listan
- minst 15 byggbara Ordstorm-ord
- sorteras efter spelbarhet
- placeholder-liknande ord undviks
- verb-liknande former nedprioriteras

Allowed abbreviation filter:

- gäller bara korta `allowed`-ord (3–5 bokstäver)
- behåller ord som finns i Kelly, innehåller `å`/`ä`/`ö`, eller finns i `allowed-abbrev-sv.ts`
- filtrerar annars bort Hunspell-only-förkortningar som matchar konsonantblock eller org-/akronymmönster
- syftet är att minska brus från tekniska akronymer i Ordstorm utan att ta bort vanliga svenska kortord

Seed quality notes:

- `allowed`-listan får vara relativt generös för att bredda spelbarheten
- `seed`-listan ska vara striktare och kännas mer kurerad
- dåliga seed-ord kan blockeras manuellt i `data/words/never-seed-sv.ts`
- bra seed-ord kan prioriteras manuellt i `data/words/preferred-seed-sv.ts`
- oönskade allowed-ord kan blockeras manuellt i `data/words/never-allow-sv.ts`

## Källor Och Licens

- Rådata laddas inte ner automatiskt av projektet
- Du ansvarar själv för att lägga rätt filer i `data/raw/`
- Kontrollera licensvillkor för Hunspell/SFOL, Kelly-listan och eventuella Språkbanken-exporter innan du distribuerar rådata eller genererade listor
- README:n och scriptet dokumenterar källorna, men bundlar ingen extern orddatabas

## Lokalt utvecklingsflöde

```bash
npm install
npm run dev
```

Öppna sedan [http://localhost:3000](http://localhost:3000).

## Arkitekturprinciper

- `app/(games)` innehåller spelrutter och kan växa utan att påverka övriga sidor.
- `components/games` innehåller återanvändbara HUD- och interaktionskomponenter för flera spel.
- `lib/dictionary` kapslar svenska ordregler och bokstavslogik så att flera framtida spel kan dela samma motor.
- `lib/game` håller ren spelogik som kan återanvändas och testas separat.
- `lib/storage` kapslar browser-lagrad statistik så att vi senare kan byta till API eller sync utan att röra spellagret.

## Nästa steg

- lägga in riktiga Hunspell- och Kelly-filer i `data/raw/`
- köra `npm run build:wordlists` och granska seed-rapporten
- lägga till seedad daily-logik ovanpå samma seed-words-struktur
- skapa gemensam statistikmodell för fler spel
- lägga till lättare ljud eller haptik för ännu skarpare mobil feedback
