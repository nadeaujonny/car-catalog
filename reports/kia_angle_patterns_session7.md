# Kia Angle URL Patterns — Session 7 Phase A3

Date: 2026-05-14. Task: derive brand-specific `angle_url_patterns` for kia.com candidates whose URL/alt text doesn't carry English angle vocabulary.

Catalog: 16 models, 64 image entries (4 angles per model trim).

## Headline

| Metric | Session 6 baseline | Session 7 final | Delta |
|---|---:|---:|---:|
| Downloads (kia) | 11 / 64 | **14 / 64** | +3 |
| Coverage % | 17.2% | **21.9%** | +4.7 pp |
| Scrape rewrites | 11 | 14 | +3 |
| Brand-specific matches | 0 | 3 | +3 |

Three additional models now have a confirmed-correct front_three_quarter image: **seltos** (lx), **k5** (lxs, was already side_profile only), and **sorento** (lx, was already side_profile only).

## Patterns added

```json
"angle_url_patterns": {
  "front_three_quarter": [
    "\\bgallery[-_]?ext\\d+\\b"
  ]
}
```

**1 pattern total, only for front_three_quarter.** Justification:

- Kia's in-page-gallery URLs follow the convention `{model}-mep-gallery-ext{N}.jpg` (or `gallery-ext{N}` without `mep-`). The `-ext{N}` infix is the precision lever: it guarantees an EXTERIOR shot (vs interior cabin shots which use unnumbered `gallery-{N}`), and the numbered exterior frames (`ext1`, `ext2`, `ext3`) are conventionally framed as front-3/4 beauty shots by kia.com's marketing team.
- Verified visually (via WebFetch image read) on 4 of 4 candidates that matched the pattern: seltos `ext1`, k5 `ext2`, sorento `ext3`, niro-hev `ext1` — all are clean front-3/4 driver's-side views of the model in motion. 100% precision on observed candidates.

### Patterns considered and rejected

1. **`\bin[-_]?page[-_]?gallery\b`** (initial, broader version) — rejected. First test run matched 6 URLs; 2 were false positives:
   - k4-hatchback `mep-gallery-01` → actual image is rear-3/4 (verified visually)
   - sportage-hybrid `mep-gallery-6` → actual image is an INTERIOR seat shot
   - Refining to require `-ext\d+` eliminated both false positives at the cost of losing 1 correct match (sportage `mep-gallery-1` which was correctly front-3/4 but lacked the `-ext` infix).

2. **`\bthree[-_ ]?quarter[-_ ]?back\b`** for rear_three_quarter — initially added, then removed. The pattern correctly matched the alt text "three-quarter back view" on niro-hybrid's 375 global-hero file, but visual verification of the actual image (https://www.kia.com/us/content/dam/kia/us/en/vehicles/niro/2026/mep/global-hero/375-hero-my26-niro-hev-v2.jpg) revealed it's a **front-3/4 driver's-side view** in motion — Kia's source alt text is mislabeled. Keeping the pattern would place a front-3/4 image into the rear_three_quarter slot for niro-hybrid (a wrong-angle false positive). Removed.

