# Mazda Phase 4 Investigation — Session 6 (2026-05-14)

## Summary

| | before | after |
|---|---:|---:|
| Image entries | 84 | 84 |
| Successful downloads | 39 | 39 |
| **Coverage** | **46.4%** | **46.4%** |
| Raw cand/page range | 288-479 | 238-435 (tighter blacklist) |
| **Slug-matching cand/page** | not logged | **88-187** (vs ~30-90 before) |
| Models with 0 downloaded | 0 | 0 |

**Net coverage: unchanged.** The slug_variants additions tripled the model-slug-matching candidate pool but did not move the needle on the final coverage. Diagnosis below explains why and identifies the actual bottleneck.

## Diagnosis

The Phase 4 report labeled mazda as a "match gap" — and that label is correct, but **the gap is the angle-keyword matcher, not the model-slug matcher**.

Diagnostic dumps (`reports/mazda_candidates_raw.log`, `reports/mazda_unmatched_detail.log`, `reports/mazda_angle_detail.log`) show:

1. **Per-page candidate composition (cx-90 page, 122 unique):**
   - 87 already slug-matched some Mazda model under the OLD variants
   - The other 35: 23 were nav-chrome / color-swatches / shopping-icons (now blacklisted), 12 were chrome that slipped past the blacklist

2. **After tightening the blacklist + adding slug variants**, slug-matching per page jumped to 88-187 candidates per page (vs ~30-90 before). The candidate pool that gets passed to `pickBestForAngle` is now 2-3x larger.

3. **The actual bottleneck — angle-keyword match counts per page** (`F`/`R`/`S`/`I` = front/rear/side/interior keyword hits among slug-matched candidates):
   ```
   cx-5             F=1 R=0 S=0 I=3
   cx-90            F=3 R=0 S=0 I=13
   mazda3-sedan     F=0 R=0 S=0 I=9
   mazda3-hatchback F=0 R=2 S=0 I=8
   cx-30            F=0 R=2 S=0 I=14
   cx-50            F=0 R=2 S=0 I=13
   cx-50-hybrid     F=0 R=1 S=0 I=7
   cx-70            F=3 R=0 S=0 I=14
   cx-70-phev       F=0 R=0 S=0 I=7
   cx-90-phev       F=0 R=0 S=0 I=6
   mx-5-miata       F=1 R=2 S=0 I=8
   mx-5-miata-rf    F=0 R=0 S=0 I=1
   ```
   **side_profile = 0 on every page.** front/rear are near-zero, and most of the matched ones are safety-illustration icons (e.g. "smart-brake-support-front-crossing") rather than vehicle photographs.

4. **Why interior_dashboard works (~5-14 per page):** the `\binterior\b` and `\bcabin\b` regexes hit the URL segment `/interior-360s/` and alt text "Interior Cabin", "Interior View". Mazda's asset taxonomy uses literal "interior" in folder names but no equivalent "exterior-front" / "side-view" tokens.

5. **What mazda's exterior assets look like:**
   - VLP hero: `2026-cx-90-inline-hero-desktop.jpg` (alt "2026 Mazda CX-90 3 Row SUV") — no angle keyword
   - Design carousel: `2026-cx-90-inline-desktop-carousel-001.jpg` (alt "3 Row Seating Configuration Options") — no angle keyword
   - Trim jellies: `/34-jellies/2-5-s/my26-cx-5-s.png` — these ARE 3/4 front views, but the `34` here is preceded by `/` not by `front`, so the `front[-_ ]?34` pattern doesn't fire
   - Color sprites: `my25-cx90-inline-turbo-s-premium-plus-artisan-red-ms.png` — these are trim+color renders, no angle keyword

   The closest mazda gets to angle-encoded filenames is the `34-jellies` folder name, but the `34` is a prefix of `34-jellies`, not the suffix of a `front` token, so the existing pattern doesn't match it. **Fixing this would require either editing `ANGLE_PATTERNS` in the shared script (out of scope per task brief) or accepting the limitation.**

## What changed in mazda.json

### slug_variants — additions

Added asset-naming variants the scraper was missing:

- **mazda3-sedan**: `mazda-3-sedan`, `m3-sedan`, `m3sedan` (URL/alt forms like `Mazda-3-Sedan-Available-Bose-Premium-Audio`, `my25-m3-sedan-turbo-...`)
- **mazda3-hatchback**: `mazda-3-hatchback`, `m3-hatchback`, `m3hatchback`, `m3hb` (filename shorthand `my25-m3hb-...`)
- **cx-50-hybrid**: `cx50-hybrid` (URL fragment `cx50-hybrid-...`)
- **cx-70-phev**: `cx70-phev`
- **cx-90-phev**: `cx90-phev`
- **mx-5-miata**: `mx5-miata`, `mx-5-st`, `mx5-st` (soft-top assets live under `/2026/mx-5-st/`)
- **mx-5-miata-rf**: `mx-5-rf`, `mx5-rf` (RF assets live under `/2026/mx-5-rf/`)

