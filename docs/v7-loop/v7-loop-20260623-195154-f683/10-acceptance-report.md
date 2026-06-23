# Acceptance Report

Status: Stage 10 redesign slice implemented, not final 70-level accepted.

RUN_ID: `v7-loop-20260623-195154-f683`

## Current Stage 10 Status

- Product acceptance: failed for the previous v7 route.
- Runtime catalog: exposes the new 20-level `Worldline Lab` redesign slice.
- Technical baseline before reset: Stage 8 commands passed, but that is no longer sufficient product acceptance.
- New accepted target: prove this 20-level slice visually and mechanically before any renewed 70-level expansion.
- v6 2.5D status: retired from user-facing runtime and treated as failed/archive context.
- Rejected 70-level v7 skinning route: archived in git history and must not be extended as the mainline.

## Failure Finding

```text
[FAIL] Current v7 product acceptance
Evidence: Screenshot review found the homepage still resembles title/progress/buttons/cards, the chapter map is still card-like, the chamber still resembles old tile Sokoban, the role still inherits the small-person/Pip lineage, and the level set does not show enough system-puzzle depth.
Root cause: The route prioritized catalog expansion, audit passing, and dark sci-fi styling before proving a new mechanism language and UI architecture.
Fix plan: Stop expanding current 70-level data. Complete reference study and redesign docs, then replace the public runtime with a new 20-level vertical slice centered on recursive space, worldline split, time echo, spatial swap, sync drones, and rule blocks.
Files to change: docs/v7-loop/v7-loop-20260623-195154-f683/09-iteration-log.md; docs/v7-loop/v7-loop-20260623-195154-f683/11-reference-study.md; docs/v7-loop/v7-loop-20260623-195154-f683/12-redesign-spec.md; docs/v7-loop/v7-loop-20260623-195154-f683/13-puzzle-grammar.md; docs/v7-loop/v7-loop-20260623-195154-f683/14-ui-redesign-spec.md; docs/v7-loop/v7-loop-20260623-195154-f683/15-vertical-slice-20-report.md
Re-test: npm run audit:content; UTF-8/mojibake marker check; QA negative review; later full command gate after implementation
```

## Redesign Documents

- `11-reference-study.md`: completed before implementation.
- `12-redesign-spec.md`: completed before implementation.
- `13-puzzle-grammar.md`: completed before implementation.
- `14-ui-redesign-spec.md`: completed before implementation.
- `15-vertical-slice-20-report.md`: implemented slice report.

## Stage 10 Runtime Gate

The current accepted runtime checkpoint is not "70 levels still pass." It is:

- New quantum experiment console home: implemented and screenshot-reviewed.
- New worldline/star graph map: implemented; desktop screenshot now shows all 20 slice nodes, with mobile retaining horizontal browse behavior.
- New chamber experiment panel: implemented and screenshot-reviewed on desktop/mobile.
- New non-human quantum drone state component and state sheet: implemented with idle/move/push/pull/sync/teleport/split/blocked/victory samples.
- New 20-level vertical slice with stored replay verification: implemented; all 20 replays pass.
- At least one accepted level each for recursion, worldline split, time echo, spatial swap, multi-drone sync, and rule blocks: implemented.
- Updated visual smoke screenshots including a character state sheet: implemented.

## Stage 10 Verification Results

- `npm run typecheck`: passed.
- `npm run verify`: passed for 20/20 redesign slice levels.
- `npm run smoke:api`: passed; `/api/levels` returns 20 and all stored replays are accepted.
- `npm run smoke:ui`: passed; all 20 levels play to a win through jsdom UI.
- `npm run smoke:visual`: passed; 13 redesign screenshots regenerated.
- `npm run audit:levels`: passed with one warning that the slice relies on replay/manual validation.
- `npm run audit:ui`: passed.
- `npm run audit:content`: passed.
- `npm run build`: passed.

## Stage 10 QA Notes

- The previous v7 route remains rejected; this report does not reclassify it as successful.
- QA negative check found two Stage 10 visual evidence issues and both were repaired before push:
  - mobile level screenshot was taken during transition opacity, fixed by waiting for `.screen-view.entered`;
  - desktop worldline screenshot hid final nodes outside overflow, fixed by reducing desktop graph width while preserving mobile browse.
- Current screenshots show a central experiment core, a connected worldline graph rather than level cards, a non-human quantum drone, and chamber UI rather than the rejected card-grid chapter selector.

## Known Non-Final Items

- This is a 20-level redesign slice, not the final 70-level product.
- Most slice validation is replay/manual rather than mechanism-specific optimal solving.
- Recursive-room remains a lightweight visible layer/metadata implementation, not full nested-room simulation.
- Rule-blocks are represented through local key/lock and gate semantics in the slice; a richer rule engine is future work.
- Worldline split uses visible twin-board branch state; a full branching timeline model is future work.
- Existing docs may still contain historical mojibake in old stage excerpts; new redesign docs must remain UTF-8 clean.

## Screenshot Path

```text
docs/v7-loop/v7-loop-20260623-195154-f683/screenshots/
```

The Stage 10 redesign slice regenerated:

- `01-home-console.png`: new home console.
- `02-worldline-star-graph.png`: worldline star graph.
- `03-level-001.png`: level 1.
- `04-portal-005.png`: portal/link level.
- `05-sync-008.png`: sync level.
- `06-time-echo-011.png`: time echo level.
- `07-spatial-swap-014.png`: spatial swap level.
- `08-recursive-017.png`: recursive chamber level.
- `09-misdirection-019.png`: misdirection/worldline level.
- `10-character-state-sheet.png`: quantum drone state sheet.
- `11-victory-collapse.png`: victory collapse.
- `12-mobile-home.png`: mobile home.
- `13-mobile-level.png`: mobile chamber.

## Required Final Contents

- RUN_ID
- completed stages
- accepted runtime level count
- new mechanisms
- main visual changes
- test results
- screenshot paths
- known issues
- key commit hashes
- push status
