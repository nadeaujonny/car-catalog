#!/usr/bin/env node
// Search a page's HTML for any "hero" candidate (regardless of token name) so
// we know what the hyundai-USA per-model hero filename convention is for each
// model. Some pages may use vlp-hero, others may use just "hero", "hero-image",
// "vlp-banner", etc. — investigate empirically before generalising.

import { fileURLToPath } from "node:url";
import path from "node:path";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
           "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const TARGETS = [
  // The 9 pages where vlp-hero wasn't found
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

async function fetchHTML(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html" }, redirect: "follow" });
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true, html: await res.text(), finalUrl: res.url };
}

async function main() {
  for (const t of TARGETS) {
    console.log(`========== ${t.slug} ==========`);
    const r = await fetchHTML(t.url);
    if (!r.ok) { console.log(`  FETCH FAIL ${r.status}`); continue; }

    // Find scene7 image URLs and bucket by their key token
    const scene7 = new Set();
    const re = /(https?:\/\/s7d1\.scene7\.com\/is\/image\/hyundai\/[^"'\s)]+)/gi;
    let m;
    while ((m = re.exec(r.html)) !== null) scene7.add(m[1]);
    console.log(`  total unique scene7 image URLs: ${scene7.size}`);

    // Look for "hero"-like tokens
    const heroLike = [];
    for (const u of scene7) {
      if (/hero|banner|vlp|jumbo|masthead|landing/i.test(u)) heroLike.push(u);
    }
    console.log(`  candidate hero/banner/vlp URLs: ${heroLike.length}`);
    // Show first 12 unique base filenames
    const seen = new Set();
    let shown = 0;
    for (const u of heroLike) {
      // Extract the base filename without resolution suffix
      const fn = u.replace(/^.*\/hyundai\//, "").split("?")[0].replace(/-\d+-\d+(?:x\d+)?$/, "").replace(/:\d+-\d+x\d+$/, "");
      if (seen.has(fn)) continue;
      seen.add(fn);
      console.log(`    - ${u}`);
      shown++;
      if (shown >= 12) break;
    }
    if (heroLike.length === 0 && scene7.size > 0) {
      // Show first 8 scene7 URLs anyway to see what's there
      console.log(`  no hero-like found; first 8 scene7 URLs:`);
      let n = 0;
      for (const u of scene7) {
        console.log(`    - ${u}`);
        if (++n >= 8) break;
      }
    }
    console.log("");
  }
}
main().catch(e => { console.error("Fatal:", e); process.exitCode = 1; });
