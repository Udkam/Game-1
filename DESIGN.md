# 青流方阵 — T5 Aqua Blueprint Production Contract

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
- React owns screen composition and lifecycle. PixiJS owns the board, pieces, preview,
  effects, and frame rendering.
- Gameplay uses one Pixi canvas and no DOM cell grid.
- Core state stays serializable and independent from React, PixiJS, DOM, audio,
  storage, browser timing, and viewport geometry.
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

## T5 visual direction — 青流蓝图 / Aqua Blueprint

T5 is a full visual replacement. The signature gesture is a 45-degree clipped corner
paired with fine blueprint ticks and one offset cyan route line. Warm paper, ochre
shelf feet, mineral shadows, inset rectangles, and the current block material language
are removed.

- The in-app player-facing product name is `青流方阵`. `Tetris` is removed from visible
  headings, live-region copy, and canvas labels.
- Per the user's later direction, `index.html` is outside the T5 redesign slice and
  remains unchanged as the required Vite entry document.
- Internal filenames and clean-room rule terminology may remain technical; they are not
  player-facing brand or borrowed trade dress.

### Palette

| Role | Token |
| --- | --- |
| Page | `#F4FCFD` |
| Main surface | `#FFFFFF` |
| Cyan surface | `#DFF7F8` |
| Blue surface | `#E8F1FF` |
| Board well | `#EAF8FC` |
| Grid / edge | `#BCDDE6` / `#8FC9D5` |
| Primary / secondary text | `#102F3B` / `#486775` |
| Cyan / blue action | `#0B7385` / `#2F65AE` |
| Focus | `#005FCC` |
| Success / failure | `#176B54` / `#A33A55` |

Light colors are surfaces, not text colors. Essential text, borders, focus, and state
labels must meet WCAG AA contrast.

### Piece language

- Every mino is a single cool-color plane with a shared deep-cyan outline and one
  consistent clipped corner or small radius.
- Remove detached shadows, inner square panels, mineral insets, and highlight bars.
- The seven pieces use distinguishable cyan, sky, blue, indigo, violet, mint, and
  blue-grey values while retaining the shared outline.
- Active cells use a stronger outline; locked cells use the standard outline.
- Ghost cells use corner brackets only, not translucent filled blocks.
- Board and Next reuse the same cell drawing primitive.
- Line clear uses local contraction/fade. Reduced motion switches immediately without
  trail, pulse, or positional interpolation.

## Information architecture

### Mode home

- The app opens on a dedicated mode home with no gameplay board.
- The mode home and Puzzle library do not mount a runtime or canvas. Entering a run
  creates one runtime/canvas; returning home destroys both before showing the home.
- Marathon, Race, and Puzzle are three separate, fully clickable entries with complete
  Chinese names, concise factual rules, and an explicit enter action.
- Race copy is `速度持续提升｜无终点｜主动退出或堆叠到顶结束`.
- Mode selection is not a small rail beside the board.

### Puzzle library

- Every level entry is enabled and shows name, board-clearing goal, available-piece
  stream description, and optional completion status.
- It does not show numeric difficulty or lock state.
- Starting a level must keep the visible selection, canonical `puzzleId`, level seed,
  active piece, and Next preview aligned.

### Game screen

- Top actions provide mode-home exit, current mode, and pause.
- Desktop uses a clear information / board / Next-status composition.
- Mobile uses a compact information band above the board and a five-action deck below.
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
- No horizontal overflow, clipped essential text, overlapping modules, or accidental
  gameplay page scroll.

## Implementation ownership and sequence

1. Coordinator freezes this contract and exact path boundaries.
2. T5 Core owns Race/Puzzle rules, authored data, deterministic T5 fixtures, runtime QA
   migration, leaderboard semantics, and focused tests. It does not edit frontend.
3. Independent read-only core QA verifies the candidate SHA.
4. T5 Frontend owns mode home, Puzzle library, game composition, completion display,
   Aqua Blueprint CSS, Pixi rendering, and presentation tests.
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
- at least one Puzzle scenario after three consecutive locks, with visible/canonical
  level, active piece, placed-piece count, and Next preview aligned;
- mode-home → game → mode-home → game proof with no canvas/ticker/listener leaks;
- one gameplay canvas, zero gameplay DOM cells, zero console/page errors;
- keyboard, touch, pause/resume, restart, explicit exit, failure, success, and reduced
  motion verified at required viewports.

A nonblank screenshot, internal QA state injection, mock terminal state, copied level
layout, or copied frontend treatment is not acceptance evidence.
