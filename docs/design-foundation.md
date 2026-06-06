# Ordklubben — Design Foundation

*Rapport baserad på implementerad kod. **Print Theme är global default** (mobil + desktop) sedan jun 2026. Breakpoint `767px` / `max-md` används fortfarande för spel-specifik layout, inte för att växla designsystem.*

**Steg 1 (jun 2026):** Foundation cleanup genomförd — död CSS borttagen, layout-glows borttagna, header/feedback på print-tokens. Se [`print-theme-migration-plan.md`](./print-theme-migration-plan.md).

**Steg 2A–2C (jun 2026):** Komponent-defaults, redundant `printStyle` borttagen, typography-primitives + `/profile`. Se migration plan.

**Global Print Theme (jun 2026):** Geist Sans globalt, `print-theme` på `<body>`, raster-bakgrund, Button/Badge/Card/typography utan desktop-revert. Plattformssidor migrerade.

**Legacy closeout (jun 2026):** `design-foundation.md`, `MobileInsetShell`, `:root` legacy-alias borttagna, `check:legacy-design` guardrail.

---

# 1. Design Philosophy

**Känsla:** Ordklubben förmedlar en **trycksaks-/faninliknande spelprodukt** snarare än en mjuk SaaS-app eller ett neon-färgglatt mobilspel. Ytan är lugn, taktil och redaktionell — med tydliga svarta konturer, hårda ytor och ett diskret prickraster som ger djup utan att ta fokus.

**Referenser (implícita i implementationen):**
- 90-tals/trycksaks-estetik (offset-skuggor, fyrkantiga ytor)
- NYT Games-liknande redaktionell tydlighet (nämns i produkttext, ej längre som separat hero-block)
- Svensk indie-restriktion

**Produkttyp:** En **medlemsklubb för ordspel** — en plattform med få, vassa spel snarare än en feature-tung app. Ordstorm är den dominerande spelupplevelsen; övriga spel är placeholders.

**Avvikelse från modern SaaS/spel-UI:**
- Inga rundade pill-knappar på mobil (radius `0`)
- Offset-skuggor istället för diffusa blur-skuggor
- Svart/vitt/grön palett istället för gradient-heavy UI
- Hierarki via typografi och kant — inte via grå secondary text (medvetet borttagen på plattformssidor)
- Rasterbakgrund istället för enfärgad canvas eller glassmorphism

---

# 2. Color System

Implementationen kör **två parallella system**: legacy tokens (`:root`) och print tokens (`--print-*`). På mobil inom `.print-theme` dominerar print-systemet, men legacy-färger finns kvar i komponenter som inte fullt migrerats.

## Print-system (mobil, primärt)

| Token | Hex / värde | Användning | Exempel |
|-------|-------------|------------|---------|
| `--print-background` | `#f2efe8` | Sidbakgrund, rasterbas, sekundära ytor | `body:has(.print-shell)`, stat-boxar, input idle |
| `--print-surface` | `#ffffff` | Spelytor, kort, timer, knapp-outline | Game card, timer, input |
| `--print-ink` | `#111111` | Text, primära borders | Rubriker, knappramar, kortkant |
| `--print-muted` | `#6a6a6a` | Spel-metadata, deaktiverade/used states | Ordstorm labels, letter tile `used` |
| `--print-accent-green` | `#00916e` | Primär action, aktiv tid, positiv feedback | CTA-knappar, timer-progress, valda bokstäver |
| `--print-accent-green-soft` | `#e6f5ef` | Grön bakgrundston | Success feedback, found-word chips |
| `--print-accent-red` | `#c93c3c` | Fel, urgent timer, varning | Error feedback, sista 10 sek |
| `--print-accent-red-soft` | `#fce8e8` | Print error/urgent bakgrund (mobil) | Feedback-banner `max-md:` |
| `--print-feedback-error` | `#f8e8e3` | Desktop error feedback bakgrund | Feedback-banner desktop |
| `--print-feedback-urgent` | `#faf0eb` | Desktop urgent status bakgrund | Sista sekunder desktop |
| `--print-feedback-success` | `#e2f5ee` | Desktop success bakgrund | Success feedback, 6-bokstavsord desktop |
| `--print-border` | `#111111` | Kant (1px) | `print-surface`, borders |
| `--print-raster-dot-color` | `rgba(17,17,17,0.075)` | Prickraster | Bakgrundsmönster |
| `--print-shadow-soft` | offset `#c8c3b8` | Bokstavsbrickor | Letter tile idle |
| `--print-shadow-strong` | offset `#111111` | Interaktiva element | Knappar |

