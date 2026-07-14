# Tetris T3R Puzzle Visual Data Handoff

This handoff defines data only. It deliberately specifies no layout, CSS, animation, or visual direction.

## Puzzle select

For each item in `levels.json` expose:

- `id`
- full Chinese `name`
- `index` and `total` (the current set is 1–6 / 6)
- `difficulty`
- `unlocked: boolean`
- fixed goal label: `清空可见棋盘`

The select surface must not show score, a leaderboard rank, a time target, a second queue preview, or a fake success percentage.

## Puzzle play

Use canonical run data to expose:

- full level name and `index/total`
- `remainingPieces = puzzlePieceBudget - pieceCount`
- `goal = visible-board-empty`
- factual status: `ready`, `playing`, or `paused`
- exactly one Next item: `puzzleQueue[puzzleQueueIndex]`, when it exists

Do not render Marathon score/level or Race time/remaining lines/speed in Puzzle. Do not expose more than one upcoming piece.

## Complete and fail

On complete expose `completedLevelId`, full Chinese level name, `boardEmpty: true`, and either `nextUnlockedLevel` or `campaignComplete: true`. On fail expose the same level identity plus exactly one factual code: `top-out`, `invalid-spawn`, or `budget-exhausted`.

Neither surface may derive completion from score, line count, timer, stored leaderboard data, or a UI-only flag. The board-empty predicate and campaign transition must come from canonical run output.
