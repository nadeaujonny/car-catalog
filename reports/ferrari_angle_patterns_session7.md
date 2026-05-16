# Ferrari angle_url_patterns investigation — Session 7 Phase A3

**Date:** 2026-05-14
**Brand:** ferrari
**Baseline coverage (Session 5/6):** 2.1% (1 of 48 image entries — F80 interior_dashboard via static fetch on a single page)
**Investigator:** Session 7 Phase A3

## Summary

**Recommendation: abandon for this lever.** No `angle_url_patterns` were added to `scripts/brand-configs/ferrari.json`. Coverage stays at 2.1% (1/48) — pre = post.

The investigation reproduced and quantified the Session 6 "persistent low coverage" finding for Ferrari with stronger evidence: even the rendered DOM via Playwright provides candidates that have **no model identifier and no angle identifier** anywhere in URL or alt text. There is nothing for an angle-URL regex to target.

## Static-fetch findings (`scripts/diag_ferrari_candidates.mjs`)

5 representative pages were probed (roma-spider, amalfi, 296-gtb, 12cilindri, purosangue):

| Page | HTML bytes | Raw candidates | Slug-matched |
|---|---:|---:|---:|
| ferrari-roma-spider | 526 841 | 0 | 0 |
| ferrari-amalfi | 507 375 | 0 | 0 |
| 296-gtb | 559 936 | 0 | 0 |
| ferrari-12cilindri | 521 901 | 0 | 0 |
| ferrari-purosangue | 578 455 | 0 | 0 |

Static HTML is large (500-580 KB) but is a pure JS app shell — zero `<img>` tags survive the production extractor. (Consistent with Session 5 Phase C: every page reported "static ok (0 raw candidates)" except F80 which had 2.)

Full output: `reports/ferrari_candidates_raw.log`.

## Playwright findings (`scripts/diag_ferrari_playwright.mjs`)

Same 5 pages, rendered via headless Chromium with the production scraper's exact settings (UA, viewport 1280×900, locale en-US, networkidle 5s race, bounded scroll 2.5s):

| Page | Rendered HTML | DOM `<img>` total | DOM `<img>` visible | Plausible candidates | Slug-matched |
|---|---:|---:|---:|---:|---:|
| ferrari-roma-spider | 811 651 | 50 | 20 | **8** | 0 |
| ferrari-amalfi | 586 711 | 28 | 19 | **0** | 0 |
| 296-gtb | 839 256 | 67 | 19 | **0** | 0 |
| ferrari-12cilindri | 828 030 | 50 | 13 | **0** | 0 |
| ferrari-purosangue | 864 425 | 77 | 19 | **0** | 0 |

Full output: `reports/ferrari_candidates_playwright.log`.

**Key observations:**

1. **4 of 5 rendered pages produce 0 plausible candidates.** The pages do contain `<img>` elements (28-77 per page) but they are SVGs, data: URIs, or otherwise fail `isPlausibleImageURL` — consistent with the Session 6 diagnosis that Ferrari embeds imagery via CSS backgrounds inside shadow DOM. This precisely matches Session 5 Phase C ("ok but 0 candidates" on 10 of 11 escalations).

2. **The 1 page with candidates (roma-spider) returns only opaque-GUID URLs.** All 8 candidates from a single CDN host:

   ```
   https://ferrari-view.thron.com/api/xcontents/resources/delivery/getThumbnail/ferrari/0x0/<UUID>.jpg?v=139
   ```

   For example:
   - `…/0x0/3f926358-a1d3-4415-9ac4-a3f02422518c.jpg?v=139`
   - `…/0x0/664a46bf-ad6d-45ed-b03f-04eb0d47cbe7.jpg?v=139`
   - `…/0x0/1942c464-b86b-4b47-9158-13969ab5fbb6.jpg?v=139`

   Every URL contains the same 7 path tokens (`api`, `xcontents`, `resources`, `delivery`, `getthumbnail`, `ferrari`, `0x0`) plus a unique UUID. **No angle identifier. No model identifier.** Alt text is empty (`""`) on every one.

3. **Zero matches across all 5 pages** for any of: `front`, `rear`, `side`, `interior`, `dashboard`, `gallery`, `hero`, `three`, `quarter`, `profile`, `exterior`, `cockpit` (URL paths and alt text searched, case-insensitive).

