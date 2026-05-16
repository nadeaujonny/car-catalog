# Verification Report: Rolls-Royce

**Date:** 2026-05-12
**Data source:** `data/rolls-royce.json` (researched 2026-05-12)
**Models checked:** 7
**Trims checked:** 9
**Trims sampled for source verification:** 3 (Spectre, Ghost, Ghost Extended)
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 1 (covers 8 residual forbidden-source citations)
- **Warnings:** 1
- **FYIs:** 4

---

## Blockers

### 1. Residual forbidden-source citations in trim `sources.dimensions` (8 entries across 7 trims)

- **Models/trims affected:** Phantom (base), Ghost (base), Ghost Black Badge, Spectre, Spectre Black Badge, Cullinan, Cullinan Black Badge — each cites `www.cars.com`; Ghost Extended cites `rollsroycepasadena.com` (a dealer site, also on the forbidden list)
- **Issue:** Per spec §4 and this batch's source-cleanup pass, www.cars.com and dealer sites are forbidden as primary sources. The mid-batch cleanup removed dealer-site / content-farm citations from elsewhere but left the `sources.dimensions` URLs in place across the brand.
- **Found in:**
  - `models[0].trims[0].sources.dimensions` → `https://www.cars.com/research/rolls_royce-phantom-2026/specs/`
  - `models[1].trims[0].sources.dimensions` → `https://www.cars.com/research/rolls_royce-ghost-2026/specs/`
  - `models[1].trims[1].sources.dimensions` → `https://www.rollsroycepasadena.com/rolls-royce-information/ghost-extended-series-specs/` (dealer site)
  - `models[2].trims[0].sources.dimensions` → `https://www.cars.com/research/rolls_royce-ghost-2026/specs/`
  - `models[3].trims[0].sources.dimensions` → `https://www.cars.com/research/rolls_royce-spectre-2026/specs/`
  - `models[4].trims[0].sources.dimensions` → `https://www.cars.com/research/rolls_royce-spectre-2026/specs/`
  - `models[5].trims[0].sources.dimensions` → `https://www.cars.com/research/rolls_royce-cullinan-2026/specs/`
  - `models[6].trims[0].sources.dimensions` → `https://www.cars.com/research/rolls_royce-cullinan-2026/specs/`
- **Expected:** Replace each with a primary source: the Rolls-Royce consumer showroom page for that model (`rolls-roycemotorcars.com/en_US/showroom/<model>.html`), the Rolls-Royce press club article for the model, or the corresponding `fueleconomy.gov` dimensions entry where the manufacturer page is gated.

---

## Warnings

### 1. NHTSA and IIHS safety source URLs point to manufacturer-roll-up or root pages

