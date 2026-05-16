#!/usr/bin/env node
// Phase A Session 10 verbose diagnostic.
// Replicates the production scraper's extraction + filter + match pipeline,
// then dumps:
//   - total raw candidates,
//   - slug-matching candidates,
//   - per-angle: best-match score + URL,
//   - slug-matching candidates that DID NOT match any angle (the gap pool).
//
// Usage:
//   node scripts/diag_phase_a_session10.mjs --brand <slug> [--model <slug>]
//   --model is optional; defaults to running across ALL configured model_pages
//   for the brand, limited to first 3 pages for verbosity manageability.
//
// Reads the brand's brand-config + the same regexes/patterns/blacklists/CDN
// gates the production scraper uses. NO side effects (read-only).

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function stripBOM(s) { return (s && s.charCodeAt(0) === 0xFEFF) ? s.slice(1) : s; }
async function readJSON(p) { return JSON.parse(stripBOM(await fs.readFile(p, "utf-8"))); }

async function fetchHTML(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html,*/*" }, redirect: "follow" });
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true, html: await res.text(), finalUrl: res.url };
}

// COPY from scrape_image_urls.mjs — keep behaviour identical for diagnosis fidelity.
const IMG_EXT_RE = /\.(jpe?g|png|webp|avif)(?:\?[^"'\s)]*)?$/i;
const CDN_HOST_RE = /(?:^|\.)(?:cdn|media|scene7|sitecorecontenthub|sitecore|cloudinary|imgix|contentstack|cloudfront|akamaized|akamai|wlt-p-\d+)\b/i;
const IMG_PATH_RE = /\/(?:-?\/?media|images?|imgs?|assets?|vehicles?|models?|render|hero|gallery|galleries|photos?|pictures?|content\/dam|api\/public\/content|is\/image|is\/content)(?=\/|$)/i;
const DEFAULT_BLACKLIST = /(?:Promo-Banner|Global-Nav|VehicleCards|Vehicle-Selector|Future-Vehicles|nav[/_-]?jelly|All-Vehicles\/|favicon|sprite|icon|logo|seal|emblem|swatch|color-?swatch)/i;

function isPlausibleImageURL(url, blacklist) {
  try {
    const u = new URL(url);
    const full = u.pathname + (u.search || "");
    if (/\.svg\b/i.test(u.pathname)) return false;
    if (blacklist.test(full)) return false;
    const w = u.searchParams.get("w");
    if (w && parseInt(w, 10) < 200) return false;
    if (IMG_EXT_RE.test(u.pathname)) return true;
    if (CDN_HOST_RE.test(u.hostname) && IMG_PATH_RE.test(u.pathname)) return true;
    return false;
  } catch { return false; }
}

function resolveURL(maybeRelative, base) { try { return new URL(maybeRelative, base).href; } catch { return null; } }
function htmlDecode(s) { return s.replace(/&amp;/g, "&").replace(/&#x2F;/gi, "/").replace(/&quot;/g, '"'); }
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
  // Match Session 9 HTML-entity-decode pre-step.
  html = html.replace(/&#34;/g, '"').replace(/&#39;/g, "'");

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
  const cdnRe = /["'](\/(?:-\/media|content\/dam|us\/content\/dam)\/[^"'\s]+?\.(?:jpe?g|png|webp|avif)(?:\?[^"'\s]*)?)["']/gi;
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

const ANGLE_PATTERNS = {
  front_three_quarter: [
    { re: /front[-_ ]?(?:three[-_ ]?quarter|3[-_ ]?4|3q|34)/i, score: 14 },
    { re: /\bf34\b|\bf3q\b|\b3q[-_ ]?front\b/i, score: 12 },
    { re: /exterior[-_ ]?front|front[-_ ]?exterior/i, score: 9 },
    { re: /front[-_ ]?angle|front[-_ ]?view/i, score: 8 },
    { re: /(?:^|[-_/ ])front(?:[-_ ]|$|\.)/i, score: 7 },
  ],
  rear_three_quarter: [
    { re: /rear[-_ ]?(?:three[-_ ]?quarter|3[-_ ]?4|3q|34)/i, score: 14 },
    { re: /\br34\b|\br3q\b|\b3q[-_ ]?rear\b/i, score: 12 },
    { re: /exterior[-_ ]?rear|rear[-_ ]?exterior/i, score: 9 },
    { re: /rear[-_ ]?angle|rear[-_ ]?view/i, score: 8 },
    { re: /(?:^|[-_/ ])rear(?:[-_ ]|$|\.)/i, score: 7 },
    { re: /(?:^|[-_/])back(?:[-_]|$|\.)/i, score: 5 },
  ],
  side_profile: [
    { re: /side[-_ ]?profile|profile[-_ ]?side/i, score: 14 },
    { re: /\bprofile\b/i, score: 9 },
    { re: /(?:^|[-_/ ])side(?:[-_ ]|$|\.)/i, score: 7 },
  ],
  interior_dashboard: [
    { re: /interior[-_ ]?dashboard|dashboard[-_ ]?interior/i, score: 14 },
    { re: /\bdashboard\b/i, score: 12 },
    { re: /\bcenter[-_ ]?console\b/i, score: 11 },
    { re: /\bcockpit\b/i, score: 10 },
    { re: /\bcabin\b/i, score: 8 },
    { re: /\binterior\b/i, score: 7 },
  ],
};
function angleScore(angle, url, context) {
  const hay = (url + " " + context).toLowerCase();
  let s = 0, matched = false;
  for (const { re, score } of ANGLE_PATTERNS[angle]) {
    if (re.test(hay)) { s += score; matched = true; }
  }
  return { matched, score: s };
}
function brandAngleScore(angle, url, context, brandAnglePatterns) {
  if (!brandAnglePatterns) return null;
  const list = brandAnglePatterns[angle];
  if (!list || list.length === 0) return null;
  const hay = (url + " " + context).toLowerCase();
  for (const re of list) { if (re.test(hay)) return { matched: true, score: 6 }; }
  return { matched: false, score: 0 };
}

function compileBrandAnglePatterns(cfg) {
  if (!cfg.angle_url_patterns) return null;
  const out = {};
  for (const [angle, list] of Object.entries(cfg.angle_url_patterns)) {
    if (!Array.isArray(list)) continue;
    const compiled = list.map(p => new RegExp(p, "i"));
    out[angle] = compiled;
  }
  return Object.keys(out).length ? out : null;
}

/* --- DIAGNOSTIC SCRIPT MAIN --- */
function parseArgs(argv) {
  const args = { brand: null, model: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--brand") args.brand = argv[++i];
    else if (argv[i] === "--model") args.model = argv[++i];
    else if (argv[i] === "--limit") args.limit = parseInt(argv[++i], 10);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.brand) { console.error("Usage: --brand <slug> [--model <slug>] [--limit N]"); process.exit(2); }

  const CFG = path.join(PROJECT_ROOT, "scripts", "brand-configs", `${args.brand}.json`);
  const DATA = path.join(PROJECT_ROOT, "catalog", "data", `${args.brand}.json`);
  const cfg = await readJSON(CFG);
  const cat = await readJSON(DATA);
  const slugVariants = cfg.slug_variants || {};
  const blacklist = cfg.path_blacklist_regex ? new RegExp(cfg.path_blacklist_regex, "i") : DEFAULT_BLACKLIST;
  const brandAnglePatterns = compileBrandAnglePatterns(cfg);

  const ANGLES = ["front_three_quarter", "rear_three_quarter", "side_profile", "interior_dashboard"];

  // Reverse-map: pageUrl -> [model_slugs]
  const pageToModels = new Map();
  for (const m of cat.models) {
    const u = cfg.model_pages[m.model_slug];
    if (!u) continue;
    if (args.model && m.model_slug !== args.model) continue;
    if (!pageToModels.has(u)) pageToModels.set(u, []);
    pageToModels.get(u).push(m.model_slug);
  }

  let pageList = [...pageToModels.entries()];
  const limit = args.limit || (args.model ? pageList.length : 3);
  pageList = pageList.slice(0, limit);

  for (const [pageUrl, modelSlugs] of pageList) {
    console.log(`\n========================================`);
    console.log(`PAGE: ${pageUrl}`);
    console.log(`MODELS: ${modelSlugs.join(", ")}`);
    console.log(`========================================`);

    const r = await fetchHTML(pageUrl);
    if (!r.ok) { console.log(`  FETCH FAIL: ${r.status || r.error}`); continue; }

    const cands = extractCandidates(r.html, r.finalUrl, blacklist);
    console.log(`  Total raw candidates (post-isPlausible): ${cands.length}`);

    // Count by source (img/og/preload/etc) — quick distribution
    const byContextHint = new Map();
    for (const c of cands) {
      let hint = "img";
      if (c.context && c.context.startsWith("og:image")) hint = "og";
      else if (c.context && c.context.startsWith("preload")) hint = "preload";
      else if (c.context && c.context.startsWith("background")) hint = "bg";
      else if (c.context && c.context.startsWith("naked")) hint = "naked";
      else if (c.context && c.context.startsWith("cdn-rel")) hint = "cdn-rel";
      byContextHint.set(hint, (byContextHint.get(hint) || 0) + 1);
    }
    console.log(`  By context hint: ${[...byContextHint.entries()].map(([k, v]) => `${k}:${v}`).join(" ")}`);

    for (const slug of modelSlugs) {
      console.log(`\n  --- MODEL: ${slug} ---`);
      const variants = slugVariants[slug] || [slug];
      console.log(`  slug variants: ${variants.join(", ")}`);

      // 1. Slug-matching candidates
      const slugMatching = cands.filter(c =>
        slugMatchesURL(slug, `${c.url} ${c.context || ""}`, slugVariants));
      console.log(`  slug-matching: ${slugMatching.length}`);

      // 2. Of slug-matching, which match each angle (with brand patterns)
      const angleHits = {};
      const angleMatched = new Set();
      for (const angle of ANGLES) {
        let best = null, bestScore = -Infinity;
        for (const c of slugMatching) {
          const r = angleScore(angle, c.url, c.context);
          if (r.matched && r.score > bestScore) { best = c; bestScore = r.score; }
        }
        // Fall back to brand pattern
        if (!best && brandAnglePatterns) {
          for (const c of slugMatching) {
            const r = brandAngleScore(angle, c.url, c.context, brandAnglePatterns);
            if (r && r.matched && r.score > bestScore) { best = c; bestScore = r.score; }
          }
        }
        if (best) {
          angleHits[angle] = { score: bestScore, url: best.url, alt: (best.context || "").slice(0, 80) };
          angleMatched.add(best.url);
        }
      }
      console.log(`  angle hits:`);
      for (const angle of ANGLES) {
        const h = angleHits[angle];
        if (h) console.log(`    ${angle.padEnd(20)} [${h.score}] ${shortUrl(h.url)}\n        alt: "${h.alt}"`);
        else   console.log(`    ${angle.padEnd(20)} (no match)`);
      }

      // 3. Slug-matching but NO angle match: the gap pool
      const gap = [];
      for (const c of slugMatching) {
        let matched = false;
        for (const angle of ANGLES) {
          if (angleScore(angle, c.url, c.context).matched) { matched = true; break; }
          if (brandAnglePatterns) {
            const br = brandAngleScore(angle, c.url, c.context, brandAnglePatterns);
            if (br && br.matched) { matched = true; break; }
          }
        }
        if (!matched) gap.push(c);
      }
      console.log(`  slug-matching but NO angle match (gap pool): ${gap.length}`);
      const seenG = new Set();
      const gapUnique = gap.filter(c => { if (seenG.has(c.url)) return false; seenG.add(c.url); return true; });
      const showG = gapUnique.slice(0, Math.min(gapUnique.length, 12));
      for (const c of showG) {
        console.log(`    ${shortUrl(c.url)}`);
        if (c.context && c.context.trim()) console.log(`      alt: "${c.context.trim().slice(0, 100)}"`);
      }
      if (gapUnique.length > showG.length) console.log(`    ... and ${gapUnique.length - showG.length} more`);
    }
  }
}

function shortUrl(u) {
  try {
    const x = new URL(u);
    return x.pathname + (x.search || "");
  } catch { return u; }
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