4. **Zero model-name mentions** in URL or alt for any of the 5 pages — even the words "roma", "amalfi", "296", "12cilindri", "purosangue", "ferrari" do not appear in the candidate URLs (other than in the brand path segment `/ferrari/` which is shared across every URL and therefore useless for distinguishing models, let alone angles).

## Why `angle_url_patterns` cannot help

The `angle_url_patterns` feature works by testing brand-specific regexes against `url + " " + alt-text` to recover angle classification when the standard English `ANGLE_PATTERNS` table finds nothing. For Ferrari:

- **Hyundai/Subaru** are angle-pattern-gapped but slug-match works (93 candidates per page; URL tokens like `vlp-hero` / `media-slider` exist to target). The lever fits.
- **Ferrari** is angle-pattern-gapped AND slug-match-gapped AND brand-token-gapped. Even if a regex perfectly tagged every UUID URL as some angle, there is no way to know which model that UUID belongs to (zero model identifier in URL/alt), and there is no way to know which angle the UUID actually depicts (the Thron `getThumbnail` endpoint returns a stored asset keyed only by UUID). Any regex would have to be a UUID allowlist — which means hand-collecting the images, which means it's not a pipeline lever at all.

The standard pattern matcher needs **some signal in the URL or alt text** to score against. Ferrari's rendered DOM provides none.

## What was NOT changed

- `scripts/brand-configs/ferrari.json` — unchanged. Adding regex patterns with no candidates to match against would introduce no positive matches and risk false-positive matches in any future scrape that does manage to surface a non-Ferrari image inside the page (e.g. promo banners that slip through the blacklist), per the "bias toward precision" instruction in the task brief.
- `scripts/scrape_image_urls.mjs` and `scripts/download_images.mjs` — unchanged per safety rule.
- `data/_partials/` and other brand configs — unchanged.
- Scrape/download were **not re-run** since the brief specifies they should only be re-run "if you applied patterns".

## Coverage delta

- **Pre-investigation:** 1 of 48 = **2.1%**
- **Post-investigation:** 1 of 48 = **2.1%** (unchanged — no patterns applied)

The 1 successful entry remains `f80/f80/interior_dashboard` from `cdn.ferrari.com/cms/network/media/img/ferrari-f80-interior-focus-seat-2s.jpg`, recovered via static fetch (Phase C Session 5/6). That single asset is from a different Ferrari CDN host (`cdn.ferrari.com`) and pre-existing URL family than what the auto/<model> pages now surface (`ferrari-view.thron.com`); it does not generalize to the other 11 models.

## Recommendation

**Keep Ferrari on the `persistent_low_coverage_brands.md` "placeholder-only" list.** Session 7 evidence confirms and strengthens the Session 6 diagnosis: the gap is structural to Ferrari's image delivery (Thron-backed CDN with GUID-only paths, empty alt, no model or angle identifier on the consumer site), not pipeline-fixable via brand-config tuning.

The pipeline-level path that would help Ferrari is fundamentally different:
- **Per-page asset enumeration** — for each page, accept the GUIDs and try to classify them by **DOM position** (top of hero gallery slot 1 → front_three_quarter, slot 2 → rear, slot 3 → side, slot 4 → interior, by Ferrari's consistent template). This would require both (a) extending `scripts/scrape_image_urls.mjs` to record gallery-slot index from rendered DOM, and (b) verifying Ferrari's template is stable across 12 models. Out of scope for Phase A3.
- **Non-pipeline:** hand-collect the 47 missing images from authorized Ferrari press/media assets. Project policy decision.

Neither is an `angle_url_patterns` lever. Marking abandoned for this lever.

## Notes for the aggregate Session 7 report

- Ferrari was the **toughest of the 7 priority brands** by design. Static fetch returns 0 candidates on 5/5 pages; rendered DOM returns 0 on 4/5; the 1 page that does surface anything (roma-spider) gives 8 GUID-only URLs with empty alt — no signal for any angle regex to use.
- Diag scripts produced and retained: `scripts/diag_ferrari_candidates.mjs` (static) and `scripts/diag_ferrari_playwright.mjs` (Playwright). Re-runnable. Outputs at `reports/ferrari_candidates_raw.log` (78 lines) and `reports/ferrari_candidates_playwright.log` (173 lines).
- No regression risk introduced — `ferrari.json` is byte-identical to its Phase B state.
- For the aggregate "patterns per angle" tally, Ferrari contributes **0** across all 4 angles. Status: **abandoned (no usable candidates)**.
