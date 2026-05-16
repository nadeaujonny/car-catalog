#!/usr/bin/env node
// Phase 3 — apply Session 10 freshness drift findings to BMW and Chevrolet.
// Per reports/freshness_check_session10.md.

import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';

const TODAY = '2026-05-15';

const drifts = {
  bmw: [
    { model: '3-series', trim: '330i', new_msrp_base: 48000 },
    { model: 'x5', trim: 'xdrive40i', new_msrp_base: 70600 },
    { model: 'x3', trim: '30-xdrive', new_msrp_base: 51300 },
  ],
  chevrolet: [
    { model: 'equinox', trim: 'lt-fwd', new_msrp_base: 28800 },
    { model: 'tahoe', trim: 'rst-4wd', new_msrp_base: 71700 },
    { model: 'colorado', trim: 'lt-4wd', new_msrp_base: 39300 },
  ],
};

function recomputeMsrpRange(model) {
  const prices = (model.trims || []).map(t => t.msrp_base).filter(v => typeof v === 'number');
  if (prices.length === 0) return;
  model.msrp_range.low = Math.min(...prices);
  model.msrp_range.high = Math.max(...prices);
}

for (const [brand, items] of Object.entries(drifts)) {
  const dataPath = `C:/Users/nadea/car-catalogs/data/${brand}.json`;
  const catalogPath = `C:/Users/nadea/car-catalogs/catalog/data/${brand}.json`;

  copyFileSync(dataPath, dataPath + '.bak');
  copyFileSync(catalogPath, catalogPath + '.bak');

  const doc = JSON.parse(readFileSync(dataPath, 'utf8'));

  for (const item of items) {
    const model = doc.models.find(m => m.model_slug === item.model);
    if (!model) { console.error(`${brand}: model ${item.model} not found`); continue; }
    const trim = model.trims.find(t => t.trim_slug === item.trim);
    if (!trim) { console.error(`${brand}: ${item.model}/${item.trim} not found`); continue; }

    const oldPrice = trim.msrp_base;
    const oldLow = model.msrp_range.low;
    const oldHigh = model.msrp_range.high;

    trim.msrp_base = item.new_msrp_base;
    // researched_at on trim — schema doesn't currently store trim-level researched_at,
    // but we can mention the refresh date in the trim's notes if not already present.
    // Update model.researched_at instead per spec convention.
    recomputeMsrpRange(model);
    model.researched_at = TODAY;

    console.log(`${brand} ${item.model}/${item.trim}: msrp_base ${oldPrice} → ${trim.msrp_base} (Δ${trim.msrp_base - oldPrice}); msrp_range [${oldLow}, ${oldHigh}] → [${model.msrp_range.low}, ${model.msrp_range.high}]; researched_at → ${TODAY}`);
  }

  // Update brand-level researched_at to signal a partial refresh
  doc.researched_at = TODAY;

  const out = JSON.stringify(doc, null, 2);
  writeFileSync(dataPath, out);
  writeFileSync(catalogPath, out);
  console.log(`  wrote: ${dataPath}`);
  console.log(`  wrote: ${catalogPath}`);
}

console.log('\nDone.');
