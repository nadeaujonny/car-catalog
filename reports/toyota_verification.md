# Verification Report: Toyota

**Date:** 2026-05-12
**Data source:** `data/toyota.json` (researched 2026-05-12)
**Catalog copy:** `catalog/data/toyota.json` — does not exist (Phase 2 not yet run; comparison skipped)
**Models checked:** 23
**Trims checked:** 127
**Trims sampled for source verification:** 3 (Mirai XLE, Corolla LE, Grand Highlander LE)
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 0
- **Warnings:** 7  (likely issues, review recommended)
- **FYIs:** 2      (worth knowing, not necessarily wrong)

Schema version 1.1 ✓ · brand/brand_slug/researched_at all present ✓ · all 23 msrp_range.low/high values match actual trim minimums/maximums ✓ · all delta_from_base.from_trim_slug references resolve ✓ · no null msrp_base values ✓

---

## Blockers

*None identified.*

---

## Warnings

### W-01 — Highlander Hybrid XLE (base trim): 3 null spec blocks
- **Model/trim:** Highlander / Hybrid XLE
- **Issue:** The Hybrid XLE is the base trim of the Hybrid powertrain line. Per §6.3, base trims must have all spec blocks fully populated. Three blocks are null: `dimensions`, `capacity`, and `safety`. The ICE base (XLE) has these blocks fully populated; the hybrid base is missing them.
- **Found in:** `models[13].trims[4]` (`dimensions`, `capacity`, `safety` keys)
- **Value seen:** `"dimensions": null, "capacity": null, "safety": null`
- **Expected:** All three blocks populated with 2026 Highlander Hybrid specs (dimensions shared with ICE platform; capacity = 8 seats standard; IIHS TSP+ awarded per model notes)
- **Recommendation:** Fill in from Toyota pressroom or cars.com specs page; safety rating can be copied from the ICE XLE which shares IIHS/NHTSA ratings.

### W-02 — RAV4 Plug-in Hybrid SE AWD (base trim): 3 null spec blocks
- **Model/trim:** RAV4 / Plug-in Hybrid SE AWD
- **Issue:** Same pattern as W-01. The PHEV SE AWD is the base of the PHEV powertrain line but is missing `dimensions`, `capacity`, and `safety`.
- **Found in:** `models[15].trims[7]` (`dimensions`, `capacity`, `safety` keys)
- **Value seen:** `"dimensions": null, "capacity": null, "safety": null`
- **Expected:** All three populated (RAV4 dimensions are consistent across powertrain lines; capacity = 5 seats; safety data available from NHTSA/IIHS)
- **Recommendation:** Pull from RAV4 Hybrid LE base trim which does have these blocks populated — platform dimensions are shared.

### W-03 — ev_specifics null on 18 hybrid step-up trims
- **Model/trims:** Camry (LE AWD, SE AWD, Nightshade AWD, XLE AWD, XSE AWD); Corolla (Hybrid LE AWD, Hybrid SE AWD); Prius (LE AWD); Grand Highlander (Hybrid Platinum); RAV4 (Hybrid LE AWD, Hybrid XSE AWD, Hybrid Limited AWD, Hybrid Woodland AWD); Sequoia (TRD Pro, 1794 Edition, Platinum, Capstone); Sienna (Woodland Edition)
- **Issue:** Each of these trims has `powertrain.type = "hybrid"` explicitly set in the trim object, but `ev_specifics` is `null`. Per §3.5 and verification Step 5, ev_specifics must be present (not null) for any non-ICE powertrain type.
- **Found in:** `models[0].trims[1,3,5,7,9]`, `models[1].trims[4,6]`, `models[6].trims[1]`, `models[12].trims[8]`, `models[15].trims[1,4,5,6]`, `models[16].trims[2,3,4,5]`, `models[17].trims[3]`
- **Value seen:** `"ev_specifics": null` (where powertrain.type = "hybrid")
- **Context:** These are all delta trims following the "null = same as base" convention. For HEVs the base trim's ev_specifics block is also all-null fields (no EV range, no charge ports), so the practical impact is identical data either way. The fix is straightforward: copy the base trim's ev_specifics block (an object with all-null field values) to each affected trim.
- **Recommendation:** Add ev_specifics with all-null field values to each affected trim. Low risk; purely a schema conformance issue.

### W-04 — Corolla LE MSRP discrepancy
- **Model/trim:** Corolla / LE
- **Issue:** JSON records msrp_base = $22,725; toyota.com (both `/corolla/` and `/corolla/compare`) currently shows $23,125 for the 2026 Corolla LE.
- **Found in:** `models[1].trims[0].msrp_base`
- **Value seen:** `22725`
- **Expected (per toyota.com as of 2026-05-12):** `23125`
- **Source consulted:** https://www.toyota.com/corolla/ and https://www.toyota.com/corolla/compare — both returned $23,125
- **Gap:** $400 (1.7%). This could reflect a mid-cycle price adjustment after the original research was done, or the research may have captured an earlier published MSRP. Toyota raised prices on several models in early 2026.
- **Recommendation:** Confirm on Toyota's build-and-price configurator. If confirmed at $23,125, update `msrp_base` to 23125 and cascade to `models[1].msrp_range.low` (currently 22725 — the Corolla LE is the lowest-MSRP trim in the model).

