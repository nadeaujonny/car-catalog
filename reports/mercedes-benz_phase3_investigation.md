# Mercedes-Benz Phase C-bis Investigation — 2026-05-14

## Headline

| | before | after |
|---|---:|---:|
| Image entries scraped + downloaded | **62 / 317 (19.6%)** | **102 / 317 (32.2%)** |
| Entries gained | — | **+40** |
| Entries lost (regression) | — | **0** |
| Models with zero downloaded images | 14 of 25 | 3 of 25 |
| Pages escalated to Playwright | 0 of 25 | 12 of 25 |
| `scripts/brand-configs/mercedes-benz.json` slug_variant additions | — | **11 variants across 8 models** |

## Root-cause diagnosis (Step 1+2)

Two distinct failure modes, not just "match gap":

### Failure mode A — slug-variant gap

The static fetch returns 4–62 plausible image candidates per page, but `slugMatchesURL` rejects most/all because the variants in the config don't match how mbusa.com names its URL paths and image files. Specific cases discovered:

| model | URL/filename form | existing variant | new variant added |
|---|---|---|---|
| `cle-cabriolet` | `/cle-class/cle-cab/...` `2026-CLE-CAB-*.jpg` | `cle-cabriolet`, `cle_cabriolet`, `clecabriolet` (none match `cle-cab`) | `cle-cab` |
| `maybach-s-class` | `/maybach/s-sedan-maybach/...` `S_maybach-*.jpg` `2026-S-MAYBACH-GAL-*.jpg` | `maybach-s` (matches "Mercedes-Maybach S 580" alt only — none of the URL forms) | `s-maybach`, `s-sedan-maybach` |
| `maybach-eqs-suv` | `/eqs-class/eqs-suv-maybach/...` `EQS-maybach-*.jpg` `2026-EQS-MAYBACH-SUV-GAL-*.jpg` | `maybach-eqs` (reverse word order — matches nothing in actual URLs) | `eqs-maybach`, `eqs-suv-maybach` |
| `maybach-gls` | `/maybach/gls-maybach/...` | `maybach-gls` (matches "Maybach GLS 600" alt but not URL path) | `gls-maybach` |
| `amg-gt-coupe` | `/amg-gt-class/amg-gt-2-dr/...` `2026-AMG-GT-COUPE-*.jpg` | `amg-gt` (matches both 2-dr and 4-dr — works but ambiguous) | `amg-gt-2-dr`, `amg-gt-2dr`, `gt-coupe` |
| `amg-gt-4-door-coupe` | `/amg-gt-class/amg-gt-4-dr/...` `2026-AMG-GT-4DR-COUPE-*.jpg` | `amg-gt-4door` (uses literal `4door`, URL uses `4-dr`/`4DR`) | `amg-gt-4-dr`, `amg-gt-4dr`, `gt-4dr-coupe` |
| `gla-suv` / `glb-suv` | `/gla-class/...` / `/glb-class/...` | `gla`/`glb` (work but broad) | `gla-class`/`glb-class` (more specific for path) |
| `sl-roadster` | `/sl-class/2026-SL-ROADSTER-*.jpg` | `sl` (works) | `sl-roadster` (added for filename clarity) |

### Failure mode B — JS-rendered pages

For 12 models the static fetch returned only 4–22 candidates total (all nav/logo/iris.jpg), because mbusa.com renders the model imagery client-side via JS. The session-6 escalation gate (`matchingCount < SLUG_MATCH_ESCALATION_THRESHOLD` = 3) is already in place — these pages had 0 slug-matching candidates from static, so Playwright DID escalate and surfaced 48–108 real candidates per page:

```
sl-roadster:        static 5 raw / 0 matching → playwright 101 DOM imgs → 53 plausible+matched
gla-suv:            static 5 / 0           → playwright 77            → 41
glb-suv:            static 5 / 0           → playwright 79            → 42
amg-gt-coupe:       static 5 / 0           → playwright 108           → 62
amg-gt-4-door-coupe: static 7 / 0          → playwright 95            → 60 (only 2 matched until new variant)
eqe-sedan:          static 7 / 0           → playwright 59            → 17
eqe-suv:            static 11 / 0          → playwright 67            → 18
eqs-sedan:          static 7 / 0           → playwright 58            → 18
eqs-suv:            static 13 / 0          → playwright 55            → 17
maybach-s-class:    static 6 / 0          → playwright 69            → 19 (47 with new s-maybach variant)
maybach-gls:        static 4 / 0           → playwright 48            → 24
maybach-eqs-suv:    static 22 / 1         → playwright 68            → 0 → 44 with new eqs-maybach variant
```

