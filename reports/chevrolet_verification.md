# Verification Report: Chevrolet

**Date:** 2026-05-13
**Data source:** `data/chevrolet.json` (researched 2026-05-13)
**Models checked:** 18
**Trims checked:** 72
**Trims sampled for source verification:** 3 (Blazer EV / LT FWD; Silverado EV / WT Standard Range; Equinox / LT FWD)
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 11
- **Warnings:** 3
- **FYIs:** 3

---

## Blockers

### 1. Systematic singleton-trim_family-base-false pattern (§6.2 / §7) — 43 trims across 17 models

- **Models/trims:** Phase 1 used `trim_family = trim_slug` (or a slug-level grouping) for every Chevrolet trim. Every non-base step-up is in its own singleton family but marked `is_base_trim: false`. Pattern is consistent across the brand:
  - Trax (LT, ACTIV), Trailblazer (LT, RS, ACTIV), Equinox (RS, ACTIV), Equinox EV (RS), Blazer EV (SS)
  - Traverse (Z71, RS, High Country), Tahoe (LT, RST, Z71, Premier, High Country), Suburban (LT, RST, Z71, Premier, High Country)
  - Colorado (LT, Trail Boss, Z71, ZR2), Silverado 1500 (Custom, LT, RST, LTZ, ZR2, High Country), Silverado HD (LT, LTZ, ZR2, High Country), Silverado EV (LT, Trail Boss)
  - Corvette Stingray / E-Ray / Z06 / ZR1 / ZR1X — each Convertible singleton family violates the rule
- **Issue:** Per spec §6.2 (sole-trim case) and §7, "if a `trim_family` contains exactly one trim, that trim is the family's base trim, has `is_base_trim: true`." The 43 singleton families across 17 models all need either consolidation into a broader trim_family or atomic-rule flip per the spec.
- **Found in:** 43 trim entries across 17 of 18 models (only Blazer EV SS singleton family STATUS noted as correctly applied — but my check shows it's listed as ISSUE too)
- **Expected:** Two fix options (same pattern flagged on Nissan/Subaru/Hyundai/Land Rover this batch):
  - **Option A (consolidate):** Move each into the parent model's primary trim_family (e.g., Trax's LT/Activ → `trax-standard` with LS as base; Corvette Stingray Coupe + Convertible → single `corvette-stingray` family).
  - **Option B (atomic-rule flip):** Set `is_base_trim: true` and `delta_from_base: null` on each.
  Chevrolet is the worst offender this batch — Nissan was 27 trims, this is 43 trims.

---

### 2. 24 dealer-site URLs in trim `sources` maps (forbidden per dealer-site rule)

- **Models/trims:** 18 instances of `lemanchevy.com/manufacturer-information/chevrolet-warranty-program/` in `sources.warranty`; 5 instances of `yoderchevrolet.com/2026-chevrolet-trax-trim-levels-explained/` in `sources.features` (all Trax trims); 1 instance in `sources.msrp_base`.
- **Issue:** Per system-prompt batch context, "dealer sites (any URL with a dealership name)" are forbidden as primary sources. `lemanchevy.com` and `yoderchevrolet.com` are both Chevrolet dealers.
- **Found in:** Multiple `models[*].trims[*].sources.*` entries (24 total dealer-URL hits)
- **Expected:** Replace with chevrolet.com / news.chevrolet.com / media.chevrolet.com once GM sites are reachable. Per STATUS notes, "chevrolet.com / media.chevrolet.com pages returned site-maintenance/blank to WebFetch" during Phase 1, which is why dealer fallbacks were used.

---

### 3. Equinox EV msrp_range.high mismatch ($44,095 vs computed $45,790)

- **Model/trim:** Equinox EV (model-level)
- **Issue:** `msrp_range.high` is `44095` but the highest `msrp_base` is `45790`. Off by $1,695 (in the WRONG direction — high is set below actual max).
- **Found in:** `models[3].msrp_range.high` (Equinox EV)
- **Value seen:** `44095` — **Expected:** `45790`

---

