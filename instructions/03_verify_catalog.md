# 03 — Verify a Brand's Data (Claude Code instructions)

You are working on the Car Catalog Project. This phase performs a quality-assurance pass on a previously-researched brand. It does NOT re-research from scratch. It spot-checks samples, cross-references sources, validates schema conformance, and produces a written report flagging issues for the user to review.

**Input parameter:** a brand name provided at the bottom of this message.

**Output:** `reports/<brand_slug>_verification.md` — a markdown report listing findings, organized by severity.

This file is self-contained. The full canonical spec is `instructions/00_master_spec.md`.

---

## Operating principles (read first)

1. **You are auditing, not researching.** Don't refill missing data. Don't expand the dataset. Read what's there, check it, report on it.

2. **Sampling is OK.** You don't need to re-verify every spec on every trim. Random sampling plus targeted checks of high-risk fields is enough.

3. **Surface issues, don't fix them.** The user decides what to do about findings. Your job is to report honestly and specifically — quote the JSON values, give the source URLs, point to where in the data the issue is.

4. **Web-check sparingly.** Use web searches to verify specific suspicious values — not to revalidate everything. Each web check costs context and time.

5. **Report structure matters.** A long unsorted dump is useless. Group findings by severity: blockers, warnings, FYIs. Each finding cites the affected model/trim by name so the user can find it.

---

## Workflow

### Step 0: Setup

- Read `data/<brand_slug>.json`. If missing, abort with a clear message: "No data for `<brand>`. Run Phase 1 first."
- Read `catalog/data/<brand_slug>.json` if it exists. Note any difference from `data/<brand_slug>.json` — they should be identical after Phase 2 ran.
- Create `reports/` directory if missing.

### Step 1: Schema validation pass

Walk the entire brand JSON and check structural conformance to the schema. For each model and trim, verify:

- All required top-level keys present (`brand`, `brand_slug`, `researched_at`, `schema_version`, `models`)
- Each model has all required keys (`model`, `model_slug`, `model_year`, `body_style`, `generation_context`, `msrp_range`, `model_summary`, `reliability`, `customer_satisfaction`, `professional_reviews`, `owner_reviews`, `trims`, `researched_at`, `notes`)
- Each trim has all required keys (per §3.2 of master spec)
- All four model-level review blocks (`reliability`, `customer_satisfaction`, `professional_reviews`, `owner_reviews`) are present even if sparse
- Body style is one of the fixed taxonomy values (§5 of master spec)
- Slugs are lowercase, hyphenated, no spaces or special chars
- `is_base_trim: true` is set on exactly one trim per model (or per powertrain-line if the model has multiple base trims as per §6.2)
- `delta_from_base` is `null` on base trims and populated on step-up trims
- For step-up trims, spec blocks are either populated or `null` (not missing entirely)
- Check every URL in every trim's `sources` map and every model's `professional_reviews.links[].url` against the forbidden-source list:
  - www.cars.com
  - motor1.com
  - carbuzz.com
  - autoblog.com
  - autoevolution.com
  - teslaoracle.com
  - carsfrenzy.net
  - any URL matching the pattern `<dealername><brand>.com` (e.g., rollsroycepasadena.com, elcerritohonda.com)
  - any URL containing 'reddit.com' or known enthusiast-forum domains

  Each forbidden URL found is a **BLOCKER** with the exact JSON path and the offending URL quoted in the report.

Record every schema violation as a **BLOCKER** finding.

### Step 2: Coverage and completeness check

For each model:

- Count nulls per spec block. Flag any base trim with more than 2 null spec blocks as a **WARNING**.
- Flag models with fewer than 4 images in their primary trim family as a **WARNING**.
- Flag trims missing `sources` map entries for major blocks (msrp_base, powertrain, fuel_economy, dimensions) as a **WARNING**.
- Flag models where all four review/reliability blocks have `confidence: "unknown"` as an **FYI** (research found nothing — confirm this is the actual state of available data, not a research gap).
- Flag any trim where `msrp_base` is null as a **BLOCKER**, UNLESS the trim's `notes` field documents manufacturer non-disclosure (e.g., 'Manufacturer does not publish US MSRP'). When notes document the non-disclosure, treat as **FYI** instead. This handles the ultra-luxury pattern (Rolls-Royce, Aston Martin, Ferrari, Lamborghini partial) honestly — null with documentation is the correct answer for those brands, not a defect.

### Step 3: Source verification — sample 3 random trims

Pick 3 random trims from the brand's full trim list. For each:

- Open one of its `sources` URLs that should be the manufacturer site
- Confirm the manufacturer site still shows the model/trim
- Spot-check 2–3 high-risk values against what the manufacturer page says:
  - `msrp_base` and `destination_fee`
  - `powertrain.horsepower_hp`
  - `fuel_economy.combined_mpg` (cross-check against fueleconomy.gov)
  - `dimensions.length_in` (or any one dimension)
- Record any mismatches as **WARNING** findings with both values quoted.

If a manufacturer URL no longer resolves or returns a different model than expected, that's a **WARNING** (the URL has rotted; data may still be correct but source link is broken).

### Step 4: Image URL spot-check

Sample 5 image URLs from across the brand. For each, do a HEAD request (or simple fetch) to confirm the URL resolves to an image. Failures → **WARNING** findings noting the affected trim and angle.

Do not download the images; just verify they exist and return an image content type.

### Step 5: Internal consistency checks

For each model:

- `msrp_range.low` should equal the minimum `msrp_base` across all trims. Mismatch → **BLOCKER**.
- `msrp_range.high` should equal the maximum `msrp_base`. Mismatch → **BLOCKER**.
- If `body_style` is `sedan` or `coupe`: trim `dimensions.cargo_volume_cuft.trunk_cuft` should be populated for base trim; `behind_2nd_row` and `behind_1st_row` should be null. Inconsistency → **WARNING**.
- If `body_style` starts with `suv-` or is `hatchback` or `wagon`: `behind_2nd_row` and `behind_1st_row` should be populated; `trunk_cuft` should be null. Inconsistency → **WARNING**.
- If `powertrain.type` is `ice`: `ev_specifics` should be null. If `type` is anything else: `ev_specifics` should be populated. Mismatch → **WARNING**.
- If `powertrain.type` is `ev`: `fuel_economy.city_mpg`/`highway_mpg`/`combined_mpg` should be null; `ev_specifics.mpge_combined` should be populated. Mismatch → **WARNING**.
- Each step-up trim's `delta_from_base.from_trim_slug` should reference a trim that exists in the same model. Broken reference → **BLOCKER**.
- **Singleton trim_family check.** For each model, group trims by `trim_family`. For every family that contains exactly one trim:
  - The trim must have `is_base_trim: true`. If false, **BLOCKER**.
  - The trim must have `delta_from_base: null`. If non-null, **BLOCKER**.
  - The trim's `images` array must contain at least the 4 required angles (front_three_quarter, rear_three_quarter, side_profile, interior_dashboard). If fewer, **BLOCKER** with the missing angles listed.

  This catches the recurring architectural error documented in PROJECT_STATE.md lesson #36.
- **NHTSA/IIHS source URL convention.** If a trim's `sources` map contains `safety.nhtsa_overall_rating` or `safety.iihs_top_safety_pick` URLs that point to roll-up search pages (e.g., nhtsa.gov/ratings or iihs.org/ratings) rather than per-vehicle pages (e.g., nhtsa.gov/vehicle/<year>/<make>/<model>), AND the brand is one of: rolls-royce, aston-martin, ferrari, lamborghini, bentley, mclaren, lotus, bugatti — treat as **FYI** with note 'roll-up URL is the only available source for this brand; no per-vehicle NHTSA/IIHS page exists.' For mainstream brands with the same pattern, treat as **WARNING**.

### Step 6: Cross-trim sanity check (within model)

Within each model, look for outliers that might indicate data-entry errors:

- A trim where `msrp_base` is more than 50% lower than the next-cheapest trim → **FYI** (possible typo? confirm).
- A trim where `powertrain.horsepower_hp` is more than 100 hp lower than the lowest-hp trim of the model with the same powertrain type → **FYI** (likely wrong unit or typo).
- A trim where `dimensions` differ from the base trim by more than 10% on any single measurement → **WARNING** (most trims share platform; large differences usually indicate a wheelbase change or genuinely different body, not a data error — but worth flagging for review).

### Step 7: Generate the report

Write `reports/<brand_slug>_verification.md` with this structure:

```markdown
# Verification Report: <Brand>

**Date:** YYYY-MM-DD
**Data source:** `data/<brand_slug>.json` (researched <date>)
**Models checked:** <count>
**Trims checked:** <count>
**Trims sampled for source verification:** 3
**Image URLs spot-checked:** 5

---

## Summary

- **Blockers:** <count>  (must be fixed before catalog is trustworthy)
- **Warnings:** <count>  (likely issues, review recommended)
- **FYIs:** <count>      (worth knowing, not necessarily wrong)

## Blockers

### 1. <short title>
- **Model/trim:** <e.g., Honda Civic LX>
- **Issue:** <specific description>
- **Found in:** `<json path>` (e.g., `models[3].trims[0].msrp_base`)
- **Value seen:** <quote>
- **Expected:** <what would be correct>

(Repeat for each blocker.)

## Warnings

### 1. <short title>
- **Model/trim:**
- **Issue:**
- **Found in:**
- **Value seen:**
- **Source consulted:** <url, if applicable>
- **Recommendation:**

(Repeat for each warning.)

## FYIs

### 1. <short title>
- **Model/trim:**
- **Note:**

(Repeat for each FYI.)

## Coverage stats

- Models with >2 null spec blocks on base trim: <count>
- Models with <4 images: <count>
- Models with all 4 review blocks at unknown confidence: <count>
- Trims missing key sources entries: <count>

## Sample details

### Sampled trims for source verification
1. <model> <trim> — checked against <url> — result: <pass|N issues>
2. ...

### Image URLs checked
1. <url> — <model> <trim> <angle> — <status>
2. ...

## Notes on this verification

<Any context about what was easy or hard to verify, source rot encountered, etc.>
```

### Step 8: Update STATUS.md

Mark the brand `Verified` column with today's date if zero blockers found. Otherwise leave it `-` and note in the `Notes` column: `verification: N blockers, M warnings`.

### Step 9: Print a chat summary

After writing the report:

- Path to the report file
- Blocker/warning/FYI counts
- Top 3 most concerning findings, briefly
- Recommendation: "Proceed to publish" or "Address blockers before relying on this catalog"

---

## What this phase does NOT do

- Re-research models. If data is missing, that's a finding, not a task to fix.
- Modify the brand JSON. The report is the only output.
- Verify every spec on every trim. Sampling is sufficient and intentional.
- Bypass paywalls (Consumer Reports, JD Power detail pages). Use what's publicly accessible.
- Validate cross-brand data. This is single-brand QA.

---

## Sessions 2-10 additions (cumulative)

These rules are implicit in the script-level verifier (`scripts/verify_brand.mjs`) but are documented here for completeness.

### Optional config fields the verifier accepts

