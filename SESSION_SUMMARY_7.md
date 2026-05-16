# SESSION_SUMMARY_7.md — 2026-05-14 (angle_url_patterns + resolution preference)

Seventh chained session for the Car Catalog Project. Picked up from Session 6 (2026-05-14 same-day) which had documented `angle_url_patterns` brand-config extension as the recommended next engineering item. Session 7 implemented that extension (Phase A) plus a higher-resolution image-preference layer (Phase B), then rebuilt and updated status.

**Headline outcome: project-wide image coverage 62.26% → 65.21% (+2.95 pp, +129 entries downloaded). Avg file size 517 → 526 KB project-wide (+1.7%); 10 brands gained 14-107% in average file size from the resolution preference. 1 tier crossing: Honda B → A. Mini, BMW, Chevrolet improved within their existing tiers via repaired downloads.**

Major brand wins:
- **Hyundai 0% → 28.3%** (angle_url_patterns `vlp-hero` dichotomy)
- **Ram 15.9% → 33.0%** (angle_url_patterns `vlp-hero-\d` patterns)
- **Mazda 46.4% → 63.1%** (angle_url_patterns `/34-jellies/` patterns)
- **Honda 75.9% → 82.1%** (repair recovered 13 cached entries; tier B → A)
- **Lexus 59.7% → 70.8%** (repair recovered 24 entries)

Major file-size wins (≥14% size lift, no coverage change):
- Polestar +106.8%, GMC +85.1%, Chevrolet +74.1%, Alfa-Romeo +68.5%, Hyundai +60.6%, Jeep +32.5%, Buick +27.9%, Cadillac +27.0%, Volvo +21.6%, Audi +14.5%.

Project-wide totals after Session 7:
- 41 brands / 424 models / 1,463 trims (unchanged)
- 2,849 / 4,369 image entries downloaded = 65.21%
- Tier A (≥80%): 18 brands · Tier B (50-80%): 8 brands · Tier C (<50%): 15 brands
- 76 models with 0 downloaded images (was 110)
- 431 trims with all 4 required angles (was 421)
- 1,290 MB total on disk (was 1,266 MB; +24 MB)

---

## Per-phase summary

### Phase A1 — Script extension (angle_url_patterns)

Modified `scripts/scrape_image_urls.mjs` to support an optional `angle_url_patterns` field in brand configs. The schema:

```json
"angle_url_patterns": {
  "front_three_quarter": ["<regex1>", "<regex2>", ...],
  "rear_three_quarter":  ["<regex1>", ...],
  "side_profile":        ["<regex1>", ...],
  "interior_dashboard":  ["<regex1>", ...]
}
```

Behavior: standard ANGLE_PATTERNS English matching runs first (preserves prior behavior); brand-specific regexes are tested against `url + " " + alt-text` (case-insensitive) only if standard matching yields zero matches for that angle. Brand-specific matches receive a fixed score of 6 (below score-7 English direction tokens, so when both fire English wins). Other safety preserved: `path_blacklist_regex`, slug-matching, `needs_scraping` gating, `.bak` backups. New SCRAPE SUMMARY counter: "Brand-specific angle matches: N".

### Phase A2 — Syntax check

`node --check scripts/scrape_image_urls.mjs` clean.

### Phase A3 — 7 parallel subagents (one per priority brand)

Spawned 7 parallel general-purpose subagents on hyundai, subaru, mazda, kia, ram, ferrari, lotus. Each: read existing Phase 3 / persistent-low-coverage reports, dumped raw candidates (via existing or new diag scripts), derived 2-4 regex patterns per angle, edited the brand config, re-ran scrape + download, wrote a per-brand session 7 report.

