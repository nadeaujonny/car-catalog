# Verification Report: Genesis

**Date:** 2026-05-13
**Data source:** `data/genesis.json` (researched 2026-05-12)
**Models checked:** 8
**Trims checked:** 39
**Trims sampled for source verification:** 3 (G70 / 2.5T Prestige AWD; GV60 / Standard AWD; GV80 / 2.5T Select AWD)
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 1
- **Warnings:** 1
- **FYIs:** 3

---

## Blockers

### 1. GV70 msrp_range.high mismatch (off by $1,000)

- **Model/trim:** GV70 (model-level)
- **Issue:** `msrp_range.high` is `70095` but the highest `msrp_base` across the GV70 trims is `71095` (3.5T Sport Prestige AWD). Per spec §3 (model object) and Step 5 internal-consistency rule, `msrp_range.high` must equal the maximum `msrp_base` across all trims.
- **Found in:** `models[4].msrp_range.high` (GV70)
- **Value seen:** `70095`
- **Expected:** `71095`
- **Note:** The next-highest trim is `3-5t-sport-advanced-awd` at $64,415; the $70,095 figure does not appear anywhere in GV70's trim list. Likely a stale value from a prior price-list draft.

---

## Warnings

### 1. GV70 2.5T Sport Prestige AWD — singleton trim_family carries only 2 of 4 required image angles (spec §7)

- **Model/trim:** GV70 / 2.5T Sport Prestige AWD (`trim_family: "gv70-25t-sport"`)
- **Issue:** This trim is the only member of its `gv70-25t-sport` family (a singleton family). Per spec §7, a singleton family must carry all 4 required image angles directly on the trim. Currently the trim's `images` array contains only `front_three_quarter` and `interior_dashboard` (2 of 4) — missing `rear_three_quarter` and `side_profile`.
- **Found in:** `models[4].trims[3].images` (GV70 / 2-5t-sport-prestige-awd)
- **Value seen:** 2 image entries (`front_three_quarter`, `interior_dashboard`)
- **Source consulted:** Phase 1 set this family to singleton per Genesis structure ("GV70 2.5T Sport Prestige... also are sole-trim families/lines per Genesis structure" — STATUS notes).
- **Recommendation:** Either (a) add `rear_three_quarter` and `side_profile` image entries to this trim (Scene7 CDN URLs are extractable for the GV70 Sport Prestige photography set), or (b) merge into the broader `gv70-25t` family (with `is_shared_with_trim_family: true` on shared angles).

---

## FYIs

### 1. NHTSA ratings null for 7 of 8 models (only GV70 rated)

- **Model/trim:** G70, G80, G90, GV60, Electrified GV70, GV80, GV80 Coupe (`safety.nhtsa_overall_rating: null`); GV70 carries 5-star rating.
- **Note:** NHTSA has not yet posted 2026 ratings for the other 7 nameplates. Phase 1 research correctly cited the NHTSA per-vehicle URLs but left ratings null when no rating exists. IIHS coverage is more complete (TSP+ on G80, GV60, GV70, Electrified GV70, GV80; TSP on G90; no rating on G70 / GV80 Coupe). Expected per batch context.

### 2. JD Power VDS / APEAL not separately scored per model (`customer_satisfaction.confidence: "unknown"` across the brand)

- **Model/trim:** All 8 models — `customer_satisfaction.confidence: "unknown"`, `reliability.confidence: "low"`.
- **Note:** Genesis brand placed 3rd in 2025 JD Power premium-brand VDS (per Phase 1 cross-reference) but JD Power does not publish per-model scores for Genesis at the 2026 MY (data lag from the 3-year-old measurement window). Expected.

### 3. One image entry uses MY25 photography on a 2026 trim (GV80 Coupe interior_dashboard)

- **Model/trim:** GV80 Coupe / 3.5T e-Supercharger AWD / interior_dashboard
- **Note:** Image URL is `https://s7d1.scene7.com/is/image/hyundai/my25-jx-0763:1-1?wid=1000&hei=1000&fmt=webp` (note `my25-` prefix). HEAD-check returned 200 OK with content-type `image/webp`. This is likely intentional (interior unchanged from MY25 GV80 Coupe) but worth flagging for review — if MY26 has a different center-stack or dash, the photo is stale. The other 4 GV80 Coupe image entries use `my26-jx-*` prefixes.

---

## Coverage stats

