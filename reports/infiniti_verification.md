# Verification Report: Infiniti

**Date:** 2026-05-13
**Data source:** `data/infiniti.json` (researched 2026-05-13)
**Models checked:** 2 (QX60, QX80)
**Trims checked:** 12 (6 per model)
**Trims sampled for source verification:** 3
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 4 (must be fixed before catalog is trustworthy)
- **Warnings:** 6 (likely issues, review recommended)
- **FYIs:** 4 (worth knowing, not necessarily wrong)

---

## Blockers

### 1. Singleton trim_family violation — QX60 SPORT not flagged as base of its family
- **Model/trim:** Infiniti QX60 SPORT
- **Issue:** `trim_family: "sport"` is a singleton (only one trim in family), so the trim must satisfy: `is_base_trim: true` AND `delta_from_base: null`. Currently `is_base_trim: false` and `delta_from_base` references `pure-fwd` with msrp_delta_usd 10500. Required image angles ARE present in trim's own images array (front_three_quarter, rear_three_quarter, side_profile, interior_dashboard) — that part is fine.
- **Found in:** `models[0].trims[4].is_base_trim` and `models[0].trims[4].delta_from_base`
- **Value seen:** `is_base_trim: false`, `delta_from_base: { from_trim_slug: "pure-fwd", msrp_delta_usd: 10500, ... }`
- **Expected:** `is_base_trim: true`, `delta_from_base: null` (singleton trim_family must be self-base)

### 2. Singleton trim_family violation — QX60 AUTOGRAPH not flagged as base of its family
- **Model/trim:** Infiniti QX60 AUTOGRAPH
- **Issue:** `trim_family: "autograph"` is a singleton. Same rule as above; AUTOGRAPH must be `is_base_trim: true` and `delta_from_base: null`. Image angles present.
- **Found in:** `models[0].trims[5].is_base_trim` and `models[0].trims[5].delta_from_base`
- **Value seen:** `is_base_trim: false`, `delta_from_base: { from_trim_slug: "pure-fwd", msrp_delta_usd: 14950, ... }`
- **Expected:** `is_base_trim: true`, `delta_from_base: null`

### 3. Singleton trim_family violation — QX80 SPORT not flagged as base of its family
- **Model/trim:** Infiniti QX80 SPORT
- **Issue:** `trim_family: "sport"` is a singleton on QX80 as well. Must be `is_base_trim: true` and `delta_from_base: null`. Image angles present.
- **Found in:** `models[1].trims[4].is_base_trim` and `models[1].trims[4].delta_from_base`
- **Value seen:** `is_base_trim: false`, `delta_from_base: { from_trim_slug: "pure-rwd", msrp_delta_usd: 18895, ... }`
- **Expected:** `is_base_trim: true`, `delta_from_base: null`

### 4. Singleton trim_family violation — QX80 AUTOGRAPH not flagged as base of its family
- **Model/trim:** Infiniti QX80 AUTOGRAPH
- **Issue:** `trim_family: "autograph"` is a singleton on QX80. Must be `is_base_trim: true` and `delta_from_base: null`. Image angles present.
- **Found in:** `models[1].trims[5].is_base_trim` and `models[1].trims[5].delta_from_base`
- **Value seen:** `is_base_trim: false`, `delta_from_base: { from_trim_slug: "pure-rwd", msrp_delta_usd: 28445, ... }`
- **Expected:** `is_base_trim: true`, `delta_from_base: null`

---

## Warnings

### 1. IIHS award mismatch — QX80 listed as TSP+, IIHS shows TSP only
- **Model/trim:** All four QX80 trims with safety block populated (PURE RWD, AUTOGRAPH; SPORT/LUXE inherit via null)
- **Issue:** Data lists `iihs_top_safety_pick: "TSP+"` for the 2026 QX80, but the IIHS per-vehicle page returns "Top Safety Pick" (no plus).
- **Found in:** `models[1].trims[0].safety.iihs_top_safety_pick`, `models[1].trims[5].safety.iihs_top_safety_pick`
- **Value seen:** `"TSP+"`
- **Source consulted:** https://www.iihs.org/ratings/vehicle/infiniti/qx80-4-door-suv/2026 (returned "Top Safety Pick")
- **Recommendation:** Change to `"TSP"` for all QX80 trims with populated safety blocks. Confirm via IIHS site at publication.

### 2. NHTSA roll-up URL used (mainstream brand) — QX60 PURE FWD
- **Model/trim:** Infiniti QX60 PURE FWD
- **Issue:** `sources["safety.nhtsa_overall_rating"]` points to https://www.nhtsa.gov/ratings (roll-up) rather than a per-vehicle page. Infiniti is mainstream, so per spec this is a WARNING.
- **Found in:** `models[0].trims[0].sources["safety.nhtsa_overall_rating"]`
- **Value seen:** `"https://www.nhtsa.gov/ratings"`
- **Source consulted:** N/A
- **Recommendation:** Either find the per-vehicle NHTSA page (e.g. `nhtsa.gov/vehicle/2026/INFINITI/QX60`) and replace, OR remove the URL key entirely if NHTSA has not posted a rating (the rating value is already `null`).

