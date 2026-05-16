#!/usr/bin/env node
// DIAGNOSTIC — dump raw image candidates from the 3 Lotus model pages
// (consumer site lotuscars.com/en-US/<model>) AND the press-gallery URLs
// (media.lotuscars.com -> 301 -> lotuscars.com/en/press/galleries/<model>)
// so we can see whether the angle_url_patterns extension can rescue Lotus.
//
// Session 6 reports: Phase C row lotus = 3 Playwright escalations, all
// 0-candidate, 0% coverage (0 of 24). The persistent_low_coverage_brands.md
// note suggested this is similar to Ferrari (shadow-DOM / CSS-bg + JS-render)
// and recommended placeholder-only. Phase A3 of Session 7 re-checks whether
// the press gallery URLs are angle-rich and would unblock the brand.
//
// Logs to: reports/lotus_candidates_raw.log
//
// Reuses the same UA / extractCandidates / slugMatchesURL logic shape as
// scripts/scrape_image_urls.mjs so what we see here mirrors what the scraper
// sees in production.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(PROJECT_ROOT, "reports", "lotus_candidates_raw.log");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
           "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const ACCEPT_HTML = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
const TIMEOUT_MS = 25000;

// Probe set: 3 consumer pages + 6 press-gallery variants (en-US base + en root)
// for each model. Galleries are typically angle-rich on press portals; both
// hostnames are tested in case one redirects to a different gallery layout.
const TARGETS = [
  { slug: "emira",  url: "https://www.lotuscars.com/en-US/emira" },
  { slug: "eletre", url: "https://www.lotuscars.com/en-US/eletre" },
  { slug: "emeya",  url: "https://www.lotuscars.com/en-US/emeya" },
  // Press galleries — media.lotuscars.com 301-redirects to lotuscars.com/en/press/...
  { slug: "emira",  url: "https://media.lotuscars.com/en/press/galleries/emira",  source: "press-media" },
  { slug: "eletre", url: "https://media.lotuscars.com/en/press/galleries/eletre", source: "press-media" },
  { slug: "emeya",  url: "https://media.lotuscars.com/en/press/galleries/emeya",  source: "press-media" },
  { slug: "emira",  url: "https://www.lotuscars.com/en/press/galleries/emira",    source: "press-en" },
  { slug: "eletre", url: "https://www.lotuscars.com/en/press/galleries/eletre",   source: "press-en" },
  { slug: "emeya",  url: "https://www.lotuscars.com/en/press/galleries/emeya",    source: "press-en" },
  // Fallback press root in case galleries are under a different slug
  { slug: "_press_root", url: "https://www.lotuscars.com/en/press", source: "press-root" },
];

const IMG_EXT_RE = /\.(jpe?g|png|webp|avif)(?:\?[^"'\s)]*)?$/i;
const BLACKLIST = /(?:Promo-Banner|Global-Nav|nav[/_-]?jelly|favicon|sprite|icon|logo|placeholder|preview-thumb)/i;

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
  const push = (url, weight, context, src) => {
    if (!url) return;
    const decoded = htmlDecode(url);
    const abs = resolveURL(decoded, baseUrl);
    if (!abs) return;
    if (!isPlausibleImageURL(abs, blacklist)) return;
    list.push({ url: abs, weight: weight || 1, context: context || "", source: src });
  };
  const imgRe = /<img\b([^>]*)>/gi;
  let m;
  while ((m = imgRe.exec(html))) {
    const a = m[1];
    const alt = (attr(a, "alt") || "") + " " + (attr(a, "title") || "");
    push(attr(a, "src"),       1, alt, "img@src");
    push(attr(a, "data-src"),  1, alt, "img@data-src");
    const ss = attr(a, "srcset") || attr(a, "data-srcset");
    for (const s of parseSrcset(ss, baseUrl)) list.push({ url: s.url, weight: s.weight, context: alt, source: "img@srcset" });
  }
  const sourceRe = /<source\b([^>]*)>/gi;
  while ((m = sourceRe.exec(html))) {
    const a = m[1];
    const ss = attr(a, "srcset") || attr(a, "data-srcset");
    for (const s of parseSrcset(ss, baseUrl)) list.push({ url: s.url, weight: s.weight, context: "", source: "source@srcset" });
  }
  const ogRe1 = /<meta\b[^>]*property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/gi;
  while ((m = ogRe1.exec(html))) push(m[1], 1.5, "og:image", "og:image");
  const preloadRe = /<link\b[^>]*rel=["']preload["'][^>]*as=["']image["'][^>]*href=["']([^"']+)["']/gi;
  while ((m = preloadRe.exec(html))) push(m[1], 1.5, "preload", "preload");
  const bgRe = /background-image\s*:\s*url\(["']?([^)"']+)["']?\)/gi;
  while ((m = bgRe.exec(html))) push(m[1], 1, "background", "css-bg");
  const nakedRe = /["'](https?:\/\/[^"'\s]+?\.(?:jpe?g|png|webp|avif)(?:\?[^"'\s]*)?)["']/gi;
  while ((m = nakedRe.exec(html))) push(m[1], 0.8, "naked", "naked-url");
  const cdnRe = /["'](\/-\/media\/[^"'\s]+?\.(?:jpe?g|png|webp|avif)(?:\?[^"'\s]*)?)["']/gi;
  while ((m = cdnRe.exec(html))) push(m[1], 0.8, "cdn-rel", "cdn-rel");
  return list;
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function variantToRegexFragment(v) {
  return (v || "").trim().toLowerCase()
    .split(/[-_ ]+/).filter(Boolean).map(escapeRe).join("[-_ ]");
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

async function fetchHTML(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        "Accept": ACCEPT_HTML,
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: ctrl.signal,
    });
    if (!res.ok) return { ok: false, status: res.status, finalUrl: res.url };
    return { ok: true, html: await res.text(), finalUrl: res.url, status: res.status };
  } catch (err) {
    return { ok: false, error: err.name === "AbortError" ? "timeout" : err.message };
  } finally {
    clearTimeout(t);
  }
}

