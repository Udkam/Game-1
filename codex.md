# Codex Work Log

## v7-loop-20260623-195154-f683

### Stage 1: Project reset and audit docs

Phase: documentation and loop setup.

Actions taken:

- Confirmed `main` is up to date with `origin/main`.
- Created the v7 loop directory structure.
- Added required v7 planning and audit files.
- Added required agent log files.
- Recorded the rule that every stage must verify, commit, and push to `origin main`.

Verification commands and results:

- `git status --short`: only Stage 1 documentation files are untracked.
- `npm run typecheck`: passed.
- `npm run verify`: passed, current baseline still reports 60/60 existing levels.
- `npm run smoke:api`: passed; `node:sqlite` ExperimentalWarning is non-fatal.
- `npm run smoke:ui`: passed; known blind spot remains for current 3D crate counting.

Changed files:

- `docs/v7-loop/CURRENT_RUN_ID.txt`
- `docs/v7-loop/v7-loop-20260623-195154-f683/*`
- `codex.md`

Risks:

- Stage 1 only establishes documentation and process; product code is not changed yet.

Next steps:

- Commit and push Stage 1.
- Begin Stage 2 route/runtime cleanup.

### Stage 2: Project reset and route cleanup

Phase: runtime v6 retirement.

Actions taken:

- Removed v6 3D level definitions from the exposed runtime catalog.
- Removed the visible `立体演示 (dev)` menu entry.
- Updated README, claude.md, and package description to mark v6 2.5D as retired and v7 as the current rebuild.
- Kept old 2.5D source code as unreachable historical reference for now.

Verification commands and results:

- `npm run typecheck`: passed.
- `npm run verify`: passed, 52/52 current exposed levels.
- `npm run smoke:api`: passed, `/api/levels` returns 52 levels.
- `npm run smoke:ui`: passed for all exposed levels.
- `npx tsx -e "...LEVELS check..."`: passed with `count=52`, no `3d*`, no `is3D`.
- `npm run build`: passed.
- A direct `node` import check failed because TypeScript source imports use `.js` specifiers before build; replaced with the `tsx` check.

Changed files:

- `README.md`
- `claude.md`
- `package.json`
- `src/engine/levels.ts`
- `src/web/ui.ts`
- v7 loop docs and agent logs

Risks:

- Old 2.5D source still exists but is not visible in the runtime catalog. Later stages should remove or archive it as the v7 shell replaces legacy UI.

Next steps:

- Commit and push Stage 2.
- Begin Stage 3 sci-fi art system and UI shell.

### Stage 3: New sci-fi art system and navigation shell

Phase: product shell and visual reset.

Actions taken:

- Replaced the old paper/wood CSS with a dark 2D sci-fi visual system.
- Rebuilt the home view as a command deck with progress, recent level, continue, chapter star map, mechanism archive, challenge records, and settings.
- Added records and settings overlays.
- Removed remaining visible 3D divider/badge handling from the home flow.
- Converted the package description to ASCII-only punctuation after confirming PowerShell console mojibake was only display/script-pipe related.

Verification commands and results:

- `npm run typecheck`: passed.
- `npm run verify`: passed, 52/52 current exposed levels.
- `npm run smoke:api`: passed, `/api/levels` returns 52 levels.
- `npm run smoke:ui`: passed for all exposed levels.
- `npm run build`: passed.
- Temporary `npx tsx -` DOM audit: passed for `.home-deck`, `#chapter-map`, primary continue, mechanism archive, records, settings, and no visible `立体演示` / `2.5D`.

Changed files:

- `package.json`
- `src/web/ui.ts`
- `src/web/styles.css`
- v7 loop docs and agent logs
- `codex.md`

Risks:

- Stage 3 is not final v7 acceptance. The app still runs the old 52 exposed level set and old mechanics.
- `smoke:visual`, `audit:ui`, `audit:levels`, and `audit:content` are still pending.
- Final self-hosted font/license choice is still pending.

Next steps:

- Commit and push Stage 3.
- Begin Stage 4 mechanism/data/test foundation.

### Stage 4: Engine mechanism and verification foundation

Phase: shared engine contract and replay foundation.

Actions taken:

