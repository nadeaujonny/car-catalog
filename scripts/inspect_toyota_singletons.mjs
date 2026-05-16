#!/usr/bin/env node
// Inspect Toyota's singleton trim_family blockers.
import { readFileSync } from 'node:fs';
const d = JSON.parse(readFileSync('C:/Users/nadea/car-catalogs/data/toyota.json', 'utf8'));

// Find models with multiple trims and look at trim_family clustering
const summary = [];
for (const m of d.models) {
  const families = new Map();
  for (const t of m.trims || []) {
    const k = t.trim_family;
    if (!families.has(k)) families.set(k, []);
    families.get(k).push({slug: t.trim_slug, images: (t.images||[]).length});
  }
  for (const [fam, arr] of families) {
    if (arr.length === 1 && arr[0].images === 0) {
      summary.push({model: m.model_slug, family: fam, trim: arr[0].slug});
    }
  }
}
console.log(`Total singleton-trim-family-no-images: ${summary.length}`);
console.log('First 10:');
for (const s of summary.slice(0, 10)) console.log(`  ${s.model}/${s.trim} family=${s.family}`);

// For each affected model, list ALL its families/trims
const modelSet = new Set(summary.map(s => s.model));
console.log('\nAffected models breakdown (first 5):');
let i = 0;
for (const slug of modelSet) {
  if (i++ >= 5) break;
  const m = d.models.find(x => x.model_slug === slug);
  console.log(`\n${slug} (${m.trims.length} trims, ${(m.trims.reduce((a,t)=>a+(t.images||[]).length,0))} total images):`);
  const fams = new Map();
  for (const t of m.trims) {
    if (!fams.has(t.trim_family)) fams.set(t.trim_family, []);
    fams.get(t.trim_family).push({slug: t.trim_slug, images: (t.images||[]).length});
  }
  for (const [fam, arr] of fams) {
    console.log(`  family=${fam}: ${arr.map(a => `${a.slug}(${a.images}img)`).join(', ')}`);
  }
}
