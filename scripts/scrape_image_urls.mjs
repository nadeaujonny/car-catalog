#!/usr/bin/env node
// Scrape manufacturer model pages for direct image asset URLs and rewrite the
// `url` field on every image entry in data/<brand>.json + catalog/data/<brand>.json.
//
// Usage:
//   node scripts/scrape_image_urls.mjs --brand <brand_slug>
//
// Reads brand-specific configuration from scripts/brand-configs/<brand_slug>.json.
// See instructions/04_scrape_images.md for the config file shape.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

// Strip a leading UTF-8 BOM if present so JSON.parse doesn't fail on it.
function stripBOM(s) {
  return (s && s.charCodeAt(0) === 0xFEFF) ? s.slice(1) : s;
}

async function readJSON(p) {
  return JSON.parse(stripBOM(await fs.readFile(p, "utf-8")));
}

// Copy a file to <path>.bak (overwriting any existing .bak). One-deep backup.
async function backupOne(srcPath) {
  try { await fs.copyFile(srcPath, srcPath + ".bak"); }
  catch (e) { console.warn(`  (warn) could not back up ${srcPath}: ${e.message}`); }
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
           "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const ACCEPT_HTML = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
const TIMEOUT_MS = 20000;

// Default blacklist (used when a brand config doesn't define its own).
const DEFAULT_BLACKLIST = /(?:Promo-Banner|Global-Nav|VehicleCards|Vehicle-Selector|Future-Vehicles|nav[/_-]?jelly|All-Vehicles\/|favicon|sprite|icon|logo|seal|emblem|swatch|color-?swatch)/i;

// Playwright escalation threshold (session 6, Phase 2). Originally the script
// only escalated when the static fetch returned ZERO raw candidates — too strict.
// Brands with a few nav/logo candidates that don't match any model slug (e.g.
// land-rover with 2–39 candidates per page yielding 17.4% coverage; lamborghini
// with 4 candidates/page yielding 0%) never escalated, even though those pages
// are effectively JS-rendered for the model imagery we want. The new gate counts
// candidates whose `url + " " + context` matches any of the page's models'
// slug_variants, and escalates when that count is below this threshold.
const SLUG_MATCH_ESCALATION_THRESHOLD = 3;

/* --------------------------------------------------------------
   Tiered source allowlist (Session 14)
   --------------------------------------------------------------
   Per instructions/04_scrape_images.md §A, image scraping is permitted to
   fall back to Tier 2 (press-kit aggregation + reputable automotive press
   hero photography) and Tier 3 (manufacturer configurator endpoints) when
   Tier 1 (manufacturer + manufacturer-affiliated distribution) is
   insufficient. This is image scraping ONLY — the source hierarchy for
   spec data in 00_master_spec.md §4 is unchanged.

   classifyTier(url) returns 1, 2, 3, or null. null means the URL is on
   the explicit denylist (Wikimedia, KBB images, content farms, dealer
   surfaces) OR cannot be classified at all. URLs classified as null are
   silently rejected at filter time.

   The classifier is consulted at two points:
     (a) When emitting provenance (source_tier / source_domain) on an
         image entry that's been accepted.
     (b) When attempting Tier 2/3 fallback fetches — the candidate's
         classified tier must match the expected fallback tier.

   Tier 1 patterns are intentionally broad: the existing pipeline treats
   any image URL extracted from a manufacturer consumer/press page as
   Tier 1, so we accept those wholesale. The explicit Tier 1 list below
   exists primarily to mark Tier 3 boundary cases (the Tesla
   `digitalassets.tesla.com` configurator path IS Tier 1 by infrastructure
   but is reached via a separate access surface, so we tag it Tier 3 for
   auditability).
-------------------------------------------------------------- */
const TIER_DEFINITIONS = {
  // Tier 2 source patterns — host + optional path constraint.
  // Each entry: [hostRegex, pathRegex|null]. A URL must match BOTH the host
  // and the path constraint to be classified as Tier 2.
  tier2: [
    // NetCarShow republishes manufacturer press kits verbatim. Two URL
    // shapes accepted: (a) /cars/<year>-<make>-<model>/ (legacy), (b)
    // /<make>/<year>-<model>/ (current). Both require year + model token
    // in the path so the post-fetch MY check has something to verify
    // against.
    [/(?:^|\.)netcarshow\.com$/i, /\/(?:cars\/\d{4}-|[a-z-]+\/\d{4}-)/i],
    // CarScoops: only press-release-tagged paths
    [/(?:^|\.)carscoops\.com$/i, /\/(?:official|press)/i],
    // Car and Driver editorial paths (NOT /reviews/inventory or /shop)
    [/(?:^|\.)caranddriver\.com$/i, /\/(?:cars|models|specs|news\/a\d+)/i],
    // MotorTrend editorial paths
    [/(?:^|\.)motortrend\.com$/i, /\/cars\/[a-z-]+\/[a-z0-9-]+\//i],
    // Road & Track editorial
    [/(?:^|\.)roadandtrack\.com$/i, /\/(?:cars|new-cars|news\/a\d+)/i],
    // Automobile Magazine editorial
    [/(?:^|\.)automobilemag\.com$/i, /\/(?:cars|news)\//i],
    // Hagerty editorial only
    [/(?:^|\.)hagerty\.com$/i, /\/(?:media|articles|car-profiles)\//i],
    // Edmunds editorial — explicitly NOT inventory or pricing-tools
    [/(?:^|\.)edmunds\.com$/i, /\/(?!.*(?:inventory|used|pricing-tools|appraisal))[a-z-]+\/[a-z0-9-]+\/\d{4}/i],
  ],
  // Tier 3 source patterns — manufacturer configurator-API style endpoints.
  // These are technically manufacturer-owned (so could be Tier 1) but accessed
  // via a different surface. We tag them Tier 3 for provenance auditability.
  tier3: [
    [/(?:^|\.)digitalassets\.tesla\.com$/i, null],
    [/(?:^|\.)tesla\.cn$/i, /\/configurator/i],
    [/(?:^|\.)(?:assets\.)?bmw(?:group)?\.com$/i, /\/configurator/i],
  ],
  // Explicit denylist — these URLs are NEVER acceptable as image sources,
  // regardless of tier. Matched against full URL (host + path).
  deny: [
    /(?:^|\.)wikimedia\.org/i,
    /(?:^|\.)wikipedia\.org/i,
    /(?:^|\.)kbb\.com\/.+(?:photos?|images?|gallery)/i,
    /(?:^|\.)cars\.com\/.+(?:photos?|images?)/i,
    /(?:^|\.)autotrader\.com/i,
    /(?:^|\.)carbuzz\.com/i,
    /(?:^|\.)motor1\.com\/.*(?:photos?|gallery|galleries)/i,
    /(?:^|\.)autoblog\.com\/.*(?:photos?|gallery|galleries)/i,
    /(?:^|\.)autoevolution\.com/i,
    /(?:^|\.)reddit\.com/i,
    /\.fandom\.com/i,
    /(?:^|\.)teslaoracle\.com/i,
    /(?:^|\.)carsfrenzy\.net/i,
    /(?:^|\.)gettyimages\.com/i,
    /(?:^|\.)shutterstock\.com/i,
  ],
};

function classifyTier(url) {
  let u;
  try { u = new URL(url); } catch { return null; }
  const host = u.hostname.toLowerCase();
  const fullForDeny = host + u.pathname;
  // Denylist first — even if a URL would otherwise match a tier, deny wins.
  for (const re of TIER_DEFINITIONS.deny) {
    if (re.test(fullForDeny)) return null;
  }
  // Tier 3 (manufacturer configurator surfaces) — checked before Tier 2
  // because the host could also match a Tier 1 manufacturer pattern.
  for (const [hostRe, pathRe] of TIER_DEFINITIONS.tier3) {
    if (hostRe.test(host) && (!pathRe || pathRe.test(u.pathname))) return 3;
  }
  // Tier 2
  for (const [hostRe, pathRe] of TIER_DEFINITIONS.tier2) {
    if (hostRe.test(host) && (!pathRe || pathRe.test(u.pathname))) return 2;
  }
  // Default: Tier 1. Any URL that isn't denied and isn't a Tier 2/3
  // aggregator is assumed to be manufacturer-affiliated. This matches the
  // existing pipeline's assumption — every URL extracted from a
  // manufacturer page is treated as manufacturer-sourced.
  return 1;
}

function sourceDomain(url) {
  try { return new URL(url).hostname.toLowerCase(); } catch { return ""; }
}

// Tier 2 MY-verification: the source page URL must contain the current MY
// in a recognisable form. The acceptable patterns are:
//   /<year>/  (e.g., /2026/)
//   -<year>-  (e.g., /cars/2026-ferrari-amalfi/)
//   -<year>/  (e.g., /amalfi-2026/)
//   /<year>-  (e.g., /2026-ferrari/)
// Returns true if any pattern hits, false otherwise.
function tierTwoPageMatchesMY(pageUrl, modelYear) {
  if (!modelYear) return false;
  const y = String(modelYear);
  const re = new RegExp(`(?:^|[/\\-])${y}(?:[/\\-]|$)`);
  return re.test(pageUrl);
}

// Tier 3 endpoint fetcher: many manufacturer configurator endpoints return
// JSON (not HTML). This helper fetches the endpoint and extracts every
// HTTP URL from the response body that ends in an image extension OR
// matches a known manufacturer-CDN pattern. The extracted URLs are then
// passed through the standard isPlausibleImageURL filter (same as HTML
// extraction), so the existing precision controls still apply.
async function fetchTier3Endpoint(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        "Accept": "application/json,text/plain,*/*",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: ctrl.signal,
    });
    if (!res.ok) return { ok: false, status: res.status };
    const body = await res.text();
    return { ok: true, body, finalUrl: res.url };
  } catch (err) {
    return { ok: false, error: err.name === "AbortError" ? "timeout" : err.message };
  } finally {
    clearTimeout(t);
  }
}

// Extract HTTP image-like URLs from a JSON/text response body. Used for
// Tier 3 manufacturer configurator endpoints that return JSON.
function extractURLsFromText(text, blacklist) {
  const out = [];
  const re = /["'](https?:\/\/[^"'\s]+?\.(?:jpe?g|png|webp|avif)(?:\?[^"'\s]*)?)["']/gi;
  let m;
  while ((m = re.exec(text))) {
    const url = m[1];
    if (!isPlausibleImageURL(url, blacklist)) continue;
    out.push({ url, weight: 1, context: "tier3" });
  }
  return out;
}

