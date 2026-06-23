import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, type Page } from 'playwright';
import { createServer } from 'vite';
import { LEVELS } from '../src/engine/levels.js';
import type { MoveToken } from '../src/engine/types.js';

const RUN_ID = 'v7-loop-20260623-195154-f683';
const OUT_DIR = join('docs', 'v7-loop', RUN_ID, 'screenshots');

const KEY: Record<string, string> = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
};

async function playSolution(page: Page, solution: MoveToken[]): Promise<void> {
  for (const token of solution) {
    const pull = token.startsWith('@');
    const dir = pull ? token.slice(1) : token;
    const key = KEY[dir];
    if (!key) throw new Error(`Unknown solution token ${token}`);
    if (pull) {
      await page.keyboard.down('Shift');
      await page.keyboard.press(key);
      await page.keyboard.up('Shift');
    } else {
      await page.keyboard.press(key);
    }
  }
}

async function openHome(page: Page, baseUrl: string): Promise<void> {
  await page.goto(baseUrl);
  await page.waitForSelector('.home-deck');
}

async function openLevel(page: Page, id: string): Promise<void> {
  const index = LEVELS.findIndex((level) => level.id === id);
  if (index < 0) throw new Error(`Unknown level id ${id}`);
  const cards = page.locator('.level-grid .level-card');
  await cards.nth(index).scrollIntoViewIfNeeded();
  await cards.nth(index).click();
  await page.waitForSelector('.game .board-wrap');
}

async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: join(OUT_DIR, `${name}.png`), fullPage: true });
}

await mkdir(OUT_DIR, { recursive: true });

const vite = await createServer({
  logLevel: 'silent',
  server: { host: '127.0.0.1', port: 0 },
});
await vite.listen();
const baseUrl = vite.resolvedUrls?.local[0];
if (!baseUrl) throw new Error('Vite did not provide a local URL');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });

try {
  await openHome(page, baseUrl);
  await shot(page, '01-home');

  await page.locator('#chapter-map').scrollIntoViewIfNeeded();
  await shot(page, '02-chapter-star-map');

  await page.getByRole('button', { name: '机制档案' }).click();
  await page.waitForSelector('.codex');
  await shot(page, '03-mechanism-archive');
  await page.locator('.overlay').evaluate((el) => el.remove());

  const levelShots: Array<[string, string]> = [
    ['04-level-001', 'v7-001'],
    ['05-portal-009', 'v7-009'],
    ['06-sync-017', 'v7-017'],
    ['07-time-shadow-025', 'v7-025'],
    ['08-spatial-swap-033', 'v7-033'],
    ['09-recursive-041', 'v7-041'],
    ['10-chain-state-049', 'v7-049'],
    ['11-misdirection-057', 'v7-057'],
    ['12-finale-boss-070', 'v7-070'],
  ];
  for (const [name, id] of levelShots) {
    await openHome(page, baseUrl);
    await openLevel(page, id);
    await shot(page, name);
  }

  await openHome(page, baseUrl);
  await openLevel(page, 'v7-001');
  await playSolution(page, LEVELS[0]!.solution ?? []);
  await page.waitForSelector('.overlay .card h2');
  await shot(page, '13-win-overlay');

  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page, baseUrl);
  await shot(page, '14-mobile-home');
  await openLevel(page, 'v7-025');
  await shot(page, '15-mobile-level');
} finally {
  await browser.close();
  await vite.close();
}

console.log(`Visual smoke screenshots written to ${OUT_DIR}`);