Once Playwright runs, the positional-fallback (`pickByPosition`) bonus also becomes available, which adds front_three_quarter picks for 32 entries.

## Slug-variant changes (Step 3+4)

Edited `scripts/brand-configs/mercedes-benz.json` — 8 models updated, 11 new variant strings added. All changes are additive (existing variants preserved). Validated for cross-contamination via `scripts/diag_mercedes_test_variants.mjs`: 31 of 31 positive tests pass; the 11 cross-matches all involve models that DON'T share a page URL, so the cross-match cannot fire in production (each model is filtered against its own page's candidates only).

Specifically NOT added:
- `s-sedan` to `s-class` — would false-match `s-sedan-maybach` paths.
- `eqs-suv-maybach` to `eqs-suv` — already covered by maybach-eqs-suv's own variants.
- `4door-coupe` aliasing — would over-fire.

`scripts/scrape_image_urls.mjs` was **NOT modified.** No ANGLE_PATTERNS changes were warranted: the MB filename codes (HC-D, EH-N, IH-N, SH-N, TH-N, EP-AMG, CH-N, CT-N, CL-N, CR-N, GAL-NNN-X-TE/TI-DR) are MB-specific and appear in no other brand's data.

## Re-run results (Step 5)

```
node scripts/scrape_image_urls.mjs --brand mercedes-benz
  Pages attempted:                25
  Pages failed:                   0
  Pages escalated to Playwright:  12 of 25   (was 0)
    Playwright successes:         12
    Playwright failures:          0
  Image entries rewritten:        102        (was 62)
    via text/URL pattern match:   70
    via positional fallback:      32

node scripts/download_images.mjs --brand mercedes-benz
  Total images attempted: 317
  Successful:             102 (32.2%)        (was 62, 19.6%)
  Failed:                 215 (all unchanged model-page URLs — no real download failures)
```

Per-model coverage (downloaded / total):

```
cla                       2/8     (was 2/8 — unchanged)
c-class                   4/16    (was 4/16)
cle-coupe                 3/12    (was 3/12)
cle-cabriolet             0/12    (was 0/12 — see "Residuals" below)
e-class-sedan             4/16    (was 4/16)
e-class-wagon             3/5     (was 3/5)
s-class                   8/16    (was 8/16)
maybach-s-class           2/10    (was 0/10) ← NEW
amg-gt-coupe              4/16    (was 0/16) ← NEW
amg-gt-4-door-coupe       4/16    (was 0/16) ← NEW
sl-roadster              10/20    (was 0/20) ← NEW
gla-suv                   2/8     (was 0/8)  ← NEW
glb-suv                   2/8     (was 0/8)  ← NEW
glc-suv                  10/20    (was 10/20)
glc-coupe                 6/12    (was 6/12)
gle-suv                  13/28    (was 13/28)
gle-coupe                 6/12    (was 6/12)
gls-suv                   3/12    (was 3/12)
maybach-gls               0/5     (was 0/5  — see "Residuals" below)
g-class                   0/12    (was 0/12 — see "Residuals" below)
eqe-sedan                 6/12    (was 0/12) ← NEW
eqe-suv                   3/12    (was 0/12) ← NEW
eqs-sedan                 4/16    (was 0/16) ← NEW
eqs-suv                   2/8     (was 0/8)  ← NEW
maybach-eqs-suv           1/5     (was 0/5)  ← NEW
```

## Sample successful matches

```
maybach-s-class/maybach-s-580-4matic/front_three_quarter
  → /maybach/s-sedan-maybach/class-page/series/S_maybach-design-hero.jpg
  (matched via new 's-maybach' variant + positional fallback)

amg-gt-coupe/amg-gt-55-4matic-plus/front_three_quarter
  → /amg-gt-class/amg-gt-2-dr/class-page/2026-AMG-GT-COUPE-HERO-DR.jpg
  (existing 'amg-gt' variant + Playwright + positional fallback)

amg-gt-4-door-coupe/amg-gt-43-4-door-coupe/front_three_quarter
  → /amg-gt-class/amg-gt-4-dr/class-page/amg/2026-AMG-GT-4DR-COUPE-HERO-DR.jpg
  (new 'amg-gt-4-dr' variant + Playwright + positional fallback)

sl-roadster/amg-sl-43/rear_three_quarter
  → /sl-class/gallery/gallery-type/2026-AMG-SL-ROADSTER-GAL-007-L-TE-DR.jpg
  (existing 'sl' variant + Playwright; alt text "Display AMG SL 43 in Hyper Blue" was the slug match)

eqs-sedan/eqs-450-plus/front_three_quarter
  → /eqs-class/eqs-sedan/class-page/series/2026-EQS-SEDAN-CPH-XL.jpg
  (existing 'eqs-sedan' variant + Playwright + positional fallback)
```

