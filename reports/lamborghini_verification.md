# Verification Report: Lamborghini

**Date:** 2026-05-12
**Data source:** `data/lamborghini.json` (researched 2026-05-12)
**Models checked:** 3
**Trims checked:** 3
**Trims sampled for source verification:** 3 (full coverage — entire brand lineup)
**Image URLs spot-checked:** 5 (all `needs_scraping: true` — see notes)

---

## Summary

- **Blockers:** 1
- **Warnings:** 3
- **FYIs:** 5

---

## Blockers

### 1. Residual Motor1 citation in Revuelto professional_reviews — forbidden secondary source

- **Model/trim:** Revuelto (model-level professional_reviews)
- **Issue:** Per spec §4.1 the source hierarchy lists "Edmunds, KBB, Car and Driver, MotorTrend, Cars.com" as acceptable secondary sources, and the project mid-batch source-cleanup pass added Motor1 to the forbidden-content-farm list. The Revuelto's `professional_reviews.links` still includes a Motor1 entry that should have been removed.
- **Found in:** `models[0].professional_reviews.links[1]`
- **Value seen:** `{"publication": "Motor1", "url": "https://www.motor1.com/reviews/728467/2025-lamborghini-revuelto-review/", "date": "2025-04-10"}`
- **Expected:** entry removed; replace with a permitted secondary review source (Car and Driver, MotorTrend) or drop without replacement (Edmunds + Top Gear remain — both permitted).

---

## Warnings

### 1. Temerario claims 24 MPGe but EPA page classifies it as Hybrid (no MPGe published)

- **Model/trim:** Temerario (sole trim)
- **Issue:** `ev_specifics.mpge_combined: 24` and trim `notes` state "EPA classifies the Temerario as PHEV (24 MPGe combined, 16 MPG gas-only)." A fresh fetch of fueleconomy.gov ID 49994 today returns "2026 Lamborghini Temerario — Hybrid Vehicle — Engine Descriptor: SIDI; Hybrid" with only a combined-gasoline 16 MPG and **no MPGe data** ("no electric-only range information"). The cited classification disagrees with what EPA currently shows. Either Phase 1 misread EPA, EPA reclassified, or 24 MPGe came from a non-EPA source.
- **Found in:** `models[1].trims[0].ev_specifics.mpge_combined` and `models[1].trims[0].notes`
- **Value seen:** `mpge_combined: 24`; notes claim EPA classifies as PHEV
- **Source consulted:** https://www.fueleconomy.gov/feg/noframes/49994.shtml (EPA — fetched 2026-05-12)
- **Recommendation:** Either set `mpge_combined: null` and update notes to reflect EPA's current Hybrid classification (treating EPA as authoritative per §4.2), or re-verify EPA via Power Search; if Phase 1's reading was correct and EPA has since changed, document the regression in notes. The combined 16 MPG and PHEV-type powertrain block can stand either way.

---

### 2. Urus SE — cited press-release URL does not contain the $258,000 MSRP

- **Model/trim:** Urus SE
- **Issue:** `sources.msrp_base` points to `https://www.lamborghini.com/en-en/news/lamborghini-urus-se-debuts-in-us`, but a fetch of that page returns "no US MSRP listed" — it confirms 800 CV / 789 hp but not pricing. Without a manufacturer-published MSRP at the cited URL, the $258,000 value's primary-source provenance can't be confirmed from the source map alone.
- **Found in:** `models[2].trims[0].sources.msrp_base`
- **Value seen:** URL above; on-page content does not include a price
- **Source consulted:** the URL itself (WebFetch, 2026-05-12)
- **Recommendation:** Confirm the $258,000 figure against a different primary source — Lamborghini media center release archive or a regional Lamborghini PR page that quotes the launch price — and update `sources.msrp_base` accordingly. If only secondary sources confirm it, treat per the Rolls-Royce/Ferrari pattern and set `msrp_base` to `null` with explanation.

---

### 3. Urus SE — fuel_tank_gal disagrees with EPA

- **Model/trim:** Urus SE
- **Issue:** `fuel_economy.fuel_tank_gal: 19.8` (manufacturer figure). EPA fueleconomy.gov ID 49755 lists "20.9 gallons" of premium. A 1.1-gallon discrepancy.
- **Found in:** `models[2].trims[0].fuel_economy.fuel_tank_gal`
- **Value seen:** `19.8`
- **Source consulted:** https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49755
- **Recommendation:** Reconcile with EPA; manufacturer publishes 75 L (≈19.8 gal) while EPA records 20.9. Either accept manufacturer figure and add a note, or take EPA value per spec §4.2 (EPA authoritative for fuel economy block). Low impact — informational only.

