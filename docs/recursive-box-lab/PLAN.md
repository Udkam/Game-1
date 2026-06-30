# Recursive Box Lab Plan

Stage 0 audit time: 2026-06-30 09:36:23 +08:00

## Current Project State

- Repository: `https://github.com/Udkam/Game-1.git`
- Baseline branch at audit start: `main`
- Implementation branch: `feature/recursive-box-lab`
- Current tracked project content is documentation-only.
- Existing reboot records classify the previous v8 implementation as failed and forbid continuing from it.
- No runnable application, package manifest, source tree, tests, or build tooling existed at the start of this stage.

## Existing Documents Reviewed

- `README.md`
- `docs/reboot/CURRENT_STATUS.md`
- `docs/reboot/FAILED_ROUND.md`
- Local-only handoff log: `docs/logs/CHANGELOG.md`

## Preservation Decisions

- Keep the reboot records as provenance.
- Treat `main` as the clean restart baseline.
- Do not copy implementation code, assets, level design, visual language, or documents from the failed v8 branch.
- Keep `docs/logs/CHANGELOG.md` as a local-only stage log because `.gitignore` already excludes it.

## Technical Stack

No application stack existed at audit time. The planned stack is:

- Vite
- React
- TypeScript
- Vitest for unit tests
- CSS modules or plain CSS tokens for lightweight UI styling

This keeps the demo browser-playable, testable, and lightweight without adding a heavy 3D engine.

## Target Gameplay

Recursive Box Lab is an original browser puzzle demo about boxes that can contain navigable worlds. The player pushes crates, enters open crates, pushes objects into contained worlds, and pushes entities back out through parent-world boundaries.

The first shippable target is a compact, high-quality demo rather than a complete commercial game.

## Non-Infringement Boundary

- Do not use Patrick's Parabox as the product name.
- Do not copy original levels, UI, assets, sound effects, copy, or visual identity.
- Use only original level layouts and original UI language.
- Mechanics can reference the general idea of recursive spaces, but implementation, presentation, content, and naming must be original.

## Stage Plan

1. Stage 0: audit the repository, preserve restart docs, and write this plan.
2. Stage 1: define the recursive puzzle specification and implement a testable TypeScript core engine.
3. Stage 2: create a playable browser MVP with five original tutorial levels.
4. Stage 3: strengthen nested-world mechanics, add debug tooling, and expand to ten levels.
5. Stage 4: apply design polish informed by the codex-design-skill reference.
6. Stage 5: add release-quality content, persistence, help/about docs, architecture docs, and CI/deploy readiness.

## Risks

- Recursive push rules can become ambiguous unless the data model separates world ownership, entity location, and container relationships.
- Self-reference must be rejected at first to avoid unserializable or infinite states.
- UI previews of nested worlds must stay readable on small screens.
- Prior failed-branch ideas must not leak into new level layouts or visual language.
- Stage commits must avoid ignored build output, dependencies, local logs, secrets, and screenshots.

## Verification Commands

Stage 0:

- `git status`

Future stages once the package manifest exists:

- `npm install` or `npm ci`
- `npm run test`
- `npm run typecheck`
- `npm run build`
- `npm run dev` for local manual verification when needed
