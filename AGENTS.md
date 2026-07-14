# Game-1 Working Agreement

## Coordinator and workstream boundary

- The primary Codex task is the coordinator. It owns scope, sequencing, integration,
  `docs/logs/CHANGELOG.md`, final browser review, commit, and push.
- `codex/tetris` owns only the falling-block puzzle in `E:\Proj\Game-1`.
- `codex/temple-run` owns only the endless runner in `E:\Proj\Game-1-temple`.
- The two branches may progress in parallel because they use separate worktrees. Never
  merge gameplay code, evidence, screenshots, or generated assets between them.
- Each implementation slice has one writer. Independent QA is read-only until the
  implementation owner produces a candidate SHA or explicitly requests an audit.
- A design or QA task may not self-authorize production edits. Only the coordinator's
  current bounded instruction opens an implementation slice.

## Required execution order for every slice

1. Read `AGENTS.md`, `DESIGN.md`, `CURRENT_TASK.md`, and the latest changelog entry.
2. Update `DESIGN.md` and `CURRENT_TASK.md` before code when behavior, visual direction,
   ownership, or acceptance criteria changed. Never label unverified work complete.
3. Implement only the named branch slice and exact product boundary.
4. Use targeted tests while editing. Do not repeat full suites for reassurance.
5. After the last source change, run one final typecheck, one full test suite, one build,
   and one browser-evidence pass when the slice is visual or interactive.
6. Produce a candidate SHA and exact path/evidence summary for independent QA.
7. The coordinator resolves QA findings, updates `docs/logs/CHANGELOG.md`, commits any
   final documentation delta, pushes the branch, and reports acceptance.

If two workers would edit the same path, the later worker must stop and report the
collision instead of merging or overwriting the other worker's dirty state.

## Feedback and escalation protocol

- The Codex UI is a convenience channel, not delivery evidence. A workstream report is
  received only after the coordinator reads both its thread state and the corresponding
  `THREAD_LOG.md` entry, then records an acknowledgement in
  `docs/workstreams/COORDINATION.md`.
- Every active workstream must append a UTF-8 `REPORT` record to its own `THREAD_LOG.md`
  before reporting a milestone. It must name its task ID, Asia/Shanghai timestamp,
  base/parent/HEAD/candidate identity as applicable, exact write scope and dirty paths,
  commands actually run, final evidence, blocker, and exactly one next action.
- Allowed report states are `STARTED`, `DOCS_UPDATED`, `GATE_RESULT`,
  `CANDIDATE_READY`, `READY_FOR_QA`, `QA_ACCEPTED`, `BLOCKED`, `INTEGRATED`, and
  `STOPPED`. A generic “complete” is not a valid report state.
- The coordinator polls active external threads at each state transition and before any
  integration decision. If a UI callback is absent, the coordinator uses `read_thread`
  plus the workstream log; no worker may infer acknowledgement from silence.
- A candidate may be routed to QA only after `CANDIDATE_READY` is acknowledged. QA is
  accepted only after its own log, exact reviewed SHA, and evidence are acknowledged.
- A `BLOCKED` report must say whether the writer has stopped, which dirty paths remain,
  and the one authorization needed to resume. It must not retry a consumed browser or
  Blender batch without a new bounded instruction.
- `docs/workstreams/COORDINATION.md` is coordinator-owned. Workers may read it but may
  not edit it. It is the active-task register, not a substitute for their local logs.
- If a report lacks a SHA/path/evidence field, or conflicts with the recorded scope, its
  state is `BLOCKED` until corrected. Never keep working across an unacknowledged scope
  collision.

## Product boundary

- This repository contains clean-room studies of game mechanics.
- Do not copy commercial logos, music, fonts, sprites, level layouts, text, or trade dress.
- The Tetris branch uses an original title and visual system while reproducing the familiar falling-block rules.
- Core simulation is deterministic and renderer-independent. PixiJS, React, DOM, audio, storage, and browser timing must not enter `src/game/core`.
- React owns page composition and lifecycle. PixiJS owns the board, pieces, particles, and frame rendering. Do not create a DOM cell grid.

## Quality gates

Every implementation slice must preserve:

- `npm.cmd run typecheck`
- `npm.cmd run test`
- `npm.cmd run build`
- exactly one gameplay canvas
- zero browser console errors
- keyboard and touch-safe controls
- `prefers-reduced-motion` support
- deterministic seeded replay tests
- no listener, ticker, audio, or canvas leaks after restart/unmount

Do not accept a nonblank screenshot as visual proof. Browser evidence must verify the
board geometry, visible state, controls, responsive layout, and canonical values claimed
by the report. Evidence files must come from the final candidate, not fabricated state.

## Encoding and file editing

- Use UTF-8 for all source and documentation.
- Prefer `apply_patch` for edits.
- Python scripts that read or write text must specify `encoding="utf-8"`.
- Do not rewrite Chinese-facing files through an implicit Windows PowerShell encoding.

## Git and destructive actions

- Keep changes on the current game branch.
- Do not force-push or rewrite shared history.
- Ordinary verified edits, installs, tests, builds, commits, and pushes do not require confirmation.
- Ask before recursive or wildcard deletion, `git clean`, `git reset --hard`, or deleting sensitive files. Small explicit temporary build artifacts may be removed after their exact path is verified.
