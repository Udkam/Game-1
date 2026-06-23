import { LEVEL_DEFS, LEVELS } from '../src/engine/levels.js';
import type { V7Mechanic } from '../src/engine/types.js';

const EXPECTED_COUNTS: Record<string, number> = {
  '第 1 章：启动序列': 8,
  '第 2 章：量子门': 8,
  '第 3 章：同步体': 8,
  '第 4 章：时间残影': 8,
  '第 5 章：空间置换': 8,
  '第 6 章：递归舱': 8,
  '第 7 章：连锁实验': 8,
  '第 8 章：误导协议': 8,
  '第 9 章：终局收束': 6,
};

const REQUIRED_MECHANICS: V7Mechanic[] = [
  'core-push',
  'quantum-portal',
  'sync-actors',
  'time-shadow',
  'spatial-swap',
  'recursive-room',
  'chain-state',
  'misdirection',
];

let failures = 0;
let warnings = 0;

function fail(message: string): void {
  failures++;
  console.error(`FAIL ${message}`);
}

function warn(message: string): void {
  warnings++;
  console.warn(`WARN ${message}`);
}

function pass(message: string): void {
  console.log(`PASS ${message}`);
}

function defSignature(def: (typeof LEVEL_DEFS)[number]): string {
  return JSON.stringify({
    map: def.map,
    twin: def.twin ?? null,
    gravity: def.gravity ?? false,
    mirrorTwin: def.mirrorTwin ?? false,
    timeShadow: def.timeShadow ?? null,
  });
}

console.log('\nDriftbox level audit');
console.log('-'.repeat(72));

if (LEVELS.length !== 70) fail(`expected exactly 70 levels, found ${LEVELS.length}`);
else pass('exactly 70 levels exposed');

if (LEVEL_DEFS.length !== LEVELS.length) fail('LEVEL_DEFS and LEVELS length mismatch');

const ids = new Set<string>();
for (const level of LEVELS) {
  if (ids.has(level.id)) fail(`duplicate id ${level.id}`);
  ids.add(level.id);
}
if (ids.size === LEVELS.length) pass('level ids are unique');

const counts: Record<string, number> = {};
for (const level of LEVELS) {
  const chapter = level.levelDesignNote?.chapter ?? level.chapter ?? '';
  counts[chapter] = (counts[chapter] ?? 0) + 1;
}
for (const [chapter, expected] of Object.entries(EXPECTED_COUNTS)) {
  const actual = counts[chapter] ?? 0;
  if (actual !== expected) fail(`${chapter} count expected ${expected}, got ${actual}`);
  else pass(`${chapter} count ${actual}`);
}

for (const level of LEVELS) {
  const note = level.levelDesignNote;
  if (!note) {
    fail(`${level.id} missing levelDesignNote`);
    continue;
  }
  const missing: string[] = [];
  if (note.id !== level.id) missing.push('matching id');
  if (!note.title) missing.push('title');
  if (!note.chapter) missing.push('chapter');
  if (!note.mechanics?.length) missing.push('mechanics');
  if (!note.coreIdea) missing.push('coreIdea');
  if (!note.trick) missing.push('trick');
  if (!note.fairness) missing.push('fairness');
  if (note.difficulty < 1 || note.difficulty > 5) missing.push('difficulty');
  if (!['optimal', 'verified-replay', 'manual-reviewed'].includes(note.solverStatus)) missing.push('solverStatus');
  if (note.par !== level.par) missing.push('par matches runtime');
  if (!note.solution?.length) missing.push('solution');
  if (missing.length) fail(`${level.id} metadata incomplete: ${missing.join(', ')}`);
  if (note.solverStatus !== 'optimal' && note.par !== note.solution.length) {
    fail(`${level.id} replay/manual par must match solution length (${note.par} != ${note.solution.length})`);
  }
}
pass('metadata scan complete');

const mechanicSeen = new Set<V7Mechanic>();
for (const level of LEVELS) {
  for (const mech of level.levelDesignNote?.mechanics ?? []) mechanicSeen.add(mech);
}
for (const mech of REQUIRED_MECHANICS) {
  if (!mechanicSeen.has(mech)) fail(`required mechanic missing from corpus: ${mech}`);
  else pass(`mechanic present: ${mech}`);
}

const signatures = new Map<string, string[]>();
for (const def of LEVEL_DEFS) {
  const sig = defSignature(def);
  const list = signatures.get(sig) ?? [];
  list.push(def.id);
  signatures.set(sig, list);
}
for (const idsForSig of signatures.values()) {
  if (idsForSig.length > 1) fail(`duplicate exact layout signature: ${idsForSig.join(', ')}`);
}
pass('exact layout duplicate scan complete');

for (const [chapter] of Object.entries(EXPECTED_COUNTS)) {
  const chapterLevels = LEVELS.filter((level) => level.levelDesignNote?.chapter === chapter);
  const shortAfterIntro = chapterLevels
    .slice(2)
    .filter((level) => (level.levelDesignNote?.solution.length ?? 0) <= 2);
  if (shortAfterIntro.length) {
    fail(`${chapter} has post-intro obvious short levels: ${shortAfterIntro.map((l) => l.id).join(', ')}`);
  }
}
pass('obvious short-level scan complete');

const manualOrReplay = LEVELS.filter((level) =>
  ['verified-replay', 'manual-reviewed'].includes(level.levelDesignNote?.solverStatus ?? ''),
);
if (manualOrReplay.length > 52) {
  warn(`${manualOrReplay.length} levels rely on replay/manual status; final QA should sample-play advanced chapters.`);
}

console.log('-'.repeat(72));
console.log(`Level audit complete: failures=${failures}, warnings=${warnings}`);
if (failures) process.exit(1);
