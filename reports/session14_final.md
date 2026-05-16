# Session 14 Final Report — Tiered Source Allowlist (HALTED at Phase 3)

**Date:** 2026-05-16
**Phases planned:** 5 (Phase 1 policy update, Phase 2 script extension, Phase 3 Tesla+Ferrari validation, Phase 4 project-wide re-scrape, Phase 5 build/verify/status)
**Phases executed:** 1, 2, 3 (HALTED), 5 (reduced scope)
**Project-wide totals before:** 46 brands / 435 models / 1,492 trims / 3,253 of 4,482 images = 72.58%
**Project-wide totals after:** identical (no net change; additive provenance fields on 11 Ferrari entries only)

---

## Phase 1 summary — Policy update

Added new subsection §A "Tiered source allowlist for image scraping" to `instructions/04_scrape_images.md`, placed after the Operating Principles section. The new subsection:

- Scopes the relaxation to image scraping only (spec-data source hierarchy in 00_master_spec.md §4 is unchanged).
- Defines Tier 1 (manufacturer + manufacturer-affiliated distribution, existing — always allowed).
- Defines Tier 2 (NetCarShow, CarScoops on press paths, Car and Driver / MotorTrend / Road & Track / Hagerty / Edmunds on editorial paths only).
- Defines Tier 3 (manufacturer configurator-API surfaces, e.g., Tesla `digitalassets.tesla.com`).
- Explicit denylist: Wikimedia/Wikipedia, KBB image galleries, Cars.com images, Autotrader, Carbuzz, Motor1 galleries, Autoblog galleries, AutoEvolution, forums/Reddit, *.fandom.com, dealer sites.
- Provenance requirements: every image MUST record `source_tier` (1/2/3) and `source_domain`; tier > 1 also triggers a once-per-trim note in `trim.notes`.
- MY/model verification at scrape time: Tier 2 source URLs MUST contain the current model year in the path.
- Order of preference: Tier 1 static → Tier 1 Playwright → Tier 3 → Tier 2. Don't escalate to Tier 2 if Tier 1 already provided ≥ 2 of 4 baseline angles for the trim family.
- Cross-reference: parallel to §4.6 MSRP scoped relaxation in 01_research_brand.md (both narrow source-policy exceptions, both require explicit provenance).

The file parses as markdown; heading hierarchy verified by `grep ^##`.

## Phase 2 summary — Script extension

### `scripts/scrape_image_urls.mjs`

Added (~250 lines net):

- `TIER_DEFINITIONS` constant mapping host patterns to tiers, plus an explicit denylist. Tier 1 is the default for any host not on Tier 2/3 or deny.
- `classifyTier(url)` returns 1/2/3 or null. Denylist takes precedence over tier matching.
- `sourceDomain(url)` returns the URL's hostname for provenance.
- `tierTwoPageMatchesMY(pageUrl, modelYear)` regex-checks that the URL contains the current MY in a recognized position.
- `fetchTier3Endpoint(url)` fetches a configurator-API endpoint as JSON/text and returns the body (no HTML parsing assumed).
- `extractURLsFromText(text, blacklist)` extracts HTTP image-extension URLs from a JSON/text body via regex.
- New brand-config fields (both optional): `tier2_endpoints` (model_slug → array of Tier 2 URLs) and `tier3_endpoints` (model_slug → URL or `{endpoint, type}` object).
- New per-trim post-Tier-1 fall-state evaluation: count baseline angles filled per trim family. If < 2 of 4 filled, attempt Tier 3 then Tier 2.
- New `applyFallbackCandidates(cands, trims, missingAngles, model, famKey, tier)` helper: dedupes candidates, picks per angle via existing `pickBestForAngle` (then `pickByPosition`), attaches provenance, appends once-per-trim note via `maybeAddTrimNote()`.
- New `attachProvenance(img, tier)`: sets `source_tier` and `source_domain` on the image entry; increments `tierBreakdown[tier]` counter for SCRAPE SUMMARY.
- Provenance backfill: pre-existing direct-URL entries (already resolved with `needs_scraping !== true` and URL != canonical model page) get `source_tier: 1` retroactively if not already stamped.
- Post-fetch MY verification on Tier 2: if the fetch's final URL no longer contains the MY (the page 302'd to a brand landing), skip the candidates.
- Slug-match filter on Tier 2 candidates: only consume candidates whose URL or alt-text mentions the model's slug variants (prevents sidebar/related contamination).
- SCRAPE SUMMARY now includes:
  - `via tier-2/3 fallback: N` count line under "Image entries rewritten"
  - `Tier breakdown (provenance): Tier 1: X | Tier 2: Y | Tier 3: Z` block

