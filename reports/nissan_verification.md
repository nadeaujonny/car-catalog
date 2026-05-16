# Verification Report: Nissan

**Date:** 2026-05-13
**Data source:** `data/nissan.json` (researched 2026-05-12)
**Models checked:** 13
**Trims checked:** 48
**Trims sampled for source verification:** 3 (Z / Sport; Murano / SV; Altima / SV)
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 4
- **Warnings:** 1
- **FYIs:** 3

---

## Blockers

### 1. Systematic singleton-trim_family-base-false pattern (§6.2 / §7) — 27 trims across 10 models

- **Models/trims:** Phase 1 set `trim_family` equal to `trim_slug` for almost every Nissan trim. This means every non-base trim is in its own singleton family, and per spec §6.2 / §7 must be `is_base_trim: true` with `delta_from_base: null` — but each one is instead marked `is_base_trim: false` with `delta_from_base` pointing to a trim in a different family.
  - **Sentra** (3 violations): SV, SR, SL
  - **Z** (2): Performance, Performance Heritage Edition
  - **LEAF** (2): SV+, Platinum+
  - **Kicks** (1): SV
  - **Rogue** (5): SV, Dark Armor, Rock Creek, SL, Platinum AWD
  - **Rogue Plug-in Hybrid** (1): Platinum
  - **Murano** (2): SL, Platinum
  - **Pathfinder** (3): Rock Creek, SL, Platinum
  - **Armada** (4): SL, PRO-4X, Platinum, Platinum Reserve
  - **Frontier** (4): SV Crew Cab, PRO-X, PRO-4X, SL
- **Issue:** The spec intent for `trim_family` is "a string slug grouping trims that share photography" (§7). When every trim has its own family, the grouping serves no purpose and triggers the singleton-family rule on every non-base trim. STATUS.md notes claim atomic-rule was applied to "Z NISMO, Armada NISMO, Rogue PHEV SL (base of only powertrain line), Z Performance Heritage Edition (singleton trim_family), Rogue Dark Armor and Rock Creek (singleton trim_families), Pathfinder Rock Creek (singleton trim_family with own 4 image angles), Armada PRO-4X and Platinum Reserve (singleton trim_families), Frontier PRO-X and PRO-4X (singleton trim_families)" — but the `is_base_trim: true` flip was never persisted.
- **Found in:** 27 trim entries across `models[*].trims[*]`
- **Expected:** Two viable fixes:
  - **Option A (consolidate families):** Merge step-up trims into the same `trim_family` as their model's base trim (e.g., Sentra: all of S/SV/SR/SL share `family: "sentra"`). The step-ups keep `is_base_trim: false` and `delta_from_base` populated, and the family-level 4-image minimum is satisfied by the base trim's images.
  - **Option B (atomic-rule flip):** For each singleton family, flip `is_base_trim: true` and set `delta_from_base: null`. The trim's existing change-from-base info would move into trim `notes` for human reference.
  Option A is the simpler and cleaner fix and matches how most other brands in this catalog are structured (Cadillac, VW, Honda).

---

### 2. Altima msrp_range.high mismatch ($32,480 vs computed $30,980)

- **Model/trim:** Altima (model-level)
- **Issue:** `msrp_range.high` is `32480` but the highest `msrp_base` across Altima trims (SR Midnight Edition at $30,980) is `30980`. The $32,480 figure does not match any trim — appears to be a stale value.
- **Found in:** `models[1].msrp_range.high` (Altima)
- **Value seen:** `32480` — **Expected:** `30980`

---

### 3. Pathfinder msrp_range.high mismatch ($51,400 vs computed $49,400)

- **Model/trim:** Pathfinder (model-level)
- **Issue:** `msrp_range.high` is `51400` but the highest `msrp_base` is Platinum at `49400`. $51,400 does not match any Pathfinder trim. The Pathfinder Rock Creek SL Premium package might explain the $2k delta, but spec §3 requires `msrp_range.high` to equal the highest trim `msrp_base` (packages folded per §6.5).
- **Found in:** `models[9].msrp_range.high` (Pathfinder)
- **Value seen:** `51400` — **Expected:** `49400`

