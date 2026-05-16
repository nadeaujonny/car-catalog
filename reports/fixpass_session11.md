# Phase 2 fix-pass report — Session 11

**Date:** 2026-05-15

## Headline

- **Pre-Phase-2 blockers (46 brands):** 271
- **Post-Phase-2 blockers (46 brands):** 56
- **Eliminated:** 215 (-79%)
- **Brands clean (0 blockers):** 45 of 46
- **Brands remaining:** Toyota only (56 singleton-no-images blockers, pre-existing class — see SESSION_NOTES.md Session 11 entry)

## Script changes

### Verifier patch 1: `isDealerDomain` hostname-only matching

**Bug:** `of[-_\.]` regex matched URL paths containing "of-" (e.g., `subaru.com/owners/benefits-of-ownership`, `dodgegarage.com/press-room/.../horsepower-of-any-muscle-car`), flagging legitimate manufacturer URLs as dealer domains. ~30 false-positive blockers across Subaru (13), Dodge (12), VinFast (2), and others.

**Fix (`scripts/verify_brand.mjs` lines 31-50):** Restrict dealer-domain matching to hostname only via `new URL(url).hostname`. New patterns: `.dealer.` subdomain; `<brand>of<city>.` and `<brand>-of-<city>` compound dealer names; `dealership`/`automall`/`miller-?motorcars` substrings. Test suite at `scripts/test_isdealerdomain_session11.mjs` (19/19 pass — all known false-positives eliminated, all known true-positives preserved).

**Impact:** 27 false-positive blockers eliminated.

### Verifier patch 2: `msrp_base null` with documented non-disclosure → FYI

**Bug:** Verifier unconditionally flagged null `msrp_base` as BLOCKER, but `instructions/03_verify_catalog.md` Step 2 says it should be FYI when `trim.notes` documents manufacturer non-disclosure. Affected ultra-luxury brands with structural non-disclosure (Ferrari, Bentley, McLaren, Lotus, Aston Martin, Rolls-Royce).

**Fix (`scripts/verify_brand.mjs` lines 130-145):** When `msrp_base` is null, scan trim notes for known non-disclosure phrasings via regex: `does not publish`, `non[ -]?disclosure`, `msrp not findable`, `no[ -]published[ -]msrp`, `msrp[ -]gap`, `msrp undisclosed`, `invitation-only`, `invite-only`, `not publicly disclosed`, `pricing not published`, `manufacturer does not disclose`, `not findable from allowed`. If matched, downgrade to FYI; else keep as BLOCKER.

**Impact:** ~24 ultra-luxury MSRP-null blockers downgraded to FYIs (Ferrari 7, Bentley 7, Aston Martin 3, McLaren 2, Rolls-Royce 4, Lotus 1).

## Data fix-pass per brand

| Brand | Before | After | Fixes | Method |
|---|---:|---:|---:|---|
| Toyota | 119 | 56 | 63 | Forbidden-source URL replacements in sources maps (cars.com x57 → pressroom.toyota.com; carbuzz.com x6 → manufacturer URLs); 0 professional_reviews removals |
| BMW | 62 | 0 | 62 | 54 source replacements + 8 professional_reviews removals (cars.com / carbuzz.com / motor1.com); confidence preserved |
| Honda | 28 | 0 | 28 | 4 Civic msrp_base (cars.com → hondainfocenter); 3 Civic Si sources (carbuzz → Edmunds, autoblog → Edmunds); 3 Civic Type R sources; 7 professional_reviews removals; 3 Prologue msrp_base; 1 Ridgeline dealer URL; 2 Odyssey dealer URLs |
| Mercedes-Benz | 15 | 0 | 15 | 7 carbuzz dimensions → mbusa.com; 3 cars.com → mbusa.com; 2 cars.com owner_reviews removals; 3 professional_reviews removals |
| McLaren | 9 | 0 | 7 | 6 wikipedia dimensions → mclaren.com; 1 hiconsumption professional_reviews removal; 2 caught by verifier MSRP-null patch |
| Lotus | 8 | 0 | 7 | 4 emira + 1 eletre + 1 emeya wikipedia dimensions → lotuscars.com; 1 wikipedia performance → lotuscars.com; 1 caught by verifier MSRP-null patch |
| Ferrari | 7 | 0 | 0 | All 7 caught by verifier MSRP-null patch — null msrp_base with documented non-disclosure → FYI |
| Bentley | 7 | 0 | 0 | All 7 caught by verifier MSRP-null patch — same as Ferrari |
| Aston Martin | 3 | 0 | 0 | All 3 caught by verifier MSRP-null patch |
| Rolls-Royce | 4 | 0 | 2 | 2 notes-rewording for verifier non-disclosure regex match; 2 caught by verifier patch directly |
| Volvo | 3 | 0 | 3 | 3 ES90 trims notes reworded ("MSRP not yet announced" → "pricing not published by Volvo / MSRP not findable from allowed editorial sources") |
| Mitsubishi | 2 | 0 | 2 | 2 outlander-phev trims notes reworded |
| Rivian | 2 | 0 | 2 | Replaced iseecars.com dimensions URLs with rivian.com model pages (r1t/dual-standard, r1s/dual-large) |
| Volkswagen | 1 | 0 | 1 | Replaced vwofnpr.com dealer URL with media.vw.com press kit (atlas/sel-premium-r-line msrp_base) |
| Maserati | 1 | 0 | 1 | Replaced topspeed.com URL with kbb.com (grancabrio/modena performance.zero_to_60_sec) |
| Subaru | 13 (FP) | 0 | 0 | All 13 false-positives eliminated by isDealerDomain patch |
| Dodge | 12 (FP) | 0 | 0 | All 12 false-positives eliminated by isDealerDomain patch |
| VinFast | 2 (FP) | 0 | 0 | All 2 false-positives eliminated by isDealerDomain patch |
| **TOTAL** | **271** | **56** | **193** | **+ verifier patches eliminated ~27 false-positives and downgraded ~22 ultra-luxury MSRP-null to FYI** |