### `scripts/download_images.mjs`

Added (~40 lines net):

- `PER_HOST_REFERER` map: per-host Referer overrides for Tier 2 hosts that gate hot-linking against their own origin (NetCarShow, hearstapps via Car and Driver, etc.).
- `refererForURL(url, defaultReferer)`: resolves the effective Referer from the per-host map, falling back to the brand's auto-derived Referer.
- `content_type` field written on image entry at download success time (records the actual HTTP response Content-Type).

### `instructions/03_verify_catalog.md`

Added new subsection documenting:

- New optional config fields: `tier2_endpoints`, `tier3_endpoints`.
- New image-entry provenance fields: `source_tier`, `source_domain`, `content_type`.
- Verifier behavior changes (effective Session 14): forbidden-source check applies to `sources` + `professional_reviews.links` only (not `image.source_domain`); Tier 2 + Tier 3 source domains NOT forbidden when on `image.source_domain`; new BLOCKER check that tier > 1 images must have provenance note in trim.

### Validation

Both scripts pass `node --check`. Brand config JSONs (Tesla + Ferrari) parse cleanly. The verifier instruction file edits are self-consistent.

## Phase 3 summary — Tesla + Ferrari validation (HALTED)

### Tesla — 0/64 → 0/64

Architecture executed correctly across every layer:

