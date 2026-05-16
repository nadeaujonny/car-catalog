// One-shot fix-pass script for 2026-05-13 session.
// Applies the queued fixes per SESSION_NOTES.md.
// Writes to both data/<brand>.json and catalog/data/<brand>.json (kept in sync).

import fs from 'node:fs';

function load(p) {
  let t = fs.readFileSync(p, 'utf-8');
  if (t.charCodeAt(0) === 0xFEFF) t = t.slice(1);
  return JSON.parse(t);
}

function save(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf-8');
}

function syncSave(brand, obj) {
  save(`data/${brand}.json`, obj);
  save(`catalog/data/${brand}.json`, obj);
}

const summary = [];

// ── P1. Mazda: remove GreenCars link from CX-70 professional_reviews.links ──
{
  const j = load('data/mazda.json');
  const m = j.models.find(x => x.model_slug === 'cx-70');
  const before = m.professional_reviews.links.length;
  m.professional_reviews.links = m.professional_reviews.links.filter(
    L => !/greencars\.com/.test(L.url || '')
  );
  const removed = before - m.professional_reviews.links.length;
  syncSave('mazda', j);
  summary.push(`mazda: removed ${removed} greencars.com link from cx-70 professional_reviews.links`);
}

// ── P3. Audi: remove TopSpeed link from SQ5 professional_reviews.links ──
{
  const j = load('data/audi.json');
  const m = j.models.find(x => x.model_slug === 'sq5');
  const before = m.professional_reviews.links.length;
  m.professional_reviews.links = m.professional_reviews.links.filter(
    L => !/topspeed\.com/.test(L.url || '')
  );
  const removed = before - m.professional_reviews.links.length;
  syncSave('audi', j);
  summary.push(`audi: removed ${removed} topspeed.com link from sq5 professional_reviews.links`);
}

// ── P7. Porsche: replace stuttcars.com in 911/carrera-s sources.dimensions ──
//      Re-point to the porsche.com carrera-s page already used for msrp_base/powertrain
{
  const j = load('data/porsche.json');
  const m = j.models.find(x => x.model_slug === '911');
  const t = m.trims.find(x => x.trim_slug === 'carrera-s');
  const before = t.sources.dimensions;
  t.sources.dimensions = 'https://www.porsche.com/usa/models/911/carrera-models/911-carrera-s/';
  // Add a notes line explaining the source consolidation (only if not already present)
  const noteLine = 'sources.dimensions points to porsche.com carrera-s product page (same as msrp_base/powertrain) — primary manufacturer source for chassis dimensions.';
  if (!(t.notes || '').includes(noteLine)) {
    t.notes = (t.notes ? t.notes + ' ' : '') + noteLine;
  }
  syncSave('porsche', j);
  summary.push(`porsche: 911/carrera-s sources.dimensions changed from "${before}" → "${t.sources.dimensions}"`);
}

// ── B2. Genesis: consolidate gv70/2-5t-sport-prestige-awd singleton family ──
//      Currently trim_family="gv70-25t-sport" (singleton, 2 imgs).
//      Other 2.5T sport-line trim is family "gv70-25t-sport" too? Let me check inline.
//      Per scan: base_fam="gv70-25t" exists. Consolidate to gv70-25t-sport's sibling.
//      Other families in GV70: gv70-25t, gv70-35t-sport, gv70-25t-sport.
//      The 2.5T Sport Prestige is a 2.5T trim (matches gv70-25t base family).
{
  const j = load('data/genesis.json');
  const m = j.models.find(x => x.model_slug === 'gv70');
  const t = m.trims.find(x => x.trim_slug === '2-5t-sport-prestige-awd');
  const before = t.trim_family;
  t.trim_family = 'gv70-25t';
  syncSave('genesis', j);
  summary.push(`genesis: gv70/2-5t-sport-prestige-awd trim_family ${before} → ${t.trim_family} (consolidated)`);
}

// ── B7. Nissan: consolidate 12 singleton families into parent base family ──
{
  const j = load('data/nissan.json');
  // Maps: model_slug → trim_slug → new trim_family value
  const map = {
    'sentra': { 'sv': 's', 'sl': 's' },
    'leaf': { 'sv-plus': 's-plus' },
    'kicks': { 'sv': 's' },
    'rogue': { 'sv': 's', 'sl': 's' },
    'rogue-plug-in-hybrid': { 'platinum': 'sl' },
    'murano': { 'sl': 'sv' },
    'pathfinder': { 'sl': 'sv' },
    'armada': { 'sl': 'sv', 'platinum': 'sv' },
    'frontier': { 'sv-crew-cab': 's' },
  };
  let count = 0;
  for (const [modelSlug, trimMap] of Object.entries(map)) {
    const m = j.models.find(x => x.model_slug === modelSlug);
    if (!m) { summary.push(`nissan: WARNING model ${modelSlug} not found`); continue; }
    for (const [trimSlug, newFam] of Object.entries(trimMap)) {
      const t = m.trims.find(x => x.trim_slug === trimSlug);
      if (!t) { summary.push(`nissan: WARNING trim ${modelSlug}/${trimSlug} not found`); continue; }
      const before = t.trim_family;
      t.trim_family = newFam;
      count++;
    }
  }
  syncSave('nissan', j);
  summary.push(`nissan: consolidated ${count} singleton trim_family entries into parent family`);
}

// ── B12. Ford: consolidate 27 singleton families into parent base family ──
{
  const j = load('data/ford.json');
  const map = {
    'bronco': { 'black-diamond': 'base', 'outer-banks': 'base', 'heritage-edition': 'base' },
    'escape': { 'st-line': 'active' },
    'explorer': { 'st-line': 'active', 'platinum': 'active' },
    'expedition': { 'platinum': 'active', 'king-ranch': 'active' },
    'maverick': { 'xlt': 'xl', 'lariat': 'xl' },
    'ranger': { 'xlt': 'xl', 'lariat': 'xl' },
    'f-150': { 'stx': 'xl', 'xlt': 'xl', 'lariat': 'xl', 'king-ranch': 'xl', 'platinum': 'xl' },
    'f-150-lightning': { 'flash': 'stx', 'lariat': 'stx', 'platinum': 'stx' },
    'f-250-super-duty': { 'xlt': 'xl', 'lariat': 'xl', 'king-ranch': 'xl', 'platinum': 'xl', 'limited': 'xl' },
    'f-350-super-duty': { 'limited': 'xl' },
    'f-450-super-duty': { 'limited': 'xl' },
  };
  let count = 0;
  for (const [modelSlug, trimMap] of Object.entries(map)) {
    const m = j.models.find(x => x.model_slug === modelSlug);
    if (!m) { summary.push(`ford: WARNING model ${modelSlug} not found`); continue; }
    for (const [trimSlug, newFam] of Object.entries(trimMap)) {
      const t = m.trims.find(x => x.trim_slug === trimSlug);
      if (!t) { summary.push(`ford: WARNING trim ${modelSlug}/${trimSlug} not found`); continue; }
      const before = t.trim_family;
      t.trim_family = newFam;
      count++;
    }
  }
  syncSave('ford', j);
  summary.push(`ford: consolidated ${count} singleton trim_family entries into parent family`);
}

console.log('Fix-pass complete. Summary:');
summary.forEach(s => console.log('  ', s));
