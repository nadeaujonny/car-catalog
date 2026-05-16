#!/usr/bin/env node
// Mimic the production extractCandidates EXACTLY to enumerate what the real
// scraper accepts as candidates for each Hyundai page. This tells us which
// of our proposed angle_url_patterns will actually fire.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
           "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const TARGETS = [
  "venue","elantra","elantra-n","sonata","kona","tucson","santa-cruz","santa-fe",
  "palisade","ioniq-5","ioniq-5-n","ioniq-6-n","ioniq-9"
];

// Hyundai's path_blacklist_regex from the brand config
const BLACKLIST = /(?:Promo-Banner|Global-Nav|nav[/_-]?jelly|favicon|sprite|icon|logo|placeholder|preview-thumb|future-vehicles|hyundai-home|home-solar|solar-panels|dkey2touch|digital-key|wifi-hotspot|crater-concept|boulder-mountain|cpo)/i;

const IMG_EXT_RE = /\.(jpe?g|png|webp|avif)(?:\?[^"'\s)]*)?$/i;

function htmlDecode(s) {
  return s.replace(/&amp;/g, "&").replace(/&#x2F;/gi, "/").replace(/&quot;/g, '"');
}
function resolveURL(maybeRelative, base) {
  try { return new URL(maybeRelative, base).href; } catch { return null; }
}
function isPlausibleImageURL(url, blacklist) {
  try {
    const u = new URL(url);
    const full = u.pathname + (u.search || "");
    if (!IMG_EXT_RE.test(u.pathname)) return false;
    if (/\.svg\b/i.test(u.pathname)) return false;
    if (blacklist.test(full)) return false;
    const w = u.searchParams.get("w");
    if (w && parseInt(w, 10) < 200) return false;
    return true;
  } catch { return false; }
}
function parseSrcset(srcset, base) {
  if (!srcset) return [];
  const out = [];
  for (const part of srcset.split(",")) {
    const tokens = part.trim().split(/\s+/);
    if (!tokens[0]) continue;
    const abs = resolveURL(htmlDecode(tokens[0]), base);
    if (!abs) continue;
    out.push({ url: abs });
  }
  return out;
}
function attr(attrs, name) {
  const re = new RegExp(name + '\\s*=\\s*"([^"]*)"|' + name + "\\s*=\\s*'([^']*)'", "i");
  const m = attrs.match(re);
  return m ? (m[1] !== undefined ? m[1] : m[2]) : null;
}
function extractCandidates(html, baseUrl, blacklist) {
  const list = [];
  const push = (url) => {
    if (!url) return;
    const decoded = htmlDecode(url);
    const abs = resolveURL(decoded, baseUrl);
    if (!abs) return;
    if (!isPlausibleImageURL(abs, blacklist)) return;
    list.push(abs);
  };
  const imgRe = /<img\b([^>]*)>/gi;
  let m;
  while ((m = imgRe.exec(html))) {
    const a = m[1];
    push(attr(a, "src"));
    push(attr(a, "data-src"));
    const ss = attr(a, "srcset") || attr(a, "data-srcset");
    for (const s of parseSrcset(ss, baseUrl)) list.push(s.url);   // <-- bypasses IMG_EXT_RE
  }
  const sourceRe = /<source\b([^>]*)>/gi;
  while ((m = sourceRe.exec(html))) {
    const a = m[1];
    const ss = attr(a, "srcset") || attr(a, "data-srcset");
    for (const s of parseSrcset(ss, baseUrl)) list.push(s.url);   // <-- bypasses IMG_EXT_RE
  }
  const ogRe1 = /<meta\b[^>]*property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/gi;
  while ((m = ogRe1.exec(html))) push(m[1]);
  const preloadRe = /<link\b[^>]*rel=["']preload["'][^>]*as=["']image["'][^>]*href=["']([^"']+)["']/gi;
  while ((m = preloadRe.exec(html))) push(m[1]);
  const bgRe = /background-image\s*:\s*url\(["']?([^)"']+)["']?\)/gi;
  while ((m = bgRe.exec(html))) push(m[1]);
  const nakedRe = /["'](https?:\/\/[^"'\s]+?\.(?:jpe?g|png|webp|avif)(?:\?[^"'\s]*)?)["']/gi;
  while ((m = nakedRe.exec(html))) push(m[1]);
  return [...new Set(list)];
}

async function fetchHTML(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html" }, redirect: "follow" });
  if (!res.ok) return null;
  return { html: await res.text(), finalUrl: res.url };
}

async function main() {
  const lines = [];
  const log = s => { lines.push(s); console.log(s); };
  log(`# Production-equivalent candidate audit — ${new Date().toISOString()}\n`);

  const PATTERNS = {
    "front_three_quarter (vehicle-browse-hero)": /vehicle-browse-hero/i,
    "front_three_quarter (vlp-hero NOT ev/hev)": /(?<![a-z](?:-ev|-hev))(?<![/a-z](?:e|he)v[-])vlp-hero/i,
    "side_profile (ev-vlp-hero or hev-vlp-hero)": /(?:[/-]|^)(?:ev|hev)-vlp-hero/i,
    "side_profile (slug-trim-color-001)": /[/-](?:elantra-n|ioniq-5-n|ioniq-6-n)-[a-z0-9-]+-001(?=$|[?&])/i,
  };

  for (const slug of TARGETS) {
    const url = `https://www.hyundaiusa.com/us/en/vehicles/${slug}`;
    const r = await fetchHTML(url);
    if (!r) { log(`${slug}: FETCH FAILED`); continue; }
    const cands = extractCandidates(r.html, r.finalUrl, BLACKLIST);
    log(`========== ${slug} (${cands.length} cands) ==========`);
    for (const [name, pat] of Object.entries(PATTERNS)) {
      const matches = cands.filter(c => pat.test(c));
      // De-dup by base filename (strip resolution/breakpoint suffix and query)
      const bases = new Set();
      for (const u of matches) {
        const path = new URL(u).pathname;
        const base = path.replace(/^.*\//, "").replace(/-\d+-\d+(?:x\d+)?$/, "");
        bases.add(base);
      }
      log(`  ${name}: ${matches.length} URLs / ${bases.size} bases`);
      for (const b of bases) log(`    - ${b}`);
    }
    log("");
  }

  const outPath = path.join(PROJECT_ROOT, "reports", "hyundai_production_audit.log");
  await fs.writeFile(outPath, lines.join("\n"), "utf-8");
}
main().catch(e => { console.error("Fatal:", e); process.exitCode = 1; });
