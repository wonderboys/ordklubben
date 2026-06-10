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

## Contentdatabas

Första versionen av contentdatabasen använder Prisma + Postgres och innehåller:

- `Word` för ord
- `Hint` för teknisk hintmodell, som i UI visas som `Nyckel`
- `HintCandidate` för föreslagna nycklar som granskas innan de blir riktiga nycklar
- `Theme` och `WordTheme` för teman
- `ImportBatch` för enkel importspårning

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

Adminvyer:

- `/admin/words`
- `/admin/words/new`
- `/admin/words/[id]`
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
