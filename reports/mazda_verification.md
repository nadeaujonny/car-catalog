# Verification Report: Mazda

**Date:** 2026-05-12
**Data source:** `data/mazda.json` (researched 2026-05-12)
**Models checked:** 12
**Trims checked:** 57
**Trims sampled for source verification:** 3 (CX-70 3.3 Turbo Premium Plus, Mazda3 Hatchback 2.5 Turbo Premium Plus, CX-70 PHEV SC Plus)
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 2
- **Warnings:** 3
- **FYIs:** 3

---

## Blockers

### 1. 36 singleton trim_family entries with 0 images — spec §7 violation at scale

- **Models affected:** Mazda3 Sedan (3), Mazda3 Hatchback (3), CX-30 (6), CX-5 (4), CX-50 (5), CX-50 Hybrid (2), CX-70 (3), CX-70 PHEV (1), CX-90 (4), CX-90 PHEV (2), MX-5 Miata (2), MX-5 Miata RF (1) = **36 empty families**
- **Issue:** Each step-up trim is assigned its own singleton `trim_family` slug (e.g., `select-sport`, `preferred`, `carbon-edition`, `meridian-edition`, `premium-plus`, `s-premium`), and the trim's `images` array is empty. Per spec §7: "Singleton families (a trim_family containing exactly one trim) must carry all 4 required angles directly on that trim's own images array; there is no other trim in the family to inherit from." Phase 1 appears to have intended for these step-up trims to inherit images from the base family (e.g., `s`, `turbo`, `hybrid-preferred`), but assigning a different `trim_family` slug breaks the inheritance rule under the spec. Same architectural issue as the Acura MDX SH-AWD finding (Blocker #2 in `acura_verification.md`), but at 36-trim scale here.
- **Found in:** every step-up trim listed above; representative path `models[0].trims[1].images = []` (Mazda3 Sedan 2.5 S Select Sport) etc.
- **Value seen:** `images: []` on each
- **Expected:** Either (a) reassign every step-up trim's `trim_family` to its model's base family slug (e.g., all Mazda3 Sedan 2.5-S-line trims share `trim_family: "s"`), enabling legitimate image sharing per spec §7; or (b) duplicate the 4 base-family image entries into each step-up trim with `is_shared_with_trim_family: true` (more verbose but explicit). Option (a) is the lower-friction fix and matches what Phase 1 likely intended.

---

### 2. Residual Motor1 citations in `professional_reviews.links` (2 entries)

- **Models affected:** CX-5, MX-5 Miata
- **Issue:** Per spec §4 and this batch's source-cleanup pass, motor1.com is on the forbidden-content-farm list.
- **Found in:**
  - `models[3].professional_reviews.links[0].url` → `https://www.motor1.com/news/784288/2026-mazda-cx5-price/`
  - `models[10].professional_reviews.links[1].url` → `https://www.motor1.com/news/785715/2026-mazda-mx5-miata-price-trims-specs-options/`
- **Expected:** Replace with a permitted secondary source (Car and Driver, MotorTrend, Edmunds) or drop. STATUS.md notes Mazda had a mid-batch cleanup pass; these two slipped through.

---

## Warnings

### 1. CX-70 PHEV `mpge_combined: 56` disagrees with EPA bymodel page (61 MPGe)

- **Model/trim:** CX-70 PHEV / PHEV SC (base)
- **Issue:** `ev_specifics.mpge_combined: 56` in data. EPA `bymodel/2026_Mazda_CX-70.shtml` reports "SC 4WD Plug-in Hybrid (4-cylinder): Electric mode: 61 MPGe combined." Per spec §4.2, EPA is the authoritative source for fuel economy.
- **Found in:** `models[7].trims[0].ev_specifics.mpge_combined`
- **Value seen:** 56
- **Source consulted:** https://www.fueleconomy.gov/feg/bymodel/2026_Mazda_CX-70.shtml (2026-05-12)
- **Recommendation:** Update to `mpge_combined: 61` to match current EPA. The 17.8 kWh battery capacity and 26 mi all-electric range carry over.

---

### 2. CX-70 Turbo Preferred city_mpg 24 vs EPA bymodel 23

