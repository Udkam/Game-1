# Puzzle Grammar

RUN_ID: `v7-loop-20260623-195154-f683`

Status: design grammar for the new 20-level vertical slice. No level may enter the accepted runtime catalog without a matching design note and replay.

## Level Design Note Template

```text
Level:
Core question:
Aha moment:
Required inference:
False path:
Fairness proof:
Minimum solution outline:
Why not boring:
```

Runtime metadata still uses:

```ts
{
  id: string,
  title: string,
  chapter: string,
  mechanics: string[],
  coreIdea: string,
  trick: string,
  fairness: string,
  difficulty: 1 | 2 | 3 | 4 | 5,
  solverStatus: "optimal" | "verified-replay" | "manual-reviewed",
  par: number | null,
  solution: string[]
}
```

## Recursive Space System

Mechanic: recursive space

Primitive operations:

- Enter a container chamber.
- Exit to the parent layer.
- Push or move the outer container.
- Complete an inner condition that changes the outer container state.
- Carry a limited signal from inner room to parent room.

Player misconception:

- "The container is just a box with a bonus room."
- "Inner and outer states are separate."

Interesting constraints:

- Outer position changes the meaning of the inner exit.
- Inner completion can unlock, phase, or weight-shift the outer container.
- Depth 1 can still be interesting if the player must plan before entering.

Failure modes:

- Player loses track of layer.
- Container movement breaks replay if layer path is not recorded.
- Recursion becomes just a menu transition.

Fair clue:

- Always show layer path and the outer container ghost while inside.
- Use matching symbols inside and outside.

Level seeds:

- Enter a capsule to charge it, then push the charged capsule into a field.
- Move a capsule outside so its internal exit aligns with a new parent tile.
- Put a rule chip inside a container so the outer chamber inherits one property.

What not to do:

- Do not copy Patrick's Parabox box layouts.
- Do not hide the exit relation.
- Do not use recursion only as a teleporter.

## Worldline Split System

Mechanic: worldline split

Primitive operations:

- Activate a split point.
- Move branch A and branch B with shared or separated state.
- Switch active branch.
- Satisfy simultaneous gate conditions.
- Merge compatible branch states.

Player misconception:

- "A branch is just an undo snapshot."
- "Only the drone splits; the chamber does not."

Interesting constraints:

- Branches can share walls/links but diverge entity positions.
- A branch can prepare a condition for the other branch.
- Merge points require compatible positions or stabilized cores.

Failure modes:

- Too much hidden state.
- Branch UI becomes decorative rather than necessary.
- Puzzles require trial-and-error branch order.

Fair clue:

- Show active branch, branch occupancy, and merge requirement at all times.
- Mark shared tiles with dual-color outlines.

Level seeds:

- Branch A holds a plate while branch B moves the core.
- A core exists in only one branch until a merge stabilizes it.
- A false path solves one branch but leaves the merge incompatible.

What not to do:

- Do not copy 茜塔's setting, fork, or exact probability framing.
- Do not make "split" a renamed multi-character mode.

## Time Echo System

Mechanic: time echo

Primitive operations:

- Record player action history.
- Spawn an echo with delay N.
- Echo replays movement and can push selected cores.
- Echo presses plates but cannot finish.
- Player and echo can block each other.

Player misconception:

- "The echo is a helper that always follows safely."
- "I can ignore the history queue."

Interesting constraints:

- Player must create a future push before being in position to use it.
- Echo collision can become a timing wall.
- Delayed pressure can open a route for the real drone.

Failure modes:

- Guessing delay by trial and error.
- Echo hidden behind the player or board effects.
- Replay missing historical queue.

Fair clue:

- Show the next three echo intents and ghost path.
- Use an echo trail with numbered ticks.

Level seeds:

- Walk a loop so the echo pushes a core after the player leaves.
- Use echo pressure to hold a gate while the player crosses.
- Avoid a tempting short route that causes echo collision.

What not to do:

- Do not make every echo level a corridor timing puzzle.
- Do not hide the action queue.

## Spatial Swap System

Mechanic: spatial swap

Primitive operations:

- Stand on or push into a swapper.
- Preview pair A/B.
- Swap cells, entities, targets, portals, or small regions.
- Recompute blocked paths deterministically.

Player misconception:

- "Swap is only a shortcut."
- "The target moves but the terrain does not matter."

Interesting constraints:

- Swap can create or remove adjacency.
- Swapping a target with a core changes what "near finish" means.
- Swapping regions can make a previous dead end become a route.

Failure modes:

- Swap without preview feels arbitrary.
- Large-region swaps become visually unreadable.
- Replay depends on DOM order instead of explicit ids.

Fair clue:

- Draw a line between swap endpoints and pulse both regions before activation.
- Label swapped objects with stable glyphs.

Level seeds:

- Swap a core and target only after the path is cleared.
- Swap two portal exits to rotate the solution route.
- False path: swap early to create a sealed chamber.

