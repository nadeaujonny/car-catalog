# Verification Report: Lotus

**Date:** 2026-05-13
**Data source:** `data/lotus.json` (researched 2026-05-13)
**Models checked:** 3 (Emira, Eletre, Emeya)
**Trims checked:** 6 (Emira Turbo SE, Emira Turbo SE Racing Line, Emira V6 SE, Emira V6 SE Racing Line, Eletre Carbon, Emeya R)
**Trims sampled for source verification:** 3 (Emira Turbo SE, Eletre Carbon, Emeya R)
**Image URLs spot-checked:** 5

`data/lotus.json` and `catalog/data/lotus.json` are byte-identical (Phase 2 sync confirmed).

---

## Summary

- **Blockers:** 0
- **Warnings:** 0
- **FYIs:** 7

## Blockers

None.

## Warnings

None.

## FYIs

### 1. Emeya R msrp_base is null (ultra-luxury non-disclosure, documented)
- **Model/trim:** Lotus Emeya R
- **Note:** `models[2].trims[0].msrp_base` is `null`. Lotus does not publish a US MSRP for the Emeya on lotuscars.com/en-US, in any press release, or via any primary Lotus channel. Confirmed by direct WebFetch of https://www.lotuscars.com/en-US/emeya — no pricing displayed. The trim's `notes` field documents the non-disclosure ("Lotus does NOT publish the Emeya R US MSRP on lotuscars.com/en-US (verified via direct WebFetch)"). The model `msrp_range.low`/`high` are correspondingly null, which is the consistent and correct downstream result. Per spec §13 and Phase 3 reinforcement, this is FYI not blocker. The widely-quoted ~$120,000 figure from secondary aggregators is not supported by any primary Lotus source.

### 2. NHTSA/IIHS safety ratings are null across all trims (no Lotus crash-testing)
- **Model/trim:** All 6 Lotus trims
- **Note:** `safety.nhtsa_overall_rating` and `safety.iihs_top_safety_pick` are null on every trim, with corresponding year fields also null. NHTSA and IIHS do not crash-test Lotus due to low US sales volume. The NHTSA source URLs are per-vehicle pattern (e.g., `nhtsa.gov/vehicle/2026/LOTUS/EMIRA`) — these return HTTP 403 when fetched directly (anti-scraper response, not URL rot), but they represent the canonical per-vehicle URL pattern. The IIHS sources are the roll-up `iihs.org/ratings` URL. Per Phase 3 ultra-luxury exemption (lotus is on the §5 list), this is FYI not warning.

### 3. JD Power VDS/APEAL and Consumer Reports confidence: unknown
- **Model/trim:** All 3 Lotus models (Emira, Eletre, Emeya)
- **Note:** Both `reliability` and `customer_satisfaction` blocks are at `confidence: "unknown"` for all three models. JD Power does not publish VDS or APEAL for Lotus due to low US sales volume. Consumer Reports has insufficient sample for a numeric predicted-reliability score. This reflects the genuine absence of available data, not a research gap, and is correctly documented. Per Phase 3 reinforcement, FYI for Lotus.

### 4. Eletre and Emeya have no EPA fueleconomy.gov entries; brand-browse fallback used
- **Model/trim:** Lotus Eletre Carbon and Lotus Emeya R
- **Note:** EPA fueleconomy.gov has no listing for either model at any model year — confirmed in trim notes ("Chinese-built EVs from Geely's Lotus Tech are not yet US-EPA-tested per fueleconomy.gov PowerSearch 2026"). Both trims use the EPA brand-browse search URL `https://www.fueleconomy.gov/feg/PowerSearch.do?action=noform&path=1&year1=2026&year2=2026&make=Lotus&srchtyp=ymm&rowLimit=200` as the `sources.fuel_economy` fallback per spec §4. `fuel_economy.city_mpg`/`highway_mpg`/`combined_mpg` are null on both EV trims, and `ev_specifics.mpge_combined` is null on both. WLTP-only range claims (Eletre 280 mi, Emeya 379 mi) noted in trim notes but no EPA range published.

