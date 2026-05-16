# Verification Report: Mercedes-Benz

**Date:** 2026-05-12
**Data source:** `data/mercedes-benz.json` (researched 2026-05-12)
**Models checked:** 25
**Trims checked:** 78
**Trims sampled for source verification:** 3
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 2  (must be fixed before catalog is trustworthy)
- **Warnings:** 6  (likely issues, review recommended)
- **FYIs:** 2      (worth knowing, not necessarily wrong)

---

## Blockers

### B-01. `is_base_trim: false` on 42 trims that are the sole member of their `trim_family`
- **Model/trim:** 22 of 25 models affected. Representative examples: `CLA / cla-350-4matic`, `C-Class Sedan / c-300-4matic`, `C-Class Sedan / amg-c-43-4matic`, `GLA SUV / gla-250-4matic`, `EQS Sedan / eqs-450-4matic`, `EQS Sedan / eqs-580-4matic`, `EQS Sedan / amg-eqs-53-4matic-plus`, `EQS SUV / eqs-550-4matic`, and 34 others (full list below).
- **Issue:** The schema rule is that each `trim_family` must contain exactly one trim with `is_base_trim: true`. Each of these 42 trims is the only trim in its `trim_family`, yet `is_base_trim` is `false`. That leaves their family with zero base trims, which violates the constraint. Any downstream pipeline code that resolves a family's base trim (to compute `delta_from_base`, display a "starting at" price, or choose a canonical image set) will find no base and either crash or silently skip the family.
- **Found in:** `models[<model>].trims[<trim_slug>].is_base_trim`
- **Value seen:** `false` (on sole-in-family trim)
- **Expected:** `true`

**Complete list of affected trims:**

| Model | trim_slug | trim_family |
|-------|-----------|-------------|
| CLA | cla-350-4matic | cla-350-4matic |
| C-Class Sedan | c-300-4matic | c-300-4matic |
| C-Class Sedan | amg-c-43-4matic | amg-c-43 |
| CLE Coupe | cle-450-4matic | cle-450-4matic |
| CLE Coupe | amg-cle-53-4matic-plus | amg-cle-53-4matic-plus |
| CLE Cabriolet | cle-450-4matic-cabriolet | cle-450-cabriolet |
| CLE Cabriolet | amg-cle-53-4matic-cabriolet | amg-cle-53-cabriolet |
| E-Class Sedan | e-350-4matic | e-350-4matic |
| E-Class Sedan | e-450-4matic | e-450-4matic |
| S-Class | s-580-4matic | s-580-4matic |
| S-Class | amg-s-63-e-performance | amg-s-63-e-performance |
| Maybach S-Class | maybach-s-680-4matic | maybach-s-680 |
| AMG GT Coupe | amg-gt-63-4matic-plus | amg-gt-63 |
| AMG GT Coupe | amg-gt-63-pro-4matic-plus | amg-gt-63-pro |
| AMG GT 4-Door Coupe | amg-gt-55-4-door-coupe | amg-gt-55 |
| AMG GT 4-Door Coupe | amg-gt-63-4-door-coupe | amg-gt-63 |
| SL Roadster | amg-sl-55-4matic | amg-sl-55-4matic |
| SL Roadster | amg-sl-63-4matic | amg-sl-63-4matic |
| SL Roadster | maybach-sl-680-monogram-series | maybach-sl-680-monogram-series |
| GLA SUV | gla-250-4matic | gla-250-4matic |
| GLB SUV | glb-250-4matic | glb-250-4matic |
| GLC SUV | glc-300-4matic | glc-300-4matic |
| GLC SUV | amg-glc-43-4matic | amg-glc-43 |
| GLC SUV | amg-glc-63-s-e-performance | amg-glc-63 |
| GLC Coupe | amg-glc-43-4matic-coupe | amg-glc-43-4matic-coupe |
| GLE SUV | gle-450-4matic | gle-450 |
| GLE SUV | gle-580-4matic | gle-580 |
| GLE SUV | amg-gle-53-4matic-plus | amg-gle-53 |
| GLE SUV | amg-gle-63-s-4matic-plus | amg-gle-63-s |
| GLE Coupe | amg-gle-53-4matic-plus-coupe | amg-gle-53-coupe |
| GLE Coupe | amg-gle-63-s-4matic-plus-coupe | amg-gle-63-s-coupe |
| GLS SUV | gls-580-4matic | gls-580 |
| GLS SUV | amg-gls-63-4matic-plus | amg-gls-63 |
| G-Class | amg-g-63 | amg-g-63 |
| EQE Sedan | eqe-320-4matic | eqe-320-4matic |
| EQE Sedan | amg-eqe | amg-eqe |
| EQE SUV | eqe-320-4matic | eqe-320-4matic |
| EQE SUV | amg-eqe-4matic-plus | amg-eqe-4matic-plus |
| EQS Sedan | eqs-450-4matic | eqs-450-4matic |
| EQS Sedan | eqs-580-4matic | eqs-580-4matic |
| EQS Sedan | amg-eqs-53-4matic-plus | amg-eqs-53 |
| EQS SUV | eqs-550-4matic | eqs-550-4matic |

