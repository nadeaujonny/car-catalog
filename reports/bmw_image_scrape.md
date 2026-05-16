# Image Scrape Report: BMW

**Date:** 2026-05-13
**Brand:** BMW
**Models in JSON:** 30
**Total image entries:** 284

> **Scrape step crashed; download ran on existing Phase 1 URLs.** The scrape script (`scripts/scrape_image_urls.mjs`) is incompatible with brands whose `image.angle` is anything other than the four hardcoded angles (`front_three_quarter`, `rear_three_quarter`, `side_profile`, `interior_dashboard`). BMW has 14 entries on 7 models that use `interior_rear_seats`, `wheel_detail`, `engine_bay`, or `cargo_area`. The script throws `TypeError: ANGLE_PATTERNS[angle] is not iterable` mid-rewrite, which prevents the final `writeFile`, so `data/bmw.json` and `catalog/data/bmw.json` are untouched. The download script processed the unchanged Phase-1 URLs and reached 93.0% coverage. Per spec the scripts were not modified.

---

## Summary

- **Scraped (URLs rewritten):** 0 / 284 (scrape script crashed before writing)
- **Downloaded successfully:** 264 / 284 (93.0%)
- **Download failures:** 20 (all `wrong-content-type` on Phase-1 `needs_scraping` page URLs)
- **Page fetches that did succeed during scrape:** 13 of 30 attempted (17 returned 404/timeout before the crash)

## Scrape results

The scrape attempted 30 model pages from `scripts/brand-configs/bmw.json` and reached the rewrite loop. Mid-rewrite it crashed on the first image entry whose `angle` is not one of the four ANGLE_PATTERNS keys. Because the script writes the JSON only after the loop completes, both `data/bmw.json` and `catalog/data/bmw.json` are byte-identical to their pre-run state.

### Script-level crash (not modifiable per spec)

```
node:internal/process/task_queues:95
    at angleScore (scripts/scrape_image_urls.mjs:233:45)
    at pickBestForAngle (scripts/scrape_image_urls.mjs:243:40)
    at main (scripts/scrape_image_urls.mjs:358:22)
TypeError: ANGLE_PATTERNS[angle] is not iterable
```

`ANGLE_PATTERNS` (lines 186–215) only defines: `front_three_quarter`, `rear_three_quarter`, `side_profile`, `interior_dashboard`. BMW has the following extra angles in `data/bmw.json`:

| Angle              | Count | Models                                                                                |
|--------------------|-------|---------------------------------------------------------------------------------------|
| interior_rear_seats| 11    | x5, x6, x5-m-competition, i7 (×2), ix, plus m5-touring, etc.                          |
| wheel_detail       | 10    | x1, x5 (×2), x6, x6-m-competition, i7, ix                                             |
| engine_bay         | 3     | x5-m-competition, x6-m-competition                                                    |
| cargo_area         | 2     | x1, m5-touring                                                                        |

The script crashed at the first such entry it hit during the rewrite loop. Honda's data uses only the four supported angles, which is why the smoke test passed — this latent script bug only surfaces for brands with richer image coverage.

### Page-fetch results before the crash

`bmwusa.com` returns 404 on most of the URL patterns I derived from the few full URLs already present in `data/bmw.json` (e.g., `bmwusa.com/vehicles/3-series/3-series-sedan/bmw-3-series-sedan.html` works; `bmwusa.com/vehicles/m-series/m3/bmw-m3.html` does not — the canonical path appears to be different for several models). Results:

| Model                | Result        |
|----------------------|---------------|
| 2-series-coupe       | 404           |
| 2-series-gran-coupe  | ok (139 raw)  |
| 3-series             | ok (126 raw)  |
| 4-series-coupe       | ok (115 raw)  |
| 4-series-convertible | ok (125 raw)  |
| 4-series-gran-coupe  | ok (135 raw)  |
| 5-series             | ok (125 raw)  |
| 7-series             | 404           |
| x1                   | ok (145 raw)  |
| x2                   | 404           |
| x3                   | ok (149 raw)  |
| x5                   | ok (153 raw)  |
| x6                   | ok (145 raw)  |
| x7                   | ok (161 raw)  |
| alpina-xb7           | 404           |
| xm                   | ok (171 raw)  |
| z4                   | 404           |
| m2                   | 404           |
| m3                   | 404           |
| m4-coupe             | ok (236 raw)  |
| m4-convertible       | timeout       |
| m5-sedan             | 404           |
| m5-touring           | ok (196 raw)  |
| x5-m-competition     | 404           |
| x6-m-competition     | 404           |
| i4                   | 404           |
| i5                   | ok (149 raw)  |
| i7                   | 404           |
| ix                   | 404           |
| ix3                  | 404           |

13 of 30 model URLs returned content; 16 returned 404; 1 timed out. The URLs were derived from the patterns observable in the BMW JSON's existing Phase-1 page-URL placeholders, but bmwusa.com's actual current paths vary by model (some use `/vehicles/<series>/<body>/bmw-<slug>.html`, others `/vehicles/<series>/<body>/bmw-<slug>-overview.html`, and the M-series and i-series subpaths differ from what the patterns suggest). The crash bypassed the URL question entirely — even with 100% page-fetch success, the script would have crashed on the first non-standard angle.

## Download results

Because the scrape did not write, the download script saw the Phase-1 URLs untouched: 264 of 284 entries already held direct `bmw.scene7.com` or `mediapool.bmwgroup.com` CDN URLs from research time; the remaining 20 held `bmwusa.com` page-URL placeholders flagged `needs_scraping: true`.