- **`angle_url_patterns`** — optional field on `scripts/brand-configs/<brand>.json`. If present, must be a map of angle (`front_three_quarter`, `rear_three_quarter`, `side_profile`, `interior_dashboard`) to a valid regex pattern. The image scraper uses these as brand-specific URL hints. Verifier checks: if present, each entry must be a valid regex (catchable via `new RegExp()`).
- **`sources_confidence`** — optional trim-level map alongside `sources`. Maps source-field-name to a confidence value (`"high"|"medium"|"low"`). Used for the §4.6 MSRP scoped relaxation in `01_research_brand.md` (medium confidence for editorial-sourced ultra-luxury MSRPs). Verifier accepts the field as a no-op for now; future verifier iterations may flag mismatch between `sources_confidence` value and source URL pattern.
- **`tier2_endpoints`** — optional field on `scripts/brand-configs/<brand>.json` (added Session 14). Map of `model_slug` → array of Tier 2 source URLs the scraper may fall back to when Tier 1 produces < 2 of 4 baseline angles for a trim family. Each URL MUST contain the model_year in a recognizable position (e.g., `/2026/` or `-2026-`); the scraper verifies this before fetching. The verifier doesn't act on this field directly, but the resulting `source_tier: 2` image entries trigger the new tier-2/3 provenance check below.
- **`tier3_endpoints`** — optional field on `scripts/brand-configs/<brand>.json` (added Session 14). Map of `model_slug` → either a URL string or `{endpoint, type}` object. Used for manufacturer configurator-API surfaces (Tesla's `digitalassets.tesla.com` JSON endpoint, etc.). The verifier doesn't act on this field directly.

### Session 14 image-entry provenance fields

Image entries may now carry two additional optional fields, written by the scrape and download scripts:

- **`source_tier`**: integer 1, 2, or 3 — which tier the image came from. Tier 1 = manufacturer/affiliated, Tier 2 = press-kit aggregation / reputable editorial hero photos, Tier 3 = manufacturer configurator endpoints. See `04_scrape_images.md` §A for the policy.
- **`source_domain`**: hostname the image was fetched from (e.g., `"netcarshow.com"`, `"digitalassets.tesla.com"`).
- **`content_type`**: actual HTTP response Content-Type recorded at download time.

**Verifier behavior changes (effective Session 14):**

1. The forbidden-source check in Step 1 of this file (cars.com, motor1.com, carbuzz.com, autoblog.com, autoevolution.com, etc.) applies to **`sources` maps and `professional_reviews.links[].url`** — i.e., spec-data sources. It does NOT apply to `image.source_domain` or `image.url` — those are governed by the §A tiered allowlist in `04_scrape_images.md`.

2. Tier 2 source domains (netcarshow.com, caranddriver.com on editorial paths, motortrend.com, roadandtrack.com, hagerty.com, edmunds.com on `/<make>/<model>/<year>/` paths, carscoops.com on press paths) and Tier 3 source domains (digitalassets.tesla.com, manufacturer configurator endpoints) are NOT forbidden when they appear on `image.source_domain`. They ARE still forbidden when they appear in `sources` maps or `professional_reviews.links[].url` (spec-data sources).

3. **New provenance check (BLOCKER).** For every image entry where `source_tier > 1`, the containing trim's `notes` field MUST contain the substring `"Hero photography fallback from"`. The scrape script appends this note once per trim per fallback. If a Tier 2/3 image exists with no note in the trim, that's a provenance defect — flag as BLOCKER with the trim and source_domain quoted.

4. **`isDealerDomain` heuristic remains unchanged.** It still flags dealer hostnames (e.g., `rollsroycepasadena.com`, `bmwofbeverlyhills.com`) on `sources` maps and review links. Image `source_domain` is exempt because Tier 1/2/3 patterns don't include dealer surfaces — `image.source_domain` matching a dealer pattern would already be caught by the §A denylist at scrape time.

### FYI-vs-blocker rules (clarified)

These rules have accreted across Sessions 2–9. Codifying here:

- **Ultra-luxury null MSRP** with documented non-disclosure in `trim.notes` → **FYI**, not blocker. (Per `01_research_brand.md` §4.6 and `00_master_spec.md` §13.) The verifier checks `trim.notes` for non-disclosure language before flagging; if found, downgrades from BLOCKER to FYI.
- **NHTSA/IIHS roll-up URLs** for ultra-luxury brands (rolls-royce, aston-martin, ferrari, lamborghini, bentley, mclaren, lotus, bugatti) → **FYI**, not warning. Per `00_master_spec.md` §4.5.
- **Forbidden-source URLs** in `sources` or `professional_reviews.links` → **BLOCKER**. The denylist (Step 1 above): cars.com, motor1.com, carbuzz.com, autoblog.com, autoevolution.com, teslaoracle.com, carsfrenzy.net, dealer domains, Reddit, forums, Wikipedia.
- **Singleton trim_family** with fewer than 4 images → **BLOCKER**. Per `00_master_spec.md` §7 and `01_research_brand.md` §6.2. Singleton means a trim_family containing exactly one trim; that trim must carry the 4 required image angles in its own `images` array.

### isDealerDomain false-positive bug (Session 10 surfaced, Session 11 fixed)

Session 10 verification surfaced ~30 false-positive blockers across multiple brands (Dodge, Subaru, VinFast). The verifier's `isDealerDomain` regex pattern `of[-_\.]` matched URL paths containing "of-" — e.g., `subaru.com/owners/benefits-of-ownership` — flagging legitimate manufacturer URLs as dealer domains.

Session 11 narrowed the regex to match only in the URL hostname (not in the path), and biased the heuristic toward false-negatives (missing a real dealer) over false-positives (flagging a real manufacturer URL). The known-dealer cases (rollsroycepasadena.com, elcerritohonda.com pattern, *of-* in hostnames like `bmwofbeverlyhills.com`) still match correctly.

### Verification batching (recommended pattern)

Sessions 4 and 10 verified large batches in parallel successfully. Recommended approach:

- For full-fleet verification: 5–7 brands per subagent, 4–6 subagents in parallel. ~38 brands across ~6 subagents was Session 10's successful shape.
- For incremental verification (a few brands after a fix-pass): single-threaded or 2–3 parallel agents.
- Each subagent reads its brand JSON, runs verification per Steps 1–6 above, writes its own report. No shared file mutations.

---

## Honesty rules

- If a sampled URL no longer resolves, say so. Don't substitute another search and pretend it was the original source.
- If the manufacturer page now shows different values than the JSON, report BOTH values — yours and theirs. Don't assume yours is wrong without context (manufacturers update mid-cycle).
- If you can't verify something (no source given, source paywalled, etc.), record that as the finding — don't skip silently.

---

## Save points

- After Step 7: report written. This is the output.
- After Step 8: STATUS.md updated.

The report file is the artifact. If anything in Steps 1-6 produces partial results due to crash or interruption, the report should still be written with whatever findings were collected up to that point, plus a "incomplete verification" note.

---

## Input

Brand: <REPLACE WITH BRAND NAME WHEN PASTING INTO CLAUDE CODE>
