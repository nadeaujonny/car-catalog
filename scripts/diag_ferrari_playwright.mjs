#!/usr/bin/env node
// DIAGNOSTIC — render Ferrari model pages via headless Chromium and dump
// the same kinds of candidate / token information as
// scripts/diag_ferrari_candidates.mjs (which is static-fetch only).
//
// Per Session 5/6 evidence ferrari.com is JS-rendered and 10 of 11 Playwright
// escalations returned 0 candidates. We're verifying that finding for
// Session 7 and looking for any tokens/alt patterns we can leverage in
// `angle_url_patterns` if the rendered DOM does surface model imagery.
//
// Output: reports/ferrari_candidates_playwright.log
//
// Mirrors the production scraper's Playwright path
//   (fetchHTMLWithPlaywright in scripts/scrape_image_urls.mjs):
//   - UA / viewport / locale identical
//   - waitUntil domcontentloaded, then race(networkidle 5s, timeout 5s)
//   - bounded scroll to trigger lazy-loaded images
//   - extracts <img> currentSrc / src / alt / title PLUS runs the same
//     HTML regex extractor against page.content()

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(PROJECT_ROOT, "reports", "ferrari_candidates_playwright.log");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
           "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const TARGETS = [
  { slug: "roma-spider", url: "https://www.ferrari.com/en-EN/auto/ferrari-roma-spider" },
  { slug: "amalfi",      url: "https://www.ferrari.com/en-EN/auto/ferrari-amalfi" },
  { slug: "296-gtb",     url: "https://www.ferrari.com/en-EN/auto/296-gtb" },
  { slug: "12cilindri",  url: "https://www.ferrari.com/en-EN/auto/ferrari-12cilindri" },
  { slug: "purosangue",  url: "https://www.ferrari.com/en-EN/auto/ferrari-purosangue" },
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

function host(u) { try { return new URL(u).host; } catch { return ""; } }
function pathname(u) { try { return new URL(u).pathname; } catch { return ""; } }

async function readBrandSlugVariants() {
  const cfgPath = path.join(PROJECT_ROOT, "scripts", "brand-configs", "ferrari.json");
  const raw = await fs.readFile(cfgPath, "utf-8");
  const cfg = JSON.parse(raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw);
  return cfg.slug_variants || {};
}