```
Total attempted: 284
Successful:      264 (93.0%)
Failed:          20
```

**Failed by HTTP status:** none.

**Failed by error kind:**

| Kind                | Count |
|---------------------|-------|
| wrong-content-type  | 20    |

All 20 failures are `wrong-content-type (text/html; charset=utf-8)` — the Phase-1 page-URL placeholders for the `needs_scraping` entries, hit verbatim by the downloader. Representative URL: `https://www.bmwusa.com/vehicles/2-series/bmw-gran-coupe/bmw-2-series-gran-coupe.html`.

**Models with zero successful downloads:** 0 of 30. Every model has at least one successful image. Per-model breakdown:

| Model | Downloaded / Total | % |
|---|---|---|
| 2-series-coupe | 17/17 | 100% |
| 2-series-gran-coupe | 4/12 | 33% |
| 3-series | 6/11 | 55% |
| 4-series-coupe | 10/10 | 100% |
| 4-series-convertible | 10/10 | 100% |
| 4-series-gran-coupe | 13/13 | 100% |
| 5-series | 11/13 | 85% |
| 7-series | 14/14 | 100% |
| x1 | 10/10 | 100% |
| x2 | 9/9 | 100% |
| x3 | 9/11 | 82% |
| x5 | 17/17 | 100% |
| x6 | 10/10 | 100% |
| x7 | 8/8 | 100% |
| alpina-xb7 | 4/4 | 100% |
| xm | 4/5 | 80% |
| z4 | 9/9 | 100% |
| m2 | 4/4 | 100% |
| m3 | 11/11 | 100% |
| m4-coupe | 7/7 | 100% |
| m4-convertible | 6/6 | 100% |
| m5-sedan | 4/4 | 100% |
| m5-touring | 4/5 | 80% |
| x5-m-competition | 6/6 | 100% |
| x6-m-competition | 6/6 | 100% |
| i4 | 12/12 | 100% |
| i5 | 8/9 | 89% |
| i7 | 13/13 | 100% |
| ix | 14/14 | 100% |
| ix3 | 4/4 | 100% |

The 20 failures concentrate on: 2-series-gran-coupe (8), 3-series (5), 5-series (2), x3 (2), xm (1), m5-touring (1), i5 (1).

## Recommendations

- **Fix the script's angle-handling bug before running other multi-angle brands.** `pickBestForAngle` should treat an undefined `ANGLE_PATTERNS[angle]` as "skip this entry, leave the URL unchanged" rather than crashing. Two-line fix: `if (!ANGLE_PATTERNS[angle]) return null;` at the top of `pickBestForAngle`. Without this fix, Mercedes-Benz (4 `interior_rear_seats` + 1 `cargo_area`) will hit the same crash; every brand with richer image coverage than Honda is at risk.

- **Re-derive the BMW model_pages with verified URLs.** 16 of my 30 URL guesses 404'd. The bmwusa.com URL structure is inconsistent across model families (M-series, X-series, and i-series all use different sub-path conventions), so a hand-verified pass through bmwusa.com or a sitemap-driven discovery would be more reliable than pattern-extrapolation. Alternatively, `press.bmwgroup.com/usa` photo-compilation URLs (already used for the `xm` entry in the JSON) tend to yield much higher candidate counts and could be the primary source for several models.

- **Coverage is already good without scrape rewrites.** 93% from Phase-1 URLs is acceptable for shipping; the 20 remaining gaps are concentrated in 7 models. Even a fixed scrape + corrected URLs is unlikely to recover all 20 since some Phase-1 placeholders correspond to trims that genuinely lack a separate gallery (e.g., 2-series gran coupe `228-gran-coupe` entries inherit from the M235i gallery on press.bmwgroup.com).

- **No CDN gating observed.** Both `bmw.scene7.com` and `mediapool.bmwgroup.com` returned 264 images with 0 status errors and 0 timeouts. BMW's CDN access is friendly to the script's User-Agent. The brand is not in the same category as Mercedes/Audi.

## Notes

- The script's idempotent reset (lines 281–289) would have wiped the existing direct-CDN URLs and replaced them with the bmwusa.com page URL for every entry — including all 264 already-resolved ones — *before* the rewrite loop. If the script had reached `writeFile`, BMW's coverage would have crashed from 93% to whatever the rewriter could re-find on bmwusa.com pages with the script's regex (likely 30–60%). The crash inadvertently preserved Phase 1's high-quality URLs. This is a separate concern from the angle bug: the reset is by design but is destructive when invoked against a brand whose Phase-1 URLs are already correct.

- The 14 entries that triggered the crash are not the same as the 20 download failures. The two sets overlap on `i7`, `m5-touring`, etc., but most extra-angle entries had real direct CDN URLs from Phase 1 (e.g., `i7/m70-xdrive/wheel_detail` is at `bmw.scene7.com/.../BMW-MY26-i7M70-DI23_000132732-retouched`) and downloaded fine. The download loop tolerates any angle string.

- Honda's smoke-test report flagged a BOM-on-data-JSON issue. `data/bmw.json` and `catalog/data/bmw.json` have no BOM; the audit referenced in STATUS.md was correct for BMW.

- The brand config (`scripts/brand-configs/bmw.json`) was written with 30 model_pages entries plus slug_variants and an extended path_blacklist_regex. It is left in place for re-use after the script bug is fixed and the URL list is verified — only the `model_pages` need correction; `slug_variants` and `path_blacklist_regex` should be reusable as-is.
