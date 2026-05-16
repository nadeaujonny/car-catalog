#!/usr/bin/env node
// Download images referenced in catalog/data/<brand>.json (and data/<brand>.json).
// Saves files to catalog/<local_path> (relative to the catalog/ root, so the
// served site can find them via the same relative path that's in the JSON).
//
// Usage:
//   node scripts/download_images.mjs --brand <brand_slug>
//
// On success, sets image.downloaded = true in BOTH data/<brand>.json and
// catalog/data/<brand>.json. On failure, leaves the entry alone and logs
// the model/trim/angle/url/error to the summary.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const CATALOG_DIR  = path.join(PROJECT_ROOT, "catalog");

// Strip a leading UTF-8 BOM if present so JSON.parse doesn't fail on it.
function stripBOM(s) {
  return (s && s.charCodeAt(0) === 0xFEFF) ? s.slice(1) : s;
}

async function readJSON(p) {
  return JSON.parse(stripBOM(await fs.readFile(p, "utf-8")));
}

async function backupOne(srcPath) {
  try { await fs.copyFile(srcPath, srcPath + ".bak"); }
  catch (e) { console.warn(`  (warn) could not back up ${srcPath}: ${e.message}`); }
}

// Many image hosts reject the default `node` UA or block on Accept: image/*.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
           "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const ACCEPT = "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8";
const TIMEOUT_MS = 15000;

const stats = {
  attempted: 0,
  succeeded: 0,
  byStatus: {},
  byErrorKind: {},
};
const failures = [];

/* --------------------------------------------------------------
   CLI argument parsing
   -------------------------------------------------------------- */
function parseArgs(argv) {
  const args = { brand: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--brand" && i + 1 < argv.length) {
      args.brand = argv[++i];
    }
  }
  return args;
}

// Session 14: per-source Referer mapping. Some Tier 2 sources (NetCarShow,
// Car and Driver image CDN) reject hot-linked requests; when the source URL
// hostname maps to one of these, supply the source-origin Referer instead of
// the brand's manufacturer-origin Referer. Order of preference is:
//   1. Explicit hostname → Referer override
//   2. Configured brand Referer
//   3. Auto-derived from URL origin (last-ditch fallback for known-strict CDNs)
const PER_HOST_REFERER = {
  "netcarshow.com":        "https://www.netcarshow.com/",
  "www.netcarshow.com":    "https://www.netcarshow.com/",
  "caranddriver.com":      "https://www.caranddriver.com/",
  "www.caranddriver.com":  "https://www.caranddriver.com/",
  "hips.hearstapps.com":   "https://www.caranddriver.com/",
  "motortrend.com":        "https://www.motortrend.com/",
  "www.motortrend.com":    "https://www.motortrend.com/",
  "roadandtrack.com":      "https://www.roadandtrack.com/",
  "www.roadandtrack.com":  "https://www.roadandtrack.com/",
  "hagerty.com":           "https://www.hagerty.com/",
  "www.hagerty.com":       "https://www.hagerty.com/",
  "edmunds.com":           "https://www.edmunds.com/",
  "www.edmunds.com":       "https://www.edmunds.com/",
  "digitalassets.tesla.com": "https://www.tesla.com/",
};

function refererForURL(url, defaultReferer) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (PER_HOST_REFERER[host]) return PER_HOST_REFERER[host];
  } catch { /* malformed url — fall through to default */ }
  return defaultReferer;
}

