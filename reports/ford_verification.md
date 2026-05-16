# Verification Report: Ford

**Date:** 2026-05-13
**Data source:** `data/ford.json` (researched 2026-05-13)
**Models checked:** 22
**Trims checked:** 74
**Trims sampled for source verification:** 3 (Mustang Dark Horse SC; Escape / Plug-in Hybrid; F-150 Lightning / STX)
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 6 (rolled-up findings — 32 individual cars.com URLs grouped under one, 43 singleton-family violations grouped under one, plus 4 msrp_range mismatches)
- **Warnings:** 4
- **FYIs:** 3

---

## Blockers

### 1. 32 cars.com URLs cited as `sources.dimensions` (forbidden — content-farm tier)

- **Models/trims:** 30 trims across 16 models cite `https://www.cars.com/research/ford-<model>-2026/specs/` for `sources.dimensions`:
  - Mustang (4 trims: EcoBoost Fastback, EcoBoost Convertible, GT Fastback, GT Premium Convertible)
  - Mustang Dark Horse (1 trim)
  - Mustang Mach-E (2 trims: Select, GT)
  - Mustang Mach-E Rally (1 trim)
  - Bronco Sport (2 trims: Big Bend, Badlands)
  - Bronco (2 trims: Base, Badlands)
  - Bronco Raptor (1 trim)
  - Escape (3 trims: Active, ST-Line Select Hybrid, Plug-in Hybrid)
  - Explorer (2 trims: Active, Tremor)
  - Expedition (1 trim: Active)
  - Maverick (3 trims: XL, Lobo, Tremor)
  - Ranger (1 trim: XL)
  - Ranger Raptor (1 trim)
  - F-150 (2 trims: XL, Tremor)
  - F-150 Raptor (1 trim)
  - F-150 Raptor R (1 trim)
  - F-150 Lightning (1 trim: STX)
  - F-250 / F-350 / F-450 Super Duty (1 trim each: XL)
- **Issue:** Per spec §4 and the batch-context system prompt, `www.cars.com` is on the explicit forbidden-source list (content-farm tier). 32 occurrences across the brand makes this the most cars.com citations seen in any single brand this batch.
- **Found in:** `models[*].trims[*].sources.dimensions` — 32 instances
- **Expected:** Replace all 32 with manufacturer dimensions URLs (ford.com / shop.ford.com) once Ford consumer sites are accessible — STATUS notes confirm "ford.com / shop.ford.com / fordracing.com consumer pages timed out repeatedly to WebFetch" during Phase 1, which forced the cars.com fallback. Alternative replacements: EPA size-class data, Car and Driver / MotorTrend / Edmunds dimension data.

---

### 2. Systematic singleton-trim_family-base-false pattern (§6.2 / §7) — 43 trims across 16 models

- **Models/trims:** Phase 1 used `trim_family = trim_slug` for almost every Ford trim, similar to Chevrolet (43 violations) and Nissan (27). Each step-up trim is its own singleton family but marked `is_base_trim: false` with `delta_from_base` pointing to a trim in a different family. Affected models: Mustang, Mustang Mach-E, Bronco Sport, Bronco, Escape, Explorer, Expedition, Maverick, Ranger, F-150, F-150 Lightning, F-250/F-350/F-450 Super Duty (each has multiple step-up singletons).
- **Issue:** Per spec §6.2 (sole-trim case) and §7, "if a `trim_family` contains exactly one trim, that trim is the family's base trim, has `is_base_trim: true`."
- **Found in:** 43 trim entries across `models[*].trims[*]`
- **Expected:** Two fix options (same pattern flagged on Chevrolet/Nissan/Subaru/Volvo/Hyundai/Land Rover this batch):
  - **Option A (consolidate):** Move each step-up into the parent model's primary trim_family.
  - **Option B (atomic-rule flip):** Set `is_base_trim: true` + `delta_from_base: null` on each.
  Many of these singleton families also have only 1 image (vs 4 required at family level) — see Warning #2.

---

### 3. Mustang Dark Horse SC msrp_range.high mismatch ($144,985 vs computed $108,485)

