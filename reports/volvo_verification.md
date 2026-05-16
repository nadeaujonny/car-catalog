# Verification Report: Volvo

**Date:** 2026-05-13
**Data source:** `data/volvo.json` (researched 2026-05-12)
**Models checked:** 8
**Trims checked:** 41
**Trims sampled for source verification:** 3 (XC60 / T8 Core PHEV; XC90 / T8 Core PHEV; EX40 / Single Motor Plus)
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 7
- **Warnings:** 4
- **FYIs:** 3

---

## Blockers

### 1. ES90 — all 3 trims have `msrp_base: null` (spec Step 2 violation)

- **Model/trim:** ES90 — Single Motor, Twin Motor, Twin Motor Performance (all 3 trims).
- **Issue:** Per spec verifier Step 2, "Flag any trim where `msrp_base` is null as a BLOCKER (pricing must be present)." All 3 ES90 trims have null MSRP and null destination fee. Phase 1 notes acknowledge "first US deliveries late-2025/early-2026, US MSRP not yet officially announced (msrp_base/destination_fee null per honesty rule)" — honest, but pricing is still required for catalog use.
- **Found in:** `models[7].trims[0].msrp_base`, `models[7].trims[1].msrp_base`, `models[7].trims[2].msrp_base`
- **Value seen:** `null`
- **Expected:** Once Volvo announces US pricing, populate. In the meantime, either (a) defer ES90 from the published catalog with a note, or (b) populate provisional values from KBB starting price (the EX90 model notes already reference a "$89,345 Volvo press release / KBB starting 7-pass" figure but for EX90, not ES90).

---

### 2. Five singleton trim_families marked `is_base_trim: false` (§6.2 / §7 violation)

- **Models/trims:**
  - XC40 / B5 Ultra Black Edition AWD (`xc40-black-edition` family)
  - XC60 / B5 Ultra Black Edition (`xc60-black-edition` family)
  - XC60 / T8 Ultra Black Edition (`xc60-t8-black-edition` family)
  - XC60 / T8 Polestar Engineered (`xc60-t8-polestar` family)
  - EX40 / Twin Motor Ultra Black Edition (`ex40-black-edition` family)
- **Issue:** Per spec §6.2 (sole-trim case, last paragraph) and §7, "if a `trim_family` contains exactly one trim, that trim is the family's base trim, has `is_base_trim: true`." All 5 trims are singletons within their declared family but carry `is_base_trim: false` and reference another family's trim via `delta_from_base`. STATUS.md notes claim atomic-rule was applied to each, but the `is_base_trim: true` flip didn't actually get applied. (The 2 of 7 singleton families that DO pass: EX30 Cross Country `ex30-cross-country` and ES90 Twin Motor Performance `es90-performance`.)
- **Found in:** `models[*].trims[*]` — 5 occurrences
- **Expected:** Flip each to `is_base_trim: true` with `delta_from_base: null` per spec §6.2 sole-trim atomic rule. Same pattern as the 12 Subaru violations flagged in `reports/subaru_verification.md`.

---

### 3. ES90 — 2 trims cite en.wikipedia.org for `sources.dimensions` (forbidden)

- **Model/trim:** ES90 / Single Motor and ES90 / Twin Motor Performance — both have `sources.dimensions: "https://en.wikipedia.org/wiki/Volvo_ES90"`.
- **Issue:** Wikipedia is on the forbidden-source list per spec §4 (no Wikipedia as primary source).
- **Found in:** `models[7].trims[0].sources.dimensions`, `models[7].trims[2].sources.dimensions`
- **Expected:** Replace with volvocars.com once ES90 product page goes live, or with EPA size-class data, or with Edmunds preview spec coverage.

---

### 4. XC90 msrp_range.high mismatch ($82,505 vs computed $82,005)

