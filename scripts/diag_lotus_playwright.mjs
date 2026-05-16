#!/usr/bin/env node
// Probe lotus JS-rendered pages with Playwright to see what candidates surface.
// Mirrors scripts/diag_mercedes_playwright.mjs.
//
// Static diag (scripts/diag_lotus_candidates.mjs) confirmed 0 raw candidates on
// all 3 consumer pages and all 6 press-gallery URL variants — but the static
// HTML is 225-440 KB, so the pages ARE returning content; the imagery is JS-
// hydrated. This script renders each page in headless Chromium, waits for
// network-idle, performs a bounded scroll, then dumps every <img> in the DOM.
//
// Logs to: reports/lotus_playwright_raw.log

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(PROJECT_ROOT, "reports", "lotus_playwright_raw.log");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
           "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const TARGETS = [
  { slug: "emira",  url: "https://www.lotuscars.com/en-US/emira",  source: "consumer" },
  { slug: "eletre", url: "https://www.lotuscars.com/en-US/eletre", source: "consumer" },
  { slug: "emeya",  url: "https://www.lotuscars.com/en-US/emeya",  source: "consumer" },
  { slug: "emira",  url: "https://www.lotuscars.com/en/press/galleries/emira",   source: "press-en" },
  { slug: "eletre", url: "https://www.lotuscars.com/en/press/galleries/eletre",  source: "press-en" },
  { slug: "emeya",  url: "https://www.lotuscars.com/en/press/galleries/emeya",   source: "press-en" },
];

const IMG_EXT_RE = /\.(jpe?g|png|webp|avif)(?:\?[^"'\s)]*)?$/i;
const BLACKLIST = /(?:Promo-Banner|Global-Nav|nav[/_-]?jelly|favicon|sprite|icon|logo|placeholder|preview-thumb)/i;

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
    if (re.test(hay)) return { matched: true, variant: v };
  }
  return { matched: false };
}

async function readBrandConfig() {
  const raw = await fs.readFile(path.join(PROJECT_ROOT, "scripts", "brand-configs", "lotus.json"), "utf-8");
  return JSON.parse(raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw);
}

function host(u) { try { return new URL(u).host; } catch { return ""; } }
function pathnameOf(u) { try { return new URL(u).pathname; } catch { return ""; } }

