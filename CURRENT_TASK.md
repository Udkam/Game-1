# Current Task — T3 Production Record and Next-Work Gate

Branch: `codex/tetris`

## Accepted planning inputs

- D5 Mineral Shelf design: `4e13fcc01f2fec703e66f9027d7df25847bbe235`
  with independent QA `e31a0b665ff0864a0af35ab05dde4072bc96bbf5`.
- T3R six-level campaign/rules: `a096d96056457ebd2158bb6955cf7760fc36e238`
  with independent QA `0cf78e3efccff4ee9dff0098d231b48f3dec5657`.
- T2 production/QA remains historical evidence only. Its dark Offset Drop surface and
  three line-target Puzzle definitions are superseded.

Status: **T3 production accepted and published on `codex/tetris`.**

The T3 production chain is complete through its independent QA gate: C1 campaign
correctness was accepted before V1 started, and V1 passed final browser evidence plus
the canonical Git-blob integrity re-review. The coordinator integrated the accepted
chain and pushed it to `origin/codex/tetris` in commit `4c85828`.

## 2026-07-15 coordinator reconciliation

Tetris is complete for the currently approved goal: a clean-room three-mode game with
the six-level fixed-queue Puzzle campaign, canonical empty-board completion, the light
Mineral Shelf presentation, responsive keyboard/touch controls, deterministic replay,
and final browser evidence. There is deliberately **no active Tetris writer or QA task**.

The next product lane is Temple only after its separate A6 planning review has produced
a durable coordinator-acknowledged report. No Tetris source, rules, campaign data, or
existing evidence may be reopened merely to create activity. Any later Tetris change
must start as a new named slice with its own exact path list, acceptance gate, and
independent QA route.

## Accepted prerequisite: T3-C1 Core campaign

Status: accepted and integrated on 2026-07-14. Production candidate `8323203`
was independently accepted by QA commit `b79e142`; the full suite passed
11 files / 73 tests. This section is retained as the frozen implementation record,
not as an open editing boundary.

Owner: the Tetris gameplay/rules implementation task.

### Exact authorized product paths

- `src/game/core/types.ts`
- `src/game/core/puzzles.ts`
- `src/game/core/engine.ts`
- `src/game/core/index.ts`
- `src/game/core/puzzles.test.ts`
- `src/game/core/core.test.ts`
- `src/game/core/rules.test.ts`
- optional new `src/game/core/puzzleCampaign.ts`
- optional new `src/game/core/puzzleCampaign.test.ts`
- `src/game/runtime/qaScenario.ts`
- `src/game/runtime/qaScenario.test.ts`
- `docs/workstreams/tetris-t3-core/THREAD_LOG.md`

The two runtime QA-scenario paths are the sole consumer-migration exception: they may
replace the hard-coded legacy `offset-02` fixture with an accepted T3R level ID and
update its deterministic expectations, but may not change runtime architecture.

No other path is writable in C1. In particular, C1 may not edit React, CSS, Pixi,
GameRuntime, input, audio, persistence, package/config, root documents, Temple files,
or `docs/logs/CHANGELOG.md`.

### Required behavior

1. Replace the three old `offset-*` definitions with the accepted six T3R definitions.
2. Validate full 20 × 10 non-empty authored boards, initially empty hidden buffer,
   supported cells, no initially complete row, fixed non-empty queue, and
   `pieceBudget === queue.length`.
3. Add canonical/hashable queue index, canonical-board-empty goal, completion code,
   completed-level ID, and next-unlocked-level ID.
4. Use the existing public move/rotate/drop/lock/line-resolution path. Do not inject
   solved state, directly clear cells after initialization, add undo, or add random
   refill.
5. Apply the frozen fail order after every lock:
   top-out/hidden occupancy → board-empty success → budget/queue failure → next
   authored spawn → blocked-spawn failure.
6. Restart reconstructs the exact level/queue/index/initial hash. Replay remains
   deterministic and ends at the first terminal state.
7. State hash includes every rule-relevant Puzzle field.
8. Keep `puzzleTargetLines` only as a deprecated compile bridge if whole-repo
   typecheck requires it. It must be read by no core rule and must be removed by V1.
   Do not add another compatibility layer.

### C1 tests

Tests must prove:

- all six definitions validate and all accepted reference command sequences solve to
  full canonical-board occupancy zero;
- hidden residual cells, visible residual cells, initial full row, invalid cell/row,
  empty queue, budget mismatch, invalid/blocked spawn, top-out, queue exhaustion, and
  trailing terminal commands fail closed;
- final-piece empty-board success precedes budget failure;
- queue index advances exactly once per successful spawn;
- restart, double replay, command/event order, initial/final hash, and cell
  conservation are deterministic;
- Marathon and Race rules/hashes remain unchanged;
- no core imports from React/Pixi/DOM/storage/audio/browser/runtime.

### C1 execution and gate

- Use targeted tests while editing.
- After the final source change, run once: typecheck, complete Vitest suite, and build.
- No production browser evidence is required for C1 because the old shell is an
  explicitly temporary compile bridge.
- Produce one candidate SHA with exact paths and workstream log, then stop for
  independent QA.
- Do not start V1, push the candidate, or claim the game is visually correct.

## Accepted implementation: T3-V1 Mineral Shelf production

V1 is accepted and integrated locally. Candidate
`6fb1728f6a3e9cf4398304ac9a638df2ddf4c1d7` is a direct child of the accepted C1
baseline `3bed71f`; independent QA accepted its final evidence in
`fdd1ffbf1657a3fcc53cc3f292ae8c2a783a83e4`. The implementation binds the frozen C1
campaign to the D5 Mineral Shelf interface without changing core rules, authored
campaign data, or canonical replay/hash semantics.

Reserved paths:

- `src/App.tsx`
- `src/styles.css`
- `src/game/render/TetrisRenderer.ts`
- `src/game/render/theme.ts`
- `src/game/render/presentation.ts`
- `src/game/render/presentation.test.ts`
- `src/game/runtime/GameRuntime.ts`
- `src/game/runtime/GameRuntime.test.ts`
- `src/game/runtime/qaScenario.ts`
- `src/game/runtime/qaScenario.test.ts`
- optional new `src/puzzleProgress.ts`
- optional new `src/puzzleProgress.test.ts`
- final T3 browser-evidence script and `docs/qa/evidence/tetris-t3/**`
- `docs/workstreams/tetris-t3-frontend/THREAD_LOG.md`

V1 must bind real C1 state to the accepted D5 layout, six production level names,
versioned fail-closed unlock persistence, one Next, board-contained pause, five
controls, and final responsive browser evidence. It must remove the deprecated line
target/UI bridge. It may not change core rules or authored level data.

## Frozen non-goals

- No fourth mode, multiplayer, accounts, backend, online leaderboard, level editor,
  solver-generated hints, Puzzle undo, Hold/暂存, DOM cell grid, renderer rewrite, or
  copied commercial assets/trade dress.
- No Temple changes and no staging of the pre-existing untracked
  `docs/screenshots/temple/`.
- No broad dependency, build-tool, or package changes.
- No repeated full suites or captures for reassurance.

## Integration policy

The coordinator has integrated and pushed the accepted C1/V1 and QA commit chain and
performed a final live review. QA/design
acceptance never self-authorizes a later implementation slice; future Tetris work
requires a new bounded coordinator instruction.
