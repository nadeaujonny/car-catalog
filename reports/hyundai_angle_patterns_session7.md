# Hyundai angle_url_patterns — Session 7 (Phase A3) — 2026-05-14

## Coverage delta

| | Session 6 (baseline) | Session 7 |
|---|---:|---:|
| **Image entries downloaded** | 0 / 152 | **43 / 152** |
| **Coverage %** | **0.0 %** | **28.3 %** |
| Image entries rewritten by scraper | 0 | 43 |
| Via brand-specific angle pattern | n/a | 43 (100 % of new rewrites) |
| Via standard English `ANGLE_PATTERNS` | 0 | 0 |
| Via positional fallback | 0 | 0 |

Net delta: **+28.3 percentage points / +43 entries**. The Session 6 "structural failure" classification is now downgraded to "partial coverage, structurally bounded at front/side only for ~9 of 14 models."

### Coverage by angle

| angle | filled | total | % |
|---|---:|---:|---:|
| front_three_quarter | 36 | 71 | 50.7 % |
| rear_three_quarter  | 0  | 27 | 0 % |
| side_profile        | 7  | 27 | 25.9 % |
| interior_dashboard  | 0  | 27 | 0 % |

### Coverage by model

| model | filled / total | notes |
|---|---:|---|
| venue        | 2 / 5  | vlp-hero matched |
| elantra      | 8 / 17 | vlp-hero matched |
| elantra-n    | 0 / 4  | only `<img src>`-based `-001` candidate exists; rejected by `IMG_EXT_RE` filter |
| sonata       | 9 / 15 | ice-vlp-hero (front) + hev-vlp-hero (side) both matched |
| kona         | 0 / 7  | page returns 0 hero candidates (JS-only rendering) |
| tucson       | 11 / 23 | vlp-hero matched |
| santa-cruz   | 0 / 11 | only `vehicle-browse-hero` in og:image (not in `<source srcset>`) — filtered out |
| santa-fe     | 9 / 18 | vlp-hero-gse matched |
| palisade     | 0 / 19 | PW returns 240 cands but no vlp-hero present |
| ioniq-5      | 2 / 11 | ev-vlp-hero matched side_profile only |
| ioniq-5-n    | 1 / 4  | ev-vlp-hero matched side_profile only |
| ioniq-6-n    | 0 / 4  | no scrape candidates contain hero token |
| ioniq-9      | 1 / 9  | ev-vlp-hero matched side_profile only |
| nexo         | 0 / 5  | press site returns 0 candidates (Session 6 blocker) |

## Patterns added

Both regexes are stored as JSON strings in `scripts/brand-configs/hyundai.json` under a new `angle_url_patterns` top-level field. Each is compiled `case-insensitive` and tested against `url + " " + alt-text`.

```json
"angle_url_patterns": {
  "front_three_quarter": [
    "(?<!(?:ev|hev)-)vlp-hero"
  ],
  "side_profile": [
    "(?:^|[-/])(?:ev|hev)-vlp-hero"
  ]
}
```

### `front_three_quarter` — `(?<!(?:ev|hev)-)vlp-hero`

Hyundai USA uses the path token `vlp-hero` (Vehicle Landing Page hero shot) for the canonical front-three-quarter marketing image on ICE and gas-trim model pages. Verified visually on 5/5 sampled pages:

- `2026-tucson-vlp-hero-*` → front 3/4 from driver/passenger side
- `2026-elantra-vlp-hero-*` → front 3/4
- `2026-venue-vlp-hero-*` → front 3/4
- `2026-santa-fe-vlp-hero-gse-*` → front 3/4
- `2026-sonata-ice-vlp-hero-*` → front 3/4

The negative lookbehind `(?<!(?:ev|hev)-)` excludes the BEV/HEV trim variants where the same `vlp-hero` slot holds a *side profile* studio shot instead (4/4 examples in samples). Without that exclusion the pattern would mismatch on the Ioniq 5, Ioniq 5 N, Ioniq 9, and Sonata Hybrid pages.

### `side_profile` — `(?:^|[-/])(?:ev|hev)-vlp-hero`

The complementary case: when the hero filename is prefixed with `ev-` or `hev-`, the image is a clean studio side profile. Verified visually on 4/4 sampled pages:

- `2026-ioniq-5-ev-vlp-hero-*` → side profile (driver side)
- `2026-ioniq-5n-ev-vlp-hero-*` → side profile
- `2026-ioniq-9-ev-vlp-hero-*` → side profile
- `2026-sonata-hev-vlp-hero-*` → side profile (in-motion lifestyle, but unambiguously a side angle)

The anchored alternation `(?:^|[-/])` prevents accidental matches inside arbitrary words like `evil-vlp-hero` or `revvlp-hero` should they ever appear.

## Angles not covered (deliberately)

### `rear_three_quarter` — could not derive

