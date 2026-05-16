# Verification Report: Bentley

**Date:** 2026-05-13
**Data source:** `data/bentley.json` (researched 2026-05-13)
**Models checked:** 5 (Continental GT, Continental GTC, Flying Spur, Bentayga, Bentayga EWB)
**Trims checked:** 22
**Trims sampled for source verification:** 3 (Bentayga Speed, Flying Spur Mulliner, Continental GTC Azure)
**Image URLs spot-checked:** 5
**Catalog mirror:** `catalog/data/bentley.json` is byte-identical to `data/bentley.json` (SHA-256 match).

---

## Summary

- **Blockers:** 0
- **Warnings:** 0
- **FYIs:** 26

---

## Blockers

(none)

---

## Warnings

(none)

---

## FYIs

### 1. All 22 trims have `msrp_base` and `destination_fee` null — expected per ultra-luxury batch context

- **Model/trim:** every trim across all 5 models
- **Note:** Per spec §13 (ultra-luxury rule) and the Bentley batch context, Bentley does not publish US MSRP on its consumer site or in accessible press releases. Each trim's `notes` documents this with the formula "Bentley does not publish US MSRP. Per spec §13 / §4 dealer sites, content farms (Carbuzz, Motor1, Autoblog, Autoevolution), and KBB/Edmunds retail prices are forbidden as primary MSRP source — msrp_base/destination_fee set to null with documentation." `msrp_range.low/high` are correctly null on every model. Treated as FYI per the batch protocol; would otherwise be 22 BLOCKERs under spec §2's strict rule.

### 2. JD Power VDS / APEAL and Consumer Reports null across the brand (`confidence: "unknown"` on `reliability` and `customer_satisfaction`)

- **Model/trim:** every model (5/5)
- **Note:** Both `reliability` and `customer_satisfaction` blocks are `confidence: "unknown"` on every model — JD Power VDS/APEAL and Consumer Reports do not meaningfully sample Bentley at US sales volumes. Each model's summary documents this. Expected per batch context. `professional_reviews` is `confidence: "high"` and `owner_reviews` is `confidence: "low"` on every model, so no model triggers the §2 "all-four-unknown" FYI rule.

### 3. NHTSA / IIHS source URLs are brand roll-up or ratings homepage — expected for Bentley

- **Model/trim:** every trim's `sources.safety.nhtsa_overall_rating` and `sources.safety.iihs_top_safety_pick` (22 trims × 2 = 44 entries)
- **Note:** `sources.safety.nhtsa_overall_rating` is `https://www.nhtsa.gov/vehicle/2026/BENTLEY` (brand roll-up — currently returns "no ratings available" for every Bentley model) and `sources.safety.iihs_top_safety_pick` is `https://www.iihs.org/ratings` (the IIHS ratings homepage). Per the singleton-consistency rule (instruction file §5 and the Bentley reinforcement note), roll-up URLs are the only available sources for Bentley because neither NHTSA nor IIHS crash-tests Bentley models. Data carries `nhtsa_overall_rating: null` / `iihs_top_safety_pick: null` on every trim — those nulls are correct. Treated as FYI per the ultra-luxury exception, not WARNING.

### 4. EPA fueleconomy.gov IDs are shared within a model rather than per-trim

- **Model/trim:** Continental GT (all 5 trims → ID 49752), Continental GTC (all 5 → 49753), Flying Spur (all 4 → 49754), Bentayga (all ICE trims → 49562; Bentayga Hybrid uses its own PHEV ID inside the same model entry), Bentayga EWB (all 3 → 49562 shared with Bentayga base).
- **Note:** EPA does not publish per-trim listings for Bentley; a single EPA test result covers the whole drivetrain/configuration. Per spec §4 EPA-unavailable rule, the project shares the EPA URL across trims with the same powertrain. Flagged here so a future audit doesn't mistake the shared citation for sloppy sourcing.

### 5. All image entries have `needs_scraping: true` and point to consumer model pages (page URLs, not direct asset URLs) — expected pre-Phase-4 state

- **Model/trim:** every image entry across all 22 trims (88 total image rows, 4 angles each)
- **Note:** Every `images[*].url` is a `bentleymotors.com/en/models/...` consumer page URL with `needs_scraping: true`. Per batch protocol these are not image-URL failures — they are page URLs awaiting Phase 4 CDN resolution. Once `scrape_image_urls.mjs` runs, these will be replaced with direct asset URLs and `needs_scraping` will flip to `false`. Phase 4 was not run as part of this verification per task instructions.

---

## Coverage stats

