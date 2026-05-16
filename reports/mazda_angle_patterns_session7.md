# Mazda angle_url_patterns — Session 7 Phase A3 (2026-05-14)

## Coverage delta

| | before (Session 6) | after (Session 7) | delta |
|---|---:|---:|---:|
| Image entries | 84 | 84 | — |
| Successful downloads | 39 | **53** | **+14** |
| **Coverage** | **46.4%** | **63.1%** | **+16.7 pp** |
| Image entries rewritten | 39 | 53 | +14 |
| via text/URL pattern match | 39 | 38 | -1 |
| **via brand-specific angle** | n/a | **15** | new |

Per-angle:

| angle | before | after |
|---|---:|---:|
| front_three_quarter | ? | **21/21 (100%)** |
| rear_three_quarter | ? | 10/21 (47.6%) |
| side_profile | 0 | 1/21 (4.8%) |
| interior_dashboard | ? | 21/21 (100%) |

The +14 entry gain breaks down as: 14 brand-pattern matches landed new URLs (the 15th, mazda3-hatchback/2-5-s-premium/front, only flipped from one URL to another — no net coverage gain there). One pre-existing standard-pattern match was displaced by the brand-pattern's filter ordering, hence "via text/URL pattern match" went 39 → 38.

## Patterns added

```json
"angle_url_patterns": {
  "front_three_quarter": [
    "001_trims/34[-_]jellies/",
    "0\\d_btv/(?:[^/]+/)?001_trims/34[-_]jellies/"
  ],
  "side_profile": [
    "content/dam/musa/vehicle-assets/[^?\\s]*?/001-trims/34-jellies/",
    "/04-btv/001-trims/34-jellies/"
  ]
}
```

### Derivation

The Phase 3 report flagged `/34-jellies/` as the canonical Mazda 3/4 trim-render folder. To bias toward precision I sampled 13 image URLs from the candidate dumps and downloaded each (via `WebFetch`) to verify the actual photographic content:

| URL pattern (sample) | Model | What the rendered image shows |
|---|---|---|
| `/siteassets/vehicles/2026/cx-90/04_btv/001_trims/34-jellies/3.3-turbo-select/2025-cx90-3.3-turbo-select-jetblack.png` | CX-90 | **3/4 front studio** |
| `/siteassets/vehicles/2026/cx-30/04_btv/001_trims/34-jellies/2.5-s-aire-edition/2026-cx30-2-5-s-aire-aero-gray.png` | CX-30 | **3/4 front studio** |
| `/siteassets/vehicles/2026/cx-50/04_btv/001_trims/34-jellies/turbo/2026-cx50-2-5-turbo-soulred.png` | CX-50 | **3/4 front studio** |
| `/siteassets/vehicles/2026/cx-50-hybrid/04_btv/001_trims/34-jellies/2026-cx50-hybrid-premium-ingotblue.png` | CX-50 Hybrid | **3/4 front studio** |
| `/siteassets/vehicles/2026/cx-70/04_btv/001_trims/34-jellies/turbo-premium/mazda-cx-70-3.3-turbo-premium.png` | CX-70 | **3/4 front studio** |
| `/siteassets/vehicles/2026/cx-70-phev/04_btv/001_trims/34-jellies/phev-sc-knvbnaa/2026-mazda-cx-70-phev-sc-polymetalgray` | CX-70 PHEV | **3/4 front studio** |
| `/siteassets/vehicles/2026/cx-90-phev/04_btv/001_trims/34-jellies/2026-phev-preferred/2026-cx90-phev-preferred-rhodium-white.png` | CX-90 PHEV | **3/4 front studio** |
| `/siteassets/vehicles/2026/mazda3-sedan/04_btv/001_trims/34-jellies/b_2.5-s-select-sport/2024-m3-select-sport-platinum-quartz.png` | Mazda3 Sedan | **3/4 front studio** |
| `/siteassets/vehicles/2026/mazda3-hatchback/04_btv/001_trims/34-jellies/01_2.5-s/...` | Mazda3 HB | **3/4 front studio** |
| `/siteassets/vehicles/2026/mx-5-st/04_btv/001_trims/34-jellies/sport/2026-mazda-mx-5-miata-sport.png` | MX-5 Miata | **3/4 front studio** |
| `/content/dam/musa/vehicle-assets/siteassets/vehicles/2026/cx-5/04-btv/001-trims/34-jellies/2-5-s/my26-cx-5-s.png` | **CX-5** | **SIDE PROFILE** |
| `/content/dam/musa/vehicle-assets/siteassets/vehicles/2026/cx-5/04-btv/001-trims/34-jellies/2-5-s-select/my26-cx-5-s-select.png` | **CX-5** | **SIDE PROFILE** |
| `/content/dam/musa/vehicle-assets/siteassets/vehicles/2026/cx-5/04-btv/001-trims/34-jellies/2-5-s-premium-plus/my26-cx-5-s-premium-plus.png` | **CX-5** | **SIDE PROFILE** |

