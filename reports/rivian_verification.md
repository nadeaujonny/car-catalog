# Verification Report: Rivian

**Date:** 2026-05-13
**Data source:** `data/rivian.json` (researched 2026-05-13)
**Models checked:** 3 (R1T, R1S, R2)
**Trims checked:** 10 (R1T: 5, R1S: 4, R2: 1)
**Trims sampled for source verification:** 3 (R1T Dual Standard, R1S Dual Large, R1T/R1S Quad Max via rivian.com/quad)
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 2
- **Warnings:** 8
- **FYIs:** 6

`data/rivian.json` and `catalog/data/rivian.json` are byte-identical (SHA-256 match) — Phase 2 parity confirmed.

## Blockers

### 1. R1T Quad Max msrp_base does not match rivian.com (now $119,990)
- **Model/trim:** R1T Quad Max
- **Issue:** Rivian's live Quad-Motor product page (https://rivian.com/quad) currently lists the R1T Quad starting at $119,990, but JSON records $115,990.
- **Found in:** `models[0].trims[4].msrp_base`
- **Value seen:** `115990`
- **Expected:** `119990` (per https://rivian.com/quad accessed 2026-05-13; also reflected in `msrp_range.high` for R1T which is `115990` — would need to update to `119990`).

### 2. R1S Quad Max msrp_base does not match rivian.com (now $125,990)
- **Model/trim:** R1S Quad Max
- **Issue:** Rivian's live Quad-Motor product page lists the R1S Quad starting at $125,990, but JSON records $121,990.
- **Found in:** `models[1].trims[3].msrp_base`
- **Value seen:** `121990`
- **Expected:** `125990` (per https://rivian.com/quad accessed 2026-05-13; `msrp_range.high` for R1S would also need to update to `125990`).

## Warnings

### 1. Non-primary EV-fan/news domain used for R1T IIHS source
- **Model/trim:** R1T Dual Standard
- **Issue:** `safety.iihs_top_safety_pick` cites `eletric-vehicles.com` (note: domain is misspelled "eletric" vs "electric"); per project conventions, EV-focused fan/news sites are not primary sources. The R1S source by contrast points correctly at `iihs.org/ratings/vehicle/rivian/r1s-4-door-suv/2026`.
- **Found in:** `models[0].trims[0].sources["safety.iihs_top_safety_pick"]`
- **Value seen:** `"https://eletric-vehicles.com/rivian/rivians-r1s-earns-top-iihs-rating-while-r1t-falls-short-under-tougher-rules/"`
- **Source consulted:** n/a (per-vehicle IIHS R1T 2026 page exists at iihs.org/ratings/vehicle/rivian/r1t-crew-cab-pickup/2026)
- **Recommendation:** Replace with the primary IIHS per-vehicle URL.

### 2. Non-primary source for R1T dimensions
- **Model/trim:** R1T Dual Standard
- **Issue:** `dimensions` source is `iseecars.com`, an aggregator, not primary.
- **Found in:** `models[0].trims[0].sources.dimensions`
- **Value seen:** `"https://www.iseecars.com/car/rivian-r1t-dimensions"`
- **Recommendation:** Use Rivian's specs PDF or rivian.com/r1t spec section directly.

### 3. Non-primary source for R1S dimensions
- **Model/trim:** R1S Dual Large
- **Issue:** Same pattern — `iseecars.com` aggregator used for dimensions.
- **Found in:** `models[1].trims[0].sources.dimensions`
- **Value seen:** `"https://www.iseecars.com/car/rivian-r1s-dimensions"`
- **Recommendation:** Replace with rivian.com/r1s spec section.

### 4. Unknown/non-primary source for R1T Dual Max towing capacity
- **Model/trim:** R1T Dual Max
- **Issue:** `performance.towing_capacity_lb` cites `carscounsel.com` — not on the forbidden list but not an established primary source either.
- **Found in:** `models[0].trims[2].sources["performance.towing_capacity_lb"]`
- **Value seen:** `"https://carscounsel.com/rivian-r1t-towing-capacity/"`
- **Recommendation:** Cross-reference rivian.com/r1t which publishes 11,000 lb towing for Max-pack trims; replace source URL.

### 5. EV-focused news domain used as primary R2 dimensions source
- **Model/trim:** R2 Performance Launch Edition
- **Issue:** `dimensions` source is `insideevs.com`. Per user reinforcement, InsideEVs is WARNING (not primary).
- **Found in:** `models[2].trims[0].sources.dimensions`
- **Value seen:** `"https://insideevs.com/news/789597/rivian-r2-launch-pricing-specs-2026/"`
- **Recommendation:** Replace with rivian.com/r2 spec page once Rivian publishes finalized R2 dimensions, or with the SAE-format Car and Driver tested page if rivian.com has not published them.

### 6. R2 sources rely heavily on EV-focused news (Electrek, InsideEVs, TechCrunch)
- **Model/trim:** R2 Performance Launch Edition
- **Issue:** All 3 `professional_reviews.links` entries are EV-news/tech-press, and the EPA-equivalent data is sourced from these sites because fueleconomy.gov has no R2 entry yet. Per user reinforcement, these are EV-news/fan sites and not primary.
- **Found in:** `models[2].professional_reviews.links`, `models[2].trims[0].sources.fuel_economy`
- **Value seen:** electrek.co, insideevs.com, techcrunch.com
- **Recommendation:** Once EPA publishes 2026 R2 entries on fueleconomy.gov, switch sources to fueleconomy.gov per-vehicle. The notes already document this fallback ("EPA-unavailable fallback rule"); acceptable for now but flagged.

### 7. NHTSA null on all Rivian trims with no per-vehicle URL
- **Model/trim:** All Rivian trims (R1T, R1S, R2 base trims with safety blocks populated)
- **Issue:** `safety.nhtsa_overall_rating` is null and no NHTSA per-vehicle URL is recorded in `sources`. Per the spec, NHTSA roll-up URLs are WARNING for mainstream brands. Here NHTSA has never crash-tested any Rivian, so no per-vehicle page exists — but no URL whatsoever is recorded.
- **Found in:** `models[0].trims[0].safety` (R1T Dual Standard); `models[1].trims[0].safety` (R1S Dual Large); `models[2].trims[0].safety` (R2)
- **Value seen:** No `safety.nhtsa_overall_rating` source URL in `sources` map.
- **Recommendation:** Add a `safety.nhtsa_overall_rating` source URL pointing to nhtsa.gov's brand/model page (even if it reports no NCAP rating); the JSON notes correctly explain why the rating is null, but a source URL would strengthen the documentation.

### 8. Image landing pages are HTML pages (not image URLs)
- **Model/trim:** All trims, all image entries
- **Issue:** Every image URL points to `https://rivian.com/r1t`, `/r1s`, `/r2`, or `/quad` — these are HTML product pages, not image asset URLs (`Content-Type: text/html`). All have `needs_scraping: true` which is correct, but Phase 4 scraping is required before they become valid image URLs.
- **Found in:** all `models[*].trims[*].images[*].url`
- **Value seen:** HTTP 200 / text/html on all 5 sampled pages
- **Recommendation:** Phase 4 image scraping is the next gating step (per instructions, Phase 4 was explicitly gated for this verification run).

## FYIs

### 1. NHTSA never crash-tested any Rivian under NCAP
- **Model/trim:** R1T, R1S, R2 (all)
- **Note:** Notes on R1T Dual Standard and R1S Dual Large document this clearly. `nhtsa_overall_rating: null` is the honest state of the data. Not a defect.

### 2. R1T 2025 TSP retained, 2026 TSP not awarded — JSON correctly captures
- **Model/trim:** R1T Dual Standard
- **Note:** `iihs_top_safety_pick: "TSP"`, `iihs_rating_year: 2025` correctly reflects that the R1T was downgraded in 2026 (Acceptable moderate-overlap), and the notes field documents this. Aligns with user reinforcement.

### 3. R1S earned 2026 TSP+ — JSON correctly captures
- **Model/trim:** R1S Dual Large
- **Note:** `iihs_top_safety_pick: "TSP+"`, `iihs_rating_year: 2026`. Confirmed against IIHS per-vehicle page at iihs.org/ratings/vehicle/rivian/r1s-4-door-suv/2026 (HTTP 200; page shows TSP+).

### 4. R2 IIHS / NHTSA null with notes — appropriate per user reinforcement
- **Model/trim:** R2 Performance Launch Edition
- **Note:** Both NHTSA and IIHS ratings are null with explanatory notes ("R2 not yet IIHS-rated"). Per user reinforcement, null with notes warrants FYI for R2 only. Confirmed.

### 5. JD Power VDS / APEAL unavailable for Rivian — confidence:unknown is expected
- **Model/trim:** R1T, R1S, R2 (all models)
- **Note:** `jd_power_vds_score: null`, `jd_power_apeal_score: null` with `confidence: unknown` on `customer_satisfaction` blocks. Documented as JD Power not publishing Rivian results due to low sales / new brand. Per user reinforcement, this is FYI not a defect.

### 6. Performance Upgrade software pack documented as configuration (not separate trim)
- **Model/trim:** R1T Dual Large, R1T Dual Max, R1S Dual Large, R1S Dual Max
- **Note:** The notes fields document that the $5,000 Performance Upgrade pack increases output to 665 hp / 829 lb-ft and drops 0-60 to 3.4s but is treated as a configuration option per spec §6, not a separate trim. EPA lists Performance variants as distinct ids. This is the correct call but worth surfacing — a future audit might re-evaluate whether these should be split out.

## Coverage stats

- Models with >2 null spec blocks on base trim: **0** (R1T Dual Standard, R1S Dual Large, R2 Performance Launch Edition all have full spec blocks populated; R2 has fuel_economy with all-null values inside it but the block itself is present, with notes explaining EPA-pending status).
- Models with <4 images on primary trim: **0** (R1T Dual Standard, R1S Dual Large, R2 Performance Launch Edition each have all 4 required angles).
- Models with all 4 review blocks at unknown confidence: **0** (R2 has 3 of 4 at unknown — reliability, customer_satisfaction, owner_reviews — but professional_reviews is medium; R1T and R1S have reliability:low, professional_reviews:medium, owner_reviews:low).
- Trims missing key sources entries: **0 critical, but multiple step-up trims have minimal sources maps** — Dual Large/Dual Max/Tri Max/Quad Max trims on both R1T and R1S typically only record `msrp_base`, `fuel_economy`, `powertrain`, `warranty` (no `dimensions`, `safety`, `features` sources). This is consistent with the Phase 1 convention of step-up trims inheriting from base where blocks are not duplicated, so not flagged as a defect.

## Sample details

### Sampled trims for source verification
1. **R1T Dual Standard** — checked against `https://rivian.com/r1t` (page resolves, title "Rivian R1T Electric Truck: Price, Range & Features"). Cross-checked EPA on `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49691` which confirmed: 270 mi range, 85 combined MPGe, 92 city, 77 highway, 2026 Rivian R1T Dual Standard (22in). **Result: PASS** on powertrain/range/MPGe; URLs resolve. Note: full MSRP not extractable from product-page snippet (page is JS-driven), but EPA page corroborates the trim identity.
2. **R1S Dual Large** — checked against `https://rivian.com/r1s` (page resolves, title "Rivian R1S Electric SUV: Price, Range & Features"). IIHS check against `https://www.iihs.org/ratings/vehicle/rivian/r1s-4-door-suv/2026` confirmed TSP+ for 2026 R1S. **Result: PASS** on IIHS rating; URLs resolve.
3. **R1T Quad Max + R1S Quad Max** — checked against `https://rivian.com/quad`. **Result: 2 BLOCKERS** (pricing mismatches identified above). Horsepower (1,025 hp) confirmed for both trims; Rivian's product page also confirms the Quad product page exists and lists current pricing.

### Image URLs checked
1. `https://rivian.com/r1t` — R1T Dual Standard front_three_quarter — HTTP 200, Content-Type text/html (landing page, not image; needs_scraping:true is correctly set)
2. `https://rivian.com/r1s` — R1S Dual Large front_three_quarter — HTTP 200, text/html
3. `https://rivian.com/r2` — R2 Performance Launch Edition front_three_quarter — HTTP 200, text/html
4. `https://rivian.com/quad` — R1T Quad Max front_three_quarter — HTTP 200, text/html
5. `https://rivian.com/quad/buy` — R1T Quad Max sources.msrp_base — HTTP 200, text/html

All five resolve; none currently serve image content. Phase 4 scraping is the gating next step.

## Notes on this verification

- **Forbidden-source check:** No forbidden URLs found in the data file. The 8 listed forbidden domains (cars.com, motor1.com, carbuzz.com, autoblog.com, autoevolution.com, teslaoracle.com, carsfrenzy.net, reddit.com/enthusiast forums) returned zero hits across `data/rivian.json`. Several non-primary aggregator/news domains were used (iseecars.com, carscounsel.com, eletric-vehicles.com, electrek.co, insideevs.com, techcrunch.com); per user reinforcement, EV-focused news sites are flagged as WARNING (not BLOCKER).
- **Critical findings:** Two pricing mismatches against the live Rivian Quad product page (R1T Quad Max $115,990 in JSON vs $119,990 live; R1S Quad Max $121,990 vs $125,990 live). Both trims' associated `msrp_range.high` values are also affected and would need to update if the live prices are correct (it's possible Rivian raised Quad pricing post-research; the research date and verification date are both 2026-05-13, but the data may have been captured earlier in the day or the Rivian site updated mid-day).
- **EV-only conformance:** All trims correctly set `powertrain.type: "ev"`, `ev_specifics` populated, no ICE-only fields populated. R2 correctly omits `mpge_combined` and the fuel_economy block has city/highway/combined as null (EPA pending), per user reinforcement.
- **Schema extensions:** R1T trims use the truck-extension cargo fields (`bed_length_in`, `bed_volume_cuft`, `frunk_cuft`, `gear_tunnel_cuft`); R1S and R2 use SUV-extension fields (`frunk_cuft` only). Documented in notes per spec.
- **trim_family architecture:** R1T (5 trims, all family "r1t"), R1S (4 trims, all "r1s"), R2 (1 trim, "r2"). R2 is the only singleton trim_family, has `is_base_trim:true`, `delta_from_base:null`, and 4 image angles. PASS. R1T and R1S are non-singleton with base trim carrying 4 angles and step-up trims set to `is_shared_with_trim_family:true` — correct per session 3 convention noted by user.
- **msrp_range consistency:** All three models' `msrp_range.low`/`high` match min/max of their trims' `msrp_base` values (modulo the two pricing-mismatch blockers, which would also propagate to `msrp_range.high` for R1T and R1S).
- **delta_from_base references:** All step-up `delta_from_base.from_trim_slug` values reference trims that exist in the same model (R1T step-ups all reference `dual-standard`; R1S step-ups all reference `dual-large`). PASS.
- **Body-style cargo conformance:** R1T (pickup-full-size) uses bed-cargo fields and nulls trunk/behind-row — correct. R1S (suv-3row) and R2 (suv-midsize) populate behind_2nd_row/behind_1st_row and null trunk_cuft — correct.
- **Cross-trim outliers:** No msrp_base or horsepower outliers detected. Dimension differences across trims of the same model stay within 10% (curb weight grows ~5% on R1T, ~1% on R1S due to battery pack and motor count).
- **Phase 4 gating respected:** No image scraping or downloading run. Image URLs remain landing-page placeholders with `needs_scraping:true`.
