# Verification Report: Polestar

**Date:** 2026-05-13
**Data source:** `data/polestar.json` (researched 2026-05-13)
**Models checked:** 2 (Polestar 3, Polestar 4)
**Trims checked:** 6
**Trims sampled for source verification:** 3
**Image URLs spot-checked:** 5

`data/polestar.json` and `catalog/data/polestar.json` are byte-identical (verified via cmp).

---

## Summary

- **Blockers:** 0
- **Warnings:** 6
- **FYIs:** 5

## Blockers

None. No forbidden-source URLs (cars.com, motor1.com, carbuzz.com, autoblog.com, autoevolution.com, teslaoracle.com, carsfrenzy.net, dealer-pattern, reddit, enthusiast forums) appear in any `sources` map or `professional_reviews.links`. Schema-required keys are present on both models and all six trims. `msrp_range.low`/`.high` match min/max of trim `msrp_base` on both models. `delta_from_base.from_trim_slug` references resolve for all step-up trims. No singleton `trim_family` groups exist (each family has 3 trims), so the singleton rule does not trigger.

## Warnings

### 1. EV trims populate fuel_economy.city_mpg/highway_mpg/combined_mpg with MPGe values

- **Model/trim:** All 6 trims across Polestar 3 and Polestar 4
- **Issue:** Step 5 internal-consistency rule and the reinforcement state that for `powertrain.type == "ev"`, `fuel_economy.city_mpg`, `.highway_mpg`, and `.combined_mpg` should be `null`, with the MPGe values living only in `ev_specifics.mpge_combined`. Polestar trims populate both: `fuel_economy.combined_mpg` mirrors `ev_specifics.mpge_combined` (e.g., 95/95, 90/90, 81/81, 95/95, 85/85, 77/77).
- **Found in:** `models[0].trims[0].fuel_economy.city_mpg|highway_mpg|combined_mpg`, `models[0].trims[1].fuel_economy.*`, `models[0].trims[2].fuel_economy.*`, `models[1].trims[0].fuel_economy.*`, `models[1].trims[1].fuel_economy.*`, `models[1].trims[2].fuel_economy.*`
- **Value seen (sample, Polestar 3 LR Single Motor):** `fuel_economy.city_mpg: 102`, `highway_mpg: 88`, `combined_mpg: 95`; `ev_specifics.mpge_combined: 95`
- **Source consulted:** fueleconomy.gov entry 50232 (confirms 95 combined MPGe for that variant; site labels EVs as MPGe, not MPG)
- **Recommendation:** Null out the three `fuel_economy.*_mpg` fields on every EV trim; the MPGe value is already mirrored in `ev_specifics.mpge_combined`. Retain `fuel_type_required: "electricity"` and `epa_annual_fuel_cost_usd`.

### 2. NHTSA/IIHS source URLs are roll-up search pages, not per-vehicle pages