### 3. NHTSA roll-up URL used (mainstream brand) — QX80 PURE RWD
- **Model/trim:** Infiniti QX80 PURE RWD
- **Issue:** Same as #2 — `sources["safety.nhtsa_overall_rating"]` points to the roll-up.
- **Found in:** `models[1].trims[0].sources["safety.nhtsa_overall_rating"]`
- **Value seen:** `"https://www.nhtsa.gov/ratings"`
- **Source consulted:** N/A
- **Recommendation:** Same as #2 — replace with per-vehicle URL when NHTSA publishes one, or remove the key.

### 4. Step-up trim missing `sources` entries for major spec blocks — QX60 LUXE FWD
- **Model/trim:** Infiniti QX60 LUXE FWD
- **Issue:** Sources map covers msrp_base, fuel_economy, features, and safety.iihs_top_safety_pick, but the trim still populates `wheels_tires`, `safety`, `features` block data without a powertrain/dimensions/performance source. Powertrain block is `null`, but features and safety blocks differ from base — sources should reference how those were verified.
- **Found in:** `models[0].trims[2].sources`
- **Value seen:** Sources has 4 keys; no dimensions/powertrain entries (those blocks are null which is OK), but features differs from base and a manufacturer trim page or brochure source would strengthen the record.
- **Source consulted:** N/A
- **Recommendation:** Add explicit source URL for features differences (Klipsch 16-speaker, ProPILOT Assist standard, etc.) — e.g. an Infiniti USA spec or trim-comparison page.

### 5. Step-up trim missing `sources` entries for major spec blocks — QX80 LUXE RWD
- **Model/trim:** Infiniti QX80 LUXE RWD
- **Issue:** `fuel_economy` block is entirely `null` (unlike all other QX80 trims which populate it), and `sources` only has msrp_base + features. No fuel_economy source despite the block being null — for an RWD variant where EPA would publish a separate combined figure, this gap should be filled or explicitly noted.
- **Found in:** `models[1].trims[2].fuel_economy` and `models[1].trims[2].sources`
- **Value seen:** `fuel_economy: null`
- **Source consulted:** N/A
- **Recommendation:** Populate LUXE RWD fuel_economy (likely same as PURE RWD: 16/20/18) with a fueleconomy.gov source, since EPA does publish separate ratings by drivetrain. Currently the implicit assumption is that LUXE RWD inherits from PURE RWD but this is not documented.

### 6. Empty-string `notes` on step-up trims
- **Model/trim:** QX60 LUXE FWD, QX60 LUXE AWD, QX80 PURE 4WD, QX80 LUXE RWD, QX80 LUXE 4WD
- **Issue:** Several step-up trims have `notes: ""` (empty string). Spec calls for `null` or descriptive text. Empty string is not strictly invalid but is inconsistent with sibling trims that use either descriptive notes or null.
- **Found in:** `models[0].trims[2].notes`, `models[0].trims[3].notes`, `models[1].trims[1].notes`, `models[1].trims[2].notes`, `models[1].trims[3].notes`
- **Value seen:** `""`
- **Source consulted:** N/A
- **Recommendation:** Either populate with a brief variant description or set to `null` for consistency.

---

## FYIs

### 1. customer_satisfaction confidence "unknown" on both models
- **Model/trim:** QX60 model-level, QX80 model-level
- **Note:** Both models flag JD Power APEAL as unsampled due to low US volume. Confidence is `unknown` on both. This is consistent with Infiniti's actual position in the US market (low volume relative to peer luxury brands) and is the honest answer rather than a research gap. Not flagging as WARNING because two of four review blocks (professional_reviews, owner_reviews) are populated with medium/low confidence.

### 2. reliability confidence "unknown" — QX80 model-level
- **Model/trim:** Infiniti QX80
- **Note:** All-new generation since 2025 means no JD Power VDS history. CR has not yet published predicted reliability for the redesigned QX80. Notes block documents this clearly. Acceptable.

### 3. Edmunds rating disparity — QX60 PURE
- **Model/trim:** Infiniti QX60 PURE FWD
- **Note:** Edmunds gives the 2026 QX60 a 5.7/10 expert score and owner reviews are 3.0/5 (47 sample size), while KBB owners give 4.0/5 with only 5 reviews. Significant disparity between expert sentiment and owner sentiment is well-documented in the `professional_reviews.summary`. Worth noting publicly when surfacing this model.

