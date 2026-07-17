# Tetris — T5 Production Contract

## Status and authority

The user's 2026-07-16 direction opens T5 and supersedes every conflicting T3/T4
product rule. The later Puzzle clarification in the same session also supersedes the
first T5 finite-queue draft:

- the T4 Mineral Shelf presentation is rejected and must be replaced, not patched;
- Race is endless accelerating play, not a 20-line target;
- Puzzle levels are all available, are not gated by displayed difficulty, and use the
  ordinary continuous falling-piece loop against harder authored clearing goals;
- a deterministic seed is allowed, but Puzzle must never become a short supplied-piece
  exercise or a single-reference-solution memorization task;
- outside games may inform only abstract mechanics such as downstacking or target
  clearing. T5 board layouts, names, copy, visual language, interaction structure,
  code, fixtures, and assets are original clean-room work;
- the reported one-piece Puzzle stall is a release blocker.

The user's 2026-07-17 visual review supersedes the first T5 frontend candidate:

- the player-facing name is the plain-text word `Tetris`;
- `青流方阵`, its custom mark, and the complete Aqua Blueprint presentation are
  rejected rather than eligible for incremental polish;
- the replacement must remain light cyan/light-blue and high contrast, but must read as
  a direct game interface rather than a marketing page or engineering console;
- plain-text naming does not authorize copying a commercial logo, multicolor wordmark,
  proprietary font, existing product layout, or other trade dress.

The user's later 2026-07-17 review also rejects the complete second frontend
presentation at `c9135f3252abfa3bd6d7e94c5eb2e11fc3c72a18`. It is not a visual baseline
that can be accepted through local polish. The new authority is light neo-tech
minimal: technology is expressed through exact proportions, fine edge light, clear
state changes, and one restrained motion signature rather than decorative machinery.
The accepted lifecycle, accessibility, rule binding, and detached
`structuredClone` QA snapshot fix in `c9135f3` remain behavioral requirements and
must not regress. Independent review also found 8–11 px mobile statistics and legacy
`路线` copy; both must disappear in the replacement rather than be patched in the
rejected presentation.

The deterministic architecture integrated at
`4c8582854088695ebac90467842dc2bc0cef3a20` remains the rule baseline. The rejected
T4 candidate `dd7e31ea3547c18a797b2308f04161310d1412ce` remains in history but is not
an accepted visual baseline. Its uncommitted follow-up is preserved on local branch
`codex/tetris-t4-rejected-preservation` at
`1362c664629b2a83f0659f836259b84c21750fee`.

T3/T4 screenshots, manifests, reference files, and workstream logs are historical
evidence only. T5 uses new paths and does not rewrite those artifacts.

## Product and architecture invariants

- This is a clean-room deterministic falling-block game for desktop and mobile.
- Delivery remains a browser HTML webpage built by Vite. T5 does not add a native-app
  wrapper, PWA install surface, or packaged application target.
- React owns screen composition and lifecycle. PixiJS owns the board, pieces, preview,
  effects, and frame rendering.
- Gameplay uses one Pixi canvas and no DOM cell grid.
- Core state stays serializable and independent from React, PixiJS, DOM, audio,
  storage, browser timing, and viewport geometry.
- Every DEV/browser diagnostic snapshot must be detached from canonical runtime state.
  Mutating any object returned by a QA collector must not change the live run; no
  collector may expose a writable state reference or state-replacement path.
- There is no Hold mechanic.
- Keyboard and touch expose left, right, clockwise rotation, soft drop, hard drop,
  pause/resume, restart, and an explicit route back to the mode home.
- Restart, mode exit, and unmount must not multiply listeners, tickers, audio nodes, or
  canvases.

## T5 mode rules

### Marathon

- Open-ended familiar play.
- Scoring, line count, level progression, and deterministic gravity remain.
- The run ends only on top-out or explicit player exit.

### Race

Race is normal open-ended play with an additional deterministic acceleration curve.

- There is no line target and no successful terminal state.
- Clearing 20 lines, or any other line count, must never set `status = "finished"`.
- Scoring, seven-bag generation, clearing, and top-out match normal play.
- Speed tier is `floor(pieceCount / 5) + floor(lines / 4)`, clamped to the bounded
  production gravity curve.
- Player-facing statistics are score, cleared lines, and current speed tier.
- The run ends only on top-out or explicit player exit to the mode home.
- Race leaderboard rows, if retained, are top-out endurance results rather than
  completion-time results.
