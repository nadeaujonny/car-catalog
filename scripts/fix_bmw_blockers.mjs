// Fix BMW forbidden-source blockers (Session 11 Phase 2)
// Reads data/bmw.json, applies fixes, writes back to data/bmw.json AND catalog/data/bmw.json.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'C:\\Users\\nadea\\car-catalogs';
const SRC = path.join(ROOT, 'data', 'bmw.json');
const DST = path.join(ROOT, 'catalog', 'data', 'bmw.json');

const FORBIDDEN_DOMAINS = [
  'cars.com',
  'motor1.com',
  'carbuzz.com',
  'autoblog.com',
  'autoevolution.com',
  'teslaoracle.com',
  'carsfrenzy.net',
  'carscoops.com',
  'reddit.com',
  'wikipedia.org',
  'iseecars.com',
  'bmwofloveland.com',
  'bmwofmilwaukeenorth.com',
];

function isForbidden(url) {
  if (typeof url !== 'string') return false;
  const u = url.toLowerCase();
  return FORBIDDEN_DOMAINS.some((d) => u.includes(d));
}

// Read JSON
const json = JSON.parse(fs.readFileSync(SRC, 'utf8'));

// Stats
let replacements = 0;
let removals = 0;
let confidenceDowngrades = 0;
let nullsWithNotes = 0;
const unhandled = [];

// Today's date string for notes
const TODAY = '2026-05-15';
const NOTE_SUFFIX = ' Spec source originally cited cars.com/carbuzz.com (forbidden per §4.1); manufacturer source not findable as of 2026-05-15.';

// ---------- helper: pick best replacement URL from sources map ----------
function pickReplacement(sources, preferredField) {
  // preferredField is a string like 'fuel_economy' or 'powertrain'
  // try in priority order
  const tryOrder = [];
  if (preferredField === 'fuel_economy') {
    tryOrder.push('fuel_economy');
  }
  // common manufacturer fields
  tryOrder.push('powertrain', 'features', 'performance.zero_to_60_sec', 'performance.top_speed_mph', 'msrp_base', 'dimensions', 'warranty', 'wheels_tires', 'destination_fee', 'safety.nhtsa_overall_rating');
  for (const k of tryOrder) {
    const v = sources?.[k];
    if (typeof v === 'string' && !isForbidden(v)) {
      // also exclude consumer aggregator sites we know are forbidden, and the obvious manufacturer/.gov/safety org are preferred
      return v;
    }
  }
  // last resort: scan everything
  for (const [k, v] of Object.entries(sources || {})) {
    if (typeof v === 'string' && !isForbidden(v)) return v;
    if (v && typeof v === 'object') {
      // sometimes nested
      for (const [, vv] of Object.entries(v)) {
        if (typeof vv === 'string' && !isForbidden(vv)) return vv;
      }
    }
  }
  return null;
}

// ---------- Per-trim fix ----------
function fixTrimSourcesField(trim, fieldPath) {
  // fieldPath like "dimensions" or "safety.nhtsa_overall_rating" or "dimensions.cargo_volume_cuft"
  const sources = trim.sources;
  if (!sources) {
    unhandled.push(`${trim.trim_slug}: no sources map for field ${fieldPath}`);
    return;
  }
  const cur = sources[fieldPath];
  if (typeof cur !== 'string' || !isForbidden(cur)) {
    // Already not forbidden, skip
    return;
  }

  // Determine replacement
  const repl = pickReplacement(sources, fieldPath);
  if (repl) {
    sources[fieldPath] = repl;
    replacements++;
  } else {
    sources[fieldPath] = null;
    nullsWithNotes++;
    const existing = typeof trim.notes === 'string' ? trim.notes : '';
    if (!existing.includes('forbidden per §4.1')) {
      trim.notes = (existing ? existing + ' ' : '') + NOTE_SUFFIX.trim();
    }
  }
}

// ---------- Per-model professional_reviews link removal ----------
function removeForbiddenReviewLinks(model) {
  const pr = model.professional_reviews;
  if (!pr || !Array.isArray(pr.links)) return;
  const before = pr.links.length;
  pr.links = pr.links.filter((l) => !(l && isForbidden(l.url)));
  const removedCount = before - pr.links.length;
  removals += removedCount;
  if (pr.links.length === 0 && pr.confidence === 'high') {
    pr.confidence = 'medium';
    confidenceDowngrades++;
  }
}

// ---------- Apply fixes per blocker list ----------
// Build a structure to operate on: walk models and trims
const models = json.models;

