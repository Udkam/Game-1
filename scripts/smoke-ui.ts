// Headless UI self-test. Drives the *real* UI (ui.ts) under jsdom: opens each
// level from the menu, plays the solver's solution via simulated key presses,
// and asserts the win overlay appears. This catches wiring bugs the engine-level
// solver can't (input handling, render reconciliation, win flow, navigation).
//
// Run with:  npm run smoke:ui

import { JSDOM } from 'jsdom';
import type { Dir } from '../src/engine/types.js';
import { LEVELS } from '../src/engine/levels.js';
import { solve } from '../src/engine/solver.js';

const DIR_KEY: Record<Dir, string> = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
};

const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
  url: 'http://localhost/',
});
const w = dom.window as unknown as typeof globalThis & Window;
// Expose the jsdom globals the UI modules reach for at call time. (navigator is a
// read-only global in Node, and the UI doesn't use it — so we leave it alone.)
const g = globalThis as Record<string, unknown>;
g.window = w;
g.document = w.document;
g.localStorage = w.localStorage;
g.KeyboardEvent = w.KeyboardEvent;

// Unlock every level so we can open each from the menu.
const allDone = Object.fromEntries(LEVELS.map((l) => [l.id, true]));
w.localStorage.setItem('driftbox.progress.v1', JSON.stringify({ completed: allDone, best: {} }));

// Import the UI after globals exist.
const { App } = await import('../src/web/ui.js');

const sleep = (ms: number) => new Promise((r) => w.setTimeout(r, ms));
const root = w.document.getElementById('app')!;
const app = new App(root as unknown as HTMLElement, LEVELS);
app.start();

let failures = 0;
console.log('\nDriftbox UI smoke test (jsdom)');
console.log('─'.repeat(60));

for (let i = 0; i < LEVELS.length; i++) {
  const level = LEVELS[i]!;
  const sol = solve(level);
  if (!sol.solvable) {
    console.log(`✗  ${level.id}  no solution to drive`);
    failures++;
    continue;
  }

  // Back to menu, then open this level's card.
  const cards = root.querySelectorAll('.level-grid .level-card');
  const card = cards[i] as HTMLElement | undefined;
  if (!card) {
    console.log(`✗  ${level.id}  card not found`);
    failures++;
    continue;
  }
  card.click();

  // Board built?
  const crates = root.querySelectorAll('.board .crate').length;
  // Play the solution.
  for (const dir of sol.solution) {
    w.dispatchEvent(new w.KeyboardEvent('keydown', { key: DIR_KEY[dir], bubbles: true }));
  }
  await sleep(700); // allow the win timeout to fire

  const won = !!root.querySelector('.overlay .card h2');
  const movesShown = root.querySelector('.hud .stat b')?.textContent;
  if (won) {
    console.log(
      `✓  ${level.id} ${level.name}   crates=${crates}  played=${sol.solution.length}  moves=${movesShown}`,
    );
  } else {
    console.log(`✗  ${level.id} ${level.name}   win overlay never appeared`);
    failures++;
  }

  // Return to menu via the overlay's menu button for the next iteration.
  const menuBtn = [...root.querySelectorAll('.overlay .actions button')].find((b) =>
    /关卡列表/.test(b.textContent ?? ''),
  ) as HTMLElement | undefined;
  menuBtn?.click();
  await sleep(20);
}

console.log('─'.repeat(60));
if (failures > 0) {
  console.error(`\n${failures} UI smoke check(s) FAILED.\n`);
  process.exit(1);
} else {
  console.log('\nAll levels playable to a win through the real UI.\n');
  process.exit(0);
}
