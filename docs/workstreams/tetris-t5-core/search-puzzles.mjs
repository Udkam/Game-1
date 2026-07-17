/**
 * Bounded clean-room authoring search for T5 legal authored Puzzle endgames.
 *
 * Stage one replays a separate setup seven-bag onto an empty board with legal hard
 * drops and zero line clears. Stage two searches the gameplay seven-bag for two
 * successful downstack routes. Production acceptance is always re-run through the
 * TypeScript engine's public dispatch API.
 *
 * Usage:
 *   node search-puzzles.mjs --seed <gameplay-uint32> --setup-seed <setup-uint32>
 *     [candidate-count] [beam-width] [max-ms] [start-candidate] [setup-count]
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const WIDTH = 10;
const HEIGHT = 40;
const VISIBLE_START = 20;
const FULL = (1 << WIDTH) - 1;
const TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

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

function setupLanding(rows, typeRows, type, rotation, x) {
  const shape = SHAPES[type][rotation];
  let y = 19;
  if (!canPlace(rows, shape, x, y)) return null;
  while (canPlace(rows, shape, x, y + 1)) y += 1;
  const cells = shape.map(([dx, dy]) => [x + dx, y + dy]);
  const ownCells = new Set(cells.map(([cellX, cellY]) => `${cellX},${cellY}`));
  for (const [cellX, cellY] of cells) {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const neighborX = cellX + dx;
      const neighborY = cellY + dy;
      if (ownCells.has(`${neighborX},${neighborY}`)) continue;
      if (neighborY >= 0 && neighborY < HEIGHT && neighborX >= 0 && neighborX < WIDTH
        && (typeRows[type][neighborY] & (1 << neighborX)) !== 0) return null;
    }
  }
  const nextRows = [...rows];
  const nextTypeRows = { ...typeRows, [type]: [...typeRows[type]] };
  for (const [cellX, cellY] of cells) {
    nextRows[cellY] |= 1 << cellX;
    nextTypeRows[type][cellY] |= 1 << cellX;
  }
  if (nextRows.some((row) => row === FULL) || nextRows.slice(0, VISIBLE_START).some(Boolean)) return null;
  return { rows: nextRows, typeRows: nextTypeRows, y, cells };
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

function topologyMetrics(rows) {
  const visible = rows.slice(VISIBLE_START);
  const top = visible.findIndex(Boolean);
  if (top < 0) return { rows: 0, shapes: 0, densities: 0, coveredColumns: 0, buriedHoles: 0 };
  const occupiedRows = visible.slice(top);
  const coveredColumns = new Set();
  let buriedHoles = 0;
  for (let x = 0; x < WIDTH; x += 1) {
    for (let y = top + 1; y < visible.length - 1; y += 1) {
      if ((visible[y] & (1 << x)) !== 0) continue;
      const filledAbove = visible.slice(top, y).some((row) => (row & (1 << x)) !== 0);
      const filledBelow = visible.slice(y + 1).some((row) => (row & (1 << x)) !== 0);
      if (filledAbove) coveredColumns.add(x);
      if (filledAbove && filledBelow) buriedHoles += 1;
    }
  }
  return {
    rows: occupiedRows.length,
    shapes: new Set(occupiedRows).size,
    densities: new Set(occupiedRows.map(popcount)).size,
    coveredColumns: coveredColumns.size,
    buriedHoles,
  };
}

function setupPath(node) {
  const placements = [];
  let cursor = node;
  while (cursor?.placement) {
    placements.push(cursor.placement);
    cursor = cursor.parent;
  }
  return placements.reverse();
}

function searchSetup(setupSeed, setupCount, beamWidth, stats, variant) {
  const sequence = sequenceForSeed(setupSeed, setupCount);
  const emptyTypeRows = Object.fromEntries(TYPES.map((type) => [type, Array.from({ length: HEIGHT }, () => 0)]));
  let beam = [{
    rows: Array.from({ length: HEIGHT }, () => 0),
    typeRows: emptyTypeRows,
    parent: null,
    placement: null,
    score: 0,
    pathHash: 2166136261,
  }];
  for (let depth = 0; depth < setupCount; depth += 1) {
    const type = sequence[depth];
    const candidates = new Map();
    for (const node of beam) {
      stats.setupExpanded += 1;
      for (let rotation = 0; rotation < 4; rotation += 1) {
        const shape = SHAPES[type][rotation];
        const minX = -Math.min(...shape.map(([x]) => x));
        const maxX = WIDTH - 1 - Math.max(...shape.map(([x]) => x));
        for (let x = minX; x <= maxX; x += 1) {
          const placed = setupLanding(node.rows, node.typeRows, type, rotation, x);
          if (!placed) continue;
          const value = boardMetrics(placed.rows);
          if (value.maximum > 12) continue;
          const topology = topologyMetrics(placed.rows);
          const targetHeight = Math.min(10, 2 + (depth + 1) * 0.45);
          const targetHoles = Math.min(12, Math.max(0, depth - 5));
          const pathHash = Math.imul(
            node.pathHash ^ ((x + 3) * 31 + rotation * 131 + placed.y * 521 + (depth + 1) * 977),
            16777619,
          ) >>> 0;
          const variantBias = ((Math.imul(pathHash, (variant + 1) * 0x45d9f3b) >>> 0) % 97) - 48;
          const score = Math.abs(value.maximum - targetHeight) * 90
            + Math.abs(value.holes - targetHoles) * 55
            + value.bumpiness * 9
            - topology.shapes * 15
            - topology.densities * 25
            - topology.coveredColumns * 28
            - Math.min(topology.buriedHoles, 14) * 16
            + variantBias;
          const placement = { type, rotation, x, landingY: placed.y };
          const next = { ...placed, parent: node, placement, score, pathHash };
          const colorKey = TYPES.map((piece) => boardKey(next.typeRows[piece])).join('/');
          const key = `${boardKey(next.rows)}|${colorKey}`;
          const previous = candidates.get(key);
          if (!previous || next.score < previous.score) candidates.set(key, next);
          stats.setupGenerated += 1;
        }
      }
    }
    beam = [...candidates.values()].sort((left, right) => left.score - right.score).slice(0, beamWidth);
    if (beam.length === 0) return null;
  }
  return beam.find((node) => {
    const topology = topologyMetrics(node.rows);
    return topology.rows >= 8 && topology.rows <= 12
      && topology.shapes >= 7 && topology.densities >= 4
      && topology.coveredColumns >= 5 && topology.buriedHoles >= 8;
  }) ?? null;
}

function rotationInputs(rotation) {
  return rotation === 0 ? 0 : rotation === 2 ? 2 : 1;
}

function calculateNodeScore(node, value, secondRoute) {
  return value.holes * 430 + value.aggregate * 9 + value.bumpiness * 17 + value.maximum * 45
    - node.clearedLines * 35 - Math.min(node.rotations, 8) * 12
    - popcount(node.xMask) * 18 - Math.min(node.nonClearing, 5) * 7
    - (secondRoute ? Math.min(node.semanticDifferences, 6) * 110 : 0)
    - (secondRoute ? Math.min(node.boardHashDivergences, 2) * 140 : 0)
    - (secondRoute && node.firstDivergenceLock && node.firstDivergenceLock <= 5 ? 120 : 0)
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
    boardHashDiverged: (node.boardHashDivergences ?? 0) > 0,
    boardHashDivergences: node.boardHashDivergences ?? 0,
    firstDivergenceLock: node.firstDivergenceLock ?? null,
  };
}

function meetsRouteThresholds(node, sequence, path) {
  const metrics = routeMetrics(node, sequence, path);
  return metrics.lockedPieces >= 30 && metrics.lockedPieces <= 42
    && metrics.pieceTypes === 7
    && metrics.effectiveRotations >= 8
    && metrics.distinctLandingXs >= 7
    && metrics.nonClearingLocks >= 5
    && metrics.clearPhases >= 4;
}

function meetsPairThresholds(diversity) {
  return diversity.semanticDifferences >= 5
    && diversity.firstDivergenceLock !== null
    && diversity.firstDivergenceLock <= 5
    && diversity.boardHashDivergences >= 2;
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

function searchRoute(initialRows, sequence, setupCount, beamWidth, stats, reference = null, variant = 0, collectAlternate = false) {
  const legalTerminalDepths = new Set(Array.from({ length: 13 }, (_, index) => 30 + index)
    .filter((depth) => (setupCount + depth) % 5 === 0));
  const targetDepth = 42;
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
    boardHashDivergences: 0,
    firstDivergenceLock: null,
    occupied: boardMetrics(initialRows).occupied,
    score: 0,
    variantBias: 0,
    pathHash: 2166136261,
  }];

  for (let depth = 1; depth <= targetDepth; depth += 1) {
    const candidates = new Map();
    const type = sequence[depth - 1];
    for (const node of beam) {
      stats.routeExpanded += 1;
      for (const placed of landings(node.rows, type)) {
        stats.routeGenerated += 1;
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
        const boardDiffers = Boolean(referencePlacement && placement.boardKeyAfter !== referencePlacement.boardKeyAfter);
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
          boardHashDivergences: node.boardHashDivergences + Number(boardDiffers),
          firstDivergenceLock: node.firstDivergenceLock ?? (differs ? depth : null),
          occupied: node.occupied + 4 - placed.cleared * WIDTH,
          variantBias: node.variantBias + placementVariantBias(placement, depth, variant),
          pathHash: Math.imul(
            node.pathHash ^ ((placed.x + 3) * 31 + placed.rotation * 131 + placed.y * 521 + depth * 977),
            16777619,
          ) >>> 0,
        };
        if (reference && depth === 5 && next.firstDivergenceLock === null) continue;
        next.score = calculateNodeScore(next, boardMetrics(placed.rows), Boolean(reference));
        const empty = next.occupied === 0;
        if (empty) {
          const path = extractPath(next);
          const routeOk = meetsRouteThresholds(next, sequence, path);
          const diversityOk = !reference || meetsPairThresholds(routeMetrics(next, sequence, path));
          if (legalTerminalDepths.has(depth) && routeOk && diversityOk) {
            const goal = { path, metrics: routeMetrics(next, sequence, path) };
            if (!collectAlternate) return goal;
            if (!firstGoal) firstGoal = goal;
            else {
              const diversity = routeDiversity(firstGoal, goal);
              if (meetsPairThresholds(diversity)) {
                goal.metrics = { ...goal.metrics, ...diversity };
                firstGoal.alternate = goal;
                return firstGoal;
              }
            }
          }
          continue;
        }
        const diversityKey = reference
          ? `${Math.min(5, next.semanticDifferences)}|${Math.min(2, next.boardHashDivergences)}|${next.firstDivergenceLock ?? 0}`
          : '';
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
  let boardHashDivergences = 0;
  let firstDivergenceLock = null;
  for (let index = 0; index < Math.min(first.path.length, second.path.length); index += 1) {
    const left = first.path[index];
    const right = second.path[index];
    if (left.rotation !== right.rotation || left.x !== right.x || left.cellsKey !== right.cellsKey) {
      semanticDifferences += 1;
      firstDivergenceLock ??= index + 1;
    }
    if (left.boardKeyAfter !== right.boardKeyAfter) boardHashDivergences += 1;
  }
  return {
    semanticDifferences,
    boardHashDiverged: boardHashDivergences > 0,
    boardHashDivergences,
    firstDivergenceLock,
  };
}

function visibleRows(typeRows) {
  return Array.from({ length: HEIGHT - VISIBLE_START }, (_, visibleY) => {
    const y = VISIBLE_START + visibleY;
    return Array.from({ length: WIDTH }, (_, x) => (
      TYPES.find((type) => (typeRows[type][y] & (1 << x)) !== 0) ?? '.'
    )).join('');
  });
}

function routeForOutput(route) {
  return {
    placements: route.path.map(({ type, rotation, x, landingY, clearedLines }) => ({
      type, rotation, x, landingY, clearedLines,
    })),
    metrics: route.metrics,
  };
}

if (process.argv[2] !== '--seed' || process.argv[4] !== '--setup-seed') {
  throw new Error('expected --seed <gameplay-uint32> --setup-seed <setup-uint32>');
}
const seed = Number(process.argv[3]);
const setupSeed = Number(process.argv[5]);
const maxCandidates = Number(process.argv[6] ?? 12);
const beamWidth = Number(process.argv[7] ?? 4000);
const maxMs = Number(process.argv[8] ?? 240_000);
const startCandidate = Number(process.argv[9] ?? 0);
const setupCount = Number(process.argv[10] ?? 20);
const outputPath = process.argv[11] ? resolve(process.argv[11]) : null;
if (!Number.isSafeInteger(seed) || seed <= 0 || seed > 0xffff_ffff) {
  throw new Error('gameplay seed must be a nonzero uint32');
}
if (!Number.isSafeInteger(setupSeed) || setupSeed <= 0 || setupSeed > 0xffff_ffff) {
  throw new Error('setup seed must be a nonzero uint32');
}
if (!Number.isInteger(setupCount) || setupCount < 16 || setupCount > 22) {
  throw new Error('setup-count must be 16..22');
}

const sequence = sequenceForSeed(seed, 84);
const deadline = Date.now() + maxMs;
const startedAt = Date.now();
const stats = { setupExpanded: 0, setupGenerated: 0, routeExpanded: 0, routeGenerated: 0 };
let result = null;
let evaluatedCandidates = 0;
for (let candidateIndex = startCandidate; candidateIndex < startCandidate + maxCandidates; candidateIndex += 1) {
  if (Date.now() >= deadline) break;
  const setup = searchSetup(setupSeed, setupCount, Math.min(beamWidth, 3000), stats, candidateIndex);
  evaluatedCandidates += 1;
  if (!setup) continue;
  const board = setup.rows;
  const setupMetrics = topologyMetrics(board);
  process.stderr.write(`candidate ${candidateIndex}: setup ${setupCount} pieces / ${setupMetrics.rows} rows / ${setupMetrics.buriedHoles} holes\n`);
  const first = searchRoute(board, sequence, setupCount, beamWidth, stats, null, 0, true);
  if (!first) continue;
  process.stderr.write(`candidate ${candidateIndex}: first route ${first.path.length} locks\n`);
  let second = first.alternate
    ?? searchRoute(board, sequence, setupCount, beamWidth, stats, first.path);
  for (let variant = 1; !second && variant <= 4; variant += 1) {
    const alternate = searchRoute(board, sequence, setupCount, beamWidth, stats, null, variant);
    if (!alternate) continue;
    const diversity = routeDiversity(first, alternate);
    if (!meetsPairThresholds(diversity)) continue;
    alternate.metrics = { ...alternate.metrics, ...diversity };
    second = alternate;
    break;
  }
  if (!second) continue;
  result = {
    seed,
    setup: {
      seed: setupSeed,
      placements: setupPath(setup).map(({ type, rotation, x }) => ({ type, rotation, x })),
      metrics: {
        ...setupMetrics,
        allSevenTypes: new Set(sequenceForSeed(setupSeed, setupCount)).size === TYPES.length,
        zeroLineClears: true,
        hiddenCells: 0,
        sameColorComponents: Object.fromEntries(TYPES.map((type) => [
          type,
          sequenceForSeed(setupSeed, setupCount).filter((piece) => piece === type).length,
        ])),
      },
    },
    candidateIndex,
    boardRows: visibleRows(setup.typeRows),
    first84: sequence,
    routes: [routeForOutput(first), routeForOutput(second)],
  };
  break;
}

const stoppedBeforeAllCandidates = !result && evaluatedCandidates < maxCandidates;
const expandedNodeBudget = {
  setupPerCandidate: setupCount * Math.min(beamWidth, 3000),
  routePerPass: 42 * beamWidth,
  maximumRoutePassesPerCandidate: 6,
};
const output = {
  status: result ? 'complete' : stoppedBeforeAllCandidates ? 'incomplete' : 'complete-no-result',
  stableCandidateRank: result?.candidateIndex ?? null,
  evaluatedCandidates,
  expandedNodeBudget,
  expandedNodes: stats,
  result,
  elapsedMs: Date.now() - startedAt,
};
if (outputPath) {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, { encoding: 'utf8' });
  process.stdout.write(`${JSON.stringify({
    outputPath,
    status: output.status,
    stableCandidateRank: output.stableCandidateRank,
    expandedNodeBudget: output.expandedNodeBudget,
    expandedNodes: output.expandedNodes,
    elapsedMs: output.elapsedMs,
  })}\n`);
} else {
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}
if (!result) process.exitCode = 2;
