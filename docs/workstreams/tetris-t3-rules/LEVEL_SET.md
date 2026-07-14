# Tetris T3R Verified Puzzle Level Set

All six levels are original, clean-room authored fixtures. Their exact 20 rows, fixed queue, budget, and mechanic are machine-readable in [levels.json](./levels.json). A `.` is empty and letters are initial locked cell types; every level begins with visible locked cells and has no random draw.

| # | ID / Chinese name | Difficulty | Queue | Budget | Initial cells | Intended mechanic |
| --- | --- | ---: | --- | ---: | ---: | --- |
| 1 | `t3r-shaft-01` / 三井初鸣 | 4 | I I I | 3 | 28 | Edge-to-edge SRS rotation into three offset vertical shafts. |
| 2 | `t3r-shaft-02` / 四井错拍 | 5 | I I I I | 4 | 24 | Four unequal shafts; the intermediate landing order changes the remaining routes. |
| 3 | `t3r-shaft-03` / 偏置立柱 | 5 | I I I I | 4 | 24 | Alternating side shafts require boundary correction after rotation. |
| 4 | `t3r-well-04` / 左井三折 | 5 | T J L | 3 | 28 | Left 3-wide well; cascading clears make the J/L rotations consequential. |
| 5 | `t3r-well-05` / 中井回环 | 5 | J T L | 3 | 28 | Central well with mandatory double rotations and immediate line resolution. |
| 6 | `t3r-well-06` / 右井反照 | 6 | L T J | 3 | 28 | Right-edge well combines the longest lateral travel with repeated rotations. |

Every verified reference route locks at least three pieces, clears four normal lines, ends with zero visible occupied cells, and invokes a horizontal move or a rotation before a lock. `expectedClearedLines` is a real replay conservation assertion only. The future success predicate is board empty; the current adapter supplies this value to the legacy core solely so it can complete its existing line-target transition while the external oracle rejects any residual cells.

## Reference results

| Level | Commands | Locks | Cleared lines | Final occupied | Current engine hash |
| --- | ---: | ---: | ---: | ---: | --- |
| 三井初鸣 | 21 | 3 | 4 | 0 | `68f86f9f` |
| 四井错拍 | 28 | 4 | 4 | 0 | `f839a801` |
| 偏置立柱 | 26 | 4 | 4 | 0 | `f839a801` |
| 左井三折 | 17 | 3 | 4 | 0 | `1652d858` |
| 中井回环 | 10 | 3 | 4 | 0 | `3532001d` |
| 右井反照 | 22 | 3 | 4 | 0 | `3532001d` |

The duplicate current-engine hashes are expected evidence of the present semantic gap: current canonical Puzzle state does not contain a T3R level identity or queue index after the queue is consumed. The production delta in [PUZZLE_RULES_CONTRACT.md](./PUZZLE_RULES_CONTRACT.md) makes those fields canonical, so future hashes distinguish these levels without a presentation-side workaround.

## Generation and difficulty evidence

The fixtures were constructed from two original families: edge/misaligned four-row vertical shafts and left/centre/right three-wide wells. A bounded deterministic search then loaded each authored 20-row board through the workstream initializer, enumerated only current public `move`, clockwise/counter-clockwise `rotate`, `hard-drop`, and required entry `tick` commands, and retained routes that reached an empty visible board. The search depth was capped at nine placement actions per piece; it did not mutate a state after initialization and did not use a browser state override.

This demonstrates a route for each authored level, validates normal current-core line resolution, and gives concrete movement/rotation evidence. It is not an exhaustive uniqueness proof; no level is claimed to have a unique solution.
