#!/usr/bin/env node
// For every Hyundai model page, run extractCandidates (the same logic the
// production scraper uses) and report:
//   - count of candidates whose URL contains "vlp-hero"
//   - count of candidates whose URL contains "vehicle-browse-hero"
//   - count of candidates whose URL contains "ev-vlp-hero"
//   - count of candidates ending with "-001" (numeric, for N-trim side profiles)
//
// This tells us exactly which models will be reached by each proposed
// angle_url_patterns regex without re-running the full scraper.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

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

const IMG_EXT_RE = /\.(jpe?g|png|webp|avif)(?:\?[^"'\s)]*)?$/i;
const BLACKLIST = /(?:Promo-Banner|Global-Nav|nav[/_-]?jelly|favicon|sprite|icon|logo|placeholder|preview-thumb|future-vehicles|hyundai-home|home-solar|solar-panels|dkey2touch|digital-key|wifi-hotspot|crater-concept|boulder-mountain|cpo)/i;

function htmlDecode(s) {
  return s.replace(/&amp;/g, "&").replace(/&#x2F;/gi, "/").replace(/&quot;/g, '"');
}
function resolveURL(maybeRelative, base) {
  try { return new URL(maybeRelative, base).href; } catch { return null; }
}
function isPlausibleImageURL(url, blacklist) {
  try {
    const u = new URL(url);
    // scene7 URLs often lack file extension — still treat as image if hosted there
    const isScene7 = /scene7\.com/i.test(u.hostname);
    if (!isScene7 && !IMG_EXT_RE.test(u.pathname)) return false;
    if (/\.svg\b/i.test(u.pathname)) return false;
    if (blacklist.test(u.pathname + (u.search || ""))) return false;
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
function extractCandidates(html, baseUrl) {
  const list = [];
  const push = (url) => {
    if (!url) return;
    const abs = resolveURL(htmlDecode(url), baseUrl);
    if (!abs) return;
    if (!isPlausibleImageURL(abs, BLACKLIST)) return;
    list.push(abs);
  };
  const imgRe = /<img\b([^>]*)>/gi;
  let m;
  while ((m = imgRe.exec(html))) {
    const a = m[1];
    push(attr(a, "src"));
    push(attr(a, "data-src"));
    const ss = attr(a, "srcset") || attr(a, "data-srcset");
    for (const s of parseSrcset(ss, baseUrl)) list.push(s.url);
  }
  const sourceRe = /<source\b([^>]*)>/gi;
  while ((m = sourceRe.exec(html))) {
    const a = m[1];
    const ss = attr(a, "srcset") || attr(a, "data-srcset");
    for (const s of parseSrcset(ss, baseUrl)) list.push(s.url);
  }
  // og:image, preload, css-bg, naked
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

function basename(u) {
  try {
    const path = new URL(u).pathname;
    return path.replace(/^.*\//, "");
  } catch { return u; }
}

async function main() {
  const lines = [];
  const log = (s) => { lines.push(s); console.log(s); };
  log(`# Hyundai hero-candidate audit — ${new Date().toISOString()}\n`);

  // CSV-style summary table
  log(`model         |  cand | VBH | vlp-hero | ev-vlp-hero | <slug>-...-001 |`);
  log(`--------------+-------+-----+----------+-------------+----------------+`);
  const perModelDetail = [];

  for (const t of TARGETS) {
    const r = await fetchHTML(t.url);
    if (!r) { log(`${t.slug.padEnd(14)}| FETCH FAIL                                              `); continue; }
    const cands = extractCandidates(r.html, r.finalUrl);

    // Bucket
    const vbh = cands.filter(c => /vehicle-browse-hero/i.test(c));
    const evh = cands.filter(c => /ev-vlp-hero/i.test(c));
    const vh  = cands.filter(c => /vlp-hero/i.test(c) && !/ev-vlp-hero/i.test(c));
    const slug001Re = new RegExp(`/${t.slug}-[a-z0-9-]+-001\\b`, "i");
    const s001 = cands.filter(c => slug001Re.test(c));

    log(`${t.slug.padEnd(14)}| ${String(cands.length).padStart(5)} | ${String(vbh.length).padStart(3)} | ${String(vh.length).padStart(8)} | ${String(evh.length).padStart(11)} | ${String(s001.length).padStart(14)} |`);

    perModelDetail.push({ slug: t.slug, vbh, vh, evh, s001 });
  }

  // Per-model breakdown: list distinct base filenames (strip resolution suffix)
  log(`\n\n# Detail: distinct base filenames per token, per model`);
  for (const d of perModelDetail) {
    log(`\n========== ${d.slug} ==========`);
    for (const [tok, arr] of [["vehicle-browse-hero", d.vbh], ["vlp-hero (NOT ev-)", d.vh], ["ev-vlp-hero", d.evh], ["<slug>-...-001", d.s001]]) {
      const bases = new Set();
      for (const u of arr) {
        // strip scene7 trailing -NNNN-NNNN(xNNNN)? resolution suffix and ?query
        const fn = basename(u).split("?")[0].replace(/-\d+-\d+(?:x\d+)?$/, "");
        bases.add(fn);
      }
      log(`  ${tok}: ${arr.length} URL${arr.length===1?"":"s"} -> ${bases.size} distinct base${bases.size===1?"":"s"}`);
      for (const b of bases) log(`    - ${b}`);
    }
  }

  const outPath = path.join(PROJECT_ROOT, "reports", "hyundai_hero_audit.log");
  await fs.writeFile(outPath, lines.join("\n"), "utf-8");
  console.log(`\n--- wrote ${outPath} ---`);
}
main().catch(e => { console.error("Fatal:", e); process.exitCode = 1; });