## Legacy-system (fortfarande i kodbas)

| Token | Hex | Användning |
|-------|-----|------------|
| `--accent` | `#1f6f5f` | Desktop knappar, äldre grönt |
| `--accent-soft` | `#d4e9e5` | Desktop badges (rund) |
| `--danger` | `#b54f3a` | Desktop feedback/timer |
| `--success` | `#1d8a64` | Desktop success |
| `--muted` | `#607066` | Desktop brödtext |
| `--background` / `--canvas` | `#f5f1e8` | Body utanför print-shell |

## Border-färger (mobil, informellt)

Implementerade som opacity-varianter utan dokumenterad skala:
- `border-print-ink` — full (kort, timer, primära ytor)
- `border-print-ink/10` — header, meny
- `border-print-ink/15`–`/25` — sekundära ytor, input, stat-boxar

## `text-print-muted` — användningsregler (officiellt)

| Tillåtet | Undvik |
|----------|--------|
| Spel-metadata (`print-mono` + `text-print-muted`) — t.ex. found-words-rubrik, ResultStat-labels | Vanlig plattformscopy / brödtext |
| Deaktiverade eller `used` states — t.ex. letter tile `used` | Rubriker, intro, kortbeskrivningar |
| Sekundär systeminfo i spelkontext | Allt som ska läsas som primär text |

**Plattform:** använd `text-print-ink`, `print-text` eller `fine-text` (tvingas till ink i `.print-theme`).  
**Legacy `text-muted`:** tvingas till ink i `.print-theme` på plattform — gäller inte `text-print-muted`.

## Inkonsekvenser (färg)

1. **Två gröna**: `#00916e` (print) vs `#1f6f5f` (legacy accent) — desktop och vissa states använder legacy.
2. **Letter tile desktop states** — `#e2f5ee` tokeniserad (`bg-print-feedback-success`); `#dcefe8` (depleted) väntar ny token (PR/medelrisk).

---

# 3. Typography

## Typsnitt

| Roll | Font | Laddning |
|------|------|----------|
| Brödtext / UI | **Geist Sans** | `geist/font/sans` via `app/layout.tsx` |
| Mono / metadata / stat-labels | **Geist Mono** | `geist/font/mono` |
| Sidhuvud-logotyp | **Geist Mono Bold** | `GeistMono.className` direkt |
| Statistik-siffror | **Geist Mono Medium** | `OrdstormStatBox` |
| Fallback (utan print-shell) | Manrope / IBM Plex Mono | Root layout |

## Vikter (mobil, print-theme)

| Vikt | Roll |
|------|------|
| **900 (Black)** | Rubriker, knappar, bokstäver, speltitlar, ordchips, viktiga resultat |
| **400 (Regular)** | Brödtext, meny-länkar, `.print-theme` default |
| **500 (Medium)** | Mono-labels (`print-mono`), stat-siffror, badge/pill |
| **700 (Bold)** | Endast sidhuvud-logotyp (`ORDKLUBBEN`) |

## Hierarki (implementerad)

### H1 — Sid-/speltitel
- `text-2xl` (24px)
- `font-black uppercase tracking-[0.02em] leading-tight`
- Färg: `text-print-ink`
- **Exempel:** ORDSTORM, Statistik, Profil, startsidans hero-rubrik

### H2 / Sektionstitlar
- Utility `.section-title` i print-theme: `1.25rem`, Black, uppercase, `line-height: 1.1`
- **Exempel:** "Spel", "Bästa ord"

### Brödtext
- `text-sm` (14px), `font-normal`, `leading-snug` (≈1.375) eller `print-text` (`line-height: 1.35`)
- Färg: `text-print-ink` (grå borttagen på plattformssidor)

