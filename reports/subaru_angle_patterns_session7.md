# Subaru Phase-A3 angle_url_patterns investigation — 2026-05-14 (session 7)

## Headline

| | before | after |
|---|---:|---:|
| Coverage (images downloaded / 131 entries) | 9 (6.9%) | **12 (9.2%)** |
| Image entries rewritten by scraper | 9 (all `[pos]`) | **12 (9 `[pos]` + 3 `[B8.0]` brand)** |
| Brand-specific angle matches | 0 | **3** |
| Models with ≥1 success | 2 (BRZ + WRX) | 3 (BRZ + WRX + Trailseeker) |

**Net delta: +3 image entries, +2.3 percentage-points.** All 3 new entries are correctly-angled (front-3/4 lifestyle shots of Trailseeker).

## Root cause(s)

Subaru's images live on `s7d1.scene7.com/is/image/scomv2/`. Three independent structural facts conspire:

1. **3-letter brand codes in URLs.** Subaru's CDN filenames use codes — `OBK`, `CTK`, `FOR`, `BRZ`, `WRX`, `SOL`, `TSK`, `UNC`, `ASC`, `IMP` — instead of the consumer-site slug. Without slug_variants the scraper's slug filter rejects 100 % of candidates for 8 of 10 models. Only BRZ and WRX self-match (their 3-letter codes coincide with their slugs); that's the only reason Phase C produced 9 successes.

2. **Extension-less Scene7 URLs.** Scene7 serves transformed images via query-string syntax (`?$2000w$`, `?$1600wa$`) without a file extension. The production extractor's `isPlausibleImageURL` requires `\.(jpe?g|png|webp|avif)` on the pathname, so the `<img src="…26_TSK_overview_hero_lg_xl?$2000j$" alt="A 2026 Subaru Trailseeker in blue drives down an arid hill.">` tag is **rejected** at the `push(…)` helper. Only `<source srcset>` entries survive (the `<img srcset>` and `<source srcset>` loops in `extractCandidates` bypass `isPlausibleImageURL` — pre-existing behavior). `<source>` candidates carry no alt text, so slug-matching cannot leverage the model name when it appears in the alt of the rejected `<img>`. This is why Trailseeker pages return 0 slug-matching candidates even though every hero `<img>` says "Trailseeker" in alt.

3. **`MY26_<code>_jelly_3247x1224` is side_profile, not front-3/4.** I downloaded and visually inspected every Subaru jelly (BRZ/WRX/OBK/FOR/CTK/SOL/ASC/IMP/UNC): all are studio cut-outs in **orthogonal side view** on white. The 9 existing Phase-C "successes" routed all of these into `front_three_quarter` slots via the positional fallback (it picks the largest visible image near the top of the page). They are wrong-angle, mislabeled as front-3/4.

## Diagnostic scripts

- `scripts/diag_subaru_candidates.mjs` — static-fetch dump (writes `reports/subaru_candidates_raw.log`). Confirms static fetch returns 0 candidates for all 10 pages (as the Phase-C log already noted); subaru.com is fully JS-rendered.
- `scripts/diag_subaru_playwright.mjs` — Playwright-rendered dump (writes `reports/subaru_candidates_rendered.log`). Replays the production `extractCandidates()`, overlays the 3-letter codes onto `slug_variants` so we can see the slug-matching candidate set as the scraper would see it if the codes were configured.

## Patterns derived

Edited `scripts/brand-configs/subaru.json` to add (preserving all existing fields):

**`slug_variants`** — only for Trailseeker (intentional restraint, see *Trade-offs* below):
```json
"slug_variants": { "trailseeker": ["trailseeker", "tsk"] }
```

**`angle_url_patterns`**:
```json
"angle_url_patterns": {
  "front_three_quarter": ["_overview_hero", "_hero_md_sm"]
}
```

Each pattern justified:

| Angle | Pattern | Justification |
|---|---|---|
| `front_three_quarter` | `_overview_hero` | Matches Trailseeker's `26_TSK_overview_hero_lg_xl`. Visually confirmed: clean front-3/4 lifestyle shot of a blue Trailseeker on a desert trail. No other Subaru model uses this token. |
| `front_three_quarter` | `_hero_md_sm` | Matches Trailseeker's `609_26_TSK_hero_md_sm` (the mobile/tablet variant of the same hero). Visually confirmed: same front-3/4 composition. |

That's it — 2 patterns, both for front_three_quarter, both Trailseeker-only.

## Angles intentionally left empty

