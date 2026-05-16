# Verification Report: Aston Martin

**Date:** 2026-05-12
**Data source:** `data/aston-martin.json` (researched 2026-05-12)
**Models checked:** 11
**Trims checked:** 13
**Trims sampled for source verification:** 3 (Vanquish Coupe, Vanquish Volante, Vantage Roadster)
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 0
- **Warnings:** 2
- **FYIs:** 4

---

## Blockers

*None.* Schema, MSRP integrity, base-trim counts, body-style taxonomy, delta-from-base references, sources-coverage-for-populated-blocks, body-cargo consistency, powertrain/ev_specifics consistency, EV-MPGe mirroring, and forbidden-source scan all pass programmatic check. The Phase 1 mid-batch source-cleanup pass appears to have been thorough for Aston Martin — no residual Motor1/Carbuzz/cars.com/autoblog/dealer-site citations were found anywhere in `sources` maps or `professional_reviews.links`.

---

## Warnings

### 1. Vantage Roadster — horsepower mismatch vs current astonmartin.com page

- **Model/trim:** Vantage Roadster (sole trim)
- **Issue:** Data records `powertrain.horsepower_hp: 656` (treating the Vantage Roadster as same engine output as the base Vantage Coupe). A fresh fetch of `https://www.astonmartin.com/en-us/models/vantage-roadster` today returns "Maximum Power: 680 PS / 670 BHP at 6000 rpm" — equivalent to the higher Vantage S figure. Either Aston Martin updated the Vantage Roadster to S-level output for MY26 (in which case the data is stale), or the consumer page is now showing Vantage S figures alongside the Roadster listing (in which case the data is correct and the page is ambiguous).
- **Found in:** `models[2].trims[0].powertrain.horsepower_hp` (656)
- **Source consulted:** https://www.astonmartin.com/en-us/models/vantage-roadster (WebFetch, 2026-05-12). Returns "680 PS / 670 BHP."
- **Recommendation:** Re-verify whether the 2026 MY Vantage Roadster ships at 656 hp (Vantage Coupe baseline) or 670 BHP / 680 PS (S spec). If updated, change to `horsepower_hp: 670` and update torque from 590 lb-ft accordingly; otherwise add a note explaining the page disambiguation. Top speed 202 mph and 0-62 mph 3.6 s on the page are consistent with the data's 0-60 of 3.5 s.

---

### 2. NHTSA / IIHS source URLs point to brand roll-up or root pages

- **Model/trim:** Every trim
- **Issue:** `sources.safety.nhtsa_overall_rating` is `https://www.nhtsa.gov/vehicle/2026/ASTON%20MARTIN` (the brand roll-up which lists every model with "no rating") and `sources.safety.iihs_top_safety_pick` is the IIHS ratings homepage. Per spec §4.4 these should be per-vehicle pages. The actual NHTSA/IIHS values are correctly `null` (neither agency tests Aston Martin), but the cited URLs don't pin to a model page that confirms "not rated."
- **Found in:** every trim's `sources.safety.*`
- **Value seen:** brand-roll-up and root-list URLs
- **Recommendation:** Either accept the brand-roll-up format and note in brand-level notes that "no per-vehicle NHTSA page exists for any Aston Martin," or replace each with the per-vehicle search URL (similar pattern to other zero-rated brands in this batch).

---

## FYIs

### 1. All 13 trims have null `msrp_base` and `destination_fee` — expected per batch context

- **Model/trim:** every trim
- **Note:** Per the batch context, Aston Martin does not publish US MSRPs on its consumer site or in accessible press releases — every trim's `notes` documents this and cites the spec §4 forbidden-source rule. `msrp_range.low/high` are correctly null on every model. Treated as FYI per the batch protocol; would otherwise be 13 BLOCKERs under the spec's strict §2 rule.

### 2. JD Power VDS / APEAL and Consumer Reports reliability all null with `confidence: "unknown"` — expected per batch context

- **Model/trim:** every model
- **Note:** Both `reliability` and `customer_satisfaction` are `unknown` confidence on every model — JD Power does not sample Aston Martin at US volumes. `professional_reviews` is "high" or "medium" and `owner_reviews` is "low" across the brand, so no model triggers the §2 "all-four-unknown" FYI rule.

### 3. NHTSA / IIHS ratings null on every model — expected per batch context

- **Model/trim:** every model
- **Note:** Neither agency crash-tests current Aston Martin vehicles. Trim notes explicitly document this. See Warning #2 for a related source-citation cleanup recommendation.

### 4. Vantage S and DB12 S share EPA fueleconomy.gov IDs with their non-S siblings

- **Model/trim:** Vantage S (uses ID 49773 = Vantage); DB12 S (uses ID 49780 = DB12)
- **Note:** Per STATUS.md, EPA has not published discrete entries for the S variants and Phase 1 set the source to the non-S EPA ID with a note. This is the EPA-unavailable fallback documented in spec §4. Vantage S and DB12 S `fuel_economy` blocks should reflect this — verify the notes call out the EPA-share explicitly. Mentioning so a future audit doesn't misread the shared ID as a copy-paste error.

