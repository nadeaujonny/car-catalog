#!/usr/bin/env node
// Diagnostic: dump raw image candidates and alt text from a few high-volume
// Kia model pages, plus whether the current slug_variants config would match
// each candidate. Built from the mercedes/ford pattern (session 6 Phase 3).
//
// Usage: node scripts/diag_kia_candidates.mjs

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
           "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const ACCEPT_HTML = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
const TIMEOUT_MS = 20000;

function stripBOM(s) { return (s && s.charCodeAt(0) === 0xFEFF) ? s.slice(1) : s; }
async function readJSON(p) { return JSON.parse(stripBOM(await fs.readFile(p, "utf-8"))); }

async function fetchHTML(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept": ACCEPT_HTML, "Accept-Language": "en-US,en;q=0.9" },
      redirect: "follow", signal: ctrl.signal,
    });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, html: await res.text(), finalUrl: res.url };
  } catch (err) {
    return { ok: false, error: err.name === "AbortError" ? "timeout" : err.message };
  } finally { clearTimeout(t); }
}

const IMG_EXT_RE = /\.(jpe?g|png|webp|avif)(?:\?[^"'\s)]*)?$/i;
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
    let weight = 1;
    const desc = tokens[1];
    if (desc) {
      const m = desc.match(/^([\d.]+)([xw])$/);
      if (m) {
        const val = parseFloat(m[1]);
        weight = m[2] === "w" ? Math.min(val / 1000, 3) : Math.min(val, 3);
      }
    }
    out.push({ url: abs, weight });
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
    for (const s of parseSrcset(ss, baseUrl)) list.push({ url: s.url, weight: s.weight, context: alt });
  }
  const sourceRe = /<source\b([^>]*)>/gi;
  while ((m = sourceRe.exec(html))) {
    const a = m[1];
    const ss = attr(a, "srcset") || attr(a, "data-srcset");
    for (const s of parseSrcset(ss, baseUrl)) list.push({ url: s.url, weight: s.weight, context: "" });
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

function variantToRegexFragment(v) {
  return (v || "").trim().toLowerCase()
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map(escapeRe)
    .join("[-_ ]");
}
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function slugMatchesURL(slug, haystack, slugVariants) {
  const variants = slugVariants[slug] || [slug];
  const hay = (haystack || "").toLowerCase();
  for (const v of variants) {
    const frag = variantToRegexFragment(v);
    if (!frag) continue;
    const re = new RegExp(`(^|[/_ -])${frag}([/_ -]|\\.|$)`, "i");
    if (re.test(hay)) return { matched: true, variant: v };
  }
  return { matched: false };
}

async function main() {
  const CONFIG = path.join(PROJECT_ROOT, "scripts", "brand-configs", "kia.json");
  const cfg = await readJSON(CONFIG);
  const blacklist = cfg.path_blacklist_regex ? new RegExp(cfg.path_blacklist_regex, "i") : /.^/;
  const slugVariants = cfg.slug_variants || {};
  const modelPages = cfg.model_pages || {};

  // Pick representative kia models per the brief — Sorento, Telluride is NOT in
  // the catalog (16 models, no telluride), so use sorento, k5, ev6, and one
  // hybrid variant page (sorento-hybrid) to confirm the hev/phev naming gap.
  // Sorento + K5 + EV6 are the main brief targets (Telluride isn't in the
  // 16-model catalog). sorento-hybrid added to confirm the hev/phev naming gap
  // hypothesis. k4-hatchback added because the scrape produced 0 matches for
  // it (need to see actual hatchback page candidates, not whether the
  // hatchback alt text appears on sibling pages).
  const TARGETS = ["sorento", "k5", "ev6", "sorento-hybrid", "k4-hatchback", "niro-hybrid", "carnival-hybrid"];

  for (const model of TARGETS) {
    const pageUrl = modelPages[model];
    if (!pageUrl) { console.log(`\n### ${model}: no page URL in config\n`); continue; }
    console.log(`\n========================================`);
    console.log(`### model: ${model}`);
    console.log(`### page:  ${pageUrl}`);
    console.log(`### variants for this model: ${JSON.stringify(slugVariants[model] || [model])}`);
    console.log(`========================================`);
    const r = await fetchHTML(pageUrl);
    if (!r.ok) { console.log(`FETCH FAIL: ${r.status || r.error}`); continue; }
    const cands = extractCandidates(r.html, r.finalUrl, blacklist);
    // De-dupe per URL
    const seenURL = new Set();
    const unique = [];
    for (const c of cands) {
      if (seenURL.has(c.url)) continue;
      seenURL.add(c.url);
      unique.push(c);
    }
    let matched = 0;
    let unmatched = 0;
    console.log(`\nTotal raw candidates (after isPlausibleImageURL + blacklist): ${cands.length}`);
    console.log(`Unique by URL: ${unique.length}\n`);
    for (const c of unique) {
      const m = slugMatchesURL(model, `${c.url} ${c.context || ""}`, slugVariants);
      if (m.matched) {
        matched++;
        console.log(`MATCH[${m.variant}]: ${c.url}`);
        console.log(`    alt: ${(c.context || "").trim().slice(0, 200)}`);
      } else {
        unmatched++;
        console.log(`MISS: ${c.url}`);
        console.log(`    alt: ${(c.context || "").trim().slice(0, 200)}`);
      }
    }
    console.log(`\nSUMMARY for ${model}: matched=${matched}, missed=${unmatched}, total=${unique.length}`);
  }
}

main().catch(e => { console.error("Fatal:", e); process.exitCode = 1; });
