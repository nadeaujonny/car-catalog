# Phase 4 Final Image Coverage Report — 2026-05-15 (Session 8)

After Session 8 ran the Land Rover L-chassis-code slug_variants (Phase A) and the `isPlausibleImageURL` extension-less-CDN relax (Phase B), the catalog's image state is:

## Headline

|  | count | % |
|---|---:|---:|
| Brands | 41 | |
| Models | 424 | |
| Trims | 1,463 | |
| Image entries | 4,369 | |
| &nbsp;&nbsp;**downloaded (final)** | **3,071** | **70.29%** |
| &nbsp;&nbsp;not downloaded | 1,298 | |

**Session 8 lift: +222 image entries downloaded (from 2,849 → 3,071), +5.08 pp project-wide. 3 tier crossings: Hyundai C → A (skipping B), Lotus C → B, Subaru C → B. The "persistent low coverage" list narrows from 3 brands (Tesla, Ferrari, Lotus) to 1 (Tesla only).**

## Coverage by tier (final, sorted desc)

**Tier A — ≥80% (19 brands; +1 vs Session 7: Hyundai):**
bentley 100.0% · buick 100.0% · infiniti 100.0% · mclaren 100.0% · mini 100.0% · audi 98.4% · bmw 95.1% · toyota 95.0% · nissan 93.3% · jaguar 91.7% · volvo 90.5% · aston-martin 90.4% · chevrolet 88.9% · mitsubishi 87.5% · **hyundai 86.8%** ★★★ · lucid 83.3% · honda 82.1% · acura 81.9% · genesis 81.9%

**Tier B — 50-80% (10 brands; +2 vs Session 7: Lotus + Subaru):**
rivian 78.9% · gmc 76.0% · cadillac 75.6% · **lotus 75.0%** ★★★ · **subaru 72.5%** ★★★ · alfa-romeo 71.4% · lexus 70.8% · jeep 64.5% · mazda 63.1% · porsche 50.3%

**Tier C — <50% (12 brands; -3 vs Session 7):**
ford 47.3% · maserati 45.8% · lamborghini 41.7% · polestar 41.7% · rolls-royce 39.5% · volkswagen 38.8% · ram 33.0% · mercedes-benz 32.5% · **land-rover 31.9%** ★ · kia 25.0% · **ferrari 22.9%** ★★ · tesla 0.0%

★ = brand crossed a tier boundary OR moved off persistent-low-coverage list. ★★ = brand jumped 20+ pp. ★★★ = brand jumped 50+ pp or two tiers.

## Per-brand before/after table

Sorted by Δ (largest gain first).

| brand | Session 7 final | Session 8 final | Δ | mechanism |
|---|---:|---:|---:|---|
| lotus | 0.0% | 75.0% | **+75.0 pp** | Phase B isPlausibleImageURL relax accepts Sitecore Content Hub URLs (`wlt-p-001.sitecorecontenthub.cloud/api/public/content/<uuid>`); scroll depth bump captures full lazy-load; slug_variants `"carbon"` (eletre) and `"alphapdp"` (emeya) close the alt-text gap |
| subaru | 9.2% | 72.5% | **+63.4 pp** | Phase B relax accepts Sitecore Content Hub URLs; 638 ext-less candidates accepted, 91 entries via ext-less URL; existing ANGLE_PATTERNS match alt text |
| hyundai | 28.3% | 86.8% | **+58.5 pp** | Phase B relax accepts Adobe Scene7 URLs with `fmt=webp` query (`s7d1.scene7.com/is/image/hyundai/...?fmt=webp`); 120 entries via ext-less URL; repair +12 |
| ferrari | 2.1% | 22.9% | **+20.8 pp** | Phase B relax accepts Thron CDN URLs (`ferrari-view.thron.com`); 481 ext-less candidates accepted; 11 entries via ext-less URL. **Session 7's "no usable signal" diagnosis was wrong** |
| land-rover | 18.1% | 31.9% | **+13.9 pp** | Phase A L-chassis-code slug_variants (L460/L461/L462/L550/L551/L560/L663) — LRDX CDN URLs (path-segment + filename-prefix) now slug-match |
| kia | 21.9% | 25.0% | +3.1 pp | Phase B relax: 23 ext-less candidates accepted; +2 entries |
| maserati | 45.8% | 45.8% | 0 pp | Repair recovered 1 entry from URL-invalidate interaction; net unchanged |
| (35 other brands) | (unchanged) | (unchanged) | 0 pp | URLs already extension-full OR brand hard-blocked OR no rewrite path applicable |

