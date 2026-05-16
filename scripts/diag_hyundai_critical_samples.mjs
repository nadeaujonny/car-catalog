#!/usr/bin/env node
// Verify critical samples: download the EXACT base filenames the
// hyundai_hero_audit.log identified to confirm angle for each one.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(PROJECT_ROOT, "reports", "hyundai_samples");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
           "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const SAMPLES = [
  // Confirm: ev-vlp-hero on hybrid sonata
  { name: "extra3_sonata__hev-vlp-hero",      url: "https://s7d1.scene7.com/is/image/hyundai/2026-sonata-hev-vlp-hero-1920-2560?wid=2560&qlt=85" },
  // Confirm ev-vlp-hero on ioniq-9 (already saw vbh as front 3/4)
  { name: "extra3_ioniq-9__ev-vlp-hero",      url: "https://s7d1.scene7.com/is/image/hyundai/2026-ioniq-9-ev-vlp-hero-1920-2560?wid=2560&qlt=85" },
  // Confirm ev-vlp-hero on ioniq-5-n
  { name: "extra3_ioniq-5-n__ev-vlp-hero",    url: "https://s7d1.scene7.com/is/image/hyundai/2025-ioniq-5n-ev-vlp-hero-1920-2560?wid=2560&qlt=85" },
  // Confirm vlp-hero on venue (NOT one of the original 4 sampled pages)
  { name: "extra3_venue__vlp-hero",           url: "https://s7d1.scene7.com/is/image/hyundai/2026-venue-vlp-hero-1920-2560?wid=2560&qlt=85" },
  // ioniq-5 second variant (sse) - hero with sse suffix
  { name: "extra3_ioniq-5__ev-vlp-hero-plain", url: "https://s7d1.scene7.com/is/image/hyundai/2026-ioniq-5-ev-vlp-hero-1920-2560?wid=2560&qlt=85" },
  // The poster-9x5 "Hero-Image" elantra-n / palisade hero
  { name: "extra3_elantra-n__vlp-hero-poster", url: "https://s7d1.scene7.com/is/image/hyundai/2024-elantra-n-HNIE4017000H-vlp-hero-poster-9x5:Hero-Image?wid=2560&qlt=85" },
  { name: "extra3_palisade__vlp-hero-poster",  url: "https://s7d1.scene7.com/is/image/hyundai/2026-palisade-HNTP6002000HGEN-vlp-hero-poster-9x5:Hero-Image?wid=2560&qlt=85" },
  // tucson's vehicle-browse-hero (separate from vlp-hero)
  { name: "extra3_tucson__vehicle-browse-hero",url: "https://s7d1.scene7.com/is/image/hyundai/2025-tucson-vehicle-browse-hero?wid=2560&qlt=85" },
];

async function downloadOne(s) {
  try {
    const res = await fetch(s.url, { headers: { "User-Agent": UA, "Accept": "image/*" } });
    if (!res.ok) return { ok: false, status: res.status, ...s };
    const ct = res.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) return { ok: false, ct, ...s };
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(path.join(OUT_DIR, `${s.name}.jpg`), buf);
    return { ok: true, bytes: buf.length, ...s };
  } catch (err) {
    return { ok: false, error: err.message, ...s };
  }
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  for (const s of SAMPLES) {
    const r = await downloadOne(s);
    if (r.ok) console.log(`OK   ${s.name}.jpg  (${r.bytes} bytes)`);
    else      console.log(`FAIL ${s.name}  ${r.status || r.ct || r.error}`);
  }
}
main().catch(e => { console.error("Fatal:", e); process.exitCode = 1; });
