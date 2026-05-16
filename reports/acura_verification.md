# Verification Report: Acura

**Date:** 2026-05-12
**Data source:** `data/acura.json` (researched 2026-05-12)
**Models checked:** 6
**Trims checked:** 19
**Trims sampled for source verification:** 3 (Integra, Integra Type S, RDX SH-AWD Technology)
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 2
- **Warnings:** 2
- **FYIs:** 3

---

## Blockers

### 1. Residual www.cars.com citations in professional_reviews — forbidden secondary source

- **Models:** ADX, RDX, MDX (each cites cars.com in `professional_reviews.links`)
- **Issue:** Per the mid-batch source-cleanup pass for this brand, `www.cars.com` is on the forbidden-source list (content-farm tier). Three professional-review entries remained.
- **Found in:**
  - `models[2].professional_reviews.links[2].url` → `https://www.cars.com/research/acura-adx-2026/`
  - `models[3].professional_reviews.links[2].url` → `https://www.cars.com/research/acura-rdx-2026/`
  - `models[4].professional_reviews.links[2].url` → `https://www.cars.com/research/acura-mdx-2026/`
- **Expected:** entries removed; replace with a permitted secondary source (Car and Driver, MotorTrend, Edmunds) or drop without replacement.

---

### 2. MDX SH-AWD — singleton trim_family carries 0 images (spec §7 violation)

- **Model/trim:** MDX / MDX SH-AWD
- **Issue:** `trim_family: "mdx-sh-awd"` is a singleton family (only this trim belongs to it) and the trim's `images` array is empty. Per spec §7, a singleton family must carry all 4 required image angles directly on the trim. The trim's notes acknowledge the intent ("Shares images with mdx-base family; per shared-image rule, images set to empty here") but the implementation breaks the spec rule because `trim_family` does not match the base family.
- **Found in:** `models[4].trims[1].trim_family` and `models[4].trims[1].images`
- **Value seen:** `trim_family: "mdx-sh-awd"`, `images: []`
- **Expected:** Either (a) set `trim_family: "mdx-base"` so it legitimately shares with the base MDX, or (b) carry 4 image entries on the trim with `is_shared_with_trim_family: true` and the same URLs as `mdx-base`.

---

## Warnings

### 1. Integra Type S — IIHS rating null while IIHS lists the Integra hatchback as 2025 TSP

- **Model/trim:** Integra Type S
- **Issue:** A fresh fetch of `https://www.iihs.org/ratings/top-safety-picks/2025/all/acura` lists "2025-26 Acura Integra 4-door hatchback" as a Top Safety Pick (small cars category). IIHS rates by chassis/body, and the Integra Type S is the same hatchback chassis. The base Integra model carries `iihs_top_safety_pick: "TSP"` but Integra Type S carries `null`. If IIHS's award covers the body family (as is typical), the Type S should be `"TSP"` too — unless IIHS explicitly excludes performance variants (sometimes it does due to performance-tire effects on AEB or braking, but the listing makes no such exclusion).
- **Found in:** `models[1].trims[0].safety.iihs_top_safety_pick`
- **Value seen:** `null`
- **Source consulted:** https://www.iihs.org/ratings/top-safety-picks/2025/all/acura (2026-05-12)
- **Recommendation:** Confirm IIHS's rating scope for the Integra hatchback family. If the award covers the Type S as well, set `iihs_top_safety_pick: "TSP"` and `iihs_rating_year: 2025` to match the base Integra. If IIHS explicitly excludes Type S, leave null and add a note.

---

### 2. Safety source URLs point to roll-up listings rather than per-vehicle pages

