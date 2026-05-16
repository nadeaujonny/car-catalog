#!/usr/bin/env node
// Session 12: Comprehensive inventory of Toyota singleton-no-images blockers.
// Lists every affected (model, trim, family) tuple, AND every affected model's
// full trim/family breakdown including image counts.
import { readFileSync, writeFileSync } from 'node:fs';

const d = JSON.parse(readFileSync('C:/Users/nadea/car-catalogs/data/toyota.json', 'utf8'));

const affected = [];
for (const m of d.models) {
  const families = new Map();
  for (const t of m.trims || []) {
    const k = t.trim_family;
    if (!families.has(k)) families.set(k, []);
    families.get(k).push({slug: t.trim_slug, images: (t.images||[]).length});
  }
  for (const [fam, arr] of families) {
    if (arr.length === 1 && arr[0].images === 0) {
      affected.push({model: m.model_slug, family: fam, trim: arr[0].slug});
    }
  }
}

console.log(`Total singleton-trim-family-no-images: ${affected.length}\n`);

// Group by model for readability
const byModel = new Map();
for (const a of affected) {
  if (!byModel.has(a.model)) byModel.set(a.model, []);
  byModel.get(a.model).push(a);
}

console.log(`Affected models: ${byModel.size}\n`);
console.log('===== AFFECTED MODELS (full family/trim breakdown) =====\n');

const out = [];
for (const [slug, list] of byModel) {
  const m = d.models.find(x => x.model_slug === slug);
  const body = m.body_style || 'unknown';
  const totalImg = m.trims.reduce((a,t)=>a+(t.images||[]).length,0);
  console.log(`${slug}  [body=${body}, ${m.trims.length} trims, ${totalImg} total images]`);
  out.push({model: slug, body, totalTrims: m.trims.length, totalImages: totalImg, blockers: list.map(x => x.trim), families: []});
  const fams = new Map();
  for (const t of m.trims) {
    if (!fams.has(t.trim_family)) fams.set(t.trim_family, []);
    fams.get(t.trim_family).push({slug: t.trim_slug, images: (t.images||[]).length, isBase: t.is_base_trim === true});
  }
  for (const [fam, arr] of fams) {
    const flag = arr.length === 1 && arr[0].images === 0 ? '  *** BLOCKER ***' : '';
    console.log(`  family=${fam}: ${arr.map(a => `${a.slug}(${a.images}img${a.isBase?',base':''})`).join(', ')}${flag}`);
    out[out.length-1].families.push({family: fam, trims: arr, isBlocker: arr.length === 1 && arr[0].images === 0});
  }
  console.log('');
}

writeFileSync('C:/Users/nadea/car-catalogs/reports/session12_toyota_inventory.json', JSON.stringify(out, null, 2));
console.log('Wrote reports/session12_toyota_inventory.json');
