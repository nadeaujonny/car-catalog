# Verification Report: Mitsubishi

**Date:** 2026-05-13
**Data source:** `data/mitsubishi.json` (researched 2026-05-13)
**Models checked:** 4 (Outlander, Outlander PHEV, Outlander Sport, Eclipse Cross)
**Trims checked:** 24
**Trims sampled for source verification:** 3
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 1   (must be fixed before catalog is trustworthy)
- **Warnings:** 3   (likely issues, review recommended)
- **FYIs:** 5       (worth knowing, not necessarily wrong)

`data/mitsubishi.json` and `catalog/data/mitsubishi.json` are byte-identical (good — Phase 2 ran cleanly).

---

## Blockers

### 1. Eclipse Cross `msrp_range.high` exceeds maximum trim MSRP

- **Model/trim:** Eclipse Cross (model-level field)
- **Issue:** `msrp_range.high = 33695` does not equal the maximum `msrp_base` across the model's trims. The most expensive trim is SEL 1.5T S-AWC at $31,845. The $33,695 figure refers to the **SEL Touring package** — which the model `notes` and the SEL trim `notes` both explicitly describe as a package per spec §6.5, NOT a separate trim. Step 5 of the verification spec calls this out as a **BLOCKER**: `msrp_range.high` should equal the maximum `msrp_base` across trims.
- **Found in:** `models[3].msrp_range.high`
- **Value seen:** `33695`
- **Expected:** `31845` (max trim MSRP — Eclipse Cross SEL 1.5T S-AWC), OR alternatively SEL Touring should be promoted to a full trim entry if its price is to drive the model's high-end of the range. Either change is acceptable; the current state is internally inconsistent.

---

## Warnings

### 1. Mainstream-brand NHTSA roll-up URL on three of four models

- **Model/trim:** Outlander (ES FWD), Outlander PHEV (ES S-AWC), Eclipse Cross (ES 1.5T S-AWC)
- **Issue:** `sources.safety.nhtsa_overall_rating` points to the NHTSA ratings landing page rather than a per-vehicle page. For a mainstream brand this is a Step-5 **WARNING** (per-vehicle NHTSA pages do exist for Mitsubishi). Outlander Sport correctly uses the per-vehicle URL `https://www.nhtsa.gov/vehicle/2026/MITSUBISHI/OUTLANDER%20SPORT/SUV/AWD`, demonstrating the per-vehicle URL convention is achievable here.
- **Found in:**
  - `models[0].trims[0].sources["safety.nhtsa_overall_rating"]`
  - `models[1].trims[0].sources["safety.nhtsa_overall_rating"]`
  - `models[3].trims[0].sources["safety.nhtsa_overall_rating"]`
- **Value seen:** `"https://www.nhtsa.gov/ratings"` in all three places
- **Source consulted:** Compared to per-vehicle pattern used on Outlander Sport.
- **Recommendation:** Replace with per-vehicle NHTSA URLs of the form `https://www.nhtsa.gov/vehicle/2026/MITSUBISHI/<MODEL>/SUV/AWD` (or FWD).

### 2. Outlander manufacturer trims page does not list Black Edition

- **Model/trim:** Outlander Black Edition S-AWC
- **Issue:** The `mitsubishicars.com/cars-and-suvs/outlander/trims` page consulted during verification listed eight trim entries (ES, LE, SE, SE Tech Package, SEL, RALLIART, Trail Edition, SEL Premium Package) and did **not** include "Black Edition" as a trim. The data uses `https://www.kbb.com/mitsubishi/outlander/2026/black-edition/` as the `msrp_base` source, which the trim note explicitly acknowledges, but it suggests the Outlander Black Edition may not be a separately-marketed configurator trim on the OEM site as of 2026-05-13.
- **Found in:** `models[0].trims[6]` (Black Edition S-AWC, MSRP 44790)
- **Value seen:** `msrp_base: 44790`; source `"https://www.kbb.com/mitsubishi/outlander/2026/black-edition/"`
- **Source consulted:** https://www.mitsubishicars.com/cars-and-suvs/outlander/trims (manufacturer)
- **Recommendation:** Reconfirm Black Edition status on Mitsubishi's configurator before publication. The data may still be correct (Mitsubishi sometimes hides Black Edition behind a "Special Editions" tab), but the OEM trims listing did not show it.

### 3. `topelectricsuv.com` source for Outlander PHEV performance

