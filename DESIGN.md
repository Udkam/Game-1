# Tetris — T3 Mineral Shelf Production Contract

## Status and authority

T2 is an accepted historical milestone, not the current visual or Puzzle contract.
The dark **Offset Drop** layout and its three line-target puzzles are deprecated for
future production work.

The current accepted inputs are:

- D5 visual candidate `4e13fcc01f2fec703e66f9027d7df25847bbe235`,
  independently accepted by QA `e31a0b665ff0864a0af35ab05dde4072bc96bbf5`.
- T3R rules candidate `a096d96056457ebd2158bb6955cf7760fc36e238`,
  independently accepted by QA `0cf78e3efccff4ee9dff0098d231b48f3dec5657`.

Those approvals freeze design and rule contracts only. They are not claims that the
production engine or UI already implements T3.

## Product intent

Tetris is a clean-room, deterministic falling-block game for desktop and mobile
browsers. It retains the familiar seven four-cell pieces, 10 × 20 visible board,
hidden spawn buffer, SRS rotation, one-piece preview, line clear, scoring, top-out,
keyboard controls, and touch controls without copying commercial logos, art, fonts,
music, level layouts, copy, or screen trade dress.

React owns the page shell and lifecycle. PixiJS owns the board, pieces, preview,
particles, and presentation interpolation. The gameplay board must never become a DOM
cell grid. Core state remains serializable and independent from React, PixiJS, DOM,
audio, storage, browser timing, and viewport geometry.

There is no Hold/暂存 mechanic or surface.

## Frozen mode rules

### 马拉松模式

- No finish line; top-out ends the run.
- Line clears raise the level and select the established deterministic gravity curve.
- The playing surface shows 得分、消行、等级.
- The local leaderboard remains score-first and fail-closed.

### 竞速模式

- The exact goal is 20 cleared lines.
- Time comes only from fixed simulation ticks.
- Every five locked pieces advances the frozen gravity tier; the final tier is capped.
- The finishing clear changes canonical status to `finished` before any successor
  piece can spawn.
- The playing surface shows 用时、剩余行、速度档.
- Only completed runs enter the Race leaderboard.

### 解谜模式 — six-level authored campaign

Puzzle is an authored campaign, not a random bag and not a target-line variant.

| Index | ID | Name | Difficulty |
| ---: | --- | --- | ---: |
| 1 | `t3r-shaft-01` | 三井初鸣 | 4 |
| 2 | `t3r-shaft-02` | 四井错拍 | 5 |
| 3 | `t3r-shaft-03` | 偏置立柱 | 5 |
| 4 | `t3r-shaft-04` | 五井精裁 | 6 |
| 5 | `t3r-cascade-05` | 左岸级联 | 7 |
| 6 | `t3r-cascade-06` | 右岸回流 | 8 |

Every definition contains:

- one non-empty authored 20 × 10 visible board;
- an initially empty hidden buffer;
- one finite fixed piece sequence;
- a piece budget exactly equal to the sequence length;
- full Chinese name, campaign index, total, difficulty, and goal
  `canonical-board-empty`.

Puzzle has no automatic gravity. Movement, SRS rotation, soft drop, and hard drop use
the same public deterministic core commands as the other modes. There is no Puzzle
undo and no bag refill.

After each lock, normal line resolution runs first. The engine then applies this exact
order:

1. lock-out, invalid state, or any occupied hidden-buffer cell → failed top-out;
2. zero occupied cells across hidden buffer plus all 20 visible rows → finished;
3. consumed budget or no next authored item → failed budget;
4. otherwise spawn exactly the next authored piece; blocked spawn → invalid-spawn
   top-out.

Success is never derived from cleared-line total, score, timer, UI state, storage, or
a hidden solver flag. If the final allowed piece empties the canonical board, success
wins over budget exhaustion.

## Canonical Puzzle state

The production core must hash and replay at least:

- `puzzleLevelId`;
- validated authored board identity and full fixed queue;
- `puzzleQueueIndex` (next unspawned item);
- piece budget and canonical-board-empty goal;
- completion code;
- completed level ID and newly unlocked level ID.

Restart reconstructs the same level, board, queue, first active piece, queue index,
budget, and initial hash. Reference replays end at the first terminal state, consume
the exact queue prefix, have no trailing command, and reproduce identical initial
hash, final hash, ordered command digest, and ordered event digest.

Campaign persistence lives outside the core and is versioned, bounded, and
fail-closed. A successful canonical run may unlock only the next level. Storage may
remember completed/unlocked levels, but it cannot manufacture a completion or alter a
replay result.

The accepted campaign evidence is in
`docs/workstreams/tetris-t3-rules/`. The workstream adapter is proof of fixture
solvability only; production must use typed core definitions and public commands.

## Visual direction — 浅岩台 / Mineral Shelf

The sole production direction is D5 **浅岩台**. Its purpose is a bright, quiet,
board-first game surface.

The recognizable gesture is a double mineral shelf shared by the board, Next, and
control rail:

- a thin ochre foot below;
- a blue-grey foot to the right.

It is structural, not a banner, card, modal, dashboard, or decorative stripe.

### Tokens

| Role | Token |
| --- | --- |
| Warm paper | `#F7F4EC` |
| Light mineral board | `#E1E5DC` |
| Mineral highlight/depth | `#FDFCF8` / `#C7CFC3` |
| Ink/muted | `#31413E` / `#6D7A74` |
| Ochre shelf | `#C56E4F` |
| Blue-grey shelf | `#6D879B` |
| Piece palette | restrained ochre, blue-grey, olive, and grey-violet inks |

