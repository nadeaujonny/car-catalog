# Verification Report: Jeep

**Date:** 2026-05-13
**Data source:** `data/jeep.json` (researched 2026-05-13)
**Models checked:** 12
**Trims checked:** 55
**Trims sampled for source verification:** 3 (Wrangler Sport, Wrangler Sahara, Jeep Recon Moab — verified against Stellantis press release + fueleconomy.gov)
**Image URLs spot-checked:** 5 (all `www.jeep.com` trim/model pages — placeholders for Phase 4 scraping)

---

## Summary

- **Blockers:** 0
- **Warnings:** 149
- **FYIs:** 3

The brand is structurally sound. There are **zero blockers** — every singleton trim_family (all 55 are singletons) has `is_base_trim: true`, `delta_from_base: null`, and the 4 required image angles. MSRP ranges all match the min/max of populated trim MSRPs. No forbidden-source URLs (cars.com, motor1.com, carbuzz.com, autoblog.com, autoevolution.com, teslaoracle.com, carsfrenzy.net, reddit.com, dealer patterns) appear anywhere.

The warning count is dominated by two systemic patterns: (a) heavy reliance on **moparinsiders.com** as a Stellantis-focused fallback for trim-walk and feature data — 97 references across 7 unique URLs — used because Stellantis press kits and the consumer-facing www.jeep.com site do not publish per-trim pricing/feature tables in a machine-checkable form; (b) **step-up trims for several models have most spec blocks null** (powertrain/fuel_economy/performance/dimensions/safety/warranty) because trims are treated as singleton families per the F-150/Sierra atomic-family precedent, where step-up content is captured via features.notable_other rather than full spec block populations.

---

## Blockers

(none)

---

## Warnings

### 1. moparinsiders.com used as fallback Stellantis-coverage source (97 references)

- **Model/trim:** All 12 Jeep models except Recon (Recon uses Stellantis media press release directly)
- **Issue:** moparinsiders.com is a fan/news site (not an OEM-affiliated source), used as the `sources.features` and frequently `sources.msrp_base` link across 6 of 7 model lineups. Total: 97 references across 7 unique URLs.
- **Found in:** Many `sources` paths across `models[*].trims[*].sources.features` and `.sources.msrp_base`, plus `models[9] (Grand Wagoneer).professional_reviews.links[]` (2 entries).
- **Unique URLs:**
  - `https://moparinsiders.com/2026-jeep-wrangler-buyers-guide/`
  - `https://moparinsiders.com/2026-jeep-gladiator-buyers-guide/`
  - `https://moparinsiders.com/2026-jeep-grand-cherokee-buyers-guide/`
  - `https://moparinsiders.com/2026-jeep-compass-buyers-guide/`
  - `https://moparinsiders.com/2026-jeep-cherokee-buyers-guide/`
  - `https://moparinsiders.com/jeep-unveils-refreshed-2026-grand-cherokee-lineup/`
  - `https://moparinsiders.com/grand-wagoneer-grown-up-2026-brings-clearer-trims-cleaner-design/`
- **Source consulted:** Not re-fetched — flagged based on host pattern alone.
- **Recommendation:** Where possible, swap to a Stellantis media press release URL (already present for some trims), the consumer-facing www.jeep.com page, or the model's window-sticker monograph PDF on stellantisnorthamerica.com. moparinsiders.com is not an OEM source and is therefore flagged as a WARNING per project policy.

### 2. NHTSA URL is a roll-up testing-announcement page, not a per-vehicle rating page (8 trims)

- **Model/trim:** Wrangler Sport, Wrangler Sahara, Wrangler 4xe Sport S 4xe, Wrangler 4xe Sahara 4xe, Wrangler Moab 392, Gladiator Sport, Gladiator Sahara, Compass Latitude, Cherokee Cherokee, Recon Moab
- **Issue:** `sources.safety.nhtsa_overall_rating` points to `https://www.nhtsa.gov/ratings/2026-model-year-vehicles-selected-testing-nhtsa` — the NHTSA 2026-models-selected-for-testing announcement, not a per-vehicle URL. NHTSA has not yet rated these vehicles for 2026, so `nhtsa_overall_rating` is null. The link is technically a roll-up, not a per-vehicle page.
- **Found in:** `models[0,1,2,3,7,8,11].trims[base trims with safety populated].sources.safety.nhtsa_overall_rating`
- **Value seen:** `https://www.nhtsa.gov/ratings/2026-model-year-vehicles-selected-testing-nhtsa`
- **Source consulted:** Not re-fetched (URL is informational only; data is null).
- **Recommendation:** Mainstream-brand convention prefers per-vehicle URL. Since NHTSA hasn't rated 2026 Wrangler/Gladiator/Compass/Cherokee/Recon yet, either (a) replace with the previous MY's nhtsa.gov/vehicle/YYYY/JEEP/<model>/... URL noting "previous-MY carryover" in trim.notes, or (b) leave the roll-up but note in trim.notes that NHTSA hasn't published a 2026 rating. Note: Grand Cherokee, Grand Cherokee L, and Grand Wagoneer correctly use per-vehicle NHTSA URLs (different MYs as fallback).

