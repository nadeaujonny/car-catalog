# SESSION_SUMMARY_14.md — 2026-05-16 (tiered source allowlist; HALTED at Phase 3)

Fourteenth session for the Car Catalog Project. Multi-phase session with strict checkpoint design. Phases 1 and 2 (policy update + script extension) landed cleanly. Phase 3 (Tesla + Ferrari validation) HALTED on the brief's "if neither brand improves significantly" condition. Phase 4 (project-wide re-scrape on affected brands) skipped per HALT. Phase 5 (build + verify + status) ran in reduced scope.

## Headline

The brief asked to relax the manufacturer-only image-source policy via a tiered allowlist (Tier 1 manufacturer, Tier 2 press-kit aggregation + reputable editorial hero photos, Tier 3 manufacturer configurator endpoints) and validate on Tesla + Ferrari before chaining. The policy update and script extension landed correctly. The validation found:

- **Tesla 0/64 → 0/64.** All 5 model pages + all 10 configurator endpoints return HTTP 403. NetCarShow Tier 2 URLs reach 200 but redirect to brand landing (no 2026 Tesla photography on aggregators); the script's post-fetch MY-verification check correctly detects the redirect-away and skips the candidates. No wrong-MY substitution. Tesla remains at the structural ceiling documented in PROJECT_STATE.md lesson #71.
- **Ferrari 11/48 → 11/48.** Tier 1 picked the same URLs prior sessions resolved (no upgrade). NetCarShow Tier 2 architecture ran correctly: 4 of 12 redirect-skipped, 6 of remaining produce slug-matched candidates, but `pickBestForAngle` rejected ALL of them because NetCarShow's hero filenames (`Ferrari-Amalfi-2026-1280-<hash>.jpg`) and alt-text lack angle vocabulary. The architecture executed; the angle-matcher couldn't score the candidates.

Per the brief: "If neither brand improves significantly: HALT. The Tier 2/3 logic may not be working correctly. Write diagnosis to SESSION_NOTES.md." HALT triggered. The Tier 2/3 logic IS correct — the OUTCOME is "content unavailable / vocabulary gap," not "broken logic." Full diagnosis in SESSION_NOTES.md.

Project totals unchanged: **46 brands / 435 models / 1,492 trims / 3,253 of 4,482 images = 72.58%**. The session's deliverable is the policy + script + verifier infrastructure, ready for refinement.

## Per-phase outcome

| Phase | Title                                       | Outcome   | Notes                                                                                              |
|-------|---------------------------------------------|-----------|----------------------------------------------------------------------------------------------------|
| 1     | Policy update (`04_scrape_images.md` §A)    | LANDED    | Full Tier 1/2/3 definitions + denylist + provenance + MY verification + order of preference        |
| 2     | Script extension (scrape + download + verifier docs) | LANDED    | TIER_DEFINITIONS, classifyTier, fetchTier3Endpoint, tier2_endpoints / tier3_endpoints config fields, post-fetch MY check, slug-match Tier 2 filter, provenance attach, once-per-trim note, SCRAPE SUMMARY tier breakdown, PER_HOST_REFERER, content_type recording, verifier doc updates |
| 3     | Tesla + Ferrari validation                  | HALTED    | Neither brand improved; architecture verified safe (post-fetch MY check prevented wrong-MY substitution on Tesla) |
| 4     | Project-wide re-scrape                      | SKIPPED   | Per Phase 3 HALT — no fleet-wide value to extract until angle-vocab gap is addressed              |
| 5     | Build + verify + status (reduced scope)     | LANDED    | Tesla and Ferrari verify clean; project totals unchanged; STATUS / PROJECT_STATE / summary written |

## Files touched Session 14