---

## FYIs

### 1. All three trims carry null `msrp_base` for two of three models

- **Model/trim:** Revuelto (null), Temerario (null), Urus SE ($258,000)
- **Note:** Expected per the batch context — Lamborghini does not publish US MSRPs on its consumer site or in accessible press releases for Revuelto and Temerario. Both trims' `notes` fields explicitly document the manufacturer's price-non-disclosure and the spec §4 forbidden-source rule applied. `msrp_range.low/high` are correctly null on both. Treat as FYI rather than BLOCKER per batch protocol; only Warning #2 above flags a separate source-citation issue on Urus SE where MSRP IS populated.

### 2. Revuelto `powertrain.type: "phev"` while EPA classifies the car as Hybrid

- **Model/trim:** Revuelto
- **Note:** EPA fueleconomy.gov page for the Revuelto (ID 49993) labels it a "Hybrid Vehicle" with no MPGe and no electric-only range. Lamborghini markets it as an HPEV plug-in. The data follows the manufacturer's PHEV classification while `fuel_economy` follows EPA's hybrid figures (10/17/12 MPG, no MPGe). Trim notes acknowledge this. Internal consistency check §5 would normally flag a phev-type trim with null `mpge_combined`, but it's the honest answer for what EPA publishes.

### 3. NHTSA / IIHS ratings null on all three models — expected

- **Model/trim:** Revuelto, Temerario, Urus SE
- **Note:** Per the batch context, NHTSA and IIHS do not crash-test ultra-luxury exotics. The `sources.safety.iihs_top_safety_pick` URLs are IIHS *search query* URLs (e.g., `iihs.org/search?query=2026+Lamborghini+Revuelto`) rather than per-vehicle rating pages, which is correct since no per-vehicle rating exists.

### 4. JD Power VDS / APEAL and Consumer Reports reliability all null with `confidence: "unknown"`

- **Model/trim:** All three models
- **Note:** Expected per batch context — JD Power doesn't meaningfully sample Lamborghini at US volumes. owner_reviews is `confidence: "low"` (not "unknown") on all three because Edmunds/KBB pages exist even without published star ratings, so the model has at least one non-unknown review block and does NOT trigger the §2 "all-four-unknown" FYI rule.

### 5. Top Gear cited as a third professional review source

- **Model/trim:** Revuelto, Temerario, Urus SE all cite Top Gear in `professional_reviews.links`
- **Note:** Top Gear is a long-running UK auto magazine and is not on the spec §4 explicit secondary-source list, nor on the forbidden content-farm list. It is widely treated as a reputable car-review outlet. Flagging only for awareness in case the project wants to tighten the permitted-publication list. No action needed.

---

## Coverage stats

- Models with >2 null spec blocks on base trim: **0**
- Models with <4 images: **0** (each sole-trim family has exactly 4 image entries)
- Models with all 4 review blocks at `confidence: "unknown"`: **0** (every model has at least `professional_reviews: "high"` or `"medium"`; `owner_reviews` is `"low"` not `"unknown"`)
- Trims missing key sources entries: **0** for populated blocks. `sources.msrp_base` is null on Revuelto and Temerario, which is consistent with their `msrp_base: null`.

---

## Sample details

### Sampled trims for source verification

1. **Revuelto** — checked against `https://www.fueleconomy.gov/feg/noframes/49993.shtml` (EPA)
   - `fuel_economy.city_mpg` 10 / `highway_mpg` 17 / `combined_mpg` 12 — **PASS** (EPA matches exactly)
   - `fuel_economy.fuel_tank_gal` 21.1 — not surfaced in this EPA fetch; consistent with Lamborghini spec
   - `powertrain.type: "phev"` vs EPA "Hybrid Vehicle" classification — note item in FYIs (data follows manufacturer, EPA differs)
   - Result: **PASS on MPG values; classification mismatch acknowledged in trim notes**