/* --------------------------------------------------------------
   NetCarShow positional heuristic (Session 15)
   --------------------------------------------------------------
   Session 14 added Tier 2 (NetCarShow) fallback, but NetCarShow's hero
   image filenames (`Ferrari-Amalfi-2026-1280-<hash>.jpg`) and alt-text
   lack angle vocabulary that pickBestForAngle requires. Every Tier 2
   candidate gets rejected by the angle-matcher even though the photos
   are correct model+MY hero photography.
   This session adds a per-source positional fallback: when standard
   angle matching produces zero fills for a NetCarShow-sourced family,
   identify hero-sized candidates and assign them positionally by their
   page-order (1st hero → front_three_quarter, 2nd → rear_three_quarter,
   3rd → side_profile, 4th → interior_dashboard). NetCarShow's editorial
   layout is consistent enough to make this safe.
   The heuristic is NetCarShow-specific. Extending to other sources
   (Car and Driver, MotorTrend) would require separate per-source design
   work — their layouts are less consistent.
-------------------------------------------------------------- */
const NETCARSHOW_HOST_RE = /(?:^|\.)netcarshow\.com$/i;
const NETCARSHOW_BRAND_COVERAGE_THRESHOLD = 0.75;
const NETCARSHOW_HERO_MIN_WIDTH = 1000;

function isHostNetCarShow(url) {
  try { return NETCARSHOW_HOST_RE.test(new URL(url).hostname); }
  catch { return false; }
}

// Extract the maximum URL-embedded width hint (e.g., "-1280-" → 1280).
// Scopes to the filename (the last path segment) so year-bucket directories
// like /img/2026/ aren't mis-counted. NetCarShow's filename pattern is
// <Make>-<Model>-<YYYY>-<WIDTH>-<seq>.<ext>; the first year-range token
// (1900-2099) is the MY and is skipped. Subsequent 4-digit numbers are
// treated as width hints — even when they fall in the year range (e.g.,
// 1920 is a valid hero width). Returns 0 if no hint can be inferred.
function getURLHintedWidth(url) {
  let pathname;
  try { pathname = new URL(url).pathname.toLowerCase(); }
  catch { return 0; }
  const filename = pathname.split("/").pop() || "";
  const found = [];
  for (const m of filename.matchAll(/[-_/](\d{3,4})(?=[-_/.])/g)) {
    const n = parseInt(m[1], 10);
    if (n < 800) continue;
    found.push(n);
  }
  if (found.length === 0) return 0;
  let skippedFirstYear = false;
  let maxWidth = 0;
  for (const n of found) {
    if (!skippedFirstYear && n >= 1900 && n <= 2099) {
      skippedFirstYear = true;
      continue;
    }
    if (n > maxWidth) maxWidth = n;
  }
  return maxWidth;
}

function isNetCarShowHero(c) {
  if (!isHostNetCarShow(c.url)) return false;
  // Prefer rendered DOM dimensions when present (Playwright path).
  if (c.pos && c.pos.natW >= NETCARSHOW_HERO_MIN_WIDTH) return true;
  // Otherwise fall back to URL size token.
  return getURLHintedWidth(c.url) >= NETCARSHOW_HERO_MIN_WIDTH;
}

/* --------------------------------------------------------------
   CLI argument parsing
   -------------------------------------------------------------- */
function parseArgs(argv) {
  const args = { brand: null, playwright: true };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--brand" && i + 1 < argv.length) {
      args.brand = argv[++i];
    } else if (argv[i] === "--no-playwright") {
      args.playwright = false;
    }
  }
  return args;
}

/* --------------------------------------------------------------
   Fetch HTML
   -------------------------------------------------------------- */
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
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, html: await res.text(), finalUrl: res.url };
  } catch (err) {
    return { ok: false, error: err.name === "AbortError" ? "timeout" : err.message };
  } finally {
    clearTimeout(t);
  }
}

/* --------------------------------------------------------------
   Playwright fallback
   --------------------------------------------------------------
   Per session 5 brief: static fetch is the default; if a page yields zero
   plausible image candidates (either 404 from the static fetch, or 200 with
   JS-rendered HTML that contains no static <img>/og:image references), we
   escalate to a headless Chromium that executes the page's JS, waits for
   network-idle (or 5 s, whichever is shorter), and re-extracts via the same
   extractCandidates() logic.

   Escalation threshold (documented per the brief): zero candidates from the
   static fetch. This matches the path_blacklist_regex and content-type
   filters the existing scraper already applies — `extractCandidates` calls
   `isPlausibleImageURL` for every candidate, so a static result of 0
   plausible candidates means every URL on the page failed our filters.

   Lifecycle: the browser is lazy-initialised the first time a page needs
   escalation and closed in main()'s finally block. One page at a time —
   we do not parallelise within a brand.
-------------------------------------------------------------- */
let playwrightModule = null;
let playwrightBrowser = null;
let playwrightLaunchFailed = false;

async function ensurePlaywrightBrowser() {
  if (playwrightBrowser) return playwrightBrowser;
  if (playwrightLaunchFailed) return null;
  try {
    if (!playwrightModule) playwrightModule = await import("playwright");
    playwrightBrowser = await playwrightModule.chromium.launch({ headless: true });
    return playwrightBrowser;
  } catch (e) {
    console.warn(`  (warn) Playwright launch failed: ${e.message}`);
    playwrightLaunchFailed = true;
    return null;
  }
}

async function closePlaywrightBrowser() {
  if (playwrightBrowser) {
    try { await playwrightBrowser.close(); } catch { /* best-effort */ }
    playwrightBrowser = null;
  }
}

async function fetchHTMLWithPlaywright(url) {
  const browser = await ensurePlaywrightBrowser();
  if (!browser) return { ok: false, error: "playwright unavailable" };
  let context;
  let page;
  try {
    context = await browser.newContext({
      userAgent: UA,
      viewport: { width: 1280, height: 900 },
      locale: "en-US",
    });
    page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    // Wait for network idle OR 5 seconds, whichever is shorter, per session 5 brief.
    await Promise.race([
      page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {}),
      new Promise(r => setTimeout(r, 5000)),
    ]);
    // Bounded scroll to trigger lazy-loaded imagery. Session 8: bumped to
    // ~5 s with break-on-no-more-scroll to handle heavy lazy-load pages like
    // Lotus (Sitecore Content Hub serves images on scroll). Each Playwright
    // page costs ~5 s scroll + 5 s networkidle = ~10 s, so the cross-brand
    // overhead is meaningful but bounded.
    await page.evaluate(async () => {
      const start = Date.now();
      const step = 800;
      let lastY = -1;
      while (Date.now() - start < 5000) {
        const y = window.scrollY;
        if (y === lastY) break;  // already at bottom
        lastY = y;
        window.scrollBy(0, step);
        await new Promise(r => setTimeout(r, 150));
      }
      window.scrollTo(0, 0);
      await new Promise(r => setTimeout(r, 300));
    }).catch(() => {});
    const html = await page.content();
    const finalUrl = page.url();
    // Collect per-image positional + size + visibility data from the rendered
    // DOM. This is the signal the session-5 positional fallback uses; it is
    // ONLY available on the Playwright path (static fetch has no layout).
    const domImages = await page.evaluate(() => {
      const out = [];
      for (const im of document.querySelectorAll("img")) {
        const r = im.getBoundingClientRect();
        const cs = getComputedStyle(im);
        out.push({
          src: im.currentSrc || im.src || "",
          alt: ((im.alt || "") + " " + (im.title || "")).trim().slice(0, 200),
          docY: Math.round(r.top + window.scrollY),
          natW: im.naturalWidth || 0,
          natH: im.naturalHeight || 0,
          visible: cs.display !== "none" && cs.visibility !== "hidden" &&
                   r.width > 2 && r.height > 2,
        });
      }
      return out;
    }).catch(() => []);
    return { ok: true, html, finalUrl, domImages };
  } catch (err) {
    return { ok: false, error: err.message };
  } finally {
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
  }
}

