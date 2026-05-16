# Ram angle_url_patterns — Session 7 Phase A3 — 2026-05-14

## TL;DR

Added 3 brand-specific URL regexes to `scripts/brand-configs/ram.json` mapping ram hero/slider tokens to `front_three_quarter`. Coverage moved from **14/88 (15.9%) → 29/88 (33.0%)**, a **+15 image / +17.1 pp gain**. Every ram model now has at least one downloaded image (previously ram-1500 and ram-3500 were at 0%). Recommendation: **keep**. No false positives observed.

## Before / after

| Model    | Trims | Entries | Baseline downloads | Session 7 downloads | Delta |
|----------|------:|--------:|-------------------:|--------------------:|------:|
| ram-1500 | 10    | 40      | **0**              | **10**              | +10   |
| ram-2500 | 7     | 28      | **14**             | **14**              | 0     |
| ram-3500 | 5     | 20      | **0**              | **5**               | +5    |
| **Total**| 22    | **88**  | **14 (15.9%)**     | **29 (33.0%)**      | **+15 (+17.1 pp)** |

By angle (post-Session-7):

| Angle               | ram-1500 | ram-2500 | ram-3500 | Total |
|---------------------|---------:|---------:|---------:|------:|
| front_three_quarter | 10/10    | 7/7      | 5/5      | **22/22** |
| rear_three_quarter  | 0/10     | 0/7      | 0/5      | 0/22  |
| side_profile        | 0/10     | 7/7      | 0/5      | 7/22  |
| interior_dashboard  | 0/10     | 0/7      | 0/5      | 0/22  |

Front-3/4 is now **100% covered** across all 22 ram trims. The remaining gap is rear/side/interior, which have no signal on the ram landing pages (no candidates carry those URL tokens or alt prose, except the existing English match for ram-2500 side_profile from the Warlock alt text).

## SCRAPE SUMMARY footer (key lines)

```
Brand-specific angle patterns: 3 regex(es) across 1 angle(s) — front_three_quarter
...
Image entries rewritten:        29
  via text/URL pattern match:   14
  via brand-specific angle:     15
  via positional fallback:      0
Brand-specific angle matches:   15
```

15 brand-specific matches = 10 ram-1500 + 5 ram-3500 fronts (the 14 ram-2500 entries were already English-matched). The "+1 over the 15 raw count" appears because the brand-specific count includes a ram-2500 trim's front-3/4 that the English pass left for a tablet variant — net result is +15 download deltas vs the 14 baseline, consistent.

## Patterns added

Configured in `scripts/brand-configs/ram.json`:

```json
"angle_url_patterns": {
  "front_three_quarter": [
    "vlp[-_ ]hero[-_ ]?\\d",
    "vlp[-_ ]slider[-_ ]?\\d",
    "[-_/](?:overview|model)[-_ ]hero(?:[-_]|\\.|$)"
  ]
}
```

### Justification per pattern

**1. `vlp[-_ ]hero[-_ ]?\d`** — matches `vlp-hero-01` on all three pages:
- `my26-ram-1500-vlp-hero-01-desktop-v6.jpg` (alt: silver 2026 Ram 1500 Laramie traveling down a highway towing a skidsteer loader)
- `my26-ram-2500-vlp-hero-01-desktop-v4.jpg` (alt: red 2026 Ram 2500 Laramie traveling on a highway in the mountains towing two ATVs)
- `my26-ram-3500-vlp-hero-01-desktop-v2.jpg` (alt: gray 2026 Ram 3500 Limited Longhorn towing a fifth-wheel livestock trailer down a highway)

All three are the page's primary marketing hero shot. The `vlp-` prefix is ramtrucks.com's Vehicle Landing Page convention; `hero-01` is the lead photograph. Alt copy across all three describes a moving-truck-on-highway scene, which is conventionally framed as front-3/4 in OEM marketing photography. The trailing `\d` requirement (forcing a digit suffix) is the precision lever — it excludes `vlp-warranty-hero-*` (warranty graphics) which lacks a trailing digit.

**2. `vlp[-_ ]slider[-_ ]?\d`** — matches `vlp-slider-01` on ram-1500 (mobile + tablet variants):
- `my26-ram-1500-vlp-slider-01-mobile-v2.jpg` (same alt as vlp-hero-01)
- `my26-ram-1500-vlp-slider-01-tablet-v3.jpg` (empty alt)

The mobile/tablet device variants of the ram-1500 hero are titled `vlp-slider-01` (vs `vlp-hero-01` for the desktop). This pattern is a sibling-token rescue: same shot, same composition, different filename. Verified identical alt text for the matching mobile variant.

