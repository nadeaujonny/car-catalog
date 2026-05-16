#!/usr/bin/env node
// Phase B URL validator (session 5) — HEAD-check (GET fallback) manufacturer
// model-page URLs. READ-ONLY: this script never modifies any file.
//
// Usage:
//   node scripts/check_urls.mjs --brand <brand_slug>   # check every model_pages URL in the config
//   node scripts/check_urls.mjs --url "<url>"          # check one arbitrary candidate URL
//
// Per-URL status tags:
//   OK     200 (or a 200 reached via redirect — see REDIR note)
//   REDIR  200 but the request was redirected; the canonical final URL is printed.
//          Inspect WHERE it lands: a same-model canonical change → adopt the final
//          URL; a redirect to the homepage / generic models page → treat as DEAD.
//   DEAD   404 / 410 — page is gone; research a replacement.
//   GATED  403 or 5xx — site is defending against bots or erroring; the config URL
//          may be perfectly fine. Do NOT auto-replace; flag for human review.
//   FLAG   timeout / network error / anything else — do NOT auto-replace; flag.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
           "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const TIMEOUT_MS = 20000;

function parseArgs(argv) {
  const a = { brand: null, url: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--brand" && i + 1 < argv.length) a.brand = argv[++i];
    else if (argv[i] === "--url" && i + 1 < argv.length) a.url = argv[++i];
  }
  return a;
}

// Try HEAD first (cheap); fall back to GET when HEAD is unsupported/ambiguous
// or throws. GET is authoritative — it is what the scraper itself does.
async function checkOne(url) {
  let headResult = null;
  for (const method of ["HEAD", "GET"]) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method,
        headers: {
          "User-Agent": UA,
          "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "follow",
        signal: ctrl.signal,
      });
      clearTimeout(t);
      const result = { method, status: res.status, finalUrl: res.url, redirected: res.redirected };
      if (method === "HEAD") {
        // Trust HEAD only for clear-cut answers; otherwise confirm with GET.
        if (res.status === 200 || res.status === 404 || res.status === 410) return result;
        headResult = result;
        continue;
      }
      return result; // GET is authoritative
    } catch (err) {
      clearTimeout(t);
      const kind = err.name === "AbortError" ? "TIMEOUT" : "ERROR";
      if (method === "GET") return { method, status: kind, error: err.message };
      headResult = { method: "HEAD", status: kind, error: err.message };
    }
  }
  return headResult || { method: "?", status: "ERROR", error: "unknown" };
}

function classify(r) {
  if (r.status === 200) return r.redirected ? "REDIR" : "OK";
  if (r.status === 404 || r.status === 410) return "DEAD";
  if (r.status === 403 || (typeof r.status === "number" && r.status >= 500)) return "GATED";
  if (typeof r.status === "number" && r.status >= 300 && r.status < 400) return "REDIR";
  return "FLAG"; // TIMEOUT / ERROR / unexpected
}

function fmtLine(tag, status, label, url, extra) {
  let line = `  ${tag.padEnd(5)} ${String(status).padEnd(9)} ${String(label).padEnd(28)} ${url}`;
  if (extra) line += `\n         ${extra}`;
  return line;
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.url) {
    const r = await checkOne(args.url);
    const tag = classify(r);
    let extra = "";
    if (r.redirected && r.finalUrl && r.finalUrl !== args.url) extra = `-> final: ${r.finalUrl}`;
    if (r.error) extra = `(${r.error})`;
    console.log(fmtLine(tag, r.status, `[${r.method}]`, args.url, extra));
    return;
  }

  if (!args.brand) {
    console.error('Usage: node scripts/check_urls.mjs --brand <slug>   |   --url "<url>"');
    process.exit(2);
  }

  const cfgPath = path.join(PROJECT_ROOT, "scripts", "brand-configs", `${args.brand}.json`);
  let cfg;
  try {
    cfg = JSON.parse(await fs.readFile(cfgPath, "utf-8"));
  } catch (e) {
    console.error(`Cannot read ${cfgPath}: ${e.message}`);
    process.exit(1);
  }
  const pages = cfg.model_pages || {};
  const entries = Object.entries(pages);
  console.log(`brand: ${args.brand}   model_pages: ${entries.length}`);

  const counts = { OK: 0, REDIR: 0, DEAD: 0, GATED: 0, FLAG: 0 };
  for (const [slug, url] of entries) {
    const r = await checkOne(url);
    const tag = classify(r);
    counts[tag] = (counts[tag] || 0) + 1;
    let extra = "";
    if (tag === "REDIR" && r.finalUrl && r.finalUrl !== url) extra = `-> final: ${r.finalUrl}`;
    if (r.error) extra = `(${r.error})`;
    console.log(fmtLine(tag, r.status, slug, url, extra));
  }
  console.log(
    `SUMMARY ${args.brand}: ${counts.OK} ok, ${counts.REDIR} redir, ` +
    `${counts.DEAD} dead, ${counts.GATED} gated, ${counts.FLAG} flag`
  );
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
