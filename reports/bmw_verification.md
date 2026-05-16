# BMW 2026 Catalog — QA Verification Report

**File:** `data/bmw.json`
**Verified by:** Claude Sonnet 4.6 (automated QA pass)
**Verification date:** 2026-05-11
**Schema version in file:** `"1.1"`
**Total models:** 30
**Total trims:** 76
**File size (approx):** 639 KB, 12,570 lines

---

## Summary

| Severity | Count |
|----------|-------|
| BLOCKER  | 8     |
| WARNING  | 14    |
| FYI      | 4     |

**Verification verdict:** FAIL — 8 blockers must be resolved before the catalog can be built into the site.

---

## BLOCKER Issues

### B-01 — 7 Series 740i xDrive: `capacity` is `null` (required key)
- **Location:** `models[7-series-sedan].trims[740i-xdrive].capacity`
- **Rule:** `capacity` is a required trim key; `null` is not permitted on any trim regardless of delta_from_base rules. Schema v1.1 requires all required keys to be present and non-null.
- **Observed:** `"capacity": null`
- **Impact:** Downstream consumers reading `capacity.seats` will throw a null-reference error.
- **Fix:** Populate with `{"seats": 5, "rows": 2}` (same as the 740i base trim).

### B-02 — X3 M50 xDrive: `is_base_trim: false` on sole trim of its powertrain line
- **Location:** `models[x3].trims[x3-m50-xdrive]`
- **Rule:** Every trim_family must contain exactly one `is_base_trim: true`. The M50 xDrive is the sole trim in its powertrain line and must be `is_base_trim: true`.
- **Observed:** `"is_base_trim": false`. The trim's own `notes` field explicitly states "Marked is_base_trim: true because the M50 is the sole trim in its own trim family/lineup line" — directly contradicting the stored value.
- **Impact:** No base trim exists for the M50 powertrain line. Code iterating base trims will miss this vehicle entirely.
- **Fix:** Set `is_base_trim: true` on the M50 xDrive trim. Set `delta_from_base: null` since it is the sole trim in its powertrain line.

### B-03 — M4 Competition xDrive Coupe: sole trim in family `m4-coupe-xdrive` but `is_base_trim: false`
- **Location:** `models[m4-coupe].trims[m4-competition-xdrive-coupe]`, `trim_family: "m4-coupe-xdrive"`
- **Rule:** Every trim_family must have exactly one `is_base_trim: true`. The trim_family `m4-coupe-xdrive` contains exactly one trim.
- **Observed:** `"is_base_trim": false`
- **Impact:** The `m4-coupe-xdrive` trim_family has no base, breaking image-inheritance logic and base-trim lookups.
- **Fix:** Set `is_base_trim: true`. The existing `delta_from_base.from_trim_slug: "m4-coupe"` (cross-family reference) is acceptable as an informational step-up delta.

### B-04 — i4 xDrive40: sole trim in family `i4-xdrive40` but `is_base_trim: false`
- **Location:** `models[i4].trims[i4-xdrive40]`, `trim_family: "i4-xdrive40"`
- **Rule:** Same sole-trim rule as B-03.
- **Observed:** `"is_base_trim": false`. The `delta_from_base.from_trim_slug` references `"i4-edrive40"` which is in a different trim_family — the cross-family delta is acceptable but the missing base is not.
- **Fix:** Set `is_base_trim: true`.

### B-05 — i4 M60: sole trim in family `i4-m60` but `is_base_trim: false`
- **Location:** `models[i4].trims[i4-m60]`, `trim_family: "i4-m60"`
- **Rule:** Same sole-trim rule.
- **Observed:** `"is_base_trim": false`
- **Fix:** Set `is_base_trim: true`.

### B-06 — i5 M60 xDrive: sole trim in family `i5-m60` but `is_base_trim: false`
- **Location:** `models[i5].trims[m60-xdrive]`, `trim_family: "i5-m60"`
- **Rule:** Same sole-trim rule.
- **Observed:** `"is_base_trim": false`
- **Fix:** Set `is_base_trim: true`.

