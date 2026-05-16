// Validate proposed variants against actual candidate samples.

function variantToRegexFragment(v) {
  return (v || "").trim().toLowerCase()
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map(escapeRe)
    .join("[-_ ]");
}
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function slugMatchesURL(variant, haystack) {
  const frag = variantToRegexFragment(variant);
  if (!frag) return false;
  const re = new RegExp(`(^|[/_ -])${frag}([/_ -]|\\.|$)`, "i");
  return re.test(haystack.toLowerCase());
}

// Sample URL+alt from each of the failing models (extracted from playwright log).
// Verify proposed new variants match enough candidates without false-pos across models.
const samples = {
  "cle-cabriolet": [
    // URL paths use cle-class/cle-cab/
    ["/cle-class/cle-cab/class-page/series/2026-CLE-CAB-HC-D.jpg", "CLE Cabriolet"],
    ["/cle-class/cle-cab/class-page/series/2026-CLE-CAB-EH-1.jpg", "Aerodynamic design"],
    ["/cle-class/cle-cab/class-page/series/2026-CLE-CAB-IH-5.jpg", "Immersive audio"],
  ],
  "maybach-s-class": [
    ["/maybach/s-sedan-maybach/gallery/series/gallery-type/2026-S-MAYBACH-GAL-001-L-TE-DR.jpg", "Display Mercedes Maybach S 580 Maybach S 580 in Cirrus Silver/Obsidian Black"],
    ["/maybach/s-sedan-maybach/class-page/series/S_maybach-design-hero.jpg", ""],
    ["/maybach/s-sedan-maybach/class-page/series/S_maybach-performance-slideshow-3.jpg", ""],
  ],
  "maybach-eqs-suv": [
    ["/eqs-class/eqs-suv-maybach/class-page/EQS-maybach-design-hero.jpg", ""],
    ["/eqs-class/eqs-suv-maybach/gallery/gallery-type/2026-EQS-MAYBACH-SUV-GAL-001-Q-TE-DR.jpg", "2026-EQS-MAYBACH-SUV-GAL-001-Q-FE-DR.jpg"],
    ["/eqs-class/eqs-suv-maybach/gallery/gallery-type/2026-EQS-MAYBACH-SUV-GAL-002-Q-TE-DR.jpg", "EQS Maybach"],
  ],
  "maybach-gls": [
    ["/maybach/gls-maybach/gallery/gallery-type/MBCAN-2026-GLS-MAYBACH-SUV-GAL-001-Q-TE-DR.jpg", "Display Maybach GLS 600  in Kalahari Gold/Obsidian Black"],
    ["/maybach/gls-maybach/gallery/type/2026-GLS-MAYBACH-SUV-GAL-003-Q-TE-DR.jpg", "Display Maybach GLS 600 in Kalahari Gold/Obsidian Black"],
  ],
  "amg-gt-coupe": [
    ["/amg-gt-class/amg-gt-2-dr/class-page/2026-AMG-GT-COUPE-HERO-DR.jpg", "2026-AMG-GT-COUPE-HERO-DR.jpg"],
    ["/amg-gt-class/amg-gt-2-dr/class-page/2026-AMG-GT-COUPE-CH-1-1-DR.jpg", "2026-AMG-GT-COUPE-CH-1-1-DR.jpg"],
    ["/amg-gt-class/amg-gt-2-dr/gallery/gallery-type/2026-AMG-GT-COUPE-GAL-001-Q-TE-DR.jpg", "2026-AMG-GT-COUPE-GAL-001-Q-FE-DR.jpg"],
  ],
  "amg-gt-4-door-coupe": [
    ["/amg-gt-class/amg-gt-4-dr/class-page/amg/2026-AMG-GT-4DR-COUPE-HERO-DR.jpg", ""],
    ["/amg-gt-class/amg-gt-4-dr/class-page/amg/2026-AMG-GT-4DR-COUPE-CH-1-1-DR.jpg", "2026-AMG-GT-4DR-COUPE-CH-1-1-DR.jpg"],
    ["/amg-gt-class/amg-gt-4-dr/gallery/amg/gallery-type/2026-AMG-GT-4DR-COUPE-GAL-014-I-TI-DR.jpg", "Display AMG GT 53  in Titanium Grey/Black Exclusive Nappa leather w/Yellow stitching"],
  ],
  "sl-roadster": [
    ["/sl-class/class-page/2026-SL-ROADSTER-HERO-DR.jpg", "2025 SL Roadster"],
    ["/sl-class/gallery/gallery-type/2026-AMG-SL-ROADSTER-GAL-001-C-TE-DR.jpg", "Display AMG SL 63 S E PERFORMANCE in MANUFAKTUR Cirrus Silver Magno"],
    ["/sl-class/cgt/2026-AMG-SL63-ROADSTER-CGT-DR.png", "SL63R4 Image"],
  ],
  "gla-suv": [
    ["/gla-class/class-page/series/2026-GLA-SUV-HERO-DR.jpg", "2026 GLA SUV"],
    ["/gla-class/gallery/series/gallery-type/2026-GLA-SUV-GAL-001-Q-TE-DR.jpg", "Display GLA 250 GLA 250 Pinnacle Trim in Polar White with AMG Night Package and black 20-inch AMG wheels"],
  ],
  "glb-suv": [
    ["/glb-class/class-page/series/2026-GLB-SUV-HERO-DR.jpg", "GLB SUV"],
    ["/glb-class/gallery/series/gallery-type/2026-GLB-SUV-GAL-001-J-TE-DR.jpg", "Display GLB 250 4MATIC  GLB 250 4MATIC Pinnacle Trim in Mountain Grey"],
  ],
  "eqe-sedan": [
    ["/eqe-class/eqe-sedan/class-page/series/2026-EQE-SEDAN-CPH-XL.jpg", ""],
    ["/eqe-class/eqe-sedan/class-page/series/2026-EQE-SEDAN-FWSH-1-1-XL.jpg", ""],
  ],
  "eqe-suv": [
    ["/eqe-class/eqe-suv/class-page/series/2026-EQE-SUV-CPH-XL.jpg", ""],
  ],
  "eqs-sedan": [
    ["/eqs-class/eqs-sedan/class-page/series/2026-EQS-SEDAN-CPH-XL.jpg", ""],
    ["/eqs-class/eqs-sedan/class-page/series/2026-EQS-SEDAN-FWSH-1-1-XL.jpg", ""],
  ],
  "eqs-suv": [
    ["/eqs-class/eqs-suv/class-page/series/2026-EQS-SUV-CPH-XL.jpg", ""],
  ],
  "g-class": [
    ["/g-class/class-page/series-(ncm)/2026-G-SUV-HC.jpg", "G-CLASS SUV"],
  ],
};

