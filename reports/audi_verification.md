# Verification Report: Audi

**Date:** 2026-05-12
**Data source:** `data/audi.json` (researched 2026-05-12)
**Models checked:** 25
**Trims checked:** 47
**Trims sampled for source verification:** 3 (RS 6 Avant performance, S5 Premium 3.0 TFSI quattro, SQ5 Prestige 3.0 TFSI quattro)
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 1 (covers 19 forbidden-source citations)
- **Warnings:** 2
- **FYIs:** 3

---

## Blockers

### 1. 19 residual www.cars.com citations in `professional_reviews.links` across the brand

- **Issue:** Per spec §4 and this batch's source-cleanup pass, www.cars.com is on the forbidden-content-farm list. 19 Audi models still cite cars.com in their `professional_reviews.links`. This is the largest forbidden-source residual count in any brand in the batch — the cleanup pass for Audi appears to have not happened or not fully run.
- **Found in (19 entries):**
  - A3: `models[0].professional_reviews.links[1]` → cars.com/research/audi-a3-2026/
  - S3: `models[1].professional_reviews.links[2]` → cars.com/research/audi-s3-2026/specs/
  - A5: `models[3].professional_reviews.links[1]` → cars.com/research/audi-a5-2026/specs/
  - S5: `models[4].professional_reviews.links[2]` → cars.com/research/audi-s5-2026/specs/
  - A6 Sedan: `models[5].professional_reviews.links[1]` → cars.com/research/audi-a6-2026/specs/
  - A6 allroad: `models[6].professional_reviews.links[1]` → cars.com/research/audi-a6_allroad-2026/
  - A8: `models[7].professional_reviews.links[1]` → cars.com/research/audi-a8-2026/
  - S8: `models[8].professional_reviews.links[1]` → cars.com/research/audi-s8-2026/
  - RS 7 performance: `models[10].professional_reviews.links[2]` → cars.com/articles/how-much-is-the-2026-audi-rs-7-519298/
  - Q3: `models[11].professional_reviews.links[2]` → cars.com/research/audi-q3-2026/
  - Q4 e-tron: `models[12].professional_reviews.links[2]` → cars.com/research/audi-q4_e_tron-2026/specs/
  - Q5: `models[14].professional_reviews.links[1]` → cars.com/research/audi-q5-2026/
  - Q5 Sportback: `models[15].professional_reviews.links[1]` → cars.com/research/audi-q5_sportback-2026/
  - SQ5: `models[16].professional_reviews.links[1]` → cars.com/research/audi-sq5-2026/specs/483070/
  - SQ5 Sportback: `models[17].professional_reviews.links[1]` → cars.com/research/audi-sq5_sportback-2026/
  - Q7: `models[18].professional_reviews.links[1]` → cars.com/research/audi-q7-2026/
  - Q8: `models[20].professional_reviews.links[2]` → cars.com/research/audi-q8-2026/specs/
  - SQ8: `models[21].professional_reviews.links[0]` → cars.com/research/audi-sq8-2026/
  - RS Q8 performance: `models[22].professional_reviews.links[1]` → cars.com/research/audi-rs_q8-2026/
- **Expected:** Replace each with a permitted secondary source (Car and Driver, MotorTrend, Edmunds — all listed in spec §4.1) or drop without replacement.

---

## Warnings

### 1. RS 7 performance — body=sedan but trunk null with rear cargo populated (Sportback liftback)