async function downloadOne(url, savePath, referer) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const headers = { "User-Agent": UA, "Accept": ACCEPT };
    // Session 6, Phase 4: many manufacturer CDNs/buckets (notably Toyota's
    // toyota-cms-media.s3.amazonaws.com — 137 entries 403'd in Session 5)
    // gate downloads on a Referer header matching the consumer-site origin.
    // The brand config supplies the Referer (or it is auto-derived from the
    // first model_page URL's origin — typically https://www.<brand>.com/).
    // Session 14: per-host overrides apply for Tier 2 sources that gate
    // hot-linking against their own origin (NetCarShow, hearstapps, etc.).
    const effectiveReferer = refererForURL(url, referer);
    if (effectiveReferer) headers["Referer"] = effectiveReferer;
    const res = await fetch(url, {
      headers,
      redirect: "follow",
      signal: ctrl.signal,
    });
    if (!res.ok) {
      return { ok: false, kind: "status", status: res.status, statusText: res.statusText };
    }
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (!ct.startsWith("image/")) {
      return { ok: false, kind: "wrong-content-type", contentType: ct };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) return { ok: false, kind: "empty" };
    await fs.mkdir(path.dirname(savePath), { recursive: true });
    await fs.writeFile(savePath, buf);
    return { ok: true, size: buf.length, contentType: ct };
  } catch (err) {
    if (err.name === "AbortError") return { ok: false, kind: "timeout" };
    return { ok: false, kind: "network-error", message: err.message };
  } finally {
    clearTimeout(t);
  }
}

function bump(map, key) { map[key] = (map[key] || 0) + 1; }

