#!/usr/bin/env node
// Session 9 diag: dump alfa-romeo slug-matching candidates with alt text per model
// so we can identify the URL/alt tokens that map to rear_three_quarter, side_profile.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
async function fetchHTML(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html" }, redirect: "follow" });
  return { html: await res.text(), finalUrl: res.url };
}

const IMG_EXT_RE = /\.(jpe?g|png|webp|avif)(?:\?[^"'\s)]*)?$/i;
const stripBom = s => s && s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s;
async function readJSON(p) { return JSON.parse(stripBom(await fs.readFile(p, "utf-8"))); }

function isPlausible(url) {
  try { const u = new URL(url); return IMG_EXT_RE.test(u.pathname) && !/\.svg/i.test(u.pathname); }
  catch { return false; }
}
function decodeAttr(s) { return s.replace(/&amp;/g, "&").replace(/&#x2F;/gi, "/").replace(/&quot;/g, '"'); }
function attr(attrs, name) {
  const re = new RegExp(name + '\\s*=\\s*"([^"]*)"|' + name + "\\s*=\\s*'([^']*)'", "i");
  const m = attrs.match(re);
  return m ? (m[1] !== undefined ? m[1] : m[2]) : null;
}

function extract(html, baseUrl) {
  const out = [];
  const imgRe = /<img\b([^>]*)>/gi;
  let m;
  while ((m = imgRe.exec(html))) {
    const a = m[1];
    const alt = (attr(a, "alt") || "") + " " + (attr(a, "title") || "");
    for (const at of ["src", "data-src"]) {
      const v = attr(a, at);
      if (v) {
        try { const abs = new URL(decodeAttr(v), baseUrl).href;
          if (isPlausible(abs)) out.push({ url: abs, alt: alt.trim() });
        } catch {}
      }
    }
  }
  return out;
}

const cfg = await readJSON(path.join(PROJECT_ROOT, "scripts/brand-configs/alfa-romeo.json"));
const target = process.argv[2] || "tonale";
const url = cfg.model_pages[target];
console.log(`### ${target} → ${url}`);
const r = await fetchHTML(url);
const cands = extract(r.html, r.finalUrl);
const variants = cfg.slug_variants[target] || [target];
const slugRes = variants.map(v => new RegExp(`(^|[/_ -])${v.replace(/[-_ ]+/g, "[-_ ]")}([/_ -]|\\.|$)`, "i"));
const matching = cands.filter(c => slugRes.some(re => re.test(c.url + " " + c.alt)));
console.log(`\nTotal raw: ${cands.length}, slug-matching: ${matching.length}\n`);
const seen = new Set();
for (const c of matching) {
  if (seen.has(c.url)) continue;
  seen.add(c.url);
  // try to classify by tokens
  const filename = c.url.split("/").pop().toLowerCase();
  let hint = "";
  if (/rear|back/i.test(c.alt) || /rear|back/i.test(filename)) hint = " [rear?]";
  else if (/side|profile/i.test(c.alt) || /side|profile/i.test(filename)) hint = " [side?]";
  else if (/interior|dashboard|cockpit|cabin/i.test(c.alt) || /interior|dashboard|cockpit/i.test(filename)) hint = " [interior?]";
  else if (/front/i.test(c.alt) || /front/i.test(filename)) hint = " [front?]";
  console.log(`  ${c.url.replace("https://www.alfaromeousa.com", "")}${hint}`);
  console.log(`    alt: "${c.alt.slice(0, 100)}"`);
}