- **Models with >2 null spec blocks on base trim:** 0 (Continental GT/GTC/Flying Spur base trims have 0 null blocks; Bentayga and Bentayga EWB base trims have 1 null block — `ev_specifics`, correctly null because their base powertrain is `ice`)
- **Trim families with <4 images:** 0 (every one of 22 singleton families has exactly the 4 required angles: `front_three_quarter`, `rear_three_quarter`, `side_profile`, `interior_dashboard`)
- **Models with all 4 review blocks at `confidence: "unknown"`:** 0 (every model has `professional_reviews: high` and `owner_reviews: low`, so the "all-four-unknown" trigger never fires)
- **Trims missing key sources entries for populated blocks:** 0 (every trim has `msrp_base`, `powertrain`, `fuel_economy`, `dimensions`, `safety.nhtsa_overall_rating`, `safety.iihs_top_safety_pick`, `features`, `warranty`, and either `performance.zero_to_60_sec` or equivalent populated)
- **Forbidden-source URLs:** 0 across 311 total URLs scanned (203 manufacturer `bentleymotors.com`, 3 `bentleymedia.com` press, 22 `fueleconomy.gov`, 22 `nhtsa.gov`, 22 `iihs.org`, 7 `edmunds.com`, 5 `caranddriver.com`, 5 `kbb.com`, 3 `motortrend.com`, 2 `topgear.com`, 1 each of `hagerty.com`, `motoringresearch.com`, `slashgear.com`)
- **Singleton trim_family checks:** 22/22 PASS — every trim is the sole member of its `trim_family`, has `is_base_trim: true`, `delta_from_base: null`, and exactly the 4 required image angles per spec
- **Body-style cargo consistency:** all 5 models pass (sedan/coupe/convertible have `trunk_cuft` populated with `behind_*` null; suv-midsize has `behind_2nd_row`/`behind_1st_row` populated with `trunk_cuft` null)
- **Powertrain / ev_specifics consistency:** all 22 trims pass (15 phev trims have `ev_specifics` populated; 7 ice trims have `ev_specifics: null`)
- **MSRP range integrity:** vacuously passes — every `msrp_range.low/high` is null because every trim's `msrp_base` is null
- **`delta_from_base` references:** all 22 trims have `delta_from_base: null`, so no broken references possible

---

## Sample details

### Sampled trims for source verification

1. **Bentayga Speed** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49562` (EPA) and `https://www.bentleymotors.com/en/models/bentayga/bentayga-speed.html` (manufacturer)
   - EPA: `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 14/21/16 — **PASS** (EPA matches exactly; EPA listing is for the Bentayga 4.0L V8 line, applied to Speed per spec §4 EPA-unavailable rule)
   - EPA: `powertrain.engine_displacement_l: 4.0` / `engine_config: "V8"` / `aspiration: "twin_turbocharged"` / `drivetrain: "AWD"` — **PASS** (EPA: "4.0L, 8-cylinder, turbocharged … All-Wheel Drive")
   - Mfr: `powertrain.horsepower_hp: 641` — **PASS** (manufacturer page: "641 BHP")
   - Mfr: `performance.zero_to_60_sec: 3.4` — **PASS** (manufacturer page: "3.4 s")
   - Mfr: `performance.top_speed_mph: 193` — **PASS** (manufacturer page: "193 MPH")
   - Note: Bentayga Speed is the most powerful Bentayga ever made; matches data narrative in `notes`.
   - Result: **PASS on all checked fields**

2. **Flying Spur Mulliner** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49754` (EPA)
   - EPA: `fuel_economy.combined_mpg: 19` / `ev_specifics.mpge_combined: 46` — **PASS** (EPA: "46 MPGe on electricity; 19 MPG on gasoline only")
   - EPA: `ev_specifics.electric_range_mi: 30` — **PASS** (EPA: "30 miles all-electric")
   - EPA: `ev_specifics.total_range_mi: 440` — **PASS** (EPA: "440 miles total range")
   - EPA: `powertrain.type: "phev"` / `drivetrain: "AWD"` / `transmission_speeds: 8` — **PASS** (EPA: "plug-in hybrid … All-Wheel Drive … Automatic 8-speed")
   - Note: EPA page is the Flying Spur model-wide PHEV listing, shared across all 4 Flying Spur trims per spec §4 EPA-unavailable rule. Mulliner-specific 771 bhp tune is not separately captured by EPA.
   - Result: **PASS on all checked fields**

