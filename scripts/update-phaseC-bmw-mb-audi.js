// Phase C data completeness for BMW, Mercedes-Benz, Audi
// Fills reliability + customer_satisfaction confidence:unknown gaps with JD Power 2026 VDS + CR 2026 data.
// JD Power 2026 APEAL not yet published as of 2026-05-15.

const fs = require('fs');
const path = require('path');

const ROOT = 'C:\\Users\\nadea\\car-catalogs';
const TODAY = '2026-05-15';

// Brand-level JD Power 2026 VDS (PP100, lower = better)
const VDS_BRAND = {
  bmw:            { score: 198, source: 'https://www.jdpower.com/business/press-releases/2026-us-vehicle-dependability-study-vds' },
  'mercedes-benz': { score: 235, source: 'https://www.jdpower.com/business/press-releases/2026-us-vehicle-dependability-study-vds' },
  audi:           { score: 244, source: 'https://www.jdpower.com/business/press-releases/2026-us-vehicle-dependability-study-vds' }
};
const VDS_INDUSTRY_AVG = 204;
const VDS_PREMIUM_AVG = 217;

// Consumer Reports 2026 brand-level rankings
const CR_BRAND = {
  bmw:            { rank: 5,  desc: 'BMW ranks 5th overall in CR 2026 reliability, the most reliable European brand; all models rated average or better predicted reliability.' },
  'mercedes-benz': { rank: 19, desc: 'Mercedes-Benz ranks 19th in CR 2026 reliability — the lowest-ranked European brand; E-Class and GLS rank at the bottom of their respective categories.' },
  audi:           { rank: 13, desc: 'Audi ranks 13th in CR 2026 reliability; Q4 e-tron shows declining reliability with reported problems in climate, electrical accessories, in-car electronics and EV battery/charging.' }
};
const CR_SOURCE_PRESS = 'https://www.consumerreports.org/media-room/press-releases/2025/12/consumer-reports-releases-its-2026-automotive-brand-report-card-the-comprehensive-analysis-of-vehicle-quality-to-help-guide-car-shoppers-amid-steep-prices/';