---

## Coverage stats

- Models with >2 null spec blocks on base trim: **0**
- Trim families with <4 images: **0** (every family carries 4 angles)
- Models with all 4 review blocks at `confidence: "unknown"`: **0**
- Trims missing key sources entries for populated blocks: **0**

---

## Sample details

### Sampled trims for source verification

1. **Vanquish Coupe** — checked against `https://www.fueleconomy.gov/feg/noframes/49165.shtml` (EPA)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 13/21/16 — **PASS** (EPA matches exactly)
   - `fuel_economy.fuel_type_required: "premium"` — **PASS** (EPA confirms)
   - `powertrain.engine_displacement_l: 5.2` / `engine_config: "V12"` / `transmission: "8-speed automatic"` / `drivetrain: "RWD"` — **PASS** (EPA: "12 cyl, 5.2 L…Automatic 8-spd…rear-wheel drive")
   - `powertrain.aspiration: "twin_turbocharged"` — **PASS** (EPA notes "turbocharger" — Vanquish is twin-turbo V12; consistent)
   - Result: **PASS on every checked field**

2. **Vanquish Volante** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49166` (cited; EPA ID for Volante)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 13/20/16 — Not directly verified (the URL form used `action=sbs` and didn't render in WebFetch); the cited ID is the documented EPA entry for Vanquish Volante per STATUS.md
   - `powertrain.horsepower_hp: 824` / `torque_lb_ft: 738` — values consistent with Aston Martin's published Vanquish twin-turbo V12 output
   - Result: **PASS by association with Vanquish base + STATUS.md-documented EPA ID; live URL not verifiable in this pass due to fueleconomy.gov sbs-form gating**

3. **Vantage Roadster** — checked against `https://www.fueleconomy.gov/feg/noframes/49773.shtml` (EPA) and `https://www.astonmartin.com/en-us/models/vantage-roadster` (live)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 15/22/18 — **PASS** (EPA matches exactly)
   - `powertrain.engine_displacement_l: 4.0` / `engine_config: "V8"` / `transmission: "8-speed automatic"` / `drivetrain: "RWD"` — **PASS** (EPA confirms)
   - `powertrain.horsepower_hp: 656` — **MISMATCH** with current Aston Martin page (page now shows 680 PS / 670 BHP — see Warning #1)
   - `performance.zero_to_60_sec: 3.5` and `top_speed_mph: 202` — **PASS** (page: "3.6 s to 62 mph" ≈ 3.4-3.5 s to 60 mph; "202 mph")
   - Result: **PASS on most fields; horsepower mismatch flagged**

### Image URLs checked

All 5 sampled image entries had `needs_scraping: true` and pointed to astonmartin.com model pages (not direct asset URLs):

1. `https://www.astonmartin.com/en-us/models/db12-s` — DB12 S Coupe side_profile — `needs_scraping: true` (expected)
2. `https://www.astonmartin.com/en-us/models/db12` — DB12 Volante rear_three_quarter — `needs_scraping: true` (expected)
3. `https://www.astonmartin.com/en-us/models/vantage-coupe` — Vantage Coupe interior_dashboard — `needs_scraping: true` (expected)
4. `https://www.astonmartin.com/en-us/models/dbx707` — DBX707 side_profile — `needs_scraping: true` (expected)
5. `https://www.astonmartin.com/en-us/models/vanquish` — Vanquish Coupe front_three_quarter — `needs_scraping: true` (expected)

All consumer-page URLs returned data when sampled directly. No image URL failures flagged per batch protocol.

---

## Notes on this verification

- **This is the cleanest brand verified in this batch so far.** Zero blockers, two warnings, four FYIs — and the warnings are both low-severity (one spec mismatch to confirm, one source-citation cleanup pattern shared by all ultra-luxury brands in this batch).
- **astonmartin.com/en-us pages are reachable to WebFetch** unlike the lamborghini.com / rolls-roycemotorcars.com / tesla.com / acura.com pages, which all gated. This made the Vantage Roadster live spot-check possible.
- **EPA spot-checks were clean.** Both verifiable EPA IDs (49165 Vanquish, 49773 Vantage) matched the JSON values exactly on every checked field.
- **The Vantage Roadster horsepower question (Warning #1)** is the only substantive finding. It's worth a Phase 1 fix-pass investigation: confirm whether MY26 Vantage Roadster is base-spec (656 hp) or S-spec (670 BHP).
- **Forbidden-source scan returned zero hits.** Phase 1's mid-batch cleanup of dealer-site / content-farm citations appears to have been complete for Aston Martin.
- **Sole-trim atomic rule applied correctly** on 11 of 11 models. DB12 S and Vantage S each carry 2 body-style trims (Coupe + Volante / Coupe + Roadster) with the Coupe as base and Volante/Roadster as step-up — `delta_from_base.from_trim_slug` references resolve correctly.
- **All 52 image entries are `needs_scraping: true`** (consumer-page URLs) per the Phase 1 documentation in STATUS.md. Per batch protocol these are not image-URL failures.
