# New brands — Session 10

5 brands added to the catalog via Phase B (Chrysler, Dodge, Fiat, Bugatti, VinFast). Karma excluded as not viable (146 cars/year, Revero ending, others pre-production).

## Headline

| metric | Session 9 final | Session 10 Phase B | Δ |
|---|---:|---:|---:|
| brands | 41 | **46** | +5 |
| models | 424 | **435** | +11 |
| trims | 1,463 | **1,492** | +29 |
| image entries | 4,369 | 4,482 | +113 |
| image entries downloaded | 3,111 | 3,253 | +142 (Phase A: +54, Phase B: +88) |
| project image coverage | 71.21% | 72.6% | +1.4pp cumulative |

## Per-brand outcomes

| brand | viability | models | trims | image cov. | source quality | notes |
|---|---|---:|---:|---:|---|---|
| chrysler | yes | 3 | 6 | 23/24 = **95.8%** | high (Stellantis press CDN) | Pacifica + Pacifica Hybrid (PHEV) + Voyager LX. 300 discontinued after MY23. chrysler.com 403 to WebFetch; press CDN at s3.amazonaws.com/chryslermedia.iconicweb.com works. |
| dodge | yes | 3 | 15 | 36/60 = **60.0%** | medium (Stellantis press partial) | Charger Daytona EV + Charger Sixpack ICE + Durango (with final-MY Hellcat). Charger split per §6.4 multi-powertrain rule + jeep.json Wrangler precedent. dodge.com page JS-rendered, 0 candidates after Playwright. 16 side/interior entries unfilled. |
| fiat | yes | 1 | 2 | 8/8 = **100%** | high (Stellantis press kit) | 500e Pop + Icona. Sole-model brand. fiatusa.com 403 → press kit on media.stellantisnorthamerica.com. |
| bugatti | yes | 2 | 2 | 8/8 = **100%** | very high (Bugatti official PDFs + newsroom CDN) | Tourbillon (MY26, V16 hybrid, sole-trim) + W16 Mistral (MY25, ICE quad-turbo W16, sole-trim). Bolide excluded (track-only) per project precedent. bugatti.com 403/429 → newsroom CDN at bugatti-newsroom.imgix.net used. §4.6 MSRP policy applied (Tourbillon: Motor Authority + duPont Registry News; Mistral: Top Gear editorial). |
| vinfast | yes | 2 | 4 | 13/13 = **100%** | high (VinFast manufacturer CMS + EPA/NHTSA verified) | VF 8 + VF 9. All assembled Hai Phong Vietnam (NC plant SOP slipped to 2028). EPA fueleconomy.gov IDs verified individually. NHTSA 4-overall on VF 8 2024 test, carryover to MY25 trims. |

## Excluded: Karma

Karma is operational but at 146 cars built in 2024 and ~250 target for 2025, with Revero production ending late 2025 and Gyesera/Kaveya/Amaris/Ivara all stuck in pre-production with slipping timelines. Brand fails the "actively selling current MY at scale" threshold. Documented for future reconsideration.

## Phase 2 build outcome

`manifest.json` regenerated with 46 brands, 435 models, 1,492 trims. All 5 new brand JSONs copied to `catalog/data/`. Manifest timestamp refreshed.

## Phase 4 outcome

- 4 of 5 new brands' Phase 1 imagery was already direct-asset URLs from manufacturer press CDNs (no scrape needed; downloaded directly): Chrysler, Fiat, Bugatti, VinFast.
- 1 brand (Dodge) had 16 needs_scraping entries for side_profile/interior_dashboard angles. Dodge.com is JS-rendered with 0 candidates surviving Playwright fallback; those 16 entries remain at the page URL and fail download. Dodge image coverage is therefore 60%, which is honest given the manufacturer site's structural blockers.

## Files added this phase

### Brand JSONs
- `data/chrysler.json`, `catalog/data/chrysler.json`
- `data/dodge.json`, `catalog/data/dodge.json`
- `data/fiat.json`, `catalog/data/fiat.json`
- `data/bugatti.json`, `catalog/data/bugatti.json`
- `data/vinfast.json`, `catalog/data/vinfast.json`

### Brand-configs (Phase 4)
- `scripts/brand-configs/chrysler.json`
- `scripts/brand-configs/dodge.json`
- `scripts/brand-configs/fiat.json`
- `scripts/brand-configs/bugatti.json`
- `scripts/brand-configs/vinfast.json`

### Catalog
- `catalog/manifest.json` regenerated (46 brands)

### STATUS.md
- 5 new brand rows added by the Phase 1 subagents

## Reports
- `reports/b1_viability_session10.md` — viability findings
- `reports/new_brands_session10.md` — this file