### Metadata / systemtext
- Utility `print-mono`: 13px (`0.8125rem`), Medium, uppercase, `letter-spacing: 0.06em`
- **Exempel:** "Din statistik", timer "45 sek", feedback, "Rundan slut"

### Knappar (Print default, globalt)
- `Button`: alltid print — `.print-button` via global `print-theme`
- CSS `.print-button`: Geist Sans **Black**, **14px**, uppercase, `letter-spacing: 0.04em`, `line-height: 1`
- Inga `rounded-*` overrides på spelknappar (Radera, Lägg ord, m.m.)

### Badges (Print default, globalt)
- `Badge`: alltid `print-pill` / `print-pill-green` / `print-pill-red`
- Variants: `default`, `green`, `red`

### Kort (Print default, globalt)
- `Card`: alltid `shell-card` (radius 0, 1px ram, ingen skugga)

### Typografi-primitives (`components/ui/typography.tsx`)

Officiella byggblock — använd på plattformssidor istället för duplicerade klasssträngar. **Print Theme gäller globalt** (ej längre mobil-only `sm:`-revert).

| Primitive | Element | När |
|-----------|---------|-----|
| `PageTitle` | `<h1>` (`page`, `hero`) eller `<p>` (`compact`, `card`) | Sidtitlar, hero, kortnamn |
| `SectionTitle` | `<p class="section-title">` | Sektioner |
| `BodyText` | `<p>` | Intro eller kortcopy |
| `MonoLabel` | `<p class="print-mono">` | Metadata; `muted` → `text-print-muted` |
| `StatValue` | `<p>` | Statistik-siffror |

**Migrerade routes:** `/`, `/profile`, `/ordstorm/stats`, placeholder-spel via `GameShell`.

### Statistik
- **Siffror:** Geist Mono, `text-2xl`, medium, tabular-nums
- **Labels:** `print-mono`, lowercase i copy ("bästa poäng", "rundor")

### Bokstavsbrickor
- `print-black` + stor storlek (`text-[1.65rem]` i spel, `text-[5.75rem]` i input)

### Statusmeddelanden (feedback)
- `print-mono`, normal case på mobil, `text-sm`

## Text-transform (mobil)

| Element | Transform |
|---------|-----------|
| H1, knappar, speltitlar, ord | UPPERCASE |
| Brödtext, mono-labels i stat | lowercase i copy, CSS uppercase på mono |
| Feedback | Normal case (print-mono) |

## Inkonsekvenser (typografi)

1. **`print-body`** vs **`font-medium`** i Ordstorm pregame ("Starta stormen...") — blandade vikter.
2. **Game card-titel** `text-lg` vs **H1** `text-2xl` — hierarki mellan spelnamn och sidtitlar delvis otydlig.
3. **Input placeholder** använder `text-print-muted/40` — medvetet dämpad, inte legacy grå.
4. **`print-theme` media query** sätter `font-weight: 400`, men Black rubriker relies on explicit `font-black`.

---

# 4. Layout & Spacing

## Grid & behållare

- **Main:** `max-w-6xl`, `px-4` (mobil), centrerad
- **MobileInsetShell:** `-mx-4 -mt-4 px-4 pt-4 pb-6` på mobil — kompenserar main-padding
- **Header:** `h-[45px]`, `max-w-6xl`, `px-4`
- **Ordstorm spel:** 6-kolumns grid för bokstäver, `gap-2`
- **Statistik:** 2×2 grid, `gap-2`
- **Spelkort-lista:** 1 kolumn mobil, `md:grid-cols-3` desktop

## Återkommande spacing-värden (mobil)

| Värde | Användning |
|-------|------------|
| `gap-1` / `gap-1.5` | Tight rubrikblock |
| `gap-2` | Knappar, stat-grid, sektioner |
| `gap-2.5` | Stats preview, found words |
| `gap-3`–`gap-4` | Kortinnehåll |
| `gap-5`–`gap-6` | Sidsektioner |
| `py-2` | Sidans vertikal start (MobileInsetShell-innehåll) |
| `p-3` / `p-4` | Stat-boxar, kortinnehåll mobil |
| `space-y-1`–`space-y-2` | Textblock |

