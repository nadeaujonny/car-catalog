# Phase 4 Image Coverage Report — 2026-05-14 (session 5)

Phase C ran scrape + download across all 41 brands via 8 parallel subagents. No crashes; the 6 flagged entries from Phase B correctly produced 0 images. The pipeline works end-to-end and the **regex/URL/Playwright** changes are all validated. But coverage is bimodal — the report below documents the breakdown and the diagnosed root causes of the under-performing brands.

## Headline

| | count | % |
|---|---:|---:|
| Brands | 41 | |
| Models | 424 | (130 with zero downloaded images = 30.7%) |
| Trims | 1463 | |
| &nbsp;&nbsp;trims with all 4 required angles downloaded | 365 | 24.9% |
| &nbsp;&nbsp;trims missing 1+ required angle (but some downloaded) | 505 | 34.5% |
| &nbsp;&nbsp;trims with 0 images downloaded | 593 | 40.5% |
| Image entries | 4369 | |
| &nbsp;&nbsp;**downloaded** | **2431** | **55.6%** |
| &nbsp;&nbsp;not downloaded | 1938 | |

Caveat on the trim counts: a trim that doesn't carry an image entry for a baseline angle (some trims share imagery via trim_family) can never qualify as "all 4 required angles downloaded" — the 24.9% figure conflates download failures with per-trim entry shape. The cleanest signal is **40.5% of trims got 0 images downloaded** and **30.7% of models have 0 downloaded images at all**.

## Coverage by tier

**A. Tier A — coverage ≥ 80% (16 brands).** Looks like a real catalog page.
bentley 100% · buick 100% · infiniti 100%¹ · mclaren 100% · audi 98.4% · mini 94.7% · bmw 93.7% · nissan 93.3% · jaguar 91.7% · volvo 90.5% · aston-martin 90.4% · chevrolet 87.8% · mitsubishi 87.5% · lucid 83.3% · acura 81.9% · genesis 81.9%

¹ Infiniti's URLs point at 2027-MY assets (`/QX60/2027/...`) — the downloads work but flag this for catalog-vintage consistency.

**B. Tier B — 50–80% (7 brands).** Acceptable, mixed.
rivian 78.9% · gmc 76.0% · honda 75.9% · cadillac 75.6% · alfa-romeo 64.3% · lexus 59.7% · porsche 50.3%

**C. Tier C — < 50% (18 brands).** Needs work.
mazda 46.4% · maserati 45.8% · ford 40.4% · rolls-royce 39.5% · volkswagen 32.7% · polestar 25.0% · jeep 22.7% · mercedes-benz 19.6% · land-rover 17.4% · ram 15.9% · kia 15.6% · subaru 6.9% · ferrari 2.1% · hyundai 0.0% · lamborghini 0.0% · lotus 0.0% · tesla 0.0% · toyota 0.0%

## Per-brand table (sorted by coverage)

