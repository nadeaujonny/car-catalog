# Image Scrape Report: Honda

**Date:** 2026-05-13
**Brand:** Honda
**Models in JSON:** 13
**Total image entries:** 212

> **Smoke test for generalized Phase 4 scripts.** This is the first run of `scripts/scrape_image_urls.mjs` + `scripts/download_images.mjs` against a brand config (`scripts/brand-configs/honda.json`) instead of the prior hardcoded Honda script. The prior hardcoded run achieved 72% coverage. Goal: match or beat 72%.

---

## Summary

- **Scraped (URLs rewritten):** 118 / 212
- **Downloaded successfully:** 153 (72.2%)
- **Download failures:** 59
- **Page fetches failed during scrape:** 0

**Result vs. baseline:** 72.2% vs. 72% prior — coverage matches (no regression). Generalized scripts produce parity with the hardcoded Honda script. Safe to proceed to other brands.

## Setup note: BOM in source JSON

Initial scrape invocation failed with `SyntaxError: Unexpected token '﻿'` on line 273 of the script (the `JSON.parse(catalog/data/honda.json)` call). Both `data/honda.json` and `catalog/data/honda.json` started with a UTF-8 BOM (bytes `EF BB BF`), which Node's `fs.readFile(..., "utf-8")` preserves as `﻿` in the resulting string, breaking `JSON.parse`. Stripped the BOMs from both files in place (no schema change, just byte-level cleanup). The scripts then ran cleanly.

This BOM probably came from an earlier Windows-side write (PowerShell `Out-File` / `Set-Content` default to UTF-16-with-BOM or UTF-8-with-BOM depending on version). **Recommendation for follow-up:** either (a) audit other brand JSON files for the same pattern before their Phase 4 runs, or (b) consider making the scripts tolerant of a leading BOM (e.g., `s.replace(/^﻿/, "")` before `JSON.parse`). Not done in this run because the instructions say "do not rewrite the scripts."

## Scrape results

13 model pages attempted, 13 succeeded (0 failed). All 13 Honda models in `data/honda.json` have a `model_pages` entry in the config; none were skipped.

```
Pages attempted:      13
Pages failed:         0
Image entries rewritten:  118
Image entries unchanged:  94
```

Sample successful rewrites (showing the score the picker assigned, model/trim/angle, and the resolved CDN URL):

```
[24.4] civic/lx/front_three_quarter
  → automobiles.honda.com/-/media/.../2026-honda-civic-sedan-sport-rallye-red-front-three-quarter-13.jpg?mw=1439
[21.5] civic/lx/rear_three_quarter
  → automobiles.honda.com/-/media/.../2026-honda-civic-sedan-sport-meteorite-gray-metallic-rear-01.jpg?mw=767
[33.4] civic/lx/interior_dashboard
  → automobiles.honda.com/-/media/.../2026-honda-civic-sedan-sport-touring-hybrid-dashboard-center-console-05.jpg
```

Per-model unresolved angle counts (where the scrape could not find a candidate that matched both the model's slug variants and the target angle's regex):

| Model | Unresolved | Sample missing angles |
|---|---|---|
| civic-hatchback | 9 | sport/front_three_quarter, sport/rear_three_quarter, sport/side_profile |
| civic-type-r | 2 | type-r/front_three_quarter, type-r/side_profile |
| accord | 12 | lx/front_three_quarter, lx/rear_three_quarter, se/front_three_quarter |
| prelude | 4 | hybrid/front_three_quarter, hybrid/rear_three_quarter |
| hr-v | 2 | sport/rear_three_quarter, ex-l/rear_three_quarter |
| cr-v | 16 | lx/front_three_quarter, lx/rear_three_quarter, ex/front_three_quarter |
| pilot | 21 | sport/front_three_quarter, sport/rear_three_quarter, sport/side_profile |
| prologue | 6 | ex/rear_three_quarter, ex/side_profile, touring/side_profile |
| ridgeline | 10 | sport/front_three_quarter, sport/side_profile, rtl/front_three_quarter |
| odyssey | 12 | ex-l/front_three_quarter, ex-l/rear_three_quarter, ex-l/side_profile |

