# Verification Report: Maserati

**Date:** 2026-05-13
**Data source:** `data/maserati.json` (researched 2026-05-13)
**Models checked:** 6
**Trims checked:** 12
**Trims sampled for source verification:** 3
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** 1  (must be fixed before catalog is trustworthy)
- **Warnings:** 2  (likely issues, review recommended)
- **FYIs:** 4      (worth knowing, not necessarily wrong)

## Blockers

### 1. Forbidden dealer-site URL in GranCabrio Trofeo `sources.performance.zero_to_60_sec`
- **Model/trim:** Maserati GranCabrio Trofeo
- **Issue:** Source URL points to `maseratiofedmonton.com`, which matches the forbidden `<dealername><brand>.com` dealer-site pattern explicitly called out in Step 1 of the verification spec and in the brand-specific reinforcement. Maserati agent self-reported cleaning forbidden sources mid-research per session 3 notes; this URL was missed in the cleanup.
- **Found in:** `models[2].trims[1].sources["performance.zero_to_60_sec"]`
- **Value seen:** `"https://www.maseratiofedmonton.com/blog/2026-maserati-grancabrio-trofeo-features/"`
- **Expected:** A non-dealer source such as the manufacturer's media.stellantis.com press kit, the Maserati.com US product page, Kelley Blue Book, Edmunds, or another approved aggregator. Note that 3.4 sec for the 542-hp GranCabrio Trofeo is the widely-published manufacturer figure, so the value itself is almost certainly correct — only the source citation needs replacement.

## Warnings

### 1. NHTSA roll-up URL used as source for safety.nhtsa_overall_rating across all 12 trims
- **Model/trim:** All Maserati models/trims
- **Issue:** Every trim cites `https://www.nhtsa.gov/ratings` (the search roll-up page) for `safety.nhtsa_overall_rating` rather than a per-vehicle page. Per Step 5 of the spec, this is FYI for the listed luxury-low-volume brands (rolls-royce, aston-martin, ferrari, lamborghini, bentley, mclaren, lotus, bugatti). Maserati is luxury low-volume but is **not** on that explicit list, so the default treatment is WARNING. However, every trim's `notes` documents that NHTSA has not crash-tested the vehicle (typical for Maserati low US volume), which justifies the roll-up URL — flagging as WARNING per spec letter and noting the brand-level mitigation.
- **Found in:** `models[*].trims[*].sources["safety.nhtsa_overall_rating"]`
- **Value seen:** `"https://www.nhtsa.gov/ratings"` (12 instances)
- **Source consulted:** N/A (rule-based check)
- **Recommendation:** Either (a) accept the FYI treatment by adding maserati to the spec's brand list given the documented non-testing pattern, or (b) leave as is — the trim notes already document the absence of NHTSA testing, which is the substantive issue users care about.

### 2. IIHS roll-up URL used as source for safety.iihs_top_safety_pick across all 12 trims
- **Model/trim:** All Maserati models/trims
- **Issue:** Same as #1, every trim cites `https://www.iihs.org/ratings` rather than a per-vehicle page. IIHS likewise does not test Maserati per documented trim notes.
- **Found in:** `models[*].trims[*].sources["safety.iihs_top_safety_pick"]`
- **Value seen:** `"https://www.iihs.org/ratings"` (12 instances)
- **Source consulted:** N/A
- **Recommendation:** Same as #1 — consider adding Maserati to the luxury-low-volume FYI brand list since the absence of testing is real and documented per trim.

## FYIs

### 1. JD Power / Consumer Reports reliability and APEAL unknown for every model
- **Model/trim:** All 6 Maserati models
- **Note:** `reliability.confidence` and `customer_satisfaction.confidence` are `unknown` on every model, with summary text explaining JD Power VDS and APEAL do not meaningfully sample Maserati due to low US sales volume, and Consumer Reports does not publish numeric predicted-reliability scores. This is documented and reflects actual data availability — not a research gap. `professional_reviews` and `owner_reviews` are populated on every model (medium / low confidence respectively).

### 2. Owner reviews sparse on 5 of 6 models
- **Model/trim:** GranTurismo, GranCabrio, MCPura, MCPura Cielo, GT2 Stradale
- **Note:** `owner_reviews.edmunds_star_rating` and `kbb_star_rating` are null on these models — Edmunds and KBB do not publish owner-review aggregates due to small US owner populations. Documented in each model's `owner_reviews.summary`. Only Grecale has a quantitative owner-review entry (4.0 stars, sample size 2 on Edmunds).