- **Model/trim:** CX-70 / 3.3 Turbo Preferred (Mild-Hybrid base)
- **Issue:** `fuel_economy.city_mpg: 24` for the base Hybrid Boost CX-70 trim. EPA bymodel page shows "Hybrid Boost Models (6-cylinder): City 23 MPG / Highway 28 / Combined 25." 1 MPG discrepancy on city only.
- **Found in:** `models[6].trims[0].fuel_economy.city_mpg`
- **Value seen:** 24 (data) vs 23 (EPA bymodel)
- **Source consulted:** https://www.fueleconomy.gov/feg/bymodel/2026_Mazda_CX-70.shtml
- **Recommendation:** Reconcile with EPA. If Mazda's MY26 release contains separate ratings for Preferred vs S Premium (the S Premium data trim has 23/28/25 which matches EPA), keep both; if both trims share one rating, update Preferred to 23. Highway and combined already match.

---

### 3. Mazda3 Hatchback `sources.dimensions` URL returns 404

- **Model/trim:** Mazda3 Hatchback / 2.5 Turbo Premium Plus
- **Issue:** `sources.dimensions: "https://www.mazdausa.com/vehicles/2026-mazda3-hatchback"` returned HTTP 404 when fetched today. The dimensions source URL pattern (`/vehicles/2026-<model>`) for the Mazda3 may not be the current path — Mazda has been using `/vehicles/<model>` without the model-year prefix on the consumer site. The dimensions values in the data may still be correct; only the source URL is broken.
- **Found in:** `models[1].trims[5].sources.dimensions`
- **Value seen:** `https://www.mazdausa.com/vehicles/2026-mazda3-hatchback` → 404
- **Source consulted:** the URL itself (WebFetch, 2026-05-12)
- **Recommendation:** Replace with `https://www.mazdausa.com/vehicles/mazda3-hatchback` (likely current consumer URL) or with the press-release URL (`news.mazdausa.com/2025-08-19-2026-Mazda3-Pricing-and-Packaging`) for consistency with the trim's `msrp_base` and `powertrain` sources.

---

## FYIs

### 1. JD Power VDS / APEAL and CR predicted reliability — partial coverage

- **Model/trim:** Most Mazda models
- **Note:** Mazda is sampled by JD Power but per-model 2026 MY scores were not located in primary sources during Phase 1. owner_reviews values are populated where Edmunds / KBB carry sample sizes. No model has all four review blocks at `unknown` confidence.

### 2. EPA 2026 listings for Mazda3 Turbo not yet published per `bymodel` page

- **Model/trim:** Mazda3 Sedan / 2.5 Turbo Premium Plus; Mazda3 Hatchback / 2.5 Turbo Premium Plus
- **Note:** `fueleconomy.gov/feg/bymodel/2026_Mazda_3.shtml` currently lists only 2.5L non-turbo variants ("Regular Gasoline"). Phase 1's turbo MPG values (23/31/26) are presumably carried from press materials or prior-MY EPA carryover. Per the batch context EPA-lag rule for newly-released trims, this is the documented fallback pattern. Once EPA publishes 2026 Turbo entries, verify and update.

### 3. All 83 needs_scraping image entries are mazdausa.com / news.mazdausa.com pages

- **Model/trim:** every model
- **Note:** Per STATUS.md, mazdausa.com consumer pages and news.mazdausa.com press URLs are used as placeholders pending Phase 4. Per batch protocol these are not flagged as image-URL failures.

---

## Coverage stats

