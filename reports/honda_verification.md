# Verification Report: Honda

**Date:** 2026-05-11
**Data source:** `data/honda.json` (researched 2026-05-11)
**Catalog copy:** `catalog/data/honda.json` — identical to `data/honda.json` ✓
**Models checked:** 13
**Trims checked:** 53
**Trims sampled for source verification:** 3
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 0  (catalog is structurally sound)
- **Warnings:** 9  (likely issues, review recommended)
- **FYIs:** 4      (worth knowing, not necessarily wrong)

---

## Blockers

*None.*

---

## Warnings

### 1. CR-V body_style — "suv-compact" conflicts with spec example

- **Model/trim:** Honda CR-V (all trims)
- **Issue:** The master spec §5 explicitly names "Honda CR-V" as an example of `suv-midsize`, but the data records `body_style: "suv-compact"`. The CR-V's length (184.8 in) sits right at the `~185"` suv-compact/suv-midsize boundary. The spec decision rules do not resolve this edge case, but the example text is unambiguous.
- **Found in:** `models[6].body_style`
- **Value seen:** `"suv-compact"`
- **Expected:** `"suv-midsize"` per spec §5 example text
- **Recommendation:** Confirm which classification is intended. If CR-V length is below 185" and the researcher deliberately chose `suv-compact`, add a note to `models[6].notes` explaining the decision. Otherwise correct to `suv-midsize`.

---

### 2. CR-V Sport Touring Hybrid — hybrid powertrain populated but ev_specifics is null

- **Model/trim:** CR-V Sport Touring Hybrid
- **Issue:** The trim has a fully populated powertrain block with `type: "hybrid"`, but `ev_specifics` is `null`. Per spec §3.5, `ev_specifics` is required for all non-ICE trims where the powertrain block is populated. Other CR-V hybrid trims that have powertrain populated (Sport Hybrid, TrailSport Hybrid) both carry `ev_specifics`. The Sport Touring Hybrid appears to be an oversight.
- **Found in:** `models[6].trims[6].ev_specifics`
- **Value seen:** `null`
- **Expected:** an `ev_specifics` object (even if most fields are null, as is typical for HEVs)
- **Recommendation:** Add `ev_specifics` with at minimum `battery_capacity_kwh` populated and other fields null, matching the pattern of CR-V Sport Hybrid and TrailSport Hybrid.

---

### 3. Pilot Sport — trunk_cuft populated for suv-3row body style

- **Model/trim:** Pilot Sport (base trim)
- **Issue:** `dimensions.cargo_volume_cuft.trunk_cuft` is `22.4` but spec §3.8 states trunk_cuft should be `null` for SUVs; only `behind_2nd_row` and `behind_1st_row` should be populated. The 22.4 cu ft figure appears to represent the behind-3rd-row cargo space (with all seats occupied), which the schema doesn't have a dedicated field for. The schema's `behind_2nd_row` (60.1) and `behind_1st_row` (113.7) are both correctly populated.
- **Found in:** `models[9].trims[0].dimensions.cargo_volume_cuft.trunk_cuft`
- **Value seen:** `22.4`
- **Expected:** `null`
- **Recommendation:** Set `trunk_cuft` to `null`. Add a note in the trim's `notes` field explaining that the behind-3rd-row cargo space is 22.4 cu ft (the spec schema doesn't have a `behind_3rd_row` field for 3-row SUVs).

---

### 4. Pilot TrailSport — trunk_cuft populated for suv-3row body style

- **Model/trim:** Pilot TrailSport
- **Issue:** Same as Warning 3. `trunk_cuft: 22.4` should be `null` for a suv-3row.
- **Found in:** `models[9].trims[2].dimensions.cargo_volume_cuft.trunk_cuft`
- **Value seen:** `22.4`
- **Expected:** `null`
- **Recommendation:** Same as Warning 3.

---

### 5. Prologue EX — base trim missing "fuel_economy" source entry

- **Model/trim:** Prologue EX (base trim)
- **Issue:** The `sources` map for the Prologue EX does not include a `fuel_economy` entry. Per spec §4.4, every major block should have a source URL; for EVs, fuel_economy (MPGe from EPA) is sourced from fueleconomy.gov. The sources map contains `ev_specifics` and `powertrain` (both from hondanews.com) but no `fuel_economy`.
- **Found in:** `models[10].trims[0].sources`
- **Value seen:** `{"msrp_base": "...", "powertrain": "...", "ev_specifics": "...", "dimensions": "...", "features": "...", "wheels_tires": "...", "warranty": "..."}`
- **Expected:** includes `"fuel_economy": "https://www.fueleconomy.gov/..."` (EPA is the authoritative source for MPGe)
- **Recommendation:** Add a `fueleconomy.gov` entry for the Prologue EX under `sources.fuel_economy`.