### 3. Maserati.com US consumer pages return HTTP 403 to WebFetch
- **Model/trim:** All
- **Note:** Every image URL points to a `maserati.com/us/en/models/...` product page, and all 5 image-URL spot checks returned 403 Forbidden. This is consistent with documented behavior in multiple trim notes (e.g., Grecale Folgore notes: "Maserati USA consumer page is gated to WebFetch (403)"). The URLs reference real product pages but cannot be HEAD-checked from this tool. Treating as FYI since (a) the gate is documented, (b) `needs_scraping: true` is set on every image, and (c) Phase 4 image scraping will validate URLs at fetch time.

### 4. MCPura/MCPura Cielo MSRPs sourced from Edmunds first-drive coverage (not manufacturer)
- **Model/trim:** MCPura ($246,000), MCPura Cielo ($281,000), GT2 Stradale ($311,995)
- **Note:** These three ultra-low-volume supercar MSRPs are sourced from third-party aggregators (Edmunds, KBB) and noted explicitly because Maserati does not publish US MSRP on accessible consumer or press sites (consumer pages 403; press kit DOCX unparseable). Notes thoroughly document the methodology and cite spec §13 ultra-luxury MSRP non-disclosure exception. This satisfies the reinforced rule (null MSRP with documentation = FYI; here MSRP is populated and documented = even stronger). No blocker — recording as FYI for visibility.

## Coverage stats

- Models with >2 null spec blocks on base trim: 0
- Models with <4 images: 0  (every trim has the 4 required angles: front_three_quarter, rear_three_quarter, side_profile, interior_dashboard)
- Models with all 4 review blocks at unknown confidence: 0 (each model has 2/4 unknown — reliability + customer_satisfaction — but professional_reviews are at medium and owner_reviews at low)
- Trims missing key sources entries (msrp_base, powertrain, fuel_economy, dimensions): 0

## Sample details

### Sampled trims for source verification

1. **Grecale Modena V6** — checked `fueleconomy.gov/feg/Find.do?action=sbs&id=49862` — PASS
   - Combined MPG 20 vs JSON 20: match
   - City MPG 18 vs JSON 18: match
   - Highway MPG 25 vs JSON 25: match
   - 3.0L 6-cyl Turbocharged AWD 8-speed Auto vs JSON 3.0L V6 twin-turbo AWD 8-speed: match
   - EPA classification: Small SUV 4WD — consistent with `body_style: suv-compact`

2. **GranTurismo Trofeo** — checked `fueleconomy.gov/feg/Find.do?action=sbs&id=49797` — PASS
   - Combined MPG 21 vs JSON 21: match
   - City MPG 18 vs JSON 18: match
   - Highway MPG 27 vs JSON 27: match
   - 3.0L 6-cyl Turbocharged AWD 8-speed Auto vs JSON 3.0L V6 twin-turbo AWD 8-speed: match
   - EPA classification: Subcompact Cars — consistent with `body_style: coupe`

3. **MCPura Cielo (EPA Spyder)** — checked `fueleconomy.gov/feg/Find.do?action=sbs&id=50274` — PASS
   - Combined MPG 18 vs JSON 18: match
   - City MPG 15 vs JSON 15: match
   - Highway MPG 25 vs JSON 25: match
   - 3.0L 6-cyl Turbo RWD S8 vs JSON 3.0L V6 twin-turbo RWD 8-speed DCT: match
   - EPA classification: Two Seaters — consistent with `body_style: convertible`, seats 2

All three sampled trims passed every spot-checked value.

### Image URLs checked
1. `https://www.maserati.com/us/en/models/grecale/grecale-folgore` — Grecale Folgore front_three_quarter — HTTP 403 (manufacturer site gated; documented in notes)
2. `https://www.maserati.com/us/en/models/granturismo/granturismo-modena` — GranTurismo Modena front_three_quarter — HTTP 403 (same)
3. `https://www.maserati.com/us/en/models/grancabrio/grancabrio-trofeo` — GranCabrio Trofeo front_three_quarter — HTTP 403 (same)
4. `https://www.maserati.com/us/en/models/mcpura` — MCPura front_three_quarter — HTTP 403 (same)
5. `https://www.maserati.com/us/en/models/gt2-stradale` — GT2 Stradale front_three_quarter — HTTP 403 (same)

All 5 image URLs are well-formed product-page URLs on the manufacturer domain. The 403 response is brand-wide gating against automated tooling, not a URL-rot problem. `needs_scraping: true` is set on every image, signaling Phase 4 will perform the actual image extraction.

