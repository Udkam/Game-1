/**
 * Bounded clean-room authoring search for T5 normal-play Puzzle boards.
 *
 * This helper mirrors only deterministic seven-bag draws, hard-drop geometry, and
 * immediate row removal so it can propose boards/routes. Production acceptance is
 * always re-run through the TypeScript engine's public dispatch API.
 *
 * Usage:
 *   node search-puzzles.mjs <level-index 0..5> [candidate-count] [beam-width] [max-ms] [start-candidate] [stack-height]
 *   node search-puzzles.mjs --seed <uint32> [candidate-count] [beam-width] [max-ms] [start-candidate] [stack-height]
 */

const WIDTH = 10;
const HEIGHT = 40;
const VISIBLE_START = 20;
const FULL = (1 << WIDTH) - 1;
const TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
const LEVEL_SEEDS = [0x75c0b101, 0x75c0b202, 0x75c0b303, 0x75c0b404, 0x75c0b505, 0x75c0b606];

const SHAPES = {
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3]],
  ],
  O: Array.from({ length: 4 }, () => [[0, 0], [1, 0], [0, 1], [1, 1]]),
  T: [
    [[1, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [1, 2]],
  ],
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2]],
  ],
  Z: [
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 0], [0, 1], [1, 1], [0, 2]],
  ],
  J: [
    [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [0, 2], [1, 2]],
  ],
  L: [
    [[2, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]],
    [[0, 0], [1, 0], [1, 1], [1, 2]],
  ],
};

function nextSeed(seed) {
  let value = seed >>> 0;
  if (value === 0) value = 0x6d2b79f5;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return value >>> 0;
}

function random(seed) {
  let value = seed >>> 0;
  return () => {
    value = nextSeed(value);
    return value / 0x1_0000_0000;
  };
}

function sequenceForSeed(seed, count = 84) {
  let randomizerSeed = seed >>> 0 || 0x6d2b79f5;
  let bag = [];
  const sequence = [];
  while (sequence.length < count) {
    if (bag.length === 0) {
      bag = [...TYPES];
      for (let index = bag.length - 1; index > 0; index -= 1) {
        randomizerSeed = nextSeed(randomizerSeed);
        const swapIndex = randomizerSeed % (index + 1);
        [bag[index], bag[swapIndex]] = [bag[swapIndex], bag[index]];
      }
    }
    sequence.push(bag.shift());
  }
  return sequence;
}

function popcount(value) {
  let count = 0;
  for (let bits = value >>> 0; bits; bits >>>= 1) count += bits & 1;
  return count;
}

function boardKey(rows) {
  return rows.slice(VISIBLE_START).map((row) => row.toString(36)).join('.');
}

function canPlace(rows, shape, x, y) {
  return shape.every(([dx, dy]) => {
    const cellX = x + dx;
    const cellY = y + dy;
    return cellX >= 0 && cellX < WIDTH && cellY >= 0 && cellY < HEIGHT
      && (rows[cellY] & (1 << cellX)) === 0;
  });
}

function place(rows, type, rotation, x) {
  const shape = SHAPES[type][rotation];
  let y = 19;
  if (!canPlace(rows, shape, x, y)) return null;
  while (canPlace(rows, shape, x, y + 1)) y += 1;

  const cells = shape.map(([dx, dy]) => [x + dx, y + dy]);
  const merged = [...rows];
  for (const [cellX, cellY] of cells) merged[cellY] |= 1 << cellX;
  const clearedRows = [];
  for (let row = 0; row < HEIGHT; row += 1) if (merged[row] === FULL) clearedRows.push(row);
  const kept = merged.filter((_, row) => !clearedRows.includes(row));
  const next = [...Array.from({ length: clearedRows.length }, () => 0), ...kept];
  if (next.slice(0, VISIBLE_START).some(Boolean)) return null;

  return {
    rows: next,
    y,
    cells,
    cellsKey: cells.map(([cellX, cellY]) => `${cellX},${cellY}`).sort().join('|'),
    cleared: clearedRows.length,
  };
}

