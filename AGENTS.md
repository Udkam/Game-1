# Game-1 Repository Operating Contract

Status: authoritative repository-wide instructions for every Codex task,
worktree, and workstream in this repository.

## 1. Mission and completion truth

Game-1 is a clean-room, high-fidelity browser study of recursive spatial puzzle
mechanics. The target is a genuinely playable original game with the spatial
clarity, recursive continuity, responsiveness, and game feel associated with
Patrick's Parabox. It is not a request to copy proprietary source, levels,
assets, audio, branding, names, or text.

The repository is currently less than 10% complete relative to that target.
Historical labels such as `Stage 6` describe old implementation passes only.
They are never evidence of feature, visual, engine, content, or release
completion.

## 2. Instruction precedence

When documents disagree, use this order:

1. The user's latest explicit instruction.
2. This `AGENTS.md`.
3. `CURRENT_TASK.md` for the active bounded slice and file ownership.
4. `DESIGN.md` for the current product and visual contract.
5. Accepted slice contracts, especially
   `docs/workstreams/gameplay-rules-engine/RULES_SLICE_R1_CONTRACT.md`.
6. `ARCHITECTURE.md` and `DESIGN_REFERENCE.md` for enduring architecture and
   reference evidence.
7. Independent QA requirements in
   `docs/workstreams/qa-approval/QA_APPROVAL_RUBRIC.md`.
8. Workstream proposals and historical stage documents.

`IMPLEMENTATION_PLAN.md`, the historical stage screenshots, and old Stage 1-6
reports are evidence, not current authority, unless `CURRENT_TASK.md` adopts a
specific requirement from them.

## 3. Required startup protocol

Before changing anything:

1. Read this file, `CURRENT_TASK.md`, and the relevant sections of `DESIGN.md`.
2. Read the accepted contract for the owned slice and the latest owner
   workstream log.
3. Inspect `git status --short`, the current branch/ref, and the candidate base
   SHA. Preserve unrelated and user-owned changes.
4. Confirm the exact allowed and excluded paths in `CURRENT_TASK.md`.
5. Inspect the current implementation and tests; do not infer current behavior
   from a historical status document.
6. Record assumptions and blocking dependencies before implementation.

If a task cannot identify its current slice, file ownership, and independent
QA reviewer, it must stop at read-only analysis.

## 4. Workstream ownership and coordination

The coordinator task is `019f4deb-7e83-7583-8cd5-8e6f075bc331`.

| Workstream | Task ID | Owns |
| --- | --- | --- |
| Coordinator/integration | `019f4deb-7e83-7583-8cd5-8e6f075bc331` | Root contracts, slice authorization, integration, final verification, `docs/logs/CHANGELOG.md`, push/release decisions |
| Frontend/visual/runtime | `019f4e80-145a-7520-81e1-41a45b2bec13` | Approved projection/render/runtime/input/visual slices and its workstream log |
| Gameplay rules/engine | `019f4e82-7cb8-73c1-b4a1-d333273b359f` | Approved deterministic core slices and its workstream log |
| Level/puzzle design | `019f4e80-145c-7b53-b675-44b03aa4f625` | Original level/schema proposals after their dependencies are accepted |
| Independent QA | `019f4e80-1462-7b32-8146-19ded692836c` | Read-only review, QA evidence, verdicts, and its QA log; never self-approves production work |

Rules for all non-coordinator workstreams:

- Work only on an explicitly authorized slice and exact paths.
- Do not merge, rebase, push, or edit the root changelog.
- Commit the candidate in the isolated worktree and report its SHA.
- Update only the owning `docs/workstreams/<name>/THREAD_LOG.md` when the slice
  requests a log update.
- Do not create acknowledgement-only commits after reporting a candidate.
- Do not consume another workstream's unaccepted commit as authority.
- Stop after handoff until independent QA and coordinator decisions arrive.

Only the coordinator integrates accepted candidates into `main`, updates
`docs/logs/CHANGELOG.md` for an implemented milestone, and pushes.

## 5. Clean-room and intellectual-property boundary

- Use official screenshots, videos, interviews, and public descriptions only
  as external comparison evidence.
- Create original procedural geometry, palettes, layouts, levels, names, copy,
  audio, and code.
- Do not commit downloaded official screenshots, extracted assets, traced
  geometry, copied level coordinates, official audio, logos, or branding.
- Public repositories may inform architecture, but no code or content may be
  copied without an explicit compatible-license review and attribution plan.
- Reports must say “clean-room study” or “high-fidelity recursive puzzle
  target,” not claim that this repository is the official game.

## 6. Architecture invariants

Dependencies flow in one direction:

```text
input -> runtime -> core command/result
                    |
                    v
               projection -> animation/render -> PixiJS canvas
```

Non-negotiable rules:

- React owns the host shell and lifecycle only. Gameplay cells, entities,
  worlds, recursive previews, camera transforms, and animation trees never
  become React DOM nodes.
- PixiJS owns the single gameplay canvas, retained scene graph, camera, masks,
  procedural visuals, and visual frame loop.
- `src/core/**` is deterministic TypeScript. It must not import React, PixiJS,
  DOM/browser APIs, CSS, camera, viewport, renderer, audio playback, or timing.
- Canonical simulation state contains worlds, entities, components, focus,
  rules, and history—not pixels, display objects, animation progress, or input
  device state.
