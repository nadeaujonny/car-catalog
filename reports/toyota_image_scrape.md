# Image Scrape Report: Toyota

**Date:** 2026-05-13
**Brand:** Toyota
**Models in JSON:** 23
**Total image entries:** 140

> **Result: 0% coverage. The scrape was destructive — it wiped Phase 1's working direct CDN URLs and replaced them with `toyota.com` model-page URLs that the downloader cannot consume.** The scrape script's idempotent reset (lines 281–289 of `scripts/scrape_image_urls.mjs`) overwrites every `image.url` with the canonical model page URL *before* running the candidate-matching loop. For Toyota, the candidates extracted from `toyota.com/<model>/` come from `tmna.aemassets.toyota.com` and have filenames like `CAH_MY25_0019_V001.png` that encode a vehicle/gallery sequence number but no angle token (no "front", "rear", "side", "profile", "dashboard", etc. in either filename or alt text). The angle scorer matched 0 candidates; 0 entries were rewritten; the reset stays in effect; the JSON is now `https://www.toyota.com/<model>/` × 140. Per spec the scripts were not modified.

---

## Summary

- **Scraped (URLs rewritten):** 0 / 140
- **Downloaded successfully:** 0 (0.0%)
- **Download failures:** 140 (all `wrong-content-type`)
- **Page fetches failed during scrape:** 0 of 23 (every toyota.com page returned ≥335 raw candidates)
- **Pre-existing data lost:** 137 direct `toyota-cms-media.s3.amazonaws.com` URLs from Phase 1 were overwritten by the scrape's idempotent reset and are no longer present in `data/toyota.json` or `catalog/data/toyota.json`.

## Scrape results

All 23 toyota.com model pages were fetched successfully. Raw candidate counts ranged from 335 (corolla) to 662 (bz). After the slug+angle scoring filter, 0 candidates were accepted.

```
Pages attempted:      23
Pages failed:         0
Image entries rewritten:  0
Image entries unchanged:  140
```

### Why nothing matched

Toyota.com serves images from `tmna.aemassets.toyota.com` (Adobe AEM Scene7). Sample candidates from the camry page:

```
https://tmna.aemassets.toyota.com/is/image/toyota/toyota/jellies/max/2026/camry/le/2559/3u5/1.png
https://tmna.aemassets.toyota.com/is/image/toyota/toyota/jellies/max/2026/camry/xse/2556/2ps/1.png
https://tmna.aemassets.toyota.com/is/image/toyota/toyota/vehicles/2026/camry/galleries/CAH_MY25_0019_V001.png
https://tmna.aemassets.toyota.com/is/image/toyota/toyota/vehicles/2026/camry/galleries/CAH_MY25_0021_V001.png
https://tmna.aemassets.toyota.com/is/image/toyota/toyota/vehicles/2025/camry/mlp/scrollytelling/CAM_MY26_NA-CAMP_Overview_Performance_Tech…
```

These URLs do contain the model slug (`/camry/` segment) so the `slugMatchesURL` regex matches. But the filenames carry only opaque codes — `CAH_MY25_0019_V001.png`, `2559/3u5/1.png`, `CAM_MY26_NA-CAMP_Overview_...` — and the `alt` / `title` attributes on toyota.com tend to be generic ("2026 Toyota Camry") with no angle modifier. None of the `ANGLE_PATTERNS` regexes (`front_three_quarter` looking for `front[-_ ]?3[-_ ]?4` / `\bfront\b`, etc.) can find a match in either the URL or the surrounding context.

`pickBestForAngle` requires `matched: true` from `angleScore`. With 0 matches, every angle on every model fell through to "no candidate," and `image.url` stayed at the idempotent-reset value of `https://www.toyota.com/<model>/`.

### Per-model unresolved-angle counts

All 23 models had every image entry unresolved (the script lists the highest-volume models below; the four models with no image entries at all — sequoia, sienna, tacoma, tundra — are not listed because the JSON has no entries for them to fail):

```
camry              : 23
corolla            : 13
corolla-hatchback  :  5
crown              : 11
crown-signia       :  6
mirai              :  4
prius              : 18
4runner            : 18
bz                 :  5
bz-woodland        :  5
c-hr               :  6
corolla-cross      :  8
grand-highlander   :  3
highlander         :  7
land-cruiser       :  1
rav4               :  4
gr-corolla         :  1
gr-supra           :  1
gr86               :  1
```

