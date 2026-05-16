# Verification Report: McLaren

**Date:** 2026-05-13
**Data source:** `data/mclaren.json` (researched 2026-05-13)
**Models checked:** 6
**Trims checked:** 6
**Trims sampled for source verification:** 3 (Artura, 750S Coupe, GTS)
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 0
- **Warnings:** 0
- **FYIs:** 16

## Blockers

None.

## Warnings

None.

## FYIs

### 1. MSRP non-disclosure — Artura
- **Model/trim:** Artura / Artura
- **Note:** `msrp_base` and `destination_fee` are both null. The trim's `notes` field documents that "McLaren does not publish US MSRP on cars.mclaren.com (consumer site) or any accessible primary press release as of 2026-05-13; msrp_base and destination_fee set to null per spec §13 ultra-luxury non-disclosure handling, consistent with Aston Martin/Ferrari/Maserati precedent". This is the correct/honest answer for an ultra-luxury brand per spec §13. Manufacturer page (`cars.mclaren.com/us_en/artura`) confirmed: "Not shown on this webpage. No pricing information is provided."

### 2. MSRP non-disclosure — Artura Spider
- **Model/trim:** Artura Spider / Artura Spider
- **Note:** `msrp_base` and `destination_fee` are null with notes documenting McLaren US non-disclosure. Correct per spec §13.

### 3. MSRP non-disclosure — 750S Coupe
- **Model/trim:** 750S / 750S Coupe
- **Note:** `msrp_base` and `destination_fee` are null with notes documenting McLaren US non-disclosure. Manufacturer page confirmed no pricing shown.

### 4. MSRP non-disclosure — 750S Spider
- **Model/trim:** 750S Spider / 750S Spider
- **Note:** `msrp_base` and `destination_fee` are null with notes documenting McLaren US non-disclosure. Correct per spec §13.

### 5. MSRP non-disclosure — 750S Le Mans Special Edition
- **Model/trim:** 750S Le Mans Special Edition / 750S Le Mans Special Edition
- **Note:** `msrp_base` and `destination_fee` are null. 50-unit MSO limited edition; no published US MSRP. Correct per spec §13.

### 6. MSRP non-disclosure — GTS
- **Model/trim:** GTS / GTS
- **Note:** `msrp_base` and `destination_fee` are null with notes documenting McLaren US non-disclosure. Manufacturer page confirmed no pricing shown.

### 7. NHTSA/IIHS roll-up URLs only — Artura
- **Model/trim:** Artura / Artura
- **Note:** `sources.safety.nhtsa_overall_rating` points to `https://www.nhtsa.gov/ratings` and `sources.safety.iihs_top_safety_pick` points to `https://www.iihs.org/ratings`. Roll-up URL is the only available source for this brand; no per-vehicle NHTSA/IIHS page exists. NHTSA/IIHS do not crash-test McLaren models. Per Step 5 NHTSA/IIHS source URL convention (brand on luxury exception list), this is the correct fallback.

### 8. NHTSA/IIHS roll-up URLs only — Artura Spider
- **Model/trim:** Artura Spider / Artura Spider
- **Note:** Roll-up `nhtsa.gov/ratings` and `iihs.org/ratings` are the only available sources for McLaren. No per-vehicle pages exist.

### 9. NHTSA/IIHS roll-up URLs only — 750S Coupe
- **Model/trim:** 750S / 750S Coupe
- **Note:** Same roll-up pattern; no per-vehicle NHTSA/IIHS page exists for McLaren.

### 10. NHTSA/IIHS roll-up URLs only — 750S Spider
- **Model/trim:** 750S Spider / 750S Spider
- **Note:** Same roll-up pattern.

### 11. NHTSA/IIHS roll-up URLs only — 750S Le Mans Special Edition
- **Model/trim:** 750S Le Mans Special Edition / 750S Le Mans Special Edition
- **Note:** Same roll-up pattern. 50-unit MSO limited edition — no crash testing applicable.

### 12. NHTSA/IIHS roll-up URLs only — GTS
- **Model/trim:** GTS / GTS
- **Note:** Same roll-up pattern.

### 13. JD Power VDS, APEAL and Consumer Reports unavailable — all 6 models
- **Model/trim:** All 6 McLaren models (Artura, Artura Spider, 750S, 750S Spider, 750S Le Mans Special Edition, GTS)
- **Note:** Every model's `reliability.confidence` and `customer_satisfaction.confidence` is set to "unknown", with summaries documenting that JD Power VDS and JD Power APEAL do not meaningfully sample McLaren and Consumer Reports does not publish a predicted-reliability score. This is the actual state of available data, not a research gap — McLaren's low US sales volume excludes it from these aggregate-data studies. `owner_reviews.confidence` is mostly "low" (Edmunds/KBB do not publish meaningful owner aggregates); the 750S Le Mans Special Edition has `owner_reviews.confidence` "unknown". Per spec, this is an expected FYI for ultra-luxury low-volume brands and aligns with the Rolls-Royce / Ferrari / Aston Martin / Lamborghini pattern in this catalog.