- Every state-changing action uses the public command path. Keyboard, pointer,
  touch, replay, tests, and accessibility controls cannot have separate rule
  implementations.
- Invalid data and blocked/invalid commands are total and deterministic: no
  uncaught exception, no partial mutation, no history change, one typed result.
- Recursive rendering uses bounded projections of canonical state. It never
  clones mutable gameplay state for a preview.
- Every visible occurrence uses a stable root-plus-container-path address.
  Canonical entity ID alone is not a render, event, or animation key.
- Runtime never hard-codes fixture, world, entity, container, or level IDs.
- Renderer never mutates canonical state or infers rules from draw order.
- Undo, redo, reset, replay, and win checks operate on canonical data and
  reproduce deterministic hashes and semantic events.

## 7. Rules-engine requirements

The accepted R1 contract is normative for the first core implementation:

- `Step(direction)` resolves ports and interaction priority deterministically.
- Attempt, result, rejection, transaction, event, cell, world, entity
  occurrence, and port occurrence shapes must match the frozen contract.
- Step and non-Step rejected-command invariants remain distinct.
- `cycleMode: "forbid"` validates the complete graph, including unreachable
  components, before a fixture can run.
- Port landing and exit selection use resolved world/cell addresses.
- No push-in/out or cyclic feature may be smuggled into a slice that excludes
  it. Later mechanics require their own accepted contract and tests.

Core changes require unit tests for every success, blocked, invalid, history,
replay, focus-path, and graph-validation branch. Contracted stress tests use the
fixed generator, seed, command domain, oracle, and reproducer—not an ad hoc
random loop.

## 8. Frontend and rendering requirements

- Follow `DESIGN.md`; do not improvise a generic dashboard, card grid, neon
  landing page, or CSS board.
- Shared render metrics and authored palette/material tokens are the only
  geometry/color authorities. Do not scatter pixel constants through
  primitives.
- Support detached-void and cropped-parent-context compositions.
- A recursive container is a masked world aperture with path identity, not a
  thumbnail or UI card.
- One accepted command owns one visual completion barrier covering entity,
  projection, camera, aperture, and effects. Input cannot unlock from a shorter
  sub-animation.
- The scene graph is retained. Do not clear and rebuild every render layer on
  each animated frame.
- Cap device-pixel ratio according to `DESIGN.md`; test actual desktop and
  mobile viewport dimensions.
- Respect `prefers-reduced-motion` without changing command results or hashes.
- Pointer/touch and keyboard emit the same commands. Provide visible focus,
  truthful canvas labeling, and 44 CSS px minimum interactive targets.
- No unexpected browser console warning/error is acceptable.

## 9. Verification gates

Every implementation candidate runs, at minimum:

```text
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
git diff --check
```

At integration milestones, the coordinator additionally verifies a clean
dependency install with `npm.cmd ci --no-audit --no-fund`.

Core candidates also provide:

- exact command traces and initial/final hashes;
- unchanged-state evidence for rejected commands;
- undo/redo/reset/replay evidence;
- focus, port, graph, cycle-policy, and 1,000-sequence stress evidence.

Runtime/render candidates also provide deterministic browser evidence at:

- desktop: 1440x900, DPR 1;
- mobile: 390x844, reported DPR 3 with a documented renderer-resolution cap;
- enter/exit: start, 50%, and settled frames;
- reduced motion: equivalent final state and camera target.

Each browser report includes candidate SHA, browser/OS, exact viewport/DPR,
command trace and capture time, screenshot dimensions, canvas count, gameplay
DOM count, console problems, visible occurrence addresses, and pixel/geometry
metrics. Applicable candidates also report p50/p95 frame time, render-object
count/depth, and 30-cycle heap behavior.

A green build or a nonblank screenshot alone is never acceptance. Independent
QA must review the exact candidate SHA.

## 10. Git, files, and documentation

- Use UTF-8 for source and documentation. On Windows/PowerShell, set explicit
  UTF-8 input/output before inspecting or transforming Chinese-facing text.
- Use `rg`/`rg --files` for search and `apply_patch` for hand edits.
- Never use `git add .`; stage exact reviewed paths.
- Never stage `.codex/`, `.serena/`, `node_modules/`, `dist/`, browser state,
  temporary captures, or unrelated local logs.
- Do not use destructive Git or filesystem commands without explicit user
  authorization.
- Preserve unrelated dirty-worktree changes.
- Workstream evidence belongs under `docs/workstreams/<owner>/` or an approved
  `docs/qa/`/`docs/screenshots/` path.
- Only the coordinator edits `docs/logs/CHANGELOG.md`, and only when integrating
  a QA-accepted implemented milestone—not for unimplemented planning alone.
- `CURRENT_TASK.md` must be updated when a slice starts, changes scope, is
  accepted, rejected, blocked, or superseded.

## 11. Stop conditions

Stop and return to the coordinator when:

- required authority, file ownership, or contract is missing;
- the candidate needs a path owned by another active slice;
- a public type change would cross the frozen C1/V1 boundary;
- official/copied assets or level data would be required;
- a clean install, deterministic test, browser capture, or required tool cannot
  be reproduced;
- the same blocker remains after bounded safe diagnostics;
- QA rejects or conditionally rejects the candidate.

Do not broaden scope to “finish the feature” around a failed gate. Report the
smallest evidence-backed blocker and wait for a new bounded decision.