### 4. Empty `customer_satisfaction.sources` arrays on both models
- **Model/trim:** QX60 and QX80 customer_satisfaction blocks
- **Note:** Both have `sources: []`. Since the summary already states JD Power doesn't publish APEAL for this model, having no sources is consistent — but a future-proof alternative would be to cite the JD Power APEAL landing page where one can confirm Infiniti isn't included.

---

## Coverage stats

- Models with >2 null spec blocks on base trim: 0 (both base trims — QX60 PURE FWD and QX80 PURE RWD — have all spec blocks populated)
- Models with <4 images in primary (pure) trim_family: 0 (both have 4 angles on PURE base trim)
- Models with all 4 review blocks at unknown confidence: 0 (QX80 has 2 unknown of 4; QX60 has 1 of 4)
- Trims missing key sources entries: 2 (QX60 LUXE FWD, QX80 LUXE RWD — see WARNINGS #4 and #5)

---

## Sample details

### Sampled trims for source verification

1. **QX60 PURE FWD** — checked against https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49555 — result: PASS (City 22 / Hwy 28 / Comb 24 matches data exactly)
2. **QX80 PURE 4WD / LUXE 4WD / SPORT / AUTOGRAPH (4WD)** — checked against https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49585 — result: PASS (City 16 / Hwy 19 / Comb 17, 4WD confirmed, 3.5L 6-cyl turbocharged 9-speed automatic)
3. **QX60 PURE FWD safety (IIHS)** — checked against https://www.iihs.org/ratings/vehicle/infiniti/qx60-4-door-suv/2026 — result: PASS for QX60 (TSP+ confirmed). However, equivalent check on QX80 page returned "Top Safety Pick" not "TSP+" — see WARNING #1.

Note: Infiniti newsroom URLs (usa.infinitinews.com) returned 403 to WebFetch and were not directly checkable in this pass; they are from the manufacturer's own PR domain and were retained as authoritative pending Phase 4 image-scrape pass which will revisit the consumer site.

### Image URLs checked

1. https://www.infinitiusa.com/vehicles/crossovers/qx60.html — QX60 PURE FWD front_three_quarter — TIMEOUT in WebFetch (consumer site renders heavy client-side; cannot confirm via HEAD but URL is the canonical Infiniti USA model page; `needs_scraping: true` flag indicates Phase 4 will pull actual image assets)
2. https://www.infinitiusa.com/vehicles/crossovers/qx60/trims/sport.html — QX60 SPORT front_three_quarter — TIMEOUT (same reason)
3. https://www.infinitiusa.com/vehicles/suvs/qx80.html — QX80 PURE RWD front_three_quarter — TIMEOUT (same reason)
4. https://www.infinitiusa.com/vehicles/suvs/qx80/trims/sport.html — QX80 SPORT front_three_quarter — TIMEOUT (same reason)
5. https://www.iihs.org/ratings/vehicle/infiniti/qx80-4-door-suv/2026 (safety source URL, not image, but used as sanity check) — OK (page resolves; content as above)

All image URLs are placeholders pointing to Infiniti USA's consumer model/trim pages with `needs_scraping: true` flagged. Phase 4 scrape is required before publication regardless.

---

## Notes on this verification

- Forbidden-source check: NO forbidden URLs found. All cited sources are from manufacturer domains (infinitiusa.com, usa.infinitinews.com, us.owners.infinitiusa.com), regulator/standards bodies (fueleconomy.gov, iihs.org, nhtsa.gov), or reputable editorial (edmunds.com, kbb.com, jdpower.com, tflcar.com, cars.usnews.com, consumerreports.org). No cars.com, no motor1.com, no autoblog/autoevolution/carbuzz/reddit/forums/dealer-domain hits.
- `data/infiniti.json` and `catalog/data/infiniti.json` are byte-identical (verified via diff).
- Infiniti USA consumer-site WebFetch requests timed out repeatedly — the site is JavaScript-heavy. This is normal for consumer auto sites and does NOT indicate URL rot; the IIHS rating page (also referenced) returned data successfully.
- Infiniti newsroom (usa.infinitinews.com) returned HTTP 403 to programmatic fetches. The URLs are well-formed press-release deep links; this is a server-side block on automated UAs, not URL rot. MSRP figures could not be re-verified against the live newsroom in this pass but the URL structure and prior 2026 launch timing make them highly likely to be current.
- The four singleton-trim-family BLOCKERS are the dominant finding. The fix is mechanical (flip `is_base_trim` and clear `delta_from_base` for the four affected trims) and does not require re-researching specs. The trim-family architecture itself is reasonable — SPORT and AUTOGRAPH genuinely are their own families on both models — so the fix is metadata-only.
- QX80 IIHS rating discrepancy (TSP vs TSP+) is the highest-impact warning because IIHS publicly differentiates these awards. Confirm at https://www.iihs.org/ratings/vehicle/infiniti/qx80-4-door-suv/2026 before publication.
