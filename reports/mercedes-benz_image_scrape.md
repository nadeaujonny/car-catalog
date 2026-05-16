# Image Scrape Report: Mercedes-Benz

**Date:** 2026-05-13
**Brand:** Mercedes-Benz
**Models in JSON:** 25
**Total image entries:** 317

> **Result: 0% coverage. Scrape crashed on a non-standard angle (`cargo_area` on `e-class-wagon`) before any rewrite was written; download then ran on Phase 1's mbusa.com page-URL placeholders and got HTML or 404 for all 317 entries.** The scrape script (`scripts/scrape_image_urls.mjs`) only defines `ANGLE_PATTERNS` for the four baseline angles; Mercedes uses 5 extra-angle entries on 4 models (3 × `interior_rear_seats` and 1 × `cargo_area`). Phase 1 was unable to access mbusa.com's CDN at research time and left all 317 entries as `needs_scraping: true` page-URL placeholders pointing to either the trim build page (`mbusa.com/en/vehicles/build/...` or `model/<class>/<body>/<trim>`) or the class overview page — neither of which is an image asset. Per spec the scripts were not modified.

---

## Summary

- **Scraped (URLs rewritten):** 0 / 317 (scrape script crashed before writing)
- **Downloaded successfully:** 0 (0.0%)
- **Download failures:** 317
  - 218 `wrong-content-type` (text/html, served by mbusa.com when the URL is a vehicle build/overview page that still exists)
  - 99 `HTTP 404 Not Found` (Phase 1 URLs that have since been removed or restructured on mbusa.com — predominantly `mbusa.com/en/amg/vehicles/...` and a handful of `mbusa.com/en/vehicles/build/...` trim pages)
