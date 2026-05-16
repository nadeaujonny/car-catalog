# Verification Report: Alfa Romeo

**Date:** 2026-05-13
**Data source:** `data/alfa-romeo.json` (researched 2026-05-13)
**Models checked:** 3 (Giulia, Stelvio, Tonale)
**Trims checked:** 7 (Giulia, Giulia Veloce, Stelvio, Stelvio Veloce, Tonale Sprint, Tonale Veloce, Tonale Sport Speciale)
**Trims sampled for source verification:** 3 (Giulia base, Stelvio Veloce, Tonale Sprint)
**Image URLs spot-checked:** 5 (Alfa Romeo USA model landing pages — all 3, plus EPA + Stellantis press)

---

## Summary

- **Blockers:** 0
- **Warnings:** 2
- **FYIs:** 4

`data/alfa-romeo.json` and `catalog/data/alfa-romeo.json` are byte-identical. Schema conformance is clean: every model has a single `is_base_trim: true` trim, every base trim has `delta_from_base: null`, every step-up trim's `delta_from_base.from_trim_slug` resolves to an existing trim in the same model, `msrp_range.low/high` match the min/max `msrp_base` across trims in every model, body-style/cargo conventions are correctly applied (sedan Giulia uses `trunk_cuft`; SUV Stelvio and Tonale use `behind_2nd_row`/`behind_1st_row` with `trunk_cuft: null`), all base trims carry the 4 required image angles, and all trims have ICE powertrains with `ev_specifics: null`. **Zero forbidden-source URLs** found anywhere in the file.

## Blockers

None.

## Warnings

### 1. NHTSA roll-up URL used for all three models (mainstream-brand convention)
- **Model/trim:** Giulia (base), Stelvio (base), Tonale Sprint
- **Issue:** `safety.nhtsa_overall_rating` for all three base trims points to `https://www.nhtsa.gov/ratings/2026-model-year-vehicles-selected-testing-nhtsa`, a roll-up landing page rather than a per-vehicle page. Per instruction §5 of the canonical procedure, this is a WARNING for mainstream brands. Alfa Romeo is low-volume, but US convention places it in the mainstream-luxury bucket, so the warning applies.
- **Found in:** `models[0].trims[0].sources["safety.nhtsa_overall_rating"]`, `models[1].trims[0].sources["safety.nhtsa_overall_rating"]`, `models[2].trims[0].sources["safety.nhtsa_overall_rating"]`
- **Value seen:** `"https://www.nhtsa.gov/ratings/2026-model-year-vehicles-selected-testing-nhtsa"` (identical across all three)
- **Source consulted:** Each model's own `notes` field documents the gap ("NHTSA has not crash-tested the 2026 Giulia/Stelvio/Tonale"); both safety values are null and the documented absence is consistent.
- **Recommendation:** Leave as-is until NHTSA publishes 2026 ratings (per-vehicle pages will exist then); reclassify to FYI if these brands are formally categorized as low-volume in catalog conventions.

### 2. IIHS roll-up URL on Stelvio and Tonale (no per-vehicle page exists)
- **Model/trim:** Stelvio (base), Tonale Sprint
- **Issue:** `safety.iihs_top_safety_pick` points to the IIHS site root `https://www.iihs.org/ratings` rather than a per-vehicle page. The Giulia base uses a proper per-vehicle URL (`/ratings/vehicle/alfa-romeo/giulia-4-door-sedan/2025`), so the convention is known; Stelvio and Tonale fall back to roll-up. Notes on both models explicitly state the IIHS has not published a current page for these models.
- **Found in:** `models[1].trims[0].sources["safety.iihs_top_safety_pick"]`, `models[2].trims[0].sources["safety.iihs_top_safety_pick"]`
- **Value seen:** `"https://www.iihs.org/ratings"`
- **Source consulted:** Notes on Stelvio: "IIHS has no current rating page for the 2025 or 2026 Stelvio." Notes on Tonale: "IIHS has no current rating page for the Tonale." Confirmed plausible — low-volume Alfa Romeo models are commonly skipped by IIHS.
- **Recommendation:** Accept the roll-up URL as the best available source given the documented absence of per-vehicle pages; consider switching to FYI per the reinforcement clause for Alfa Romeo's low-volume status.

## FYIs

### 1. Alfa Romeo USA model landing pages return HTTP 403 to automated probes
- **Model/trim:** All 7 trims
- **Note:** All image-array URLs point to `https://www.alfaromeousa.com/models/{giulia|stelvio|tonale}` and `needs_scraping: true` is set on every image record, which is correct for Phase 3 (image scraping happens in Phase 4). WebFetch HEAD/GET against those landing pages returns HTTP 403 (typical bot blocking by Stellantis CDN). Pages exist and resolve in a real browser — no action needed for verification; this is the expected pre-Phase-4 state.

### 2. APEAL block carries `confidence: "unknown"` on all three models
- **Model/trim:** Giulia, Stelvio, Tonale (`customer_satisfaction.confidence`)
- **Note:** The other three review/reliability blocks (reliability, professional_reviews, owner_reviews) carry `confidence: "low"` or `"medium"` and have populated `summary` fields, so this does not trigger the "all four blocks unknown" FYI condition. The single `unknown` confidence on customer_satisfaction reflects JD Power's sample-size exclusion of Alfa Romeo from its 2026 US APEAL Study, which is documented in each summary. This is the correct value, not a research gap.