async function main() {
  const args = parseArgs(process.argv);
  if (!args.brand) {
    console.error("Usage: node scripts/download_images.mjs --brand <brand_slug>");
    process.exit(2);
  }

  const brand = args.brand;
  const SRC_DATA = path.join(PROJECT_ROOT, "data", `${brand}.json`);
  const CAT_DATA = path.join(CATALOG_DIR, "data", `${brand}.json`);
  const CONFIG   = path.join(PROJECT_ROOT, "scripts", "brand-configs", `${brand}.json`);

  for (const f of [SRC_DATA, CAT_DATA]) {
    try { await fs.access(f); }
    catch { console.error(`Missing required file: ${f}`); process.exit(1); }
  }

  const cat = await readJSON(CAT_DATA);

  // Resolve a Referer header value for this brand. Order of preference:
  //   1. `referer` field in scripts/brand-configs/<brand>.json (explicit override)
  //   2. Auto-derived from the first model_page URL's origin in the config
  //   3. null (no Referer sent — pre-Session-6 behavior, kept for backward compat)
  // The Referer is required by toyota-cms-media.s3.amazonaws.com (and likely
  // similar manufacturer S3 buckets) to gate hot-linking — fixes Toyota's 137
  // 403'd downloads from Session 5.
  let referer = null;
  try {
    const cfg = await readJSON(CONFIG);
    if (cfg && typeof cfg.referer === "string" && cfg.referer.startsWith("http")) {
      referer = cfg.referer;
    } else if (cfg && cfg.model_pages) {
      const firstUrl = Object.values(cfg.model_pages).find(u => typeof u === "string" && u.startsWith("http"));
      if (firstUrl) {
        try { referer = new URL(firstUrl).origin + "/"; } catch { /* leave null */ }
      }
    }
  } catch { /* config missing — leave referer null */ }

  let total = 0;
  for (const m of cat.models) for (const t of (m.trims || [])) total += (t.images || []).length;
  console.log(`Brand: ${brand}`);
  console.log(`Referer header: ${referer || "(none)"}`);
  console.log(`Found ${total} image entries across ${cat.models.length} models.\n`);

  let i = 0;
  for (const model of cat.models) {
    for (const trim of (model.trims || [])) {
      for (const img of (trim.images || [])) {
        i++;
        stats.attempted++;
        const url = img.url;
        const localPath = img.local_path;
        const tag = `[${i}/${total}] ${model.model_slug}/${trim.trim_slug}/${img.angle}`;

        if (!url || !localPath) {
          bump(stats.byErrorKind, "missing-fields");
          failures.push({ model: model.model_slug, trim: trim.trim_slug, angle: img.angle, url, kind: "missing-fields" });
          console.log(`${tag}  SKIP (missing url or local_path)`);
          continue;
        }

        if (img.downloaded === true) {
          // Re-run safety: skip if previously marked downloaded AND file exists.
          const savePath = path.join(CATALOG_DIR, localPath);
          try {
            const stat = await fs.stat(savePath);
            if (stat.size > 0) {
              stats.succeeded++;
              console.log(`${tag}  cached (${stat.size} bytes)`);
              continue;
            }
          } catch { /* file missing — fall through to re-download */ }
        }

        const savePath = path.join(CATALOG_DIR, localPath);
        const res = await downloadOne(url, savePath, referer);
        if (res.ok) {
          stats.succeeded++;
          img.downloaded = true;
          // Session 14: record actual response Content-Type for downstream
          // verification (helps catch source-mismatch cases where a URL
          // resolves but returns a different media type than expected).
          img.content_type = res.contentType;
          console.log(`${tag}  ok (${res.size} bytes, ${res.contentType})`);
        } else {
          const key = res.kind === "status" ? `status-${res.status}` : res.kind;
          if (res.kind === "status") bump(stats.byStatus, res.status);
          else bump(stats.byErrorKind, res.kind);
          failures.push({
            model: model.model_slug, trim: trim.trim_slug, angle: img.angle, url,
            kind: res.kind, status: res.status, statusText: res.statusText,
            contentType: res.contentType, message: res.message,
          });
          const detail = res.status ? `HTTP ${res.status} ${res.statusText || ""}`
                       : res.contentType ? `content-type ${res.contentType}`
                       : res.message ? res.message : "";
          console.log(`${tag}  FAIL (${res.kind}${detail ? " — " + detail.trim() : ""})`);
        }
      }
    }
  }

  // Write back BOTH files only if anything changed.
  if (stats.succeeded > 0) {
    // Defensive one-deep backup before mutating the brand JSONs.
    await backupOne(SRC_DATA);
    await backupOne(CAT_DATA);
    await fs.writeFile(CAT_DATA, JSON.stringify(cat, null, 2));
    await fs.writeFile(SRC_DATA, JSON.stringify(cat, null, 2));
    console.log(`\nUpdated catalog/data/${brand}.json and data/${brand}.json with downloaded flags.`);
  } else {
    console.log(`\nNo downloads succeeded — JSON files left untouched.`);
  }

  // Per-model success/total
  const perModel = [];
  for (const m of cat.models) {
    let mt = 0, ms = 0;
    for (const t of (m.trims || [])) for (const im of (t.images || [])) { mt++; if (im.downloaded) ms++; }
    perModel.push({ slug: m.model_slug, total: mt, ok: ms });
  }
  const zeros = perModel.filter(p => p.total > 0 && p.ok === 0);

  console.log("\n========================================");
  console.log("  SUMMARY");
  console.log("========================================");
  console.log(`Brand:                  ${brand}`);
  console.log(`Total images attempted: ${stats.attempted}`);
  const pct = stats.attempted ? ((stats.succeeded / stats.attempted) * 100).toFixed(1) : "0.0";
  console.log(`Successful:             ${stats.succeeded} (${pct}%)`);
  console.log(`Failed:                 ${stats.attempted - stats.succeeded}`);
  console.log("\nFailed by HTTP status:");
  if (Object.keys(stats.byStatus).length === 0) console.log("  (none)");
  for (const [s, n] of Object.entries(stats.byStatus).sort()) console.log(`  ${s}: ${n}`);
  console.log("\nFailed by other error kind:");
  if (Object.keys(stats.byErrorKind).length === 0) console.log("  (none)");
  for (const [k, n] of Object.entries(stats.byErrorKind).sort()) console.log(`  ${k}: ${n}`);

  console.log(`\nModels with zero successful images: ${zeros.length} of ${perModel.length}`);
  for (const z of zeros) console.log(`  - ${z.slug} (${z.total} attempted)`);

  if (failures.length > 0) {
    const grouped = new Map();
    for (const f of failures) {
      const key = f.kind === "status" ? `status-${f.status}` :
                  f.kind === "wrong-content-type" ? `wrong-content-type (${f.contentType})` :
                  f.kind;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(f);
    }
    console.log("\nFailure breakdown (one example per group):");
    for (const [key, arr] of grouped) {
      console.log(`  [${key}] x${arr.length} — e.g. ${arr[0].url}`);
    }
  }
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
