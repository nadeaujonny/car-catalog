# Verification Report: Volkswagen

**Date:** 2026-05-13
**Data source:** `data/volkswagen.json` (researched 2026-05-12)
**Models checked:** 9
**Trims checked:** 31
**Trims sampled for source verification:** 3 (Jetta GLI / Autobahn; Tiguan / S; Jetta / S)
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 2
- **Warnings:** 1
- **FYIs:** 3

---

## Blockers

### 1. Atlas / SEL Premium R-Line — singleton trim_family marked `is_base_trim: false` (§6.2 / §7 violation)

- **Model/trim:** Atlas / SEL Premium R-Line (`trim_family: "atlas-r-line"`, only trim in this family)
- **Issue:** Per spec §6.2 (sole-trim case, last paragraph) and §7, "if a `trim_family` contains exactly one trim, that trim is the family's base trim, has `is_base_trim: true`." The trim is a singleton within `atlas-r-line` (the other 4 Atlas trims sit in `atlas-standard`) but is marked `is_base_trim: false` with a `delta_from_base` pointing to the SEL trim in `atlas-standard`.
- **Found in:** `models[6].trims[4]` (Atlas / sel-premium-r-line)
- **Value seen:** `is_base_trim: false`, `delta_from_base: { from_trim_slug: "sel", ... }`, `trim_family: "atlas-r-line"`
- **Expected:** Either (a) flip to `is_base_trim: true` with `delta_from_base: null` per spec §6.2 sole-trim atomic rule, or (b) merge into `atlas-standard` family (treating R-Line as a styling tier within the standard Atlas family). Note that the 2 other singleton families in this brand — Jetta GLI / Autobahn (`jetta-gli` family) and Golf R (`golf-r` family) — both correctly carry `is_base_trim: true`.

---

### 2. Atlas Cross Sport msrp_range.high mismatch ($55,095 vs computed $53,620)

- **Model/trim:** Atlas Cross Sport (model-level)
- **Issue:** `msrp_range.high` is `55095` but the highest `msrp_base` across Atlas Cross Sport trims (SEL Premium R-Line at $53,620) is `53620`. Off by $1,475.
- **Found in:** `models[7].msrp_range.high` (Atlas Cross Sport)
- **Value seen:** `55095` — **Expected:** `53620`
- **Note:** Atlas (the standard SUV) has the same SEL Premium R-Line trim at $54,630 (a $1,010 step up from Atlas Cross Sport), so the $55,095 figure isn't another Atlas trim either — appears to be a stale figure.

---

## Warnings

### 1. NHTSA partial-coverage, IIHS 2026 TSP partial

- **Models/trims:** Jetta GLI, Taos, Tiguan, Golf GTI, Golf R, ID.4 — various trims have `safety.nhtsa_overall_rating: null` (per STATUS notes: "Golf GTI/R, Taos, Tiguan had not been NHTSA-rated for 2026 at research time"). IIHS 2026 TSP only on Golf GTI/R, Atlas, Atlas Cross Sport — Jetta, Jetta GLI, Taos, Tiguan, ID.4 did not earn TSP.
- **Issue:** Common pattern across this batch — partial NHTSA/IIHS coverage is the norm in mid-2026.
- **Recommendation:** Re-poll NHTSA before publication; IIHS award decisions for 2026 are typically settled by mid-year so the current state is likely stable.

---

## FYIs

### 1. All 49 image URLs are `needs_scraping: true` (vw.com consumer-page URLs)

- **Model/trim:** Every trim — 100% of image entries point to vw.com vehicle pages or media.vw.com press-kit pages.
- **Note:** Phase 1 research noted vw.com and media.vw.com both JS-render in WebFetch responses; CDN asset URLs not extractable. All 49 image entries are page-URL placeholders. Per batch protocol these are NOT image-URL failures — Phase 4 will resolve them.

### 2. JD Power VDS / APEAL not separately scored per model for 2026 MY (confidence low/unknown)

- **Model/trim:** All 9 models — `reliability.confidence: "low"`, `customer_satisfaction.confidence: "unknown"`.
- **Note:** Expected per batch context.

### 3. Some Atlas step-up trims have 0 images (family-shared image inheritance)