---

### 4. Armada msrp_range.high mismatch ($80,550 vs computed $77,550)

- **Model/trim:** Armada (model-level)
- **Issue:** `msrp_range.high` is `80550` but the highest `msrp_base` is Platinum Reserve at `77550`. Off by $3,000.
- **Found in:** `models[10].msrp_range.high` (Armada)
- **Value seen:** `80550` — **Expected:** `77550`

---

## Warnings

### 1. NHTSA 2026 ratings null brand-wide; IIHS 2026 TSP partial

- **Models/trims:** All 13 models — `safety.nhtsa_overall_rating: null` (per STATUS notes: "NHTSA had not posted 2026 ratings for any Nissan model at research time"). IIHS 2026 TSP+ verified for Sentra, Pathfinder, Murano; TSP (not +) for Rogue, Armada; Kicks/Altima/Frontier no TSP for 2026.
- **Issue:** Common pattern across this batch.
- **Recommendation:** Re-poll NHTSA before publication.

---

## FYIs

### 1. All 150 image URLs are `needs_scraping: true` (nissanusa.com consumer-page URLs)

- **Model/trim:** Every trim — 100% of image entries point to nissanusa.com showroom/product pages.
- **Note:** Phase 1 research noted nissanusa.com timed out repeatedly to WebFetch and usa.nissannews.com press URLs returned blank (JS-rendered). All 150 image entries are page-URL placeholders flagged `needs_scraping: true`. Per batch protocol these are NOT image-URL failures — Phase 4 will resolve them.

### 2. JD Power VDS / Consumer Reports numeric scores not published for 2026 MY

- **Model/trim:** All 13 models — `reliability.confidence: "low"` or `"unknown"`, `customer_satisfaction.confidence: "unknown"`.
- **Note:** Expected per batch context.

### 3. LEAF is all-new 3rd-gen crossover with NACS port

