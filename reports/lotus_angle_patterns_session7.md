# Lotus angle_url_patterns investigation — Session 7 Phase A3

**Date:** 2026-05-15
**Baseline:** 0% (0 of 24) image coverage
**Post-Session-7:** 0% (0 of 24) — no change
**Recommendation:** **abandon** for this lever; root cause is upstream of `angle_url_patterns`.

## Summary

Lotus does NOT match the Ferrari "JS-rendered + shadow-DOM" profile that the Session 6 `persistent_low_coverage_brands.md` reasoning assumed. The Playwright-rendered DOM does contain regular `<img>` tags with alt text — many of which carry exact angle vocabulary the existing English `ANGLE_PATTERNS` would already match (e.g. `"emira-my26-listcontent-front-desktop.webp"`, `"AlphaPDP_Interior_Desktop.webp"`).

**The real blocker:** every Lotus model-imagery URL is served from `wlt-p-001.sitecorecontenthub.cloud/api/public/content/<uuid>?v=<hash>`, with NO image extension in the URL pathname. The production `isPlausibleImageURL` filter requires `.jpe?g|png|webp|avif` at the end of `URL.pathname` (it explicitly does NOT consider `Content-Type` headers or querystring extensions). Every Lotus model image is therefore filtered out at the **extraction** stage — they never reach `pickBestForAngle`, where `angle_url_patterns` would act.

Because `angle_url_patterns` operates AFTER `extractCandidates`, no brand-config-level regex can rescue Lotus. The lever does not apply.

## Static vs Playwright vs press-gallery findings

### Static (`scripts/diag_lotus_candidates.mjs`)
All 10 probed URLs — 3 consumer pages + 6 press-gallery variants (3 `media.lotuscars.com` + 3 `lotuscars.com/en/press/galleries/`) + 1 press root — returned 0 raw candidates. Static HTML for each is 225-440 KB but contains no `<img>` references; imagery is JS-hydrated. The press-media subdomain 301-redirects to `lotuscars.com/en/press` (the bare root) — NOT to per-model gallery pages as the brand notes had assumed. The `lotuscars.com/en/press/galleries/<model>` URLs DO exist (status 200, 225 KB body each) but their HTML is also JS-hydrated with no static `<img>`.

Log: `reports/lotus_candidates_raw.log`.

### Playwright (`scripts/diag_lotus_playwright.mjs` + `scripts/diag_lotus_playwright_raw.mjs`)
With Chromium rendering + bounded scroll + network-response capture:

| Page | DOM `<img>` | Network image responses | Plausible (passes `IMG_EXT_RE`) |
|---|---:|---:|---:|
| consumer/emira | 37 | 52 | **0** |
| consumer/eletre | 16 | 30 | **0** |
| consumer/emeya | 23 | 40 | **0** |
| press-en/emira | 5 | 43 | 1 (transparency pattern, not model imagery) |
| press-en/eletre | 5 | 43 | 1 (same) |
| press-en/emeya | 5 | 43 | 1 (same) |

The 0 plausible-count is what blocks the production scraper. The DOM and network logs are full of real model imagery — they just don't survive the extension filter. The press-gallery URLs render even less imagery than the consumer pages (5 DOM `<img>` each, mostly nav icons; the gallery body itself is presumably a deeper JS module that didn't hydrate within the wait window, or it's a thumbnail grid loaded on demand).

Logs: `reports/lotus_playwright_raw.log`, `reports/lotus_playwright_raw_full.log`.

### Alt text that WOULD have angle-matched if the URL filter had let them through

From the Playwright DOM dump:

**Emira (consumer)** — RICH:
- `"emira-my26-listcontent-front-desktop.webp"` — front (ANGLE_PATTERNS score 7)
- `"emira-my26-listcontent-rear-desktop.webp"` — rear (score 7)
- `"emira-my26-listcontent-side-desktop.webp"` — side (score 7)
- `"emira interior hero.webp"` — interior (score 7)
- `"emira-racing-line-grey-yellow-image-slider-1080x800-desktop"` — Racing Line variant exterior
- `"Emira-MY26-V6SE-green-image-slider-1080x800-desktop"` — V6 SE variant exterior
- `"emira exterior usp1/2/3.webp"`, `"Emira aero 1 desktop.webp"`, `"Emira exit desktop.webp"` — additional exteriors
- `"emira pdp engine.webp"` — engine bay
- `"lotus-emira-dark-verdant-25.jpg"`, `"lotus-emira-dark-verdant-39.jpg"` — colour shots