## Vertikal rytm

- **GameShell → spel:** `gap-1.5`
- **Hero → spel-sektion:** `gap-6` (mobil `gap-5`)
- **Inom kort:** `space-y-2` till `space-y-4`

## Inkonsekvenser (layout)

1. **Dubbel horizontal padding** — main `px-4` + shell `-mx-4 px-4` kräver mental modell.
2. **Sticky timer** använder `-mx-1 px-1` — avviker från shell-grid.
3. **Hero på startsidan** har ingen kortpadding; **spelkort** har `p-4` — olika känsla i samma flöde.

---

# 5. Component Inventory

## Navigation Header (`MainNav`)
- **Syfte:** Global navigation, varumärke
- **Struktur:** 45px bar + utfällbar meny
- **Visuellt:** `#f2efe8` bakgrund, `border-print-ink/10`, Geist Mono logotyp 15px Bold, 1px hamburger/X
- **Variationer:** Hamburger ↔ X vid öppen meny; backdrop `bg-print-ink/10`

## MobileInsetShell (`components/layout/mobile-inset-shell.tsx`)
- **Syfte:** Mobil viewport inset — kompenserar `main` padding så innehåll når kant
- **Klasser:** `print-shell max-md:pb-6` (+ valfri `className`)
- **Aktiverar inte** Print Theme — det sker globalt på `<body>`

## Primary Button (`Button`, variant `accent`)
- **Syfte:** Huvud-CTA
- **Visuellt:** Fyrkant, 1px svart ram, `#00916e` fyllning, vit text, **offset-skugga strong**, active: skugga bort + 1px translate
- **Exempel:** "Starta storm", "Spela igen", "Spela Ordstorm"

## Secondary Button (`Button`, variant `outline` / `ghost`)
- **Syfte:** Sekundär handling
- **Visuellt:** Vit eller `print-bg` fyllning (via override), svart ram, offset-skugga
- **Variationer:** "Se statistik" (vit), "Starta ny runda" (`!bg-print-bg` — lägre visuell vikt)

## Badge / Pill (`Badge`)
- **Syfte:** Status, kategori
- **Struktur:** `print-pill` eller `print-pill-green`
- **Visuellt:** Fyrkant, mono, uppercase, 13px, 1px border
- **Variationer:** default (svart ram/vit), green (Spelbar)

## Card (`Card` / `shell-card` inom print-theme)
- **Syfte:** Innehållsgruppering
- **Visuellt mobil:** Radius 0, 1px `print-ink`, vit yta, **ingen skugga**
- **Exempel:** Spelkort, Coming soon, profil

## Hero Block (startsidan)
- **Syfte:** Intro + CTA
- **Visuellt:** **Direkt på raster**, ingen platta — badge + H1 + brödtext + knappar

## Game Card (`GameCard`)
- **Syfte:** Spelpuff
- **Struktur:** Titel, beskrivning, status-pill, "Spela →"
- **Visuellt:** Card + print-typografi; grön pill för Spelbar

## Game Shell (`GameShell`)
- **Syfte:** Spelrubrik ovanför spelarea
- **Mobil:** ORDSTORM-liknande H1 + kort brödtext; eyebrow-badge dold

## Game Container (Ordstorm `Card`)
- **Syfte:** Huvudspelarea
- **Visuellt:** Vit kortyta, svart ram, ingen skugga; innehåller tiles, input, feedback

## Letter Tile (`LetterTile`)
- **Syfte:** Bokstavsinteraktion (mobil + desktop)
- **States:** idle (vit + soft shadow), active/selected (grön soft), depleted (`--print-tile-depleted`), success (`--print-feedback-success`), used (muted på print-bg)
- **Typo:** `print-black`, uppercase, radius 0, 1px border
- **Ingen** `mobileGame`-prop — samma uttryck alla breakpoints