- Added v7 typed metadata: `V7Mechanic`, `LevelDesignNote`, `SolverStatus`, `ValidationMethod`, `SpaceProfile`, and typed configs for time shadow, chain, spatial swap, and recursive room.
- Extended `LevelDef` / `Level` parsing with chapter, mechanics, v7 design notes, and validation method fields.
- Added deterministic `timeShadow` support to engine state/rules: delayed player copy, optional player/crate blocking, optional plate pressure, and state-key participation.
- Added `blockedReason` to `MoveResult` and exposed `lastBlockedReason` on `Game` / `DiptychGame`.
- Added renderer/CSS support for a visible `time-shadow` piece.
- Upgraded `npm run verify` output to include v7 acceptance fields.
- Added v7 metadata fields to `/api/levels`.

Verification commands and results:

- `npm run typecheck`: passed.
- `npm run verify`: passed, 52/52 current exposed levels; output now lists `id`, `title`, `chapter`, `solverStatus`, `solutionLength`, `par`, and `validation`.
- Temporary `npx tsx -` timeShadow check: passed, delay-1 shadow appeared and blocked re-entry.
- `npm run smoke:api`: passed.
- `npm run smoke:ui`: passed for all exposed levels.
- `npm run build`: passed.

Changed files:

- `scripts/verify-levels.ts`
- `server/index.ts`
- `src/engine/types.ts`
- `src/engine/level.ts`
- `src/engine/rules.ts`
- `src/web/game.ts`
- `src/web/render.ts`
- `src/web/styles.css`
- v7 loop docs and agent logs
- `codex.md`

Risks:

- Stage 4 is a foundation milestone, not final gameplay acceptance.
- `chain`, `spatialSwap`, and `recursiveRoom` still need concrete rules and UI behavior.
- The catalog remains the transitional 52-level set until Stage 5/7.

Next steps:

- Commit and push Stage 4.
- Begin Stage 5 level data upgrade and first 15-level vertical slice.

### Stage 5: Level data upgrade and 15-level v7 vertical slice

Phase: catalog replacement and vertical slice verification.

Actions taken:

- Added `src/engine/v7Levels.ts` with 15 v7 levels and complete `levelDesignNote` metadata.
- Switched the exposed runtime catalog from the transitional 52 levels to `V7_LEVEL_DEFS`.
- Updated the mechanism codex to v7 anchors and sci-fi mechanism language.
- Removed the remaining level-page `IsoRenderer` / demo fallback path so v7 runtime play is 2D-only.
- Changed progress storage to `driftbox.progress.v7`.
- Updated plate rendering so time shadows visibly press plates.
- Updated `06-level-design-matrix.md` with the 15-level verified slice.
- Updated README and `claude.md` to state the current runtime is a 15-level v7 slice, not final 70-level acceptance.
- Updated `smoke-api` to stop hardcoding the old `l1` id.
- Updated `verify` so levels declared `optimal` actually run the solver.

Verification commands and results:

- Initial `npm run typecheck` / `npm run verify`: failed because one design note had an unescaped apostrophe. Fixed.
- Initial `npm run smoke:api`: failed because the test queried old `/api/scores/l1`. Fixed.
- `npm run typecheck`: passed.
- `npm run verify`: passed, 15/15 v7 slice levels.
- `npm run smoke:api`: passed, `/api/levels` returns 15 levels.
- `npm run smoke:ui`: passed, all 15 levels win through jsdom.
- `npm run build`: passed.
- One parallel typecheck run saw an intermediate edit state with old `camBar` / `iso` symbols; standalone final `npm run typecheck` passed.

Changed files:

- `src/engine/v7Levels.ts`
- `src/engine/levels.ts`
- `src/web/ui.ts`
- `scripts/verify-levels.ts`
- `scripts/smoke-api.ts`
- `README.md`
- `claude.md`
- v7 loop docs and agent logs
- `codex.md`

Risks:

- Stage 5 is 15/70, not the final 70-level game.
- Spatial swap, recursion, and chain-state levels are still pending.
- Visual screenshot smoke, mobile layout proof, and final audit commands are still pending.

Next steps:

- Commit and push Stage 5.
- Begin Stage 6 full 70-level buildout and final audit command implementation.

### Stage 6: Full 70-level buildout and non-visual audits

