# 20-Level Vertical Slice Report

RUN_ID: `v7-loop-20260623-195154-f683`

Status: planned, not implemented. This report intentionally does not claim runtime acceptance.

## Reset Statement

The current exposed 70-level v7 catalog is rejected for product acceptance. It may remain in git as a checkpoint, but it is not the accepted final v7 and must not be expanded further. The next implementation stage must replace the public runtime with a new 20-level vertical slice built from the redesign grammar.

## Required Slice Distribution

- Startup sequence: 4 levels.
- Quantum link / portal: 3 levels.
- Sync bodies: 3 levels.
- Time echo: 3 levels.
- Spatial swap: 3 levels.
- Recursive chamber: 2 levels.
- Misdirection protocol: 2 levels.

Total: 20.

## Hard Coverage

The slice must contain at least:

- 1 recursive-space level.
- 1 worldline-split level.
- 1 time-echo level.
- 1 spatial-swap level.
- 1 multi-drone-sync level.
- 1 rule-block / experiment-parameter level.

All levels require stored solution replay before acceptance.

## Planned Level Matrix

| ID | Title | Group | Mechanics | Core question | Aha moment | Required inference | False path | Fairness proof | Replay status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| v7r-001 | First Stabilizer | Startup | push, stabilizer | What does a core stabilize? | Targets are lab rings with readable state. | Push route must preserve escape space. | Push into the nearest ring first. | Ring glow and rail arrows show required route. | pending |
| v7r-002 | Blocker Readout | Startup | push, blocked feedback | Why did the push fail? | The lab identifies wall/core/gate blockers. | Use feedback to choose the alternate push. | Keep pushing into a sealed barrier. | Blocked reason points to the barrier source. | pending |
| v7r-003 | Parameter Socket | Startup | rule block, PUSH | What makes a core movable? | `PUSH` is a local rule, not a universal fact. | Insert chip before moving the core. | Treat chip as a collectible. | Socket outline matches affected lane. | pending |
| v7r-004 | Short Route Trap | Startup | fair misdirection | Why is the obvious route wrong? | The final push must be reserved. | Read rail geometry before committing. | Push core into the closest alcove. | Exit rail is visible from the start. | pending |
| v7r-005 | Paired Link | Quantum link | portal | How does the link change adjacency? | The exit gate is the true neighbor. | Push through the link from the correct side. | Walk through link before aligning core. | Paired colors and arrows show flow. | pending |
| v7r-006 | Rotated Exit | Quantum link | portal, orientation | What happens to direction? | Direction rotates with the exit glyph. | Use rotated push to approach target. | Preserve-direction assumption. | Exit arrow is visible before traversal. | pending |
| v7r-007 | Filtered Link | Quantum link | portal, rule block | Which objects may pass? | Rule socket changes link permissions. | Core and drone have different pass rules. | Send wrong object first. | Gate label shows allowed class. | pending |
| v7r-008 | Twin Brake | Sync | two drones | How can terrain brake one drone? | Blocking one drone can align the other. | Use wall as timing control. | Keep both drones free. | Sync line flashes only for blocked drone. | pending |
| v7r-009 | Mirror Clamp | Sync | mirrored drones | How does symmetry push a heavy core? | Mirrored drones can squeeze from both sides. | Align before pushing. | Approach from same side. | Heavy core displays two-pressure icons. | pending |
| v7r-010 | Split Socket | Sync | sync, rule block | Can a rule affect only one lane? | Local socket breaks symmetric behavior. | Apply `GHOST` to one drone lane. | Try to solve with pure mirroring. | Lane scope is outlined. | pending |
| v7r-011 | Echo Gate | Time echo | delayed echo | How can the past hold a gate? | Echo repeats the earlier plate step. | Walk a setup loop before crossing. | Rush through before echo arrives. | Echo queue shows the coming plate press. | pending |
| v7r-012 | Future Push | Time echo | echo push | Can the echo push a core? | A past route creates a future push. | Place the core for echo timing. | Push manually into a dead end. | Numbered echo trail shows contact tick. | pending |
| v7r-013 | Collision Forecast | Time echo | echo collision | Why is the direct route bad? | The echo path predicts a collision. | Wait/route around the queued echo. | Take the shortest hallway. | Queue preview marks the collision tile. | pending |
| v7r-014 | Two Cells Exchange | Spatial swap | cell swap | What actually moves in a swap? | Adjacency changes, not just location. | Swap after clearing a rail. | Swap immediately and seal route. | Preview line shows before/after cells. | pending |
| v7r-015 | Moving Target | Spatial swap | core/target swap | When should a target move? | Stabilizer position is part of the puzzle. | Put core where target will arrive. | Treat target as fixed. | Target ring ghost previews destination. | pending |
| v7r-016 | Link Rewire | Spatial swap | swap, portal | Can a portal route be swapped? | Link exits can be re-paired. | Swap exits after placing the core. | Use original pairing to trap core. | Both exit glyphs animate before swap. | pending |
| v7r-017 | Enter Capsule | Recursive chamber | recursive | What is inside a chamber-core? | Inner completion changes outer property. | Charge the capsule from inside. | Push uncharged capsule to target. | Layer path and outer ghost show relation. | pending |
| v7r-018 | Move The Room | Recursive chamber | recursive, portal | Why move a room before entering? | Outer position changes inner exit value. | Move capsule, enter, exit aligned. | Enter first and solve isolated room. | Exit marker previews parent tile. | pending |
| v7r-019 | Branch Merge | Misdirection | worldline split | Why does one solved branch fail? | Merge compatibility is the true goal. | Satisfy two branches simultaneously. | Solve branch A while blocking B. | Branch UI shows merge requirements. | pending |
| v7r-020 | Unstable Protocol | Misdirection | rule block, echo, swap | Which law is the real constraint? | The false path is exposed by echo timing. | Use rule socket before swap, then echo. | Swap first for apparent shortcut. | Observation log names the unstable dependency. | pending |

## Acceptance Checklist For Implementation

- `npm run verify` lists all 20 redesign levels with replay pass.
- `npm run audit:levels` is updated for slice mode and fails water-level placeholders.
- `npm run audit:ui` requires console home, worldline graph, chamber instruments, and character sheet.
- `npm run smoke:visual` captures the redesigned 13-screenshot set.
- QA reviewer signs off with evidence that the screens no longer resemble the rejected v7 implementation.

## Current Blockers

- Runtime still exposes the rejected 70-level checkpoint.
- Home, map, chamber, and character implementation have not yet been replaced.
- Engine support for worldline split, recursive layer path, deterministic swap preview, and rule sockets needs implementation before these levels can be accepted.