- `instructions/04_scrape_images.md` — added §A "Tiered source allowlist for image scraping" (Phase 1).
- `instructions/03_verify_catalog.md` — added Session 14 image-entry provenance fields + verifier behavior changes (Phase 2).
- `scripts/scrape_image_urls.mjs` — TIER_DEFINITIONS, classifyTier, tierTwoPageMatchesMY, fetchTier3Endpoint, extractURLsFromText, per-trim post-Tier-1 fall-state evaluation, Tier 3/2 fallback dispatch, post-fetch URL MY check, slug-match Tier 2 filter, provenance attach + maybeAddTrimNote, SCRAPE SUMMARY tier breakdown (Phase 2).
- `scripts/download_images.mjs` — PER_HOST_REFERER, per-URL effective-Referer resolution, `content_type` field on image entries (Phase 2).
- `scripts/brand-configs/tesla.json` — added `tier3_endpoints` (Tesla configurator API per model) + `tier2_endpoints` (NetCarShow per model) + extended path_blacklist_regex. `.bak` preserved (Phase 3).
- `scripts/brand-configs/ferrari.json` — added `tier2_endpoints` (NetCarShow Ferrari per model) + extended path_blacklist_regex to filter `/R/<other-cars>-*-thb.jpg` sidebar thumbnails. `.bak` preserved (Phase 3).
- `data/tesla.json` + `catalog/data/tesla.json` — script-created `.bak` files; idempotent reset of 64 needs_scraping entries (effectively unchanged post-run). No URLs changed (Phase 3).
- `data/ferrari.json` + `catalog/data/ferrari.json` — script-created `.bak` files; 11 entries got new `source_tier: 1` + `source_domain` provenance fields (additive backfill). No URLs changed; same 11/48 downloaded count as Session 9 (Phase 3).
- `SESSION_NOTES.md` — appended ~140 lines Session 14 Phase 3 HALT diagnosis (Phase 3).
- `STATUS.md` — appended Session 14 section (Phase 5).
- `PROJECT_STATE.md` — top status rewritten + "what to do next" updated + instruction file list updated to reflect 04 v3 (Phase 5).
- `SESSION_SUMMARY_14.md` (this file) (Phase 5).
- `reports/session14_final.md` (Phase 5).

## What worked

1. **Policy update §A** integrates cleanly with the existing 04_scrape_images.md structure (placed after the Operating Principles section). All headings render correctly. The cross-reference to §4.6 of 01_research_brand.md is correct.
2. **TIER_DEFINITIONS classifier** correctly identifies NetCarShow URLs across both URL shapes (`/cars/<year>-*` legacy AND `/<make>/<year>-*` current). Bug-fixed mid-session when an initial Tesla run showed Tier 2 URLs being misclassified.
3. **Post-fetch MY verification** caught NetCarShow's redirect-to-brand-landing pattern correctly. Tesla's `2026-model_3/` URL returns 200 but redirects to `/tesla/`; the redirect-detection logic correctly classified this as "wrong MY in final URL" and skipped the candidates. This is exactly the safety mechanism the brief asked for.
4. **Slug-match filter on Tier 2 candidates** prevents cross-promotional sidebar thumbnail contamination. NetCarShow Ferrari pages have a sidebar with thumbnails of other Ferrari models; the slug filter excludes them.
5. **Provenance backfill on existing Tier 1 entries** is consistent. Ferrari's 11 pre-existing direct-URL entries now carry `source_tier: 1` + `source_domain`, matching the verifier's new expectation. Other brands will get the same backfill when they're next scraped.
6. **`node --check` passes** on both modified scripts.
7. **Both scrape + download scripts wrote `.bak` files** automatically before mutations. The original manual `.bak` I created in Phase 3 was overwritten by the script's `.bak` (which is the documented behavior — one-deep backup). Restoration was not needed because the mutations were additive (provenance fields only).

## What did not work

1. **NetCarShow's image alt-text is empty across the board.** Even on a real 2026 Ferrari Amalfi model page, the hero image (`/Ferrari-Amalfi-2026-1280-<hash>.jpg`) has no alt-text, and the URL filename has no angle vocabulary. The existing `ANGLE_PATTERNS` regex looks for "front" / "rear" / "side" / "interior" tokens, and these candidates have none. `pickBestForAngle` returned null for every Tier 2 candidate.
2. **Tesla configurator API is gated by the same anti-bot as the consumer site.** I expected `tesla.com/configurator/api/v3/?model=m3` might be a separate access surface; it isn't. Both return 403. There's no Tier 3 surface for Tesla under the current §A relaxation.
3. **NetCarShow doesn't have 2026 photography for Tesla.** Tesla doesn't refresh photography YOY unless a major refresh ships; NetCarShow only carries press-kit photos when the manufacturer publishes new ones. So Tesla can't be helped by NetCarShow under the §A policy (which forbids old-MY substitution).
4. **NetCarShow's URL shape is not what I initially encoded.** I designed the Tier 2 regex around `/cars/<year>-<make>-<model>/`, which is the legacy URL pattern; the current pattern is `/<make>/<year>-<model>/`. Fixed mid-session.