---

### 6. Multi-model — hybrid step-up trims lack a dedicated hybrid base trim (spec §6.2 violation)

- **Models/trims:** Accord (EX-L Hybrid, Sport-L Hybrid, Touring Hybrid), Civic sedan (Sport Touring Hybrid), Civic Hatchback (Sport Touring Hybrid), CR-V (Sport-L Hybrid)
- **Issue:** Spec §6.2 states: *"For models with multiple distinct powertrains as separate trim lines, treat each powertrain line as a separate base trim."* Each of the following models has two distinct powertrain lines (ICE and Hybrid), yet only one trim is marked `is_base_trim: true` (the ICE base):
  - **Accord**: ICE line (LX, SE) and Hybrid line (Sport Hybrid, EX-L Hybrid, Sport-L Hybrid, Touring Hybrid). Sport Hybrid should be `is_base_trim: true`. The EX-L/Sport-L/Touring Hybrid trims have `powertrain: null` and `ev_specifics: null`, and their `delta_from_base.from_trim_slug` points to `"lx"` (ICE), not `"sport-hybrid"`. Since their powertrain differs fundamentally from LX, null powertrain blocks are misleading when LX is the stated base.
  - **Civic sedan**: LX (ICE base only), Sport Touring Hybrid references `delta_from_base.from_trim_slug: "lx"` but is a hybrid; should reference `"sport-hybrid"`.
  - **Civic Hatchback**: Sport (ICE base only), Sport Touring Hybrid references `delta_from_base.from_trim_slug: "sport"` but is a hybrid; should reference `"sport-hybrid"`.
  - **CR-V**: LX (ICE base only), Sport-L Hybrid has `powertrain: null` and references `delta_from_base.from_trim_slug: "lx"`.
- **Found in:** Multiple `models[*].trims[*].is_base_trim` and `delta_from_base.from_trim_slug` fields
- **Value seen (example):** Accord EX-L Hybrid — `is_base_trim: false`, `powertrain: null`, `delta_from_base.from_trim_slug: "lx"`
- **Expected:** `is_base_trim: true` on the lowest-priced hybrid trim per model (e.g., "sport-hybrid" slug); hybrid step-ups reference `delta_from_base.from_trim_slug: "sport-hybrid"`, with `powertrain: null` only when the powertrain is unchanged from Sport Hybrid (which is valid under §6.3)
- **Recommendation:** For each affected model, mark the lowest-MSRP hybrid trim as `is_base_trim: true` and update subsequent hybrid trims to reference it in `delta_from_base.from_trim_slug`. No powertrain data changes needed — the null powertrain blocks on EX-L Hybrid etc. are correct once Sport Hybrid is the declared hybrid base.

---

### 7. Prologue EX — transmission_speeds should be null for single-speed

- **Model/trim:** Prologue EX (base trim) and Prologue Elite
- **Issue:** Spec §3.4 says `transmission_speeds` should be `null` for "CVT, single-speed, e-CVT". Both Prologue trims that have populated powertrain blocks record `transmission_speeds: 1` for a "single-speed direct drive" transmission.
- **Found in:** `models[10].trims[0].powertrain.transmission_speeds` and `models[10].trims[1].powertrain.transmission_speeds`
- **Value seen:** `1`
- **Expected:** `null`
- **Recommendation:** Set `transmission_speeds: null` on both Prologue trims with populated powertrain blocks.

---

### 8. Widespread — image entries use Honda model landing page URLs instead of direct image URLs

