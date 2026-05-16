#!/usr/bin/env node
// DIAGNOSTIC — dump raw image candidates from the 3 Ram model pages so we can
// see why slugMatchesURL is rejecting most of them.
//
// Phase-C result: 3 pages produced 14-35 raw candidates each but only 14 of
// them slug-matched (15.9% coverage). Suspected pattern: candidate URLs/alts
// reference the model as bare "1500"/"2500"/"3500" (the truck nameplates),
// while slug is "ram-1500" etc. Need to inspect the actual URLs + alt text to
// confirm and choose slug_variants that don't false-positive on dimension
// tokens like "1500x1500".
//
// Logs to: reports/ram_candidates_raw.log
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
const OUT_PATH = path.join(PROJECT_ROOT, "reports", "ram_candidates_raw.log");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
           "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const ACCEPT_HTML = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
const TIMEOUT_MS = 20000;

// Ram has 3 model pages. Slug == ram-1500/2500/3500.
const TARGETS = [
  { slug: "ram-1500", url: "https://www.ramtrucks.com/ram-1500.html" },
  { slug: "ram-2500", url: "https://www.ramtrucks.com/ram-2500.html" },
  { slug: "ram-3500", url: "https://www.ramtrucks.com/ram-3500.html" },
];

const IMG_EXT_RE = /\.(jpe?g|png|webp|avif)(?:\?[^"'\s)]*)?$/i;
// Use the exact blacklist from the ram brand-config for fidelity.
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
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, html: await res.text(), finalUrl: res.url };
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
  const cfgPath = path.join(PROJECT_ROOT, "scripts", "brand-configs", "ram.json");
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
  log(`# Ram candidate dump — generated ${new Date().toISOString()}`);
  log(`# Loaded slug_variants for: ${Object.keys(slugVariants).join(", ")}`);
  for (const slug of Object.keys(slugVariants)) {
    log(`#   ${slug}: ${JSON.stringify(slugVariants[slug])}`);
  }
  log("");

  for (const t of TARGETS) {
    log(`========================================================================`);
    log(`# MODEL: ${t.slug}`);
    log(`# URL:   ${t.url}`);
    log(`# variants used: ${JSON.stringify(slugVariants[t.slug] || [t.slug])}`);
    log(`========================================================================`);

    const r = await fetchHTML(t.url);
    if (!r.ok) {
      log(`FETCH FAILED: ${JSON.stringify(r)}`);
      log("");
      continue;
    }
    const finalUrl = r.finalUrl;
    log(`# finalUrl: ${finalUrl}`);
    log(`# html bytes: ${r.html.length}`);

    const rawCands = extractCandidates(r.html, finalUrl, BLACKLIST);
    const cands = uniqueByUrl(rawCands);
    log(`# raw candidates (NOT deduped, total): ${rawCands.length}`);
    log(`# raw candidates (deduped by URL): ${cands.length}`);

    // How many slug-match with the CURRENT variants?
    const matched = cands.filter(c =>
      slugMatchesURL(t.slug, `${c.url} ${c.context}`, slugVariants));
    log(`# slug-matching with current variants (deduped): ${matched.length}`);
    const matchedRaw = rawCands.filter(c =>
      slugMatchesURL(t.slug, `${c.url} ${c.context}`, slugVariants));
    log(`# slug-matching with current variants (NOT deduped): ${matchedRaw.length}`);

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

    // Path-token histogram (segments)
    const tokCount = new Map();
    for (const c of cands) {
      const segs = pathname(c.url).toLowerCase().split(/[/_\-.]+/).filter(Boolean);
      const uniq = new Set(segs);
      for (const s of uniq) {
        if (s.length < 3) continue;
        if (/^\d+$/.test(s) && !["1500","2500","3500","4500","5500"].includes(s)) continue;
        if (["jpg","jpeg","png","webp","avif","com","www"].includes(s)) continue;
        tokCount.set(s, (tokCount.get(s) || 0) + 1);
      }
    }
    const topTok = [...tokCount.entries()].sort((a,b)=>b[1]-a[1]).slice(0, 30);
    log(`# top URL-path tokens:`);
    for (const [tok, n] of topTok) log(`#   ${n.toString().padStart(4)}  ${tok}`);

    // Angle-pattern preview: for each slug-matched candidate, see which angle
    // patterns it would match against. This is the FINAL filter the scraper
    // applies after slugMatchesURL — even a perfect slug match is useless if
    // no angle pattern hits.
    function angleHits(hay) {
      const hits = [];
      hay = hay.toLowerCase();
      // Mirror ANGLE_PATTERNS from scrape_image_urls.mjs
      const pats = {
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
      for (const [angle, list] of Object.entries(pats)) {
        let s = 0;
        for (const p of list) if (p.re.test(hay)) s += p.score;
        if (s > 0) hits.push(`${angle}:${s}`);
      }
      return hits;
    }

    // Dump ALL raw candidates so we can see what the scraper is rejecting.
    log(`# ALL ${cands.length} raw candidates (with slug match + angle hits):`);
    for (let i = 0; i < cands.length; i++) {
      const c = cands[i];
      const isMatch = slugMatchesURL(t.slug, `${c.url} ${c.context}`, slugVariants);
      const angles = angleHits(`${c.url} ${c.context||""}`);
      log(`  [${(i+1).toString().padStart(2)}] ${isMatch ? "MATCH" : "MISS "}: ${c.url}`);
      log(`        alt: ${JSON.stringify((c.context||"").trim().slice(0, 160))}`);
      log(`        src: ${c.source}  angles: [${angles.join(", ")}]`);
    }
    log("");

    // Tally: of slug-matched candidates, how many have ANY angle hit?
    const slugMatched = cands.filter(c =>
      slugMatchesURL(t.slug, `${c.url} ${c.context}`, slugVariants));
    const slugMatchedAndAngled = slugMatched.filter(c =>
      angleHits(`${c.url} ${c.context||""}`).length > 0);
    log(`# of ${slugMatched.length} slug-matched candidates, ${slugMatchedAndAngled.length} also match >=1 angle pattern.`);
    log("");

    // Investigate false-positive risk for bare-number variant.
    // If we add "1500" / "2500" / "3500" naively, would any candidates match
    // via a dimension token like "1500x1500" or "1500w" instead of the model
    // identity? The regex `(^|[/_ -])1500([/_ -]|\\.|$)` would NOT match
    // "1500x1500" because "x" is not in the boundary set, so we should be
    // safe — but let's enumerate counterexamples directly.
    log(`# false-positive scan: candidates whose URL contains "1500"/"2500"/"3500"`);
    const numTokens = ["1500", "2500", "3500"];
    for (const nt of numTokens) {
      const hits = cands.filter(c => {
        const hay = (c.url + " " + (c.context||"")).toLowerCase();
        return hay.includes(nt);
      });
      log(`#   candidates containing "${nt}": ${hits.length}`);
      // For each, show whether the slug-regex (with the bare number) would match.
      // We simulate the regex against the haystack.
      const re = new RegExp(`(^|[/_ -])${nt}([/_ -]|\\.|$)`, "i");
      let wouldMatchCount = 0;
      const wouldMatchSamples = [];
      const wouldNotMatchSamples = [];
      for (const c of hits) {
        const hay = (c.url + " " + (c.context||"")).toLowerCase();
        if (re.test(hay)) {
          wouldMatchCount++;
          if (wouldMatchSamples.length < 6) wouldMatchSamples.push(c);
        } else {
          if (wouldNotMatchSamples.length < 3) wouldNotMatchSamples.push(c);
        }
      }
      log(`#     of those, would match bare-number variant regex: ${wouldMatchCount}`);
      for (const c of wouldMatchSamples) {
        log(`#       MATCH-IF-BARE: ${c.url}`);
        log(`#                alt: ${JSON.stringify((c.context||"").trim().slice(0,100))}`);
      }
      if (wouldNotMatchSamples.length > 0) {
        log(`#     samples that would NOT match (e.g. "1500x1500" embedded):`);
        for (const c of wouldNotMatchSamples) {
          log(`#       NOMATCH-IF-BARE: ${c.url}`);
        }
      }
    }
    log("");
  }

  await fs.writeFile(OUT_PATH, lines.join("\n"), "utf-8");
  console.log(`\n--- wrote ${OUT_PATH} (${lines.length} lines) ---`);
}

main().catch(e => { console.error("Fatal:", e); process.exitCode = 1; });
