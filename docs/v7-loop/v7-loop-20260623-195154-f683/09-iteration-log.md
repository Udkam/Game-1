# Iteration Log

## Stage 1: Project reset and audit docs

Goal:

- Create v7 run directory and required documentation skeleton.
- Record current failure premise and baseline audit.
- Record agent roster and strict push-per-stage rule.

Actual changes:

- Added `docs/v7-loop/CURRENT_RUN_ID.txt`.
- Added required v7 loop documentation files.
- Added required agent log files.
- Added repo-local `codex.md`.

Verification:

- `git status --short`: only Stage 1 documentation files are untracked.
- `npm run typecheck`: passed.
- `npm run verify`: passed. Current baseline remains 60/60 current levels, including rejected v6 3D levels.
- `npm run smoke:api`: passed. API still returns 60 current levels; Node emitted a non-fatal `node:sqlite` ExperimentalWarning.
- `npm run smoke:ui`: passed. Existing blind spot remains: current 3D levels report `crates=0` because the old UI smoke only counts `.board .crate`.

Failure items:

- No Stage 1 blocker.
- Carry-forward risk: current visual/UI smoke is insufficient for v7 acceptance.

Next step:

- Commit Stage 1 and push to `origin main`.

## Stage 2: Project reset and route cleanup

Goal:

- Retire the user-visible v6 2.5D route without yet rewriting the whole game.
- Remove public 3D level exposure and dev demo entry.
- Update current top-level docs so v6 is not promoted as the active success path.

Actual changes:

- Removed `LEVEL3D_DEFS` from the runtime `LEVEL_DEFS` catalog.
- Removed the visible `立体演示 (dev)` menu button.
- Replaced `README.md` with v7-loop current status and retired-v6 language.
- Replaced `claude.md` with v7-loop current work report.
- Updated `package.json` description.
- Updated the top comment in `src/engine/levels.ts`.

Verification:

- `npm run typecheck`: passed.
- `npm run verify`: passed, current exposed catalog is 52/52.
- `npm run smoke:api`: passed, `/api/levels` now returns 52 levels.
- `npm run smoke:ui`: passed, all current exposed levels win through jsdom.
- `npx tsx -e ...LEVELS check...`: passed with `{"count":52,"ids":[],"is3D":[]}`.
- `npm run build`: passed.
- Discarded check: direct `node` import of TS/JS source failed due extension/runtime mismatch; replaced by the `tsx` catalog check above.

Failure items:

- No Stage 2 blocker.
- Carry-forward risk: unused v6 2.5D source still exists as historical code, but it is no longer in the user-visible runtime catalog.

Next step:

- Commit Stage 2 and push to `origin main`.

## Stage 3: New sci-fi art system and navigation shell

Goal:

- Replace the old paper/wood visual language with a clear 2D sci-fi shell.
- Rebuild the home screen into a command deck with first-class navigation.
- Add user-facing entries for chapter star map, mechanism archive, records, and settings.
- Keep the current 52-level runtime stable while the v7 level/engine rebuild is still pending.

Actual changes:

- Replaced `src/web/styles.css` with a new dark sci-fi 2D visual system: neon grid background, hologram panels, command buttons, chapter map styling, HUD styling, board states, overlays, and responsive mobile rules.
- Rebuilt `showMenu()` in `src/web/ui.ts` into a command-deck home screen.
- Added `章节星图`, `机制档案`, `挑战记录`, and `设置` navigation surfaces.
- Added `showRecords()` and `showSettings()` overlays.
- Removed remaining visible 3D divider/badge handling from the home/level list flow.
- Changed `package.json` description to ASCII-only text after confirming PowerShell had rendered UTF-8 symbols as mojibake in console output.

Verification:

- `npm run typecheck`: passed.
- `npm run verify`: passed, current exposed catalog remains 52/52.
- `npm run smoke:api`: passed, `/api/levels` returns 52 levels.
- `npm run smoke:ui`: passed, all current exposed levels still win through jsdom.
- `npm run build`: passed.
- Temporary DOM audit with `npx tsx -`: passed for `.home-deck`, primary continue button, `#chapter-map`, mechanism archive button, records button, settings button, and no visible `立体演示` / `2.5D` entry.

Failure items:

