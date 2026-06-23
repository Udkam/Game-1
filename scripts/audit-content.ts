import { readFileSync } from 'node:fs';
import { LEVELS } from '../src/engine/levels.js';

const RUN_ID = 'v7-loop-20260623-195154-f683';
const files = {
  readme: readFileSync('README.md', 'utf8'),
  claude: readFileSync('claude.md', 'utf8'),
  report: readFileSync(`docs/v7-loop/${RUN_ID}/10-acceptance-report.md`, 'utf8'),
  art: readFileSync(`docs/v7-loop/${RUN_ID}/07-art-direction.md`, 'utf8'),
  matrix: readFileSync(`docs/v7-loop/${RUN_ID}/06-level-design-matrix.md`, 'utf8'),
};

let failures = 0;
function check(condition: boolean, label: string): void {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${label}`);
  if (!condition) failures++;
}

console.log('\nDriftbox content audit');
console.log('-'.repeat(72));

check(LEVELS.length === 70, `runtime exposes 70 levels (actual ${LEVELS.length})`);
check(files.readme.includes('70-level') || files.readme.includes('70 levels'), 'README references 70-level target/status');
check(files.readme.includes('v7-loop-20260623-195154-f683'), 'README links current RUN_ID');
check(files.claude.includes('70-level') || files.claude.includes('70 levels'), 'claude.md references 70-level target/status');
check(files.claude.includes('v7-loop-20260623-195154-f683'), 'claude.md links current RUN_ID');
check(files.matrix.includes('Stage 6') || files.matrix.includes('70/70'), 'level matrix records current 70-level buildout status');
check(files.art.includes('No external images') && files.art.includes('No external'), 'art direction records external asset/license status');

const combined = Object.values(files).join('\n');
check(
  !/3D 已完成|2\.5D 已完成|v6 2\.5D (is )?(complete|completed|finished)|v6 (is )?(complete|completed|finished)/i.test(combined),
  'no stale v6/3D completion claims',
);
check(!/remaining 2D catalog|returns 52|current exposed catalog is 52/i.test(files.readme + files.claude), 'top-level docs do not describe old 52-level runtime');
check(combined.includes('v6 2.5D') && /retired|failed|archiv/i.test(combined), 'v6 2.5D is described as retired/failed/archive context');

console.log('-'.repeat(72));
if (failures) {
  console.error(`${failures} content audit check(s) failed.`);
  process.exit(1);
}
console.log('All content audit checks passed.');