function landings(rows, type) {
  const results = [];
  const seen = new Set();
  for (let rotation = 0; rotation < 4; rotation += 1) {
    const shape = SHAPES[type][rotation];
    const minX = -Math.min(...shape.map(([x]) => x));
    const maxX = WIDTH - 1 - Math.max(...shape.map(([x]) => x));
    for (let x = minX; x <= maxX; x += 1) {
      const placed = place(rows, type, rotation, x);
      if (!placed) continue;
      const key = `${boardKey(placed.rows)}|${placed.cellsKey}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({ type, rotation, x, ...placed });
    }
  }
  return results;
}

function boardMetrics(rows) {
  const heights = [];
  let holes = 0;
  let occupied = 0;
  for (const row of rows) occupied += popcount(row);
  for (let x = 0; x < WIDTH; x += 1) {
    let top = HEIGHT;
    for (let y = VISIBLE_START; y < HEIGHT; y += 1) {
      if ((rows[y] & (1 << x)) !== 0) {
        top = y;
        break;
      }
    }
    heights.push(HEIGHT - top);
    let filled = false;
    for (let y = VISIBLE_START; y < HEIGHT; y += 1) {
      if ((rows[y] & (1 << x)) !== 0) filled = true;
      else if (filled) holes += 1;
    }
  }
  const aggregate = heights.reduce((sum, value) => sum + value, 0);
  const bumpiness = heights.slice(1).reduce((sum, value, index) => sum + Math.abs(value - heights[index]), 0);
  return { occupied, holes, aggregate, bumpiness, maximum: Math.max(...heights) };
}

function rotationInputs(rotation) {
  return rotation === 0 ? 0 : rotation === 2 ? 2 : 1;
}

function calculateNodeScore(node, value, secondRoute) {
  return value.holes * 430 + value.aggregate * 9 + value.bumpiness * 17 + value.maximum * 45
    - node.clearedLines * 35 - Math.min(node.rotations, 8) * 12
    - popcount(node.xMask) * 18 - Math.min(node.nonClearing, 5) * 7
    - (secondRoute ? Math.min(node.semanticDifferences, 6) * 85 : 0)
    + node.variantBias;
}

function placementVariantBias(placement, depth, variant) {
  if (variant === 1) return placement.x * 12;
  if (variant === 2) return -placement.x * 12;
  if (variant === 3) return rotationInputs(placement.rotation) === 0 ? 18 : -18;
  if (variant === 4) return rotationInputs(placement.rotation) === 0 ? -18 : 18;
  const mixed = Math.imul((placement.x + 3) * 17 + placement.rotation * 31 + depth * 13, variant * 0x45d9f3b);
  return ((mixed >>> 0) % 49) - 24;
}

function routeMetrics(node, sequence, path) {
  return {
    lockedPieces: path.length,
    pieceTypes: new Set(sequence.slice(0, path.length)).size,
    effectiveRotations: node.rotations,
    distinctLandingXs: popcount(node.xMask),
    nonClearingLocks: node.nonClearing,
    clearPhases: node.clearPhases,
    clearedLines: node.clearedLines,
    semanticDifferences: node.semanticDifferences ?? 0,
    boardHashDiverged: node.boardHashDiverged ?? false,
  };
}

function meetsRouteThresholds(node, sequence, path) {
  const metrics = routeMetrics(node, sequence, path);
  return metrics.lockedPieces >= 28 && metrics.lockedPieces <= 35
    && metrics.pieceTypes === 7
    && metrics.effectiveRotations >= 6
    && metrics.distinctLandingXs >= 6
    && metrics.nonClearingLocks >= 3
    && metrics.clearPhases >= 3;
}

function extractPath(node) {
  const path = [];
  let cursor = node;
  while (cursor?.placement) {
    path.push(cursor.placement);
    cursor = cursor.parent;
  }
  return path.reverse();
}

function searchRoute(initialRows, sequence, beamWidth, deadline, reference = null, variant = 0, collectAlternate = false) {
  const targetDepth = reference?.length ?? 35;
  let firstGoal = null;
  let beam = [{
    rows: initialRows,
    parent: null,
    placement: null,
    rotations: 0,
    xMask: 0,
    nonClearing: 0,
    clearPhases: 0,
    clearedLines: 0,
    semanticDifferences: 0,
    boardHashDiverged: false,
    occupied: boardMetrics(initialRows).occupied,
    score: 0,
    variantBias: 0,
    pathHash: 2166136261,
  }];

  for (let depth = 1; depth <= targetDepth; depth += 1) {
    if (Date.now() >= deadline) return null;
    const candidates = new Map();
    const type = sequence[depth - 1];
    for (const node of beam) {
      for (const placed of landings(node.rows, type)) {
        const placement = {
          type,
          rotation: placed.rotation,
          x: placed.x,
          landingY: placed.y,
          clearedLines: placed.cleared,
          cellsKey: placed.cellsKey,
          boardKeyAfter: boardKey(placed.rows),
        };
        const referencePlacement = reference?.[depth - 1];
        const differs = referencePlacement
          ? placement.rotation !== referencePlacement.rotation
            || placement.x !== referencePlacement.x
            || placement.cellsKey !== referencePlacement.cellsKey
          : false;
        const boardHashDiverged = node.boardHashDiverged
          || Boolean(referencePlacement && placement.boardKeyAfter !== referencePlacement.boardKeyAfter);
        const next = {
          rows: placed.rows,
          parent: node,
          placement,
          rotations: node.rotations + rotationInputs(placed.rotation),
          xMask: node.xMask | (1 << (placed.x + 3)),
          nonClearing: node.nonClearing + Number(placed.cleared === 0),
          clearPhases: node.clearPhases + Number(placed.cleared > 0),
          clearedLines: node.clearedLines + placed.cleared,
          semanticDifferences: node.semanticDifferences + Number(differs),
          boardHashDiverged,
          occupied: node.occupied + 4 - placed.cleared * WIDTH,
          variantBias: node.variantBias + placementVariantBias(placement, depth, variant),
          pathHash: Math.imul(
            node.pathHash ^ ((placed.x + 3) * 31 + placed.rotation * 131 + placed.y * 521 + depth * 977),
            16777619,
          ) >>> 0,
        };
        next.score = calculateNodeScore(next, boardMetrics(placed.rows), Boolean(reference));
        const empty = next.occupied === 0;
        if (empty) {
          const path = extractPath(next);
          const routeOk = meetsRouteThresholds(next, sequence, path);
          const diversityOk = !reference
            || (depth === targetDepth && next.semanticDifferences >= 3 && next.boardHashDiverged);
          if (routeOk && diversityOk) {
            const goal = { path, metrics: routeMetrics(next, sequence, path) };
            if (!collectAlternate) return goal;
            if (!firstGoal) firstGoal = goal;
            else {
              const diversity = routeDiversity(firstGoal, goal);
              if (diversity.semanticDifferences >= 3 && diversity.boardHashDiverged) {
                goal.metrics = { ...goal.metrics, ...diversity };
                firstGoal.alternate = goal;
                return firstGoal;
              }
            }
          }
          continue;
        }
        if (reference && depth >= targetDepth) continue;
        const diversityKey = reference ? `${Math.min(3, next.semanticDifferences)}|${Number(next.boardHashDiverged)}` : '';
        const historyKey = collectAlternate ? `|${next.pathHash & 7}` : '';
        const key = `${placement.boardKeyAfter}|${diversityKey}${historyKey}`;
        const previous = candidates.get(key);
        if (!previous || next.score < previous.score) {
          candidates.set(key, next);
        }
      }
    }
    beam = [...candidates.values()]
      .sort((left, right) => left.score - right.score)
      .slice(0, beamWidth);
    if (beam.length === 0) return null;
  }
  return firstGoal;
}

function routeDiversity(first, second) {
  let semanticDifferences = 0;
  let boardHashDiverged = false;
  for (let index = 0; index < Math.min(first.path.length, second.path.length); index += 1) {
    const left = first.path[index];
    const right = second.path[index];
    if (left.rotation !== right.rotation || left.x !== right.x || left.cellsKey !== right.cellsKey) {
      semanticDifferences += 1;
    }
    if (left.boardKeyAfter !== right.boardKeyAfter) boardHashDiverged = true;
  }
  return { semanticDifferences, boardHashDiverged };
}

function candidateBoard(seed, candidateIndex, requestedHeight = null) {
  const rand = random(seed ^ Math.imul(candidateIndex + 1, 0x9e3779b1));
  const stackHeight = requestedHeight ?? 9 + (candidateIndex % 4);
  const holeProfiles = {
    9: [4, 3, 3, 2, 2, 1, 1, 1, 1],
    10: [4, 3, 3, 2, 2, 2, 1, 1, 1, 1],
    11: [5, 4, 3, 3, 2, 2, 1, 1, 1, 1, 1],
    12: [5, 4, 3, 3, 2, 2, 2, 1, 1, 1, 1, 1],
  };
  const masks = [];
  for (let row = 0; row < stackHeight; row += 1) {
    const holeCount = holeProfiles[stackHeight][row];
    let mask = FULL;
    while (popcount(FULL ^ mask) < holeCount) mask &= ~(1 << Math.floor(rand() * WIDTH));
    if (masks.includes(mask)) {
      const extraHole = Array.from({ length: WIDTH }, (_, x) => x)
        .find((x) => (mask & (1 << x)) !== 0);
      if (extraHole !== undefined) mask &= ~(1 << extraHole);
    }
    masks.push(mask);
  }
  if (new Set(masks).size < 6 || new Set(masks.map(popcount)).size < 4) return null;

  const coveredColumns = new Set();
  let buriedHoles = 0;
  for (let x = 0; x < WIDTH; x += 1) {
    for (let y = 1; y < masks.length - 1; y += 1) {
      if ((masks[y] & (1 << x)) !== 0) continue;
      const hasFilledAbove = masks.slice(0, y).some((mask) => (mask & (1 << x)) !== 0);
      const hasFilledBelow = masks.slice(y + 1).some((mask) => (mask & (1 << x)) !== 0);
      if (hasFilledAbove) coveredColumns.add(x);
      if (hasFilledAbove && hasFilledBelow) buriedHoles += 1;
    }
  }
  if (coveredColumns.size < 5 || buriedHoles < 8) return null;

  const rows = Array.from({ length: HEIGHT }, () => 0);
  for (let row = 0; row < stackHeight; row += 1) rows[HEIGHT - stackHeight + row] = masks[row];
  return rows;
}

function visibleRows(rows) {
  return rows.slice(VISIBLE_START).map((mask) => Array.from({ length: WIDTH }, (_, x) => (
    (mask & (1 << x)) === 0 ? '.' : 'J'
  )).join(''));
}

function routeForOutput(route) {
  return {
    placements: route.path.map(({ type, rotation, x, landingY, clearedLines }) => ({
      type, rotation, x, landingY, clearedLines,
    })),
    metrics: route.metrics,
  };
}

const explicitSeed = process.argv[2] === '--seed';
const levelIndex = explicitSeed ? null : Number(process.argv[2] ?? 0);
const seed = explicitSeed ? Number(process.argv[3]) : LEVEL_SEEDS[levelIndex];
const optionOffset = explicitSeed ? 1 : 0;
const maxCandidates = Number(process.argv[3 + optionOffset] ?? 60);
const beamWidth = Number(process.argv[4 + optionOffset] ?? 7000);
const maxMs = Number(process.argv[5 + optionOffset] ?? 120_000);
const startCandidate = Number(process.argv[6 + optionOffset] ?? 0);
const requestedHeight = process.argv[7 + optionOffset] === undefined
  ? null
  : Number(process.argv[7 + optionOffset]);
if (!explicitSeed && (!Number.isInteger(levelIndex) || levelIndex < 0 || levelIndex >= LEVEL_SEEDS.length)) {
  throw new Error('level-index must be 0..5');
}
if (!Number.isSafeInteger(seed) || seed <= 0 || seed > 0xffff_ffff) {
  throw new Error('seed must be a nonzero uint32');
}
if (requestedHeight !== null && (!Number.isInteger(requestedHeight) || requestedHeight < 9 || requestedHeight > 12)) {
  throw new Error('stack-height must be 9..12');
}

const sequence = sequenceForSeed(seed, 84);
const deadline = Date.now() + maxMs;
let result = null;
for (let candidateIndex = startCandidate; candidateIndex < startCandidate + maxCandidates && Date.now() < deadline; candidateIndex += 1) {
  const board = candidateBoard(seed, candidateIndex, requestedHeight);
  if (!board) continue;
  process.stderr.write(`candidate ${candidateIndex}: height ${requestedHeight ?? 9 + (candidateIndex % 4)}\n`);
  const first = searchRoute(board, sequence, beamWidth, deadline, null, 0, true);
  if (!first) continue;
  process.stderr.write(`candidate ${candidateIndex}: first route ${first.path.length} locks\n`);
  let second = first.alternate ?? null;
  for (let variant = 1; !second && variant <= 8 && Date.now() < deadline; variant += 1) {
    const alternate = searchRoute(board, sequence, beamWidth, deadline, null, variant);
    if (!alternate) continue;
    const diversity = routeDiversity(first, alternate);
    if (diversity.semanticDifferences < 3 || !diversity.boardHashDiverged) continue;
    alternate.metrics = { ...alternate.metrics, ...diversity };
    second = alternate;
    break;
  }
  if (!second && Date.now() < deadline) second = searchRoute(board, sequence, beamWidth, deadline, first.path);
  if (!second) continue;
  result = {
    levelIndex,
    seed,
    candidateIndex,
    boardRows: visibleRows(board),
    first84: sequence,
    routes: [routeForOutput(first), routeForOutput(second)],
  };
  break;
}

process.stdout.write(`${JSON.stringify({ result, elapsedMs: maxMs - Math.max(0, deadline - Date.now()) }, null, 2)}\n`);
if (!result) process.exitCode = 2;