async function main() {
  const lines = [];
  const log = (s) => { lines.push(s); console.log(s); };

  const { chromium } = await import("playwright");
  const cfg = await readBrandConfig();
  const slugVariants = cfg.slug_variants || {};

  log(`# Lotus Playwright dump — generated ${new Date().toISOString()}`);
  log("");

  const browser = await chromium.launch({ headless: true });
  try {
    for (const t of TARGETS) {
      log(`========================================================================`);
      log(`# MODEL: ${t.slug}    (source: ${t.source})`);
      log(`# URL:   ${t.url}`);
      log(`# variants: ${JSON.stringify(slugVariants[t.slug] || [t.slug])}`);
      log(`========================================================================`);

      const ctx = await browser.newContext({
        userAgent: UA,
        viewport: { width: 1280, height: 900 },
        locale: "en-US",
      });
      const page = await ctx.newPage();
      // Capture network responses too — sometimes a CDN ships image bytes that
      // never make it into <img> tags within the page lifetime we observe.
      const networkImageUrls = new Set();
      page.on("response", (resp) => {
        try {
          const u = resp.url();
          const ct = (resp.headers()["content-type"] || "").toLowerCase();
          if (ct.startsWith("image/") || IMG_EXT_RE.test(u)) networkImageUrls.add(u);
        } catch {}
      });
      try {
        await page.goto(t.url, { waitUntil: "domcontentloaded", timeout: 25000 });
        await Promise.race([
          page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {}),
          new Promise(r => setTimeout(r, 8000)),
        ]);
        // Bigger / longer scroll than production — we want EVERY lazy-loaded shot.
        await page.evaluate(async () => {
          const start = Date.now();
          for (let y = 0; y < document.body.scrollHeight && Date.now() - start < 6000; y += 800) {
            window.scrollTo(0, y);
            await new Promise(r => setTimeout(r, 200));
          }
          window.scrollTo(0, 0);
          await new Promise(r => setTimeout(r, 500));
        }).catch(() => {});
        // Extra settle.
        await Promise.race([
          page.waitForLoadState("networkidle", { timeout: 4000 }).catch(() => {}),
          new Promise(r => setTimeout(r, 4000)),
        ]);

        const finalUrl = page.url();
        log(`# finalUrl: ${finalUrl}`);

        const imgs = await page.evaluate(() => {
          const out = [];
          for (const im of document.querySelectorAll("img")) {
            const r = im.getBoundingClientRect();
            out.push({
              src: im.currentSrc || im.src || "",
              srcset: im.getAttribute("srcset") || "",
              alt: ((im.alt || "") + " " + (im.title || "")).trim().slice(0, 200),
              w: im.naturalWidth || 0,
              h: im.naturalHeight || 0,
              docY: Math.round(r.top + window.scrollY),
              visible: r.width > 2 && r.height > 2,
            });
          }
          // Also dump anything with a background-image inline style
          for (const el of document.querySelectorAll('[style*="background-image"]')) {
            const m = (el.getAttribute("style") || "").match(/background-image\s*:\s*url\(["']?([^)"']+)["']?\)/i);
            if (m) out.push({ src: m[1], alt: ((el.getAttribute("aria-label") || "") + " " + (el.getAttribute("title") || "")).trim().slice(0, 200), w: 0, h: 0, docY: 0, visible: true, source: "bg" });
          }
          return out;
        });

        log(`# Total DOM img/bg entries: ${imgs.length}`);
        log(`# Network image URLs observed (content-type image/*): ${networkImageUrls.size}`);

        // Filter to plausible
        const seen = new Set();
        const plausible = [];
        for (const im of imgs) {
          try {
            const u = new URL(im.src, finalUrl).href;
            if (seen.has(u)) continue;
            seen.add(u);
            if (!isPlausibleImageURL(u, BLACKLIST)) continue;
            plausible.push({ url: u, ...im });
          } catch {}
        }
        // Add network-captured images that didn't show in DOM
        for (const nu of networkImageUrls) {
          if (seen.has(nu)) continue;
          if (!isPlausibleImageURL(nu, BLACKLIST)) continue;
          seen.add(nu);
          plausible.push({ url: nu, alt: "", w: 0, h: 0, docY: 0, visible: true, source: "network" });
        }
        log(`# plausible image candidates (post-filter): ${plausible.length}`);

        // Slug match
        const matched = plausible.filter(c => slugMatchesURL(t.slug, `${c.url} ${c.alt}`, slugVariants).matched);
        log(`# slug-matching (variant for "${t.slug}"): ${matched.length}`);

        // Host histogram
        const hostCount = new Map();
        for (const c of plausible) hostCount.set(host(c.url), (hostCount.get(host(c.url)) || 0) + 1);
        log(`# host histogram:`);
        for (const [h, n] of [...hostCount.entries()].sort((a,b)=>b[1]-a[1])) log(`#   ${n.toString().padStart(4)}  ${h}`);

        // Path-token histogram
        const tokCount = new Map();
        for (const c of plausible) {
          const segs = pathnameOf(c.url).toLowerCase().split(/[/_\-.]+/).filter(Boolean);
          const uniq = new Set(segs);
          for (const s of uniq) {
            if (s.length < 3) continue;
            if (/^\d+$/.test(s)) continue;
            if (["jpg","jpeg","png","webp","avif","com","www"].includes(s)) continue;
            tokCount.set(s, (tokCount.get(s) || 0) + 1);
          }
        }
        const topTok = [...tokCount.entries()].sort((a,b)=>b[1]-a[1]).slice(0, 40);
        log(`# top URL-path tokens:`);
        for (const [tok, n] of topTok) log(`#   ${n.toString().padStart(4)}  ${tok}`);

        // First 40 plausible candidates
        log(`# first 40 plausible candidates:`);
        for (const c of plausible.slice(0, 40)) {
          log(`  - ${c.url}`);
          log(`      alt: ${JSON.stringify((c.alt||"").trim().slice(0, 160))}`);
          log(`      w=${c.w} h=${c.h} docY=${c.docY} visible=${c.visible} src=${c.source || ""}`);
        }
        // If matched, dump every match with full alt
        if (matched.length) {
          log(`# all slug-matched candidates:`);
          for (const c of matched.slice(0, 60)) {
            log(`  - ${c.url}`);
            log(`      alt: ${JSON.stringify((c.alt||"").trim().slice(0, 200))}`);
            log(`      w=${c.w} h=${c.h}`);
          }
        }
      } catch (e) {
        log(`ERROR: ${e.message}`);
      } finally {
        await page.close().catch(()=>{});
        await ctx.close().catch(()=>{});
      }
      log("");
    }
  } finally {
    await browser.close().catch(()=>{});
  }

  await fs.writeFile(OUT_PATH, lines.join("\n"), "utf-8");
  console.log(`\n--- wrote ${OUT_PATH} ---`);
}

main().catch(e => { console.error("Fatal:", e); process.exitCode = 1; });