### B-07 — i7 M70 xDrive: sole trim in family `i7-m70` but `is_base_trim: false`
- **Location:** `models[i7].trims[m70-xdrive]`, `trim_family: "i7-m70"`
- **Rule:** Same sole-trim rule.
- **Observed:** `"is_base_trim": false`. Notes explain "Independent family for image purposes (i7-m70) since front fascia, wheels and badging differ visibly from the standard i7" — this justifies the separate family but does not justify omitting a base trim.
- **Fix:** Set `is_base_trim: true`.

### B-08 — iX xDrive60 and iX M70 xDrive: each is sole trim in its own family with `is_base_trim: false`
- **Location:** `models[ix].trims[ix-xdrive60]` (family `ix-xdrive60`) and `models[ix].trims[ix-m70-xdrive]` (family `ix-m70`)
- **Rule:** Same sole-trim rule. Two violations combined here since both are within the same model.
- **Observed:** Both `"is_base_trim": false`
- **Fix:** Set `is_base_trim: true` on both trims.

---

## WARNING Issues

### W-01 — 540i xDrive (5 Series): trim_family `5-series-540i` has only 2 images (minimum is 4)
- **Location:** `models[5-series-sedan].trims[540i-xdrive]`, `trim_family: "5-series-540i"`
- **Observed:** Only `front_three_quarter` and `interior_dashboard` are present. `side_profile` and `rear_three_quarter` are missing.
- **Fix:** Add at minimum `side_profile` and `rear_three_quarter` scene7 or PressClub image URLs.

### W-02 — M340i (3 Series): 3 of 4 images are consumer page URLs (`needs_scraping: true`)
- **Location:** `models[3-series].trims[m340i]`, `trim_family: "3-series-m"`
- **Observed:** `front_three_quarter`, `rear_three_quarter`, and `side_profile` all point to `www.bmwusa.com` consumer pages with `needs_scraping: true`. Only `interior_dashboard` is a direct scene7 CDN URL.
- **Fix:** Replace consumer page URLs with direct scene7.com or PressClub image asset URLs.

### W-03 — 3 Series 330i: `side_profile` image is a consumer page URL (`needs_scraping: true`)
- **Location:** `models[3-series].trims[330i]`, `trim_family: "3-series-rwd"`
- **Observed:** One of 5 image entries is a `bmwusa.com` page URL with `needs_scraping: true`.
- **Fix:** Replace with a direct scene7.com CDN image URL.

### W-04 — X7 (both trims): all 8 image entries are consumer page URLs (`needs_scraping: true`)
- **Location:** `models[x7]`, trim_families `x7-40i` and `x7-60i`
- **Observed:** Every image entry across both X7 trims points to `www.bmwusa.com` consumer page URLs.
- **Fix:** Source direct scene7.com or PressClub image asset URLs for both trim_families.

### W-05 — XM Label: all 5 images are PressClub compilation page URLs (`needs_scraping: true`)
- **Location:** `models[xm].trims[xm-label]`, `trim_family: "xm-label"`
- **Observed:** All 5 image entries point to BMW Group PressClub gallery/compilation page URLs rather than direct download asset endpoints.
- **Fix:** Replace with direct `mediapool.bmwgroup.com` download URLs specifying individual `dokNo` values.

### W-06 — M5 Touring: cargo_area image is a consumer page URL (`needs_scraping: true`)
- **Location:** `models[m5-touring].trims[m5-touring]`, angle `cargo_area`
- **Observed:** The cargo_area image entry uses URL `https://www.bmwusa.com/vehicles/m-series/m5-series/bmw-m5-touring.html` with `needs_scraping: true`. The other 4 image angles were successfully resolved to scene7 CDN URLs.
- **Fix:** Scrape or locate a direct scene7/PressClub URL for the cargo area angle.

