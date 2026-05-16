#!/usr/bin/env node
// For sonata + ioniq-5-n + ioniq-9, show which URLs contain "ev-vlp-hero",
// "vlp-hero", and "vehicle-browse-hero" so we can see if the patterns are
// distinct image URLs (i.e. different vehicle shots) or just multi-breakpoint
// srcset references to one asset.

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
           "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const TARGETS = ["sonata","ioniq-5","ioniq-5-n","ioniq-9","palisade","elantra-n"];

async function fetchHTML(slug) {
  const url = `https://www.hyundaiusa.com/us/en/vehicles/${slug}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html" }, redirect: "follow" });
  if (!res.ok) return null;
  return res.text();
}

async function main() {
  for (const slug of TARGETS) {
    console.log(`========== ${slug} ==========`);
    const html = await fetchHTML(slug);
    if (!html) { console.log("  fetch failed"); continue; }
    // Find scene7 URLs containing "hero" tokens
    const scene7 = new Set();
    const re = /(https?:\/\/s7d1\.scene7\.com\/is\/image\/hyundai\/[^"'\s,)]+)/gi;
    let m;
    while ((m = re.exec(html)) !== null) scene7.add(m[1]);

    const buckets = {
      "ev-vlp-hero": [],
      "vlp-hero (not ev)": [],
      "vehicle-browse-hero": [],
    };
    for (const u of scene7) {
      const lu = u.toLowerCase();
      if (lu.includes("ev-vlp-hero")) buckets["ev-vlp-hero"].push(u);
      else if (lu.includes("vlp-hero")) buckets["vlp-hero (not ev)"].push(u);
      if (lu.includes("vehicle-browse-hero")) buckets["vehicle-browse-hero"].push(u);
    }
    for (const [k, arr] of Object.entries(buckets)) {
      console.log(`  ${k}: ${arr.length}`);
      // Show unique base filename (everything before ":"/"?wid="/"-NNNN-NNNN")
      const baseFns = new Set();
      for (const u of arr) {
        const p = u.split("?")[0].split(":")[0]; // strip query and scene7 :NNNN-NxN
        const base = p.replace(/-\d+-\d+(?:x\d+)?$/, ""); // strip trailing -1024-1439 etc.
        baseFns.add(base.replace(/^.*\/hyundai\//, ""));
      }
      for (const b of baseFns) console.log(`     base: ${b}`);
    }
    console.log("");
  }
}
main().catch(e => { console.error("Fatal:", e); process.exitCode = 1; });