/* --------------------------------------------------------------
   HTML → candidate image URLs
   -------------------------------------------------------------- */
const IMG_EXT_RE = /\.(jpe?g|png|webp|avif)(?:\?[^"'\s)]*)?$/i;

// Session 8 Phase B: hosts known to serve images via extension-less URLs.
// Tested against the URL's hostname. We require a CDN-style host AND an
// image-related path segment (IMG_PATH_RE below) before accepting an
// extension-less URL — bias toward precision over recall.
const CDN_HOST_RE = /(?:^|\.)(?:cdn|media|scene7|sitecorecontenthub|sitecore|cloudinary|imgix|contentstack|cloudfront|akamaized|akamai|wlt-p-\d+)\b/i;

// Image-related path segments. Used in conjunction with CDN_HOST_RE to gate
// acceptance of extension-less URLs. A URL must have one of these markers
// (sandwiched between slashes or at end-of-path) to qualify. Designed to be
// precise: a generic `/api/` won't pass, only `/api/public/content/` does.
const IMG_PATH_RE = /\/(?:-?\/?media|images?|imgs?|assets?|vehicles?|models?|render|hero|gallery|galleries|photos?|pictures?|content\/dam|api\/public\/content|is\/image|is\/content)(?=\/|$)/i;

// Session 8 Phase B: count of extension-less URLs the relaxed filter accepted
// across the run. Reported in SCRAPE SUMMARY so the impact of the relax is
// observable. Reset to 0 at the start of main().
let extensionlessAccepted = 0;

function isPlausibleImageURL(url, blacklist) {
  try {
    const u = new URL(url);
    const full = u.pathname + (u.search || "");
    if (/\.svg\b/i.test(u.pathname)) return false;
    if (blacklist.test(full)) return false;
    // tiny-thumbnail signal: explicit ?w=10 or ?w=20 etc.
    const w = u.searchParams.get("w");
    if (w && parseInt(w, 10) < 200) return false;

    if (IMG_EXT_RE.test(u.pathname)) return true;

    // Session 8 Phase B: accept extension-less URLs from CDN-style hosts that
    // also have an image-related path segment. Targets Sitecore Content Hub
    // (Lotus's `wlt-p-001.sitecorecontenthub.cloud/api/public/content/<uuid>`)
    // and similar CDNs whose URLs lack file extensions but still resolve to
    // real images. The dual-gate (host + path) keeps precision high.
    if (CDN_HOST_RE.test(u.hostname) && IMG_PATH_RE.test(u.pathname)) {
      extensionlessAccepted++;
      return true;
    }

    return false;
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
  // Session 9: many manufacturers (Kia, GMC, others on Adobe AEM) embed
  // image URLs inside JSON data layers where the JSON's surrounding quotes
  // have been HTML-entity-encoded (&#34; for ", &#39; for '). Pre-decode
  // these so the existing URL-extraction regexes (which use literal ["']
  // boundaries) can see those URLs. Additive: every extracted URL still
  // passes through isPlausibleImageURL + slug-match + angle-match.
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

  // <img src/data-src/srcset alt/title>
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
  // <source srcset>
  const sourceRe = /<source\b([^>]*)>/gi;
  while ((m = sourceRe.exec(html))) {
    const a = m[1];
    const ss = attr(a, "srcset") || attr(a, "data-srcset");
    for (const s of parseSrcset(ss, baseUrl)) list.push({ url: s.url, weight: s.weight, context: "" });
  }
  // og:image
  const ogRe1 = /<meta\b[^>]*property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/gi;
  while ((m = ogRe1.exec(html))) push(m[1], 1.5, "og:image");
  // <link rel=preload as=image>
  const preloadRe = /<link\b[^>]*rel=["']preload["'][^>]*as=["']image["'][^>]*href=["']([^"']+)["']/gi;
  while ((m = preloadRe.exec(html))) push(m[1], 1.5, "preload");
  // background-image: url(...)
  const bgRe = /background-image\s*:\s*url\(["']?([^)"']+)["']?\)/gi;
  while ((m = bgRe.exec(html))) push(m[1], 1, "background");
  // Naked URLs inside JSON/script blobs
  const nakedRe = /["'](https?:\/\/[^"'\s]+?\.(?:jpe?g|png|webp|avif)(?:\?[^"'\s]*)?)["']/gi;
  while ((m = nakedRe.exec(html))) push(m[1], 0.8, "naked");
  // CDN-relative paths. Session 9: extended from /-/media/ only to also cover
  // Adobe AEM's /content/dam/ and /us/content/dam/ prefixes, which Kia, GMC,
  // and several other AEM-based manufacturer sites use for asset paths.
  const cdnRe = /["'](\/(?:-\/media|content\/dam|us\/content\/dam)\/[^"'\s]+?\.(?:jpe?g|png|webp|avif)(?:\?[^"'\s]*)?)["']/gi;
  while ((m = cdnRe.exec(html))) push(m[1], 0.8, "cdn-rel");

  return list;
}

/* --------------------------------------------------------------
   Positional enrichment (Playwright path only)
   --------------------------------------------------------------
   Merges the rendered-DOM image metadata (bounding box, natural size,
   visibility) collected by fetchHTMLWithPlaywright into the candidate list:
     1. existing candidates that match a DOM image by URL path get a `.pos`
     2. visible DOM images the regex extractor missed are appended as new
        candidates carrying `.pos` (and their alt text as context)
   Candidates without `.pos` (the entire static-fetch path) are unaffected.
   -------------------------------------------------------------- */
function urlPath(u) {
  try { return new URL(u).pathname.toLowerCase(); }
  catch { return (u || "").toLowerCase(); }
}

function attachPositional(candidates, domImages, baseUrl, blacklist) {
  if (!domImages || domImages.length === 0) return;
  const byPath = new Map();
  for (const d of domImages) {
    const abs = resolveURL(d.src, baseUrl);
    if (!abs) continue;
    // Keep the largest natural area when several DOM imgs share a path.
    const p = urlPath(abs);
    const prev = byPath.get(p);
    if (!prev || (d.natW * d.natH) > (prev.natW * prev.natH)) byPath.set(p, d);
  }
  const posOf = (d) => ({
    docY: d.docY, natW: d.natW, natH: d.natH,
    area: (d.natW || 0) * (d.natH || 0), visible: !!d.visible,
  });
  for (const c of candidates) {
    const d = byPath.get(urlPath(c.url));
    if (d) c.pos = posOf(d);
  }
  const seen = new Set(candidates.map(c => urlPath(c.url)));
  for (const d of domImages) {
    const abs = resolveURL(d.src, baseUrl);
    if (!abs) continue;
    const p = urlPath(abs);
    if (seen.has(p)) continue;
    if (!isPlausibleImageURL(abs, blacklist)) continue;
    seen.add(p);
    candidates.push({ url: abs, weight: 1, context: d.alt || "", pos: posOf(d) });
  }
}

/* --------------------------------------------------------------
   Model-slug recognition
   --------------------------------------------------------------
   slugMatchesURL is called with a haystack of `url + " " + altText`. Two
   session-5 changes, both strictly MORE permissive (they can only add
   matches, never remove one a prior run made):
     1. The haystack now includes the image's alt/title text, not just the
        URL. Some manufacturers (MINI's JCW lineup) host a model's images in
        a sibling model's CDN folder — e.g. JCW Countryman exterior shots
        live under `…/mini-convertible/2025/jcw/…` — so the URL path is not a
        reliable model discriminator, but the alt text ("…MINI JCW Countryman
        ALL4…") always is.
     2. Variant separators are flexible: a hyphen/underscore/space in the
        variant matches any of the three in the haystack, and the same set is
        accepted as the surrounding boundary. So the URL-shaped variant
        "jcw-countryman-all4" also matches the alt phrase "JCW Countryman ALL4".
   -------------------------------------------------------------- */
function variantToRegexFragment(v) {
  return (v || "").trim().toLowerCase()
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map(escapeRe)
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

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

/* --------------------------------------------------------------
   Angle scoring
   --------------------------------------------------------------
   Patterns are tested against `url + " " + context`, where `context` is the
   image's alt + title text. Manufacturer alt text uses natural English with
   SPACE separators ("Front view of the MINI JCW 2 Door", "Rear-view…",
   "Side-view of a MINI Cooper S"), while CDN filenames use hyphen/underscore.
   So every separator class here is `[-_ ]` (hyphen, underscore, OR space) —
   the session-5 Mini smoke test failed because the score-8 `[-_]?view` and
   score-7 `[-_/]front` patterns rejected the space in "Front view", leaving
   front/rear/side unmatched while only `\bdashboard\b` (space-agnostic) hit.
   -------------------------------------------------------------- */
const ANGLE_PATTERNS = {
  front_three_quarter: [
    { re: /front[-_ ]?(?:three[-_ ]?quarter|3[-_ ]?4|3q|34)/i,  score: 14 },
    { re: /\bf34\b|\bf3q\b|\b3q[-_ ]?front\b/i,                score: 12 },
    { re: /exterior[-_ ]?front|front[-_ ]?exterior/i,          score: 9  },
    { re: /front[-_ ]?angle|front[-_ ]?view/i,                 score: 8  },
    { re: /(?:^|[-_/ ])front(?:[-_ ]|$|\.)/i,                  score: 7  },
  ],
  rear_three_quarter: [
    { re: /rear[-_ ]?(?:three[-_ ]?quarter|3[-_ ]?4|3q|34)/i,  score: 14 },
    { re: /\br34\b|\br3q\b|\b3q[-_ ]?rear\b/i,                 score: 12 },
    { re: /exterior[-_ ]?rear|rear[-_ ]?exterior/i,            score: 9  },
    { re: /rear[-_ ]?angle|rear[-_ ]?view/i,                   score: 8  },
    { re: /(?:^|[-_/ ])rear(?:[-_ ]|$|\.)/i,                   score: 7  },
    // "back" kept hyphen/underscore-strict on purpose: allowing a leading
    // space would falsely match "back seat" / "back row" (interior) at score 5.
    { re: /(?:^|[-_/])back(?:[-_]|$|\.)/i,                     score: 5  },
  ],
  side_profile: [
    { re: /side[-_ ]?profile|profile[-_ ]?side/i,              score: 14 },
    { re: /\bprofile\b/i,                                      score: 9  },
    { re: /(?:^|[-_/ ])side(?:[-_ ]|$|\.)/i,                   score: 7  },
  ],
  interior_dashboard: [
    { re: /interior[-_ ]?dashboard|dashboard[-_ ]?interior/i,  score: 14 },
    { re: /\bdashboard\b/i,                                    score: 12 },
    { re: /\bcenter[-_ ]?console\b/i,                          score: 11 },
    { re: /\bcockpit\b/i,                                      score: 10 },
    { re: /\bcabin\b/i,                                        score: 8  },
    { re: /\binterior\b/i,                                     score: 7  },
  ],
};

// Session 7 Phase B: resolution preference layer. Returns a score adjustment
// in [-3, +3] reflecting how likely the URL points at a large-format variant
// (positive) vs a small/mobile/thumbnail variant (negative). Returns 0 when no
// size marker is detectable. The score is added to the angle match score in
// pickBestForAngle, so when a page serves multiple size variants of the same
// image as separate srcset entries, the largest scores highest and wins.
// Brands serving only one size on a page are unaffected.
function resolutionBonus(url) {
  let s = 0;

  // Positive: large-format text tokens (path/filename)
  if (/[-_/](2560|2000|1920|1600|1440|1280|1200|1080|wide|hero|full|large|xl|xxl|[-_]l\.|_2000x|max|original|fullsize)/i.test(url)) s += 2;
  // Negative: small-format pixel widths (likely thumbnail dimensions)
  if (/[-_/](?:120|150|180|200|240|300|320|400)(?:px|w)?[-_./]/i.test(url)) s -= 2;

  // Size-letter suffix on extension
  if (/[-_]s\.(jpe?g|png|webp|avif)/i.test(url)) s -= 2;
  if (/[-_]l\.(jpe?g|png|webp|avif)/i.test(url)) s += 2;

  // Tier-letter on extension (-xs / -sm / -md / -lg / -xl, common on Volvo etc.)
  if (/[-_](xs|sm|small)\.(jpe?g|png|webp|avif)/i.test(url)) s -= 2;
  if (/[-_](md|medium)\.(jpe?g|png|webp|avif)/i.test(url)) s -= 0.5;
  if (/[-_](lg|xl|xxl|large)\.(jpe?g|png|webp|avif)/i.test(url)) s += 2;

  // Path-segment size tiers (/xs/, /sm/, /md/, /lg/, /xl/)
  if (/\/(?:xs|sm|small|mini|micro|tiny|thumb|thumbnail|thumbs)\//i.test(url)) s -= 2;
  if (/\/(?:lg|xl|xxl|large|hero|wide|full|fullsize|max)\//i.test(url)) s += 2;

  // Device-class tokens. We treat `mobile`/`tablet` as small-variant signals,
  // `desktop` as large. Boundaries: word-boundary or one of [-_./ ].
  if (/(?:^|[-_/. ])(?:mobile|phone|smartphone|handheld)(?:[-_/. ]|$)/i.test(url)) s -= 1.5;
  if (/(?:^|[-_/. ])tablet(?:[-_/. ]|$)/i.test(url)) s -= 0.5;
  if (/(?:^|[-_/. ])(?:desktop|laptop)(?:[-_/. ]|$)/i.test(url)) s += 1;

  // Dot-separated size tier in filename (.small. / .medium. / .large.) — Mini style
  if (/\.small\./i.test(url)) s -= 2;
  if (/\.medium\./i.test(url)) s -= 0.5;
  if (/\.large\./i.test(url)) s += 2;

  // _NNNxNNN. dimension suffix in filename
  const dimMatch = url.match(/[-_](\d{3,4})x(\d{3,4})\.(?:jpe?g|png|webp|avif)/i);
  if (dimMatch) {
    const w = parseInt(dimMatch[1], 10);
    if (w >= 1600) s += 2;
    else if (w >= 1200) s += 1.5;
    else if (w >= 800) s += 0.5;
    else if (w >= 400) s -= 0.5;
    else s -= 1.5;
  }

  // Width-style query params (?mw=NNN, ?w=NNN, ?width=NNN, ?imwidth=NNN, ?wid=NNN)
  for (const param of ["mw", "w", "width", "imwidth", "wid", "size"]) {
    const re = new RegExp(`[?&]${param}=(\\d+)`, "i");
    const m = url.match(re);
    if (m) {
      const v = parseInt(m[1], 10);
      if (v >= 1600) s += 2;
      else if (v >= 1200) s += 1.5;
      else if (v >= 800) s += 0.5;
      else if (v >= 400) s -= 0.5;
      else s -= 1.5;
      break; // count one width param at most
    }
  }

  // AEM rendition pattern: .image.NNN.jpg (jeep style — `.image.1000.jpg`)
  const aemMatch = url.match(/\.image\.(\d{3,4})\.(?:jpe?g|png|webp|avif)/i);
  if (aemMatch) {
    const v = parseInt(aemMatch[1], 10);
    if (v >= 1600) s += 2;
    else if (v >= 1200) s += 1.5;
    else if (v >= 800) s += 0.5;
    else if (v >= 400) s -= 0.5;
    else s -= 1.5;
  }

  return s;
}

function angleScore(angle, url, context) {
  const hay = (url + " " + context).toLowerCase();
  let s = 0, matched = false;
  for (const { re, score } of ANGLE_PATTERNS[angle]) {
    if (re.test(hay)) { s += score; matched = true; }
  }
  return { matched, score: s };
}

// Session 7 (Phase A): brand-specific angle URL patterns are a per-brand
// escape hatch for CDNs whose URL paths and alt text don't carry the English
// angle vocabulary that ANGLE_PATTERNS recognises. Each pattern is compiled
// case-insensitively and tested against `url + " " + context`. The
// brand-specific score is fixed at 6 — high enough to clear "no match" but
// below the score-7 English direction tokens, so when both fire the English
// match wins. A brand-specific match still gets resolutionBonus and weight
// adjustment, just like an English match. Returns null when the brand has no
// override for this angle.
function brandAngleScore(angle, url, context, brandAnglePatterns) {
  if (!brandAnglePatterns) return null;
  const list = brandAnglePatterns[angle];
  if (!list || list.length === 0) return null;
  const hay = (url + " " + context).toLowerCase();
  let matched = false;
  for (const re of list) {
    if (re.test(hay)) { matched = true; break; }
  }
  return matched ? { matched: true, score: 6 } : { matched: false, score: 0 };
}

function pickBestForAngle(candidates, angle, used, brandAnglePatterns) {
  // Guard: ANGLE_PATTERNS only defines the 4 baseline angles. Extended angles
  // (interior_rear_seats, wheel_detail, engine_bay, cargo_area,
  // exterior_color_options_grid, etc.) have no pattern table and would crash
  // angleScore. Skip cleanly so the run continues for the recognised angles.
  if (!ANGLE_PATTERNS[angle]) return null;
  let best = null, bestTotal = -Infinity;
  let bestResBonus = 0;
  let alternateResBonuses = []; // resBonus of other angle-matching candidates for upgrade tracking
  // First pass: standard English ANGLE_PATTERNS (preserves prior behaviour and
  // bias toward established vocabulary).
  for (const c of candidates) {
    if (used.has(c.url)) continue;
    const { matched, score: angleS } = angleScore(angle, c.url, c.context);
    if (!matched) continue;
    const resB = resolutionBonus(c.url);
    const total = angleS + resB + (c.weight - 1) * 0.4;
    alternateResBonuses.push(resB);
    if (total > bestTotal) { bestTotal = total; best = { ...c, total }; bestResBonus = resB; }
  }
  if (best) {
    // Phase B (session 7): mark a "resolution upgrade" when the picked
    // candidate had a higher resolutionBonus than at least one other
    // angle-matching candidate that was rejected. The layer "preferred a
    // larger variant" relative to the rejected alternates. This is a
    // generous-but-honest measure: it overcounts when the angle score itself
    // separated the candidates, but undercounts would miss cases where the
    // picked URL has a small-marker (.small. = -2) but still beat a mobile
    // sibling (Mobile + .small. = -3.5).
    if (alternateResBonuses.length > 1 && alternateResBonuses.some(r => r < bestResBonus)) {
      best.resolutionUpgrade = true;
    }
    return best;
  }
  // Second pass (Phase A): brand-specific angle URL patterns. Only attempted
  // when the standard pass yielded nothing AND the brand config has patterns
  // for this angle. Bias toward precision: a wrong match is worse than a miss.
  if (!brandAnglePatterns || !brandAnglePatterns[angle]) return null;
  alternateResBonuses = [];
  for (const c of candidates) {
    if (used.has(c.url)) continue;
    const r = brandAngleScore(angle, c.url, c.context, brandAnglePatterns);
    if (!r || !r.matched) continue;
    const resB = resolutionBonus(c.url);
    const total = r.score + resB + (c.weight - 1) * 0.4;
    alternateResBonuses.push(resB);
    if (total > bestTotal) {
      bestTotal = total;
      best = { ...c, total, viaBrandPattern: true };
      bestResBonus = resB;
    }
  }
  if (best && alternateResBonuses.length > 1 && alternateResBonuses.some(r => r < bestResBonus)) {
    best.resolutionUpgrade = true;
  }
  return best;
}

/* --------------------------------------------------------------
   Positional fallback (session 5) — last resort
   --------------------------------------------------------------
   Runs ONLY when pickBestForAngle found no text match for an angle AND the
   candidates carry `.pos` data (i.e. the page was fetched via Playwright).
   Deliberately narrow per the session-5 brief's "bias toward fewer false
   positives over higher coverage":
     - Resolves ONLY front_three_quarter. Manufacturer model pages reliably
       lead with one large hero exterior shot near the top of the page; the
       other three angles have no comparably reliable positional signal, so
       they return null (an honest miss) rather than a guess.
     - Requires the candidate to be visible, >=800px natural width, and within
       the first 1600px of the document.
     - Excludes any candidate whose url/alt already reads as a DIFFERENT angle
       (rear / side / interior) — picking such an image for "front" would be a
       needless false positive.
   -------------------------------------------------------------- */
function pickByPosition(candidates, angle, used) {
  if (angle !== "front_three_quarter") return null;
  const pool = candidates.filter(c => {
    if (!c.pos || !c.pos.visible) return false;
    if (c.pos.natW < 800 || c.pos.docY > 1600) return false;
    if (used.has(c.url)) return false;
    for (const other of ["rear_three_quarter", "side_profile", "interior_dashboard"]) {
      if (angleScore(other, c.url, c.context).matched) return false;
    }
    return true;
  });
  if (pool.length === 0) return null;
  pool.sort((a, b) => b.pos.area - a.pos.area);
  return { ...pool[0], total: 0, viaPosition: true };
}

/* --------------------------------------------------------------
   Main
   -------------------------------------------------------------- */
async function main() {
  const args = parseArgs(process.argv);
  if (!args.brand) {
    console.error("Usage: node scripts/scrape_image_urls.mjs --brand <brand_slug>");
    process.exit(2);
  }

  const brand = args.brand;
  const SRC_DATA = path.join(PROJECT_ROOT, "data", `${brand}.json`);
  const CAT_DATA = path.join(PROJECT_ROOT, "catalog", "data", `${brand}.json`);
  const CONFIG   = path.join(PROJECT_ROOT, "scripts", "brand-configs", `${brand}.json`);

  // Validate inputs
  for (const f of [SRC_DATA, CAT_DATA, CONFIG]) {
    try { await fs.access(f); }
    catch { console.error(`Missing required file: ${f}`); process.exit(1); }
  }

  // Reset module-level counters so re-running main() (tests) starts fresh.
  extensionlessAccepted = 0;

  const cfg = await readJSON(CONFIG);
  const cat = await readJSON(CAT_DATA);

  const modelPages   = cfg.model_pages   || {};
  const slugVariants = cfg.slug_variants || {};
  const blacklist    = cfg.path_blacklist_regex
    ? new RegExp(cfg.path_blacklist_regex, "i")
    : DEFAULT_BLACKLIST;

  // Session 7 Phase A: compile brand-specific angle URL patterns. Schema:
  //   "angle_url_patterns": { "<angle>": ["<regex>", ...], ... }
  // Each regex is compiled with the case-insensitive flag and tested against
  // `url + " " + context` (URL + alt-text). Used by pickBestForAngle ONLY when
  // the standard English ANGLE_PATTERNS pass produced no match. Absent or
  // empty fields are a no-op.
  let brandAnglePatterns = null;
  let brandAnglePatternCount = 0;
  if (cfg.angle_url_patterns && typeof cfg.angle_url_patterns === "object") {
    brandAnglePatterns = {};
    for (const [angle, patterns] of Object.entries(cfg.angle_url_patterns)) {
      if (!Array.isArray(patterns)) continue;
      const compiled = [];
      for (const p of patterns) {
        try { compiled.push(new RegExp(p, "i")); }
        catch (e) { console.warn(`  (warn) bad angle_url_patterns regex for ${angle}: ${p} — ${e.message}`); }
      }
      if (compiled.length) {
        brandAnglePatterns[angle] = compiled;
        brandAnglePatternCount += compiled.length;
      }
    }
    if (Object.keys(brandAnglePatterns).length === 0) brandAnglePatterns = null;
  }

  // Session 15: compute pre-run baseline-angle coverage to gate the NetCarShow
  // positional fallback. Brands at >=75% Tier 1 coverage already have enough
  // direct manufacturer imagery; the positional heuristic shouldn't pollute
  // them with positional Tier 2 fallbacks. Computed before the reset loop so
  // it reflects the on-disk state.
  const BASELINE_ANGLES_FOR_COVERAGE = ["front_three_quarter", "rear_three_quarter", "side_profile", "interior_dashboard"];
  let baselineTotal = 0, baselineFilled = 0;
  for (const m of cat.models) {
    const canonical = modelPages[m.model_slug];
    for (const t of (m.trims || [])) {
      for (const im of (t.images || [])) {
        if (!BASELINE_ANGLES_FOR_COVERAGE.includes(im.angle)) continue;
        baselineTotal++;
        if (im.needs_scraping === true) continue;
        if (!im.url) continue;
        if (canonical && im.url === canonical) continue;
        baselineFilled++;
      }
    }
  }
  const brandPreCoverage = baselineTotal > 0 ? baselineFilled / baselineTotal : 0;
  console.log(`Brand pre-run baseline-angle coverage: ${(brandPreCoverage * 100).toFixed(1)}% (${baselineFilled}/${baselineTotal})`);

  // Idempotent reset: ONLY reset entries flagged needs_scraping:true. Entries
  // that already carry a resolved direct-asset URL (needs_scraping false/absent)
  // must be left untouched — they represent prior Phase 1 working URLs that
  // would otherwise be destroyed (the 2026-05-13 Toyota destruction bug).
  let resetCount = 0;
  for (const m of cat.models) {
    const canonical = modelPages[m.model_slug];
    if (!canonical) continue;
    for (const t of (m.trims || []))
      for (const i of (t.images || [])) {
        if (i.needs_scraping === true) {
          i.url = canonical;
          resetCount++;
        }
      }
  }
  console.log(`Reset ${resetCount} image entries with needs_scraping:true to their model page URLs.`);

  // Build the page-URL set from the config, skipping models without a page.
  // Also build the reverse map page-URL -> models using that page, so the
  // slug-match escalation gate (below) can count candidates relative to the
  // models served by each page (a single page can serve multiple models,
  // e.g. GMC Yukon XL shares the Yukon landing page).
  const skippedModels = [];
  const pageURLs = new Set();
  const pageToModels = new Map();
  for (const m of cat.models) {
    const url = modelPages[m.model_slug];
    if (!url) { skippedModels.push(m.model_slug); continue; }
    pageURLs.add(url);
    if (!pageToModels.has(url)) pageToModels.set(url, []);
    pageToModels.get(url).push(m.model_slug);
  }

  console.log(`Brand: ${brand}`);
  console.log(`Models in JSON: ${cat.models.length}`);
  console.log(`Models with page URLs: ${pageURLs.size}`);
  console.log(`Playwright fallback: ${args.playwright ? "enabled" : "DISABLED via --no-playwright"}`);
  if (brandAnglePatterns) {
    console.log(`Brand-specific angle patterns: ${brandAnglePatternCount} regex(es) across ${Object.keys(brandAnglePatterns).length} angle(s) — ${Object.keys(brandAnglePatterns).join(", ")}`);
  }
  if (skippedModels.length) {
    console.log(`Models skipped (no page URL in config): ${skippedModels.length}`);
    for (const s of skippedModels) console.log(`  - ${s}`);
  }
  console.log(`\nScraping ${pageURLs.size} model pages…\n`);

  const pageData = new Map();
  const failedPages = [];
  // Per-brand counters for the SCRAPE SUMMARY footer
  let playwrightEscalated = 0;
  let playwrightSucceeded = 0;
  let playwrightFailed = 0;

  // Helper for slug-match escalation gate: count how many candidates match
  // any of the page's models' slug_variants. Cheap O(cands * models_on_page).
  function countSlugMatching(candidates, modelSlugs) {
    let n = 0;
    for (const c of candidates) {
      const hay = `${c.url} ${c.context || ""}`;
      for (const slug of modelSlugs) {
        if (slugMatchesURL(slug, hay, slugVariants)) { n++; break; }
      }
    }
    return n;
  }

  for (const pageUrl of pageURLs) {
    process.stdout.write(`  fetch ${pageUrl}  …  `);
    const r = await fetchHTML(pageUrl);
    let cands = [];
    let staticFailReason = null;
    if (!r.ok) {
      staticFailReason = r.status || r.error;
      console.log(`static FAIL (${staticFailReason})`);
    } else {
      cands = extractCandidates(r.html, r.finalUrl, blacklist);
    }

    // Escalate to Playwright when fewer than SLUG_MATCH_ESCALATION_THRESHOLD
    // candidates slug-match any of this page's models (session 6, Phase 2).
    // The old gate (cands.length === 0) was too strict — pages with 2–4 junk
    // candidates (nav/logo) that don't match any model slug never escalated
    // even when they were effectively JS-rendered for model imagery. The new
    // gate captures that case while still skipping Playwright for pages whose
    // static fetch already produced ≥3 slug-matching candidates.
    const modelsForPage = pageToModels.get(pageUrl) || [];
    const matchingCount = countSlugMatching(cands, modelsForPage);
    if (r.ok) {
      console.log(`static ok (${cands.length} raw, ${matchingCount} slug-matching)`);
    }
    if (args.playwright && matchingCount < SLUG_MATCH_ESCALATION_THRESHOLD) {
      playwrightEscalated++;
      process.stdout.write(`    playwright ${pageUrl}  …  `);
      try {
        const pr = await fetchHTMLWithPlaywright(pageUrl);
        if (pr.ok) {
          cands = extractCandidates(pr.html, pr.finalUrl, blacklist);
          // Enrich with rendered-DOM positional data so the positional
          // fallback (pickByPosition) has bounding-box/size signal to work with.
          attachPositional(cands, pr.domImages, pr.finalUrl, blacklist);
          if (cands.length > 0) {
            playwrightSucceeded++;
            console.log(`ok (${cands.length} raw candidates)`);
          } else {
            playwrightFailed++;
            console.log(`ok but 0 candidates`);
          }
        } else {
          playwrightFailed++;
          console.log(`FAIL (${pr.error})`);
        }
      } catch (e) {
        // Defensive: Playwright crashes should never take the whole run down.
        playwrightFailed++;
        console.log(`CRASH (${e.message}) — continuing with static result`);
      }
    }

    if (cands.length === 0) {
      failedPages.push({ url: pageUrl, reason: staticFailReason || "no candidates after static + playwright" });
    }
    pageData.set(pageUrl, { candidates: cands, rawCount: cands.length });
  }

  // Rewrite image entries
  let rewritten = 0;
  let unchanged = 0;
  let rewrittenViaPosition = 0;
  let rewrittenViaBrandPattern = 0;
  let rewrittenExtensionless = 0;
  let resolutionUpgrades = 0;
  const stillMissingByModel = new Map();
  const angleSamples = [];

  // Session 14 tier tracking. Counts image entries by tier the URL came from,
  // assigned at provenance time. Tier 1 is the default; Tier 2/3 are incremented
  // only when the fallback paths produce a fill.
  const tierBreakdown = { 1: 0, 2: 0, 3: 0 };
  let tier2Or3FillsThisRun = 0;
  // Session 15: NetCarShow positional fallback tracking.
  let netcarshowPositionalFills = 0;
  const netcarshowPositionalTrims = new Set();

  // Optional brand-config fields for Session 14 tiered sources.
  const tier3Endpoints = (cfg.tier3_endpoints && typeof cfg.tier3_endpoints === "object") ? cfg.tier3_endpoints : {};
  const tier2Endpoints = (cfg.tier2_endpoints && typeof cfg.tier2_endpoints === "object") ? cfg.tier2_endpoints : {};

  // Per-trim flag: have we already appended the once-per-trim provenance
  // note for this trim during this run? Avoids appending the same note
  // multiple times when several angles get filled from the same tier.
  const provenanceNoteAdded = new Set(); // key: model_slug::trim_slug

  // Provenance helper — sets source_tier and source_domain on an image
  // entry. Tier 1 is the default; Tier 2/3 are passed in explicitly. Also
  // tracks the actual hostname the URL came from for audit purposes.
  function attachProvenance(img, tier) {
    img.source_tier = tier;
    img.source_domain = sourceDomain(img.url);
    tierBreakdown[tier] = (tierBreakdown[tier] || 0) + 1;
  }

  // Once-per-trim note appender. Per the §A policy, when a trim gets any
  // image from Tier 2 or 3, append a note. The note is informational and
  // documents the provenance fallback for downstream review.
  function maybeAddTrimNote(model, trim, tier, domain) {
    const key = `${model.model_slug}::${trim.trim_slug}`;
    if (provenanceNoteAdded.has(key)) return;
    const existingNote = trim.notes || "";
    const newPart = `Hero photography fallback from ${domain} (Tier ${tier}); manufacturer images unavailable for some angles.`;
    trim.notes = existingNote
      ? (existingNote.includes(newPart) ? existingNote : (existingNote + " " + newPart))
      : newPart;
    provenanceNoteAdded.add(key);
  }

  for (const model of cat.models) {
    const canonical = modelPages[model.model_slug];
    if (!canonical) continue;
    const pd = pageData.get(canonical) || { candidates: [] };
    // Filter to this model's slug. Haystack = URL + alt/title text, so a model
    // whose images sit in a sibling model's CDN folder still matches on its
    // alt text (see slugMatchesURL header).
    const modelCandidates = pd.candidates.filter(c =>
      slugMatchesURL(model.model_slug, `${c.url} ${c.context || ""}`, slugVariants));
    // Dedupe
    const seen = new Set();
    const unique = [];
    for (const c of modelCandidates) {
      if (seen.has(c.url)) continue;
      seen.add(c.url); unique.push(c);
    }

    const usedPerFamily = new Map();
    for (const trim of (model.trims || [])) {
      const fam = trim.trim_family || trim.trim_slug;
      if (!usedPerFamily.has(fam)) usedPerFamily.set(fam, new Set());
      const used = usedPerFamily.get(fam);
      for (const img of (trim.images || [])) {
        if (unique.length === 0) {
          unchanged++;
          addMiss(stillMissingByModel, model.model_slug, `${trim.trim_slug}/${img.angle}`);
          continue;
        }
        // Text/URL pattern match first (standard English ANGLE_PATTERNS, then
        // brand-specific angle_url_patterns as a fallback inside the same
        // call); positional fallback only if that finds nothing (and only for
        // front_three_quarter — see pickByPosition).
        let best = pickBestForAngle(unique, img.angle, used, brandAnglePatterns);
        if (!best) best = pickByPosition(unique, img.angle, used);
        if (best) {
          // Phase B (session 7): when the picked URL differs from the
          // entry's existing URL, invalidate the cached download flag so the
          // downloader will refresh the file on disk. Without this, a
          // previously-downloaded entry retains its old cached image even
          // when the scrape script has picked a different (e.g. larger,
          // resolution-upgraded) URL — and the downloader's
          // `downloaded:true` + file-exists short-circuit skips the new URL.
          if (img.url !== best.url) {
            img.url = best.url;
            if (img.downloaded === true) img.downloaded = false;
          }
          used.add(best.url);
          rewritten++;
          // Tier 1 provenance — best is from the manufacturer page candidate set.
          attachProvenance(img, 1);
          if (best.viaPosition) rewrittenViaPosition++;
          if (best.viaBrandPattern) rewrittenViaBrandPattern++;
          if (best.resolutionUpgrade) resolutionUpgrades++;
          // Session 8 Phase B: track image entries whose final URL is
          // extension-less (the relax-accepted code path).
          try {
            if (!IMG_EXT_RE.test(new URL(best.url).pathname)) rewrittenExtensionless++;
          } catch { /* malformed url — already filtered upstream */ }
          if (angleSamples.length < 12) {
            const tag = best.viaPosition ? "pos"
                      : best.viaBrandPattern ? `B${best.total.toFixed(1)}`
                      : best.total.toFixed(1);
            angleSamples.push({
              model: model.model_slug, trim: trim.trim_slug, angle: img.angle,
              score: tag, url: best.url,
            });
          }
        } else {
          unchanged++;
          addMiss(stillMissingByModel, model.model_slug, `${trim.trim_slug}/${img.angle}`);
        }
      }
      // Provenance backfill: if a trim has pre-existing direct-asset URLs from
      // prior Phase 1/4 runs (needs_scraping !== true; url is not the canonical
      // model page URL), mark them as Tier 1 so the verifier sees uniform
      // provenance data across the catalog. This is idempotent — running again
      // produces the same source_tier / source_domain values.
      for (const img of (trim.images || [])) {
        if (img.source_tier) continue; // already attributed this run
        if (img.url && img.url !== canonical && img.needs_scraping !== true) {
          attachProvenance(img, 1);
        }
      }
    }
  }

  /* --------------------------------------------------------------
     Tier 2 / Tier 3 fallback pass (Session 14, §A policy)
     --------------------------------------------------------------
     After Tier 1 has been evaluated, identify trim families with
     fewer than 2 of 4 baseline angles filled. For each such family,
     attempt Tier 3 first (manufacturer configurator endpoints), then
     Tier 2 (press-kit aggregation + reputable editorial hero photos).
     The 2-of-4 threshold matches the policy in 04_scrape_images.md §A:
     "scraper SHOULD NOT escalate to Tier 2 if Tier 1 provided at least
     2 of the 4 required angles for a trim family".
  -------------------------------------------------------------- */
  const BASELINE_ANGLES = ["front_three_quarter", "rear_three_quarter", "side_profile", "interior_dashboard"];

  function familyAngleFillState(model, famKey) {
    const canonical = modelPages[model.model_slug];
    const filled = new Set();
    const trimsInFam = [];
    for (const t of (model.trims || [])) {
      const fam = t.trim_family || t.trim_slug;
      if (fam !== famKey) continue;
      trimsInFam.push(t);
      for (const im of (t.images || [])) {
        if (!BASELINE_ANGLES.includes(im.angle)) continue;
        if (im.needs_scraping === true) continue;
        if (!im.url) continue;
        if (canonical && im.url === canonical) continue;
        filled.add(im.angle);
      }
    }
    return { filled, trims: trimsInFam };
  }

  for (const model of cat.models) {
    const myVal = model.model_year;
    const families = new Set();
    for (const t of (model.trims || [])) families.add(t.trim_family || t.trim_slug);

    for (const famKey of families) {
      const { filled, trims } = familyAngleFillState(model, famKey);
      if (filled.size >= 2) continue; // Tier 1 sufficient — skip fallback per policy

      const missingAngles = BASELINE_ANGLES.filter(a => !filled.has(a));

      // Tier 3 attempt
      const tier3Spec = tier3Endpoints[model.model_slug];
      if (tier3Spec) {
        const t3url = typeof tier3Spec === "string" ? tier3Spec : tier3Spec.endpoint;
        if (t3url) {
          console.log(`  tier3 try ${model.model_slug}/${famKey} (filled ${filled.size}/4)  …  ${t3url}`);
          const r = await fetchTier3Endpoint(t3url);
          if (r.ok) {
            let cands;
            const trimmed = r.body.trim();
            if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
              cands = extractURLsFromText(r.body, blacklist);
            } else {
              cands = extractCandidates(r.body, r.finalUrl || t3url, blacklist);
            }
            console.log(`    tier3 candidates: ${cands.length}`);
            applyFallbackCandidates(cands, trims, missingAngles, model, famKey, 3);
          } else {
            console.log(`    tier3 FAIL: ${r.status || r.error}`);
          }
        }
      }

      // Recount filled after Tier 3
      const { filled: filled2 } = familyAngleFillState(model, famKey);
      if (filled2.size >= 2) continue; // Tier 3 was sufficient

      // Tier 2 attempt
      const t2urls = tier2Endpoints[model.model_slug];
      if (Array.isArray(t2urls) && t2urls.length) {
        const stillMissing = BASELINE_ANGLES.filter(a => !filled2.has(a));
        const cands = [];
        for (const t2url of t2urls) {
          if (!tierTwoPageMatchesMY(t2url, myVal)) {
            console.log(`    tier2 skip (wrong MY in URL): ${t2url}`);
            continue;
          }
          // Classify the URL — must come back as Tier 2 to be allowed.
          if (classifyTier(t2url) !== 2) {
            console.log(`    tier2 skip (URL not classified as Tier 2): ${t2url}`);
            continue;
          }
          console.log(`  tier2 try ${model.model_slug}/${famKey} (filled ${filled2.size}/4)  …  ${t2url}`);
          const r = await fetchHTML(t2url);
          if (!r.ok) {
            console.log(`    tier2 fetch FAIL: ${r.status || r.error}`);
            continue;
          }
          // Post-fetch MY verification: redirects can take us to a brand
          // landing page that has the wrong MY's photography. If the final
          // URL no longer contains the model_year, skip the candidates.
          // This guards against the NetCarShow pattern where requesting a
          // year-model URL that doesn't exist 302's to the brand landing.
          if (r.finalUrl && !tierTwoPageMatchesMY(r.finalUrl, myVal)) {
            console.log(`    tier2 skip (final URL redirected away from MY ${myVal}): ${r.finalUrl}`);
            continue;
          }
          const pageCands = extractCandidates(r.html, r.finalUrl, blacklist);
          // Tier 2 candidates are scoped to the model — the page is
          // explicitly about this model/year. Still, an aggregator page may
          // include cross-promotional "related" imagery of other models
          // (e.g., a Ferrari Amalfi page may carry a 12Cilindri thumbnail
          // in its sidebar). Apply slug-match filtering so we only consume
          // candidates whose URL or alt-text mentions this model's slug.
          const filtered = pageCands.filter(c =>
            slugMatchesURL(model.model_slug, `${c.url} ${c.context || ""}`, slugVariants));
          console.log(`    tier2 candidates: ${pageCands.length} total, ${filtered.length} model-matched`);
          cands.push(...filtered);
        }
        if (cands.length) {
          const fillsStandard = applyFallbackCandidates(cands, trims, stillMissing, model, famKey, 2);
          // Session 15: NetCarShow positional fallback — fires only when
          // standard angle-matching produced zero fills for this family
          // AND the candidates include NetCarShow heroes. Skip when the
          // brand's pre-run coverage is high (gated inside the helper).
          if (fillsStandard === 0 && cands.some(c => isHostNetCarShow(c.url))) {
            const positionalFills = applyNetCarShowPositional(cands, trims, stillMissing, model, famKey);
            if (positionalFills > 0) {
              console.log(`    netcarshow positional: ${positionalFills} angle(s) assigned by editorial layout position`);
            }
          }
        }
      }
    }
  }

  // Helper used by the tier-2/3 fallback loop above.
  // Returns the number of image entries filled in this call.
  function applyFallbackCandidates(cands, trims, missingAngles, model, famKey, tier) {
    if (cands.length === 0) return 0;
    // Dedupe by URL.
    const seenCand = new Set();
    const uniqueCands = [];
    for (const c of cands) {
      if (seenCand.has(c.url)) continue;
      seenCand.add(c.url); uniqueCands.push(c);
    }
    const used = new Set();
    let fillsInCall = 0;
    // Per trim in this family, attempt to fill missing baseline angles only.
    for (const trim of trims) {
      for (const img of (trim.images || [])) {
        if (!BASELINE_ANGLES.includes(img.angle)) continue;
        if (!missingAngles.includes(img.angle)) continue;
        // Skip if this image entry is already resolved (could be from same
        // trim's other angle that just got filled by an earlier candidate).
        if (img.needs_scraping !== true && img.url && img.url !== modelPages[model.model_slug]) {
          // Already filled (either pre-existing or just filled). Skip.
          continue;
        }
        let best = pickBestForAngle(uniqueCands, img.angle, used, brandAnglePatterns);
        if (!best) best = pickByPosition(uniqueCands, img.angle, used);
        if (!best) continue;
        // Tier classifier sanity check on the resolved URL itself
        const candTier = classifyTier(best.url);
        if (candTier === null) {
          console.log(`    skip (denied URL): ${best.url}`);
          continue;
        }
        // Tier 3 candidates extracted from a manufacturer endpoint sometimes
        // point at a Tier 1 CDN domain. Honor the access-surface tier (the
        // tier we set for this fallback attempt), not the URL's classified
        // tier — provenance reflects HOW we found the URL.
        img.url = best.url;
        if (img.downloaded === true) img.downloaded = false;
        used.add(best.url);
        rewritten++;
        tier2Or3FillsThisRun++;
        fillsInCall++;
        attachProvenance(img, tier);
        maybeAddTrimNote(model, trim, tier, sourceDomain(best.url));
        if (angleSamples.length < 18) {
          angleSamples.push({
            model: model.model_slug, trim: trim.trim_slug, angle: img.angle,
            score: `T${tier}`, url: best.url,
          });
        }
      }
    }
    return fillsInCall;
  }

  // Session 15: NetCarShow positional fallback. Fires when:
  //   (a) standard Tier 2 matching produced zero fills for the family,
  //   (b) candidates include >= 1 hero-sized NetCarShow URL (NetCarShow
  //       model overview pages typically serve exactly one hero per
  //       model — verified on Ferrari Amalfi: 1 hero `Ferrari-Amalfi-
  //       2026-1280-<hash>.jpg`, 1 wallpaper, 1 IG, 1 infographic,
  //       1-3 thumbnails. With one hero, only front_three_quarter is
  //       assigned positionally — the other angles stay unfilled.
  //       Better partial coverage than wrong assignments.),
  //   (c) the brand's pre-run Tier 1 coverage is below
  //       NETCARSHOW_BRAND_COVERAGE_THRESHOLD.
  // Hero candidates are ordered by their position in `cands` (which
  // preserves HTML emission order from extractCandidates) and assigned
  // positionally: 1st → front_three_quarter, 2nd → rear_three_quarter,
  // 3rd → side_profile, 4th → interior_dashboard. The provenance note
  // is the positional variant to make this audit-distinguishable from
  // standard Tier 2 matches.
  function applyNetCarShowPositional(cands, trims, missingAngles, model, famKey) {
    if (brandPreCoverage >= NETCARSHOW_BRAND_COVERAGE_THRESHOLD) return 0;
    // Collect hero candidates in input order, deduped by URL.
    const seenH = new Set();
    const heroes = [];
    for (const c of cands) {
      if (!isNetCarShowHero(c)) continue;
      if (seenH.has(c.url)) continue;
      seenH.add(c.url);
      heroes.push(c);
    }
    if (heroes.length < 1) return 0;
    const POSITIONAL_ORDER = [
      "front_three_quarter",
      "rear_three_quarter",
      "side_profile",
      "interior_dashboard",
    ];
    const angleToHero = {};
    for (let i = 0; i < POSITIONAL_ORDER.length && i < heroes.length; i++) {
      angleToHero[POSITIONAL_ORDER[i]] = heroes[i];
    }
    let fills = 0;
    const canonical = modelPages[model.model_slug];
    const noteText = "Hero photography positional fallback from netcarshow.com; angle assignments by editorial layout position.";
    for (const trim of trims) {
      for (const img of (trim.images || [])) {
        if (!BASELINE_ANGLES.includes(img.angle)) continue;
        if (!missingAngles.includes(img.angle)) continue;
        if (img.needs_scraping !== true && img.url && img.url !== canonical) continue;
        const hero = angleToHero[img.angle];
        if (!hero) continue;
        img.url = hero.url;
        if (img.downloaded === true) img.downloaded = false;
        img.assignment_method = "positional_netcarshow";
        attachProvenance(img, 2);
        // Trim-note (positional variant — distinct from the standard Tier 2 note).
        const key = `${model.model_slug}::${trim.trim_slug}`;
        if (!provenanceNoteAdded.has(key)) {
          const existing = trim.notes || "";
          trim.notes = existing
            ? (existing.includes(noteText) ? existing : (existing + " " + noteText))
            : noteText;
          provenanceNoteAdded.add(key);
        }
        fills++;
        rewritten++;
        tier2Or3FillsThisRun++;
        netcarshowPositionalFills++;
        netcarshowPositionalTrims.add(key);
        if (angleSamples.length < 18) {
          angleSamples.push({
            model: model.model_slug, trim: trim.trim_slug, angle: img.angle,
            score: "T2pos", url: hero.url,
          });
        }
      }
    }
    return fills;
  }

  // Defensive one-deep backup before mutating the brand JSONs.
  await backupOne(SRC_DATA);
  await backupOne(CAT_DATA);

  await fs.writeFile(CAT_DATA, JSON.stringify(cat, null, 2));
  await fs.writeFile(SRC_DATA, JSON.stringify(cat, null, 2));

  // Summary
  console.log("\n========================================");
  console.log("  SCRAPE SUMMARY");
  console.log("========================================");
  console.log(`Brand:                          ${brand}`);
  console.log(`Pages attempted:                ${pageURLs.size}`);
  console.log(`Pages failed:                   ${failedPages.length}`);
  for (const f of failedPages) console.log(`  - ${f.url}  (${f.reason})`);
  console.log(`Pages escalated to Playwright:  ${playwrightEscalated} of ${pageURLs.size}`);
  console.log(`  Playwright successes:         ${playwrightSucceeded}`);
  console.log(`  Playwright failures:          ${playwrightFailed}`);
  if (skippedModels.length) {
    console.log(`Models skipped (no page URL): ${skippedModels.length}`);
    for (const s of skippedModels) console.log(`  - ${s}`);
  }
  console.log(`Image entries rewritten:        ${rewritten}`);
  console.log(`  via text/URL pattern match:   ${rewritten - rewrittenViaPosition - rewrittenViaBrandPattern - tier2Or3FillsThisRun}`);
  console.log(`  via brand-specific angle:     ${rewrittenViaBrandPattern}`);
  console.log(`  via positional fallback:      ${rewrittenViaPosition}`);
  console.log(`  via tier-2/3 fallback:        ${tier2Or3FillsThisRun}`);
  console.log(`Brand-specific angle matches:   ${rewrittenViaBrandPattern}`);
  console.log(`Resolution upgrades:            ${resolutionUpgrades} URLs preferred larger variants`);
  console.log(`Extension-less URLs accepted:   ${extensionlessAccepted} candidate(s) (would have been rejected by old IMG_EXT_RE filter)`);
  console.log(`Image entries via ext-less URL: ${rewrittenExtensionless}`);
  console.log(`Image entries unchanged:        ${unchanged}`);
  console.log(`\nTier breakdown (provenance):`);
  console.log(`  Tier 1 (manufacturer):        ${tierBreakdown[1] || 0}`);
  console.log(`  Tier 2 (press aggregation):   ${tierBreakdown[2] || 0}`);
  console.log(`  Tier 3 (configurator API):    ${tierBreakdown[3] || 0}`);
  console.log(`NetCarShow positional fallback: ${netcarshowPositionalFills} images across ${netcarshowPositionalTrims.size} trims`);

  if (angleSamples.length > 0) {
    console.log(`\nSample rewrites:`);
    for (const s of angleSamples)
      console.log(`  [${s.score}] ${s.model}/${s.trim}/${s.angle}\n        → ${s.url}`);
  }

  if (stillMissingByModel.size > 0) {
    console.log(`\nModels with unresolved angles:`);
    for (const [slug, angles] of stillMissingByModel)
      console.log(`  ${slug}: ${angles.length} entries  (e.g. ${angles.slice(0,3).join(", ")})`);
  }
}

function addMiss(map, slug, entry) {
  if (!map.has(slug)) map.set(slug, []);
  map.get(slug).push(entry);
}

main()
  .catch(e => { console.error("Fatal:", e); process.exitCode = 1; })
  .finally(async () => { await closePlaywrightBrowser(); });