- **Model/trim:** Every model (sources.safety.nhtsa_overall_rating and sources.safety.iihs_top_safety_pick)
- **Issue:** `sources.safety.nhtsa_overall_rating` is `https://www.nhtsa.gov/ratings` (the NHTSA ratings homepage), and `sources.safety.iihs_top_safety_pick` is the IIHS Acura roll-up `https://www.iihs.org/ratings/top-safety-picks/2025/all/acura`. Per spec §4.4 examples, source URLs should be per-vehicle (e.g., `nhtsa.gov/vehicle/2026/ACURA/INTEGRA`), so a future audit can verify the cited rating against the page that names the vehicle. Roll-up URLs make per-trim re-verification harder.
- **Found in:** every trim's `sources.safety.nhtsa_overall_rating` and `sources.safety.iihs_top_safety_pick`
- **Value seen:** roll-up URLs
- **Recommendation:** Replace each with the per-vehicle NHTSA ratings page and the per-vehicle IIHS ratings page.

---

## FYIs

### 1. JD Power VDS / APEAL all null with `confidence: "unknown"` on customer_satisfaction across the brand

- **Model/trim:** Integra, ADX, RDX, MDX, Integra Type S, MDX Type S — all have `customer_satisfaction.confidence: "unknown"`. reliability is "low" across the brand (Acura is sampled by JD Power but specific scores were not located).
- **Note:** Expected per batch context for luxury makes. Brand has some JD Power presence (Acura is consistently mid-pack in JD Power VDS) but model-specific scores for 2026 MY weren't found in primary sources. No action needed.

### 2. Step-up trims correctly omit unchanged spec blocks (powertrain/fuel_economy/dimensions null)

- **Models/trims:** ADX A-Spec / A-Spec Advance; RDX Technology / A-Spec / Advance / A-Spec Advance; MDX Technology / A-Spec / Advance / A-Spec Advance
- **Note:** These step-up trims have `powertrain: null`, `fuel_economy: null`, and/or `dimensions: null` per spec §6.3 (block is null when unchanged from base). The sources map correspondingly omits entries for these null blocks. This is correct, not missing data — included here as FYI in case a downstream scan misreads it.

### 3. All image URLs across the brand are `needs_scraping: true` (Acura/Acuranews pages)