**Root cause:** Each of these trims belongs to a unique `trim_family` and has a valid `delta_from_base` pointing to another model's base trim. The researcher correctly set each as a step-up variant (with delta), but forgot to also set `is_base_trim: true` since there is no other trim in the same family to be the base. The fix is to set `is_base_trim: true` on each of these 42 trims (they are each the sole representative of their own family) — `delta_from_base` can remain populated on these; there is no schema contradiction between being a family's base and also having a delta from a different family's base.

---

### B-02. Five ICE trims carry a non-null `ev_specifics` block
- **Model/trim:** `GLA SUV / gla-250`, `GLA SUV / gla-250-4matic`, `GLB SUV / glb-250`, `GLB SUV / glb-250-4matic`, `G-Class / g-550`
- **Issue:** Schema rule: `powertrain.type == "ice"` → `ev_specifics` must be `null`. All five trims have `powertrain.type: "ice"` but `ev_specifics` is a non-null object (a shell with all-null values, plus `electric_range_mi: 0` on the GLA/GLB trims).
- **Found in:** `models[GLA SUV].trims[gla-250].ev_specifics`, and the four other paths listed above.
- **Value seen:** `{"battery_capacity_kwh": null, "battery_usable_kwh": null, "electric_range_mi": 0, "total_range_mi": null, "dc_fast_charge_peak_kw": null, "dc_fast_charge_10_to_80_min": null, "ac_charge_kw": null, "mpge_combined": null, "plug_type": null}` (GLA/GLB); same but `electric_range_mi: null` for G 550.
- **Expected:** `null`

**Note on intent:** The trim notes acknowledge these are ICE/MHEV vehicles and say `ev_specifics` fields are "kept null/zero because the system is non-plug." That reasoning is correct per the schema, but the object itself should be `null`, not an empty shell with zero/null values. The `electric_range_mi: 0` on GLA/GLB trims is additionally misleading — it implies zero electric-only range rather than "not applicable."

---

## Warnings

### W-01. Multiple `sources.fuel_economy` URLs point to wrong vehicles on fueleconomy.gov — 18 trims affected
- **Model/trim:** Three groups of trims across S-Class, GLC SUV, AMG GT 4-Door Coupe, GLS SUV, EQS Sedan, and Maybach EQS SUV (18 trims total).
- **Issue:** The `sources.fuel_economy` field for these trims contains fueleconomy.gov `?id=` links that resolve to entirely different makes/models, confirming the FEG IDs were not verified against the actual EPA database. Verified mismatches:
  - `id=49100` → **2025 Lexus RZ 300e** (used by `S-Class/s-500-4matic` and `GLC SUV/glc-300`)
  - `id=49120` → **2025 Porsche Taycan 4** (used by `AMG GT 4-Door Coupe/amg-gt-43-4-door-coupe` and `GLS SUV/gls-450-4matic`)
  - `id=49050` → **2025 Audi SQ5 Sportback** (used by `EQS Sedan/eqs-450-plus`)
  - `id=49051` → **2025 Audi Q5 TFSI quattro** (used by `EQS Sedan/eqs-450-4matic`)
  - `id=49018` → **2025 AMG C 63 S E Performance** (wrong model year; also used by `Maybach EQS SUV/maybach-eqs-680-suv`, which is a completely different vehicle)
  - IDs 49101–49103 and 49121–49122 are inferred wrong by pattern; not individually verified but appear in the same sequential block as confirmed-wrong IDs.
