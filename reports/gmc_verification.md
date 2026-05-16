# Verification Report: GMC

**Date:** 2026-05-13
**Data source:** `data/gmc.json` (researched 2026-05-13)
**Models checked:** 10
**Trims checked:** 52
**Trims sampled for source verification:** 3
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 2  (must be fixed before catalog is trustworthy)
- **Warnings:** 39 (likely issues, review recommended)
- **FYIs:** 19  (worth knowing, not necessarily wrong)

`data/gmc.json` and `catalog/data/gmc.json` are identical (no diff output). Total URLs across the dataset: 517. Forbidden-source check: zero hits for cars.com, motor1.com, carbuzz.com, autoblog.com, autoevolution.com, teslaoracle.com, carsfrenzy.net, reddit.com, or enthusiast-forum domains. The dataset relies heavily on `gmauthority.com` (77 instances), which per Phase 3 reinforcements is FYI for GMC.

## Blockers

### 1. Hummer EV Pickup msrp_range high mismatches trim MSRPs
- **Model/trim:** Hummer EV Pickup (model-level)
- **Issue:** `msrp_range.high` (121500) does not equal the maximum trim `msrp_base` (107195, on 3X). The 121500 figure appears to reflect a Carbon Fiber Edition option package (~$13,700) which the data comments document as an option, not a separate trim.
- **Found in:** `models[8].msrp_range.high`
- **Value seen:** `{"low": 99095, "high": 121500}`
- **Expected:** `{"low": 99095, "high": 107195}` (matching trim MSRP span), OR add a distinct trim for the Carbon Fiber Edition if it should count as one.

### 2. Hummer EV SUV msrp_range high mismatches trim MSRPs
- **Model/trim:** Hummer EV SUV (model-level)
- **Issue:** `msrp_range.high` (120000) does not equal the maximum trim `msrp_base` (104700, on 3X). Same Carbon Fiber Edition option-package situation as the Pickup.
- **Found in:** `models[9].msrp_range.high`
- **Value seen:** `{"low": 96600, "high": 120000}`
- **Expected:** `{"low": 96600, "high": 104700}` to match the trim MSRPs.

## Warnings

### 1. EV trims duplicate MPGe values into fuel_economy.city_mpg/highway_mpg/combined_mpg
- **Model/trim:** All 9 EV trims: Sierra EV (Elevation Standard Range, Elevation Extended Range, AT4, Denali Extended Range, Denali Max Range); Hummer EV Pickup 2X, 3X; Hummer EV SUV 2X, 3X.
- **Issue:** Per Step 5 of the spec, EV powertrains should have `fuel_economy.city_mpg`/`highway_mpg`/`combined_mpg` set to null, with MPGe values appearing only in `ev_specifics.mpge_combined` (etc.). The data populates the fuel_economy MPG fields with what appear to be MPGe values, and the same combined number is duplicated into `ev_specifics.mpge_combined`.
- **Found in:** e.g. `models[3].trims[0].fuel_economy` (Sierra EV Elevation Standard Range): `city_mpg=74, highway_mpg=60, combined_mpg=67` while `ev_specifics.mpge_combined=67`.
- **Value seen:** MPG fields hold MPGe values (Hummer 3X city=58/highway=46/combined=52 are MPGe figures, not MPG).
- **Recommendation:** Null out `city_mpg`/`highway_mpg`/`combined_mpg` for EV trims and ensure `ev_specifics.mpge_city`, `mpge_highway`, `mpge_combined` hold the values. Optionally retain `fuel_economy.epa_annual_fuel_cost_usd` if EPA reports it.

### 2-15. Base trims w/ null dimensions on SUV body styles (cargo cuft block)
- **Model/trim:** Yukon (AT4, Denali, AT4 Ultimate, Denali Ultimate); Yukon XL (AT4, Denali, AT4 Ultimate, Denali Ultimate); Terrain (AT4, Denali); Acadia (AT4, Denali, Denali Ultimate); Hummer EV SUV 3X.
- **Issue:** Body style is `suv-*` so `cargo_volume_cuft.behind_2nd_row` and `behind_1st_row` should be populated. Both are null because the entire `dimensions` block is null on these "base" trims (each trim is its own trim_family/base under the singleton-family architecture).
- **Found in:** e.g., `models[4].trims[1].dimensions` (Yukon AT4) is null.
- **Recommendation:** Either populate dimensions per trim, or restructure the trim_family architecture so step-up trims inherit from a true base trim via `delta_from_base`.