- **Model/trim:** Mustang Dark Horse SC (sole-trim model)
- **Issue:** `msrp_range.high` is `144985` but the model has a single trim at `msrp_base: 108485`. Sole-trim model's range should equal that one trim's MSRP on both ends. Off by $36,500.
- **Found in:** `models[2].msrp_range.high` (Mustang Dark Horse SC)
- **Value seen:** `144985` — **Expected:** `108485`
- **Note:** The $144,985 figure may represent a fully-optioned configuration with Magnum Performance Pack, but per spec §3 packages are folded.

---

### 4. Escape msrp_range.high mismatch ($37,960 vs computed $37,210)

- **Model/trim:** Escape (model-level)
- **Issue:** `msrp_range.high` is `37960` but the highest `msrp_base` is `37210`. Off by $750.
- **Found in:** `models[9].msrp_range.high`

---

### 5. Expedition msrp_range.high mismatch ($87,060 vs computed $84,060)

- **Model/trim:** Expedition (model-level)
- **Issue:** `msrp_range.high` is `87060` but the highest `msrp_base` is `84060`. Off by $3,000.
- **Found in:** `models[11].msrp_range.high`

---

### 6. F-150 Lightning msrp_range.LOW mismatch ($54,780 vs computed $63,345)

- **Model/trim:** F-150 Lightning (model-level)
- **Issue:** `msrp_range.low` is `54780` but the LOWEST `msrp_base` across F-150 Lightning trims (STX at $63,345) is `63345`. `msrp_range.low` should equal the minimum trim msrp_base, but here it's set BELOW the actual minimum by $8,565. May reflect a discontinued Pro trim's MSRP that's still in the range cap.
- **Found in:** `models[18].msrp_range.low` (F-150 Lightning)
- **Value seen:** `54780` — **Expected:** `63345`

---

## Warnings

### 1. 4 base trims missing `sources` entries for populated blocks

- **Models/trims:** F-150 / PowerBoost Hybrid (missing sources.dimensions); F-250 Super Duty / XL (missing sources.fuel_economy); F-350 Super Duty / XL (missing sources.fuel_economy); F-450 Super Duty / XL (missing sources.fuel_economy)
- **Issue:** Spec §4.4 requires source citation per populated spec block. Super Duty trucks may be exempt from EPA per HD-truck rule (>8500 GVWR — STATUS confirms "F-250/F-350/F-450 Super Duty have NO EPA MPG ratings"); if so, the `fuel_economy` block should be null rather than populated.
- **Recommendation:** Either populate the missing sources or set `fuel_economy: null` on HD trims (and `sources.fuel_economy: null`).

### 2. 27 singleton trim_families with only 1 of 4 required images (§7 partial-coverage)

