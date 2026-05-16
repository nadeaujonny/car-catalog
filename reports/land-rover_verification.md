# Verification Report: Land Rover

**Date:** 2026-05-13
**Data source:** `data/land-rover.json` (researched 2026-05-13)
**Models checked:** 11
**Trims checked:** 36
**Trims sampled for source verification:** 3 (Defender 110 / V8; Discovery / S; Range Rover Sport / SE)
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 2
- **Warnings:** 2
- **FYIs:** 3

---

## Blockers

### 1. Fifteen singleton trim_families marked `is_base_trim: false` (§6.2 / §7 violation)

- **Models/trims (15 total):**
  - Defender 110: Trophy Edition (`defender-110/trophy-edition` family), X (`defender-110/x` family)
  - Defender 130: Outbound (`defender-130/outbound`), X (`defender-130/x`)
  - Defender Octa: Octa Black (`defender-octa/octa-black`)
  - Discovery: Dynamic SE (`discovery/dynamic-se`), Tempest Edition (`discovery/tempest-edition`)
  - Range Rover: SV Black (`range-rover/sv-black`)
  - Range Rover Sport: Twenty Edition (`range-rover-sport/twenty-edition`), Autobiography (`range-rover-sport/autobiography`)
  - Range Rover Sport SV: SV Black (`range-rover-sport-sv/sv-black`), SV Carbon (`range-rover-sport-sv/sv-carbon`)
  - Range Rover Velar: Belgravia Edition (`range-rover-velar/belgravia-edition`), Belgravia Edition Satin (`range-rover-velar/belgravia-edition-satin`)
  - Range Rover Evoque: Hoxton Edition (`range-rover-evoque/hoxton-edition`)
- **Issue:** Per spec §6.2 (sole-trim case) and §7, "if a `trim_family` contains exactly one trim, that trim is the family's base trim, has `is_base_trim: true`." All 15 trims are singletons within their declared family but marked `is_base_trim: false` with `delta_from_base` pointing to a trim in a different family. STATUS notes claim atomic-rule was applied to "Range Rover SV, SV Black, Autobiography" and the other singleton-family Editions, but the `is_base_trim: true` flip wasn't persisted in the data.
- **Found in:** 15 occurrences across `models[*].trims[*]`
- **Expected:** Two fix options (same pattern flagged on Subaru/Volvo/Hyundai/Nissan):
  - **Option A (consolidate):** Merge each into its model's primary trim_family. For example, `defender-110/trophy-edition` → `defender-110/x-dynamic-se` family (or whichever shares the trim's main image set). Step-ups share images via family per spec §7.
  - **Option B (atomic-rule flip):** Set `is_base_trim: true` and `delta_from_base: null` on each, moving the changes prose into trim `notes`.
  Note that 4 sole-trim atomic rule cases ARE correctly set up in this brand: Defender 90 V8 (sole trim of model), Discovery Sport Landmark Edition (sole trim), Range Rover Sport SV (base of separate model), plus several multi-powertrain bases (Range Rover SE/Autobiography/SV with each as is_base_trim: true) — so the pattern is fixable.

---

### 2. Range Rover msrp_range.high mismatch ($260,900 vs computed $238,900)

- **Model/trim:** Range Rover (model-level)
- **Issue:** `msrp_range.high` is `260900` but the highest `msrp_base` across Range Rover trims (SV Black at $238,900) is `238900`. Off by $22,000. The $260,900 figure does not match any trim — likely a stale value from a high-water-mark spec or an SV Long-Wheelbase variant that wasn't included in the model's trims list.
- **Found in:** `models[6].msrp_range.high` (Range Rover)
- **Value seen:** `260900` — **Expected:** `238900` (or update trims list if SV LWB is meant to be included)

---

## Warnings

### 1. Range Rover Sport Battersea Edition base trim missing `sources.dimensions`

- **Model/trim:** Range Rover Sport / Battersea Edition (PHEV)
- **Issue:** Base trim has populated `dimensions` block but no `sources.dimensions` URL in its sources map.
- **Found in:** `models[7].trims[5].sources` (Range Rover Sport / battersea-edition)
- **Recommendation:** Add manufacturer dimension URL citation per spec §4.4.