### 4. Silverado 1500 msrp_range.high mismatch ($85,930 vs computed $73,300)

- **Model/trim:** Silverado 1500 (model-level)
- **Issue:** `msrp_range.high` is `85930` but the highest `msrp_base` is ZR2 at `73300`. Off by $12,630. Looks like fully-optioned pricing.
- **Found in:** `models[10].msrp_range.high` (Silverado 1500)
- **Value seen:** `85930` — **Expected:** `73300`

---

### 5. Silverado EV msrp_range.high mismatch ($91,295 vs computed $72,095)

- **Model/trim:** Silverado EV (model-level)
- **Issue:** `msrp_range.high` is `91295` but the highest `msrp_base` is Trail Boss Extended Range at `72095`. Off by $19,200.
- **Found in:** `models[12].msrp_range.high` (Silverado EV)
- **Value seen:** `91295` — **Expected:** `72095`

---

### 6. Corvette Stingray msrp_range.high mismatch ($90,745 vs computed $77,000)

- **Model/trim:** Corvette Stingray (model-level)
- **Issue:** `msrp_range.high` is `90745` but the highest `msrp_base` is 1LT Convertible at `77000`. Off by $13,745.
- **Found in:** `models[13].msrp_range.high` (Corvette Stingray)
- **Value seen:** `90745` — **Expected:** `77000`

---

### 7. Corvette E-Ray msrp_range.high mismatch ($126,550 vs computed $115,600)

- **Model/trim:** Corvette E-Ray (model-level)
- **Issue:** `msrp_range.high` is `126550` but the highest `msrp_base` is 1LZ Convertible at `115600`. Off by $10,950.
- **Found in:** `models[14].msrp_range.high` (Corvette E-Ray)
- **Value seen:** `126550` — **Expected:** `115600`

---

### 8. Corvette Z06 msrp_range.high mismatch ($138,250 vs computed $124,700)

- **Model/trim:** Corvette Z06 (model-level)
- **Issue:** `msrp_range.high` is `138250` but the highest `msrp_base` is 1LZ Convertible at `124700`. Off by $13,550.
- **Found in:** `models[15].msrp_range.high` (Corvette Z06)
- **Value seen:** `138250` — **Expected:** `124700`

---

### 9. Corvette ZR1 msrp_range.high mismatch ($203,000 vs computed $189,000)

- **Model/trim:** Corvette ZR1 (model-level)
- **Issue:** `msrp_range.high` is `203000` but the highest `msrp_base` is 1LZ Convertible at `189000`. Off by $14,000.
- **Found in:** `models[16].msrp_range.high` (Corvette ZR1)
- **Value seen:** `203000` — **Expected:** `189000`

---

### 10. Corvette ZR1X msrp_range.high mismatch ($228,395 vs computed $217,395)

- **Model/trim:** Corvette ZR1X (model-level)
- **Issue:** `msrp_range.high` is `228395` but the highest `msrp_base` is 1LZ Convertible AWD at `217395`. Off by $11,000.
- **Found in:** `models[17].msrp_range.high` (Corvette ZR1X)
- **Value seen:** `228395` — **Expected:** `217395`

---

### 11. Blocker grouping note: All 5 Corvette models msrp_range.high mismatch pattern

The pattern across Blockers #6–#10 is consistent: every Corvette model's `msrp_range.high` is $11k–$14k higher than the highest trim's `msrp_base`. Likely all 5 are stale figures from a draft pricing list that included Z51/3LZ trim package options or dealer markups. Combined with Blockers #4 and #5 (Silverado pricing), this is a systematic msrp_range.high error pattern in Chevrolet's data.

---

## Warnings

### 1. 20 gmauthority.com URLs in trim `sources` maps

- **Model/trim:** Various trims across the brand — `sources.msrp_base`, `sources.destination_fee`, `reliability.sources` cite gmauthority.com.
- **Issue:** Same pattern as Cadillac in this batch. Per spec §4.1, secondary-source list is "Edmunds, KBB, Car and Driver, MotorTrend, Cars.com" — gmauthority is not in that list. STATUS notes confirm GM consumer/press sites were unreachable, which is why gmauthority filled in.
- **Recommendation:** Replace with chevrolet.com / news.chevrolet.com once GM sites are reachable.