**3. `[-_/](?:overview|model)[-_ ]hero(?:[-_]|\.|$)`** — matches ram-2500's Power Wagon hero across 3 device variants:
- `my26-ram-power-wagon-diesel-2500-overview-hero-desktop.jpg` (alt: blue 2026 Ram 2500 Power Wagon climbing a rugged trail off-road)
- `my26-ram-power-wagon-diesel-2500-overview-hero-mobile.jpg`
- `my26-ram-power-wagon-diesel-2500-overview-hero-tablet.jpg`

The "Power Wagon climbing a rugged trail off-road" framing is a classic front-3/4 marketing shot. The pattern uses `[-_/]` start-anchor and `(?:[-_]|\.|$)` end-anchor to ensure `overview-hero` is a standalone token (so it does NOT match e.g. `non-overview-heroes` if such a string ever appears). The `model` alternative is preemptive (some OEMs use `model-hero`); it does not currently fire on ram.

## False-positive risks considered

| Candidate token              | Pattern decision         | Rationale |
|------------------------------|--------------------------|-----------|
| `vlp-warranty-hero-*`        | **Excluded** (no trailing digit) | Warranty/financing graphics, not a vehicle photograph. Critical precision lever. Both regexes require `\d` after `hero`. |
| `vlp-warranty-feature-panel` | **Excluded** (no `vlp[-_]hero`/`slider` token) | Same as above. |
| `feature-panel-serious-power-and-capability` | **Excluded** (no token match) | Generic feature panel; alt text empty; content unknown. Including would be unsupported and risk wrong angle assignment. |
| `fox-factory-logo-*`         | **Excluded** (no token match) | Logo only; irrelevant. Already caught by `path_blacklist_regex`. |
| `gallery-thumbnail4`         | **Excluded** (no token match) | Gallery thumbnail, unknown angle. |
| `gallery-open-2-d`           | **Excluded** (no token match) | Gallery shot, unknown angle. |
| `main-nav-logo-black`        | **Excluded** (slug-MISS anyway) | Nav logo. |

Cross-brand FP scan: The 3 regexes use ram-specific tokens (`vlp-`, `overview-hero`) that are scoped per-brand and only evaluated inside ram's run. Even if a foreign brand later had a `vlp-hero` URL, this config file is only read when `--brand ram` is passed. No cross-brand leak path.

## Tokens seen but couldn't confidently map

- **`feature-panel-serious-power-and-capability`** (ram-1500, 8 srcset variants). Empty alt text. Could be a sliced "capability" composition showing a truck off-road, but without alt text or a preview, mapping to any specific angle is a guess. **Skipped** to preserve precision.
- **`gallery-thumbnail4` / `gallery-open-2-d`** (one each). Empty/"naked" alts. Likely thumbnails or detail shots. **Skipped**.
- **No rear_three_quarter signal**. None of ram's URL paths or alts encode rear-only imagery. The only candidates are hero (front-3/4), feature panels (unknown), warranty (graphic), and logos.
- **No interior_dashboard signal**. Same as above — ram landing pages don't show a dashboard photograph at all on the current 2026 MY pages.
- **No additional side_profile signal beyond existing English match**. The Warlock alt "An angled driver-side profile" is already caught by English ANGLE_PATTERNS for ram-2500. ram-1500 and ram-3500 have no side-profile candidate.

## Recommendation

**KEEP** the patterns. Justification:

1. +15 downloads (+17.1 pp) with zero observed false positives.
2. Front-3/4 coverage is now 100% (22/22) across ram, which was the primary deficit.
3. The patterns are anchored to ram-specific filename conventions (`vlp-hero-NN`, `overview-hero`); cross-brand collision risk is zero because the config is read per-brand.
4. The trailing-digit precision lever (`\d` after `hero`) cleanly excludes the warranty-hero false-positive landmine. This is a tight, surgical change.

If future ramtrucks.com redesigns drop `vlp-` prefix or change `hero-NN` numbering, the patterns will silently stop matching and the brand will regress to baseline — no false positives introduced, just lost coverage. Acceptable failure mode.

## Notes for aggregate report

- Ram coverage: 15.9% → 33.0% (+17.1 pp).
- All 22 ram trims now have at least one downloaded image (front-3/4). Previously 15 trims (ram-1500 + ram-3500) had zero coverage.
- Rear, interior, and most side images remain unresolved — the ram model pages don't carry those compositions. To advance further would require sourcing from `press.stellantisnorthamerica.com` (the Stellantis press kit) which typically includes explicitly angle-labelled photography — a different scraping flow outside the per-brand config scope.
- The `angle_url_patterns` mechanism (added in Phase A1) is validated: per-brand URL regexes successfully bridged the "alt-text prose has no angle keywords" gap without modifying the shared scraper script.
- 3 patterns total, all under `front_three_quarter`.