### 3. IIHS roll-up URL on Recon Moab

- **Model/trim:** Recon Moab
- **Issue:** `sources.safety.iihs_top_safety_pick` points to `https://www.iihs.org/ratings` (the IIHS ratings home page, not per-vehicle).
- **Found in:** `models[11].trims[0].sources.safety.iihs_top_safety_pick`
- **Value seen:** `https://www.iihs.org/ratings`
- **Source consulted:** Not re-fetched.
- **Recommendation:** Recon hasn't been IIHS-tested (it isn't yet on sale). Either replace with the IIHS Jeep brand-browse URL (`https://www.iihs.org/ratings/manufacturer/jeep`) or note in trim.notes that IIHS hasn't tested. Roll-up is acceptable for not-yet-tested vehicles but per-vehicle is the project convention.

### 4. Step-up trims have >2 null spec blocks (40 trims)

- **Model/trim:** Most step-up trims across Wrangler, Wrangler 4xe, Gladiator, Grand Cherokee, Grand Cherokee L, Grand Cherokee 4xe, Compass, Cherokee, Grand Wagoneer, Grand Wagoneer L (40 individual trims)
- **Issue:** Each step-up trim has `is_base_trim: true` (singleton trim_family architecture) but its `powertrain`, `fuel_economy`, `performance`, `dimensions`, `safety`, `warranty` are null. Delta content lives in `features.notable_other` and in `notes`.
- **Examples:**
  - `models[0].trims[1] (Wrangler Sport S)`: 6 null spec blocks
  - `models[3].trims[1] (Gladiator Sport S)` through `[7] (Rubicon X)`: 5-6 null spec blocks each
  - `models[4].trims[1] (Grand Cherokee Laredo X)` through `[7] (Summit Reserve)`: 6 null spec blocks each
  - `models[9].trims[1] (Grand Wagoneer Limited Altitude)` and `[2] (Summit Obsidian)`: 6 null spec blocks each
- **Source consulted:** N/A — structural.
- **Recommendation:** This appears to follow the singleton-trim-family architecture (every trim is its own family with `is_base_trim: true`), so step-ups don't have a "next family up" to compare against, and only the lowest-priced base of each lineup carries full spec blocks. The pattern is **consistent with the F-150/Sierra precedent** noted in PROJECT_STATE.md lesson #36. Two options for the user: (a) accept as architectural intent, suppress warning; (b) populate the spec blocks for each step-up trim using values that differ from the base (engine, dimensions are likely identical across most Wrangler/Gladiator trims, so populating with identical-to-base values would be redundant). Most likely accept-as-architecture.

### 5. Recon Moab fuel_economy.combined_mpg = 80 (MPGe mirrored into mpg field)

- **Model/trim:** Recon Moab
- **Issue:** Recon is `powertrain.type = "ev"`. Per spec §3.6 / project convention, MPGe should be in `ev_specifics.mpge_combined`. The data correctly mirrors `80` into both `ev_specifics.mpge_combined` and `fuel_economy.combined_mpg` (per the convention documented in `trim.notes`).
- **Found in:** `models[11].trims[0].fuel_economy.combined_mpg = 80`
- **Value seen:** `{"city_mpg": null, "highway_mpg": null, "combined_mpg": 80, "fuel_tank_gal": null, "fuel_type_required": "electricity", ...}`
- **Source consulted:** trim.notes states "MPGe combined (80) mirrors into both fuel_economy.combined_mpg AND ev_specifics.mpge_combined per project EV convention."
- **Recommendation:** Documented project convention. **Not a defect** — flagged only because the generic schema rule says EVs should have null MPG in fuel_economy. Consider documenting this convention in the master spec to suppress future false positives. (Note: this verifier flagged it; the data and notes are internally consistent and follow the documented Jeep convention.)