- **Model/trim:** Atlas / SE with Technology, Peak Edition, SEL — all have 0 image entries because they share the `atlas-standard` family with Atlas / SE base (which has 4 image entries).
- **Note:** This is legitimate spec §7 image-sharing — the family-level minimum of 4 images is met by the base trim. The 4 step-ups inherit. Same pattern applies to Atlas Cross Sport, Tiguan, Taos. Not a finding; flagged here to clarify what looks like an image-coverage gap at first glance. (The Atlas singleton SEL Premium R-Line in `atlas-r-line` is a separate finding — Blocker #1.)

---

## Coverage stats

- Models with >2 null spec blocks on base trim: **0**
- Models with <4 images on a trim family: **0** (every family has at least 4 image entries on its base, all `needs_scraping: true`)
- Models with all 4 review blocks at unknown confidence: **0**
- Trims missing key sources entries for *populated* blocks: **0**
- Singleton-family-base-rule violations: **1** (Blocker #1)
- Forbidden source hits in trim `sources` maps or review-block sources: **0**
- MSRP range mismatches: **1** (Blocker #2)

---

## Sample details

### Sampled trims for source verification

1. **Jetta GLI / Autobahn** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49267` (EPA)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 26/35/29 — **PASS** (EPA matches exactly)
   - `fuel_economy.fuel_type_required: "regular"` — **PASS** (EPA: "Regular Gasoline")
   - `powertrain.engine_displacement_l: 2.0 / transmission: "7-speed dual-clutch automatic" / transmission_speeds: 7` — **PASS** (EPA: "2.0 L, 4 cyl, Automatic (AM-S7), Turbo")
   - `msrp_base: $33,745` cited from media.vw.com/press-kits/304 — primary manufacturer press source
   - Result: **PASS on every EPA-verifiable field**

2. **Tiguan / S** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49469` (EPA)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 26/34/29 — **PASS** (EPA matches exactly)
   - `fuel_economy.fuel_type_required: "regular"` — **PASS** (EPA: "Regular Gasoline")
   - `powertrain.horsepower_hp: 201` — **PASS** (Tiguan 2.0T new-gen powertrain)
   - `msrp_base: $30,805` cited from media.vw.com/press-kits/2026-tiguan-press-kit — primary manufacturer press source
   - Result: **PASS on every EPA-verifiable field**

3. **Jetta / S** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49269` (EPA)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 29/40/34 — **PASS** (EPA matches exactly)
   - `fuel_economy.fuel_type_required: "regular"` — **PASS**
   - `powertrain.horsepower_hp: 158` — **PASS**
   - `msrp_base: $23,995` cited from media.vw.com/press-kits/304 — primary manufacturer press source
   - Result: **PASS on every EPA-verifiable field**

### Image URLs checked

All 5 sampled image entries had `needs_scraping: true` and pointed to vw.com vehicle pages. Per batch protocol these are NOT image-URL failures.

1. `https://www.vw.com/en/models/jetta.html` — Jetta / S / front_three_quarter — `needs_scraping: true` (expected)
2. `https://www.vw.com/en/models/jetta-gli.html` — Jetta GLI / Autobahn / front_three_quarter — `needs_scraping: true` (expected)
3. `https://www.vw.com/en/models/tiguan.html` — Tiguan / S / interior_dashboard — `needs_scraping: true` (expected)
4. `https://www.vw.com/en/models/atlas.html` — Atlas / SE / front_three_quarter — `needs_scraping: true` (expected)
5. `https://www.vw.com/en/models/id-4.html` — ID.4 / Pro / side_profile — `needs_scraping: true` (expected)

No image URL failures flagged per batch protocol.

---

## Notes on this verification

- **EPA spot-checks were perfectly clean.** All 3 sampled EPA URLs (49267 Jetta GLI Autobahn, 49469 Tiguan S, 49269 Jetta S) returned values matching the data exactly on city/highway/combined MPG, fuel type, and powertrain summary.
- **No forbidden sources detected.** Programmatic JSON sweep flagged 0 hits for motor1, carbuzz, autoblog, autoevolution, teslaoracle, iseecars, hiconsumption, topspeed, hotcars, wikipedia, www.cars.com. No dealer-domain hits either.
- **The Atlas singleton-family-base-false finding (Blocker #1)** is the same pattern flagged on Subaru (12 trims) and Volvo (5 trims) this batch, but VW is by far the lightest hit — only 1 of 3 singleton families violates the rule; Jetta GLI (`jetta-gli`) and Golf R (`golf-r`) both correctly carry `is_base_trim: true`.
- **The Atlas Cross Sport msrp_range.high mismatch (Blocker #2)** is $1,475 off, which is a noticeable but not catastrophic drift. Same pattern as other brands in this batch.
- **All 49 image URLs need scraping** — vw.com / media.vw.com both JS-render and don't expose CDN asset URLs to WebFetch. Phase 4 will resolve.
- **Sole-trim atomic rule verified correctly** on Jetta GLI / Autobahn (`jetta-gli` family) and Golf R (`golf-r` family) — both `is_base_trim: true` with `delta_from_base: null` and 4 image angles. Per STATUS notes, the Euro Style Package on Golf R is correctly treated as option per §6.5 rather than a separate trim.
- **Cross-trim sanity check passed** — no MSRP 50%+ outliers, no horsepower or dimension outliers across any model.
- **Body-style/cargo-volume consistency check passed** — Jetta/Jetta GLI (sedans) have `trunk_cuft` populated; Golf GTI/Golf R (hatchback), Taos/Tiguan/Atlas/Atlas Cross Sport (SUVs), ID.4 (suv-compact) all have `behind_2nd_row`/`behind_1st_row` populated.
- **EV MPGe mirror correctly applied** on ID.4 EV trims per spec §3.6 v1.1.
- **ID.Buzz correctly excluded** — per STATUS notes, VW skipped MY2026 for US/Canada (expected return MY27).
- **Recommendation: Address 2 blockers before publication.** Atlas singleton-base-false is a 1-trim atomic fix; Atlas Cross Sport msrp_range.high is a 1-line numeric fix. Both can be batched in a single fix pass with no other dependencies. The single warning is environmental (NHTSA/IIHS coverage), not a data issue.