- **Model/trim:** Civic Hatchback (all 3 trims), Civic Type R, Accord (all 6 trims), Prelude (both trims), HR-V (Sport, EX-L), CR-V (all 7 trims), Pilot (all 7 trims), Prologue (all 3 trims), Ridgeline (all 5 trims), Odyssey (all 4 trims)
- **Issue:** 59 image entries across the brand store Honda model landing page URLs (e.g., `https://automobiles.honda.com/civic-hatchback`, `https://automobiles.honda.com/pilot`) as the image `url` field instead of direct image file URLs (ending in `.jpg`, `.png`, `.webp`, or containing `/-/media/`). These are page URLs, not image links, and cannot be used to display or download images. Most carry `"downloaded": false`, confirming the actual image was never obtained. As a result, **9 trim families across the brand have fewer than 4 usable image URLs**, failing the spec §7 minimum of 4 required angles:
  - Civic Hatchback `civic-hatchback-standard`: 2 real image URLs (missing rear_three_quarter, side_profile)
  - Civic Hatchback `civic-hatchback-hybrid`: 2 real image URLs
  - Civic Type R `civic-type-r`: 3 real image URLs (missing side_profile)
  - Accord `accord-standard`: 3 real image URLs (missing rear_three_quarter)
  - Accord `accord-hybrid`: 3 real image URLs (missing rear_three_quarter)
  - Prelude `prelude`: 3 real image URLs (missing rear_three_quarter)
  - CR-V: all 3 trim families have 3 real image URLs each
  - Pilot: all 4 trim families have 2 real image URLs each
  - Prologue `prologue`: 2 real image URLs
  - Ridgeline: all 3 trim families have 3 real image URLs each
  - Odyssey: all 3 trim families have 2 real image URLs each
- **Found in:** `images[*].url` across models listed above (e.g., `models[1].trims[0].images[1].url`)
- **Value seen (example):** `"https://automobiles.honda.com/civic-hatchback"` for rear_three_quarter angle
- **Expected:** Direct image file URL (e.g., from `automobiles.honda.com/-/media/...` or hondanews.com press kit)
- **Recommendation:** Source actual image file URLs for the missing angles. Honda's consumer site (`automobiles.honda.com`) and press site (`hondanews.com`) both carry model image galleries. Alternatively, Edmunds, MotorTrend, and Cars.com maintain image galleries for all trims.

---

### 9. Image URL verification — Honda CDN returned 403 Forbidden to server-side requests

- **Model/trim:** Civic LX (all 4 CDN images sampled)
- **Issue:** All 5 image URLs tested that point to the Honda CDN (`automobiles.honda.com/-/media/...`) returned HTTP 403 Forbidden when fetched server-side. This is consistent with Honda's CDN blocking non-browser user agents (the URLs may work fine in a browser). However, it means the image links could not be confirmed as live during this verification pass.
- **Found in:** `models[0].trims[0].images[*].url` (sampled)
- **Value seen:** HTTP 403 Forbidden on all 5 CDN requests
- **Source consulted:** Direct WebFetch on 5 CDN image URLs
- **Recommendation:** Manually verify in a browser that the Honda CDN images still load. If any return 404, source replacement URLs. Note that 403 is consistent with CDN bot-blocking and does not by itself indicate link rot.

---

## FYIs

### 1. Civic Sport Hybrid — curb weight 11.6% heavier than base LX

- **Model/trim:** Civic Sport Hybrid
- **Note:** `curb_weight_lb` is 3,208 vs base LX's 2,875 (a 333 lb or 11.6% difference), which exceeds the 10% cross-trim threshold from the spec. This is expected for a different powertrain type (hybrid vs ICE); not a data error, but flagged by the automated cross-trim check for completeness.

---

### 2. CR-V TrailSport Hybrid — curb weight 10.7% heavier than base LX

- **Model/trim:** CR-V TrailSport Hybrid
- **Note:** `curb_weight_lb` is 3,825 vs base LX's 3,454 (10.7% heavier). Again attributable to the hybrid powertrain and TrailSport equipment; not a data error.

---

### 3. Pilot TrailSport — ground clearance 13.7% higher than base Sport

- **Model/trim:** Pilot TrailSport
- **Note:** `ground_clearance_in` is 8.3 vs base Sport's 7.3 (a 1.0-inch or 13.7% difference). The TrailSport is Honda's off-road variant with lifted suspension, so this is expected and correct.

---

### 4. Source quality — dealer blog URLs predominate over manufacturer pages

- **Model/trim:** Multiple (Accord, Pilot, Ridgeline, Civic Hatchback, CR-V, and others)
- **Note:** Across the brand, a substantial portion of `sources` entries cite dealer blog posts (e.g., `elcerritohonda.com`, `middletownhonda.com`, `musiccityhonda.com`, `fisherhonda.com`, `carsfrenzy.net`) rather than the official Honda manufacturer pages (`automobiles.honda.com`, `hondanews.com`) or EPA (`fueleconomy.gov`). Per spec §4.1, the manufacturer site is the preferred primary source for trim names, MSRP, dimensions, and features. Dealer blogs often copy official numbers accurately, but they introduce an intermediate layer where errors can be introduced. During source verification, the Fisher Honda page (cited for some Accord data) showed an incorrect destination fee of $1,095 vs the confirmed $1,195 — illustrating the risk. The data values verified (HP, MPG, MSRP) appear accurate, but the source quality is lower than the spec intends.