### W-05 — Image coverage inadequate across 18 of 23 models
- **Models affected:** All except Crown, Mirai, Prius (hybrid-only), bZ, and GR86 base trim family
- **Issue:** 87 of approximately 150 trim families have fewer than 4 images. Several models have zero images on the majority of trim families.
- **Worst cases:**
  - Sienna: all 6 trim families at 0 images
  - Sequoia: all 6 trim families at 0 images
  - Tacoma: all 8 trim families at 0 images
  - Tundra: 7 of 7 trim families at 0 images
  - Grand Highlander: 9 of 11 trim families at 0 images
  - RAV4: 9 of 10 trim families at 0 images
- **Found in:** Multiple `trims[n].images` arrays — empty `[]` where >= 4 required angles expected
- **Recommendation:** Image sourcing pass needed, prioritizing trucks and minivans which have zero coverage. Toyota pressroom (pressroom.toyota.com) and toyota.com model pages carry press-kit images for all current models.

### W-06 — All 5 sampled image URLs return HTTP 403 Forbidden
- **Issue:** All 5 spot-checked image URLs on `toyota-cms-media.s3.amazonaws.com` returned HTTP 403. The URLs cannot be confirmed as publicly accessible assets.
- **URLs checked:**
  1. `https://toyota-cms-media.s3.amazonaws.com/wp-content/uploads/2025/06/2026_Prius_XLE_SupersonicRed_001.jpg` — Prius / LE / front_three_quarter → **403 Forbidden**
  2. `https://toyota-cms-media.s3.amazonaws.com/wp-content/uploads/2025/10/2026_Toyota_Crown-Signia_Limited_FinishLineRed_002.jpg` — Crown Signia / Limited / side_profile → **403 Forbidden**
  3. `https://toyota-cms-media.s3.amazonaws.com/wp-content/uploads/2025/07/2026_Corolla-Hybrid-SE-AWD_001.jpg` — Corolla / Hybrid SE AWD / front_three_quarter → **403 Forbidden**
  4. `https://toyota-cms-media.s3.amazonaws.com/wp-content/uploads/2025/07/2026_Corolla_XSE_WindChillPearl_067.jpg` — Corolla / LE / interior_dashboard → **403 Forbidden**
  5. `https://toyota-cms-media.s3.amazonaws.com/wp-content/uploads/2025/06/2026_GR86_001.jpg` — GR86 / Base / front_three_quarter → **403 Forbidden**
- **Note:** The 403 may be due to hotlink protection (the S3 bucket may require specific Referer headers or signed URLs). The images may load correctly in a browser via the toyota.com context. This needs manual browser verification before concluding the URLs are broken.
- **Recommendation:** Open each URL in a browser. If they load, the S3 bucket uses referer-based protection (data is correct, just not verifiable by API). If they 404 or 403 in-browser, find replacement URLs from Toyota pressroom.

### W-07 — Dimensions source missing on 6 trims with populated dimensions block
- **Model/trims:** Grand Highlander / Hybrid LE; Grand Highlander / Hybrid MAX Limited; Sienna / Woodland Edition; Tacoma / Trailhunter; Tacoma / TRD Pro; GR Corolla / Premium Plus
- **Issue:** Each of these step-up trims has the `dimensions` block populated (non-null), but the `sources` map does not include a `"dimensions"` key. Per §4.4, every populated spec block requires a source entry.
- **Found in:** `models[12].trims[4,9].sources`, `models[17].trims[3].sources`, `models[18].trims[6,7].sources`, `models[20].trims[1].sources`
- **Value seen:** `sources` map present, but `"dimensions"` key absent
- **Recommendation:** Add the source URL for dimensions to each affected trim's sources map (likely the same Toyota pressroom or cars.com spec URL used for the base trim of that model).

---

## FYIs

### F-01 — Low/unknown reliability confidence on most models
- **Models:** Reliability confidence is "unknown" for Camry, 4Runner, bZ, bZ Woodland, C-HR, RAV4, Crown, Mirai, GR Corolla, Tacoma, Land Cruiser; customer_satisfaction is "unknown" for most models.
- **Note:** This is a genuine data gap, not a research failure. JD Power VDS rates vehicles that are 3 years old; most 2026 Toyota models are newly redesigned or fully new. No APEAL data has been published for 2026 MY. The reliability summaries explain this clearly and use appropriate confidence levels. This matches the STATUS.md note: "Low/unknown reliability confidence on 11 newly-launched or low-volume models."