## Project-wide totals — Session 7 vs Session 8

| | Session 7 final | Session 8 final | Δ |
|---|---:|---:|---:|
| Image entries downloaded | 2,849 | 3,071 | +222 |
| % of total | 65.21% | 70.29% | +5.08 pp |
| Brands at ≥80% | 18 | 19 | +1 (Hyundai) |
| Brands at 50–80% | 8 | 10 | +2 (Lotus + Subaru) |
| Brands at <50% | 15 | 12 | -3 |
| Models with 0 downloaded images | 76 | 49 | -27 |
| Trims with all 4 required angles | 431 | 503 | +72 |

## Top 5 biggest brand-level gains this session

1. **Lotus +75.0 pp** (0 → 18 entries). Three independent fixes needed: filter relax (necessary), scroll depth (sufficient for Emira to render its full image set), slug_variants expansion (necessary for Eletre/Emeya whose alt text uses internal codes).
2. **Subaru +63.4 pp** (12 → 95 entries). Single fix: filter relax. Subaru's Sitecore Content Hub URLs are identical in structure to Lotus's; once the filter accepts them, the existing English ANGLE_PATTERNS match alt text correctly.
3. **Hyundai +58.5 pp** (43 → 132 entries). Single fix: filter relax. Hyundai uses Adobe Scene7 with `fmt=webp` query parameter (no path extension) — relax catches these.
4. **Ferrari +20.8 pp** (1 → 11 entries). Single fix: filter relax. Ferrari uses Thron CDN with extension-less URLs. **Session 7's diagnosis was incorrect** — the rendered DOM does carry usable image signal; the URLs were just filtered upstream.
5. **Land Rover +13.9 pp** (26 → 46 entries). Single fix: L-chassis-code slug_variants. LRDX CDN structure exposes chassis codes (L460/L461/L462/L550/L551/L560/L663) in both path segments and filename prefixes; bare chassis codes work as slug_variants.

## Per-phase contribution to the +222 entry / +5.08pp lift

| Phase | Brand(s) | Mechanism | Entries gained |
|---|---|---|---:|
| Phase A (chassis codes) | land-rover | L-chassis-code slug_variants on LRDX CDN | +20 |
| Phase B (relax) | lotus, hyundai, subaru, ferrari, kia | Extension-less URL acceptance from CDN-style hosts | +188 |
| Repair (post-B) | hyundai (12), subaru (4), maserati (1) | repair_cached_downloads.mjs restored downloaded:true for entries with valid local files | +17 |
| (Phase C — no implementation) | subaru | (Phase B side effect already resolved Phase C target) | n/a |
| **Total** | | | **+225 gross / +222 net** |

(Net is slightly less than gross because some Phase A entries that downloaded then got Phase B URL changes that invalidated them; net is the final downloaded count vs Session 7 baseline.)

## Coverage distribution — ASCII chart

```
bentley         |====================================================== 100.0%
buick           |====================================================== 100.0%
infiniti        |====================================================== 100.0%
mclaren         |====================================================== 100.0%
mini            |====================================================== 100.0%
audi            |====================================================  98.4%
bmw             |==================================================    95.1%
toyota          |==================================================    95.0%
nissan          |==================================================    93.3%
jaguar          |=================================================     91.7%
volvo           |================================================      90.5%
aston-martin    |================================================      90.4%
chevrolet       |===============================================       88.9%
mitsubishi      |===============================================       87.5%
hyundai         |===============================================       86.8%  ★★★ C→A
lucid           |=============================================         83.3%
honda           |============================================          82.1%
acura           |============================================          81.9%
genesis         |============================================          81.9%
rivian          |==========================================            78.9%
gmc             |=========================================             76.0%
cadillac        |=========================================             75.6%
lotus           |=========================================             75.0%  ★★★ C→B
subaru          |=======================================               72.5%  ★★★ C→B
alfa-romeo      |======================================                71.4%
lexus           |=====================================                 70.8%
jeep           |===================================                    64.5%
mazda           |==================================                    63.1%
porsche         |===========================                           50.3%
ford            |==========================                            47.3%
maserati        |========================                              45.8%
lamborghini     |=======================                               41.7%
polestar        |=======================                               41.7%
rolls-royce     |=====================                                 39.5%
volkswagen     |=====================                                  38.8%
ram             |==================                                    33.0%
mercedes-benz   |=================                                     32.5%
land-rover      |=================                                     31.9%  ★ +13.9
kia             |=============                                         25.0%
ferrari         |============                                          22.9%  ★★ off-list
tesla           |                                                       0.0%
                +-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+
                0%   10%   20%   30%   40%   50%   60%   70%   80%   90% 100%
```