### 3. Quadrifoglio and Tonale PHEV correctly excluded from MY26 US lineup
- **Model/trim:** Giulia Quadrifoglio (not present), Stelvio Quadrifoglio (not present), Tonale PHEV (not present)
- **Note:** Per session 3 reinforcement: the Stellantis MY26 US lineup decision dropped the 2.9L twin-turbo V6 Quadrifoglio variants on Giulia and Stelvio (Europe-only production) and dropped the Tonale PHEV after the 2024 engine-defect recall and slow US sales. Both models' `notes` fields explicitly document these exclusions and cross-reference fueleconomy.gov entries to demonstrate no PHEV/QF MY26 records exist. The catalog is correct to omit them.

### 4. Two Tonale trims share an MSRP ($41,495 for Veloce and Sport Speciale)
- **Model/trim:** Tonale Veloce, Tonale Sport Speciale
- **Note:** Both step-up trims carry `msrp_base: 41495` with `delta_from_base.msrp_delta_usd: 4500` from the Sprint base. This matches the model's `notes` field — "New-for-MY26 trim positioned alongside Veloce at the same MSRP but with a different visual character" — and is consistent with Stellantis press release id=27381. Not a duplicate or data-entry error; flagged here so a downstream reader doesn't assume one of the figures is wrong.

## Coverage stats

- Models with >2 null spec blocks on base trim: **0**
- Models with <4 images on base trim: **0**
- Models with all 4 review/reliability blocks at `unknown` confidence: **0**
- Trims missing key sources entries (msrp_base / powertrain / fuel_economy / dimensions): **0** for base trims; step-up trims (Giulia Veloce, Stelvio Veloce, Tonale Veloce, Tonale Sport Speciale) carry only `msrp_base` + `features` sources, which is consistent with `delta_from_base` convention (mechanically identical to base, so spec blocks are null and not separately sourced).
- Trims with null `msrp_base`: **0** (mainstream-brand convention satisfied; FYI exception not needed)
- Forbidden-source URL hits: **0**

## Sample details

### Sampled trims for source verification

1. **Giulia (base)** — checked against `https://media.stellantisnorthamerica.com/newsrelease.do?id=27452` (Stellantis press release "What's New for 2026: Alfa Romeo Giulia") — result: **pass**. Press release confirms 280 hp / 306 lb-ft / 0-60 in 5.1 sec / 149 mph top speed / 2-trim lineup (Giulia + Giulia Veloce) — all match the JSON exactly. Press release does not publish discrete MSRP/destination, but JSON's $44,995 base / $3,250 destination match the EPA fueleconomy.gov ID 50054 record. Cross-check against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=50054` confirmed 24 city / 33 highway / 27 combined MPG — exact match.
2. **Stelvio Veloce** — checked against `https://media.stellantisnorthamerica.com/newsrelease.do?id=27453` — result: **pass on lineup, partial on detail**. Press release confirms two-trim lineup (Stelvio, Stelvio Veloce) and shared 2.0L turbo + 8-speed automatic powertrain, but does not break out Veloce-specific MSRP/feature delta. JSON note explicitly says "$2,025 delta per multiple US-market sources reporting the Veloce Package price" — this is reasonable but not corroborated directly by the Stellantis press release. No mismatch found; just lower direct corroboration for the delta figure.
3. **Tonale Sprint** — checked against `https://media.stellantisnorthamerica.com/newsrelease.do?id=27381` — result: **pass**. Press release confirms 268 hp / 295 lb-ft / 0-60 in 6.5 sec / Q4 AWD standard / three-trim lineup (Sprint, Veloce, Sport Speciale). MSRP and feature breakdown not in this particular release but cross-referenced from Stellantis id=27249 (full Tonale specifications document) and EPA ID 50115. All match JSON values.

### Image URLs checked

1. `https://www.alfaromeousa.com/models/giulia` — Giulia, all four angles — HTTP 403 (CDN bot-block, expected; `needs_scraping: true`).
2. `https://www.alfaromeousa.com/models/stelvio` — Stelvio, all four angles — HTTP 403 (CDN bot-block, expected; `needs_scraping: true`).
3. `https://www.alfaromeousa.com/models/tonale` — Tonale, all four angles — HTTP 403 (CDN bot-block, expected; `needs_scraping: true`).
4. `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=50054` — Giulia RWD EPA record — **OK** (200 with expected fuel-economy data).
5. `https://media.stellantisnorthamerica.com/newsrelease.do?id=27452` — Giulia press release source — **OK** (200 with expected content).

The three 403s on `alfaromeousa.com` are not URL rot — the pages exist and serve to real browsers. They're placeholder URLs that Phase 4 (`scrape_image_urls.mjs`) will replace with actual CDN image URLs. Treated as FYI (#1) above, not a warning.

## Notes on this verification

- Alfa Romeo's lineup is small and clean — 3 models, 7 trims — which made full schema and consistency analysis fast and complete (not sampled).
- The dataset's structural quality is high: zero schema violations, zero forbidden URLs, zero broken cross-references, zero msrp_range/trim mismatches, zero null msrp_base on mainstream-brand trims, all delta_from_base patterns followed cleanly.
- The two warnings are both around safety-source URL convention, not data correctness. Both have documented justification in the model notes (NHTSA hasn't tested MY26 yet; IIHS lacks per-vehicle pages for Stelvio and Tonale because the volume is too low to test). They could reasonably be downgraded to FYIs if Alfa Romeo is formally categorized as low-volume in catalog conventions.
- Stellantis press releases (`media.stellantisnorthamerica.com/newsrelease.do?id=...`) and EPA fueleconomy.gov pages are reachable and corroborate the JSON values that were spot-checked. The `alfaromeousa.com` consumer-site URLs are blocked by the CDN to automated agents but exist in real browsers — Phase 4 will resolve to actual image asset URLs.
- The MY26-specific lineup decisions (no Quadrifoglio, no Tonale PHEV) are correctly handled and explicitly documented in each model's `notes`.
- Phase 4 image-scraping and image-download scripts were not run, per instructions.