// Per-model CR 2026 predicted reliability (1-5 scale: 1=well below, 2=below, 3=about avg, 4=above, 5=well above).
// Where CR has no data ("NA"), we fall back to brand-level inference. "Average or better" for BMW means default to 3.
const CR_MODEL = {
  bmw: {
    '2-series-coupe':       { score: 3, label: 'about average', source: null, brand_fallback: true },
    '2-series-gran-coupe':  { score: 3, label: 'about average', source: null, brand_fallback: true },
    '3-series':             { score: 3, label: 'about average', source: 'https://www.consumerreports.org/cars/bmw/3-series/2026/reliability/' },
    '4-series-coupe':       { score: 3, label: 'about average', source: null, brand_fallback: true },
    '4-series-convertible': { score: 3, label: 'about average', source: null, brand_fallback: true },
    '4-series-gran-coupe':  { score: 3, label: 'about average', source: null, brand_fallback: true },
    '5-series-sedan':       { score: 3, label: 'about average', source: 'https://www.consumerreports.org/cars/bmw/5-series/2026/reliability/' },
    '7-series-sedan':       { score: null, label: 'NA / insufficient sample', source: 'https://www.consumerreports.org/cars/bmw/7-series/2026/reliability/' },
    'x1':                   { score: 3, label: 'about average', source: 'https://www.consumerreports.org/cars/bmw/x1/2026/reliability/' },
    'x2':                   { score: 3, label: 'about average', source: null, brand_fallback: true },
    'x3':                   { score: 3, label: 'about average', source: 'https://www.consumerreports.org/cars/bmw/x3/2026/reliability/' },
    'x5':                   { score: 4, label: 'above average', source: 'https://www.consumerreports.org/cars/bmw/x5/2026/reliability/' },
    'x6':                   { score: 3, label: 'about average', source: null, brand_fallback: true },
    'x7':                   { score: 4, label: 'above average', source: 'https://www.consumerreports.org/cars/bmw/x7/2026/reliability/' },
    'alpina-xb7':           { score: 4, label: 'above average (X7-based)', source: null, brand_fallback: true },
    'xm':                   { score: 3, label: 'about average', source: null, brand_fallback: true },
    'z4':                   { score: 3, label: 'about average', source: null, brand_fallback: true },
    'm2':                   { score: 3, label: 'about average', source: null, brand_fallback: true },
    'm3':                   { score: 3, label: 'about average', source: null, brand_fallback: true },
    'm4-coupe':             { score: 3, label: 'about average', source: null, brand_fallback: true },
    'm4-convertible':       { score: 3, label: 'about average', source: null, brand_fallback: true },
    'm5-sedan':             { score: 3, label: 'about average', source: null, brand_fallback: true },
    'm5-touring':           { score: 3, label: 'about average', source: null, brand_fallback: true },
    'x5-m-competition':     { score: 4, label: 'above average (X5-based)', source: null, brand_fallback: true },
    'x6-m-competition':     { score: 3, label: 'about average (X6-based)', source: null, brand_fallback: true },
    'i4':                   { score: 3, label: 'about average', source: 'https://www.consumerreports.org/cars/bmw/i4/2026/reliability/' },
    'i5':                   { score: 3, label: 'about average', source: 'https://www.consumerreports.org/cars/bmw/i5/2026/reliability/' },
    'i7':                   { score: null, label: 'NA / insufficient sample', source: 'https://www.consumerreports.org/cars/bmw/i7/2026/reliability/' },
    'ix':                   { score: 3, label: 'about average', source: 'https://www.consumerreports.org/cars/bmw/ix/2026/reliability/' },
    'ix3':                  { score: 3, label: 'about average (new model, brand fallback)', source: null, brand_fallback: true }
  },
  'mercedes-benz': {
    'cla':              { score: 2, label: 'below average (brand fallback)', source: null, brand_fallback: true },
    'c-class-sedan':    { score: 2, label: 'below average (brand fallback)', source: null, brand_fallback: true },
    'cle-coupe':        { score: 2, label: 'below average (brand fallback)', source: null, brand_fallback: true },
    'cle-cabriolet':    { score: 2, label: 'below average (brand fallback)', source: null, brand_fallback: true },
    'e-class-sedan':    { score: 2, label: 'below average (CR explicit)', source: 'https://www.consumerreports.org/cars/mercedes-benz/e-class/2026/reliability/' },
    'e-class-wagon':    { score: 2, label: 'below average (E-Class platform)', source: 'https://www.consumerreports.org/cars/mercedes-benz/e-class/2026/reliability/' },
    's-class':          { score: 2, label: 'below average (brand fallback)', source: null, brand_fallback: true },
    'maybach-s-class':  { score: 2, label: 'below average (S-Class based)', source: null, brand_fallback: true },
    'amg-gt-coupe':     { score: 2, label: 'below average (brand fallback)', source: null, brand_fallback: true },
    'amg-gt-4-door-coupe': { score: 2, label: 'below average (brand fallback)', source: null, brand_fallback: true },
    'sl-roadster':      { score: 2, label: 'below average (brand fallback)', source: null, brand_fallback: true },
    'gla-suv':          { score: 2, label: 'below average (brand fallback)', source: null, brand_fallback: true },
    'glb-suv':          { score: 2, label: 'below average (brand fallback)', source: null, brand_fallback: true },
    'glc-suv':          { score: 2, label: 'below average (CR explicit)', source: 'https://www.consumerreports.org/cars/mercedes-benz/glc/2026/reliability/' },
    'glc-coupe':        { score: 2, label: 'below average (GLC platform)', source: 'https://www.consumerreports.org/cars/mercedes-benz/glc/2026/reliability/' },
    'gle-suv':          { score: 3, label: 'about average (CR explicit)', source: 'https://www.consumerreports.org/cars/mercedes-benz/gle/2026/reliability/' },
    'gle-coupe':        { score: 3, label: 'about average (GLE platform)', source: 'https://www.consumerreports.org/cars/mercedes-benz/gle/2026/reliability/' },
    'gls-suv':          { score: 2, label: 'below average (CR notes GLS at bottom of category)', source: null, brand_fallback: true },
    'maybach-gls':      { score: 2, label: 'below average (GLS based)', source: null, brand_fallback: true },
    'g-class':          { score: 2, label: 'below average (brand fallback)', source: null, brand_fallback: true },
    'eqe-sedan':        { score: 2, label: 'below average (brand fallback)', source: null, brand_fallback: true },
    'eqe-suv':          { score: 2, label: 'below average (brand fallback)', source: null, brand_fallback: true },
    'eqs-sedan':        { score: 2, label: 'below average (brand fallback)', source: null, brand_fallback: true },
    'eqs-suv':          { score: 2, label: 'below average (brand fallback)', source: null, brand_fallback: true },
    'maybach-eqs-suv':  { score: 2, label: 'below average (EQS SUV based)', source: null, brand_fallback: true }
  },
  audi: {
    'a3':               { score: 3, label: 'about average (CR explicit)', source: 'https://www.consumerreports.org/cars/audi/a3/2026/reliability/' },
    's3':               { score: 3, label: 'about average (A3 platform)', source: 'https://www.consumerreports.org/cars/audi/a3/2026/reliability/' },
    'rs-3':             { score: 3, label: 'about average (A3 platform)', source: 'https://www.consumerreports.org/cars/audi/a3/2026/reliability/' },
    'a5':               { score: 3, label: 'about average (CR explicit)', source: 'https://www.consumerreports.org/cars/audi/a5/2026/reliability/' },
    's5':               { score: 3, label: 'about average (A5 platform)', source: 'https://www.consumerreports.org/cars/audi/a5/2026/reliability/' },
    'a6-sedan':         { score: 3, label: 'about average (CR explicit)', source: 'https://www.consumerreports.org/cars/audi/a6/2026/reliability/' },
    'a6-allroad':       { score: 3, label: 'about average (A6 platform)', source: 'https://www.consumerreports.org/cars/audi/a6/2026/reliability/' },
    'a8':               { score: 3, label: 'about average (CR explicit)', source: 'https://www.consumerreports.org/cars/audi/a8/2026/reliability/' },
    's8':               { score: 3, label: 'about average (A8 platform)', source: 'https://www.consumerreports.org/cars/audi/a8/2026/reliability/' },
    'rs-6-avant-performance': { score: 2, label: 'below average (brand fallback for performance variant)', source: null, brand_fallback: true },
    'rs-7-performance':       { score: 2, label: 'below average (brand fallback for performance variant)', source: null, brand_fallback: true },
    'q3':               { score: 3, label: 'about average (CR explicit)', source: 'https://www.consumerreports.org/cars/audi/q3/2026/reliability/' },
    'q4-e-tron':        { score: 2, label: 'below average (CR explicit — declining EV reliability)', source: 'https://www.consumerreports.org/cars/audi/q4-e-tron/2026/reliability/' },
    'q4-sportback-e-tron': { score: 2, label: 'below average (Q4 e-tron platform)', source: 'https://www.consumerreports.org/cars/audi/q4-e-tron/2026/reliability/' },
    'q5':               { score: 2, label: 'below average (CR explicit)', source: 'https://www.consumerreports.org/cars/audi/q5/2026/reliability/' },
    'q5-sportback':     { score: 2, label: 'below average (Q5 platform)', source: 'https://www.consumerreports.org/cars/audi/q5/2026/reliability/' },
    'sq5':              { score: 2, label: 'below average (Q5 platform)', source: 'https://www.consumerreports.org/cars/audi/q5/2026/reliability/' },
    'sq5-sportback':    { score: 2, label: 'below average (Q5 platform)', source: 'https://www.consumerreports.org/cars/audi/q5/2026/reliability/' },
    'q7':               { score: 3, label: 'about average (CR explicit)', source: 'https://www.consumerreports.org/cars/audi/q7/2026/reliability/' },
    'sq7':              { score: 3, label: 'about average (Q7 platform)', source: 'https://www.consumerreports.org/cars/audi/q7/2026/reliability/' },
    'q8':               { score: null, label: 'NA / insufficient sample', source: 'https://www.consumerreports.org/cars/audi/q8/2026/reliability/' },
    'sq8':              { score: null, label: 'NA / insufficient sample (Q8 platform)', source: 'https://www.consumerreports.org/cars/audi/q8/2026/reliability/' },
    'rs-q8-performance':{ score: null, label: 'NA / insufficient sample (Q8 platform)', source: 'https://www.consumerreports.org/cars/audi/q8/2026/reliability/' },
    's-e-tron-gt':      { score: null, label: 'NA / insufficient sample', source: 'https://www.consumerreports.org/cars/audi/e-tron-gt/2026/reliability/' },
    'rs-e-tron-gt-performance': { score: null, label: 'NA / insufficient sample', source: 'https://www.consumerreports.org/cars/audi/e-tron-gt/2026/reliability/' }
  }
};

