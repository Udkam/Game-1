# Driftbox

Driftbox is being rebuilt in `v7-loop-20260623-195154-f683` as a 2D sci-fi Sokoban-variant puzzle game.

## Current status

- The previous v6 2.5D direction is retired from the user-facing mainline.
- The public runtime currently exposes a 70-level v7 catalog with sci-fi metadata, quantum portals, synchronized actors, time-shadow replay validation, and reviewed expansion candidates for later mechanism chapters.
- The target v7 release is a complete 70-level 2D sci-fi game with new screens, new visual identity, richer level metadata, replay validation, visual smoke tests, and level/content/UI audits.
- This is not final acceptance yet: deeper real-play QA for advanced chapters and concrete spatial-swap/recursive/chain rules still need follow-up.

The v7 process log is under:

```text
docs/v7-loop/v7-loop-20260623-195154-f683/
```

## Development

```bash
npm install
npm run dev
npm run dev:server
```

## Verification

Current baseline commands:

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

Visual smoke screenshots are written to:

```text
docs/v7-loop/v7-loop-20260623-195154-f683/screenshots/
```
