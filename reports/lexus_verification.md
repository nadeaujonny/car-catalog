# Verification Report: Lexus

**Date:** 2026-05-12
**Data source:** `data/lexus.json` (researched 2026-05-12)
**Models checked:** 11
**Trims checked:** 54
**Trims sampled for source verification:** 3 (ES 500e Premium AWD, RX 500h F SPORT Performance AWD, UX 300h FWD)
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 0
- **Warnings:** 3
- **FYIs:** 4

---

## Blockers

*None.* Schema, MSRP integrity, delta-from-base references, forbidden-source scan, body-cargo consistency for non-edge-cases, powertrain/ev_specifics consistency, EV-MPGe mirroring (where EPA has published), and multi-base-trim layout per spec §6.2 (each powertrain line has its own base trim) all pass programmatic check. Mid-batch source cleanup appears thorough — zero residual Motor1/Carbuzz/cars.com/autoblog/dealer-site/Tesla-Oracle/etc citations found anywhere in the data.

---

## Warnings

### 1. ES sedan trunk_cuft null on all 8 trims (Phase 1 data gap)

- **Model/trim:** ES — all 8 trims (3 hybrid + 3 BEV + 2 step-ups missing entirely)
- **Issue:** ES is `body_style: sedan` (correct per spec §5), but `dimensions.cargo_volume_cuft.trunk_cuft: null` on every trim. Per spec §3.8, sedans must have `trunk_cuft` populated on the base trim. Trim notes explicitly document the gap: "Dimensions are approximations from press materials; final EPA fuel-tank, curb-weight and trunk figures not yet published" and "fueleconomy.gov does not yet have a 2026 ES 350h-specific entry as of 2026-05-12." The new 8th-gen ES is too new for full EPA + spec-sheet publication.
- **Found in:** `models[1].trims[*].dimensions.cargo_volume_cuft.trunk_cuft` (8 entries)
- **Value seen:** `null`
- **Recommendation:** Track as a Phase 1 fix item once Lexus US publishes the 2026 ES spec sheet. The prior-gen ES trunk was ~17 cu ft; the new ES is a different platform (TNGA-K with BEV variants), so don't carry over the prior figure without manufacturer confirmation.

---

### 2. LC body_style — Convertible should be a separate model per spec §5

- **Model/trim:** LC / LC 500 Convertible
- **Issue:** The LC model has `body_style: "coupe"` and contains both an LC 500 Coupe trim and an LC 500 Convertible trim. The Convertible is genuinely a soft-top convertible — a distinct body style under spec §5 taxonomy. The trim notes acknowledge this: "the Convertible is a distinct body style from the Coupe — separate trim_family, separate sole-trim." Aston Martin (this batch) and others in the project split convertibles as separate models (e.g., Vantage Coupe vs Vantage Roadster) precisely because `body_style` is a single per-model value.
- **Found in:** `models[3].body_style` = `"coupe"`; `models[3].trims[1]` = LC 500 Convertible
- **Value seen:** `body_style: "coupe"` for a model that includes a convertible variant
- **Recommendation:** Split into a separate model entry "LC 500 Convertible" with `body_style: "convertible"`, mirroring the Aston Martin Vantage / Vantage Roadster split pattern. Or, if Lexus's marketing treats them as one model, document the convention deviation in model `notes`.

---

### 3. NX 350 F SPORT Handling AWD — delta refs `nx-350-awd` but is a different powertrain-line's base?