## Keyboard (`Keyboard`)
- **Syfte:** Desktop bokstavsinmatning i Ordstorm
- **Visuellt:** `shell-card` + `Button` outline/ghost/accent — samma print-knappar som övriga CTAs
- **Ingen** egen `rounded-2xl` / vit pill-stil

## Timer (`Timer`)
- **Syfte:** Nedräkning (compact sticky mobil + full desktop)
- **Visuellt:** Mono "X sek", progress bar radius 0; grön normalt, röd ≤10 sek; print-surface med ram
- **Ingen** `printStyle`-prop

## Input Shell (ordstorm)
- **Syfte:** Ordinmatning
- **Visuellt:** Vit yta, `border-print-ink/25`, grön kant vid fokus; enorm Black text (`5.75rem`)

## Feedback Banner
- **Syfte:** Spelstatus
- **States:** idle (`print-bg`), success (grön soft + pulse), error/urgent (röd soft), mono text

## Found Word Chips
- **Syfte:** Senast hittade ord
- **Visuellt:** Fyrkant, border; senaste ord grön highlight

## Statistic Card (`OrdstormStatBox`)
- **Syfte:** Visa nyckeltal
- **Struktur:** Mono-siffra + mono-label
- **Variationer:** highlight (grön fyllning, vit text) vs neutral (`print-bg`, `border/20`)

## Stats Preview (`OrdstormStatsPreview`)
- **Syfte:** Teaser på Ordstorm pregame
- **Struktur:** Label + 2×2 stats + outline-knapp

## Result View (`GameOverView`)
- **Syfte:** Slutresultat
- **Visuellt:** Black rubriker, ResultStat-grid, grön "bästa ord"-yta, print-knappar

## Coming Soon (`ComingSoonGame`)
- **Syfte:** Placeholder-spel
- **Visuellt:** GameShell + Card (print-overrides via theme)

---

# 6. Borders & Shadows

## Border-regler (mobil)

- **Standard:** `1px solid`
- **Primär:** `border-print-ink` (`#111`)
- **Sekundär:** `border-print-ink/10`–`/25` (informell skala)
- **Accent:** `border-print-green`, `border-print-red`

## Border-radius

- **Print-komponenter:** `0` (`--print-radius: 0px`) — gäller alla breakpoints
- **Inga** desktop `rounded-[1.35rem]` / `rounded-full` undantag i spelkomponenter (jun 2026 cleanup)

## Shadow-system

| Token | Utseende | Användning |
|-------|----------|------------|
| `--print-shadow-strong` | 3px/3px offset svart | Knappar |
| `--print-shadow-soft` | 3px/3px offset `#c8c3b8` | Letter tile idle |
| `--print-tile-depleted` | `#dcefe8` | Letter tile depleted state |
| Ingen skugga | — | Kort, timer, feedback, stat-boxar, input |

**Princip (implementerad):** Skugga bär **interaktion** (knappar, brickor) — inte **containrar**.

**Active state knappar:** Skugga försvinner + `translate-x/y 1px` — simulerar tryck.

## Inkonsekvenser

1. **`print-surface` utility** inkluderar strong shadow — används sparsamt vs faktiska kort utan skugga.
2. **Letter tile** har soft shadow; **game card** har none — båda är spelrelaterade men olika.

---

# 7. Iconography

## Stil
- **Lucide React** (`ArrowRight`, `Eye`, `RotateCcw`, `ChevronDown`) — stroke-ikoner, standard vikt
- **Custom navigation:** 1px linjer (hamburger/X) — matchar print-estetik bättre än Lucide Menu

## Storlekar (implementerade)
- `size-4` (16px) — knappar, game card "Spela"
- `size-5` (20px) — hamburger/X container

## Placering
- Knappar: ikon efter text (`ml-2`)
- "Visa missade ord": `Eye` före text
- "Starta ny runda": `RotateCcw` före text

## Saknade riktlinjer
- Ingen dokumenterad ikonstorleksskala utöver 16/20px
- Ingen regel för Lucide vs custom linjeikoner
- Ingen stroke-width-standard för Lucide i print-theme

---

# 8. Feedback States