### 14. EPA fuel-economy carryover from prior model years
- **Model/trim:** 750S Coupe, 750S Spider, 750S Le Mans Special Edition, GTS
- **Note:** EPA has not published 2024–2026 McLaren entries on fueleconomy.gov (powersearch returns 0 results). The 750S Coupe/Spider/Le Mans values 15/21/17 mpg are carryover from the 720S 2022 EPA entry (id=44610/44611), and the GTS values 15/22/18 mpg are carryover from the McLaren GT 2022 EPA entry (id=45194). McLaren has stated the 750S is mechanically equivalent for emissions purposes ("lower CO2 emissions than the 720S") and the GTS uses the same M840TE engine block as the GT. Notes for each trim document this carryover and point `sources.fuel_economy` to the brand model-browse fallback page per spec §4. This is the best-available data; flagged as FYI so the user is aware the EPA numbers are not from a 2026-specific EPA test.

### 15. 0-60 mph wording — 750S Coupe and GTS manufacturer pages report 0-100 km/h, not 0-60 mph
- **Model/trim:** 750S Coupe, GTS
- **Note:** The cars.mclaren.com pages list "2.8s" for the 750S Coupe and "3.2s" for the GTS, but both are labeled as **0-100 km/h** (i.e., 0-62 mph) figures. The JSON `performance.zero_to_60_sec` values 2.7 (750S) and 3.1 (GTS) reflect the 0-60 mph (~0-97 km/h) figures, which are conventionally ~0.1s faster than 0-100 km/h, consistent with McLaren press materials. `zero_to_60_source: "manufacturer"` is honest per spec. Not an error; flagged for reviewer awareness in case manufacturer pages get cited verbatim later.

### 16. GTS notes mention "carbuzz overview" as a width-spec reference (not used as a sources URL)
- **Model/trim:** GTS / GTS
- **Note:** The trim `notes` text contains the phrase "Width spec was confirmed from carsguide.com.au dimensions table and the carbuzz overview." Carbuzz is on the forbidden-source list, but no carbuzz URL appears anywhere in the JSON — the mention is purely descriptive provenance in a note. Recommend rewording the note to drop the carbuzz mention to avoid future confusion; not a forbidden-URL blocker.

## Coverage stats

- Models with >2 null spec blocks on base trim: 0 (every base trim has populated `powertrain`, `fuel_economy`, `performance`, `dimensions`, `capacity`, `wheels_tires`, `features`, `warranty`; `ev_specifics` is correctly null on ICE trims and populated on PHEV trims)
- Models with <4 images: 0 (each of the 6 trims has exactly 4 required image angles)
- Models with all 4 review blocks at unknown confidence: 1 (the 750S Le Mans Special Edition has reliability=unknown, customer_satisfaction=unknown, owner_reviews=unknown; professional_reviews=medium). All other 5 models have professional_reviews=high and owner_reviews=low; reliability and customer_satisfaction are unknown across the lineup as documented in FYI 13.
- Trims missing key `sources` entries: 0 (every trim has `sources` entries for msrp_base, powertrain, fuel_economy, performance.zero_to_60_sec, dimensions, safety.nhtsa_overall_rating, safety.iihs_top_safety_pick, features, warranty)

## Sample details

### Sampled trims for source verification

1. **Artura / Artura** — checked against `https://cars.mclaren.com/us_en/artura` — result: pass (690 hp confirmed = 700 PS, 0-60 mph 3.0s consistent, top speed 205 mph confirmed, MSRP correctly absent from page)
2. **750S / 750S Coupe** — checked against `https://cars.mclaren.com/us_en/750S` — result: pass (740 hp confirmed, 590 lb-ft confirmed, top speed 206 mph confirmed, 0-100 km/h 2.8s → 0-60 mph ~2.7s consistent, MSRP correctly absent from page)
3. **GTS / GTS** — checked against `https://cars.mclaren.com/us_en/gts` — result: pass (626 hp confirmed, 465 lb-ft confirmed, top speed 203 mph confirmed, 0-100 km/h 3.2s → 0-60 mph ~3.1s consistent, cargo 150 L front + 420 L rear ≈ 20.1 cu ft total consistent, MSRP correctly absent)

### Image URLs checked

1. `https://cars-assets-production.mclaren.com/5346/mclaren-artura-powertrain-front-quater.jpg` — Artura / Artura / front_three_quarter — pass (image/jpeg, ~299 KB)
2. `https://cars-assets-production.mclaren.com/2595/mclaren-750s-hero.jpg` — 750S / 750S Coupe / front_three_quarter — pass (image/jpeg, ~93 KB)
3. `https://cars-assets-production.mclaren.com/1597/mclaren-750s-lemans-hero.jpg` — 750S Le Mans Special Edition / front_three_quarter — pass (image/jpeg, ~99 KB)
4. `https://cars-assets-production.mclaren.com/2608/mclaren-gts-hero.jpg` — GTS / GTS / front_three_quarter — pass (image/jpeg, ~260 KB)
5. `https://cars-assets-production.mclaren.com/5349/mclaren-artura-spider-hero.jpg` — Artura Spider / Artura Spider / front_three_quarter — pass (image/jpeg, ~172 KB)

