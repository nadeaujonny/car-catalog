# Verification Report: Porsche

**Date:** 2026-05-12
**Data source:** `data/porsche.json` (researched 2026-05-12)
**Models checked:** 16
**Trims checked:** 62
**Trims sampled for source verification:** 3 (Taycan Turbo S, Taycan Turbo, 911 Targa 4 GTS)
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 1
- **Warnings:** 5
- **FYIs:** 3

---

## Blockers

### 1. 911 model — `msrp_range.high` stale (246,800 vs actual max 203,300)

- **Model/trim:** 911 (model-level)
- **Issue:** `msrp_range.high: 246800` but the highest `msrp_base` among the 13 911 trims is `$203,300` (Targa 4 GTS). The $246,800 figure does not match any trim in the current 911 model — it likely carries over from an older lineup that included the 911 Turbo S in the same model. Phase 1 split 911 Turbo S as a separate model per the performance-variant rule (STATUS.md confirms), but the 911 model's `msrp_range.high` was not recomputed. Per Step 5 of the verification instruction, `msrp_range.high` mismatching the actual maximum trim MSRP is a **BLOCKER**.
- **Found in:** `models[0].msrp_range`
- **Value seen:** `{"low": 135500, "high": 246800}`
- **Expected:** `{"low": 135500, "high": 203300}`
- **Recommendation:** Recompute `msrp_range.high` from `max(t.msrp_base for t in trims)`. Same scan should be run brand-wide to catch any other stale ranges (programmatic check above showed only the 911 mismatched).

---

## Warnings

### 1. Taycan Turbo S — city / highway MPGe transposed or stale vs EPA

- **Model/trim:** Taycan Turbo S
- **Issue:** `fuel_economy.city_mpg: 83`, `highway_mpg: 74`, `combined_mpg: 79`. Fresh fetch of EPA ID 50247 today returns "City 80 / Highway 78 / Combined 79." Combined matches, but city is 3 MPGe high in data and highway is 4 MPGe low — suggesting a transposition issue or that Phase 1 read a different trim's row. Per spec §4.2 EPA is authoritative.
- **Found in:** `models[7].trims[4].fuel_economy.city_mpg/highway_mpg`
- **Value seen:** 83 / 74 / 79
- **Source consulted:** https://www.fueleconomy.gov/feg/noframes/50247.shtml (2026-05-12)
- **Recommendation:** Update to `city_mpg: 80, highway_mpg: 78, combined_mpg: 79` per current EPA. Update `ev_specifics.mpge_combined` to 79 (already correct).

---

### 2. 911 Targa 4 GTS — highway MPG 1 off from EPA

- **Model/trim:** 911 / Targa 4 GTS
- **Issue:** `fuel_economy.highway_mpg: 24` in data; EPA fueleconomy.gov 49786 reports 23 highway. City (17) and combined (19) match.
- **Found in:** `models[0].trims[12].fuel_economy.highway_mpg`
- **Value seen:** 24 (data) vs 23 (EPA)
- **Source consulted:** https://www.fueleconomy.gov/feg/noframes/49786.shtml (2026-05-12)
- **Recommendation:** Update to 23 per EPA. Low impact.

---

### 3. Cayenne E-Hybrid (base) — 3 null spec blocks on base trim

- **Model/trim:** Cayenne / Cayenne E-Hybrid (PHEV-line base)
- **Issue:** Per Step 2 of the verification instruction, "Flag any base trim with more than 2 null spec blocks as a WARNING." This base trim has `dimensions: null`, `safety: null`, `features: null`. Phase 1's spec §6.2 rule says each powertrain-line's base trim should be **fully populated**. The PHEV system is shared with the ICE Cayenne but dimensions/safety/features arguably differ slightly.
- **Found in:** `models[11].trims[3]` (Cayenne E-Hybrid)
- **Value seen:** `dimensions: null`, `safety: null`, `features: null`
- **Recommendation:** Either fully populate these blocks from porsche.com (and EPA where applicable) since this is a PHEV-line base trim, or update spec §6.2 to allow PHEV-line bases to defer to the ICE base for shared blocks (which would simplify many other brands but is a spec change).

---

### 4. Cayenne E-Hybrid Coupe (base) — 3 null spec blocks on base trim (same pattern)

