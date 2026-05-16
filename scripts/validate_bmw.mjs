#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const doc = JSON.parse(readFileSync('C:/Users/nadea/car-catalogs/data/bmw.json', 'utf8'));

const REQUIRED_MODEL_KEYS = [
  'model', 'model_slug', 'model_year', 'body_style', 'generation_context',
  'msrp_range', 'model_summary', 'reliability', 'customer_satisfaction',
  'professional_reviews', 'owner_reviews', 'trims', 'researched_at'
];

const REQUIRED_TRIM_KEYS = [
  'trim', 'trim_slug', 'trim_family', 'is_base_trim', 'msrp_base', 'destination_fee',
  'msrp_as_equipped_estimate', 'powertrain', 'ev_specifics', 'fuel_economy', 'performance',
  'dimensions', 'capacity', 'wheels_tires', 'safety', 'features', 'warranty',
  'images', 'sources', 'delta_from_base', 'notes'
];

const warnings = [];
const errors = [];

for (const m of doc.models) {
  for (const k of REQUIRED_MODEL_KEYS) {
    if (!(k in m)) errors.push(`${m.model_slug}: missing model key '${k}'`);
  }

  const trims = m.trims || [];
  if (trims.length === 0) errors.push(`${m.model_slug}: has 0 trims`);

  const baseTrimCount = trims.filter(t => t.is_base_trim === true).length;
  const powertrainTypes = new Set(trims.map(t => t.powertrain && t.powertrain.type).filter(Boolean));
  const expectedBases = powertrainTypes.size;
  if (baseTrimCount !== expectedBases) {
    warnings.push(`${m.model_slug}: ${baseTrimCount} base trim(s) marked but ${expectedBases} powertrain line(s) detected (${[...powertrainTypes].join(',')})`);
  }

  if (m.msrp_range) {
    const trimMsrps = trims.map(t => t.msrp_base).filter(v => typeof v === 'number');
    if (trimMsrps.length) {
      const low = Math.min(...trimMsrps), high = Math.max(...trimMsrps);
      if (m.msrp_range.low !== low) warnings.push(`${m.model_slug}: msrp_range.low ${m.msrp_range.low} vs computed ${low}`);
      if (m.msrp_range.high !== high) warnings.push(`${m.model_slug}: msrp_range.high ${m.msrp_range.high} vs computed ${high}`);
    }
  } else {
    warnings.push(`${m.model_slug}: msrp_range missing`);
  }

  for (const t of trims) {
    for (const k of REQUIRED_TRIM_KEYS) {
      if (!(k in t)) errors.push(`${m.model_slug}/${t.trim_slug}: missing trim key '${k}'`);
    }

    if (t.powertrain && (t.powertrain.type === 'phev' || t.powertrain.type === 'ev')) {
      const fuelEconomySource = t.sources && t.sources.fuel_economy;
      if (!fuelEconomySource || !fuelEconomySource.includes('fueleconomy.gov')) {
        warnings.push(`${m.model_slug}/${t.trim_slug}: EV/PHEV but sources.fuel_economy is not fueleconomy.gov (got: ${fuelEconomySource || 'missing'})`);
      }
      if (!t.ev_specifics) {
        warnings.push(`${m.model_slug}/${t.trim_slug}: ${t.powertrain.type} but ev_specifics is null`);
      }
    }

    if (!t.is_base_trim && t.delta_from_base === null) {
      warnings.push(`${m.model_slug}/${t.trim_slug}: not base trim but delta_from_base is null`);
    }
    if (t.is_base_trim && t.delta_from_base !== null) {
      warnings.push(`${m.model_slug}/${t.trim_slug}: is base trim but delta_from_base is not null`);
    }

    const images = t.images || [];
    if (images.length === 0) warnings.push(`${m.model_slug}/${t.trim_slug}: has 0 images`);
  }
}

console.log(`=== BMW VALIDATION ===`);
console.log(`Models: ${doc.models.length}, Trims: ${doc.models.reduce((a,m)=>a+(m.trims||[]).length,0)}`);
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);
if (errors.length) {
  console.log('\nERRORS:');
  for (const e of errors) console.log(`  ${e}`);
}
if (warnings.length) {
  console.log('\nWARNINGS:');
  for (const w of warnings) console.log(`  ${w}`);
}