- **Model/trim:** XC90 (model-level)
- **Issue:** `msrp_range.high` is `82505` but the highest `msrp_base` across XC90 trims (T8 Ultra at $82,005) is `82005`. Off by $500.
- **Found in:** `models[2].msrp_range.high` (XC90)
- **Value seen:** `82505` — **Expected:** `82005`

---

### 5. EX30 msrp_range.high mismatch ($46,755 vs computed $46,855)

- **Model/trim:** EX30 (model-level)
- **Issue:** `msrp_range.high` is `46755` but the highest `msrp_base` is Cross Country Twin Motor Ultra at `46855`. Off by $100.
- **Found in:** `models[4].msrp_range.high` (EX30)
- **Value seen:** `46755` — **Expected:** `46855`

---

### 6. EX90 msrp_range.high mismatch ($91,490 vs computed $88,050)

- **Model/trim:** EX90 (model-level)
- **Issue:** `msrp_range.high` is `91490` but the highest `msrp_base` is Twin Motor Performance Ultra at `88050`. Off by $3,440. EX90 model notes reference "$91,590 (6-pass Ultra Performance) per autoblog" — looks like the autoblog-sourced figure was used for the range cap rather than the actual trim MSRP.
- **Found in:** `models[6].msrp_range.high` (EX90)
- **Value seen:** `91490` — **Expected:** `88050`

---

### 7. EX90 model notes prose cites autoblog as source for top-of-line MSRP figure