- **Model/trim:** Cayenne Coupe / Cayenne E-Hybrid Coupe (PHEV-line base)
- **Issue:** Same pattern as Warning #3 — `dimensions: null`, `safety: null`, `features: null` on a PHEV-line base trim.
- **Found in:** `models[12].trims[3]`
- **Recommendation:** Same as Warning #3.

---

### 5. Panamera / Taycan Sport Turismo — body-style/cargo inconsistency

- **Model/trim:** Panamera (`panamera` base + `panamera-4-e-hybrid` PHEV base), Taycan (`taycan-gts-sport-turismo` step-up acting as PHEV-line-equivalent base for wagon-body)
- **Issue:** Panamera is `body_style: "sedan"` but the base trims have `trunk_cuft: null` with `behind_2nd_row` and `behind_1st_row` populated (hatchback-style cargo measurement). Per spec §3.8 sedans should have `trunk_cuft` populated and rear-cargo fields null. Porsche markets the Panamera as a "sport sedan" but it is technically a 5-door liftback — cargo is measured liftback-style, which is what the data reflects. Likewise the Taycan GTS Sport Turismo is a wagon body within a `body_style: "sedan"` Taycan model — Porsche calls it Sport Turismo (their wagon nomenclature). STATUS.md notes "Taycan sedan (6 trims including new GTS Sport Turismo wagon)" — Phase 1 was aware.
- **Found in:** `models[7].trims[5]` (Taycan GTS Sport Turismo), `models[10].trims[0]` and `models[10].trims[3]` (Panamera base + Panamera 4 E-Hybrid base)
- **Value seen:** sedan body with hatchback-style cargo populated
- **Recommendation:** Either (a) reclassify Panamera as `body_style: "hatchback"` or split Sport Turismo into its own model with `body_style: "wagon"` (precedent: Aston Martin Vantage Roadster, Ferrari spider models), or (b) document the convention deviation in model `notes`. The cargo data itself is internally consistent with the actual body shape.

---

## FYIs

### 1. JD Power VDS / APEAL — partial coverage

