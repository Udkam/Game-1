# Current Task — T4 Repository Separation and Desktop Layout Recovery

Branch: `codex/tetris-recovery`
Baseline: `4c8582854088695ebac90467842dc2bc0cef3a20`

Status: **active, bounded implementation slice**

## Why this slice exists

The accepted T3 rules and six-level fixed-queue Puzzle campaign are correct, but the
desktop presentation is not acceptable. At wide viewports the whole game is capped at
718 CSS px, the board at 306 × 612 px, three Chinese mode labels wrap inside a 174 px
rail, and five controls crowd a 306 px row. The two `.qa-*` directories were retained
QA clones with the same product tree, not alternate game versions. Post-`4c85828`
Temple coordination commits changed documentation only and are intentionally excluded
from this recovery branch.

## Product contract retained

- Keep Marathon, Race (20 lines), and the six-level Puzzle campaign unchanged.
- Puzzle success remains canonical visible-board empty after normal line resolution.
- Keep deterministic replay/hash, fixed queues, unlock persistence, keyboard and touch.
- React owns page composition; PixiJS owns the single gameplay canvas; no DOM cell grid.
- Keep the original light Mineral Shelf language, but make it board-first and legible.

## Exact implementation boundary

Writer may change only:

- `src/styles.css`;
- `src/App.tsx` only if semantic grouping or labels must change to remove overlap;
- directly related presentation/runtime tests when an assertion must describe the new
  geometry;
- `AGENTS.md`, `DESIGN.md`, `CURRENT_TASK.md`, `progress.md`;
- T4 browser evidence and one Tetris-only workstream log;
- `docs/logs/CHANGELOG.md` at coordinator integration.

Do not change `src/game/core/**`, Puzzle definitions, hashes, persistence semantics,
audio rules, dependencies, build configuration, Temple files, or Patrick files.

## Visual acceptance

- At 1440 × 900 and 2048 × 1152, the board/game cluster is the clear focal point and
  uses available space without becoming a tiny website widget.
- Target regular boards are 380 × 760 at 1440 × 900 and 460 × 920 at 2048 × 1152;
  responsive variance is allowed only when the complete cluster remains in viewport.
- Complete Chinese mode names remain on one line or move to a layout with intentional
  wrapping; no clipped labels.
- The five actions remain distinct, designed, and at least 44 × 44 CSS px. `↑` is the
  rotation control; quick drop and hard drop never overlap.
- Ready, playing, paused, mode select, Puzzle select, Puzzle play, success, and failure
  remain visually distinct. Pause stays inside the board.
- 390 × 844 and 844 × 390 remain overflow-free and touch-safe.
- One canvas, zero gameplay DOM cells, zero console/page errors, no horizontal overflow.

## Verification order

Use targeted checks while editing. After the last source change run exactly one final
typecheck, one complete Vitest suite, one build, and one browser-evidence pass covering
desktop plus the two mobile orientations. Visually inspect the screenshots; a nonblank
canvas is not acceptance.

## Deferred

- No fourth mode, multiplayer, backend, account system, level editor, Puzzle undo,
  Hold/暂存, commercial assets, or Temple development.
- Do not delete the retained `.local/qa-archives`; they are evidence archives and not
  runtime inputs.