| brand | entries | dl | cov% | tier | PW esc | Phase-B fixes | primary driver |
|---|---:|---:|---:|---|---:|---:|---|
| bentley | 88 | 88 | 100.0% | A | 0 | 0 | static + regex pattern (config was already good) |
| buick | 48 | 48 | 100.0% | A | 0 | 0 | static + regex pattern |
| infiniti | 32 | 32 | 100.0% | A | 0 | 0 | static + regex pattern (2027-MY assets — flag) |
| mclaren | 24 | 24 | 100.0% | A | 0 | 6 | Phase-1 pre-resolved URLs + URL fix |
| audi | 128 | 126 | 98.4% | A | 0 | 25 | **URL fix decisive** (all 25 were dead) + regex |
| mini | 38 | 36 | 94.7% | A | 0 | 5⁺ | **regex fix + URL fix** (the session-5 root-cause fixes) |
| bmw | 284 | 266 | 93.7% | A | 0 | 14 | mostly Phase-1 pre-resolved URLs + URL fix + regex |
| nissan | 150 | 140 | 93.3% | A | 0 | 4 | static + regex pattern (URL fixes minor) |
| jaguar | 12 | 11 | 91.7% | A | 0 | 0 | Phase-1 pre-resolved URLs |
| volvo | 95 | 86 | 90.5% | A | 1f | 3 | URL fix + regex (es90 = 1 zero, expected) |
| aston-martin | 52 | 47 | 90.4% | A | 0 | 1 | static + regex |
| chevrolet | 288 | 253 | 87.8% | A | 0 | 2 | static + regex |
| mitsubishi | 96 | 84 | 87.5% | A | 0 | 0 | static + regex |
| lucid | 24 | 20 | 83.3% | A | 0 | 0 | static + regex |
| acura | 72 | 59 | 81.9% | A | 0 | 6 | URL fix + regex |
| genesis | 94 | 77 | 81.9% | A | 0 | 8 | URL fix + regex |
| rivian | 19 | 15 | 78.9% | B | 0 | 0 | static + regex |
| gmc | 208 | 158 | 76.0% | B | 0 | 0 | static + regex (yukon-xl = 1 zero) |
| honda | 212 | 161 | 75.9% | B | 0 | 0 | regex + Phase-1 pre-resolved URLs (matches control) |
| cadillac | 168 | 127 | 75.6% | B | 0 | 6 | URL fix + regex (4 V-trim configurator-page fallbacks = 0) |
| alfa-romeo | 28 | 18 | 64.3% | B | 0 | 0 | static + regex |
| lexus | 216 | 129 | 59.7% | B | **11** | 1 | **Playwright decisive** — all 11 pages escalated + succeeded |
| porsche | 155 | 78 | 50.3% | B | **5** | 14 | URL fix + Playwright (3 RS = 0, expected) |
| mazda | 84 | 39 | 46.4% | C | 0 | 12 | **match gap** — 365–479 raw cand/page, only 38 matched |
| maserati | 48 | 22 | 45.8% | C | 0 | 0 | match gap + 5 scene7.com 403s |
| ford | 203 | 82 | 40.4% | C | 0 | 22 | **match gap** — 600–2199 raw cand/page, only 82 matched |
| rolls-royce | 38 | 15 | 39.5% | C | 0 | 3 | match gap (3 black-badge zero) |
| volkswagen | 49 | 16 | 32.7% | C | 0 | 0 | match gap (4 models zero) |
| polestar | 12 | 3 | 25.0% | C | 0 | 1 | match gap |
| jeep | 220 | 50 | 22.7% | C | 0 | 0 | match gap (7 zero incl. 2 flagged 4xe) |
| mercedes-benz | 317 | 62 | 19.6% | C | 0 | 3 | **match gap** — 57–62 raw cand/page, only 62 matched |
| land-rover | 144 | 25 | 17.4% | C | 0 | 10 | **escalation threshold too strict** — 2–39 candidates/page (JS-rendered), didn't trigger Playwright |
| ram | 88 | 14 | 15.9% | C | 0 | 0 | match gap |
| kia | 64 | 10 | 15.6% | C | 0 | 2 | match gap |
| subaru | 131 | 9 | 6.9% | C | **10** | 0 | **match gap survives Playwright** — PW got 544–636 cand/page but only 9 matched (via positional fallback) |
| ferrari | 48 | 1 | 2.1% | C | **11** | 5 | **JS-rendered, Playwright failed** — 10 of 11 escalations returned no candidates |
| hyundai | 152 | 0 | 0.0% | C | 1f | 1 | **match gap** — 95–457 raw cand/page, 0 matched (worst case) |
| lamborghini | 12 | 0 | 0.0% | C | 0 | 3 | **escalation threshold too strict** — only 4 cand/page, didn't escalate |
| lotus | 24 | 0 | 0.0% | C | **3** | 0 | **JS-rendered, Playwright DOM has 0 candidates** |
| tesla | 64 | 0 | 0.0% | C | 5f | 0 | **hard 403 anti-bot** on both static AND Playwright |
| toyota | 140 | 0 | 0.0% | C | 0 | 1 | **double failure** — match gap on toyota.com + toyota-cms-media.s3 bucket 403s the downloader |