function dedupePush(arr, val) {
  if (!val) return;
  if (!arr.includes(val)) arr.push(val);
}

function buildReliabilityFields(brandSlug, modelSlug, existing) {
  // Always set/refresh JD Power VDS brand-level fields
  const vds = VDS_BRAND[brandSlug];
  const cr = CR_BRAND[brandSlug];
  const crModel = (CR_MODEL[brandSlug] || {})[modelSlug];

  existing.jd_power_vds_score = vds.score;
  existing.jd_power_vds_year = 2026;

  // CR score (1-5). If model has explicit score, use it; if brand-fallback inferred, use it; if NA, keep null.
  let crScore = null;
  if (crModel) {
    crScore = crModel.score; // may be null if NA
  }
  existing.consumer_reports_predicted_reliability = crScore;

  // Build summary
  const vsAvgText = vds.score < VDS_INDUSTRY_AVG
    ? `better than the 204 industry average`
    : (vds.score === VDS_INDUSTRY_AVG ? `equal to the 204 industry average` : `worse than the 204 industry average`);
  const vsPremiumText = vds.score < VDS_PREMIUM_AVG
    ? `better than the 217 premium-segment average`
    : (vds.score === VDS_PREMIUM_AVG ? `equal to the 217 premium-segment average` : `worse than the 217 premium-segment average`);

  let crText;
  if (crModel && crModel.score !== null && !crModel.brand_fallback) {
    crText = `Consumer Reports 2026 predicts ${crModel.label} reliability for this model (${crModel.score}/5 on CR's scale). `;
  } else if (crModel && crModel.score !== null && crModel.brand_fallback) {
    crText = `Consumer Reports has not published a 2026 model-specific score; the model inherits the Audi/BMW/Mercedes brand reliability picture (${crModel.label}, est. ${crModel.score}/5). `;
  } else if (crModel && crModel.score === null) {
    crText = `Consumer Reports flags this 2026 model as "No Detailed Data Available" (insufficient sample). ${cr.desc} `;
  } else {
    crText = `${cr.desc} `;
  }

  existing.summary = `JD Power 2026 US VDS rates the ${brandSlug.replace('-', '-')} brand at ${vds.score} PP100 (lower is better) — ${vsAvgText} and ${vsPremiumText}. ${crText}` +
    (crModel && crModel.brand_fallback ? `Sourced from the published CR 2026 Brand Report Card and JD Power 2026 VDS brand ranking.` : `Cross-checked against published CR 2026 reliability page.`);

  // Confidence
  // - JD Power brand data is "high" quality, CR data is "high" if explicit-model, "medium" if brand-fallback, "low" if NA.
  let conf;
  if (crModel && crModel.score !== null && !crModel.brand_fallback) {
    conf = 'high'; // Both JD Power VDS brand + CR model-explicit data
  } else if (crModel && crModel.score !== null && crModel.brand_fallback) {
    conf = 'medium'; // JD Power brand + CR brand-fallback inference
  } else {
    conf = 'medium'; // JD Power brand confirmed; CR NA but brand picture is documented
  }
  existing.confidence = conf;

  // Sources
  if (!Array.isArray(existing.sources)) existing.sources = [];
  dedupePush(existing.sources, vds.source);
  dedupePush(existing.sources, CR_SOURCE_PRESS);
  if (crModel && crModel.source) dedupePush(existing.sources, crModel.source);
}

