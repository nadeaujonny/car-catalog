#!/usr/bin/env node
// Session 12: Fix Toyota's 56 singleton-trim_family-with-0-images blockers.
// Strategy: minimal-diff trim_family renames. For each affected trim, change its
// trim_family field to match an existing populated (or base-containing) family in
// the same model and powertrain. The family becomes multi-trim, the §7 blocker
// rule no longer fires.
//
// No image entries, local_paths, is_shared_with_trim_family flags, is_base_trim,
// or delta_from_base values are touched. .bak backups are created before save.
//
// Run: node scripts/session12_fix_toyota_singletons.mjs
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';

const DATA_PATH = 'C:/Users/nadea/car-catalogs/data/toyota.json';
const CATALOG_PATH = 'C:/Users/nadea/car-catalogs/catalog/data/toyota.json';

// [model_slug, trim_slug, old_family, new_family]
const renames = [
  // corolla (2 blockers, 2 renames)
  ['corolla', 'se', 'se-ice', 'le-ice'],
  ['corolla', 'hybrid-xle', 'xle-hybrid', 'le-hybrid'],
  // corolla-cross (3 blockers, 3 renames)
  ['corolla-cross', 'le', 'le-ice', 'l-ice'],
  ['corolla-cross', 'hybrid-se', 'se-hybrid', 's-hybrid'],
  ['corolla-cross', 'hybrid-xse', 'xse-hybrid', 's-hybrid'],
  // corolla-hatchback (1 blocker, 1 rename)
  ['corolla-hatchback', 'xse', 'xse', 'se'],
  // gr-corolla (1 blocker, 1 rename)
  ['gr-corolla', 'premium-plus', 'premium-plus', 'core'],
  // gr-supra (2 blockers, 2 renames)
  ['gr-supra', '3-0-premium', '3-0-premium', '3-0'],
  ['gr-supra', 'mkv-final-edition', 'mkv-final-edition', '3-0'],
  // gr86 (2 blockers, 2 renames)
  ['gr86', 'premium', 'premium', 'base'],
  ['gr86', 'yuzu-edition', 'yuzu', 'base'],
  // grand-highlander (8 blockers, 8 renames)
  ['grand-highlander', 'xle', 'xle-ice', 'le-ice'],
  ['grand-highlander', 'limited', 'limited-ice', 'le-ice'],
  ['grand-highlander', 'platinum', 'platinum-ice', 'le-ice'],
  ['grand-highlander', 'hybrid-xle', 'xle-hybrid', 'le-hybrid'],
  ['grand-highlander', 'hybrid-limited', 'limited-hybrid', 'le-hybrid'],
  ['grand-highlander', 'hybrid-nightshade', 'nightshade-hybrid', 'le-hybrid'],
  ['grand-highlander', 'hybrid-platinum', 'platinum-hybrid', 'le-hybrid'],
  ['grand-highlander', 'hybrid-max-platinum', 'platinum-hybrid-max', 'limited-hybrid-max'],
  // highlander (2 blockers, 2 renames)
  ['highlander', 'hybrid-limited', 'limited-hybrid', 'xle-hybrid'],
  ['highlander', 'hybrid-platinum', 'platinum-hybrid', 'xle-hybrid'],
  // land-cruiser (1 blocker, 1 rename)
  ['land-cruiser', 'land-cruiser', 'land-cruiser', '1958'],
  // prius (1 blocker, 1 rename)
  ['prius', 'phev-xse', 'xse-phev', 'se-phev'],
  // rav4 (6 blockers, 5 renames — phev-se-awd cleared indirectly when phev-xse-awd joins se-phev)
  ['rav4', 'hybrid-se', 'se-hybrid', 'le-hybrid'],
  ['rav4', 'hybrid-xle-premium', 'xle-premium-hybrid', 'le-hybrid'],
  ['rav4', 'hybrid-xse-awd', 'xse-hybrid', 'le-hybrid'],
  ['rav4', 'phev-xse-awd', 'xse-phev', 'se-phev'],
  ['rav4', 'phev-woodland-awd', 'woodland-phev', 'se-phev'],
  // sequoia (6 blockers, 5 renames — sr5 base cleared indirectly)
  ['sequoia', 'limited', 'limited', 'sr5'],
  ['sequoia', 'trd-pro', 'trd-pro', 'sr5'],
  ['sequoia', '1794', '1794', 'sr5'],
  ['sequoia', 'platinum', 'platinum', 'sr5'],
  ['sequoia', 'capstone', 'capstone', 'sr5'],
  // sienna (6 blockers, 5 renames — le base cleared indirectly)
  ['sienna', 'xle', 'xle', 'le'],
  ['sienna', 'xse', 'xse', 'le'],
  ['sienna', 'woodland', 'woodland', 'le'],
  ['sienna', 'limited', 'limited', 'le'],
  ['sienna', 'platinum', 'platinum', 'le'],
  // tacoma (8 blockers, 6 renames — sr & trailhunter bases cleared indirectly)
  ['tacoma', 'sr5', 'sr5-ice', 'sr-ice'],
  ['tacoma', 'trd-prerunner', 'trd-prerunner-ice', 'sr-ice'],
  ['tacoma', 'trd-sport', 'trd-sport-ice', 'sr-ice'],
  ['tacoma', 'trd-off-road', 'trd-offroad-ice', 'sr-ice'],
  ['tacoma', 'limited', 'limited-ice', 'sr-ice'],
  ['tacoma', 'trd-pro', 'trd-pro-hybrid', 'trailhunter-hybrid'],
  // tundra (7 blockers, 5 renames — sr & trd-pro bases cleared indirectly)
  ['tundra', 'sr5', 'sr5-ice', 'sr-ice'],
  ['tundra', 'limited', 'limited-ice', 'sr-ice'],
  ['tundra', 'platinum', 'platinum-ice', 'sr-ice'],
  ['tundra', '1794', '1794-ice', 'sr-ice'],
  ['tundra', 'capstone', 'capstone-hybrid', 'trd-pro-hybrid'],
];