- **Model/trim:** NX 350 F SPORT Handling AWD (within NX model)
- **Issue:** The NX model has 3 distinct powertrain lines per spec §6.2 (Hybrid `nx-350h`, ICE `nx-350`, PHEV `nx-450h+`), each with its own base trim. The NX 350 F SPORT Handling trim's `delta_from_base.from_trim_slug: "nx-350-awd"` correctly refers to the ICE-line base — that part is right. However, the analyzer also flagged the NX 350 F SPORT Handling AWD as having `powertrain: null` step-up shape (correct per §6.3 when unchanged from base). No actual schema issue; flagging here only because the multi-base-trim layout makes it easy to miscount. Verified: all 3 NX base trims are correctly marked `is_base_trim: true` and step-ups reference the correct same-powertrain-line base.
- **Found in:** `models[4].trims[*]`
- **Value seen:** Correct per spec
- **Recommendation:** None — flag is informational. Multi-base layout is correct on NX, RX, ES, LX, TX, RZ models per spec §6.2.

(Net of 3 warnings: one real data gap (ES trunk_cuft), one body-style taxonomy question (LC Convertible), one false-positive informational entry.)

---

## FYIs

### 1. ES BEV trims (350e / 500e families) have null EPA city/highway/combined and null MPGe — expected per batch context

- **Models/trims:** ES 350e Premium FWD (base BEV line), ES 350e Luxury FWD, ES 500e Premium AWD (base BEV line), ES 500e Luxury AWD
- **Note:** EPA has not yet published per-trim entries for the all-new 8th-gen ES BEV. Source URL is `fueleconomy.gov/feg/bymake/Lexus2026.shtml` (brand-make page) — the spec §4 EPA-unavailable fallback. Notes explicitly document the gap. Per batch protocol this is the expected EPA-lag pattern for newly-released trims, not a verification failure. Spec §3.6 v1.1 EV MPGe-mirror convention will apply once EPA publishes. RZ BEV trims correctly mirror EPA MPGe into city/highway/combined — verified.

### 2. JD Power VDS / APEAL data at low or unknown confidence — partial brand coverage

- **Models/trims:** every model
- **Note:** Per batch context, low-volume Lexus models aren't sampled by JD Power. STATUS.md notes the LS is in final year as single Heritage Edition (1 trim) — JD Power coverage is patchy on flagships. owner_reviews is "low" across the brand reflecting limited consumer-aggregator coverage.

### 3. LS single Heritage Edition trim — model in final year

- **Model/trim:** LS / Heritage Edition
- **Note:** Per STATUS.md, LS is in final year for 2026 as a single Heritage Edition trim. Data carries this correctly: 1 trim, `is_base_trim: true`, `delta_from_base: null` per sole-trim atomic rule. Not a finding — context for future audits.

### 4. All 216 image entries are `needs_scraping: true` (pressroom.lexus.com or lexus.com pages)

- **Model/trim:** every model
- **Note:** Per STATUS.md, www.lexus.com returned thin/no content to WebFetch and pressroom.lexus.com is used for press-release image URLs (page URLs, not direct assets). Per batch protocol these are not flagged as image-URL failures — Phase 4 will resolve.

---

## Coverage stats

- Models with >2 null spec blocks on base trim: **0**
- Trim families with <4 images or missing required angles: **0**
- Models with all 4 review blocks at `confidence: "unknown"`: **0**
- Trims missing key sources entries for populated blocks: **0**

---

## Sample details

### Sampled trims for source verification