### 5. Owner-reviews blocks at unknown confidence across all models
- **Model/trim:** All 3 Lotus models
- **Note:** `owner_reviews.edmunds_star_rating`, `kbb_star_rating`, and their respective sample sizes are null on every model. Lotus's low US sales volume produces sample sizes too small for meaningful aggregate ratings on either platform. Documented honestly with `confidence: "unknown"` and a summary explaining the gap.

### 6. Emira V6 SE / V6 SE Racing Line uses 2026 model-browse EPA URL (V6 not yet separately published for 2026)
- **Model/trim:** Lotus Emira V6 SE and V6 SE Racing Line
- **Note:** EPA fueleconomy.gov 2026 has published only the I4 turbo (id 50045) for the Emira. Trim notes explain MPG values 16/24/19 carry from the mechanically-identical 2025 EPA listing (id 49130) since Lotus has not changed the V6 mechanical package. `sources.fuel_economy` correctly points to the 2026 Lotus Emira model-browse page rather than a stale 2025 per-vehicle URL. `epa_annual_fuel_cost_usd` is null on both V6 SE trims (not yet published for 2026). Documented and consistent with spec §4 EPA-unavailable fallback rule.

### 7. Emira warranty terms differ between US and EU markets (warranty source is en-IT page)
- **Model/trim:** All 4 Emira trims
- **Note:** `sources.warranty` for all Emira trims points to `https://www.lotuscars.com/en-IT/lotus-warranty/emira` (Italian Lotus warranty page). WebFetch confirms the IT page describes "3-year warranty... no mileage limitation" and 8-year corrosion. The JSON values (`3yr/36k` basic, `3yr/36k` corrosion) reflect the US-market warranty terms, which differ from EU (US has the 36k mileage cap; EU has no mileage limit and longer corrosion). The model `notes` field documents the US 3yr/36k coverage. The discrepancy between source-page terms and JSON terms is intentional and explained, but flagging here so reviewers know the warranty source URL is the EU page rather than a US-specific page (Lotus US does not publish a separate detailed Emira warranty page).

## Coverage stats

- Models with >2 null spec blocks on base trim: 0
- Models with <4 images: 0 (every trim has all 4 required angles)
- Models with all 4 review blocks at unknown confidence: 0 (all 3 models have `professional_reviews.confidence: "medium"` while the other 3 blocks are `unknown`)
- Trims missing key sources entries (msrp_base/powertrain/fuel_economy/dimensions): 0

## Sample details

### Sampled trims for source verification
1. **Lotus Emira Turbo SE** — checked against https://www.lotuscars.com/en-US/emira and https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=50045 — result: pass.
   - Page shows Emira Turbo SE with 8-speed DCT and 0-62 in 4.0 seconds (matches JSON `transmission` and `zero_to_60_sec`).
   - EPA id 50045 shows 18 city / 26 highway / 21 combined MPG and $2,850 annual fuel cost (exact match with JSON `fuel_economy.city_mpg`, `highway_mpg`, `combined_mpg`, `epa_annual_fuel_cost_usd`).
   - Page does not display MSRP, so msrp_base $106,900 verified against the press release URL (sources.msrp_base).
2. **Lotus Eletre Carbon** — checked against https://www.lotuscars.com/en-US/eletre — result: pass.
   - Page shows "Starting from $229,900" — exact match with JSON `msrp_base: 229900`.
   - Page shows "maximum range of 280 miles" — matches the WLTP claim documented in trim notes.
   - 350kW charging implied by "200 miles in just 20 minutes" claim — consistent with JSON `dc_fast_charge_peak_kw: 350`.
3. **Lotus Emeya R** — checked against https://www.lotuscars.com/en-US/emeya — result: pass (with documented non-disclosure).
   - Page shows "905 hp and 985 N·m of torque" — exact match with JSON `horsepower_hp: 905`.
   - Page does NOT show US MSRP — confirms `msrp_base: null` is correct per spec §13 ultra-luxury non-disclosure pattern (documented in trim and model notes).
   - 985 N·m converts to ~727 lb-ft; JSON has `torque_lb_ft: 726` — within rounding tolerance (matches Lotus.com source).