---

## FYIs

### 1. IIHS null on Wrangler/Gladiator base trims is per IIHS policy

- **Model/trim:** Wrangler Sport (`models[0].trims[0]`), Gladiator Sport (`models[3].trims[0]`)
- **Note:** `iihs_top_safety_pick` is null and trim.notes explicitly documents that IIHS does not qualify Wrangler for TSP due to removable doors and fold-down windshield (Wrangler Sport notes verbatim: *"IIHS does NOT qualify Wrangler for TSP due to removable doors / fold-down windshield"*). This is the **expected** state per IIHS policy, not a research gap. Per the verification instructions: "Wrangler/Gladiator can't earn IIHS TSP per IIHS policy — if data documents this in notes, treat null IIHS as FYI." Honored. Other Wrangler/Gladiator trims have null `safety` blocks entirely (caught by warning #4) so the IIHS-policy note only appears once per base trim of each model.

### 2. Recon fueleconomy.gov uses brand model-browse fallback (Recon EV pre-EPA)

- **Model/trim:** Recon Moab
- **Note:** `sources.fuel_economy = "https://www.fueleconomy.gov/feg/bymake/Jeep2026.shtml"` rather than a specific vehicle-ID page. Confirmed via WebFetch on 2026-05-13: fueleconomy.gov has not yet published a 2026 Jeep Recon entry (Jeep 2026 lineup listed includes Cherokee, Compass, Gladiator, Grand Cherokee, Grand Cherokee L, Grand Wagoneer, Grand Wagoneer L, Wrangler, but **no Recon**). Documented in trim.notes. This matches the spec §4 EPA-unavailable fallback rule.

### 3. Recon Moab launch range: JSON says 230 mi; Stellantis press release says "up to 250 mi"

- **Model/trim:** Recon Moab
- **Note:** Sampled the Stellantis Recon press release; it states "up to 250 miles" all-electric range. JSON `electric_range_mi: 230`. trim.notes resolves the difference: *"Launches in a single Moab trim at $65,000 base; additional trims with longer 250-mi range will follow later in 2026"* and *"Range estimate is manufacturer-claimed pending EPA verification."* The 230 mi is the Moab launch trim's specific range; the 250 mi figure applies to **later trims** not yet on sale. Not a defect; just noting that the press release headline number doesn't match the launch trim because it advertises the eventual lineup max.

---

## Coverage stats

- Models with >2 null spec blocks on base trim: 0 (the *initial* base trim of each model — Wrangler Sport, Gladiator Sport, Grand Cherokee Laredo, Grand Cherokee L Laredo, Grand Cherokee 4xe Limited 4xe, Compass Latitude, Cherokee Cherokee, Grand Wagoneer, Grand Wagoneer L, Recon Moab, Wrangler Moab 392, Wrangler 4xe Sport S 4xe — all have fully populated spec blocks). The 40 warnings under "Base trim has >2 null spec blocks" all apply to *step-up* trims under singleton-family architecture, where the step-up is technically marked `is_base_trim: true` for its own family.
- Models with <4 images on primary trim family: 0 (every base trim has the 4 required angles)
- Models with all 4 review blocks at unknown confidence: 0
- Trims missing `sources` entries for major blocks: not separately counted, but step-up trims under singleton-family pattern naturally only have `sources.msrp_base` and `sources.features`.

---

## Sample details

### Sampled trims for source verification

1. **Wrangler Sport** — checked `sources.fuel_economy` (`https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49856`).
   - **Result: PASS.** fueleconomy.gov page returns "2026 Jeep Wrangler 4-door 4WD, 3.6L V6 6spd manual" — city 16, highway 22, combined 19 MPG, 21.5-gal tank. **All four values match JSON exactly** (city_mpg=16, highway_mpg=22, combined_mpg=19, fuel_tank_gal=21.5).
   - Also checked `sources.powertrain` (Stellantis press release id=27217): confirmed 3.6L V6 makes 285 hp / 260 lb-ft (matches JSON exactly).

2. **Wrangler Sahara** — checked `sources.fuel_economy` (`https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49854`).
   - **Result: PASS.** fueleconomy.gov page returns "2026 Jeep Wrangler 4-door 4WD, 2.0L 4-cyl turbo, 8-speed automatic" — city 20, highway 22, combined 21 MPG, 21.5-gal tank. **All four values match JSON exactly.**
   - Also confirmed via same Stellantis press release: 2.0L turbo I4 makes 270 hp / 295 lb-ft (matches JSON exactly).

3. **Recon Moab** — checked `sources.powertrain` (Stellantis press release for Recon launch).
   - **Result: PASS on hp/torque/0-60; FYI on range.** Press release states 650 hp, 620 lb-ft, 0-60 "as little as 3.6 seconds." All match JSON exactly. Press release headline lists "up to 250 mi" range; JSON has 230 mi for Moab launch trim with notes explaining 250 mi is for later trims. Press release MSRP, length, width not disclosed in the body — fall-back to www.jeep.com/recon.html which returns 200 OK but rendered content requires JS.

### Image URLs checked

The image URL strategy in this dataset uses **trim-spec page URLs** with `needs_scraping: true` flags — these are not direct image URLs but rather placeholders that Phase 4 scrape_image_urls.mjs will turn into real CDN image URLs. HEAD requests verify the placeholder pages still resolve.

1. `https://www.jeep.com/wrangler/specs.sport.html` — Wrangler Sport front_three_quarter — **HTTP 200 OK** (User-Agent required; 403 to bare curl)
2. `https://www.jeep.com/wrangler/specs.sahara.html` — Wrangler Sahara front_three_quarter — **HTTP 200 OK**
3. `https://www.jeep.com/compass.html` — Compass Latitude front_three_quarter (model-level URL since Compass lacks per-trim spec pages) — **HTTP 200 OK**
4. `https://www.jeep.com/recon.html` — Recon Moab front_three_quarter — **HTTP 200 OK**
5. `https://www.jeep.com/grand-cherokee.html` — Grand Cherokee — **HTTP 200 OK**

All five resolve successfully when a browser User-Agent is sent. WebFetch returns 403 for jeep.com URLs because the site blocks unknown bots — Phase 4 scraper should send a UA string.

---

## Notes on this verification

**Easy to verify:**
- MSRP ranges (internal consistency) — perfect across all 12 models.
- Singleton trim_family architecture (the biggest risk per project lesson #36) — all 55 trims are singletons, all correctly marked `is_base_trim: true`, all have `delta_from_base: null`, all have ≥4 image angles.
- fueleconomy.gov cross-checks — exact matches on multiple sampled trims.
- Stellantis press-kit cross-checks for engine specs.

**Hard to verify:**
- www.jeep.com pricing and trim feature tables — site blocks WebFetch with 403; only resolves with browser UA. Could not directly confirm trim MSRPs from the official OEM consumer site; verifier relied on Stellantis press releases (where pricing is sometimes embedded) and on fueleconomy.gov for cross-validation. This is also why moparinsiders.com became the project's fallback (warning #1).
- Recon Moab dimensions/MSRP not in Stellantis press release; trim.notes documents the values as manufacturer-claimed pending EPA verification.
- IIHS per-vehicle URLs for Wrangler-family vehicles correctly use `/ratings/vehicle/jeep/wrangler-4-door-suv/2026` (per-vehicle) — not flagged as roll-up.

**Source-rot encountered:**
- None at the URL level. Stellantis press release id=27217 still resolves; fueleconomy.gov vehicle IDs 49854 and 49856 still resolve. www.jeep.com returns 403 to bots but is up.

**Forbidden-source check result:**
- **No forbidden URLs found.** No cars.com, motor1.com, carbuzz.com, autoblog.com, autoevolution.com, teslaoracle.com, carsfrenzy.net, reddit.com, or dealer-pattern (e.g., `*jeep.com` non-www subdomain) anywhere in the data. cars.usnews.com (7 hits) is U.S. News & World Report's car review site, *not* cars.com — accepted.
- **moparinsiders.com (Stellantis fan/news site)** appears 97 times across 7 unique URLs and is the dominant non-OEM secondary source. Flagged as WARNING #1 per the reinforced verification instructions.

**Recon EV launch state:**
- Confirmed: fueleconomy.gov has not yet published a 2026 Jeep Recon entry as of 2026-05-13. Brand-browse fallback URL is therefore correct per spec §4. NHTSA and IIHS have not tested. Documented in Recon trim.notes.

**Overall recommendation:** **Proceed to publish.** Zero blockers. Two systemic warning patterns (moparinsiders.com fallback usage, step-up trims under singleton-family architecture having null spec blocks) both reflect deliberate research/architectural choices, not data errors. The dataset is internally consistent and externally verifiable on the spot-checked sample.
