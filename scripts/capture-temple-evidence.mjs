import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5173/';
const root = process.cwd();
const screenshotDir = path.join(root, 'docs', 'screenshots', 'temple', 'final');
const evidencePath = path.join(root, 'docs', 'qa', 'temple-browser-evidence.json');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
await mkdir(screenshotDir, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const records = [];

function assertEvidence(condition, message, failures) {
  if (!condition) failures.push(message);
}

function validateEvidence(entries) {
  const failures = [];
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const captures = entries.filter((entry) => entry.screenshot);
  const expectedStatus = {
    'ready-desktop': 'ready',
    'running-desktop': 'running',
    'lane-mid': 'running',
    'lane-end': 'running',
    'jump-apex': 'running',
    'slide-mid': 'running',
    'turn-mid': 'running',
    'turn-lane-change': 'running',
    collision: 'game-over',
    'pause-high-contrast': 'paused',
    'mobile-portrait': 'running',
    'mobile-landscape': 'running',
    'reduced-motion': 'running',
  };

  for (const entry of captures) {
    assertEvidence(entry.consoleProblems.length === 0, `${entry.id}: console problems`, failures);
    assertEvidence(entry.dom.canvasCount === 1, `${entry.id}: expected one canvas`, failures);
    assertEvidence(entry.dom.gameplayEntityCount === 0, `${entry.id}: gameplay leaked into DOM`, failures);
    assertEvidence(entry.dom.overflowX === 0, `${entry.id}: horizontal overflow ${entry.dom.overflowX}`, failures);
    assertEvidence(entry.render.contextLossCount === 0, `${entry.id}: WebGL context loss`, failures);
    assertEvidence(entry.render.drawCalls <= 60, `${entry.id}: ${entry.render.drawCalls} draw calls`, failures);
    assertEvidence(entry.render.triangles <= 150_000, `${entry.id}: ${entry.render.triangles} triangles`, failures);
    assertEvidence(entry.simulation.status === expectedStatus[entry.id], `${entry.id}: unexpected status`, failures);
    assertEvidence(Number.isInteger(entry.simulation.seed), `${entry.id}: seed missing`, failures);
    assertEvidence(Math.abs(entry.render.presentationAlpha - 1) < 1e-9, `${entry.id}: non-canonical presentation alpha`, failures);
    assertEvidence(
      Math.abs(entry.render.presentedDistance - entry.simulation.distance) < 1e-9,
      `${entry.id}: presented distance differs from canonical state`,
      failures,
    );
    assertEvidence(
      Math.abs(entry.render.presentedLanePosition - entry.simulation.lanePosition) < 1e-9,
      `${entry.id}: presented lane differs from canonical state`,
      failures,
    );
    for (const area of entry.safeAreas) {
      assertEvidence(area.insideViewport, `${entry.id}: ${area.selector} leaves the safe viewport`, failures);
    }
    if (entry.id !== 'ready-desktop') {
      assertEvidence(entry.render.runnerScreen.visible, `${entry.id}: runner not visible`, failures);
      assertEvidence(
        entry.render.runnerScreen.x >= 0 && entry.render.runnerScreen.x <= entry.viewport.width,
        `${entry.id}: runner outside viewport horizontally`,
        failures,
      );
      assertEvidence(
        entry.render.runnerScreen.y >= 0 && entry.render.runnerScreen.y <= entry.viewport.height,
        `${entry.id}: runner outside viewport vertically`,
        failures,
      );
    }
    if (entry.id.startsWith('mobile-')) {
      assertEvidence(entry.render.canvas.resolution <= 1.750_001, `${entry.id}: DPR cap exceeded`, failures);
    }
  }

  const turn = byId.get('turn-mid');
  assertEvidence(Math.abs((turn?.render.turnProgress ?? -1) - 0.5) < 0.001, 'turn-mid: not at 50%', failures);
  assertEvidence((turn?.render.visibleSectionIds.length ?? 0) >= 2, 'turn-mid: route continuity not visible', failures);

  const laneEnd = byId.get('lane-end');
  assertEvidence(
    Math.abs((laneEnd?.render.presentedLanePosition ?? 99) - (laneEnd?.simulation.targetLane ?? 0)) <= 0.01,
    'lane-end: endpoint error exceeds 0.01 world lane unit',
    failures,
  );

  const turnLane = byId.get('turn-lane-change');
  assertEvidence(
    (turnLane?.render.turnProgress ?? 0) > 0.5 && (turnLane?.render.turnProgress ?? 1) < 1,
    'turn-lane-change: not captured during the outgoing turn half',
    failures,
  );
  assertEvidence(
    (turnLane?.simulation.lanePosition ?? 0) > 0,
    'turn-lane-change: lane transition did not advance',
    failures,
  );

  const highContrast = byId.get('pause-high-contrast');
  assertEvidence(highContrast?.appearance.highContrast === true, 'high contrast class not active', failures);
  assertEvidence(highContrast?.render.options.highContrast === true, 'renderer high contrast not active', failures);

  const reduced = byId.get('reduced-motion');
  assertEvidence(reduced?.appearance.reducedMotion === true, 'reduced-motion media query not active', failures);
  assertEvidence(reduced?.render.options.reducedMotion === true, 'renderer reduced motion not active', failures);

  const desktop = byId.get('real-desktop-input');
  assertEvidence(desktop?.state.status === 'paused', 'desktop input: Escape did not pause', failures);
  assertEvidence(desktop?.state.targetLane === -1, 'desktop input: left command missing', failures);
  assertEvidence(desktop?.state.grounded === false, 'desktop input: jump command missing', failures);
  assertEvidence(desktop?.activeElement === 'CANVAS', 'desktop input: canvas focus missing', failures);
  assertEvidence(desktop?.consoleProblems.length === 0, 'desktop input: console problems', failures);
  const desktopEventTypes = desktop?.actions.map((action) => action.events.map((event) => event.type)) ?? [];
  assertEvidence(
    JSON.stringify(desktopEventTypes) === JSON.stringify([[], ['lane-shifted'], ['jump-started'], ['paused']]),
    'desktop input: one-input/one-event trace mismatch',
    failures,
  );

  const touch = byId.get('real-touch-input');
  assertEvidence(touch?.state.status === 'running', 'touch input: run not active', failures);
  assertEvidence(touch?.state.targetLane === -1, 'touch input: left swipe missing', failures);
  assertEvidence(touch?.consoleProblems.length === 0, 'touch input: console problems', failures);
  assertEvidence(
    JSON.stringify(touch?.swipe.events.map((event) => event.type)) === JSON.stringify(['lane-shifted']),
    'touch input: one-swipe/one-event trace mismatch',
    failures,
  );

  const benchmark = byId.get('desktop-scene-benchmark');
  assertEvidence(benchmark?.benchmark.p95Ms < 8, `benchmark: p95 ${benchmark?.benchmark.p95Ms}ms`, failures);
  assertEvidence(benchmark?.consoleProblems.length === 0, 'desktop benchmark: console problems', failures);
  const mobileBenchmark = byId.get('mobile-scene-benchmark');
  assertEvidence(mobileBenchmark?.benchmark.p95Ms < 12, `mobile benchmark: p95 ${mobileBenchmark?.benchmark.p95Ms}ms`, failures);
  assertEvidence(mobileBenchmark?.consoleProblems.length === 0, 'mobile benchmark: console problems', failures);

  const deterministicIds = ['running-desktop', 'mobile-portrait', 'mobile-landscape', 'reduced-motion'];
  const deterministicHashes = new Set(deterministicIds.map((id) => byId.get(id)?.simulation.hash));
  assertEvidence(deterministicHashes.size === 1 && !deterministicHashes.has(undefined), 'viewport changed simulation hash', failures);

  if (failures.length > 0) {
    throw new Error(`Temple evidence gate failed:\n- ${failures.join('\n- ')}`);
  }
}

function digest(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function compactSimulation(snapshot) {
  const state = snapshot.state;
  return {
    seed: state.seed,
    hash: snapshot.hash,
    frozen: snapshot.frozen,
    previousDistance: snapshot.previousState.distance,
    previousLanePosition: snapshot.previousState.runner.lanePosition,
    status: state.status,
    tick: state.tick,
    distance: state.distance,
    sectionIndex: state.sectionIndex,
    sectionDistance: state.sectionDistance,
    lanePosition: state.runner.lanePosition,
    targetLane: state.runner.targetLane,
    height: state.runner.height,
    grounded: state.runner.grounded,
    slideTicksRemaining: state.runner.slideTicksRemaining,
    shieldCharges: state.runner.shieldCharges,
    score: state.score,
    shards: state.shards,
    failureReason: state.failureReason,
    events: snapshot.events,
  };
}

async function capture({
  id,
  scenario,
  viewport = { width: 1440, height: 900 },
  deviceScaleFactor = 1,
  isMobile = false,
  hasTouch = false,
  reducedMotion = 'no-preference',
  highContrastPause = false,
  turnProgress = null,
  advanceTicks = 0,
  keys = [],
}) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor,
    isMobile,
    hasTouch,
    reducedMotion,
    colorScheme: 'dark',
  });
  const page = await context.newPage();
  const problems = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      problems.push({ type: message.type(), text: message.text() });
    }
  });
  page.on('pageerror', (error) => problems.push({ type: 'pageerror', text: error.message }));
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.__TIDE_RELAY_QA__));
  if (highContrastPause) {
    await page.getByRole('button', { name: 'CONTRAST' }).click();
    await page.waitForFunction(() => document.querySelector('main')?.classList.contains('is-high-contrast'));
  }
  if (scenario) {
    await page.evaluate((name) => window.__TIDE_RELAY_QA__.loadScenario(name), scenario);
  }
  for (const key of keys) {
    await page.keyboard.press(key);
  }
  if (advanceTicks > 0) {
    await page.evaluate((count) => window.__TIDE_RELAY_QA__.advanceTicks(count), advanceTicks);
  }
  if (turnProgress !== null) {
    await page.evaluate((progress) => window.__TIDE_RELAY_QA__.setTurnProgress(progress), turnProgress);
  }
  if (highContrastPause) {
    await page.locator('canvas').focus();
    await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(90);
  const structured = await page.evaluate(() => {
    const qa = window.__TIDE_RELAY_QA__;
    const visibleSafeArea = (selector) => {
      const element = document.querySelector(selector);
      if (!(element instanceof HTMLElement)) return null;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        Number(style.opacity) <= 0.01 ||
        rect.width <= 0 ||
        rect.height <= 0
      ) return null;
      return {
        selector,
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        insideViewport:
          rect.left >= -0.5 &&
          rect.top >= -0.5 &&
          rect.right <= innerWidth + 0.5 &&
          rect.bottom <= innerHeight + 0.5,
      };
    };
    return {
      simulation: qa.getSimulationSnapshot(),
      render: qa.getRenderSnapshot(),
      dom: {
        canvasCount: document.querySelectorAll('canvas').length,
        gameplayEntityCount: document.querySelectorAll('[data-game-entity],[data-cell]').length,
        overflowX: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
      appearance: {
        highContrast: document.querySelector('main')?.classList.contains('is-high-contrast') ?? false,
        reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      },
      safeAreas: ['.brandbar', '.hud', '.pause-control', '.turn-cue', '.gesture-hint', '.touch-controls', '.settings']
        .map(visibleSafeArea)
        .filter(Boolean),
    };
  });
  const png = await page.screenshot({ type: 'png' });
  const screenshotPath = path.join(screenshotDir, `${id}.png`);
  await writeFile(screenshotPath, png);
  records.push({
    id,
    scenario,
    screenshot: path.relative(root, screenshotPath).replaceAll('\\', '/'),
    screenshotSha256: digest(png),
    viewport: structured.viewport,
    dom: structured.dom,
    appearance: structured.appearance,
    safeAreas: structured.safeAreas,
    simulation: compactSimulation(structured.simulation),
    render: structured.render,
    consoleProblems: problems,
  });
  await context.close();
}