**Eletre (consumer)** — usable:
- `"carbon hero desktop.webp"` — likely front exterior
- `"carbon interior desktop.webp"`, `"Interior - Cockpit - Desktop.webp"`, `"Interior - Connectivity - Desktop.webp"`, `"Interior - Dolby - Desktop.webp"` — interior (existing `\binterior\b` and `\bcockpit\b` patterns would have fired)
- BUT: no `front`/`rear`/`side` exterior labels — only "hero" and city/lifestyle ("city11.webp", "city4.webp")

**Emeya (consumer)** — sparse:
- `"AlphaPDP_Header_Desktop.webp"` — main hero, likely front exterior
- `"AlphaPDP_Interior_Desktop.webp"` — interior (existing pattern would fire)
- `"AlphaPDP_Carbon1/2_Tablet.webp"` — likely exteriors
- BUT: no `front`/`rear`/`side` labels at all — Emeya uses internal "AlphaPDP" codes for its scene types

If the URL extension filter were relaxed for the Sitecore CDN host (an upstream `scripts/scrape_image_urls.mjs` change — out of scope for this session), the existing `ANGLE_PATTERNS` table alone would likely lift Emira to ~100% (4 of 16 entries directly + the rest carry through trim variants which share imagery), and Eletre/Emeya partially via the `\binterior\b` / `\bcockpit\b` rules. `angle_url_patterns` is NOT what's needed for Lotus.

## Patterns derived

**None viable.** A brand-config `angle_url_patterns` cannot help when the candidates never reach `pickBestForAngle`. Adding patterns to `scripts/brand-configs/lotus.json` would be inert.

## Coverage before/after

- Before Session 7: 0 of 24 (0.0%)
- After Session 7: 0 of 24 (0.0%) — config unchanged

A confirming scrape run (`reports/lotus_scrape_session7.log`) reproduces the Phase C result: 3/3 pages static-zero, 3/3 Playwright-zero, 0 image entries rewritten. Download was skipped because the scrape produced no rewritten URLs.

## Recommendation

**Abandon the `angle_url_patterns` lever for Lotus.** The Session 6 placeholder-only recommendation in `reports/persistent_low_coverage_brands.md` is the right call, but the diagnosis there should be revised: Lotus is NOT a shadow-DOM / CSS-bg case like Ferrari. Lotus emits real `<img>` tags with usable alt text but uses a Sitecore Cloud CDN whose URLs lack a path-ending image extension, so they're filtered out by `isPlausibleImageURL` before any angle matcher sees them.

### Future-work hook (for a different session)

If a future session decides to unblock Lotus (and similar Sitecore-Cloud brands), the change is a **2-line tweak to `isPlausibleImageURL` in `scripts/scrape_image_urls.mjs`**: either (a) accept `Content-Type: image/*` from the Playwright network observer as evidence of plausibility, or (b) treat the host `wlt-p-001.sitecorecontenthub.cloud` / `eus-mediadeliveryservice.sitecorecloud.io` as a brand-config-driven exception that bypasses the extension check. Option (b) is more conservative — only opt-in brands would relax the filter. This would also help any other manufacturer on the Sitecore Content Hub stack (none observed in the catalog today, but a known-quantity infrastructure).

For Session 7, this is out of scope (the safety rules forbid modifying the production scraper).

## Notes for the aggregate report

- **Lotus = 0% remains; lever does not apply.** Add to the "no-config-changes-this-session" bucket of the aggregate report.
- The Session 6 root-cause diagnosis for Lotus (shadow-DOM/CSS-bg per Ferrari) was **wrong on detail but right on outcome**. The actual root cause is the URL-extension filter rejecting Sitecore CDN paths. Documented in this report; suggest updating `reports/persistent_low_coverage_brands.md` Lotus section in a future session.
- Diag scripts produced: `scripts/diag_lotus_candidates.mjs`, `scripts/diag_lotus_playwright.mjs`, `scripts/diag_lotus_playwright_raw.mjs`. Logs at `reports/lotus_candidates_raw.log`, `reports/lotus_playwright_raw.log`, `reports/lotus_playwright_raw_full.log`.
- The lotus.json brand config is **unchanged** — no `angle_url_patterns` field was added because no patterns would fire.
- Lotus is a 1-line bug-fix away from unblocking (Sitecore CDN URL plausibility), separate from the angle_url_patterns workstream. Flag for an "upstream scraper enhancement" backlog ticket if/when policy allows another scraper change.