2. **Temerario** — checked against `https://www.fueleconomy.gov/feg/noframes/49994.shtml` (EPA)
   - `fuel_economy.combined_mpg: 16` — **PASS** (EPA matches)
   - `ev_specifics.mpge_combined: 24` — **MISMATCH** (EPA shows Hybrid Vehicle classification with no MPGe — see Warning #1)
   - Result: **1 mismatch** (mpge_combined)

3. **Urus SE** — checked against `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49755` (EPA) and `https://www.lamborghini.com/en-en/models/urus/urus-se` + the cited debut-press URL (Lamborghini)
   - `ev_specifics.mpge_combined: 48` — **PASS** (EPA confirms 48 MPGe)
   - `fuel_economy.combined_mpg: 20` — **PASS** (EPA: "20 MPG combined city/highway" on gasoline)
   - `ev_specifics.electric_range_mi: 35` — **PASS** (EPA: "35 miles")
   - `fuel_economy.fuel_tank_gal: 19.8` — **MISMATCH** (EPA: 20.9 — see Warning #3)
   - `powertrain.horsepower_hp: 789` — **PASS** (Lamborghini consumer page: "800 CV (789 horsepower)")
   - `performance.zero_to_60_sec: 3.4` — **PASS** (lamborghini.com cites 3.4 s to 100 km/h; Lamborghini's US press also cites 3.4 s 0-60)
   - `performance.top_speed_mph: 194` — **PASS** (312 km/h → 194 mph)
   - `msrp_base: $258,000` — **CANNOT CONFIRM AT CITED URL** (the linked press release does not include MSRP — see Warning #2)
   - Result: **MSRP source URL doesn't contain MSRP; fuel_tank discrepancy; otherwise all checked specs match**

### Image URLs checked

All 12 image entries across Revuelto, Temerario, and Urus SE carry `needs_scraping: true` and point to `lamborghini.com/en-en/models/...` consumer-page URLs rather than direct asset URLs. Per batch protocol, `needs_scraping: true` entries are expected to fail a HEAD-for-image check (they're page URLs awaiting Phase 4 resolution) and are NOT flagged as image-URL failures. Five were sampled across the three trims and all are well-formed Lamborghini consumer URLs — no rotted/wrong-vehicle URLs observed.

1. `https://www.lamborghini.com/en-en/models/revuelto` — Revuelto front_three_quarter — `needs_scraping: true` (expected)
2. `https://www.lamborghini.com/en-en/models/temerario` — Temerario rear_three_quarter — `needs_scraping: true` (expected)
3. `https://www.lamborghini.com/en-en/models/urus/urus-se` — Urus SE side_profile — `needs_scraping: true` (expected)
4. `https://www.lamborghini.com/en-en/news/the-new-human-machine-interface-of-lamborghini-revuelto` — Revuelto interior_dashboard — `needs_scraping: true` (expected; news-article page)
5. `https://www.lamborghini.com/en-en/news/lamborghini-urus-se-debuts-in-us` — Urus SE interior_dashboard — `needs_scraping: true` (expected; news-article page)

---

## Notes on this verification

- **Sample coverage:** Because the brand has only 3 trims, all three were spot-checked rather than randomly sampled.
- **EPA spot-checks were the most informative.** lamborghini.com pages are reachable to WebFetch and confirmed Urus SE horsepower (789 hp), top speed (194 mph from 312 km/h), and 0-60 (3.4 s). Two of three EPA pages resolved cleanly; the third (Revuelto via `Find.do?action=sbs`) needed the `noframes/<id>.shtml` form, which worked.
- **The Temerario MPGe mismatch (Warning #1) is the most consequential finding.** It's possible EPA reclassified the Temerario as HEV after Phase 1 fetched it as PHEV; recommend re-fetching EPA before fixing.
- **The Urus SE MSRP source warning (Warning #2) is the cleanest catch.** The cited URL is genuine and primary, but it does not include the MSRP value — so the only published-MSRP model in the Lamborghini catalog has weak source provenance even though the price is plausible and widely reported elsewhere.
- **No residual Motor1/Carbuzz/dealer-site citations found outside the Revuelto `professional_reviews.links` Motor1 entry** that triggered Blocker #1. The mid-batch cleanup appears to have been thorough across `sources` maps. The Edmunds and KBB URLs in `owner_reviews.sources` are permitted secondary aggregators per spec §4.1.
- **Sole-trim atomic rule applied cleanly on all three models.** `is_base_trim: true` and `delta_from_base: null` were correctly set on every model's single trim.