### F-02 — Grand Highlander has 3 base trims (ICE, Hybrid, Hybrid MAX)
- **Model:** Grand Highlander
- **Note:** Three trims have `is_base_trim: true` — LE (ICE, 265 hp), Hybrid LE (standard hybrid, 243 hp), and Hybrid MAX Limited (362 hp turbo hybrid). Per §6.2, multiple base trims are allowed when a model has multiple distinct powertrain lines. The Hybrid MAX uses a fundamentally different engine (2.4L turbo vs. the 2.5L standard hybrid), different HP, and different transmission architecture, qualifying as its own powertrain line. This appears correct.

---

## Coverage stats

| Metric | Count |
|--------|-------|
| Models with >2 null spec blocks on base trim | 2 (Highlander Hybrid XLE, RAV4 PHEV SE AWD) |
| Models with any trim family <4 images | 18 of 23 |
| Total trim families with <4 images | 87 |
| Models with all 4 review blocks at unknown confidence | 0 |
| Trims with populated spec block missing source entry | 6 |
| EV trims with MPGe correctly mirrored to fuel_economy (schema v1.1) | 7 of 7 ✓ |

---

## Sample details

### Sampled trims for source verification

1. **Mirai XLE** — checked against fueleconomy.gov/feg/bymodel/2026_Toyota_Mirai.shtml and toyota.com/mirai/
   - combined_mpg (MPGe): JSON=72, EPA=72 ✓
   - city_mpg (MPGe): JSON=74, EPA=74 ✓
   - msrp_base: JSON=$51,795, toyota.com=$51,795 ✓
   - Result: **pass** — all spot-checked values match

2. **Corolla LE** — checked against fueleconomy.gov/feg/bymodel/2026_Toyota_Corolla.shtml and toyota.com/corolla/
   - combined_mpg: JSON=35, EPA=35 (variable CVT variant) ✓
   - msrp_base: JSON=$22,725, toyota.com=$23,125 ✗ — **$400 mismatch** (see W-04)
   - Result: **1 issue** — MSRP discrepancy

3. **Grand Highlander LE** — checked against fueleconomy.gov/feg/bymodel/2026_Toyota_Grand_Highlander.shtml and pressroom.toyota.com
   - combined_mpg: JSON=24, EPA=24 ✓
   - horsepower_hp: JSON=265 — pressroom page did not surface a specific HP figure; could not confirm or refute from available page content
   - Result: **partial pass** — fuel economy confirmed; HP not independently verifiable from fetched sources (source URL is pressroom.toyota.com but spec table not exposed in page HTML)

### Image URLs checked

1. `https://toyota-cms-media.s3.amazonaws.com/wp-content/uploads/2025/06/2026_Prius_XLE_SupersonicRed_001.jpg` — Prius / LE / front_three_quarter — **403 Forbidden**
2. `https://toyota-cms-media.s3.amazonaws.com/wp-content/uploads/2025/10/2026_Toyota_Crown-Signia_Limited_FinishLineRed_002.jpg` — Crown Signia / Limited / side_profile — **403 Forbidden**
3. `https://toyota-cms-media.s3.amazonaws.com/wp-content/uploads/2025/07/2026_Corolla-Hybrid-SE-AWD_001.jpg` — Corolla / Hybrid SE AWD / front_three_quarter — **403 Forbidden**
4. `https://toyota-cms-media.s3.amazonaws.com/wp-content/uploads/2025/07/2026_Corolla_XSE_WindChillPearl_067.jpg` — Corolla / LE / interior_dashboard — **403 Forbidden**
5. `https://toyota-cms-media.s3.amazonaws.com/wp-content/uploads/2025/06/2026_GR86_001.jpg` — GR86 / Base / front_three_quarter — **403 Forbidden**

All 5 URLs are on the `toyota-cms-media.s3.amazonaws.com` domain. The 403 responses may reflect hotlink protection rather than broken URLs. Manual browser verification required.

---

## Notes on this verification

- **No blockers found.** The data is structurally sound: all required keys present, all msrp_range values internally consistent with trim data, all delta_from_base references resolve, no null msrp_base values, schema v1.1 EV MPGe mirroring correctly applied to all 7 EV trims.

- **The most impactful issue** is image coverage (W-05/W-06): trucks and minivans have zero images, and the S3 image hosting raises questions about public accessibility. This should be addressed before the catalog goes live.

- **The Corolla MSRP discrepancy** (W-04) is the only spec value mismatch found in source verification. It is a targeted finding worth a quick fix.

- **The ev_specifics/null pattern** (W-03) is a schema conformance issue but has no practical data impact for HEV trims where the base's ev_specifics is all-null anyway. Low priority fix.

- **Base trim null blocks** (W-01, W-02) are the highest-priority non-image issues: two powertrain-line base trims are missing dimensions, capacity, and safety — information that consumers and the catalog UI will likely surface prominently.

- Source URLs for manufacturer spec pages (pressroom.toyota.com) did not expose detailed spec tables in fetched HTML, making HP and dimension cross-check from those pages difficult. The fueleconomy.gov sources were cleanly verifiable.

- The `catalog/data/toyota.json` file does not yet exist (Phase 2 / build not run). The `data/toyota.json` file is the sole source of record.