3. **`\bglobal[-_]?hero\b`** for front_three_quarter — rejected. Empirical evidence from the 7-page candidate dump shows kia chose different hero angles per model:
   - sorento `/mep/hero/` → side-profile (alt: "three-quarter driver's side view")
   - sorento-hybrid `/mep/global-hero/` → front-3/4 (alt: "three-quarter front view")
   - niro-hybrid `/mep/global-hero/` → image visually front-3/4 (despite "back view" alt, see above)
   - k4-hatchback `/global-hero/` → likely front-3/4 (alt: "Exterior Shot... GT-Line Turbo in the desert" — non-specific)
   
   Mixing front, side, and possibly other angles under one pattern would seed at least 1 confirmed false positive (sorento's `/mep/hero/` IS the side-profile image — the standard `side` regex correctly places it).

4. **`\bmep[-_]?hero[-_]?v\d\b`** for scene7 hero URLs (ev6, k5, carnival-hev) — rejected. K5's scene7 hero matches a fiftyfifty sister alt "three-quarter driver's-side view", suggesting the scene7 hero is also a side angle for k5. Without WebFetch-able binary image inspection of scene7 URLs (which return AVIF/JPEG that the tool can't render directly without going through the image-read fallback per URL), we lacked confident angle confirmation. Skipped.

5. **`\bfiftyfifty\b` / `\btrim[-_]highlight\b`** for front_three_quarter — rejected. Of 6 sampled fiftyfifty trim-highlight URLs, 2 had alt confirming "driver's-side view" (k5, carnival-hybrid) and 2 had alt confirming "front view" (sorento, niro). Mixed angles. The standard `front[-_ ]?view` and `side` rules already catch these correctly via their alt text.

6. **`\bin[-_]?page[-_]?gallery[/_-]exterior\b`** — considered (sorento URL uses `/in-page-gallery/exterior/`). Too rare in the dump (only 1 model uses the `/exterior/` path segment), and the broader `gallery-ext\d+` pattern already catches the same file.

## False-positive risks considered

| Risk | Mitigation |
|---|---|
| Gallery file at position N is not front-3/4 | Restricted to `-ext\d+` exterior-numbered files; verified all observed matches are front-3/4. |
| Kia changes gallery file naming convention | Pattern is brand-config-only; can be revised without script changes. |
| Multiple gallery files match (ext1, ext2, ext3) per model and the script picks the wrong one | The script's scoring tie-breaks on resolutionBonus + weight, but all gallery-ext files at a given model are the same resolution class. In observed cases, the static fetch surfaces only ONE gallery file per model (page is JS-rendered for the rest), so this is moot. |
| Future kia models have non-front-3/4 exterior gallery leads | Acceptable per the precision bias: a wrong match is worse than a miss, but the `-ext` constraint already guards against the worst case (interior shots). |

## Tokens seen but couldn't confidently map

The 7-page diag surfaced these recurring URL tokens that contain potentially-useful angle signal but couldn't be safely mapped to a single angle:

| Token | Models | Why not mapped |
|---|---|---|
| `/global-hero/`, `/mep/global-hero/` | sorento-hev, niro-hev, k4-hatchback, sportage-phev, sorento-phev | Angle varies by model (front, rear, side). No single mapping is safe. |
| `/mep/hero/` (no "global-") | sorento, sorento-phev | Mixed (sorento = side; sorento-phev = front per alt). |
| `mep-hero-v\d`, `hero-v\d` (scene7) | k5, ev6, carnival-hev | Empty alt + can't visually verify scene7 URLs en masse. |
| `1920-hero-`, `1440-hero-`, `1024-hero-` filename prefix | All models | Same image as `375-hero-` at different resolutions; angle inherited from the model's hero choice (which varies). |
| `fiftyfifty`, `5050-trim-highlight` | All models | Marketing trim-highlight shots; angle varies (front/side per model). Standard patterns catch most via alt. |
| `mm-` infix in `kia-*-mm-large-desktop-static.png` | All nav imagery | Main-menu nav PNGs; small thumbnails, not useful per-angle. Already blacklist-adjacent. |
| `/in-page-gallery/.../gallery-\d+\.jpg` (no `-ext`) | sportage, k4-hatchback, sportage-hybrid | Mixed angle (sportage gallery-1 = front; k4hb gallery-01 = rear; sportage-hybrid gallery-6 = interior). Without the `-ext` exterior marker, kia carousel position doesn't predict angle. |
| `/logo-banner/`, `/flexible-logo-banner/` | k4-hatchback, sportage-phev, sorento, niro | Logo/award banners — not vehicle photography. |
| `kia-column-control-*` | ev6 (charger imagery) | Feature/accessory shots, not vehicle-angle imagery. |
| `awards/5-star-safety-ratings.png` | ev6 | Award badges, not vehicle photography. |
| `-mep-5050-*` variants | All models | Marketing 50/50 panels; mixed angles within. |

## Recommendation

**Keep** the single `front_three_quarter` pattern. It is conservatively scoped (requires `-ext` exterior marker), 100% precise on observed candidates, and adds 3 net correct downloads to the kia coverage.

**Do not** re-add the rear or hero-path patterns. Kia's URL/alt data is too inconsistent to support broader matching:
- Kia chose different hero angles per model (no single regex distinguishes them safely).
- Kia's alt text on the global-hero 375 niro file is mislabeled at the source, making text-pattern rear matches unreliable.

**Future work to lift kia further** (out of scope for this session, all require shared-script changes):

1. **Per-model angle hints in brand config** — extend the schema so `angle_url_patterns` can be keyed by model_slug, allowing `niro-hybrid` to map `/global-hero/` → rear_three_quarter while `sorento-hybrid` maps the same path to front_three_quarter. Captures Kia's per-model hero choices.
2. **Playwright escalation lift** — the SLUG_MATCH_ESCALATION_THRESHOLD currently blocks Playwright on kia pages (all pages return 9–22 slug-matching candidates, well above the threshold). Lowering the threshold for kia specifically would allow positional fallback (`pickByPosition`) to fire and pick the largest hero image as front_three_quarter regardless of URL signal. Estimated gain: another 8–10 entries (front_three_quarter slots for k4-hatchback, sportage, sportage-hybrid, carnival, ev9, etc.).
3. **Vision-based angle classification** — for the 50 unresolved entries that all currently point at the kia model page URL (text/html), run a fallback that fetches the Playwright-rendered page, picks the top-N hero candidates, downloads them, and uses an image classifier to assign angle labels. High lift potential but adds dependencies.

## Files touched

- `scripts/brand-configs/kia.json` — added `angle_url_patterns` (1 pattern under front_three_quarter); appended Session 7 Phase A3 paragraph to `notes`.
- `reports/kia_scrape_session7.log` — scrape session log.
- `reports/kia_download_session7.log` — download session log.
- `reports/kia_candidates_raw.log` — refreshed candidate dump (no schema change, just rerun).
- `reports/kia_angle_patterns_session7.md` — this report.

NOT touched: `scripts/scrape_image_urls.mjs`, `scripts/download_images.mjs`, `instructions/`, `data/_partials/`, other brand configs.

## Image cleanup performed during session

During iteration, the broader initial pattern (`\bin[-_]?page[-_]?gallery\b`) and the rear `\bthree[-_ ]?quarter[-_ ]?back\b` pattern each produced 1–2 wrong-angle cached files on disk. These were deleted and their `downloaded:true` flags reset before the final tally:

- `catalog/images/kia/k4-hatchback/ex/front-three-quarter.jpg` — was a rear-3/4 image from `gallery-01`. Deleted.
- `catalog/images/kia/sportage-hybrid/lx/front-three-quarter.jpg` — was an interior seat shot from `gallery-6`. Deleted.
- `catalog/images/kia/sportage/lx/front-three-quarter.jpg` — was correctly front-3/4 from `gallery-1`, but the refined pattern no longer resolves it; deleted to keep catalog state consistent.
- `catalog/images/kia/niro-hybrid/lx/rear-three-quarter.jpg` — was a front-3/4 image with mislabeled "back view" alt. Deleted.

The 14 images remaining on disk for kia are all verified-correct for their declared angle.
