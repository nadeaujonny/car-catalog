#!/usr/bin/env node
// Phase C coverage analysis (session 5) — READ-ONLY. Reads every
// catalog/data/<brand>.json and computes per-brand + project-wide image
// coverage and per-trim angle completeness. Writes nothing.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "catalog", "data");

const REQUIRED = ["front_three_quarter", "rear_three_quarter", "side_profile", "interior_dashboard"];

function stripBOM(s) { return (s && s.charCodeAt(0) === 0xFEFF) ? s.slice(1) : s; }

const FLAGGED = new Set([
  "jeep/wrangler-4xe", "jeep/grand-cherokee-4xe",
  "porsche/911-gt3-rs", "porsche/718-cayman-gt4-rs", "porsche/718-spyder-rs",
  "volvo/es90",
]);

async function main() {
  const files = (await fs.readdir(DATA)).filter(f => f.endsWith(".json") && !f.endsWith(".bak"));
  files.sort();

  let P = { entries: 0, downloaded: 0, trims: 0, trims4: 0, trimsPartial: 0, trims0: 0,
            models: 0, models0: 0, brands: 0 };
  const rows = [];
  const flaggedStatus = [];

  for (const f of files) {
    const brand = f.replace(/\.json$/, "");
    const c = JSON.parse(stripBOM(await fs.readFile(path.join(DATA, f), "utf-8")));
    let entries = 0, downloaded = 0, trims = 0, trims4 = 0, trimsPartial = 0, trims0 = 0;
    let models0 = 0;
    const zeroModels = [];
    for (const m of (c.models || [])) {
      let modelDl = 0, modelEntries = 0;
      for (const t of (m.trims || [])) {
        trims++;
        const dlAngles = new Set();
        let tEntries = 0, tDl = 0;
        for (const i of (t.images || [])) {
          entries++; modelEntries++; tEntries++;
          if (i.downloaded === true) { downloaded++; modelDl++; tDl++; dlAngles.add(i.angle); }
        }
        const hasAll4 = REQUIRED.every(a => dlAngles.has(a));
        if (tDl === 0) trims0++;
        else if (hasAll4) trims4++;
        else trimsPartial++;
      }
      if (modelEntries > 0 && modelDl === 0) { models0++; zeroModels.push(m.model_slug); }
      // flagged-entry check
      for (const t of (m.trims || [])) {
        const key = `${brand}/${m.model_slug}`;
        if (FLAGGED.has(key)) {
          const anyDl = (t.images || []).some(i => i.downloaded === true);
          flaggedStatus.push({ key, trim: t.trim_slug, anyDownloaded: anyDl });
        }
      }
    }
    const pct = entries ? (downloaded / entries * 100) : 0;
    rows.push({ brand, entries, downloaded, pct, trims, trims4, trimsPartial, trims0,
                models: (c.models || []).length, models0, zeroModels });
    P.entries += entries; P.downloaded += downloaded; P.trims += trims;
    P.trims4 += trims4; P.trimsPartial += trimsPartial; P.trims0 += trims0;
    P.models += (c.models || []).length; P.models0 += models0; P.brands++;
  }

  // Tiered output
  const tier = (p) => p >= 80 ? "A>=80" : p >= 50 ? "B50-80" : "C<50";
  rows.sort((a, b) => b.pct - a.pct);

  console.log("=== PER-BRAND COVERAGE (sorted desc) ===");
  console.log("brand            entries  dl   cov%   tier    trims(4/partial/0)  models0");
  for (const r of rows) {
    console.log(
      r.brand.padEnd(16) +
      String(r.entries).padStart(7) +
      String(r.downloaded).padStart(5) +
      (r.pct.toFixed(1) + "%").padStart(8) +
      "  " + tier(r.pct).padEnd(7) +
      ` ${r.trims4}/${r.trimsPartial}/${r.trims0}`.padEnd(20) +
      `${r.models0}/${r.models}`
    );
  }

  console.log("\n=== TIER COUNTS ===");
  const tA = rows.filter(r => r.pct >= 80), tB = rows.filter(r => r.pct >= 50 && r.pct < 80), tC = rows.filter(r => r.pct < 50);
  console.log(`A (>=80%): ${tA.length} brands — ${tA.map(r=>r.brand).join(", ")}`);
  console.log(`B (50-80%): ${tB.length} brands — ${tB.map(r=>r.brand).join(", ")}`);
  console.log(`C (<50%): ${tC.length} brands — ${tC.map(r=>r.brand).join(", ")}`);

  console.log("\n=== PROJECT-WIDE TOTALS ===");
  console.log(`Brands:               ${P.brands}`);
  console.log(`Models:               ${P.models}  (zero-image models: ${P.models0})`);
  console.log(`Trims:                ${P.trims}`);
  console.log(`  trims with all 4 required angles downloaded: ${P.trims4}  (${(P.trims4/P.trims*100).toFixed(1)}%)`);
  console.log(`  trims missing 1+ required angle:             ${P.trimsPartial}  (${(P.trimsPartial/P.trims*100).toFixed(1)}%)`);
  console.log(`  trims with 0 images downloaded:              ${P.trims0}  (${(P.trims0/P.trims*100).toFixed(1)}%)`);
  console.log(`Image entries:        ${P.entries}`);
  console.log(`  downloaded:         ${P.downloaded}  (${(P.downloaded/P.entries*100).toFixed(1)}%)`);
  console.log(`  not downloaded:     ${P.entries - P.downloaded}`);

  console.log("\n=== FLAGGED-ENTRY CHECK (expect anyDownloaded=false for all) ===");
  for (const fs2 of flaggedStatus) {
    console.log(`  ${fs2.key}/${fs2.trim}: anyDownloaded=${fs2.anyDownloaded}`);
  }
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