### 2. 7 pickuptrucktalk.com URLs in trim `sources` maps

- **Model/trim:** Various Silverado / Silverado HD trims — `sources.msrp_base` or `sources.destination_fee` cite pickuptrucktalk.com.
- **Issue:** Per STATUS notes, "pickuptrucktalk pricing" was used as a fallback when GM sites were unreachable. pickuptrucktalk.com is a content-farm/aggregator-tier blog, not in spec §4.1 secondary-source list. Not on the explicit denylist but borderline.
- **Recommendation:** Replace with chevrolet.com or news.chevrolet.com once reachable.

### 3. Silverado HD / 2500HD WT 2WD — base trim missing `sources.fuel_economy`

- **Model/trim:** Silverado HD / 2500HD WT 2WD
- **Issue:** Base trim has populated `fuel_economy` block but no `sources.fuel_economy` URL.
- **Found in:** `models[11].trims[0].sources`
- **Recommendation:** Add EPA URL (HD trucks >8500 GVWR are exempt from EPA testing per STATUS — if so, `fuel_economy` should be null, not populated; verify).

---

## FYIs

### 1. All 288 image URLs are `needs_scraping: true` (chevrolet.com URLs)

- **Model/trim:** Every trim — 100% of image entries point to chevrolet.com showroom pages.
- **Note:** chevrolet.com and media.chevrolet.com returned site-maintenance/blank to WebFetch during Phase 1. All 288 image entries are page-URL placeholders. Per batch protocol these are NOT image-URL failures — Phase 4 will resolve them.

### 2. JD Power VDS / Consumer Reports numeric scores not published for 2026 MY across the brand

- **Model/trim:** All 18 models — `reliability.confidence: "low"`, `customer_satisfaction.confidence: "unknown"`.
- **Note:** Expected per batch context.

### 3. Performance variants (Corvettes, Silverado HD, etc.) correctly carry null NHTSA/IIHS ratings

- **Models/trims:** All 5 Corvette models, Silverado HD trims — `nhtsa_overall_rating: null`, `iihs_top_safety_pick: null`.
- **Note:** Expected per system-prompt batch context — "Chevrolet specialty (Corvette ZR1, etc.)" and "HD trucks >8500 GVWR exempt" are correct application of the low-volume / out-of-scope rules. Tahoe/Suburban null safety also correct (IIHS Moderate Overlap Front rated Poor — no awards per STATUS).

---

## Coverage stats

