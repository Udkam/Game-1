# Tetris T3R Puzzle Campaign Rules Contract

Status: proposed production contract, verified against the current deterministic core through the workstream-local adapter. This document does not claim that the current T2 Puzzle implementation already satisfies the campaign schema.

## 1. Canonical run state

Every Puzzle run is an authored level, never a bag or seeded random draw. The later production state must carry, hash, and replay at least these values:

```ts
type PuzzleRunState = {
  mode: 'puzzle';
  puzzleLevelId: PuzzleLevelId;
  puzzleBoardRows: readonly BoardRow[]; // initialization source, 20 rows × 10 cells
  puzzleQueue: readonly PieceType[];    // fixed full sequence
  puzzleQueueIndex: number;             // index of the next unspawned piece
  puzzlePieceBudget: number;
  puzzleGoal: 'visible-board-empty';
  puzzleCompletion: 'active' | 'finished' | 'failed-top-out' | 'failed-budget';
  completedLevelId: PuzzleLevelId | null;
  unlockedLevelId: PuzzleLevelId | null;
};
```

`puzzleQueueIndex` is `1` immediately after the first queue item becomes the active piece. It advances exactly once on each successful spawn and never advances on a blocked spawn. The fixed queue, index, budget, goal, completion result, completed level ID, and unlock result belong to canonical state; therefore they participate in state hash and deterministic replay.

The authored board is a visible, non-empty 10 × 20 matrix. Each cell is either `.` or one of `I/O/T/S/Z/J/L`; construction occurs only while creating the initial state. Thereafter, only public core commands may alter the run.

## 2. Mechanics and commands

- Existing SRS movement, rotation, collision, hard drop, lock, and line-clear implementation remains authoritative.
- Puzzle gravity is disabled. Fixed `tick` commands may advance deterministic time but must not move or lock the active piece.
- The player deliberately uses the existing public `move`, `rotate`, `soft-drop`, and `hard-drop` commands. A hard drop follows the existing lock and line-resolution path.
- There is no bag refill or random draw in Puzzle. The queue ends exactly where authored.
- Undo is not a Puzzle mechanic. The current production engine exposes no player undo, so this contract adds none.

## 3. Goal, resolution, and fail order

After every public lock, run normal core line resolution first. Then apply this ordering:

1. If the lock produces a top-out (`lock-out`), invalid state, or a next-piece spawn cannot be placed (`block-out`), fail as `failed-top-out`.
2. Otherwise count occupied cells across all 20 visible rows. If the count is zero, finish immediately as `finished`.
3. Otherwise, if the piece budget has been consumed or there is no next fixed-queue piece to spawn, fail as `failed-budget`.
4. Otherwise spawn exactly the next authored piece and continue.

Success is never based on a line total, score, elapsed time, a hidden target, or presentation storage. A clearing lock that leaves even one visible cell is not success. If an empty board and final budget consumption happen together, empty-board success wins after the top-out check.

## 4. Restart, replay, and campaign unlock

`restart` recreates the same level ID, 20-row board, full queue, queue index, first active piece, budget, and initial deterministic hash. Replay begins from this same authored initializer and applies only public command records in order.

On success, the run records `completedLevelId` and unlocks only the next campaign level, if any. A completed final level has no next unlock. Unlock persistence may live in the presentation shell, but the completion and newly unlocked level reported by the run must be canonical/hashable so a replay cannot claim an unlock it did not earn. Leaderboards do not determine Puzzle success and do not gate campaign progression.

## 5. UI data contract

The rendering shell receives real state only:

| Surface | Required data |
| --- | --- |
| Select | full Chinese level name, `index/total`, difficulty, unlocked status, fixed goal `清空可见棋盘` |
| Playing | full Chinese level name, `index/total`, remaining pieces (`budget - pieceCount`), visible-board-empty goal, active/paused status |
| Next | exactly `puzzleQueue[puzzleQueueIndex]` when it exists; no second preview |
| Complete | completed level ID/name, board-empty result, next unlocked level or campaign-complete state |
| Fail | level ID/name and one factual reason: top-out, invalid spawn, or budget exhausted |

Do not expose score, Marathon level, Race timer, a second queue preview, a target-line counter as the success condition, fake telemetry, or a hidden solver result.

## 6. Fail-closed validation and forbidden shortcuts

The typed level validator fails closed for: fewer or more than 20 rows; row width other than 10; unsupported cell type; initially empty board; duplicate or out-of-range sparse input when converting legacy forms; empty queue; invalid piece type; non-positive budget; budget greater than queue length; or non-positive goal metadata.

The validator must reject a replay if its level ID, queue, command hash, final canonical hash, locked-piece count, line resolution, or board-empty result differs from its reference contract. The campaign must not inject a finished state, clear board cells directly after initialization, write local storage into core, or use a browser-only state override to manufacture completion.

## 7. Exact later production delta

The current engine has fixed sparse definitions, no campaign-level ID/queue index/unlock state, and treats `lines >= puzzleTargetLines` as success. Later implementation must replace that Puzzle-only completion branch with the ordering above, add the typed full-row level loader and validator, add canonical campaign fields to hash/replay, and add deterministic restart/mode-switch coverage. The workstream adapter only constructs an authored initial board so that existing public commands can verify the proposed fixtures; it is not a claim that current production state supports this contract.