- Models with >2 null spec blocks on base trim: **0**
- Models with <4 images on a trim family: **1** (GV70 `gv70-25t-sport` singleton family — see Warning #1)
- Models with all 4 review blocks at unknown confidence: **0**
- Trims missing key sources entries for *populated* blocks: **0** (all "missing" entries correspond to null spec blocks on step-up trims, which is permitted by §6.3)

---

## Sample details

### Sampled trims for source verification

1. **G70 / 2.5T Prestige AWD** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49254` (EPA)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 20/28/23 — **PASS** (EPA matches exactly)
   - `fuel_economy.fuel_type_required: "premium"` — **PASS** (EPA: "Premium Gasoline Recommended")
   - `powertrain.engine_displacement_l: 2.5 / engine_config: "I4" / aspiration: "turbocharged" / transmission_speeds: 8` — **PASS** (EPA: "2.5 L, 4 cyl, Automatic (S8), Turbo")
   - `msrp_base: $50,450` cited from genesis.com/us/en/g70 — primary manufacturer source per spec §4.1
   - Result: **PASS on every EPA-verifiable field**

2. **GV60 / Standard AWD** (EV) — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49653` (EPA)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 107/93/100 — **PASS** (EPA matches exactly, MPGe mirrored per spec §3.6 v1.1)
   - `ev_specifics.electric_range_mi: 282 / total_range_mi: 282` — **PASS** (EPA matches exactly)
   - `ev_specifics.mpge_combined: 100` — **PASS** (matches `fuel_economy.combined_mpg` mirror)
   - `powertrain.type: "ev" / drivetrain: "AWD-electric"` — **PASS** (EPA: "74 and 160 kW PMSM" dual-motor)
   - `msrp_base: $54,530` cited from genesis.com/us/en/gv60 — primary manufacturer source
   - Result: **PASS on every EPA-verifiable field; MPGe mirror correctly applied**

3. **GV80 / 2.5T Select AWD** (step-up trim) — checked against `https://www.genesis.com/us/en/gv80`
   - This is a step-up trim with `powertrain: null`, `fuel_economy: null`, `dimensions: null` per spec §6.3 (block null when unchanged from base 2.5T AWD).
   - `delta_from_base` correctly references `from_trim_slug: "2-5t-awd"` (verified — trim exists in same model).
   - `msrp_base: $63,750` cited from genesis.com/us/en/gv80 — primary manufacturer source
   - Result: **Delta-form trim is structurally valid; values match base trim by inheritance**

### Image URLs checked

All 5 sampled image URLs are direct Scene7 CDN assets (https://s7d1.scene7.com/is/image/hyundai/...). HEAD-check results:

1. `https://s7d1.scene7.com/is/image/hyundai/my26-ik-0434:16-9?wid=1800&hei=1013&fmt=webp` — G70 / 2.5T RWD / front_three_quarter — **PASS** (200 OK, image/webp, 73,364 bytes)
2. `https://s7d1.scene7.com/is/image/hyundai/my26-rg3-0417:16-9?wid=1800&hei=1013&fmt=webp` — G80 / 2.5T AWD / front_three_quarter — **PASS** (200 OK, image/webp, 82,112 bytes)
3. `https://s7d1.scene7.com/is/image/hyundai/my26-jw-0418-us-2:16-9?wid=1800&hei=1013&fmt=webp` — GV60 / Standard RWD / interior_dashboard — **PASS** (200 OK, image/webp, 185,384 bytes)
4. `https://s7d1.scene7.com/is/image/hyundai/my26-jkev-1076:16-9?wid=1800&hei=1013&fmt=webp` — Electrified GV70 / AWD / rear_three_quarter — **PASS** (200 OK, image/webp, 68,518 bytes)
5. `https://s7d1.scene7.com/is/image/hyundai/my25-jx-0763:1-1?wid=1000&hei=1000&fmt=webp` — GV80 Coupe / 3.5T e-SC AWD / interior_dashboard — **PASS** (200 OK, image/webp, 68,640 bytes) — note `my25-` prefix (see FYI #3)

All 5 image URLs resolve to actual image assets. The remaining 17 image entries with `needs_scraping: true` were not flagged per batch protocol.

---

## Notes on this verification

- **EPA spot-checks were clean.** Both EPA URLs (49254 G70 AWD, 49653 GV60 AWD) resolved and matched the data exactly on MPG/MPGe, fuel type, and powertrain summary. The GV60 EPA entry also confirmed `electric_range_mi: 282` and `mpge_combined: 100` per the v1.1 mirror convention.
- **No forbidden sources detected.** Programmatic JSON sweep flagged 0 hits for motor1.com, carbuzz.com, autoblog.com, autoevolution.com, teslaoracle.com, iseecars.com, hiconsumption.com, topspeed.com, hotcars.com, wikipedia, or www.cars.com.
- **No dealer-domain sources detected.** (Initial automated regex flagged 3 newsroom.genesis.com URLs whose slugs contain "vehicle-of-texas"; those are manufacturer-press URLs, not dealer sites — verified false positives, no finding.)
- **Image-URL HEAD-check** was the highest-coverage of this batch slot so far: 5 of 5 Scene7 CDN URLs resolved as images. 77 of 94 image entries are direct CDN URLs (the remaining 17 are page-URL placeholders flagged `needs_scraping: true` — expected per Phase 4 protocol).
- **Sole-trim atomic rule** verified on all 8 model entries — G80, G90, GV60 Performance, GV70 2.5T Sport Prestige (singleton family — see Warning #1), G70 Prestige Graphite RWD/AWD, G80 Prestige Black, GV80 Prestige Black, GV80 Coupe Prestige Black, G90 E-SC Prestige Black are correctly marked `is_base_trim: true` with `delta_from_base: null` per the singleton-family / sole-trim-line rules.
- **MSRP-range integrity check** found one mismatch (Blocker #1, GV70 high $70,095 vs computed $71,095). All 7 other models pass exactly.
- **Cross-trim sanity check passed** — no MSRP 50%+ outliers, no horsepower or dimension outliers across any model.
- **Body-style/cargo-volume consistency check passed** — sedans (G70/G80/G90) have `trunk_cuft` populated and `behind_2nd_row` null; SUVs (GV60/GV70/Electrified GV70/GV80/GV80 Coupe) have `behind_2nd_row` and `behind_1st_row` populated and `trunk_cuft` null.
- **Recommendation: Address the GV70 msrp_range.high blocker** (1-line fix, change 70095 → 71095). Then proceed to publish. The singleton-family warning is worth fixing in the same pass but does not block use.
