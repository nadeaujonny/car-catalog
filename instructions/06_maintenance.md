# 06 — Maintenance (periodic upkeep beyond Phases 1–4)

This file covers periodic maintenance work that doesn't fit cleanly into the research → build → verify → image pipeline. It is consulted when:

- A model year rolls over (MY26 → MY27).
- Automotive press announces a mid-cycle refresh that affects a brand already in the catalog.
- A manufacturer site restructures and breaks model_pages in a brand-config.
- A verification pass surfaces blockers that can be fixed mechanically without re-running Phase 1.
- A freshness spot-check (per Session 10 Phase D) identifies drift that warrants a refresh pass.

This file is self-contained. The full canonical spec is `instructions/00_master_spec.md`. The session-orchestration meta-rules are in `instructions/05_session_runbook.md`.

---

## 1. When drift detection is appropriate

Drift detection runs in two modes: **opportunistic** (triggered by external event) and **scheduled** (periodic spot-check).

**Opportunistic triggers — always investigate:**
- A manufacturer's main consumer site is restructured (e.g., the 2026 AMG restructure that broke 99 Mercedes-Benz URLs in Session 4). Symptom: Phase 4 scrape reports a large fraction of `model_pages` returning 404 in one run that previously succeeded.
- Automotive press reports a mid-cycle refresh, new powertrain option, or significant pricing change for a model already in the catalog. Symptom: news article mentioning a specific model + a `2026` or `mid-cycle` qualifier.
- A model year transition is announced (typically Q3 of the calendar year preceding the MY). Symptom: a manufacturer announces "MY27 pricing" or "MY27 trims" while the catalog still shows MY26.

**Scheduled trigger — quarterly:**
- Every ~3 months, run a freshness spot-check per §5 below on a 5–10 brand sample. Document findings without auto-fixing. Decide whether the findings warrant a full refresh pass.

If neither trigger has fired and the catalog last verified clean, **no maintenance is needed.** Don't refresh proactively — the catalog is a snapshot, and refreshing it without a trigger creates churn without value.

---

## 2. Targeted re-research workflow

When a brand has drift on a subset of models (not the whole brand), targeted re-research lets you refresh only what changed.

**Steps:**

1. **Identify affected models.** From the trigger (news, freshness check, verification report), list the specific models that need refresh. Be precise — don't refresh "BMW" if only the X5 has new pricing.

2. **Pre-edit backup.** Copy `data/<brand>.json` and `catalog/data/<brand>.json` to `.bak`.

3. **Per-model refresh, per `01_research_brand.md` Step 2.** Use the same research workflow as Phase 1, but only on the changed models:
   - 2a — re-enumerate trims (in case a trim was added/removed)
   - 2b — re-fill base trim fully
   - 2c — re-fill step-up trims with deltas
   - 2d — re-fill model-level review/reliability blocks if affected
   - 2e — re-capture images only if URLs have changed (typically not needed for a pricing-only refresh)
   - 2f — recompute `msrp_range` from the updated trims
   - 2g — set `model.researched_at` to today's date

4. **Preserve unchanged models.** Do NOT touch `researched_at` on models that did not change. The freshness-check pattern in §5 only works if dates are accurate to the data they describe.

5. **Brand-level `researched_at`.** After the refresh, set the brand-level `researched_at` to today's date — this signals the brand has had a partial refresh. The model-level dates remain the authoritative per-model "as of" timestamp.

6. **Save both `data/<brand>.json` and `catalog/data/<brand>.json`** with the refreshed data. Update STATUS.md notes column with "partial refresh YYYY-MM-DD: <models>".

7. **Run Phase 2 incremental build** so the manifest reflects the updated brand. `node scripts/build_brand_configs.mjs` or the build-catalog instructions; incremental is fast.

8. **Run Phase 3 verification** on just the refreshed brand. Confirm no new blockers introduced.

---

## 3. Image-config rot detection and repair

When a brand-config's `model_pages` start failing en masse, the manufacturer site likely restructured. Symptoms:

- Phase 4 scrape reports >30% of pages returning 404 or empty candidates.
- Coverage drops noticeably after a re-run when nothing should have changed.

**Detection:**

```
node scripts/scrape_image_urls.mjs --brand <brand>
```

Look at the per-model output. If the "Pages failed" or "0 candidates" count is unusually high vs. the prior run, the config has rotted.

**Repair (without full Phase 4 re-run):**

1. **Manually inspect 1–2 failing model pages** by visiting the URL in a browser (or via `Bash curl -I`). Confirm the URL is dead.

2. **Identify the new URL pattern.** Visit the manufacturer's main site and navigate to the model. Note the new URL path.

3. **Update `scripts/brand-configs/<brand>.json` `model_pages` for the affected models.** Keep working URLs untouched.

4. **Verify the new URLs return 200 with image candidates.** Optional: run `node scripts/check_urls.mjs --brand <brand>` if available, or HEAD-check manually.

5. **Re-run Phase 4 scrape + download only on the affected models.** The scripts are idempotent — they only rewrite image URLs where matches are found, and download only entries flagged `needs_scraping: true`.

6. **Update `reports/<brand>_image_scrape.md`** with the config repair note.

If the entire site has restructured (>70% of URLs dead), this is no longer "config rot" — it's a brand-wide rebuild. Treat as full Phase 4 re-research per `04_scrape_images.md`.

---

## 4. Verifier-found blocker triage