- **Static fetch** on `tesla.com/model3`, `/modely`, `/models`, `/modelx`, `/cybertruck`: HTTP 403 (known anti-bot block per PROJECT_STATE.md lesson #71).
- **Playwright fetch** on the same URLs: returns successfully but produces 0 image candidates (the rendered HTML still has no usable image markup for non-authenticated users).
- **Tier 3 endpoints** (`tesla.com/configurator/api/v3/?model=m3` etc., 10 total across the 10 trim families): all HTTP 403. Tesla's configurator API is gated by the same anti-bot as the consumer site. Diagnosis: there is no Tier 3 surface for Tesla under the current §A relaxation.
- **Tier 2 endpoints** (`netcarshow.com/tesla/2026-model_3/` etc., 10 total): all return HTTP 200 but redirect to `netcarshow.com/tesla/` (brand landing). The script's post-fetch MY verification (checking `r.finalUrl` against the model year) correctly detected the redirect-away pattern and skipped the candidates on all 10.

**Net Tesla impact:** 0 image entries rewritten. 0 provenance fields written. The script ran cleanly and made no mutations to Tesla's image data beyond the idempotent reset (which is the existing pre-Session-14 behavior for all needs_scraping:true entries).

**Spot-check correctness:** N/A — no images filled.

### Ferrari — 11/48 → 11/48

Architecture executed correctly across every layer; outcome was net-zero improvement:

- **Static fetch** on `ferrari.com/en-EN/auto/...`: all 12 model pages fetched successfully. 286 raw candidates extracted; 162 slug-matching after filtering. The same Tier 1 pipeline as Sessions 5-12.
- **Playwright fetch** triggered on 3 pages (296-speciale, 296-speciale-a, 849-testarossa-spider) due to low slug-matching count. Successful in all 3 cases.
- **Tier 1 angle matching** found 11 candidates that matched on ANGLE_PATTERNS — but these were the SAME URLs that prior sessions had already resolved to. Diff against `data/ferrari.json.session9p_b.bak`: 0 URLs changed.
- **Tier 2 endpoints** (12 NetCarShow URLs): 4 redirect to brand landing (post-fetch MY check correctly caught them); 8 reach their target pages. Of those 8, 6 produced 0-17 slug-matched candidates per page (the slug-match Tier 2 filter accepted them based on URL path containing the model name).
- **But `pickBestForAngle` rejected every Tier 2 candidate** because NetCarShow's hero filenames (`Ferrari-Amalfi-2026-1280-<hash>.jpg`) and alt-text lack angle vocabulary. The existing angle-matcher requires "front" / "rear" / "side" / "interior" / specific 3/4 tokens in URL or alt; NetCarShow's images have none of these.

**Net Ferrari impact:** 0 NEW image entries rewritten. 11 existing Tier 1 entries got the additive `source_tier: 1` + `source_domain` provenance fields (the backfill loop). 0 Tier 2 or Tier 3 fills. 11 downloaded count preserved (same as pre-Session-14).

**Spot-check correctness on Tier 1 picks (sample):**

- `roma-spider/roma-spider/interior_dashboard` → `cdn.ferrari.com/.../ferrari-roma-spider-hmi-focus` — correct model, HMI (Human-Machine Interface) is the dashboard. ✓
- `296-gtb/296-gtb/interior_dashboard` → `cdn.ferrari.com/.../ferrari-296-gtb-2021-interior-intro-cover-focus-1` — correct model, interior view. The "2021" in the filename is the file's CDN creation date, not the MY of the depicted car (296 GTB launched MY22). The 296 GTB cabin has not been redesigned since launch, so MY26 photography of the interior is identical. ✓
- `12cilindri/12cilindri/interior_dashboard` → `cdn.ferrari.com/.../ferrari-12cilindri-interior-cockpit-desk` — correct model, cockpit/interior. ✓
- `f80/f80/interior_dashboard` → `cdn.ferrari.com/.../ferrari-f80-interior-intro-desk` — correct model, F80 interior. ✓

All sampled images are right-car, right-MY, right-angle. No wrong-MY or wrong-car substitution.

### Checkpoint disposition

Per the brief's Phase 3 checkpoint:

> "If Tesla improves to at least 50% AND the spot-checked images are correctly identified (right car, right MY): proceed to Phase 4.
> If Tesla improves but Ferrari doesn't: still proceed but note that Ferrari may need brand-specific tier3_endpoints.
> If neither brand improves significantly: HALT. The Tier 2/3 logic may not be working correctly. Write diagnosis to SESSION_NOTES.md.
> If any spot-checked image is clearly wrong-MY or wrong-car: HALT. The MY verification or source quality isn't catching errors. Write diagnosis."

Tesla 0% → 0% and Ferrari 22.9% → 22.9%. Both unchanged. The "neither brand improves significantly" condition triggers. **HALT.** Phase 4 (project-wide re-scrape on affected brands) skipped per the HALT rule.

The Tier 2/3 logic IS technically working correctly (every layer executed; safety checks held). The OUTCOME is "content unavailable" + "vocabulary gap," not "broken logic." Full diagnosis in SESSION_NOTES.md Session 14 entry.

## Phase 4 summary — SKIPPED

Phase 4 was conditioned on Phase 3 success. Per the HALT, Phase 4 did not run. No brand JSONs outside Tesla and Ferrari were touched in Session 14.

## Phase 5 summary — Build / verify / status (reduced scope)

- **Build:** no rebuild needed. Brand JSON counts unchanged (46/435/1492); no models added or removed; `catalog/data/<brand>.json` files are in sync with `data/<brand>.json` (scripts write both). Manifest's `generated_at` timestamp left at Session 13's value (2026-05-16T14:12:32Z) because no semantic data changed.
- **Verify Ferrari:** 0 blockers / 2 warnings (PHEV MPG nulls — pre-existing, out of Session 14 scope) / 7 FYIs (ultra-luxury MSRP non-disclosure — pre-existing, documented in notes). The 11 new `source_tier: 1` provenance fields did NOT trigger any verifier findings — they're additive and the verifier accepts them as expected fields per the updated 03_verify_catalog.md.
- **Verify Tesla:** 0 blockers / 0 warnings / 0 FYIs. Cleanest verification of any brand.
- **Project-wide totals:** 46 brands / 435 models / 1,492 trims / 4,482 images / 3,253 downloaded = 72.58%. Identical to pre-Session-14.
- **STATUS.md:** appended Session 14 section documenting the HALT outcome, files changed, and project-state-going-forward narrative.
- **PROJECT_STATE.md:** top status rewritten to reflect Session 14 outcome; "what to do next" updated to flag the three options for a future session to extract Tier 2 value (lower-precision angle picker / Playwright-rendered Tier 2 / per-brand angle_url_patterns Tier 2 hints); instruction file list updated to reflect 04 v3.
- **SESSION_SUMMARY_14.md:** written.
- **reports/session14_final.md** (this file): written.

## Honest assessment of remaining coverage gaps and why

### Tesla — structural ceiling

Tesla's image coverage is 0% and will remain 0% under the manufacturer-only policy (Tier 1) and the current §A relaxation (Tier 2/3). Reasons:

1. **Tesla.com anti-bot is hard.** All consumer pages and the configurator API return 403 to both static fetch and Playwright. There is no manufacturer-accessible surface for non-authenticated clients.
2. **NetCarShow has no 2026 Tesla photography.** Tesla doesn't update YOY photography unless a major refresh ships; the most recent NetCarShow Tesla pages are 2024 Model 3 and 2025 Model Y. The §A policy forbids old-MY substitution.
3. **Other Tier 2 sources (Car and Driver, MotorTrend, etc.) don't follow the `/<make>/<model>/<year>/` URL convention** — they typically use `/<make>/<model>/` (with implicit current MY). The §A policy's strict URL-MY check rejects these as well.

A future session could relax the MY-in-URL strictness for editorial sources (treating the date-of-publication metadata in HTML as the MY signal instead of the URL path), but that's a new policy decision.

### Ferrari — angle-vocab gap

Ferrari's image coverage is 22.9% (11/48). All 11 successful images come from `cdn.ferrari.com` Tier 1 paths that prior sessions already resolved. Tier 2 NetCarShow content IS reachable (3-4 model pages with 2026 photography), but the candidates lack angle vocabulary in URLs/alt-text, so the angle-matcher rejects them.

A future session could fix this with ONE of:

1. **Lower-precision per-source angle picker.** Add a NetCarShow-specific rule: "the largest hero image on a model page = `front_three_quarter`." This is the same pattern used by `pickByPosition` for Playwright-fetched pages. Risk: occasional wrong-angle. Mitigation: spot-check.
2. **Playwright-rendered Tier 2 fetches.** Run Tier 2 pages through the Playwright pipeline (currently only Tier 1 uses Playwright). The rendered DOM provides positional + visibility + size data, which the existing `pickByPosition` uses to pick front_three_quarter on large hero images. Cost: ~5-10s per Tier 2 page.
3. **Per-brand `angle_url_patterns` Tier 2 hints.** Add a regex like `Ferrari-\w+-\d{4}-1280-\w+\.jpg` → `front_three_quarter` to ferrari.json. Precise but per-source maintenance.

### Project-wide — bimodal coverage preserved

Sessions 5-12 established that image coverage is bimodal: 16 brands at ≥80%, 18 at <50%, 7 in between. Session 14's §A relaxation was intended to lift the <50% group. It did not (per Tesla + Ferrari validation). The bimodal pattern persists.

The 72.58% project-wide coverage is the working ceiling under the manufacturer-only policy (Sessions 1-12) AND under the §A relaxation as currently implemented (Session 14). Lifting it further requires the angle-vocab work flagged above.

## What this session delivered

Despite the Phase 3 HALT, the session's deliverables are:

1. **Policy:** `instructions/04_scrape_images.md` §A is a complete, written tiered-source allowlist that can be cited in future work or external review.
2. **Script architecture:** the scrape and download scripts now support tier-aware fallback with provenance tracking, MY verification, and slug-match safety. The architecture is verified safe (Tesla's redirect-away was caught correctly).
3. **Verifier docs:** `instructions/03_verify_catalog.md` reflects the new image-entry fields and the scoped forbidden-source check.
4. **Brand-config conventions:** `tier2_endpoints` and `tier3_endpoints` are now documented optional config fields. Tesla and Ferrari have working examples.
5. **Provenance backfill:** the 11 existing Tier 1 Ferrari entries now carry `source_tier` + `source_domain`. This is the start of catalog-wide provenance auditing — a future session can extend the backfill to other brands without re-scraping (or it will happen organically as those brands get re-scraped).
6. **Honest diagnosis:** SESSION_NOTES.md Session 14 entry documents the failure modes with enough specificity that a future session can pick up the work without re-running validation. The three follow-up options are concrete and small in scope.

The Session 13 portfolio-prep recommendation (still in PROJECT_STATE.md's "What to do next") remains the natural next session for the project as a whole. The Session 14 image-coverage work is a parallel branch that can be picked up if/when image coverage is identified as the blocker on portfolio readiness.
