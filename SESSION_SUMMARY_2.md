# SESSION_SUMMARY_2.md — 2026-05-13 (instruction-improvement + brand-config session)

Continuation of the 2026-05-13 chained Car Catalog Project session. The prior session (`SESSION_SUMMARY.md`) completed verification + fix-pass + script patches + Phase 2 rebuild. This session focused on (A) permanent instruction-file improvements based on cross-batch patterns, and (B) building Phase 4 brand configs for the 22 remaining brands. **No Phase 4 scripts were executed on any brand.** The Mini smoke test (human-gated) remains the gate before chained Phase 4 work.

---

## Task 1 — `instructions/01_research_brand.md` edits

**Line count:** 605 → 630 (25 lines added).

**Changes:**
- **1A.** New top-level section "Forbidden sources (read this first — applies project-wide)" inserted between Operating principles and Workflow. Lists explicit named domains (www.cars.com, motor1.com, carbuzz.com, autoblog.com, autoevolution.com, teslaoracle.com, carsfrenzy.net, carscoops.com, dealer-site pattern, forums, Reddit, enthusiast wikis) with the explicit instruction that finding info at one of these domains requires finding a primary source before citing.
- **1B.** "Ultra-luxury and exotic MSRP non-disclosure" subsection added to "Edge cases and how to handle them". Documents the pattern observed across Rolls-Royce / Aston Martin / Ferrari / Lamborghini (partial) / Bentley (likely) / McLaren (likely) and explicitly endorses null + notes as the correct answer, not a defect.
- **1C.** "NHTSA/IIHS non-testing of low-volume vehicles" subsection added to the same section. Lists the brands and variant categories where null safety ratings are expected.
- **1D.** "JD Power VDS / APEAL low-volume gaps" subsection added. Lists brands routinely missing from JD Power studies; notes Consumer Reports as a possible fallback.
- **1E.** New subsection "2g.5. Pre-save self-check (REQUIRED)" inserted between 2g (researched_at) and 2h (save). Five-item checklist covering forbidden-source domains, base trim ↔ delta consistency, singleton trim_family with 4 angles, EV sources.fuel_economy = fueleconomy.gov, and fueleconomy.gov URL verification.

---

## Task 2 — `instructions/03_verify_catalog.md` edits

**Line count:** 222 → 240 (18 lines added).

**Changes:**
- **2A.** Step 2's `msrp_base is null` rule rewritten: now BLOCKER unless trim.notes documents manufacturer non-disclosure (then FYI). Explicitly mentions Rolls-Royce / Aston Martin / Ferrari / Lamborghini partial as the affected pattern.
- **2B.** New check added to Step 1: walk every trim's `sources` map and every model's `professional_reviews.links[].url` against the named forbidden-domain list. Each finding is a BLOCKER with JSON path and offending URL.
- **2C.** New "Singleton trim_family check" added to Step 5. For each model, group by trim_family; for every family with exactly one trim, verify is_base_trim=true, delta_from_base=null, and 4 required image angles in the trim's own images array. Each violation is a BLOCKER.
- **2D.** New "NHTSA/IIHS source URL convention" check added to Step 5. Roll-up URLs (nhtsa.gov/ratings or iihs.org/ratings) are FYI for ultra-luxury/exotic brands (rolls-royce, aston-martin, ferrari, lamborghini, bentley, mclaren, lotus, bugatti) but WARNING for mainstream brands.

---

## Task 3 — `instructions/00_master_spec.md` edits

**Line count:** 579 → 590 (11 lines added). **Version bumped 1.1 → 1.2** — confirmed via grep of "Current version" line.

**Changes:**
- **3A.** Six new body-style decision rules added to §5: Lexus LC 500 Convertible → convertible; Porsche Panamera/Taycan Sport Turismo and Taycan Cross Turismo → wagon; Audi Sportback variants (sedan vs hatchback by trunk/liftgate); Audi Avant variants → wagon; Mercedes-AMG GT 4-Door → sedan.
- **3B.** New §4.5 "NHTSA/IIHS source URL convention" added under Source hierarchy. Per-vehicle URLs preferred; brand roll-up URLs valid only for documenting 'not tested'.
- **3C.** New bullet added to §13 (Open issues / known limitations) documenting ultra-luxury MSRP non-disclosure as structural rather than a research gap.
- **3D.** §12 version bumped from 1.1 to 1.2 with a new changelog entry dated 2026-05-13 summarizing the non-breaking documentation updates.