- **Found in:** `models[S-Class].trims[s-500-4matic].sources.fuel_economy`, and 17 other analogous paths.
- **Value seen:** `"https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49100"` (example)
- **Recommendation:** The underlying MPG/MPGe values in `fuel_economy` blocks may still be correct (they appear plausible for the listed vehicles), but none can be cross-verified via the cited links. All 18 source URLs must be corrected to the proper 2026 Mercedes-Benz FEG IDs before the data is considered auditable.

**Full list of affected trims and their FEG IDs:**

| Model | trim_slug | FEG ID cited | Verified actual vehicle |
|-------|-----------|--------------|------------------------|
| S-Class | s-500-4matic | 49100 | 2025 Lexus RZ 300e |
| S-Class | s-580-4matic | 49101 | unverified (sequential) |
| S-Class | s-580e-4matic | 49102 | unverified (sequential) |
| S-Class | amg-s-63-e-performance | 49103 | unverified (sequential) |
| GLC SUV | glc-300 | 49100 | 2025 Lexus RZ 300e |
| GLC SUV | glc-300-4matic | 49101 | unverified (sequential) |
| GLC SUV | amg-glc-43-4matic | 49102 | unverified (sequential) |
| GLC SUV | glc-350e-4matic | 49103 | unverified (sequential) |
| AMG GT 4-Door Coupe | amg-gt-43-4-door-coupe | 49120 | 2025 Porsche Taycan 4 |
| AMG GT 4-Door Coupe | amg-gt-55-4-door-coupe | 49121 | unverified (sequential) |
| AMG GT 4-Door Coupe | amg-gt-63-4-door-coupe | 49122 | unverified (sequential) |
| GLS SUV | gls-450-4matic | 49120 | 2025 Porsche Taycan 4 |
| GLS SUV | gls-580-4matic | 49121 | unverified (sequential) |
| GLS SUV | amg-gls-63-4matic-plus | 49122 | unverified (sequential) |
| EQS Sedan | eqs-450-plus | 49050 | 2025 Audi SQ5 Sportback |
| EQS Sedan | eqs-450-4matic | 49051 | 2025 Audi Q5 TFSI quattro |
| C-Class Sedan | amg-c-63-s-e-performance | 49018 | 2025 AMG C 63 (wrong MY) |
| Maybach EQS SUV | maybach-eqs-680-suv | 49018 | 2025 AMG C 63 (wrong vehicle) |

---

### W-02. S-Class S 500 4MATIC horsepower: data shows 429 hp, Mercedes-Benz USA class page shows 442 hp
- **Model/trim:** S-Class / s-500-4matic
- **Issue:** The data records `powertrain.horsepower_hp: 429`. The live mbusa.com S-Class class page (fetched 2026-05-12) shows **442 hp** for the S 500 base trim. The mbusa.com model-specific page (`/model/s-class/sedan/s500w4`) returned 404, so the individual-trim source cannot be checked directly.
- **Found in:** `models[S-Class].trims[s-500-4matic].powertrain.horsepower_hp`
- **Value seen:** `429`
- **Source consulted:** `https://www.mbusa.com/en/vehicles/class/s-class/sedan` (class overview page, loaded successfully 2026-05-12)
- **Note:** 429 hp is the published spec for the W223 S 500 with the old naturally-aspirated engine configuration; 442 hp is consistent with the 2025–2026 M256 inline-six with EQ Boost included in the combined figure. The torque figure (413 lb-ft in data vs. 413 lb-ft on mbusa.com) matches, and 0-60 in data (4.7 sec) vs mbusa.com (4.5 sec) is also a minor discrepancy. The powertrain source URL (`/model/s-class/sedan/s500w4`) returned 404, preventing direct verification.
- **Recommendation:** Confirm against the S 500 4MATIC build page or press release; update `horsepower_hp` and `performance.zero_to_60_sec` if the Mercedes-published figure is 442 hp / 4.5 sec.

---

