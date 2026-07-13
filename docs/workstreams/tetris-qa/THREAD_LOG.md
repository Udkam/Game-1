# Tetris Independent QA Log

Coordinator: primary task `019f4deb-7e83-7583-8cd5-8e6f075bc331`

Candidate: `b2075ba5093defee1c397b9e2b48bceaa0e92962`

## 2026-07-14 — Independent acceptance

Verdict: **ACCEPT**

- Scope was read-only against the candidate. No Temple source, evidence, or assets were
  changed; pre-existing untracked `docs/screenshots/temple/` remains outside this QA
  commit.
- Static review confirms the player-facing name is `Tetris`, remaining player copy is
  Chinese, `Hold` and `Next` each draw one piece with `Next` below `Hold`, and no
  Preferences/Seed/Patterns/manual reduced-motion/high-contrast control is exposed.
- Race gravity is a deterministic, locked-piece-count curve (`42` through `2` ticks),
  capped at two ticks; mode and piece count are included in replay/hash coverage.
- Input review and live probes confirm immediate soft drop, three-tick delay, then
  per-tick repeat, with keyboard and touch releases cancelling repetition immediately.
  Pixi presentation follows targets continuously without overshoot.
- Clean `npm.cmd ci --no-audit --no-fund`, `npm.cmd run typecheck`, full
  `npm.cmd run test` (8 files / 41 tests), and `npm.cmd run build` all passed.
- A single live Playwright evidence pass passed with zero console/page errors:
  desktop `1440 × 900 DPR1`, portrait `390 × 844 DPR3`, and landscape
  `844 × 390 DPR3` each had one canvas, zero gameplay DOM cells, a complete 1:2 board,
  and no horizontal overflow. Keyboard and touch soft-drop both moved Y `19 → 26` and
  remained at `26` after release. Race's first lock had `mode=race` and `pieceCount=1`.
  System reduced motion remained automatic; malformed local leaderboard data rendered
  zero records (fail-closed).
- `docs/qa/tetris-browser-evidence.json` was checked against all nine submitted Tetris
  PNG files; every SHA-256 matched the manifest. Visual review of desktop ready/paused,
  portrait, and landscape images confirms a board-led, measured-paper presentation and
  a clear board-local `已暂停` state without a heavy card treatment.

QA handoff: this commit adds only this workstream log and is intentionally not pushed.
