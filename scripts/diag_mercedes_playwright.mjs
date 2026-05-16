#!/usr/bin/env node
// Probe Mercedes JS-rendered pages with Playwright to see what candidates surface.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

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
  const { chromium } = await import("playwright");
  const CONFIG = path.join(PROJECT_ROOT, "scripts", "brand-configs", "mercedes-benz.json");
  const cfg = await readJSON(CONFIG);
  const blacklist = cfg.path_blacklist_regex ? new RegExp(cfg.path_blacklist_regex, "i") : /.^/;
  const slugVariants = cfg.slug_variants || {};
  const modelPages = cfg.model_pages || {};

  const TARGETS = process.argv.slice(2).filter(a => !a.startsWith("--"));
  const list = TARGETS.length ? TARGETS : ["sl-roadster", "gla-suv", "glb-suv", "amg-gt-coupe", "eqe-sedan", "eqs-sedan", "maybach-s-class", "maybach-gls", "maybach-eqs-suv"];

  const browser = await chromium.launch({ headless: true });
  try {
    for (const model of list) {
      const pageUrl = modelPages[model];
      if (!pageUrl) { console.log(`\n### ${model}: no page URL\n`); continue; }
      console.log(`\n========================================`);
      console.log(`### model: ${model}`);
      console.log(`### page:  ${pageUrl}`);
      console.log(`### variants: ${JSON.stringify(slugVariants[model] || [model])}`);
      console.log(`========================================`);
      const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1280, height: 900 }, locale: "en-US" });
      const page = await ctx.newPage();
      try {
        await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
        await Promise.race([
          page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {}),
          new Promise(r => setTimeout(r, 5000)),
        ]);
        await page.evaluate(async () => {
          const start = Date.now();
          for (let y = 0; y < document.body.scrollHeight && Date.now() - start < 2500; y += 1000) {
            window.scrollTo(0, y);
            await new Promise(r => setTimeout(r, 100));
          }
          window.scrollTo(0, 0);
        }).catch(() => {});
        const imgs = await page.evaluate(() => {
          const out = [];
          for (const im of document.querySelectorAll("img")) {
            out.push({
              src: im.currentSrc || im.src || "",
              alt: ((im.alt || "") + " " + (im.title || "")).trim().slice(0, 200),
            });
          }
          return out;
        });
        console.log(`Total DOM <img> after render+scroll: ${imgs.length}`);
        const seen = new Set();
        let plausible = 0, matched = 0, missed = 0;
        for (const im of imgs) {
          try {
            const u = new URL(im.src, page.url()).href;
            if (seen.has(u)) continue;
            seen.add(u);
            if (!isPlausibleImageURL(u, blacklist)) continue;
            plausible++;
            const m = slugMatchesURL(model, `${u} ${im.alt}`, slugVariants);
            if (m.matched) {
              matched++;
              console.log(`MATCH[${m.variant}]: ${u}`);
              console.log(`    alt: ${im.alt.slice(0, 200)}`);
            } else {
              missed++;
              console.log(`MISS: ${u}`);
              console.log(`    alt: ${im.alt.slice(0, 200)}`);
            }
          } catch {}
        }
        console.log(`\nSUMMARY for ${model}: plausible=${plausible}, matched=${matched}, missed=${missed}`);
      } catch (e) {
        console.log(`ERROR: ${e.message}`);
      } finally {
        await page.close().catch(()=>{});
        await ctx.close().catch(()=>{});
      }
    }
  } finally {
    await browser.close().catch(()=>{});
  }
}

main().catch(e => { console.error("Fatal:", e); process.exitCode = 1; });