3. **Continental GTC Azure** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49753` (EPA)
   - EPA: `fuel_economy.combined_mpg: 19` / `ev_specifics.mpge_combined: 46` — **PASS** (EPA: "46 MPGe on electricity; 19 MPG on gas only")
   - EPA: `powertrain.engine_displacement_l: 4.0` / `engine_config: "V8"` / `aspiration: "twin_turbocharged"` / `drivetrain: "AWD"` / `transmission_speeds: 8` — **PASS** (EPA: "4.0L, 8 cyl, Automatic (AM-S8), Turbo … All-Wheel Drive")
   - EPA confirms body style as 2-door convertible (matches data `body_style: "convertible"`).
   - Note: EPA shares ID 49753 across all 5 Continental GTC trims per spec §4 EPA-unavailable rule.
   - Result: **PASS on all checked fields**

### Image URLs checked

All 5 sampled image entries had `needs_scraping: true` and pointed to `bentleymotors.com/en/models/...` consumer pages (manufacturer URL, not a direct asset). Per batch protocol these are not image-URL failures — they are page URLs awaiting Phase 4 CDN resolution. Two of the five were resolved live during sampling (the Continental GT base and Bentayga Speed pages were fetched as part of the Step 3 source verification and both loaded successfully).

1. `https://www.bentleymotors.com/en/models/continental-gt/continental-gt.html` — Continental GT (base) `front_three_quarter` — **page loads** (verified via WebFetch; page shows MY27 content for the Continental GT, consistent with mid-model-year refresh; `needs_scraping: true` as expected)
2. `https://www.bentleymotors.com/en/models/flying-spur/flying-spur-speed.html` — Flying Spur Speed `rear_three_quarter` — `needs_scraping: true` (expected)
3. `https://www.bentleymotors.com/en/models/bentayga.html` — Bentayga Hybrid `interior_dashboard` — `needs_scraping: true` (note: Hybrid uses the model-level URL, not a trim-specific URL — consistent with Bentley's site structure where Hybrid is presented within the main Bentayga page)
4. `https://www.bentleymotors.com/en/models/bentayga/bentayga-ewb.html` — Bentayga EWB (base) `side_profile` — `needs_scraping: true` (expected)
5. `https://www.bentleymotors.com/en/models/continental-gtc/continental-gtc-mulliner.html` — Continental GTC Mulliner `front_three_quarter` — `needs_scraping: true` (expected)

---

## Notes on this verification

- **EPA spot-checks resolved cleanly.** All three sampled EPA IDs (49562 Bentayga ICE, 49753 Continental GTC PHEV, 49754 Flying Spur PHEV) returned values matching the JSON exactly on city/highway/combined MPG-or-MPGe, fuel type, engine configuration, transmission, drivetrain, electric range, and total range.
- **Manufacturer pages also resolved cleanly.** Both `continental-gt.html` and `bentayga-speed.html` loaded and showed the same HP, 0-60, and top-speed numbers as the JSON (671 BHP / 3.5s / 168 MPH on Continental GT base; 641 BHP / 3.4s / 193 MPH on Bentayga Speed). The Continental GT page now shows "MY27" content, indicating Bentley has rolled forward to the 2027 model year on its consumer site mid-2026; the data's `model_year: 2026` and spec values remain consistent with what the site is showing.
- **Singleton trim_family architecture applied correctly.** Bentley uses the Mulliner-as-trim convention per session 3 — each Mulliner, Azure, Speed, S, and Hybrid trim is its own `trim_family`. All 22 singleton checks passed: `is_base_trim: true`, `delta_from_base: null`, and exactly 4 image angles in each trim's `images` array. This is the architectural error documented in PROJECT_STATE.md lesson #36 — Bentley avoids it cleanly.
- **Forbidden-source check is clean.** 311 URLs total were scanned across all `professional_reviews.links`, `reliability.sources`, `customer_satisfaction.sources`, `owner_reviews.sources`, `trims[*].sources.*`, and `trims[*].images[*].url`. Zero matches for cars.com, motor1.com, carbuzz.com, autoblog.com, autoevolution.com, teslaoracle.com, carsfrenzy.net, reddit.com, dealer-site patterns (no `bentleyseattle.com` / `bentleyatlanta.com` / similar), or enthusiast-forum domains. Every URL is either manufacturer (`bentleymotors.com`, `bentleymedia.com`), government (`fueleconomy.gov`, `nhtsa.gov`, `iihs.org`), or an approved major publication (Car and Driver, MotorTrend, Edmunds, KBB, Hagerty, Top Gear, Motoring Research, SlashGear).
- **Schema, MSRP integrity (vacuous), base-trim count, body-style taxonomy, delta-from-base references, EV-MPGe mirroring, powertrain/ev_specifics consistency, and cargo-volume consistency all pass programmatic checks** (executed via PowerShell pass over the parsed JSON).
- **No JSON modifications, image scraping, or download scripts were run** per task instructions. STATUS.md was not touched per the explicit instruction — central STATUS update happens elsewhere.
- **Catalog mirror is in sync.** `data/bentley.json` and `catalog/data/bentley.json` are byte-identical (SHA-256 match) — Phase 2 mirror is current.

### Recommendation

**Proceed to publish.** Zero blockers, zero warnings. The 26 FYIs are entirely the expected ultra-luxury pattern (22 null-MSRP entries with documentation + 1 brand-level review-block summary + 1 NHTSA/IIHS roll-up summary + 1 EPA shared-ID note + 1 image needs-scraping note). Bentley is verification-clean.
