// End-to-end Lotus diagnostic: simulate the production scrape's flow on the
// Emira page and report per-candidate slug-match + angle-match status.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Mirror the script's filters
const IMG_EXT_RE = /\.(jpe?g|png|webp|avif)(?:\?[^"'\s)]*)?$/i;
const CDN_HOST_RE = /(?:^|\.)(?:cdn|media|scene7|sitecorecontenthub|sitecore|cloudinary|imgix|contentstack|cloudfront|akamaized|akamai|wlt-p-\d+)\b/i;
const IMG_PATH_RE = /\/(?:-?\/?media|images?|imgs?|assets?|vehicles?|models?|render|hero|gallery|galleries|photos?|pictures?|content\/dam|api\/public\/content|is\/image|is\/content)(?=\/|$)/i;

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

function variantToRegexFragment(v) {
  return (v || "").trim().toLowerCase()
    .split(/[-_ ]+/).filter(Boolean)
    .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[-_ ]");
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

const cfg = JSON.parse(await fs.readFile(path.join(PROJECT_ROOT, "scripts/brand-configs/lotus.json"), "utf-8"));
const blacklist = new RegExp(cfg.path_blacklist_regex, "i");

const targets = [
  { slug: "emira", url: "https://www.lotuscars.com/en-US/emira" },
  { slug: "eletre", url: "https://www.lotuscars.com/en-US/eletre" },
  { slug: "emeya", url: "https://www.lotuscars.com/en-US/emeya" },
];

const { chromium } = await import("playwright");
const browser = await chromium.launch({ headless: true });

for (const { slug, url } of targets) {
  console.log("\n=== " + slug.toUpperCase() + " (" + url + ") ===");
  const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1280, height: 900 }, locale: "en-US" });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await Promise.race([
      page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {}),
      new Promise(r => setTimeout(r, 5000)),
    ]);
    // More aggressive scroll: cap at 8s and go to deepest scroll position
    await page.evaluate(async () => {
      const start = Date.now();
      while (Date.now() - start < 8000) {
        const y = window.scrollY;
        window.scrollBy(0, 800);
        await new Promise(r => setTimeout(r, 200));
        if (window.scrollY === y) break;
      }
      window.scrollTo(0, 0);
      await new Promise(r => setTimeout(r, 500));
    }).catch(() => {});
    const imgs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("img")).map(im => ({
        src: im.currentSrc || im.src || "",
        alt: ((im.alt || "") + " " + (im.title || "")).trim().slice(0, 200),
      }));
    });

    let total = 0, plausible = 0, slugMatch = 0;
    const matched = [];
    for (const im of imgs) {
      total++;
      if (!isPlausibleImageURL(im.src, blacklist)) continue;
      plausible++;
      const hay = `${im.src} ${im.alt}`;
      if (!slugMatchesURL(slug, hay, cfg.slug_variants)) continue;
      slugMatch++;
      const angles = ["front_three_quarter", "rear_three_quarter", "side_profile", "interior_dashboard"]
        .map(a => ({ a, m: angleScore(a, im.src, im.alt) }))
        .filter(x => x.m.matched);
      matched.push({ url: im.src.slice(0, 100), alt: im.alt, angles });
    }
    console.log(`Total <img>: ${total}, plausible: ${plausible}, slug-matching: ${slugMatch}`);
    for (const m of matched) {
      console.log(`  - alt: "${m.alt}"`);
      console.log(`    angles: ${m.angles.length === 0 ? "(none)" : m.angles.map(x => x.a + "@" + x.m.score).join(", ")}`);
    }
  } finally {
    await page.close().catch(() => {});
    await ctx.close().catch(() => {});
  }
}

await browser.close();
