import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const port = Number(process.env.STAGE6_SCREENSHOT_PORT ?? 5173);
const baseUrl = `http://127.0.0.1:${port}/`;
const outputDir = resolve("docs/screenshots");
const viteCli = resolve("node_modules/vite/bin/vite.js");

function startServer() {
  return spawn(process.execPath, [viteCli, "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
    cwd: process.cwd(),
    stdio: "pipe",
    env: { ...process.env, BROWSER: "none" },
  });
}

async function stopServer(server) {
  if (server.exitCode !== null || server.killed) {
    return;
  }
  server.kill();
  await Promise.race([
    new Promise((resolveClose) => server.once("close", resolveClose)),
    new Promise((resolveTimeout) => setTimeout(resolveTimeout, 2000)),
  ]);
}

async function waitForServer(server) {
  let lastError;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Vite server exited early with code ${server.exitCode}`);
    }
    try {
      const response = await fetch(baseUrl, { cache: "no-store" });
      if (response.ok) {
        return;
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolveTimeout) => setTimeout(resolveTimeout, 250));
  }
  throw lastError ?? new Error("Timed out waiting for Vite server");
}

async function capture(page, name) {
  await page.screenshot({
    path: resolve(outputDir, name),
    fullPage: false,
  });
}

async function assertNoOverflow(page, width, height) {
  await page.setViewportSize({ width, height });
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    minButtonSize: Math.min(
      ...Array.from(document.querySelectorAll("button"))
        .map((button) => {
          const rect = button.getBoundingClientRect();
          const style = window.getComputedStyle(button);
          if (rect.width === 0 || rect.height === 0 || style.display === "none" || style.visibility === "hidden") {
            return Number.POSITIVE_INFINITY;
          }
          return Math.min(rect.width, rect.height);
        })
        .filter((size) => Number.isFinite(size)),
    ),
  }));
  if (metrics.scrollWidth > metrics.viewportWidth) {
    throw new Error(`Horizontal overflow at ${width}px: ${metrics.scrollWidth} > ${metrics.viewportWidth}`);
  }
  if (metrics.minButtonSize < 44) {
    throw new Error(`Touch target below 44px at ${width}px: ${metrics.minButtonSize}`);
  }
}

await mkdir(outputDir, { recursive: true });
const server = startServer();
let browser;

try {
  await waitForServer(server);
  browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await capture(page, "stage6-home.png");

  await page.getByRole("button", { name: "Level Map" }).click();
  await capture(page, "stage6-level-select.png");

  await page.getByRole("button", { name: /First Push/ }).click();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(220);
  await capture(page, "stage6-level-01.png");

  await page.getByRole("button", { name: "Level Map" }).click();
  await page.getByRole("button", { name: /Glass Hatch/ }).click();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(360);
  await capture(page, "stage6-recursive-entry.png");

  await page.getByRole("button", { name: "Field Notes" }).click();
  await capture(page, "stage6-help.png");

  await assertNoOverflow(page, 800, 900);
  await assertNoOverflow(page, 1440, 900);
  await context.close();
} finally {
  if (browser) {
    await browser.close();
  }
  await stopServer(server);
}