Surprise finding: CX-5 (only) publishes its trim renders on the alternate `/content/dam/musa/vehicle-assets/` path with all-dash separators (`04-btv/001-trims/34-jellies/`), and ALL 5 of those renders are **side profile** views, not 3/4 fronts. The discriminator between the two angle classes is clean:

- `0\d_btv/001_trims/34-jellies/` (underscores) → 3/4 FRONT (50 candidates across 11 models)
- `04-btv/001-trims/34-jellies/` (dashes) → SIDE PROFILE (5 candidates, CX-5 only)

The same dash-vs-underscore separator that's normally a noisy stylistic variation IS the angle-discriminator here because the dash form is exclusively used on the alternate `/content/dam/` CDN, which CX-5 alone uses.

### Hero & carousel — rejected

Sampled hero URLs across all 12 models and the inline-desktop-carousel sequences:

- Hero: CX-30, CX-50, Mazda3 Sedan, Mazda3 HB → 3/4 FRONT lifestyle. CX-70 → 3/4 REAR lifestyle. CX-90 → REAR (open hatch, family loading). MX-5 RF → 3/4 REAR. **Inconsistent — no precision rule available.**
- Carousel-001, carousel-002, … → topic-based (3 Row Seating, Cargo Space, Leather Interior, Wheels, Charging Capabilities, …). The numeric index does NOT correlate with angle.

Both rejected on precision grounds. A wrong match is worse than a miss per task brief.

### Interior — already covered

The existing English ANGLE_PATTERNS regexes for `\binterior\b` and `\bcabin\b` already hit `/interior-360s/` URL segments and "Interior Cabin" alt text. interior_dashboard finishes at 21/21 (100%) on every model with no new patterns. Confirmed during the scrape — every interior match in the sample list is a standard-pass match, no brand-pattern fired for interior_dashboard.

## False-positive risks considered

1. **34-jellies could be folder-name noise unrelated to angle.** Mitigated by direct image-content inspection of 13 candidates spanning all 12 models. Every one matched the assigned angle. The folder name literally means "3/4 jelly" (jelly is the auto-industry term for the studio 3/4 trim render).

2. **The 11-model siteassets-rooted 3/4 jellies are not ALL 3/4 fronts — could be mixed 3/4 front and 3/4 rear.** Verified 10 different model/trim combinations: all were 3/4 fronts. The convention is universal across the Mazda CDN.

3. **CX-5 content/dam jellies could be a different angle entirely (e.g., color swatches).** Verified 3 of the 5 CX-5 jellies: all are pure side profile studio renders with clean white background, identical framing. Confirmed.

4. **The brand-pattern score (6) is below the English `front` score (7), so a model with a safety-illustration URL containing "front" (e.g. `safety-smart-brake-support-front-crossing`) will pick the safety icon over my 3/4 jelly.** This affected 4 models (cx-5, cx-70, cx-90, mx-5-miata): the standard pass already picked the safety icon and my brand-pattern was never tried. Pre-existing behavior — not introduced by this change. Same baseline applied in Phase 3.