Collision discipline:
- **DID NOT** add overly-broad `mazda3` (already present on sedan side) — it would bleed sedan ↔ hatchback. Kept as-is for backward compatibility.
- **DID NOT** loosen `cx-5` / `cx-50` / `cx-70` / `cx-90` to bleed into their hybrid/phev siblings. Each sibling gets its own explicit variants.
- **DID NOT** add bare `mx-5` to mx-5-miata-rf — `mx-5` matches both ST and RF URLs.

### path_blacklist_regex — tightened

Old: `(?:Promo-Banner|Global-Nav|nav[/_-]?jelly|favicon|sprite|icon|logo|placeholder|preview-thumb)`

New adds: `global-nav` (lowercase), `shopping-icons`, `interior-swatches`, `exterior-color-swatches`, `color-?swatch`, `content-hub`, `musa-homepage`, `main-nav`, `mdp\.addons`.

This dropped ~30-50 chrome candidates per page (shopping icons, color swatches, content hub articles, homepage carousels) that were inflating the raw candidate count without ever being usable model imagery.

## Sample matches (after fix)

From `reports/mazda_scrape_session6.log` (12 entries shown):

- `[10.0] mazda3-sedan/2-5-s/interior_dashboard → /siteassets/vehicles/2026/mazda3-sedan/01_vlp/002_design/c_small-gallery/desktop/2026-m3-sedan-desktop-gallery-002.jpg`
- `[9.3] mazda3-hatchback/2-5-s/rear_three_quarter → /siteassets/.../2026-mazda-3-hatchback-safety-rear-cross-traffic-alert` (safety icon — best available rear match)
- `[6.9] mazda3-hatchback/2-5-s/interior_dashboard → /siteassets/vehicles/2026/mazda3-hatchback/04_btv/003_interior/interior-360s/01_2.5-s/41w-jet-black-mica---black-cloth/i360-my25-m3hb-jetblackmica-blackcloth-1.jpg`

Note: the m3hb URL above was matched via the new `m3hb` variant. Without it, the `/mazda3-hatchback/` URL prefix still matched, but if mazda ever serves only m3hb-named files this variant becomes load-bearing.

## Per-model still-unresolved breakdown (unchanged from before)

```
mazda3-sedan: 6 (front/rear/side for the 2 non-shared families)
mazda3-hatchback: 6
cx-30: 4
cx-5: 2 (rear, side)
cx-50: 4
cx-50-hybrid: 2 (front, side)
cx-70: 4
cx-70-phev: 3
cx-90: 4
cx-90-phev: 3
mx-5-miata: 2 (side, both families)
mx-5-miata-rf: 6
TOTAL: 46 unchanged
```

The pattern is uniform: **side_profile is 100% unresolved** and front/rear hit only when the model selector animated sprite happens to land in the pool (3 fronts on cx-90/cx-70/mx-5-miata).

## Recommendation

The path to mazda > 50% coverage is one of:

1. **Edit `ANGLE_PATTERNS` in the shared script** (out of scope for this task, but a small, well-bounded change): add a brand-agnostic rule that treats `/34-jellies/` and bare `34` (with a leading separator) as a front_three_quarter cue at score ~7, OR a mazda-specific extension. This alone would resolve ~20 front_three_quarter entries (one per trim_family per model with a `34-jellies` URL in the pool).

2. **Pre-resolve URLs in `data/mazda.json` Phase 1** (manual, per-trim): identify the specific desktop carousel images via inspection and write the URL directly. The asset paths are stable enough to make this tractable.

3. **Accept ~46% coverage on mazda** as the realistic outcome of the current architecture's angle-keyword reliance against mazda's feature-named asset taxonomy.

Recommendation: option 1 — small shared-script change, highest leverage, would also help kia and other brands that use `34-jellies`-style folders. But that change is gated by a future session brief, not this one.

## Files produced this session

- `scripts/diag_mazda_candidates.mjs` — raw candidate dump (3 pages: cx-5, cx-90, mazda3-sedan)
- `reports/mazda_candidates_raw.log` — raw cand dump output
- `reports/mazda_unmatched_detail.log` — un-matched cand detail (8 pages, generated during investigation)
- `reports/mazda_angle_detail.log` — per-page angle-keyword classification (12 pages)
- `reports/mazda_scrape_session6.log` — full scrape run with new config
- `reports/mazda_download_session6.log` — full download run
- `scripts/brand-configs/mazda.json` — slug_variants additions + blacklist tightening