## Honest assessment: brands still <50% and why

| brand | coverage | classification | reason |
|---|---:|---|---|
| ford | 47.3% | improvable | thin manufacturer-page candidate pools on F-150 Raptor R + Super Duty variants (shared-template pages); not a pipeline issue |
| maserati | 45.8% | improvable | scene7 with specific desktop variant URLs failing 403; some entries cached but URL-marked-invalid |
| lamborghini | 41.7% | improvable | Phase 2 (configurator pages) on some models; thin candidate pools |
| polestar | 41.7% | improvable | only 2 models, 12 entries; high relative cost of any single failure |
| rolls-royce | 39.5% | improvable | many entries with `wrong-content-type` (URLs resolve to text/html — placeholder pages) |
| volkswagen | 38.8% | improvable | extension-less URL acceptance kicked in but resolved to same final files; underlying page structure thin |
| ram | 33.0% | improvable | Session 7 Phase A patterns (`vlp-hero-\d`) caught front but rear/side/interior still missing |
| mercedes-benz | 32.5% | structural blocker | mbusa.com CDN gates static + Playwright on most image URLs; 218 entries return text/html. Press subdomain helps partially |
| land-rover | 31.9% | structural blocker (specific pages) | defender-octa (3 raw candidates) + discovery (2 raw) pages too thin for any pipeline lift |
| kia | 25.0% | improvable | Session 7 Phase A patterns work but only catch some angles; rear/side/interior remain partial |
| ferrari | 22.9% | improvable | unblocked by Phase B; remaining gap is the same thin-candidates issue (1-8 imgs per page for some models) |
| tesla | 0.0% | hard pipeline blocker | HTTP 403 anti-bot at transport layer; ONLY brand pipeline-level fixes cannot help |

## Brands at peak under current policy

The 19 ≥80% brands have effectively saturated extraction under the manufacturer-only source policy. Within the 10 50-80% brands and the 12 <50% brands, individual blockers are well-documented in the reports/ directory and in this report's previous section. None require additional pipeline architecture changes — they require either per-brand engineering (similar to Session 7's Phase A or Session 8's Phase A) OR policy relaxation OR acceptance of placeholders.

## Session 7 → Session 8 narrative: the persistent-low-coverage list

| brand | Session 7 status | Session 8 outcome |
|---|---|---|
| Tesla | "hard 403 anti-bot" | Confirmed still 0%; remains on list |
| Ferrari | "JS-rendered, no usable signal" | **Diagnosis was wrong**; Phase B unblocked to 22.9%; off the list |
| Lotus | "extension-less Sitecore CDN URLs filtered upstream" | Phase B addressed the filter; jumped to 75.0%; off the list |
| Hyundai | (already off list at 28.3% Session 7) | Phase B caught scene7 URLs; jumped to 86.8% |
| Subaru | (already off list at 9.2% Session 7) | Phase B caught Sitecore URLs; jumped to 72.5% |

**Final persistent-low-coverage list: 1 brand (Tesla).** This is a project-direction question — accept placeholders permanently, or relax manufacturer-only sourcing for Tesla specifically. Pipeline-level fixes cannot help; the choice is one of policy.

## Recommendation: project is at functional completion

The Car Catalog Project's Phase 4 image scrape has reached a saturation point under the stated policy. 70%+ project-wide coverage with 29 of 41 brands at ≥50% is a meaningful catalog. The remaining 12 sub-50% brands have individually-diagnosed blockers; none require pipeline architecture changes to address. Continued work is optional and falls into:

1. **Per-brand investigation** (similar to Session 7 Phase A or Session 8 Phase A) for ~5 brands that have known angle-pattern or URL-token gaps.
2. **Policy relaxation** for Tesla / Ferrari / Land Rover / Mercedes-Benz / others where placeholders are unacceptable.
3. **Additional brand research** for Chrysler, Dodge, Fiat, Bugatti, etc.
4. **Annual data refresh** (quarterly URL-validation runs) for catalog freshness.
5. **UI / site polish** for catalog presentation.
6. **Vision-model angle verification** as a new pipeline phase.

None are required for the project to be considered functionally complete.
