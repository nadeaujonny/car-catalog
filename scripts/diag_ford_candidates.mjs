// DIAGNOSTIC (ford phase-C-bis) — dump raw image candidates from a handful of
// Ford model pages so we can see what URL/alt-text patterns the ford.com site
// actually serves. The slug-match gap (40.4% coverage) means the static fetch
// pulls 600-2199 candidates per page but only ~82 of them match any model
// slug — this script lets us read the haystack ourselves and decide which
// slug_variants to add to scripts/brand-configs/ford.json.
//
// Inlines the static-fetch + extractCandidates logic from scrape_image_urls.mjs
// so we can run it standalone with no side effects.
//
// Usage:
//   node scripts/diag_ford_candidates.mjs > reports/ford_candidates_raw.log
//
// Safe to delete after the investigation.

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

// Load the ford config so we use the SAME blacklist + slug_variants as the real
// scraper. That way "candidates" in this dump equal "candidates" in production.
async function readJSON(p) {
  const s = await fs.readFile(p, "utf-8");
  return JSON.parse(s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s);
}

async function fetchHTML(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept": ACCEPT_HTML, "Accept-Language": "en-US,en;q=0.9" },
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

const IMG_EXT_RE = /\.(jpe?g|png|webp|avif)(?:\?[^"'\s)]*)?$/i;

function isPlausibleImageURL(url, blacklist) {
  try {
    const u = new URL(url);
    if (!IMG_EXT_RE.test(u.pathname)) return false;
    if (/\.svg\b/i.test(u.pathname)) return false;
    const full = u.pathname + (u.search || "");
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
    if (abs) out.push({ url: abs });
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
  const push = (url, context) => {
    if (!url) return;
    const abs = resolveURL(htmlDecode(url), baseUrl);
    if (!abs) return;
    if (!isPlausibleImageURL(abs, blacklist)) return;
    list.push({ url: abs, context: context || "" });
  };
  const imgRe = /<img\b([^>]*)>/gi;
  let m;
  while ((m = imgRe.exec(html))) {
    const a = m[1];
    const alt = (attr(a, "alt") || "") + " " + (attr(a, "title") || "");
    push(attr(a, "src"), alt);
    push(attr(a, "data-src"), alt);
    const ss = attr(a, "srcset") || attr(a, "data-srcset");
    for (const s of parseSrcset(ss, baseUrl)) list.push({ url: s.url, context: alt });
  }
  const sourceRe = /<source\b([^>]*)>/gi;
  while ((m = sourceRe.exec(html))) {
    const a = m[1];
    const ss = attr(a, "srcset") || attr(a, "data-srcset");
    for (const s of parseSrcset(ss, baseUrl)) list.push({ url: s.url, context: "" });
  }
  const ogRe1 = /<meta\b[^>]*property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/gi;
  while ((m = ogRe1.exec(html))) push(m[1], "og:image");
  const preloadRe = /<link\b[^>]*rel=["']preload["'][^>]*as=["']image["'][^>]*href=["']([^"']+)["']/gi;
  while ((m = preloadRe.exec(html))) push(m[1], "preload");
  const bgRe = /background-image\s*:\s*url\(["']?([^)"']+)["']?\)/gi;
  while ((m = bgRe.exec(html))) push(m[1], "background");
  const nakedRe = /["'](https?:\/\/[^"'\s]+?\.(?:jpe?g|png|webp|avif)(?:\?[^"'\s]*)?)["']/gi;
  while ((m = nakedRe.exec(html))) push(m[1], "naked");
  const cdnRe = /["'](\/-\/media\/[^"'\s]+?\.(?:jpe?g|png|webp|avif)(?:\?[^"'\s]*)?)["']/gi;
  while ((m = cdnRe.exec(html))) push(m[1], "cdn-rel");
  return list;
}

// Same regex shape as scrape_image_urls.mjs.
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

// Pages to inspect: representative across F-150 family (huge truck hub),
// Mustang (cars hub), Bronco (suv hub with sibling Bronco Sport collision),
// Mach-E (suv hub with Mustang naming collision), and Super Duty (shared
// template across f-250/f-350/f-450).
const SAMPLES = [
  { slug: "f-150",           url: "https://www.ford.com/trucks/f150/" },
  { slug: "mustang",         url: "https://www.ford.com/cars/mustang/" },
  { slug: "bronco",          url: "https://www.ford.com/suvs/bronco/" },
  { slug: "bronco-sport",    url: "https://www.ford.com/suvs/bronco-sport/" },
  { slug: "mustang-mach-e",  url: "https://www.ford.com/suvs/mach-e/" },
  { slug: "f-250-super-duty",url: "https://www.ford.com/trucks/super-duty/f-250/" },
];

async function main() {
  const cfg = await readJSON(path.join(PROJECT_ROOT, "scripts", "brand-configs", "ford.json"));
  const blacklist = new RegExp(cfg.path_blacklist_regex, "i");
  const slugVariants = cfg.slug_variants || {};
  const allSlugs = Object.keys(cfg.model_pages);

  console.log("# Ford candidate dump — diagnostic for slug-match gap");
  console.log(`# Pages sampled: ${SAMPLES.length}`);
  console.log("");

  for (const sample of SAMPLES) {
    console.log(`================================================================`);
    console.log(`PAGE: ${sample.slug}`);
    console.log(`URL:  ${sample.url}`);
    console.log(`================================================================`);
    const r = await fetchHTML(sample.url);
    if (!r.ok) {
      console.log(`  FETCH FAILED: ${r.status || r.error}`);
      console.log("");
      continue;
    }
    const cands = extractCandidates(r.html, r.finalUrl, blacklist);
    console.log(`  raw candidates: ${cands.length}`);

    // Group: which candidates already match THIS page's primary model? Which
    // match ANY ford model? Which match nothing?
    const matchedThis = [];
    const matchedOther = [];
    const unmatched = [];
    for (const c of cands) {
      const hay = `${c.url} ${c.context || ""}`;
      let matchedAny = null;
      for (const s of allSlugs) {
        if (slugMatchesURL(s, hay, slugVariants)) { matchedAny = s; break; }
      }
      if (matchedAny === sample.slug) matchedThis.push(c);
      else if (matchedAny) matchedOther.push({ ...c, matchedAs: matchedAny });
      else unmatched.push(c);
    }
    console.log(`  matched as ${sample.slug}: ${matchedThis.length}`);
    console.log(`  matched as other model: ${matchedOther.length}`);
    console.log(`  unmatched: ${unmatched.length}`);
    console.log("");

    // Dump the assets.ford.com candidates only (those are the meaningful ones)
    // grouped by whether they currently match.
    const isFordAsset = (u) => /assets\.ford\.com|ford\.com\/.*\/media/i.test(u);
    const fordAssets = cands.filter(c => isFordAsset(c.url));
    console.log(`  ford-asset candidates (assets.ford.com / ford.com media): ${fordAssets.length}`);
    console.log(`  --- ford-asset URLs + alt-text (full list) ---`);
    for (const c of fordAssets) {
      const u = new URL(c.url);
      // Show pathname (the descriptive filename is what we care about) plus alt.
      const filename = u.pathname.split("/").pop();
      const matched = slugMatchesURL(sample.slug, `${c.url} ${c.context || ""}`, slugVariants);
      const flag = matched ? "[MATCH]" : "[MISS ]";
      console.log(`    ${flag}  filename=${filename}`);
      if (c.context && c.context.trim()) {
        console.log(`             alt=${c.context.trim().slice(0, 140)}`);
      }
    }
    console.log("");

    // Also pick up to 20 unmatched candidates with non-empty alt text so we
    // can see what shapes of alt-text are out there.
    const unmatchedWithAlt = unmatched.filter(c => c.context && c.context.trim().length > 5);
    console.log(`  --- unmatched candidates with alt text (up to 25) ---`);
    let n = 0;
    for (const c of unmatchedWithAlt) {
      if (n >= 25) break;
      const u = (() => { try { return new URL(c.url); } catch { return null; } })();
      const filename = u ? u.pathname.split("/").pop() : c.url;
      console.log(`    filename=${filename}`);
      console.log(`             alt=${c.context.trim().slice(0, 140)}`);
      n++;
    }
    console.log("");
    console.log("");
  }
}

main().catch(e => { console.error("Fatal:", e); process.exitCode = 1; });