function uniqueByUrl(arr) {
  const seen = new Set();
  const out = [];
  for (const c of arr) {
    if (seen.has(c.url)) continue;
    seen.add(c.url);
    out.push(c);
  }
  return out;
}

async function readBrandSlugVariants() {
  const cfgPath = path.join(PROJECT_ROOT, "scripts", "brand-configs", "lotus.json");
  const raw = await fs.readFile(cfgPath, "utf-8");
  const cfg = JSON.parse(raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw);
  return cfg.slug_variants || {};
}

function host(u) {
  try { return new URL(u).host; } catch { return ""; }
}
function pathname(u) {
  try { return new URL(u).pathname; } catch { return ""; }
}

async function main() {
  const lines = [];
  const log = (s) => { lines.push(s); console.log(s); };

  const slugVariants = await readBrandSlugVariants();
  log(`# Lotus candidate dump — generated ${new Date().toISOString()}`);
  log(`# Loaded slug_variants for: ${Object.keys(slugVariants).join(", ")}`);
  log("");

  for (const t of TARGETS) {
    log(`========================================================================`);
    log(`# MODEL: ${t.slug}    (source: ${t.source || "consumer"})`);
    log(`# URL:   ${t.url}`);
    log(`========================================================================`);

    const r = await fetchHTML(t.url);
    if (!r.ok) {
      log(`FETCH FAILED: status=${r.status || "?"} error=${r.error || ""} finalUrl=${r.finalUrl || ""}`);
      log("");
      continue;
    }
    const finalUrl = r.finalUrl;
    log(`# finalUrl: ${finalUrl}    (status ${r.status})`);
    log(`# html bytes: ${r.html.length}`);

    const cands = uniqueByUrl(extractCandidates(r.html, finalUrl, BLACKLIST));
    log(`# raw candidates (deduped by URL): ${cands.length}`);

    // How many slug-match? (skip for press-root probe with synthetic slug)
    let matched = [];
    if (t.slug !== "_press_root") {
      matched = cands.filter(c =>
        slugMatchesURL(t.slug, `${c.url} ${c.context}`, slugVariants));
      log(`# slug-matching (variant for "${t.slug}"): ${matched.length}`);
    } else {
      // Check whether any of the 3 model names appear on press root
      for (const m of ["emira", "eletre", "emeya"]) {
        const mm = cands.filter(c => slugMatchesURL(m, `${c.url} ${c.context}`, slugVariants));
        log(`# slug-matching variant for "${m}" on press root: ${mm.length}`);
      }
    }

    // Host histogram
    const hostCount = new Map();
    for (const c of cands) {
      const h = host(c.url);
      hostCount.set(h, (hostCount.get(h) || 0) + 1);
    }
    log(`# host histogram:`);
    for (const [h, n] of [...hostCount.entries()].sort((a,b)=>b[1]-a[1])) {
      log(`#   ${n.toString().padStart(4)}  ${h}`);
    }

    // Path-token histogram (segments) for the top tokens
    const tokCount = new Map();
    for (const c of cands) {
      const segs = pathname(c.url).toLowerCase().split(/[/_\-.]+/).filter(Boolean);
      const uniq = new Set(segs);
      for (const s of uniq) {
        if (s.length < 3) continue;
        if (/^\d+$/.test(s)) continue;
        if (["jpg","jpeg","png","webp","avif","com","www"].includes(s)) continue;
        tokCount.set(s, (tokCount.get(s) || 0) + 1);
      }
    }
    const topTok = [...tokCount.entries()].sort((a,b)=>b[1]-a[1]).slice(0, 30);
    log(`# top URL-path tokens:`);
    for (const [tok, n] of topTok) log(`#   ${n.toString().padStart(4)}  ${tok}`);

    // Alt-text snippets that contain a recognisable model marker
    if (t.slug !== "_press_root") {
      const altsWithSlug = cands.filter(c => {
        const hay = ((c.url || "") + " " + (c.context || "")).toLowerCase();
        return hay.includes(t.slug);
      });
      log(`# candidates whose URL or alt contains the model slug "${t.slug}": ${altsWithSlug.length}`);
      for (const c of altsWithSlug.slice(0, 25)) {
        log(`#   URL: ${c.url}`);
        log(`#   alt: ${JSON.stringify((c.context||"").trim().slice(0, 200))}`);
        log(`#   src: ${c.source}`);
        log("");
      }
    }

    // Dump the first 40 raw candidates (representative)
    log(`# first 40 raw candidates (URL + first 100 chars of alt):`);
    for (const c of cands.slice(0, 40)) {
      log(`  - ${c.url}`);
      log(`      alt: ${JSON.stringify((c.context||"").trim().slice(0, 120))}`);
      log(`      source: ${c.source}`);
    }
    log("");
  }

  await fs.writeFile(OUT_PATH, lines.join("\n"), "utf-8");
  console.log(`\n--- wrote ${OUT_PATH} (${lines.length} lines) ---`);
}

main().catch(e => { console.error("Fatal:", e); process.exitCode = 1; });
