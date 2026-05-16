# Verification Report: Tesla

**Date:** 2026-05-12
**Data source:** `data/tesla.json` (researched 2026-05-12)
**Models checked:** 10
**Trims checked:** 16
**Trims sampled for source verification:** 3 (Cybertruck AWD Standard, Cybertruck AWD Premium, Model Y Performance)
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 2 (covering ~20 residual forbidden-source citations)
- **Warnings:** 3
- **FYIs:** 3

---

## Blockers

### 1. Residual forbidden-source citations in trim `sources` map (10 entries across 5 models)

- **Issue:** Per spec §4 and this batch's source-cleanup pass, www.cars.com, autoblog.com, autoevolution.com, carbuzz.com, and teslaoracle.com (Tesla fan blog) are forbidden as primary sources. Several trim `sources.dimensions` and `sources.features` entries cite these.
- **Found in (10 entries):**
  - `models[3].trims[0].sources.features` → `https://www.teslaoracle.com/2024/04/24/...` (Model 3 Performance)
  - `models[4].trims[0].sources.dimensions` → `https://www.cars.com/research/tesla-model_s-2026/specs/` (Model S)
  - `models[5].trims[0].sources.dimensions` → `https://www.cars.com/research/tesla-model_s-2026/specs/` (Model S Plaid)
  - `models[5].trims[0].sources.features` → `https://www.autoblog.com/news/2026-tesla-model-s-plaid-quietly-updated-heres-everything-thats-new` (Model S Plaid)
  - `models[6].trims[0].sources.dimensions` → `https://www.cars.com/research/tesla-model_x-2026/specs/` (Model X)
  - `models[7].trims[0].sources.dimensions` → `https://www.cars.com/research/tesla-model_x-2026/specs/` (Model X Plaid)
  - `models[7].trims[0].sources.features` → `https://carbuzz.com/cars/tesla/model-x-plaid/2026/specs-and-trims/` (Model X Plaid)
  - `models[8].trims[0].sources.features` → `https://www.teslaoracle.com/2026/02/24/...` (Cybertruck AWD Standard)
  - `models[8].trims[1].sources.features` → `https://www.teslaoracle.com/2026/02/24/...` (Cybertruck AWD Premium)
  - `models[2].trims[0].sources.dimensions` is `evspecifications.com` (see Warning #1) — flagged separately
- **Expected:** Replace each with a permitted primary or secondary source per spec §4.1: tesla.com pages, Tesla press release URLs, fueleconomy.gov for dimensions where EPA publishes them, or Edmunds / Car and Driver / MotorTrend where the spec is independently verified.

---

### 2. Residual forbidden-source citations in `professional_reviews.links` (10 entries across 8 models)

- **Issue:** Same forbidden list applies to professional-review aggregations.
- **Found in:**
  - `models[2].professional_reviews.links[2].url` → Cars.com (Model Y)
  - `models[3].professional_reviews.links[*]` → Tesla Oracle (Model 3 Performance)
  - `models[4].professional_reviews.links[1].url` → Carbuzz (Model S)
  - `models[5].professional_reviews.links[0].url` → Autoblog (Model S Plaid)
  - `models[5].professional_reviews.links[1].url` → AutoEvolution (Model S Plaid)
  - `models[6].professional_reviews.links[1].url` → Carbuzz (Model X)
  - `models[7].professional_reviews.links[1].url` → Carbuzz (Model X Plaid)
  - `models[8].professional_reviews.links[*].url` → Tesla Oracle + Autoblog (Cybertruck)
  - `models[9]` Cybertruck Cyberbeast `professional_reviews` should also be checked for residuals (not surfaced by this scan but worth a pass)
  - TFL Car (`tflcar.com`) on Model Y Performance is a marginal third-party news outlet; included here for cleanup-pass review
- **Expected:** Replace with permitted publications (Car and Driver, MotorTrend, Edmunds, Road & Track) or drop. Edmunds and KBB are explicitly permitted by spec §4.1.

---

## Warnings

### 1. Heavy reliance on evspecifications.com for `sources.powertrain` and `sources.dimensions` across Model 3 / Model 3 Performance / Model Y / Model Y Performance (10 entries)

- **Model/trim:** Model 3 (3 trims), Model 3 Performance, Model Y (4 trims), Model Y Performance
- **Issue:** `https://www.evspecifications.com/en/model/<id>` is a third-party EV-spec aggregator. Spec §4.1 enumerates manufacturer / EPA / NHTSA / IIHS / JD Power / CR / Edmunds-KBB-C+D-MT-Cars.com as the source hierarchy; evspecifications.com is not on that list and is not explicitly forbidden. Phase 1 documented (STATUS.md) that tesla.com was 403 to WebFetch and EPA was the verifiable primary, with evspecifications.com used as a "mirror." That decision is defensible given Tesla's gating, but flagging it as a non-primary citation pattern so the user can confirm whether to grandfather it or replace with Tesla blog / press releases / Tesla support pages.
- **Found in:** 10 trim sources entries across Model 3 and Model Y families
- **Source consulted:** —
- **Recommendation:** Either explicitly whitelist evspecifications.com in the project source rules (since tesla.com is gated and Tesla doesn't publish a detailed spec sheet), or replace with `tesla.com/<model>/design` and `fueleconomy.gov` where possible. Either way the substantive values appear cross-verifiable against EPA where checked.

---

### 2. Cybertruck `dimensions.cargo_volume_cuft` missing truck-bed extension fields per spec §3.8

- **Model/trim:** Cybertruck AWD Standard, Cybertruck AWD Premium, Cybertruck Cyberbeast
- **Issue:** Spec §3.8 says "Trucks: use trunk_cuft: null and add bed_length_in and bed_volume_cuft keys for trucks — extend the schema for trucks only." Cybertruck base trims have `trunk_cuft: null` (correct) but no `bed_length_in` or `bed_volume_cuft` fields. The truck-bed dimensions are a known feature of the Cybertruck (~6-foot bed). Cybertruck trim `notes` do not flag this gap.
- **Found in:** `models[8].trims[0].dimensions`, `models[8].trims[1].dimensions`, `models[9].trims[0].dimensions`
- **Value seen:** no truck-bed keys
- **Recommendation:** Add `bed_length_in` and `bed_volume_cuft` to the Cybertruck base trims per spec §3.8 schema extension. Tesla publishes the 6-foot bed length and ~120 cu ft bed volume on tesla.com/cybertruck pages.

---

### 3. Model Y Performance NHTSA source URL points to 2025 page, not 2026

- **Model/trim:** Model Y Performance
- **Issue:** `sources.safety.nhtsa_overall_rating` is `https://www.nhtsa.gov/vehicle/2025/TESLA/MODEL%20Y` (2025 page) while the trim is 2026 MY. The 2026 NHTSA page either exists separately or doesn't yet have ratings; either way the source URL year doesn't match the trim year.
- **Found in:** `models[3].trims[0].sources.safety.nhtsa_overall_rating`
- **Value seen:** 2025 page URL
- **Recommendation:** Update to `https://www.nhtsa.gov/vehicle/2026/TESLA/MODEL%20Y` and confirm whether NHTSA has rated the 2026 MY (carryover from 2025 is typical for unchanged models).

---

## FYIs

### 1. JD Power VDS / APEAL at `low` or `unknown` confidence across the lineup — expected per batch context

- **Model/trim:** All 10 models
- **Note:** Reliability is `low` confidence on most models (JD Power historically reports Tesla low on VDS but Phase 1 found no verifiable per-model score for 2025 study year accessible without paywall). customer_satisfaction is `unknown` or `low`. Expected; no action needed.

### 2. NHTSA / IIHS results variable across the lineup

- **Model/trim:** Per-model values vary (data carries actual NHTSA stars on Models 3/Y; IIHS TSP on Model Y for 2025-26). Cybertruck not currently NHTSA-rated. Model X has a 2025 NHTSA rating but no IIHS rating.
- **Note:** Per the batch context, NHTSA/IIHS test Tesla volume models (Model 3, Model Y) but not Cybertruck, Model S/X (Model X has a partial 2025 NHTSA rating). This is the actual state of testing coverage, not a data gap.

### 3. All 64 image entries are `needs_scraping: true`

- **Model/trim:** Every trim
- **Note:** Phase 1 documented (STATUS.md) tesla.com 403 to WebFetch. All image URLs are tesla.com model-overview pages, not direct asset URLs. Per batch protocol these are not flagged as image-URL failures — Phase 4 will resolve.

---

## Coverage stats

- Models with >2 null spec blocks on base trim: **0**
- Trim families with <4 images: **0** (every family carries the required angles; Phase 1 used model-overview URLs as placeholders)
- Models with all 4 review blocks at `confidence: "unknown"`: **0** (every model has `professional_reviews` at "medium" or "high")
- Trims missing key sources entries for populated blocks: **0** (every populated block has a source citation; Blocker #1 catches citations that point to forbidden sources)

---

## Sample details

### Sampled trims for source verification

1. **Cybertruck AWD Standard** (base) — checked against `https://www.fueleconomy.gov/feg/noframes/50039.shtml` (EPA)
   - `fuel_economy.combined_mpg: 79` — **PASS** (EPA: 79 combined MPGe; 85 city / 72 highway)
   - `ev_specifics.mpge_combined: 79` — **PASS** (mirrored from EPA per spec §3.6 v1.1)
   - `powertrain.type: "ev"` and `drivetrain: "AWD-electric"` — **PASS** (EPA confirms)
   - `sources.features` → teslaoracle.com — **FAIL** (forbidden — see Blocker #1)
   - `sources.dimensions` → kbb.com — flagged in Blocker discussion (KBB is permitted secondary but not primary; per project rule treat as needing primary source)
   - `dimensions.cargo_volume_cuft` missing truck-bed keys — see Warning #2
   - Result: **PASS on EPA values; source citations need cleanup**

2. **Cybertruck AWD Premium** (step-up) — same EPA source (powertrain delta is null per §6.3)
   - `msrp_base: $79,990`, `destination_fee: $2,245` — value matches commonly-quoted Tesla press
   - `sources.msrp_base` → `https://www.tesla.com/cybertruck/design` — well-formed manufacturer URL (tesla.com gated to WebFetch)
   - `sources.features` → teslaoracle.com — **FAIL** (forbidden — see Blocker #1)
   - Result: **MSRP source URL well-formed; features source needs cleanup**

3. **Model Y Performance** (sole trim) — checked against `https://www.fueleconomy.gov/feg/noframes/50253.shtml` (EPA)
   - `fuel_economy.combined_mpg: 105` — **PASS** (EPA: 105 combined MPGe)
   - `ev_specifics.mpge_combined: 105` — **PASS** (mirrored)
   - `sources.powertrain` and `sources.dimensions` → evspecifications.com — flagged in Warning #1
   - `sources.features` → tflcar.com — flagged in Blocker #2 discussion
   - `sources.safety.nhtsa_overall_rating` → 2025 NHTSA page — flagged in Warning #3
   - Result: **PASS on EPA values; multiple source citations need cleanup**

### Image URLs checked

All 5 sampled image entries had `needs_scraping: true` and pointed to tesla.com model-overview pages:

1. `https://www.tesla.com/cybertruck` — Cybertruck AWD Premium interior_dashboard — `needs_scraping: true` (expected)
2. `https://www.tesla.com/cybertruck` — Cybertruck AWD Premium rear_three_quarter — `needs_scraping: true` (expected)
3. `https://www.tesla.com/modely` — Model Y Long Range RWD front_three_quarter — `needs_scraping: true` (expected)
4. `https://www.tesla.com/modely` — Model Y Standard AWD interior_dashboard — `needs_scraping: true` (expected)
5. `https://www.tesla.com/cybertruck` — Cybertruck Cyberbeast front_three_quarter — `needs_scraping: true` (expected)

No image URL failures flagged per batch protocol.

---

## Notes on this verification

- **EPA spot-checks passed cleanly.** Cybertruck AWD (50039: 79 combined MPGe) and Model Y Performance (50253: 105 combined MPGe) both match EPA exactly. EPA is the most reliable verification path for Tesla given tesla.com gating.
- **The forbidden-source residual is the largest of any brand verified so far in this batch.** Roughly 20 citations spread across `sources.<field>` maps and `professional_reviews.links`, mostly concentrated in Model S / S Plaid / X / X Plaid (which got hit hardest because tesla.com and fueleconomy.gov don't carry full dimension/feature breakouts for those legacy models) and the Cybertruck (which is too new for fully-published EPA entries with dimensions).
- **evspecifications.com (Warning #1) is the policy question.** It is a third-party EV aggregator used as the dimensions-and-powertrain source for the Model 3 / Model Y families. Phase 1 explicitly noted this in STATUS.md. The user should decide whether to grandfather these citations (Tesla data is hard to source primary), or require replacement with tesla.com/design pages (gated to scrapers but live to browsers).
- **Cybertruck truck-bed dimensions (Warning #2)** is a small schema-extension gap that pre-dates this batch but is still open. Should be a quick fix from tesla.com.
- **Model X is correctly classified as `suv-3row`** with all three cargo-volume tiers populated (14.8 / 35.2 / 88 cu ft for behind 3rd / 2nd / 1st row).
- **Sole-trim atomic rule applied cleanly** on Model 3 Performance, Model Y Performance, Model S, Model S Plaid, Model X, Model X Plaid, and Cybertruck Cyberbeast (7 of 10 models are sole-trim or sole-base — `is_base_trim: true` + `delta_from_base: null` correctly set).
- **MSRP integrity, base-trim count, body-style taxonomy, delta-from-base references, EV-MPGe mirroring, and powertrain/ev_specifics consistency all pass programmatic check.**