async function realDesktopInput() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const problems = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') problems.push(message.text());
  });
  page.on('pageerror', (error) => problems.push(error.message));
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  const actions = [];
  const recordAction = async (input) => {
    const snapshot = await page.evaluate(() => window.__TIDE_RELAY_QA__.getSimulationSnapshot());
    actions.push({
      input,
      hash: snapshot.hash,
      status: snapshot.state.status,
      events: snapshot.events,
    });
  };
  await page.getByRole('button', { name: /begin relay/i }).click();
  await recordAction('Begin relay');
  await page.keyboard.press('ArrowLeft');
  await recordAction('ArrowLeft');
  await page.keyboard.press('Space');
  await recordAction('Space');
  await page.keyboard.press('Escape');
  await recordAction('Escape');
  const state = await page.evaluate(() => window.__TIDE_RELAY_QA__.getSimulationSnapshot().state);
  records.push({
    id: 'real-desktop-input',
    state: {
      status: state.status,
      targetLane: state.runner.targetLane,
      grounded: state.runner.grounded,
      verticalVelocity: state.runner.verticalVelocity,
    },
    actions,
    activeElement: await page.evaluate(() => document.activeElement?.tagName ?? null),
    consoleProblems: problems,
  });
  await context.close();
}

async function realTouchInput() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  const problems = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') problems.push(message.text());
  });
  page.on('pageerror', (error) => problems.push(error.message));
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /begin relay/i }).click();
  const beforeSwipe = await page.evaluate(() => window.__TIDE_RELAY_QA__.getSimulationSnapshot());
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Touch evidence canvas has no bounding box');
  const client = await context.newCDPSession(page);
  const x = box.x + box.width * 0.58;
  const y = box.y + box.height * 0.62;
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }],
  });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: x - 110, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }],
  });
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const afterSwipe = await page.evaluate(() => window.__TIDE_RELAY_QA__.getSimulationSnapshot());
  await page.waitForTimeout(50);
  const state = await page.evaluate(() => window.__TIDE_RELAY_QA__.getSimulationSnapshot().state);
  records.push({
    id: 'real-touch-input',
    state: { status: state.status, targetLane: state.runner.targetLane, lanePosition: state.runner.lanePosition },
    swipe: {
      beforeHash: beforeSwipe.hash,
      afterHash: afterSwipe.hash,
      events: afterSwipe.events,
    },
    viewport: await page.evaluate(() => ({ width: innerWidth, height: innerHeight, dpr: devicePixelRatio })),
    consoleProblems: problems,
  });
  await context.close();
}