## Download results

```
Total attempted: 140
Successful:      0 (0.0%)
Failed:          140
```

**Failed by HTTP status:** none.

**Failed by error kind:**

| Kind                | Count |
|---------------------|-------|
| wrong-content-type  | 140   |

All 140 failures are `wrong-content-type (text/html; charset=utf-8)` — the downloader hits `https://www.toyota.com/<model>/`, gets the HTML model page, and rejects it. No image files were written to `catalog/images/toyota/` (the directory does not exist).

**Models with zero successful downloads:** 19 of 23 (the four exceptions — sequoia, sienna, tacoma, tundra — had no image entries to attempt, so they are not counted as "zero" either).

## Recommendations

- **Highest priority: restore Toyota's Phase 1 URLs.** The 137 direct `toyota-cms-media.s3.amazonaws.com` URLs that Phase 1 placed in `data/toyota.json` are gone from the JSON. There is no local git history to roll back to (the project is not a git repository per the session environment). The fastest recovery path is to re-run Phase 1 for Toyota (which produced the original URLs from press.toyota.com / pressroom.toyota.com release pages) and then either (a) skip Phase 4 entirely until the script is fixed, or (b) run a download-only pass with `node scripts/download_images.mjs --brand toyota` after Phase 1 has rewritten the URLs.

- **The scrape script's idempotent reset is destructive for any brand whose Phase 1 URLs are already correct.** For Toyota — and likely Honda's already-resolved entries before the smoke test, where Phase 1's hardcoded scrape had already populated CDN URLs — the reset throws away good data and tries to re-derive it. For brands whose page-source candidates lack angle tokens in filenames or alt text (Toyota, and probably any AEM Scene7-based site that uses opaque image IDs), the re-derivation fails and the JSON is left worse than before. **Recommended script change:** either (a) only reset URLs flagged `needs_scraping: true`, leaving Phase 1's resolved URLs untouched; or (b) keep the reset but also fall back to a saved pre-run snapshot if rewrites < threshold. Not done in this run because spec says do not modify the script.

- **Toyota's existing S3 CDN URLs may still work for download once restored.** STATUS.md noted "S3 CDN returns 403 on most assets" but no actual download attempt has been logged to verify. If a meaningful fraction of `toyota-cms-media.s3.amazonaws.com` URLs are reachable, Toyota's true coverage could be in the 70–95% range (Phase 1 had resolved 137 of 140 entries). A targeted re-download against the restored URLs is the lowest-cost way to find out.

- **Toyota.com gallery filenames cannot be angle-classified by regex alone.** Any future scraping of `toyota.com` will need an alternative signal — e.g., the AEM Scene7 image-set XML companion (`?$set$&$content=imagecontent.xml`), or parsing the page's JavaScript image-rotator config, or following the `pressroom.toyota.com` press-release links instead of the consumer page. None of those are within the current generic scraper's capabilities.

## Notes

- The toyota.com pages render image URLs server-side (the candidate count of 335–662 is plenty), so the issue is not a JS-rendering wall — it's that the candidate URLs lack angle hints, which is a different problem than the brands that returned blank HTML to the script.

- `data/toyota.json` and `catalog/data/toyota.json` were both rewritten by the scrape pass (`fs.writeFile` at lines 377–378 unconditionally writes after the rewrite loop). After the download pass, those files remain unchanged because the download wrote nothing back when 0 entries succeeded (line 158 guard). Net: both data files now contain `image.url: https://www.toyota.com/<model>/` for all 140 entries.

- No new image files were written to disk. `catalog/images/toyota/` does not exist (it would have been created on first successful download).

- The brand config (`scripts/brand-configs/toyota.json`) was written with 23 model_pages entries, 23 slug_variants entries, and an extended path_blacklist_regex. The slug_variants and blacklist are reusable; the model_pages list is correct (every URL returned ≥335 candidates), but those pages are the wrong tool for this scraper. Future Toyota Phase 4 runs should target press.toyota.com or pressroom.toyota.com release URLs instead.

- The Honda smoke test's BOM-on-data-JSON gotcha did not recur for Toyota — `data/toyota.json` and `catalog/data/toyota.json` had no BOM before the scrape ran (the scrape successfully `JSON.parse`d them).