- **Model/trim:** EX90 (model `notes` field)
- **Issue:** Notes prose: "...$91,590 (6-pass Ultra Performance) per autoblog; $92,885 figure includes additional Lounge package." Per spec §4 batch-context list, autoblog.com is on the forbidden content-farm denylist. While this is a prose mention rather than a `sources.*` URL, it has structural impact on the data (the $91,490 in `msrp_range.high` appears to be derived from this autoblog figure — see Blocker #6).
- **Found in:** `models[6].notes`
- **Expected:** Remove the autoblog reference and align `msrp_range.high` with the highest trim's `msrp_base` per spec §3.

---

## Warnings

### 1. XC60 T8 Core (PHEV) — total_range_mi off by 60 miles vs EPA

- **Model/trim:** XC60 / T8 Core (PHEV)
- **Issue:** `ev_specifics.total_range_mi` is `500`, but EPA ID 49771 returns "560 miles Total Range".
- **Found in:** `models[1].trims[6].ev_specifics.total_range_mi`
- **Value seen:** `500`
- **Source consulted:** https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49771 (2026-05-13)
- **Recommendation:** Adjust to EPA value (560 mi) per spec §4.2 "EPA wins". Electric range (35 mi) and combined gas-only MPG (28) both match EPA — only total range is off.

### 2. V60 Cross Country model notes prose cites Cars.com as a source

- **Model/trim:** V60 Cross Country (model `notes` field)
- **Issue:** Notes prose: "...specs reconciled from Edmunds, KBB, Volvo Cars St-Léonard technical sheet, and Cars.com." Per spec §4 batch-context list, www.cars.com is forbidden as primary source. (Volvo Cars St-Léonard is a Canadian Volvo dealer — also questionable but the prose says "technical sheet" suggesting they're using the dealer's published Volvo materials, which is gray-area.)
- **Found in:** `models[5].notes`
- **Source consulted:** trim notes prose only; no Cars.com URL in any `sources.*` map.
- **Recommendation:** Edit the notes prose to remove Cars.com mention. The trim sources maps are already clean.

### 3. Two base trims missing `sources.dimensions` entries

- **Models/trims:** XC90 / B6 Core; EX90 / Twin Motor Performance Plus
- **Issue:** Both base trims have populated `dimensions` blocks but no `sources.dimensions` URL in their sources map.
- **Found in:** `models[2].trims[3].sources` (XC90 B6 Core), `models[6].trims[3].sources` (EX90 TM Performance Plus)
- **Recommendation:** Add manufacturer or EPA size-class URL for dimensions citation per spec §4.4.

### 4. NHTSA ratings null brand-wide; IIHS partial

- **Models/trims:** All 8 models — `safety.nhtsa_overall_rating: null`. IIHS 2026 TSP earned for XC90 + XC90 PHEV (per STATUS), TSP+ for EX90.
- **Issue:** Common pattern across this batch. Not unique to Volvo.

---

## FYIs

### 1. All 95 image URLs are `needs_scraping: true` (volvocars.com URLs)

- **Model/trim:** Every trim — 100% of image entries point to volvocars.com vehicle pages.
- **Note:** Phase 1 research noted volvocars.com/us returned 403 to WebFetch throughout the window. All 95 image entries are page-URL placeholders. Per batch protocol these are NOT image-URL failures — Phase 4 will resolve them once volvocars.com is reachable.

### 2. JD Power VDS / Consumer Reports numeric scores not published for 2026 MY

- **Model/trim:** All 8 models — `reliability.confidence: "low"` or `"unknown"`, `customer_satisfaction.confidence: "unknown"`.
- **Note:** Expected per batch context.

### 3. ES90 is all-new 2026 EV sedan; replaces S90

- **Model/trim:** ES90 — 3 trims (Single Motor, Twin Motor, Twin Motor Performance), all with null MSRP per Blocker #1.
- **Note:** First US deliveries late-2025/early-2026 per STATUS notes. EPA has not yet published ES90 fueleconomy.gov entries (fuel_economy values null with brand-make-page source per spec §4 EPA-unavailable fallback). All structurally correct given the data gaps.

---

## Coverage stats

- Models with >2 null spec blocks on base trim: **0**
- Models with <4 images on a trim family: **0** (every family has 4+ images, all `needs_scraping: true`)
- Models with all 4 review blocks at unknown confidence: **0**
- Trims missing key sources entries for populated blocks: **2** (Warning #3)
- Singleton-family-base-rule violations: **5** (Blocker #2)
- Forbidden source hits in trim `sources` maps: **2** (Blocker #3) + 2 prose mentions (autoblog/cars.com)
- MSRP range mismatches: **3** (Blockers #4, #5, #6)
- Trims with null msrp_base: **3** (Blocker #1)

---

## Sample details

### Sampled trims for source verification

1. **XC60 / T8 Core (PHEV)** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49771` (EPA)
   - `fuel_economy.combined_mpg`: 28 — **PASS** (EPA: "Combined MPG on Gas Only: 28 MPG")
   - `fuel_economy.fuel_type_required: "premium"` — **PASS** (EPA: "Premium Gas (Required)")
   - `ev_specifics.electric_range_mi: 35` — **PASS** (EPA: "All Elec: 0-35 mi")
   - `ev_specifics.total_range_mi: 500` vs EPA "560 miles" — **WARNING #1** (60-mile discrepancy)
   - `powertrain.type: "phev" / horsepower_hp: 455` cited from kbb.com/volvo/xc60/2026/t8-core/ — permissible secondary source per spec §4.1
   - Result: **PASS on most fields; total_range mismatch flagged as Warning #1**

2. **XC90 / T8 Core (PHEV)** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49772` (cited but not re-fetched this pass — Phase 1 PASS recorded)
   - Step-up trims in same family have null fuel_economy/dimensions per spec §6.3 (delta-form).
   - `msrp_base: $74,805` cited from kbb.com/volvo/xc90/2026/ — permissible secondary source
   - Result: **PASS by structural sampling; deeper re-verification deferred**

3. **EX40 / Single Motor Plus** (EV) — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49747` (EPA)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 118/94/106 — **PASS** (EPA matches exactly, MPGe mirrored per spec §3.6 v1.1)
   - `ev_specifics.electric_range_mi: 296 / total_range_mi: 296` — **PASS** (EPA: "296 miles")
   - `ev_specifics.mpge_combined: 106` — **PASS**
   - `powertrain.type: "ev" / drivetrain: "FWD"` — **PASS** (Single Motor variant)
   - `msrp_base: $53,855` cited from volvocars.com/us/cars/ex40-electric/ — primary manufacturer source
   - Result: **PASS on every EPA-verifiable field; MPGe mirror correctly applied**

### Image URLs checked

All 5 sampled image entries had `needs_scraping: true` and pointed to volvocars.com product pages. Per batch protocol these are NOT image-URL failures.

1. `https://www.volvocars.com/us/cars/xc40/` — XC40 / B4 Plus FWD / front_three_quarter — `needs_scraping: true` (expected)
2. `https://www.volvocars.com/us/cars/xc60/` — XC60 / B5 Core / front_three_quarter — `needs_scraping: true` (expected)
3. `https://www.volvocars.com/us/cars/xc90/` — XC90 / T8 Ultra / interior_dashboard — `needs_scraping: true` (expected)
4. `https://www.volvocars.com/us/cars/ex90-electric/` — EX90 / Twin Motor Performance Ultra / rear_three_quarter — `needs_scraping: true` (expected)
5. `https://www.volvocars.com/us/cars/es90-electric/` — ES90 / Twin Motor Performance / side_profile — `needs_scraping: true` (expected)

No image URL failures flagged per batch protocol.

---

## Notes on this verification

- **EPA spot-checks identified one data discrepancy** — XC60 T8 Core PHEV `total_range_mi: 500` vs EPA 560 mi (Warning #1). EX40 EV EPA match was perfect.
- **Two recurring patterns from prior brands resurface in Volvo:**
  1. Singleton-family-base-false (Blocker #2) — 5 trims, same architectural mistake flagged on Subaru (12 trims) and Mazda (36 trims) in prior batches. The STATUS.md research notes claim atomic-rule was applied, but the `is_base_trim: true` flip didn't actually get persisted.
  2. msrp_range.high mismatch (Blockers #4–#6) — 3 of 8 models off (XC90 by $500, EX30 by $100, EX90 by $3,440). Same pattern as Cadillac (6 of 18), Genesis (1 of 8), Subaru (2 of 10).
- **ES90 null-MSRP (Blocker #1)** is unique to Volvo — it's the only all-new model in this batch where US pricing hadn't been announced at Phase 1 research time. The honest decision was to leave `msrp_base: null` rather than fabricate; the spec verifier surfaces it as a Blocker because the catalog can't render pricing for these trims as-is.
- **No dealer-domain hits.** Automated regex flagged `volvocars.com/us/owners/...` paths via `of-`/`-of-` substring patterns; verified those are manufacturer's own consumer site. No `volvo-of-…` style URLs in the data.
- **Sole-trim atomic rule** verified correctly applied to 2 of 7 singleton families: EX30 Cross Country, ES90 Twin Motor Performance. The other 5 violate.
- **Cross-trim sanity check passed** — no MSRP 50%+ outliers, no horsepower or dimension outliers within any model.
- **Body-style/cargo-volume consistency check passed** — sedans (V60 Cross Country, ES90) have `trunk_cuft` populated as wagon/sedan; SUVs handle `behind_2nd_row` correctly.
- **EV MPGe mirror correctly applied** on EX30/EX40/EX90 EV trims per spec §3.6 v1.1.
- **PHEV charge-sustaining MPG correctly placed** in fuel_economy with charge-depleting MPGe in ev_specifics per spec §3.6.
- **Recommendation: Address all 7 blockers before relying on this catalog for publication.** ES90 null MSRP (#1) needs either pricing or deferral; the 5 singleton-family-base-false trims need atomic-rule fixes; 3 msrp_range mismatches are 1-line edits; the 2 wikipedia ES90 dimension citations and the autoblog notes mention can be replaced/edited. The 4 warnings can be batched into the same fix pass.
