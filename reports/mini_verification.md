# Verification Report: Mini

**Date:** 2026-05-13
**Data source:** `data/mini.json` (researched 2026-05-12)
**Models checked:** 7
**Trims checked:** 11
**Trims sampled for source verification:** 3 (Cooper Hardtop 2 Door / Cooper S; Cooper Convertible / Cooper S Convertible; Countryman / Countryman SE ALL4)
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 0
- **Warnings:** 0
- **FYIs:** 4

---

## Blockers

None.

---

## Warnings

None.

---

## FYIs

### 1. All 38 image URLs are `needs_scraping: true` (miniusa.com consumer-page URLs)

- **Model/trim:** Every trim across all 7 models — 100% of image entries carry `needs_scraping: true`.
- **Note:** Phase 1 research found miniusa.com consumer pages do not expose direct CDN asset URLs to WebFetch, so every image entry points to its model's product page rather than a JPG/WebP asset. Per batch protocol these are NOT image-URL failures — Phase 4 image-scrape will resolve them. No action needed at verification.

### 2. NHTSA ratings null brand-wide (2026 MY not yet rated)

- **Model/trim:** All 7 models — `safety.nhtsa_overall_rating: null`.
- **Note:** NHTSA has not yet posted 2026 ratings for any Mini model. Cooper variants (2 Door, 4 Door, Convertible, JCW) are sports-car-adjacent low-volume hatch/coupe-style entries; Countryman/JCW Countryman are the volume models. Expected per batch context. IIHS Top Safety Pick carries from 2025 for Countryman and JCW Countryman ALL4 (same generation) — correctly populated.

### 3. JD Power VDS / APEAL not separately scored per model (`customer_satisfaction.confidence: "unknown"` across the brand)

- **Model/trim:** All 7 models.
- **Note:** Mini brand placed 3rd among mass-market brands in 2026 JD Power VDS (168 PP100 vs 204 industry average) per Phase 1 research, which supports `reliability.confidence: "medium"` — but JD Power does not publish per-model scores for Mini (low US volume + niche segments). `customer_satisfaction.summary` notes the gap honestly. Expected, no action.

### 4. Step-up trims (Cooper S variants) correctly omit unchanged spec blocks per spec §6.3

- **Models/trims:** Cooper Hardtop 2 Door / Cooper S; Cooper Hardtop 4 Door / Cooper S; Cooper Convertible / Cooper S Convertible — each is a step-up trim (`is_base_trim: false`, `delta_from_base` populated) and has 2 images each (rather than full 4) because they share the `cooper-hardtop-2-door` / `cooper-hardtop-4-door` / `cooper-convertible` trim_family with their base sibling. The 4-image minimum applies at family level, not trim level (spec §7).
- **Note:** Verified — every trim_family has at least one trim carrying all 4 required angles, and step-ups share within the family. Not a finding; flagged to clarify what looks like an image gap.

---

## Coverage stats

- Models with >2 null spec blocks on base trim: **0**
- Models with <4 images on a trim family: **0** (every family carries at least 4 images on its base)
- Models with all 4 review blocks at unknown confidence: **0**
- Trims missing key sources entries for *populated* blocks: **0**

---

## Sample details

### Sampled trims for source verification

1. **Cooper Hardtop 2 Door / Cooper S** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49228` (EPA)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 28/39/32 — **PASS** (EPA matches exactly)
   - `fuel_economy.fuel_type_required: "premium"` — **PASS** (EPA: "Premium Gasoline Recommended")
   - `powertrain.engine_displacement_l: 2.0 / engine_config: "I4" / aspiration: "turbocharged" / transmission_speeds: 7` — **PASS** (EPA: "2.0 L, 4 cyl, Automatic (AM-S7), Turbo")
   - `msrp_base: $32,800` cited from press.bmwgroup.com T0450606EN_US — primary BMW Group press release, valid per spec §4.1
   - Result: **PASS on every EPA-verifiable field**

2. **Cooper Convertible / Cooper S Convertible** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49186` (EPA)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 26/36/30 — **PASS** (EPA matches exactly)
   - `fuel_economy.fuel_type_required: "premium"` — **PASS**
   - `powertrain.engine_displacement_l: 2.0 / aspiration: "turbocharged" / transmission_speeds: 7` — **PASS**
   - `msrp_base: $37,900` cited from same BMW Group press release — consistent with the lineup announcement
   - Result: **PASS on every EPA-verifiable field**