Phase: full catalog expansion and audit hardening.

Actions taken:

- Expanded the exposed v7 runtime catalog to exactly 70 levels across the requested 9-chapter structure.
- Added complete `levelDesignNote` metadata for every level, including mechanics, core idea, trick, fairness, difficulty, solver status, par, and validation method.
- Added `npm run audit:levels`, `npm run audit:ui`, and `npm run audit:content`.
- Added screen transition state/classes and mobile horizontal overflow guards for UI auditability.
- Updated README, `claude.md`, level matrix, art direction, and acceptance status to match the current 70-level runtime without claiming final visual acceptance.
- Fixed duplicate helper-generated layout signatures found by `audit:levels`.

Verification commands and results:

- `npm run audit:levels`: passed; warning remains that all 70 levels rely on replay/manual status and advanced chapters need sample-play review.
- `npm run typecheck`: passed.
- `npm run verify`: passed for all 70 levels.
- `npm run audit:ui`: passed.
- `npm run audit:content`: passed.
- `npm run smoke:api`: passed; all 70 stored solutions accepted by the server and invalid submissions rejected.
- `npm run smoke:ui`: passed; all 70 levels play to win through the jsdom UI path.
- `npm run build`: passed.

Changed files:

- `src/engine/v7Levels.ts`
- `src/web/ui.ts`
- `src/web/styles.css`
- `scripts/audit-levels.ts`
- `scripts/audit-ui.ts`
- `scripts/audit-content.ts`
- `package.json`
- `README.md`
- `claude.md`
- v7 loop docs and agent logs
- `codex.md`

Risks:

- Spatial swap, recursive room, and chain-state chapters are represented by replay/manual scenarios and metadata, but deeper concrete mechanism hooks still need follow-up review.
- Real-play puzzle quality sampling is still needed for advanced chapters even though replay/visual gates pass.

Next steps:

- Complete visual smoke implementation and screenshot QA.
- Commit and push the full Stage 6/7 checkpoint.

### Stage 7: Playwright visual smoke and screenshot QA

Phase: real-browser visual evidence.

Actions taken:

- Added `playwright` as a dev dependency.
- Added `npm run smoke:visual`.
- Implemented `scripts/smoke-visual.ts`, which starts Vite, opens the real app in Chromium, captures the required 15 desktop/mobile screenshots, and saves them under the active run directory.
- Re-ran visual smoke after the 70-level catalog and audit fixes.
- Fixed the mobile intro banner so the `知道了` dismiss button no longer collapses into vertical characters.

Verification commands and results:

- `npm run typecheck`: passed.
- `npm run verify`: passed for 70/70 levels.
- `npm run smoke:api`: passed; all 70 stored solutions accepted by server replay.
- `npm run smoke:ui`: passed; all 70 levels play to win through jsdom UI.
- `npm run smoke:visual`: passed; 15 screenshots written.
- `npm run audit:levels`: passed with one warning that all 70 levels rely on replay/manual status and advanced chapters need sample-play review.
- `npm run audit:ui`: passed.
- `npm run audit:content`: passed.
- `npm run build`: passed.

Changed files:

- `package.json`
- `package-lock.json`
- `scripts/smoke-visual.ts`
- `docs/v7-loop/v7-loop-20260623-195154-f683/screenshots/*.png`
- `src/web/styles.css`
- v7 loop docs and agent logs
- `codex.md`

Risks:

- Visual smoke proves pages render and are nonblank, but it is not a design-quality guarantee for the advanced mechanism chapters.
- Spatial swap, recursive room, and chain-state chapters still require concrete rule-depth follow-up.
- Screenshot QA caught and fixed the mobile intro-button layout; keep this check in later visual runs.

Next steps:

- Commit and push this checkpoint.
- Continue with deeper mechanism implementation/QA loop.

### Stage 8: Mechanism archive, HUD tags, and blocked feedback

Phase: visible mechanism affordances.

Actions taken:

- Expanded the mechanism archive to include spatial swap, recursive room, chain-state, and misdirection entries.
- Updated v7 archive anchors to the current 70-level catalog IDs.
- Added a level-page mechanism chip row sourced from each level's v7 metadata.
- Surfaced `blockedReason` in the HUD as short feedback when movement is denied.
- Strengthened `audit:ui` so it fails if advanced mechanism archive entries, mechanic chips, or blocked feedback disappear.

