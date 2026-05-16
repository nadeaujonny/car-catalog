#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

const path = 'C:/Users/nadea/car-catalogs/data/bmw.json';
const doc = JSON.parse(readFileSync(path, 'utf8'));

let fixed = 0;
for (const m of doc.models) {
  const trims = m.trims || [];
  const msrps = trims.map(t => t.msrp_base).filter(v => typeof v === 'number');
  if (!msrps.length) continue;
  const computed = { low: Math.min(...msrps), high: Math.max(...msrps) };
  if (!m.msrp_range || m.msrp_range.low !== computed.low || m.msrp_range.high !== computed.high) {
    m.msrp_range = computed;
    fixed++;
  }
}

writeFileSync(path, JSON.stringify(doc, null, 2) + '\n', 'utf8');
console.log(`Fixed msrp_range on ${fixed} model(s)`);
