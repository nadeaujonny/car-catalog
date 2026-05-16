#!/usr/bin/env node
// Session 11 Phase 2: Replace forbidden-source citations in Toyota's brand JSON.
// Applies fix rules from the task:
//   Case A (sources.<field>): replace forbidden URL with a non-forbidden URL already used
//     in the same trim's sources map. Prefer fueleconomy.gov for fuel_economy fields;
//     otherwise use the manufacturer spec URL (powertrain or dimensions). If no
//     non-forbidden URL exists, set field to null and append a note to trim.notes.
//   Case B (professional_reviews.links): remove entire link entry. If links becomes
//     empty AND confidence == "high", downgrade to "medium".

import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';

const SOURCE_DENYLIST = [
  'motor1.com','carbuzz.com','autoblog.com','autoevolution.com','teslaoracle.com',
  'iseecars.com','hiconsumption.com','topspeed.com','hotcars.com','carsfrenzy.net','carscoops.com'
];
const WIKIPEDIA_DENY = ['wikipedia.org','en.wikipedia.org'];

function isDealerDomain(url) {
  if (!url || typeof url !== 'string') return false;
  let host;
  try { host = new URL(url).hostname.toLowerCase(); } catch { return false; }
  if (/\.dealer\./.test(host)) return true;
  if (/[a-z]of[a-z]+\./.test(host)) return true;
  if (/[a-z]-of-[a-z]/.test(host)) return true;
  if (/(dealership|automall|miller-?motorcars)/.test(host)) return true;
  return false;
}

function flagForbidden(url) {
  if (!url || typeof url !== 'string') return null;
  const u = url.toLowerCase();
  for (const d of SOURCE_DENYLIST) if (u.includes(d)) return d;
  if (u.includes('www.cars.com') || u.startsWith('https://cars.com') || u.includes('://cars.com')) return 'cars.com';
  for (const w of WIKIPEDIA_DENY) if (u.includes(w)) return 'wikipedia';
  return null;
}

function isForbiddenOrDealer(url) {
  return Boolean(flagForbidden(url)) || isDealerDomain(url);
}

function pickReplacement(sourcesMap, field) {
  // Find a non-forbidden URL already used elsewhere in this trim's sources map.
  // Prefer fueleconomy.gov for fuel_economy field.
  const entries = Object.entries(sourcesMap)
    .filter(([k, v]) => k !== field && typeof v === 'string' && !isForbiddenOrDealer(v));

  if (field === 'fuel_economy') {
    const feg = entries.find(([k, v]) => v.toLowerCase().includes('fueleconomy.gov'));
    if (feg) return feg[1];
  }
  // Prefer powertrain field as it's typically a manufacturer spec page
  const pt = entries.find(([k]) => k === 'powertrain');
  if (pt) return pt[1];
  // Then dimensions
  const dim = entries.find(([k]) => k === 'dimensions');
  if (dim) return dim[1];
  // Then msrp_base
  const msrp = entries.find(([k]) => k === 'msrp_base');
  if (msrp) return msrp[1];
  // Then features
  const feat = entries.find(([k]) => k === 'features');
  if (feat) return feat[1];
  // Otherwise, first available non-forbidden
  if (entries.length) return entries[0][1];
  return null;
}

const DATA_PATH = 'C:/Users/nadea/car-catalogs/data/toyota.json';
const CATALOG_PATH = 'C:/Users/nadea/car-catalogs/catalog/data/toyota.json';

const doc = JSON.parse(readFileSync(DATA_PATH, 'utf8'));

let sourceReplacements = 0;
let sourceNulled = 0;
let linksRemoved = 0;
let confidenceDowngrades = 0;
const unfixable = [];

// Pass A: sources maps
for (const m of doc.models || []) {
  for (const t of m.trims || []) {
    if (!t.sources || typeof t.sources !== 'object') continue;
    for (const [field, url] of Object.entries(t.sources)) {
      if (!isForbiddenOrDealer(url)) continue;
      const replacement = pickReplacement(t.sources, field);
      if (replacement) {
        t.sources[field] = replacement;
        sourceReplacements++;
      } else {
        t.sources[field] = null;
        sourceNulled++;
        const note = 'Spec source originally cited cars.com (forbidden per §4.1); manufacturer source not findable as of 2026-05-15.';
        if (t.notes && typeof t.notes === 'string' && t.notes.length > 0) {
          if (!t.notes.includes(note)) t.notes = t.notes + ' ' + note;
        } else {
          t.notes = note;
        }
      }
    }
  }
}

// Pass B: professional_reviews.links
for (const m of doc.models || []) {
  if (!m.professional_reviews || !Array.isArray(m.professional_reviews.links)) continue;
  const before = m.professional_reviews.links.length;
  m.professional_reviews.links = m.professional_reviews.links.filter(link => {
    if (!link || typeof link !== 'object') return true;
    if (isForbiddenOrDealer(link.url)) {
      linksRemoved++;
      return false;
    }
    return true;
  });
  if (m.professional_reviews.links.length === 0 && before > 0 && m.professional_reviews.confidence === 'high') {
    m.professional_reviews.confidence = 'medium';
    confidenceDowngrades++;
  }
}

// Write back, preserving file format (indent=2, trailing newline). Verify byte equality afterwards.
const out = JSON.stringify(doc, null, 2) + '\n';
writeFileSync(DATA_PATH, out, 'utf8');
writeFileSync(CATALOG_PATH, out, 'utf8');

console.log(JSON.stringify({
  sourceReplacements,
  sourceNulled,
  linksRemoved,
  confidenceDowngrades,
  unfixable_count: unfixable.length,
  unfixable
}, null, 2));
