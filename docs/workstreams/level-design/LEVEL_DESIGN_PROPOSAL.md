# Level Design Proposal: Four-Fold Tutorial

Status: audit/design proposal only. This document does not approve a schema,
serialize a level, or add puzzle content.

## Evidence And Boundary

- Baseline: 3b23df3 — Stage 6 renderer fidelity alignment.
- src/levels is absent. The runnable prototype mounts the hard-coded
  createStage3BSimulationState() fixture directly.
- The core has prototype support for movement, push chains, explicit
  enter/exit, movable containers, multi-world goal checks, hashes, and command
  replay. It is not yet an approved level contract.
- The campaign will use original learning beats and fresh layouts only; it must
  not trace screenshots or reproduce Patrick's Parabox levels, copy, or assets.

No coordinates, JSON documents, wire formats, or field names are included here.
They must follow, rather than decide, the approved rule and serialization
contracts.

## Campaign Goal

The tutorial should teach four durable ideas in order:

1. A framed box is a real space that can be entered and exited.
2. Objectives remain true across worlds even when the camera is elsewhere.
3. A recursive frame is both a pushable parent-world object and a stable edge
   to its child world.
4. Nested spaces compose as one coherent puzzle, not disconnected screens.

The launch tutorial contains four small levels. It excludes push-in, push-out,
cycles, multi-entrance routing, and object transfer across boundaries until
those mechanics have approved semantics and independent tests.

## Progression

| ID | Working title | New idea | Required player milestone | Target complexity |
| --- | --- | --- | --- | --- |
| tutorial-01 | Through the Frame | A container is enterable space, not decoration. | Enter one frame, complete one inner push, exit, then complete a parent objective. | 8-14 accepted commands; one intentional push. |
| tutorial-02 | Both Rooms Count | A hidden child goal still blocks completion. | Complete one parent goal and one child goal, with one deliberate focus change. | 16-26 accepted commands; no multi-box chain. |
| tutorial-03 | Move the Window | A moved frame keeps the same child-world identity. | Push a frame in the parent, enter its unchanged child, then use its relocated parent address. | 25-40 accepted commands; one container push. |
| tutorial-04 | A Room Within | Nested worlds compose in order. | Enter two frames, solve a compact deepest-world task, exit twice, then resolve the outer objective. | 45-70 accepted commands; two enters/two exits. |

These are design envelopes, not promised solution lengths. Exact command traces
may be set only after the rules workstream has defined legal entry and exit.

## Per-Level Design Intent

### tutorial-01 — Through the Frame

Use a compact parent slab with one unmistakably open frame. The child contains
the first goal and a single pushable object; the parent retains a separate,
post-exit objective. Route staging must make the frame the only meaningful
early interaction without invisible blockers or explanatory gameplay text.

The solved read is the player visibly returned to the parent with both world
objectives complete. This establishes the camera's entry/exit language in the
smallest setting.

### tutorial-02 — Both Rooms Count

Show the parent goal clearly, while the child goal is visible only through the
aperture. An apparently complete parent state must remain unsolved until the
child-space task is handled. The difficulty is the global win condition, not a
long ordinary Sokoban corridor.

### tutorial-03 — Move the Window

The movable frame is the only parent-space object that changes the access plan.
Its inner room must remain recognizably identical before and after the push.
The solution milestone is not merely moving a crate: the player must use the
frame's new parent-space position when exiting or resolving the parent task.

### tutorial-04 — A Room Within

Use a root frame containing a middle world with a visually distinct second
frame. The deepest chamber holds one modest task; the final action happens only
after returning to the root. Avoid symmetric side branches so the nesting order
is legible directly from the board.

## Content Guardrails

- Keep visible worlds roughly 5-8 cells per side and introduce one new
  recursive idea per level. Exact dimensions are intentionally deferred.
- Every level must require entry, exit, or container relocation; no level may
  primarily test conventional wall/box pushing.
- Do not introduce cycles, timed state, hidden rules, or any excluded mechanism
  in this campaign.
- Use one unique minimum plan, rather than claiming one unique raw sequence of
  keystrokes. Reversible walking must not be mistaken for puzzle depth.

## Solvability, Determinism, And Uniqueness Gates

Each included level requires automated evidence after the rule and serialization
contracts are approved:

1. Load validation accepts the level and rejects a broken variant (unknown
   world, invalid position, overlapping solids, or invalid container edge).
2. The authored trace goes through the same command path as player input; every
   intended state-changing command is accepted and no blocked move is required.
3. Repeated replay from the immutable initial state gives the same final hash,
   accepted-command count, milestone sequence, and win result.