Per the brief's "precision over recall" guidance:

| Angle | Why empty |
|---|---|
| `side_profile` | I HAVE a precise pattern — `_jelly_\d+x\d+` is true side_profile across 8 of 10 models — **but the production iteration order prevents it from taking effect.** The script iterates `trim.images` in declared order (front → rear → side → interior). For front_three_quarter, `pickBestForAngle` returns null (no English match, no brand match without `_jelly_` for front), then `pickByPosition` fires and picks the jelly (largest visible img near top). The jelly is then in `used`, so when side_profile's brand-pattern pass tries `_jelly_`, the candidate is excluded. The pattern would never fire. Adding it would be dead code. The correct fix is a `scrape_image_urls.mjs` change to teach `pickByPosition` about brand patterns (so it excludes URLs that would brand-match a non-target angle) — explicitly out of scope per the brief's "DO NOT modify scrape_image_urls.mjs". |
| `rear_three_quarter` | No reliable URL token. I sampled `26_<CODE>_gallery_N` and `feature_N` across 5 models — for Outback `feature_2` is rear-direct, for WRX `gallery_1` is rear-3/4, for Forester `feature_4_1` is rear-3/4. Position varies per page; no single token reliably means "rear". |
| `interior_dashboard` | `feature_3` is dashboard for BRZ and WRX (sport cars) but cargo-interior for Outback / Forester (SUVs) and a digital-cluster closeup for Solterra. Inconsistent. |

## Trade-offs considered

**Why slug_variants only for Trailseeker, not all 10 models?**

