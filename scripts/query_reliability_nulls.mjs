#!/usr/bin/env node
// Query all brand JSONs for models with reliability.confidence === "unknown"
// OR customer_satisfaction.confidence === "unknown". Outputs a CSV-like report.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

function stripBOM(s) { return (s && s.charCodeAt(0) === 0xFEFF) ? s.slice(1) : s; }
async function readJSON(p) { return JSON.parse(stripBOM(await fs.readFile(p, "utf-8"))); }

const dataDir = path.join(PROJECT_ROOT, "data");
const files = (await fs.readdir(dataDir)).filter(f => f.endsWith(".json"));

const byBrand = {};
let totalReliabilityUnknown = 0;
let totalSatisfactionUnknown = 0;
let totalReliabilityKnown = 0;
let totalSatisfactionKnown = 0;
let totalModels = 0;

for (const f of files) {
  const brandSlug = f.replace(/\.json$/, "");
  const j = await readJSON(path.join(dataDir, f));
  const brand = j.brand_name || brandSlug;
  byBrand[brandSlug] = { brand, models: [], reliabilityUnknown: 0, satisfactionUnknown: 0, models_total: (j.models || []).length };
  for (const m of (j.models || [])) {
    totalModels++;
    const rConf = m.reliability?.confidence;
    const sConf = m.customer_satisfaction?.confidence;
    const rUnknown = rConf === "unknown";
    const sUnknown = sConf === "unknown";
    if (rUnknown) { totalReliabilityUnknown++; byBrand[brandSlug].reliabilityUnknown++; }
    else if (rConf) { totalReliabilityKnown++; }
    if (sUnknown) { totalSatisfactionUnknown++; byBrand[brandSlug].satisfactionUnknown++; }
    else if (sConf) { totalSatisfactionKnown++; }
    if (rUnknown || sUnknown) {
      byBrand[brandSlug].models.push({
        model: m.model_slug,
        reliability: rConf,
        satisfaction: sConf,
        jd_power_vds: m.reliability?.jd_power_vds_score ?? null,
        cr_predicted: m.reliability?.consumer_reports_predicted_reliability ?? null,
        jd_power_apeal: m.customer_satisfaction?.jd_power_apeal_score ?? null,
      });
    }
  }
}

console.log("=== Reliability / Customer Satisfaction Unknown Inventory ===\n");
console.log(`Total models: ${totalModels}`);
console.log(`Reliability unknown: ${totalReliabilityUnknown} / ${totalModels} (${(totalReliabilityUnknown / totalModels * 100).toFixed(1)}%)`);
console.log(`Reliability known:   ${totalReliabilityKnown}`);
console.log(`Satisfaction unknown: ${totalSatisfactionUnknown} / ${totalModels} (${(totalSatisfactionUnknown / totalModels * 100).toFixed(1)}%)`);
console.log(`Satisfaction known:   ${totalSatisfactionKnown}\n`);

console.log("=== Per brand ===\n");
const sorted = Object.entries(byBrand).sort((a, b) => b[1].reliabilityUnknown + b[1].satisfactionUnknown - a[1].reliabilityUnknown - a[1].satisfactionUnknown);
for (const [slug, info] of sorted) {
  if (info.reliabilityUnknown === 0 && info.satisfactionUnknown === 0) continue;
  console.log(`${info.brand} (${slug}): ${info.models.length} models with at least one unknown (of ${info.models_total} total models)`);
  console.log(`  reliability unknown: ${info.reliabilityUnknown}, satisfaction unknown: ${info.satisfactionUnknown}`);
  for (const m of info.models) {
    console.log(`  - ${m.model.padEnd(30)} rel=${(m.reliability || "?").padEnd(8)} (vds:${m.jd_power_vds ?? "-"}, cr:${m.cr_predicted ?? "-"})  sat=${(m.satisfaction || "?").padEnd(8)} (apeal:${m.jd_power_apeal ?? "-"})`);
  }
  console.log("");
}

console.log("=== Brands with NO unknowns (skip from Phase C) ===");
for (const [slug, info] of Object.entries(byBrand)) {
  if (info.reliabilityUnknown === 0 && info.satisfactionUnknown === 0) {
    console.log(`  ${info.brand} (${slug}) — ${info.models_total} models all known/scored`);
  }
}
