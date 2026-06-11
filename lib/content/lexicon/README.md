# Lexikon

Lexikondata beskriver ett ords betydelse, relationer och språkliga egenskaper.
Det är **inte** samma sak som spelnycklar (Hints).

## Målbild

```
Word
  ├─ Themes
  ├─ Hints          (spelbara ledtrådar)
  └─ Lexicon        (WordLexicalEntry[])
```

```
Lexicon
  ├─ Definitions
  ├─ Synonyms
  ├─ Antonyms
  ├─ Expressions
  └─ Related words
```

Ordklass (`Word.partOfSpeech`) ligger på ordet — inte som lexikal post.

## Källor

Generiska källor på `Word` och `WordLexicalEntry`:

- `manual`, `import`, `ai`, `saol`, `saldo`, `synlex`, `system`

Exakt importfil eller dataset lagras i `sourceReference`, t.ex.:

- `source = import`
- `sourceReference = stegvis_seed_4bokstavsord.csv`

## Framtida ordkopplingar

`WordLexicalEntry.linkedWordId` förbereder koppling till andra `Word`-rader.

Exempel: synonym-posten `gångart` kan senare peka på ordet `GÅNGART`
utan att kräva fri text.

## AI

Framtida nyckelgenerering ska kunna använda lexikondata som kontext —
definitioner, synonymer och uttryck — utan att blanda ihop dem med Hint-förslag.

## Import (v1)

Separat pipeline: `lib/content/import-lexicon.ts` (frikopplad från ord-/nyckelimport).

CSV-kolumner:

`word`, `type`, `value`, `source`, `sourceReference`, `notes`

Regler:

- Ordet måste finnas i ordbanken (`word` matchas via normaliserat svar)
- Inga nya `Word` eller `Hint` skapas
- Unik kombination: `wordId` + `type` + `value` (idempotent)
- `linkedWordId` sätts alltid till `null` i v1