Adding slug_variants for all 10 would unlock `pickByPosition` for the 7 other models that currently see 0 candidates because their URLs use 3-letter codes the slug filter rejects. The largest-visible-near-top image is the same `MY26_<CODE>_jelly` (side-profile cut-out) for all of them. The result would be ~+45 entries filled — **all wrong-angle, all jelly-images routed into front-3/4 slots.** The brief explicitly says "a wrong match is worse than a miss," so I limited slug_variants to Trailseeker (which uses my new brand pattern to fill its front-3/4 with the actually-correct overview_hero shot, not the jelly — Trailseeker has no jelly because it's an all-new 2026 nameplate).

This decision matches the Hyundai Phase-3 precedent (session 6): when the angle filter can't honestly resolve an angle, leave the slot empty rather than scatter wrong-angle images.

**Why not add `_jelly_` for side_profile anyway?**

See above — the iteration order prevents it from taking effect. Adding it would be reassuring documentation but would not change any pixel on disk. I left it out so the config reflects only patterns that actually fire.

## False-positive risks considered

- `_overview_hero` is unique to Trailseeker among the 10 Subaru pages probed. Future Subaru models adopting the same naming would inherit a front-3/4 assumption. If a hypothetical future Subaru's `_overview_hero` shot were ever a different angle, this would misfire — low likelihood given Subaru's consistent marketing convention, but flagged.
- `_hero_md_sm` is also Trailseeker-only today; same risk profile.
- Neither pattern matches `_jelly_`, `_feature_N`, `_gallery_N`, `_compare_fma`, or `_vehcard` — the dominant Subaru URL token classes. Zero collision with non-front content.

## Re-run results

```
node scripts/scrape_image_urls.mjs --brand subaru  →  reports/subaru_scrape_session7.log
node scripts/download_images.mjs   --brand subaru  →  reports/subaru_download_session7.log
```

Scrape summary:
- Pages attempted: 10  (all escalated to Playwright; same as session 5)
- Image entries rewritten: 12 (was 9)
  - via text/URL pattern match: 0
  - **via brand-specific angle: 3** (Trailseeker premium/limited/touring, all front_three_quarter, scored `[B8.0]` = brand-pattern total 8.0 after resolutionBonus + weight factors)
  - via positional fallback: 9 (unchanged BRZ + WRX)

Download summary:
- 12 / 131 = **9.2 % coverage** (was 9 / 131 = 6.9 %)
- 3 Trailseeker front_three_quarter entries now resolve from `26_TSK_overview_hero_lg_xl` and `609_26_TSK_hero_md_sm`. All 3 trims share `trim_family: "trailseeker"` so they map to the same on-disk file (`catalog/images/subaru/trailseeker/trailseeker/front-three-quarter.jpg`) — the catalog's normal family-sharing behavior.
- 119 entries continue to fail (`wrong-content-type text/html` — the canonical subaru.com page URL fallback for unresolved entries).

## Tokens seen but couldn't confidently map

Across all 5 representative pages and 3 detail pages I inspected, these tokens have **plausible but unstable** angle correlations — strong on some models, wrong on others. Not adding them to `angle_url_patterns`.

| Token | Angle hypothesis | Why rejected |
|---|---|---|
| `_feature_1` | front_three_quarter | True for OBK/FOR/WRX/BRZ/CTK; false for Solterra (digital-cluster closeup). |
| `_feature_3` | interior_dashboard | True for WRX, BRZ; false for OBK (cargo interior), FOR (cargo interior), SOL (sensor closeup), CTK (rear with people). |
| `_feature_4` / `_feature_4_1` | rear_three_quarter | True for FOR; not generalizable. |
| `_gallery_N` | (varies) | No consistent angle across N across models. |
| `_compare_fma` / `_compare_104_fma` | (none) | These are extreme close-ups (front-fascia detail or rear-badge detail), not full vehicle angles. Not usable for any of the 4 required slots. |
| `_vehcard` / `_vehiclecard_` | front_three_quarter (thumbs) | Reliably front-3/4 thumbnails BUT served at 350-650 px wide — under the `natW >= 800` floor `pickByPosition` enforces, and likely too small for catalog use even if matched. |
| `_K7X_360e_NNN` / `_YFA_360e_NNN` | (rotational frames) | 36-frame 360-degree rotational sets; no single frame reliably represents any of the 4 angles. |

## Files touched this session

- `scripts/brand-configs/subaru.json` — added `slug_variants` (trailseeker only) and `angle_url_patterns` (2 front-3/4 patterns). Notes expanded to record the 3-letter-code finding, the extension-rejection finding, the jelly-is-side-profile finding, and the iteration-order limitation.
- `scripts/diag_subaru_candidates.mjs` — new (static-fetch demonstrator).
- `scripts/diag_subaru_playwright.mjs` — new (rendered-DOM dump, replays production extractCandidates with overlay slug_variants).
- `reports/subaru_candidates_raw.log` — static dump.
- `reports/subaru_candidates_rendered.log` — rendered dump.
- `reports/subaru_scrape_session7.log` — scrape re-run.
- `reports/subaru_download_session7.log` — download re-run.
- `reports/subaru_angle_patterns_session7.md` — this report.

Data JSONs (`data/subaru.json`, `catalog/data/subaru.json`) were rewritten by the scraper. Backup `.bak` files written before mutation per the script's normal safety behavior.

## Recommendation

**Keep** the change as-is. It's small, precise (zero added false positives), adds 3 correctly-angled entries (Trailseeker), and documents the structural findings for future sessions.

**Refine** path forward (script-level work needed, NOT for this session):

1. **Teach `pickByPosition` about brand patterns.** Add a check: when scoring a candidate for `front_three_quarter`, exclude it if `brandAngleScore(other_angle, …)` matches for `side_profile` / `rear_three_quarter` / `interior_dashboard`. This would let `_jelly_\d+x\d+` for side_profile take effect — the jelly would be excluded from front-3/4 positional fallback, then claimed by side_profile's brand-pattern pass. Estimated additional lift: 8 of 9 models gain a correctly-angled side_profile entry (Trailseeker has no jelly). Net +~8 correct entries; the 9 BRZ/WRX front-3/4 entries become side_profile entries (still correct, different slot).

2. **Relax `isPlausibleImageURL` for Scene7 URLs** OR teach the extractor to preserve alt-context when an `<img>` is rejected but its URL appears in a `<source srcset>`. This would let alt-text slug-matching work for Subaru (e.g. Trailseeker's "A 2026 Subaru Trailseeker…" alt would unlock candidates without needing `slug_variants: ["tsk"]`).

3. **Once step 1 lands**, add to `subaru.json`:
   - `slug_variants` for all 10 models with their 3-letter codes
   - `angle_url_patterns.side_profile`: `["_jelly_\\d+x\\d+"]`

Estimated combined lift after refinement: ~9.2 % → ~30 % (side_profile coverage for 8 models, plus the 3 trailseeker fronts already won, plus existing 9 BRZ/WRX fronts re-routed to side).

**Abandon** is not warranted; even the modest +2.3 pp from this session is honest gain. Subaru's structural challenges are now well-characterized — a single targeted script change unlocks substantial additional coverage. The brand belongs in the "improvable with script work" bucket, not the "structurally unscrapeable" bucket alongside Tesla / Ferrari / Lotus.
