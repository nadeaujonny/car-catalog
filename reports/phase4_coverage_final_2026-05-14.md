# Phase 4 Final Image Coverage Report — 2026-05-14 (Session 6)

After Session 6 ran a 7-phase C-bis chain (escalation-threshold tweak → 7-brand slug/angle investigation → Toyota Referer fix → mid-tier re-scrape → persistent-low-coverage documentation), the catalog's image-coverage state is:

## Headline

|  | count | % |
|---|---:|---:|
| Brands | 41 | |
| Models | 424 | |
| Trims | 1,463 | |
| Image entries | 4,369 | |
| &nbsp;&nbsp;**downloaded (final)** | **2,720** | **62.26%** |
| &nbsp;&nbsp;not downloaded | 1,649 | |

**Net session lift: +289 image entries downloaded (from 2,431 → 2,720), +6.66 percentage points.**

## Coverage by tier (final, sorted desc)

**Tier A — ≥80% (17 brands; +1 vs Phase C):**
bentley 100% · buick 100% · infiniti 100% · mclaren 100% · audi 98.4% · **toyota 95.0%** ★ · mini 94.7% · bmw 93.7% · nissan 93.3% · jaguar 91.7% · volvo 90.5% · aston-martin 90.4% · chevrolet 87.8% · mitsubishi 87.5% · lucid 83.3% · acura 81.9% · genesis 81.9%

**Tier B — 50–80% (8 brands; +1 vs Phase C):**
rivian 78.9% · gmc 76.0% · honda 75.9% · cadillac 75.6% · **jeep 64.5%** ★ · alfa-romeo 64.3% · lexus 59.7% · porsche 50.3%

**Tier C — <50% (16 brands; −2 vs Phase C):**
ford 47.3% · mazda 46.4% · maserati 45.8% · **lamborghini 41.7%** ★ · rolls-royce 39.5% · volkswagen 38.8% · **mercedes-benz 32.2%** ★ · polestar 25.0% · land-rover 18.1% · kia 17.2% · ram 15.9% · subaru 6.9% · ferrari 2.1% · hyundai 0.0% · lotus 0.0% · tesla 0.0%

★ = brand that crossed a tier boundary this session.

## Per-brand before/after table

Sorted by Δ (largest gain first), then by final coverage.

| brand | Phase C | Final | Δ | mechanism |
|---|---:|---:|---:|---|
| toyota | 0.0% | **95.0%** | **+95.0pp** | Phase 4 — `pressroom.toyota.com` Referer header unlocks S3 bucket |
| jeep | 22.7% | **64.5%** | **+41.8pp** | Phase 3 — switched model_pages to `/<model>/gallery.html` (rich angle alt text) |
| lamborghini | 0.0% | 41.7% | +41.7pp | Phase 2 — new escalation threshold triggers Playwright on 3 of 3 pages |
| mercedes-benz | 19.6% | 32.2% | +12.6pp | Phase 3 — 11 slug_variants (URL-path mismatches like `cle-cab`, `s-maybach`) + threshold tweak |
| ford | 40.4% | 47.3% | +6.9pp | Phase 3 — Ford internal filename codes added (mst, mme, bro, brs, f15, dhsc, plus Super-Duty forms) |
| volkswagen | 32.7% | 38.8% | +6.1pp | Phase 5 — threshold tweak escalates VW JS-rendered pages |
| kia | 15.6% | 17.2% | +1.6pp | Phase 3 — `-hev` variants (sorento-hev, sportage-hev), `carnival-mpv`, `k4hb` |
| land-rover | 17.4% | 18.1% | +0.7pp | Phase 2 — threshold tweak fires on 7 of 11 pages; deeper L-chassis-code slug gap remains |
| (all other brands) | (unchanged) | (unchanged) | 0.0 | already-resolved or fundamentally blocked |

## Project-wide totals — Phase C vs Final

| | Phase C (Session 5) | Final (Session 6) | Δ |
|---|---:|---:|---:|
| Image entries downloaded | 2,431 | 2,720 | +289 |
| % of total | 55.65% | 62.26% | +6.61pp |
| Brands at ≥80% | 16 | 17 | +1 (Toyota) |
| Brands at 50–80% | 7 | 8 | +1 (Jeep) |
| Brands at <50% | 18 | 16 | −2 |
| Models with 0 downloaded images | 130 | 110 | −20 |
| Trims with all 4 required angles | 365 | 421 | +56 |

## Coverage distribution — ASCII chart