- **Model/trim:** Every trim
- **Issue:** `sources.safety.nhtsa_overall_rating` is `https://www.nhtsa.gov/vehicle/2026/ROLLS-ROYCE` (brand roll-up — currently returns a "no ratings available" placeholder for every model) and `sources.safety.iihs_top_safety_pick` is `https://www.iihs.org/ratings` (the IIHS ratings homepage). Per spec §4.4 examples, the safety source should point to the per-vehicle ratings page. The data carries `nhtsa_overall_rating: null` / `iihs_top_safety_pick: null` on every trim — those nulls are correct (NHTSA/IIHS don't test Rolls-Royce), but the cited URLs don't let an auditor confirm "not rated" against a specific model page.
- **Found in:** every trim's `sources.safety.*`
- **Value seen:** roll-up URLs
- **Recommendation:** Either accept that "no per-vehicle page exists" is the actual state and add a one-line note to that effect in the brand-level notes, or replace each `safety.iihs_top_safety_pick` source with a per-model IIHS search URL specific to that vehicle.

---

## FYIs

### 1. All 9 trims have null `msrp_base` and `destination_fee` — expected per batch context

- **Model/trim:** every trim
- **Note:** Per the batch context, Rolls-Royce does not publish US MSRPs on its consumer site or in accessible press releases ("price on application"). Every trim's `notes` documents this and cites the spec §4 forbidden-source rule (no dealer/content-farm/Wikipedia citation may stand as the sole MSRP source). `msrp_range.low/high` are correctly null on every model. Treated as FYI per the batch protocol; would otherwise be 9 BLOCKERs under the spec's strict §2 rule.

### 2. JD Power VDS / APEAL all null with `confidence: "unknown"` across the brand

- **Model/trim:** Phantom, Ghost, Ghost Black Badge, Spectre, Spectre Black Badge, Cullinan, Cullinan Black Badge
- **Note:** Both `reliability` and `customer_satisfaction` are `confidence: "unknown"` on every model — JD Power does not meaningfully sample Rolls-Royce at US volumes. Expected per batch context. `professional_reviews` is "medium"/"high" and `owner_reviews` is "low" across the brand, so no model triggers the §2 "all-four-unknown" FYI rule.

### 3. NHTSA / IIHS ratings null on every model — expected per batch context

- **Model/trim:** every model
- **Note:** Neither agency crash-tests current Rolls-Royce vehicles. Trim notes explicitly document this. See Warning #1 for a related source-citation cleanup recommendation.

### 4. Spectre EPA entry reflects 22-inch wheels only (separate EPA IDs for 23")

- **Model/trim:** Spectre / Spectre Black Badge
- **Note:** STATUS.md lists 4 EPA IDs for the Spectre family (22"/23" and BB 22"/23"). The data's primary `sources.fuel_economy` for Spectre is ID 49979 (22-inch). Per spec §6.4 the project treats wheel size as an option within a single trim, not a separate trim, so this is intentional. Mentioning so a future audit doesn't flag the asymmetric coverage as missing data.

---

## Coverage stats

- Models with >2 null spec blocks on base trim: **0**
- Trim families with <4 images: **0** (every family has at least 4 angles; Phantom EWB and Ghost EWB each have 5 with bonus `interior_rear_seats`)
- Models with all 4 review blocks at `confidence: "unknown"`: **0** (every model has `professional_reviews` medium/high)
- Trims missing key sources entries for populated blocks: **0**

---

## Sample details

### Sampled trims for source verification

1. **Spectre** — checked against `https://www.fueleconomy.gov/feg/noframes/49979.shtml` (EPA)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 74/82/77 — **PASS** (EPA matches exactly)
   - `ev_specifics.mpge_combined: 77` — **PASS** (mirrored from EPA combined as required by spec §3.6 v1.1)
   - `powertrain.type: "ev"` and `drivetrain: "AWD-electric"` — **PASS** (EPA: "All-Electric…all-wheel drive")
   - `sources.dimensions` — **FAIL** (cars.com, forbidden — see Blocker #1)
   - Result: **PASS on EPA-checked fields; dimensions source needs replacement**

2. **Ghost** (base) — checked against `https://www.fueleconomy.gov/feg/noframes/49333.shtml` (EPA)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 12/19/14 — **PASS** (EPA matches exactly)
   - `fuel_economy.fuel_type_required: "premium"` — **PASS** (EPA: "Premium Gasoline")
   - `powertrain.engine_displacement_l: 6.7` / `engine_config: "V12"` / `transmission: "8-speed automatic"` / `drivetrain: "AWD"` — **PASS** (EPA: "12-cylinder, 6.7-liter engine with an automatic 8-speed transmission and all-wheel drive")
   - Note: EPA labels Ghost as "Gas Guzzler" + "turbocharger technology"; data has `aspiration: "twin_turbocharged"` (Ghost's 6.75L is twin-turbo) — consistent
   - Result: **PASS on every checked field**

3. **Ghost Extended** — checked against `https://www.fueleconomy.gov/feg/noframes/49334.shtml` (EPA)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 12/19/14 — **PASS** (EPA matches exactly)
   - `powertrain` carries over from base Ghost per §6.3 (block is null on the step-up); data's drivetrain/V12 consistent with EPA description
   - `sources.dimensions` — **FAIL** (rollsroycepasadena.com, dealer site, forbidden — see Blocker #1)
   - Result: **PASS on EPA-checked fields; dimensions source is a dealer-site citation**

### Image URLs checked

All 5 sampled image entries had `needs_scraping: true` and pointed to `rolls-roycemotorcars.com/en_US/showroom/...` consumer pages (manufacturer URL, not a direct asset). Per batch protocol these are not image-URL failures — they are page URLs awaiting Phase 4 CDN resolution.

1. `https://www.rolls-roycemotorcars.com/en_US/showroom/phantom-in-detail.html` — Phantom interior_dashboard — `needs_scraping: true` (expected)
2. `https://www.rolls-roycemotorcars.com/en_US/showroom/phantom-extended.html` — Phantom Extended front_three_quarter — `needs_scraping: true` (expected)
3. `https://www.rolls-roycemotorcars.com/en_US/showroom/black-badge-cullinan.html` — Cullinan Black Badge front_three_quarter — `needs_scraping: true` (expected)
4. `https://www.rolls-roycemotorcars.com/en_US/showroom/phantom-extended.html` — Phantom Extended side_profile — `needs_scraping: true` (expected)
5. `https://www.rolls-roycemotorcars.com/en_US/showroom/spectre.html` — Spectre rear_three_quarter — `needs_scraping: true` (expected)

A live fetch of `rolls-roycemotorcars.com/en_US/showroom/spectre.html` timed out at 60s during this verification pass — consistent with the documented WebFetch timeouts in STATUS.md.

---

## Notes on this verification

- **EPA spot-checks were the most informative.** All three sampled EPA IDs (49333 Ghost, 49334 Ghost Extended, 49979 Spectre 22") resolved cleanly and matched the JSON values exactly on city/highway/combined MPG-or-MPGe, fuel type, engine configuration, transmission, and drivetrain.
- **rolls-roycemotorcars.com consumer pages timed out** every WebFetch, consistent with STATUS.md. The press subdomain `press.rolls-roycemotorcars.com` is the cited primary source for powertrain figures across the brand and is well-formed.
- **The forbidden-source residual** is concentrated entirely in `sources.dimensions` across the brand — 7× www.cars.com and 1× rollsroycepasadena.com. This pattern strongly suggests the cleanup pass treated `sources.<field>` URLs as a separate cleanup target from `professional_reviews.links` and missed this specific field. A single grep + replace pass should clear it.
- **Edmunds and KBB URLs** appear only in `owner_reviews.sources`, which is permitted by spec §4.1 (Edmunds, KBB explicitly listed as acceptable secondary sources for owner-review aggregates). Edmunds is also cited once in `models[4].professional_reviews.links` (Spectre Black Badge) — Edmunds is permitted per §4.1.
- **Sole-trim atomic rule applied cleanly** on Ghost Black Badge, Spectre, Spectre Black Badge, Cullinan, and Cullinan Black Badge (5 of 7 models are sole-trim with `is_base_trim: true` + `delta_from_base: null` correctly set).
- **Schema, MSRP integrity, base-trim count, body-style taxonomy, delta-from-base references, EV-MPGe mirroring, and powertrain/ev_specifics consistency all pass programmatic check.**