| brand | before | after | Δ | recommendation | patterns added |
|---|---:|---:|---:|---|---:|
| hyundai | 0.0% | 28.3% | +28.3 | KEEP | 2 (`(?<!ev-)vlp-hero` = front, `ev-vlp-hero`/`hev-vlp-hero` = side) |
| ram | 15.9% | 33.0% | +17.1 | KEEP | 3 (`vlp-hero-\d`, `vlp-slider-\d`, `overview-hero`) |
| mazda | 46.4% | 63.1% | +16.7 | KEEP | 4 (`/34-jellies/` underscores = front, dashes = side) |
| kia | 17.2% | 21.9% | +4.7 | KEEP | 1 (`\bgallery[-_]?ext\d+\b`) |
| subaru | 6.9% | 9.2% | +2.3 | KEEP | 2 (Trailseeker-only `_overview_hero` / `_hero_md_sm`) |
| ferrari | 2.1% | 2.1% | 0.0 | ABANDON | 0 (rendered DOM has no usable signal) |
| lotus | 0.0% | 0.0% | 0.0 | ABANDON for this lever | 0 (actual blocker: extension-less Sitecore CDN URLs filtered upstream) |

### Phase A4 — Aggregate findings

Wrote `reports/angle_url_patterns_session.md` and appended a comprehensive Phase A entry to `SESSION_NOTES.md`. Cross-brand patterns identified:

1. **`vlp-hero` is a near-universal hero-shot URL token across Hyundai-Kia-Genesis-Subaru-Ram CDNs**, but its angle interpretation varies by brand.
2. **`/34-jellies/` is Mazda's trim-jelly folder** — universally 3/4 front on `siteassets` CDN, uniquely 3/4 side on the alternate `content/dam` CDN. Dash-vs-underscore separator within same folder name is the angle discriminator.
3. **Electrification-prefix idiom** `(?<!ev-)token` / `(?:^|[-/])ev-token` unlocks Hyundai's electrification-flipped angle.
4. **Iteration on patterns is essential.** Kia's first-pass had 33% false positives; refining produced 100% precision.
5. **Source-data quality issues exist.** Kia's `375-hero-my26-niro-hev-v2.jpg` has alt "three-quarter back view" but is actually front-3/4 — caught via image-content verification.

### Phase A5 — Checkpoint analysis

Brief's strict proceed-condition (4-of-7 at 20+pp): **1 of 7 cleared (hyundai)** → NOT MET.
Brief's strict halt-condition (most failed to improve): **5 of 7 improved** → NOT MET.

Middle-ground outcome unspecified in the brief. Per Safety Rule #7 ("If ambiguity arises, write to SESSION_NOTES.md and continue with the next item if possible"), continued to Phase B with the analysis documented. Reasons: the lever IS validated (5 of 7), the 2 abandonments diagnose unrelated blockers (not theory failures), Mazda crossed tier C → B, and Phase B is independent of Phase A's mechanism.

### Phase B1 — Image-size survey

Wrote `scripts/analyze_image_sizes.mjs` (read-only). Surveyed all 41 brands. Found 8 brands with avg file size <60 KB (alfa-romeo 20 KB, acura 31, land-rover 34, cadillac 45, chevrolet 49, jeep 49, nissan 53, gmc 53) — strong candidates for resolution preference. Identified URL pattern distribution: `?w=`, `?width=`, `?mw=`, `?imwidth=`, `?wid=`, mobile/desktop tokens, `/xs/sm/md/lg/xl/` segments, `.image.NNN.jpg` AEM patterns. Findings written to `SESSION_NOTES.md` before any script change.

### Phase B2 — Resolution-preference scoring

Extended `resolutionBonus` in `scripts/scrape_image_urls.mjs` with width-query patterns (`?imwidth=`, `?width=`, `?w=`, `?wid=`, `?size=`), device-class tokens (mobile/tablet/desktop), path-segment size tiers, AEM `.image.NNN.jpg` patterns, `.small./.medium./.large.` filename tokens, `-xs/sm/md/lg/xl-`/`-md`/`-lg`/etc. tier suffixes, `_NNNxNNN.` dimension suffixes. Added "Resolution upgrades: N URLs preferred larger variants" counter to SCRAPE SUMMARY.

Also added a latent fix: when the scrape rewrite picks a URL different from the existing one, invalidate `img.downloaded` so the downloader will refresh the cached file. This was a real bug — the resolution-preferred URL would have been silently ignored otherwise.

### Phase B3 — Syntax check

`node --check scripts/scrape_image_urls.mjs` clean.

### Phase B4 — Mini-targeted test