What not to do:

- Do not use swap as a randomizer.
- Do not swap large areas before the visual language is proven.

## Multi-Drone Sync System

Mechanic: multi-drone sync

Primitive operations:

- One input drives multiple drones.
- Drones can move same-direction, mirrored, delayed, or phase-limited.
- Drones can push together.
- A blocked drone may either hold or create sync interference depending on rule.

Player misconception:

- "Two drones are just two players."
- "Mirroring is only a control inconvenience."

Interesting constraints:

- One drone can intentionally block to let another align.
- Mirrored motion turns symmetry into a resource.
- Heavy cores require simultaneous pressure.

Failure modes:

- Drones become clutter.
- Sync conflict has no explanation.
- The puzzle can be solved by ignoring one drone.

Fair clue:

- Each drone has a sync line and mode icon.
- Conflict feedback states which drone blocked the move.

Level seeds:

- Use a wall as a brake for one drone.
- Mirror two drones around a central heavy core.
- Delay drone B by one action so it becomes a time echo hybrid.

What not to do:

- Do not make "move two actors to two goals" the whole chapter.
- Do not let one drone carry the entire solution.

## Rule Block / Experiment Parameter System

Mechanic: rule block parameters

Primitive operations:

- Push a parameter chip.
- Insert a chip into a socket.
- Activate a local rule.
- Remove or swap a chip.
- Validate local rule in replay.

Player misconception:

- "Rule blocks are collectibles."
- "A rule changes the whole game."

Interesting constraints:

- A socket changes only one chamber or region.
- The same physical route behaves differently after a parameter change.
- Rule blocks can be objects to position, not only toggles.

Failure modes:

- Vocabulary gets too big.
- Player cannot tell scope.
- Solver state explodes.

Fair clue:

- Active socket strip shows rule, scope, and affected objects.
- Affected cells get matching outline.

Level seeds:

- Insert `GHOST` so the drone can pass a field, but the core cannot.
- Insert `LINK` to make two plates share state.
- Use `SWAP` as a one-time local parameter to exchange a gate and target.

What not to do:

- Do not rebuild full Baba grammar.
- Do not use English words as the only visual sign; include icons.

## 20-Level Slice Seeds

These are not accepted levels yet. They are seeds that must become runtime levels only after implementation, replay verification, and QA.

| ID | Group | Core system | Core question | Aha | Status |
| --- | --- | --- | --- | --- | --- |
| v7r-001 | Startup | core push + lab rails | How does a core stabilize a field node? | Goals are lab stabilizers, not old targets. | planned |
| v7r-002 | Startup | blocker feedback | Why did the push fail? | The chamber explains wall/core/gate blockers. | planned |
| v7r-003 | Startup | rule socket intro | What changes when `PUSH` is socketed? | Push is a local experiment parameter. | planned |
| v7r-004 | Startup | false path | Why is the short route wrong? | The fair clue is visible before commitment. | planned |
| v7r-005 | Quantum link | portal preserve | How does a link change adjacency? | The exit is the real neighbor. | planned |
| v7r-006 | Quantum link | portal rotate | What does orientation do to a push? | Direction is part of the link law. | planned |
| v7r-007 | Quantum link | portal + rule | Which objects may pass? | A parameter limits link traversal. | planned |
| v7r-008 | Sync | same-direction pair | How can one input solve two routes? | One drone brakes against terrain. | planned |
| v7r-009 | Sync | mirrored pair | How does symmetry become useful? | Mirrored motion aligns a heavy core. | planned |
| v7r-010 | Sync | sync + rule | Can a rule affect only one drone lane? | Local sockets break obvious symmetry. | planned |
| v7r-011 | Time echo | delayed plate | How do I use my past route? | The echo holds a gate after I leave. | planned |
| v7r-012 | Time echo | echo push | Can the echo push for me? | Create a future push before needing it. | planned |
| v7r-013 | Time echo | echo collision | Why is the direct route bad? | The visible queue predicts collision. | planned |
| v7r-014 | Spatial swap | cell swap | What changes when two cells exchange? | The route, not just position, changes. | planned |
| v7r-015 | Spatial swap | target/core swap | When should the target move? | Finish condition can be repositioned fairly. | planned |
| v7r-016 | Spatial swap | swap + portal | How do two spatial laws interact? | Portal exits can be re-paired. | planned |
| v7r-017 | Recursive | enter container | What is inside a chamber-core? | Inner completion changes outer property. | planned |
| v7r-018 | Recursive | move container | Why move a room before entering it? | Outer position changes inner exit value. | planned |
| v7r-019 | Misdirection | worldline split | Why does one solved branch still fail? | Merge compatibility is the real goal. | planned |
| v7r-020 | Misdirection | combined boss | Which law is the actual constraint? | Rule block plus echo exposes the false path. | planned |
