#!/usr/bin/env node
// DIAGNOSTIC — JS-rendered probe of Subaru per-model pages with Playwright.
//
// Subaru's /vehicles/<model> pages render entirely client-side; a static fetch
// returns 0 image candidates. Even the rendered DOM has a twist: Subaru's CDN
// at s7d1.scene7.com/is/image/scomv2/ serves extension-less URLs (e.g.
// `26_TSK_overview_hero_lg_xl?$2000w$`). The production scraper's IMG_EXT_RE
// requirement rejects <img> tags pointing at these URLs in
// `isPlausibleImageURL`. The same URLs survive only via the <source srcset>
// path which bypasses the plausibility check (a pre-existing behavior in
// scrape_image_urls.mjs that is what gives Subaru its 416–636 raw candidates).
//
// The 3-letter brand code Subaru embeds in URLs (OBK, CTK, FOR, BRZ, WRX,
// SOL, TSK, UNC, ASC, IMP) means slug_variants for these codes is a
// prerequisite for the script's slug filter to admit candidates at all.
//
// This probe replays the production extractCandidates() + slugMatchesURL()
// on each page's rendered HTML. It overlays the 3-letter codes onto
// slug_variants so we can see what the scraper WOULD see if slug_variants
// were populated, and prints:
//   - host histogram
//   - URL-path token histogram (slug-matching only)
//   - first slug-matching candidate URLs with their alt context
//
// Writes to: reports/subaru_candidates_rendered.log

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(PROJECT_ROOT, "reports", "subaru_candidates_rendered.log");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
           "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function stripBOM(s) { return (s && s.charCodeAt(0) === 0xFEFF) ? s.slice(1) : s; }
async function readJSON(p) { return JSON.parse(stripBOM(await fs.readFile(p, "utf-8"))); }

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
    out.push({ url: abs, weight: 1 });
  }
  return out;
}
function attr(attrs, name) {
  const re = new RegExp(name + '\\s*=\\s*"([^"]*)"|' + name + "\\s*=\\s*'([^']*)'", "i");
  const m = attrs.match(re);
  return m ? (m[1] !== undefined ? m[1] : m[2]) : null;
}

// Mirrors scrape_image_urls.mjs::extractCandidates exactly, including its
// known behavior of bypassing isPlausibleImageURL for <img srcset> and
// <source srcset> entries — that's what lets the extension-less Scene7 URLs
// survive on Subaru pages.
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
  return (v || "").trim().toLowerCase().split(/[-_ ]+/).filter(Boolean).map(escapeRe).join("[-_ ]");
}
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

function pathname(u) {
  try { return new URL(u).pathname; } catch { return ""; }
}
function host(u) {
  try { return new URL(u).host; } catch { return ""; }
}