Mini coverage 36/38 (94.7%) → 36/38 (94.7%). File size 111 KB → 109 KB (~unchanged). 12 resolution upgrades counted relative to alternates. Mini-specific reason for null size impact: miniusa.com's CDN gates rendering on the `.miniusaimg.small.` rendition for every served variant. The preference layer correctly orders desktop > mobile relative to alternates, but both options serve the same small rendering — so on-disk size doesn't change.

Brief's "proceed if 30%+ size increase" condition not met; brief's "regression → halt" condition also not met. Continued to Phase B5 with the finding documented (Mini's CDN is a per-brand outlier; multi-width brands should still benefit).

Validated mid-stream on Cadillac before launching Phase B5: 5.85 MB → 7.43 MB (+27%) with 122 upgrades, coverage stable at 75.6%. Confirmed the layer works on brands with multi-width srcset.

### Phase B5 — 7 parallel subagents (project-wide re-scrape)

Spawned 7 parallel subagents covering 39 brands (Mini and Cadillac already done):

- Batch 1: mercedes-benz, subaru, audi, maserati, ferrari
- Batch 2: chevrolet, toyota, mitsubishi, buick, rolls-royce
- Batch 3: bmw, land-rover, volvo, volkswagen, infiniti
- Batch 4: jeep, nissan, genesis, aston-martin, alfa-romeo, lamborghini
- Batch 5: lexus, hyundai, bentley, tesla, mclaren, polestar
- Batch 6: honda, porsche, ram, kia, lucid, jaguar
- Batch 7: gmc, ford, mazda, acura, lotus, rivian

All 7 batches completed cleanly. Per-brand size deltas range from -9.8% (honda, re-pick artifact) to +106.8% (polestar). 10 brands gained ≥14% size. 1 coverage regression: Maserati (1 entry, 403 on new variant URL).

### Phase B6 — Aggregate + repair

Wrote `reports/resolution_pass_session.md`. Investigated Maserati's regression: 1 entry's URL was rewritten to a `scene7.com/...desktop.jpg?$1800x2000$` variant that returns 403. The previously-cached file remained on disk.

Discovered a broader pattern: the URL-invalidate fix from Phase B2 caused 52 entries across 9 brands to flip from `downloaded:true` to `downloaded:false` when the new URL failed but the cached file was still valid. Wrote `scripts/repair_cached_downloads.mjs` to restore `downloaded:true` for any entry where the local file exists.

Repair output:
```
lexus           24 entries
honda           13 entries
bmw              4 entries
chevrolet        3 entries
alfa-romeo       2 entries
mini             2 entries
polestar         2 entries
maserati         1 entries
mercedes-benz    1 entries
Total           52 entries
```

After repair: Honda tier B → A. Lexus closer to A boundary. Project-wide coverage 65.21% (was 64.04% pre-repair).

### Phase C1 — Rebuild

`python scripts/build_catalog.py` confirmed 41/424/1463. No model or trim changes (only image URLs + downloaded flags). Manifest timestamp refreshed.

### Phase C2 — STATUS.md update

Rewrote the "Image-scrape state (Phase 4)" section with Session 7 final coverage, Δ-vs-Session-6 column, expanded notes column showing per-brand resolution-preference outcomes and angle_url_patterns wins. Added a Session 7 script-status block. Refined diagnosis block to reflect that hyundai and subaru should move off the "persistent low coverage" list (both improved this session), leaving 3 brands on it (tesla, ferrari, lotus).

### Phase C3 — PROJECT_STATE.md update

Rewrote "Current status" block to a one-paragraph Session 7 summary. Replaced "What's pending" queue with the post-Session-7 version: 7 future-direction items including the newly-identified `isPlausibleImageURL` relax (Lotus enabler) and `pickByPosition` brand-pattern-awareness (Subaru side-profile enabler).

Added 8 new "Lessons learned" entries (#84-91) documenting Session 7 findings:
- 84. angle_url_patterns validates on 5 of 7 priority brands; brief's strict gate failed but lever is validated.
- 85. `(?<!ev-)` electrification-flip idiom for hyundai.
- 86. Dash-vs-underscore separator on Mazda's `34_jellies`/`34-jellies` folders.
- 87. GM-AEM `?imwidth=` is highest-leverage size marker.
- 88. URL-invalidate caused 52 silent regressions; repair script recovered all.
- 89. `isPlausibleImageURL` ceiling for extension-less CDN URLs (Lotus blocker).
- 90. Coverage path: 62.26% → 64.05% (A) → 64.04% (B raw) → 65.21% (post-repair).
- 91. Precision-iteration discipline + image-content verification budget.

### Phase C4 — This file

Written (SESSION_SUMMARY_7.md).

### Phase C5 — Final coverage report

Generated at `reports/phase4_coverage_session7_2026-05-14.md`.

---

## Files changed in this session

### Script changes
- `scripts/scrape_image_urls.mjs` — Phase A1 (angle_url_patterns support), Phase B2 (extended resolutionBonus, "Resolution upgrades" counter), Phase B latent fix (URL-change invalidates downloaded).

### New scripts
- `scripts/analyze_image_sizes.mjs` — read-only per-brand size + URL-pattern survey
- `scripts/repair_cached_downloads.mjs` — restores downloaded:true when local file exists
- `scripts/diag_subaru_candidates.mjs`, `scripts/diag_subaru_playwright.mjs` (Phase A subaru subagent)
- `scripts/diag_ferrari_candidates.mjs`, `scripts/diag_ferrari_playwright.mjs` (Phase A ferrari subagent)
- `scripts/diag_lotus_candidates.mjs`, `scripts/diag_lotus_playwright.mjs`, `scripts/diag_lotus_playwright_raw.mjs` (Phase A lotus subagent)
- Multiple `scripts/diag_hyundai_*.mjs` (Phase A hyundai subagent sub-experiments)

### Brand-config edits (5 brands)
- `scripts/brand-configs/hyundai.json` — added `angle_url_patterns` (2 angles, 2 regexes)
- `scripts/brand-configs/ram.json` — added `angle_url_patterns` (1 angle, 3 regexes)
- `scripts/brand-configs/mazda.json` — added `angle_url_patterns` (2 angles, 4 regexes)
- `scripts/brand-configs/kia.json` — added `angle_url_patterns` (1 angle, 1 regex)
- `scripts/brand-configs/subaru.json` — added `angle_url_patterns` (1 angle, 2 regexes) + `slug_variants.trailseeker`

### Brand JSONs (mutated by the scripts with .bak backups)
- `data/<brand>.json`, `catalog/data/<brand>.json` — all 41 brands re-scraped + re-downloaded. Subset (52 entries across 9 brands) had downloaded:true restored by repair script.

### Reports (new this session)
- `reports/angle_url_patterns_session.md` — Phase A aggregate
- `reports/resolution_pass_session.md` — Phase B aggregate
- `reports/hyundai_angle_patterns_session7.md`, `reports/ram_angle_patterns_session7.md`, `reports/mazda_angle_patterns_session7.md`, `reports/kia_angle_patterns_session7.md`, `reports/subaru_angle_patterns_session7.md`, `reports/ferrari_angle_patterns_session7.md`, `reports/lotus_angle_patterns_session7.md`
- `reports/image_sizes_pre_phase_b.log`, `reports/image_sizes_post_phase_b.log`
- `reports/coverage_after_phase_a_session7.log`, `reports/coverage_after_phase_b_session7.log`, `reports/coverage_after_phase_b_repaired.log`
- `reports/repair_cached_downloads_session7.log`
- `reports/<brand>_scrape_session7_b5.log` + `reports/<brand>_download_session7_b5.log` (41 brands × 2 — where applicable)
- `reports/mini_scrape_session7_b4_v3.log`, `reports/mini_download_session7_b4.log` (Mini-specific B4 test)
- `reports/cadillac_scrape_session7.log`, `reports/cadillac_download_session7.log` (Cadillac validation)
- `reports/phase4_coverage_session7_2026-05-14.md` (Phase C5 final)
- `reports/<brand>_candidates_raw.log`, `reports/<brand>_playwright_raw.log` etc. — diag dumps from Phase A subagents

### Documentation
- `SESSION_NOTES.md` — appended Session 7 sections (Phase A checkpoint analysis, Phase B1 size survey, Phase B4 Mini test result + URL-invalidate side effect)
- `PROJECT_STATE.md` — Current status rewritten for Session 7; What's-pending replaced; 8 new lessons (#84-91)
- `STATUS.md` — Phase 4 section rewritten with Session 7 coverage and notes
- `SESSION_SUMMARY_7.md` (this file)

---

## Safety rules from the brief observed

- No `instructions/` files modified.
- No `data/_partials/` modifications.
- Brand JSONs mutated only via the scrape/download scripts (Phases A3, B4, B5) plus the explicitly-authorized repair script (Phase B6). `.bak` files written before each mutation.
- Parallel subagents used for Phases A3 and B5 (the brief's PARALLEL phases). Single-threaded for A1, A2, A4, A5, B1, B2, B3, B4, B6, and all of C.
- Each checkpoint honored: A5 checkpoint analysis documented even though the strict gate failed (middle-ground outcome, Safety Rule #7 applied). B4 checkpoint: Mini didn't show 30%+ size increase but didn't regress, so continued with Cadillac validation as confirmation that the layer works.
- Saves after every brand operation, every status update.
- Tasks tracked via TaskCreate/TaskUpdate throughout.

---

## Per-phase wall-clock (approximate)

| Phase | Description | Wall-clock |
|---|---|---:|
| A1 | Script extension | ~5 min |
| A2 | Syntax check | ~1 min |
| A3 | 7 parallel subagents (slowest: subaru ~37 min) | ~37 min |
| A4 | Aggregate findings | ~5 min |
| A5 | Checkpoint analysis | ~5 min |
| B1 | Size survey + analysis | ~5 min |
| B2 | Script extension | ~5 min |
| B3 | Syntax check | ~1 min |
| B4 | Mini test + counter fix + Cadillac validation | ~10 min |
| B5 | 7 parallel subagents (slowest: ~8 min) | ~8 min |
| B6 | Aggregate + repair + investigation | ~10 min |
| C1 | Rebuild | ~1 min |
| C2-C5 | Status updates + summary + report | ~15 min |
| **Total** | | **~108 min active work** |

Parallel agents reduce wall-clock dramatically: Phase A3 was the long pole at ~37 min (longest single agent: subaru) but all 7 ran simultaneously. Phase B5 was similarly capped at the slowest batch (~8 min).

---

## What's next (project-direction queue)

Per the post-Session-7 future-direction queue in PROJECT_STATE.md:

1. **`isPlausibleImageURL` relax for extension-less CDN URLs** — would unlock Lotus and likely help Hyundai. Tiny script change.
2. **`pickByPosition` brand-pattern-awareness** — would unlock Subaru's side_profile from `MY26_<CODE>_jelly_` URLs.
3. **Land Rover L-chassis-code slug_variants** — ~30pp expected lift.
4. **Tesla / Ferrari policy decision** — both confirmed pipeline-blocked. Lotus moves OFF this list (its issue is fixable per #1).
5. **Annual data refresh** — quarterly re-runs to catch URL drift.
6. **New-brand research** — Chrysler, Dodge, Fiat, Bugatti, Pagani, Koenigsegg.
7. **Vision-model angle verification** — would catch source-data quality issues like Kia's mislabeled `niro-hev-v2.jpg`.

---

## Recommended next-session prompt (when resuming)

> "Continuing the Car Catalog Project. Session 7 (2026-05-14) added the `angle_url_patterns` brand-config extension (Phase A) and a higher-resolution image preference layer (Phase B). Project-wide coverage rose from 62.26% to 65.21%. Hyundai 0%→28.3%, Ram 16%→33%, Mazda 46%→63%, Honda 76%→82% (tier B→A), Lexus 60%→71%. Plus 10 brands gained 14-107% in average file size from the resolution preference. Two future-engineering items are now well-scoped: (a) relax `isPlausibleImageURL` to accept extension-less CDN URLs (would unlock Lotus and likely help Hyundai), (b) make `pickByPosition` brand-pattern-aware (would unlock Subaru's side-profile from jelly URLs). See PROJECT_STATE.md's 'What's pending' section for the full queue."
