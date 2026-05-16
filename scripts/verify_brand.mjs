#!/usr/bin/env node
// Programmatic structural verification for Phase 3. Outputs JSON with findings keyed by severity.
// Usage: node scripts/verify_brand.mjs <brand_slug>

import { readFileSync } from 'node:fs';

const REQUIRED_TOP = ['brand','brand_slug','researched_at','schema_version','models'];
const REQUIRED_MODEL_KEYS = [
  'model','model_slug','model_year','body_style','generation_context',
  'msrp_range','model_summary','reliability','customer_satisfaction',
  'professional_reviews','owner_reviews','trims','researched_at','notes'
];
const REQUIRED_TRIM_KEYS = [
  'trim','trim_slug','trim_family','is_base_trim','msrp_base','destination_fee',
  'msrp_as_equipped_estimate','powertrain','ev_specifics','fuel_economy','performance',
  'dimensions','capacity','wheels_tires','safety','features','warranty',
  'images','sources','delta_from_base','notes'
];
const BODY_STYLE_TAXONOMY = new Set([
  'sedan','coupe','hatchback','wagon','convertible',
  'suv-compact','suv-midsize','suv-3row','suv-full-size',
  'pickup-midsize','pickup-full-size','minivan','sports-car'
]);
const SOURCE_DENYLIST = [
  'motor1.com','carbuzz.com','autoblog.com','autoevolution.com','teslaoracle.com',
  'iseecars.com','hiconsumption.com','topspeed.com','hotcars.com'
];
const WIKIPEDIA_DENY = ['wikipedia.org','en.wikipedia.org'];
const SLUG_RE = /^[a-z0-9-]+$/;