- Initial temporary DOM audit failed because PowerShell piping converted Chinese regex text into `????`; root cause was ad-hoc script transport encoding, not repo source encoding. Re-ran the same assertions with Unicode escapes and passed.
- Stage 3 is not final v7 acceptance. It still uses the old 52 exposed level data and old mechanics while establishing the new shell.
- Carry-forward risk: no real-browser screenshot audit exists yet; `smoke:visual` is still pending for later stages.
- Carry-forward risk: CSS currently uses local/system font stack names only. Final font decision and license record are still pending.

Next step:

- Commit Stage 3 and push to `origin main`.
- Begin Stage 4 mechanism/data/test foundation.

## Stage 4: Engine mechanism and verification foundation

Goal:

- Add a v7-compatible level metadata contract without breaking current replay.
- Add deterministic time-shadow state support as the first new v7 mechanism foundation.
- Add blocked-reason plumbing for later UI feedback.
- Upgrade verification output to the v7-required fields.

Actual changes:

- Extended `src/engine/types.ts` with `V7Mechanic`, `LevelDesignNote`, `SolverStatus`, `ValidationMethod`, `SpaceProfile`, and typed configs for `timeShadow`, `chain`, `spatialSwap`, and `recursiveRoom`.
- Extended `LevelDef` / `Level` parsing to carry v7 metadata and chapter/mechanic fields.
- Added `history` and `shadow` to `GameState`; old levels default to empty history and no shadow.
- Implemented deterministic `timeShadow` advancement in `rules.ts`: delayed player copy, optional player/crate blocking, optional plate pressure, and state-key participation.
- Added `blockedReason` to `MoveResult`, and exposed `lastBlockedReason` from `Game` / `DiptychGame`.
- Added a visible `time-shadow` renderer piece and CSS styling.
- Upgraded `npm run verify` output to print `id`, `title`, `chapter`, `solverStatus`, `solutionLength`, `par`, `validation`, and pass/fail.
- Added server `/api/levels` metadata fields for chapter, mechanics, solver status, and validation method.

Verification:

- `npm run typecheck`: passed.
- `npm run verify`: passed, current exposed catalog remains 52/52 and output now includes v7 verification fields.
- Temporary `npx tsx -` timeShadow engine check: passed; a delay-1 shadow appeared at the previous player position and blocked the player from stepping back into it.
- `npm run smoke:api`: passed; server replay and bogus-solution rejection still work.
- `npm run smoke:ui`: passed for all current exposed levels.
- `npm run build`: passed.

Failure items:

- No Stage 4 blocker.
- Carry-forward risk: `chain`, `spatialSwap`, and `recursiveRoom` are typed config surfaces only in this stage. They are not yet complete gameplay implementations.
- Carry-forward risk: blocked-reason UI feedback is plumbed in the game wrapper but not yet rendered to the player.
- Carry-forward risk: the runtime catalog is still 52 transitional levels, not the final 70 v7 levels.

Next step:

- Commit Stage 4 and push to `origin main`.
- Begin Stage 5 level data format upgrade and 15-level vertical slice.

## Stage 5: Level data format upgrade and 15-level vertical slice

Goal:

- Stop exposing the transitional old 52-level catalog.
- Add a verified 15-level v7 slice with sci-fi titles, chapters, mechanisms, and full `levelDesignNote` metadata.
- Prove current UI/API/replay paths work against the new catalog before expanding to 70 levels.

Actual changes:

- Added `src/engine/v7Levels.ts` with 15 v7 levels:
  - 5 startup/core-push levels.
  - 3 quantum portal levels.
  - 3 synchronized actor / mirrored sync levels.
  - 4 time-shadow gate levels.
- Switched `LEVEL_DEFS` to `V7_LEVEL_DEFS`; old level definitions remain in source history but are no longer exposed by the runtime catalog.
- Rewrote mechanism codex entries and anchors to point to v7 mechanisms (`v7-001`, `v7-006`, `v7-009`, `v7-010`, `v7-012`).
- Removed the remaining `IsoRenderer` / demo fallback path from `src/web/ui.ts`; the v7 runtime level page now uses the 2D `BoardRenderer` only.
- Changed progress storage to `driftbox.progress.v7` so old v1/v6 clears do not mark the new slice as completed.
- Updated board rendering so a time shadow pressing a plate visually marks that plate as pressed.
- Updated `06-level-design-matrix.md` with the verified 15-level slice and fixed previously garbled chapter text.
- Updated README and `claude.md` to state the current runtime is a 15-level v7 vertical slice, not the old 52-level catalog.
- Updated `smoke-api` so it no longer hardcodes the old `l1` level id.
- Updated `verify` so levels declared `solverStatus: "optimal"` actually run the solver even when a stored replay exists.