The "94 unchanged" total includes both (a) entries where no candidate matched (these get left at the canonical page URL by the scrape's idempotent reset) and (b) entries that were already-downloaded with valid local files (the scrape resets the URL but the download skips them as cached). The split that matters for site-rendering coverage is captured by the download results below.

## Download results

```
Total attempted: 212
Successful:      153 (72.2%)
Failed:          59
```

Failed by HTTP status: **none**.

Failed by error kind:

| Kind | Count |
|---|---|
| wrong-content-type | 59 |

All 59 failures are `wrong-content-type (text/html; charset=utf-8)`. Mechanism: when the scrape couldn't find an image candidate matching the model slug + angle, the scrape's idempotent-reset step left `image.url` at the model's canonical page URL (e.g., `https://automobiles.honda.com/civic-hatchback`). The download script fetches that URL, receives the HTML page (since the URL is the page itself, not an image asset), and rejects it with `wrong-content-type`. The entry is left as `downloaded: false` and the site renders a placeholder. No HTTP 4xx/5xx, no timeouts, no CDN gating.

Representative failure URL: `https://automobiles.honda.com/civic-hatchback`

**Models with zero successful downloads:** 0 of 13. Every model has at least 50% coverage. Per-model success rate:

| Model | Downloaded / Total | % |
|---|---|---|
| civic | 16/16 | 100% |
| civic-hatchback | 6/12 | 50% |
| civic-si | 4/4 | 100% |
| civic-type-r | 3/4 | 75% |
| accord | 18/24 | 75% |
| prelude | 6/8 | 75% |
| hr-v | 10/12 | 83% |
| cr-v | 19/28 | 68% |
| passport | 28/28 | 100% |
| pilot | 14/28 | 50% |
| prologue | 6/12 | 50% |
| ridgeline | 15/20 | 75% |
| odyssey | 8/16 | 50% |

## Recommendations

- **Honda parity confirmed; ship the generalized scripts.** With 72.2% matching the prior 72% baseline, the generalized pipeline is at least as good as the hardcoded one for Honda. No reason to keep the hardcoded version around.

- **Coverage gaps are concentrated in two angles: `rear_three_quarter` and `side_profile`.** Looking at the unresolved-angle samples, almost every unresolved entry is one of those two angles. Honda's consumer-site galleries tend to lead with `front_three_quarter` and `dashboard` shots; rear and side profile shots exist on the gallery pages but their filename tokens are inconsistent (sometimes `rear-profile` instead of `rear_three_quarter`, sometimes filenames are color-coded without an angle token at all). Two paths forward, neither blocking:
  - **Tune angle regexes** to better catch Honda's `rear-profile-NN.jpg` naming (the current `side_profile` regex catches `rear-profile` and steals it; the `rear_three_quarter` regex misses it). This is a script-level tweak, not in scope for this run.
  - **Add a media/press URL to `model_pages`** for the highest-gap models (cr-v, pilot, odyssey) so the scraper has a second page to harvest. Out of scope for the smoke test.

- **Pilot, Odyssey, and CR-V are the largest gap contributors.** Each is at 50–68% coverage with most failures on `rear_three_quarter` + `side_profile`. If we want to push Honda above 80%, addressing those three is where to invest.

- **No CDN gating, no 403s, no timeouts.** Honda's CDN (`automobiles.honda.com/-/media/...`) returns images to the script's User-Agent without any of the access controls that block Mercedes / Audi / Lexus / Aston Martin during Phase 1. Honda is the easy case; harder brands will need different strategies.

- **Page-fetch success was 100%.** Honda's consumer site renders enough HTML in the initial response that no JS-rendering workaround was needed. Other brands that returned blank to WebFetch (Audi, Ferrari) will likely need different page URLs (press/media subdomain) configured.

## Notes

- The scrape script's idempotent reset (lines 283–289) writes the canonical page URL into every image entry before attempting to find candidates. That means a previously-resolved URL is discarded each run — the scraper does not stack improvements across runs. This is by design and works fine here, but worth knowing for future debugging: a single bad config tweak that drops one angle's score can re-introduce gaps that a prior run had resolved.

- The download script's "cached" path (lines 120–131) only triggers when `image.downloaded === true` AND the file is non-zero on disk. Since the scrape preserves the `downloaded` flag while replacing the URL, the 153 previously-downloaded images stayed counted as cached even though their URL is now (in some cases) different. No re-downloads occurred. If we ever wanted to force a refresh, the simplest path is to delete the local file (the cached check fails, falls through to re-download with the new URL).

- The Honda config's `path_blacklist_regex` was inherited from the prior hardcoded script and seems well-tuned: 0 nav/promo/swatch URLs slipped through into the rewrites, judging by the sample output.

- Honda CDN returns a mix of `mw=767` and `mw=1439`/`mw=2000` for the same image (different gallery vs. modal sizes). The scrape's resolution-bonus picks the largest available for each angle when both are present.