- Models with >2 null spec blocks on base trim: **0**
- Trim families with <4 images: **36** (every step-up singleton trim_family — see Blocker #1)
- Models with all 4 review blocks at `confidence: "unknown"`: **0**
- Trims missing key sources entries for populated blocks: **0** (analyzer reports source coverage clean; Warning #3 is URL-validity, not missing-entry)

---

## Sample details

### Sampled trims for source verification

1. **CX-70 3.3 Turbo Premium Plus** (step-up) — checked against `https://www.fueleconomy.gov/feg/bymodel/2026_Mazda_CX-70.shtml`
   - `fuel_economy.city/highway/combined`: 24/28/25 — EPA bymodel lists 23/28/25 for Hybrid Boost CX-70 generally; combined and highway match, city diverges by 1 (see Warning #2 about the base trim)
   - `msrp_base: $49,570` / `destination_fee: $1,530` — `sources.msrp_base` cites `news.mazdausa.com/2025-10-07-2026-Mazda-CX-70-Pricing-and-Packaging` (primary press; consistent format)
   - Result: **PASS on MSRP; minor MPG discrepancy that affects the base trim**

2. **Mazda3 Hatchback 2.5 Turbo Premium Plus** — checked against `https://www.mazdausa.com/vehicles/2026-mazda3-hatchback` (404) and `https://www.fueleconomy.gov/feg/bymodel/2026_Mazda_3.shtml` (no turbo listed)
   - `msrp_base: $38,090` / `destination_fee: $1,235` — `sources.msrp_base` cites `news.mazdausa.com/2025-08-19-2026-Mazda3-Pricing-and-Packaging` (primary press)
   - `powertrain.horsepower_hp: 250` — consistent with Mazda's published 2.5L Turbo S figure on regular gas (227 hp on regular / 250 hp on premium)
   - `sources.dimensions` URL → **404** (see Warning #3)
   - `fuel_economy.city/highway/combined`: 23/31/26 — not verifiable against EPA 2026 (no turbo entry yet); see FYI #2
   - Result: **PASS on press-release-sourced fields; dimensions source URL broken; fuel economy pending EPA**

3. **CX-70 PHEV SC Plus** (step-up of PHEV line) — checked against `https://www.fueleconomy.gov/feg/bymodel/2026_Mazda_CX-70.shtml`
   - `msrp_base: $47,450` / `destination_fee: $1,530` — `sources.msrp_base` press URL
   - PHEV step-up shape (powertrain block null per §6.3); base `phev-sc` trim has `mpge_combined: 56` vs EPA bymodel 61 (see Warning #1)
   - Result: **PASS on MSRP; PHEV base trim MPGe disagreement bubbles up**

### Image URLs checked

All 5 sampled image entries had `needs_scraping: true` and pointed to mazdausa.com consumer pages:

1. `https://www.mazdausa.com/vehicles/cx-5` — CX-5 2.5 S rear_three_quarter — `needs_scraping: true` (expected)
2. `https://www.mazdausa.com/vehicles/cx-50` — CX-50 2.5 S Select interior_dashboard — `needs_scraping: true` (expected)
3. `https://www.mazdausa.com/vehicles/cx-90` — CX-90 3.3 Turbo S Premium Sport rear_three_quarter — `needs_scraping: true` (expected)
4. `https://www.mazdausa.com/vehicles/mx-5-miata-rf` — MX-5 Miata RF Grand Touring 6AT interior_dashboard — `needs_scraping: true` (expected)
5. `https://www.mazdausa.com/vehicles/mx-5-miata` — MX-5 Miata Sport front_three_quarter — `needs_scraping: true` (expected)

No image URL failures flagged per batch protocol.

---

## Notes on this verification

- **The 36-empty-singleton-trim_family pattern (Blocker #1) is the dominant finding.** It affects every Mazda model with step-up trims and is structurally identical to the Acura MDX SH-AWD finding. A single Phase 1 fix-pass that reassigns step-up trims to share their base family slug would close all 36 in one operation.
- **EPA bymodel-page spot-checks revealed two small numeric discrepancies** (Warnings #1 and #2) on the CX-70 PHEV MPGe and CX-70 base hybrid city MPG. Neither is dramatic, but EPA is authoritative per spec §4.2, so both are worth syncing in the next fix pass.
- **mazdausa.com consumer page URLs returned 404 on at least one URL pattern (Warning #3).** Mazda's URL scheme appears to drop the `2026-` prefix on the consumer site. The press subdomain (news.mazdausa.com) URLs all resolved.
- **2 residual Motor1 citations** survived the documented mid-batch cleanup. Same single-grep + replace would clear both.
- **Multi-base-trim layout per spec §6.2** is correctly applied on models with multiple powertrain lines or distinct trim families (Mazda3 Sedan: S line + Turbo line; CX-30: S line + Turbo line; CX-70: Turbo line + Turbo S line; CX-90: same; MX-5: 6MT line + 6AT line). Each step-up correctly references its same-powertrain/family base in `delta_from_base.from_trim_slug`.
- **Schema, MSRP integrity, body-style taxonomy, delta-from-base references, body-cargo consistency, powertrain/ev_specifics consistency** all pass programmatic check.
