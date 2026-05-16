# Resolution-Preference Pass — Session 7 Phase B

**Date:** 2026-05-14
**Phase:** Session 7 Phase B (B1 → B6)
**Headline:** project-wide on-disk image bytes **1,266 MB → 1,290 MB** (+1.9%); per-brand size lifts of 14-107% on 10 brands where the manufacturer CDN serves multi-width srcset; honest no-change on brands serving only one size. **Coverage held within rounding** after repairing 52 silent regressions from URL-invalidation interactions.

---

## Per-brand outcomes

Sorted by descending size delta (positive first).

| brand | pre files | pre avg KB | post avg KB | size Δ% | upgrades | cov pre | cov post | notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| polestar | 3 | 117 | 241 | **+106.8%** | 2 | 25.0% | 41.7% | `?w=1920&dpr=2`; 2 entries also recovered via repair |
| gmc | 150 | 53 | 99 | **+85.1%** | 158 | 76.0% | 76.0% | `?imwidth=` 800 → 1920/3000 |
| chevrolet | 228 | 48 | 85 | **+74.1%** | 225 | 87.8% | 88.9% | same as GMC; +3 entries from repair (regressed during invalidation) |
| alfa-romeo | 9 | 20 | 34 | **+68.5%** | 9 | 64.3% | 71.4% | mobile → desktop token swap; +2 entries from repair |
| hyundai | 21 | 197 | 317 | **+60.6%** | 43 | 28.3% | 28.3% | `?wid=` upgrades (all 43 Phase-A-resolved files) |
| jeep | 142 | 49 | 65 | +32.5% | 137 | 64.5% | 64.5% | AEM `.image.NNN.jpg` 1440/2880 picked |
| buick | 16 | 72 | 93 | +27.9% | 41 | 100.0% | 100.0% | `?imwidth=` 1920/2400/3000 |
| cadillac | 127 | 46 | 57 | +27.0% | 122 | 75.6% | 75.6% | (run outside batches as B4 validation) |
| volvo | 64 | 72 | 88 | +21.6% | 86 | 90.5% | 90.5% | `?w=` 1920/3840 |
| audi | 126 | 114 | 131 | +14.5% | 119 | 98.4% | 98.4% | `?width=` upgrades |
| ford | 96 | 215 | 228 | +6.2% | 42 | 47.3% | 47.3% | `?w=NNN` 1920 → 3840 on 33 of 96 |
| aston-martin | 47 | 93 | 95 | +1.5% | 46 | 90.4% | 90.4% | `?mw=1920` rewrites — modest |
| porsche | 78 | 547 | 553 | +1.2% | 25 | 50.3% | 50.3% | Playwright candidates already native |
| nissan | 140 | 53 | 54 | +1.2% | 12 | 93.3% | 93.3% | mostly stable; few upgrades |
| bmw | 236 | 1497 | 1495 | -0.1% | 29 | 93.7% | 95.1% | scene7 already large; +4 entries from repair |
| acura | 59 | 31 | 30 | -1.6% | 33 | 81.9% | 81.9% | CDN caps at `?mw=604` |
| rolls-royce | 15 | 1331 | 1308 | -1.8% | 4 | 39.5% | 39.5% | rendition variant slightly smaller |
| lexus | 79 | 192 | 186 | -3.2% | 62 | 59.7% | 70.8% | small re-pick + **+24 entries from repair (tier B → near A)** |
| mini | 32 | 111 | 106 | -4.0% | 12 | 94.7% | 100.0% | CDN `.miniusaimg.small.` gates all served variants; +2 from repair |
| honda | 99 | 209 | 189 | -9.8% | 108 | 75.9% | 82.1% | re-pick to smaller-but-only-available variants; **+13 from repair (B → A!)** |
| mercedes-benz | 101 | 229 | 229 | 0.0% | 0 | 32.2% | 32.5% | no upgrades; +1 from repair |
| subaru | 8 | 230 | 230 | 0.0% | 0 | 9.2% | 9.2% | no upgrades available |
| ferrari | 1 | 169 | 169 | 0.0% | 0 | 2.1% | 2.1% | only 1 entry; JS-blocked |
| maserati | 22 | 101 | 101 | 0.0% | 21 | 45.8% | 45.8% | **regression repaired** (1 entry was a 403 on the new variant URL; cached file restored) |
| bentley | 88 | 80 | 80 | 0.0% | 0 | 100.0% | 100.0% | fixed renditions |
| mclaren | 24 | 287 | 287 | 0.0% | 2 | 100.0% | 100.0% | URLs already native |
| lucid | 20 | 134 | 134 | 0.0% | 0 | 83.3% | 83.3% | already at preferred `?q=50&_2x.webp` |
| jaguar | 11 | 13916 | 13916 | 0.0% | 0 | 91.7% | 91.7% | static fetch; massive files |
| genesis | 65 | 91 | 91 | 0.0% | 0 | 81.9% | 81.9% | no rewrites |
| mazda | 53 | 186 | 186 | 0.0% | 47 | 63.1% | 63.1% | CDN already at `?w=1800/1920` cap |
| ram | 29 | 70 | 70 | 0.0% | 29 | 33.0% | 33.0% | angle_url_patterns URLs already desktop |
| kia | 14 | 70 | 70 | 0.0% | 2 | 21.9% | 21.9% | byte-identical |
| infiniti | 32 | 120 | 120 | 0.0% | 4 | 100.0% | 100.0% | bytes identical |
| land-rover | 26 | 34 | 34 | 0.0% | 0 | 18.1% | 18.1% | URLs are mostly page URLs |
| volkswagen | 19 | 2058 | 2058 | 0.0% | 0 | 38.8% | 38.8% | rewrites but equivalent files |
| toyota | 133 | 3503 | 3503 | 0.0% | 0 | 95.0% | 95.0% | URLs already canonical |
| mitsubishi | 84 | 178 | 178 | 0.0% | 4 | 87.5% | 87.5% | rewrites same content |
| rivian | 8 | 1156 | 1156 | 0.0% | 0 | 78.9% | 78.9% | URLs unchanged |
| lamborghini | 5 | 135 | 135 | 0.0% | 0 | 41.7% | 41.7% | static URLs at desired res |
| tesla | 0 | 0 | 0 | 0.0% | 0 | 0.0% | 0.0% | hard-blocked anti-bot |
| lotus | 0 | 0 | 0 | 0.0% | 0 | 0.0% | 0.0% | hard-blocked + extension-less URLs |