- All copy and tests referring to “20 行”, “剩余行”, “完成目标”, or Race completion are
  removed or migrated.

### Puzzle library

Puzzle is a library of authored board-clearing challenges, not an unlock ladder and
not a finite input-sequence exercise. It changes the starting board and win condition;
movement, rotation, gravity, locking, scoring, line resolution, and piece generation
otherwise follow ordinary Marathon play.

- All six T5 levels are selectable from first launch. No level row is disabled or
  hidden behind prior completion.
- Numeric difficulty is removed from production definitions and UI. It does not
  control ordering or availability. Completion persistence is informational only.
- The goal remains canonical board empty after ordinary line resolution, including
  the hidden buffer.
- Every level has an empty hidden buffer, a non-empty original 20 × 10 visible board,
  and a stable level seed. That seed drives the shared deterministic seven-bag
  randomizer; the bag replenishes for as long as play continues.
- There is no authored finite queue, piece budget, remaining-piece counter, or
  `failed-budget` outcome. An unsolved run continues until canonical success, top-out,
  restart, or explicit exit.
- Puzzle uses Marathon gravity progression, grounded lock delay, entry delay, clear
  delay, scoring, soft drop, hard drop, and SRS rotation. A no-clear lock and a clear
  both continue through the ordinary deterministic spawn path.
- The initial stack occupies 8–12 visible rows, uses at least five distinct non-empty
  row shapes, and contains several staggered hole columns or covered cavities. Repeated
  floor templates, a single vertical-I well, and an immediately obvious opening are
  forbidden.
- Production validation samples the first 84 generated pieces from each level seed and
  proves twelve consecutive complete seven-bags. This is a validation horizon, not a
  gameplay limit.
- Each of the six levels has at least two frozen successful public-command replays for
  the same level seed. Both must clear the canonical board without state injection,
  and their semantic placement streams must differ at three or more locked-piece
  indices by final occupied cell set, landing column, and/or effective rotation. At
  least one intermediate canonical board hash must diverge before success; a different
  command digest alone is not route diversity.
- Each accepted route uses 18–35 locked pieces, all seven
  piece types, at least six landing columns, at least six effective rotations, at least
  three non-clearing setup locks, and at least three separated line-resolution phases.
  These metrics establish nontrivial play; neither replay is presented as a unique or
  optimal answer.
- Authoring/verifier search stops a route after 70 locks as a bounded safety guard. The
  guard is not a production queue, gameplay limit, or player failure condition.
- The engine checks canonical-board-empty success after ordinary line resolution and
  otherwise applies normal top-out rules. Malformed initial definitions fail validation
  rather than creating a special player-facing Puzzle failure.
- References initialize through `createInitialState(level.seed, "puzzle", level.id)`
  and use public `dispatch` only. No verifier, runtime QA hook, or browser setup may
  construct, replace, or mutate canonical state.

## T5 light neo-tech minimal visual direction

The accepted visual target is a precise, light game interface with a restrained
technology character. It replaces both the rejected Aqua Blueprint candidate and the
rejected clean rounded/ceramic candidate instead of combining or recoloring them. The
only player-facing brand is `Tetris` set as ordinary text in the product type system.

- Technology comes from measured spacing, thin cyan/blue edges, functional state
  feedback, and disciplined composition. It does not come from CAD, dashboards,
  decorative telemetry, or a generic futuristic theme.
- Remove the custom brand glyph, `青流方阵`, `AQUA ROUTE`, coordinates, route lines,
  blueprint grids and ticks, diagonal bands, clipped corners, decorative numbering,
  all-caps engineering labels, oversized slogans, and the rejected stepped mode bands.
- Also forbid scanlines, repeating grids, decorative particles, toy/glass candy
  blocks, marketing heroes, settings-row layouts, floating-card piles, and technical
  English used only as decoration.
- Do not imitate an official Tetris logo, multicolor wordmark, commercial font,
  existing product composition, commercial level screen, or other trade dress.
- Per the user's earlier direction, `index.html` remains unchanged as the required
  Vite entry document; it already provides the browser HTML shell and `Tetris` title.
- The only ornamental motion signature is a 2 px cyan-to-blue `phase seam`: about
  72 px while idle, extending once on selection or focus over 220 ms. It never loops,
  and reduced motion switches state immediately.

### Palette

