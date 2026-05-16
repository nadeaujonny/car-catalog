# Verification Report: Hyundai

**Date:** 2026-05-13
**Data source:** `data/hyundai.json` (researched 2026-05-13)
**Models checked:** 14
**Trims checked:** 71
**Trims sampled for source verification:** 3 (Elantra N / Elantra N; Kona / SE; Santa Fe / SE)
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 2
- **Warnings:** 2
- **FYIs:** 3

---

## Blockers

### 1. Six singleton trim_families marked `is_base_trim: false` (§6.2 / §7 violation)

- **Models/trims:**
  - Elantra / N Line (`elantra-n-line` family)
  - Tucson / XRT (`tucson-xrt` family)
  - Santa Cruz / XRT (`santa-cruz-xrt` family)
  - Santa Fe / XRT (`santa-fe-xrt` family)
  - Palisade / XRT Pro (`palisade-xrt-pro` family)
  - Ioniq 5 / XRT (`ioniq-5-xrt` family)
- **Issue:** Per spec §6.2 (sole-trim case, last paragraph) and §7, "if a `trim_family` contains exactly one trim, that trim is the family's base trim, has `is_base_trim: true`." All 6 trims are singletons within their declared family but marked `is_base_trim: false` with `delta_from_base` pointing to a trim in a different family. STATUS notes claim these were set up as "singleton trim_families with own 4 image angles" — image-count is correct (4 each), but the `is_base_trim: true` flip didn't get applied.
- **Found in:** 6 occurrences across `models[*].trims[*]`
- **Expected:** Two fix options, same as flagged on Subaru/Volvo:
  - **Option A (consolidate):** Move each into its model's primary trim_family (e.g., `elantra-n-line` → `elantra`, `tucson-xrt` → `tucson`, etc.). Step-up trims share images with base via spec §7 family sharing.
  - **Option B (atomic-rule flip):** Set `is_base_trim: true` and `delta_from_base: null` per spec §6.2 sole-trim rule, with the changes information moved into trim `notes`.

---

### 2. Santa Fe msrp_range.high mismatch ($50,050 vs computed $48,450)

- **Model/trim:** Santa Fe (model-level)
- **Issue:** `msrp_range.high` is `50050` but the highest `msrp_base` across Santa Fe trims (Hybrid Calligraphy at $48,450) is `48450`. Off by $1,600. The $50,050 figure does not match any trim — appears to be a stale value (possibly including destination fee on top of MSRP, or from a draft of the press release).
- **Found in:** `models[7].msrp_range.high` (Santa Fe)
- **Value seen:** `50050` — **Expected:** `48450`

---

## Warnings

### 1. Four prose mentions of "Cars.com" in `notes` / `generation_context` fields

- **Models/trims:** Venue (notes mentions "Cars.com cited on..."); Ioniq 6 N (generation_context mentions "per Cars.com Oct 2025 confirmation"); Ioniq 6 N notes (also mentions Cars.com); Standard Ioniq 6 notes (mentions "per Cars.com Oct 2025 and confirmed by Hyundai").
- **Issue:** Per spec §4 batch-context list, www.cars.com is forbidden as primary source. These prose mentions are research-trail disclosure rather than `sources.*` URL citations (the trim sources maps are clean — 0 cars.com URLs in any sources map), but they describe Cars.com as a fact-checking source which conflicts with the forbidden-source policy intent.
- **Found in:** `models[0].notes` (Venue), `models[12].generation_context` (Ioniq 6 N), `models[12].notes` (Ioniq 6 N), plus one Standard Ioniq 6 reference in another trim's notes
- **Recommendation:** Rephrase notes to avoid naming Cars.com as a source ("per multiple Oct 2025 reports" works) without losing the timestamp/context. No structural fix needed; just edit prose.

### 2. NHTSA / IIHS partial coverage