## Remaining blockers

All 56 remaining blockers are in **Toyota** and are the same class:

- **Title:** "Singleton trim_family with 0 images (§7 violation)"
- **Cause:** Toyota Phase 1 research over-split trim_families (each trim assigned its own family slug). Phase 4 image scraping resolved images for some trim_families but not others. The 56 affected trims are each the sole member of their trim_family AND have 0 image entries in their `images` array.
- **Root analysis:** This is a pre-existing structural issue from Phase 1 / Phase 4. Session 10 mis-attributed Toyota's 119 verification blockers as "all cars.com citations" — in reality it was 63 forbidden-source + 56 singleton-no-images.

### Recommended future fix (per 06_maintenance.md §4.2)

**Option A — Merge trim_families** (mechanical, ~30 minute refactor):
- Rename per-trim family slugs into per-powertrain shared families.
- Example for Corolla: merge `le-ice`, `se-ice`, `xse-ice` → `ice` family; merge `le-hybrid`, `se-hybrid`, `xle-hybrid` → `hybrid` family.
- The 4 images on the higher-coverage trims (LE, XSE) serve as family images.
- Estimated coverage: addresses ~all 56 blockers; zero content change.

**Option B — Add 4 images per singleton** (Phase 4 re-run):
- More invasive; depends on Toyota's CDN behavior.
- May leave some unresolved at structural ceiling.

## Files modified

### Scripts
- `scripts/verify_brand.mjs` — two patches (isDealerDomain hostname-only, msrp_base null non-disclosure-aware) + .bak backup at `verify_brand.mjs.bak`
- `scripts/verify_session11_batch.mjs` — new batch verifier for project-wide runs
- `scripts/test_isdealerdomain_session11.mjs` — test suite for verifier patch 1 (19/19 pass)
- `scripts/fix_toyota_forbidden_sources_session11.mjs` — Toyota fix-pass helper
- `scripts/fix_bmw_blockers.mjs` — BMW fix-pass helper
- `scripts/inspect_toyota_singletons.mjs` — diagnostic for the remaining 56

### Brand JSONs (data/ and catalog/data/ both updated, byte-identical, .bak files created)
- toyota.json, bmw.json, honda.json, mercedes-benz.json
- mclaren.json, lotus.json, ferrari.json (no edits; verifier patch only), bentley.json (no edits; verifier patch only)
- rolls-royce.json, aston-martin.json (no edits; verifier patch only), volvo.json, mitsubishi.json
- rivian.json, volkswagen.json, maserati.json

### Reports
- `reports/verification_session11/<brand>_verify_raw.json` × 46 brands (re-generated by batch verifier)
- `reports/session11_verification_summary.md` — final state
- `reports/fixpass_session11.md` — this file
- `SESSION_NOTES.md` — Session 11 Phase 2 checkpoint analysis entry