## Success
- **Färg:** `#00916e` text, `#e6f5ef` bakgrund, `border-print-green`
- **Komponent:** Feedback banner + `animate-pulse-glow`
- **Copy:** t.ex. ord bekräftat (från `ordstorm-ux`)

## Error
- **Färg:** `#c93c3c` text, `#fce8e8` bakgrund, `border-print-red`
- **Komponent:** Feedback banner; input shake-animation
- **Copy:** "Bokstaven finns inte i rundan.", "Minst tre bokstäver."

## Warning / Urgent
- **Färg:** `#c93c3c` — timer ≤10 sek, idle feedback urgent
- **Bakgrund:** `#fce8e8` / `#faf0eb`
- **Komponent:** Timer progress + feedback banner

## Neutral / Idle
- **Färg:** `print-ink` text, `print-bg` bakgrund, ingen border
- **Komponent:** Feedback banner, placeholder-tillstånd

## Inkonsekvenser
- Legacy `text-danger` / `text-success` parallellt med print-red/green i samma komponenter
- Hårdkodade feedback-hex utan tokens

---

# 9. Voice & Tone

**Karaktär:** Direkt, svensk, spelnära — närmare **tävling/klubb** än studieförbund eller formell produktcopy. Korta meningar. Imperativ i knappar.

**Inte:** Långa onboarding-tutororials, emoji, hype-språk.

## Konkreta exempel

| Kontext | Copy |
|---------|------|
| CTA | "Starta storm", "Spela igen", "Spela Ordstorm" |
| Instruktion | "Sex bokstäver. Sextio sekunder. Hitta så många ord som möjligt." |
| Feedback | "Minst tre bokstäver.", "Bokstaven finns inte i rundan." |
| Resultat | "Nytt rekord.", "Starkt hittat.", "Bra tempo." |
| Statistik | "Din statistik", "Visa all statistik" |
| Placeholder | "Plattformen är redo för fler spel" |
| Badge | "Minimalistisk svensk spelplattform" |
| Status pill | "Spelbar", "Prototype", "Concept" |

**Språk:** Svenska först; engelska spelnamn (Ordstorm, Ladder, Connections) behålls.

---

# 10. Design Tokens

```yaml
Colors:
  print-background: "#f2efe8"
  print-surface: "#ffffff"
  print-ink: "#111111"
  print-muted: "#6a6a6a"          # delvis överstyrd till ink på plattform
  print-green: "#00916e"
  print-green-soft: "#e6f5ef"
  print-red: "#c93c3c"
  print-border: "#111111"
  print-raster-dot: "rgba(17,17,17,0.075)"
  legacy-accent: "#1f6f5f"       # desktop / äldre states

Typography:
  font-sans: "Geist Sans"
  font-mono: "Geist Mono"
  weight-black: 900
  weight-regular: 400
  weight-mono-medium: 500
  h1-size: "1.5rem"               # text-2xl
  h1-tracking: "0.02em"
  body-size: "0.875rem"           # text-sm
  body-line-height: 1.35
  button-size: "14px"
  button-tracking: "0.04em"
  mono-size: "0.8125rem"
  mono-tracking: "0.06em"
  logo-size: "15px"

Spacing:
  header-height: "45px"
  shell-padding-x: "1rem"          # px-4
  shell-offset-x: "-1rem"          # -mx-4
  stat-grid-gap: "0.5rem"          # gap-2
  section-gap: "1.25rem–1.5rem"
  card-padding-mobile: "1rem"

Borders:
  width: "1px"
  radius-print: "0px"
  opacity-secondary: "10%–25%"      # informell

Shadows:
  offset-x: "3px"
  offset-y: "3px"
  soft-color: "#c8c3b8"
  strong-color: "#111111"

Raster:
  gap: "5px"
  dot-size: "1px"

Transitions:
  button-colors: "200ms"
  timer-progress: "500ms"
  button-active-press: "translate 1px"
  pulse-glow: "0.8s ease-out"

Breakpoints:
  print-theme: "max-width: 767px"   # --print-breakpoint-max; kompletterar Tailwind md (48rem)
  tailwind-max-md: "max-width: 767px"  # max-md = under md; ingen justering behövd (jun 2026)
```