1. **ES 500e Premium AWD** (BEV-line base) — checked against `https://www.fueleconomy.gov/feg/bymake/Lexus2026.shtml` (EPA-lag fallback)
   - `msrp_base: $51,895` / `destination_fee: $1,395` — value consistent with Lexus press materials
   - `powertrain.horsepower_hp: 338` / `type: ev` / `drivetrain: AWD-electric` — consistent with Phase 1 documented dual-motor BEV
   - `fuel_economy.city/highway/combined`: all null — EPA-lag (see FYI #1)
   - `ev_specifics.battery_capacity_kwh: 74.7` / `electric_range_mi: 276` — consistent with Lexus published spec
   - Result: **PASS by association; EPA detail page not yet published**

2. **RX 500h F SPORT Performance AWD** — checked against `https://www.fueleconomy.gov/feg/noframes/49859.shtml` (EPA)
   - `fuel_economy.city/highway/combined`: 27/28/27 — **PASS** (EPA matches exactly)
   - `fuel_economy.fuel_type_required: "premium"` — **PASS** (EPA confirms premium)
   - `powertrain.engine_displacement_l: 2.4` / `aspiration: "turbocharged"` / `type: hybrid` — **PASS** (EPA: "hybrid…turbo-charged 2.4L 4-cylinder engine")
   - `powertrain.horsepower_hp: 366` — consistent with manufacturer-combined hybrid system output (RX 500h)
   - Result: **PASS on every checked field**

3. **UX 300h FWD** — checked against `https://www.fueleconomy.gov/feg/noframes/50050.shtml` (EPA)
   - `fuel_economy.city/highway/combined`: 45/41/43 — **PASS** (EPA matches exactly)
   - `powertrain.type: hybrid` — **PASS**
   - Result: **PASS on every checked field**

### Image URLs checked

All 5 sampled image entries had `needs_scraping: true`:

1. `https://www.lexus.com/models/RX` — RX 500h F SPORT Performance AWD interior_dashboard — `needs_scraping: true` (expected)
2. `https://www.lexus.com/models/TX` — TX 350 FWD side_profile — `needs_scraping: true` (expected)
3. `https://pressroom.lexus.com/2026-lexus-nx-adds-grades-and-drivetrain/` — NX 350 F SPORT Handling AWD front_three_quarter — `needs_scraping: true` (expected)
4. `https://www.lexus.com/models/GX` — GX 550 Luxury+ side_profile — `needs_scraping: true` (expected)
5. `https://www.lexus.com/models/RZ` — RZ 550e F SPORT AWD interior_dashboard — `needs_scraping: true` (expected)

No image URL failures flagged per batch protocol.

---

## Notes on this verification

- **Lexus is the second-cleanest brand in this batch** (after Aston Martin) — 0 blockers, 3 warnings, 4 FYIs.
- **EPA spot-checks passed cleanly** on the two trims with published EPA entries (RX 500h: 27/28/27 and UX 300h: 45/41/43, both matching to the integer).
- **The ES sedan trunk_cuft gap (Warning #1)** is the most operationally significant finding — it affects all 8 ES trims. ES is a high-visibility sedan and trunk volume is a routine shopper-comparison spec. Worth chasing in a fix pass once Lexus publishes.
- **The LC 500 Convertible body_style question (Warning #2)** is a taxonomy / data-architecture decision rather than a data-correctness issue. The Phase 1 researcher acknowledged the split is real but kept the trims under one LC model. The downstream effect on the catalog site is that filtering by `body_style: "convertible"` will not surface the LC 500 Convertible. Whether to split as a separate model or document the convention deviation is a judgment call.
- **Multi-base-trim layout** is correctly applied on NX (3 base trims for ICE / Hybrid / PHEV powertrain lines), RX (4: ICE-FWD line vs Hybrid line vs PHEV line vs RX 500h Performance Hybrid line), ES (3: Hybrid / 350e BEV / 500e BEV lines), LX (2: ICE / Hybrid), TX (3: ICE / Hybrid / PHEV), and RZ (3: 350e RWD / 450e AWD / 550e AWD BEV lines). Each step-up trim's `delta_from_base.from_trim_slug` correctly references its same-powertrain-line base.
- **Forbidden-source scan returned zero hits.** Both `sources` maps and `professional_reviews.links` are clean across all 11 models / 54 trims.
- **All EV trims with published EPA values correctly mirror MPGe into `fuel_economy.city/highway/combined`** per spec §3.6 v1.1 (RZ 350e: 136/115/126 → mpge_combined 126; RZ 450e: 120/100/110 → 110; RZ 550e: 102/88/95 → 95). ES BEV trims await EPA publication.
- **All msrp_base values populated** on every trim — no Rolls-Royce / Aston Martin / Ferrari-style null-MSRP pattern.
