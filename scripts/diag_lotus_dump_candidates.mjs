#!/usr/bin/env node
// Dump every Lotus candidate (URL + alt) post-relax to debug slug-matching.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const CDN_HOST_RE = /(?:^|\.)(?:cdn|media|scene7|sitecorecontenthub|sitecore|cloudinary|imgix|contentstack|cloudfront|akamaized|akamai|wlt-p-\d+)\b/i;
const IMG_PATH_RE = /\/(?:-?\/?media|images?|imgs?|assets?|vehicles?|models?|render|hero|gallery|galleries|photos?|pictures?|content\/dam|api\/public\/content|is\/image|is\/content)(?=\/|$)/i;
const IMG_EXT_RE = /\.(jpe?g|png|webp|avif)(?:\?[^"'\s)]*)?$/i;

function isPlausibleImageURL(url) {
  try {
    const u = new URL(url);
    if (/\.svg\b/i.test(u.pathname)) return false;
    const w = u.searchParams.get("w");
    if (w && parseInt(w, 10) < 200) return false;
    if (IMG_EXT_RE.test(u.pathname)) return true;
    if (CDN_HOST_RE.test(u.hostname) && IMG_PATH_RE.test(u.pathname)) return true;
    return false;
  } catch { return false; }
}

async function dump(url) {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1280, height: 900 }, locale: "en-US" });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
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
    }).catch(() => {});
    const imgs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("img")).map(im => ({
        src: im.currentSrc || im.src || "",
        alt: ((im.alt || "") + " " + (im.title || "")).trim().slice(0, 200),
      }));
    });
    return imgs;
  } finally { await browser.close(); }
}

const pages = [
  "https://www.lotuscars.com/en-US/emira",
  "https://www.lotuscars.com/en-US/eletre",
  "https://www.lotuscars.com/en-US/emeya",
];

for (const p of pages) {
  console.log(`\n=== ${p} ===`);
  const imgs = await dump(p);
  let plausible = 0;
  for (const im of imgs) {
    const isPlausible = isPlausibleImageURL(im.src);
    if (isPlausible) {
      plausible++;
      console.log(`URL: ${im.src.slice(0, 130)}${im.src.length > 130 ? '...' : ''}`);
      console.log(`ALT: ${im.alt}`);
      console.log();
    }
  }
  console.log(`Plausible images: ${plausible} / ${imgs.length}`);
}