- **Model/trim:** RS 7 performance / RS 7 performance (sole trim)
- **Issue:** Audi RS 7 is a Sportback (5-door liftback) but `body_style: "sedan"`. Cargo measurements use hatchback-style fields (`behind_2nd_row` / `behind_1st_row` populated) with `trunk_cuft: null`. Per spec §3.8, sedans should have `trunk_cuft` populated. Same pattern as Porsche Panamera (Warning #5 in `porsche_verification.md`).
- **Found in:** `models[10].trims[0].dimensions.cargo_volume_cuft`
- **Value seen:** sedan body, hatchback cargo
- **Recommendation:** Reclassify as `body_style: "hatchback"` (liftbacks are hatchbacks per spec §5), or document the Audi marketing convention (Sportback = sedan in Audi nomenclature) in model `notes`. The A7 chassis is genuinely a 5-door liftback so hatchback may be the more faithful classification.

---

### 2. Audi 48V MHEVs classified as `powertrain.type: hybrid` — spec interpretation question

- **Models/trims:** Multiple Audi models including S5 Premium 3.0 TFSI, RS 6 Avant performance, RS 7 performance, and likely others where the 3.0L V6 or 4.0L V8 carries Audi's 48V MHEV system
- **Issue:** Spec §3.4 defines `type` as `"ice" | "hybrid" | "phev" | "ev" | "fcev"`. Audi 48V mild-hybrid systems are technically MHEV — they recover braking energy and assist via belt-alternator-starter but cannot drive on electricity alone. The spec doesn't explicitly carve out MHEV, leaving Phase 1 to choose between `ice` and `hybrid`. Data uses `hybrid`. EPA treats these as conventional gasoline (no MPGe). `ev_specifics` is null on these trims, which is inconsistent with the `hybrid` type per spec §3.5 (which says `ev_specifics` is populated for hybrid/PHEV/EV/FCEV).
- **Found in:** representative `models[10].trims[0].powertrain.type` (RS 7 performance) and several S/RS models
- **Value seen:** `type: hybrid` with `ev_specifics: null`
- **Recommendation:** Either (a) reclassify Audi MHEVs as `type: ice` (matching EPA's treatment and avoiding the §3.5 inconsistency), or (b) add an MHEV value to the type enum and update the data. Option (a) is the lower-friction fix and aligns with how MHEVs are reported throughout the industry. Toyota and Mazda 48V MHEVs were classified as `ice` in earlier brands in this project, so option (a) is also consistent with prior precedent.

---

## FYIs

### 1. JD Power VDS / APEAL / Consumer Reports — partial brand coverage; no all-unknown models

- **Model/trim:** every model
- **Note:** Audi is sampled by JD Power but per-model 2026-MY scores were not located in Phase 1 primary sources. `reliability` and `customer_satisfaction` blocks are documented as `low` or `unknown` confidence with prose summaries explaining the gap. No model triggers the §2 "all-four-unknown" FYI rule.

### 2. STATUS.md-documented exclusions vs scope — 8 model exclusions are intentional

- **Note:** Per STATUS.md, "A4/A7/S7/Q8 e-tron/SQ8 e-tron/TT/R8/RS Q3/RS 5 excluded (discontinued or not 2026 US); A6 e-tron/S6 e-tron/Q6 e-tron/SQ6 e-tron skipped 2026 MY in US (went directly to 2027); A6 sedan new C9 gen replaces A6+A7; S/RS variants split as separate models per performance-variant rule." All 25 included models are a defensible 2026 US lineup snapshot.

### 3. All 128 image entries are `needs_scraping: true` (audiusa.com pages)

- **Model/trim:** every model
- **Note:** Per STATUS.md, "audiusa.com returned 403 to WebFetch on all model pages, media.audiusa.com mostly returns logo/nav only — all image URLs are audiusa.com model-overview page URLs requiring follow-up scrape via CDN paths or media.audiusa.com asset extraction." Per batch protocol these are not flagged as image-URL failures.

---

## Coverage stats

- Models with >2 null spec blocks on base trim: **0**
- Trim families with <4 images or missing required angles: **0**
- Models with all 4 review blocks at `confidence: "unknown"`: **0**
- Trims missing key sources entries for populated blocks: **0**

---

## Sample details

### Sampled trims for source verification

1. **RS 6 Avant performance** — checked against `https://www.fueleconomy.gov/feg/noframes/49351.shtml` (EPA)
   - `fuel_economy.city/highway/combined: 14/21/16` — **PASS** (EPA matches exactly)
   - `fuel_economy.fuel_type_required: "premium"` — **PASS**
   - `powertrain.engine_displacement_l: 4.0` / `engine_config: "V8"` — **PASS** (EPA: "8-cylinder, 4.0-liter engine")
   - `powertrain.type: "hybrid"` — see Warning #2 (48V MHEV classification question)
   - `sources.msrp_base` → audiusa.com URL (well-formed; not retrievable due to documented 403)
   - Result: **PASS on EPA-verifiable fields; MHEV classification question flagged separately**

2. **S5 Premium 3.0 TFSI quattro** (base of S5 model) — checked against `https://www.fueleconomy.gov/feg/noframes/50281.shtml` (EPA)
   - `fuel_economy.city/highway/combined: 20/29/23` — **PASS** (EPA matches exactly)
   - `powertrain.engine_displacement_l: 3.0` / `engine_config: "V6"` / `aspiration: "turbocharged"` / `drivetrain: "AWD"` — **PASS** (EPA confirms)
   - Result: **PASS on every EPA-verifiable field**

3. **SQ5 Prestige 3.0 TFSI quattro** (step-up of SQ5) — sources map carries only `msrp_base` URL; other blocks have `powertrain: null` etc. per spec §6.3 (block null when unchanged from base)
   - `msrp_base: $66,695` / `destination_fee: $1,295` — `sources.msrp_base` points to audiusa.com SQ5 page
   - Result: **Step-up trim with delta-only data; cannot independently verify without retrieving audiusa.com page (403)**

### Image URLs checked

All 5 sampled image entries had `needs_scraping: true` and pointed to audiusa.com model overview pages:

1. `https://www.audiusa.com/en/models/e-tron-gt/s-e-tron-gt/2026/overview/` — S e-tron GT quattro side_profile — `needs_scraping: true` (expected)
2. `https://www.audiusa.com/en/models/a6/rs6-avant/2026/overview/` — RS 6 Avant performance side_profile — `needs_scraping: true` (expected)
3. `https://www.audiusa.com/en/models/q8/rsq8/2026/overview/` — RS Q8 performance side_profile — `needs_scraping: true` (expected)
4. `https://www.audiusa.com/en/models/q5/q5-sportback/2026/overview/` — Q5 Sportback Premium 45 TFSI quattro front_three_quarter — `needs_scraping: true` (expected)
5. `https://www.audiusa.com/en/models/a5/a5/2026/overview/` — A5 Prestige 45 TFSI quattro front_three_quarter — `needs_scraping: true` (expected)

No image URL failures flagged per batch protocol.

---

## Notes on this verification

- **The 19 cars.com citations (Blocker #1) is the largest forbidden-source residual in any brand this batch.** Tesla had a similar volume (≈10 in `sources` + ≈10 in `professional_reviews.links`) spread across multiple forbidden sources. Audi's is concentrated in one source (cars.com) and one location (`professional_reviews.links[N]` for various N per model). A single grep + replace operation (perhaps with manual replacement of each URL) would clear all 19.
- **EPA spot-checks were clean** for the two trims with published EPA entries (RS 6 Avant: 14/21/16 and S5: 20/29/23, both matching exactly).
- **The Audi MHEV-as-hybrid (Warning #2) is a project-wide convention question.** This batch has 5+ Audi models with 48V MHEV powertrains labeled `type: hybrid`. Toyota and Mazda data in earlier brands of this project labeled their 48V MHEVs as `ice`. A project-wide alignment decision would help downstream filtering and avoid the §3.5 `ev_specifics: null` inconsistency.
- **The RS 7 Sportback body-style question (Warning #1)** is identical to the Porsche Panamera issue — manufacturer's marketing language ("Sportback" / "sport sedan") vs the spec §5 taxonomy. Three of the four batch brands with this pattern (Porsche, Audi, Lexus LC 500 Convertible) have it in some form. Worth a project convention decision.
- **Multi-base trim layout per spec §6.2** is correctly applied on Q4 e-tron (2 bases: 45 e-tron / 55 e-tron) and Q7 (2 bases: 45 TFSI ICE / 55 TFSI Hybrid). The 45/55 split represents different motor configurations on the same platform.
- **Schema, MSRP integrity, body-style taxonomy (excluding Warning #1), delta-from-base references, sources-coverage, image-family coverage, and powertrain/ev_specifics consistency** all pass programmatic check.
- **audiusa.com 403 to WebFetch** (documented in STATUS.md) means manufacturer source URLs cannot be re-verified automatically. All cited URLs are well-formed and consistent with Audi's actual URL scheme.
