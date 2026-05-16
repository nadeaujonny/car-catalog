#!/usr/bin/env node
// One-shot script (session 6, Phase 6) to add a model.notes addendum to every
// model of the 5 brands documented in reports/persistent_low_coverage_brands.md.
// Per spec convention the notes field is a free-text string; we append the
// addendum if and only if it isn't already present.
//
// Backs up data/<brand>.json -> data/<brand>.json.session6p6.bak and the
// catalog mirror -> catalog/data/<brand>.json.session6p6.bak before writing.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const TAG = "Phase 4 image scrape:";

const BRAND_REASONS = {
  tesla:   "persistent low coverage (0% as of 2026-05-14) — tesla.com hard 403s both static fetch and headless Chromium. Site renders gracefully with placeholders. See reports/persistent_low_coverage_brands.md.",
  ferrari: "persistent low coverage (2.1% as of 2026-05-14) — ferrari.com is JS-rendered and the rendered DOM has no usable <img> candidates (likely shadow-DOM / CSS-background imagery). Site renders gracefully with placeholders. See reports/persistent_low_coverage_brands.md.",
  lotus:   "persistent low coverage (0% as of 2026-05-14) — lotuscars.com is JS-rendered and the rendered DOM has no usable <img> candidates. Site renders gracefully with placeholders. See reports/persistent_low_coverage_brands.md.",
  hyundai: "persistent low coverage (0% as of 2026-05-14) — slug-matching works but Hyundai's CDN uses internal filename codes (vlp-hero, chassis codes) that the scraper's ANGLE_PATTERNS table doesn't recognize. A future brand-aware angle-pattern extension could lift this; for now the site renders gracefully with placeholders. See reports/persistent_low_coverage_brands.md.",
  subaru:  "persistent low coverage (6.9% as of 2026-05-14) — Playwright surfaces 500+ candidates per page but Subaru's CDN naming uses feature labels not English angle words, so the angle-pattern matcher rarely fires. Same future fix as Hyundai. See reports/persistent_low_coverage_brands.md.",
};

async function readJSON(p) {
  const raw = await fs.readFile(p, "utf-8");
  return JSON.parse(raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw);
}

async function backup(p) {
  try { await fs.copyFile(p, p + ".session6p6.bak"); }
  catch (e) { console.warn(`  (warn) backup failed for ${p}: ${e.message}`); }
}

async function processBrand(brand) {
  const reason = BRAND_REASONS[brand];
  if (!reason) { console.warn(`(skip) no reason configured for ${brand}`); return; }
  const note = `${TAG} ${reason}`;
  const paths = [
    path.join(PROJECT_ROOT, "data", `${brand}.json`),
    path.join(PROJECT_ROOT, "catalog", "data", `${brand}.json`),
  ];
  for (const p of paths) {
    const doc = await readJSON(p);
    let touched = 0;
    let skipped = 0;
    for (const model of (doc.models || [])) {
      const existing = (model.notes || "").trim();
      if (existing.includes(TAG)) { skipped++; continue; }
      model.notes = existing
        ? `${existing} ${note}`
        : note;
      touched++;
    }
    await backup(p);
    await fs.writeFile(p, JSON.stringify(doc, null, 2));
    console.log(`  ${brand}  ${path.relative(PROJECT_ROOT, p)}  +${touched} (skipped ${skipped} already-tagged)`);
  }
}

async function main() {
  for (const brand of Object.keys(BRAND_REASONS)) {
    await processBrand(brand);
  }
  console.log("Done.");
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
