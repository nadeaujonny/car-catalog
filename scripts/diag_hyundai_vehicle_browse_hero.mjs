#!/usr/bin/env node
// Download highest-res samples of "vehicle-browse-hero" assets to visually
// classify their angle. These tokens appeared on sonata, santa-cruz, palisade,
// ioniq-9 in diag_hyundai_hero_search.mjs.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(PROJECT_ROOT, "reports", "hyundai_samples");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
           "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Highest-resolution variant URLs (?wid=2560 should be supported on scene7)
const SAMPLES = [
  { page: "sonata",     token: "vehicle-browse-hero", url: "https://s7d1.scene7.com/is/image/hyundai/2026-sonata-ice-se-fwd-abyss-black-pearl-vehicle-browse-hero?wid=2560&qlt=85" },
  { page: "santa-cruz", token: "vehicle-browse-hero", url: "https://s7d1.scene7.com/is/image/hyundai/2025-santa-cruz-se-fwd-california-sand-vehicle-browse-hero?wid=2560&qlt=85" },
  { page: "palisade",   token: "vehicle-browse-hero", url: "https://s7d1.scene7.com/is/image/hyundai/2026-palisade-calligraphy-fwd-steelgraphite-vehicle-browse-hero?wid=2560&qlt=85" },
  { page: "ioniq-9",    token: "vehicle-browse-hero", url: "https://s7d1.scene7.com/is/image/hyundai/2026-ioniq-9-s-rwd-snow-white-vehicle-browse-hero?wid=2560&qlt=85" },
  // Also probe the elantra-n / ioniq-5-n "trim-color-001" naming (might be a front-3/4 vehicle shot)
  { page: "elantra-n",  token: "trim-color-001",      url: "https://s7d1.scene7.com/is/image/hyundai/2025-elantra-n-6mt-performance-blue-001?wid=2560&qlt=85" },
  { page: "ioniq-5-n",  token: "trim-color-001",      url: "https://s7d1.scene7.com/is/image/hyundai/2025-ioniq-5-n-performance-blue-matte-001?wid=2560&qlt=85" },
  // And the venue numeric-vlp
  { page: "venue",      token: "vlp-0045",            url: "https://s7d1.scene7.com/is/image/hyundai/2023-venue-0045-vlp?wid=2560&qlt=85" },
];

async function downloadOne(s) {
  try {
    const res = await fetch(s.url, { headers: { "User-Agent": UA, "Accept": "image/*" } });
    if (!res.ok) return { ok: false, status: res.status, ...s };
    const ct = res.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) return { ok: false, ct, ...s };
    const filename = `extra2_${s.page}__${s.token}.jpg`;
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(path.join(OUT_DIR, filename), buf);
    return { ok: true, filename, bytes: buf.length, ...s };
  } catch (err) {
    return { ok: false, error: err.message, ...s };
  }
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  for (const s of SAMPLES) {
    const r = await downloadOne(s);
    if (r.ok) console.log(`OK   ${r.filename}  (${r.bytes} bytes)`);
    else      console.log(`FAIL ${s.page}/${s.token}  ${r.status || r.ct || r.error}`);
  }
}
main().catch(e => { console.error("Fatal:", e); process.exitCode = 1; });