## Residual zero-image models (3 of 25)

`cle-cabriolet`, `maybach-gls`, `g-class` are still at 0 / (12, 5, 12). The root cause is **angle-match gap that the config layer cannot fix**:

- `cle-cabriolet` (static fetch returns 62 raw / 28 slug-matching): the alt texts on this page are "Aerodynamic design", "LED lighting", "Triple-layer soft top", "AMG styling", "Memorable seating", "Extended welcome", "Sun-reflecting leather", "Wireless connections", "Immersive audio", "Center air bag", "Hands-free parking", "Foresight for reversing", "Virtual watchdog", "Digital recognition", "Artificial intelligence", "Situational awareness", "Dolby Atmos", "All the headroom and tailwind". None hit any `ANGLE_PATTERN` (no "cockpit", "cabin", "dashboard", "front", "rear", "side" in either alt or URL). The sibling page `cle-coupe` got 3 entries scraped only because it happens to have alt "Finely crafted cabin" — cle-cabriolet does not.
- `maybach-gls` (Playwright returns 68 raw / 24 slug-matching): alts are all "Display Maybach GLS 600 in [color]". URLs are `GAL-NNN-X-TI-DR.jpg` style. No angle pattern hits text, and the positional fallback returned no qualifying candidate (visible+natW>=800+docY<=1600+not matching other angles) — probably because the gallery loads below the fold and the page's hero image has natW<800.
- `g-class` (static fetch returns 56 raw / 23 slug-matching → no Playwright escalation): alts are "Iconically timeless", "Enduringly crafted", "Functionally fashionable", etc. — none hit angle patterns. Static fetch produces no positional data, so `pickByPosition` cannot run.

For all three, slug match already succeeds; the problem is purely angle classification. The fixes that would unblock them are NOT config-layer:

1. **Add MB-specific angle patterns**: `HERO-DR` and `CH-N-N-DR` filenames are consistently the model's front-3/4 hero shot. `CR-N-N-DR` is camera-right (rear-3/4 candidate). `GAL-NNN-X-TI-DR` is `T`rim `I`nterior (interior_dashboard candidate). But adding these to `ANGLE_PATTERNS` violates the task's "must benefit ≥2 brands" rule — no other brand uses this naming.
2. **Change Playwright escalation gate** to also escalate when angle-match count is low (currently only triggers when slug-match count is low). This would route g-class through Playwright, which would then enable positional-fallback for front_three_quarter (~1 angle per trim = ~6 entries for g-class). This change would benefit other brands too (any brand where slug-match is fine but angle-match is starved on static — e.g. parts of ford, mazda per the Phase 4 report).
3. **Per-brand `angle_patterns` config override** would be the cleanest architectural solution — let `mercedes-benz.json` define MB-specific patterns alongside `slug_variants`. This is more invasive but fully scoped per brand.

The conservative recommendation, consistent with this task's preference for config-only changes: accept the 3 residual zeros as a known limitation of the current angle-classifier vs MB's marketing-prose alt texts, and note them for a future targeted ANGLE_PATTERNS pass if the project is willing to add MB-specific patterns.

## Files modified

- `scripts/brand-configs/mercedes-benz.json` — slug_variants updated, notes field expanded.
- `data/mercedes-benz.json` + `catalog/data/mercedes-benz.json` — scraper-managed, rewritten with new URLs.
- Files NOT modified: `scripts/scrape_image_urls.mjs`, anything in `instructions/`, anything in `data/_partials/`.

## Diagnostic artifacts (kept for reproducibility)

- `scripts/diag_mercedes_candidates.mjs` — static-fetch candidate dumper (Steps 1+2)
- `scripts/diag_mercedes_playwright.mjs` — Playwright candidate dumper for JS-rendered pages
- `scripts/diag_mercedes_test_variants.mjs` — pre-flight test of proposed variants against actual URL/alt samples (positive matches + cross-contamination check)
- `reports/mercedes_candidates_raw.log` — static candidates for high-volume models (e-class-sedan, gle-suv, c-class, glc-suv, s-class)
- `reports/mercedes_candidates_failed.log` — static candidates for the formerly-failing models
- `reports/mercedes_candidates_maybach.log` — variant check for maybach + coupe lineup
- `reports/mercedes_candidates_pw.log`, `reports/mercedes_candidates_pw2.log`, `reports/mercedes_g_cle_pw.log` — Playwright-rendered candidates per model
- `reports/mercedes_scrape_session6.log`, `reports/mercedes_download_session6.log` — full pipeline output for this session