Verification:

- Initial `npm run typecheck` / `npm run verify` failed because `v7Levels.ts` had an unescaped apostrophe in one English design note. Fixed and re-tested.
- Initial `npm run smoke:api` failed because the test still queried `/api/scores/l1`. Fixed the test to use the current first level id and re-tested.
- `npm run typecheck`: passed.
- `npm run verify`: passed, 15/15 v7 slice levels.
- `npm run smoke:api`: passed, `/api/levels` returns 15 levels and all stored solutions are accepted.
- `npm run smoke:ui`: passed, all 15 v7 levels win through jsdom.
- `npm run build`: passed.
- Note: one parallel typecheck run reported old `camBar` / `iso` symbols while `ui.ts` was being edited; a standalone final typecheck passed against the final source.

Failure items:

```text
[FAIL] Stage 5 initial typecheck/verify
Evidence: TS parse error in src/engine/v7Levels.ts at the design note containing player's/core's.
Root cause: Unescaped apostrophe inside a single-quoted string.
Fix plan: Rewrite the phrase without apostrophes.
Files to change: src/engine/v7Levels.ts
Re-test: npm run typecheck; npm run verify
```

```text
[FAIL] Stage 5 initial smoke:api
Evidence: GET /api/scores/l1 failed after the catalog switched to v7-001..v7-015.
Root cause: API smoke test had an old hardcoded level id.
Fix plan: Use LEVELS[0].id for bogus/malformed/leaderboard checks.
Files to change: scripts/smoke-api.ts
Re-test: npm run smoke:api
```

```text
[FAIL] Stage 5 parallel final typecheck
Evidence: One parallel run reported old 3D camera symbols (`camBar`, `iso`) while `src/web/ui.ts` edits were in progress.
Root cause: Validation started against an intermediate edit state.
Fix plan: Re-run typecheck after final source settled and confirm old symbols are absent.
Files to change: none after final source; `src/web/ui.ts` already contains the pure 2D path.
Re-test: npm run typecheck; rg -n "camBar|iso|rotateCam|setPeek" src/web/ui.ts
```

Carry-forward risk:

- Stage 5 is only 15/70 levels. Final acceptance is still blocked on the full 70-level buildout and final audit scripts.
- Spatial swap, recursion, and chain-state mechanics are still not represented in playable levels.
- Real-browser visual screenshots and mobile checks are still pending.

Next step:

- Commit Stage 5 and push to `origin main`.
- Begin Stage 6 full 70-level expansion and audit command implementation.

## Stage 6: Full 70-level buildout and non-visual audits

Goal:

- Expand the v7 runtime catalog from the 15-level vertical slice to exactly 70 levels.
- Cover all requested chapters and mechanism families with complete `levelDesignNote` metadata.
- Add `audit:levels`, `audit:ui`, and `audit:content` commands.
- Prove the 70-level catalog works through replay verification, API smoke, UI smoke, and production build before starting real-browser visual smoke.

Actual changes:

- Rebuilt `src/engine/v7Levels.ts` around reusable reviewed pattern helpers plus manually authored boss and misdirection cases.
- Added the full requested chapter structure: eight 8-level chapters plus a 6-level finale.
- Added playable candidates for quantum portals, synchronized actors, time shadows, spatial swap scenarios, recursive-room scenarios, chain-state scenarios, misdirection cases, and final multi-mechanic boss levels.
- Added `scripts/audit-levels.ts`, `scripts/audit-ui.ts`, and `scripts/audit-content.ts`, then wired them into `package.json`.
- Added screen transition classes and CSS so page changes have a testable animation state.
- Updated README, `claude.md`, level matrix, art direction, and acceptance status to reflect the 70-level runtime while keeping the final report non-final.

Verification:

- `npm run audit:levels`: passed. Exactly 70 levels, correct chapter counts, required mechanism coverage, complete metadata, no exact duplicate layout signatures, and no obvious post-intro short-level failures. Warning retained: all 70 levels rely on replay/manual status and advanced chapters need sample-play review.
- `npm run typecheck`: passed.
- `npm run verify`: passed for all 70 levels, printing id/title/chapter/solverStatus/solutionLength/par/validation/pass.
- `npm run audit:ui`: passed for command deck, chapter map, mechanism archive, records, settings, HUD, 2D board, win overlay, transition class, mobile CSS guard, and absence of visible 3D camera bar.
- `npm run audit:content`: passed for README/claude current 70-level status, current RUN_ID, matrix status, art license status, no stale v6/3D completion claims, and v6 treated as retired/archive context.
- `npm run smoke:api`: passed. `/api/levels` returns 70 levels, all stored solutions are accepted, bogus/unknown/malformed submissions are rejected, and scores list works.
- `npm run smoke:ui`: passed. All 70 levels play to a win through the real jsdom UI path.
- `npm run build`: passed.

Failure items:

```text
[FAIL] Stage 6 initial level audit duplicate scan
Evidence: audit:levels reported exact layout signature duplicates in portal, sync, and chain candidates.
Root cause: helper-generated levels reused identical `map` plus rule-config signatures after metadata-only variations.
Fix plan: vary the board geometry and route lengths for the affected candidates, then rerun audit and replay checks.
Files to change: src/engine/v7Levels.ts
Re-test: npm run audit:levels; npm run verify; npm run smoke:ui
```

```text
[FAIL] Stage 6 initial UI/content audits
Evidence: audit:ui initially needed explicit transition/mobile/overlay hooks; audit:content needed current 70-level documentation and license status.
Root cause: Stage 5 shell did not yet include final audit landmarks or Stage 6 status docs.
Fix plan: add screen transition class/state, mobile overflow guard, overlay close/route checks, and update README/claude/v7-loop docs.
Files to change: src/web/ui.ts; src/web/styles.css; README.md; claude.md; docs/v7-loop/v7-loop-20260623-195154-f683/*
Re-test: npm run audit:ui; npm run audit:content
```

Carry-forward risk:

- Advanced chapters 5-7 are currently verified replay/manual candidates with metadata and UI signaling, but their deeper mechanism rule hooks still need a follow-up review/fix loop.
- Visual smoke is handled in the following Stage 7 record.

Next step:

- Begin Stage 7: implement Playwright `smoke:visual`, capture required screenshots, visually review failure items, and patch the UI/levels if screenshots show regressions.

## Stage 7: Playwright visual smoke and screenshot QA

Goal:

- Add the required `npm run smoke:visual` command.
- Capture the required 15 desktop/mobile screenshots into the active run directory.
- Verify the new 70-level UI renders in a real browser and does not expose the retired v6 2.5D path.

Actual changes:

- Added `playwright` dev dependency.
- Added `scripts/smoke-visual.ts`.
- Added `smoke:visual` npm script.
- Generated screenshots in `docs/v7-loop/v7-loop-20260623-195154-f683/screenshots/`.
- Fixed mobile intro-banner layout so the `知道了` button stays horizontal and readable.

Verification:

- `npm run typecheck`: passed.
- `npm run verify`: passed for all 70 levels.
- `npm run audit:levels`: passed; warning remains that all 70 levels rely on replay/manual status and advanced chapters need sample-play review.
- `npm run audit:ui`: passed.
- `npm run audit:content`: passed.
- `npm run smoke:api`: passed; `/api/levels` returns 70 and server replay accepts all 70 stored solutions.
- `npm run smoke:ui`: passed; all 70 levels play to a win through jsdom UI.
- `npm run smoke:visual`: passed; 15 screenshots written.
- `npm run build`: passed.

Screenshot files:

- `01-home.png`
- `02-chapter-star-map.png`
- `03-mechanism-archive.png`
- `04-level-001.png`
- `05-portal-009.png`
- `06-sync-017.png`
- `07-time-shadow-025.png`
- `08-spatial-swap-033.png`
- `09-recursive-041.png`
- `10-chain-state-049.png`
- `11-misdirection-057.png`
- `12-finale-boss-070.png`
- `13-win-overlay.png`
- `14-mobile-home.png`
- `15-mobile-level.png`

