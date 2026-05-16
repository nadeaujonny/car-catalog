# Hyundai Phase-3 Image-Scrape Investigation — 2026-05-14 (session 6)

## Headline

| | before | after |
|---|---:|---:|
| Coverage (images downloaded / 152 entries) | 0 (0.0%) | **0 (0.0%)** |
| Image entries rewritten by scraper | 0 | **0** |
| Slug-matching candidates per page | 95–457 raw, 0 matched (Phase C) | 60–456 raw, 18–210 **slug-matched**, 0 angle-matched |

Coverage did **not** change. The fix the brief contemplated — slug_variants — is the wrong lever for this brand. Root cause is one level deeper than initially diagnosed: the slug filter is already accepting plenty of candidates; the *angle* filter then rejects them all.

## Root cause (confirmed by `scripts/diag_hyundai_candidates.mjs`)

Hyundai's consumer pages (hyundaiusa.com/us/en/vehicles/<model>) serve image assets from `s7d1.scene7.com/is/image/hyundai/...` — the *same* CDN that powers Genesis (which is at 81.9% coverage). Static fetch returns ~60–456 image candidates per model page; **a healthy fraction contain the model slug**:

| page          | raw cands (post-blacklist) | slug-matching | matched by angle patterns |
|---------------|----:|----:|----:|
| tucson        | 222 |  93 | **0** |
| elantra       | 126 |  45 | **0** |
| ioniq-5       | 190 |  69 | **0** |
| santa-fe      | 206 |  85 | **0** |
| sonata        | 456 | 210 | **0** |
| ioniq-9       | 286 | 117 | **0** |
| santa-cruz    | 164 |  64 | **0** |
| ioniq-5-n     | 158 |  45 | **0** |
| elantra-n     | 132 |  48 | **0** |
| venue         | 110 |  37 | **0** |
| kona          |  94 |  29 | **0** |
| ioniq-6-n     |  60 |  18 | **0** |
| palisade      |  43 |   0 (escalated, PW: 240/?) | **0** |
| nexo          |   0 | — (hyundainews.com — empty) | 0 |

So slug-matching is **not** the gap. The gap is at `pickBestForAngle`. Hyundai's scene7 filenames use:
- **Internal numeric IDs**: `2025-tucson-nx4-0272-…`, `2024-santa-fe-mx5-0147-…`, `2026-ioniq-5-0901-…`. The number is opaque — no `front` / `rear` / `34` / `f34` token.
- **Page-section labels**: `vlp-hero` (the main hero shot — almost certainly a front-3/4, but the URL never says so), `media-slider`, `vert-tabs`, `vertical-tabs`, `carousel`.
- **Feature illustrations** that are not really vehicle angles at all: `bluelink`, `digital-key`, `wifi-hotspot`, `solar-panels`, `home`, `3rd-rowseating`, `lights-on`, `dkey2touch`.
- **Chassis platform codes** (`nx4` Tucson, `mx5` Santa Fe, `ne` Ioniq 5) — model identifiers, not angles.

Alt text on `<img>` tags is uniformly the **literal string "placeholder"** (392 of 426 imgs on tucson, repeating); `<source srcset>` entries carry empty alt (the script only reads alt from `<img>`). So the haystack for angle scoring is effectively `url + " " + ""`, and the angle regexes (`/front[-_ ]?(?:three-quarter|34|3q|view)/`, `\bdashboard\b`, `\bprofile\b`, etc.) match **zero** of them.

**Comparison — why Genesis works on the same CDN**: Genesis's filenames are descriptive English: `2026-gv70-35t-spt-pst-awd-…-front-driver-angle-studio-3:16-9`, `2026-g70-33t-…-profile-passenger-studio:24-9`. So `(?:^|[-_/ ])front(?:[-_ ]|$|\.)` scores 7 on Genesis but matches nothing on Hyundai. Same CDN host, different naming conventions.

## Fix applied (config-only)

Edited `scripts/brand-configs/hyundai.json`:

1. **Documented the structural finding in `notes`** so future sessions don't try to "solve" this with more slug variants.
2. **Tightened `path_blacklist_regex`** to drop the obvious junk classes the diag surfaced — `future-vehicles` (Boulder Mountain RQ3, Crater concept, future-vehicle teasers showing up on every model page), `hyundai-home` / `home-solar` / `solar-panels` (Hyundai Home Energy hub-page cross-link), `dkey2touch` / `digital-key` / `wifi-hotspot` (feature-illustration shots that don't represent the vehicle at any standard angle), `crater-concept`, `boulder-mountain`, `cpo` (certified-pre-owned cross-links).

The blacklist tightening reduces noise but **does not lift coverage**: even after dropping ~30–40 candidates per page, none of the survivors match angle patterns either. The signal is still zero because the survivors are still numeric-coded or `vlp-hero`-labelled.

No changes were made to `slug_variants` — the existing variants are correct, and tightening them or adding new ones cannot affect angle scoring.

## What I did NOT do, and why

| considered | rejected because |
|---|---|
| Add chassis codes (`nx4`, `mx5`, `ne`, `cn7`) to `slug_variants` | Slug-matching already succeeds on 18–210 candidates per page. Adding chassis variants would only **widen** the slug filter — but the bottleneck is the angle filter, which sees the same URLs after slug filtering. Zero new matches would result. |
| Repoint `model_pages` to a different URL pattern | The hyundainews.com press site (used for Nexo) returns 0 candidates total; switching everything to it would make coverage *worse*. No alternate per-model URL set exists for Hyundai USA. |
| Edit `scripts/scrape_image_urls.mjs` to add Hyundai-specific angle heuristics | Task brief says "Conservative on shared script." Beyond preference, this is also fragile — `vlp-hero` is *probably* a front-3/4 hero, but pretending we know that for every Hyundai model would scatter the wrong image into 152 entries without a way to recover. The honest catalog state for Hyundai is "no scraped imagery" rather than "scraped imagery with high probability of angle-mismatch". |
| Manually edit `data/hyundai.json` | Explicitly forbidden by the task safety rules. |

## Re-run results

```
node scripts/scrape_image_urls.mjs --brand hyundai  →  reports/hyundai_scrape_session6.log
node scripts/download_images.mjs   --brand hyundai  →  reports/hyundai_download_session6.log
```

| | value |
|---|---:|
| Pages attempted | 14 |
| Pages failed | 1 (nexo press site — 0 candidates either path) |
| Pages escalated to Playwright | 2 (palisade got 0 slug-matching from static so it escalated under the session-6 gate; nexo escalated under the old rule) |
| Playwright successes | 1 (palisade — 240 candidates, still 0 angle-matched) |
| Playwright failures | 1 (nexo — 0 cands) |
| **Image entries rewritten** | **0** |
| Download attempts | 152 |
| Downloads succeeded | 0 |
| Download failures | 152 (147 × `wrong-content-type text/html` on hyundaiusa.com consumer pages + 5 × same on hyundainews.com nexo) |

Coverage: **0.0% before → 0.0% after.** The brand JSONs were not mutated (the scraper backs up before the `cat.models` write but `rewritten === 0` so the saved file is identical to the pre-run state — the `.bak` files in data/ and catalog/data/ are therefore byte-equivalent placebos for this brand).

## Brand-level recommendation

This is a **structural** failure that requires either a script change or an acceptance decision. Three paths forward, in increasing order of cost:

1. **Accept and document (cheapest, what this session does).** Hyundai stays at 0% in Phase 4. Update `STATUS.md` / `PROJECT_STATE.md` to note Hyundai is in the "structurally unscrapeable with current pipeline" bucket alongside Tesla (anti-bot), Ferrari (PW returns 0), and Lotus (PW returns 0). 152 entries display as missing in the catalog.
2. **Add a brand-config angle-pattern injector to the shared script (moderate).** A new optional key `angle_url_patterns` in `scripts/brand-configs/<brand>.json` whose value extends `ANGLE_PATTERNS` per-brand. For Hyundai it would map `front_three_quarter` to a single literal `/vlp-hero/` regex with score ~6 — accepting the assumption that the page-hero shot is the front-3/4. Side / rear / interior would still be unrecoverable. Estimated lift: ~25% (just the front-3/4 angle on the 13 models with a working consumer page; nexo stays at 0). Risk: cross-model leakage if multiple `vlp-hero` candidates rank equally; would need additional rank tie-breakers.
3. **Position-and-size fallback for the static path (most work, biggest lift).** The current `pickByPosition` only fires on the Playwright path because it depends on rendered-DOM bounding boxes. A static-side variant could rank by srcset descriptor (largest `wid=` first), preload-priority, and og:image declaration to nominate a single front-3/4 per model without any angle regex. Genesis-style brands keep using the angle regex; Hyundai-style brands fall back. Risk: still rear/side/interior unrecoverable. Estimated front-3/4 lift: 30–35%.

My recommendation is **option 2 (`angle_url_patterns` brand-config key)** — it is the smallest shared-script change that solves Hyundai cleanly and would also help mazda/ford/kia/ram (all "match-gap" Tier-C brands with similar candidate-but-no-angle-word URLs). Document option 3 as a follow-up if the front-3/4-only fix proves insufficient.

## Files touched this session

- `scripts/brand-configs/hyundai.json` — notes expanded; path_blacklist tightened
- `scripts/diag_hyundai_candidates.mjs` — new diagnostic (safe to delete after read)
- `reports/hyundai_candidates_raw.log` — raw dump from 4 pages (tucson, elantra, ioniq-5, santa-fe)
- `reports/hyundai_scrape_session6.log` — scrape re-run log
- `reports/hyundai_download_session6.log` — download re-run log
- `reports/hyundai_phase3_investigation.md` — this report

Data JSONs (`data/hyundai.json`, `catalog/data/hyundai.json`) were unchanged — scraper rewrite count was 0.