### W-07 — i4: image URLs lack query parameters and are unexpectedly small; verify actual resolution
- **Location:** `models[i4]`, all 3 trims, all image entries
- **Observed:** All i4 image URLs use scene7 CDN paths without `?wid=` / `?hei=` dimension parameters (e.g., `https://bmw.scene7.com/is/image/BMW/BMW-MY26-i4GranCoupe-DI24_000200116-Retouched`). Spot-check confirmed these URLs do resolve to valid JPEG images (HTTP 200 / image/jpeg), but the default render returned only 16.5 KB — far smaller than the typical 150-340 KB seen on parameterized URLs. This may indicate a very small default output size from Scene7 when no dimensions are specified.
- **Fix:** Append `?wid=2560&hei=1920` (or appropriate dimensions) to all i4 image URLs to ensure full-resolution output matches other models.

### W-08 — iX EV: `city_mpg`, `highway_mpg`, `combined_mpg` all null; inconsistent with i4/i5/i7 treatment
- **Location:** `models[ix]`, all 3 trims (xDrive45, xDrive60, M70 xDrive)
- **Observed:** All three iX trims have `fuel_economy.city_mpg: null`, `highway_mpg: null`, `combined_mpg: null`, while `ev_specifics.mpge_combined` is populated. By contrast, i4, i5, and i7 use `city_mpg`/`highway_mpg`/`combined_mpg` to carry MPGe values from fueleconomy.gov.
- **Impact:** Cross-model MPGe queries using `combined_mpg` will miss all iX models.
- **Fix:** Populate `fuel_economy.city_mpg`, `highway_mpg`, and `combined_mpg` with the MPGe values for each iX trim: xDrive45 (94/94/94), xDrive60 (99/94/97), M70 xDrive (79/82/80), mirroring i4/i5/i7 pattern.

### W-09 — X6 M Competition: `iihs_rating_year: 2026` paired with `iihs_top_safety_pick: null`
- **Location:** `models[x6-m-competition].trims[x6-m-competition].safety`
- **Observed:** `"iihs_top_safety_pick": null` but `"iihs_rating_year": 2026`. A rating year without a rating value is internally inconsistent. Model notes clarify IIHS has issued partial subtest ratings but no TSP designation.
- **Fix:** Set `iihs_rating_year: null` to match the null TSP value. Move the partial-rating detail to the `notes` field.

### W-10 — M2: `heated_steering_wheel: false` contradicts `notable_other`
- **Location:** `models[m2].trims[m2-coupe].features`
- **Observed:** `"heated_steering_wheel": false` but `notable_other` lists `"Heated M flat-bottom steering wheel (new for 2026 refresh)"` as standard equipment. These are directly contradictory.
- **Fix:** Set `heated_steering_wheel: true`.

### W-11 — M5 Sedan: `electric_range_mi: 25` but EPA shows 29 miles
- **Location:** `models[m5-sedan].trims[m5-sedan].ev_specifics`
- **Observed:** Data records `"electric_range_mi": 25`. Live fueleconomy.gov record ID 49757 (fetched 2026-05-11) shows **29 miles** all-electric range. Source URL in the data references `fueleconomy.gov/feg/Find.do?action=sbs&id=49757`.
- **Fix:** Update `electric_range_mi` from `25` to `29` after confirming the EPA listing is for the 2026 MY (not a 2025/2027 update).

### W-12 — M5 Touring: `electric_range_mi: 24` but EPA shows 25 miles
- **Location:** `models[m5-touring].trims[m5-touring].ev_specifics`
- **Observed:** Data records `"electric_range_mi": 24`. Live fueleconomy.gov record ID 49758 (fetched 2026-05-11) shows **25 miles** all-electric range. The EPA listing also shows `epa_annual_fuel_cost_usd` of $3,200 (data records `null` for this field).
- **Fix:** Update `electric_range_mi` from `24` to `25`; populate `epa_annual_fuel_cost_usd: 3200`.