Verification commands and results:

- `npm run typecheck`: passed.
- `npm run audit:ui`: passed, including the new archive/chip/blocked-feedback assertions.
- `npm run smoke:ui`: passed for all 70 levels.
- `npm run smoke:visual`: passed and refreshed screenshots.
- `npm run build`: passed.
- `npm run audit:content`: passed.
- `npm run verify`: passed for all 70 levels.
- `npm run smoke:api`: passed; all 70 stored solutions accepted by server replay.
- `npm run audit:levels`: passed with the retained replay/manual warning.

Changed files:

- `src/web/ui.ts`
- `src/web/styles.css`
- `scripts/audit-ui.ts`
- refreshed visual screenshots
- v7 loop docs and `codex.md`

Risks:

- This improves visible feedback but still does not implement deeper concrete gameplay rules for spatial swap, recursive room, or chain-state.

Next steps:

- Commit and push Stage 8.
- Continue with actual advanced rule-depth work if the loop proceeds.

### Stage 9: Redesign Reset and Reference Study

Phase: product reset, reference study, and redesign documentation.

Actions taken:

- Confirmed local `HEAD` and `origin/main` were both `dcc84fa`, with no unpushed commits.
- Accepted the user's screenshot QA as a hard failure of the current v7 route.
- Stopped the current route of homepage/card/board polish and 70-level expansion.
- Added `11-reference-study.md` before implementation, covering Patrick's Parabox, 茜塔和世界线悖论, Baba Is You, Recursed, Portal, Opus Magnum, and Stephen's Sausage Roll.
- Added `12-redesign-spec.md`, `13-puzzle-grammar.md`, `14-ui-redesign-spec.md`, and `15-vertical-slice-20-report.md`.
- Rewrote `07-art-direction.md` with new character candidates and a quantum-drone state-sheet requirement.
- Rewrote `10-acceptance-report.md`, `README.md`, and `claude.md` to state that the current v7 70-level checkpoint is product-rejected and the next accepted target is a 20-level redesign slice.
- Expanded `audit:content` so it checks the new redesign documents and rejection/reset status.

Verification commands and results:

- Initial `npm run audit:content`: failed because the redesign-spec check expected a lowercase phrase instead of the actual `Six Core Systems` heading. Fixed `scripts/audit-content.ts`.
- Initial UTF-8/mojibake marker command: failed because a regex containing `????` was invalid. Replaced it with string-marker checking.
- `npm run audit:content`: passed after the audit fix.
- `npm run typecheck`: passed.
- UTF-8/mojibake marker check over README, claude.md, codex.md, and Stage 9 redesign docs: passed after replacing one historical `????` mention in `09-iteration-log.md` with readable text.

Changed files:

- `README.md`
- `claude.md`
- `scripts/audit-content.ts`
- `docs/v7-loop/v7-loop-20260623-195154-f683/07-art-direction.md`
- `docs/v7-loop/v7-loop-20260623-195154-f683/09-iteration-log.md`
- `docs/v7-loop/v7-loop-20260623-195154-f683/10-acceptance-report.md`
- `docs/v7-loop/v7-loop-20260623-195154-f683/11-reference-study.md`
- `docs/v7-loop/v7-loop-20260623-195154-f683/12-redesign-spec.md`
- `docs/v7-loop/v7-loop-20260623-195154-f683/13-puzzle-grammar.md`
- `docs/v7-loop/v7-loop-20260623-195154-f683/14-ui-redesign-spec.md`
- `docs/v7-loop/v7-loop-20260623-195154-f683/15-vertical-slice-20-report.md`
- v7 agent logs

Risks:

- Runtime still exposes the rejected 70-level checkpoint until the implementation stage replaces it.
- Historical docs still contain some mojibake in old stage excerpts; new redesign docs must stay clean and should be checked explicitly.
- `audit:levels` still validates the rejected 70-level checkpoint until slice-mode implementation changes it.

Next steps:

- Finish agent-log reset notes.
- Run content/encoding/typecheck verification.
- Commit and push Stage 9.
- Start implementation of the redesigned 20-level vertical slice only after this reference/design checkpoint is pushed.