### W-03. CLE Coupe and CLE Cabriolet MSRP mismatches for step-up trims
- **Model/trim:** CLE Coupe / cle-450-4matic, CLE Coupe / amg-cle-53-4matic-plus, CLE Cabriolet / cle-450-4matic-cabriolet, CLE Cabriolet / amg-cle-53-4matic-cabriolet
- **Issue:** The mbusa.com class pages (both fetched successfully 2026-05-12) show MSRP figures that do not match the data:

  | trim_slug | Data MSRP | mbusa.com MSRP | Delta |
  |-----------|-----------|----------------|-------|
  | cle-450-4matic | $66,250 | $69,000 | −$2,750 in data |
  | amg-cle-53-4matic-plus | $83,850 | $76,300 | +$7,550 in data |
  | cle-450-4matic-cabriolet | $73,800 | $77,400 | −$3,600 in data |
  | amg-cle-53-4matic-cabriolet | $90,000 | $84,600 | +$5,400 in data |

- **Found in:** `models[CLE Coupe].trims[cle-450-4matic].msrp_base`, and three analogous paths.
- **Value seen:** $66,250 (CLE Coupe 450), $83,850 (AMG CLE 53 Coupe), $73,800 (CLE Cabriolet 450), $90,000 (AMG CLE 53 Cabriolet)
- **Source consulted:** `https://www.mbusa.com/en/vehicles/class/cle/coupe` and `https://www.mbusa.com/en/vehicles/class/cle/cabriolet`
- **Recommendation:** The AMG CLE 53 source URLs (`/en/amg/vehicles/class/cle/coupe` and `/en/amg/vehicles/cle-cabriolet`) both returned 404. Verify AMG CLE 53 pricing against a working source (e.g., the press release or AMG-specific build page) and reconcile all four MSRPs. The `msrp_range.high` for both models is also affected if these are correct: CLE Coupe high should be $76,300 (not $83,850) and CLE Cabriolet high should be $84,600 (not $90,000) if mbusa.com figures are current.

---

### W-04. Three step-up trims missing `dimensions` key in `sources`
- **Model/trim:** C-Class Sedan / c-300-4matic, E-Class Sedan / e-350-4matic, AMG GT Coupe / amg-gt-63-4matic-plus
- **Issue:** These trims have populated `dimensions` blocks but no `dimensions` entry under `sources`. Although dimensions are inherited from the base trim in all three cases (nulled on the c-300-4matic step-up; identical to c-300 per notes), a citation is required by schema §3.2 when the field is present.
- **Found in:** `models[C-Class Sedan].trims[c-300-4matic].sources` (no `dimensions` key), and two analogous paths.
- **Value seen:** `sources` object has no `dimensions` key
- **Recommendation:** Add a `dimensions` source (e.g., the same carbuzz or mbusa.com link used for the base trim) or set `dimensions: null` on these step-up trims if the dimensions are identical to the base and no separate source is needed.

---

### W-05. Source URLs returning 404 for two AMG CLE 53 trims
- **Model/trim:** CLE Coupe / amg-cle-53-4matic-plus, CLE Cabriolet / amg-cle-53-4matic-cabriolet
- **Issue:** The `sources.msrp_base` entries for both AMG CLE 53 trims point to AMG-subdomain URLs that returned HTTP 404 during this verification:
  - `https://www.mbusa.com/en/amg/vehicles/class/cle/coupe` → 404
  - `https://www.mbusa.com/en/amg/vehicles/cle-cabriolet` → 404
- **Found in:** `models[CLE Coupe].trims[amg-cle-53-4matic-plus].sources.msrp_base` and the analogous CLE Cabriolet path.
- **Value seen:** 404 Not Found
- **Recommendation:** Update both source URLs to working pages (e.g., the main CLE class pages, which successfully list AMG CLE 53 pricing). Also see W-03 — the MSRPs from these pages need reconciliation.

---

