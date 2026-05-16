#!/usr/bin/env node
// DIAG — download representative Hyundai image samples so we can visually
// classify what "vlp-hero", "media-slider", "vertical-tabs", and the various
// numeric-coded shots actually depict (front 3/4, rear 3/4, side, interior, ...).
//
// Saves to reports/hyundai_samples/<filename>. Writes index.txt mapping
// saved-filename -> origin URL + the source page (tucson/elantra/ioniq-5/santa-fe).
//
// Not idempotent: overwrites prior runs.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(PROJECT_ROOT, "reports", "hyundai_samples");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
           "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Hand-picked: highest-resolution variant per distinct base filename. The
// scene7 URLs encode the resolution in the trailing `:<bp>-<WxH>` segment;
// we grab the largest available width for each token-class so the shot is
// clearly classifiable when viewed.
const SAMPLES = [
  // ---------- vlp-hero -------------------------------------------------------
  // tucson hero (different vehicle/page-section labels in the same family)
  { page: "tucson",   token: "vlp-hero",        url: "https://s7d1.scene7.com/is/image/hyundai/2026-tucson-vlp-hero-1920-2560?wid=2560&qlt=85" },
  { page: "elantra",  token: "vlp-hero",        url: "https://s7d1.scene7.com/is/image/hyundai/2026-elantra-vlp-hero-1920-2560?wid=2560&qlt=85" },
  { page: "ioniq-5",  token: "vlp-hero",        url: "https://s7d1.scene7.com/is/image/hyundai/2026-ioniq-5-ev-vlp-hero-1920-2560?wid=2560&qlt=85" },
  { page: "santa-fe", token: "vlp-hero",        url: "https://s7d1.scene7.com/is/image/hyundai/2026-santa-fe-vlp-hero-gse-1920-2560?wid=2560&qlt=85" },

  // ---------- media-slider (numeric IDs, multiple shots per model) -----------
  // Tucson uses 0272-a / 0272-b / 0279 / 0267-talent-3 / 0274-talent-1 — look
  // at 4-5 distinct numeric IDs to see if they're a sequence (front/side/rear)
  // or a mixed gallery.
  { page: "tucson",   token: "media-slider-0272a", url: "https://s7d1.scene7.com/is/image/hyundai/2025-tucson-nx4-0272-a-media-slider-vlp:1024-2048x1136?qlt=85" },
  { page: "tucson",   token: "media-slider-0272b", url: "https://s7d1.scene7.com/is/image/hyundai/2025-tucson-nx4-0272-b-media-slider-vlp:1024-2048x1136?qlt=85" },
  { page: "tucson",   token: "vlp-0279",            url: "https://s7d1.scene7.com/is/image/hyundai/2025-tucson-nx4-0279-vlp:1024-2048x1136?qlt=85" },
  { page: "tucson",   token: "vlp-0267-talent-3",   url: "https://s7d1.scene7.com/is/image/hyundai/2025-tucson-nx4-0267-talent-3-vlp:1024-2048x1136?qlt=85" },
  { page: "tucson",   token: "vlp-0274-talent-1",   url: "https://s7d1.scene7.com/is/image/hyundai/2025-tucson-nx4-0274-talent-1-vlp:375-1500x800?qlt=85" },

  // santa-fe shots
  { page: "santa-fe", token: "carousel-0147",       url: "https://s7d1.scene7.com/is/image/hyundai/2024-santa-fe-mx5-0147-carousel:1024-2048x1136?qlt=85" },
  { page: "santa-fe", token: "media-slider-0151",   url: "https://s7d1.scene7.com/is/image/hyundai/2024-santa-fe-mx5-0151-media-slider:1024-2048x1136?qlt=85" },
  { page: "santa-fe", token: "media-slider-0165-lights-on", url: "https://s7d1.scene7.com/is/image/hyundai/2024-santa-fe-mx5-0165-lights-on-media-slider:1024-2048x1136?qlt=85" },
  { page: "santa-fe", token: "3rd-rowseating-poster", url: "https://s7d1.scene7.com/is/image/hyundai/2024-santa-fe-HNIF4004000H-vlp-3rd-rowseating-poster-16x9:1024-2048x1136?qlt=85" },

  // ioniq-5 shots
  { page: "ioniq-5",  token: "media-slider-0925",   url: "https://s7d1.scene7.com/is/image/hyundai/2025-ioniq-5-0925-media-slider:1024-2048x1136?qlt=85" },
  { page: "ioniq-5",  token: "media-slider-0919",   url: "https://s7d1.scene7.com/is/image/hyundai/2025-ioniq-5-0919-media-slider:1024-2048x1136?qlt=85" },

  // ---------- vertical-tabs (often interior?) --------------------------------
  { page: "tucson",   token: "vertical-tabs-0296",  url: "https://s7d1.scene7.com/is/image/hyundai/2025-tucson-nx4-0296-no-talent-vertical-tabs:1440-1440x799?qlt=85" },
  { page: "tucson",   token: "vertical-tabs-0276",  url: "https://s7d1.scene7.com/is/image/hyundai/2025-tucson-nx4-0276-vertical-tabs:1440-1440x799?qlt=85" },
  { page: "ioniq-5",  token: "vertical-tabs-0901",  url: "https://s7d1.scene7.com/is/image/hyundai/2026-ioniq-5-0901-vertical-tabs:1440-1440x799?qlt=85" },
  { page: "elantra",  token: "vert-tabs-0215",      url: "https://s7d1.scene7.com/is/image/hyundai/2025-elantra-0215-nottalent-vert-tabs-vlp:1440-1440x799?qlt=85" },
];

async function downloadOne(s) {
  try {
    const res = await fetch(s.url, { headers: { "User-Agent": UA, "Accept": "image/*" } });
    if (!res.ok) return { ok: false, status: res.status, ...s };
    const ct = res.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) return { ok: false, ct, ...s };
    const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";
    const filename = `${s.page}__${s.token}.${ext}`;
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(path.join(OUT_DIR, filename), buf);
    return { ok: true, filename, bytes: buf.length, ...s };
  } catch (err) {
    return { ok: false, error: err.message, ...s };
  }
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const indexLines = [];
  indexLines.push(`# Hyundai sample-image index — generated ${new Date().toISOString()}`);
  indexLines.push(`# Saved-filename  <-  source-page  <-  origin URL`);
  indexLines.push("");
  for (const s of SAMPLES) {
    const r = await downloadOne(s);
    if (r.ok) {
      console.log(`OK   ${r.filename}  (${r.bytes} bytes)`);
      indexLines.push(`OK   ${r.filename}`);
      indexLines.push(`     page  = ${r.page}`);
      indexLines.push(`     token = ${r.token}`);
      indexLines.push(`     url   = ${r.url}`);
      indexLines.push("");
    } else {
      console.log(`FAIL ${s.page}/${s.token}  ${r.status || r.ct || r.error}`);
      indexLines.push(`FAIL ${s.page}/${s.token}  ${r.status || r.ct || r.error}`);
      indexLines.push(`     url   = ${s.url}`);
      indexLines.push("");
    }
  }
  await fs.writeFile(path.join(OUT_DIR, "index.txt"), indexLines.join("\n"), "utf-8");
  console.log(`\nIndex written: ${path.join(OUT_DIR, "index.txt")}`);
}

main().catch(e => { console.error("Fatal:", e); process.exitCode = 1; });