- **Model/trim:** All 6 models / 72 image entries (12 + 4 + 12 + 20 + 20 + 4)
- **Note:** Phase 1 found acura.com and acuranews.com both gated at WebFetch (403). All image URLs are model-overview pages or press-release pages, not direct asset URLs. Per batch protocol these are not image-URL failures — Phase 4 is expected to resolve them. The MDX SH-AWD has zero entries (see Blocker #2), separately.

---

## Coverage stats

- Models with >2 null spec blocks on base trim: **0**
- Models with <4 images on a trim family: **1** (MDX `mdx-sh-awd` singleton family — see Blocker #2)
- Models with all 4 review blocks at unknown confidence: **0**
- Trims missing key sources entries for *populated* blocks: **0** (all "missing" entries correspond to null spec blocks on step-up trims, which is permitted by §6.3)

---

## Sample details

### Sampled trims for source verification

1. **Integra** (base) — checked against `https://www.fueleconomy.gov/feg/noframes/49305.shtml` (EPA)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 29/37/32 — **PASS** (EPA matches exactly)
   - `fuel_economy.fuel_type_required: "premium"` — **PASS** (EPA confirms premium)
   - `powertrain.engine_displacement_l: 1.5` / `engine_config: "I4"` / `aspiration: "turbocharged"` — **PASS** (EPA confirms "4-cylinder, 1.5-liter turbocharged")
   - `sources.msrp_base`: `https://www.acura.com/integra` — acura.com 403'd to WebFetch (consistent with Phase 1's documented finding); source not directly verifiable but URL is well-formed manufacturer URL
   - Result: **PASS on every checked field; MSRP source URL not directly verifiable due to acura.com 403**

2. **Integra Type S** — checked against `https://www.fueleconomy.gov/feg/noframes/49308.shtml` (EPA) and `https://www.acura.com/integra-type-s` (HTTP 403)
   - `fuel_economy.city_mpg/highway_mpg/combined_mpg`: 21/28/24 — **PASS** (EPA matches exactly)
   - `fuel_economy.fuel_type_required: "premium"` — **PASS**
   - `powertrain.engine_displacement_l: 2.0` / `aspiration: "turbocharged"` / `transmission: "6-speed manual"` — **PASS** (EPA: "4-cylinder, 2.0-liter turbocharged engine with a manual 6-speed transmission")
   - `msrp_base: $53,400` / `destination_fee: $1,195` / `horsepower_hp: 320` — **NOT VERIFIED** (acura.com page returned 403)
   - Result: **PASS on EPA-verifiable fields; acura.com unreachable for MSRP/HP cross-check**

3. **RDX SH-AWD w/Technology Package** — checked against `https://acuranews.com/en-US/releases/release-cf005034e20eb27505fd8e6bbb01a9f9-...` (HTTP 403)
   - `msrp_base: $47,700` / `destination_fee: $1,350` — **NOT VERIFIED** (acuranews.com 403)
   - Step-up trim with `powertrain: null` / `fuel_economy: null` / `dimensions: null` per spec §6.3
   - Result: **Source URL not retrievable; rest of trim data is delta-form and inherits from base**

### Image URLs checked

All 5 sampled image entries had `needs_scraping: true` and pointed to acura.com or acuranews.com pages (not direct asset URLs):

1. `https://www.acura.com/suvs/rdx` — RDX SH-AWD interior_dashboard — `needs_scraping: true` (expected)
2. `https://acuranews.com/en-US/releases/release-cf005034e20eb27505fd8e6bbb01a9f9-...` — RDX SH-AWD front_three_quarter — `needs_scraping: true` (expected)
3. `https://acuranews.com/en-US/releases/release-0b15294a3c3300ad0fee5bfc7201a1cf-2026-acura-adx-...` — ADX rear_three_quarter — `needs_scraping: true` (expected)
4. `https://acuranews.com/en-US/releases/release-034a78c2e218fc9e60916560d005e183` — Integra Type S rear_three_quarter — `needs_scraping: true` (expected)
5. `https://acuranews.com/en-US/releases/release-cf005034e20eb27505fd8e6bbb018d96-2026-acura-mdx-pricing` — MDX Type S Advance rear_three_quarter — `needs_scraping: true` (expected)

No image URL failures flagged per batch protocol — all sampled were `needs_scraping: true` page URLs.

---

## Notes on this verification

- **EPA spot-checks were clean.** Both verifiable EPA URLs (49305 Integra, 49308 Integra Type S) resolved and matched the data exactly on city/highway/combined MPG, fuel type, and powertrain summary.
- **acura.com and acuranews.com returned 403 to WebFetch** for every URL attempted, consistent with the brand's documented gating in STATUS.md. Source URLs are well-formed manufacturer URLs and not invented — they just can't be re-validated automatically. Manual browser verification is the only path.
- **IIHS top-safety-picks/2025/all/acura confirmed** Integra hatchback, ADX, and MDX as 2025 Top Safety Pick (not TSP+); RDX is NOT on the list for 2025 (consistent with data's `iihs: null` on RDX); Integra Type S is the open question (Warning #1).
- **Three residual www.cars.com citations** are the cleanest blocker. The mid-batch source-cleanup pass missed them — they sit only in `professional_reviews.links`, not in the per-trim `sources` map.
- **MDX SH-AWD's image-sharing scheme** (Blocker #2) is a real spec-rule violation. Per §7 the fix is mechanical: either fold the trim into the `mdx-base` family or duplicate the image array with shared-flag set.
- **No residual Motor1, Carbuzz, dealer-site, or autoblog/autoevolution citations were found** in any `sources` map or `professional_reviews.links` field — the only forbidden-source residual is the three www.cars.com entries flagged in Blocker #1.
- **Cross-trim sanity check passed** — no MSRP 50%+ outliers, no horsepower or dimension outliers across any model.
- **MSRP range integrity, base-trim count, body-style taxonomy, delta-from-base references** all pass programmatic check.
