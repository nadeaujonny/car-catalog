#!/usr/bin/env node
// Diagnostic: dump raw image candidates from mazda model pages so we can see
// what the slugMatchesURL gate is actually testing against. Writes a
// human-readable log to reports/mazda_candidates_raw.log.
//
// Usage: node scripts/diag_mazda_candidates.mjs

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
           "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const PAGES = [
  ["cx-5",     "https://www.mazdausa.com/vehicles/cx-5"],
  ["cx-90",    "https://www.mazdausa.com/vehicles/cx-90"],
  ["mazda3-sedan", "https://www.mazdausa.com/vehicles/mazda3-sedan"],
];

const IMG_EXT_RE = /\.(jpe?g|png|webp|avif)(?:\?[^"'\s)]*)?$/i;
const DEFAULT_BLACKLIST = /(?:Promo-Banner|Global-Nav|VehicleCards|Vehicle-Selector|Future-Vehicles|nav[/_-]?jelly|All-Vehicles\/|favicon|sprite|icon|logo|seal|emblem|swatch|color-?swatch)/i;
const MAZDA_BLACKLIST = /(?:Promo-Banner|Global-Nav|nav[/_-]?jelly|favicon|sprite|icon|logo|placeholder|preview-thumb)/i;

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

function resolveURL(maybeRelative, base) {
  try { return new URL(maybeRelative, base).href; } catch { return null; }
}

function htmlDecode(s) {
  return s.replace(/&amp;/g, "&").replace(/&#x2F;/gi, "/").replace(/&quot;/g, '"');
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
  const push = (url, weight, context) => {
    if (!url) return;
    const decoded = htmlDecode(url);
    const abs = resolveURL(decoded, baseUrl);
    if (!abs) return;
    if (!isPlausibleImageURL(abs, blacklist)) return;
    list.push({ url: abs, weight: weight || 1, context: context || "" });
  };

  const imgRe = /<img\b([^>]*)>/gi;
  let m;
  while ((m = imgRe.exec(html))) {
    const a = m[1];
    const alt = (attr(a, "alt") || "") + " " + (attr(a, "title") || "");
    push(attr(a, "src"),       1, alt);
    push(attr(a, "data-src"),  1, alt);
    const ss = attr(a, "srcset") || attr(a, "data-srcset");
    for (const s of parseSrcset(ss, baseUrl)) list.push({ url: s.url, weight: 1, context: alt });
  }
  const sourceRe = /<source\b([^>]*)>/gi;
  while ((m = sourceRe.exec(html))) {
    const a = m[1];
    const ss = attr(a, "srcset") || attr(a, "data-srcset");
    for (const s of parseSrcset(ss, baseUrl)) list.push({ url: s.url, weight: 1, context: "" });
  }
  const ogRe1 = /<meta\b[^>]*property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/gi;
  while ((m = ogRe1.exec(html))) push(m[1], 1.5, "og:image");
  const preloadRe = /<link\b[^>]*rel=["']preload["'][^>]*as=["']image["'][^>]*href=["']([^"']+)["']/gi;
  while ((m = preloadRe.exec(html))) push(m[1], 1.5, "preload");
  const bgRe = /background-image\s*:\s*url\(["']?([^)"']+)["']?\)/gi;
  while ((m = bgRe.exec(html))) push(m[1], 1, "background");
  const nakedRe = /["'](https?:\/\/[^"'\s]+?\.(?:jpe?g|png|webp|avif)(?:\?[^"'\s]*)?)["']/gi;
  while ((m = nakedRe.exec(html))) push(m[1], 0.8, "naked");
  const cdnRe = /["'](\/-\/media\/[^"'\s]+?\.(?:jpe?g|png|webp|avif)(?:\?[^"'\s]*)?)["']/gi;
  while ((m = cdnRe.exec(html))) push(m[1], 0.8, "cdn-rel");

  return list;
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function variantToRegexFragment(v) {
  return (v || "").trim().toLowerCase().split(/[-_ ]+/).filter(Boolean).map(escapeRe).join("[-_ ]");
}
function slugMatchesURL(slug, haystack, slugVariants) {
  const variants = slugVariants[slug] || [slug];
  const hay = (haystack || "").toLowerCase();
  for (const v of variants) {
    const frag = variantToRegexFragment(v);
    if (!frag) continue;
    const re = new RegExp(`(^|[/_ -])${frag}([/_ -]|\\.|$)`, "i");
    if (re.test(hay)) return true;
  }
  return false;
}

async function main() {
  const cfg = JSON.parse(await fs.readFile(path.join(PROJECT_ROOT, "scripts", "brand-configs", "mazda.json"), "utf-8"));
  const slugVariants = cfg.slug_variants || {};
  const blacklist = cfg.path_blacklist_regex ? new RegExp(cfg.path_blacklist_regex, "i") : DEFAULT_BLACKLIST;

  const lines = [];
  const log = (s) => { lines.push(s); };

  log(`# mazda candidate dump - ${new Date().toISOString()}`);
  log(`# blacklist: ${blacklist}`);
  log(`# slug_variants (current config):`);
  for (const k of Object.keys(slugVariants)) log(`#   ${k}: ${JSON.stringify(slugVariants[k])}`);
  log("");

  for (const [pageSlug, url] of PAGES) {
    log(`\n${"=".repeat(80)}`);
    log(`PAGE: ${pageSlug}  ${url}`);
    log(`${"=".repeat(80)}`);
    const res = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml" }, redirect: "follow" });
    if (!res.ok) { log(`  FAIL status ${res.status}`); continue; }
    const html = await res.text();
    const cands = extractCandidates(html, url, blacklist);

    log(`raw candidates: ${cands.length}`);

    // Dedupe by URL path so we don't repeat srcset variants
    const seen = new Set();
    const unique = [];
    for (const c of cands) {
      const p = (() => { try { return new URL(c.url).pathname; } catch { return c.url; } })();
      if (seen.has(p)) continue;
      seen.add(p);
      unique.push(c);
    }
    log(`unique-by-path: ${unique.length}`);

    // Categorise into "host buckets" + "path prefix buckets"
    const hostCount = new Map();
    const pathPrefixCount = new Map();
    for (const c of unique) {
      const u = new URL(c.url);
      const host = u.host;
      const segs = u.pathname.split("/").filter(Boolean);
      const prefix = segs.slice(0, 3).join("/");
      hostCount.set(host, (hostCount.get(host) || 0) + 1);
      pathPrefixCount.set(`${host}/${prefix}`, (pathPrefixCount.get(`${host}/${prefix}`) || 0) + 1);
    }
    log(`\nhosts:`);
    for (const [h, n] of [...hostCount.entries()].sort((a, b) => b[1] - a[1])) log(`  ${n.toString().padStart(4)}  ${h}`);

    log(`\ntop path prefixes (host/seg1/seg2/seg3):`);
    for (const [p, n] of [...pathPrefixCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30))
      log(`  ${n.toString().padStart(4)}  ${p}`);

    // Slug-match count using current variants
    const allSlugs = Object.keys(slugVariants);
    const matchCountBySlug = Object.fromEntries(allSlugs.map(s => [s, 0]));
    let anyMatch = 0;
    for (const c of unique) {
      const hay = `${c.url} ${c.context || ""}`;
      let matched = false;
      for (const slug of allSlugs) {
        if (slugMatchesURL(slug, hay, slugVariants)) { matchCountBySlug[slug]++; matched = true; }
      }
      if (matched) anyMatch++;
    }
    log(`\nslug-match counts (current variants):`);
    for (const s of allSlugs) log(`  ${matchCountBySlug[s].toString().padStart(4)}  ${s}`);
    log(`  ANY: ${anyMatch} of ${unique.length}`);

    // Sample of UN-matched candidates (the gap)
    log(`\nsample UN-matched candidates (URL + alt, first 40):`);
    let printed = 0;
    for (const c of unique) {
      if (printed >= 40) break;
      const hay = `${c.url} ${c.context || ""}`;
      let matched = false;
      for (const slug of allSlugs) {
        if (slugMatchesURL(slug, hay, slugVariants)) { matched = true; break; }
      }
      if (matched) continue;
      const ctxClean = (c.context || "").replace(/\s+/g, " ").trim().slice(0, 100);
      log(`  ${c.url}`);
      if (ctxClean) log(`     alt: ${ctxClean}`);
      printed++;
    }

    // Sample of matched candidates (so we know what the working pattern looks like)
    log(`\nsample MATCHED candidates (first 20):`);
    let pm = 0;
    for (const c of unique) {
      if (pm >= 20) break;
      const hay = `${c.url} ${c.context || ""}`;
      let matchedSlug = null;
      for (const slug of allSlugs) {
        if (slugMatchesURL(slug, hay, slugVariants)) { matchedSlug = slug; break; }
      }
      if (!matchedSlug) continue;
      const ctxClean = (c.context || "").replace(/\s+/g, " ").trim().slice(0, 100);
      log(`  [${matchedSlug}] ${c.url}`);
      if (ctxClean) log(`     alt: ${ctxClean}`);
      pm++;
    }
  }

  const outPath = path.join(PROJECT_ROOT, "reports", "mazda_candidates_raw.log");
  await fs.writeFile(outPath, lines.join("\n"), "utf-8");
  console.log(`Wrote ${outPath}  (${lines.length} lines)`);
}

main().catch(e => { console.error(e); process.exitCode = 1; });