async function benchmarkScene(id, contextOptions, iterations, limitMs) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const problems = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') problems.push(message.text());
  });
  page.on('pageerror', (error) => problems.push(error.message));
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.__TIDE_RELAY_QA__));
  await page.evaluate(() => window.__TIDE_RELAY_QA__.loadScenario('running'));
  const benchmark = await page.evaluate((count) => window.__TIDE_RELAY_QA__.benchmarkFrames(count), iterations);
  records.push({ id, iterations, limitMs, benchmark, consoleProblems: problems });
  await context.close();
}

try {
  await capture({ id: 'ready-desktop', scenario: 'ready' });
  await capture({ id: 'running-desktop', scenario: 'running' });
  await capture({ id: 'lane-mid', scenario: 'lane-mid' });
  await capture({ id: 'lane-end', scenario: 'lane-mid', advanceTicks: 5 });
  await capture({ id: 'jump-apex', scenario: 'jump-apex' });
  await capture({ id: 'slide-mid', scenario: 'slide-mid' });
  await capture({ id: 'turn-mid', scenario: 'turn-mid', turnProgress: 0.5 });
  await capture({
    id: 'turn-lane-change',
    scenario: 'turn-mid',
    keys: ['ArrowRight'],
    advanceTicks: 5,
  });
  await capture({ id: 'collision', scenario: 'collision' });
  await capture({ id: 'pause-high-contrast', scenario: 'running', highContrastPause: true });
  await capture({
    id: 'mobile-portrait',
    scenario: 'running',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  await capture({
    id: 'mobile-landscape',
    scenario: 'running',
    viewport: { width: 844, height: 390 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  await capture({ id: 'reduced-motion', scenario: 'running', reducedMotion: 'reduce' });
  await realDesktopInput();
  await realTouchInput();
  await benchmarkScene(
    'desktop-scene-benchmark',
    { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    180,
    8,
  );
  await benchmarkScene(
    'mobile-scene-benchmark',
    {
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      hasTouch: true,
      isMobile: true,
    },
    180,
    12,
  );

  validateEvidence(records);
  await writeFile(evidencePath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    baseUrl,
    browser: await browser.version(),
    records,
  }, null, 2)}\n`, 'utf8');
  console.log(`Captured ${records.length} evidence records to ${evidencePath}`);
} finally {
  await browser.close();
}