---

# 11. Inconsistencies & Open Questions

## Inkonsekvenser

1. **Border-opacity** (`/10`, `/15`, `/20`, `/25`) saknar dokumenterad skala.
2. **Secondary knappar:** vit vs `print-bg` fyllning — medveten men informell konvention.
3. **Pregame copy** använder `print-body` + `font-medium` — inkonsekvent vikt.
4. **Ikoner:** mix av Lucide och custom linjer utan regel.
5. **GameShell eyebrow** dold på mobil — badge-system används bara delvis där.
6. **Hero vs kort:** startsidan hero utan platta; spelkort med platta — avsiktligt men asymmetriskt.

## Öppna frågor

- Ska **hero-mönstret** (direkt på raster) bli standard för alla spelsidor?
- Vilken **border-opacity-skala** ska formaliseras (t.ex. primary / secondary / tertiary)?
- Ska **Lucide** ersättas med linjeikoner i print-stil på mobil?

---

# 12. Executive Summary

1. **Print Theme är globalt** — fyrkantigt, svart-kantat, rasterbakgrund, Geist Black/Mono.
2. **Primär grön `#00916e`** driver actions, aktiv tid och positiva spelhändelser; **röd `#c93c3c`** endast för fel/urgent.
3. **Typografi:** Black versaler för fokus, Regular för brödtext, Mono för metadata och statistik.
4. **Skuggor** reserverade för knappar och bokstavsbrickor — inte för kort/containrar.
5. **Spelkomponenter** (LetterTile, Timer, Score, Keyboard) delar samma print-uttryck mobil + desktop.
6. **Pills/badges** (`print-pill`, `print-pill-green`, `print-pill-red`) används konsekvent för ord-chips.
7. **Legacy `:root` alias** och `@theme` bridges — borttagna jun 2026 closeout; endast `--print-*` kvar.
8. **Design Foundation** är tillräckligt distinkt för Ordklubben — migrationsfasen stängd; framtida arbete = produkt/features.

---

# 13. Guardrails (ny kod)

Nya komponenter och sidor ska **inte** introducera:

| Undvik | Använd istället |
|--------|-----------------|
| `rounded-xl`, `rounded-2xl`, `rounded-full` (dekor) | `rounded-none` |
| `bg-accent`, `bg-accent-soft` | `bg-print-green`, `bg-print-green-soft` |
| `bg-surface`, `bg-surface-strong` | `bg-print-surface`, `bg-print-bg` |
| `text-muted` som generell copyfärg | `text-print-ink` (copy) eller `text-print-muted` (metadata) |
| `text-ink`, `border-line` | `text-print-ink`, `border-print-ink/12` |
| Blur-skuggor (`shadow-lg`, `shadow-[0_10px_…]`) | `shadow-[var(--print-shadow-soft)]` (interaktivt) eller ingen skugga |
| Hårdkodade hex om print-token finns | `--print-*` / `bg-print-*` |

**Automatisk check:** `npm run check:legacy-design` — söker förbjudna mönster i `app/` och `components/`.

**Manuell QA:** Granska nya PR:er mot denna lista + [`design-foundation.md`](./design-foundation.md) komponentregler.

---

# 14. Legacy token audit (closeout jun 2026)

| Token / klass | Status efter closeout |
|---------------|----------------------|
| `:root` `--background`, `--surface`, `--accent`, … | **Borttagna** — inga konsumenter i `app/`/`components/` |
| `@theme` `--color-background`, `--color-ink`, `--color-accent`, … | **Borttagna** — endast `--color-print-*` kvar |
| `text-ink`, `border-line` i Ordstorm | **Ersatta** → `text-print-ink`, `border-print-ink/12` |
| `.print-theme .text-muted` override | **Borttagen** — `text-muted` används inte längre i kod |
| `Button variant="accent"` | **Behålls** — komponent-API, mappar internt till print-green |
| `fine-text` utility | **Behålls** — print-native (`text-print-ink`) |

---

*Denna rapport speglar implementerad kod i `app/globals.css`, `components/layout/`, `components/ui/`, `components/games/` och relaterade sidor.*
