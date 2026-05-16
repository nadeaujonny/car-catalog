#!/usr/bin/env node
// Final pattern-audit: for every Hyundai page, enumerate which tokens
// (vehicle-browse-hero, vlp-hero, ev-vlp-hero, -001) are present so we know
// how broadly each proposed regex will fire.

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
           "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const TARGETS = [
  { slug: "venue",      url: "https://www.hyundaiusa.com/us/en/vehicles/venue" },
  { slug: "elantra",    url: "https://www.hyundaiusa.com/us/en/vehicles/elantra" },
  { slug: "elantra-n",  url: "https://www.hyundaiusa.com/us/en/vehicles/elantra-n" },
  { slug: "sonata",     url: "https://www.hyundaiusa.com/us/en/vehicles/sonata" },
  { slug: "kona",       url: "https://www.hyundaiusa.com/us/en/vehicles/kona" },
  { slug: "tucson",     url: "https://www.hyundaiusa.com/us/en/vehicles/tucson" },
  { slug: "santa-cruz", url: "https://www.hyundaiusa.com/us/en/vehicles/santa-cruz" },
  { slug: "santa-fe",   url: "https://www.hyundaiusa.com/us/en/vehicles/santa-fe" },
  { slug: "palisade",   url: "https://www.hyundaiusa.com/us/en/vehicles/palisade" },
  { slug: "ioniq-5",    url: "https://www.hyundaiusa.com/us/en/vehicles/ioniq-5" },
  { slug: "ioniq-5-n",  url: "https://www.hyundaiusa.com/us/en/vehicles/ioniq-5-n" },
  { slug: "ioniq-6-n",  url: "https://www.hyundaiusa.com/us/en/vehicles/ioniq-6-n" },
  { slug: "ioniq-9",    url: "https://www.hyundaiusa.com/us/en/vehicles/ioniq-9" },
];

async function fetchHTML(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html" }, redirect: "follow" });
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true, html: await res.text() };
}

async function main() {
  console.log("Pattern audit for proposed angle_url_patterns:\n");
  console.log("model         | VBH | vlp-hero | ev-vlp | <slug>-001 |");
  console.log("--------------+-----+----------+--------+------------+");
  for (const t of TARGETS) {
    const r = await fetchHTML(t.url);
    if (!r.ok) { console.log(`${t.slug.padEnd(14)} fetch FAIL ${r.status}`); continue; }
    const h = r.html.toLowerCase();
    const vbh = (h.match(/vehicle-browse-hero/g) || []).length;
    const vh  = (h.match(/vlp-hero/g) || []).length;
    const evh = (h.match(/ev-vlp-hero/g) || []).length;
    const slugBare = t.slug.replace(/-n$/, "-n");
    // <slug>-<...trim/color tokens...>-001 — broad regex
    const slug001Re = new RegExp(`/${slugBare}-[a-z0-9-]+-001(?![0-9])`, "g");
    const s001 = (h.match(slug001Re) || []).length;
    console.log(`${t.slug.padEnd(14)}| ${String(vbh).padStart(3)} | ${String(vh).padStart(8)} | ${String(evh).padStart(6)} | ${String(s001).padStart(10)} |`);
  }
}
main().catch(e => { console.error("Fatal:", e); process.exitCode = 1; });
