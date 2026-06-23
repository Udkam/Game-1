# Reference Study: v7 Rebuild Redesign

RUN_ID: `v7-loop-20260623-195154-f683`

Status: completed before implementation. This document is a design-method study only. Driftbox must borrow principles, not protected assets, level layouts, characters, story, screenshots, music, text, or puzzle solutions.

## Study Goal

The failed v7 route proved that a sci-fi palette over ordinary Sokoban is not enough. The new target is a system puzzle game where visual language, level grammar, replay validation, and screen structure all express the same rules.

The highest redesign rule for this loop is:

> 参考优秀系统谜题游戏的设计方法，从机制系统和关卡语言出发，重做 Driftbox，而不是给旧推箱子项目套科幻皮肤。

## Sources Checked

- Patrick's Parabox official site: https://www.patricksparabox.com/
- Patrick's Parabox Steam page: https://store.steampowered.com/app/1260520/Patricks_Parabox/
- 茜塔和世界线悖论 Steam page: https://store.steampowered.com/app/3219580/Theta_and_Paralldox_on_Worldlines/?l=schinese
- Baba Is You official page: https://www.hempuli.com/Baba/
- Recursed Thinky Games page: https://thinkygames.com/games/recursed/
- Portal 2 Steam page: https://store.steampowered.com/app/620/Portal_2/Developer
- Opus Magnum official page: https://www.zachtronics.com/opus-magnum/
- Stephen's Sausage Roll Steam page: https://store.steampowered.com/app/353540/Stephens_Sausage_Roll/

## Patrick's Parabox

Reference: Patrick's Parabox

What it does well:

- Treats recursion as the central grammar, not a one-off object.
- Starts from readable block-pushing facts, then reveals deeper properties: entering, exiting, containment, self-containment, nested scale, infinite interpretation, and structure manipulation.
- Uses chapters as investigations of system properties instead of as cosmetic theme labels.
- Makes small topology changes produce different reasoning, so the puzzle identity comes from the relation between spaces, not from decoration.

Transferable principle:

- A Driftbox mechanic should be a law that can be reinterpreted several times. A chapter should answer "what else does this law imply?" rather than "which new prop appears?"

What Driftbox should borrow:

- Container spaces must be visible as part of the same rule system as the outer lab.
- Recursive chambers should expose a path stack such as `Lab > Chamber A > Inner Field`, and the player should reason about entering, leaving, moving the container, and changing its external property.
- The first recursive levels must be about a single surprising fact, not about large maps.

What Driftbox must not copy:

- Do not copy box-within-box level layouts, exact chamber order, visual minimalism, names, or puzzle solutions.
- Do not make every object a literal box; Driftbox should use quantum capsules, field chambers, and experiment containers.

Concrete design implication:

- Recursive space becomes one of six core systems. The 20-level slice needs at least two recursive levels: one where entering a container changes its outer state, and one where moving the outer container changes the inner route. The UI must make the current layer path unavoidable.

## 茜塔和世界线悖论

Reference: 茜塔和世界线悖论

What it does well:

- Presents splitting as the core idea and expands it from the player to boxes, the universe, and worldline structure.
- Frames later chapters as hidden truths that were already latent in the basic mechanism.
- Uses worldlines, parallel states, notes, and hints as knowledge structures rather than direct answer delivery.
- Makes simultaneous movement and branch interaction change how the player thinks about causality.

Transferable principle:

- Driftbox should make advanced mechanics feel discovered, not delivered. A later level should recontextualize an earlier rule by applying it to a new object, layer, or timeline.

What Driftbox should borrow:

- Worldline split UI with two branch states, an active branch marker, and visible merge requirements.
- Research notes that record learned rules and misconceptions without spoiling exact solutions.
- Split mechanics that extend from the drone to energy cores, field slots, and chamber states.

What Driftbox must not copy:

- Do not copy the character, fork premise, probability terminology, world story, left-turn movement identity, puzzle layouts, or chapter secrets.
- Do not use hidden information as the source of difficulty.

Concrete design implication:

- Worldline split becomes a named core system. At least one vertical-slice level must require two branches to satisfy a gate simultaneously. The level note must state the hidden truth being revealed and the fairness clue that lets the player infer it.

## Baba Is You

Reference: Baba Is You

What it does well:

- Makes rules physical, readable, and editable by the player.
- Produces insight when the player realizes a simple sentence can redefine object behavior.
- Keeps the rule vocabulary concrete enough that combinations are inspectable and reversible.
- Uses undo and visible syntax to support experimentation without turning mistakes into punishment.