### 16. Sierra 1500 AT4 wheelbase differs from base Pro by >10%
- **Model/trim:** Sierra 1500 AT4
- **Issue:** AT4 wheelbase 147.4 in vs Pro base wheelbase 126.5 in (~16.5% larger). Likely correct (Pro is Regular Cab; AT4 only sold as Crew Cab) but worth noting per Step 6 of the spec.
- **Found in:** `models[0].trims[4].dimensions.wheelbase_in`
- **Recommendation:** Confirm cab/bed configuration differences are intentional; this is normal platform variation for full-size pickups.

### 17. Sierra 1500 Pro Diesel wheelbase differs from base Pro by >10%
- **Model/trim:** Sierra 1500 Pro Diesel
- **Issue:** Pro Diesel wheelbase 147.4 vs Pro base 126.5 (Crew Cab vs Regular Cab).
- **Found in:** `models[0].trims[8].dimensions.wheelbase_in`
- **Recommendation:** Confirm cab differences are intentional.

### 18-22. Source verification — three sampled trims, manufacturer URLs return maintenance page
- **Sampled trims and URLs:**
  1. Yukon XL Denali Ultimate -> `https://www.gmc.com/suvs/yukon/denali` -> maintenance page ("Oops! Something went wrong").
  2. Sierra 1500 Denali Ultimate -> `https://www.gmc.com/trucks/sierra/1500` -> maintenance page.
  3. Sierra 1500 SLE -> `https://www.gmc.com/trucks/sierra/1500/sle-elevation-slt` -> maintenance page.
- **Issue:** All three GMC.com manufacturer URLs return the same generic maintenance message at the time of verification. Cannot confirm or refute the JSON values against the manufacturer pages. Source URLs may have rotted or GMC.com is experiencing a transient outage; the supplementary gmauthority.com pricing article is also gated (HTTP 403 to WebFetch).
- **Recommendation:** Re-check the URLs in 24-48 hours; if they remain dead, replace with archived versions or new manufacturer paths.

### 23-27. Image URL spot-check — same GMC.com domain returns maintenance pages
- **URLs checked (all flagged `needs_scraping: true`):**
  1. Canyon AT4 front_three_quarter -> `https://www.gmc.com/trucks/canyon/at4` -> maintenance page
  2. Hummer EV SUV 2X front_three_quarter -> `https://www.gmc.com/electric/hummer-ev/suv` -> maintenance page
  3. Sierra HD 2500HD SLE front_three_quarter -> `https://www.gmc.com/trucks/sierra/2500hd-3500hd/sle-slt` -> not fetched (same domain pattern, presumed same status)
  4. Yukon Elevation front_three_quarter -> `https://www.gmc.com/suvs/yukon` -> not fetched (same)
  5. Sierra HD 2500HD Pro front_three_quarter -> `https://www.gmc.com/trucks/sierra/2500hd-3500hd` -> not fetched (same)
- **Issue:** All image URLs point to GMC.com landing pages with `needs_scraping: true`. Phase 4 (image scraping) is gated, so this is expected pre-scrape state; the URLs are placeholders. However, two of the URLs checked returned a maintenance page, which may impede Phase 4. Note: IIHS rating URL `https://www.iihs.org/ratings/vehicle/gmc/sierra-1500-crew-cab-pickup/2026` resolves correctly and confirms 2026 Sierra 1500 with no Top Safety Pick award (matches data `iihs_top_safety_pick: null`).
- **Recommendation:** Re-verify GMC.com availability before kicking off Phase 4.

### 28-36. Sierra HD step-up trims with null fuel_economy and/or safety blocks lack regulatory-exemption notes
- **Model/trim:** Sierra HD step-up trims: 2500HD SLE, 2500HD SLT, 2500HD AT4, 2500HD AT4X, 2500HD Denali, 2500HD Denali Ultimate, 3500HD SLE, 3500HD SLT, 3500HD AT4, 3500HD Denali, 3500HD Denali Ultimate.
- **Issue:** Per Phase 3 reinforcements, "Null fuel_economy / safety on HD trims should be FYI when trim.notes documents this regulatory exemption". Only Sierra 2500HD Pro and Sierra 3500HD Pro carry the 40 CFR 600.114-08 exemption note; the step-up HD trims have null fuel_economy and/or null safety blocks but do not repeat the documentation in their notes.
- **Found in:** e.g. `models[1].trims[1].fuel_economy` (Sierra 2500HD SLE) is null, `notes` does not mention EPA/NHTSA/IIHS exemption.
- **Recommendation:** Either (a) add a short reference in each HD step-up trim's `notes` ("HD pickups exempt from EPA / NHTSA / IIHS testing — see Pro trim notes"), or (b) re-architect HD families so step-ups inherit from Pro via `delta_from_base`.