| Role | Token |
| --- | --- |
| Page | `#F4FAFD` |
| Main surface | `#FFFFFF` |
| Cyan surface | `#E7F7FA` |
| Blue surface | `#EBF2FF` |
| Board well | `#EFF8FC` |
| Line / board edge | `#B9D8E3` / `#79B7C7` |
| Primary / secondary text | `#071E2B` / `#526D7A` |
| Cyan / blue action | `#059AA8` / `#2F67D8` |
| Focus | `#0B5BD7` |
| Success / failure | `#176B54` / `#A33A55` |

Light colors are surfaces, not text colors. Essential text, borders, focus, and state
labels must meet WCAG AA contrast.

### Typography, surfaces, and piece language

- Use the system sans stack for Chinese and normal product copy. A display sans may be
  used for the plain-text `Tetris` name; monospace is reserved for numeric values.
- The background contains at most two broad low-opacity cyan/blue light fields. It has
  no repeating grid, measurement marks, grain, diagonal stripe, or route diagram.
- Only the main page/game container may use restrained soft depth. Internal regions
  rely on one-pixel cool borders, spacing, and tone rather than repeated shadows.
- Primary surfaces use 16–20 px radii. Buttons, action sheets, the board, and cells
  have no clipped corners; nested large pill/card stacks are forbidden.
- Every mino is an `edge-lit plate`: 3–4 px radius, a same-hue fill gradient whose
  value shift is no greater than about 6%, and fine same-hue outer/inner edges. It has
  no white highlight bar, thick lower lip, jelly gloss, ceramic bevel, embossing,
  detached unit shadow, dark universal outline, cut corner, or mineral inset.
- The seven pieces remain distinguishable through hue and value while staying within
  a bounded cool palette. They must not read as seven near-equal blue stickers or as a
  toy rainbow.
- Active cells gain only a low-intensity edge glow. Locked cells stay flat. Ghost
  cells use a complete fine outline with no more than 6% fill, never corner brackets.
- Board and Next reuse the exact drawing primitive. Page entrance is 180 ms over at
  most 6 px; line clear is one local 160 ms sweep. No ornamental animation loops, and
  reduced motion removes positional, sweep, and glow transitions immediately.

## Information architecture

### Mode home

- The webpage opens on a dedicated mode home with no gameplay board.
- The mode home and Puzzle library do not mount a runtime or canvas. Entering a run
  creates one runtime/canvas; returning home destroys both before showing the home.
- A compact `Tetris` header and short `选择模式` introduction lead directly to Marathon,
  Race, and Puzzle. There is no poetic or marketing hero.
- The three entrances share one continuous 1+2 mode surface: Marathon occupies the
  complete first row, with Race and Puzzle as two independent complete buttons in the
  second row. One-pixel dividers and selected-state tone establish grouping; they are
  not three floating cards or a settings list.
- A small original four-cell composition may reflect the selected mode, but it uses
  the same edge-lit plate language, stays subordinate to selection, and never becomes
  a logo, commercial composition, or looping hero.
- Each entrance contains only its Chinese mode name, concise factual rules, and an
  explicit action. Decorative `01 / 02 / 03` numbering and redundant `Tetris` labels
  inside the chooser are forbidden.
- Race copy is `速度持续提升｜无终点｜主动退出或堆叠到顶结束`.
- Mode selection is not a small rail beside the board.

### Puzzle library

- Every level entry is enabled and shows name, board-clearing goal, available-piece
  stream description, and optional completion status.
- It does not show numeric difficulty or lock state.
- The library is one continuous surface with six complete enabled entries and one
  selected-level detail/start region. Desktop may use list/detail columns; mobile may
  expand selection in flow, but neither layout is a pile of floating cards.
- If a level silhouette is shown, it is read-only derived from the existing canonical
  initial board as one SVG/path. It is not a DOM gameplay grid and must not duplicate
  or modify Puzzle definitions.
- No sticky or fixed selection panel may cover a level row. The title is the compact
  `解谜关卡`, not a multi-line marketing statement.
- Starting a level must keep the visible selection, canonical `puzzleId`, level seed,
  active piece, and Next preview aligned.

### Game screen

- Top actions provide mode-home exit, current mode, and pause.
- Desktop uses one coherent game surface: the board is the dominant element and one
  flat 200–240 px information dock contains Next, statistics, the factual mode rule,
  and keyboard help. It does not return to detached side cards.
- Mobile uses a compact information band above the board and a five-action deck below.
- The five actions belong to one integrated control deck with shared edges and clear
  pressed/focus state, not five floating pills or tiles.
