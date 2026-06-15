# Print Theme — migreringsplan

_Audit av kodbasen per juni 2026. Print Theme är officiell design foundation. Legacy-systemet ska fasas ut utan parallella lager._

**Steg 1 genomfört (jun 2026):** se avsnitt [Steg 1 — genomfört](#steg-1--genomfört-jun-2026) längst ned.

**Steg 2A genomfört (jun 2026):** se avsnitt [Steg 2A — genomfört](#steg-2a--genomfört-jun-2026) längst ned.

**Steg 2B genomfört (jun 2026):** se avsnitt [Steg 2B — genomfört](#steg-2b--genomfört-jun-2026) längst ned.

**Steg 2C (jun 2026):** analys och implementationsplan — se avsnitt [Steg 2C — implementationsplan](#steg-2c--implementationsplan-analys-jun-2026). **PR 1** och **PR 2** genomförda — se [PR 1](#steg-2c-pr-1--genomfört-jun-2026) och [PR 2](#steg-2c-pr-2--genomfört-jun-2026).

**Scope:** `app/`, `components/`, `app/globals.css`  
**Metod:** statisk genomgång av tokens, utilities, komponenter och `max-md:` / `sm:`-mönster  
**Ingen kod ändrad i detta pass** — endast plan.

Relaterad dokumentation: [`design-foundation.md`](./design-foundation.md) (implementerad Print Theme foundation).

---

## Sammanfattning

Kodbasen kör **två parallella designsystem**:

| Lager                       | Aktivering                                                  | Typografi               | Radius                    | Skuggor                     | Grön accent |
| --------------------------- | ----------------------------------------------------------- | ----------------------- | ------------------------- | --------------------------- | ----------- |
| **Print Theme** (officiell) | `PrintMobileShell`, `.print-theme`, `printStyle`, `max-md:` | Geist Sans / Mono       | `0`                       | Offset (`--print-shadow-*`) | `#00916e`   |
| **Legacy** (deprecated)     | Default utan print-shell; allt `sm:` och uppåt              | Manrope / IBM Plex Mono | `rounded-full`, `1.75rem` | Blur (`--shadow`)           | `#1f6f5f`   |

**Huvudproblem:** samma komponent bär ofta båda systemen via `max-md:` (print) + `sm:` (legacy). Det ger ~130+ `max-md:`- och ~70+ `sm:`-override i spel- och plattformskomponenter.

**Målbild:** ett token-lager, en typografisk skala, en komponent-API (inga `printStyle`-props), inga parallella färgnamn (`accent` vs `print-green`).

---

## 1. Legacy design tokens

### Färg- och yttokens (`app/globals.css` `:root`)

| Token                               | Värde                 | Status                | Var det används                                                               |
| ----------------------------------- | --------------------- | --------------------- | ----------------------------------------------------------------------------- |
| `--background` / `--canvas`         | `#f5f1e8`             | Aktiv (legacy)        | `body`-gradient, `bg-canvas`, `text-canvas` på knappar                        |
| `--foreground` / `--ink`            | `#18261f`             | Aktiv (legacy)        | `text-ink`, desktop rubriker (`sm:text-ink`)                                  |
| `--surface`                         | `#fbf8f2`             | Aktiv (legacy)        | `shell-card`, knappar, timer, ordstorm-ytor                                   |
| `--surface-strong`                  | `#f0ebe2`             | Aktiv (legacy)        | Chips, progress bars, resultatpaneler                                         |
| `--line`                            | `rgba(24,38,31,0.12)` | Aktiv (legacy)        | Kantlinjer desktop (`border-line`)                                            |
| `--muted`                           | `#607066`             | Aktiv (legacy)        | `text-muted` — desktop + dolda `md:`-block i Ordstorm                         |
| `--accent`                          | `#1f6f5f`             | Aktiv (legacy)        | Knapp `variant="accent"`, timer progress, letter tiles, stat-box `sm:`        |
| `--accent-strong` / `--accent-soft` | `#165447` / `#d4e9e5` | Aktiv (legacy)        | Badges, chips, ghost-hover, letter tile states                                |
| `--danger` / `--success`            | `#b54f3a` / `#1d8a64` | Aktiv (legacy)        | Timer urgent, feedback, letter tile success                                   |
| `--shadow`                          | blur `0 12px 40px …`  | Aktiv (legacy)        | `shell-card`, stat-box/kort `sm:shadow-[var(--shadow)]`                       |
| `--highlight`                       | `#f7c948`             | **Oanvänd som token** | Endast registrerad i `@theme`; layout använder hårdkodad `rgba(247,201,72,…)` |

**Ersättbarhet:** legacy-färger kan mappas 1:1 till print-semantik _efter_ desktopbeslut — men idag är värdena **inte identiska** (särskilt grön, muted, danger/success). Direkt alias räcker inte; kräver medveten harmonisering eller att legacy helt ersätts av print-paletten.

### Print tokens (`--print-*`)

| Token                           | Användning             | Ersätt legacy?                                                      |
| ------------------------------- | ---------------------- | ------------------------------------------------------------------- |
| `--print-background`            | Raster, sekundära ytor | Ja → ersätter `--canvas`/`--background`                             |
| `--print-surface`               | Kort, input, timer     | Ja → ersätter `--surface` (vit vs varm off-white)                   |
| `--print-ink` / `--print-muted` | Text                   | Ja → ersätter `--foreground`/`--muted` (muted används inkonsekvent) |
| `--print-accent-green` (+ soft) | CTA, positiv feedback  | Ja → ersätter `--accent*`                                           |
| `--print-accent-red`            | Fel, urgent            | Ja → ersätter `--danger`                                            |
| `--print-shadow-*`              | Knappar, tiles         | Ja → ersätter `--shadow`                                            |
| `--print-raster-*`              | Bakgrund               | Print-specifik — behåll                                             |

**Hårdkodade värden utan token** (bör bli tokens):

| Värde                           | Fil(er)                                | Ersättning                                     |
| ------------------------------- | -------------------------------------- | ---------------------------------------------- |
| `#f2efe8`                       | `main-nav.tsx` (×2)                    | `bg-print-bg` (samma som `--print-background`) |
| `#fce8e8`, `#f8e8e3`, `#faf0eb` | `ordstorm-game.tsx`                    | `--print-red-soft` (ny token)                  |
| `#e2f5ee`, `#dcefe8`            | `ordstorm-game.tsx`, `letter-tile.tsx` | `--print-green-soft` (finns)                   |
| `#24352d`, `#101914`, `#0f4338` | `button.tsx` hover/active              | print-ink derivat eller `--print-ink-hover`    |
| `rgba(212,233,229,0.9)`         | `layout.tsx` `site-top-glow`           | Ta bort eller print-raster                     |
| `rgba(247,201,72,0.12)`         | `layout.tsx` bottom glow               | Ta bort (legacy dekoration)                    |

---

## 2. Legacy typografi

| System            | Källa                                    | Användning                                 |
| ----------------- | ---------------------------------------- | ------------------------------------------ |
| **Manrope**       | `app/layout.tsx` → `--font-sans`         | `body`, all desktop UI                     |
| **IBM Plex Mono** | `app/layout.tsx` → `--font-mono`         | Fallback i `print-mono`                    |
| **Geist Sans**    | `PrintMobileShell` → `--font-geist-sans` | Mobil inom `.print-theme`, `.print-button` |
| **Geist Mono**    | Root + shell → `--font-geist-mono`       | Logo, stat-box, `print-mono`, `print-pill` |

**Legacy typografiska mönster (upprepade inline-klasser):**

| Mönster         | Typisk klass                                                                    | Filer                                                         |
| --------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Desktop H1      | `sm:text-4xl sm:font-semibold sm:normal-case sm:tracking-[-0.06em] sm:text-ink` | `page.tsx`, `game-shell.tsx`, `profile`, stats                |
| Legacy metadata | `text-xs uppercase tracking-[0.16em] text-muted`                                | `score.tsx`, `timer.tsx`, `ordstorm-game.tsx` (desktop/`md:`) |
| Legacy brödtext | `fine-text` / `sm:text-muted`                                                   | Plattform + stats                                             |
| Print rubrik    | `text-2xl font-black uppercase tracking-[0.02em] text-print-ink`                | Mobil — duplicerad i många filer                              |

**Utilities:**

| Utility                           | Roll                    | Legacy?                         | Används i                                                     |
| --------------------------------- | ----------------------- | ------------------------------- | ------------------------------------------------------------- |
| `fine-text`                       | `text-sm text-muted`    | Ja                              | `page.tsx`, `game-card`, `profile`, `coming-soon-game`, stats |
| `section-title`                   | Desktop semibold rubrik | Ja (overridas i `.print-theme`) | `page.tsx`, `coming-soon-game`, stats `sm:`                   |
| `print-text` / `print-body`       | Print brödtext          | Print                           | Plattform, Ordstorm                                           |
| `print-mono`                      | Metadata                | Print                           | Timer, stats, Ordstorm labels                                 |
| `print-black`                     | Black uppercase         | Print                           | Letter tiles                                                  |
| `print-heading`                   | Definierad i CSS        | Print                           | **Oanvänd i TSX**                                             |
| `print-pill` / `print-pill-green` | Badges                  | Print                           | `badge.tsx` via `printStyle`                                  |

**Ersättbarhet:** `fine-text` + `section-title` kan slås ihop till print-utilities _efter_ att desktop också kör print-typografi. Direkt ersättning på mobil är redan delvis gjord via `.print-theme`-overrides — det är ett tecken på att legacy-utilities bör depreceras, inte utökas.

---

## 3. Legacy komponentvarianter

### `Button` (`components/ui/button.tsx`)

| Aspekt     | Legacy (default)      | Print (via `printStyle` + `max-md:`)   |
| ---------- | --------------------- | -------------------------------------- |
| Form       | `rounded-full`        | `rounded-none`, offset shadow          |
| Typografi  | `font-semibold`       | `.print-button` → Black 14px uppercase |
| Variants   | `accent` = `--accent` | `max-md:bg-print-green`                |
| Focus ring | `ring-accent/40`      | Oförändrat (legacy färg)               |

**Anrop med `printStyle`:** `page.tsx`, `ordstorm-game.tsx`, `ordstorm-stats-view.tsx`, `ordstorm-stats-preview.tsx`, `timer.tsx` (indirekt).

**Anrop utan `printStyle` (ren legacy):** `keyboard.tsx` (desktop-only i Ordstorm), vissa ghost-knappar `md:` i Ordstorm.

### `Badge` (`components/ui/badge.tsx`)

| Legacy                                           | Print                                    |
| ------------------------------------------------ | ---------------------------------------- |
| `rounded-full bg-accent-soft text-accent-strong` | `max-md:print-pill` / `print-pill-green` |

**Anrop:** `printStyle` på startsida, game cards; utan på `game-shell` desktop eyebrow (`hidden sm:inline-flex`).

### `Card` (`components/ui/card.tsx`)

Alltid `shell-card` (legacy rounded + blur shadow). Print override sker via:

1. `.print-theme .shell-card` i CSS (mobil)
2. Per-komponent `max-md:`-klasser (ordstorm, game-card)

### Spelkomponenter med dual styling

| Komponent                | Legacy                                | Print-bridge                                       | Notering             |
| ------------------------ | ------------------------------------- | -------------------------------------------------- | -------------------- |
| `LetterTile`             | `stateClasses` + blur shadow          | `mobileGame` + `max-md:`                           | 6 states × 2 system  |
| `Timer`                  | `shell-card`, `rounded-full` progress | `printStyle` prop                                  | Komplex              |
| `Score`                  | Ren legacy                            | Ingen print — **dold på mobil** (`hidden md:grid`) | Migreras med desktop |
| `Keyboard`               | Ren legacy                            | **Endast `md:block`**                              | Migreras med desktop |
| `OrdstormStatBox`        | `sm:rounded-[1.75rem] sm:bg-surface`  | Print default + `sm:` legacy                       | Tydlig split         |
| `GameShell` / `GameCard` | `sm:` typography + badge              | `max-md:` print                                    | Plattformsmönster    |

---

## 4. Legacy utility-klasser och layout-dekoration

| Klass / mönster                                      | Typ                     | Användning                             | Migrering                                          |
| ---------------------------------------------------- | ----------------------- | -------------------------------------- | -------------------------------------------------- |
| `shell-card`                                         | Utility                 | Card, Timer, Keyboard, ordstorm inline | → print surface (radius 0, ingen container-shadow) |
| `rounded-[1.75rem]` / `rounded-2xl` / `rounded-full` | Radius                  | Överallt desktop                       | → `0` eller `--print-radius`                       |
| `shadow-[var(--shadow)]`                             | Skugga                  | Kort desktop                           | → ta bort på containers; offset på interaktiva     |
| `site-top-glow`                                      | Layout                  | `layout.tsx`; dold på mobil print      | → ta bort helt vid print-global                    |
| `bg-canvas text-ink`                                 | Body                    | Root layout                            | → `bg-print-bg text-print-ink` + raster            |
| `max-md:` + `printStyle`                             | Bridge                  | 15+ filer                              | → ta bort när print är default                     |
| `sm:` / `md:` legacy revert                          | Bridge                  | Alla huvudvyer                         | → ta bort efter desktop-migration                  |
| `border-border/70`                                   | Odefinierad shadcn-rest | `ordstorm-game.tsx` (1 st)             | → `border-print-ink/20`                            |

### Print utilities — användning

| Utility                          | Används                          | Oanvänd / redundant                              |
| -------------------------------- | -------------------------------- | ------------------------------------------------ |
| `print-raster-bg`                | `PrintMobileShell`               | —                                                |
| `print-pill`, `print-pill-green` | `Badge`                          | `print-pill-red` (**saknas**)                    |
| `print-shadow-soft/strong`       | Letter tile, button (inline var) | `print-shadow` (generisk utility)                |
| `print-surface`                  | Indirekt via klasser             | `@utility print-surface` sällan refererad direkt |
| `print-outline`                  | —                                | **Oanvänd**                                      |
| `print-heading`                  | —                                | **Oanvänd**                                      |

### Breakpoint-inkonsistens

| Mekanism                        | Värde                                 |
| ------------------------------- | ------------------------------------- |
| CSS `@media (max-width: 767px)` | `.print-theme`-overrides, body raster |
| Tailwind `max-md:`              | `48rem` = 768px                       |

**Risk:** 1px glapp vid 768px. Kräver migrering till en gemensam breakpoint-variabel.

---

## 5. Routöversikt — vad kör vilket system?

| Route                               | PrintMobileShell  | Desktop legacy                   |
| ----------------------------------- | ----------------- | -------------------------------- |
| `/`                                 | Ja                | `sm:` hero + kort                |
| `/profile`                          | Ja                | `sm:` profil                     |
| `/ordstorm`                         | Ja                | Grid, Score, Keyboard, md:-block |
| `/ordstorm/stats`                   | Ja                | Stat-box `sm:`                   |
| `/ladder`, `/connections`, `/daily` | Ja                | `GameShell` + Card               |
| Header (`MainNav`)                  | Print-färger/typo | Hårdkodad bakgrund               |

**Globalt utanför shell:** `app/layout.tsx` body, glows, Manrope — alltid legacy tills root migreras.

---

# Leverans

## Kan tas bort nu

Säkert att rensa **utan visuell påverkan** (död kod):

| Objekt                              | Plats                  | Motivering                              |
| ----------------------------------- | ---------------------- | --------------------------------------- |
| `@utility print-heading`            | `globals.css`          | Inga referenser i TSX/CSS               |
| `@utility print-outline`            | `globals.css`          | Inga referenser                         |
| `@utility print-shadow` (generisk)  | `globals.css`          | Endast `-soft`/`-strong` används        |
| `--radius-card: 1.75rem`            | `globals.css` `@theme` | Ingen `rounded-card`-användning         |
| `--highlight` / `--color-highlight` | `globals.css`          | Token används aldrig; glow är hårdkodad |

**Kan tas bort efter minimal verifiering** (1 fil, låg risk):

| Objekt                                     | Plats                        | Motivering                                     |
| ------------------------------------------ | ---------------------------- | ---------------------------------------------- |
| Bottom radial glow                         | `app/layout.tsx`             | Legacy dekoration; print använder raster       |
| `site-top-glow` + CSS-regel som döljer den | `layout.tsx` + `globals.css` | Redan dold på print-mobil; print-global → bort |

**Inte säkert att ta bort än:**

- Manrope / IBM Plex (desktop aktivt)
- Legacy `:root`-tokens (desktop + `sm:` överallt)
- `printStyle`-prop (aktiv bridge)
- `PrintMobileShell` (aktiverar print på alla huvudroutes)
- `fine-text`, `section-title`, `shell-card` (aktivt använda)
- `Score`, `Keyboard` (desktop Ordstorm)

---

## Bör migreras

Prioriterad lista — fortfarande i bruk men ska flyttas till Print Theme.

### Färgsystem

| Nu                            | Var                                | Åtgärd                                                           | Svårighet                |
| ----------------------------- | ---------------------------------- | ---------------------------------------------------------------- | ------------------------ |
| `--accent` / `--accent-soft`  | Button, Badge, Timer, tiles, chips | Ersätt med `--print-accent-green` (+ soft)                       | Medel — desktop påverkas |
| `--danger` / `--success`      | Timer, feedback, tiles             | Ersätt med `--print-red` / print-green                           | Medel                    |
| `--muted` + `text-muted`      | 20+ ställen                        | En policy: print-ink överallt _eller_ `--print-muted` konsekvent | Låg–medel                |
| `text-print-muted` i Ordstorm | `ordstorm-game.tsx`, `letter-tile` | Alignera med plattform (ink) eller dokumentera undantag          | Låg                      |
| `#f2efe8` hårdkodad           | `main-nav.tsx`                     | `bg-print-bg`                                                    | **Direkt**               |
| Feedback-hex                  | `ordstorm-game.tsx`                | Nya tokens `--print-red-soft`, ev. `--print-red-muted`           | Medel                    |
| `border-border/70`            | `ordstorm-game.tsx`                | Print border scale                                               | **Direkt**               |

### Typografisystem

| Nu                                             | Var                            | Åtgärd                                                                                   |
| ---------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------- |
| Manrope body                                   | `layout.tsx`                   | Geist Sans i root; ta bort Manrope                                                       |
| IBM Plex Mono                                  | `layout.tsx`                   | Geist Mono enda mono                                                                     |
| Duplicerade H1-klasser                         | 5+ filer                       | En `Heading`/`PageTitle`-komponent eller `print-heading` utility (återinför, men använd) |
| `fine-text` / `section-title`                  | Plattform                      | Deprecera → `print-text` + en rubrik-utility                                             |
| `sm:text-muted` på brödtext                    | `game-shell`, stats, profile   | Print brödtext (ink)                                                                     |
| Legacy metadata `tracking-[0.16em] text-muted` | Score, Timer, Ordstorm desktop | `print-mono`                                                                             |

### Komponentsystem

| Nu                                                   | Var                       | Åtgärd                                           |
| ---------------------------------------------------- | ------------------------- | ------------------------------------------------ |
| `printStyle` prop                                    | Button, Badge, Timer      | Print som default; ta bort prop                  |
| `shell-card` legacy definition                       | `globals.css`, Card       | Print surface som default (radius 0, ingen blur) |
| `rounded-full` button/badge base                     | `button.tsx`, `badge.tsx` | Radius 0, print variants                         |
| Dual `max-md:` / `sm:` i varje fil                   | 15 filer                  | En klassuppsättning                              |
| `OrdstormStatBox` split                              | stat-box                  | En variant; highlight = print-green              |
| `LetterTile` dual `stateClasses`                     | letter-tile               | En state-map med print tokens                    |
| `GameCard` `text-accent` → `max-md:text-print-green` | game-card                 | En färg-klass                                    |

### Knappsystem

| Nu                                    | Problem                                 | Mål                                                                     |
| ------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| 4 CVA variants × print overlay        | 8 visuella lägen                        | 4 print-native variants: `primary`, `secondary`, `ghost`, `destructive` |
| `.print-button` endast i CSS `@media` | Bryter utanför `.print-theme`           | Komponent-default eller global button utility                           |
| Keyboard-knappar                      | Egna `rounded-2xl`-klasser, ingen print | Samma Button-komponent                                                  |

### Layout

| Nu                           | Åtgärd                                  |
| ---------------------------- | --------------------------------------- |
| `PrintMobileShell` per route | Flytta `print-theme` till root/`main`   |
| Body legacy gradient         | Print raster globalt                    |
| `@media 767px` vs `max-md`   | En `--breakpoint-print` / Tailwind sync |

---

## Behåll tills vidare

Tills motsvarande print-ersättning finns på **alla** breakpoints:

| Objekt                                                                                           | Varför                                                                        |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `--print-*` tokens                                                                               | Officiellt system — **behåll som canonical**                                  |
| Print utilities (`print-text`, `print-mono`, `print-pill*`, `print-raster-bg`, `print-shadow-*`) | Aktivt i produktion                                                           |
| `PrintMobileShell`                                                                               | Enda aktiveringspunkt för Geist Sans + raster på routes                       |
| `.print-theme` CSS-overrides                                                                     | Kompenserar legacy utilities på mobil                                         |
| `printStyle` (tills refaktor)                                                                    | Bridge utan vilken mobil print bryts                                          |
| Legacy tokens + `sm:` styling                                                                    | Desktop är fortfarande legacy UI                                              |
| `GeistMono` i nav / stat-box                                                                     | Korrekt enligt design foundation                                              |
| `animate-pulse-glow`                                                                             | Spel-feedback — inte legacy/print-fråga                                       |
| Framer Motion i tiles                                                                            | Game feel — utanför design-token-scope                                        |
| `Score` / `Keyboard`                                                                             | Behövs på desktop tills Ordstorm desktop migreras                             |
| `Card`/`CardContent` struktur                                                                    | Behåll komponent; byt styling                                                 |
| `docs/design-foundation-mobile.md`                                                               | Referens — uppdatera efter migration till "design foundation" (ej bara mobil) |

---

## Föreslagen migreringsordning

### Steg 1 — Konsolidera foundation (låg risk)

_Mål: ett token-dokument, mindre brus, inga dubbla sanningar i CSS._

1. **Rensa död CSS** — `print-heading`, `print-outline`, `print-shadow`, `--radius-card`, `--highlight`.
2. **Token-fixar utan breakpoint-byte** — `main-nav` `#f2efe8` → `bg-print-bg`; `border-border/70` → print border; lägg `--print-red-soft` för feedback.
3. **Dokumentera canonical token-map** — uppdatera `design-foundation-mobile.md` → generell design foundation; markera legacy tokens som `@deprecated`.
4. **Synka breakpoint** — 767px vs 768px till ett värde.
5. **Inventera `text-print-muted`** — beslut: ta bort (all ink) eller behåll som enda muted-token.

_Leverans:_ inga parallella "officiella" docs; färre oanvända utilities; header/feedback på tokens.

### Steg 2 — Ett komponent- och typografilager (medel risk)

_Mål: sluta lägga `max-md:` + `printStyle` på varje anrop._

**2A (klart):** Button/Badge/Card print-default på mobil; `print-pill-red`; `text-print-muted`-regel.

**2B (klart):** Redundanta `printStyle`-props borttagna; opt-out-dokumentation.

**2C (kvar):**

1. **Geist i root layout** — ladda Geist Sans + Mono globalt; deprecate Manrope/IBM Plex.
2. **`globals.css` — print som default för `shell-card`, body, selection** — legacy blur/radius flyttas till temporär `.legacy-theme` _eller_ tas bort direkt om desktop ska följa print samtidigt.
3. **Refaktorera `Button` och `Badge`** — print-native defaults; ta bort `printStyle`; mappa `variant="accent"` → print-green internt.
4. **Refaktorera `Card`** — print surface default (`border-print-ink`, radius 0, shadow none).
5. **Introducera typografi-primitives** — t.ex. `PageTitle`, `SectionLabel`, `BodyText` som kapslar dagens duplicerade klasssträngar.
6. **Plattformssidor först** — `page.tsx`, `profile`, `game-shell`, `game-card`, stats — ta bort `sm:` legacy-typography.

_Leverans:_ nya komponenter behöver inte veta om "print vs legacy".

### Steg 3 — Fullständig avveckling (högre risk, störst payoff)

_Mål: inga parallella lager._

1. **Ordstorm** — förenkla `ordstorm-game.tsx` (största filen): en state-map för tiles, en feedback-palett, ta bort desktop-only legacy block eller migrera dem.
2. **`Timer`, `Score`, `Keyboard`** — samma Button/Card/Typography-system; visa Score på mobil om design tillåter.
3. **Ta bort `PrintMobileShell`** — print aktiveras i `app/layout.tsx` / `(games)/layout.tsx`.
4. **Ta bort `.print-theme` override-block** — behövs inte när defaults är print.
5. **Ta bort legacy `:root`-tokens** (`--accent`, `--surface`, `--shadow`, …) och `@theme`-mappningar.
6. **Ta bort `max-md:` print-bridge** i alla filer.
7. **Layout-dekoration** — ta bort `site-top-glow`, body gradient, bottom glow.
8. **Lint/regel** — CI eller ESLint mot nya legacy-klasser (`bg-accent`, `rounded-[1.75rem]`, `printStyle`).

_Leverans:_ färgsystem + typografi + komponenter + knappar utan legacy-lager.

---

## Bilaga: filer med hög migrerings-skuld

Sorterat efter antal dual-system-ändringar:

| Fil                                                 | Problem                                                           |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| `components/games/ordstorm/ordstorm-game.tsx`       | ~130 `max-md:`, legacy feedback, dual chips/cards, desktop blocks |
| `app/page.tsx`                                      | Hero + kort: print mobil, legacy desktop                          |
| `components/games/ordstorm/ordstorm-stats-view.tsx` | Stat-box + ord-chips dual                                         |
| `components/games/letter-tile.tsx`                  | Dual state maps                                                   |
| `components/games/timer.tsx`                        | `printStyle` prop + dual progress                                 |
| `components/ui/button.tsx`                          | Legacy CVA + print overlay                                        |
| `app/globals.css`                                   | Två token-system + override-block                                 |
| `app/layout.tsx`                                    | Legacy fonts + body + glows                                       |
| `components/games/game-shell.tsx`                   | Typografi-split                                                   |
| `components/games/ordstorm/ordstorm-stat-box.tsx`   | Surface + highlight split                                         |

---

## Nästa steg (efter godkänd plan)

1. ~~Genomför **Steg 1** i en liten PR (rensa + token-fixar + docs).~~ **Klart (jun 2026)**
2. Prototypa **Button/Badge/Card** i Steg 2B på en route (`/profile`) innan Ordstorm.
3. Mät diff-storlek på Ordstorm separat — den bör vara sista stora migreringen.

_Ingen spel-logik, ordlista eller scoring ska röras i design-migrationen._

---

## Steg 1 — genomfört (jun 2026)

### Borttaget

| Objekt                                 | Plats                       |
| -------------------------------------- | --------------------------- |
| `@utility print-heading`               | `globals.css`               |
| `@utility print-outline`               | `globals.css`               |
| `@utility print-shadow` (generisk)     | `globals.css`               |
| `--highlight` / `--color-highlight`    | `globals.css`               |
| `--radius-card`                        | `globals.css` `@theme`      |
| `site-top-glow` (DOM + CSS hide-regel) | `layout.tsx`, `globals.css` |
| Bottom radial glow                     | `layout.tsx`                |

### Nya / ersatta tokens

| Token                       | Värde                               | Ersatte                         |
| --------------------------- | ----------------------------------- | ------------------------------- |
| `bg-print-bg`               | `--print-background` `#f2efe8`      | Header/meny hårdkodad hex       |
| `bg-print-red-soft`         | `--print-accent-red-soft` `#fce8e8` | Feedback error/urgent mobil     |
| `bg-print-feedback-error`   | `#f8e8e3`                           | Desktop error feedback          |
| `bg-print-feedback-urgent`  | `#faf0eb`                           | Desktop urgent status           |
| `bg-print-feedback-success` | `#e2f5ee`                           | Desktop success + 6-bokstavsord |
| `--print-breakpoint-max`    | `767px`                             | Dokumenterad CSS-breakpoint     |

### Breakpoint-beslut

Ingen kodändring. CSS `@media (max-width: 767px)` kompletterar Tailwind `md` (min-width 48rem / 768px). `max-md:` gäller under 768px — samma effective range. `--print-breakpoint-max` tillagd som referens.

### `text-print-muted` — inventering (Steg 2A — beslutat)

| Fil                 | Kontext                                                | Beslut                                    |
| ------------------- | ------------------------------------------------------ | ----------------------------------------- |
| `ordstorm-game.tsx` | Found-words label, ResultStat labels, bästa ord-rubrik | **Behåll** — officiell spel-metadata-färg |
| `letter-tile.tsx`   | `used` state mobil                                     | **Behåll** — deaktiverad state            |

**Beslut:** `text-print-muted` är officiell för spel-metadata och used states. Plattformscopy ska använda `print-text` / `fine-text`. CSS-override till ink borttagen för `text-print-muted`.

### Manuell granskning

- **Desktop** (`≥768px`): subtila top/bottom glows borttagna — bakgrund är nu ren `--background` + body-gradient. Granskas visuellt på desktop routes utan print-shell.
- **Mobil print**: oförändrat (glows var redan dolda/irrelevanta).

### Kvar inför Steg 2 (uppdaterat efter 2A)

- Redundanta `printStyle`-props (default är nu `true`)
- Manrope / legacy `:root`-tokens
- Dual `max-md:` / `sm:` i komponenter
- `letter-tile.tsx` hårdkodade desktop hex (`#dcefe8`)
- `border-border/70` i ordstorm-game
- Timer `printStyle` (ej rörd i 2A)

---

## Steg 2A — genomfört (jun 2026)

### Komponentändringar

| Komponent | Ändring                                                                    | printStyle default |
| --------- | -------------------------------------------------------------------------- | ------------------ |
| `Button`  | `getButtonPrintClasses()` extraherad; default `printStyle={true}`          | Ja                 |
| `Badge`   | `getBadgePrintClasses()`; variant `red` + `print-pill-red`; default `true` | Ja                 |
| `Card`    | `cardPrintClasses`; prop `printStyle` default `true`                       | Ja                 |

### CSS

- `@utility print-pill-red` tillagd
- `.print-theme .text-print-muted` **borttagen** från ink-override — muted färg gäller nu i spel-UI

### `text-print-muted` — användningsregler

| Tillåtet                                    | Undvik                    |
| ------------------------------------------- | ------------------------- |
| Spel-metadata (Ordstorm labels, ResultStat) | Plattformscopy            |
| Deaktiverade / `used` states (letter tile)  | Rubriker, intro, korttext |

### printStyle — status (uppdaterat Steg 2B)

Prop **behålls** som opt-out på Button/Badge/Card (`printStyle={false}`). Explicit `printStyle` på call sites **borttagen** där default räckte. Timer behåller egen opt-in (`printStyle` default `false`).

### Manuell granskning (2A)

- **Ordstorm mobil:** labels med `text-print-muted` visar nu `#6a6a6a` (tidigare tvingades till ink) — avsiktligt.
- **Debug Dev-badge:** print-pill på mobil via Badge default (endast `SHOW_DEBUG`).

---

## Steg 2B — genomfört (jun 2026)

### Borttagna `printStyle`-props (default `true`)

| Fil                                                    | Antal | Komponent           |
| ------------------------------------------------------ | ----- | ------------------- |
| `app/page.tsx`                                         | 3     | 1× Badge, 2× Button |
| `components/games/game-card.tsx`                       | 1     | Badge               |
| `components/games/ordstorm/ordstorm-stats-view.tsx`    | 1     | Button              |
| `components/games/ordstorm/ordstorm-stats-preview.tsx` | 1     | Button              |
| `components/games/ordstorm/ordstorm-game.tsx`          | 5     | Button              |

**Totalt:** 11 redundanta props borttagna.

### `printStyle` kvar (medvetet)

| Plats                                        | Varför                                          |
| -------------------------------------------- | ----------------------------------------------- |
| `ordstorm-game.tsx` → `<Timer printStyle />` | Timer default `printStyle={false}` — prop krävs |
| `button.tsx`, `badge.tsx`, `card.tsx`        | Komponent-API (opt-out)                         |
| `timer.tsx`                                  | Egen komponent — ej migrerad                    |

**Ingen** `printStyle={false}` i kodbasen idag.

### `text-print-muted` — verifiering (oförändrad)

| Plats                    | Användning       | Regel |
| ------------------------ | ---------------- | ----- |
| `ordstorm-game.tsx` (5×) | Spel-metadata    | ✓ OK  |
| `letter-tile.tsx` (1×)   | `used` state     | ✓ OK  |
| Plattformssidor          | Ingen användning | ✓ OK  |

### Kvar inför Steg 2C (uppdaterat → se implementationsplan nedan)

Analys klar. Implementation uppdelad i säker / medelrisk / hög risk i avsnittet **Steg 2C — implementationsplan**.

---

## Steg 2C — implementationsplan (analys, jun 2026)

_Mål: Print Theme som global default utan stora visuella regressioner. Analys only — ingen implementation i detta pass._

**Scope-begränsning:** rör inte spelmotor, ordlistor, scoring, Ordstorm-layout, desktop-layout i större drag.

### 1. Global font

**Manrope idag:** endast via `app/layout.tsx` → `--font-sans` → `body { font-family: var(--font-sans) }` i `globals.css`. Påverkar **all desktop-text** och all text utanför `.print-theme`.

**Geist idag:** `PrintMobileShell` sätter `GeistSans.variable` på shell; `.print-theme` override under 768px. `GeistMono` redan på `<html>` + direkt i `main-nav`, `ordstorm-stat-box`.

**För global default:**

| Steg | Fil                             | Ändring                                                           |
| ---- | ------------------------------- | ----------------------------------------------------------------- |
| 1    | `app/layout.tsx`                | `GeistSans` + `GeistMono` på `<html>`; ta bort Manrope + IBM Plex |
| 2    | `app/globals.css`               | `body` → `var(--font-geist-sans)`; uppdatera `@theme` fonts       |
| 3    | `print-mobile-shell.tsx`        | Ta bort duplicerade font-variabler                                |
| 4    | `main-nav`, `ordstorm-stat-box` | Ev. `GeistMono.className` → `font-mono`                           |

**Desktop-risk: medel/hög** — hela desktop byter Manrope → Geist Sans. Avsedd riktning men synlig typografiändring. Gör i **isolerad PR** utan samtidig färg/radius-migration.

### 2. Legacy `:root`-tokens

| Token                              | Konsumenter                 | Direkt → print?                                    |
| ---------------------------------- | --------------------------- | -------------------------------------------------- |
| `--canvas` / `--background`        | body                        | Nära (`#f5f1e8` vs `#f2efe8`) — liten desktop-diff |
| `--ink` / `--foreground`           | text-ink, rubriker          | **Nej** (`#18261f` vs `#111111`)                   |
| `--surface`, `--surface-strong`    | cards, chips, HUD           | **Nej** (varm vs vit)                              |
| `--accent*`                        | Button, Badge, Timer, tiles | **Nej** (två gröna)                                |
| `--muted`, `--danger`, `--success` | copy, feedback              | **Nej**                                            |
| `--shadow`, `--line`               | shell-card, borders         | **Nej** (blur vs offset)                           |

**Steg 2C:** `@deprecated`-kommentarer only. **Ingen** mass-alias. Legacy behövs för desktop tills Steg 3.

### 3. `.print-theme` override-block

| Regel                              | Flytta globalt senare?         | Behåll till desktop migrerad? |
| ---------------------------------- | ------------------------------ | ----------------------------- |
| `body:has(.print-shell)` raster    | Ja (när root har raster)       | —                             |
| `.print-theme` font/color          | Ja (med global Geist)          | Delvis                        |
| `.shell-card` override             | Ja (när Card default print)    | **Nej på desktop utan pass**  |
| `.text-muted` / `.fine-text` → ink | **Nej** — bryter desktop muted | **Ja**                        |
| `.section-title` override          | Ersätt med primitive           | **Ja**                        |
| `.print-button` CSS                | Ta bort (duplikat av Button)   | Säker efter check             |
| `::selection` print-grön           | Ja                             | Låg risk                      |

### 4. Typografi-primitives (förslag)

Ny fil: `components/ui/typography.tsx`.

| Primitive                            | Ersätter                    | Filer att migrera (plattform först)      |
| ------------------------------------ | --------------------------- | ---------------------------------------- |
| `PageTitle` variant `page` \| `hero` | Duplicerad H1-klass         | profile, game-shell, stats-view, page    |
| `SectionTitle`                       | `section-title` + override  | page, coming-soon, stats                 |
| `BodyText`                           | intro-paragraph mönster     | profile, game-shell, stats, page         |
| `MonoLabel`                          | `print-mono` eyebrow        | stats-view, stats-preview                |
| `StatValue`                          | GeistMono inline i stat-box | ordstorm-stat-box                        |
| ~~PrintButtonLabel~~                 | —                           | **Behövs inte** (`.print-button` räcker) |

**2C-start:** profile only. **Ej** ordstorm-game.

### 5. Timer — printStyle default?

| Call                        | Synlighet                       | Default `true`?                 |
| --------------------------- | ------------------------------- | ------------------------------- |
| compact + printStyle (573)  | Mobil sticky                    | Identisk                        |
| full, utan printStyle (583) | Desktop `md:grid`, hidden mobil | `max-md:` träffar ej synlig yta |

**Bedömning: säkert** att defaulta `true` (som Button). Rekommendation: egen liten PR (2C-4) efter manuell timer-check. **Ingen ändring i analyspasset.**

### 6. Ordstorm legacy (inventering)

| Item                              | Plats                 | Steg 2C?                                         |
| --------------------------------- | --------------------- | ------------------------------------------------ |
| `border-border/70`                | ordstorm-game:1221    | Micro-fix → `border-line/70` (säker)             |
| `#e2f5ee` success                 | letter-tile           | → `bg-print-feedback-success` (säker, samma hex) |
| `#dcefe8` depleted                | letter-tile           | Ny token; medelrisk                              |
| blur shadow, rounded tiles        | letter-tile desktop   | **Vänta**                                        |
| accent-soft chips, surface panels | ordstorm-game desktop | **Vänta** (desktop-pass)                         |

---

### Implementationsplan — risknivåer

#### Säkra ändringar (gör först)

1. ~~`@deprecated` på legacy tokens i `globals.css`~~ **PR 1 ✓**
2. ~~Typografi-primitives + migrera `/profile`~~ **PR 2 ✓**
3. Ta bort duplicerad `.print-theme .print-button` CSS
4. Timer `printStyle` default `true` + ta bort prop i ordstorm (1 call)
5. ~~`border-border/70` → `border-line/70`~~ **PR 1 ✓**
6. ~~Letter tile `#e2f5ee` → token-klass~~ **PR 1 ✓**

#### Medelrisk (egen PR, desktop-granskning)

7. Global Geist i layout; ta bort Manrope/IBM Plex
8. Primitives på game-shell, stats, page
9. Förenkla `GeistMono.className` efter global mono
10. `#dcefe8` → ny token

#### Hög risk / vänta (Steg 3)

- Legacy → print token alias i `:root`
- Global shell-card / radius 0
- Global muted/fine-text ink override
- Ta bort PrintMobileShell
- Ordstorm-game desktop cleanup
- Timer/Keyboard/Score desktop migration
- Ta bort legacy tokens

### Rekommenderad PR-sekvens

```
PR 1 — deprecated tokens, border-line/70, letter-tile #e2f5ee  ✓
PR 2 — typography.tsx + /profile  ✓
PR 3 — Timer print default
PR 4 — ta bort duplicerad .print-button CSS
PR 5 — global Geist (isolera, granska desktop)
PR 6 — plattform primitives + mono cleanup
```

### Manuell granskningschecklista

- [ ] `/` mobil + desktop
- [ ] `/profile` mobil + desktop
- [ ] `/ordstorm` mobil (timer, tiles, text-print-muted)
- [ ] `/ordstorm` desktop oförändrat
- [ ] `/ordstorm/stats`
- [ ] Header/logotyp

---

## Steg 2C PR 1 — genomfört (jun 2026)

### Ändrade filer

| Fil                                           | Ändring                                                               |
| --------------------------------------------- | --------------------------------------------------------------------- |
| `app/globals.css`                             | `@deprecated`-kommentarer på legacy `:root` + `@theme` legacy-färger  |
| `components/games/ordstorm/ordstorm-game.tsx` | `border-border/70` → `border-line/70`                                 |
| `components/games/letter-tile.tsx`            | `bg-[#e2f5ee]` → `bg-print-feedback-success` (success state, desktop) |
| `docs/print-theme-migration-plan.md`          | PR 1 markerad klar                                                    |
| `docs/design-foundation-mobile.md`            | PR 1-notering; `#dcefe8` väntar                                       |

### Legacy tokens markerade `@deprecated`

`:root`: `--background`, `--foreground`, `--canvas`, `--surface`, `--surface-strong`, `--line`, `--muted`, `--accent`, `--accent-strong`, `--accent-soft`, `--danger`, `--success`, `--shadow`

`@theme inline`: `--color-background` through `--color-success` (legacy alias-block)

Värden oförändrade. Print-tokens (`--print-*`) ej markerade deprecated.

### Border-fix

`border-border/70` → **`border-line/70`** på missade-ord-panelen (`ordstorm-game.tsx`). Mobil oförändrad — `max-md:border-print-ink/20` override kvar.

### Letter tile

`stateClasses.success`: **`bg-print-feedback-success`** (`#e2f5ee` via token). `#dcefe8` (depleted) oförändrad — väntar token-beslut (medelrisk, PR 6 / item 10).

### Kvar inför PR 2

- ~~Typografi-primitives (`components/ui/typography.tsx`)~~ **PR 2 ✓**
- ~~Migrera `/profile` till PageTitle / BodyText~~ **PR 2 ✓**
- PR 3–6 enligt sekvens ovan

---

## Steg 2C PR 2 — genomfört (jun 2026)

### Ny fil: `components/ui/typography.tsx`

| Primitive      | Props                           | Klassbeteende                                            |
| -------------- | ------------------------------- | -------------------------------------------------------- |
| `PageTitle`    | `variant?: "page" \| "compact"` | Black, uppercase, print-ink; desktop `sm:` legacy revert |
| `SectionTitle` | —                               | `section-title` utility (+ print-theme override)         |
| `BodyText`     | `variant?: "intro" \| "card"`   | Regular, print-ink / fine-text                           |
| `MonoLabel`    | `muted?: boolean`               | `print-mono`; muted → `text-print-muted`                 |
| `StatValue`    | —                               | Geist Mono, tabular-nums (ej använd på profile än)       |

### `/profile` migration

| Före                                                   | Efter                           |
| ------------------------------------------------------ | ------------------------------- |
| `<h1 className="text-2xl font-black …">Profil</h1>`    | `<PageTitle>Profil</PageTitle>` |
| `<p className="max-w-2xl text-sm …">` intro            | `<BodyText>` (variant `intro`)  |
| `<p className="text-2xl font-black …">Gästspelare</p>` | `<PageTitle variant="compact">` |
| `<p className="fine-text max-md:print-text …">`        | `<BodyText variant="card">`     |

Layout, copy och Card/avatar oförändrade.

### Visuellt

**Identiskt** — primitives kodar samma klassstränger som tidigare inline.

### Kvar inför PR 3

- Timer `printStyle` default `true` + ta bort explicit prop i ordstorm
- PR 4: duplicerad `.print-button` CSS
- PR 5–6: global Geist, primitives på game-shell / stats / page, `#dcefe8` token

---

## Global Print Theme — genomfört (jun 2026)

**Beslut:** Ordklubben = Print Theme. Legacy Manrope/desktop avvecklas.

### Vad som gjordes

| Område          | Ändring                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------- |
| **Font**        | Geist Sans + Geist Mono globalt (`app/layout.tsx`). Manrope + IBM Plex borttagna.                   |
| **Body**        | `print-theme bg-print-bg text-print-ink print-raster-bg` på `<body>`.                               |
| **CSS**         | Print-tokens kanoniska; legacy `:root` alias till print; mobil-only `.print-theme`-block borttaget. |
| **Komponenter** | Button, Badge, Card — alltid print; `printStyle`-prop borttagen. Typography utan desktop-revert.    |
| **Plattform**   | `/`, `/profile`, stats, placeholders — typography-primitives.                                       |

### Legacy kvar

- `ordstorm-game.tsx` — dual `max-md:` layout (ingen layout-refactor)
- `letter-tile.tsx` — `#dcefe8` hex; dual state maps
- `timer.tsx` — `printStyle` default `false`
- Legacy `:root` alias — behålls tills grep visar inga konsumenter

### Nästa pass

1. Timer print-default
2. Ordstorm presentation: redundant `max-md:` där tokens räcker
3. `#dcefe8` token
4. Merge/döp `PrintMobileShell`
5. Gradvis ta bort legacy alias

---

## Komponent-cleanup — genomfört (jun 2026)

**Scope:** Visuell legacy-städning i spelkomponenter. Ingen layout-refactor, ingen spelmotor.

### Token tillagd

| Gammalt                         | Nytt                                               |
| ------------------------------- | -------------------------------------------------- |
| `#dcefe8` (LetterTile depleted) | `--print-tile-depleted` → `bg-print-tile-depleted` |

### Borttagna mönster

| Mönster                                                                                                            | Var                              |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| `mobileGame` prop + dual `max-md:` states                                                                          | `letter-tile.tsx`                |
| `printStyle` prop + desktop `rounded-2xl`/`rounded-full`/`bg-surface`                                              | `timer.tsx`                      |
| `rounded-2xl`, `bg-white`, legacy overrides                                                                        | `keyboard.tsx`                   |
| `text-muted` labels                                                                                                | `score.tsx` → `text-print-muted` |
| `sm:rounded-[1.35rem]`, `rounded-full`, `bg-accent-soft`, `bg-surface-strong`, `rounded-2xl` knappar/chips/paneler | `ordstorm-game.tsx`              |

### Print-kompatibla komponenter (mobil + desktop)

- `LetterTile`, `Timer`, `Score`, `Keyboard`, `Button`, `Badge`, `Card`
- Ordstorm: feedback, ord-chips, stats-sidebar, game-over, ResultStat

### Medvetet kvar

- Legacy `:root` alias (`--accent`, `--surface-strong`, …) för Tailwind-klasser utanför spel-UI
- `PrintMobileShell` — mobil inset-kompensation
- Ordstorm **layout** (`lg:grid-cols`, sticky timer, input-storlek) — oförändrad
- Framer Motion box-shadow animation på input (grön glow vid success) — beteende, inte legacy-färg

---

## Legacy closeout — genomfört (jun 2026)

**Mål:** Stäng migrationsfasen — dokumentation, säker alias-städning, guardrails. Ingen visuell redesign.

| Område        | Ändring                                                              |
| ------------- | -------------------------------------------------------------------- |
| **Docs**      | `design-foundation-mobile.md` → `design-foundation.md`               |
| **Shell**     | `PrintMobileShell` → `MobileInsetShell` (`mobile-inset-shell.tsx`)   |
| **CSS**       | `:root` legacy-alias borttagna; `@theme` endast `--color-print-*`    |
| **Ordstorm**  | `text-ink` → `text-print-ink`; `border-line` → `border-print-ink/12` |
| **Guardrail** | `npm run check:legacy-design`                                        |

---

## Medvetet kvar efter closeout

| Kvarvarande                     | Varför                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------ |
| **`MobileInsetShell`**          | Mobil viewport inset (`print-shell` media query) — inte theme-aktivering       |
| **Ordstorm layout-dualitet**    | `max-md:` för sticky timer, mobil input, desktop sidebar — separat layout-pass |
| **Framer Motion success glow**  | Spelkänsla på input (`boxShadow` animation) — inte legacy-färgsystem           |
| **`Button variant="accent"`**   | Komponent-API; internt print-green, inte legacy `bg-accent`                    |
| **`fine-text` utility**         | Print-native brödtext; behålls                                                 |
| **`animate-pulse-glow`**        | Success feedback animation                                                     |
| **Legacy ord i migration plan** | Historisk referens i äldre avsnitt — uppdateras vid behov                      |

### Legacy alias audit (closeout)

| Token / klass                                                           | Slutstatus                              |
| ----------------------------------------------------------------------- | --------------------------------------- |
| `:root` `--accent`, `--surface`, `--muted`, `--line`, …                 | **Borttagna** — inga TSX-konsumenter    |
| `@theme` `--color-ink`, `--color-accent`, …                             | **Borttagna**                           |
| `text-ink`, `border-line`, `text-muted`, `bg-surface*` i app/components | **Inga kvar** (ersatta eller borttagna) |
| `rounded-2xl` / `rounded-full` i app/components                         | **Inga kvar**                           |

### Nästa rekommenderade pass (produkt, inte migration)

1. Ordstorm desktop layout-pass (om/när det behövs)
2. Border-opacity-skala formalisera i design foundation
3. Kör `check:legacy-design` i CI vid behov