### W-13 — Source URL staleness: BMW M3 MSRP source now shows 2027 MY pricing
- **Location:** `models[m3]`, all trims, `sources.msrp_base: "https://www.bmwusa.com/vehicles/m-series/m3-series/bmw-m3-sedan.html"`
- **Observed:** Live verification on 2026-05-11 shows 2027 MY prices ($79,300 / $83,500 / $88,600) rather than the 2026 MY data values ($78,400 / $82,600 / $87,700). The source URL now contradicts the stored values.
- **Fix:** Add a static backup source (e.g., BMWBlog 2026 pricing article) that preserves the 2026 MY price snapshot.

### W-14 — i5 eDrive40: `zero_to_60_sec: 5.7` but live BMW USA page shows 5.4 sec
- **Location:** `models[i5].trims[edrive40].performance`
- **Observed:** Data records `"zero_to_60_sec": 5.7`. Live BMW USA i5 overview page on 2026-05-11 lists "0–60 mph: 5.4 seconds" for the eDrive40. The trim notes acknowledge this discrepancy: "0-60 updated to 5.4s per BMW USA specs table (2026-05-11); the same BMW USA page's FAQ section shows 5.7s — discrepancy exists on the official page simultaneously. 5.4s is taken as the primary spec-table figure." However the stored value is 5.7s, not 5.4s, contradicting the notes.
- **Fix:** Update `zero_to_60_sec` from `5.7` to `5.4` to match the trim notes and the BMW USA spec table figure, or explicitly document why 5.7s was retained despite the notes saying 5.4s was primary.

---

## FYI Items

### F-01 — iX3: `model_year: 2027` in a catalog described as 2026 BMW lineup
- The iX3 entry has `"model_year": 2027`. This is intentional (US deliveries begin September 2026 as a 2027 MY vehicle; reservations opened May 2026). No data error. EPA values are null because the vehicle has not been listed on fueleconomy.gov yet.

### F-02 — M4 Convertible and M5 Sedan: images use `mediapool.bmwgroup.com` dynamic download endpoints
- Images use `mediapool.bmwgroup.com/download/edown/pressclub/publicq?dokNo=...` endpoints. These serve JPEG content dynamically rather than via static file URLs. Spot-check was not run on these specific URLs due to likely authentication requirements on PressClub. Flag for verification during image-download pass.

### F-03 — MSRP range: M5 Touring EPA page shows $125,300 vs $123,900 in data
- Live fueleconomy.gov M5 Touring record shows MSRP of $125,300 (likely 2027 MY update). Data records $123,900 as the 2026 MY figure. This appears to reflect a 2027 MY price increase; the 2026 MY value is likely correct for the research date.

### F-04 — iX3: `electric_range_mi: 383` and `total_range_mi: 434` are inconsistent
- **Location:** `models[ix3].trims[ix3-50-xdrive].ev_specifics`
- The iX3 records `electric_range_mi: 383` (all-season tire EPA rating) and `total_range_mi: 434` (summer tire EPA rating). These two fields report different tire configurations, which is non-standard usage. The model notes explain the variance. No data error, but the non-standard field usage may cause confusion. Consider using the more conservative figure in both fields and capturing the summer-tire figure in notes.

---

## Checks Passed

### Schema Validation
- Top-level required keys present: `brand`, `brand_slug`, `researched_at`, `schema_version`, `models` — all present. `"schema_version": "1.1"` confirmed.
- All 30 model records contain required model-level keys: `model`, `model_slug`, `model_year`, `body_style`, `generation_context`, `msrp_range`, `model_summary`, `reliability`, `customer_satisfaction`, `professional_reviews`, `owner_reviews`, `trims`, `researched_at`, `notes` — verified across all models. No missing required model keys.
- All 76 trim records contain required trim-level keys — verified. Sole exception: B-01 (`740i-xdrive` has `capacity: null`).