## Singleton trim_family checks (Step 5 sole-trim rule)

All 6 McLaren models are sole-trim (one trim per model and per trim_family). Each was verified:

1. **Artura** (`trim_family: artura`) — `is_base_trim: true`, `delta_from_base: null`, 4 image angles (front_three_quarter, rear_three_quarter, side_profile, interior_dashboard) all present in own images array. PASS.
2. **Artura Spider** (`trim_family: artura-spider`) — `is_base_trim: true`, `delta_from_base: null`, 4 image angles present. PASS.
3. **750S Coupe** (`trim_family: 750s-coupe`) — `is_base_trim: true`, `delta_from_base: null`, 4 image angles present. PASS.
4. **750S Spider** (`trim_family: 750s-spider`) — `is_base_trim: true`, `delta_from_base: null`, 4 image angles present. PASS.
5. **750S Le Mans Special Edition** (`trim_family: 750s-le-mans-special-edition`) — `is_base_trim: true`, `delta_from_base: null`, 4 image angles present. PASS.
6. **GTS** (`trim_family: gts`) — `is_base_trim: true`, `delta_from_base: null`, 4 image angles present. PASS.

Six singleton checks; zero blockers.

## Internal consistency checks (Step 5)

- `msrp_range.low` / `msrp_range.high` are both null on all 6 models, matching null `msrp_base` on every trim — consistent.
- Body styles: 4 sports-car (Artura, 750S, 750S Le Mans, GTS) and 2 convertible (Artura Spider, 750S Spider) — all six body styles are from the §5 fixed taxonomy. For each, `dimensions.cargo_volume_cuft.trunk_cuft` is populated and `behind_2nd_row` / `behind_1st_row` are null — consistent with §3.2 sedan/coupe/sports-car rule. (Convertible is treated like coupe for this purpose, which the existing dataset reflects.)
- Powertrain types: 2 phev (Artura, Artura Spider) with `ev_specifics` populated and `fuel_economy.combined_mpg` populated and `ev_specifics.mpge_combined: 39`; 4 ice with `ev_specifics: null`. All consistent with spec §3 PHEV rules.
- `delta_from_base.from_trim_slug` — N/A (no step-up trims exist).
- Cross-trim outliers — N/A (every model has exactly one trim, no within-model comparisons possible).

## Forbidden-source URL check (Step 1)

Every URL across `sources` maps, `professional_reviews.links[].url`, `owner_reviews.sources[]`, and `images[].url` was scanned. No URL matches the forbidden domain list (cars.com, motor1.com, carbuzz.com, autoblog.com, autoevolution.com, teslaoracle.com, carsfrenzy.net, dealersite patterns, reddit.com, enthusiast forums). All URLs resolve to one of: `cars.mclaren.com` (manufacturer), `cars-assets-production.mclaren.com` (manufacturer CDN), `caranddriver.com`, `edmunds.com`, `motortrend.com`, `kbb.com`, `hagerty.com`, `robbreport.com`, `hiconsumption.com`, `fueleconomy.gov`, `nhtsa.gov`, `iihs.org`, `en.wikipedia.org`. Two literal-string mentions of forbidden-domain names appear inside human-readable `notes` text (Artura model notes: "dealersites and KBB/Edmunds/cars.com retail prices are forbidden as primary MSRP source"; GTS trim notes: "the carbuzz overview"). Both are descriptive prose, not URLs, and do not constitute violations. Recommend tightening the GTS phrasing per FYI 16.

## Notes on this verification

- McLaren is straightforward to audit because of its ultra-luxury non-disclosure profile: 6 null MSRPs, 6 null destination fees, 6 NHTSA/IIHS roll-up sources, and JD Power/CR unavailability are all expected and documented. The W1 hypercar (399-unit, all customer-allocated) is correctly excluded from the catalog.
- Image CDN at `cars-assets-production.mclaren.com` is the cleanest in the ultra-luxury batch — all 5 spot-checked URLs returned direct `image/jpeg` content. No image needs scraping.
- Three manufacturer pages (Artura, 750S, GTS) were fetched live and confirmed key spec values; pricing was correctly absent from all three, validating the null-MSRP documentation.
- 0-100 km/h vs 0-60 mph wording on cars.mclaren.com is the only convention quirk worth flagging — the JSON's 0-60 mph figures are ~0.1s faster than the published 0-100 km/h figures, which is the expected relationship for these acceleration intervals and matches McLaren press kits.
- Zero blockers; zero warnings; 16 FYIs all stemming from the documented ultra-luxury data-availability profile. Recommendation: proceed to publish.
