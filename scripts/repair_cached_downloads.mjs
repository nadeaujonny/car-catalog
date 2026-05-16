#!/usr/bin/env node
// Repair downloaded:false entries whose local file exists on disk.
//
// This addresses a Phase B interaction: scrape_image_urls.mjs's URL-change
// invalidation (which sets downloaded:false when img.url changes) leaves
// previously-successful downloads marked false if the NEW URL fails to
// download (e.g. 403). The on-disk file is still valid; the metadata is just
// out of sync. This script:
//   1. Iterates every catalog/data/<brand>.json
//   2. For each entry where downloaded:false but catalog/<local_path> exists
//      with size > 0, sets downloaded:true
//   3. Mirrors the change to data/<brand>.json
//   4. Reports per-brand repair count
//
// Read-only on the scrape/download scripts; only mutates brand JSONs to bring
// them in sync with on-disk reality.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const CATALOG_DIR = path.join(PROJECT_ROOT, "catalog");
const DATA_DIR = path.join(PROJECT_ROOT, "data");
const CAT_DATA_DIR = path.join(PROJECT_ROOT, "catalog", "data");

function stripBOM(s) { return (s && s.charCodeAt(0) === 0xFEFF) ? s.slice(1) : s; }
async function readJSON(p) { return JSON.parse(stripBOM(await fs.readFile(p, "utf-8"))); }

async function main() {
  const files = (await fs.readdir(CAT_DATA_DIR)).filter(f => f.endsWith(".json"));
  let totalRepaired = 0;
  for (const file of files) {
    const brand = file.replace(/\.json$/, "");
    const catPath = path.join(CAT_DATA_DIR, file);
    const srcPath = path.join(DATA_DIR, file);
    const cat = await readJSON(catPath);
    let repaired = 0;
    for (const m of cat.models || []) {
      for (const t of m.trims || []) {
        for (const i of t.images || []) {
          if (i.downloaded === true) continue;
          if (!i.local_path) continue;
          const filePath = path.join(CATALOG_DIR, i.local_path);
          try {
            const st = await fs.stat(filePath);
            if (st.isFile() && st.size > 0) {
              i.downloaded = true;
              repaired++;
            }
          } catch { /* file missing — leave downloaded:false */ }
        }
      }
    }
    if (repaired > 0) {
      await fs.writeFile(catPath, JSON.stringify(cat, null, 2));
      await fs.writeFile(srcPath, JSON.stringify(cat, null, 2));
      console.log(`${brand.padEnd(20)} repaired ${repaired} entries (file exists on disk)`);
      totalRepaired += repaired;
    }
  }
  console.log(`\nTotal repaired: ${totalRepaired}`);
}

main().catch(e => { console.error("Fatal:", e); process.exitCode = 1; });