### 2. NHTSA and IIHS have not crash-tested any 2026 Land Rover model

- **Models/trims:** All 11 models have `safety.nhtsa_overall_rating: null` and `safety.iihs_top_safety_pick: null`.
- **Issue:** Expected per batch context — "Cadillac performance variants, Ford specialty performance, Chevrolet specialty, Land Rover Range Rover SV, and similar low-volume specialty models" all carry null safety per the system prompt. Land Rover as a brand falls under low-volume luxury per spec convention. STATUS notes confirm "NHTSA has not crash-tested any 2026 Land Rover model; IIHS has not crash-tested any 2026 Land Rover model".
- **Recommendation:** No action needed; expected pattern for this brand class.

---

## FYIs

### 1. All 144 image URLs are `needs_scraping: true` (landroverusa.com / rangerover.com consumer-page URLs)

- **Model/trim:** Every trim — 100% of image entries point to landroverusa.com or rangerover.com showroom/product pages.
- **Note:** Phase 1 research noted landroverusa.com and rangerover.com pages do not expose direct asset URLs to WebFetch. All 144 image entries are page-URL placeholders. Per batch protocol these are NOT image-URL failures — Phase 4 will resolve them. media.jaguarlandrover.com press kit not used as primary source for any spec value per STATUS notes.

### 2. JD Power VDS / Consumer Reports numeric scores not published for 2026 MY across the brand

- **Model/trim:** All 11 models — `reliability.confidence: "low"`, `customer_satisfaction.confidence: "unknown"`.
- **Note:** Expected per batch context — "all 11 models lack 2026 JD Power VDS / APEAL and CR predicted-reliability numeric scores — confidence: low across the board per brand-history low-confidence pattern" per STATUS.

### 3. Defender Octa, Range Rover Sport SV, Range Rover SV variants are correctly split as separate models per perf-variant rule

- **Models/trims:** Defender Octa (separate from Defender 90/110/130 per dedicated /defender/defender-octa/ showroom page), Range Rover Sport SV (separate from Range Rover Sport per /sv.html destination page).
- **Note:** Range Rover SV / SV Black retained as TRIMS within Range Rover model (landroverusa.com models-and-specifications page lists SV alongside SE/Autobiography). Structurally all-correct per STATUS notes.

---

## Coverage stats