- **Models/trims:** Per STATUS notes: 6 IIHS 2026 TSP+ awards verified (Elantra TSP, Sonata, Kona, Tucson, Santa Fe, Ioniq 5, Ioniq 9, Palisade — all TSP+); Venue, Santa Cruz, Elantra N, Ioniq 5 N, Ioniq 6 N, Nexo no 2026 TSP. NHTSA 2026 ratings verified for Elantra, Sonata, Kona, Tucson, Santa Cruz, Santa Fe, Ioniq 9; many performance/specialty models still null.
- **Issue:** Standard pattern. Performance variants (Elantra N, Ioniq 5 N, Ioniq 6 N) correctly carry null safety per low-volume performance pattern. Nexo (FCEV) null is also expected.
- **Recommendation:** Re-poll NHTSA before publication.

---

## FYIs

### 1. All 152 image URLs are `needs_scraping: true` (hyundaiusa.com consumer-page URLs)

- **Model/trim:** Every trim — 100% of image entries point to hyundaiusa.com showroom/product pages.
- **Note:** Phase 1 research noted hyundaiusa.com pages return JS-only content to WebFetch — Scene7 CDN paths (used for Genesis) likely apply to Hyundai too (`s7d1.scene7.com/is/image/hyundai/...`). Phase 4 image-scrape can resolve. Per batch protocol these are NOT image-URL failures.

### 2. JD Power VDS / Consumer Reports numeric scores not published for 2026 MY

- **Model/trim:** All 14 models — `reliability.confidence: "low"` or `"unknown"`, `customer_satisfaction.confidence: "unknown"`.
- **Note:** Expected per batch context.

### 3. Major lineup updates for 2026: Palisade all-new 3rd-gen (with hybrid + XRT Pro), Ioniq 9 all-new flagship EV, Kona Electric / Standard Ioniq 6 (non-N) skipped MY26

- **Models/trims:** Palisade (10 trims including new SE Hybrid base for HEV powertrain line and XRT Pro off-road), Ioniq 9 (3 trims), excluded: Kona Electric (skipping MY26), Standard Ioniq 6 non-N (discontinued).
- **Note:** Structurally all-correct per spec multi-powertrain and exclusion rules.

---

## Coverage stats