---

## Task 4 — `instructions/04_scrape_images.md` edits

**Line count:** 225 → 244 (19 lines added).

**Changes:**
- **4A.** New "Script behavior — what to know before running" section inserted after Operating principles. Documents the 2026-05-13 script patches as landed-but-unvalidated, lists the four pre-run verification criteria, and recommends Mini as the smoke-test brand with rationale.
- **4B.** New "Mercedes-Benz brand-config special case" subsection inserted before Step 4. Documents the mbusa.com 0% failure, the press.mbusa.com recommendation per PROJECT_STATE.md lesson #47, the URL pattern to expect, and the honest fallback if press is also gated.
- **4C.** "What this phase does NOT do" expanded with a new bullet warning against running Phase 4 before script patches are validated.

---

## Task 5 — 22 brand configs built

All configs written to `scripts/brand-configs/<slug>.json` via a single Node script (`scripts/build_brand_configs.mjs`). Per-brand summary:

```
acura:        6 model_pages,  3 slug_variants
aston-martin:11 model_pages,  5 slug_variants
audi:        25 model_pages,  6 slug_variants
cadillac:    18 model_pages,  9 slug_variants
chevrolet:   18 model_pages,  7 slug_variants
ferrari:     12 model_pages,  8 slug_variants
ford:        22 model_pages, 14 slug_variants
genesis:      8 model_pages,  2 slug_variants
hyundai:     14 model_pages,  7 slug_variants
kia:         16 model_pages,  8 slug_variants
lamborghini:  3 model_pages,  1 slug_variant
land-rover:  11 model_pages,  9 slug_variants
lexus:       11 model_pages,  0 slug_variants
mazda:       12 model_pages, 12 slug_variants
mini:         7 model_pages,  6 slug_variants
nissan:      13 model_pages,  3 slug_variants
porsche:     16 model_pages, 11 slug_variants
rolls-royce:  7 model_pages,  3 slug_variants
subaru:      10 model_pages,  0 slug_variants
tesla:       10 model_pages,  9 slug_variants
volkswagen:   9 model_pages,  5 slug_variants
volvo:        8 model_pages,  1 slug_variant
```

**Total: 265 model_pages across 22 configs.** Plus the 4 pre-existing (honda, bmw, toyota, mercedes-benz), scripts/brand-configs/ now holds all 26 brand configs. JSON validation: all 22 configs parse and contain the required `brand_slug`, `model_pages`, and `path_blacklist_regex` fields.

**Documented gates / cautions per brand notes (in the config files):**
- **acura** — acura.com and acuranews.com both 403 to WebFetch per PROJECT_STATE.md lesson #26.
- **audi** — audiusa.com 403; media.audiusa.com mostly returns nav/logo content; expect 403s during scrape.
- **ferrari** — ferrari.com/en-US is JS-rendered (blank to WebFetch); using ferrari.com/en-EN URLs which were Phase 1's reliable source. Likely low scrape coverage.
- **lamborghini** — lamborghini.com/en-us may be JS-rendered; press.lamborghini.com is documented alternative.
- **lexus** — lexus.com returned thin/no content to WebFetch; consumer-site URLs used with note that pressroom.lexus.com is the documented better source.
- **tesla** — tesla.com is highly JS-rendered; placeholder fallback in catalog accepted.

The `scripts/build_brand_configs.mjs` script is preserved as a record of how the configs were built and can be re-run to regenerate.

---

## Task 6 — `STATUS.md` updates

The "Image-scrape state (Phase 4)" table now has rows for all 26 brands. Mazda / Acura / Audi rows updated in place to show their configs now exist; new rows added for the other 19 brands (Mini, Lexus, Aston Martin, Cadillac, Chevrolet, Ferrari, Ford, Genesis, Hyundai, Kia, Lamborghini, Land Rover, Nissan, Porsche, Rolls-Royce, Subaru, Tesla, Volkswagen, Volvo) all with "config created; awaiting Mini smoke-test gate" notes. Mini's row explicitly flags it as the recommended smoke-test brand. The existing critical-script-bugs section (script patches landed but UNTESTED) was preserved unchanged — no clarification needed beyond what the prior session wrote.