// Fix each blocker, addressing them by indexed location to be safe
// Blockers list distilled into operations:
const ops = [
  // model[0] 2-series-coupe
  { kind: 'trim_field', m: 0, t: 0, field: 'dimensions' },          // 230i dim - carbuzz
  { kind: 'trim_field', m: 0, t: 2, field: 'powertrain' },          // m240i powertrain - cars.com
  { kind: 'trim_field', m: 0, t: 3, field: 'powertrain' },          // m240i-xdrive powertrain - cars.com
  // model[1] 2-series-gran-coupe
  { kind: 'trim_field', m: 1, t: 0, field: 'dimensions' },          // 228 gran coupe
  { kind: 'trim_field', m: 1, t: 0, field: 'warranty' },
  { kind: 'trim_field', m: 1, t: 2, field: 'warranty' },
  { kind: 'reviews', m: 1 },                                       // autoblog
  // model[2] 3-series
  { kind: 'trim_field', m: 2, t: 0, field: 'safety.nhtsa_overall_rating' },
  { kind: 'trim_field', m: 2, t: 1, field: 'msrp_base' },
  { kind: 'trim_field', m: 2, t: 2, field: 'msrp_base' },
  { kind: 'trim_field', m: 2, t: 3, field: 'msrp_base' },
  { kind: 'reviews', m: 2 },
  // model[3] 4-series-coupe
  { kind: 'trim_field', m: 3, t: 0, field: 'dimensions' },
  { kind: 'trim_field', m: 3, t: 2, field: 'dimensions' },
  { kind: 'reviews', m: 3 },
  // model[5] 4-series-gran-coupe
  { kind: 'trim_field', m: 5, t: 0, field: 'dimensions' },
  { kind: 'trim_field', m: 5, t: 0, field: 'warranty' },
  { kind: 'trim_field', m: 5, t: 2, field: 'msrp_base' },
  { kind: 'trim_field', m: 5, t: 2, field: 'dimensions' },
  { kind: 'trim_field', m: 5, t: 2, field: 'warranty' },
  // model[7] 7-series
  { kind: 'trim_field', m: 7, t: 0, field: 'dimensions' },
  { kind: 'trim_field', m: 7, t: 2, field: 'dimensions' },
  { kind: 'trim_field', m: 7, t: 3, field: 'dimensions' },
  // model[8] x1
  { kind: 'trim_field', m: 8, t: 0, field: 'dimensions' },
  { kind: 'reviews', m: 8 },
  // model[9] x2
  { kind: 'trim_field', m: 9, t: 0, field: 'dimensions' },
  { kind: 'trim_field', m: 9, t: 0, field: 'warranty' },
  // model[10] x3
  { kind: 'trim_field', m: 10, t: 0, field: 'dimensions' },
  // model[12] x6
  { kind: 'trim_field', m: 12, t: 0, field: 'dimensions' },
  // model[14] alpina-xb7
  { kind: 'trim_field', m: 14, t: 0, field: 'dimensions' },
  { kind: 'trim_field', m: 14, t: 0, field: 'dimensions.cargo_volume_cuft' },
  { kind: 'trim_field', m: 14, t: 0, field: 'wheels_tires' },
  // model[15] xm
  { kind: 'trim_field', m: 15, t: 0, field: 'destination_fee' },
  { kind: 'reviews', m: 15 },
  // model[16] z4
  { kind: 'trim_field', m: 16, t: 0, field: 'dimensions' },
  { kind: 'trim_field', m: 16, t: 1, field: 'dimensions' },
  // model[17] m2
  { kind: 'trim_field', m: 17, t: 0, field: 'dimensions' },
  // model[18] m3
  { kind: 'trim_field', m: 18, t: 0, field: 'destination_fee' },
  { kind: 'trim_field', m: 18, t: 0, field: 'dimensions' },
  { kind: 'trim_field', m: 18, t: 0, field: 'features' },
  { kind: 'trim_field', m: 18, t: 1, field: 'destination_fee' },
  { kind: 'trim_field', m: 18, t: 2, field: 'destination_fee' },
  // model[19] m4-coupe
  { kind: 'reviews', m: 19 },
  // model[20] m4-convertible
  { kind: 'trim_field', m: 20, t: 0, field: 'msrp_base' },
  // model[21] m5-sedan
  { kind: 'trim_field', m: 21, t: 0, field: 'msrp_base' },
  { kind: 'trim_field', m: 21, t: 0, field: 'destination_fee' },
  { kind: 'trim_field', m: 21, t: 0, field: 'wheels_tires' },
  // model[22] m5-touring
  { kind: 'trim_field', m: 22, t: 0, field: 'msrp_base' },
  { kind: 'trim_field', m: 22, t: 0, field: 'dimensions' },
  { kind: 'reviews', m: 22 },
  // model[23] x5-m-competition
  { kind: 'trim_field', m: 23, t: 0, field: 'wheels_tires' },
  // model[24] x6-m-competition
  { kind: 'trim_field', m: 24, t: 0, field: 'dimensions.curb_weight_lb' },
  // model[26] i5
  { kind: 'trim_field', m: 26, t: 0, field: 'dimensions' },
  { kind: 'trim_field', m: 26, t: 1, field: 'dimensions' },
  { kind: 'trim_field', m: 26, t: 2, field: 'dimensions' },
  // model[27] i7
  { kind: 'trim_field', m: 27, t: 0, field: 'dimensions' },
  { kind: 'trim_field', m: 27, t: 1, field: 'dimensions' },
  { kind: 'trim_field', m: 27, t: 2, field: 'dimensions' },
  { kind: 'reviews', m: 27 },
  // model[28] ix
  { kind: 'trim_field', m: 28, t: 0, field: 'dimensions' },
  { kind: 'trim_field', m: 28, t: 2, field: 'dimensions' },
  // model[29] ix3
  { kind: 'trim_field', m: 29, t: 0, field: 'dimensions' },
];

for (const op of ops) {
  const model = models[op.m];
  if (!model) {
    unhandled.push(`Missing model[${op.m}] for op ${JSON.stringify(op)}`);
    continue;
  }
  if (op.kind === 'trim_field') {
    const trim = model.trims?.[op.t];
    if (!trim) {
      unhandled.push(`Missing trim model[${op.m}].trims[${op.t}] for op ${JSON.stringify(op)}`);
      continue;
    }
    fixTrimSourcesField(trim, op.field);
  } else if (op.kind === 'reviews') {
    removeForbiddenReviewLinks(model);
  }
}

// Final write
const out = JSON.stringify(json, null, 2);
// preserve trailing newline if originally present
const origText = fs.readFileSync(SRC, 'utf8');
const trailing = origText.endsWith('\n') ? '\n' : '';
fs.writeFileSync(SRC, out + trailing, 'utf8');
fs.writeFileSync(DST, out + trailing, 'utf8');

console.log(JSON.stringify({
  replacements,
  removals,
  confidenceDowngrades,
  nullsWithNotes,
  unhandled,
}, null, 2));