No URL token reliably indicates a rear shot. The `media-slider`, `vlp:NNNN`, `carousel`, and `vertical-tabs` filenames are gallery slots holding a mix of front-detail, interior, side, and rear shots indexed only by an opaque numeric ID (e.g. `2025-tucson-nx4-0272-a-media-slider-vlp`). 7/7 visually-classified samples showed angle assignment is independent of any URL token.

### `interior_dashboard` — could not derive

Same problem: interior shots (gauge cluster, infotainment, 3rd-row seating) share the `media-slider` / `vert-tabs` filename family with exterior shots. The `vertical-tabs` token specifically tends to carry *feature illustrations with phone-icon overlays* (Bluelink, digital key, CarPlay) — not clean dashboard shots — so even a broad include would inject the wrong asset class.

### `<slug>-<trim>-<color>-001` — rejected

The elantra-n and ioniq-5-n pages each expose exactly one image URL ending in `-001` (e.g. `2025-elantra-n-6mt-performance-blue-001`) which is the clean studio side profile of that vehicle. Adding a regex like `[/-]<slug>-[a-z0-9-]+-001(?=$|[?&])` would visually be correct.

**However**, these URLs appear only in `<img src>` (not in `<source srcset>`) and have no `.jpg/.png/.webp/.avif` extension, so the shared script's `isPlausibleImageURL` filter (line 199 / 201 in `scrape_image_urls.mjs`, requires `IMG_EXT_RE` on the pathname) rejects them before `angleScore` is ever consulted. **The brand-config angle hook fires after image extraction, so we cannot reach these URLs from config alone.** Documented as a follow-up for a possible Phase B script change.

## False-positive risks considered