// Proposed new slug_variants for each model
const PROPOSED = {
  "cla":                 ["cla", "cla250", "cla350"],
  "c-class":             ["c-class", "c_class", "cclass", "c300", "c-sedan"],
  "cle-coupe":           ["cle-coupe", "cle_coupe", "clecoupe", "cle300", "cle450", "cle53"],
  "cle-cabriolet":       ["cle-cabriolet", "cle_cabriolet", "clecabriolet", "cle-cab", "cle300c", "cle450c"],
  "e-class-sedan":       ["e-class-sedan", "e_class_sedan", "e-sedan", "e350", "e450", "e53"],
  "e-class-wagon":       ["e-class-wagon", "e_class_wagon", "e-wagon", "e53w", "e53e4w"],
  "s-class":             ["s-class", "s_class", "sclass", "s500", "s580", "s-sedan"],
  "maybach-s-class":     ["maybach-s", "maybach_s", "maybachs", "s-maybach", "s-sedan-maybach", "s580z", "s680z"],
  "amg-gt-coupe":        ["amg-gt", "amggt", "amg-gt-2-dr", "amg-gt-2dr", "gt-coupe", "gt55", "gt63"],
  "amg-gt-4-door-coupe": ["amg-gt-4door", "amggt4door", "amg-gt-4-dr", "amg-gt-4dr", "gt-4dr-coupe", "gt43c4", "gt55c4", "gt63c4", "gt4door"],
  "sl-roadster":         ["sl", "sl-roadster", "sl43", "sl55", "sl63", "sl680"],
  "gla-suv":             ["gla", "gla250", "gla-class"],
  "glb-suv":             ["glb", "glb250", "glb-class"],
  "glc-suv":             ["glc-suv", "glc_suv", "glc300w", "glc300"],
  "glc-coupe":           ["glc-coupe", "glc_coupe", "glc300c", "glc43"],
  "gle-suv":             ["gle-suv", "gle_suv", "gle350", "gle450", "gle53", "gle63"],
  "gle-coupe":           ["gle-coupe", "gle_coupe", "gle450c", "gle53c"],
  "gls-suv":             ["gls", "gls450", "gls580", "gls63"],
  "maybach-gls":         ["maybach-gls", "maybachgls", "gls-maybach", "gls600"],
  "g-class":             ["g-class", "g_class", "gclass", "g550", "g580", "g63", "g-suv"],
  "eqe-sedan":           ["eqe-sedan", "eqe_sedan", "eqe320v", "eqe350v", "eqe500v", "amgeqev"],
  "eqe-suv":             ["eqe-suv", "eqe_suv", "eqe320x", "eqe350x", "eqe500x", "amgeqex"],
  "eqs-sedan":           ["eqs-sedan", "eqs_sedan", "eqs450r", "eqs450w", "eqs580w"],
  "eqs-suv":             ["eqs-suv", "eqs_suv", "eqs400x", "eqs450x", "eqs550x", "eqs580x"],
  "maybach-eqs-suv":     ["maybach-eqs", "maybacheqs", "maybach_eqs", "eqs-maybach", "eqs-suv-maybach", "eqs680"],
};