async function main() {
  const lines = [];
  const log = (s) => { lines.push(s); console.log(s); };

  const { chromium } = await import("playwright");
  const CONFIG = path.join(PROJECT_ROOT, "scripts", "brand-configs", "subaru.json");
  const cfg = await readJSON(CONFIG);
  const modelPages = cfg.model_pages || {};
  const BLACKLIST = cfg.path_blacklist_regex ? new RegExp(cfg.path_blacklist_regex, "i") : /(?!)/;

  // Overlay 3-letter Subaru codes onto the brand config's slug_variants so
  // we see the candidate set that would be visible if subaru.json had them.
  const slugVariants = { ...(cfg.slug_variants || {}) };
  const SUBARU_CODES = {
    impreza:     ["impreza",     "imp"],
    crosstrek:   ["crosstrek",   "ctk", "ctka"],
    forester:    ["forester",    "for", "fora", "forg", "forh", "forw"],
    outback:     ["outback",     "obk", "obka"],
    ascent:      ["ascent",      "asc"],
    brz:         ["brz"],
    wrx:         ["wrx"],
    solterra:    ["solterra",    "sol"],
    trailseeker: ["trailseeker", "tsk"],
    uncharted:   ["uncharted",   "unc"],
  };
  for (const [k, v] of Object.entries(SUBARU_CODES)) {
    if (!slugVariants[k] || slugVariants[k].length === 0) slugVariants[k] = v;
  }

  const TARGETS = process.argv.slice(2).filter(a => !a.startsWith("--"));
  const list = TARGETS.length ? TARGETS : ["outback", "forester", "crosstrek", "solterra", "wrx", "trailseeker"];

  log(`# Subaru rendered-DOM dump (replays production extractCandidates) — generated ${new Date().toISOString()}`);
  log(`# slug_variants overlay: ${JSON.stringify(SUBARU_CODES)}`);
  log("");

  const browser = await chromium.launch({ headless: true });
  try {
    for (const model of list) {
      const pageUrl = modelPages[model];
      if (!pageUrl) { log(`\n### ${model}: no page URL\n`); continue; }
      log(`========================================`);
      log(`### model: ${model}`);
      log(`### page:  ${pageUrl}`);
      log(`### variants: ${JSON.stringify(slugVariants[model])}`);
      log(`========================================`);
      const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1280, height: 900 }, locale: "en-US" });
      const page = await ctx.newPage();
      try {
        await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
        await Promise.race([
          page.waitForLoadState("networkidle", { timeout: 7000 }).catch(() => {}),
          new Promise(r => setTimeout(r, 7000)),
        ]);
        await page.evaluate(async () => {
          const start = Date.now();
          for (let y = 0; y < document.body.scrollHeight && Date.now() - start < 3500; y += 1000) {
            window.scrollTo(0, y);
            await new Promise(r => setTimeout(r, 120));
          }
          window.scrollTo(0, 0);
        }).catch(() => {});
        const html = await page.content();
        const cands = extractCandidates(html, pageUrl, BLACKLIST);
        // Dedupe by URL
        const seen = new Set();
        const uniq = [];
        for (const c of cands) {
          if (seen.has(c.url)) continue;
          seen.add(c.url);
          uniq.push(c);
        }
        log(`# total extracted (pre-dedupe): ${cands.length}; deduped: ${uniq.length}`);
        const srcCount = new Map();
        for (const c of cands) srcCount.set(c.source, (srcCount.get(c.source) || 0) + 1);
        log(`# by source-tag:`);
        for (const [t, n] of [...srcCount.entries()].sort((a,b)=>b[1]-a[1])) log(`#   ${n.toString().padStart(5)}  ${t}`);

        const matched = uniq.filter(c => slugMatchesURL(model, `${c.url} ${c.context}`, slugVariants).matched);
        log(`# slug-matching (variants for "${model}"): ${matched.length}`);

        const hostCount = new Map();
        for (const c of uniq) {
          const h = host(c.url);
          hostCount.set(h, (hostCount.get(h) || 0) + 1);
        }
        log(`# host histogram (all):`);
        for (const [h, n] of [...hostCount.entries()].sort((a,b)=>b[1]-a[1])) {
          log(`#   ${n.toString().padStart(4)}  ${h}`);
        }

        // Path-token histogram on slug-matching only
        const tokCount = new Map();
        for (const c of matched) {
          const segs = pathname(c.url).toLowerCase().split(/[/_\-.]+/).filter(Boolean);
          for (const s of new Set(segs)) {
            if (s.length < 3) continue;
            if (/^\d+$/.test(s)) continue;
            if (["jpg","jpeg","png","webp","avif","com","www"].includes(s)) continue;
            tokCount.set(s, (tokCount.get(s) || 0) + 1);
          }
        }
        const topTok = [...tokCount.entries()].sort((a,b)=>b[1]-a[1]).slice(0, 40);
        log(`# top URL-path tokens (slug-matching only):`);
        for (const [tok, n] of topTok) log(`#   ${n.toString().padStart(4)}  ${tok}`);

        log(`\n# first 50 slug-matching candidate URLs (deduped by URL stem):`);
        const seenStem = new Set();
        let shown = 0;
        for (const c of matched) {
          const stem = c.url.replace(/\?.*$/, "");
          if (seenStem.has(stem)) continue;
          seenStem.add(stem);
          log(`  ${stem}`);
          if (c.context) log(`      alt: ${JSON.stringify(c.context.trim().slice(0, 200))}`);
          log(`      source: ${c.source}`);
          if (++shown >= 50) break;
        }
        log("");
      } catch (e) {
        log(`ERROR: ${e.message}`);
      } finally {
        await page.close().catch(()=>{});
        await ctx.close().catch(()=>{});
      }
    }
  } finally {
    await browser.close().catch(()=>{});
  }

  await fs.writeFile(OUT_PATH, lines.join("\n"), "utf-8");
  console.log(`\n--- wrote ${OUT_PATH} (${lines.length} lines) ---`);
}

main().catch(e => { console.error("Fatal:", e); process.exitCode = 1; });
