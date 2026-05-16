# Verification Report: Jaguar

**Date:** 2026-05-13
**Data source:** `data/jaguar.json` (researched 2026-05-13)
**Models checked:** 1 (F-PACE)
**Trims checked:** 3 (P250 R-Dynamic S, P400 R-Dynamic S, SVR 575 Edition)
**Trims sampled for source verification:** 3 (full coverage; all three trims sampled)
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 0
- **Warnings:** 1
- **FYIs:** 3

---

## Blockers

None.

All three singleton trim_families correctly satisfy the atomic-rule check (`is_base_trim: true`, `delta_from_base: null`, four required image angles populated). Model `msrp_range.low`/`high` (57000/92400) match the trim-level min/max exactly. No forbidden-source URLs found across 46 URLs in the brand JSON. No broken `delta_from_base.from_trim_slug` references (all three trims have null delta). Schema conformance is clean: required keys present at brand, model, and trim levels; body_style `suv-compact` is in taxonomy; all slugs lowercase/hyphenated; powertrain.type `ice` aligns with `ev_specifics: null` and populated fuel_economy MPG fields; suv-compact body matches null `trunk_cuft` with populated `behind_2nd_row`/`behind_1st_row` on all trims.

---

## Warnings

### 1. P400 R-Dynamic S rear_three_quarter image URL points to a Jaguar gallery page, not a direct image asset

- **Model/trim:** F-PACE / P400 R-Dynamic S
- **Issue:** The `rear_three_quarter` image entry has `url: "https://www.jaguar.com/en-us/jdx/all-models/f-pace/gallery.html"` — a consumer gallery HTML page rather than a direct image asset. The trim's `images[1].needs_scraping: true` flag is correctly set and the trim `notes` document why ("JLR media centre exterior pack does not include a publishable rear three-quarter for the standard non-SVR, non-90th-Anniversary F-PACE"). The other 11 image URLs across the brand point at direct `media.production.jlrms.com` JPEGs.
- **Found in:** `models[0].trims[1].images[1].url`
- **Value seen:** `"https://www.jaguar.com/en-us/jdx/all-models/f-pace/gallery.html"`
- **Source consulted:** N/A — flagged in the data itself as `needs_scraping: true`
- **Recommendation:** Defer to Phase 4 image-scraping; document the asset substitution at that stage or accept the placeholder as known-gap. Not a forbidden source.

---

## FYIs

### 1. NHTSA and IIHS roll-up source URLs across all trims (low-volume luxury non-testing)

- **Model/trim:** F-PACE / all three trims
- **Note:** Every trim has `safety.nhtsa_overall_rating: null` and `safety.iihs_top_safety_pick: null` with corresponding `sources.safety.nhtsa_overall_rating` pointing to a per-vehicle NHTSA path (`https://www.nhtsa.gov/vehicle/2025/Jaguar/F-PACE`) and `sources.safety.iihs_top_safety_pick` pointing to the IIHS roll-up page (`https://www.iihs.org/ratings`). The model and brand-level notes document that NHTSA and IIHS have not crash-tested the current Jaguar F-PACE as a low-volume luxury SUV. Per the verification reinforcement, "Jaguar is low-volume luxury — if all Jaguar models have null NHTSA/IIHS due to non-testing of low-volume vehicles, and the brand documents this in notes, treat roll-up URLs as FYI." Notes explicitly cover this and the NHTSA URL is a per-vehicle URL (not a roll-up) — IIHS remains a roll-up because no per-vehicle IIHS page exists. Treated as FYI.

### 2. `customer_satisfaction` block at `confidence: "unknown"` with no sources

- **Model/trim:** F-PACE
- **Note:** Model has `customer_satisfaction.jd_power_apeal_score: null`, `jd_power_apeal_year: null`, `confidence: "unknown"`, `sources: []`. Summary documents that Jaguar does not appear in published JD Power APEAL premium-segment rankings for 2026 due to low US volume. The other three review blocks (reliability `low`, professional_reviews `medium`, owner_reviews `medium`) have content and confidence is not uniformly unknown, so this does not meet the "all four review blocks unknown" FYI rule from Step 2 — flagged here for the user's awareness only.

### 3. `msrp_as_equipped_estimate` is `null` on all three trims

- **Model/trim:** F-PACE / P250 R-Dynamic S, P400 R-Dynamic S, SVR 575 Edition
- **Note:** All three trims have `msrp_base` populated (57000 / 66500 / 92400) and `destination_fee` populated (1375 each), so the BLOCKER rule on null `msrp_base` does not trigger. `msrp_as_equipped_estimate` being null is consistent with the rest of the catalog and not a defect — listed here for awareness.

---

## Coverage stats

- Models with >2 null spec blocks on base trim: 0 (all three base trims have populated powertrain, fuel_economy, performance, dimensions, capacity, wheels_tires, safety, features, warranty blocks; only `ev_specifics` is null, which is expected for ICE powertrain)
- Models with <4 images per primary trim family: 0 (each singleton family has exactly the 4 required angles)
- Models with all 4 review blocks at unknown confidence: 0 (reliability:low, customer_satisfaction:unknown, professional_reviews:medium, owner_reviews:medium)
- Trims missing key sources entries: 0 (all three trims have sources for msrp_base, powertrain, fuel_economy, dimensions, performance.zero_to_60_sec, safety.nhtsa_overall_rating, safety.iihs_top_safety_pick, features, warranty)

---

## Sample details

### Sampled trims for source verification (3 of 3 — full coverage since model has only 3 trims)

