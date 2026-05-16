# Verification Report: Subaru

**Date:** 2026-05-13
**Data source:** `data/subaru.json` (researched 2026-05-12)
**Models checked:** 10
**Trims checked:** 50
**Trims sampled for source verification:** 3 (Crosstrek / Sport Hybrid; BRZ / Limited; Uncharted / Sport)
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 7
- **Warnings:** 2
- **FYIs:** 3

---

## Blockers

### 1. Twelve singleton trim_families marked `is_base_trim: false` (§6.2 / §7 violation)

- **Models/trims (12 total):**
  - Crosstrek / Wilderness (`crosstrek-wilderness` family)
  - Forester / Sport Onyx Edition (`forester-sport-onyx` family)
  - Forester / Wilderness (`forester-wilderness` family)
  - Forester / Sport Hybrid (`forester-hybrid-sport` family — also has only 1 of 4 images, see Blocker #2)
  - Outback / Wilderness (`outback-wilderness` family)
  - Ascent / Limited Bronze Edition (`ascent-bronze` family)
  - Ascent / Onyx Edition Touring (`ascent-onyx` family)
  - BRZ / tS (`brz-ts` family)
  - BRZ / Series.Yellow (`brz-series-yellow` family)
  - WRX / GT (`wrx-gt` family)
  - WRX / tS (`wrx-ts` family)
  - WRX / Series.Yellow (`wrx-series-yellow` family)
- **Issue:** Per spec §6.2 (sole-trim case, last paragraph) and §7, "if a `trim_family` contains exactly one trim, that trim is the family's base trim, has `is_base_trim: true`, and must carry the full 4 required image angles directly." All 12 of these trims are singletons within their declared `trim_family` but are marked `is_base_trim: false` and carry a `delta_from_base` pointing to a trim in a different `trim_family`. STATUS.md notes claim these were set up as singleton families per atomic rule but the `is_base_trim: true` flip didn't get applied.
- **Found in:** `models[*].trims[*]` — 12 occurrences
- **Value seen:** `is_base_trim: false`, `delta_from_base: { from_trim_slug: "<another-family-trim>", ... }`
- **Expected:** Either (a) flip each to `is_base_trim: true` with `delta_from_base: null` per the spec §6.2 sole-trim atomic rule, or (b) consolidate each into the same `trim_family` as the referenced base trim (giving up the separate-family designation, so they're no longer singletons).

---

### 2. Forester / Sport Hybrid — singleton family carries only 1 of 4 required images (spec §7)

- **Model/trim:** Forester / Sport Hybrid (`trim_family: "forester-hybrid-sport"`)
- **Issue:** Singleton family must carry all 4 required image angles directly per spec §7. The trim's `images` array contains only `front_three_quarter` (1 of 4). The other 11 singleton-family violations (Blocker #1) all carry their 4 images correctly; only Forester Sport Hybrid is missing image coverage as well as the `is_base_trim` flag.
- **Found in:** `models[2].trims[8].images` (Forester / sport-hybrid)
- **Value seen:** 1 image entry (`front_three_quarter`); missing `rear_three_quarter`, `side_profile`, `interior_dashboard`
- **Recommendation:** Add the 3 missing image entries (page-URL placeholders flagged `needs_scraping: true` are acceptable for now per Phase 4 flow).

---

### 3. iseecars.com cited as `sources.dimensions` on 4 trims (forbidden content-farm source)

- **Models/trims:**
  - Impreza / Sport — `sources.dimensions: "https://www.iseecars.com/car/subaru-impreza-specs"`
  - Impreza / RS — `sources.dimensions: "https://www.iseecars.com/car/subaru-impreza-specs"`
  - BRZ / Limited — `sources.dimensions: "https://www.iseecars.com/car/subaru-brz-specs"`
  - WRX / Base — `sources.dimensions: "https://www.iseecars.com/car/subaru-wrx-dimensions"`
- **Issue:** Per spec §4 and batch context, iseecars.com is on the forbidden content-farm denylist.
- **Found in:** 4 `models[*].trims[*].sources.dimensions` entries
- **Expected:** Replace with manufacturer dimension URLs once subaru.com consumer pages render properly, or with EPA size-class data, or with Edmunds/KBB/Car-and-Driver equivalents. Trim model `notes` already acknowledge "subaru.com pages render JS-only and returned thin content to WebFetch" as the reason for the iseecars fallback.

---

### 4. WRX msrp_range.high mismatch ($45,995 vs computed $46,190)

- **Model/trim:** WRX (model-level)
- **Issue:** `msrp_range.high` is `45995` (Series.Yellow trim) but the highest-MSRP trim is GT at $46,190.
- **Found in:** `models[6].msrp_range.high` (WRX)
- **Value seen:** `45995` — **Expected:** `46190`

---

### 5. Trailseeker msrp_range.high mismatch ($46,555 vs computed $45,105)

- **Model/trim:** Trailseeker (model-level)
- **Issue:** `msrp_range.high` is `46555` but the highest `msrp_base` across Trailseeker trims (Premium $39,995 / Limited $43,995 / Touring $45,105) is `45105`. The $46,555 value does not match any trim — appears to be a stale figure (possibly from a draft pricing list that included a destination fee or an option pack).
- **Found in:** `models[8].msrp_range.high` (Trailseeker)
- **Value seen:** `46555` — **Expected:** `45105`

---

## Warnings

### 1. Impreza model notes describe iseecars as a primary source in research-trail prose

- **Model/trim:** Impreza (model `notes` field)
- **Issue:** The notes prose explicitly states "dimensions and curb weight from iSeeCars and dealer-aggregated Subaru spec mirrors..." documenting the forbidden-source usage. The actual `sources.dimensions` map already triggers Blocker #3.
- **Found in:** `models[0].notes`
- **Recommendation:** After Blocker #3 cleanup, also rephrase the notes to avoid naming iSeeCars as a primary source.

### 2. NHTSA 2026 ratings null brand-wide; IIHS partial

- **Models/trims:** All 10 models — `safety.nhtsa_overall_rating: null`. IIHS 2026 TSP+ verified for Forester, Ascent, Outback (per STATUS notes); Crosstrek and WRX did not earn TSP for 2026 (Crosstrek scored Marginal on moderate overlap due to rear lap-belt issue per STATUS).
- **Issue:** Common pattern across this batch — NHTSA 2026 ratings posted late; not unique to Subaru. Worth re-checking before publication.
- **Recommendation:** Re-poll NHTSA for 2026 ratings before final publish.

---

## FYIs

### 1. All 128 image URLs are `needs_scraping: true` (subaru.com consumer-page URLs)

- **Model/trim:** Every trim — 100% of image entries point to subaru.com vehicle product/spec pages.
- **Note:** Phase 1 research noted subaru.com consumer pages return only nav/footer content to WebFetch, so CDN asset URLs are not extractable. All 128 image entries are page-URL placeholders. Per batch protocol these are NOT image-URL failures — Phase 4 image-scrape will resolve them. No action needed at verification.

### 2. JD Power VDS / Consumer Reports numeric predicted-reliability not published for 2026 MY

- **Model/trim:** All 10 models — `reliability.confidence: "low"` or `"unknown"`, `customer_satisfaction.confidence: "unknown"`.
- **Note:** Expected per spec §13 known limitation. Subaru carries decent JD Power VDS aggregate brand reputation, but per-model 2026-MY scores aren't out.

### 3. Trailseeker/Uncharted are first-year all-new BEV nameplates

- **Models/trims:** Trailseeker (3 trims, 375 hp dual-motor standard), Uncharted (5 trims — FWD + AWD lines).
- **Note:** Both are new for 2026, both correctly use `powertrain.type: "ev"` with MPGe mirrored into `fuel_economy.city_mpg/highway_mpg/combined_mpg` per spec §3.6 v1.1. EPA spot-check on Uncharted Sport (ID 50303) confirms 127/106/117 MPGe and 287-mi total range matching data exactly. No findings — flagged here in case downstream filters need to know.

---

## Coverage stats

- Models with >2 null spec blocks on base trim: **0**
- Models with <4 images on a trim family: **1** (Forester `forester-hybrid-sport` singleton with 1/4 images — see Blocker #2)
- Models with all 4 review blocks at unknown confidence: **0**
- Trims missing key sources entries for *populated* blocks: **0** (all "missing" entries correspond to null spec blocks on step-up trims per §6.3)
- Singleton-family-base-rule violations: **12** (Blocker #1)
- Forbidden source hits in trim `sources` maps: **4** (Blocker #3)
- MSRP range mismatches: **2** (Blockers #4, #5)

---

## Sample details

### Sampled trims for source verification

1. **Crosstrek / Sport Hybrid** (HEV, base of Crosstrek Hybrid powertrain line) — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49538` (EPA)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 36/36/36 — **PASS** (EPA matches exactly)
   - `fuel_economy.fuel_type_required: "regular"` — **PASS** (EPA: "Regular Gasoline")
   - `powertrain.type: "hybrid" / engine_displacement_l: 2.5 / engine_config: "flat-4"` — **PASS** (EPA: "2.5 L, 4 cyl, Automatic (AV-S6)", series-parallel HEV)
   - `msrp_base: $33,995` cited from media.subaru.com pressrelease/2335 — primary manufacturer press source per spec §4.1
   - Result: **PASS on every EPA-verifiable field**

2. **BRZ / Limited** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49787` (EPA)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 20/27/22 — **PASS** (data values match EPA per Phase 1 cross-check)
   - `fuel_economy.fuel_type_required: "premium"` — **PASS**
   - `powertrain.engine_displacement_l: 2.4 / engine_config: "flat-4" / aspiration: "naturally_aspirated"` — **PASS**
   - `msrp_base: $35,860` cited from media.subaru.com pressrelease/2369 — primary manufacturer press source
   - `sources.dimensions: "https://www.iseecars.com/car/subaru-brz-specs"` — **Blocker #3** (forbidden content-farm)
   - Result: **PASS on most fields; iseecars dimensions source needs replacement**

3. **Uncharted / Sport** (EV, base of AWD line) — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=50303` (EPA)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 127/106/117 — **PASS** (EPA matches exactly, MPGe mirrored per spec §3.6 v1.1)
   - `ev_specifics.electric_range_mi: 287 / total_range_mi: 287` — **PASS** (EPA: "287 miles" total range)
   - `ev_specifics.mpge_combined: 117` — **PASS** (matches `fuel_economy.combined_mpg`)
   - `powertrain.type: "ev" / drivetrain: "AWD-electric"` — **PASS**
   - `msrp_base: $39,795` cited from media.subaru.com pressrelease/2403 — primary manufacturer press source
   - Result: **PASS on every EPA-verifiable field; MPGe mirror correctly applied**

### Image URLs checked

All 5 sampled image entries had `needs_scraping: true` and pointed to subaru.com vehicle product/spec pages. Per batch protocol these are NOT image-URL failures.

1. `https://www.subaru.com/vehicles/impreza/2026.html` — Impreza / Sport / front_three_quarter — `needs_scraping: true` (expected)
2. `https://www.subaru.com/vehicles/crosstrek/hybrid/2026.html` — Crosstrek / Sport Hybrid / front_three_quarter — `needs_scraping: true` (expected)
3. `https://www.subaru.com/vehicles/forester/wilderness/2026.html` — Forester / Wilderness / interior_dashboard — `needs_scraping: true` (expected)
4. `https://www.subaru.com/vehicles/brz/2026.html` — BRZ / Limited / side_profile — `needs_scraping: true` (expected)
5. `https://www.subaru.com/vehicles/uncharted/2026.html` — Uncharted / Sport / rear_three_quarter — `needs_scraping: true` (expected)

No image URL failures flagged per batch protocol.

---

## Notes on this verification

- **EPA spot-checks were clean.** Both verifiable EPA URLs (49538 Crosstrek Hybrid AWD, 50303 Uncharted AWD) returned values matching the data exactly on city/highway/combined MPG/MPGe, fuel type, and powertrain summary. BRZ EPA ID 49787 was not separately re-fetched but matches Phase 1's documented PASS.
- **The singleton-family-base-false pattern (Blocker #1) is by far the dominant blocker class** — 12 trims systematically violate spec §6.2 / §7 sole-trim atomic rule. The fix is mechanical: for each singleton family, flip `is_base_trim: false → true` and set `delta_from_base: null` (the trim's existing changes-from-base info can move into the trim's `notes` or stay as historical reference). This is the same architectural error pattern flagged on Mazda (36 occurrences) and Acura (1 occurrence) in prior verification batches — Subaru is the second-worst offender so far.
- **The 4 iseecars.com citations (Blocker #3)** all sit in `sources.dimensions` and stem from subaru.com consumer pages not rendering dimensional data to WebFetch during Phase 1 research. Replacement options include manufacturer's own spec PDFs, EPA size-class data, or Edmunds/KBB.
- **Two msrp_range mismatches (Blockers #4, #5)** — WRX off by $195 (Series.Yellow $45,995 used instead of GT $46,190), Trailseeker off by $1,450 ($46,555 doesn't match any trim). Both are 1-line numeric fixes.
- **No dealer-domain hits.** Initial automated regex flagged 13 `subaru.com/owners/benefits-of-ownership/added-security-program.html` URLs as "dealer" because of the `of-` substring in the path, but `subaru.com` is the manufacturer's own consumer site — verified false positives, no finding. No `subaruof…` / `subarudealer…` style URLs anywhere in the data.
- **Sole-trim atomic rule applied correctly to Uncharted FWD `premium-fwd` (singleton family `uncharted-fwd`, is_base_trim: true, 4 images)** and BRZ `limited` (base of BRZ family, is_base_trim: true). These are the 2 of 14 singleton-family entries that pass — the other 12 violate the rule (Blocker #1).
- **Cross-trim sanity check passed** — no MSRP 50%+ outliers (the WRX GT at $46k vs Base at $32k is ~44% step, within tolerance), no horsepower or dimension outliers within any model.
- **Body-style/cargo-volume consistency check passed** — hatchback/SUV models have `behind_2nd_row`/`behind_1st_row` populated; BRZ (sports-car) and Impreza (hatchback) handled correctly.
- **EV MPGe mirror correctly applied** on Solterra, Trailseeker, Uncharted base trims per spec §3.6 v1.1.
- **Recommendation: Address all 7 blockers before relying on this catalog for publication.** The 12-trim singleton-base-false pattern (Blocker #1) needs a mechanical fix pass similar to Mazda's. The 4 iseecars citations are individual replacements. The 2 msrp_range fixes are 1-line edits.
