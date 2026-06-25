<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This project uses a newer Next.js version with breaking changes. Before making framework-level changes, read the relevant guide in `node_modules/next/dist/docs/` and check for deprecations.

<!-- END:nextjs-agent-rules -->

# Ordklubben Agent Guide

## Project Overview

Ordklubben is a Swedish word-game platform built as a focused, mobile-first web app.

Current product shape:

- four active DB-backed games: `Dagens Ord`, `Ordstorm`, `Stegvis`, `Ordfläta`
- test prototypes (`Emojirebus`, `Kastet`, `Skrapet`, `Bildjakten`) — outside the active architecture phase
- local-first state and lightweight architecture

Long-term vision:

- feel closer to a premium game magazine than a feature-heavy app
- ship a small set of sharp Swedish word games with strong game feel
- keep the product fast, calm, and easy to expand without backend complexity

Target audience:

- Swedish-speaking players who want quick, elegant word play
- mobile users first
- players who value clarity, pace, and polish over noisy game systems

Design inspiration:

- NYT Games structure and editorial clarity
- Swedish indie restraint
- soft typography, low-noise surfaces, and animation that supports gameplay

## Product Principles

Use these as default decision rules:

- gameplay beats technology choices
- gameplay beats feature count
- mobile experience beats desktop embellishment
- simplicity beats configurability
- polish beats breadth
- Swedish language quality is part of the product, not a data detail

When unsure:

- improve the core loop before adding adjacent systems
- prefer fewer, clearer UI elements
- keep interactions legible on a phone in one hand

Core loop rule:

Before adding a new feature, improve one of:

- word quality
- round quality
- game feel
- feedback
- replayability

A stronger core loop is preferred over a larger feature set.

## Current Priorities

Current priorities:

1. Improve Swedish word quality and the import/editorial pipeline around the database.
2. Improve mobile gameplay and interaction quality.
3. Improve Ordstorm game feel, feedback, and replayability.
4. Validate that players want “one more round”.

Do not prioritize right now:

- accounts
- social features
- additional games
- backend systems
- leaderboards

## Current Games

### Dagens Ord

Daily five-letter word game. Published via `GameEdition` + `GameEditionWord(SOLUTION)`.

### Stegvis

Daily word-chain game. Published via `GameEdition` + `START`/`STEP`/`TARGET` roles.

### Ordfläta

Daily crossword beta. Published via `GameEdition` → `metadata.puzzleId` → `Puzzle` grid.

### Ordstorm

Fast Swedish anagram game — **free play**, not daily.

Core rules:

- one round uses 6 letters
- one round lasts 60 seconds
- players submit Swedish words of 3 to 6 letters
- words must be buildable from the round letters
- each letter can only be used as many times as it appears
- scoring is length-based, with a bonus for 6-letter words
- duplicate finds are rejected
- unlimited rounds; seed chosen randomly per round from `GameWord` profiles

Word catalog comes from `Game` → `GameWord` → `Word`. No `GameEdition` in normal runtime.

Other routes such as `Ladder` and `Connections` are placeholders or concept space unless the user explicitly asks to work on them.

## Technical Architecture

Stack:

- Next.js App Router
- React + TypeScript
- Tailwind CSS v4
- Framer Motion
- shadcn/ui-style primitives

Runtime stack:

```text
Content Pipeline  →  Database  →  Content Layer  →  Game Provider  →  Game Rules  →  UI
```

Architecture shape:

- `app/` contains routes and page composition
- `components/games/` contains reusable game UI and HUD pieces
- `lib/games/` contains game-local rules and Game Providers
- `lib/game/` contains shared game helpers reused across games
- `lib/dictionary/` contains Swedish word rules, normalization, and import/editorial language tooling
- `lib/content/` and `lib/server/words/` form the **Content Layer** — runtime DB reads without game rules, UI, publication logic, generators, or `data/raw`
- `lib/storage/` contains browser persistence only
- `data/raw/` is a temporary import surface for external word sources — not runtime, not part of game data flow

Important boundaries:

- keep gameplay logic out of page files when possible
- keep dictionary rules reusable across future games
- keep storage concerns separate from game rules
- keep Content Layer separate from game-specific selection
- keep publication concerns in Game Providers, not in Content Layer or Game Rules
- runtime reads only from the database — never from `data/raw` or static word lists
- Content Pipeline (import, seed, admin, generators) writes to DB and is not called by runtime