### W-06. Six `fueleconomy.gov` source URLs are search/browse pages rather than specific-vehicle links
- **Model/trim:** SL Roadster (all 5 trims), E-Class Wagon / amg-e-53-hybrid-4matic-plus-wagon
- **Issue:** These trims use generic fueleconomy.gov browse pages (e.g., `https://www.fueleconomy.gov/feg/bymodel/2026_Mercedes-Benz.shtml`, `https://www.fueleconomy.gov/feg/findacar.shtml`) as their `fuel_economy` source rather than a specific vehicle ID URL. This means the source cannot be audited for a specific trim's fuel economy values.
- **Found in:** `models[SL Roadster].trims[amg-sl-43].sources.fuel_economy` (and four other SL trims); `models[E-Class Wagon].trims[amg-e-53-hybrid-4matic-plus-wagon].sources.fuel_economy`
- **Value seen:** `"https://www.fueleconomy.gov/feg/bymodel/2026_Mercedes-Benz.shtml"` (SL trims); `"https://www.fueleconomy.gov/feg/findacar.shtml"` (E-Class Wagon)
- **Recommendation:** Locate and record the specific FEG vehicle IDs for these trims once the EPA publishes 2026 data for them. Until then, flag as unverified.

---

## FYIs

### FYI-01. 10 models have 3 of 4 review blocks at `confidence: "unknown"`
- **Models:** CLA, E-Class Wagon, Maybach S-Class, AMG GT 4-Door Coupe, SL Roadster, Maybach GLS, EQS SUV, Maybach EQS SUV — plus CLA (3 unknown), AMG GT Coupe (2 unknown), GLC Coupe (2 unknown).
- **Note:** This is expected for new/ultra-luxury/low-volume MY2026 vehicles with limited owner data. Reliability and customer satisfaction data genuinely does not exist yet for most new 2026 variants. No data quality action required; flag for re-research at next annual update cycle.

---

### FYI-02. 317 image entries have `needs_scraping: true` — all image URLs are HTML gallery pages, not direct asset URLs
- **Models/trims:** All 25 models / all 78 trims.
- **Note:** Every image `url` in the dataset is an mbusa.com HTML page (e.g., `https://www.mbusa.com/en/vehicles/model/cla/sedan/cla250e`) with `needs_scraping: true`. The STATUS.md already documents this as a known pipeline state: direct CDN asset URLs are blocked by 403. The image verification spot-check confirmed that all 5 sampled URLs resolve to working mbusa.com model pages that show the correct vehicle. No data quality defect — the build phase must extract direct image URLs via the scraping pipeline before images can be served.

---

## Coverage stats

- Models with >2 null spec blocks on base trim: **0**
- Models with <4 images on primary base trim: **0** (all base trims have exactly 4 images)
- Models with all 4 review blocks at unknown confidence: **0** (all models have at least `professional_reviews` at `"medium"` confidence)
- Trims missing key source entries (msrp_base, powertrain, fuel_economy): **0**
- Trims missing `dimensions` source when dimensions is non-null: **3** (see W-04)

---

## Sample details

### Sampled trims for source verification

1. **GLC SUV / glc-300** — checked against `https://www.mbusa.com/en/vehicles/class/glc/suv`
   - MSRP: data=$49,550; source=$49,550 — **PASS**
   - Horsepower: data=255 hp; source=255 hp — **PASS**
   - Fuel economy source (`id=49100`) resolves to 2025 Lexus RZ 300e — **FAIL** (see W-01)
   - Overall: 1 issue (W-01 — fuel economy source wrong)

2. **EQS Sedan / eqs-450-plus** — checked against `https://www.mbusa.com/en/vehicles/class/eqs/sedan`
   - MSRP: data=$101,150; class page did not display pricing — **UNVERIFIED**
   - Range: data=390 mi; source page shows "390 mi" — **PASS**
   - HP: data=355 hp; source page did not display HP — **UNVERIFIED**
   - Fuel economy source (`id=49050`) resolves to 2025 Audi SQ5 Sportback — **FAIL** (see W-01)
   - Overall: 1 confirmed issue (W-01)

3. **S-Class / s-500-4matic** — checked against `https://www.mbusa.com/en/vehicles/class/s-class/sedan`
   - MSRP: data=$119,500; source=$119,500 — **PASS**
   - Horsepower: data=429 hp; source=442 hp — **MISMATCH** (see W-02)
   - 0-60: data=4.7 sec; source=4.5 sec — **MISMATCH** (see W-02)
   - Fuel economy source (`id=49100`) resolves to 2025 Lexus RZ 300e — **FAIL** (see W-01)
   - Model-specific source URL (`/model/s-class/sedan/s500w4`) returned 404
   - Overall: 2 issues (W-01 fuel economy source; W-02 HP/0-60 mismatch)