- The visible focus ring maps to the board frame rather than outlining the full-page
  Pixi canvas. The canvas may still cover the complete arena so it can render both the
  board and Next against DOM geometry anchors.
- Pause, exit confirmation, success, and failure use accessible light action sheets
  with buttons at least 44 × 44 CSS px.
- Race shows score, lines, and speed tier. Puzzle shows level name, cleared lines,
  placed pieces, the board-empty goal, and one Next item. It never shows a finite
  remaining-piece value or a suggested solution.

## Responsive and accessibility contract

- All visible buttons are at least 44 × 44 CSS px; primary mobile controls target
  48 px or larger.
- Canvas focus has a visible 3 px high-contrast focus ring.
- Dialog-like sheets expose a readable title, correct role/label, intentional initial
  focus, Escape/cancel behavior, and focus restoration.
- Mode and state are never communicated by color alone.
- `prefers-reduced-motion` is honored initially and when the media query changes.
  Runtime changes use `GameRuntime.setReducedMotion` and do not rebuild or replace the
  current canonical game state.
- Required viewports: 1440 × 900, 2048 × 1152, 390 × 844 DPR3, 844 × 390 DPR3, and
  360 × 800.
- Mobile visible body copy and touch labels are at least 12 px, statistic labels at
  least 14 px, and statistic values at least 18 px.
- No horizontal overflow, clipped essential text, overlapping modules, or accidental
  gameplay page scroll.

## Implementation ownership and sequence

1. Coordinator freezes this contract and exact path boundaries.
2. T5 Core owns Race/Puzzle rules, authored data, deterministic T5 fixtures, runtime QA
   migration, leaderboard semantics, and focused tests. It does not edit frontend.
3. Independent read-only core QA verifies the candidate SHA.
4. T5 Frontend owns mode home, Puzzle library, game composition, completion display,
   the revised clean light CSS, Pixi rendering, and presentation tests.
5. Coordinator runs one combined final typecheck, full suite, build, and browser pass
   after the last product change.
6. Independent read-only final QA verifies the exact combined candidate before
   changelog integration and push.

Historical T3/T4 evidence stays unchanged. New reference and browser evidence lives
only under `docs/workstreams/tetris-t5-*` and `docs/qa/evidence/tetris-t5`.

## Acceptance gates

- `npm.cmd run typecheck`;
- complete Vitest suite;
- production build;
- deterministic Race replay proving lines never finish the run and acceleration is
  monotonic through its safe cap;
- all six Puzzle levels, two distinct successful public-command routes per level,
  restart/hash determinism, normal automatic gravity, grounded locking, continuous
  seven-bag replenishment, and consecutive multi-piece play;
- first-84-piece seven-bag integrity for every level seed with no queue exhaustion or
  budget terminal;
- UI-driven evidence selects modes and levels through visible controls;
- plain-text `Tetris` is the only visible brand; `青流方阵`, `AQUA ROUTE`, blueprint
  coordinates, technical column labels, grids, ticks, scanlines, clipped corners,
  route decoration, stepped bands, ceramic/jelly cells, and toy visuals are absent;
- all three mode entries are visible without scroll at 1440 × 900 and 390 × 844;
- the home is one coherent 1+2 mode surface and the `phase seam` is its only
  ornamental motion;
- the mobile Puzzle selector has no overlay covering any level content;
- edge-lit plate minos, full fine-outline ghost cells, and Next share one drawing
  primitive; rejected cut-corner, ceramic, highlight-bar, thick-lip, and bracket-ghost
  styles are absent;
- player-facing copy contains no legacy `路线`; use `解法`, `本局`, or `对局` only when
  that meaning is actually needed;
- computed mobile body, statistic, and touch-label sizes are recorded by browser
  evidence rather than inferred only from CSS declarations;
- at least one Puzzle scenario after three consecutive locks, with visible/canonical
  level, active piece, placed-piece count, and Next preview aligned;
- mode-home → game → mode-home → game proof with no canvas/ticker/listener leaks;
- direct regression proof that nested mutation of every DEV QA state snapshot leaves
  canonical runtime state unchanged;
- one gameplay canvas, zero gameplay DOM cells, zero console/page errors;
- keyboard, touch, pause/resume, restart, explicit exit, failure, success, and reduced
  motion verified at required viewports.

A nonblank screenshot, internal QA state injection, mock terminal state, copied level
layout, or copied frontend treatment is not acceptance evidence.
