#!/usr/bin/env node
// Phase B1 (session 7) — READ-ONLY survey of catalog/images/<brand>/...
// Reports per-brand average / median file size and identifies brands likely
// receiving mobile-thumbnail variants. Also samples downloaded image URLs
// from catalog/data/<brand>.json to look for size-marker tokens.
//
// Writes nothing other than stdout.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const IMAGES_ROOT = path.join(PROJECT_ROOT, "catalog", "images");
const DATA_ROOT = path.join(PROJECT_ROOT, "catalog", "data");

function stripBOM(s) { return (s && s.charCodeAt(0) === 0xFEFF) ? s.slice(1) : s; }
async function readJSON(p) { return JSON.parse(stripBOM(await fs.readFile(p, "utf-8"))); }

async function walkSizes(dir) {
  const sizes = [];
  async function recurse(d) {
    let entries;
    try { entries = await fs.readdir(d, { withFileTypes: true }); }
    catch { return; }
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) await recurse(p);
      else if (e.isFile() && /\.(jpe?g|png|webp|avif)$/i.test(e.name)) {
        try {
          const st = await fs.stat(p);
          sizes.push({ path: p, bytes: st.size, name: e.name });
        } catch {}
      }
    }
  }
  await recurse(dir);
  return sizes;
}

function median(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const m = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
}

function fmtBytes(n) {
  if (n >= 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + "MB";
  if (n >= 1024) return (n / 1024).toFixed(0) + "KB";
  return n + "B";
}

// Size-marker patterns to look for in downloaded URLs. Each is a regex; tally
// how many downloaded URLs (per brand) match.
const SIZE_MARKER_PATTERNS = [
  { name: ".small./.medium./.large.", re: /\.(?:small|medium|large)\./i },
  { name: "mobile/tablet/desktop literal", re: /\b(?:mobile|tablet|desktop)\b/i },
  { name: "Mobile/Desktop filename suffix", re: /-(?:Mobile|Desktop|Tablet)(?:[-_.]|$)/i },
  { name: "/thumb/ or /thumbnail/", re: /\/(?:thumb|thumbnail|thumbs)\//i },
  { name: "/sm|md|lg|xl path segment", re: /\/(?:xs|sm|md|lg|xl|xxl)\//i },
  { name: "-sm./-md./-lg./-xl. suffix", re: /-(?:xs|sm|md|lg|xl|xxl)\.(?:jpe?g|png|webp|avif)/i },
  { name: "?w=NNN query", re: /[?&]w=(\d+)/i },
  { name: "?width=NNN query", re: /[?&]width=(\d+)/i },
  { name: "?mw=NNN query", re: /[?&]mw=(\d+)/i },
  { name: "/NNN_NNN/ path size", re: /\/(\d{3,4})_(\d{3,4})\//i },
  { name: "_NNNxNNN. filename size", re: /_(\d{3,4})x(\d{3,4})\.(?:jpe?g|png|webp|avif)/i },
  { name: "is/image scene7 ?$req=", re: /is\/image.*\?\$/i },
];

async function main() {
  const brands = (await fs.readdir(IMAGES_ROOT, { withFileTypes: true }))
    .filter(d => d.isDirectory()).map(d => d.name).sort();

  console.log("=== PER-BRAND IMAGE FILE SIZE SURVEY ===");
  console.log("brand            files   avgKB  medKB  minKB  maxKB  tiny<20  small<50  large>200");
  const summary = [];
  let projectTotal = 0;
  let projectFiles = 0;

  for (const brand of brands) {
    const sizes = await walkSizes(path.join(IMAGES_ROOT, brand));
    if (sizes.length === 0) continue;
    const bytes = sizes.map(s => s.bytes);
    const avg = bytes.reduce((a, b) => a + b, 0) / bytes.length;
    const med = median(bytes);
    const tiny = bytes.filter(b => b < 20 * 1024).length;
    const small = bytes.filter(b => b < 50 * 1024).length;
    const large = bytes.filter(b => b > 200 * 1024).length;
    const huge = bytes.filter(b => b > 500 * 1024).length;
    summary.push({ brand, count: sizes.length, avg, med, min: Math.min(...bytes), max: Math.max(...bytes), tiny, small, large, huge });
    projectTotal += bytes.reduce((a, b) => a + b, 0);
    projectFiles += sizes.length;
  }

  summary.sort((a, b) => a.avg - b.avg);
  for (const s of summary) {
    console.log(
      s.brand.padEnd(16) +
      String(s.count).padStart(6) + "  " +
      (s.avg / 1024).toFixed(0).padStart(5) + "  " +
      (s.med / 1024).toFixed(0).padStart(5) + "  " +
      (s.min / 1024).toFixed(0).padStart(5) + "  " +
      (s.max / 1024).toFixed(0).padStart(5) + "  " +
      String(s.tiny).padStart(7) + "  " +
      String(s.small).padStart(8) + "  " +
      String(s.large).padStart(9)
    );
  }

  console.log(`\nProject-wide: ${projectFiles} files, ${fmtBytes(projectTotal)} total, avg ${(projectTotal / projectFiles / 1024).toFixed(0)} KB`);

  console.log("\n\n=== SIZE-MARKER PATTERNS IN DOWNLOADED URLS (per brand) ===");
  // For each brand, read catalog/data/<brand>.json and tally how many
  // downloaded URLs match each size-marker pattern.
  const brandsWithData = (await fs.readdir(DATA_ROOT)).filter(f => f.endsWith(".json")).map(f => f.replace(/\.json$/, "")).sort();
  console.log("brand            dlURLs   " + SIZE_MARKER_PATTERNS.map(p => p.name.slice(0, 18).padEnd(20)).join(""));
  for (const brand of brandsWithData) {
    const data = await readJSON(path.join(DATA_ROOT, `${brand}.json`));
    const urls = [];
    for (const m of data.models || []) {
      for (const t of m.trims || []) {
        for (const i of t.images || []) {
          if (i.downloaded === true && i.url) urls.push(i.url);
        }
      }
    }
    if (urls.length === 0) continue;
    const counts = SIZE_MARKER_PATTERNS.map(p => urls.filter(u => p.re.test(u)).length);
    const line = brand.padEnd(16) + String(urls.length).padStart(7) + "  " + counts.map(c => String(c).padEnd(20)).join("");
    console.log(line);
  }

  // Sample-URL inspection for brands with notably small mean file size.
  console.log("\n\n=== SAMPLE URLS FROM BRANDS WITH AVG < 60 KB ===");
  for (const s of summary.filter(x => (x.avg / 1024) < 60).slice(0, 12)) {
    console.log(`\n--- ${s.brand} (avg ${(s.avg / 1024).toFixed(0)} KB, ${s.count} files) ---`);
    try {
      const data = await readJSON(path.join(DATA_ROOT, `${s.brand}.json`));
      const urls = [];
      for (const m of data.models || []) {
        for (const t of m.trims || []) {
          for (const i of t.images || []) {
            if (i.downloaded === true && i.url) urls.push(i.url);
          }
        }
      }
      for (const u of urls.slice(0, 5)) console.log(`  ${u}`);
    } catch {}
  }
}

main().catch(e => { console.error("Fatal:", e); process.exitCode = 1; });
