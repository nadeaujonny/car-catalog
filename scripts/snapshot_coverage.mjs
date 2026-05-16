#!/usr/bin/env node
// Read-only snapshot of per-brand image coverage. Used to track Session 8
// before/after deltas during the Phase B project-wide re-scrape.
//
// Usage: node scripts/snapshot_coverage.mjs [brand1 brand2 ...]
//        node scripts/snapshot_coverage.mjs --all

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const stripBom = s => s && s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s;

const args = process.argv.slice(2);
let brands;
if (args.includes("--all")) {
  const files = await fs.readdir(path.join(PROJECT_ROOT, "catalog/data"));
  brands = files.filter(f => f.endsWith(".json") && !f.endsWith(".bak")).map(f => f.replace(/\.json$/, ""));
} else if (args.length > 0) {
  brands = args.filter(a => !a.startsWith("--"));
} else {
  console.error("Usage: node scripts/snapshot_coverage.mjs <brand1> [brand2 ...] | --all");
  process.exit(2);
}

let pTotal = 0, pDl = 0;
const rows = [];
for (const b of brands.sort()) {
  try {
    const j = JSON.parse(stripBom(await fs.readFile(path.join(PROJECT_ROOT, `catalog/data/${b}.json`), "utf-8")));
    let total = 0, dl = 0;
    for (const m of j.models) for (const t of m.trims || []) for (const i of t.images || []) {
      total++; if (i.downloaded === true) dl++;
    }
    pTotal += total; pDl += dl;
    rows.push({ brand: b, dl, total, pct: total > 0 ? (dl / total * 100) : 0 });
  } catch (e) {
    console.error(`skip ${b}: ${e.message}`);
  }
}

rows.sort((a, b) => b.pct - a.pct);
for (const r of rows) {
  console.log(`${r.brand.padEnd(20)} ${String(r.dl).padStart(4)}/${String(r.total).padStart(4)}  ${r.pct.toFixed(2).padStart(6)}%`);
}
console.log(`${'TOTAL'.padEnd(20)} ${String(pDl).padStart(4)}/${String(pTotal).padStart(4)}  ${(pTotal > 0 ? pDl / pTotal * 100 : 0).toFixed(2).padStart(6)}%`);