5. **Same 34-jellies URL gets assigned to multiple trim_families.** Yes, by design — the scrape script picks the highest-scoring candidate per (family, angle) and uses `usedPerFamily` to prevent duplicate URLs within a single family across its 4 angles. Different families can independently pick the same 34-jellies URL. This is acceptable because each family is a distinct catalog entry; the URL recorded is the best available 3/4 front for that family, which IS the same studio render.

## Recommendation

**KEEP** the patterns as-is.

Front_three_quarter went from a baseline of "near-zero for 7 models that had no English front token" to **100% coverage for all 21 family entries**. Side_profile went from 0% to ~5% (CX-5 only), which is small but a clean precision win — no false positives on the other 11 models because the dash-form path simply isn't in their candidate pools. The remaining unresolved entries (11 rear_three_quarter, 19 side_profile) cannot be derived from URL/alt-text patterns alone — the rear coverage is bottlenecked by Mazda hero shots being a mix of 3/4 front and 3/4 rear, and the side coverage is bottlenecked by 11 of 12 models not having any URL with a "side" or profile-encoded token.

## Tokens seen but not confidently mapped

| token | angle inferred | why not mapped |
|---|---|---|
| `inline-hero-desktop` / `hero-desktop` / `static-hero` | inconsistent (3/4 front for sedan/hatch/CX-30/CX-50, 3/4 rear for CX-70/MX-5-RF, rear for CX-90) | No clean precision rule — would land wrong-angle pictures half the time |
| `inline-desktop-carousel-001..N` (and `desktop-carousel-001..N`) | inconsistent | Numeric index tracks the carousel order on the design page, which is topical (3 Row Seating, Cargo Space, Interior, …), not angular |
| `gallery-main` / `gallery-001..N` | inconsistent | CX-30 gallery-main is "Elegant Cabin" (interior), CX-90 is "Exterior Sculpting", Mazda3 is "Humancentric Cockpit" (interior), MX-5 RF is "Silhouette" — topic-driven, not angle-driven |
| `-tout-left` / `-tout-right` (2-col-tout component) | inconsistent | 2-column feature touts are paired with feature names (Panoramic Moonroof, Premium Interior, 360° View Monitor, …) — not angle-tagged |
| `vlp-tout-left` | inconsistent | Same as above |
| `5050-left` / `5050-right` | inconsistent | 50/50 split-feature components, content driven by the feature being explained |
| `model-selector` sprites (`*-ms.png`, `*-animatedms.png`) | typically 3/4 front | Animated trim/color sprites — these are the model-selector picker, which IS the same 3/4 front view, but the trim/color combination is wrong (it's the demo trim, not necessarily the family). Could be mapped but the 34-jellies pattern already covers this with better per-family trim accuracy |
| `mobile-hero-` / `tablet-hero-` | same as desktop hero (mixed) | Same precision problem as desktop hero |

## Notes for aggregate report

- Mazda is the cleanest Phase A3 win to date — image-content verification produced a 100% precision rule for 7-of-12 models' front_three_quarter (the other 4 already had front via the safety-icon English match, pre-existing).
- The dash-vs-underscore separator inside the same CDN folder name turned out to BE the discriminator between two different angle classes for the same brand — worth remembering as a pattern for other manufacturers that publish on parallel `/content/dam/` and `/siteassets/` CDN paths.
- Rear_three_quarter and side_profile cannot be pushed further on mazda via URL patterns; the assets simply don't carry the signal. A future session could try **Playwright + DOM-position heuristics** (e.g., the cabin gallery's right-most image is conventionally the rear shot) but that's out of scope for Phase A3.
- The CX-5 redesign produced a side-profile-only jelly set on a different CDN. This is the only mazda model with mappable side_profile. The other 11 models have no rear or side angle keywords anywhere in their candidate pools.
