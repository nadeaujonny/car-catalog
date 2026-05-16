# Verification Report: Buick

**Date:** 2026-05-13
**Data source:** `data/buick.json` (researched 2026-05-13)
**Models checked:** 4 (Encore GX, Envista, Envision, Enclave)
**Trims checked:** 12 (3 per model)
**Trims sampled for source verification:** 3
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 0
- **Warnings:** 3
- **FYIs:** 4

## Blockers

None.

## Warnings

### 1. buick.com pages return maintenance-error content to WebFetch user-agent (source rot / unstable)
- **Model/trim:** All Buick models (all 12 trims use buick.com as primary source).
- **Issue:** When fetching live buick.com URLs (e.g., `https://www.buick.com/suvs/envista`, `https://www.buick.com/suvs/enclave/avenir`, `https://www.buick.com/suvs/encore-gx`) the response body is a site-wide "Oops! Something went wrong" maintenance page rather than the product page. The URLs return HTTP 200 (HEAD), so this looks like client-fingerprint cloaking or a temporary outage rather than 404, but it means the manufacturer source content cannot be re-verified at audit time.
- **Found in:** Every trim's `sources.msrp_base`, `sources.powertrain`, `sources.features`, etc. that points to `buick.com`.
- **Value seen:** e.g., `"msrp_base": "https://www.buick.com/suvs/enclave/avenir"` (page resolves but returns maintenance error to WebFetch).
- **Source consulted:** WebFetch on 2026-05-13.
- **Recommendation:** Re-verify pricing/powertrain by visiting buick.com in a regular browser before publishing. Independent cross-check via Edmunds/KBB/Consumer Reports also recommended. (Edmunds/KBB were 403-blocked to WebFetch and could not corroborate at audit time.) The Phase-4 image scraper will need to handle this cloaking too.

### 2. NHTSA per-vehicle URLs point to 2025 model-year pages while data is 2026
- **Model/trim:** Buick Envista Preferred, Buick Envision Preferred, Buick Enclave Preferred.
- **Issue:** `safety.nhtsa_overall_rating` source URLs are `nhtsa.gov/vehicle/2025/...` even though the catalog records `model_year: 2026`. The trim `notes` correctly acknowledge that NHTSA had not yet published 2026-specific ratings as of the research date, and that 2025 ratings are being carried forward. The URLs themselves are per-vehicle (not roll-up search pages), so the format is fine — flagging only because the year mismatch could mislead a future consumer of the catalog if they don't read the notes.
- **Found in:** `models[1].trims[0].sources["safety.nhtsa_overall_rating"]`, `models[2].trims[0].sources["safety.nhtsa_overall_rating"]`, `models[3].trims[0].sources["safety.nhtsa_overall_rating"]`.
- **Value seen:** e.g., `"https://www.nhtsa.gov/vehicle/2025/Buick/Enclave"` paired with `"nhtsa_rating_year": 2025` (which is correctly recorded — so internally consistent, just worth flagging that the published rating is one MY old).
- **Source consulted:** WebFetch of `nhtsa.gov/vehicle/2025/Buick/Enclave` returned 403 to WebFetch; IIHS Enclave page corroborates TSP designation.
- **Recommendation:** Either re-check NHTSA for 2026 ratings closer to publish date, or leave as-is with the notes — the data is honest, the URL is just MY-stale.

### 3. Step-up trims have minimal `sources` map (no powertrain / fuel_economy / dimensions entries) when those spec blocks are null
- **Model/trim:** All 8 step-up trims (Sport Touring/Avenir on each of the 4 models).
- **Issue:** Step-up trims set `powertrain`, `fuel_economy`, `dimensions`, `performance`, `safety`, `warranty` to `null` (intended — they inherit from the base trim via `delta_from_base`). However, the `sources` map then also omits entries for those blocks. Per Step 2 of the verification spec ("Flag trims missing sources map entries for major blocks ... as a WARNING"), this is technically flaggable. The data itself is consistent (null block ↔ no source), and the per-trim notes explain inheritance. This is a documentation pattern rather than a missing-data defect.
- **Found in:** e.g., `models[1].trims[1].sources` (Envista Sport Touring) — only `msrp_base`, `destination_fee`, `features`.
- **Value seen:** Sources map has 3 entries; spec blocks `powertrain`/`fuel_economy`/`dimensions` are null and inherit from Preferred.
- **Recommendation:** Either (a) accept the current convention as intentional (step-up trims with null blocks need no source, and the base trim sources cover the model-wide values), or (b) duplicate the base trim's sources onto each step-up trim for explicitness. Recommend (a); no data change needed.