function slugMatchesAny(model, hay, vars) {
  for (const v of vars[model] || [model]) {
    const frag = variantToRegexFragment(v);
    if (!frag) continue;
    const re = new RegExp(`(^|[/_ -])${frag}([/_ -]|\\.|$)`, "i");
    if (re.test(hay.toLowerCase())) return v;
  }
  return null;
}

// For each sample, verify the variant matches the correct model and doesn't match
// any other model's variants (cross-contamination).
let fails = 0, ok = 0;
console.log("=== POSITIVE TESTS: each sample should match its own model ===\n");
for (const [model, sList] of Object.entries(samples)) {
  for (const [url, alt] of sList) {
    const hay = `${url} ${alt}`;
    const match = slugMatchesAny(model, hay, PROPOSED);
    if (match) {
      ok++;
      console.log(`OK [${model}] matched by '${match}': ${url}`);
    } else {
      fails++;
      console.log(`FAIL [${model}] NO MATCH: ${url}`);
    }
  }
}

console.log("\n=== CROSS-CONTAMINATION CHECK: each sample should NOT match other models' variants ===\n");
const crossFails = [];
for (const [model, sList] of Object.entries(samples)) {
  for (const [url, alt] of sList) {
    const hay = `${url} ${alt}`;
    for (const otherModel of Object.keys(PROPOSED)) {
      if (otherModel === model) continue;
      const match = slugMatchesAny(otherModel, hay, PROPOSED);
      if (match) {
        crossFails.push(`[${model} sample matched ${otherModel} via '${match}']: ${url.slice(0, 80)}`);
      }
    }
  }
}

if (crossFails.length === 0) {
  console.log("(none)");
} else {
  for (const f of crossFails) console.log(f);
}

console.log(`\n=== SUMMARY ===`);
console.log(`Positive: ${ok} ok, ${fails} fail`);
console.log(`Cross-contamination: ${crossFails.length}`);
