// Session 4 fix-pass — applies 10 blocker fixes across 5 brands.
// Each edit writes to both data/<brand>.json and catalog/data/<brand>.json.
// Run: node scripts/apply_fixes_session4.mjs

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function stripBOM(s) { return s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s; }

async function loadJSON(p) {
  const raw = await readFile(p, "utf-8");
  return JSON.parse(stripBOM(raw));
}
async function saveJSON(p, obj) {
  await writeFile(p, JSON.stringify(obj, null, 2) + "\n", "utf-8");
}

const root = process.cwd();
const fixes = [];

// ------------- INFINITI: 4 singleton trim_family violations -------------
{
  const targets = ["data/infiniti.json", "catalog/data/infiniti.json"];
  for (const rel of targets) {
    const p = path.join(root, rel);
    const d = await loadJSON(p);
    const ops = [];
    // QX60 SPORT (models[0].trims[4]) and AUTOGRAPH (models[0].trims[5])
    for (const j of [4, 5]) {
      const t = d.models[0].trims[j];
      if (t.is_base_trim !== true || t.delta_from_base !== null) {
        t.is_base_trim = true;
        t.delta_from_base = null;
        ops.push(`QX60 trims[${j}] ${t.trim_slug}: is_base_trim=true, delta_from_base=null`);
      }
    }
    // QX80 SPORT (models[1].trims[4]) and AUTOGRAPH (models[1].trims[5])
    for (const j of [4, 5]) {
      const t = d.models[1].trims[j];
      if (t.is_base_trim !== true || t.delta_from_base !== null) {
        t.is_base_trim = true;
        t.delta_from_base = null;
        ops.push(`QX80 trims[${j}] ${t.trim_slug}: is_base_trim=true, delta_from_base=null`);
      }
    }
    await saveJSON(p, d);
    fixes.push({ file: rel, ops });
  }
}

// ------------- GMC: 2 msrp_range.high mismatches -------------
{
  const targets = ["data/gmc.json", "catalog/data/gmc.json"];
  for (const rel of targets) {
    const p = path.join(root, rel);
    const d = await loadJSON(p);
    const ops = [];
    // Hummer EV Pickup models[8]: recompute high from max trim msrp_base
    {
      const m = d.models[8];
      const maxMsrp = Math.max(...m.trims.map(t => t.msrp_base ?? -Infinity));
      if (m.msrp_range.high !== maxMsrp) {
        ops.push(`${m.model} msrp_range.high: ${m.msrp_range.high} -> ${maxMsrp}`);
        m.msrp_range.high = maxMsrp;
      }
    }
    // Hummer EV SUV models[9]
    {
      const m = d.models[9];
      const maxMsrp = Math.max(...m.trims.map(t => t.msrp_base ?? -Infinity));
      if (m.msrp_range.high !== maxMsrp) {
        ops.push(`${m.model} msrp_range.high: ${m.msrp_range.high} -> ${maxMsrp}`);
        m.msrp_range.high = maxMsrp;
      }
    }
    await saveJSON(p, d);
    fixes.push({ file: rel, ops });
  }
}

// ------------- MITSUBISHI: 1 msrp_range.high mismatch -------------
{
  const targets = ["data/mitsubishi.json", "catalog/data/mitsubishi.json"];
  for (const rel of targets) {
    const p = path.join(root, rel);
    const d = await loadJSON(p);
    const ops = [];
    // Eclipse Cross models[3]
    const m = d.models[3];
    const maxMsrp = Math.max(...m.trims.map(t => t.msrp_base ?? -Infinity));
    if (m.msrp_range.high !== maxMsrp) {
      ops.push(`${m.model} msrp_range.high: ${m.msrp_range.high} -> ${maxMsrp}`);
      m.msrp_range.high = maxMsrp;
    }
    await saveJSON(p, d);
    fixes.push({ file: rel, ops });
  }
}

// ------------- MASERATI: 1 dealer URL on GranCabrio Trofeo -------------
{
  const targets = ["data/maserati.json", "catalog/data/maserati.json"];
  for (const rel of targets) {
    const p = path.join(root, rel);
    const d = await loadJSON(p);
    const ops = [];
    const t = d.models[2].trims[1]; // GranCabrio Trofeo
    const badUrl = "https://www.maseratiofedmonton.com/blog/2026-maserati-grancabrio-trofeo-features/";
    if (t.sources["performance.zero_to_60_sec"] === badUrl) {
      t.sources["performance.zero_to_60_sec"] = null;
      const noteAddendum = " 0-60 source set to null (3.4 sec figure is Maserati's manufacturer-published spec but no accessible primary URL — maseratiofedmonton.com dealer-blog removed per project forbidden-source rule).";
      if (!t.notes.includes("0-60 source set to null")) t.notes = (t.notes || "") + noteAddendum;
      ops.push(`GranCabrio Trofeo sources["performance.zero_to_60_sec"]: maseratiofedmonton.com -> null, notes addendum`);
    }
    await saveJSON(p, d);
    fixes.push({ file: rel, ops });
  }
}

// ------------- RIVIAN: 2 stale Quad Max MSRPs (+ msrp_range.high propagation) -------------
{
  const targets = ["data/rivian.json", "catalog/data/rivian.json"];
  for (const rel of targets) {
    const p = path.join(root, rel);
    const d = await loadJSON(p);
    const ops = [];
    // R1T Quad Max models[0].trims[4]
    {
      const m = d.models[0];
      const t = m.trims[4];
      if (t.msrp_base === 115990) {
        t.msrp_base = 119990;
        ops.push(`R1T Quad Max msrp_base: 115990 -> 119990`);
      }
      const maxMsrp = Math.max(...m.trims.map(x => x.msrp_base ?? -Infinity));
      if (m.msrp_range.high !== maxMsrp) {
        ops.push(`R1T msrp_range.high: ${m.msrp_range.high} -> ${maxMsrp}`);
        m.msrp_range.high = maxMsrp;
      }
    }
    // R1S Quad Max models[1].trims[3]
    {
      const m = d.models[1];
      const t = m.trims[3];
      if (t.msrp_base === 121990) {
        t.msrp_base = 125990;
        ops.push(`R1S Quad Max msrp_base: 121990 -> 125990`);
      }
      const maxMsrp = Math.max(...m.trims.map(x => x.msrp_base ?? -Infinity));
      if (m.msrp_range.high !== maxMsrp) {
        ops.push(`R1S msrp_range.high: ${m.msrp_range.high} -> ${maxMsrp}`);
        m.msrp_range.high = maxMsrp;
      }
    }
    await saveJSON(p, d);
    fixes.push({ file: rel, ops });
  }
}

console.log("Fix-pass complete:\n");
for (const f of fixes) {
  console.log(`  ${f.file} (${f.ops.length} ops):`);
  for (const op of f.ops) console.log(`    - ${op}`);
}
