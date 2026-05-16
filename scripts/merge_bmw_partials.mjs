#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const PROJECT_ROOT = 'C:/Users/nadea/car-catalogs';
const PARTIALS_DIR = join(PROJECT_ROOT, 'data', '_partials');
const STUB_PATH = join(PROJECT_ROOT, 'data', 'bmw.json');
const OUTPUT_PATH = STUB_PATH;
const TODAY = '2026-05-11';

const stub = JSON.parse(readFileSync(STUB_PATH, 'utf8'));
const slugOrder = stub.models.map(m => m.model_slug);

const partials = {};
const partialFiles = readdirSync(PARTIALS_DIR).filter(f => f.startsWith('bmw_') && f.endsWith('.json'));
for (const f of partialFiles) {
  const slug = f.replace(/^bmw_/, '').replace(/\.json$/, '');
  try {
    partials[slug] = JSON.parse(readFileSync(join(PARTIALS_DIR, f), 'utf8'));
  } catch (e) {
    console.error(`ERROR parsing ${f}: ${e.message}`);
    process.exit(1);
  }
}

const fixes = [];

function fix(slug, fn) {
  const m = partials[slug];
  if (!m) return;
  fn(m);
}

fix('x1', m => {
  for (const t of m.trims || []) {
    if (t.trim_slug === 'm35i' || t.trim_slug === 'x1-m35i' || (t.trim || '').toLowerCase().includes('m35i')) {
      if (t.is_base_trim === true) { t.is_base_trim = false; fixes.push('x1: M35i is_base_trim=false (single ICE line, xDrive28i is base)'); }
    }
  }
});

fix('x3', m => {
  for (const t of m.trims || []) {
    const tn = (t.trim || '').toLowerCase();
    if (tn.includes('m50')) {
      if (t.is_base_trim === true) { t.is_base_trim = false; fixes.push('x3: M50 xDrive is_base_trim=false (single ICE line, 30 xDrive is base)'); }
    }
  }
});

fix('4-series-gran-coupe', m => {
  for (const t of m.trims || []) {
    if (t.powertrain && t.powertrain.type === 'hybrid') {
      t.powertrain.type = 'ice';
      if (t.ev_specifics) t.ev_specifics = null;
      fixes.push(`4-series-gran-coupe: ${t.trim_slug} powertrain.type hybrid→ice (48V MHEV is ICE per spec)`);
    }
  }
});

const orderedModels = [];
const missing = [];
for (const stubModel of stub.models) {
  const slug = stubModel.model_slug;
  if (partials[slug]) {
    orderedModels.push(partials[slug]);
  } else {
    missing.push(slug);
    orderedModels.push(stubModel);
  }
}

if (missing.length) {
  console.error('MISSING partials for models:', missing.join(', '));
}

const finalDoc = {
  brand: 'BMW',
  brand_slug: 'bmw',
  researched_at: TODAY,
  schema_version: '1.1',
  models: orderedModels,
};

writeFileSync(OUTPUT_PATH, JSON.stringify(finalDoc, null, 2) + '\n', 'utf8');

const totalTrims = orderedModels.reduce((acc, m) => acc + (m.trims || []).length, 0);
const totalImages = orderedModels.reduce((acc, m) => acc + (m.trims || []).reduce((a, t) => a + (t.images || []).length, 0), 0);
const needsScraping = orderedModels.reduce((acc, m) => acc + (m.trims || []).reduce((a, t) => a + (t.images || []).filter(i => i.needs_scraping).length, 0), 0);

const lowConfReliability = orderedModels
  .filter(m => m.reliability && (m.reliability.confidence === 'low' || m.reliability.confidence === 'unknown'))
  .map(m => m.model);

const nullCounts = {};
function walk(o, path = '') {
  if (o === null || o === undefined) {
    nullCounts[path] = (nullCounts[path] || 0) + 1;
    return;
  }
  if (typeof o !== 'object') return;
  if (Array.isArray(o)) { for (const v of o) walk(v, path); return; }
  for (const [k, v] of Object.entries(o)) {
    const np = path ? `${path}.${k}` : k;
    if (v === null) nullCounts[np] = (nullCounts[np] || 0) + 1;
    else if (typeof v === 'object') walk(v, np);
  }
}
for (const m of orderedModels) for (const t of m.trims || []) walk(t);

const topNulls = Object.entries(nullCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

console.log('=== BMW MERGE SUMMARY ===');
console.log(`Models: ${orderedModels.length}`);
console.log(`Total trims: ${totalTrims}`);
console.log(`Total image entries: ${totalImages}`);
console.log(`Images needing scraping: ${needsScraping}`);
console.log(`Missing partials: ${missing.length === 0 ? 'none' : missing.join(', ')}`);
console.log('');
console.log(`Models with low/unknown reliability confidence (${lowConfReliability.length}):`);
console.log(lowConfReliability.map(m => `  - ${m}`).join('\n'));
console.log('');
console.log('Top null fields in trim objects:');
for (const [path, count] of topNulls) {
  console.log(`  ${count}  ${path}`);
}
console.log('');
console.log(`Fixes applied (${fixes.length}):`);
for (const f of fixes) console.log(`  - ${f}`);
console.log('');
console.log(`Final file written: ${OUTPUT_PATH}`);
