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

All normalisering och validering går via `lib/dictionary/`:

- `normalize-swedish.ts`: trim, casing och stöd för svenska tecken
- `can-build-word.ts`: kontrollerar att ett ord faktiskt kan byggas av sexbokstavsrundan
- `validate-word.ts`: samlar Ordstorms ordregler i en ren, testbar funktion
- `letter-pool.ts`: bokstavsräkning och bokstavsblandning

När vi senare kopplar in större svensk orddata bör den hamna i `data/words/` eller genereras till samma arrayformat, så att spellogiken i `lib/dictionary/` och `lib/game/` kan vara oförändrad.

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

- koppla in större svensk orddata i `data/words/`
- lägga till seedad daily-logik ovanpå samma seed-words-struktur
- skapa gemensam statistikmodell för fler spel
- lägga till lättare ljud eller haptik för ännu skarpare mobil feedback
