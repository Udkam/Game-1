# Recursive Box Lab Level Design

The Stage 6 tutorial set prioritizes ten curated mechanics over raw level count. Each level has a single primary teaching job, metadata in `src/levels/tutorial.ts`, and a scripted solution used by tests.

The levels are original and do not copy layouts, titles, visual design, or puzzle sequences from Patrick's Parabox.

| # | Level | Teaching Goal | Tags | Target |
| --- | --- | --- | --- | --- |
| 1 | First Push | Basic crate push into a powered dock. | `push`, `dock` | 2 |
| 2 | Glass Hatch | Enter a recursive box. | `enter`, `recursive-room` | 1 |
| 3 | Eject Cargo | Push cargo from an inner world to the parent world. | `push-out`, `edge-exit` | 1 |
| 4 | Load the Hatch | Push cargo into an open recursive box. | `push-into`, `container` | 1 |
| 5 | Inside Moves Outside | Move a world-bearing module from inside to the parent world. | `push-out`, `container`, `parent-update` | 1 |
| 6 | Two-Layer Transfer | Enter a box, then push cargo into a deeper box. | `enter`, `push-into`, `two-layer` | 2 |
| 7 | Cross-World Targets | Complete root and inner-world goals together. | `enter`, `cross-world`, `multi-goal` | 1 |
| 8 | Enter, Then Eject | Enter first, then push cargo back out. | `enter`, `push-out`, `sequence` | 2 |
| 9 | Nested Order | Access a parent room before loading a world module. | `enter`, `nested-box`, `push-into` | 2 |
| 10 | Composite Fold | Enter two layers and eject cargo from the deeper room. | `enter`, `two-layer`, `push-out`, `composite` | 3 |

## Metadata Contract

Every tutorial level includes:

- `title`
- `subtitle`
- `lesson`
- `mechanicTags`
- `designIntent`
- `parMoves`
- `targetMoves`
- `scriptedSolution`

## Validation

`src/levels/levelValidation.ts` checks:

- base level schema validity
- positive dimensions
- unique entity ids
- valid world parent-child references
- at least one goal
- required level metadata
- mechanic tags matching actual entities/world structure

`src/levels/tutorial.test.ts` verifies every scripted solution wins and stays within the level target move count.

## Removed Filler

The previous Stage 5 levels 11-15 were removed because they mostly broadened directional coverage rather than adding a strong new recursive idea. Stage 6 keeps the first ten experiments and rewrites them around a clearer teaching arc.