### Image URLs checked
1. https://www.lotuscars.com/en-US/emira — Emira Turbo SE all 4 angles (front/rear/side/interior) — status: page resolves with Emira content (URL is page-URL placeholder pending Phase 4 scrape per `needs_scraping: true`).
2. https://www.lotuscars.com/en-US/emira/models — Emira Turbo SE Racing Line, V6 SE, V6 SE Racing Line all angles — status: page resolves with Emira models content (Racing Line variant confirmed on page).
3. https://www.lotuscars.com/en-US/eletre — Eletre Carbon all 4 angles — status: page resolves with Eletre Carbon content and $229,900 starting price visible.
4. https://www.lotuscars.com/en-US/emeya — Emeya R all 4 angles — status: page resolves with Emeya R content and 905 hp visible.
5. (Bonus) https://www.lotuscars.com/en-IT/lotus-warranty/emira — Emira warranty source verification — status: resolves with EU warranty terms (3yr no mileage cap, 8yr corrosion).

All image URLs are currently page-URL placeholders with `needs_scraping: true` flagged on every entry — Phase 4 will replace these with direct media.lotuscars.com asset URLs. No image-URL resolution failures.

## Notes on this verification

- Forbidden-source check: no URLs in `sources`, `professional_reviews.links`, or `images` matched any forbidden domain. Initial regex showed false-positive matches for `cars.com` substring inside `lotuscars.com` (manufacturer site, valid). Professional review publications used: Top Gear, Autocar, Hagerty, Motor Authority, Green Car Reports, Electrek, InsideEVs — all are mainstream professional publications, none on the forbidden list. No reddit, dealer-pattern, or enthusiast-forum URLs anywhere.
- Singleton trim_family check: 6 expected singletons (Emira Turbo SE, Emira Turbo SE Racing Line, Emira V6 SE, Emira V6 SE Racing Line, Eletre Carbon, Emeya R). All 6 correctly carry `is_base_trim: true` + `delta_from_base: null` and each has all 4 required image angles (front_three_quarter, rear_three_quarter, side_profile, interior_dashboard). Lesson #36 architecture is clean.
- Multi-powertrain Emira structure (I4 + V6 as separate sole-trim families per F-150/Sierra precedent) is correctly applied.
- msrp_range consistency: Emira 106900/118400 matches min/max of trims; Eletre 229900/229900 matches the single Carbon trim; Emeya null/null is the correct propagation from the null msrp_base.
- ICE vs EV consistency: Emira (4 trims) has `ev_specifics: null` everywhere; Eletre and Emeya (EV) have populated `ev_specifics` blocks with `mpge_combined: null` correctly reflecting EPA non-coverage.
- Body-style cargo: sports-car (Emira) and sedan (Emeya) use `trunk_cuft` (5.3 and 18.0 respectively) with `behind_2nd_row`/`behind_1st_row` null. SUV-midsize (Eletre) uses `behind_2nd_row` (21.6) / `behind_1st_row` (54.1) with `trunk_cuft` null. All consistent with spec.
- Evija hypercar correctly excluded (130-unit invite-only).
- NHTSA per-vehicle URL pattern returns 403 on direct fetch — this is anti-scraper behavior, not URL rot. The URLs are the canonical per-vehicle format. Per Phase 3 NHTSA/IIHS exemption for Lotus, treated as FYI not warning.
- Zero blockers. Zero warnings. Seven FYIs that all reflect intentional, documented choices consistent with the ultra-luxury / Chinese-built-EV-tariff / low-volume-OEM patterns previously codified in spec §4 (EPA fallback), §6.4 (sole-trim atomic rule), and §13 (ultra-luxury non-disclosure). **Recommendation: proceed to publish.**
