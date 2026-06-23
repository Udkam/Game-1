# 20-Level Vertical Slice Report

RUN_ID: `v7-loop-20260623-195154-f683`

Status: implemented in runtime as the current `Worldline Lab` redesign slice. This report does not claim final 70-level acceptance.

## Reset Result

The rejected 70-level v7 catalog has been replaced in the public runtime by a 20-level slice built from the redesign grammar. The rejected catalog remains historical git evidence only and must not be described as the current playable mainline.

## Slice Distribution

- Startup sequence: 4 levels.
- Quantum link / portal: 3 levels.
- Sync bodies: 3 levels.
- Time echo: 3 levels.
- Spatial swap: 3 levels.
- Recursive chamber: 2 levels.
- Misdirection protocol: 2 levels.

Total: 20.

## Hard Coverage

Implemented coverage:

- Recursive-space level: `v7r-017`, `v7r-018`.
- Worldline-split level: `v7r-019`.
- Time-echo level: `v7r-011`, `v7r-012`, `v7r-013`, `v7r-020`.
- Spatial-swap level: `v7r-014`, `v7r-015`, `v7r-016`, `v7r-020`.
- Multi-drone-sync level: `v7r-008`, `v7r-009`, `v7r-010`, `v7r-019`.
- Rule-block / experiment-parameter level: `v7r-003`, `v7r-007`, `v7r-010`, `v7r-020`.

All 20 levels carry `levelDesignNote` metadata and stored replay solutions.

## Implemented Level Matrix

| ID | Title | Group | Mechanics | Core question | Aha moment | Replay status |
| --- | --- | --- | --- | --- | --- | --- |
| v7r-001 | First Stabilizer | Startup | core push | What does a core stabilize? | Targets are lab stabilizers, not old boxes. | verified-replay |
| v7r-002 | Blocker Readout | Startup | push, blocked feedback | Why did the push fail? | The HUD blocker reason is part of the puzzle language. | verified-replay |
| v7r-003 | Parameter Socket | Startup | rule block, gate | What makes a core movable? | `PUSH` is represented as a local permission socket. | verified-replay |
| v7r-004 | Short Route Trap | Startup | fair misdirection | Why is the obvious route wrong? | Order matters even in a compact dual-lane chamber. | verified-replay |
| v7r-005 | Paired Link | Quantum link | portal | How does the link change adjacency? | The exit side is the true neighbor. | verified-replay |
| v7r-006 | Rotated Exit | Quantum link | portal orientation | What happens to direction? | A vertical exit changes the useful force axis. | verified-replay |
| v7r-007 | Filtered Link | Quantum link | portal, rule block | Which objects may pass? | Unlock the drone route before using the link. | verified-replay |
| v7r-008 | Twin Brake | Sync | two drones | How can one input solve two boards? | The slice first makes simultaneity explicit. | verified-replay |
| v7r-009 | Mirror Clamp | Sync | mirrored drones | How does symmetry become useful? | One input pushes opposite physical directions. | verified-replay |
| v7r-010 | Split Socket | Sync | sync, rule block | Can a rule affect both lanes locally? | Each synchronized lane reads its own socket. | verified-replay |
| v7r-011 | Echo Gate | Time echo | delayed echo, gate | How can the past hold a gate? | The echo keeps the pressure plate active for one beat. | verified-replay |
| v7r-012 | Future Push | Time echo | echo queue | Can setup become a future action? | The decisive push works after reading the echo timing. | verified-replay |
| v7r-013 | Collision Forecast | Time echo | echo collision | Why is the direct route bad? | The visible queue warns about self-collision. | verified-replay |
| v7r-014 | Two Cells Exchange | Spatial swap | active cell swap | What actually moves in a swap? | Stepping on the trigger swaps the core between marked nodes. | manual-reviewed |
| v7r-015 | Moving Target | Spatial swap | core/target relation | When should a target move? | The approach is prepared before contact. | manual-reviewed |
| v7r-016 | Link Rewire | Spatial swap | swap, portal | Can two spatial laws coexist? | Portal reading and swap markings share one chamber language. | manual-reviewed |
| v7r-017 | Enter Capsule | Recursive chamber | recursive core | What is inside a chamber-core? | A core can carry a visible inner-state identity. | manual-reviewed |
| v7r-018 | Move The Room | Recursive chamber | recursive movement | Why move a room before entering? | The room-object relation is the puzzle object. | manual-reviewed |
| v7r-019 | Branch Merge | Misdirection | worldline split, sync | Why does one solved branch still fail? | Merge compatibility is the true objective. | manual-reviewed |
| v7r-020 | Unstable Protocol | Misdirection | rule, echo, swap | Which law is the real constraint? | Rule order and echo timing expose the false path. | manual-reviewed |

## Verification

Commands run during Stage 10 before push:

- `npm run typecheck`: passed.
- `npm run verify`: passed for all 20 stored replay solutions.
- `npm run audit:levels`: passed for exactly 20 redesign slice levels, required mechanisms, active swap probe, recursive entry cores, worldline twin state, and duplicate/water-level checks; retained the replay/manual warning.
- `npm run audit:ui`: passed for quantum console, worldline graph, chamber HUD, mechanism archive, settings/data overlays, transition state, mobile guard, and character state sheet.
- `npm run audit:content`: passed for README/claude/docs consistency and honest 20-level slice status.
- `npm run smoke:api`: passed; API returns 20 levels and accepts all stored replays.
- `npm run smoke:ui`: passed; jsdom UI plays all 20 levels to win.
- `npm run smoke:visual`: passed; regenerated 13 redesign screenshots after repairing the mobile transition capture and desktop graph coverage.
- `npm run build`: passed.

## Non-Final Limits

- This is not the final 70-level product.
- All 20 levels are replay/manual verified; mechanism-specific optimal solvers remain future work.
- Recursive rooms and rule blocks are intentionally lightweight in this slice.
- The next loop must either deepen this 20-level slice after visual QA or expand toward 70 levels from this grammar.