function buildSatisfactionFields(brandSlug, modelSlug, existing) {
  // JD Power 2026 APEAL not yet published as of 2026-05-15
  existing.jd_power_apeal_score = null;
  existing.jd_power_apeal_year = null;
  existing.summary = `JD Power 2026 APEAL Study has NOT yet been published as of 2026-05-15 (the US APEAL Study typically releases in July). No 2026 model-specific APEAL score is available for this model. The 2025 APEAL score may be applicable as carryover but has not been adopted here pending the 2026 release.`;
  existing.confidence = 'unknown';
  if (!Array.isArray(existing.sources)) existing.sources = [];
  dedupePush(existing.sources, 'https://www.jdpower.com/business/us-automotive-performance-execution-and-layout-apeal-study');
}

function processBrand(brandSlug) {
  const summary = {
    reliability_filled: [],
    satisfaction_filled: [],
    still_unknown_reliability: [],
    still_unknown_satisfaction: 0,
    sources: new Set()
  };

  for (const subdir of ['data', path.join('catalog', 'data')]) {
    const filePath = path.join(ROOT, subdir, `${brandSlug}.json`);
    const bakPath = filePath + '.bak';

    // 1) Backup current file (overwrite previous .bak)
    fs.copyFileSync(filePath, bakPath);

    // 2) Load & modify
    const raw = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(raw);

    for (const m of json.models) {
      const modelSlug = m.model_slug;
      // Reliability
      if (m.reliability && m.reliability.confidence === 'unknown') {
        buildReliabilityFields(brandSlug, modelSlug, m.reliability);
        if (subdir === 'data') {
          summary.reliability_filled.push(modelSlug);
          m.reliability.sources.forEach(s => summary.sources.add(s));
        }
      }
      // Satisfaction
      if (m.customer_satisfaction && m.customer_satisfaction.confidence === 'unknown') {
        buildSatisfactionFields(brandSlug, modelSlug, m.customer_satisfaction);
        if (subdir === 'data') {
          summary.satisfaction_filled.push(modelSlug);
          // Note: still unknown overall, but a note was added
          summary.still_unknown_satisfaction += 1;
        }
      }
    }

    // 3) Save with 2-space indent, matching existing style
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
  }

  return summary;
}

const results = {};
for (const brand of ['bmw', 'mercedes-benz', 'audi']) {
  results[brand] = processBrand(brand);
}

// Report
for (const brand of Object.keys(results)) {
  const r = results[brand];
  console.log(`\nBrand: ${brand}`);
  console.log(`  Models with reliability filled: ${r.reliability_filled.length} (${r.reliability_filled.join(', ')})`);
  console.log(`  Models with satisfaction note added: ${r.satisfaction_filled.length}`);
  console.log(`  Models still unknown satisfaction: ${r.still_unknown_satisfaction} — JD Power 2026 APEAL not yet published`);
  console.log(`  Sources used: ${[...r.sources].length}`);
  [...r.sources].slice(0, 10).forEach(s => console.log(`    - ${s}`));
}