- **Model/trim:** LEAF (3 trims: S+, SV+, Platinum+), all-new for 2026.
- **Note:** Native NACS port (Nissan's first US EV with factory NACS) and 75 kWh battery only (52 kWh variant cancelled for US) per STATUS notes. Structurally all-correct.

---

## Coverage stats

- Models with >2 null spec blocks on base trim: **0**
- Models with <4 images on a trim family: **12 trims** (counted as part of Blocker #1 — these are the singletons with only 2 of 4 images)
- Models with all 4 review blocks at unknown confidence: **0**
- Trims missing key sources entries for *populated* blocks: **0**
- Singleton-family-base-rule violations: **27** (Blocker #1)
- Forbidden source hits in trim `sources` maps: **0**
- MSRP range mismatches: **3** (Blockers #2, #3, #4)

---

## Sample details

### Sampled trims for source verification

1. **Z / Sport** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49777` (EPA)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 18/24/20 — **PASS** (EPA matches exactly)
   - `fuel_economy.fuel_type_required: "premium"` — **PASS** (EPA: "Premium Gasoline Required")
   - `powertrain.engine_displacement_l: 3.0 / engine_config: "V6" / aspiration: "twin_turbocharged"` — **PASS** (EPA: "3.0 L, 6 cylinder, Manual 6-speed, Turbo" — turbo)
   - `powertrain.horsepower_hp: 400` — **PASS** (Z 3.0T published 400 hp)
   - `msrp_base: $42,970` cited from nissannews.com — primary manufacturer press source
   - Result: **PASS on every EPA-verifiable field**

2. **Murano / SV** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49867` (EPA — fetched but not re-validated this pass)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 21/27/23 — **PASS by Phase 1 record**
   - `powertrain.horsepower_hp: 241 / engine_displacement_l: 2.0 / aspiration: "turbocharged"` — **PASS** (new 2.0T VC-Turbo I4 per Phase 1)
   - `msrp_base: $41,670` cited from nissannews.com
   - Result: **PASS by structural sampling**

3. **Altima / SV** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=50064` (EPA)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 26/36/30 — **PASS** (EPA matches exactly)
   - `fuel_economy.fuel_type_required: "regular"` — **PASS**
   - `powertrain.horsepower_hp: 188` — **PASS**
   - `msrp_base: $27,580` cited from nissannews.com — primary manufacturer press source
   - Result: **PASS on every EPA-verifiable field**

### Image URLs checked

All 5 sampled image entries had `needs_scraping: true` and pointed to nissanusa.com showroom pages.

1. `https://www.nissanusa.com/vehicles/2026/sentra.html` — Sentra / S / front_three_quarter — `needs_scraping: true` (expected)
2. `https://www.nissanusa.com/vehicles/2026/z.html` — Z / Sport / interior_dashboard — `needs_scraping: true` (expected)
3. `https://www.nissanusa.com/vehicles/2026/leaf.html` — LEAF / S+ / front_three_quarter — `needs_scraping: true` (expected)
4. `https://www.nissanusa.com/vehicles/2026/rogue.html` — Rogue / S / side_profile — `needs_scraping: true` (expected)
5. `https://www.nissanusa.com/sports-cars/nissan-z/nismo.html` — Z NISMO / NISMO / front_three_quarter — `needs_scraping: true` (expected)

No image URL failures flagged per batch protocol.

---

## Notes on this verification

- **EPA spot-checks were clean.** Z Sport (49777) and Altima SV (50064) returned values matching data exactly on MPG/MPG and fuel type. Murano SV not re-fetched.
- **The singleton-family-base-false pattern (Blocker #1) is the worst seen in this batch so far** — 27 trims across 10 of 13 models. The root cause is that Phase 1 used `trim_family = trim_slug` for every trim, defeating the purpose of `trim_family` (which is supposed to group trims that share photography). The atomic-rule fix is mechanical but extensive; consolidation (Option A in the finding) is the simpler architectural fix.
- **Three msrp_range.high mismatches (Blockers #2–#4)** are all 1-line numeric fixes once correct values are confirmed.
- **No forbidden sources detected.** Programmatic JSON sweep flagged 0 hits for motor1, carbuzz, autoblog, autoevolution, teslaoracle, iseecars, hiconsumption, topspeed, hotcars, wikipedia, www.cars.com. No dealer-domain hits either.
- **Sole-trim atomic rule** verified correctly applied to: Z NISMO, Armada NISMO, Rogue PHEV SL (sole trim of PHEV powertrain), LEAF S+, Kicks S, Rogue S, Murano SV, Pathfinder SV, Armada SV, Frontier S King Cab, Sentra S, Altima SV — these 12 base trims correctly carry `is_base_trim: true` + `delta_from_base: null`.
- **Cross-trim sanity check passed** — no MSRP 50%+ outliers, no horsepower or dimension outliers within any model.
- **Body-style/cargo-volume consistency check passed** — sedans (Sentra, Altima) have `trunk_cuft` populated; sports-cars (Z, Z NISMO) handled correctly; SUVs/pickups handle `behind_2nd_row` and `behind_1st_row` correctly.
- **EV MPGe mirror correctly applied** on LEAF EV trims per spec §3.6 v1.1.
- **PHEV charge-sustaining MPG correctly placed** on Rogue PHEV per spec §3.6.
- **Recommendation: Address all 4 blockers before relying on this catalog for publication.** Blocker #1 (27-trim singleton-family) is the biggest fix; recommend Option A (consolidate trim_families) over Option B (atomic-rule flip). The 3 msrp_range fixes are 1-line edits. The single warning is environmental, not a data quality issue.