```
bentley         |====================================================== 100%
buick           |====================================================== 100%
infiniti        |====================================================== 100%
mclaren         |====================================================== 100%
audi            |====================================================  98.4%
toyota          |====================================================  95.0%  ★
mini            |===================================================   94.7%
bmw             |==================================================    93.7%
nissan          |==================================================    93.3%
jaguar          |=================================================     91.7%
volvo           |================================================      90.5%
aston-martin    |================================================      90.4%
chevrolet       |===============================================       87.8%
mitsubishi      |===============================================       87.5%
lucid           |=============================================         83.3%
acura           |============================================          81.9%
genesis         |============================================          81.9%
rivian          |==========================================            78.9%
gmc             |=========================================             76.0%
honda           |=========================================             75.9%
cadillac        |=========================================             75.6%
jeep            |===================================                   64.5%  ★
alfa-romeo      |===================================                   64.3%
lexus           |================================                      59.7%
porsche         |===========================                           50.3%
ford            |==========================                            47.3%
mazda           |=========================                             46.4%
maserati        |=========================                             45.8%
lamborghini     |=======================                               41.7%  ★
rolls-royce     |=====================                                 39.5%
volkswagen      |=====================                                 38.8%
mercedes-benz   |=================                                     32.2%  ★
polestar        |==============                                        25.0%
land-rover      |==========                                            18.1%
kia             |=========                                             17.2%
ram             |=========                                             15.9%
subaru          |====                                                   6.9%
ferrari         |=                                                      2.1%
hyundai         |                                                       0.0%
lotus           |                                                       0.0%
tesla           |                                                       0.0%
                +-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+
                0%   10%   20%   30%   40%   50%   60%   70%   80%   90% 100%
```

★ = brand moved this session.

## Phase-by-phase contribution to the +289 lift

| Phase | Brand(s) | Mechanism | Newly-downloaded entries |
|---|---|---|---:|
| Phase 2 (threshold tweak) | lamborghini, land-rover (minor) | escalation gate now fires on pages with <3 slug-matching candidates | 5 + 1 ≈ 6 |
| Phase 3 (slug investigation) | jeep, ford, mercedes-benz, kia | per-brand slug_variants and `/gallery.html` URL switch | (50→142)+(82→96)+(62→102)+(10→11) = 92+14+40+1 = 147 |
| Phase 4 (Toyota Referer) | toyota | `Referer: https://pressroom.toyota.com/` unlocks S3 bucket | 133 |
| Phase 5 (mid-tier re-scrape) | volkswagen | threshold tweak picks up 3 newly-escalated pages | 19−16 = 3 |
| **Total** | | | **~289** |

## Brands accepted as persistent low coverage

Documented in `reports/persistent_low_coverage_brands.md`. The 5 brands are tagged in their respective `data/<brand>.json` `model.notes` fields (per-model addendum noting the coverage limit and pointing to the report).

| Brand | Coverage | Root cause | Disposition |
|---|---:|---|---|
| Tesla | 0% | Hard 403 anti-bot on static + Playwright | Placeholder-only — manufacturer-policy gap |
| Ferrari | 2.1% | JS-rendered, rendered DOM has 0 usable candidates | Placeholder-only |
| Lotus | 0% | JS-rendered, rendered DOM has 0 usable candidates | Placeholder-only |
| Hyundai | 0% | Angle-pattern matcher gap (filenames use vlp-hero/chassis codes) | Future: angle_url_patterns brand-config extension |
| Subaru | 6.9% | Same as Hyundai (Playwright surfaces 500+/page, none score) | Same future fix |

A future angle-pattern extension would likely also help mazda, ford, kia, ram, mercedes-benz, polestar, volkswagen, rolls-royce — all of which the Phase 3 investigation found hitting the same angle-pattern wall.

## What the session accomplished

- Validated the Session 5 baseline (locked in 55.6% project-wide via Phase 1).
- **+95pp on Toyota** — turned a 0% brand into a 95% brand with a 1-line config addition. Largest single-brand win in project history.
- **+42pp on Jeep** — `/gallery.html` URL switch is a transferable insight (other brands' gallery pages may also out-perform their /overview/ pages).
- **+42pp on Lamborghini** — proves the threshold-tweak intervention does what it was designed for (capture pages with junk-only candidates).
- **Diagnosed the angle-pattern gap** as the binding constraint for ~7 sub-50% brands. The diagnosis is precise: the brands' CDN filenames don't carry English angle words; the pickBestForAngle table only knows English angle words. Fix is well-scoped for a future session (small additive script change to support brand-config angle_url_patterns).
- **Documented honest limits** for Tesla, Ferrari, Lotus — three brands where pipeline-level fixes cannot help.

## Recommendation for future work (out of scope here)

1. **Angle-pattern extension** — extend `scripts/scrape_image_urls.mjs` to read an optional `angle_url_patterns` map from each brand config and merge those into `ANGLE_PATTERNS` at runtime. Estimated lift: mazda 46% → ~70%, ford 47% → ~70%, hyundai 0% → ~50%, kia 17% → ~50%, ram 16% → ~50%, subaru 7% → ~50%, mercedes-benz 32% → ~50%, volkswagen 39% → ~60%. Project-wide would land roughly 75-85%.
2. **Tesla / Ferrari / Lotus policy decision** — accept placeholders or relax manufacturer-only image policy for those brands specifically.
3. **Land Rover slug_variants** — add L460/L461/L462/L550/L660 chassis codes to slug_variants to absorb landroverusa.com's URL naming. ~30pp expected lift.
4. **Per-quarter or annual data refresh** — re-run Phase 4 to catch URL drift (Phase B found ~36% drift in 2 days during Session 5; a quarterly re-check would keep the catalog current).
