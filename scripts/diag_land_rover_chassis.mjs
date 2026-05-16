#!/usr/bin/env node
// Diag: dump raw candidates from each Land Rover page and look for L-chassis-code
// patterns. Read-only, no JSON mutation.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function fetchHTML(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml" },
      redirect: "follow",
    });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, html: await res.text(), finalUrl: res.url };
  } catch (e) { return { ok: false, error: e.message }; }
}

async function fetchWithPlaywright(url) {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1280, height: 900 }, locale: "en-US" });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await Promise.race([
      page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {}),
      new Promise(r => setTimeout(r, 5000)),
    ]);
    await page.evaluate(async () => {
      const start = Date.now();
      for (let y = 0; y < document.body.scrollHeight && Date.now() - start < 2500; y += 1000) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 100));
      }
    }).catch(() => {});
    const html = await page.content();
    return { ok: true, html, finalUrl: page.url() };
  } catch (e) { return { ok: false, error: e.message }; }
  finally { await browser.close(); }
}

const CHASSIS_CODES = ["l460", "l461", "l462", "l550", "l551", "l560", "l663"];

const cfg = JSON.parse(await fs.readFile(path.join(PROJECT_ROOT, "scripts/brand-configs/land-rover.json"), "utf-8"));
const pages = cfg.model_pages;

const results = {};
for (const [slug, url] of Object.entries(pages)) {
  process.stdout.write(`${slug.padEnd(25)}: `);
  let r = await fetchHTML(url);
  let source = "static";
  if (!r.ok) {
    process.stdout.write(`static failed (${r.status || r.error}); trying playwright... `);
    r = await fetchWithPlaywright(url);
    source = "playwright";
  }
  if (!r.ok) {
    console.log(`FAILED: ${r.error || r.status}`);
    continue;
  }
  // Extract all URLs containing L<NNN> patterns
  const html = r.html;
  const found = new Map(); // chassis -> sample url
  for (const code of CHASSIS_CODES) {
    const re = new RegExp(`https?://[^"'<>\\s]*?${code}[^"'<>\\s]*?\\.(?:jpe?g|png|webp|avif)`, "gi");
    let m;
    let count = 0;
    let firstUrl = null;
    while ((m = re.exec(html))) {
      count++;
      if (!firstUrl) firstUrl = m[0];
    }
    if (count > 0) found.set(code, { count, sample: firstUrl });
  }
  // Also try without playwright but matching just the URL portion (no extension)
  if (found.size === 0) {
    for (const code of CHASSIS_CODES) {
      const re = new RegExp(`/${code}/[^"'<>\\s]+`, "gi");
      let m;
      let count = 0;
      let firstUrl = null;
      while ((m = re.exec(html))) {
        count++;
        if (!firstUrl) firstUrl = m[0];
      }
      if (count > 0) found.set(code, { count, sample: firstUrl });
    }
  }
  const codeStr = [...found.entries()].map(([c, v]) => `${c}(${v.count})`).join(", ");
  console.log(`${source} ok. Chassis matches: ${codeStr || "NONE"}`);
  for (const [c, v] of found.entries()) {
    console.log(`    ${c}: ${v.sample.slice(0, 150)}${v.sample.length > 150 ? "..." : ""}`);
  }
  results[slug] = { source, chassis: [...found.entries()].map(([c, v]) => c) };
}

console.log("\n--- Summary ---");
for (const [slug, r] of Object.entries(results)) {
  console.log(`${slug.padEnd(25)} → ${r.chassis.join(", ") || "(no chassis code found)"}`);
}