- **Model/trim:** Polestar 3 Long Range Single Motor; Polestar 4 Long Range Single Motor (the two base trims that carry the `safety` block)
- **Issue:** `sources.safety.nhtsa_overall_rating` points to `https://www.nhtsa.gov/ratings` and `sources.safety.iihs_top_safety_pick` points to `https://www.iihs.org/ratings`. Both are top-level roll-up search pages, not per-vehicle pages. Polestar is luxury but not on the special-case list (rolls-royce, aston-martin, ferrari, lamborghini, bentley, mclaren, lotus, bugatti), so Step 5 treats this as WARNING. The reinforcement says "Polestar is low-volume luxury EV — null NHTSA/IIHS with notes documenting non-testing would warrant FYI. Without notes, WARNING." Notes ARE present documenting non-testing, so the null ratings themselves are correctly FYI (see FYI #4); the URLs being roll-ups is the separate issue captured here.
- **Found in:** `models[0].trims[0].sources["safety.nhtsa_overall_rating"]`, `models[0].trims[0].sources["safety.iihs_top_safety_pick"]`, `models[1].trims[0].sources["safety.nhtsa_overall_rating"]`, `models[1].trims[0].sources["safety.iihs_top_safety_pick"]`
- **Value seen:** `"https://www.nhtsa.gov/ratings"` and `"https://www.iihs.org/ratings"`
- **Source consulted:** none required (URL form is self-describing)
- **Recommendation:** Since NHTSA/IIHS have not tested either Polestar 3 or Polestar 4, the per-vehicle page does not exist. Either drop the source URLs (since the corresponding rating values are null and `notes` already documents non-testing) or replace with a search URL specific to the model (e.g., `https://www.nhtsa.gov/vehicle-manufacturers/polestar`).

### 3. Step-up trims missing sources entries for ev_specifics block

- **Model/trim:** Polestar 3 LR Dual Motor; Polestar 3 LR Dual Motor with Performance Pack; Polestar 4 LR Dual Motor; Polestar 4 LR Dual Motor with Performance Pack
- **Issue:** Each step-up trim has a populated `ev_specifics` block (battery, range, charging, MPGe) but no `sources.ev_specifics` entry. The fueleconomy.gov URL under `sources.fuel_economy` is the de facto support for range/MPGe, but battery capacity and charging specs trace back to Polestar's specifications page and that is not separately cited.
- **Found in:** `models[0].trims[1].sources`, `models[0].trims[2].sources`, `models[1].trims[1].sources`, `models[1].trims[2].sources`
- **Value seen:** sources map has `msrp_base`, `powertrain`, `fuel_economy`, `performance.zero_to_60_sec`, `dimensions` — no `ev_specifics` entry
- **Recommendation:** Add `"ev_specifics": "https://www.polestar.com/us/polestar-3/specifications/"` (and equivalent for Polestar 4) to each step-up trim's sources map.

### 4. Polestar 3 LR Single Motor warranty source points to Polestar 4 URL

- **Model/trim:** Polestar 3 Long Range Single Motor
- **Issue:** `sources.warranty` for the Polestar 3 base trim cites `https://www.polestar.com/us/polestar-4/warranty-and-service/`. The trim's `notes` field already calls this out ("Warranty cited from Polestar 4 warranty-and-service page, which uses standard Polestar warranty terms applied brand-wide"), but as a source URL on the Polestar 3 it is the wrong vehicle page.
- **Found in:** `models[0].trims[0].sources.warranty`
- **Value seen:** `"https://www.polestar.com/us/polestar-4/warranty-and-service/"`
- **Recommendation:** Replace with the Polestar 3 warranty page if one exists (e.g., `https://www.polestar.com/us/polestar-3/warranty-and-service/`), or with a brand-wide warranty page.

### 5. Image URL field points to landing pages, not direct image URLs

- **Model/trim:** All 6 trims (every `images[].url` value)
- **Issue:** Every image entry uses the model landing page URL (`https://www.polestar.com/us/polestar-3/` or `https://www.polestar.com/us/polestar-4`) rather than a direct CDN image URL. The `needs_scraping: true` flag is correctly set, and `notes` on both models acknowledges JS-rendering, so Phase 4 will need to scrape these. The landing pages do load and contain Polestar 3 / Polestar 4 imagery (confirmed by WebFetch), but a HEAD on these URLs returns HTML, not an image content type.
- **Found in:** `models[0].trims[*].images[*].url`, `models[1].trims[*].images[*].url`
- **Value seen:** `"https://www.polestar.com/us/polestar-3/"` and `"https://www.polestar.com/us/polestar-4"` repeated across all image entries
- **Recommendation:** Resolve in Phase 4 by running the scraper; this is expected scaffolding rather than a defect, but is flagged so it is not missed.

### 6. Polestar 4 base trim missing rear_three_quarter / side_profile / interior_dashboard URL on direct page (informational, no schema violation)

- **Model/trim:** Polestar 4 Long Range Single Motor
- **Issue:** All four required image angles are present in the base trim's `images` array (front_three_quarter, rear_three_quarter, side_profile, interior_dashboard) so the singleton/required-angle rule is satisfied. However, all four point at the same landing-page URL `https://www.polestar.com/us/polestar-4` (note: no trailing slash), where the Polestar 3 equivalents use `https://www.polestar.com/us/polestar-3/` (trailing slash). Minor inconsistency.
- **Found in:** `models[1].trims[0].images[*].url`
- **Recommendation:** Normalize trailing slash for consistency before Phase 4 scraping.

## FYIs

### 1. JD Power VDS / APEAL not published for Polestar

- **Model/trim:** Polestar 3 and Polestar 4 (both models)
- **Note:** Both `reliability.jd_power_vds_score` and `customer_satisfaction.jd_power_apeal_score` are null with the explanatory summary "JD Power Vehicle Dependability Study/APEAL does not publish results for Polestar due to low US sales volume." This is the correct state of the data for a low-volume luxury EV brand. Confidence "unknown" on both blocks reflects this honestly.

### 2. Consumer Reports predicted reliability not published

- **Model/trim:** Polestar 3 and Polestar 4
- **Note:** `reliability.consumer_reports_predicted_reliability: null` for both models. Summary documents that CR has not yet published. Correct given Polestar's volume and CR's coverage cadence.

### 3. All four model-level review blocks at unknown/low confidence

- **Model/trim:** Polestar 3 and Polestar 4
- **Note:** `reliability.confidence: "unknown"`, `customer_satisfaction.confidence: "unknown"`, `professional_reviews.confidence: "medium"`, `owner_reviews.confidence: "low"`. Three of four blocks are unknown/low — likely accurate for a brand this small in the US, but flagged per Step 2 rules. Owner-review sample sizes are explicitly noted (Edmunds 13 reviews, KBB 4 reviews).

### 4. NHTSA / IIHS not tested for either model

- **Model/trim:** Polestar 3 Long Range Single Motor; Polestar 4 Long Range Single Motor
- **Note:** Both `safety.nhtsa_overall_rating` and `safety.iihs_top_safety_pick` are null. `notes` explicitly documents "NHTSA has not rated the 2026 Polestar 3, and IIHS has not crash-tested any Polestar 3 model year" and equivalent for Polestar 4. Per the reinforcement, null with documenting notes warrants FYI for a low-volume luxury EV.

### 5. Polestar 2 dropped from US new-car sales

- **Model/trim:** Brand-level (not in data)
- **Note:** The dataset includes only Polestar 3 and Polestar 4. Per the task brief, Polestar 2 has been dropped from US new-car sales, so its omission is correct.

## Coverage stats

- Models with >2 null spec blocks on base trim: **0** (Polestar 3 LRSM and Polestar 4 LRSM each have only `safety.nhtsa_overall_rating` and `safety.iihs_top_safety_pick` null inside `safety`, but all spec block roots are populated)
- Models with <4 images in primary trim family: **0** (each base trim has all 4 required angles; step-up trims share via `is_shared_with_trim_family: true`)
- Models with all 4 review blocks at unknown confidence: **0** (professional_reviews is "medium" on both)
- Trims missing key sources entries: **4** (all step-up trims missing `ev_specifics` source — see Warning #3); step-up trims correctly omit `safety`/`features`/`warranty` sources because those spec blocks are explicitly null and inherited via `notes`.

## Sample details

### Sampled trims for source verification

1. **Polestar 3 Long Range Single Motor** — checked against `https://www.polestar.com/us/polestar-3/specifications/` and `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=50232` — result: PASS. MSRP $67,500 matches; 299 hp matches; 0-60 7.5s matches; length 192.9 / width 77.4 matches; curb weight 5,298 lb is the bottom of manufacturer's 5,298-5,445 lb range, acceptable. EPA: 95 combined MPGe and 286 mi range match.
2. **Polestar 3 Long Range Dual Motor** — checked against `https://www.polestar.com/us/polestar-3/specifications/` and `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=50229` — result: PASS. MSRP $73,400 matches; 489 hp matches; 0-60 4.8s matches; length/width match. EPA: 90 combined MPGe and 312 mi range match for the 21-inch wheel variant.
3. **Polestar 4 Long Range Single Motor** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=50033` — result: PASS. EPA: 95 combined MPGe and 310 mi range match.

### Image URLs checked

1. `https://www.polestar.com/us/polestar-3/` — Polestar 3 LRSM — front_three_quarter — page loads, contains Polestar 3 imagery; returns HTML (not direct image). Phase 4 scraping required (`needs_scraping: true` is set).
2. `https://www.polestar.com/us/polestar-3/` — Polestar 3 LRSM — rear_three_quarter — same URL, same result.
3. `https://www.polestar.com/us/polestar-3/` — Polestar 3 LRSM — side_profile — same URL, same result.
4. `https://www.polestar.com/us/polestar-4` — Polestar 4 LRSM — front_three_quarter — page loads, contains Polestar 4 imagery; returns HTML. Phase 4 scraping required.
5. `https://www.polestar.com/us/polestar-4` — Polestar 4 LRSM — interior_dashboard — same URL, same result.

## Notes on this verification

- Source verification was efficient: Polestar's own specifications pages render at least the trim summary content to WebFetch, and fueleconomy.gov entries resolved cleanly. Manufacturer MSRP, horsepower, 0-60, and dimensions all match published values; EPA range and MPGe match the wheel-specific entries selected by the researcher.
- Polestar is EV-only. The most consequential finding is the dual-population of MPGe values into both `fuel_economy.combined_mpg` and `ev_specifics.mpge_combined` (Warning #1) — this is a recurring pattern flagged here for the project's EV-trim convention rather than a Polestar-specific defect.
- Polestar 4 is described in marketing materials as a "coupe-styled SUV." The dataset's `body_style: "suv-midsize"` is the closest fixed-taxonomy match and is acceptable.
- The Polestar 3 trim `notes` correctly documents the wheel-variant EPA entries (50232 vs 50233 for LRSM, 50229 vs 50230 for LRDM) and explains why the more conservative figures were chosen — useful provenance.
- No forbidden-source URLs found anywhere in the brand JSON.
- Verification completed within budget; no source rot encountered.