1. **F-PACE / P250 R-Dynamic S** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=48985` — **result: pass.** EPA city 22 / highway 27 / combined 24 MPG, 21.9 gal tank, Premium recommended, $2,900 annual fuel cost — all four values match JSON exactly.
2. **F-PACE / P400 R-Dynamic S** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=48986` — **result: pass.** EPA city 19 / highway 25 / combined 21 MPG, 21.9 gal tank, Premium recommended, $3,300 annual fuel cost — all four values match JSON exactly.
3. **F-PACE / SVR 575 Edition** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=48987` — **result: pass.** EPA city 15 / highway 21 / combined 17 MPG, 21.9 gal tank, Premium recommended, $4,050 annual fuel cost — all four values match JSON exactly.

### Image URLs checked (5 of 12)

1. `https://media.production.jlrms.com/2022-12-12/image/797da9d4-b0f3-4c1d-8acb-17bd4352c125/Jag_F-PACE_24MY_Exterior_05_Front_GL_003_PR_141222.jpg` — F-PACE P250 R-Dynamic S front_three_quarter — **resolves (image bytes returned; tool max-content cap hit, indicating image is large but URL is valid and returning image content).**
2. `https://media.production.jlrms.com/2022-12-12/image/90a550c4-3954-4e44-b17a-cddecb609e39/Jag_F-PACE_24MY_Exterior_04_Side_GL_059_DX_141222.jpg` — F-PACE P250 R-Dynamic S side_profile — **resolves (image bytes returned; max-content cap hit; URL valid).**
3. `https://media.production.jlrms.com/2024-05-13/image/525a7e7d-1dfc-4972-9eb1-0453faa24800/F-PACE-90th-rear34.jpg` — F-PACE P250 R-Dynamic S rear_three_quarter — **resolves (image/jpeg, 9.2 MB).**
4. `https://media.production.jlrms.com/2024-05-13/image/d02ea300-519e-4066-a957-1ab034b28e4e/F-PACE-SVR-front34.jpg` — F-PACE SVR 575 Edition front_three_quarter — **resolves (image bytes returned; max-content cap hit; URL valid).**
5. `https://media.production.jlrms.com/2024-05-13/image/55368974-aebd-4f1f-b2a8-fb01db7a096b/F-PACE-SVR-Interior.jpg` — F-PACE SVR 575 Edition interior_dashboard — **resolves (image/jpeg, 8.7 MB).**

All 5 image URLs return JPEG content. Three returned >10 MB (max-content cap triggered) but all are unambiguously image responses, not 404/HTML.

---

## Notes on this verification

**Catalog copy consistency.** `catalog/data/jaguar.json` is byte-identical to `data/jaguar.json` (verified via diff — no output).

**Forbidden-source sweep.** Programmatic scan of all 46 URLs in the brand JSON returned zero hits against the forbidden-source list (cars.com, motor1.com, carbuzz.com, autoblog.com, autoevolution.com, teslaoracle.com, carsfrenzy.net, reddit.com, enthusiast-forum domains). No dealer-pattern hostnames (e.g., `<dealer>jaguar.com`) found either. The Jaguar Jordan regional site (`www.jaguar-jordan.com`) used as the dimensions source is a JLR-authorized regional manufacturer site, not a dealer or aggregator — accepted per the existing data notes.

**Singleton trim_family check.** All three trims (P250, P400, SVR) are correctly modeled as singletons per the Land Rover Defender precedent reinforced in the user prompt: each has its own `trim_family`, `is_base_trim: true`, `delta_from_base: null`, and its own 4-angle `images` array. This is the architectural pattern documented in PROJECT_STATE lesson #36 and is implemented cleanly across the F-PACE catalog.

**Borderline pricing rule (Jaguar = mainstream).** All three `msrp_base` values are populated, so the borderline mainstream-vs-ultra-luxury rule did not need to be exercised. The non-disclosure-documents-FYI path was not triggered.

**SVR 575 Final Edition exclusion.** The model and SVR notes explicitly address that the "SVR 575 Final Edition" seen on some dealer pages and aggregators at ~$95,000 is not a separately manufacturer-listed trim on jaguar.com/en-us and is not treated as a fourth trim. This aligns with SESSION_NOTES.md.

**msrp_range integrity.** `msrp_range.low: 57000` equals min trim `msrp_base` (P250). `msrp_range.high: 92400` equals max trim `msrp_base` (SVR). Exact match.

**No model-level safety roll-up URLs to flag.** The brand has only one model, so there is no model-level safety summary URL to assess. Trim-level NHTSA URLs are per-vehicle paths (already aligned with spec convention); only IIHS is a roll-up, which is expected because IIHS has no per-vehicle page for the F-PACE.

**Source verification scope.** Because the model has only 3 trims, "sample 3 random trims" covered the entire dataset. All three trims passed EPA fuel-economy cross-check exactly on every field (city, highway, combined, tank capacity, fuel type, annual fuel cost). The manufacturer URLs (`jaguar.com/en-us/jdx/all-models/f-pace/models/index.html`, `jaguar.com/en-us/jdx/about-jaguar/special-vehicle-operations/f-pace-svr-575-edition.html`) were not independently re-fetched because EPA already confirms the most-cross-checkable specs and image URLs were independently verified.

**Recommendation.** Zero blockers; 1 warning is a pre-flagged `needs_scraping` placeholder for Phase 4 (not a Phase 3 defect). Catalog is trustworthy for publishing. Address P400 rear_three_quarter at Phase 4 image-scrape time.