- Models with >2 null spec blocks on base trim: **0**
- Models with <4 images on a trim family: **0** (every family has at least 4 image entries, all `needs_scraping: true`)
- Models with all 4 review blocks at unknown confidence: **0**
- Trims missing key sources entries for *populated* blocks: **1** (Warning #1)
- Singleton-family-base-rule violations: **15** (Blocker #1)
- Forbidden source hits in trim `sources` maps or review-block sources: **0**
- MSRP range mismatches: **1** (Blocker #2)

---

## Sample details

### Sampled trims for source verification

1. **Defender 110 / V8** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49589` (EPA)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 14/18/16 — **PASS** (EPA matches exactly)
   - `fuel_economy.fuel_type_required: "premium"` — **PASS** (EPA: "Premium Gasoline Recommended")
   - `powertrain.engine_displacement_l: 5.0 / engine_config: "V8" / aspiration: "supercharged"` — **PASS**
   - `msrp_base: $118,300` cited from landroverusa.com — primary manufacturer source
   - Result: **PASS on every EPA-verifiable field**

2. **Discovery / S** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=50164` (EPA — cited but not re-fetched this pass)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 19/24/21 — **PASS by Phase 1 record**
   - `powertrain.horsepower_hp: 296 / engine_displacement_l: 2.0 / aspiration: "turbocharged"` — base P300 4-cyl
   - Result: **PASS by structural sampling**

3. **Range Rover Sport / SE** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=50165` (EPA)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 20/25/22 — **PASS** (EPA: P360 MHEV at 20/25/22)
   - `fuel_economy.fuel_type_required: "premium"` — **PASS** (EPA: "Premium Gasoline Recommended")
   - `powertrain.horsepower_hp: 355 / engine_displacement_l: 3.0 / engine_config: "I6" / aspiration: "twin_turbocharged"` — **PASS** (P360 mild-hybrid 3.0L I6 with mild-hybrid + twin scroll turbos)
   - `msrp_base: $83,700` cited from primary Land Rover source
   - Result: **PASS on every EPA-verifiable field**

### Image URLs checked

All 5 sampled image entries had `needs_scraping: true`.

1. `https://www.landroverusa.com/defender/defender-90/index.html` — Defender 90 / V8 / front_three_quarter — `needs_scraping: true` (expected)
2. `https://www.landroverusa.com/defender/defender-octa/index.html` — Defender Octa / Octa / interior_dashboard — `needs_scraping: true` (expected)
3. `https://www.landroverusa.com/discovery/index.html` — Discovery / S / front_three_quarter — `needs_scraping: true` (expected)
4. `https://www.rangerover.com/en-us/range-rover/index.html` — Range Rover / SE / side_profile — `needs_scraping: true` (expected)
5. `https://www.rangerover.com/en-us/range-rover-sport/sv.html` — Range Rover Sport SV / SV / rear_three_quarter — `needs_scraping: true` (expected)

No image URL failures flagged per batch protocol.

---

## Notes on this verification

- **EPA spot-checks were perfectly clean.** Defender 110 V8 (49589) and Range Rover Sport SE (50165) returned values matching data exactly on MPG and fuel type.
- **No forbidden sources detected.** Programmatic JSON sweep flagged 0 hits for motor1, carbuzz, autoblog, autoevolution, teslaoracle, iseecars, hiconsumption, topspeed, hotcars, wikipedia, www.cars.com. No dealer-domain hits.
- **The singleton-family-base-false pattern (Blocker #1) is the third-worst this batch** at 15 trims (Nissan 27 > Subaru 12 > Land Rover 15 > Hyundai 6 > Volvo 5 > VW 1). These are mostly "Edition" trims (Trophy Edition, Twenty Edition, Belgravia Edition, Hoxton Edition, Tempest Edition) plus the X / Outbound / Dynamic SE / SV Black / SV Carbon performance/luxury variants. The atomic-rule fix is mechanical.
- **The Range Rover msrp_range.high mismatch (Blocker #2)** is $22,000 off — large enough to suggest a missing trim (possibly the SV LWB Long Wheelbase configuration mentioned in STATUS) was meant to be in the trims list but is currently absent. Either add the trim or lower `msrp_range.high` to $238,900.
- **All 144 image URLs need scraping** — landroverusa.com and rangerover.com both don't expose CDN asset URLs to WebFetch. Phase 4 will resolve.
- **Multi-powertrain base setup verified correctly** on Defender 110 (P300 / P400 MHEV / P525 V8), Defender 130 (P300 / P400 MHEV / P500 V8), Discovery (P300 / P360 MHEV), Range Rover Velar (P250 / P400 MHEV), Range Rover (P400 MHEV / P550e PHEV / P615 SV), Range Rover Sport (P360 MHEV / P400 MHEV / P550e PHEV) — each correctly has multiple `is_base_trim: true` trims, one per powertrain line.
- **Cross-trim sanity check passed** — no MSRP 50%+ outliers (Range Rover SE $113k vs SV $219k is ~94% step but covers two distinct powertrain lines per multi-powertrain rule, within tolerance), no horsepower or dimension outliers within any model.
- **Body-style/cargo-volume consistency check passed** — all 11 models are SUVs and correctly populate `behind_2nd_row`/`behind_1st_row`.
- **PHEV charge-sustaining MPG correctly placed** on Range Rover Autobiography P550e PHEV and Range Rover Sport Battersea Edition per spec §3.6.
- **Recommendation: Address 2 blockers before relying on this catalog for publication.** Blocker #1 (15-trim singleton-family) is mechanical; Blocker #2 (Range Rover msrp_range.high) is either a 1-line edit or requires adding the SV LWB trim. The 2 warnings can be batched (single missing source URL + environmental NHTSA/IIHS expectation).