- **Models/trims:** Most Mustang/Bronco/Escape/Explorer/Expedition/Maverick/Ranger/F-150/F-150 Lightning/F-250/F-350/F-450 step-up trims have only 1 image entry (vs 4 required at family level per §7).
- **Issue:** This is the §7 partial-image-coverage instance of the broader singleton-family issue (Blocker #2). Once the singleton families are consolidated (Option A) or have atomic-rule applied (Option B), this resolves automatically.
- **Recommendation:** Address as part of Blocker #2 fix pass.

### 3. NHTSA / IIHS partial coverage; performance variants correctly null

- **Models/trims:** Per STATUS notes: "NHTSA 5-star verified for Mach-E and Lightning carryover from earlier MY; IIHS not awarded TSP/TSP+ to any 2026 Ford model at research time"; performance variants (Mustang GTD, Mach-E Rally, F-150 Raptor variants, Bronco Raptor, Ranger Raptor) correctly carry null per system-prompt expected-pattern.
- **Recommendation:** Re-poll NHTSA/IIHS before publication.

### 4. F-250/F-350/F-450 Super Duty `fuel_economy` populated despite HD-truck EPA exemption

- **Models/trims:** F-250 Super Duty / XL, F-350 Super Duty / XL, F-450 Super Duty / XL
- **Issue:** STATUS notes confirm "F-250/F-350/F-450 Super Duty have NO EPA MPG ratings (HD truck >8500 GVWR exempt per spec)". But the data has populated `fuel_economy` blocks for these trims — verify if values are manufacturer-claimed or null. If they're populated with EPA-not-tested values, that's a spec data-quality issue.
- **Recommendation:** Audit Super Duty fuel_economy values; set to null if not EPA-rated.

---

## FYIs

### 1. All 203 image URLs are `needs_scraping: true` (ford.com URLs)

- **Model/trim:** Every trim — 100% of image entries point to ford.com or fordracing.com showroom pages.
- **Note:** Phase 1 research noted Ford consumer sites timed out repeatedly to WebFetch. All 203 image entries are page-URL placeholders. Per batch protocol these are NOT image-URL failures — Phase 4 will resolve them. STATUS notes confirm "direct ford.com URL citations confirmed via WebSearch result metadata" but CDN asset URLs not extractable.

### 2. JD Power VDS / Consumer Reports numeric scores not published for 2026 MY across the brand

- **Model/trim:** All 22 models — `reliability.confidence: "low"` or `"unknown"`, `customer_satisfaction.confidence: "unknown"`.
- **Note:** Expected per batch context.

### 3. Largest brand in this batch by both model count and trim count

- **Model/trim:** 22 models, 74 trims.
- **Note:** Ford's scope makes the singleton-family violation count (43) particularly painful — about half of its non-base trims. Multi-powertrain rule correctly applied to Escape (ICE/HEV/PHEV), F-150 (ICE/PowerBoost Hybrid), Maverick (HEV/2.0L EcoBoost) per STATUS notes. Sole-trim atomic rule correctly applied to Mustang Dark Horse SC, Mustang GTD, Mustang Mach-E Rally, Bronco Raptor, Ranger Raptor, F-150 Raptor, F-150 Raptor R, F-150 PowerBoost Hybrid (Hybrid line base), Escape PHEV (PHEV line base).

---

## Coverage stats

- Models with >2 null spec blocks on base trim: **0**
- Models with <4 images on a trim family: **27 singleton families with 1 image** (Warning #2)
- Models with all 4 review blocks at unknown confidence: **0**
- Trims missing key sources entries for populated blocks: **4** (Warning #1)
- Singleton-family-base-rule violations: **43** (Blocker #2) — tied with Chevrolet for worst this batch
- Forbidden source hits in trim `sources` maps: **32 cars.com URLs** (Blocker #1) — worst this batch
- MSRP range mismatches: **4** (Blockers #3–#6)

---

## Sample details

### Sampled trims for source verification

1. **Mustang Dark Horse SC** (sole-trim model) — EPA fallback to brand model-browse page
   - `fuel_economy` values all null (EPA hasn't published 2026 entry yet per STATUS)
   - `powertrain.engine_displacement_l: 5.2 / engine_config: "V8" / aspiration: "supercharged" / horsepower_hp: 795` — primary Ford-published numbers
   - `msrp_base: $108,485` cited from primary Ford source
   - Result: **PASS by structural sampling; values intentionally null per spec §4 EPA-unavailable fallback**

2. **Escape / Plug-in Hybrid** (PHEV, base of PHEV powertrain line) — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49763` (EPA)
   - `fuel_economy.combined_mpg: 40` — **PASS** (EPA: "40 MPG combined on gas only")
   - `fuel_economy.city_mpg/highway_mpg`: data 42/38 — EPA page doesn't list separately so unverifiable, but combined matches
   - `ev_specifics.electric_range_mi: 37 / total_range_mi: 520 / mpge_combined: 101` — **PASS** (EPA: 37 mi electric, 520 mi total, 101 MPGe)
   - `powertrain.type: "phev" / transmission: "e-CVT"` — **PASS**
   - `msrp_base: $35,400` cited from primary Ford source
   - Result: **PASS on every EPA-verifiable field; PHEV charge-sustaining MPG and charge-depleting MPGe correctly split per spec §3.6**

3. **F-150 Lightning / STX** (EV, base of trim line) — EPA fallback to brand model-browse page
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 79/65/71 MPGe (mirrored from MPGe per spec §3.6 v1.1)
   - `ev_specifics.electric_range_mi: 240` (STX is Standard Range)
   - `powertrain.type: "ev" / horsepower_hp: 580 / drivetrain: "AWD-electric"` — **PASS**
   - `msrp_base: $63,345` cited from primary Ford source
   - Result: **PASS by structural sampling; EPA fallback per spec §4 with explanatory STATUS notes ("2026 F-150 Lightning EPA listings not yet published")**

### Image URLs checked

All 5 sampled image entries had `needs_scraping: true`.

1. `https://www.ford.com/cars/mustang/` — Mustang / EcoBoost Fastback / front_three_quarter — `needs_scraping: true` (expected)
2. `https://www.ford.com/cars/mustang-dark-horse/` — Mustang Dark Horse / Dark Horse / front_three_quarter — `needs_scraping: true` (expected)
3. `https://www.ford.com/suvs-crossovers/bronco/` — Bronco / Base / interior_dashboard — `needs_scraping: true` (expected)
4. `https://www.ford.com/trucks/f150/` — F-150 / XL / front_three_quarter — `needs_scraping: true` (expected)
5. `https://www.ford.com/trucks/f150-lightning/` — F-150 Lightning / STX / side_profile — `needs_scraping: true` (expected)

No image URL failures flagged per batch protocol.

---

## Notes on this verification

- **EPA spot-check on Escape PHEV was clean** — 40 MPG combined, 37 mi electric, 520 mi total, 101 MPGe all matched EPA exactly. Mustang Dark Horse SC and F-150 Lightning STX correctly use EPA fallback per spec §4 (EPA hasn't published 2026 entries for these new/specialty trims).
- **The cars.com violation count (32) is by far the worst seen in this batch** — by a 10:1 margin over the closest other brand (Cadillac with 1 cars.com URL). Phase 1 fell back to cars.com when ford.com timed out, which is the same pattern other brands hit but Ford applied it systematically across nearly every model's `sources.dimensions`. Fix is mechanical: 32 URL replacements.
- **The singleton-family pattern (Blocker #2) at 43 trims** matches Chevrolet exactly and exceeds Nissan (27). Combined with 27 of those having partial-image-coverage (1 of 4 images, Warning #2), this represents a major Phase 1 architectural choice. Consolidation (Option A) is the simpler fix.
- **Four msrp_range mismatches (Blockers #3–#6)** include one direction-reversal: F-150 Lightning's `msrp_range.low` is BELOW the actual minimum trim MSRP, which is unusual — likely a discontinued Pro trim figure that should have been removed when the trim was dropped. Mustang Dark Horse SC's $36,500 high-side overage is the largest single mismatch in this batch.
- **No dealer-domain hits.** Programmatic regex flagged 0 dealer-named URLs (no `ford-of-*` or `*fordmotors.com` style dealer sites). Top domains are ford.com (271 entries), fueleconomy.gov (61), Car and Driver (18), iihs.org (4), and 32 cars.com.
- **All 203 image URLs need scraping** — ford.com / fordracing.com unreachable. Phase 4 will resolve.
- **HD truck EPA exemption** (F-250/F-350/F-450 Super Duty) is correctly noted in STATUS but the `fuel_economy` blocks on those trims may need to be set to null rather than populated with manufacturer-claimed values (Warning #4).
- **Cross-trim sanity check passed** — no MSRP 50%+ outliers within a model (large gaps between Raptor and Raptor R, or between F-150 base and Lightning Platinum, are intentional perf-variant splits handled per spec §6.4).
- **Body-style/cargo-volume consistency check passed** — sports cars (Mustang variants), SUVs, pickups all populate correct cargo fields per body_style taxonomy. F-150 series correctly extends schema with `bed_length_in` per spec §3.8 truck rule.
- **EV MPGe mirror correctly applied** on Mustang Mach-E, F-150 Lightning per spec §3.6 v1.1.
- **PHEV charge-sustaining MPG correctly placed** on Escape PHEV per spec §3.6.
- **Recommendation: Address all 6 (rolled-up) blockers before publication.** Blocker #1 (32 cars.com URLs) is the biggest single-pass cleanup; Blocker #2 (43-trim singleton-family) is the largest architectural fix; Blockers #3–#6 are 4 numeric edits. The 4 warnings batch into the same pass.