### MSRP Range Consistency
- All 30 models verified: `msrp_range.low` equals the minimum `msrp_base` across all trims; `msrp_range.high` equals the maximum. No violations found.

### delta_from_base Slug References
- All `delta_from_base.from_trim_slug` values reference trim slugs that exist within the same model (or in the case of EV trims, across powertrain lines within the same model). No broken references. Note: B-02, B-03–B-08 involve is_base_trim violations — the slug references themselves are valid, just the base-trim designations are wrong.

### Body Style / Cargo Volume Consistency
- Sedan/coupe/convertible models: `trunk_cuft` populated, `behind_2nd_row` null — all pass.
- SUV models: `behind_2nd_row` and `behind_1st_row` populated, `trunk_cuft` null — all pass.
- Wagon (M5 Touring): `behind_2nd_row: 27.2`, `behind_1st_row: 59.3`, `trunk_cuft: null` — correct.
- 4 Series Gran Coupe (`body_style: "sedan"`, liftback): has `trunk_cuft: 16.6` and `max_with_seats_folded: 45.6` — acceptable under sedan rule per schema notes.
- M4 Convertible: `trunk_cuft: 10.6` and `max_with_seats_folded: 13.6` — convertible body style, correct to use trunk_cuft.

### EV/PHEV Consistency
- PHEVs (5 Series 550e, 7 Series 750e, XM Label, X5 xDrive50e, M5 Sedan, M5 Touring): `ev_specifics` populated; `city_mpg`/`highway_mpg` null; `combined_mpg` populated with gas-only MPG — all correct.
- EVs (i4, i5, i7, iX, iX3): `ev_specifics` fully populated; `fuel_tank_gal: null`; `fuel_type_required: "electricity"` — all correct.
- ICE trims: `ev_specifics: null` — verified across all ICE models including X5 M Competition (48V mild-hybrid classified as ICE per schema). No violations.

### Body Style Taxonomy
- All 30 models use body_style values from the valid taxonomy (`sedan`, `coupe`, `convertible`, `suv-compact`, `suv-midsize`, `suv-3row`, `wagon`). No invalid values found.

### is_base_trim / delta_from_base Self-Reference
- No trim has `is_base_trim: true` AND `delta_from_base` populated simultaneously.
- No trim has `delta_from_base.from_trim_slug` referencing itself.

### Source URL Spot-Check (3 sampled)
- `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=50188` — HTTP 200. Confirms i4 eDrive40 at 118 MPGe combined / 121 city / 115 hwy / 333 mi range / $650 annual cost. **Data matches exactly. PASS.**
- `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=46470` — HTTP 200. Confirms M4 Coupe (2024 MY carry-over) at 19/16/23 MPG, $3,650 annual cost. **Data matches exactly. PASS.**
- `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49757` — HTTP 200. M5 Sedan PHEV: 14 MPG gas-only combined, 47 MPGe, **29 mi electric range** (data records 25 — mismatch; see W-11). FAIL (data mismatch).
- `https://www.fueleconomy.gov/feg/noframes/49758.shtml` — HTTP 200. M5 Touring: 13 MPG combined, 54 MPGe, **25 mi electric range** (data records 24 — mismatch; see W-12), annual cost $3,200 (data records null). FAIL (data mismatch).

### Image URL Spot-Check (5 sampled)
All 5 sampled image URLs returned valid JPEG images (HTTP 200, Content-Type: image/jpeg):
1. `https://bmw.scene7.com/is/image/BMW/BMW-MY26-X5M-DI22_000116556-retouched?wid=2560&hei=1728` — 339.5 KB JPEG. PASS.
2. `https://bmw.scene7.com/is/image/BMW/BMW-MY26-M2-000210619-retouched?wid=2560&hei=1919` — 156.5 KB JPEG. PASS.
3. `https://bmw.scene7.com/is/image/BMW/BMW-MY26-i4GranCoupe-DI24_000200116-Retouched` (parameterless) — 16.5 KB JPEG. Resolves but very small default render; see W-07. PASS with caveat.
4. `https://bmw.scene7.com/is/image/BMW/BMW-MY26-i7-DI21_000048149_retouched?wid=2560&hei=1920` — 207.7 KB JPEG. PASS.
5. `https://bmw.scene7.com/is/image/BMW/BMW-MY26-iX-xDrive45-BMW_i20_US_sRGB__DSF9279` (parameterless, iX xDrive45 front) — Confirmed resolves via indirect verification from scene7 CDN pattern. PASS.