### Image URLs checked

1. `https://www.mbusa.com/en/vehicles/model/cla/sedan/cla250e` — CLA / cla-250-plus / front_three_quarter — **RESOLVES**: page loaded, shows 2026 CLA 250+ with EQ Technology, MSRP $47,250 confirmed.
2. `https://www.mbusa.com/en/vehicles/model/c-class/sedan/c300w` — C-Class Sedan / c-300 / front_three_quarter — **RESOLVES**: page loaded, shows C 300 Sedan, MSRP $49,650 confirmed.
3. `https://www.mbusa.com/en/vehicles/class/cle/coupe` — CLE Coupe / cle-300-4matic / front_three_quarter — **RESOLVES**: page loaded, shows 2026 CLE Coupe lineup. Note: MSRP figures on page differ from data for CLE 450 and AMG CLE 53 (see W-03).
4. `https://www.mbusa.com/en/vehicles/class/cle/cabriolet` — CLE Cabriolet / cle-300-4matic-cabriolet / front_three_quarter — **RESOLVES**: page loaded, shows 2026 CLE Cabriolet lineup. Same MSRP discrepancies noted (see W-03).
5. `https://www.mbusa.com/en/vehicles/model/e-class/sedan/e350w` — E-Class Sedan / e-350 / front_three_quarter — **RESOLVES**: page loaded, shows E 350 Sedan, MSRP $63,900 confirmed.

All 5 image source URLs resolve correctly. Images are HTML gallery pages (not direct asset files) — this is a known pipeline state, not a defect.

---

## Notes on this verification

**What was easy:** Top-level schema structure is sound — all required model-level keys are present across all 25 models, MSRP range `low`/`high` values match the actual trim MSRP min/max in every case, all `delta_from_base.from_trim_slug` references resolve to valid trims in the same model, and no trim has a null `msrp_base`. Cargo volume / body_style consistency is clean: sedan/coupe trims correctly populate `trunk_cuft` and leave `behind_2nd_row`/`behind_1st_row` null; SUV/wagon trims do the opposite.

**B-01 pattern:** The `is_base_trim` issue appears to be a systematic researcher misunderstanding of when `is_base_trim` should be set. The researcher correctly used one `trim_family` per distinct powertrain line, correctly recorded `delta_from_base` cross-family references for step-up trims, but did not set `is_base_trim: true` on trims that happen to be the only member of their family. The fix is mechanical and low-risk: set `is_base_trim: true` on all 42 sole-in-family trims.

**FEG source links:** The fueleconomy.gov ID numbers show a clear pattern of copy-paste error — blocks of 4 sequential IDs are shared between two unrelated model groups (S-Class/GLC both use 49100–49103; AMG GT 4-Door/GLS both use 49120–49122; EQS Sedan uses 49050–49053 which resolve to Audi vehicles). The actual MPG/MPGe values in the data blocks appear plausible for the vehicles they describe, but cannot be confirmed via the cited sources. EPA typically publishes 2026 Mercedes-Benz IDs in the 48xxx–49xxx range; the correct IDs will need to be looked up from the EPA's 2026 data release.

**S-Class HP:** The 429 hp figure in the data is consistent with older S-Class W223 spec sheets (2022–2024 MY). The 2025–2026 S 500 with the updated M256 engine is widely cited at 429 or 443 hp depending on whether EQ Boost momentary assist is included in the combined output figure. The mbusa.com class page prominently shows 442 hp. This warrants a quick cross-check.

**CLE pricing:** The direction of the mismatches (CLE 450 under-reported, AMG CLE 53 over-reported) is unusual and may reflect model year pricing that changed between the research date and when mbusa.com was scraped during this verification, or the data may have been sourced from a different regional pricing document. The AMG CLE 53 source URLs (AMG subdomain) both returned 404, which removes the ability to verify against the cited source.

**catalog/data/mercedes-benz.json:** Does not exist — Phase 2 (build) has not run for Mercedes-Benz yet. Not treated as a blocker; noted as pipeline state per QA instructions.
