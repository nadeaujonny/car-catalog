# Verification Report: Cadillac

**Date:** 2026-05-13
**Data source:** `data/cadillac.json` (researched 2026-05-12)
**Models checked:** 18
**Trims checked:** 42
**Trims sampled for source verification:** 3 (CT5 / Premium Luxury; VISTIQ / Luxury; Escalade / Sport)
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 10
- **Warnings:** 4
- **FYIs:** 3

---

## Blockers

### 1. Cadillac Pasadena dealer-site URL used as `sources.warranty` on 18 trims (forbidden dealer source)

- **Models/trims:** Every trim of CT4, CT5, CT5-V, CT5-V Blackwing, XT5, LYRIQ, LYRIQ-V, OPTIQ, OPTIQ-V, Escalade, Escalade-V, Escalade-ESV, Escalade-IQ (~18 occurrences) cites `https://www.cadillacpasadena.com/service/service-and-parts-tips/what-does-cadillac-warranty-cover/` as the `sources.warranty` URL.
- **Issue:** Per the system-prompt batch context, "dealer sites (any URL with a dealership name)" are forbidden as primary sources. `cadillacpasadena.com` is a Pasadena-area Cadillac dealer.
- **Found in:** `models[*].trims[*].sources.warranty` (18 instances)
- **Value seen:** `https://www.cadillacpasadena.com/service/service-and-parts-tips/what-does-cadillac-warranty-cover/`
- **Expected:** Replace with `https://www.cadillac.com/owner-resources/owner-resources-and-services/warranty-overview` (Cadillac's own warranty page) or `https://my.cadillac.com/limited-warranty`.

---

### 2. CT4 / Luxury — `sources.dimensions` cites www.cars.com (forbidden)

- **Model/trim:** CT4 / Luxury
- **Issue:** `sources.dimensions: "https://www.cars.com/research/cadillac-ct4-2026/specs/"`. Per batch context, `www.cars.com` is on the forbidden-source list (content-farm tier).
- **Found in:** `models[0].trims[0].sources.dimensions`
- **Expected:** Remove or replace with cadillac.com once consumer-site outage resolves; in the meantime use KBB/Edmunds equivalent (both already used elsewhere on this brand).

---

### 3. OPTIQ-V / V-Series — `sources.dimensions` cites carbuzz.com (forbidden)

- **Model/trim:** OPTIQ-V / V-Series
- **Issue:** `sources.dimensions: "https://carbuzz.com/cars/cadillac/optiq-v/2026/specs-and-trims/"`. Carbuzz is on the forbidden-source list (content-farm tier).
- **Found in:** `models[10].trims[0].sources.dimensions`
- **Expected:** Replace with manufacturer site (cadillac.com when reachable) or fueleconomy.gov size-class data.

---

### 4. CELESTIQ / Bespoke — `sources.dimensions` cites en.wikipedia.org (forbidden)

- **Model/trim:** CELESTIQ / Bespoke
- **Issue:** `sources.dimensions: "https://en.wikipedia.org/wiki/Cadillac_Celestiq"`. Wikipedia is forbidden as a primary source per spec §4 / batch context.
- **Found in:** `models[17].trims[0].sources.dimensions`
- **Expected:** Replace with cadillac.com/electric/celestiq once consumer site outage resolves, or with EPA size-class entry. Currently no primary source covers the bespoke EV's published dimensions.

---

### 5. CT4 msrp_range.high mismatch ($46,195 vs computed $44,400)

- **Model/trim:** CT4 (model-level)
- **Issue:** `msrp_range.high` is `46195` but the highest `msrp_base` across CT4 trims (Luxury $36,000 / Premium Luxury $40,400 / Sport $44,400) is `44400`. CT4-V and CT4-V Blackwing are correctly split as separate models per spec §6.4, so the $46k figure does not belong in the base CT4 range.
- **Found in:** `models[0].msrp_range.high` (CT4)
- **Value seen:** `46195` — **Expected:** `44400`

---

### 6. LYRIQ msrp_range.high mismatch ($71,500 vs computed $59,400)

- **Model/trim:** LYRIQ (model-level)
- **Issue:** `msrp_range.high` is `71500` but the highest `msrp_base` across LYRIQ trims (Luxury $58,900 / Sport $59,400) is `59400`. The $71,500 figure appears to reflect the all-options Signature Sport configuration, but spec §3 explicitly requires `msrp_range.high` to equal the maximum trim `msrp_base` (packages are folded per §6.5 and do not enter `msrp_range`).
- **Found in:** `models[7].msrp_range.high` (LYRIQ)
- **Value seen:** `71500` — **Expected:** `59400`

---

### 7. LYRIQ-V msrp_range.high mismatch ($82,000 vs computed $76,800)

- **Model/trim:** LYRIQ-V (sole-trim model)
- **Issue:** `msrp_range.high` is `82000` but the model has a single trim `v-series` at `msrp_base: 76800`. Sole-trim model's range should equal that trim's MSRP on both ends.
- **Found in:** `models[8].msrp_range.high` (LYRIQ-V)
- **Value seen:** `82000` — **Expected:** `76800`

---

### 8. OPTIQ msrp_range.high mismatch ($53,600 vs computed $49,600)

- **Model/trim:** OPTIQ (model-level)
- **Issue:** `msrp_range.high` is `53600` but the highest `msrp_base` across OPTIQ trims (Luxury $49,100 / Sport $49,600) is `49600`.
- **Found in:** `models[9].msrp_range.high` (OPTIQ)
- **Value seen:** `53600` — **Expected:** `49600`

---

### 9. Escalade msrp_range.high mismatch ($117,000 vs computed $117,500)

- **Model/trim:** Escalade (model-level)
- **Issue:** `msrp_range.high` is `117000` (Platinum Luxury) but the highest trim is Platinum Sport at `msrp_base: 117500`.
- **Found in:** `models[14].msrp_range.high` (Escalade)
- **Value seen:** `117000` — **Expected:** `117500`

---

### 10. Escalade-ESV msrp_range.high mismatch ($120,300 vs computed $120,500)

- **Model/trim:** Escalade-ESV (model-level)
- **Issue:** `msrp_range.high` is `120300` but the highest trim is Platinum Sport at `msrp_base: 120500`.
- **Found in:** `models[15].msrp_range.high` (Escalade-ESV)
- **Value seen:** `120300` — **Expected:** `120500`

---

## Warnings

### 1. Heavy gmauthority.com reliance across the brand (73 occurrences in trim sources maps)

- **Model/trim:** Most trims across CT4 / CT5 / CT5-V / CT5-V Blackwing / XT5 / LYRIQ / LYRIQ-V / OPTIQ / OPTIQ-V / VISTIQ / Escalade / Escalade-ESV / Escalade-V / Escalade-IQ / Escalade-IQL — `sources.msrp_base`, `sources.destination_fee`, and `reliability.sources` cite `gmauthority.com` extensively.
- **Issue:** Per spec §4.1, secondary-source list is "Edmunds, KBB, Car and Driver, MotorTrend, Cars.com" — gmauthority.com is not in that list. It's a GM-focused enthusiast/press-coverage blog rather than a manufacturer or authoritative outlet. STATUS notes explain that cadillac.com / media.cadillac.com / media.gm.com all returned 'Site Maintenance' errors during Phase 1 research, which is why gmauthority filled in.
- **Found in:** 73 trim-level `sources.*` entries (most of CT4/CT5/Escalade families) plus reliability `sources` arrays
- **Source consulted:** STATUS.md research notes confirm GM consumer/press sites unreachable.
- **Recommendation:** Not an explicit denylist hit (gmauthority isn't on motor1/carbuzz/autoblog/autoevolution/teslaoracle/cars.com list), but worth replacing with cadillac.com or news.gm.com once those URLs come back online. Flagging as Warning rather than Blocker because it served as a documented Phase-1 fallback; recommend revisit in next fix pass.

---

### 2. LYRIQ Sport and OPTIQ Sport — base trims of singleton Sport family have 3 null spec blocks (§6.3 strict-reading violation)

- **Model/trim:** LYRIQ / Sport (base of `sport` family); OPTIQ / Sport (base of `sport` family)
- **Issue:** Per spec §6.3, "For the base trim, every block is fully populated." LYRIQ Sport and OPTIQ Sport are correctly marked `is_base_trim: true` (singleton-family base per spec §7), but `performance: null`, `dimensions: null`, `safety: null` — 3 of 6 spec blocks are null. The trim's notes explain that these are inherited from the Luxury sibling (same vehicle mechanically, only cosmetic styling differs), but inheritance from a different `trim_family` is not the schema's documented pattern.
- **Found in:** `models[7].trims[1]` (LYRIQ Sport), `models[9].trims[1]` (OPTIQ Sport)
- **Source consulted:** trim notes ("Sport styling line as separate trim_family... cosmetic treatment").
- **Recommendation:** Either (a) copy performance/dimensions/safety blocks from Luxury sibling onto Sport (fully populated per §6.3), or (b) reclassify Sport as step-up trim with `delta_from_base: { from_trim_slug: "luxury", changes: [...cosmetic...] }` (works around §7 by giving up the separate-family designation).

---

### 3. CT5 Premium Luxury — EPA city/highway MPG differ from data by 1 MPG each

- **Model/trim:** CT5 / Premium Luxury (RWD, 2.0T)
- **Issue:** EPA ID 49284 (which the trim cites as `sources.fuel_economy`) returns 22 city / 31 highway / 26 combined; data records 23/32/26. Combined matches but city and highway each off by 1 MPG.
- **Found in:** `models[1].trims[1].fuel_economy.city_mpg` / `highway_mpg`
- **Value seen:** data 23/32/26 vs EPA-page 22/31/26
- **Source consulted:** https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49284 (2026-05-13)
- **Recommendation:** Adjust to EPA values (22/31/26) per spec §4.2 "EPA wins". Could also indicate the trim is citing an AWD ID instead of RWD by mistake — verify EPA ID for CT5 RWD specifically.

---

### 4. No 2026 NHTSA ratings for any Cadillac model; IIHS only partial

- **Models/trims:** All 18 models have `safety.nhtsa_overall_rating: null`.
- **Issue:** NHTSA hasn't posted 2026 ratings for any Cadillac. IIHS has rated a few (XT5 — TSP, others various). Most performance variants (CT5-V Blackwing, CT4-V Blackwing, Escalade-V) and the CELESTIQ flagship correctly carry null safety (expected per batch context for low-volume performance/luxury vehicles), but the lower-volume EVs (LYRIQ-V / OPTIQ-V / Escalade-IQ / Escalade-IQL / VISTIQ) also have null which may reflect data lag rather than rating absence.
- **Recommendation:** Re-check IIHS for VISTIQ and LYRIQ once 2026 awards are finalized.

---

## FYIs

### 1. All 168 image URLs are `needs_scraping: true` (cadillac.com consumer-page URLs)

- **Model/trim:** Every trim — 100% of image entries point to cadillac.com product/gallery pages rather than direct asset URLs.
- **Note:** Phase 1 research noted cadillac.com and media.cadillac.com / media.gm.com all returned "Site Maintenance" errors throughout the research window. All 168 image entries are page-URL placeholders flagged `needs_scraping: true`. Per batch protocol these are NOT image-URL failures — Phase 4 image-scrape will resolve them once GM sites are reachable. No action needed at verification.

### 2. Model notes mention "cars.com cross-checks" in research-trail prose

- **Model/trim:** CT4 (model `notes` field includes "...specs reconciled across cars.com, KBB, Edmunds, gmauthority...").
- **Note:** Prose disclosure of research trail, not a citation. The actual `sources.*` map for CT4 / Luxury has 1 cars.com URL (Blocker #2). When that source is cleaned up, also consider editing the prose mention out of the model notes for consistency.

### 3. JD Power VDS / APEAL not separately scored at model level; reliability confidence is low/unknown

- **Model/trim:** All 18 models have `customer_satisfaction.confidence: "unknown"`; `reliability.confidence` ranges low–medium.
- **Note:** Per STATUS notes, "CR Dec 2025 reliability report flagged LYRIQ as a weak point due to early-Ultium software issues" — that's reflected in LYRIQ's reliability summary. Other models lack 2026-MY scores due to JD Power's 3-year-old measurement window. Expected per batch context.

---

## Coverage stats

- Models with >2 null spec blocks on base trim: **2** (LYRIQ Sport, OPTIQ Sport — see Warning #2)
- Models with <4 images on a trim family: **0** (every family has at least 4 image entries, all `needs_scraping: true`)
- Models with all 4 review blocks at unknown confidence: **0**
- Trims missing key sources entries for *populated* blocks: **0** (all "missing" entries correspond to null spec blocks on step-up trims, which is permitted by §6.3)
- MSRP range integrity: **6 of 18 mismatched** (Blockers #5–#10)
- Forbidden source hits in trim `sources` maps: **4** (3 distinct: cars.com, carbuzz.com, wikipedia) + **18** dealer warranty URLs (Blocker #1)

---

## Sample details

### Sampled trims for source verification

1. **CT5 / Premium Luxury** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49284` (EPA)
   - `fuel_economy.combined_mpg`: 26 — **PASS** (EPA matches exactly)
   - `fuel_economy.city_mpg` / `highway_mpg`: data 23/32 vs EPA 22/31 — **WARNING #3** (1 MPG each)
   - `fuel_economy.fuel_type_required: "premium"` — **PASS** (EPA: "Premium Gasoline Required")
   - `powertrain.engine_displacement_l: 2.0 / engine_config: "I4" / aspiration: "turbocharged" / transmission_speeds: 10` — **PASS** (EPA: "2.0 L, 4 cyl, Automatic (S10), Turbo")
   - `fuel_tank_gal: 17` — **PASS** (EPA: 17.0 gal)
   - `sources.warranty` cites cadillacpasadena.com dealer (**Blocker #1**)
   - Result: **PASS on most fields; 1-MPG city/highway discrepancy; warranty URL is dealer site**

2. **VISTIQ / Luxury** (EV) — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49636` (EPA)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 93/78/86 — **PASS** (EPA matches exactly, MPGe mirrored per spec §3.6 v1.1)
   - `ev_specifics.electric_range_mi: 305 / total_range_mi: 305` — **PASS** (EPA: 305 mi)
   - `powertrain.type: "ev" / drivetrain: "AWD-electric"` — **PASS**
   - `msrp_base: $75,600` cited from edmunds.com/cadillac/vistiq/ — permissible secondary source per spec §4.1
   - `sources.warranty` cites cadillacpasadena.com dealer (**Blocker #1**)
   - Result: **PASS on every EPA-verifiable field; warranty URL is dealer site**

3. **Escalade / Sport** (step-up trim) — sources cite `https://gmauthority.com/blog/2025/09/here-is-2026-cadillac-escalade-pricing-with-options-and-packages/` for MSRP
   - Step-up trim with `powertrain: null`, `fuel_economy: null`, `dimensions: null` per spec §6.3 (block null when unchanged from 1SA base)
   - `delta_from_base.from_trim_slug: "1sa"` — **PASS** (referenced trim exists)
   - `msrp_base: $99,800` cited from gmauthority — **Warning #1** (gmauthority over manufacturer)
   - Result: **Delta-form trim structurally valid; gmauthority reliance is a Warning #1 instance**

### Image URLs checked

All 5 sampled image entries had `needs_scraping: true` and pointed to cadillac.com product/gallery pages. Per batch protocol these are NOT image-URL failures.

1. `https://www.cadillac.com/sedans/ct4` — CT4 / Luxury / front_three_quarter — `needs_scraping: true` (expected)
2. `https://www.cadillac.com/sedans/ct5/gallery` — CT5 / Premium Luxury / rear_three_quarter — `needs_scraping: true` (expected)
3. `https://www.cadillac.com/electric/lyriq` — LYRIQ / Luxury / front_three_quarter — `needs_scraping: true` (expected)
4. `https://www.cadillac.com/suvs/escalade` — Escalade / 1SA / front_three_quarter — `needs_scraping: true` (expected)
5. `https://www.cadillac.com/electric/celestiq` — CELESTIQ / Bespoke / front_three_quarter — `needs_scraping: true` (expected)

No image URL failures flagged per batch protocol.

---

## Notes on this verification

- **EPA spot-check identified one 1-MPG city/highway discrepancy on CT5 Premium Luxury** (Warning #3). Combined MPG matches. Other EPA spot-check (VISTIQ Luxury) was perfect.
- **Source-hierarchy violations are the dominant blocker class this brand:** 18 dealer-site warranty citations (Blocker #1), 3 trim-level forbidden-source citations (cars.com, carbuzz.com, wikipedia — Blockers #2/3/4). All are leftover artifacts of GM consumer-/press-site outages during Phase 1 research and should be replaced once cadillac.com and media.cadillac.com are reachable.
- **Six msrp_range.high mismatches** (Blockers #5–#10) all stem from `msrp_range.high` being set to something other than the maximum `msrp_base` across the model's trims. Three are by $500 or less (Escalade/Escalade-ESV) suggesting stale-data drift; three are larger (LYRIQ/LYRIQ-V/OPTIQ $4–$12k off) suggesting confusion with package-loaded "starting from" pricing rather than the spec §3 rule of "use the lowest trim's `msrp_base` … computed from the trims."
- **gmauthority.com used 73 times** in trim sources — not an explicit denylist hit but worth replacing once GM's own press URLs are accessible (Warning #1).
- **LYRIQ Sport and OPTIQ Sport** are structured as singleton `sport` trim_families with separate `is_base_trim: true`, which matches the spec §7 singleton-family rule, but their `performance/dimensions/safety` blocks are left null instead of populated (Warning #2). Recommended fix is to copy the blocks from the Luxury sibling.
- **All 168 image URLs need scraping** — Phase 4 will resolve once GM consumer sites are reachable.
- **Sole-trim atomic rule** verified on CT4-V, CT4-V Blackwing, CT5-V, CT5-V Blackwing, LYRIQ-V, OPTIQ-V, Escalade-V, CELESTIQ (all 9 sole-trim model entries listed in STATUS) — confirmed `is_base_trim: true` + `delta_from_base: null`. VISTIQ Luxury family + LYRIQ/OPTIQ Sport singletons also confirmed.
- **Cross-trim sanity check passed** — no MSRP 50%+ outliers, no horsepower or dimension outliers across any model.
- **Body-style/cargo-volume consistency check passed** — sedans (CT4/CT5) have `trunk_cuft` populated; SUVs (XT5/LYRIQ/OPTIQ/VISTIQ/Escalade variants) have `behind_2nd_row`/`behind_1st_row` populated.
- **Recommendation: Address all 10 blockers before relying on this catalog for publication.** The dealer-source warranty URL is the most systematic (18 trims), the 6 msrp_range mismatches are 1-line numeric fixes, and the 3 individual forbidden-source URLs need replacement. The 4 warnings can be batched with the same fix pass.
