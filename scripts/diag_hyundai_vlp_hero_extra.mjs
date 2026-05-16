#!/usr/bin/env node
// Probe additional Hyundai pages to enumerate their `vlp-hero` URLs and download
// the highest-res sample of each, so we can verify whether the front-3/4
// assumption holds across the full model line (sonata, kona, palisade,
// ioniq-9, santa-cruz, elantra-n, ioniq-5-n, ioniq-6-n, venue).
//
// Saves to reports/hyundai_samples/extra_<model>__vlp-hero.jpg.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(PROJECT_ROOT, "reports", "hyundai_samples");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
           "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const TARGETS = [
  { slug: "venue",      url: "https://www.hyundaiusa.com/us/en/vehicles/venue" },
  { slug: "sonata",     url: "https://www.hyundaiusa.com/us/en/vehicles/sonata" },
  { slug: "kona",       url: "https://www.hyundaiusa.com/us/en/vehicles/kona" },
  { slug: "santa-cruz", url: "https://www.hyundaiusa.com/us/en/vehicles/santa-cruz" },
  { slug: "palisade",   url: "https://www.hyundaiusa.com/us/en/vehicles/palisade" },
  { slug: "ioniq-9",    url: "https://www.hyundaiusa.com/us/en/vehicles/ioniq-9" },
  { slug: "elantra-n",  url: "https://www.hyundaiusa.com/us/en/vehicles/elantra-n" },
  { slug: "ioniq-5-n",  url: "https://www.hyundaiusa.com/us/en/vehicles/ioniq-5-n" },
  { slug: "ioniq-6-n",  url: "https://www.hyundaiusa.com/us/en/vehicles/ioniq-6-n" },
];

const VLP_HERO_RE = /(https:\/\/s7d1\.scene7\.com\/is\/image\/hyundai\/[a-z0-9-]*vlp-hero[a-z0-9-]*-1920-2560(?:x850)?(?:\?wid=2560)?(?:&qlt=\d+)?)/gi;

async function fetchHTML(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html" }, redirect: "follow" });
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true, html: await res.text(), finalUrl: res.url };
}

async function downloadOne(url, outPath) {
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept": "image/*" } });
  if (!res.ok) return { ok: false, status: res.status };
  const ct = res.headers.get("content-type") || "";
  if (!ct.startsWith("image/")) return { ok: false, ct };
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outPath, buf);
  return { ok: true, bytes: buf.length };
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const log = [];
  log.push(`# Extra hyundai vlp-hero probe — ${new Date().toISOString()}\n`);

  for (const t of TARGETS) {
    log.push(`========== ${t.slug} ==========`);
    const r = await fetchHTML(t.url);
    if (!r.ok) { log.push(`  FETCH FAIL ${r.status}`); continue; }
    log.push(`  finalUrl: ${r.finalUrl}  (${r.html.length} bytes)`);

    // Find all hero candidates (URL contains "vlp-hero")
    const heroes = new Set();
    let m;
    const re = /(https?:\/\/s7d1\.scene7\.com\/is\/image\/hyundai\/[^"'\s)]*vlp-hero[^"'\s)]*)/gi;
    while ((m = re.exec(r.html)) !== null) heroes.add(m[1]);
    log.push(`  ${heroes.size} vlp-hero URLs (any size):`);
    // Show first 12 to keep log readable
    const heroArr = [...heroes];
    for (const h of heroArr.slice(0, 12)) log.push(`    - ${h}`);
    if (heroArr.length > 12) log.push(`    ... (+${heroArr.length - 12} more)`);

    // Pick the highest-res variant (prefer the one with "1920-2560" or "wid=2560"
    // and NOT containing "x850" — those are letterbox-cropped versions).
    let pick = null;
    for (const h of heroArr) {
      if ((h.includes("1920-2560") || h.includes("wid=2560")) && !h.includes("x850")) { pick = h; break; }
    }
    if (!pick) {
      // Fallback: any 2560-width
      for (const h of heroArr) {
        if (h.includes("2560") && !h.includes("x850")) { pick = h; break; }
      }
    }
    if (!pick) pick = heroArr[0];

    if (pick) {
      const outPath = path.join(OUT_DIR, `extra_${t.slug}__vlp-hero.jpg`);
      const d = await downloadOne(pick, outPath);
      if (d.ok) log.push(`  saved: ${outPath}  (${d.bytes} bytes)`);
      else      log.push(`  download FAIL: ${JSON.stringify(d)}`);
    } else {
      log.push(`  no vlp-hero URL found on this page`);
    }
    log.push("");
  }
  await fs.writeFile(path.join(OUT_DIR, "extra-probe.log"), log.join("\n"), "utf-8");
  console.log(log.join("\n"));
}

main().catch(e => { console.error("Fatal:", e); process.exitCode = 1; });
