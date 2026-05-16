#!/usr/bin/env node
// Phase 3 — inspect current stored values for BMW and Chevrolet drift trims.
import { readFileSync } from 'node:fs';

const bmw = JSON.parse(readFileSync('C:/Users/nadea/car-catalogs/data/bmw.json', 'utf8'));
const chev = JSON.parse(readFileSync('C:/Users/nadea/car-catalogs/data/chevrolet.json', 'utf8'));

const targets = [
  { brand: bmw, model: '3-series', trim: '330i', expected: 47500, drifted: 48000 },
  { brand: bmw, model: 'x5', trim: 'xdrive40i', expected: 68600, drifted: 70600 },
  { brand: bmw, model: 'x3', trim: '30-xdrive', expected: 50675, drifted: 51300 },
  { brand: chev, model: 'equinox', trim: 'lt-fwd', expected: 28600, drifted: 28800 },
  { brand: chev, model: 'tahoe', trim: 'rst-4wd', expected: 73995, drifted: 71700 },
  { brand: chev, model: 'colorado', trim: 'lt-4wd', expected: 41395, drifted: 39300 },
];

for (const t of targets) {
  const m = t.brand.models.find(x => x.model_slug === t.model);
  if (!m) { console.log(`${t.brand.brand} ${t.model}/${t.trim}: model not found`); continue; }
  const trim = m.trims.find(x => x.trim_slug === t.trim);
  if (!trim) {
    console.log(`${t.brand.brand} ${t.model}/${t.trim}: trim not found. Trims in model: ${m.trims.map(x => x.trim_slug).join(', ')}`);
    continue;
  }
  console.log(`${t.brand.brand} ${t.model}/${t.trim}: stored=${trim.msrp_base} expected-from-report=${t.expected} drifted-to=${t.drifted} (delta=${t.drifted - trim.msrp_base})`);
  console.log(`  destination_fee: ${trim.destination_fee}`);
  console.log(`  researched_at (model): ${m.researched_at}`);
  console.log(`  msrp_range: low=${m.msrp_range.low} high=${m.msrp_range.high}`);
}