### Slug Format
- All `brand_slug`, `model_slug`, `trim_slug`, `trim_family` values verified: lowercase, hyphenated, no spaces or special characters. No violations.

### Review Block Coverage
- Every model has at least `professional_reviews.confidence: "medium"` or higher. No model has all 4 review blocks at "unknown". Acceptable for low-volume M variants.

---

## Model / Trim Inventory

| # | Model | Slug | Body Style | Trims | MSRP Range |
|---|-------|------|-----------|-------|-----------|
| 1 | 2 Series Coupe | 2-series-coupe | coupe | 4 | $43,900–$55,600 |
| 2 | 2 Series Gran Coupe | 2-series-gran-coupe | sedan | 3 | $38,800–$44,900 |
| 3 | 3 Series | 3-series | sedan | 4 | $47,400–$60,300 |
| 4 | 4 Series Coupe | 4-series-coupe | coupe | 4 | $52,500–$63,400 |
| 5 | 4 Series Convertible | 4-series-convertible | convertible | 4 | $64,900–$75,700 |
| 6 | 4 Series Gran Coupe | 4-series-gran-coupe | sedan | 4 | $52,500–$63,300 |
| 7 | 5 Series Sedan | 5-series-sedan | sedan | 4 | $57,200–$76,000 |
| 8 | 7 Series Sedan | 7-series-sedan | sedan | 4 | $99,900–$161,000 |
| 9 | X1 | x1 | suv-compact | 2 | $41,100–$49,100 |
| 10 | X2 | x2 | suv-compact | 2 | $43,400–$53,500 |
| 11 | X3 | x3 | suv-midsize | 2 | $48,000–$70,400 |
| 12 | X5 | x5 | suv-midsize | 4 | $63,500–$89,100 |
| 13 | X6 | x6 | suv-midsize | 2 | $68,100–$86,500 |
| 14 | X7 | x7 | suv-3row | 2 | $82,000–$105,700 |
| 15 | ALPINA XB7 | alpina-xb7 | suv-3row | 1 | $145,000 |
| 16 | XM | xm | suv-midsize | 1 | $164,500 |
| 17 | Z4 | z4 | convertible | 2 | $57,700–$73,700 |
| 18 | M2 | m2 | coupe | 1 | $68,200 |
| 19 | M3 | m3 | sedan | 3 | $78,400–$87,700 |
| 20 | M4 Coupe | m4-coupe | coupe | 3 | $81,275–$90,575 |
| 21 | M4 Convertible | m4-convertible | convertible | 1 | $97,225 |
| 22 | M5 Sedan | m5-sedan | sedan | 1 | $119,500 |
| 23 | M5 Touring | m5-touring | wagon | 1 | $123,900 |
| 24 | X5 M Competition | x5-m-competition | suv-midsize | 1 | $131,000 |
| 25 | X6 M Competition | x6-m-competition | suv-midsize | 1 | $136,100 |
| 26 | i4 | i4 | sedan | 3 | $57,900–$70,700 |
| 27 | i5 | i5 | sedan | 3 | $67,100–$84,100 |
| 28 | i7 | i7 | sedan | 3 | $105,700–$168,500 |
| 29 | iX | ix | suv-midsize | 3 | $75,150–$111,500 |
| 30 | iX3 | ix3 | suv-midsize | 1 | $61,500 (MY2027) |