Failure items:

```text
[FAIL] Stage 7 mobile level screenshot
Evidence: `15-mobile-level.png` initially showed the `知道了` intro dismiss button collapsed into vertical characters.
Root cause: `.intro` stayed as a single horizontal flex row on a narrow viewport, leaving the trailing button too little inline space.
Fix plan: Give intro text flexible width, prevent button wrapping, and stack the banner content on mobile.
Files to change: src/web/styles.css
Re-test: npm run smoke:visual; inspect `15-mobile-level.png`
```

- Carry-forward QA risk: the visual smoke verifies rendering and screenshots, but it does not prove the replay/manual advanced chapters have deep enough concrete mechanics.
- Carry-forward QA risk: several advanced screenshots are still conservative corridor/rail boards; Stage 8 must decide whether to deepen rules or rewrite more layouts before final acceptance.

Next step:

- Commit and push this Stage 6/7 checkpoint to `origin main`.
- Continue with rule-depth implementation for spatial swap, recursive room, and chain-state if the loop proceeds.

## Stage 8: Mechanism archive, HUD tags, and blocked feedback

Goal:

- Close the visible-experience gap where the archive and HUD did not fully expose advanced v7 mechanism families.
- Surface existing engine `blockedReason` feedback to the player.
- Strengthen UI audit coverage for these affordances.

Actual changes:

- Added mechanism archive entries for `spatial-swap`, `recursive-room`, `chain-state`, and `misdirection`.
- Updated mechanism archive anchors to current 70-level IDs.
- Added a metadata-driven mechanism chip row on level screens.
- Added HUD blocked feedback for failed movement.
- Updated `audit:ui` to require advanced archive entries, mechanism chips, and blocked feedback.
- Refreshed Playwright screenshots.

Verification:

- `npm run typecheck`: passed.
- `npm run audit:ui`: passed with the new assertions.
- `npm run smoke:ui`: passed for all 70 levels.
- `npm run smoke:visual`: passed.
- `npm run build`: passed.
- `npm run audit:content`: passed.
- `npm run verify`: passed for all 70 levels.
- `npm run smoke:api`: passed.
- `npm run audit:levels`: passed with the retained replay/manual warning.

Failure items:

- No hard Stage 8 command failure after implementation.
- Carry-forward QA risk: Stage 8 improves player feedback and mechanism visibility, but spatial swap, recursive room, and chain-state are still not deep concrete rule implementations.

Next step:

- Commit and push Stage 8 to `origin main`.
- Continue the next loop on actual advanced rule-depth if requested/continued.

## Stage 8: Mechanism affordance and blocked-feedback polish

Goal:

- Close the user-facing feedback gap for blocked moves.
- Make level HUDs show current mechanism tags, including advanced v7 mechanics.
- Strengthen UI audit so these affordances cannot silently regress.

Actual changes:

- Added localized mechanic labels and per-level `.mechanic-chip` HUD tags.
- Added `.blocked-feedback` in level HUDs with `aria-live` feedback for wall, gate, crate, shadow, portal, pull, and other blocked reasons.
- Added a short blocked-move flash animation.
- Expanded the mechanism archive to include spatial swap, recursive room, chain-state, and misdirection entries.
- Expanded `audit:ui` to assert advanced mechanism archive labels, level mechanic chips, and blocked movement feedback.

Verification:

- `npm run typecheck`: passed.
- `npm run verify`: passed for all 70 levels.
- `npm run audit:levels`: passed with one replay/manual warning.
- `npm run audit:ui`: passed, including mechanism chips and blocked-feedback assertions.
- `npm run audit:content`: passed.
- `npm run smoke:api`: passed.
- `npm run smoke:ui`: passed for all 70 levels.
- `npm run smoke:visual`: passed and regenerated the screenshot set.
- `npm run build`: passed.

Failure items:

- No hard Stage 8 command failure after implementation.
- Carry-forward QA risk: this improves feedback/affordance clarity, but deeper concrete rules for spatial swap, recursive room, and chain-state are still not fully resolved.

Next step:

- Commit and push Stage 8 to `origin main`.
- Continue the v7 loop with advanced mechanism rule-depth work or explicitly record that as the remaining blocker.