When `node scripts/verify_brand.mjs <brand>` reports blockers, address them mechanically without re-running Phase 1. The blocker categories and their fixes:

### 4.1 Forbidden-source citation

**Symptom:** verifier reports "Forbidden source (cars.com|motor1.com|...) in sources map" or "Forbidden source in professional_reviews.links."

**Fix:**
- For `professional_reviews.links`: remove the offending entry. Do NOT replace with a different secondary unless that secondary is on the allowed list (Car and Driver, MotorTrend, Edmunds, KBB).
- For `sources.<field>`: replace with the most appropriate manufacturer / EPA / NHTSA / IIHS URL already present elsewhere in the same trim's sources. If no replacement exists, set the value to null and add a `trim.notes` entry explaining the gap (e.g., "Original spec source was a forbidden domain; manufacturer page for this field is not findable as of YYYY-MM-DD").

Apply edits to BOTH `data/<brand>.json` AND `catalog/data/<brand>.json`. Create `.bak` first.

### 4.2 Singleton trim_family without 4 images

**Symptom:** verifier reports "Singleton trim_family with <4 images" — a `trim_family` containing exactly one trim, where that trim's `images` array has fewer than 4 entries.

**Fix options (pick one):**
- **Add images.** Run Phase 4 on this brand and let the scraper attempt to resolve more angles. If still <4, set `images` entries to placeholder image objects with `needs_scraping: true` and document in trim notes.
- **Rename family slug.** If the singleton was an over-eager family split, merge it with another family that has full images. Update `trim_family` on the affected trim, set `is_shared_with_trim_family: true` on its image entries.

### 4.3 `msrp_range` mismatch

**Symptom:** verifier reports `msrp_range.low` or `msrp_range.high` doesn't equal the min/max of trim `msrp_base`.

**Fix:** recompute from current trims. Set `msrp_range.low = min(t.msrp_base for t in trims if t.msrp_base != null)` and `msrp_range.high = max(...)`. Save.

### 4.4 Schema violations

**Symptom:** verifier reports "Missing key", "Invalid body_style", "Invalid model_slug", "Singleton trim_family — is_base_trim must be true", etc.

**Fix:** per the specific rule violated. Reference `00_master_spec.md` §3 (schema), §5 (body-style taxonomy), §6.2 (sole-trim rule), §7 (trim_family rule), §8 (slug conventions). **Fix the data, not the schema.** The schema is the contract; data must conform.

### 4.5 `delta_from_base` integrity

**Symptom:** verifier reports "delta_from_base.from_trim_slug references nonexistent trim."

**Fix:** repoint to a real trim in the same model AND same powertrain line. Per `01_research_brand.md` §6, hybrid step-ups reference the hybrid base, ICE step-ups reference the ICE base.

---

## 5. Freshness spot-check pattern

The pattern Session 10 Phase D used. Periodic, detection-only, no auto-fix.

**Procedure:**

1. **Pick 5 brands** across the coverage / research-age spectrum. Mix tiers: 2 from A (>=80% coverage), 2 from B (50-80%), 1 from C (<50%). Mix research age: oldest, newest, median.

2. **For each brand, spot-check 2–3 trims.** For each trim:
   - Open the manufacturer's current consumer page for the model.
   - Compare stored `msrp_base` to current page price.
   - Compare stored trim list to current page trim list.
   - Note any model-year drift (still MY26 stored vs MY27 on site).

3. **Document findings without auto-fixing.** Write `reports/freshness_check_session<N>.md` with per-brand:
   - Model list match: yes/no/partial
   - Pricing drift: $ delta on the 2–3 sampled trims
   - Trim structure: matches / drifted
   - Model-year drift: yes/no
   - Overall severity: none / minor / major

4. **Decide whether to schedule a refresh pass** based on findings. Trigger thresholds:
   - Major pricing drift (>5% on any sampled trim, or >$2,000 absolute) → schedule a targeted refresh on that brand.
   - Trim structure drifted on >1 sampled brand → schedule a Phase 1 partial refresh on those brands.
   - Model-year drift on >1 sampled brand → schedule MY transition work.
   - All sampled brands at "minor" or "none" → no action needed; re-check next quarter.

5. **If the manufacturer site is unavailable** (maintenance, 403), use secondary sources cautiously and flag the limitation. Cars.com / GM Authority / Edmunds are acceptable as **freshness comparison references** (not as primary spec sources per §4.1 of `01_research_brand.md`). Note the source in the freshness report.

**Cadence:** quarterly is the default. Adjust based on findings — if every quarterly check shows clean state, slow to semi-annual. If quarterly checks consistently surface drift, accelerate to monthly.

---

## 6. When to NOT do maintenance

These are NOT triggers for maintenance work:

- A verification report has FYI items but no blockers and no warnings. FYIs are informational.
- A model has `confidence: "unknown"` on reliability/customer_satisfaction blocks for current MY. That's structurally expected per §13 of `00_master_spec.md`.
- A brand has low image coverage at structural ceiling. Documented at `reports/persistent_low_coverage_brands.md`. Not a defect.
- A trim has `msrp_base: null` with documented manufacturer non-disclosure in `trim.notes`. Ultra-luxury non-disclosure is structural per §4.6 of `01_research_brand.md`.
- A single brand's data is "old" by calendar (researched 2+ months ago) but the brand hasn't announced changes. Old != stale.

---

End of maintenance file.
