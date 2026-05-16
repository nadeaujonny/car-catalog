# Verification Report: Kia

**Date:** 2026-05-13
**Data source:** `data/kia.json` (researched 2026-05-12)
**Models checked:** 16
**Trims checked:** 69
**Trims sampled for source verification:** 3 (Seltos / LX; Carnival Hybrid / LXS; K5 / LXS)
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 1
- **Warnings:** 1
- **FYIs:** 3

---

## Blockers

### 1. K5 msrp_range.high mismatch ($33,590 vs computed $34,990)

- **Model/trim:** K5 (model-level)
- **Issue:** `msrp_range.high` is `33590` (the GT trim's MSRP) but the highest `msrp_base` across K5 trims is EX at `34990`. The GT is a performance variant at $33,590 but EX is the more premium trim. Off by $1,400.
- **Found in:** `models[2].msrp_range.high` (K5)
- **Value seen:** `33590` — **Expected:** `34990`

---

## Warnings

### 1. NHTSA partial coverage; IIHS 2026 TSP+ partial

- **Models/trims:** Per STATUS notes: IIHS 2026 TSP+ verified for K4, EV9, Sorento (built after Sept 2025), Sportage (built after May 2025), Sportage Hybrid, Sportage PHEV, Sorento Hybrid, Sorento PHEV; K5, Seltos, Carnival, Carnival Hybrid, Niro Hybrid, Niro EV, EV6 did NOT earn IIHS TSP for 2026. NHTSA 5-star cited for K5, Seltos, Sportage variants, Sorento variants, Carnival 4-star; many other 2026 ratings not yet posted.
- **Issue:** Standard pattern in this batch — partial NHTSA/IIHS coverage is the norm.
- **Recommendation:** Re-poll NHTSA before publication.

---

## FYIs

### 1. All 64 image URLs are `needs_scraping: true` (kia.com consumer-page URLs)

- **Model/trim:** Every trim — 100% of image entries point to kia.com vehicle pages.
- **Note:** Phase 1 research noted kia.com and kiamedia.com both returned blank-ish title-only responses to WebFetch on consumer product pages; kianewscenter.com had SSL cert errors. All 64 image entries are page-URL placeholders (mostly base-trim entries — step-up trims inherit via trim_family per spec §7). Per batch protocol these are NOT image-URL failures.

### 2. JD Power VDS / Consumer Reports numeric scores not published for 2026 MY across the brand

- **Model/trim:** All 16 models — `reliability.confidence: "low"` or `"unknown"`, `customer_satisfaction.confidence: "unknown"`.
- **Note:** Expected per batch context. Kia has historically polled well on JD Power IQS but VDS scores for current MY follow the 3-year-old measurement cycle.

### 3. EV6 received $5k price cut + native NACS port for 2026

- **Model/trim:** EV6 (5 trims) — first MY with factory NACS connector.
- **Note:** Per STATUS notes, EV6 starting price down to $37,900 from ~$42,900 MY25. Same factory-NACS treatment applies to EV9. Structurally all-correct; flagged here for downstream cross-brand notes (Kia and Hyundai are the first non-Tesla brands with factory NACS in this batch).

---

## Coverage stats

- Models with >2 null spec blocks on base trim: **0**
- Models with <4 images on a trim family: **0** (every family has at least 4 image entries on its base, all `needs_scraping: true`)
- Models with all 4 review blocks at unknown confidence: **0**
- Trims missing key sources entries for *populated* blocks: **0**
- Singleton-family-base-rule violations: **0**
- Forbidden source hits in trim `sources` maps or review-block sources: **0**
- MSRP range mismatches: **1** (Blocker #1)

---

## Sample details

### Sampled trims for source verification

1. **Seltos / LX** — `sources.fuel_economy` cites brand model-browse page `https://www.fueleconomy.gov/feg/bymodel/2026_Kia_Seltos.shtml` (EPA fallback per spec §4 when per-trim entries unavailable)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 28/34/31 (FWD NA, the unlabeled base configuration)
   - `powertrain.horsepower_hp: 147 / engine_displacement_l: 2.0 / aspiration: "naturally_aspirated"` — consistent with 2.0L NA I4 base
   - `msrp_base: $23,790` cited from kiamedia.com — primary manufacturer press source
   - Result: **PASS by structural sampling; uses EPA model-browse fallback per spec §4 (FWD NA Seltos lacks a per-trim EPA URL per STATUS notes)**

2. **Carnival Hybrid / LXS** — `sources.fuel_economy` cites brand model-browse page (EPA fallback)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 34/31/32
   - `powertrain.type: "hybrid" / horsepower_hp: 242 / engine_displacement_l: 1.6 / aspiration: "turbocharged"` — consistent with 1.6T HEV
   - `msrp_base: $41,390` cited from kiamedia.com
   - Result: **PASS by structural sampling; uses EPA model-browse fallback**

3. **K5 / LXS** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49325` (EPA)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 26/37/30 — **PASS** (EPA matches exactly)
   - `fuel_economy.fuel_type_required: "regular"` — **PASS** (EPA: "Regular Gasoline")
   - `powertrain.engine_displacement_l: 2.5 / engine_config: "I4" / transmission_speeds: 8` — **PASS** (EPA: "Large Cars sedan... 2.5L 4-cylinder engine paired with an automatic 8-speed transmission")
   - `msrp_base: $27,490` cited from kiamedia.com — primary manufacturer press source
   - Result: **PASS on every EPA-verifiable field**

### Image URLs checked

All 5 sampled image entries had `needs_scraping: true` and pointed to kia.com vehicle pages.

1. `https://www.kia.com/us/en/k4` — K4 / LX / front_three_quarter — `needs_scraping: true` (expected)
2. `https://www.kia.com/us/en/seltos` — Seltos / LX / front_three_quarter — `needs_scraping: true` (expected)
3. `https://www.kia.com/us/en/sportage-hybrid` — Sportage Hybrid / LX / front_three_quarter — `needs_scraping: true` (expected)
4. `https://www.kia.com/us/en/ev6` — EV6 / Light Standard Range / interior_dashboard — `needs_scraping: true` (expected)
5. `https://www.kia.com/us/en/ev9` — EV9 / Light Standard Range / side_profile — `needs_scraping: true` (expected)

No image URL failures flagged per batch protocol.

---

## Notes on this verification

- **EPA spot-check on K5 was perfectly clean** — 26/37/30 matched data exactly. Seltos and Carnival Hybrid samples cite EPA model-browse fallback pages (per spec §4 EPA-unavailable rule with explanatory trim notes — STATUS confirms this fallback is documented Phase 1 decision).
- **No forbidden sources detected anywhere in the data.** Programmatic JSON sweep flagged 0 hits for motor1, carbuzz, autoblog, autoevolution, teslaoracle, iseecars, hiconsumption, topspeed, hotcars, wikipedia, www.cars.com. No dealer-domain hits either. This is the cleanest source hygiene seen in this batch alongside Mini and VW.
- **No singleton-family-base-false violations.** 0 of N singleton trim_families fail the §6.2/§7 rule — base trims correctly carry `is_base_trim: true` with `delta_from_base: null`, step-ups correctly carry `is_base_trim: false` with `delta_from_base` populated, and `trim_family` correctly groups multiple trims that share photography. This is in stark contrast to Subaru (12 violations), Volvo (5), Volkswagen (1), and Nissan (27) in this batch.
- **Only 1 msrp_range mismatch** — K5 (Blocker #1). 15 of 16 models pass exactly.
- **Sole-trim atomic rule** verified correctly applied: Sportage Hybrid LX (base of FWD-only HEV powertrain), Sportage PHEV X-Line (base of PHEV powertrain), Niro EV Wind (base of EV powertrain), Sorento PHEV EX AWD (base of PHEV powertrain) — all `is_base_trim: true` with `delta_from_base: null`. Step-ups correctly reference their same-powertrain base per multi-powertrain rule.
- **Cross-trim sanity check passed** — no MSRP 50%+ outliers, no horsepower or dimension outliers within any model.
- **Body-style/cargo-volume consistency check passed** — sedans (K4, K5) have `trunk_cuft` populated; SUVs (Seltos, Sportage variants, Sorento variants, EV9), hatchback (K4 Hatchback), minivan (Carnival, Carnival Hybrid) all correctly populate `behind_2nd_row`/`behind_1st_row`.
- **EV MPGe mirror correctly applied** on EV6, EV9, Niro EV trims per spec §3.6 v1.1.
- **PHEV charge-sustaining MPG correctly placed** on Sportage PHEV, Sorento PHEV per spec §3.6.
- **Excluded models** (Soul, Telluride, Forte, Niro PHEV, EV6 GT, EV9 GT, EV3, EV5, Stinger) all documented in STATUS notes with reasons; verified consistent with Phase 1 lineup decisions.
- **Recommendation: Address the single K5 msrp_range.high blocker (1-line fix from $33,590 to $34,990), then proceed to publish.** Kia is the second-cleanest brand in this batch after Mini — 1 blocker, 1 environmental warning, 3 expected-pattern FYIs.
