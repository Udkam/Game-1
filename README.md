# Recursive Box Lab

Recursive Box Lab is a fresh browser demo for an original recursive box puzzle.
It starts from the documented reset baseline below and does not continue the
failed v8 implementation branch.

## Local Development

Install dependencies:

```sh
npm install
```

Run the playable prototype:

```sh
npm run dev
```

Verify the project:

```sh
npm run test
npm run typecheck
npm run build
```

## Current Demo Features

- Vite, React, TypeScript, and Vitest.
- Pure movement engine under `src/game`.
- Fifteen original tutorial levels under `src/levels/tutorial.ts`.
- Keyboard movement with WASD or arrow keys.
- Undo, reset, next-level controls, and visible world breadcrumb.
- Nested world preview inside open boxes.
- Level library, help view, about view, and localStorage progress persistence.
- CI workflow for install, test, typecheck, and build.

## Static Deployment

The app is a static Vite build:

```sh
npm run build
```

The deployable output is `dist/`. Do not commit `dist/` unless repository policy
changes. For GitHub Pages, publish the `dist/` output from a CI/deploy workflow
or upload it through the Pages artifact flow.

## Historical Reset Notice

This repository has been intentionally reset after the failed v8 reboot round.

The `main` branch was documentation-only at the start of this restart. The
current feature branch contains the new implementation.

## Current Status

- Status: failed prototype, reset for reboot.
- Failed run: `v8-reboot-parabox-worldline-20260624-023038-2a151f`.
- Failed implementation branch: `reboot/parabox-worldline-v8-reboot-parabox-worldline-20260624-023038-2a151f`.
- Last pushed commit on failed branch before cleanup: `50b3d62`.
- Backup branch retained: `backup/pre-reboot-v8-reboot-parabox-worldline-20260624-023038-2a151f`.
- Backup tag retained: `backup-pre-reboot-v8-reboot-parabox-worldline-20260624-023038-2a151f`.

## What Was Removed From Main

The local working tree on `main` was wiped except for `.git`, then this minimal
documentation set was recreated. Removed content includes the old application
source, server code, build output, dependencies, generated review drafts, and
implementation-stage reboot documents.

## Next Reboot Rule

Do not continue from the failed v8 implementation. A future reboot should start
from this documentation-only `main` state, create a fresh run id and branch, and
write new design and implementation records honestly from that point forward.