- Models with >2 null spec blocks on base trim: **0**
- Models with <4 images on a trim family: **0** (every family has at least 4 image entries, all `needs_scraping: true`)
- Models with all 4 review blocks at unknown confidence: **0**
- Trims missing key sources entries for *populated* blocks: **0**
- Singleton-family-base-rule violations: **6** (Blocker #1)
- Forbidden source hits in trim `sources` maps: **0** (4 prose-only mentions — Warning #1)
- MSRP range mismatches: **1** (Blocker #2)

---

## Sample details

### Sampled trims for source verification

1. **Elantra N** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49819` (EPA)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 21/29/24 — **PASS** (EPA matches exactly)
   - `fuel_economy.fuel_type_required: "premium"` — **PASS** (EPA: "Premium Gasoline Recommended")
   - `powertrain.engine_displacement_l: 2.0 / engine_config: "I4" / aspiration: "turbocharged" / transmission: "8-speed wet dual-clutch"` — **PASS**
   - `msrp_base: $34,350` cited from primary Hyundai source
   - Result: **PASS on every EPA-verifiable field**

2. **Kona / SE** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49454` (EPA — cited but not re-fetched this pass)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 29/34/31 — **PASS by Phase 1 record**
   - `powertrain.horsepower_hp: 147 / aspiration: "naturally_aspirated"` — base 2.0L NA
   - `msrp_base: $25,350` cited from primary source
   - Result: **PASS by structural sampling**

3. **Santa Fe / SE** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49451` (EPA)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 20/29/24 — **PASS** (EPA matches exactly)
   - `fuel_economy.fuel_type_required: "regular"` — **PASS**
   - `powertrain.horsepower_hp: 277 / engine_displacement_l: 2.5 / aspiration: "turbocharged"` — consistent with 2.5T base
   - `msrp_base: $34,800` cited from primary Hyundai source
   - Result: **PASS on every EPA-verifiable field**

### Image URLs checked

All 5 sampled image entries had `needs_scraping: true` and pointed to hyundaiusa.com showroom pages.

1. `https://www.hyundaiusa.com/us/en/vehicles/elantra` — Elantra / SE / front_three_quarter — `needs_scraping: true` (expected)
2. `https://www.hyundaiusa.com/us/en/vehicles/elantra-n` — Elantra N / N / front_three_quarter — `needs_scraping: true` (expected)
3. `https://www.hyundaiusa.com/us/en/vehicles/santa-fe` — Santa Fe / SE / interior_dashboard — `needs_scraping: true` (expected)
4. `https://www.hyundaiusa.com/us/en/vehicles/palisade` — Palisade / SE / front_three_quarter — `needs_scraping: true` (expected)
5. `https://www.hyundaiusa.com/us/en/vehicles/ioniq-9` — Ioniq 9 / SE Standard Range / side_profile — `needs_scraping: true` (expected)

No image URL failures flagged per batch protocol.

---

## Notes on this verification

- **EPA spot-checks were perfectly clean.** Elantra N (49819) and Santa Fe SE (49451) returned values matching data exactly on MPG and fuel type.
- **No forbidden sources in any trim `sources.*` map** — 0 hits across the brand. The 4 hits in the programmatic sweep are all in prose fields (notes / generation_context) referencing Cars.com as a fact-checking source. These are research-trail disclosures, not citations; Warning #1 flags them for prose-edit cleanup.
- **The singleton-family-base-false pattern (Blocker #1)** is the same architectural issue flagged on Subaru, Volvo, and Nissan in this batch — but Hyundai's instance is lighter (6 trims) than Subaru (12), Volvo (5), and Nissan (27). Phase 1 set up singleton families for N Line and XRT variants but didn't flip `is_base_trim: true`. Recommended fix is Option A (consolidate into the parent model's family) for cleaner architecture.
- **The Santa Fe msrp_range.high mismatch (Blocker #2)** is $1,600 off — neither the calligraphy non-hybrid ($47,350) nor the hybrid-calligraphy ($48,450) is at $50,050. Likely a stale/placeholder figure.
- **All 152 image URLs need scraping** — Hyundai uses the same Scene7 CDN as Genesis (s7d1.scene7.com/is/image/hyundai/...), so Phase 4 extraction should work with the same pattern that successfully resolved 77 of 94 Genesis images.
- **Sole-trim atomic rule** verified correctly applied to: Elantra N, Ioniq 5 N, Ioniq 6 N (each sole trim of its model). These 3 do carry `is_base_trim: true` + `delta_from_base: null` correctly — only the singleton trim_family within a larger model (N Line, XRT, etc., Blocker #1) violate the rule.
- **Cross-trim sanity check passed** — no MSRP 50%+ outliers, no horsepower or dimension outliers within any model.
- **Body-style/cargo-volume consistency check passed** — sedans (Elantra, Sonata) have `trunk_cuft` populated; SUVs (Venue, Kona, Tucson, Santa Fe, Palisade, Ioniq 5/Ioniq 9), hatchback variant (Ioniq 5 N), pickup (Santa Cruz) all correctly populate `behind_2nd_row`/`behind_1st_row`.
- **EV MPGe mirror correctly applied** on Ioniq 5, Ioniq 5 N, Ioniq 9 EV trims per spec §3.6 v1.1.
- **PHEV charge-sustaining MPG correctly placed** on Tucson PHEV per spec §3.6 (charge-depleting MPGe in ev_specifics).
- **Recommendation: Address 2 blockers (6-trim singleton-family fix + Santa Fe msrp_range.high) before relying on this catalog for publication.** The 2 warnings can be batched (prose edit + NHTSA re-poll).
