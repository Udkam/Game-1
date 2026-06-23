# Redesign Spec: Driftbox Worldline Lab

RUN_ID: `v7-loop-20260623-195154-f683`

Status: design approved for the next implementation stage. No runtime implementation is claimed by this document.

## Core Product Standard

> 参考优秀系统谜题游戏的设计方法，从机制系统和关卡语言出发，重做 Driftbox，而不是给旧推箱子项目套科幻皮肤。

The rejected v7 implementation exposed enough tests and metadata to be useful, but it did not produce a new product identity. The rebuild must treat current UI, board visuals, role design, and level language as replaceable.

## Product Premise

Working title: `Driftbox: Worldline Lab`.

The player operates a quantum drone inside an experiment system that can fold rooms, split worldlines, replay echoes, swap spaces, synchronize drones, and rewrite local experiment parameters. The objective is not "put boxes on goals" in presentation; it is "stabilize anomaly cores under lab laws." Push/target logic can remain as one low-level primitive, but the visible fantasy is a controlled sci-fi experiment.

## Reuse Boundary

Allowed to reuse:

- Vite / TypeScript project shape.
- Fastify server and SQLite scoring path.
- Replay validation concept.
- Existing audit/smoke script infrastructure as scaffolding.
- Pure engine ideas when deterministic and testable.

Rejected as public product direction:

- Current title/buttons/progress/cards homepage.
- Current card-grid chapter map.
- Current board-in-webpage layout.
- Current square-wall visual language.
- Current Pip/little-person lineage.
- Current 70-level catalog as product-accepted content.
- Public v6/2.5D routes and claims.

## Information Architecture

Home: Quantum Experiment Console

- Central object: worldline observer / quantum core.
- Primary command: resume experiment.
- Secondary commands orbit the core: worldline map, research notes, experiment data, system calibration.
- Progress appears as lab telemetry, not as a card list.
- Background shows subdued particles, waveforms, branching lines, and scan passes.

Worldline Map

- The map is an SVG/canvas/DOM node graph, not cards.
- Chapters are main branches; levels are nodes on branches.
- Completed nodes light their outgoing path.
- Current recommendation pulses.
- Boss nodes are larger containment rings.
- Chain-affected nodes show a forked or unstable outline.

Chamber View

- HUD and board are one experiment panel.
- Board cells are field nodes, rails, gates, cores, sockets, and chambers, not ordinary wall/floor squares.
- Hints are observation log entries, not yellow tips.
- Mechanic state has dedicated instruments: branch tabs, layer path, echo queue, swap preview, sync roster, rule socket strip.

Research Notes

- Mechanism archive becomes a notebook of discovered laws.
- Entries show rule statement, safe example, failure condition, and one interactive micro-diagram when feasible.
- It never gives full solutions.

Experiment Data

- Challenge records show completion, par, replay stability, branch count, and rule edits.
- Replays are treated as lab evidence.

System Calibration

- Settings/help are in-world calibration controls.
- Accessibility toggles include high contrast, reduced motion, larger nodes, and text labels.

## Six Core Systems

Recursive Space

- Container cores can be entered.
- Inner room state can alter the outer container.
- Moving the outer container moves the inner-room reference with it.
- UI shows the active layer path.
- Initial implementation may cap depth at 2.

Worldline Split

- Split points create branch A/B states.
- Branches can be shown as side-by-side lanes or stacked layers.
- Some gates require simultaneous branch conditions.
- Merge points collapse compatible branch states.
- Replay records branch selection and branch actions.

Time Echo

- Echo follows a delayed action queue.
- Echo can push energy cores and press plates but cannot occupy the final stabilization point.
- UI shows the next three echo intents or recent queue.
- Collisions produce visible feedback.

Spatial Swap

- Swappers exchange two marked cells, entities, targets, links, or regions.
- Preview appears before activation.
- Replay records the deterministic pair and timing.

Multi-Drone Sync

- A single input drives several drones.
- Drones can be same-direction, mirrored, delayed, heavy/light, or phase-limited.
- Heavy cores require coordinated push timing.
- Conflicts are explained as sync interference.

Rule Blocks / Experiment Parameters

- Small, bounded rule vocabulary: `PUSH`, `PULL`, `GHOST`, `LINK`, `SWAP`, `WIN`.
- Blocks are physical parameter chips inserted into local sockets.
- Effects are local and visible.
- State key includes socket contents.

## Vertical Slice Requirement

The next runtime target is a new 20-level vertical slice, not the rejected 70-level catalog.

Required distribution:

- Startup sequence: 4 levels.
- Quantum link / portal: 3 levels.
- Sync bodies: 3 levels.
- Time echo: 3 levels.
- Spatial swap: 3 levels.
- Recursive chamber: 2 levels.
- Misdirection protocol: 2 levels.

The 20-level slice must include at least one level for recursive space, worldline split, time echo, spatial swap, multi-drone sync, and rule blocks. Every level needs a design note, solution replay, non-water QA review, and a fairness proof.

## 70-Level Future Expansion

Only after the 20-level slice passes visual/product/puzzle QA should the project expand again to 70 levels. The future 70-level structure can keep the requested 8+8+8+8+8+8+8+8+6 distribution, but the expansion must be based on puzzle grammar:

- 2 discovery levels.
- 2 reversal levels.
- 2 combination levels.
- 1 fair misdirection level.
- 1 chapter boss or summary.

Finale levels must combine systems and cannot be tutorial-simple.

## Acceptance Shift

Current command success is not enough. A stage only passes redesign acceptance when screenshots and play review show:

- Home is a console, not a landing card page.
- Map is a node/path worldline graph, not cards.
- Character is non-human sci-fi and stateful.
- Chamber visuals are not old grid tiles recolored.
- Levels expose system properties and not just push crates to targets.