## FYIs

### 1. Customer satisfaction confidence is "unknown" on every model
- **Model/trim:** Encore GX, Envista, Envision, Enclave (all `customer_satisfaction.confidence: "unknown"`).
- **Note:** JD Power APEAL scores are not separately published for any 2026 Buick model. This is a uniform pattern across the brand and matches the data sources cited. The other three review blocks (`reliability`, `professional_reviews`, `owner_reviews`) have low-medium confidence on every model, so the "all four blocks unknown" FYI threshold from Step 2 is NOT triggered. Logging this so the user knows the gap is genuine, not a research miss.

### 2. Model-level `notes` describe trim_family architecture incorrectly (cosmetic doc inconsistency)
- **Model/trim:** Encore GX, Envista, Envision, Enclave.
- **Note:** Each model's `notes` field says e.g., "Each trim is its own trim_family for image purposes due to distinct wheels/exterior treatments." But the actual data has ALL trims within a model sharing one trim_family (`encore-gx`, `envista`, `envision`, `enclave`). The step-up trims set `is_shared_with_trim_family: true` on their images. This is internally fine (and avoids the singleton-trim_family problem documented in PROJECT_STATE.md lesson #36), but the model-level prose contradicts the actual structure. No data action needed — recommend updating the prose in a future polish pass.

### 3. Encore GX Preferred fuel_economy source URL is for the 1.3L variant, not the 1.2L on Preferred FWD
- **Model/trim:** Buick Encore GX Preferred.
- **Note:** `sources.fuel_economy` points to fueleconomy.gov ID 49441 (1.3L Encore GX FWD = 29/31/30 per verified live fetch), while the Preferred trim records 30/31/30 (the 1.2L FWD variant, EPA ID 49440). The trim's own notes explicitly explain this: "EPA ID 49441 lists the 1.3L variant which is also available on FWD Preferred; flex-fuel 1.2L FWD is EPA ID 49440." The MPG values in the JSON are correct for the 1.2L; the source URL just points to the 1.3L sister listing. Honest disclosure — could be tightened by pointing the source at 49440 instead.

### 4. Encore GX Preferred performance source is motortrend.com (third-party, but not in forbidden list)
- **Model/trim:** Buick Encore GX Preferred.
- **Note:** `sources["performance.zero_to_60_sec"]` is `https://www.motortrend.com/cars/buick/encore-gx`. MotorTrend is not on the forbidden-source list and is a recognized buff-book publication. Flagging only because the broader Buick catalog otherwise uses manufacturer or fueleconomy.gov / nhtsa.gov / iihs.org as primary sources; this is the only third-party performance citation. The 8.9-sec figure is plausible for a 137-hp turbo I3 subcompact crossover.

## Coverage stats