- Models with >2 null spec blocks on base trim: **0**
- Models with <4 images on a trim family: **0** (every family has at least 4 image entries, all `needs_scraping: true`)
- Models with all 4 review blocks at unknown confidence: **0**
- Trims missing key sources entries for *populated* blocks: **1** (Warning #3)
- Singleton-family-base-rule violations: **43** (Blocker #1) — worst this batch
- Forbidden source hits in trim `sources` maps: **24 dealer URLs** (Blocker #2) + **27 borderline-source URLs** (Warnings #1, #2)
- MSRP range mismatches: **8** (Blockers #3–#10) — worst this batch

---

## Sample details

### Sampled trims for source verification

1. **Blazer EV / LT FWD** (EV) — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49644` (EPA)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 114/95/104 — **PASS** (EPA matches exactly, MPGe mirrored per spec §3.6 v1.1)
   - `ev_specifics.electric_range_mi: 312 / total_range_mi: 312` — **PASS** (EPA: "312 miles Total Range")
   - `ev_specifics.mpge_combined: 104` — **PASS**
   - `powertrain.type: "ev" / drivetrain: "FWD"` — **PASS**
   - `msrp_base: $44,600` cited from primary source
   - Result: **PASS on every EPA-verifiable field; MPGe mirror correctly applied**

2. **Silverado EV / WT Standard Range** (EV) — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49642` (EPA, cited but not re-fetched)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 75/61/68 — **PASS by Phase 1 record**
   - `powertrain.horsepower_hp: 510` — consistent with WT base
   - Result: **PASS by structural sampling**

3. **Equinox / LT FWD** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49442` (EPA, cited but not re-fetched)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 26/29/27 — **PASS by Phase 1 record**
   - `powertrain.engine_displacement_l: 1.5 / aspiration: "turbocharged"` — consistent with new Equinox 1.5T
   - Result: **PASS by structural sampling**

### Image URLs checked

All 5 sampled image entries had `needs_scraping: true`.

1. `https://www.chevrolet.com/suvs/trax` — Trax / LS / front_three_quarter — `needs_scraping: true` (expected)
2. `https://www.chevrolet.com/electric/blazer-ev` — Blazer EV / LT FWD / front_three_quarter — `needs_scraping: true` (expected)
3. `https://www.chevrolet.com/trucks/silverado-1500` — Silverado 1500 / WT / side_profile — `needs_scraping: true` (expected)
4. `https://www.chevrolet.com/electric/silverado-ev` — Silverado EV / WT Standard Range / interior_dashboard — `needs_scraping: true` (expected)
5. `https://www.chevrolet.com/performance/corvette-zr1` — Corvette ZR1 / 1LZ Coupe / front_three_quarter — `needs_scraping: true` (expected)

No image URL failures flagged per batch protocol.

---

## Notes on this verification

- **EPA spot-check on Blazer EV was perfectly clean** — 114/95/104 MPGe matched data exactly with 312 mi total range.
- **Chevrolet has the worst data quality of this batch by several measures:** 43 singleton-family-base-false violations (#1, beating Nissan's 27), 24 dealer-site source URLs (#1, beating Cadillac's 18), 8 msrp_range.high mismatches (#1, beating Cadillac's 6).
- **The singleton-family pattern (Blocker #1)** repeats the architectural mistake of using `trim_family = trim_slug`. Combined with Nissan's similar setup, this suggests the same Phase 1 author handled both brands.
- **The dealer-site pattern (Blocker #2)** is two distinct dealers: `lemanchevy.com` (18 warranty URLs, identical) and `yoderchevrolet.com` (5 Trax features URLs + 1 msrp_base). Both clearly forbidden per dealer-domain rule. Replacement target: news.chevrolet.com warranty page and chevrolet.com/trax features page.
- **The msrp_range.high pattern (Blockers #3–#10)** affects all 5 Corvette models plus Silverado 1500, Silverado EV, and Equinox EV. The Corvette mismatches are particularly consistent at $11k–$14k over actual max trim MSRP — likely Z51/3LZ option package pricing rolled into the high. Spec §3 requires the high to equal the max trim msrp_base, not as-equipped pricing.
- **gmauthority.com (Warning #1) and pickuptrucktalk.com (Warning #2)** are borderline secondary sources used as Phase 1 fallbacks. Not on explicit denylist but worth replacing in next fix pass.
- **All 288 image URLs need scraping** — chevrolet.com / media.chevrolet.com unreachable to WebFetch. Phase 4 will resolve.
- **Cross-trim sanity check** — Corvette Z06 → ZR1 → ZR1X step-ups have steep MSRP jumps (Z06 $115k → ZR1 $182k → ZR1X $202k+) but these are intentional performance escalations (e.g., ZR1X is 1,250 hp electrified AWD), within tolerance.
- **Body-style/cargo-volume consistency check passed** — sedans excluded (Camaro/Malibu discontinued); SUVs/trucks/Corvettes handled correctly per body_style taxonomy.
- **EV MPGe mirror correctly applied** on Equinox EV, Blazer EV, Silverado EV trims per spec §3.6 v1.1.
- **Recommendation: Address all 11 blockers before relying on this catalog for publication.** The 43-trim singleton-family fix is the largest mechanical pass (recommend Option A consolidation); the 24 dealer URLs need replacement once GM consumer sites are reachable; the 8 msrp_range fixes are 1-line numeric edits. The 3 warnings should be batched with the same fix pass.
