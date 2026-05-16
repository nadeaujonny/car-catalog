# Verification Report: Ferrari

**Date:** 2026-05-12
**Data source:** `data/ferrari.json` (researched 2026-05-12)
**Models checked:** 12
**Trims checked:** 12 (all sole-trim)
**Trims sampled for source verification:** 3 (Amalfi, 296 GTB, 296 GTS)
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 0
- **Warnings:** 1
- **FYIs:** 4

---

## Blockers

*None.* Schema, MSRP integrity, base-trim counts, body-style taxonomy, delta-from-base references, forbidden-source scan, body-cargo consistency, powertrain/ev_specifics consistency, EV-MPGe mirroring, image-family coverage, and sources-for-populated-blocks all pass programmatic check. The Phase 1 mid-batch source-cleanup pass appears thorough — zero residual Motor1/Carbuzz/cars.com/autoblog/autoevolution/dealer-site citations found anywhere in the data.

---

## Warnings

### 1. Safety source URLs point to IIHS/NHTSA roll-up or search pages

- **Model/trim:** Every trim
- **Issue:** Similar pattern to Rolls-Royce and Aston Martin in this batch — `sources.safety.nhtsa_overall_rating` and `sources.safety.iihs_top_safety_pick` point to brand-roll-up or search-result URLs rather than per-vehicle rating pages. The values are correctly null (NHTSA/IIHS don't test Ferrari), but the source URLs don't pin to a per-model page that confirms "not rated." Low-impact, but the third recurrence of this pattern in the batch.
- **Found in:** every trim's `sources.safety.*`
- **Value seen:** roll-up / search URLs
- **Recommendation:** Optionally normalize across the batch's ultra-luxury brands (Lamborghini, Rolls-Royce, Aston Martin, Ferrari) to a single convention — either per-vehicle search URLs or a brand-level note that no per-vehicle NHTSA/IIHS pages exist.

---

## FYIs

### 1. All 12 trims have null `msrp_base` and `destination_fee` — expected per batch context

- **Model/trim:** every trim
- **Note:** Per the batch context, Ferrari does not publish US MSRPs on its consumer site or in accessible primary press releases. Every trim's `notes` documents the manufacturer's price-non-disclosure and cites spec §4's forbidden-source rule (secondary aggregators like Carbuzz, Motor1, KBB, Edmunds, etc. cannot stand as the sole MSRP source). STATUS.md records widely-quoted secondary starting prices (~$277,970 Roma Spider, ~$262K-$285K Amalfi, ~$338K 296 GTB, ~$464K 296 Speciale, ~$420K 12Cilindri, ~$390K-$430K Purosangue, ~$3.9M F80) but explicitly notes "none are from primary Ferrari-published sources." Treated as FYI per batch protocol; would otherwise be 12 BLOCKERs under the spec's strict §2 rule. `msrp_range.low/high` are correctly null on every model.

### 2. JD Power VDS / APEAL / Consumer Reports — all null with `confidence: "unknown"`

- **Model/trim:** every model
- **Note:** `reliability` and `customer_satisfaction` are both `"unknown"` confidence on every Ferrari model — JD Power doesn't sample at Ferrari US volumes. Expected per batch context.

### 3. NHTSA / IIHS ratings null on every model — expected per batch context

- **Model/trim:** every model
- **Note:** Neither agency crash-tests current Ferrari vehicles. Notes explicitly document this. See Warning #1 for source-citation cleanup recommendation.

### 4. Amalfi and 849 Testarossa (+ Spider) fuel_economy null — EPA pre-publication

- **Models/trims:** Amalfi, 849 Testarossa, 849 Testarossa Spider
- **Note:** Per batch context, these new-for-2026 trims have null `fuel_economy` because EPA has not yet published per-trim entries. Their `sources.fuel_economy` URLs point to fueleconomy.gov 2026 Power Search (model-browse) per spec §4 EPA-unavailable fallback rule. Trim `notes` document the gap. Expected, not a finding. Once EPA publishes, fill in.

---

## Coverage stats

- Models with >2 null spec blocks on base trim: **0**
- Trim families with <4 images or missing required angles: **0** (every sole-trim family has exactly 4 angles)
- Models with all 4 review blocks at `confidence: "unknown"`: **0** (every model has `professional_reviews` at "medium" or "high"; `owner_reviews` at "low")
- Trims missing key sources entries for populated blocks: **0**

---

## Sample details

### Sampled trims for source verification

1. **Amalfi** — checked against `https://www.ferrari.com/en-EN/corporate/articles/ferrari-amalfi` (Ferrari corporate press release) and `https://www.fueleconomy.gov/feg/PowerSearch.do?action=noform&year1=2026&year2=2026...` (EPA 2026 model-browse fallback)
   - `powertrain.horsepower_hp: 631` / `engine_displacement_l: 3.9` / `engine_config: "V8"` / `aspiration: "twin_turbocharged"` — values consistent with Ferrari press release describing the F154 V8 evolution carrying 631 hp at 7,500 rpm
   - `fuel_economy.city/highway/combined: null/null/null` — EPA pre-publication; `notes` explicitly document the gap
   - `msrp_base: null` — see FYI #1
   - Result: **PASS by association; EPA detail page not yet published, manufacturer corporate press release is the cited primary**

2. **296 GTB** — checked against `https://www.fueleconomy.gov/feg/noframes/50260.shtml` (EPA)
   - `fuel_economy.combined_mpg: 18` — **PASS** (EPA: "18 MPG combined city/highway")
   - `ev_specifics.mpge_combined: 47` — **PASS** (EPA: "47 MPGe combined")
   - `powertrain.type: "phev"` and `drivetrain: "RWD"` — **PASS** (EPA confirms PHEV)
   - `ev_specifics.battery_capacity_kwh: 7.45` and `electric_range_mi: 8` — Ferrari-published values; EPA confirms PHEV but doesn't break out electric-only range on this page
   - Result: **PASS on every EPA-verifiable field**

3. **296 GTS** — checked against `https://www.fueleconomy.gov/feg/noframes/50261.shtml` (EPA)
   - `fuel_economy.combined_mpg: 18` — **PASS** (EPA: "18 MPG when running on gasoline only")
   - `ev_specifics.mpge_combined: 48` — **PASS** (EPA: "48 MPGe…on electricity and gas combined")
   - `powertrain.type: "phev"` — **PASS**
   - Result: **PASS on every EPA-verifiable field**

### Image URLs checked

All 5 sampled image entries had `needs_scraping: true` and pointed to ferrari.com model or press pages:

1. `https://www.ferrari.com/en-EN/corporate/articles/f80-ferraris-new-supercar-corporate` — F80 interior_dashboard — `needs_scraping: true` (expected; press article URL)
2. `https://www.ferrari.com/en-US/auto/296-speciale` — 296 Speciale interior_dashboard — `needs_scraping: true` (expected)
3. `https://www.ferrari.com/en-US/auto/amalfi` — Amalfi rear_three_quarter — `needs_scraping: true` (expected)
4. `https://www.ferrari.com/en-US/auto/296-gtb` — 296 GTB interior_dashboard — `needs_scraping: true` (expected)
5. `https://www.ferrari.com/en-US/auto/296-speciale-a` — 296 Speciale A side_profile — `needs_scraping: true` (expected)

No image URL failures flagged per batch protocol.

---

## Notes on this verification

- **Ferrari is among the cleanest brands in this batch — tied with Aston Martin for 0 blockers.** The Phase 1 mid-batch cleanup of dealer-site / content-farm citations was thorough.
- **EPA spot-checks were clean** for the two trims with published EPA entries (296 GTB: 18 / 47 MPGe; 296 GTS: 18 / 48 MPGe). Both match the JSON values exactly.
- **The Amalfi and 849 Testarossa Spider** correctly use the spec §4 EPA-unavailable fallback (Power Search URL on `fuel_economy`) with documented `notes`. Phase 1 followed the published convention.
- **Sole-trim atomic rule applied perfectly:** all 12 models have `is_base_trim: true` + `delta_from_base: null` on their single trim. No trim_family singleton-image gaps found.
- **F80 special-case handling** documented in Phase 1 (HEV not PHEV, all ADAS booleans false, infotainment/CarPlay/sound_system null, 18-month resale-restriction holding period in notes) is internally consistent and not flagged.
- **Convertible/Spider variants are split as separate models** per body-style rule (Roma Spider, 296 GTS vs 296 GTB, 296 Speciale A vs 296 Speciale, 12Cilindri Spider, 849 Testarossa Spider) — the same pattern Aston Martin / Lexus could benefit from for their LC 500 Convertible / Vantage Roadster cases. Ferrari does this consistently.
- **Forbidden-source scan returned zero hits.** Both `sources` maps and `professional_reviews.links` are clean.
- **Sample coverage:** with only 12 trims (all sole-trim), the 3-trim source-verification sample covers 25% of the brand. EPA spot-checks for 296 GTB and 296 GTS confirmed both PHEV trims; Amalfi is pre-EPA so was verified against the Ferrari corporate article cited in `sources.powertrain`.