- **Page fetches during scrape:** 23 of 25 returned content; 2 returned 404 (the brand config's `amg-gt-4-door-coupe` and `maybach-eqs-suv` URLs)

## Scrape results

### Script-level crash (not modifiable per spec)

```
node:internal/process/task_queues:95
    at angleScore (scripts/scrape_image_urls.mjs:233:45)
    at pickBestForAngle (scripts/scrape_image_urls.mjs:243:40)
    at main (scripts/scrape_image_urls.mjs:358:22)
TypeError: ANGLE_PATTERNS[angle] is not iterable
```

Same root cause as the BMW run. `ANGLE_PATTERNS` defines only the four baseline angles; Mercedes has these extras:

| Angle               | Count | Models                                                              |
|---------------------|-------|---------------------------------------------------------------------|
| interior_rear_seats | 3     | maybach-s-class (×2), maybach-gls, maybach-eqs-suv                  |
| cargo_area          | 1     | e-class-wagon                                                       |

Because `e-class-wagon` is the 6th model in JSON order, the crash fires after the script successfully fetched all 25 pages but only got partway through rewriting. As with BMW, the crash is before the final `writeFile`, so `data/mercedes-benz.json` and `catalog/data/mercedes-benz.json` are unchanged from their pre-run state. For Mercedes-Benz this is harmless: the pre-run state was already 317 `needs_scraping` page URLs with no direct CDN URLs to lose.

### Page-fetch results

| Page URL                                                                       | Result        |
|--------------------------------------------------------------------------------|---------------|
| `mbusa.com/en/vehicles/class/cla/sedan`                                        | ok (58 raw)   |
| `mbusa.com/en/vehicles/class/c-class/sedan`                                    | ok (62 raw)   |
| `mbusa.com/en/vehicles/class/cle/coupe`                                        | ok (62 raw)   |
| `mbusa.com/en/vehicles/class/cle/cabriolet`                                    | ok (62 raw)   |
| `mbusa.com/en/vehicles/class/e-class/sedan`                                    | ok (57 raw)   |
| `mbusa.com/en/vehicles/class/e-class/wagon`                                    | ok (62 raw)   |
| `mbusa.com/en/vehicles/class/s-class/sedan`                                    | ok (56 raw)   |
| `mbusa.com/en/vehicles/class/maybach-s-class/sedan`                            | ok (22 raw)   |
| `mbusa.com/en/vehicles/class/amg-gt/coupe`                                     | ok (38 raw)   |
| `mbusa.com/en/vehicles/class/amg-gt-4door/coupe`                               | **404**       |
| `mbusa.com/en/vehicles/class/sl/roadster`                                      | ok (28 raw)   |
| `mbusa.com/en/vehicles/class/gla/suv`                                          | ok (22 raw)   |
| `mbusa.com/en/vehicles/class/glb/suv`                                          | ok (25 raw)   |
| `mbusa.com/en/vehicles/class/glc/suv`                                          | ok (57 raw)   |
| `mbusa.com/en/vehicles/class/glc/coupe`                                        | ok (55 raw)   |
| `mbusa.com/en/vehicles/class/gle/suv`                                          | ok (59 raw)   |
| `mbusa.com/en/vehicles/class/gle/coupe`                                        | ok (53 raw)   |
| `mbusa.com/en/vehicles/class/gls/suv`                                          | ok (56 raw)   |
| `mbusa.com/en/vehicles/class/maybach-gls/suv`                                  | ok (4 raw)    |
| `mbusa.com/en/vehicles/class/g-class/suv`                                      | ok (56 raw)   |
| `mbusa.com/en/vehicles/class/eqe/sedan`                                        | ok (13 raw)   |
| `mbusa.com/en/vehicles/class/eqe/suv`                                          | ok (11 raw)   |
| `mbusa.com/en/vehicles/class/eqs/sedan`                                        | ok (13 raw)   |
| `mbusa.com/en/vehicles/class/eqs/suv`                                          | ok (13 raw)   |
| `mbusa.com/en/vehicles/class/maybach-eqs-suv/suv`                              | **404**       |

23 of 25 returned HTML with image candidates. Two URLs need correction: `amg-gt-4-door-coupe` (mbusa.com appears to use a different path token for the 4-door GT) and `maybach-eqs-suv` (the class path is more specific). Even with both corrected, the script would still have crashed on `e-class-wagon`'s `cargo_area` before reaching either entry's rewrite phase.

### Candidate volume on the fetched pages

Most class pages returned 50–62 raw image candidates, but spot checks suggest mbusa.com is heavily JavaScript-rendered: the static HTML carries banner / hero / nav imagery and a small number of vehicle illustrations, with the full configurator galleries injected client-side. Maybach pages returned dramatically fewer candidates (4–22) because their static HTML is even thinner. **This means even with a fixed angle handler, mbusa.com class pages are unlikely to yield gallery-quality model imagery.** This matches STATUS.md's prior note that "mbusa.com CDN gated" — the gating is via JS-rendering, not strict authentication.

## Download results

Because the scrape did not write, the downloader hit Phase 1's URLs verbatim:

```
Total attempted: 317
Successful:      0 (0.0%)
Failed:          317
```

**Failed by HTTP status:**

| Status | Count |
|--------|-------|
| 404    | 99    |

**Failed by other error kind:**

| Kind                | Count |
|---------------------|-------|
| wrong-content-type  | 218   |

Representative URLs per group:

- `wrong-content-type (text/html;charset=utf-8)` — `https://www.mbusa.com/en/vehicles/model/cla/sedan/cla250e` (the build/overview page still exists; just isn't an image)
- `status-404` — `https://www.mbusa.com/en/amg/vehicles/class/cle/coupe` (Mercedes moved AMG class pages out of `/en/amg/vehicles/` since Phase 1 ran; the new path is `/en/vehicles/class/...` without the AMG segment)

**Models with zero successful downloads:** 25 of 25 (every model). Per-model attempt counts:

| Model | Attempted |
|---|---|
| cla | 8 |
| c-class | 16 |
| cle-coupe | 12 |
| cle-cabriolet | 12 |
| e-class-sedan | 16 |
| e-class-wagon | 5 |
| s-class | 16 |
| maybach-s-class | 10 |
| amg-gt-coupe | 16 |
| amg-gt-4-door-coupe | 16 |
| sl-roadster | 20 |
| gla-suv | 8 |
| glb-suv | 8 |
| glc-suv | 20 |
| glc-coupe | 12 |
| gle-suv | 28 |
| gle-coupe | 12 |
| gls-suv | 12 |
| maybach-gls | 5 |
| g-class | 12 |
| eqe-sedan | 12 |
| eqe-suv | 12 |
| eqs-sedan | 16 |
| eqs-suv | 8 |
| maybach-eqs-suv | 5 |

## Recommendations

- **Fix the script's angle-handling bug first.** Same recommendation as the BMW report: have `pickBestForAngle` short-circuit to `null` when `ANGLE_PATTERNS[angle]` is undefined. Without that, Mercedes will never get past its 6th model.

- **mbusa.com is not the right scrape source for Mercedes-Benz.** Three observations make this clear: (a) raw candidate counts (4–62) are an order of magnitude lower than Toyota's static HTML (335–662); (b) class pages return mostly hero/marketing imagery in the static HTML; (c) Phase 1 spent significant effort with mbusa.com and gave up, leaving every entry as `needs_scraping`. **Alternative source: press.mbusa.com** (Mercedes-Benz USA Newsroom) — those release pages do carry direct asset URLs in static HTML for current model launches. A Phase-4-style scrape that targets release pages instead of consumer class pages is more likely to find usable assets, but it requires a different `model_pages` strategy (likely one URL per recent press release per model, not one URL per model).

- **Mercedes-Benz Group press portal as a secondary source.** `mercedes-benz.com/en/press` and `media.mercedes-benz.com` have global press material that often appears in U.S. press releases later. Quality varies and U.S.-specific imagery may not always be there, but for models where mbusa.com gives nothing this is the next-most-credible primary source within the spec's allowed-source rules.

- **Mercedes' true coverage is in the worst-case category.** Until either (a) the scrape script can crawl release pages, or (b) someone resolves mbusa.com's JS-rendered configurator galleries via a browser-assisted scrape (out of project scope per spec §3 ethics), Mercedes-Benz Phase 4 cannot move above 0%. Recommend accepting placeholder coverage for now and revisiting after the script is upgraded.

- **The 99 404s suggest mbusa.com URLs from Phase 1 have aged poorly.** Even if a future Phase 4 pass were to skip the rewrite and just re-attempt the placeholder URLs (e.g., as a sanity check), at least 99 of 317 entries (31%) point to dead pages. The `/en/amg/vehicles/` prefix in particular has been removed across the site. If Phase 1 is re-run for Mercedes, expect those URLs to need refreshing regardless.

## Notes

- The scrape's idempotent reset (lines 281–289) had no destructive effect on Mercedes because every entry was already a page URL — there were no high-quality direct CDN URLs to lose. This contrasts sharply with the Toyota run in this batch where the same reset destroyed 137 working URLs. The reset is destructive only for brands whose Phase 1 *succeeded* at CDN resolution; for brands where Phase 1 left placeholders, the reset is a no-op against the existing data.

- The brand config (`scripts/brand-configs/mercedes-benz.json`) is written with 25 model_pages, 25 slug_variants, and an extended path_blacklist_regex. The `amg-gt-4-door-coupe` and `maybach-eqs-suv` page URLs are confirmed 404 — those need updating once the underlying script bug is fixed.

- `data/mercedes-benz.json` and `catalog/data/mercedes-benz.json` had no BOM before the run (Honda's BOM gotcha did not recur). Both files remain unchanged from their pre-Phase-4 state because both the scrape (pre-`writeFile` crash) and the download (zero-success guard at line 158) skipped writing.

- No image files were written to disk. `catalog/images/mercedes-benz/` does not exist.

- Mercedes is the third brand in this batch to confirm the angle-handler bug (BMW first observed it, Toyota would not have hit it since it uses only the four baseline angles, Mercedes confirms the same crash signature). Any future brand with `interior_rear_seats`, `cargo_area`, `engine_bay`, or `wheel_detail` in its image entries will need either the script fix or a data scrub to avoid the same crash.