3. **Countryman / Countryman SE ALL4** (EV) — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=50222` (EPA)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 99/94/96 — **PASS** (EPA matches exactly, MPGe mirrored per spec §3.6 v1.1 convention)
   - `ev_specifics.electric_range_mi: 212 / total_range_mi: 212` — **PASS** (EPA matches exactly)
   - `fuel_economy.fuel_type_required: "electricity"` — **PASS**
   - `powertrain.type: "ev" / drivetrain: "AWD-electric"` — **PASS** (EPA confirms "SE ALL4")
   - `msrp_base: $45,200` cited from miniusa.com EV-Countryman product page — primary manufacturer source
   - Result: **PASS on every EPA-verifiable field; MPGe mirror correctly applied**

### Image URLs checked

All 5 sampled image entries had `needs_scraping: true` and pointed to miniusa.com product pages (not direct asset URLs). Per batch protocol these are NOT image-URL failures — Phase 4 will resolve them.

1. `https://www.miniusa.com/model/2-door.html` — Cooper Hardtop 2 Door / Cooper C / front_three_quarter — `needs_scraping: true` (expected)
2. `https://www.miniusa.com/model/2-door.html` — Cooper Hardtop 2 Door / Cooper C / interior_dashboard — `needs_scraping: true` (expected)
3. `https://www.miniusa.com/model/convertible.html` — Cooper Convertible / Cooper C Convertible / rear_three_quarter — `needs_scraping: true` (expected)
4. `https://www.miniusa.com/model/electric-vehicles/countryman.html` — Countryman / Countryman SE ALL4 / side_profile — `needs_scraping: true` (expected)
5. `https://www.miniusa.com/model/john-cooper-works/jcw-2-door.html` — JCW 2 Door / front_three_quarter — `needs_scraping: true` (expected)

No image URL failures flagged per batch protocol — all sampled were `needs_scraping: true` page URLs.

---

## Notes on this verification

- **EPA spot-checks were clean.** All three sampled EPA IDs (49228 Cooper S, 49186 Cooper S Convertible, 50222 Countryman SE ALL4 18" wheel) resolved and matched the data exactly on city/highway/combined MPG/MPGe, fuel type, and powertrain summary.
- **No forbidden sources detected.** Programmatic JSON sweep flagged 0 hits for motor1.com, carbuzz.com, autoblog.com, autoevolution.com, teslaoracle.com, iseecars.com, hiconsumption.com, topspeed.com, hotcars.com, wikipedia, or www.cars.com.
- **No dealer-domain sources detected** in any `sources` map or `professional_reviews.links` field.
- **Sole-trim atomic rule correctly applied** to JCW 2 Door, JCW Convertible, JCW Countryman ALL4, and Countryman SE ALL4 (the EV powertrain line within Countryman). Each is `is_base_trim: true` with `delta_from_base: null` and carries its own 4 image angles. The Countryman model correctly has two `is_base_trim: true` trims (Countryman S ALL4 for ICE, Countryman SE ALL4 for EV) per the multi-powertrain rule.
- **Singleton trim_family check passed (0 violations).** Every singleton family (`jcw-2-door`, `jcw-convertible`, `countryman-ev`, `jcw-countryman-all4`) carries 4 image entries directly per spec §7.
- **MSRP range integrity, base-trim count, body-style taxonomy, delta-from-base references** all pass programmatic check.
- **Cross-trim sanity check passed** — no MSRP 50%+ outliers, no horsepower or dimension outliers within any model.
- **EV MPGe mirror correctly applied** on Countryman SE ALL4 (99/94/96 in both `fuel_economy` and `ev_specifics.mpge_combined`) per spec §3.6 v1.1.
- **Body-style/cargo-volume consistency check passed** — hatchback and SUV-compact models have `behind_2nd_row`/`behind_1st_row` populated, `trunk_cuft` null; convertibles correctly carry trunk_cuft only (acceptable for soft-top body).
- **Recommendation: Proceed to publish.** Mini is the cleanest brand observed in this batch slot — 0 blockers, 0 warnings, 4 FYIs that are all expected patterns.
