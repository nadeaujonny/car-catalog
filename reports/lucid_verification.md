# Verification Report: Lucid

**Date:** 2026-05-13
**Data source:** `data/lucid.json` (researched 2026-05-13)
**Models checked:** 2 (Air, Gravity)
**Trims checked:** 6 (Air Pure, Air Touring, Air Grand Touring, Air Sapphire, Gravity Touring, Gravity Grand Touring)
**Trims sampled for source verification:** 3 (Air Pure, Air Sapphire, Gravity Grand Touring)
**Image URLs spot-checked:** 5 (lucidmotors.com per-trim product pages — all 4 Air trims + Gravity)

---

## Summary

- **Blockers:** 0
- **Warnings:** 7
- **FYIs:** 5

## Blockers

None.

Schema, forbidden-source, singleton trim_family, msrp_range, and delta_from_base reference checks all passed:
- All 6 trims have `msrp_base` populated (no null MSRP).
- No forbidden-source URLs found (cars.com, motor1.com, carbuzz.com, autoblog.com, autoevolution.com, teslaoracle.com, carsfrenzy.net, reddit, dealer-site patterns, enthusiast forums — none present).
- All 6 trims are singleton trim_families (air-pure, air-touring, air-grand-touring, air-sapphire, gravity-touring, gravity-grand-touring). Each has `is_base_trim: true`, `delta_from_base: null`, and all 4 required image angles (front_three_quarter, rear_three_quarter, side_profile, interior_dashboard). PASS.
- `msrp_range.low/high` correctly equals min/max `msrp_base` for both models (Air: 70900/249000; Gravity: 79900/94900).
- Sedan (Air): trunk_cuft populated, behind_2nd_row and behind_1st_row null. PASS.
- SUV-3row (Gravity): behind_2nd_row and behind_1st_row populated, trunk_cuft null. PASS.
- ev_specifics populated on all EV trims. PASS.

## Warnings

### 1. EV trims have non-null city/highway/combined MPG fields
- **Model/trim:** All 6 Lucid trims (Air Pure, Air Touring, Air Grand Touring, Air Sapphire, Gravity Touring, Gravity Grand Touring)
- **Issue:** Per the Step 5 schema rule (`If powertrain.type is ev: fuel_economy.city_mpg/highway_mpg/combined_mpg should be null; ev_specifics.mpge_combined should be populated`), the per-trim `fuel_economy.city_mpg`, `highway_mpg`, and `combined_mpg` should be null on EVs. In this dataset they are populated with MPGe values (e.g., Air Pure city_mpg: 149, highway_mpg: 142, combined_mpg: 146).
- **Found in:** `models[0..1].trims[*].fuel_economy.{city_mpg,highway_mpg,combined_mpg}`
- **Value seen:** Air Pure 149/142/146; Air Touring 136/132/134; Air GT 129/126/128; Air Sapphire 108/101/105; Gravity Touring 115/106/111; Gravity GT 113/103/108.
- **Source consulted:** https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49969 — values themselves are accurate MPGe figures from EPA; the issue is that they're stored in the MPG field rather than left null. `ev_specifics.mpge_combined` is also populated on all 6 trims, so no information is lost.
- **Recommendation:** Decide whether the schema's "EV city/hwy/combined should be null" rule is meant strictly. If preserved, null these three fields on all EV trims (keep `epa_annual_fuel_cost_usd` and `fuel_type_required`). If the convention has shifted to store MPGe in those fields for EVs, update the schema rule. Same pattern likely exists in other EV-only brands (Tesla, Rivian, Polestar).