## Data Model

Word quality matters. Treat the database model and Content Pipeline as product infrastructure.

### Database

End-to-end architecture starts in the database.

| Concept                | Meaning                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| `Word`                 | Lexical truth — the word record                                                                  |
| `Game`                 | The game (`slug`)                                                                                |
| `GameWord`             | How a specific game uses a word (`canBeGuess`, `canBeSeed`, `blocked`, `priority`, `difficulty`) |
| `GameEdition`          | Published content for games with published rounds                                                |
| `GameEditionWord`      | Word roles in an edition (`SOLUTION`, `START`, `STEP`, `TARGET`, …)                              |
| `Puzzle`               | Content/grid model (Ordfläta) — not the publication model                                        |
| `Language` / `Lexicon` | Lexical information (evolving)                                                                   |

### Content Pipeline

Everything that **produces content before runtime** and writes to the database.

Examples:

- `npm run import:words`
- `npm run seed:dagens-ord` · `seed:stegvis` · `seed:ordflata` · `seed:ordstorm`
- generators in `lib/content/`
- admin in `app/admin/`
- future automated jobs

Pipeline may read `data/raw` as an import source. Runtime never does.

### Content Layer

- lives in `lib/content/` and `lib/server/words/`
- reads words, hints, editions, profiles from DB
- no game UI, no game rules, no publication logic, no generators, no `data/raw`

### Game Providers

- `lib/games/<game>/word-provider.ts` or `content-provider.ts`
- build the right catalog or session per game

### Game Rules

- `lib/games/<game>/rules.ts`
- pure game logic, no DB, no `data/` imports

Dev seeds:

```bash
npm run seed:dagens-ord
npm run seed:stegvis
npm run seed:ordflata
npm run seed:ordstorm
```

Runtime rules:

- no active game route should read directly from `data/`
- all game content goes through DB-backed Game Providers
- Content Layer must not contain game-specific selection logic or create published content
- `rules.ts` must not read from `data/` or talk directly to the database
- Ordstorm free play uses `GameWord` — no `GameEdition` in normal runtime
- Ordfläta publication is via `GameEdition` → `Puzzle`; `Puzzle.status` does not drive runtime

Do not:

- download new lexical data automatically unless explicitly asked
- silently weaken Swedish normalization or filtering rules
- describe Hunspell, Kelly, CSV files, or other raw sources as runtime architecture
- add static word lists, generated files, or CSV build outputs as runtime dependencies
- use `GameEdition` for Ordstorm free play unless explicitly building a special-round feature
- treat placeholder word data as “good enough” for product decisions

## Local Storage

Stats are local-first and currently live in browser storage.

Assume:

- no account system
- no sync
- no server persistence

Rules:

- local storage failures must never crash rendering
- keep persistence defensive and optional
- do not add backend/state sync without explicit instruction

## Agent Guidelines

Prioritize:

- the player-facing game loop
- mobile interaction quality
- Swedish word quality
- small, testable logic changes
- architecture that keeps future games possible without major rewrites

Prefer:

- extending existing primitives over adding new frameworks
- local code paths over new services
- explicit game logic over abstract systems

Do not build without explicit instruction:

- authentication
- backend APIs
- multiplayer
- analytics platforms
- CMS integration
- feature flags
- database layers
- heavy global state management
- large visual redesigns

Avoid speculative platform work unless it directly improves current gameplay, the database-backed content model, or the Content Pipeline.

## Development Principles

- make small, incremental improvements
- verify changes with `npm run lint` and `npm run build`
- when working on word data, run `npm run import:words` against a dev database if relevant
- when working on game content, run the relevant `seed:*` script in dev
- avoid large refactors unless the user explicitly asks for one
- preserve working behavior while improving internals
- prefer reversible changes over sweeping rewrites

Before changing architecture:

- ask whether the change improves the current player experience
- ask whether a simpler local solution already fits the project
- ask whether the decision will still make sense when more games are added

## Writing And UI Tone

Default product tone:

- concise
- calm
- confident
- Swedish-first

Default UI direction:

- minimalist, warm, readable
- avoid clutter, gimmicks, and dashboard-style density
- animation should support feedback and rhythm, not decoration

If you add copy, keep it short and game-facing.