- **Model/trim:** Outlander PHEV ES S-AWC
- **Issue:** `sources.performance` points to `https://topelectricsuv.com/first-look-review/mitsubishi-outlander-phev-updated/`, an enthusiast/blog site. While not on the explicit forbidden-source list, this is a low-quality source for an EV/PHEV performance datum (0-60 estimate). The trim notes also flag `zero_to_60_source: "estimated"`, which is appropriate, but the URL itself should ideally point at a manufacturer/Edmunds/KBB equivalent if possible.
- **Found in:** `models[1].trims[0].sources.performance`
- **Value seen:** `"https://topelectricsuv.com/first-look-review/mitsubishi-outlander-phev-updated/"`
- **Source consulted:** N/A (URL not visited during verification).
- **Recommendation:** Replace with a tier-1 source if a manufacturer or established outlet has published a 0-60 figure; if not, mark performance source as `null` and rely on the existing `zero_to_60_source: "estimated"` annotation.

---

## FYIs

### 1. Outlander PHEV SE and SEL MSRPs intentionally null

- **Model/trim:** Outlander PHEV SE S-AWC, Outlander PHEV SEL S-AWC
- **Note:** `msrp_base` is `null` for both trims. Mitsubishi's official 2026 PHEV refresh press release published MSRPs only for ES ($43,245) and Black Edition ($55,440); SE and SEL pricing was deferred "announced closer to launch." Each trim's `notes` field documents this and the model-level `notes` repeats it. Per the Mitsubishi-specific session-note exception, this is intentional, honest, and not a blocker.

### 2. Outlander PHEV `plug_type` is null (CHAdeMO not in schema enum)

- **Model/trim:** Outlander PHEV ES S-AWC
- **Note:** `ev_specifics.plug_type = null`. The 2026 Outlander PHEV uses CHAdeMO for DC fast charging — but the schema enum does not include CHAdeMO, and the trim/model notes document this explicitly. Conforms to project convention. No action.

### 3. All four review/reliability blocks at low or unknown confidence brand-wide

- **Model/trim:** All four models (Outlander, Outlander PHEV, Outlander Sport, Eclipse Cross)
- **Note:** `reliability.confidence` is `"low"` and `customer_satisfaction.confidence` is `"unknown"` on every model. `professional_reviews` is `"medium"` on every model and `owner_reviews` is `"low"` or `"medium"`. The summary text honestly attributes this to JD Power not statistically scoring Mitsubishi at the brand-level granularity available. This is the actual state of available data, not a research gap, but flagging per Step 2.

### 4. `cars.usnews.com` may look similar to forbidden `cars.com` on glance

- **Model/trim:** Outlander (model-level `professional_reviews.links[0]`)
- **Note:** The U.S. News URL `https://cars.usnews.com/cars-trucks/mitsubishi/outlander` is **not** the forbidden `cars.com` domain — it's U.S. News & World Report's cars vertical. Including this note to forestall future false-positive flags during re-verification.

### 5. `everymandriver.com` is a YouTube/blog hybrid source

- **Model/trim:** Outlander (model-level `professional_reviews.links[2]`)
- **Note:** `https://www.everymandriver.com/...` is a small-scale automotive YouTube/blog operation, not a tier-1 publication. Not on the forbidden list. Worth considering whether to keep or replace with a tier-1 publication on next research pass.

---

## Coverage stats