### 2. Gravity Touring NHTSA source is a roll-up URL (mainstream brand)
- **Model/trim:** Lucid Gravity Touring
- **Issue:** `sources.safety.nhtsa_overall_rating` points to the NHTSA ratings home/roll-up search page rather than a per-vehicle NHTSA page. Per Step 5 rule, this is a WARNING for mainstream brands (Lucid is mainstream per the input brief).
- **Found in:** `models[1].trims[0].sources["safety.nhtsa_overall_rating"]`
- **Value seen:** `"https://www.nhtsa.gov/ratings"`
- **Source consulted:** Notes document that NHTSA has not yet rated the 2026 Gravity, which justifies the absence of a per-vehicle URL.
- **Recommendation:** When NHTSA publishes a Gravity rating, update to `https://www.nhtsa.gov/vehicle/2026/LUCID/GRAVITY/...`. For now, the roll-up URL is the only available source — acceptable but flagged for review.

### 3. Gravity Grand Touring NHTSA source is a roll-up URL (mainstream brand)
- **Model/trim:** Lucid Gravity Grand Touring
- **Issue:** Same as above — `sources.safety.nhtsa_overall_rating` is a roll-up URL.
- **Found in:** `models[1].trims[1].sources["safety.nhtsa_overall_rating"]`
- **Value seen:** `"https://www.nhtsa.gov/ratings"`
- **Recommendation:** Same as above.

### 4. Gravity Touring curb weight is calculated/derived, not manufacturer-published
- **Model/trim:** Lucid Gravity Touring
- **Issue:** `dimensions.curb_weight_lb` = 5673 is computed as Gravity GT curb weight (5,903) minus an InsideEVs charging-test-derived 230 lb delta per the trim's own notes. InsideEVs is flagged in the input brief as "WARNING (not primary)" if it had been used in a source URL. Here it is referenced only in the prose note, but the value depends on it.
- **Found in:** `models[1].trims[0].dimensions.curb_weight_lb` (and notes prose)
- **Value seen:** `5673` (estimated)
- **Source consulted:** Lucid press release & spec sheet (not yet publishing Touring-specific curb weight as of 2026-05-13).
- **Recommendation:** When Lucid publishes a Touring curb weight, replace the derived value. Until then, the curb_weight figure is best-effort and should be flagged in any user-facing display (or set to null).