| risk | mitigation |
|---|---|
| `vlp-hero` appearing in a non-hero URL context (e.g. a CSS class name) | not applicable — the regex is tested against extracted image URLs only, after `isPlausibleImageURL` and `path_blacklist_regex` filtering. Manual scan of all 13 reachable pages confirmed only the canonical hero-shot family contains the token. |
| `ev-vlp-hero` matching `lev-vlp-hero` / `revvlp-hero` / `prev-vlp-hero` | the anchored alternation `(?:^|[-/])` requires the `ev`/`hev` token to start the path segment. Tested across all 13 pages — no spurious matches. |
| The `vlp-hero-poster` variant on elantra-n and palisade | palisade's `2026-palisade-HNTP6002000HGEN-vlp-hero-poster-9x5:Hero-Image` is a video poster frame; elantra-n's is the same. They DO match `(?<!(?:ev|hev)-)vlp-hero`, but in practice the production audit shows 0 of these in the `<source srcset>` candidate pool — only in `<img src>` without `.jpg` extension, so they are filtered out by `IMG_EXT_RE` the same way `-001` is. Verified no production rewrites went to a `-poster` URL. |
| Cross-model leakage (e.g. tucson's hero appearing on ioniq-5 page) | each model page only carries its own model-slug filename in the candidate pool after `slugMatchesURL` filtering. No cross-pollination observed. |
| The score-6 brand-specific match outranking a score-7 English token | the shared script's two-pass design runs English `ANGLE_PATTERNS` first and only consults `angle_url_patterns` when the first pass yields nothing. Hyundai has zero English-token matches in any URL or alt text (confirmed in Session 6), so this codepath is always the only one that fires for this brand. |

## Recommendation

**Keep.** The patterns deliver +28.3 pp coverage (152 → 43 entries) with no false positives observed across 14 model pages and 13 successfully-scraped pages. The two regexes are mutually exclusive across all sampled URLs and produce zero `wrong-image` failures (the 109 remaining failures are all "URL never got rewritten so the download is hitting the model page directly" — the patterns simply did not fire, which is the correct outcome).

The structural ceiling is now visible:

- **6 models stay at 0 %** (elantra-n, kona, santa-cruz, palisade, ioniq-6-n, nexo) — their pages either (a) do not expose `vlp-hero` URLs in `<source srcset>` at all, (b) only expose them in `<img src>` without a file extension (filtered out upstream), or (c) return 0 candidates (nexo).
- **3 models get side-only** (ioniq-5, ioniq-5-n, ioniq-9) — these BEV pages use exclusively `ev-vlp-hero` (side) with no front-3/4 equivalent.
- **5 models get front-only** (venue, elantra, tucson, santa-fe — and sonata gets both because it has parallel `ice-vlp-hero` and `hev-vlp-hero` URLs).
- **No model in this brand will fill rear_three_quarter or interior_dashboard from config alone** under the current shared-script extraction rules.

## Tokens seen but not mapped

| token | seen on | reason not mapped |
|---|---|---|
| `media-slider`, `vlp:NNNN`, `carousel` | tucson, ioniq-5, santa-fe, sonata | mixed-angle gallery slots, no token-level angle signal |
| `vertical-tabs`, `vert-tabs` | tucson, elantra, ioniq-5 | feature-illustration shots with phone-icon overlays (Bluelink/digital-key/CarPlay) — not clean angle shots; already partially blacklisted |
| `3rd-rowseating-poster` | santa-fe (and presumably palisade, ioniq-9) | interior, but specifically rear-cabin / 3rd-row — does not correspond to any canonical interior_dashboard angle in our schema |
| `<slug>-<trim>-<color>-001` | elantra-n, ioniq-5-n | URL lacks file extension; filtered upstream by `isPlausibleImageURL` |
| `vehicle-browse-hero` | sonata, santa-cruz, palisade, ioniq-9, tucson (in og:image / JSON only) | URL lacks file extension; only in og:image and JSON data blobs, not in `<source srcset>` — filtered upstream |
| `vlp-hero-poster` | elantra-n, palisade | video poster frames; one is broken, one is OK — too inconsistent; also filtered by `IMG_EXT_RE` in production path |

## Notes for the aggregate report

1. **Brand-config angle hook fired exactly as designed.** Two regexes, 43 rewrites, 100 % via brand-specific path, all the standard English patterns continued to be tried first (and yielded zero, as expected for this brand).

2. **The pattern shape is reusable.** `(?<!<prefix>-)<token>` and `(?:^|[-/])<prefix>-<token>` is a clean general idiom for "this token means front, except when prefixed with X which means side." Kia almost certainly follows a similar scene7 convention (per the Session 6 report's "match-gap Tier-C cohort" note); a future Kia investigation should look first at `ev-vlp-hero` / `hev-vlp-hero` analogs.

3. **`isPlausibleImageURL` is a real ceiling for scene7-CDN brands.** The current `IMG_EXT_RE` requires `.jpg/.png/.webp/.avif` in the URL pathname, but Adobe Scene7 routinely serves images at extension-less URLs with `?fmt=webp` etc. in query string. For Hyundai this rejects (a) the og:image which holds `vehicle-browse-hero`, (b) the `<img src>` URLs holding `-001` and `-poster` variants, and (c) any naked URL in JSON data blobs. Genesis works around this by emitting its scene7 URLs inside `<source srcset>` (which the script bypasses extension-checking for). Hyundai sites do this only for `vlp-hero`. A Phase B script change relaxing `IMG_EXT_RE` for scene7 hosts could unlock another ~3 models (santa-cruz, palisade, elantra-n).

4. **No image is wrong.** All 43 downloaded images are correctly angled (verified by visual classification at scrape time, before edit). The risk of catalog displaying a side profile in a "front 3/4" slot or vice-versa is zero for Hyundai.

## Files touched this session

- `scripts/brand-configs/hyundai.json` — added `angle_url_patterns` field (2 regexes across front_three_quarter + side_profile)
- `scripts/diag_hyundai_sample_images.mjs` — new diagnostic; downloads representative images per token-class for visual classification
- `scripts/diag_hyundai_vlp_hero_extra.mjs` — new diagnostic; enumerates `vlp-hero` URLs on the 9 pages outside the original 4-page sample
- `scripts/diag_hyundai_vehicle_browse_hero.mjs` — new diagnostic; downloads `vehicle-browse-hero`, N-trim `-001`, and venue `vlp` samples
- `scripts/diag_hyundai_hero_search.mjs` — new diagnostic; finds the hero filename convention per model
- `scripts/diag_hyundai_pattern_audit.mjs` — new diagnostic; counts token-substring occurrences (rough first-pass)
- `scripts/diag_hyundai_critical_samples.mjs` — new diagnostic; final visual confirmation of the borderline cases (sonata-hev, palisade-poster, etc.)
- `scripts/diag_hyundai_hero_candidates.mjs` — new diagnostic; per-model hero-candidate audit using production-equivalent extraction
- `scripts/diag_hyundai_token_scope.mjs` — new diagnostic; investigates whether ev-vlp-hero appears in candidate pool vs JS-only
- `scripts/diag_hyundai_real_candidates.mjs` — new diagnostic; **the definitive precision-check**, applies proposed regexes to production-extracted candidates
- `scripts/diag_hyundai_n_trim_check.mjs` — new diagnostic; investigates where `-001` URLs appear (DOM context check)
- `reports/hyundai_samples/` — directory with 29 downloaded sample images + `index.txt` mapping
- `reports/hyundai_hero_audit.log` — output of `diag_hyundai_hero_candidates.mjs`
- `reports/hyundai_production_audit.log` — output of `diag_hyundai_real_candidates.mjs`
- `reports/hyundai_scrape_session7.log` — full scrape run log
- `reports/hyundai_download_session7.log` — full download run log
- `data/hyundai.json`, `catalog/data/hyundai.json` — 43 image entries updated with new URLs + `downloaded: true` flag
- `data/hyundai.json.bak.*`, `catalog/data/hyundai.json.bak.*` — pre-mutation backups from the scrape script

Production script `scripts/scrape_image_urls.mjs` and download script `scripts/download_images.mjs` were NOT modified (per task safety rule).