- Models with >2 null spec blocks on base trim: **0** (every model's "designated reference base trim" — Outlander ES FWD, PHEV ES S-AWC, Outlander Sport 2.0 S, Eclipse Cross ES 1.5T S-AWC — has all spec blocks fully populated). All other Mitsubishi trims are atomic singletons by design; their spec-block nulls are deliberate "unchanged from reference trim" markers and are not coverage gaps.
- Models with <4 images: **0** (every trim has exactly 4 image angles; 96 image entries across 24 trims).
- Models with all 4 review blocks at `unknown` confidence: **0** (some are `unknown` but never all four on the same model — see FYI #3).
- Trims missing key sources entries: **0** for the four "reference base trims"; the singleton step-up trims have only the keys relevant to fields they actually re-state (msrp_base, features, optionally fuel_economy) — this is by design under the atomic-singleton convention.

## Sample details

### Sampled trims for source verification

1. **Outlander ES FWD** — checked against `https://www.mitsubishicars.com/cars-and-suvs/outlander/trims` — result: **PASS on MSRP** ($29,995 confirmed). The page listed eight trims and did **not** include "Black Edition," which raised the Warning #2 above. Destination fee was not displayed on the page (the page disclaimer says destination excluded); could not cross-check the $1,745 destination value but it is consistent with the press release.
2. **Outlander Sport 2.0 S** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=50128` — result: **PASS** on EPA values (23 city / 29 hwy / 26 combined and 15.8 gal tank all match the JSON exactly).
3. **Eclipse Cross ES 1.5T S-AWC** — checked against `https://www.mitsubishicars.com/cars-and-suvs/eclipse-cross/trims` — result: **PASS** on MSRP ($27,695 confirmed). Page lists ES, LE, SE, RALLIART, SE Pano, BLACK EDITION, SEL, SEL TOURING — confirms SE Pano and SEL Touring are sold as packages/sub-trims, supporting the Blocker #1 finding that SEL Touring at $33,695 is being treated as a package in the data, hence Eclipse Cross `msrp_range.high` should reflect SEL ($31,845), not the SEL Touring package.

### Image URLs checked

1. `https://www.mitsubishicars.com/cars-and-suvs/outlander` — Outlander ES FWD (all 4 angles) — **page exists, contains vehicle imagery** (status: OK as a page-level reference; URLs are flagged `needs_scraping: true` and resolve to a marketing page, not direct CDN image assets — this is expected per Phase 4 design).
2. `https://www.mitsubishicars.com/cars-and-suvs/outlander-phev` — Outlander PHEV ES (all 4 angles) — **page exists, contains imagery** including Black Edition trim marketing. Same `needs_scraping: true` pattern.
3. `https://www.mitsubishicars.com/cars-and-suvs/eclipse-cross` — Eclipse Cross ES (all 4 angles) — **page exists, contains multiple vehicle photos** (white and red 2026 Eclipse Cross).
4. `https://www.mitsubishicars.com/cars-and-suvs/outlander-sport` — Outlander Sport 2.0 S (all 4 angles) — **page exists, contains vehicle imagery** (interior, exterior, dashboard, full vehicle shots).
5. `https://www.mitsubishicars.com/cars-and-suvs/outlander-sport/trims` — Outlander Sport step-up trims (ES through Trail Edition) — **page exists; lists "2.0 S, 2.0 ES, 2.0 LE, 2.0 SE, RALLIART, TRAIL EDITION, 2.4 SEL"** with starting price "$24,995"; trim-specific image assets not exposed in the HTML extract but the page is live.

All 5 sampled image URLs resolve to live Mitsubishi consumer-site pages. None resolved as direct image content-type — but per the data's own `needs_scraping: true` flag on every image entry, this is the documented and intended state pending Phase 4 image scraping.

## Notes on this verification

- **Forbidden-source URL scan:** A full unique-domain enumeration of every URL in the JSON returned only the following domains: `mitsubishicars.com`, `jdpower.com`, `cars.usnews.com`, `everymandriver.com`, `edmunds.com`, `fueleconomy.gov`, `iihs.org`, `nhtsa.gov`, `kbb.com`, `prnewswire.com`, `topelectricsuv.com`, `carfax.com`. **No forbidden-source URLs are present** (no `cars.com`, no `motor1.com`, no `carbuzz.com`, no `autoblog.com`, no `autoevolution.com`, no `teslaoracle.com`, no `carsfrenzy.net`, no `reddit.com`, no dealer-site patterns, no enthusiast-forum domains). `cars.usnews.com` is U.S. News & World Report, not the forbidden `cars.com`.
- **Singleton trim_family check:** Every one of Mitsubishi's 24 trims is its own `trim_family`, every one has `is_base_trim: true` and `delta_from_base: null`, and every one has all four required image angles (front_three_quarter, rear_three_quarter, side_profile, interior_dashboard). The atomic-singleton convention is uniformly applied and correctly executed.
- **Powertrain.type convention:** Outlander uses `powertrain.type: "ice"` despite a 48V mild-hybrid system, in accordance with the documented project convention (Audi/BMW precedent). The trim notes call this out explicitly. No flag raised.
- **PHEV null MSRPs:** Two of four PHEV trims (SE, SEL) have `msrp_base: null` with explicit notes documenting Mitsubishi's "announced closer to launch" pricing. Per the brand-specific exception in the verification instructions, this is FYI not BLOCKER.
- **Mirage / Mirage G4** are correctly omitted (production ended 2024 as noted in the input parameters).
- **Eclipse Cross msrp_range.high blocker** is the only data-integrity issue requiring attention. Everything else is either an honest data limitation or a stylistic recommendation.