### 5. Lucid Air per-trim `powertrain` source for Touring points to the product page, not the spec PDF
- **Model/trim:** Lucid Air Touring
- **Issue:** Inconsistent source URL pattern. The other three Air trims (Pure, GT, Sapphire) use the technical-specs PDF for `powertrain` and `dimensions`; Touring uses the live product page for `powertrain` but the spec PDF for `dimensions`.
- **Found in:** `models[0].trims[1].sources.powertrain`
- **Value seen:** `"https://lucidmotors.com/air-touring"` (vs other trims' PDF URL pattern `lucidmotors.com/media/document/lucid-air-touring-technical-specs-2025.pdf`)
- **Recommendation:** Either confirm the Touring-specific 2025 spec PDF was used (note in brief mentions "lucidmotors.com/media/document/lucid-air-touring-technical-specs-2025.pdf" is cited for dimensions), and update the powertrain source to match — or document why the product page is used instead.

### 6. Multiple Lucid model-level reliability/owner-review summaries reference `consumerreports.org` and `kbb.com` URLs that may not deep-link to the cited brand-specific reliability score
- **Model/trim:** Lucid Air (model-level `reliability.sources`, `owner_reviews.sources`); Lucid Gravity (model-level `reliability.sources`, `owner_reviews.sources`)
- **Issue:** The CR predicted reliability of 2/5 cited for Air relies on `https://www.consumerreports.org/cars/lucid/air/2026/reliability/`. CR pages frequently paywall the predicted-reliability score, so the source may not be publicly verifiable. Similarly the JD Power link for Air `https://www.jdpower.com/cars/2026/lucid/air` likely just shows the model overview, not a VDS score (because there is none).
- **Found in:** `models[0].reliability.sources`, `models[0].owner_reviews.sources`, `models[1].reliability.sources`
- **Value seen:** consumerreports.org and jdpower.com URLs (paywall risk)
- **Recommendation:** Confirm these URLs are publicly readable; if paywalled, add a note that the cited score is from a paywalled CR/JDP page. The data values themselves (CR 2/5 for Air; "unknown" for Gravity) are honest given the sources.

### 7. Gravity Grand Touring MSRP $94,900 differs from current lucidmotors.com display of $98,900
- **Model/trim:** Lucid Gravity Grand Touring
- **Issue:** Live lucidmotors.com/gravity page (verified 2026-05-13) now shows Grand Touring starting at **$98,900**. The dataset records **$94,900** for the 2026 MY GT, which is the pre-refresh value. The trim's own notes explicitly explain this: "The 2027 MY Gravity refresh (April 2026) replaced the 2026 GT MSRP $94,900 with $98,900..." and the input brief confirms the 2027 MY refresh is intentionally excluded.
- **Found in:** `models[1].trims[1].msrp_base`
- **Value seen:** `94900` (data); live manufacturer page shows `98900`
- **Source consulted:** https://lucidmotors.com/gravity (live, 2026-05-13)
- **Recommendation:** This is a documented intentional choice for the 2026 MY cutoff; record warning so the catalog publish step knows the manufacturer page no longer matches our stored MSRP. Consider linking to the ir.lucidmotors.com 2026 GT launch press release as canonical source for the 2026 MY $94,900 figure (which it already does — `sources.msrp_base` correctly points to the IR release, not the live product page).

## FYIs

### 1. IIHS source URLs are roll-up pages across all 6 trims
- **Model/trim:** All 6 Lucid trims
- **Note:** `sources.safety.iihs_top_safety_pick` = `https://www.iihs.org/ratings` on every trim. IIHS has not crash-tested any Lucid model. Per the input brief: "IIHS hasn't tested any Lucid — null with notes warrants FYI for IIHS only." Notes on each trim correctly document this. Acceptable until IIHS publishes a per-vehicle Lucid page.

### 2. JD Power VDS / APEAL unavailable for Lucid (low US sales volume)
- **Model/trim:** Lucid Air, Lucid Gravity (both models)
- **Note:** `reliability.jd_power_vds_score` and `customer_satisfaction.jd_power_apeal_score` are null on both models with `confidence: "unknown"` and a summary explaining JD Power does not publish results for Lucid. Per input brief: "JD Power and IIHS unknown is expected — FYI, not blocker." Acceptable.

### 3. Lucid Gravity 2027 MY refresh (announced April 2, 2026) is correctly excluded
- **Model/trim:** Lucid Gravity Grand Touring
- **Note:** Confirmed per input brief and documented in trim notes. The 2027 MY refresh adjusts the GT MSRP to $98,900 and adds DreamDrive 2 Premium + Comfort & Convenience standard. The catalog correctly uses 2026 MY values. The "Dream Edition" Gravity is similarly excluded as a limited-launch trim no longer orderable.

### 4. Lucid Gravity model-level `customer_satisfaction.sources` is an empty array
- **Model/trim:** Lucid Gravity
- **Note:** `models[1].customer_satisfaction.sources = []`. With `confidence: "unknown"`, this is internally consistent — there is no source to cite. FYI for future: the Air uses kbb.com as the customer_satisfaction source even at "unknown" confidence; Gravity could similarly cite kbb.com/lucid/gravity for parity, though there's no obligation.

### 5. Lucid Air Sapphire `dimensions` source uses the 2024 spec PDF, not 2025/2026
- **Model/trim:** Lucid Air Sapphire
- **Note:** `sources.dimensions` and `sources.powertrain` point to `lucid-air-sapphire-technical-specs-2024.pdf`. Notes document this: "Sapphire's powertrain has been unchanged since launch" — the 2024 spec sheet is acknowledged as the most recent. Acceptable.

## Coverage stats

- Models with >2 null spec blocks on base trim: 0
- Models with <4 images: 0 (all 6 singleton trims have all 4 required image angles)
- Models with all 4 review/reliability blocks at unknown confidence: 0 (Air has reliability/professional_reviews/owner_reviews at low or medium; Gravity has reliability + customer_satisfaction at unknown but professional_reviews medium and owner_reviews low)
- Trims missing key sources entries (msrp_base, powertrain, fuel_economy, dimensions): 0

## Sample details

### Sampled trims for source verification

1. **Lucid Air Pure** — checked `fuel_economy` source: https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49969 — PASS. EPA page returns city_mpg 149, highway_mpg 142, combined_mpg 146, range 420 mi — exact match with JSON. Also confirmed `https://lucidmotors.com/air-pure` resolves to live product page with "Buy from $70,900" and "420 mi / 4.5 sec 0-60" — matches JSON `msrp_base: 70900` and `zero_to_60_sec: 4.5`.

2. **Lucid Air Sapphire** — checked `msrp_base` source: https://lucidmotors.com/air-sapphire — PASS. Page shows "Fully Equipped at $249,000" — matches JSON `msrp_base: 249000`. Notes acknowledge a "$250,500" figure in some 2026 launch coverage; live page confirms $249,000.

3. **Lucid Gravity Grand Touring** — checked `fuel_economy` source: https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49670 — PASS. EPA page returns city_mpg 113, highway_mpg 103, combined_mpg 108, range 450 mi — exact match with JSON. Note: live `lucidmotors.com/gravity` now displays $98,900 for GT (post-refresh) vs JSON's $94,900 — see Warning #7 (documented intentional 2026 MY cutoff).

### Image URLs checked

All 5 sampled URLs from the `images[].url` field point to HTML product pages on lucidmotors.com rather than direct image URLs — consistent with every trim having `needs_scraping: true` and confirms image URLs need to be scraped in Phase 4.

1. https://lucidmotors.com/air-pure — Air Pure all angles — resolves to HTML product page, needs scraping confirmed
2. https://lucidmotors.com/air-touring — Air Touring all angles — resolves to HTML product page, needs scraping confirmed
3. https://lucidmotors.com/air-grand-touring — Air Grand Touring all angles — resolves to HTML product page, needs scraping confirmed
4. https://lucidmotors.com/air-sapphire — Air Sapphire all angles — resolves to HTML product page, needs scraping confirmed
5. https://lucidmotors.com/gravity — Gravity Touring + Grand Touring all angles — resolves to HTML product page, needs scraping confirmed

Note: per project convention `needs_scraping: true` indicates that Phase 4 (image scrape) is gated, so the URLs being product pages rather than direct image URLs is by design.

## Notes on this verification

- **No forbidden-source URLs found anywhere in the data.** Every URL in `sources` maps, `professional_reviews.links`, `reliability.sources`, `customer_satisfaction.sources`, `owner_reviews.sources`, and `images[].url` is from an approved source: lucidmotors.com, ir.lucidmotors.com, fueleconomy.gov, nhtsa.gov, iihs.org, consumerreports.org, jdpower.com, kbb.com, edmunds.com, or thedrive.com. The brief flagged that insideevs.com might have been used for Gravity Touring curb weight; insideevs.com is referenced only in the prose note (not in any URL field). The derived curb weight is flagged separately as Warning #4.
- **Singleton trim_family architecture is correctly applied.** Each of the 6 Lucid trims is its own trim_family with `is_base_trim: true` and `delta_from_base: null`. This avoids the recurring architectural error referenced in PROJECT_STATE.md lesson #36.
- **EV-only brand handling is consistent** except for the city_mpg/highway_mpg/combined_mpg null convention (Warning #1).
- **Source verification spot-checks all matched the data exactly** for the spec-bearing values (MPGe figures, range, MSRP, 0-60 time). The only manufacturer-page drift is the Gravity GT MSRP, which is intentional per the 2026 MY cutoff documented in the input brief.
- **NHTSA Air ratings** are sourced from a Lucid IR press release rather than NHTSA per-vehicle pages, which is acceptable per the brief's "MY25 carryforward" note for Air.
- One WebFetch (the NHTSA Air rating press release) timed out and was not directly verified in this pass; the URL is the per-press-release format, not a roll-up. Not flagged because brief explicitly affirms "Air variants 5-star (MY25 carryforward)".
- Verification completed within the 10-minute cap. No incomplete sections.
