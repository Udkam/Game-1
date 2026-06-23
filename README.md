# Driftbox

Driftbox is in `v7-loop-20260623-195154-f683`.

## Current Status

The previous v6 2.5D route is retired from the user-facing mainline.

The first v7 70-level implementation checkpoint is now product-rejected. It still exists in the runtime until the next implementation stage replaces it, and its technical tests may pass, but it is not accepted as the final direction because the homepage, chapter map, chamber UI, role design, visual language, and level design still read too much like old Driftbox with a sci-fi skin.

The active redesign target is a new 20-level vertical slice called `Driftbox: Worldline Lab`:

- quantum experiment console home;
- worldline/star graph chapter map;
- chamber-style level panel;
- non-human quantum drone character;
- six core systems: recursive space, worldline split, time echo, spatial swap, multi-drone sync, and rule-block parameters;
- stored replay validation for every accepted slice level;
- visual smoke screenshots proving the redesign is not the rejected card/grid route.

The v7 process log is under:

```text
docs/v7-loop/v7-loop-20260623-195154-f683/
```

Key redesign documents:

```text
docs/v7-loop/v7-loop-20260623-195154-f683/11-reference-study.md
docs/v7-loop/v7-loop-20260623-195154-f683/12-redesign-spec.md
docs/v7-loop/v7-loop-20260623-195154-f683/13-puzzle-grammar.md
docs/v7-loop/v7-loop-20260623-195154-f683/14-ui-redesign-spec.md
docs/v7-loop/v7-loop-20260623-195154-f683/15-vertical-slice-20-report.md
```

## Development

```bash
npm install
npm run dev
npm run dev:server
```

## Verification

Current technical baseline commands:

```bash
npm run typecheck
npm run verify
npm run smoke:api
npm run smoke:ui
npm run audit:levels
npm run audit:ui
npm run audit:content
npm run smoke:visual
npm run build
```

Important: until the redesign implementation lands, these commands validate the rejected checkpoint and the process/documentation guardrails, not final product acceptance.