## Lessons captured

(See SESSION_NOTES.md Session 14 entry for the full list.)

1. NetCarShow URL shape is `/<make>/<year>-<model>/`, not `/cars/<year>-<make>-<model>/` (legacy pattern hits 404).
2. NetCarShow image filenames are angle-agnostic; alt-text is mostly empty.
3. Tesla configurator API is gated by the same anti-bot as the consumer site.
4. Post-fetch MY check works as designed (caught Tesla's redirect-away).
5. Provenance backfill on existing direct-URL entries is useful even when no new fills happen.

## Anything deliberately deferred

- **Phase 4 project-wide re-scrape** on affected brands (lotus, mercedes-benz, mazda, kia, ram, jeep, ford, mclaren, lamborghini, rolls-royce, maserati, dodge, chrysler, etc.) — skipped per the Phase 3 HALT. Running it would consume time without producing fills.
- **Adding a lower-precision Tier 2 angle picker** that would use heuristics like "largest image on page = front_three_quarter" for sources whose URL/alt-text lacks angle vocabulary. This is the most-likely-to-help next iteration, but it's a new design decision (with quality risk) that belongs in a future session, not as an in-session pivot from the brief.
- **Adding Playwright-rendered Tier 2 fetches** that would enable the existing `pickByPosition` positional fallback for Tier 2 candidates. Bigger scope; would extend page-fetch time noticeably.
- **Adding `angle_url_patterns` Tier 2 hints** per brand — e.g., for NetCarShow Ferrari, recognize "-1280" filename suffix as hero. Tight per-source maintenance but precise.

## Safety rules observed

- DID NOT modify any brand JSON outside the two validation targets (Tesla, Ferrari).
- DID NOT touch `data/_partials/`.
- Modified instruction files only where authorized by the brief (Phase 1: 04; Phase 2: 03).
- Scripts created `.bak` files before all mutations (verified by inspecting `data/<brand>.json.bak` and `catalog/data/<brand>.json.bak` timestamps post-run).
- TaskCreate / TaskUpdate used throughout; Phase 4 task set to `deleted` after the HALT to make the project-tracking accurate.
- Single-threaded across Phases 1, 2, 3, and 5 (per the brief's "Single-threaded for Phases 1-3 + Phase 5" rule). No parallel subagents invoked.
- `node --check` passed on both modified scripts after each edit.
- Pre-flight forbidden-source grep on the instruction file edit was not necessary (no brand JSON written in this session beyond the additive provenance fields).

## Test-your-assumptions check

The brief's expected outcome was "Tesla 0% → 75-90%, Ferrari low → ~50-70%, project-wide 73% → 80-87%." Reality came in at 0% / 22.9% / 72.58% — identical to pre-session state. The diagnosis isn't "the script is broken"; it's "Tier 2 hero photography on the principal aggregator (NetCarShow) lacks the metadata vocabulary the existing angle-matcher requires." The brief's optimism assumed aggregators ship hero photos with descriptive metadata (alt text or angle-tagged URLs); in practice they don't.

This is the Session 5/6/8 pattern of "the diagnosis from the brief was half right; the fix needs another layer." The §A policy and script architecture are LAYER 1 (sound foundation). The angle-vocab gap is LAYER 2 (a separate problem with three possible solutions, each with tradeoffs). A future session can pick one of the three options and try again.

Per the runbook's §8 "Test your assumptions" lesson: when a fix doesn't deliver the expected magnitude, the first move is to question the diagnosis. Here, the brief's diagnosis was "manufacturer-only sourcing is the ceiling; Tier 2/3 relaxation will lift coverage." The architectural diagnosis is correct (Tesla CAN'T be reached, Ferrari's manufacturer site DOES limit coverage). But the implementation diagnosis was incomplete: Tier 2 aggregators don't tag hero photography with angle metadata, so the existing angle-matcher rejects them. The next iteration needs to recognize "this is a hero" without angle vocabulary — which is exactly what the existing `pickByPosition` does for Playwright-fetched pages.