- Zero border radius.
- One-pixel restrained borders.
- Board-only stepped shelf shadows; no floating cards.
- Small complete `Tetris` wordmark; no repeated current mode in the header.
- Natural Chinese typography. Display serif is limited to the wordmark and concise
  state headings; controls and body copy use readable system Chinese fonts.
- All essential/help/control/action copy is at least 12 CSS px.
- Motion is local and bounded; `prefers-reduced-motion` removes decorative
  displacement without changing rules or controls.

Forbidden: deep/dark board well, giant title, diagonal drop band, page grid,
glassmorphism, cards, pills, modal mode selection, fake telemetry, mode abbreviations,
`T.`, Hold, 暂存, multiple graphical queue previews, or copied commercial assets.

## State and layout contract

The measurable board frame, including shelf feet, is always `1:2 ± .02`.

### Ready

- Header contains only `Tetris`.
- Three complete flat mode names form one typographic rail with no vertical cells.
- Only the selected mode's factual goal/end rule is shown.
- One compact primary start action.
- Empty board plus optional ghost; no live stats and no Next.

### Playing

- Exactly one graphical `下一个方块`.
- Current complete mode, mode switch, and pause stay outside the board.
- Only mode-owned stats appear.
- The five controls are one continuous rail:
  `← 左移`, `→ 右移`, `↑ 旋转`, `↓ 快速下落`, `⇣ 直接落底`.
  Every zone is at least 44 × 44 CSS px.

### Pause

Pause is a narrow paper strip fully inside the board and no higher than 18% of its
height. It contains `暂停`, `继续`, and `重新开始`. There is no page-wide dark
scrim and no duplicate external pause action while paused.

### Mode switch

Mode switch stays outside the board, uses the three complete mode names and factual
goal/end text, and offers `应用并重新开始` and `返回本局`. The frozen board has no
inner text and no stale Next preview.

### Puzzle select and play

Select presents six or more reachable flat rows, not cards: index/total, production
name, difficulty, fixed goal, unlocked state, and selection. Prototype example names
must never replace the accepted T3R names in production.

Puzzle play shows level index/total, full name, difficulty, remaining fixed pieces,
goal `清空棋盘`, one Next item, restart, and return-to-level-select. It does not show
score, Marathon level, Race time, or a line-target progress counter.

Complete/fail uses a board-contained result strip and one factual code:
canonical-board-empty success, top-out, invalid spawn, or budget exhausted.

### Responsive targets

| Viewport | Contract |
| --- | --- |
| 1440 × 900 | centered board-first cluster; regular board approximately 306 × 612 CSS px |
| 390 × 844 | single column; board approximately 266 × 532; puzzle board may be 216 × 432 |
| 844 × 390 | compact horizontal stage; board approximately 156 × 312; all essential text remains ≥12px |
| 360 × 800 probe | long Puzzle values remain visible without overlap or page scrolling |

One canvas, zero gameplay DOM cells, no horizontal overflow, no clipped title, no
module overlap, and no page scroll are hard gates.

## Presentation and input

Simulation stays fixed-step and discrete. Pixi interpolation must never delay or alter
canonical state.

- Horizontal/gravity/soft-drop transitions remain continuous and cancellation-safe.
- Held keyboard and touch soft drop start promptly, repeat quickly, and stop
  immediately on release/cancel/blur.
- Hard drop is immediate and may use only a short local trail/settle cue.
- Line clear is local and restrained; no full-screen flash or generic particle shower.
- Restart/unmount must not multiply listeners, ticker callbacks, audio nodes, or
  canvases.

## Production sequence and atomic release boundary

T3 is implemented as a linear two-owner chain:

1. **T3-C1 Core campaign** — typed six-level definitions, validation, canonical
   queue/completion/unlock fields, exact success/failure ordering, hash/replay/restart
   tests. It may retain deprecated compile-only fields temporarily, but no rule may
   read them.
2. **T3-V1 Mineral Shelf shell** — real campaign selection/progress storage, canonical
   Puzzle copy/state, D5 page/board/controls, responsive composition, and final browser
   evidence.

C1 is not a user-facing release and is not pushed as a completed T3 milestone by
itself. V1 must remove the deprecated UI bridge and prove the real combined state
before the coordinator publishes the production chain.

Implementation status on 2026-07-14: C1 candidate `8323203` and independent QA
`b79e142` are integrated. The six-level campaign core is therefore frozen; the active
work is V1 only. This status does not claim the D5 presentation or final browser
experience is implemented.

## Final acceptance

The final combined candidate must pass once, after the final source change:

- `npm.cmd run typecheck`;
- complete Vitest suite;
- production build;
- deterministic six-level reference replay verification;
- fresh browser evidence at 1440 × 900 DPR1, 390 × 844 DPR3,
  844 × 390 DPR3, and 360 × 800 long-value probe;
- one canvas, zero gameplay DOM cells, zero console/page errors, no overflow/overlap;
- real keyboard and touch rotation, quick drop, hard drop, pause/resume, restart,
  mode switch, Puzzle selection, Puzzle completion/failure, and progression;
- evidence and screenshot hashes from the final candidate.

No acceptance may be inferred from a nonblank screenshot, mock state, or design-only
approval.