Legend: `PW esc` = Playwright escalations (`Nf` = N escalated but failed). `Phase-B fixes` = URL changes from Phase B (Mini's `5⁺` includes earlier-session fixes).

## Confirmation of the 6 Phase-B-flagged entries

All 6 produced **0 downloaded images** — the expected and correct outcome. Verified via `scripts/analyze_coverage.mjs`:

| brand/model | trim slugs | anyDownloaded |
|---|---|---|
| jeep / wrangler-4xe | 5 trims (sport-s, willys, sahara, rubicon, rubicon-x) | false × 5 |
| jeep / grand-cherokee-4xe | 3 trims (limited, trailhawk, summit) | false × 3 |
| porsche / 911-gt3-rs | gt3-rs | false |
| porsche / 718-cayman-gt4-rs | gt4-rs | false |
| porsche / 718-spyder-rs | spyder-rs | false |
| volvo / es90 | 3 trims (single-motor, twin-motor, twin-motor-performance) | false × 3 |

Notably the jeep 4xe URLs redirect to the parent model page (e.g. `/wrangler.html`), so `redirect:follow` reaches a valid Wrangler page — but the scraper still produced 0 images for these models. Possible reasons: the parent-page candidates' alt-text says "Wrangler 4xe" → the wrangler-4xe slug variants don't include a form like `wrangler-4xe` that matches the spaced alt-text, OR the `used` set on the parent Wrangler model consumed the relevant candidates first. Either way, the practical outcome (0 images for the discontinued 4xe lineup) is appropriate.

## The 5 "works but generic" fallback URLs from Phase B

Phase B flagged these as "URL returns 200 but may yield generic/shared content rather than model-specific imagery." Phase C result:

| brand / model | Phase-B URL strategy | Phase-C outcome |
|---|---|---|
| cadillac / ct4-v | configurator page (no overview) | **0 images** |
| cadillac / ct5-v | configurator page (no overview) | **0 images** |
| ford / f-150-raptor-r | shared with F-150 Raptor page | **0 images** |
| ford / f-250 / f-350 / f-450 super-duty | shared Super Duty template | mixed — partial coverage |
| hyundai / nexo | hyundainews.com press site | **0 images** (hyundai is 0% across the board) |

**Pattern: configurator pages, shared-template pages, and press-site repointings did NOT yield scrapeable model-specific images.** Specifically the Cadillac `ct4-v` / `ct5-v` / `ct4-v-blackwing` / `escalade-esv` all appeared in cadillac's 4 zero-image models, and Ford's `f-150-raptor-r` / `f-150-raptor` are in ford's 9 zero-image models. This is a useful finding for future config decisions: when a model has no dedicated overview page, **a configurator-page or shared-template URL is effectively equivalent to no URL** — the scraper can't extract model-specific imagery from them. Better to flag those models as "no manufacturer page" and accept the zero-image outcome than to substitute a generic URL.

## Comparative analysis — what drove the wins, what blocked the losses

### Wins by mechanism

- **URL fix decisive** (the brand was dead before Phase B and is good now): audi (25/25 URLs replaced, now 98.4%), mini (4 dead + canonicals, now 94.7%), genesis (8/8, 81.9%), acura (6/6, 81.9%), cadillac (6/18, 75.6%), mclaren (6/6 — but pre-resolved URLs, 100%), porsche (14/16, 50.3%), rolls-royce (3/7, 39.5%), volvo (3, 90.5%). **The biggest single class of fix this session.**
- **Regex separator fix** (universal — affects every brand whose alt-text uses spaced English): impossible to fully isolate, but the controls confirm it: Mini went 10.5%→94.7% (regex was the decisive variable, URL fix alone wouldn't have lifted it that far); Honda 72.2%→75.9% (same root cause + cached files). Brands with healthy coverage that did NOT have URL fixes or Playwright (bentley 100%, buick 100%, nissan 93.3%, jaguar 91.7%, mitsubishi 87.5%, chevrolet 87.8%, alfa-romeo 64.3%, rivian 78.9%, gmc 76.0%) are pretty much all-regex wins.
- **Playwright fallback decisive**: lexus (all 11 pages were JS-rendered, all 11 escalated and succeeded → 59.7%; without Playwright lexus would be ~0%), porsche (5 of 16 pages escalated + succeeded → contributed to 50.3%). Volvo's 1 Playwright escalation failed (es90) so volvo's 90.5% is not Playwright-attributable.
- **Phase-1 pre-resolved URLs still doing work**: BMW (251 of 284 entries were already resolved Phase-1 URLs — the scraper rewrote only 33; BMW's 93.7% is mostly old-Phase-1 scene7.com URLs), Honda (similar pattern), Jaguar (11/12), McLaren (entirely pre-resolved cars-assets-production.mclaren.com per prior session). The session-5 changes preserved these (needs_scraping gating worked — no destructive reset).

### Losses by root cause

1. **Slug/angle match gap (the dominant failure — ~13 brands).** Pages load (Phase B confirmed 200); the scraper extracts plenty of candidates from the static HTML (hyundai 95–457/page, ford 600–2199/page, mazda 365–479/page, mercedes 57–62/page, kia 57–83/page, ram 14–35/page), but `slugMatchesURL(model, url+alt)` plus the angle patterns match very few or zero of them. Either (a) the candidate URLs/alt-text on these brands don't contain the model slug or English angle words (images named by SKU/hash, alt-text generic or absent), or (b) the existing `slug_variants` in the configs don't capture how these brands name their image assets. **This is the headline finding of Phase C.** Affects: hyundai (0%), mercedes (19.6%), land-rover-partial, ford (40.4%), mazda (46.4%), kia (15.6%), ram (15.9%), jeep (22.7%), volkswagen (32.7%), polestar (25%), rolls-royce (39.5%), subaru (even after Playwright — 6.9%), and partially mercedes/maserati/toyota.

2. **Escalation threshold too strict (2 brands)**: `cands.length === 0` triggers Playwright, but pages that return 2–4 junk candidates (nav/logo) never escalate. land-rover (2–39 candidates per page, mostly JS-rendered → 17.4%) and lamborghini (4 candidates per page → 0%) are the victims. A revised threshold (e.g. "fewer than N candidates that match any model slug") would likely fix both.

3. **JS-rendered and Playwright also can't extract (2 brands)**: ferrari (11 escalations, 10 returned no candidates) and lotus (3 escalations, all returned 0 candidates). The rendered DOM has no plausible `<img>` candidates the scraper can identify — these sites embed imagery in ways even Playwright doesn't surface (CSS backgrounds inside shadow DOM? viewport-conditional rendering?).

4. **Hard 403 anti-bot blocking (2–3 brands)**: tesla.com 403s both static fetch and headless Chromium (0% — not recoverable with these scripts). The `toyota-cms-media.s3.amazonaws.com` bucket 403s the downloader on the pre-existing Phase-1 toyota URLs (137 entries). maserati.scene7.com 403s on 5 entries. These need different request headers (Referer? cookies?) or must be accepted as placeholders.

## Recommendation

Phase C is **complete and successful as a pipeline test** — no crashes, the 6 flagged entries correctly returned 0 images, the pipeline ran cleanly end-to-end across all 41 brands. The 55.6% project-wide coverage is a real, large improvement vs the prior state (the catalog was effectively at near-zero scraped coverage on 37 of 41 brands before this session). The 16 ≥80% brands prove the pipeline architecture works.

The 18 <50% brands are **diagnosed, not mysterious**. The dominant cause is the slug/angle match gap — a candidate-extraction limitation that surfaced specifically because of Phase C's breadth. Fixing it is real work but per-brand-tractable.

**Recommended next step (for human decision): proceed to Phase D + E now**, locking in this session's improvements (D = `python scripts/build_catalog.py`, ~5 seconds; E = STATUS.md / PROJECT_STATE.md / SESSION_SUMMARY_5.md updates), AND queue a **Phase C-bis** follow-up that focuses on:
1. **High-leverage, low-cost**: change the Playwright escalation threshold from `cands.length === 0` to "fewer than N candidates that match any model slug" — would likely lift land-rover and lamborghini significantly with no per-brand work.
2. **The slug/angle match gap (the big one)**: per-brand investigation — for each <50% brand, inspect a sample page's actual candidate URLs/alt-text and either (a) add brand-specific `slug_variants` that match the candidates' real naming, or (b) acknowledge that the brand's pages don't contain extractable model-namespaced imagery and document accordingly. mercedes / ford / hyundai / mazda / kia / ram / jeep are the priorities (largest entry counts).
3. **Toyota-specific**: investigate the toyota-cms-media.s3 bucket 403 — likely needs a Referer header in `download_images.mjs`, or a fresh re-scrape from toyota.com (which itself has the match-gap problem).
4. **Accept and document**: tesla (hard 403), ferrari/lotus (Playwright can't help), and possibly lamborghini if the threshold fix doesn't help — placeholder-only is the honest catalog answer.

The alternative (do C-bis first, then D/E) avoids a double rebuild but means the catalog site doesn't show ANY of this session's image work until C-bis finishes. Doing D/E now is strictly additive — it doesn't preclude C-bis later.

**Status: Phase C complete, Phase D and E not started, awaiting human decision.**
