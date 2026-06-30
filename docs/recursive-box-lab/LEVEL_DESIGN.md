# Recursive Box Lab Level Design

The tutorial set is original and purpose-built for this implementation. It does not copy layouts, titles, visual design, or puzzle sequences from Patrick's Parabox.

| # | Level | Teaching Goal | Mechanic |
| --- | --- | --- | --- |
| 1 | First Push | Establish movement and crate pushing. | Basic push |
| 2 | Step Inside | Enter an open crate. | `enterBox` |
| 3 | Load the Crate | Push cargo into an open crate. | `pushInto` |
| 4 | Push Out | Push cargo from an inner world to the parent. | `pushOut` |
| 5 | Two-Layer Transfer | Enter a box, then push cargo into a deeper box. | Two-layer `pushInto` |
| 6 | Nested Cargo | Push a world-bearing crate into a dock crate. | Box contains box |
| 7 | Out to Receiver | Push cargo out of one box directly into a neighboring receiver. | Push-out plus push-into |
| 8 | Chain Push | Push a short crate chain. | Cascading push |
| 9 | Left Exit | Push out through the left edge. | Directional push-out |
| 10 | Deep Entry | Navigate into a second nested world. | Multi-layer navigation |
| 11 | North Exit | Push out through the top edge. | Directional push-out |
| 12 | South Exit | Push out through the bottom edge. | Directional push-out |
| 13 | Inside-to-Outside | Enter a crate, then push cargo back to the root. | Enter then push-out |
| 14 | Vertical Loader | Push cargo downward into a nested crate. | Vertical `pushInto` |
| 15 | Deep Egress | Enter two layers and push cargo out of the deeper layer. | Multi-layer push-out |

## Progression

Levels 1-4 teach the four base actions. Levels 5-10 combine them in short, readable arrangements. Levels 11-15 broaden directional coverage and combine nested entry with push-out so the demo feels recursive rather than like ordinary Sokoban.

## Content Boundaries

- Keep level names and layouts original.
- Keep puzzle spaces small enough for a browser demo.
- Prefer one new idea per level.
- Avoid difficulty spikes until the engine has richer editor/debug tooling.
