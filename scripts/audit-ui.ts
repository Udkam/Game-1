import { JSDOM } from 'jsdom';
import { LEVELS } from '../src/engine/levels.js';
import { App } from '../src/web/ui.js';

let failures = 0;
function check(condition: boolean, label: string): void {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${label}`);
  if (!condition) failures++;
}

const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});
const w = dom.window as unknown as typeof globalThis & Window;
const g = globalThis as Record<string, unknown>;
g.window = w;
g.document = w.document;
g.localStorage = w.localStorage;
g.KeyboardEvent = w.KeyboardEvent;
g.requestAnimationFrame = w.requestAnimationFrame.bind(w);

const root = w.document.getElementById('app')!;
const allDone = Object.fromEntries(LEVELS.map((level) => [level.id, true]));
w.localStorage.setItem('driftbox.progress.v7', JSON.stringify({ completed: allDone, best: {}, bestPush: {}, parHit: {}, clean: {} }));

const app = new App(root as unknown as HTMLElement, LEVELS);
app.start();

const text = () => root.textContent ?? '';
const buttonByText = (needle: string): HTMLElement | undefined =>
  [...root.querySelectorAll('button')].find((b) => (b.textContent ?? '').includes(needle)) as HTMLElement | undefined;

console.log('\nDriftbox UI audit');
console.log('-'.repeat(72));

check(!!root.querySelector('.home-deck'), 'home command deck exists');
check(!!root.querySelector('#chapter-map'), 'chapter star map exists');
check(!!buttonByText('继续实验'), 'primary continue action exists');
check(!!buttonByText('章节星图'), 'chapter map action exists');
check(!!buttonByText('机制档案'), 'mechanism archive action exists');
check(!!buttonByText('挑战记录'), 'challenge records action exists');
check(!!buttonByText('设置'), 'settings action exists');
check(!!root.querySelector('.screen-view.enter'), 'page transition enter class exists');
check(!text().includes('立体演示') && !text().includes('2.5D'), 'no visible 2.5D/3D entry text on home');

buttonByText('机制档案')?.click();
check(!!root.querySelector('.codex'), 'mechanism archive overlay opens');
check(
  ['时间残影', '量子门', '空间置换', '递归舱', '连锁实验', '误导协议'].every((label) => text().includes(label)),
  'mechanism archive contains core and advanced v7 mechanisms',
);
root.querySelector('.overlay button')?.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
root.querySelector('.overlay')?.remove();

buttonByText('设置')?.click();
check(text().includes('高对比') && text().includes('减少动态'), 'settings overlay opens');
root.querySelector('.overlay button')?.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
root.querySelector('.overlay')?.remove();

buttonByText('挑战记录')?.click();
check(text().includes('挑战记录'), 'challenge records overlay opens');
root.querySelector('.overlay button')?.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
root.querySelector('.overlay')?.remove();

const firstCard = root.querySelector('.level-grid .level-card') as HTMLElement | null;
firstCard?.click();
check(!!root.querySelector('.game'), 'level screen opens');
check(!!root.querySelector('.hud'), 'level HUD exists');
check(!!root.querySelector('.mechanic-bar .mechanic-chip'), 'level mechanic chips exist');
check(!!root.querySelector('.board-wrap'), '2D board wrapper exists');
check(!!buttonByText('撤销') && !!buttonByText('重开'), 'undo and restart controls exist');
check(!!buttonByText('?'), 'help control exists');
check(!root.querySelector('.cam-bar'), 'legacy 3D camera bar absent');

w.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
check((root.querySelector('.blocked-feedback')?.textContent ?? '').length > 0, 'blocked movement feedback appears');

for (const token of LEVELS[0]!.solution ?? []) {
  const key = token === 'right' ? 'ArrowRight' : token === 'left' ? 'ArrowLeft' : token === 'up' ? 'ArrowUp' : 'ArrowDown';
  w.dispatchEvent(new w.KeyboardEvent('keydown', { key, bubbles: true }));
}
await new Promise((resolve) => w.setTimeout(resolve, 750));
check(!!root.querySelector('.overlay'), 'win overlay appears');
check(!!buttonByText('下一关'), 'next level button exists on win overlay');

const css = await import('node:fs').then((fs) => fs.readFileSync('src/web/styles.css', 'utf8'));
check(/@media\s*\(max-width:\s*(900|720|620)px\)/.test(css), 'mobile media query exists');
check(css.includes('overflow-x: hidden'), 'mobile horizontal overflow guard exists');

console.log('-'.repeat(72));
if (failures) {
  console.error(`${failures} UI audit check(s) failed.`);
  process.exit(1);
}
console.log('All UI audit checks passed.');
