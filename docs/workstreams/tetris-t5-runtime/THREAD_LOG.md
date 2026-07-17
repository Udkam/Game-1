# Tetris T5 Runtime QA Fixture Workstream

## TETRIS-T5-QA-ROUTE-MIGRATION-009R — 2026-07-17

Status: **CANDIDATE — pending independent QA; not pushed**

- Branch: `codex/tetris-recovery`
- Base SHA: `102295bf27a9ab8a6e347312715c4f3b8883e978`
- Source checkpoint: `26ef004dc4ab11de8caeee6605bbe21044c5d950`
- Owner boundary: runtime-QA fixture only

### Change

- Replaced only `PUZZLE_CHALLENGE_QA_ROUTE` in
  `src/game/runtime/qaScenario.ts` with the exact 35 `{ type, rotation, x }`
  placements from `t3r-shaft-01` / `route-1` in the signed T5 Core reference.
- Production source does not import `puzzle-references.json`.
- Race fixtures, `replayPuzzleChallenge` dispatch flow, runtime behavior, and direct
  test assertions are unchanged. `src/game/runtime/qaScenario.test.ts` did not need an
  edit.

### Commands and evidence

- Read in full: `AGENTS.md`, `docs/COMMIT_POLICY.md`, `DESIGN.md`,
  `CURRENT_TASK.md`, `docs/logs/CHANGELOG.md`, and the existing `progress.md` required
  by the selected web-game workflow. The frozen path boundary overrides that workflow's
  progress/browser-writing steps for this non-visual fixture migration.
- `git status --short`, `git branch --show-current`, `git rev-parse HEAD`, and
  `git rev-parse --verify 102295b` — clean start on the required branch/base.
- Node read-only extraction and comparison of the TypeScript constant against
  `docs/workstreams/tetris-t5-core/puzzle-references.json` —
  `actualLength=35`, `expectedLength=35`, `exact=true`.
- `npm.cmd run test -- src/game/runtime/qaScenario.test.ts` — PASS, 3 files / 6 tests.
  The direct assertions verify 35 hard drops, 22 cleared lines, `finished`, completed
  `t3r-shaft-01`, next `t3r-shaft-02`, equal final hashes, and equal command streams.
- `npm.cmd run typecheck` — PASS.
- `git diff --check` — PASS. Git printed only the repository's LF-to-CRLF working-copy
  warning; there was no whitespace error.
- Explicit source staging used
  `git add -- src/game/runtime/qaScenario.ts`, followed by
  `git diff --cached --name-only`, `git diff --cached --check`,
  `git status --short`, and `git diff --cached --stat`; the cached set contained only
  `src/game/runtime/qaScenario.ts`.
- `git commit -m "fix(runtime): migrate authored puzzle QA route"` — created source
  checkpoint `26ef004dc4ab11de8caeee6605bbe21044c5d950`.

### Delivery

- Source paths changed: `src/game/runtime/qaScenario.ts`.
- Log path changed: `docs/workstreams/tetris-t5-runtime/THREAD_LOG.md`.
- Blocker: none.
- Next action: coordinator/Core owner runs the pending green complete suite, production
  build, and full 15-setup / 30-route verifier, then routes the contiguous Slice J +
  J-R candidate range to independent read-only QA.