async function main() {
  const lines = [];
  const log = (s) => { lines.push(s); console.log(s); };

  const slugVariants = await readBrandSlugVariants();
  log(`# Ferrari candidate dump (PLAYWRIGHT) — generated ${new Date().toISOString()}`);
  log(`# Loaded slug_variants for: ${Object.keys(slugVariants).join(", ")}`);
  log("");

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });

  try {
    for (const t of TARGETS) {
      log(`========================================================================`);
      log(`# MODEL: ${t.slug}`);
      log(`# URL:   ${t.url}`);
      log(`# variants: ${JSON.stringify(slugVariants[t.slug] || [t.slug])}`);
      log(`========================================================================`);

      const ctx = await browser.newContext({
        userAgent: UA,
        viewport: { width: 1280, height: 900 },
        locale: "en-US",
      });
      const page = await ctx.newPage();
      try {
        await page.goto(t.url, { waitUntil: "domcontentloaded", timeout: 20000 });
        await Promise.race([
          page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {}),
          new Promise(r => setTimeout(r, 5000)),
        ]);
        await page.evaluate(async () => {
          const start = Date.now();
          const step = 1000;
          for (let y = 0; y < document.body.scrollHeight && Date.now() - start < 2500; y += step) {
            window.scrollTo(0, y);
            await new Promise(r => setTimeout(r, 100));
          }
          window.scrollTo(0, 0);
        }).catch(() => {});

        const html = await page.content();
        const finalUrl = page.url();
        log(`# finalUrl: ${finalUrl}`);
        log(`# html bytes (rendered): ${html.length}`);

        // 1) Raw DOM <img> count — Mercedes pattern
        const domImages = await page.evaluate(() => {
          const out = [];
          for (const im of document.querySelectorAll("img")) {
            const r = im.getBoundingClientRect();
            const cs = getComputedStyle(im);
            out.push({
              src: im.currentSrc || im.src || "",
              alt: ((im.alt || "") + " " + (im.title || "")).trim().slice(0, 200),
              width: Math.round(r.width),
              height: Math.round(r.height),
              natW: im.naturalWidth || 0,
              natH: im.naturalHeight || 0,
              visible: cs.display !== "none" && cs.visibility !== "hidden" && r.width > 2 && r.height > 2,
            });
          }
          return out;
        }).catch(() => []);
        log(`# total DOM <img> after render+scroll: ${domImages.length}`);
        const visibleImgs = domImages.filter(d => d.visible);
        log(`# visible DOM <img>: ${visibleImgs.length}`);
        const visiblePlausible = visibleImgs.filter(d => {
          const abs = resolveURL(d.src, finalUrl);
          return abs && isPlausibleImageURL(abs, BLACKLIST);
        });
        log(`# visible+plausible DOM <img>: ${visiblePlausible.length}`);

        // 2) Run the production regex extractor against the rendered HTML.
        const candsFromHTML = uniqueByUrl(extractCandidates(html, finalUrl, BLACKLIST));
        log(`# candidates from extractCandidates(rendered HTML): ${candsFromHTML.length}`);

        // Also derive a "from DOM <img>" candidate list (mimics what
        // attachPositional appends for visible imgs the regex extractor missed).
        const domDerived = [];
        const seenURL = new Set();
        for (const d of domImages) {
          const abs = resolveURL(d.src, finalUrl);
          if (!abs) continue;
          if (!isPlausibleImageURL(abs, BLACKLIST)) continue;
          if (seenURL.has(abs)) continue;
          seenURL.add(abs);
          domDerived.push({ url: abs, weight: 1, context: d.alt, source: "dom-img" });
        }
        log(`# candidates derived from DOM <img> walk (deduped): ${domDerived.length}`);

        // Union — what the production scraper effectively sees.
        const unionMap = new Map();
        for (const c of candsFromHTML) unionMap.set(c.url, c);
        for (const c of domDerived) if (!unionMap.has(c.url)) unionMap.set(c.url, c);
        const union = [...unionMap.values()];
        log(`# union (HTML-regex + DOM-walk): ${union.length}`);

        // Slug-match count
        const matched = union.filter(c =>
          slugMatchesURL(t.slug, `${c.url} ${c.context}`, slugVariants));
        log(`# slug-matching union candidates: ${matched.length}`);

        // Host histogram
        const hostCount = new Map();
        for (const c of union) {
          const h = host(c.url);
          hostCount.set(h, (hostCount.get(h) || 0) + 1);
        }
        log(`# host histogram (union):`);
        for (const [h, n] of [...hostCount.entries()].sort((a,b)=>b[1]-a[1])) {
          log(`#   ${n.toString().padStart(4)}  ${h}`);
        }

        // Path-token histogram
        const tokCount = new Map();
        for (const c of union) {
          const segs = pathname(c.url).toLowerCase().split(/[/_\-.]+/).filter(Boolean);
          const uniq = new Set(segs);
          for (const s of uniq) {
            if (s.length < 3) continue;
            if (/^\d+$/.test(s)) continue;
            if (["jpg","jpeg","png","webp","avif","com","www"].includes(s)) continue;
            tokCount.set(s, (tokCount.get(s) || 0) + 1);
          }
        }
        const topTok = [...tokCount.entries()].sort((a,b)=>b[1]-a[1]).slice(0, 40);
        log(`# top URL-path tokens (union):`);
        for (const [tok, n] of topTok) log(`#   ${n.toString().padStart(4)}  ${tok}`);

        // Candidates whose URL or alt contains the model slug bareword
        const slug = t.slug.toLowerCase();
        const altsWithSlug = union.filter(c => {
          const hay = ((c.url || "") + " " + (c.context || "")).toLowerCase();
          if (hay.includes(slug)) return true;
          if (hay.includes(slug.replace(/-/g, ""))) return true;
          return false;
        });
        log(`# candidates whose URL or alt contains the model name: ${altsWithSlug.length}`);
        for (const c of altsWithSlug.slice(0, 30)) {
          log(`#   URL: ${c.url}`);
          log(`#   alt: ${JSON.stringify((c.context||"").trim().slice(0, 180))}`);
          log(`#   src: ${c.source}`);
          log("");
        }

        // First 40 union candidates with URL + alt + source
        log(`# first 40 union candidates (URL + first 120 chars of alt + source):`);
        for (const c of union.slice(0, 40)) {
          log(`  - ${c.url}`);
          log(`      alt: ${JSON.stringify((c.context||"").trim().slice(0, 120))}`);
          log(`      source: ${c.source}`);
        }
        log("");

        // Cross-model name mentions
        const allModelNames = ["roma","amalfi","296","12cilindri","testarossa","purosangue","f80","sf90","gtb","gts","speciale"];
        const altMentions = new Map();
        for (const c of union) {
          const hay = ((c.url || "") + " " + (c.context || "")).toLowerCase();
          for (const name of allModelNames) {
            if (hay.includes(name)) altMentions.set(name, (altMentions.get(name) || 0) + 1);
          }
        }
        log(`# any-model-name mentions on this page (union URL+alt):`);
        for (const [name, n] of [...altMentions.entries()].sort((a,b)=>b[1]-a[1])) {
          log(`#   ${n.toString().padStart(4)}  ${name}`);
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