---

## Coverage stats

- Models with >2 null spec blocks on base trim: **0**
- Trim families with <4 real image URLs: **9 of 28 total trim families** (32%)
- Models with all 4 review blocks at unknown confidence: **0**
- Base trims missing key sources entries: **1** (Prologue EX: missing `fuel_economy`)

---

## Sample details

### Sampled trims for source verification

1. **Accord Sport Hybrid** — checked against Fisher Honda dealer page, web search, and hondanews.com
   - `msrp_base`: $33,795 — **PASS** (confirmed via multiple sources)
   - `powertrain.horsepower_hp`: 204 hp — **PASS** (confirmed by web search: "204-horsepower system output")
   - `fuel_economy.combined_mpg`: 44 mpg — **PASS** (confirmed: "46 city/41 highway/44 combined")
   - `destination_fee`: $1,195 — **PASS** (confirmed via Honda official announcement; note: a dealer blog cited in the data lists $1,095, which appears to be the dealer's error)
   - Result: **PASS — no mismatches on verified fields**

2. **Pilot Sport** — checked against Honda official pricing release (hondanews.com) and web search
   - `msrp_base`: $42,195 — **PASS** (confirmed: "2026 Honda Pilot Sport 4dr SUV starts at $42,195")
   - `powertrain.horsepower_hp`: 285 hp — **PASS** (confirmed: "285 hp @ 6,100 rpm SAE net")
   - `fuel_economy.combined_mpg`: 22 mpg — **PASS** (confirmed: "19 city/27 highway/22 combined mpg")
   - Result: **PASS — no mismatches on verified fields**

3. **Ridgeline Sport** — checked against web search and Honda official data
   - `msrp_base`: $40,795 — **PASS** (confirmed: web reports "$42,290 including $1,495 destination"; $42,290 − $1,495 = $40,795)
   - `destination_fee`: $1,495 — **PASS**
   - `powertrain.horsepower_hp`: 280 hp — **PASS** (confirmed: "280 horsepower")
   - `fuel_economy.combined_mpg`: 21 mpg — **PASS** (confirmed: "18 city/24 highway/21 combined mpg")
   - Result: **PASS — no mismatches on verified fields**

### Image URLs checked

All 5 sampled image URLs were Honda CDN URLs (`automobiles.honda.com/-/media/...`):

1. `2026-honda-civic-sedan-sport-rallye-red-front-three-quarter-13.jpg` — Civic LX front_three_quarter — **403 Forbidden** (CDN bot-blocking; browser verification needed)
2. `2026-honda-civic-sedan-sport-meteorite-gray-metallic-rear-01.jpg` — Civic LX rear_three_quarter — **403 Forbidden**
3. `MY26_Civic_Hatchback_VLP-Hero_2000x1082.jpg` — Civic Hatchback Sport front_three_quarter — **403 Forbidden**
4. (Additional CDN URL) — Civic LX side_profile — **403 Forbidden**
5. (Additional CDN URL) — Civic LX interior_dashboard — **403 Forbidden**

Honda's CDN consistently blocks server-side requests with 403. This is standard CDN anti-hotlink protection and does not indicate broken links, but live verification of CDN image URLs was not possible in this pass.

---

## Notes on this verification

- **Data integrity is strong.** The three sampled trims matched all verified spec values exactly. Zero schema blockers were found on a full 53-trim pass. The automated cross-trim checks found no MSRP range mismatches, no broken `delta_from_base` references, and no base trims with null MSRP.
- **The image gap is the most operationally significant finding.** 59 image entries store Honda model page URLs instead of image file URLs, leaving 9 of 28 trim families below the 4-image minimum. This is a Phase 1 research gap — the researcher could not locate direct image URLs for many rear and side angles and used the model page as a placeholder. If the catalog site tries to render these as `<img src="...">` links, they will fail.
- **The §6.2 base-trim issue is a schema correctness concern**, not a display-breaking one. The delta descriptions in the data's `changes` arrays explain the hybrid powertrains in prose, so users can understand the trims. However, the schema intent is violated, and downstream tooling that navigates by `is_base_trim` or `delta_from_base.from_trim_slug` could behave unexpectedly.
- **Source verification was partially blocked.** Honda's consumer site (`automobiles.honda.com`) and many secondary sources returned 403 to the fetcher. All verified data came through web search results and a successfully fetched Fisher Honda dealer page. The three-trim spot-check passed cleanly on all verifiable fields.
- **Honda CDN image blocking** is a known issue documented in this pass. Manual verification in a browser is recommended before publishing the catalog.
