// Screenshot the catalog site via Playwright.
// Used in Session 16 (portfolio prep) to populate docs/screenshots/.
// Requires a local HTTP server running on http://127.0.0.1:8765 (catalog/ as root).

import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "docs", "screenshots");
const BASE = "http://127.0.0.1:8765";

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

const SHOTS = [
  // light mode
  { name: "home-light",          url: BASE + "/index.html",                viewport: "desktop", color: "light", waitFor: ".brand-mark", fullPage: true },
  { name: "brand-bmw-light",     url: BASE + "/index.html#brand=bmw",      viewport: "desktop", color: "light", waitFor: "main", fullPage: false, scroll: 500 },
  { name: "compare",             url: BASE + "/index.html#compare=bmw:3-series:330i,bmw:5-series:540i-xdrive,bmw:7-series:740i-xdrive", viewport: "desktop", color: "light", waitFor: "main", fullPage: false, scroll: 0 },
  { name: "body-suv",            url: BASE + "/index.html#body=midsize_suv", viewport: "desktop", color: "light", waitFor: "main", fullPage: false, scroll: 200 },
  // dark mode
  { name: "home-dark",           url: BASE + "/index.html",                viewport: "desktop", color: "dark",  waitFor: ".brand-mark", fullPage: true },
  { name: "brand-bmw-dark",      url: BASE + "/index.html#brand=bmw",      viewport: "desktop", color: "dark",  waitFor: "main", fullPage: false, scroll: 500 },
  // mobile
  { name: "mobile-home",         url: BASE + "/index.html",                viewport: "mobile",  color: "light", waitFor: ".brand-mark", fullPage: false, scroll: 0 },
  { name: "mobile-brand",        url: BASE + "/index.html#brand=honda",    viewport: "mobile",  color: "light", waitFor: "main", fullPage: false, scroll: 300 },
];

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function captureOne(browser, shot) {
  const viewport = VIEWPORTS[shot.viewport];
  const context = await browser.newContext({
    viewport,
    colorScheme: shot.color,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  page.on("pageerror", (err) => console.log(`[pageerror ${shot.name}]`, err.message));
  try {
    await page.goto(shot.url, { waitUntil: "networkidle", timeout: 30000 });
    if (shot.waitFor) {
      await page.waitForSelector(shot.waitFor, { timeout: 15000 });
    }
    await page.waitForTimeout(1500);
    if (shot.scroll) {
      await page.evaluate((y) => window.scrollTo(0, y), shot.scroll);
      await page.waitForTimeout(800);
    }
    const out = path.join(OUT, `${shot.name}.png`);
    await page.screenshot({ path: out, fullPage: !!shot.fullPage, type: "png" });
    const stat = await fs.stat(out);
    console.log(`✓ ${shot.name}.png (${(stat.size / 1024).toFixed(0)} KB)`);
  } catch (e) {
    console.log(`✗ ${shot.name}: ${e.message}`);
  } finally {
    await context.close();
  }
}

async function main() {
  await ensureDir(OUT);
  const browser = await chromium.launch({ headless: true });
  for (const shot of SHOTS) {
    await captureOne(browser, shot);
  }
  await browser.close();
  console.log("Done. Saved to:", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