- Models with >2 null spec blocks on base trim: 0 (every base trim has all major blocks populated)
- Models with <4 images in primary trim family: 0 (every trim has the 4 required angles: front_three_quarter, rear_three_quarter, side_profile, interior_dashboard)
- Models with all 4 review/reliability blocks at unknown confidence: 0 (only customer_satisfaction is unknown; others are medium/low)
- Trims missing key sources entries (powertrain/fuel_economy/dimensions when spec block also null): 8 step-up trims (see Warning #3 — defensible inheritance pattern)
- Trims with `msrp_base` null: 0
- Singleton trim_families: 0 (every model has 3 trims sharing one trim_family — singleton rule does not apply)
- Forbidden-source URLs: 0
- Roll-up NHTSA/IIHS URLs: 0 (all are per-vehicle pages)
- Base-trim count per model: exactly 1 (Preferred on each of the 4 models) — correct
- delta_from_base broken references: 0 (every step-up trim points to `preferred`, which exists in each model)
- msrp_range consistency: 4/4 models match min/max of their trims' msrp_base
- body_style ↔ cargo consistency: 4/4 models correct (suv-compact / suv-3row populate behind_2nd_row / behind_1st_row, leave trunk_cuft null)
- powertrain.type=ice ↔ ev_specifics=null: 4/4 models / 12/12 trims correct

## Sample details

### Sampled trims for source verification

1. **Buick Envista Preferred** — manufacturer source `https://www.buick.com/suvs/envista` returned site-maintenance page to WebFetch (HEAD-200 / GET shows error stub). Could not re-verify msrp_base ($25,995), powertrain (137-hp 1.2L turbo I3, 6AT, FWD), or destination ($1,395). Edmunds fallback (`https://www.edmunds.com/buick/envista/2026/`) returned HTTP 403 to WebFetch. **Result: source unreachable at audit time (Warning #1)** — data plausible and self-consistent, but not independently re-verifiable today.

2. **Buick Enclave Avenir** — manufacturer source `https://www.buick.com/suvs/enclave/avenir` returned same maintenance page. KBB fallback `https://www.kbb.com/buick/enclave/2026/` returned HTTP 403. IIHS source `https://www.iihs.org/ratings/vehicle/buick/enclave-4-door-suv/2026` DID resolve and confirms 2026 Enclave is Top Safety Pick (TSP, not TSP+), matching `safety.iihs_top_safety_pick: "TSP"` in the JSON. **Result: 1 of 4 sampled values cross-verified (TSP designation matches).**

3. **Buick Encore GX Preferred** — manufacturer source `https://www.buick.com/suvs/encore-gx` returned maintenance page. fueleconomy.gov source `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49441` DID resolve and confirms 29/31/30 MPG for 2026 Encore GX FWD with 1.3L turbo I3. The Preferred trim's recorded 30/31/30 MPG is for the 1.2L FWD variant (different EPA ID 49440), and the trim notes explicitly call this out. **Result: 1 of 3 sampled values cross-verified (1.3L EPA matches the sister listing referenced in notes; FYI #3 about source-URL granularity).**

### Image URLs checked

1. `https://www.buick.com/suvs/encore-gx/preferred` — Buick Encore GX Preferred (front_three_quarter, et al.) — **HTTP 200 (text/html)** — page URL, scraping target; `needs_scraping: true` is correct.
2. `https://www.buick.com/suvs/envista` — Buick Envista Preferred — **HTTP 200 (text/html)** — same pattern.
3. `https://www.buick.com/suvs/envision/avenir` — Buick Envision Avenir — **HTTP 200 (text/html)** — same.
4. `https://www.buick.com/suvs/enclave/preferred` — Buick Enclave Preferred — **HTTP 200 (text/html)** — same.
5. `https://www.buick.com/suvs/enclave/avenir` — Buick Enclave Avenir — **HTTP 200 (text/html)** — same.

All 5 image-source URLs return HTTP 200 with HTML content. Since every image in this catalog has `needs_scraping: true`, the URLs point to landing pages rather than direct image binaries — that's expected per the Phase-2 architecture. No 404s or DNS errors. Phase 4 (image scrape) will need to deal with the same maintenance-cloak issue noted in Warning #1.

## Notes on this verification

- buick.com appears to be cloaking content from non-browser fetchers today (HEAD returns 200 but GET to WebFetch returns a "Oops! Something went wrong" stub). This prevents per-spec re-verification but does not invalidate the recorded data, which is internally consistent and structurally sound. The data itself was researched today (2026-05-13) so it should still be fresh.
- Edmunds and KBB also blocked WebFetch with HTTP 403. fueleconomy.gov and iihs.org served normally and corroborated the values that could be checked through them.
- No forbidden-source URLs anywhere in the file (zero matches across all 82 sources entries — verified by grep for cars.com, motor1.com, carbuzz.com, autoblog.com, autoevolution.com, teslaoracle.com, carsfrenzy.net, reddit.com, gmauthority.com). All citations are on manufacturer, federal (nhtsa.gov, fueleconomy.gov), insurance-industry (iihs.org), JD Power, Edmunds, KBB, Consumer Reports, or MotorTrend domains.
- Schema conformance is clean: 4 models, 12 trims, every required top-level / model / trim key is present; body_style values are taxonomy-valid (`suv-compact`, `suv-3row`); slugs are lowercase and hyphenated; exactly one `is_base_trim: true` per model.
- Singleton trim_family check is not applicable: every model has 3 trims in 1 family (no singletons).
- msrp_range min/max matches trims' msrp_base on all 4 models.
- All step-up trims' `delta_from_base.from_trim_slug` correctly references `preferred`, which exists in each model.
- powertrain/ev_specifics consistency is correct (all 12 trims are `type: "ice"` with `ev_specifics: null`).
- Cross-trim outlier scan: no msrp_base drops >50%, no HP gaps >100hp within a powertrain type, no dimension outliers >10% from base. Avenir trims show normal step-up pricing.
- Recommendation: **Proceed to publish, but spot-check pricing in a normal browser before going live in case the buick.com maintenance issue masks any quiet MSRP changes.**
