# Driftbox Work Report

RUN_ID: `v7-loop-20260623-195154-f683`

## Current direction

Driftbox is now in a v7 rebuild loop. The previous v6 2.5D route is considered failed for product acceptance and is no longer the user-facing mainline.

The v7 target is a 70-level 2D sci-fi Sokoban-variant puzzle game with:

- redesigned home, chapter star map, game HUD, win flow, mechanism archive, challenge record, settings/help, and chapter progress;
- quantum-lab visual direction;
- a new quantum-drone character;
- new mechanism families: time split, portals, multi-agent sync, chain state, spatial swaps, lightweight recursion, and fair misdirection;
- structured per-level design notes and verification status;
- replay validation preserved on the backend;
- visual screenshots and audits as hard acceptance gates.

Current runtime status:

- Stage 6 has expanded the exposed runtime catalog to 70 v7 levels.
- The catalog includes startup/core puzzles, quantum portals, synchronized actors, mirrored sync, time-shadow gate puzzles, and reviewed expansion candidates for spatial swap, recursive room, chain-state, misdirection, and finale chapters.
- It is verified through shared replay/solver paths and Playwright visual smoke screenshots, but it is not final acceptance until real-play QA sampling and concrete swap/recursive/chain behavior review are complete.

## Durable loop records

All current v7 records live in:

```text
docs/v7-loop/v7-loop-20260623-195154-f683/
```

Repo-local stage notes are also maintained in:

```text
codex.md
```

## v6 archival note

The v6 2.5D work remains available through git history only as historical context. It must not be described as the current finished direction, and its public runtime entries are being retired during the v7 loop.