Transferable principle:

- Rule interaction works when syntax is small, visible, and deterministic. The game should let the player manipulate a few local parameters rather than expose an unbounded language.

What Driftbox should borrow:

- Physical rule blocks as experiment parameters that can be moved into slots.
- A tiny vocabulary: `PUSH`, `PULL`, `GHOST`, `LINK`, `SWAP`, `WIN`.
- Local chamber scope, clear active-rule display, and replayable rule changes.

What Driftbox must not copy:

- Do not copy Baba's word-object system wholesale, exact words-as-sentences presentation, sprites, level logic, or "X IS Y" grammar.
- Do not add an unconstrained rules engine that makes verification intractable.

Concrete design implication:

- The rule-block system in Driftbox is a constrained experiment panel. A block enters a socket and changes a local room rule. The UI should show a compact active-parameter strip; the engine state key must include socket contents.

## Recursed

Reference: Recursed

What it does well:

- Treats rooms and containers as transportable state references.
- Creates mind-bending outcomes from carrying objects into rooms that are themselves inside objects.
- Keeps the player focused on room identity and entry/exit consequences.

Transferable principle:

- Recursive spaces should be stateful locations with clear entry and exit contracts, not decorative sublevels.

What Driftbox should borrow:

- The notion that entering a container is a state transition and that carrying or moving containers can change the outer problem.

What Driftbox must not copy:

- Do not copy platformer movement, chest visuals, room layouts, or paradox behavior.

Concrete design implication:

- Driftbox recursion can start with depth 1 or 2, but the replay format must record layer path, container identity, and internal completion flags.

## Portal / Portal 2

Reference: Portal / Portal 2

What it does well:

- Makes spatial connection a core law: entrance, exit, orientation, and chamber testing are readable.
- Uses sterile test-chamber structure to make each puzzle feel like a controlled experiment.
- Keeps feedback immediate when an object can or cannot traverse a link.

Transferable principle:

- Portals are strongest when they rewire the player's map of space, not when they act as generic teleport tiles.

What Driftbox should borrow:

- Direction-preserving and direction-rotating links, visible entry/exit pairing, and failure feedback when an object class cannot pass.

What Driftbox must not copy:

- Do not copy Aperture branding, portal gun fantasy, chambers, voice, or exact mechanics.

Concrete design implication:

- Portal/link levels must draw visible energy cables and arrows. The level note must explain how the link changes adjacency or facing.

## Opus Magnum

Reference: Opus Magnum

What it does well:

- Turns solution execution into a readable performance.
- Makes replay and comparison part of the satisfaction loop.
- Supports multiple valid solutions while preserving clear metrics.

Transferable principle:

- Driftbox should make replay validation visible and satisfying. A good solution replay is a diagnostic artifact, not only a hidden test fixture.

What Driftbox should borrow:

- Optional "stability replay" view, step/push metrics, par targets, and clean motion traces.

What Driftbox must not copy:

- Do not copy alchemy machine components, story, UI, or open-ended assembly mechanics.

Concrete design implication:

- Victory should show worldline collapse and offer replay review. Later validation can compare par, branch count, and rule-block edits.

## Stephen's Sausage Roll

Reference: Stephen's Sausage Roll

What it does well:

- Demonstrates that a small rule set can sustain deep puzzles when constraints are tight and spatial consequences are meaningful.
- Reveals hidden implications of the same basic movement system rather than constantly adding tools.

Transferable principle:

- Depth should come from pressure, geometry, and inference, not from a wide inventory of props.

What Driftbox should borrow:

- Small levels with strong constraints, explicit false paths, and one hard idea per puzzle.

What Driftbox must not copy:

- Do not copy sausage/fork identity, layouts, objects, or difficulty curve.

Concrete design implication:

- The redesigned 20-level slice should prefer compact, asymmetric, non-rectangular chambers where one irreversible-looking route is actually the clue.

## Driftbox Design Conclusions

- Six systems are enough: recursive space, worldline split, time echo, spatial swap, multi-drone sync, and rule-block parameters.
- Every level must be designed from a puzzle question, not from a prop list.
- The home screen, map, chamber UI, role, archive, and victory flow must all look like the same experimental system.
- The old v7 surface is rejected because it validated content count and tests without proving a new puzzle language.
- Implementation must restart with a 20-level vertical slice. The existing 70-level catalog is a rejected checkpoint, not product acceptance.