function isDealerDomain(url) {
  // dealer heuristic — Session 11 fix:
  // Restrict to hostname-only matching. The prior regex matched "of[-_\.]" anywhere in the URL,
  // including paths like "benefits-of-ownership" (Subaru) or "horsepower-of-any-muscle-car"
  // (Dodge press release) — flagging legitimate manufacturer/press URLs as dealer domains.
  // Biased toward false-negatives (might miss a dealer) over false-positives (which block
  // legitimate manufacturer URLs).
  // Dealer hostname patterns we still detect:
  //   - "*.dealer.*" subdomain
  //   - "<brand>of<city>." (e.g., bmwofbeverlyhills.com, lexusofdowntown.com)
  //   - "<brand>-of-<city>" (e.g., chevy-of-dallas.com, mercedes-benz-of-westchester.com)
  //   - hostnames containing "dealership", "automall", or known chain names
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

const slug = process.argv[2];
if (!slug) { console.error('Usage: verify_brand.mjs <brand_slug>'); process.exit(2); }

const path = `C:/Users/nadea/car-catalogs/data/${slug}.json`;
const doc = JSON.parse(readFileSync(path, 'utf8'));

const blockers = [];
const warnings = [];
const fyis = [];

// Top-level
for (const k of REQUIRED_TOP) {
  if (!(k in doc)) blockers.push({ title: `Missing top-level key '${k}'`, where: 'root' });
}

// Per-model
const allTrimFamilies = new Map(); // family -> [{model_slug, trim_slug, image_count, trim_idx, model_idx}]
let modelsWithUnknownAllFour = 0;
let baseTrimMoreThan2NullSpecBlocks = 0;
let modelsLowImageCount = 0;

doc.models.forEach((m, mi) => {
  for (const k of REQUIRED_MODEL_KEYS) {
    if (!(k in m)) blockers.push({ title: `Model missing key '${k}'`, where: `models[${mi}] (${m.model_slug || '??'})` });
  }
  if (m.body_style && !BODY_STYLE_TAXONOMY.has(m.body_style)) {
    blockers.push({ title: `Invalid body_style`, where: `models[${mi}].body_style`, value: m.body_style });
  }
  if (m.model_slug && !SLUG_RE.test(m.model_slug)) {
    blockers.push({ title: `Invalid model_slug`, where: `models[${mi}].model_slug`, value: m.model_slug });
  }

  // Confidence-all-unknown check
  const confs = ['reliability','customer_satisfaction','professional_reviews','owner_reviews']
    .map(b => m[b] && m[b].confidence);
  if (confs.every(c => c === 'unknown')) modelsWithUnknownAllFour++;

  // Trims
  const trims = m.trims || [];
  const trimMsrps = trims.map(t => t.msrp_base).filter(v => typeof v === 'number');
  if (trimMsrps.length && m.msrp_range) {
    const low = Math.min(...trimMsrps), high = Math.max(...trimMsrps);
    if (m.msrp_range.low !== low) {
      blockers.push({ title: `msrp_range.low mismatch`, where: `models[${mi}].msrp_range.low (${m.model_slug})`, value: m.msrp_range.low, expected: low });
    }
    if (m.msrp_range.high !== high) {
      blockers.push({ title: `msrp_range.high mismatch`, where: `models[${mi}].msrp_range.high (${m.model_slug})`, value: m.msrp_range.high, expected: high });
    }
  }

  // Track trims per family for image-coverage check
  trims.forEach((t, ti) => {
    for (const k of REQUIRED_TRIM_KEYS) {
      if (!(k in t)) blockers.push({ title: `Trim missing key '${k}'`, where: `models[${mi}].trims[${ti}] (${m.model_slug}/${t.trim_slug || '??'})` });
    }
    if (t.trim_slug && !SLUG_RE.test(t.trim_slug)) {
      blockers.push({ title: `Invalid trim_slug`, where: `models[${mi}].trims[${ti}].trim_slug`, value: t.trim_slug });
    }
    if (t.trim_family && !SLUG_RE.test(t.trim_family)) {
      blockers.push({ title: `Invalid trim_family slug`, where: `models[${mi}].trims[${ti}].trim_family`, value: t.trim_family });
    }
    // is_base_trim / delta_from_base consistency
    if (t.is_base_trim === true && t.delta_from_base !== null) {
      blockers.push({ title: `Base trim has non-null delta_from_base`, where: `models[${mi}].trims[${ti}] (${m.model_slug}/${t.trim_slug})` });
    }
    if (t.is_base_trim === false && t.delta_from_base === null) {
      blockers.push({ title: `Step-up trim has null delta_from_base`, where: `models[${mi}].trims[${ti}] (${m.model_slug}/${t.trim_slug})` });
    }
    // msrp_base must be present — UNLESS trim.notes documents manufacturer non-disclosure
    // (per instructions/03_verify_catalog.md Step 2 and 00_master_spec.md §13).
    if (t.msrp_base === null || t.msrp_base === undefined) {
      const notes = (t.notes || '').toLowerCase();
      // Match common ways research has documented manufacturer non-disclosure.
      const nonDisclosureRe = /(does not publish|non[ -]?disclosure|msrp not findable|no us msrp|no[ -]published[ -]msrp|msrp[ -]gap|msrp undisclosed|invitation-only|invite-only|not publicly disclosed|pricing not published|manufacturer does not disclose|not findable from allowed)/;
      if (nonDisclosureRe.test(notes)) {
        fyis.push({ title: `Null msrp_base — ultra-luxury non-disclosure (documented in notes)`, where: `models[${mi}].trims[${ti}] (${m.model_slug}/${t.trim_slug})` });
      } else {
        blockers.push({ title: `msrp_base is null`, where: `models[${mi}].trims[${ti}] (${m.model_slug}/${t.trim_slug})` });
      }
    }
    // delta_from_base.from_trim_slug must reference an actual trim in this model
    if (t.delta_from_base && t.delta_from_base.from_trim_slug) {
      const refSlug = t.delta_from_base.from_trim_slug;
      const found = trims.some(other => other.trim_slug === refSlug);
      if (!found) {
        blockers.push({ title: `delta_from_base.from_trim_slug references unknown trim`, where: `models[${mi}].trims[${ti}] (${m.model_slug}/${t.trim_slug})`, value: refSlug });
      }
    }
    // Track family
    if (t.trim_family) {
      const fam = `${m.model_slug}::${t.trim_family}`;
      if (!allTrimFamilies.has(fam)) allTrimFamilies.set(fam, []);
      allTrimFamilies.get(fam).push({ model_slug: m.model_slug, model: m.model, trim_slug: t.trim_slug, trim: t.trim, image_count: (t.images || []).length, mi, ti });
    }

    // EV/PHEV/HEV must have ev_specifics; ICE must not
    if (t.powertrain) {
      const pt = t.powertrain.type;
      if (pt === 'ice' && t.ev_specifics !== null && t.ev_specifics !== undefined && t.is_base_trim === true) {
        // step-up trims may have null all; only check base trim where blocks are fully populated
        warnings.push({ title: `ICE trim has non-null ev_specifics`, where: `models[${mi}].trims[${ti}] (${m.model_slug}/${t.trim_slug})` });
      }
      if (['hybrid','phev','ev','fcev'].includes(pt) && t.is_base_trim === true && (t.ev_specifics === null || t.ev_specifics === undefined)) {
        warnings.push({ title: `${pt} base trim has null ev_specifics`, where: `models[${mi}].trims[${ti}] (${m.model_slug}/${t.trim_slug})` });
      }
    }

    // Forbidden source check across sources map
    if (t.sources && typeof t.sources === 'object') {
      for (const [field, url] of Object.entries(t.sources)) {
        const flag = flagForbidden(url);
        if (flag) {
          blockers.push({ title: `Forbidden source (${flag}) in sources map`, where: `models[${mi}].trims[${ti}].sources.${field} (${m.model_slug}/${t.trim_slug})`, value: url });
        }
        if (isDealerDomain(url || '')) {
          blockers.push({ title: `Forbidden dealer source in sources map`, where: `models[${mi}].trims[${ti}].sources.${field} (${m.model_slug}/${t.trim_slug})`, value: url });
        }
      }
    }
  });

  // Forbidden sources in professional_reviews.links and review block sources arrays
  if (m.professional_reviews && Array.isArray(m.professional_reviews.links)) {
    m.professional_reviews.links.forEach((link, li) => {
      const flag = flagForbidden(link && link.url);
      if (flag) {
        blockers.push({ title: `Forbidden source (${flag}) in professional_reviews.links`, where: `models[${mi}].professional_reviews.links[${li}] (${m.model_slug})`, value: link.url, publication: link.publication });
      }
      if (link && link.url && isDealerDomain(link.url)) {
        blockers.push({ title: `Forbidden dealer source in professional_reviews.links`, where: `models[${mi}].professional_reviews.links[${li}] (${m.model_slug})`, value: link.url });
      }
    });
  }
  for (const block of ['reliability','customer_satisfaction','owner_reviews']) {
    if (m[block] && Array.isArray(m[block].sources)) {
      m[block].sources.forEach((url, si) => {
        const flag = flagForbidden(url);
        if (flag) {
          blockers.push({ title: `Forbidden source (${flag}) in ${block}.sources`, where: `models[${mi}].${block}.sources[${si}] (${m.model_slug})`, value: url });
        }
      });
    }
  }

  // Coverage: base trim nulls per block
  const baseTrims = trims.filter(t => t.is_base_trim === true);
  baseTrims.forEach(bt => {
    const nullBlocks = ['powertrain','fuel_economy','performance','dimensions','features','safety'].filter(b => bt[b] === null).length;
    if (nullBlocks > 2) {
      warnings.push({ title: `Base trim has >2 null spec blocks`, where: `${m.model_slug}/${bt.trim_slug}`, value: nullBlocks });
      baseTrimMoreThan2NullSpecBlocks++;
    }
  });

  // Missing key sources entries for base trim
  baseTrims.forEach(bt => {
    const srcs = bt.sources || {};
    const missing = [];
    for (const key of ['msrp_base','powertrain','fuel_economy','dimensions']) {
      if (!(key in srcs) && bt[key] !== null) missing.push(key);
    }
    if (missing.length) {
      warnings.push({ title: `Base trim missing sources entries`, where: `${m.model_slug}/${bt.trim_slug}`, value: missing.join(',') });
    }
  });

  // dimensions vs body style
  baseTrims.forEach(bt => {
    if (!bt.dimensions || !bt.dimensions.cargo_volume_cuft) return;
    const cv = bt.dimensions.cargo_volume_cuft;
    if (m.body_style === 'sedan' || m.body_style === 'coupe') {
      if (cv.trunk_cuft === null) warnings.push({ title: `${m.body_style} base trim has null trunk_cuft`, where: `${m.model_slug}/${bt.trim_slug}` });
      if (cv.behind_2nd_row !== null) warnings.push({ title: `${m.body_style} base trim has non-null behind_2nd_row`, where: `${m.model_slug}/${bt.trim_slug}` });
    } else if (m.body_style && (m.body_style.startsWith('suv-') || m.body_style === 'hatchback' || m.body_style === 'wagon')) {
      if (cv.behind_2nd_row === null) warnings.push({ title: `${m.body_style} base trim has null behind_2nd_row`, where: `${m.model_slug}/${bt.trim_slug}` });
      if (cv.trunk_cuft !== null && cv.trunk_cuft !== undefined) warnings.push({ title: `${m.body_style} base trim has non-null trunk_cuft`, where: `${m.model_slug}/${bt.trim_slug}` });
    }
  });

  // image count
  const totalImagesAcrossTrims = trims.reduce((a,t)=>a+(t.images||[]).length, 0);
  if (totalImagesAcrossTrims < 4) {
    modelsLowImageCount++;
    warnings.push({ title: `Model has <4 total images across all trims`, where: `${m.model_slug}`, value: totalImagesAcrossTrims });
  }
});

// Singleton trim_family with 0 images
for (const [fam, entries] of allTrimFamilies.entries()) {
  if (entries.length === 1) {
    const t = entries[0];
    if (t.image_count === 0) {
      blockers.push({ title: `Singleton trim_family with 0 images (§7 violation)`, where: `${t.model_slug}/${t.trim_slug} family=${fam.split('::')[1]}` });
    } else if (t.image_count < 4) {
      warnings.push({ title: `Singleton trim_family with <4 images`, where: `${t.model_slug}/${t.trim_slug} family=${fam.split('::')[1]}`, value: t.image_count });
    }
  }
}

// Cross-trim sanity: msrp outliers
doc.models.forEach((m, mi) => {
  const trims = (m.trims || []).filter(t => typeof t.msrp_base === 'number').sort((a,b)=>a.msrp_base-b.msrp_base);
  for (let i = 1; i < trims.length; i++) {
    if (trims[i].msrp_base > trims[i-1].msrp_base * 2.1 && trims[i].msrp_base - trims[i-1].msrp_base > 30000) {
      fyis.push({ title: `Possible MSRP outlier (>2x prior)`, where: `${m.model_slug}/${trims[i].trim_slug}`, value: `${trims[i-1].msrp_base} → ${trims[i].msrp_base}` });
    }
  }
});

// EV mpge mirror to fuel_economy
doc.models.forEach((m, mi) => {
  (m.trims || []).forEach((t, ti) => {
    if (t.powertrain && t.powertrain.type === 'ev' && t.ev_specifics && t.ev_specifics.mpge_combined != null && t.fuel_economy) {
      if (t.fuel_economy.combined_mpg == null && t.is_base_trim) {
        warnings.push({ title: `EV base trim has null fuel_economy.combined_mpg while ev_specifics.mpge_combined populated (spec §3.6 v1.1 mirror)`, where: `${m.model_slug}/${t.trim_slug}` });
      }
    }
    // PHEV charge-sustaining should be in fuel_economy
    if (t.powertrain && t.powertrain.type === 'phev' && t.is_base_trim && t.fuel_economy && t.fuel_economy.combined_mpg == null) {
      warnings.push({ title: `PHEV base trim has null fuel_economy.combined_mpg (charge-sustaining MPG missing)`, where: `${m.model_slug}/${t.trim_slug}` });
    }
  });
});

// Image needs_scraping summary
let totalImages = 0, needsScraping = 0;
doc.models.forEach(m => (m.trims || []).forEach(t => (t.images || []).forEach(img => {
  totalImages++;
  if (img.needs_scraping) needsScraping++;
})));

// Counts
const modelCount = doc.models.length;
const trimCount = doc.models.reduce((a,m)=>a+(m.trims||[]).length, 0);

console.log(JSON.stringify({
  brand: doc.brand,
  brand_slug: doc.brand_slug,
  researched_at: doc.researched_at,
  schema_version: doc.schema_version,
  model_count: modelCount,
  trim_count: trimCount,
  total_images: totalImages,
  needs_scraping: needsScraping,
  modelsWithUnknownAllFour,
  modelsLowImageCount,
  blocker_count: blockers.length,
  warning_count: warnings.length,
  fyi_count: fyis.length,
  blockers,
  warnings,
  fyis
}, null, 2));