---

## Task 7 — `PROJECT_STATE.md` updates

**"What's pending"** rewritten as a 7-item ordered list reflecting current state:
1. Script patches landed (prior session).
2. Instruction-file improvements completed (this session).
3. All 22 brand configs built (this session).
4. **NEXT ACTION:** Human smoke-tests Mini. Gate to all further Phase 4 work.
5-7. Phase 4 chain for Mercedes / Toyota / BMW after smoke-test passes.

**Lessons #49-52** added under new section "From the instruction-file improvement pass (today)":
- #49 — Forbidden-source warning strengthened with named domains.
- #50 — Verifier now mechanically checks forbidden URLs, singleton trim_family, NHTSA/IIHS roll-ups, and softens null msrp_base.
- #51 — Master spec bumped to v1.2 with body-style + §4.5 + §13 additions.
- #52 — 22 brand configs built in advance; build time effectively constant via single Node script.

**Resume notes #15-17** added under "Things to keep in mind when resuming":
- #15 — Forbidden-source list now names specific domains; future batches should produce fewer residuals.
- #16 — Verifier now flags singleton trim_family without 4 images.
- #17 — All 22 Phase 4 configs exist; chaining is a single-step process after smoke-test.

---

## Items requiring human attention before Phase 4

Nothing new was added to `SESSION_NOTES.md` this session — the items already flagged by the prior session (Volvo ES90 null MSRPs decision, untested script patches, the existence-of-prior-reports question) remain the only outstanding human items. The Mini smoke test is the immediate gate; once passed, Phase 4 can chain across all 22 brands.

**Recommended next session prompt:**

> "Continuing the Car Catalog Project. Read PROJECT_STATE.md to see current state. All instruction-file improvements landed; all 22 brand configs built; script patches landed but UNTESTED. The Mini smoke test is the gate. Run `node scripts/scrape_image_urls.mjs --brand mini` and inspect the result, then proceed per the now-explicit Phase 4 workflow."

---

## Files changed in this session

```
instructions/01_research_brand.md                       (+25 lines)
instructions/03_verify_catalog.md                       (+18 lines)
instructions/00_master_spec.md                          (+11 lines; v1.1 → v1.2)
instructions/04_scrape_images.md                        (+19 lines)
scripts/build_brand_configs.mjs                         (new — one-shot builder)
scripts/brand-configs/acura.json                        (new)
scripts/brand-configs/aston-martin.json                 (new)
scripts/brand-configs/audi.json                         (new)
scripts/brand-configs/cadillac.json                     (new)
scripts/brand-configs/chevrolet.json                    (new)
scripts/brand-configs/ferrari.json                      (new)
scripts/brand-configs/ford.json                         (new)
scripts/brand-configs/genesis.json                      (new)
scripts/brand-configs/hyundai.json                      (new)
scripts/brand-configs/kia.json                          (new)
scripts/brand-configs/lamborghini.json                  (new)
scripts/brand-configs/land-rover.json                   (new)
scripts/brand-configs/lexus.json                        (new)
scripts/brand-configs/mazda.json                        (new)
scripts/brand-configs/mini.json                         (new)
scripts/brand-configs/nissan.json                       (new)
scripts/brand-configs/porsche.json                      (new)
scripts/brand-configs/rolls-royce.json                  (new)
scripts/brand-configs/subaru.json                       (new)
scripts/brand-configs/tesla.json                        (new)
scripts/brand-configs/volkswagen.json                   (new)
scripts/brand-configs/volvo.json                        (new)
STATUS.md                                               (Phase 4 table: 22 new rows + 3 updated rows)
PROJECT_STATE.md                                        ("What's pending" rewritten; +lessons 49-52; +resume notes 15-17)
SESSION_SUMMARY_2.md                                    (this file)
```

**Safety rules observed:**
- No scrape/download scripts executed on any brand.
- No brand JSONs in `data/` or `catalog/data/` modified.
- No script files (scrape_image_urls.mjs, download_images.mjs) modified.
- No `data/_partials/` modifications.
- No URLs invented beyond well-documented consumer-site URL patterns; per-brand notes document any uncertainty.