## Forbidden-source audit

A full enumeration of every HTTPS URL in `data/maserati.json` was performed. The brand-specific reinforcement called out that the Maserati agent self-reported cleaning forbidden sources mid-research per session 3 notes. The cleanup was **almost** complete but missed one URL:

- **`maseratiofedmonton.com`** (Maserati of Edmonton dealer-blog) on GranCabrio Trofeo `performance.zero_to_60_sec` → BLOCKER above

No other URLs match the forbidden list. Specifically, no URLs contain `cars.com`, `motor1.com`, `carbuzz.com`, `autoblog.com`, `autoevolution.com`, `teslaoracle.com`, `carsfrenzy.net`, `reddit.com`, or known enthusiast-forum domains. Note that several trim `notes` fields reference "Motor1 reporting" or "Cars.com listings" in descriptive prose explaining what was rejected or how methodology was applied — these are textual mentions, not URLs, and are acceptable.

## Internal consistency

- All 6 models: `msrp_range.low` equals min trim MSRP and `msrp_range.high` equals max trim MSRP (verified programmatically).
- All sedan/coupe/convertible/sports-car body styles have populated `trunk_cuft` and null `behind_2nd_row` / `behind_1st_row` — verified.
- Grecale (suv-compact) has populated `behind_2nd_row` and `behind_1st_row` with null `trunk_cuft` — verified.
- All ICE trims have `ev_specifics: null`; all EV trims (Grecale Folgore, GranTurismo Folgore, GranCabrio Folgore) have populated `ev_specifics` with `mpge_combined` matching `fuel_economy.combined_mpg`.
- **Singleton trim_family check (per brand-specific reinforcement):** Every one of the 12 trims is a singleton trim_family (Modena V6 / Trofeo / Folgore / MCPura / MCPura Cielo / GT2 Stradale each in its own family), and every singleton has `is_base_trim: true` and `delta_from_base: null` with all 4 required image angles in its own images array. Architecturally correct per BMW X3 30 xDrive / M50 precedent.

## Cross-trim sanity (Grecale, GranTurismo, GranCabrio — each has 3 trims)

- Grecale: MSRP 84,500 → 117,500 → 119,295. HP 385 / 523 / 550. No outliers > 50% on price or > 100 hp anomalies after grouping by powertrain type. Trofeo curb weight 4,600 lb vs Modena V6 4,178 lb (10.1% delta — at the threshold, attributable to larger wheels and chassis tuning, documented). No flag.
- GranTurismo: MSRP 158,200 → 189,350 → 197,195. HP 483 / 542 / 751. The Folgore is EV (different powertrain type, so 100-hp rule doesn't apply across types). No outliers.
- GranCabrio: MSRP 167,100 → 198,250 → 209,195. HP 483 / 542 / 751. Folgore curb weight 5,350 lb vs Modena 4,350 lb (23% delta — but Folgore is EV with 92.5 kWh battery; different powertrain type, expected). No flag.
- MCPura/MCPura Cielo/GT2 Stradale: single-trim models, no cross-trim comparison.

## Notes on this verification

- Source verification went smoothly: the three EPA fueleconomy.gov entries each returned a clean per-vehicle confirmation, and every spot-checked value matched the JSON.
- Image URL verification was uniformly 403 because Maserati.com gates automated agents at the CDN level. This is the documented, expected state — every image carries `needs_scraping: true` and the URLs are well-formed pointers for Phase 4 to follow. The 403s are not source rot.
- The forbidden-source cleanup that the Maserati agent self-reported was largely successful: one dealer-blog URL (`maseratiofedmonton.com`) on the GranCabrio Trofeo `performance.zero_to_60_sec` slot remains and is the sole blocker.
- The MCPura correctly replaces MC20 for 2026, GT2 Stradale is correctly limited-production (914 units, sole-trim), and MCXtrema is correctly excluded as a 62-unit track-only model. Ghibli, Levante, and Quattroporte are correctly excluded as discontinued. All inclusion decisions match the reinforcement.
- Singleton trim_family architecture is applied uniformly and correctly per the multi-powertrain rule (V6 base-output line, V6 high-output line, EV line) — no recurring lesson-#36 error.
- The two NHTSA/IIHS roll-up URL warnings are technically per-spec since Maserati is not on the explicit luxury-low-volume FYI brand list, but the underlying data (Maserati not tested) is documented in every trim's notes and is true. Decision on whether to demote these to FYIs is a project-level call, not a per-brand defect.
