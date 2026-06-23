<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This project uses a newer Next.js version with breaking changes. Before making framework-level changes, read the relevant guide in `node_modules/next/dist/docs/` and check for deprecations.

<!-- END:nextjs-agent-rules -->

# Ordklubben Agent Guide

## Project Overview

Ordklubben is a Swedish word-game platform built as a focused, mobile-first web app.

Current product shape:

- one active playable game in development: `Ordstorm`
- a small platform shell for future Swedish word games
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

1. Improve Swedish word quality and the wordlist pipeline.
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

### Ordstorm

Ordstorm is a fast Swedish anagram game.

Core rules:

- one round uses 6 letters
- one round lasts 60 seconds
- players submit Swedish words of 3 to 6 letters
- words must be buildable from the round letters
- each letter can only be used as many times as it appears
- scoring is length-based, with a bonus for 6-letter words
- duplicate finds are rejected

Design goals:

- instant readability
- high tempo without visual stress
- tactile, focused, game-first interaction
- clear feedback, minimal chrome

Other routes such as `Ladder` and `Connections` are placeholders or concept space unless the user explicitly asks to work on them.

## Technical Architecture

Stack:

- Next.js App Router
- React + TypeScript
- Tailwind CSS v4
- Framer Motion
- shadcn/ui-style primitives

Architecture shape:

- `app/` contains routes and page composition
- `components/games/` contains reusable game UI and HUD pieces
- `lib/games/` contains game-local rules and content providers
- `lib/game/` contains compatibility exports and shared legacy helpers during migration
- `lib/dictionary/` contains Swedish word rules, normalization, and wordlist tooling
- `lib/server/words/` contains DB-backed word access
- `lib/storage/` contains browser persistence only
- `data/` contains raw import sources, seed filters, and legacy migration artifacts

Important boundaries:

- keep gameplay logic out of page files when possible
- keep dictionary rules reusable across future games
- keep storage concerns separate from game rules
- avoid introducing backend assumptions into current game logic

## Wordlist System

Ord quality matters. Treat the word pipeline as product infrastructure.

Current model:

- active runtime words come from the database via `lib/server/words/`
- raw local source files live in `data/sources/raw/`
- curated import inputs live in `data/sources/curated/`
- seed and filter inputs live in `data/seed/`
- generated legacy artifacts live in `data/legacy/generated/`
- raw word import runs through `scripts/import-words.ts`

Source intent:

- Hunspell/SFOL style inputs support broad allowed-word coverage
- Kelly/Språkbanken style inputs support more common player-friendly words

Runtime rule:

- no active game route should read directly from `data/`
- all game word access should go through DB-backed providers
- legacy generated lists are migration support, not runtime fallback

Do not:

- download new lexical data automatically unless explicitly asked
- silently weaken Swedish normalization or filtering rules
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

Avoid speculative platform work unless it directly improves current gameplay or the word pipeline.

## Development Principles

- make small, incremental improvements
- verify changes with `npm run lint` and `npm run build`
- when working on word data, also run `npm run build:wordlists` if relevant
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