4. The final canonical state satisfies every goal, including hidden/nested
   goals; full undo/redo reproduces the expected state hashes.
5. A bounded state-space verifier finds no plan cheaper than the authored
   trace, under the approved cost model.
6. After collapsing walk-only detours, immediate undo/redo pairs, and
   commutative movement within a milestone, exactly one optimal irreversible
   milestone signature remains.
7. The test report captures commands, final hash, milestone signature, solver
   state count, and depth limit. Solver exhaustion is a failure, not uniqueness
   evidence.

The intended unique plan is the ordered set of pushes, enters, exits, and goal
placements. Raw keystroke uniqueness is not useful because arbitrary walking
loops are mechanically equivalent.

## Level-Schema Needs Without Freezing Semantics

The future schema must be able to represent:

- stable level/schema identity, ordering, and a presentation key;
- worlds, dimensions, root/player identity, palette or staging intent;
- canonical entities, positions, visual roles, collision/push roles, goals, and
  container-to-child-world edges;
- the entrance/exit data required by the approved recursive rules;
- an optional deterministic solution/replay expectation, embedded or stored in
  an adjacent fixture;
- visual-QA needs such as projection depth and composition mode;
- a non-gameplay provenance marker confirming original-layout authorship.

Level Serialization owns the actual document shape, validation errors,
migration policy, and replay-storage choice. This workstream will not
pre-commit them with placeholder JSON.

## Visual Staging Requirements

| Level | Composition | Visual proof required |
| --- | --- | --- |
| tutorial-01 | Isolated root slab in void; one highly legible aperture. | Initial, entered-child, and solved-after-exit views retain a readable child world. |
| tutorial-02 | Cropped parent edge; child goal initially readable through the aperture. | Parent-almost-solved view makes the remaining child obligation clear. |
| tutorial-03 | Broad parent slab with room around the movable frame. | Before/after push views prove outer relocation while the inner room retains identity. |
| tutorial-04 | Nested frames with context retained at depth two. | Entry at both depths and the final root return prove continuous scale and hierarchy. |

Parent and child palettes must not collapse into the same color family. The
renderer must make the required nesting depth visible; a default projection
depth is not acceptance evidence. All QA stays canvas-first: one Pixi canvas,
no gameplay DOM, original procedural assets, and no dashboard-like UI.

## Blocking Gameplay-Rules Decisions

The Gameplay Rules and Engine workstream
(019f4e82-7cb8-73c1-b4a1-d333273b359f) must approve these points before any
grid, replay, or level fixture is authored:

1. Entry precondition — adjacency/contact, facing, selection, and whether a
   container can be entered from any cell in the active parent world.
2. Entrance choice — directionality, multi-entrance selection, and occupied
   entrance behavior.
3. Exit rule — exact parent destination, collision behavior, and how a moved
   container determines its exit location.
4. Focused-container movement — whether a frame may move while its child is
   active and what protects focus-path/player consistency.
5. Win/completion observability — authoritative multi-world goal rule and the
   event/state by which solved status reaches runtime and replay.
6. Scope — push-in, push-out, boundary transfer, and cycles remain excluded
   unless a later approved rules slice supplies independent tests.

The current prototype's unrestricted Enter(containerId), fixed first entrance
choice, and hard-coded container-b input are evidence that this gate is
necessary, not an implementation request.

The Frontend Visual Design workstream
(019f4e80-145a-7520-81e1-41a45b2bec13) must define the palette, camera, and
responsive screenshot contract before visual acceptance of a level. Independent
QA (019f4e80-1462-7b32-8146-19ded692836c) reviews worker commits by SHA; this
workstream does not self-approve.

## First-Slice Acceptance Criteria

The coordinator may approve a first implementation slice only when:

- gameplay rules has resolved the six blockers in a testable contract;
- level serialization has an approved schema/validator/replay boundary;
- the slice is tutorial-01 only, not the full campaign;
- its replay, final hash, negative validation cases, and unique-plan solver
  test are specified before runtime wiring;
- the renderer can stage the needed aperture/child context with authored tokens;
- browser QA captures the required views with no console problems and no
  gameplay DOM.

## Proposed Delivery Order

1. Approve gameplay entry/exit, moved-container, and solve-event semantics.
2. Implement generic schema, validator, and replay harness.
3. Implement and prove tutorial-01 alone.
4. Review its visual teaching beat and QA evidence.
5. Add tutorial-02 through tutorial-04 one at a time with their own replay,
   solver, and screenshot evidence.

This order prevents content from compensating for unresolved rules or visual
ambiguity.
