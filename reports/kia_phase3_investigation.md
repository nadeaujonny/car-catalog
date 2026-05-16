# Kia Phase 3 Investigation — Image Scrape Coverage (session 6)

Date: 2026-05-14. Task: lift kia coverage from 15.6% (10/64) via slug_variants additions.

Catalog: 16 models, 64 image entries (4 angles per model trim).

## Headline

| Metric | Before | After | Delta |
|---|---:|---:|---:|
| Downloads (kia) | 10 / 64 | **11 / 64** | +1 |
| Coverage % | 15.6% | **17.2%** | +1.6 pp |
| Total slug-matching candidates across 16 pages | 10 rewritten | **218** slug-matching (sum of 16 pages, up from 10 total matched) | ~+21x slug-match yield |
| Image entries rewritten (scrape) | 10 | 11 | +1 |

The slug_variants additions WORK — slug-matching candidates went from a sum of 10 across all 16 pages to 9–22 per page (200+ total). But scraper rewrites moved only from 10 to 11 because the angle-pattern matcher (`ANGLE_PATTERNS` in `scripts/scrape_image_urls.mjs`) is now the binding constraint, not the slug match. The brief scoped this task to slug_variants only ("Conservative on shared script"), so we did not touch angle patterns.

## Diagnosis

### Step 1: dump candidates

Wrote `scripts/diag_kia_candidates.mjs` (modelled on `diag_mercedes_candidates.mjs`). Dumped raw candidates from 7 representative kia.com pages: sorento, k5, ev6, sorento-hybrid, k4-hatchback, niro-hybrid, carnival-hybrid. Output: `reports/kia_candidates_raw.log` (524 lines).

Per-page raw counts (kia.com static fetch):

| page | raw | unique | pre-fix matched | post-fix matched (logical) |
|---|---:|---:|---:|---:|
| sorento | 57 | 57 | 18 | 18 |
| k5 | 83 | 63 | 10 | 10 |
| ev6 | 86 | 66 | 14 | 14 |
| sorento-hybrid | 52 | 52 | 4 | **9** |
| k4-hatchback | 71 | 67 | 14 | 14 (also adds k4hb) |
| niro-hybrid | 53 | 53 | 17 | **17** but now correctly scoped (was over-matching niro-ev imagery) |
| carnival-hybrid | 82 | 62 | 2 | **14** |

### Step 2: analysis — why the match gap

Kia's image CDN renames hybrid/PHEV variants for asset storage. The catalog slugs are descriptive English ("sorento-hybrid", "carnival-hybrid"); the CDN folders use the manufacturer's internal abbreviations:

| catalog slug | CDN folder token | URL example |
|---|---|---|
| `sorento-hybrid` | **`sorento-hev`** | `/vehicles/sorento-hev/2026/mep/global-hero/375-hero-my26-sorento-hev.jpg` |
| `sportage-hybrid` | **`sportage-hev`** | `/global-header/...kia-sportage-hev-mm-large-desktop-static.png` |
| `niro-hybrid` | **`niro-hev`** | `/vehicles/niro/2026/mep/global-hero/1920-hero-my26-niro-hev.jpg` |
| `carnival-hybrid` | **`carnival-hev`** and **`carnival-mpv-hybrid`** | `/vehicles/carnival-mpv-hybrid/2026/_jcr_content/...my26-carnival-hev-...` |
| `k4-hatchback` | **`k4hb`** (in nav PNGs) and `k4-hatchback` (in main CDN dam paths) | `/sedan-hatchback/k4hb-mm-large-desktop-static.png` |

`-phev` was already in the config for sportage and sorento. The fix here was:
1. Adding the `-hev` variants for all four hybrid models.
2. Adding `carnival-mpv-hybrid` (the new MEP-page URL path token).
3. Adding `k4hb` for K4 Hatchback nav imagery.
4. Adding `carnival-mpv` to the `carnival` slug to recover non-hybrid carnival nav imagery.
5. **Removing the bare `niro` variant from niro-hybrid** — it created a collision: `kia-niro-ev-mmm-large-desktop-static.png` (alt "Kia Niro EV") would match a bare `niro` variant via the boundary `kia-niro-ev` -> `(/_-)niro(/_-)` regex. Confirmed via unit tests; without removal niro-hybrid would consume niro-ev's nav imagery on the niro page.

### Step 3: apply — `scripts/brand-configs/kia.json`

Added/changed slug_variants:

- `k4-hatchback`: + `k4hb`
- `carnival`: + `carnival-mpv` (was relying on bare `carnival` only)
- `sportage-hybrid`: + `sportage-hev`
- `sorento-hybrid`: + `sorento-hev`
- `carnival-hybrid`: + `carnival-mpv-hybrid`, + `carnival-hev`
- `niro-hybrid`: + `niro-hev`, − `niro` (collision)

K5/K8 collision: K8 is not sold in the US — only K4, K4-hatchback, and K5 in the catalog. No collision risk because `k5` won't match `k4` (different terminal token between separators). Verified.

EV6/EV9 collision: ditto. The slug-match regex uses anchored boundaries, so `ev6` vs `ev9` is naturally exclusive.

The shared scrape script (`scripts/scrape_image_urls.mjs`) was NOT modified, per brief.

### Step 4: re-run

```
node scripts/scrape_image_urls.mjs --brand kia   # reports/kia_scrape_session6.log
node scripts/download_images.mjs --brand kia     # reports/kia_download_session6.log
```

Scrape: 11 entries rewritten (was 10). Slug-matching candidates per page jumped from 0-10 to 9-22, but only 1 new candidate had the angle keyword needed to be picked — `my26-carnival-hev-performance-discover-the-hybrid-way.jpeg` (alt "three-quarter driver's-side view") → carnival-hybrid/lxs/side_profile.

Download: 11/64 succeeded. 53 entries still pointed at the model page URL (e.g. `https://www.kia.com/us/en/k4`) and returned `content-type: text/html`.

## Why coverage only ticked up by 1

The slug-match gap was fixed. The remaining failure mode is the **angle-pattern gap** — `ANGLE_PATTERNS` in `scrape_image_urls.mjs` looks for English angle words (front, rear, side, dashboard, profile, etc.) in `url + alt`. Kia's main MEP-hero CDN URLs encode no angle: e.g. `1920-hero-my26-sorento-hev.jpg`, `kia-hero-v2375-hero-myxx-vehicle.jpg`, `my26-k5-mep-hero-v2:XXL`. Where Kia DOES have descriptive alt text it leans on phrases like "three-quarter driver's-side view" (matched as side_profile by the `(?:^|[-_/ ])side(?:[-_ ]|$|\.)` rule, score 7) and "exterior shot of the…" (no angle keyword at all). The fiftyfifty trim-highlight imagery is the most descriptive (alt: "2026 Kia Sorento, three-quarter driver's side view…"), but kia rarely surfaces a clear front/rear/interior phrase.

For 4 of 16 models, the only image that fires an angle-pattern is a side_profile fiftyfifty image (sorento LX, k5 LXS, sportage-PHEV X-Line). The other 3 angles per model end up unresolved → 53 entries pinned at the page URL → 53 HTML responses from the downloader.

**The fix is per-brand: either add Kia-specific angle synonym patterns (e.g. `\bmep[-_]?hero\b`, `\bglobal[-_]?hero\b` → front_three_quarter), or relax `pickByPosition` to fire on Playwright-rendered Kia pages (currently the static fetch returns 14+ slug-matching, well above the 3-threshold, so Playwright never escalates).** Both of those are shared-script changes and explicitly out of scope for this task.

## Files touched

- `scripts/brand-configs/kia.json` — slug_variants additions (above).
- `scripts/diag_kia_candidates.mjs` — new (analogue of diag_mercedes_candidates.mjs).
- `reports/kia_candidates_raw.log` — diagnostic dump.
- `reports/kia_scrape_session6.log` — scrape session log.
- `reports/kia_download_session6.log` — download session log.
- `reports/kia_phase3_investigation.md` — this report.

NOT touched: `instructions/`, `data/_partials/`, `data/kia.json` (auto-modified only by scrape script), `catalog/data/kia.json` (same), `scripts/scrape_image_urls.mjs`.

## Recommended next steps

1. **Angle-pattern relaxation (kia-specific)** — add `\bmep[-_]?hero\b`, `\bglobal[-_]?hero\b`, `\bin[-_]?page[-_]?gallery\b` → front_three_quarter (score ~5–6) to ANGLE_PATTERNS, gated by a kia-only config flag, or shipped globally if regression-tested against other brands.
2. **OR** lift `SLUG_MATCH_ESCALATION_THRESHOLD` to consider angle-matching candidates, not just slug-matching, so Kia pages would escalate to Playwright and the positional fallback could pick the hero image even without an angle keyword.
3. Both options would likely take kia from 17% → 60-80% with no further config work.