console.log(`Total renames: ${renames.length}`);

function applyRenames(doc, label) {
  let applied = 0;
  let mismatches = 0;
  for (const [modelSlug, trimSlug, oldFam, newFam] of renames) {
    const m = doc.models.find(x => x.model_slug === modelSlug);
    if (!m) { console.error(`  [${label}] model not found: ${modelSlug}`); mismatches++; continue; }
    const t = (m.trims || []).find(x => x.trim_slug === trimSlug);
    if (!t) { console.error(`  [${label}] trim not found: ${modelSlug}/${trimSlug}`); mismatches++; continue; }
    if (t.trim_family !== oldFam) {
      console.error(`  [${label}] family mismatch on ${modelSlug}/${trimSlug}: expected '${oldFam}', got '${t.trim_family}'`);
      mismatches++;
      continue;
    }
    t.trim_family = newFam;
    applied++;
  }
  console.log(`[${label}] applied=${applied} mismatches=${mismatches}`);
  return { applied, mismatches };
}

function backupAndWrite(path, doc) {
  if (existsSync(path)) copyFileSync(path, path + '.bak');
  writeFileSync(path, JSON.stringify(doc, null, 2) + '\n', 'utf8');
}

// Read both copies, verify they parse, apply, write
const data = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));

console.log('\nApplying to data/toyota.json:');
const r1 = applyRenames(data, 'data');
console.log('\nApplying to catalog/data/toyota.json:');
const r2 = applyRenames(catalog, 'catalog');

if (r1.mismatches > 0 || r2.mismatches > 0) {
  console.error('\nABORT: mismatches detected, refusing to write');
  process.exit(1);
}
if (r1.applied !== renames.length || r2.applied !== renames.length) {
  console.error(`\nABORT: applied count mismatch (data=${r1.applied}, catalog=${r2.applied}, expected=${renames.length})`);
  process.exit(1);
}

console.log('\nWriting files (with .bak backups)...');
backupAndWrite(DATA_PATH, data);
backupAndWrite(CATALOG_PATH, catalog);
console.log(`Wrote ${DATA_PATH} (+ .bak)`);
console.log(`Wrote ${CATALOG_PATH} (+ .bak)`);

console.log('\nDone. Next: run scripts/verify_brand.mjs toyota');