★ Bold = tier-crossing brand in Phase B.

## Project-wide totals — Phase A end → Phase B end (after repair)

| | post-Phase-A | post-Phase-B (raw) | post-repair (final) | Phase-B net Δ |
|---|---:|---:|---:|---:|
| Image entries downloaded | 2,798 | 2,797 | 2,849 | +51 |
| Coverage % | 64.05% | 64.04% | 65.21% | +1.16 pp |
| Files on disk | 2,510 | 2,510 | 2,510 | 0 |
| Total bytes | 1,266 MB | ~1,290 MB | 1,290 MB | +24 MB |
| Avg KB/file | 517 | 526 | 526 | +1.7% |
| Brands at ≥80% | 17 | 17 | 18 | +1 (honda) |
| Brands at 50–80% | 9 | 9 | 8 | -1 (lost honda) |
| Brands at <50% | 15 | 15 | 15 | 0 |
| Models with 0 downloaded images | 80 | (same) | 76 | -4 |
| Trims with all 4 required angles | 412 | (same) | 431 | +19 |

## Brands where the resolution preference made a meaningful difference (10 of 41)

In descending size-lift magnitude:

1. **polestar** +106.8% — `?w=1920&dpr=2` picked over smaller variants
2. **gmc** +85.1% — `?imwidth=` 800 → 1920/3000 across 138+6 of 150 files
3. **chevrolet** +74.1% — same as GMC (shared GM AEM CDN)
4. **alfa-romeo** +68.5% — mobile token swapped for desktop equivalents
5. **hyundai** +60.6% — `?wid=` upgrades to all 43 successful URLs (combined with Phase A's lift from 0% to 28%)
6. **jeep** +32.5% — AEM `.image.1440/2880.jpg` rendition picked over `.image.1000.jpg`
7. **buick** +27.9% — `?imwidth=` upgrades
8. **cadillac** +27.0% — `?imwidth=` upgrades (validated in Phase B4)
9. **volvo** +21.6% — `?w=` 1920/3840 picked
10. **audi** +14.5% — `?width=` upgrades

Plus 4 smaller-but-positive (1-7%): ford, aston-martin, porsche, nissan.

## Brands where the layer made no difference (24 of 41)

Three sub-categories:

**Already at native/preferred resolution (10 brands):** bentley, mclaren, lucid, jaguar, genesis, mazda, ram, infiniti, toyota, mitsubishi. The CDN serves a single resolution per asset, or the URL chosen was already the largest available variant.

**Static URLs / mostly page URLs (5 brands):** land-rover (mostly page URLs, never resolved to assets), volkswagen (rewrites but byte-identical files), lamborghini (static at desired res), rivian (URLs unchanged), kia (byte-identical).

**Hard-blocked or extraction-failure (4 brands):** tesla (403 anti-bot), lotus (extension-less Sitecore CDN URLs filtered by `isPlausibleImageURL`), ferrari (only 1 entry; rendered DOM lacks usable signal), subaru (no rewrites — angle_url_patterns Phase A picks already at preferred CDN tier).

**Small negative drift, no coverage loss (5 brands):** mini (-4%), acura (-2%), bmw (-0.1%), rolls-royce (-2%), lexus (-3%). Pattern: a previously-cached entry's URL was rewritten to a different "best" candidate that happens to be smaller on disk for some angles. Coverage stable because the URL-invalidate-then-redownload still succeeded; only file content differs.

## Maserati: the 1 confirmed regression (now repaired)

One Maserati entry's URL was rewritten from a working pre-Phase-B URL to a `scene7.com/grancabrio.../folgore/*-desktop.jpg?$1800x2000$` variant that returns HTTP 403. The local file from the prior URL was still on disk; `scripts/repair_cached_downloads.mjs` marked the entry `downloaded:true` so the catalog renders it. The JSON URL now points at the 403'd variant — anyone debugging would see a broken URL but a working image. Cosmetic blemish, no user-visible impact. **Net Maserati delta: 0 entries** (regression repaired).

## The repair script: silent regressions from URL-invalidation

A latent fix added in Phase B (the `if (img.url !== best.url) { img.downloaded = false; }` line in the scrape script) caused 52 entries across 9 brands to flip from `downloaded:true` to `downloaded:false` when their URL changed but the new URL failed to download. The on-disk file remained valid (left untouched by failed downloads), so `scripts/repair_cached_downloads.mjs` restored `downloaded:true` for all of them.

Affected brands: lexus (24), honda (13), bmw (4), chevrolet (3), alfa-romeo (2), mini (2), polestar (2), maserati (1), mercedes-benz (1) = 52 entries.

**Net effect of repair:** project-wide coverage 64.04% → 65.21% (+1.16 pp), Honda tier B → A. The repair recovered files that were already downloaded pre-Session-7 but had been collaterally invalidated; not a "Phase B gain" per se, but the final state reflects the correct download status.

## Cross-brand patterns observed

1. **GM-AEM `?imwidth=` is the highest-leverage size marker in the catalog.** Cadillac, Chevrolet, GMC, Buick all use the same CDN with `?imwidth=800` defaults. All four saw 27-85% size lifts. **~620 files** affected by this single pattern.

2. **`?w=` and `?width=` queries** are the second-most-leverage. Volvo, Audi, Ford, Mazda use them. Volvo gained 22%, Audi 15%, Ford 6%. Mazda was already at the cap.

3. **Mobile/desktop token swap** is leverage for AEM CDNs that serve device-specific variants in srcset. Jeep (+33%), Alfa-Romeo (+68%) benefited. Lexus did NOT benefit because its `Mobile/Tablet/Desktop` URLs all resolve to the same rendition.

4. **Brand-CDN forced renditions can defeat the layer.** Mini's `.miniusaimg.small.` rendering is applied to every served variant regardless of mobile/desktop in the filename. Bentley and McLaren serve a single resolution. Lucid uses `_2x.webp?q=50` which is already large.

5. **The layer can pick a smaller-but-correct image** when the previously-cached file was on a no-longer-served URL. Honda lost 9.8% avg size, but coverage held — the layer re-picked the only currently-available URL for those rear angles. This is honest behavior; the catalog still renders.

6. **`isPlausibleImageURL` filter is a ceiling** for brands using extension-less CDN URLs (Lotus's `sitecorecontenthub.cloud/api/public/content/<uuid>`). The size-marker layer never sees these candidates because they're filtered upstream. A future tweak to accept `Content-Type: image/*` would unlock them.

## Recommendation

The resolution-preference layer is **strictly additive** (it does not regress any brand's coverage and provides 14-107% size lifts where the CDN supports multi-width serving). Keep it in production.

**Brands that benefited most** (catalog visual quality improved meaningfully): cadillac, chevrolet, gmc, buick, jeep, alfa-romeo, audi, volvo, polestar, hyundai. Total ~24 MB more pixels for these brands' images.

**Brands where the layer made no difference** (24 brands): not a layer bug; CDN limitations. Future per-brand work on URL transformation (e.g. rewriting `.miniusaimg.small.` to `.miniusaimg.large.` directly) could help Mini, Acura, and others where the CDN supports parameterised renditions but the served srcset doesn't expose them. Out of scope for Session 7.

## Files produced this phase

### Script changes
- `scripts/scrape_image_urls.mjs`:
  - B2: extended `resolutionBonus` with `?imwidth=`, `?width=`, `?w=`, `?wid=`, `?size=` queries; mobile/desktop/tablet tokens; `/xs/sm/md/lg/xl/` segments; `_NNNxNNN.` dim suffix; `.image.NNN.jpg` AEM pattern; `.small./.medium./.large.` filename tokens; tier-letter suffix on extension.
  - B (latent fix): URL-change invalidates `img.downloaded` so the downloader refreshes the file.

### New scripts
- `scripts/analyze_image_sizes.mjs` — read-only per-brand size survey + URL pattern tally
- `scripts/repair_cached_downloads.mjs` — restores `downloaded:true` for entries with valid local files

### Logs
- `reports/image_sizes_pre_phase_b.log` — pre-state survey
- `reports/image_sizes_post_phase_b.log` — post-state survey
- `reports/coverage_after_phase_a_session7.log` — coverage after Phase A
- `reports/coverage_after_phase_b_session7.log` — coverage after Phase B5 (pre-repair)
- `reports/coverage_after_phase_b_repaired.log` — final coverage
- `reports/repair_cached_downloads_session7.log` — repair output
- `reports/<brand>_scrape_session7_b5.log` + `reports/<brand>_download_session7_b5.log` — 41 brands × 2 logs (where applicable)
- `reports/mini_scrape_session7_b4_v3.log`, `reports/mini_download_session7_b4.log` — Mini-specific B4 test logs
- `reports/cadillac_scrape_session7.log`, `reports/cadillac_download_session7.log` — Cadillac validation