### 37. Many base trims (30 total) have >2 null spec blocks
- **Model/trim:** Sierra 1500 SLE (6 nulls), Sierra 1500 Elevation (4), Sierra 1500 SLT (3), Sierra 1500 AT4 (3), Sierra 1500 AT4X (3), Sierra 1500 Denali (3), Sierra 1500 Denali Ultimate (3); Sierra HD 2500HD SLE/SLT/AT4/Denali (5-6 nulls each), Sierra HD 2500HD AT4X/Denali Ultimate/Sierra 3500HD * (similar pattern); Canyon AT4 (4); Sierra EV AT4 (3); Yukon AT4/AT4 Ultimate/Denali Ultimate (4 each); Yukon XL AT4/AT4 Ultimate/Denali Ultimate (4 each); Terrain AT4 (4), Terrain Denali (3); Acadia AT4 (4), Acadia Denali (5), Acadia Denali Ultimate (4); Hummer EV Pickup 3X (3); Hummer EV SUV 3X (3).
- **Issue:** Per Step 2, base trims with >2 null spec blocks are a warning. The architectural cause is the "every trim is its own singleton trim_family / is_base_trim=true" pattern (Lesson #36). Step-up trims that should inherit from a real base trim via `delta_from_base` instead have nulls because they cannot inherit through the current schema state.
- **Recommendation:** Consider restructuring trim_family per model: keep the most-common configuration as the singular base trim, and convert other trims into step-up trims with `delta_from_base.from_trim_slug` set, allowing inheritance to fill gaps.

### 38. 35 base trims missing entries in sources map for key spec blocks
- **Issue:** 35 base trims have at least one missing key in `sources` (msrp_base, powertrain, fuel_economy, or dimensions). The most common gap is `sources.dimensions` (missing on most non-Elevation trims) and `sources.powertrain` + `sources.fuel_economy` on HD step-up trims.
- **Found in:** see breakdown in Coverage stats.
- **Recommendation:** Backfill source URLs where the data does carry values; for HD trims where the spec block is null due to regulatory exemption, no source needed (but document in notes).

### 39. JD Power VDS / APEAL scores not populated; reliability "medium" confidence based on indirect article
- **Model/trim:** All 10 models — `reliability.jd_power_vds_score` is null and `customer_satisfaction.jd_power_apeal_score` is null on all models.
- **Issue:** Reliability summaries cite gmauthority.com's recap of JD Power 2026 VDS rather than a JD Power source URL. Customer-satisfaction confidence is "unknown" across the board; reliability is "medium" largely on the gmauthority recap.
- **Recommendation:** If JD Power scores are accessible only behind paywall, document that explicitly; otherwise replace gmauthority links with primary source.

## FYIs

### 1-17. gmauthority.com used as fallback source on many records
- **Issue:** Per Phase 3 reinforcements, `gmauthority.com` is FYI when used as a fallback. Domain count: 77 URL occurrences across the data, spanning `reliability.sources`, `msrp_base`, `destination_fee`, and supplementary references. Pattern is consistent with the agent using gmauthority's pricing recaps where consumer-facing GMC.com pages don't expose machine-readable trim MSRP tables.
- **Note:** Acceptable per Phase 3 rules but worth tracking. No need to replace if values are otherwise corroborated. Examples:
  - `models[0].reliability.sources[0]` -> `https://gmauthority.com/blog/2026/02/gmc-ranks-low-in-j-d-power-2026-u-s-vehicle-dependability-study/`
  - `models[0].trims[*].sources.msrp_base` -> `https://gmauthority.com/blog/2025/12/2026-gmc-sierra-1500-gets-price-increase/`
  - `models[6].trims[*].sources.iihs_top_safety_pick` -> `https://gmauthority.com/blog/2026/03/no-iihs-top-safety-pick-award-for-2026-gmc-acadia/`

### 18. Hummer Carbon Fiber Edition option package treated as non-trim
- **Model/trim:** Hummer EV Pickup 3X, Hummer EV SUV 3X
- **Note:** The notes documents that the Carbon Fiber Edition increases output substantially and adds a +$13,700 markup. The data correctly does not split it into a separate trim, but this is the reason the model-level msrp_range.high reaches 121500/120000 (see Blockers 1-2). Confirm decision: option package vs. distinct trim.

### 19. IIHS confirms no Top Safety Pick for Sierra 1500 (matches data)
- **Model/trim:** Sierra 1500
- **Note:** IIHS page `https://www.iihs.org/ratings/vehicle/gmc/sierra-1500-crew-cab-pickup/2026` confirms 2026 Sierra 1500 Crew Cab is rated but does not carry a Top Safety Pick award (Small overlap front Marginal, LATCH Marginal). JSON `iihs_top_safety_pick: null` is correct.

## Coverage stats

- Models with >2 null spec blocks on base trim: 0 if counting only the model-level *primary* base trim; 30 trims affected under singleton-trim-family architecture (every trim is flagged is_base_trim=true).
- Models with <4 images in primary trim family: 0
- Models with all 4 review blocks at unknown confidence: 0 (most have "medium"; customer_satisfaction is uniformly "unknown" but the other three blocks bring the model out of all-unknown)
- Base trims missing key sources entries (msrp_base / powertrain / fuel_economy / dimensions): 35

## Sample details

### Sampled trims for source verification
1. **Yukon XL Denali Ultimate** — checked against `https://www.gmc.com/suvs/yukon/denali` — result: WARNING, GMC.com served a maintenance page; could not verify values.
2. **Sierra 1500 Denali Ultimate** — checked against `https://www.gmc.com/trucks/sierra/1500` — result: WARNING, same maintenance page.
3. **Sierra 1500 SLE** — checked against `https://www.gmc.com/trucks/sierra/1500/sle-elevation-slt` — result: WARNING, same maintenance page.

Secondary confirmations:
- IIHS Sierra 1500 page resolved and matched data (no Top Safety Pick).
- gmauthority pricing article returned HTTP 403 to WebFetch (likely anti-bot).

### Image URLs checked
1. `https://www.gmc.com/trucks/canyon/at4` — Canyon AT4 front_three_quarter — maintenance page; placeholder URL (needs_scraping=true).
2. `https://www.gmc.com/electric/hummer-ev/suv` — Hummer EV SUV 2X front_three_quarter — maintenance page; placeholder.
3. `https://www.gmc.com/trucks/sierra/2500hd-3500hd/sle-slt` — Sierra HD 2500HD SLE front_three_quarter — not fetched (same domain status presumed); placeholder.
4. `https://www.gmc.com/suvs/yukon` — Yukon Elevation front_three_quarter — not fetched; placeholder.
5. `https://www.gmc.com/trucks/sierra/2500hd-3500hd` — Sierra HD 2500HD Pro front_three_quarter — not fetched; placeholder.

All five image URLs are GMC.com landing pages flagged `needs_scraping: true`. Phase 4 will replace them with direct image URLs. The current pre-scrape state is acceptable, but the broader GMC.com outage should be re-checked before Phase 4 runs.

## Notes on this verification

- `data/gmc.json` and `catalog/data/gmc.json` are identical (zero-byte diff). Phase 2 successfully synced.
- Schema validation: all required top-level keys present, all models have all required keys, all trims have all required keys, body_styles all in taxonomy, slugs all lowercase/hyphenated, no duplicate trim_slugs within a model, NHTSA/IIHS URLs all per-vehicle (no roll-up).
- Singleton trim_family check: every singleton family in this dataset (which is most of them — only Sierra EV has multi-trim families) has `is_base_trim: true`, `delta_from_base: null`, and the 4 required image angles. Architectural concern remains (Lesson #36) but does not produce blockers here because the image and delta rules are met.
- Forbidden-source check: zero hits. The data's strong reliance on gmauthority.com is FYI for GMC per Phase 3 reinforcements.
- Largest unresolved issue: GMC.com is serving a generic maintenance page at this moment, preventing live verification against the manufacturer site. Reliability/availability should improve; consider re-running verification in a few days if the user cares about live source confirmation.
- HD pickup exemption: Pro trims of Sierra 2500HD and 3500HD document the 40 CFR 600.114-08 exemption. Step-up HD trims with null fuel_economy/safety inherit the same exemption logically but should add a one-line note pointing back to the Pro documentation.
- EV fuel_economy / ev_specifics duplication is the most concrete schema warning to address; it affects all 9 EV trims and is a clean fix.