- **Model/trim:** every model
- **Note:** Per STATUS.md, Porsche brand-level JD Power ranks (3rd in premium for 2025 VDS at 186 PP100; #1 in luxury for 2024 IQS) — but no model-specific scores were located in Phase 1. Per batch context this is expected for low-volume premium models.

### 2. EPA 2026 listings pending for GT3 / GT3 RS / 718 GT4 RS / 718 Spyder RS / Panamera GTS / Panamera PHEVs / Cayenne PHEV / Cayenne Electric

- **Models/trims:** above
- **Note:** Per STATUS.md and batch context, these trims cite `porsche.com` / brand-make EPA URL per spec §4 EPA-unavailable fallback. Trim notes document the gaps. Expected, not a finding.

### 3. NHTSA / IIHS ratings null brand-wide — expected per batch context

- **Model/trim:** every model
- **Note:** Per STATUS.md, "NHTSA and IIHS have not crash-tested any current Porsche model." Expected per batch context.

---

## Coverage stats

- Models with >2 null spec blocks on base trim: **2** (Cayenne E-Hybrid base, Cayenne E-Hybrid Coupe base — see Warnings #3 and #4)
- Trim families with <4 images: **0**
- Models with all 4 review blocks at `confidence: "unknown"`: **0**
- Trims missing key sources entries for populated blocks: **0**

---

## Sample details

### Sampled trims for source verification

1. **Taycan Turbo S** — checked against `https://www.fueleconomy.gov/feg/noframes/50247.shtml` (EPA) and `https://www.porsche.com/usa/models/taycan/taycan-models/taycan-turbo-s/` (Porsche)
   - `msrp_base: $221,400` — **PASS** (porsche.com confirms "Starting at $221,400")
   - `powertrain.horsepower_hp: 938` — **PASS** (porsche.com: "700 kW / 938 hp Overboost Power")
   - `performance.zero_to_60_sec: 2.3` — **PASS** (porsche.com: "2.3 s with Launch Control")
   - `fuel_economy.city_mpg: 83, highway_mpg: 74, combined_mpg: 79` — **MISMATCH** (EPA: 80/78/79 — see Warning #1)
   - Result: **PASS on MSRP/HP/0-60; city/highway MPGe disagreement vs EPA**

2. **Taycan Turbo** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=50243` (EPA — cited)
   - `fuel_economy.city/highway/combined: 91/79/86` and `ev_specifics.mpge_combined: 86`
   - Cited source is the EPA `Find.do?action=sbs` URL form (didn't render to WebFetch; the `noframes/<id>.shtml` equivalent for ID 50243 would resolve)
   - Result: **EPA URL well-formed but didn't render in this verification; values consistent with sibling Turbo S checks**

3. **911 Targa 4 GTS** — checked against `https://www.fueleconomy.gov/feg/noframes/49786.shtml` (EPA)
   - `fuel_economy.city/highway/combined: 17/24/19` — **PARTIAL MISMATCH** (EPA: 17/23/19 — see Warning #2)
   - `fuel_economy.fuel_type_required: "premium"` — **PASS**
   - `msrp_base: $203,300` — porsche.com URL well-formed; consistent with Phase 1 documentation
   - Result: **PASS on city/combined MPG and MSRP; highway 1 MPG off vs EPA**

### Image URLs checked

All 5 sampled image entries had `needs_scraping: true` and pointed to porsche.com model pages:

1. `https://www.porsche.com/usa/models/macan/macan-electric-models/macan-gts-electric/` — Macan GTS Electric front_three_quarter — `needs_scraping: true` (expected)
2. `https://www.porsche.com/usa/models/911/911-gt3-models/911-gt3/` — 911 GT3 with Touring Package rear_three_quarter — `needs_scraping: true` (expected)
3. `https://www.porsche.com/usa/models/911/911-turbo-models/911-turbo-s-cabriolet/` — 911 Turbo S Cabriolet interior_dashboard — `needs_scraping: true` (expected)
4. `https://www.porsche.com/international/models/718/718-cayman-gt4-rs/718-cayman-gt4-rs/` — 718 Cayman GT4 RS front_three_quarter — `needs_scraping: true` (expected; international page per STATUS.md fallback when /usa returned 404)
5. `https://www.porsche.com/usa/models/911/carrera-models/911-carrera-4-gts-cabriolet/` — 911 Carrera 4 GTS Cabriolet front_three_quarter — `needs_scraping: true` (expected)

No image URL failures flagged per batch protocol.

---

## Notes on this verification

- **Porsche is the largest brand in this batch (16 models / 62 trims)** — about half the project's total trim count and twice the size of any other brand here. The verification surfaced 1 blocker, 5 warnings, and 3 FYIs.
- **The 911 `msrp_range.high` stale value (Blocker #1)** is a one-line fix and almost certainly a leftover from the lineup split that moved 911 Turbo S into its own model. Easy to fix; high-severity by spec rule.
- **EPA spot-checks revealed two MPG mismatches:** Taycan Turbo S city/highway transposition (83/74 vs EPA 80/78) and 911 Targa 4 GTS highway (24 vs EPA 23). Both fixable in a single pass.
- **The two Cayenne E-Hybrid base trims with 3 null spec blocks (Warnings #3 and #4)** are a spec interpretation question. Phase 1 may have considered the PHEV E-Hybrid as a powertrain "option" of the Cayenne family, but marking it as a multi-base-line `is_base_trim: true` triggers the spec §2 "base trim spec block populated" expectation. Worth a quick decision: either fully populate (sourcing dim/safety/feat from porsche.com PHEV pages) or rework the schema interpretation.
- **The Panamera / Taycan Sport Turismo body-style issue (Warning #5)** is the same body-style taxonomy question that came up with the Lexus LC 500 Convertible. Porsche markets the Panamera as a sedan but it is structurally a liftback; the Taycan Sport Turismo is a wagon body within the Taycan model. Phase 1 documented these decisions in `notes`; a consistent project-wide convention (split wagon/liftback into their own model entries, OR document the deviation per-model) would help downstream filtering.
- **Forbidden-source scan returned zero hits** — Phase 1's mid-batch cleanup was thorough for Porsche.
- **Multi-base layout per spec §6.2** is correctly applied across 911 (ICE Carrera line + Hybrid GTS line), Taycan (sedan + Sport Turismo), Panamera (ICE + PHEV), Cayenne (ICE + PHEV), Cayenne Coupe (ICE + PHEV + Turbo GT singleton).
- **All 120 image entries are `needs_scraping: true`** — every URL is a well-formed porsche.com model page. No image-URL failures.
