# PROJECT_STATE.md

A pointer file for picking up the Car Catalog Project in a new chat or session. Read this first before resuming work.

---

## Current status

**Phase:** Session 16 (2026-05-16) — portfolio prep. **The project is shipped.** Session 16 packaged the repo as a portfolio-grade GitHub project: new portfolio README.md, `docs/PROCESS.md` (engineering narrative), `docs/SCHEMA.md` (dataset tutorial), `docs/PROJECT_SPEC.md` (original spec preserved), `LICENSE` (MIT, Jonathan Nadeau, 2026), `.gitignore` (comprehensive), `.github/workflows/deploy.yml` (GitHub Pages auto-deploy on push to main), 8 Playwright-captured screenshots in `docs/screenshots/`, and 3 example dataset analyses with matplotlib charts in `analyses/`. Repo cleanup deleted all 5 `catalog/.session13_stage_*_pre/` backup directories (obsolete after Session 15) and 3 stray `.bak` files in `scripts/`. Zero data work — no brand JSON modified, no instruction file edited, no script behavior changed. Project totals unchanged: **46 brands / 435 models / 1,492 trims / 3,253 of 4,482 images = 72.58% coverage / 0 verification blockers**. Next manual step: user runs `git add` + `git commit` + `git push -u origin main`; enables GitHub Pages in repo Settings with "GitHub Actions" as source. Live URL after first deploy: `https://nadeaujonny.github.io/car-catalog/`. Full Session 16 detail in `SESSION_SUMMARY_16.md`; per-phase report in `reports/session16_final.md`; manual-steps record in `SESSION_NOTES.md` Session 16 entry.

**Session 15 prior phase summary (preserved for continuity):** NetCarShow positional heuristic (HALTED at Phase 2 spot-check). Phase 1 (script extension + §A documentation) landed cleanly. Phase 2 (Ferrari validation) HALTED at the spot-check: **NetCarShow serves anti-bot decoy images** (multi-colored pixel noise instead of real Ferrari press-kit photography) to non-browser clients. The heuristic itself correctly identified hero candidates by URL width hint and assigned them positionally (4 fills on amalfi / 296-speciale / 296-speciale-a / 849-testarossa); but visual spot-check on the downloaded files revealed all 4 to be decoy noise. Per the brief's safety rule, restored Ferrari from the manual revert (the `.bak` files had been overwritten by the download step), deleted the 4 decoy image files, halted Phase 3 (project-wide application), updated §A to flag NetCarShow as effectively dormant pending a future fetch-mechanism upgrade (Playwright-rendered Tier 2 is the most plausible path). Project-wide totals unchanged: 46 brands / 435 models / 1,492 trims / 3,253 of 4,482 images = 72.58% coverage. Ferrari restored to Session 14 final state (11/48 = 22.9%). Full diagnosis in `SESSION_NOTES.md` Session 15 entry. Concise summary in `SESSION_SUMMARY_15.md`; detailed final report in `reports/session15_final.md`.

**Session 14 prior phase summary (preserved for continuity):** tiered source allowlist (HALTED at Phase 3 checkpoint). Phases 1+2 landed cleanly (policy update in `instructions/04_scrape_images.md` §A; tier-aware extensions to `scripts/scrape_image_urls.mjs` and `scripts/download_images.mjs`; verifier docs in `instructions/03_verify_catalog.md`). Phase 3 (Tesla + Ferrari validation) HALTED at "if neither brand improves significantly" — both brands remained at their prior coverage. The architecture is correct (Tesla.com + Tesla configurator API both 403; NetCarShow Tier 2 URLs successfully redirect-detected for wrong-MY; Ferrari's NetCarShow candidates rejected by `pickBestForAngle` for lack of angle vocabulary in URL/alt-text). Session 15 then attempted to fix the angle-vocab gap via a NetCarShow positional heuristic — that effort surfaced the deeper anti-bot decoy problem documented above.

**Session 13 prior phase summary (preserved for continuity):** frontend polish session. **Catalog (`catalog/index.html`, `styles.css`, `app.js`, `manifest.json`) restyled from "functional generated grid" → "portfolio-ready editorial publication"** across 5 design stages (each backed up to `catalog/.session13_stage_N_pre/`). Zero data changes: no brand JSON touched, no `data/_partials/` opened, no instruction file modified. The site still renders the same 46 brands / 435 models / 1,492 trims. Design direction: enthusiast-magazine sophistication, neutral palette with deep desaturated indigo accent (replacing the original automotive-red), confident editorial typography, polished light + dark modes. Full per-stage detail in `reports/session13_progress.md` and `reports/session13_final.md`; concise summary in `SESSION_SUMMARY_13.md`.

**Session 12 prior phase summary (preserved for continuity):** single-task maintenance — cleared Toyota's 56 singleton-no-images blockers via 49 minimal-diff `trim_family` renames across 15 models per `instructions/06_maintenance.md` §4.2. **Project-wide blockers: 56 → 0.** **All 46 of 46 brands verify clean.** No image entries, local_paths, or any other field changed — only `trim_family` on 49 affected trims was repointed to an existing populated/base-containing family in the same model + powertrain. 7 base-trim blockers were cleared indirectly when other trims merged into their family. Post-fix Toyota: 0 blockers / 28 warnings / 0 FYIs (the warnings are singleton-with-<4-images on partially-imaged singletons — out of scope). Project-wide totals (unchanged): 46 brands, 435 models, 1,492 trims. Image coverage unchanged: 3,253 / 4,482 = 72.58%. **The project is at genuine zero-blocker maintenance mode.**

**Session 11 prior phase summary (preserved for continuity):** four-phase cleanup + maintenance-mode transition: (Phase 1) Instruction-file consolidation creating new `05_session_runbook.md` (multi-phase session meta-rules) and `06_maintenance.md` (periodic upkeep workflows), plus cumulative updates to 00/01/03/04; (Phase 2) Forbidden-source fix-pass eliminated 215 verification blockers (project 271 → 56 = -79%) across 14 brands, plus two verifier patches (`isDealerDomain` hostname-only fix eliminating 27 false-positives; `msrp_base null` non-disclosure-aware FYI downgrade eliminating 22 ultra-luxury false blockers); (Phase 3) Applied Session 10 freshness drift findings on BMW (3 trims) and Chevrolet (3 trims); (Phase 4) Final build + verification. Final verification state going into Session 12: 56 blockers (all Toyota), 322 warnings, 30 FYIs, 45 of 46 brands clean.

**Session 10 prior phase summary (preserved for continuity):** five-phase post-completion expansion: (Phase A) per-brand image investigation lifting Mercedes-Benz +7.6pp, GMC +9.6pp (tier B→A), Rolls-Royce +26.3pp (tier C→B) via brand-config-only changes; (Phase B) 5 new brands added (Chrysler, Dodge, Fiat, Bugatti, VinFast); (Phase C) 80 reliability fills; (Phase D) 5-brand freshness spot-check; (Phase E) verification surfacing 263 blockers (later proven to be 215 forbidden-source + 56 image-coverage; the latter mis-attributed in Session 10's summary).

**Session 9 prior phase summary (preserved for continuity):** Phase A per-brand image investigation for 8 tier-B brands gained Kia +45.3pp via script-level HTML-entity decode + 360-spin angle URL patterns; Phase B scoped MSRP policy relaxation (instructions/01_research_brand.md §4.6) allowing automotive-press editorial sources for ultra-luxury brands with documented non-disclosure, with 41 of 57 targeted trims filled.

**What's done end-to-end:**

- **Original 4 priority brands** (research → build → verified → clean):
  - **Honda:** 13 models, 53 trims. 72% image coverage from prior hardcoded Honda-only script.
  - **BMW:** 30 models, 74 trims. Post-fix-pass clean.
  - **Toyota:** 23 models, 127 trims. Post-fix-pass clean.
  - **Mercedes-Benz:** 25 models, 78 trims. Post-fix-pass clean.

- **Second batch of 4 brands** (research → build → verified):
  - **Mazda:** 12 models, 57 trims. **Verification blockers pending fix:** 36 empty singleton trim_family entries (spec §7 violation at scale) + 2 Motor1 citations.
  - **Acura:** 6 models, 19 trims. **Verification blockers pending fix:** 3 cars.com links in ADX/RDX/MDX professional_reviews.links; MDX SH-AWD singleton trim_family has 0 images.
  - **Lexus:** 11 models, 54 trims. **Verified clean** — 0 blockers, 3 warnings, 4 FYIs.
  - **Audi:** 25 models, 47 trims. **Verification blockers pending fix:** 19 cars.com citations across 19 models in professional_reviews.links.

- **Third batch of 6 ultra-luxury / EV brands** (research → build → verified):
  - **Tesla:** 10 models, 16 trims. **Verification blockers pending fix:** ~20 forbidden URLs (Carbuzz, Autoblog, AutoEvolution, Tesla Oracle, cars.com) in sources maps and professional_reviews.links.
  - **Lamborghini:** 3 models, 3 trims. **Verification blocker pending fix:** 1 Motor1 link in Revuelto professional_reviews.links. All trims sole-trim PHEVs. Revuelto + Temerario MSRPs honestly null.
  - **Rolls-Royce:** 7 models, 9 trims. **Verification blocker pending fix:** 7× cars.com + 1× rollsroycepasadena.com (dealer site) in sources.dimensions. All MSRPs null.
  - **Aston Martin:** 11 models, 13 trims. **Verified clean** — 0 blockers, 2 warnings, 4 FYIs. All MSRPs null.
  - **Ferrari:** 12 models, 12 trims. **Verified clean** — 0 blockers, 1 warning, 4 FYIs. All sole-trim. All MSRPs null.
  - **Porsche:** 16 models, 62 trims. **Verification blocker pending fix:** 911 msrp_range.high (246800) stale; should be 203300 after 911 Turbo S split into separate model.

- **Fourth batch of 12 brands** (research → build complete; **verification pending**):
  - **Mini:** 7 models, 11 trims. Researched 2026-05-12.
  - **Genesis:** 8 models, 39 trims. Researched 2026-05-12.
  - **Cadillac:** 18 models, 42 trims. Researched 2026-05-12.
  - **Subaru:** 10 models, 50 trims. Researched 2026-05-12.
  - **Volvo:** 8 models, 41 trims. Researched 2026-05-12.
  - **Volkswagen:** 9 models, 31 trims. Researched 2026-05-12.
  - **Nissan:** 13 models, 48 trims. Researched 2026-05-12.
  - **Kia:** 16 models, 69 trims. Researched 2026-05-12.
  - **Hyundai:** 14 models, 71 trims. Researched 2026-05-13.
  - **Land Rover:** 11 models, 36 trims. Researched 2026-05-13.
  - **Chevrolet:** 18 models, 72 trims. Researched 2026-05-13.
  - **Ford:** 22 models, 74 trims. Researched 2026-05-13.

  This batch ran as a single overnight chained Phase 1 session (~7 hours total) with the explicit pre-flight forbidden-source warning baked into the prompt. All 12 brands have schema_version 1.1, populated researched_at, 0 models with missing researched_at, and parse cleanly. No verification reports yet.

- **Fifth batch of 15 brands** (research only — Phase 2/3 pending):
  - **Infiniti:** 2 models, 12 trims. Researched 2026-05-13.
  - **GMC:** 10 models, 52 trims. Researched 2026-05-13.
  - **Buick:** 4 models, 12 trims. Researched 2026-05-13.
  - **Jaguar:** 1 model, 3 trims. Researched 2026-05-13. F-PACE only — Jaguar mid-transition to EV-only reposition; XE/XF/F-TYPE/I-PACE/E-PACE all discontinued.
  - **Polestar:** 2 models, 6 trims. Researched 2026-05-13. Polestar 3 + Polestar 4 only; Polestar 2 dropped from US new-car sales (tariff exposure).
  - **Jeep:** 12 models, 55 trims. Researched 2026-05-13. Wrangler ICE/4xe/Moab 392 split as separate models; final-MY 4xe PHEVs.
  - **Ram:** 3 models, 22 trims. Researched 2026-05-13. ProMaster excluded as commercial; TRX/REV/Ramcharger excluded as 2027 MY.
  - **Mitsubishi:** 4 models, 24 trims. Researched 2026-05-13. Mirage/G4 discontinued.
  - **Alfa Romeo:** 3 models, 7 trims. Researched 2026-05-13. Quadrifoglio variants dropped for MY26 US; Tonale PHEV dropped.
  - **Maserati:** 6 models, 12 trims. Researched 2026-05-13. Ghibli/Levante/Quattroporte discontinued; MCPura replaces MC20.
  - **Bentley:** 5 models, 22 trims. Researched 2026-05-13. **All 22 trims have null msrp_base** per ultra-luxury non-disclosure.
  - **McLaren:** 6 models, 6 trims. Researched 2026-05-13. All sole-trim. **All 6 trims have null msrp_base**. W1 excluded as invite-only.
  - **Lotus:** 3 models, 6 trims. Researched 2026-05-13. Evija excluded as invite-only. US tariff context drove sole-trim Eletre Carbon and Emeya R.
  - **Rivian:** 3 models, 10 trims. Researched 2026-05-13. R1T/R1S Gen 2 + R2 Performance Launch Edition only. R1S earned IIHS 2026 TSP+.
  - **Lucid:** 2 models, 6 trims. Researched 2026-05-13. Air + Gravity. 2027 MY Gravity refresh excluded — kept 2026 MY values.

  This batch ran via parallel subagent delegation (3 batches of 4-5 agents each) after a manual Infiniti pilot. All 15 brands parse cleanly with schema_version 1.1, researched_at 2026-05-13, 0 models missing date. STATUS.md updated with detailed per-brand notes by the subagents. SESSION_NOTES.md has Jaguar lineup decision documented. See `SESSION_SUMMARY_3.md` for full per-brand findings.

- **Unified catalog site:** `catalog/index.html` serves all 26 brands. **358 models / 1,208 trims total** as of 2026-05-13. App shell is brand-agnostic; manifest.json drives runtime brand selection. The 15 new brands from batch 5 are NOT YET BUILT into the site; Phase 2 incremental rebuild needed to expose them (estimated post-rebuild totals: **41 brands, 424 models, 1,463 trims**).

- **Session 6 C-bis chain completed (2026-05-14)** — 7-phase chain addressing the 4 diagnosed root causes from Session 5. Headline outcomes: Toyota +95pp (Phase 4 Referer), Jeep +42pp (Phase 3 gallery URL switch), Lamborghini +42pp (Phase 2 threshold), Mercedes-Benz +13pp (Phase 3), Ford +7pp (Phase 3), Volkswagen +6pp (Phase 5). Net session: +289 entries downloaded, +6.61pp project-wide coverage. Full per-brand before/after at `reports/phase4_coverage_final_2026-05-14.md`. 5 brands documented as persistent low coverage at `reports/persistent_low_coverage_brands.md`. SESSION_SUMMARY_6.md captures the per-phase work.

**What to do next — project end state**

**As of 2026-05-16 (Session 16, complete), the Car Catalog Project is SHIPPED.** State: 46 brands, 435 models, 1,492 trims, 72.58% project-wide image coverage, 98% MSRP completion, all 46 of 46 brands verify clean (0 blockers each, ~312 warnings, ~30 FYIs), portfolio-grade README + docs + screenshots + analyses + LICENSE + GitHub Pages deploy workflow in place, repo cleaned. The remaining work is **manual** (not session work):

1. **Push to GitHub.** `git add . && git commit -m "Initial commit ..." && git push -u origin main`. The remote `https://github.com/nadeaujonny/car-catalog.git` is already configured.
2. **Enable GitHub Pages.** Repo Settings → Pages → Source: "GitHub Actions". The `.github/workflows/deploy.yml` will deploy `catalog/` to `https://nadeaujonny.github.io/car-catalog/` on every push to `main`.
3. **Share the URL.** That's the portfolio link.

See `SESSION_NOTES.md` Session 16 entry for the exact push command and verification checklist.

**Optional follow-ups (none required):**

**Session 14 / Session 15's halted work — what a future session could pick up.** The §A policy and Tier 2/3 script infrastructure are in place; the NetCarShow positional heuristic is implemented but dormant (`scripts/scrape_image_urls.mjs` `applyNetCarShowPositional`). Session 15 attempted Session 14's option 1 (per-source angle picker) and discovered a deeper structural blocker: **NetCarShow serves anti-bot decoy images to non-browser clients** — pixel-noise JPEGs that pass HTTP-level validation but contain no real photography. This invalidates NetCarShow as a Tier 2 image source under the current scrape/download architecture.

To extract value from Tier 2 sources, a future session would need ONE of:
1. **Playwright-rendered Tier 2 fetches and downloads.** Currently the script uses static fetch for Tier 2 candidates AND downloads. Running both stages through Playwright would establish a real-browser session (cookies, JS execution, navigation history) and likely bypass NetCarShow's anti-bot decoy mechanism. This is now the leading candidate.
2. **A different Tier 2 source that serves real images programmatically.** Car and Driver, MotorTrend, Edmunds, Hagerty are on the §A allowlist but their content has the same alt-text / angle-vocab gap NetCarShow has, AND may have similar anti-bot decoy behavior. Spot-checking image content (not just URLs) via the download script + visual inspection BEFORE designing a heuristic is now mandatory per §A's HALT note.
3. **`angle_url_patterns` Tier 2 hints per brand.** Per-source regex hints in the brand config — same approach as Tier 1, applied to Tier 2 candidates. Tight scope, per-source maintenance, BUT does not address the anti-bot decoy issue (decoys would still get assigned).

None of these are blocking; the existing 72.58% coverage from Sessions 1-12 is preserved. **Critical pre-flight for any future Tier 2 effort: download one image from the proposed source via the existing `scripts/download_images.mjs` flow and visually inspect it. The HTTP-level success of Session 14 + the visual-decoy finding of Session 15 together establish that URL/header verification is insufficient.**

**Remaining non-mandatory follow-ups (queued, not blocking):**

1. **APEAL fills (awaiting external data).** JD Power 2026 APEAL publishes ~July 2026; once available, ~150-200 `customer_satisfaction` unknowns can be filled via targeted re-research per `06_maintenance.md` §2. This is the only remaining non-optional data work.
2. **Quarterly freshness check.** Schedule for Q3 2026 (around MY27 announcement season). Use `06_maintenance.md` §5 pattern: sample 5-10 brands, spot-check 2-3 trims each, document drift, decide refresh pass.
3. **Toyota singleton-with-<4-images warnings (28 remain).** Out of Session 12 scope. These are partially-imaged singletons (1-3 images each); a future pass could either fill missing angles via Phase 4 or further-consolidate trim families.
4. **Additional brand research (declining marginal value).** Karma, Pagani, Koenigsegg — pipeline supports incremental adds.
5. **Image weight optimization.** `catalog/images/` is 1.4 GB; downscaling press-kit JPEGs to 1200px or moving to Git LFS would reduce clone time. Cosmetic; the repo is within GitHub's hard limits.
6. **Or just stop.** The catalog renders 46 brands / 435 models / 1,492 trims with 72.58% image coverage, 98% MSRP completion, clean verification on all 46 brands, a polished frontend, portfolio packaging, and a live deploy path. The original spec is fully met; the project is shipped.

1. **Policy relaxation for specific brands.** Tesla 0% reflects a hard HTTP 403 anti-bot block; relaxing manufacturer-only sourcing for Tesla (e.g., accepting press syndicate images from EV-news outlets, or hand-curated public-domain sources) is a project-direction question, not an engineering one. Same option exists for Ferrari (still at 22.9% even after Phase B), Land Rover (31.9%), Mercedes-Benz (32.5%), and other <50% brands. The catalog renders with placeholders for missing images; no functional gap.

2. **Additional brand research.** Notable absences: Chrysler, Dodge, Fiat, Bugatti, Pagani, Koenigsegg. The pipeline is mature enough to add brands incrementally without architecture changes. The forbidden-source warning baked into instruction templates substantially reduces drift to content farms.

3. **UI / site polish.** The catalog renders at `catalog/index.html` and is functional. Polish opportunities: filters, sort, comparison, visual treatment improvements. None required for functional completeness.

4. **Data freshness re-research.** Phase B (Session 5) found ~36% of model URLs drifted in 2 days; quarterly URL-validation runs would keep the catalog current. Same for MSRP, EPA, and IIHS data — currently captured at Phase 1 research time, not re-validated.

**Engineering items that COULD continue lifting coverage but require further investigation:**

5. **Subaru / Land Rover / Mercedes-Benz interior_dashboard** — these brands have working exterior coverage but still missing interior shots. The blockers are URL-pattern-specific (Subaru's interior URLs use internal codes; Mercedes-Benz's interior URLs sit behind a configurator gate). Each would need per-brand investigation similar to Session 7's Phase A.

6. **`pickByPosition` brand-pattern-awareness** — original Session 7 identification for Subaru. Phase B (Session 8) resolved Subaru's side_profile via a different mechanism (filter relax), so the pickByPosition enhancement was skipped. If a future session identifies another brand whose imagery is positionally-identifiable but URL-opaque, this lever remains an open option.

7. **Vision-model angle verification** — Kia's `375-hero-my26-niro-hev-v2.jpg` has alt "three-quarter back view" but the image is a front-3/4. A lightweight vision verification of each downloaded image's angle classification would catch mislabels. Requires a new phase architecture.

None of items 1-7 are required for functional project completeness.

**Files in instructions/ folder — the source of truth for project rules (current versions, all saved locally and in the Claude.ai Project):**
- `README.md` — project overview
- `00_master_spec.md` — schema v1.3 (sole-trim rule, EV MPGe mirroring, behind_3rd_row field for 3-row SUVs, NHTSA/IIHS roll-up URL convention, ultra-luxury MSRP non-disclosure, `sources_confidence` optional map, brand-config conventions for `angle_url_patterns` and `accepted_cdn_domains`)
- `01_research_brand.md` — v3 (post-Session-11): cumulative Sessions 5-10 image-scrape blocker patterns documented; forbidden-source list at top; §4.6 MSRP scoped relaxation
- `02_build_catalog.md` — unchanged from initial
- `03_verify_catalog.md` — v2 (post-Session-11): documented optional config fields, FYI-vs-blocker clarifications, isDealerDomain bug + fix, verification batching pattern
- `04_scrape_images.md` — v3 (post-Session-14): adds §A "Tiered source allowlist for image scraping" (Tier 1 manufacturer + Tier 2 press-kit aggregation/editorial + Tier 3 manufacturer configurator-API endpoints, explicit denylist, provenance requirements source_tier/source_domain, MY/model verification at scrape time, order of preference, cross-reference to §4.6 MSRP relaxation). v2 architecture (Session 11) is preserved: static-first → Playwright fallback, angle_url_patterns, resolution preference, isPlausibleImageURL extension-less, HTML entity decode, Referer header, structural ceiling concept, 5-step diagnostic
- `05_session_runbook.md` — NEW in Session 11: multi-phase session orchestration meta-rules (read-first preamble, safety rules, parallel-subagent criteria, checkpoint design, output conventions, .bak discipline, common session shapes)
- `06_maintenance.md` — NEW in Session 11: periodic maintenance work outside Phases 1-4 (drift detection, targeted re-research, image-config rot repair, verifier-found blocker triage, freshness spot-check pattern)

**Local folders that exist (as of 2026-05-13):**
- `C:\Users\nadea\car-catalogs\PROJECT_STATE.md` — this file
- `C:\Users\nadea\car-catalogs\STATUS.md` — per-brand pipeline tracking (updated 2026-05-13 by the Phase 2 build to reflect all 26 brands)
- `C:\Users\nadea\car-catalogs\instructions\` — all five `.md` files
- `C:\Users\nadea\car-catalogs\data\<brand>.json` — 26 brand JSONs (honda, bmw, toyota, mercedes-benz, mazda, acura, lexus, audi, tesla, lamborghini, rolls-royce, aston-martin, ferrari, porsche, mini, genesis, cadillac, subaru, volvo, volkswagen, nissan, kia, hyundai, land-rover, chevrolet, ford)
- `C:\Users\nadea\car-catalogs\catalog\` — unified site, all 26 brands
- `C:\Users\nadea\car-catalogs\catalog\data\<brand>.json` — copies the site reads (26 brand JSONs, 7.1 MB total)
- `C:\Users\nadea\car-catalogs\catalog\images\honda\` — 90+ Honda image files (from prior hardcoded scrape)
- `C:\Users\nadea\car-catalogs\reports\<brand>_verification.md` — verification reports for 14 of 26 brands (the 4 original + 10 from batches 2 and 3). The 12 newest brands have no reports yet.
- `C:\Users\nadea\car-catalogs\scripts\scrape_image_urls.mjs` — generalized scrape script (current, untested in generalized form)
- `C:\Users\nadea\car-catalogs\scripts\download_images.mjs` — generalized download script (current, untested in generalized form)
- `C:\Users\nadea\car-catalogs\scripts\brand-configs\honda.json` — Honda Phase 4 config (only brand config that exists)
- `C:\Users\nadea\car-catalogs\data\_partials\` — Toyota and Mercedes per-model partials kept for crash safety

---

## Status tracking (STATUS.md at project root)

Current state should reflect:

| Brand          | Research | Built into site | Verified         | Last updated  | Notes                                                                  |
|----------------|----------|-----------------|------------------|---------------|------------------------------------------------------------------------|
| Honda          | done     | yes             | done             | 2026-05-11    | pilot; 0 blockers, 9 warnings; 72% image coverage                      |
| BMW            | done     | yes             | done             | 2026-05-11    | post-fix-pass clean; image-scrape pending                              |
| Toyota         | done     | yes             | done             | 2026-05-12    | post-fix-pass clean; 0 blockers; image-scrape pending                  |
| Mercedes-Benz  | done     | yes             | done             | 2026-05-12    | post-fix-pass clean; 0 blockers; image-scrape pending                  |
| Mazda          | done     | yes             | needs fix pass   | 2026-05-12    | 2 blockers (36 empty singleton trim_family + 2 Motor1)                 |
| Acura          | done     | yes             | needs fix pass   | 2026-05-12    | 2 blockers (3 cars.com links + MDX SH-AWD singleton no images)         |
| Lexus          | done     | yes             | done             | 2026-05-12    | 0 blockers, 3 warnings, 4 FYIs                                         |
| Audi           | done     | yes             | needs fix pass   | 2026-05-12    | 1 blocker spanning 19 cars.com URLs                                    |
| Tesla          | done     | yes             | needs fix pass   | 2026-05-12    | 2 blockers (~20 forbidden URLs across sources + reviews)               |
| Lamborghini    | done     | yes             | needs fix pass   | 2026-05-12    | 1 blocker (Motor1 link in Revuelto reviews)                            |
| Rolls-Royce    | done     | yes             | needs fix pass   | 2026-05-12    | 1 blocker (8 forbidden URLs: 7 cars.com + 1 dealer site)               |
| Aston Martin   | done     | yes             | done             | 2026-05-12    | 0 blockers, 2 warnings, 4 FYIs                                         |
| Ferrari        | done     | yes             | done             | 2026-05-12    | 0 blockers, 1 warning, 4 FYIs; all sole-trim                           |
| Porsche        | done     | yes             | needs fix pass   | 2026-05-12    | 1 blocker (911 msrp_range.high stale: 246800 → 203300)                 |
| Mini           | done     | yes             | -                | 2026-05-13    | verification pending                                                   |
| Genesis        | done     | yes             | -                | 2026-05-13    | verification pending                                                   |
| Cadillac       | done     | yes             | -                | 2026-05-13    | verification pending                                                   |
| Subaru         | done     | yes             | -                | 2026-05-13    | verification pending                                                   |
| Volvo          | done     | yes             | -                | 2026-05-13    | verification pending                                                   |
| Volkswagen     | done     | yes             | -                | 2026-05-13    | verification pending                                                   |
| Nissan         | done     | yes             | -                | 2026-05-13    | verification pending                                                   |
| Kia            | done     | yes             | -                | 2026-05-13    | verification pending                                                   |
| Hyundai        | done     | yes             | -                | 2026-05-13    | verification pending                                                   |
| Land Rover     | done     | yes             | -                | 2026-05-13    | verification pending                                                   |
| Chevrolet      | done     | yes             | -                | 2026-05-13    | verification pending                                                   |
| Ford           | done     | yes             | -                | 2026-05-13    | verification pending                                                   |

---

## Site totals (after Phase 2 incremental build on 2026-05-13)

- 26 brands in `catalog/manifest.json`
- 358 models total
- 1,208 trims total
- App shell at `catalog/index.html` is brand-agnostic; reads from `manifest.json` at runtime

---

## How to view the unified site

From the project folder:

```
cd catalog
python -m http.server 8000
```

Then open `http://localhost:8000` in any browser. Leave the PowerShell window open while browsing. Ctrl+C to stop the server.

Firefox can open `index.html` directly via double-click if Python isn't available; Chrome blocks `fetch()` on `file://` URLs (CORS).

---

## Lessons learned (cumulative)

### From the Honda pilot

1. **Manufacturer consumer sites block WebFetch aggressively** (Honda's `automobiles.honda.com` returned 403). Mitigation: instruction file lists manufacturer CDN paths and press subdomains as preferred fallbacks.
2. **Image URLs in Phase 1 ended up as page URLs, not asset URLs** (0/212 downloaded on first attempt). Mitigation: instruction requires direct asset URLs or `needs_scraping: true` flag.
3. **Wikimedia / third-party galleries are unreliable for current-MY US cars** (pulled an old UK-market sedan as "2026 Civic Hatchback"). Mitigation: image sources restricted to manufacturer-affiliated infrastructure.
4. **Reliability data for current MY is structurally weak.** JD Power VDS measures 3-year-old cars. `confidence: unknown` is the honest answer.
5. **The site renders gracefully with mixed image coverage.** `imageWithFallback` handles all cases.
6. **Auto mode pauses on some shell heredocs** (false positives on `{key:'value'}`). Use `--dangerously-skip-permissions` for trusted, contained work.

### From the Honda verification (informed BMW research)

7. **Hybrid base trim rule was ambiguous in original instruction.** Instruction was rewritten with full Honda Accord worked example.
8. **Dealer blogs introduced a wrong destination fee.** Instruction now has an explicit forbidden-sources list.
9. **EV trims need fueleconomy.gov as the source for MPGe.**
10. **3-row SUVs had no schema field for behind-3rd-row cargo.** Schema 1.1 added `behind_3rd_row`.

### From the BMW pilot and verification (informed Toyota)

11. **Sole-trim powertrain lines need an explicit rule.** Now §6.2 says singleton trim_family or powertrain line is `is_base_trim: true` with `delta_from_base: null`.
12. **EV MPGe field convention was inconsistent within BMW.** Decision: mirror MPGe into `fuel_economy.*` for cross-model query uniformity.
13. **Source URL staleness is real** (BMW M3 source URL went 2026 → 2027 pricing). Verification catches the worst cases.
14. **`needs_scraping: true` was over-applied** to BMW i4 scene7 URLs that actually work. Phase 1 should HEAD-check rather than flag-on-suspicion.
15. **Verifier reports can contain false positives.** A quick programmatic check of the JSON beat re-running another fix pass blindly.
16. **Fix-pass prompts should be tight and item-by-item.** The 8-edit final fix pass ran in 4m 41s with zero issues. Smaller, more explicit prompts work better.

### From the Toyota pass

17. **Phase 1 ran cleanly on Toyota at 51m** (vs 1.5-2hr estimate). Toyota was structurally simpler than expected — most multi-powertrain handling (RAV4, Highlander, Sienna ICE+Hybrid splits) just worked because the instruction file's Accord worked example covered the pattern. AWD-as-separate-trim worked too. 7 warnings total, 0 blockers. Fix pass closed W-01/W-02/W-04/W-07 in 14m. W-03 (ev_specifics null on hybrid step-ups) was a verifier false positive — correct per §6.3. Lesson: trust the spec over the verifier when they conflict on schema convention.

### From the Mercedes-Benz pass

18. **Sole-trim rule was misapplied on 42 trims** despite being explicitly in `01_research_brand.md` since BMW. The rule is clear; Phase 1 still drops the `is_base_trim: true` flip when assigning a sole-trim variant to its own `trim_family`. The instruction was rewritten as an "atomic rule" with a self-check step, but this likely doesn't fully prevent future occurrences — verification should always flag this category at scale.
19. **fueleconomy.gov IDs were copy-pasted across unrelated models** on 18 Mercedes trims. Cited IDs resolved to Lexus RZ, Porsche Taycan, Audi SQ5, wrong-MY AMG C 63. New rule added to `01_research_brand.md`: open each fueleconomy.gov URL before citing it; never copy IDs from neighboring trims.
20. **Phase 1 can write helper scripts mid-run.** Mercedes Phase 1 wrote `aggregate_mercedes.py` and `normalize_mercedes_powertrain.py` to manage 26 partial files. The normalize script left `ev_specifics` shell objects on 5 ICE trims (B-02 blocker). Helper scripts don't always respect schema invariants — verification catches this, but worth knowing it can happen.
21. **Mercedes-Benz `mbusa.com` CDN returns 403 across all subdomains** (`media.mbusa.com`, `mbusa.com/-/media`, `press.mercedes-benz.com`). 317 image entries ended up as consumer-page URLs with `needs_scraping: true`. The Phase 4 scrape may not improve this — same CDN gates the embedded assets on consumer pages.

### From the Phase 4 design pass

22. **Phase 4 didn't exist as a documented phase** even though image scraping is real work the project depends on. Honda-only scripts existed but weren't documented or generalized. Lesson: every workflow step the project depends on needs an instruction file, even if scripts already exist.
23. **The Honda-only scripts had model URLs, slug variants, and blacklist patterns hardcoded.** Generalizing to brand-config files means adding a new brand = creating one config file, not editing the script.
24. **CDN access is the real constraint on image coverage, not workflow.** Manufacturer-only sourcing is a rule, not a guess. When a brand's CDN is gated, Phase 4 will report low coverage honestly; the site falls back to placeholders gracefully.

### From the Mazda/Acura/Lexus/Audi batch (parallel chained Phase 1)

25. **Chained Phase 1 sessions work cleanly** at this project's scale. Four brands sequentially in ~93 min total active research, zero hard blockers, zero brand-skips. The drift risk I predicted (later brands suffering from accumulated context) did not materialize at 4-brand scale.
26. **Source-rule violations recur batch-after-batch** without explicit pre-flight warning. Mazda and Acura agents cited dealer sites and content farms despite the forbidden-source list being in `01_research_brand.md` for months. Two cleanup passes were needed (pass 1 for dealers + obvious content farms, pass 2 for residual `www.cars.com`). The second-iteration prompt template — explicit pre-flight warning with named domains — produced clean Lexus and Audi output on first run. Lesson: the forbidden-source rule needs to be reinforced in batch prompts AND should probably move higher up in the permanent instruction file with explicit domain examples.
27. **Toyota infrastructure overlap helps Lexus research.** Acura research benefited similarly from Honda overlap. Sub-brands of brands already researched run faster — about 14–17 min vs the 25–31 min the standalone brands took.

### From the Tesla/Lamborghini/Rolls-Royce/Aston Martin/Ferrari/Porsche batch (chained Phase 1)

28. **Six-brand chaining also works.** ~118 min for 6 brands, no hard blockers. The chained-session length isn't a quality risk at 6 brands either.
29. **Ultra-luxury MSRP non-disclosure is the rule, not the exception.** Rolls-Royce (9/9 trims), Aston Martin (13/13), Ferrari (12/12), partial Lamborghini (2/3) decline to publish US MSRP. Phase 1 honestly recorded null + notes. This is expected per the project's honesty rules but isn't documented in the instruction file as an expected brand-specific pattern.
30. **NHTSA and IIHS don't crash-test ultra-luxury or specialty performance models.** Null safety ratings are expected for Lambo, RR, Aston Martin, Ferrari, and Porsche specialty trims. Verifier shouldn't escalate these as warnings.
31. **JD Power VDS / APEAL don't sample low-volume brands meaningfully.** Reliability and customer-satisfaction blocks at `confidence: "unknown"` are expected for all six brands except Tesla (which has Consumer Reports data, notably 1/5 on Cybertruck).
32. **EPA 2026 publication lag is brand-pattern-independent.** Newly-released specialty trims (Ferrari Amalfi / 849 Testarossa, Aston Martin Vantage S / DB12 S, multiple Porsche 2026 trims, Lexus all-new ES, Audi A6 C9 gen) all use brand model-browse page fallback per spec §4. This is a fast-moving brand-agnostic pattern; expect to see it in any future brand's Phase 1.
33. **The forbidden-source pattern repeats yet again.** Lamborghini, Rolls-Royce, and Ferrari needed mid-batch cleanup. Tesla, Aston Martin, and Porsche — which got an even-more-explicit prompt template — came back clean on first run. The pattern keeps getting clearer with each batch: agents drift toward content farms (Motor1, Carbuzz, Autoblog, AutoEvolution, Tesla Oracle) for `professional_reviews.links` and toward `www.cars.com` for spec sources. Permanent instruction-file edits would save a cleanup pass each future batch.

### From the Phase 3 batch verification of 10 brands

34. **Verification batching is safer than Phase 1 batching.** Each verification is independent — one brand JSON in, one report out, no shared state. 10 brands in ~26 min wall-clock with zero quality issues. Future verification work should default to batching.
35. **`www.cars.com` is THE dominant forbidden-source residual** across the project. 9 of 10 verified brands had at least one. Audi (19 instances), Rolls-Royce (7), Tesla (4), Acura (3), Mazda (after Motor1 cleanup). Single search-and-replace pattern; fix is mechanical.
36. **Singleton trim_family without images is an architectural error that recurs.** Mazda hit it 36 times; Acura hit it once. Phase 1 intended image sharing but assigned distinct family slugs, which breaks spec §7 (singleton must carry 4 required angles directly). The fix is either: rename the trim_family to share with an existing one, OR add 4 images directly. Worth a verifier rule + a Phase 1 instruction reinforcement.
37. **Body-style taxonomy ambiguity for liftbacks/wagons/convertibles in sedan-classified models** appeared on 3 brands (Lexus LC 500 Convertible, Porsche Panamera/Taycan GTS Sport Turismo, Audi RS 7 Sportback). Needs a project-wide convention decision. Current spec §5 mentions some of these cases but not exhaustively.
38. **NHTSA/IIHS source URLs pointing to roll-up search pages rather than per-vehicle pages** is a project-wide convention for ultra-luxury brands. Worth a one-line convention rather than 50+ verifier warnings.
39. **The instruction file's verifier rule "null msrp_base is a BLOCKER" needs nuance.** For ultra-luxury brands where the manufacturer documents non-disclosure in trim notes, null MSRP is an expected pattern — should be FYI, not BLOCKER. Without this nuance, Rolls-Royce alone would have produced 9 blockers, Aston Martin 13, Ferrari 12, Lamborghini 2 — 36 false-positive blockers across the batch. The batch prompt corrected for this; the permanent instruction file should too.

### From the 12-brand overnight Phase 1 batch (Mini → Ford)

40. **12-brand chained Phase 1 works cleanly.** ~7 hours of compute, all 12 brands finished with populated `researched_at` fields, zero `models_missing_date`, all parsing cleanly, model and trim counts in expected ranges. The earlier worry that chained sessions might drift beyond 6 brands did not materialize. Sub-brand acceleration (Mini benefiting from BMW, Genesis from Hyundai, Cadillac from GM) held as before. The pre-flight forbidden-source warning baked into the prompt template (per lesson #33) was included; verification will reveal how effectively it reduced source-rule residuals at 12-brand scale.
41. **Windows can shut down unattended overnight (likely a Patch Tuesday auto-reboot).** Our 12-brand batch completed at ~1:47 AM and the machine was off when checked at 8:23 AM. Per-model save-points meant zero data loss — every brand JSON was on disk with correct counts and dates. For future overnight runs, set Windows Update "Active Hours" to cover the overnight window, or pause updates for a week before queueing the batch. Sleep settings being set to "never" doesn't prevent forced restarts for updates.
42. **STATUS.md updates can lag behind data on disk.** After the overnight Phase 1 batch, STATUS.md was still showing only 14 brands even though all 26 brand JSONs existed in `data/`. The Phase 2 build correctly fixed this by populating the 12 new rows during the next build run, but it's worth knowing the source of truth for "what brands exist" is the file system (`ls data/*.json`), not STATUS.md alone.

### From the Phase 4 BMW/Toyota/Mercedes attempt (2026-05-13)

43. **The generalized Phase 4 scrape script has a destructive idempotent-reset bug.** It wipes every image entry's URL back to a page URL regardless of whether the existing URL was already a working direct asset URL. Toyota's 137 working `toyota-cms-media.s3.amazonaws.com` URLs were destroyed in a single Phase 4 run, demonstrating the worst-case impact. Mitigation: gate the reset on `image.needs_scraping === true`. Until patched, do NOT run Phase 4 on any brand with already-resolved Phase-1 URLs.

44. **The scrape script's `pickBestForAngle` crashes on extended angles.** `ANGLE_PATTERNS[angle]` is undefined for `interior_rear_seats`, `wheel_detail`, `engine_bay`, `cargo_area`, etc. The crash happens before `writeFile`, so JSON isn't damaged, but multi-angle brands (any brand with images beyond the 4 baseline angles) can't complete a clean Phase 4 run. Mitigation: skip unknown angles.

45. **Per-model partials in `data/_partials/` are real recovery infrastructure.** Toyota's partials from Phase 1 (timestamped 5/12) saved the brand after the 5/13 destruction. The partials should be considered the project's only data-safety net since git is not in use. Worth keeping the partials habit on any future Phase 1 work — and worth considering automating partial creation as a Phase 4 pre-flight step.

46. **Phase 4 should not have been chained across 3 brands on a first generalized run.** Honda's smoke test was clean but Honda's URLs were mostly placeholders to begin with, so the destructive-reset bug never triggered. A more careful smoke would have used a brand with existing direct asset URLs (like Toyota) before chaining to multiple brands. Future Phase 4 first-runs after a script change should: (a) run on a single brand with known direct asset URLs, (b) inspect the post-run JSON for unexpected URL changes, (c) only then chain to other brands.

47. **Mercedes-Benz `mbusa.com` consumer site is unusable for image scraping** — JS-rendered configurator with 4–62 static candidates per page, 99 broken AMG URLs since the 2026 restructure, and 218 entries returning text/html on download. Use `press.mbusa.com` instead. This is brand-specific knowledge that should be in the brand config, not in the script.

48. **BMW Phase 4 hit 93% coverage** despite the script crashing mid-run. That's the highest coverage of any brand to date and suggests BMW's `bmw.scene7.com` and `mediapool.bmwgroup.com` CDNs were highly accessible to direct asset URLs even from Phase 1. The 16 404'd bmwusa.com URLs in the config are model_pages errors, separate from the scrape coverage — they would not affect re-runs once corrected.

### From Session 5 (2026-05-14) — Playwright integration + Phase B URL audit + Phase C 41-brand chain

67. **Mini Playwright smoke test halted at 10.5%, then resolved via two distinct fixes.** The session-5 brief gated chaining on Mini ≥50%; the first scrape returned 10.5% and chained-halted per the brief. The 4/38 success rate diagnosed into two unrelated root causes: (a) 4 of 7 model_pages in mini.json were dead URLs (config drift since November 2025), and (b) a **regex separator bug** in ANGLE_PATTERNS — front_view / rear_view / side_view patterns only allowed `[-_]` separators, so "Front view of the MINI JCW 2 Door" (space-separated) never matched. Interior_dashboard hit only because `\bdashboard\b` was space-agnostic. Both bugs fixed, Mini re-ran to 36/38 = 94.7%, Honda control re-ran to 75.9% (above 72.2% baseline — no regression). The regex fix is universal: every brand whose alt text uses normal spaced English benefited.

68. **URL drift is project-wide, not Mini-specific.** Phase B (parallel URL-validation of all 41 brand configs) found **23 of 41 brands had stale URLs** — ~153 of 424 model_page URLs (~36%) drifted since session 4. Whole-scheme rewrites on Audi, Mazda, Genesis, McLaren (100% of each brand's URLs). Land Rover migrated to a separate domain (rangerover.com). Configs that had been "verified live" two days earlier were stale. The Mini smoke-test failure was actually the FIRST sign of a systemic problem masquerading as a Mini-specific one. Lesson: short config-validation runs (HEAD-checks per URL) should be a near-mandatory pre-flight before any Phase 4 chain run.

69. **Documented "WebFetch-gated" sites are NOT actually gated to plain browser-UA fetch.** Six brand configs carried session-1-through-4 notes warning of 403/JS-rendering issues on consumer sites (audi, lamborghini, ferrari, maserati, acura, tesla). Phase B's `check_urls.mjs` — using the same browser-UA plain `fetch` the scraper uses — got clean 200s on every one of them. The gating in prior notes was WebFetch-tool-specific (the AI fetch tool is blocked; a plain browser-UA fetch is not). The notes were misleading the project's mental model. Lesson: distinguish "WebFetch can't reach this" from "no client can reach this" — they are NOT the same thing.

70. **Phase C parallel subagent pattern works at 41-brand scale.** 8 parallel subagents (~5 brands each, balanced by trim count) completed scrape+download across all 41 brands without crashes or race conditions. Each subagent had write-access only to its assigned brands' JSONs. The aggregated coverage report (`reports/phase4_coverage_2026-05-14.md`) was assembled centrally from the subagents' reports plus a trust-but-verify pass via `scripts/analyze_coverage.mjs`. Total wall-clock: substantially less than serial would have been. The pattern from sessions 3/4 (parallel Phase 1 / parallel verification / parallel brand-configs) extends cleanly to Phase 4.

71. **Coverage is bimodal, not normally-distributed.** 16 brands hit ≥80% (looks like a real catalog), 18 hit <50% (often very low). The middle tier is small — only 7 brands at 50-80%. The bimodal pattern suggests "either the scraper can extract this brand's images or it can't" with little middle ground. The 18 sub-50% brands are NOT mysteriously broken — they have specific, diagnosed failure modes: slug/angle match gap on candidates the scraper sees but rejects (the dominant cause), escalation-threshold conservatism on JS-rendered brands with a few junk candidates, Playwright-can't-extract on extreme JS-rendered cases, and hard 403 anti-bot. Lesson: future scraper improvements should target each of these root causes specifically rather than seeking generic "better extraction" — the failure modes are distinct enough to have distinct fixes.

72. **The Phase-B "works but generic" warning was prescient.** Phase B flagged 5 URLs as "URL returns 200 but may yield generic/shared content" (cadillac ct4-v/ct5-v configurator pages, ford f-150-raptor-r shared template, hyundai nexo press-site repointing, ford Super Duty shared template). Phase C confirmed: all 5 produced 0 model-specific images. Pattern: configurator pages, shared-template pages, and press-site repointings do NOT yield scrapeable model-specific imagery. Future config decisions should flag such models as "no manufacturer page" (accept 0 images) rather than substituting a generic URL that produces 0 images while masking the real gap.

73. **The bimodal-coverage finding validates the manufacturer-only image policy.** The 16 ≥80% brands prove the architecture works when the manufacturer site cooperates. The 18 <50% brands are NOT failures of the policy — they're failures of *individual sites* (anti-bot, JS-rendering opacity, naming-convention gaps). The right response is per-brand investigation and honest documentation, not policy relaxation. If image coverage drops for a high-value brand (Tesla, Ferrari), accepting placeholders + a notes addendum is the project's honest answer.

### From Session 6 (2026-05-14) — C-bis chain (7-phase root-cause work)

74. **Phase C's "match gap" diagnosis was directionally right but mislabeled the broken layer.** Phase 3 investigation (7 parallel subagents) showed that for 4 of the 7 high-volume sub-50% brands, slug-matching is fine — the actual binding constraint is `pickBestForAngle`'s `ANGLE_PATTERNS` table. Hyundai's representative page yields 93 slug-matching candidates per page; 0 fire any English angle pattern because the CDN uses `vlp-hero`, chassis codes, and alt-text = literally the string `"placeholder"`. Same story on Ram (95%+ slug match, 0 angle match), Mazda (`34-jellies/` filenames, no front/rear tokens), Kia (`1920-hero-my26-...` filenames). The Phase C report had labeled all these as slug-match issues; only Phase 3 dumping raw candidates on each brand revealed the layer was wrong. Lesson: when a diagnosis doesn't yield a fix on the predicted lever, the diagnosis itself is suspect — pull more raw data.

75. **Per-brand subagents at 7-brand parallel scale work cleanly for slug/angle investigation.** All 7 agents completed without conflicts. Each had its own brand config to edit, its own data JSON (untouched directly — only via the scrape scripts), its own report file. Wall-clock ranged 6-20 min per agent; the slowest was mercedes-benz (largest brand). No race conditions, no missed reports. The pattern from prior sessions (Phase 1 research in parallel, Phase 3 verification in parallel) extends cleanly to a per-brand investigation pattern.

76. **The Toyota Referer fix was the largest single-brand win in project history.** 0% → 95% on a 1-line config addition (`"referer": "https://pressroom.toyota.com/"`). The S3 bucket `toyota-cms-media.s3.amazonaws.com` gates downloads specifically on the press subdomain — not the consumer-site domain. Auto-derived Referer of `https://www.toyota.com/` returns 403; explicit `https://pressroom.toyota.com/` returns 200. Lesson: when a CDN gates on Referer, the right Referer is brand-specific and not always derivable from the consumer site. The brand config's optional `referer` field is now the project's mechanism for brand-specific Referer overrides.

77. **Switching jeep.com model_pages from `/<model>.html` to `/<model>/gallery.html` lifted Jeep 22.7% → 64.5%.** Gallery pages on jeep.com carry rich alt text ("rear angle of...", "passenger-side profile", "front end") that the consumer overview pages don't. The overview pages had 7-12 unique candidates each with generic marketing alt; the gallery pages have ~58 candidates with descriptive angle vocabulary. Lesson: a manufacturer's "gallery" or "media" sub-page often outperforms the main overview page for image extraction — worth probing on other brands during future config tuning.

78. **The angle-pattern gap is the right next-fix target.** Multiple Phase 3 agents independently recommended an `angle_url_patterns` brand-config extension. The fix is small (script-side change to merge per-brand patterns into ANGLE_PATTERNS) and additive (brands without the field are unaffected). Phase 3 evidence suggests ~7 brands would lift to 50%+ from such a change: hyundai, subaru, mazda, ford, kia, ram, mercedes-benz, volkswagen. Project-wide coverage would land roughly 75-85% (from current 62.26%) on this single follow-up.

79. **Phase 5's threshold tweak helps brands with mostly-empty pages, not high-tier brands.** Volkswagen +6pp was the only Phase 5 gain. The 9 other brands (rivian, gmc, honda, cadillac, alfa-romeo, lexus, porsche, polestar, subaru) saw 0pp change because their static fetches already produced ≥3 slug-matching candidates. Lesson: the threshold tweak is a low-cost, low-impact improvement for high-tier brands; its real value was on Lamborghini and on the 12-of-25 Mercedes-Benz pages that now escalate.

80. **Brand JSON model.notes can carry pipeline-status addenda.** Phase 6 added a "Phase 4 image scrape: persistent low coverage (...) See reports/..." line to every model on Tesla / Ferrari / Lotus / Hyundai / Subaru via a one-shot Node script (`scripts/apply_low_coverage_notes_session6.mjs`). The catalog renderer ignores notes content (they're documentary), but the addenda live in the canonical data file so they survive future edits. Lesson: model.notes is the right place for pipeline-status documentation that needs to travel with the data.

81. **Five brands are now structurally pipeline-blocked.** Tesla (hard 403), Ferrari + Lotus (JS-rendered with no extractable DOM), Hyundai + Subaru (angle-pattern matcher gap). The first three require either policy relaxation or out-of-pipeline image sourcing. The last two would be unlocked by the angle_url_patterns extension. The catalog renders all five with placeholders; the site is functional with mixed coverage.

82. **The C-bis chain's checkpoint structure worked as designed.** Phase 2's "halt if neither lamborghini nor land-rover clears 40%" caught the partial outcome (lamborghini cleared, land-rover didn't) and proceeded with eyes open. Phase 3's "halt if fewer than 4 of 7 clear 50%" technically failed (only 1 cleared) but the work produced meaningful diagnoses, so the chain continued with the refined understanding that angle-patterns are the binding constraint. The brief's note "If multiple phases halt at their checkpoints, the session still produces value" held true — the session lifted coverage by 6.61pp and produced the diagnosis that maps the next-fix work.

83. **`scripts/brand-configs/<brand>.json` is now the project's single point of brand-specific tuning.** Across Session 5 and Session 6, brand configs accumulated: model_pages (the URLs to scrape), slug_variants (model-name variants for matching), path_blacklist_regex (per-brand image-URL noise filters), and referer (per-brand Referer override). The honda.json shape is no longer the canonical reference — each brand has its own tuning. Future expansion (angle_url_patterns) would be another brand-config field. The script is now a pure-function-of-config for nearly all per-brand behavior.

### From Session 7 (2026-05-14) — angle_url_patterns + resolution preference

84. **`angle_url_patterns` validated on 5 of 7 priority brands.** Hyundai +28.3pp, Ram +17.1pp, Mazda +16.7pp, Kia +4.7pp, Subaru +2.3pp. The lever works when the brand's CDN exposes consistent URL tokens that map to specific angles. **Ferrari and Lotus abandoned** for this lever — Ferrari has zero usable image signal in its rendered DOM regardless of any URL pattern; Lotus's URLs are extension-less Sitecore CDN URLs that get filtered upstream by `isPlausibleImageURL` before they ever reach the angle stage. The brief's "if 4 of 7 improved by 20+pp" gate strictly failed (only Hyundai cleared) but the soft "if most failed to improve" halt condition also failed (5 of 7 improved). Per Safety Rule #7, the chain continued past the ambiguous middle ground with the analysis documented.

85. **`(?<!ev-)token` / `(?:^|[-/])ev-token` electrification-flip idiom unlocks Hyundai's hero-shot convention.** Plain `vlp-hero` URLs at scene7.com/hyundai are front-3/4 shots; `ev-vlp-hero` and `hev-vlp-hero` URLs are side-profile shots. The agent verified this visually across 8 sampled URLs across 5 model pages. Mutually exclusive across 13 reachable model pages, zero false positives. **Cross-brand idiom worth probing** on other brands that use Adobe Scene7 CDN.

86. **Dash-vs-underscore separator in same folder name is the angle discriminator on Mazda.** Mazda's `siteassets/.../34_jellies/` folder serves 3/4 front studio renders; the alternate `content/dam/.../34-jellies/` folder (used by CX-5 alone) serves 3/4 side-profile renders. Same naming token, different CDN, different angle. **Pattern worth scanning for on other multi-CDN manufacturers.**

87. **GM-AEM `?imwidth=NNN` is the highest-leverage size marker in the catalog.** Cadillac, Chevrolet, GMC, Buick — all use `?imwidth=800` defaults. Resolution preference upgraded these to `?imwidth=1920` or `?imwidth=3000` and lifted file sizes 27-85% across these 4 brands. **~620 files affected by this single pattern.** Cadillac was the Phase B validation brand (+27%); GMC was the biggest winner (+85%); Polestar's `?w=1920&dpr=2` produced the largest per-file lift (+107%) but on only 3 files.

88. **Resolution preference can cause silent regressions when scoping invalidates downloads.** The Phase B latent fix (URL change → downloaded:false) caused 52 entries across 9 brands to flip from `downloaded:true` to `downloaded:false` when the new URL failed to download. The cached on-disk file remained valid. `scripts/repair_cached_downloads.mjs` was written to restore `downloaded:true` whenever a local file exists, recovering all 52 silent regressions. Honda crossed B → A purely from these repairs (recovered 13 entries). Lexus recovered 24. **Lesson: any URL-changing script needs to consider whether the new URL is guaranteed to succeed. If not, an invalidate-then-repair cycle is preferable to permanent loss.**

89. **`isPlausibleImageURL` is a project-wide ceiling for brands using extension-less CDN URLs.** Lotus's Sitecore CDN (`wlt-p-001.sitecorecontenthub.cloud/api/public/content/<uuid>?v=<hash>`) serves valid images but the URLs lack `.jpg`/`.png`/etc. extensions. The current `IMG_EXT_RE` requires an extension match, so the candidates are filtered upstream of every angle stage. **Future enhancement (out of scope for Session 7):** accept extension-less URLs from specific brand hosts, OR consult `Content-Type: image/*` from Playwright's network observer. Would unlock Lotus (24 entries) and likely help Hyundai's `vehicle-browse-hero` og:image URLs (4 more models). This was identified by Hyundai and Lotus subagents independently.

90. **The angle_url_patterns + URL-invalidate interaction can shift coverage downward briefly until repair.** Phase B's URL invalidate flipped 51 pre-Phase-A-Phase-B-downloaded:true entries to false when the resolution-preferred URL failed. These were collateral damage, NOT genuine regressions. The repair script fully recovered them by recognizing that the on-disk file is still valid. The final coverage of 65.21% honestly reflects what's on disk; the path from 62.26% to 65.21% went 62.26% → 64.05% (Phase A) → 64.04% (Phase B raw) → 65.21% (post-repair). **Anyone re-running this work should run repair_cached_downloads.mjs at the end** as a standard step.

91. **Iteration on patterns is essential for precision.** Kia's first-pass pattern matched 6 candidates with 2 false positives; refining to `\bgallery[-_]?ext\d+\b` produced 3 matches with 0 false positives — losing one correct match but eliminating misclassifications. Image-content verification via WebFetch+Read on 5-10 sampled URLs per brand was the cheap precision check that caught Kia's source-data quality issue (file `375-hero-my26-niro-hev-v2.jpg` has alt text "three-quarter back view" but is actually a front-3/4 image). **Bias toward precision over recall** is now an established Phase A maxim.

### From Session 8 (2026-05-15) — Land Rover chassis-codes + extension-less URL relax

92. **The `isPlausibleImageURL` extension-less-CDN relax was the single highest-leverage script change since Session 6's Toyota Referer fix.** Adding a dual-gate (host + path) acceptance path for extension-less URLs unblocked four previously-stuck brands: Lotus 0% → 75%, Subaru 9.2% → 72.5%, Hyundai 28.3% → 86.8%, Ferrari 2.1% → 22.9%. Total project-wide lift: +222 entries, +5.08pp. The relax was strictly additive and host-gated, so it caused zero false positives on the 24 brands whose URLs already carry extensions. **Lesson: when a URL filter is "the obvious right thing to do", verify that filter against real CDN patterns before treating it as inviolable. The IMG_EXT_RE check was correct for 80% of brands but a hard ceiling for the others.**

93. **Session 7's "Ferrari has zero usable signal" diagnosis was wrong.** The Phase A Ferrari subagent had spent significant effort dumping rendered DOM, network responses, and Playwright candidates — and concluded that Ferrari's rendered DOM has nothing extractable. The actual finding was that Ferrari emits real image URLs from `ferrari-view.thron.com` (Thron CDN), but the URLs lack file extensions and were filtered upstream of every angle stage. With the Phase B relax, Ferrari resolves 11 of 48 entries via standard ANGLE_PATTERNS matching. **Lesson: when a brand is diagnosed as "structurally unreachable," double-check whether the diagnosis is actually about the upstream URL filter rather than the brand's HTML.**

94. **Playwright scroll depth is a tunable that matters for heavy lazy-load brands.** The Session 5/6/7 scroll was 2.5s capped. Lotus's Sitecore Content Hub pages need ~5s of scroll + interaction to fully hydrate their image set; the production scrape was missing ~20 candidates per page that my diag with 8s scroll saw. Bumping to 5s with break-on-no-more-scroll heuristic recovered most of these without adding significant project-wide time. **Lesson: a 2x scroll-time increase is a cheap way to unlock heavily-lazy-loaded pages; the break-on-no-more-scroll heuristic prevents needless wait on pages that don't lazy-load.**

95. **Land Rover's LRDX CDN uses chassis-code identifiers** in both path segments (`/l663/26my/markets/us/`) and filename prefixes (`L663_26MY_NAS_Sedona_90_Side.jpg`). Bare chassis codes added as slug_variants work because each model's page is isolated — `slugMatchesURL` operates on candidates already filtered to that model's page, so cross-model contamination is rare. Land Rover's 18.1% → 31.9% (+13.9pp) gain came primarily from rangerover.com and landroverusa.com Defender pages finally yielding slug-matching candidates. **Page-level isolation is your friend when designing slug_variants for shared-chassis brands.**

96. **A brief's strict "either-and" checkpoint can be passed even when one side underperforms.** Phase B's gate was "Lotus ≥30% AND Hyundai +10pp". Lotus hit 75%, Hyundai hit +50.7pp — both by wide margins. Phase A's gate was tighter (≥15pp), missed at +13.88pp, but the brief's Expected Outcomes section explicitly allowed Phase A halts to continue. **Reading the brief's full structure (Expected Outcomes + Safety Rules + per-phase checkpoints) instead of just the local checkpoint avoids unnecessary halts.**

97. **Phase C designed for Subaru side_profile was solved by Phase B side-effect.** Session 7 had identified Subaru's side_profile imagery as positionally-identifiable but URL-pattern-opaque, recommending a `pickByPosition` brand-pattern enhancement. Session 8's Phase B (filter relax) accepted Subaru's Sitecore Content Hub URLs at the extraction stage; the existing ANGLE_PATTERNS (English "side profile", "rear angle", etc. on alt text) then matched 21 of 27 side_profile entries — no pickByPosition change needed. **Lesson: when a downstream problem has multiple possible solutions at different pipeline layers, fixing the most upstream layer often makes the downstream solution unnecessary.**

98. **The project's "persistent low coverage" list has narrowed to 1 brand.** Tesla 0% (HTTP 403 at transport layer) is the only brand that any pipeline-layer fix cannot help. Land Rover 31.9%, Mercedes-Benz 32.5%, Kia 25%, Ferrari 22.9% all have diagnosed individual blockers that would respond to per-brand engineering (thin candidate pools, configurator gates, internal-code alt text, etc.). **Lesson: at 70%+ project coverage, the remaining sub-50% brands are individually-solvable problems, not systemic pipeline failures.**

### From Session 9 (2026-05-15) — HTML-entity decode + 360-spin angles + scoped MSRP policy

99. **HTML-entity-encoded quote characters are a hidden multi-brand extraction blocker.** Adobe AEM manufacturer sites (Kia, Ram, possibly others) embed image URLs inside JSON data layers where the JSON's surrounding quotes are HTML-entity-encoded as `&#34;` (for `"`) and `&#39;` (for `'`). The existing extractCandidates regexes used literal `["']` boundaries and couldn't see those URLs. Pre-decoding both entity forms at the top of extractCandidates unlocked Kia (25%→70%, +45.3pp; via combined fix) and Ram (33%→44%, +11.4pp). **Lesson: HTML-entity quote encoding is a load-bearing detail when scraping CMS-driven manufacturer sites.**

100. **Adobe AEM `360/<NN>.png` spin frames are angle-classifiable.** Kia's CDN serves a 36-frame 360° spin at predictable paths like `/trims/<trim>/exterior/<hex>/360/04.png`. Visual verification confirmed:
    - Frame 04: pure side profile (passenger side, 40° rotation)
    - Frame 18: rear-3/4 (180° rotation)
    - Frame 36: front-3/4 (wraps to start)
    Adding these three regex patterns as Kia `angle_url_patterns` lifted three angles to high coverage in one config change. **Cross-brand opportunity:** the same AEM convention may exist for GMC, Cadillac, Chevrolet, Buick — worth probing in a future session.

101. **WebFetch is blocked for caranddriver.com / motortrend.com / hagerty.com / roadandtrack.com in this environment.** Subagents working on Phase B's MSRP fills discovered that the editorial-source publishers return 403 to direct WebFetch. Successful subagents used Google Translate as an HTTP proxy (`www-caranddriver-com.translate.goog`) to access the content. The canonical URL was still recorded in `sources.msrp_base`. **Lesson: when WebFetch is blocked for specific domains, the Google Translate proxy is a robust workaround — but agents need to be explicitly told about it, since strict policy-following will otherwise leave the work unfinished.**

102. **The scoped MSRP policy relaxation (§4.6) worked as designed.** 41 of 57 targeted ultra-luxury trims were filled from allowed editorial sources (Car and Driver, MotorTrend, Hagerty). Project-wide MSRP nulls dropped from 70 to 29 (-58.6%). The 16 trims left null are predominantly very-new-MY variants (Bentley MY26 trims of Continental GT Azure / GTC S, Bentayga Speed; Ferrari 849 Testarossa Spider) where no editorial source has published a US MSRP yet. **Lesson: a tightly-scoped source-policy relaxation, anchored on a structural condition (manufacturer non-disclosure documented in trim notes), can fill significant gaps without compromising the broader manufacturer-only stance.**

103. **The first Bentley fill attempt returned 0 fills because the agent didn't try the Google Translate proxy workaround.** The brief mentioned WebSearch+WebFetch but didn't anticipate WebFetch domain blocks. The retry with explicit proxy guidance recovered 15 of 22 fills. **Lesson: a brief that names a specific tool (WebFetch) and a strict source list (caranddriver.com et al.) should also name the workaround for tool-level access blocks if any exist — otherwise the strict-policy interpretation produces a 0%-completion failure mode.**

### From Session 10 (2026-05-15) — Mercedes HC-D + GMC slug + Rolls-Royce BB + 5 new brands + reliability fills

104. **Mercedes-Benz HC-D / HC filename convention is the only reliable per-page front-3/4 signal on class pages.** Manufacturer class pages use `HC-D.jpg` (most models) or `HC.jpg` (CLA byo-options) as the canonical front-3/4 hero. Alt text is just the model name ("C-Class Sedan", "CLE Coupe") and contains no angle vocabulary; standard ANGLE_PATTERNS miss it. A brand-pattern at score 6 fills the gap on pages where the standard pattern found no match (~11 of 25 Mercedes pages). The remaining 14 pages have standard-pattern false-positives ("Front trunk with organizers" matches `\bfront\b` at score 7) that the brand pattern can't override under the current two-pass scheme. Net: +24 entries, 32.5% → 40.1%. To fully unlock Mercedes the standard-pattern false-positives would need to be excluded (e.g., reject "Front trunk", "Front seats" alts at the pattern level) — out of scope for Session 10.

105. **GMC yukon-xl shares the /suvs/yukon page; needs parent slug-variant.** yukon-xl has no dedicated /suvs/yukon-xl URL — the XL is presented as a length variant on the shared page. Without `yukon` in yukon-xl's slug_variants, the model gets 0 slug-matching candidates (all the page imagery uses bare `yukon` tokens, not `yukon-xl`). Adding `yukon` as a slug_variant for yukon-xl (Grand-Cherokee-L precedent) unlocked 20 entries. **Lesson: when two models share a single manufacturer page with one being a length/variant of the other, both models' slug_variants should include the parent name. The architectural integrity question (do the variants have visually distinct imagery?) is a separate concern.**

106. **Rolls-Royce Black Badge URL paths don't match the model_slug.** BB Ghost lives at `/bb-ghost-sii/`, BB Spectre at `/bb-spectre/`, BB Cullinan at `/bb_cullinan_s2/` — the slug_variants for `ghost-black-badge` etc. didn't include any of these path tokens. The Phase 4 scraper produced 0 slug-matching candidates for all 3 BB models. Adding path-pattern slug_variants (`bb-ghost-sii`, `bbgsii`, `bb-spectre`, `bb_cullinan_s2`, etc.) lifted Rolls-Royce 39.5% → 65.8% (+10 entries, +26.3pp). **Lesson: when a brand uses different naming conventions on URL paths vs. consumer-site slugs (especially for performance / sub-line variants), the brand-config slug_variants need to bridge the gap.**

107. **Adding 5 new brands took 5 parallel Phase 1 subagents + ~7-15 minutes per brand of compute.** Wall-clock: ~50 min for research, plus build + brand-config + Phase 4 download (10 min total). Total Phase B: ~60 min wall-clock for the 5-brand addition. The viability pre-check (separate subagents) eliminated Karma cleanly without spending Phase 1 effort. **Lesson: the viability-check + research-research pipeline scales cleanly for new-brand additions and should be the default pattern.**

108. **New brand image coverage averages 78% even when manufacturer sites are gated.** Phase 1 research is now competent at extracting direct asset URLs from manufacturer press CDNs even when the consumer site returns 403 (Stellantis press S3 CDN for Chrysler/Dodge/Fiat; Bugatti newsroom imgix; VinFast static-cms-prod). Phase 4 scrape rarely adds value for newly-researched brands; download alone usually suffices. **Lesson: prioritize direct-asset URL discovery during Phase 1 rather than relying on Phase 4 to compensate. The 4 of 5 new brands with 95-100% coverage had ZERO needs_scraping entries from Phase 1.**

109. **JD Power 2026 VDS (released Feb 12, 2026) lifts ~80 reliability fills across mainstream brands.** Brand-level scores apply to all of a brand's models when model-level data isn't separately published. Some brands have model-level data (e.g., Chevrolet Equinox/Tahoe as 2026 VDS segment winners). Top performers: Lexus 151 PP100 (#1 premium 4th year), Buick 160 PP100 (#1 mass-market 2nd year). Bottom: VW 301, Volvo 296, Land Rover 274. Brands EXCLUDED from 2026 VDS for insufficient sample: Chrysler, Dodge, Fiat, Alfa Romeo, Jaguar, Maserati, Polestar, Rivian, Lucid, VinFast (in addition to ultra-luxury). **Lesson: JD Power VDS data has a clean Q1 publication cadence; future Phase C-style work should schedule for late Feb / early March of each year.**

110. **JD Power 2026 APEAL was NOT yet published as of 2026-05-15.** APEAL typically publishes in July (initial-quality survey based on early-MY owner experiences). The 362 customer_satisfaction unknowns received "checked 2026-05-15; APEAL pending July release" notes and remain at confidence:unknown. A future Phase C-style pass in late July 2026 could lift ~150-200 of these unknowns. **Lesson: don't conflate VDS and APEAL publication timing — VDS is Q1, APEAL is Q3.**

111. **CR 2026 Brand Report Card (Dec 2025) is a complement to JD Power VDS.** Two top-3 mainstream brands by CR: Toyota (62), Subaru (68). CR's top-5 overall: Toyota, Subaru, Lexus, BMW, Honda. CR excludes for insufficient sample: Maserati, Alfa Romeo, Polestar, Lucid, VinFast, Infiniti. CR data is published annually in October-December and applies for the following calendar year. **Lesson: use both JDP and CR for cross-validation; they sample different populations (JDP=large quarterly survey, CR=annual subscriber survey).**

112. **Charger Daytona EV vs Charger Sixpack ICE were split as separate models** per spec §6.4 multi-powertrain rule (same precedent as jeep.json Wrangler/Wrangler 4xe split). This kept each model's powertrain coherent and prevented mixed-powertrain trim_family confusion. **Lesson: when a single nameplate covers BEV + ICE on the manufacturer site (Charger, Macan, Cayenne) the project's convention is to split into 2 models, not 1 model with mixed trim_families.** The brand-config can still point both at the same consumer page URL; slug_variants differentiate.

113. **Bugatti is the first §4.6-applied brand at Phase 1 research time** (rather than as a retrofit fill like Session 9). The §4.6 scoped MSRP policy is now load-bearing during Phase 1 research for ultra-luxury brands. Tourbillon $4.1M MSRP cited to Motor Authority + duPont Registry News; W16 Mistral $5.4M cited to Top Gear editorial. **Lesson: §4.6 is now a Phase-1 tool, not just a Phase 9-style retrofit. Future ultra-luxury brand additions should apply §4.6 from the start.**

114. **The verifier's `isDealerDomain` heuristic causes false-positives on URL article slugs containing "of-".** Examples: `/benefits-of-ownership` (Subaru), `/history-of-rolls-royce`, `/power-unpacked-dodge` (Dodge), `/celebration-of-luxury` (Rolls-Royce articles). 30+ Session 10 verifier "blockers" are this false-positive class. The heuristic was added for dealer-domain catching (URLs like "miller-of-foo-bmw.com") but is too broad. **Lesson (deferred to future session): refine isDealerDomain in scripts/verify_brand.mjs to require "of-" to be in the hostname, not anywhere in the URL.**

115. **Verification surfaced 263 blockers in Session 10, but the vast majority are pre-existing from Phase 1 research that was never cleaned.** Toyota 119 cars.com citations, BMW 60 mixed cars.com / carbuzz.com, Honda 25, Mercedes-Benz 15. These were present in the data BEFORE Session 10 — Session 10's Phase C touched the reliability blocks but the sources blocks remain unchanged with the old residuals. **Lesson: a Phase 1 batch cleanup pass for forbidden-source citations is overdue. Estimated work: 4-8 hours to mechanically grep and replace cars.com URLs across the data files with appropriate manufacturer-press alternatives.**

116. **Data freshness checks at 2-4 day windows reveal only minor drift (pricing nudges $500-$2000).** No model-list changes detected in 5 brands sampled (BMW, Chevrolet, Porsche, GMC, Hyundai). Trim restructuring detected on 2 of 5 (Chevrolet Equinox/Tahoe minor variant count differences vs Cars.com; GMC Hummer EV SUV may have new Carbon Fiber Edition trim). Pricing drift on BMW (+$500-$2000) and Chevrolet (Tahoe/Colorado down $2000+, possibly MY-end clearance). **Lesson: 2-4 day windows are too short for meaningful freshness signal; quarterly cadence (Q3 2026 after MY27 announcements) is the right next pass.**

117. **Phase 5-phase chained execution worked cleanly at this session's scale.** All 5 phases (A, B, C, D, E) ran without halts. Subagent failure modes were minimal: 1 Bentley-style "didn't use proxy" failure mode did NOT recur (B2 agents had explicit proxy guidance from prior session lessons). The verification at end-of-Phase-E was the only meta-quality check; future sessions might add interim verification at end of Phase B to catch new-brand introduced issues sooner.

### From the instruction-file improvement pass (earlier 2026-05-13)

49. The forbidden-source warning was strengthened with named-domain examples and moved earlier in 01_research_brand.md. The list now includes every recurring offender across 26 brands of research: cars.com, motor1.com, carbuzz.com, autoblog.com, autoevolution.com, teslaoracle.com, carsfrenzy.net, plus dealer-site patterns. Whether this fully prevents future occurrence is an open question — but it's stronger than the prior placement and wording.

50. The verifier (03_verify_catalog.md) now explicitly checks for forbidden-source URLs, singleton trim_family without 4 images, and the NHTSA/IIHS roll-up URL convention. The null-msrp_base BLOCKER rule was softened to FYI when trim.notes documents manufacturer non-disclosure, matching the ultra-luxury reality. These checks catch the recurring error patterns mechanically rather than relying on agent vigilance.

51. The master spec (00_master_spec.md) was bumped to v1.2 with non-breaking documentation updates: expanded body-style rules for Sportback/Avant/Sport Turismo/AMG GT 4-Door cases, the new §4.5 NHTSA/IIHS source-URL convention, and explicit acknowledgment of ultra-luxury MSRP non-disclosure as structural rather than as a gap.

52. All 22 remaining brand configs were built in advance of Phase 4 chaining. The smoke test on Mini is now the only gate between current state and a single chained Phase 4 session for all 22 brands. Per-brand config build was done via a single Node script (scripts/build_brand_configs.mjs) using well-known consumer-site URL patterns and per-brand notes for known gates (acura, audi, ferrari, lexus, tesla) — total brand-config build time was effectively constant rather than the prior estimate of ~10 min/brand because the patterns are well-documented.

### From the 15-brand parallel-subagent batch (2026-05-13)

53. **Parallel subagent delegation works for Phase 1 research at scale.** After completing Infiniti manually as a pilot (~45 min, 2 models, 12 trims), the remaining 14 brands were delegated to general-purpose subagents in 3 batches of 4-5 agents each. Total wall-clock from first agent launch to last agent completion was approximately 45-55 minutes per batch — versus sequential per-brand work that prior batches showed takes 25-50 min PER BRAND. Net throughput improvement: ~5-8x over fully sequential. The instruction file's self-contained design plus the per-prompt forbidden-source reminder both worked — subagents independently followed the v2 instructions and self-checked before saving.

54. **Subagents handle multi-powertrain and ultra-luxury patterns correctly.** Test cases included Jeep (Wrangler ICE/4xe/Moab 392), Maserati (Trofeo vs Folgore vs Modena), GMC Sierra 1500 (4 engines), and Bentley (Bentayga V8/V6 PHEV/V8 Speed). Each agent split powertrain lines correctly and applied the sole-trim atomic rule. Ultra-luxury msrp_base nulls were applied without prompting on Bentley (22/22), McLaren (6/6), and Lotus Emeya R.

55. **Self-reported cleanup events on forbidden sources** during this session: ~8-15 instances across 5 of the 15 agents (Jeep, Ram, Maserati, plus 2 minor). Compared to prior batches' ~30-40 residuals per 10-brand batch, this is roughly half — partly because v2 instructions are stronger, partly because per-agent prompts had explicit forbidden-source reminders baked in, partly because some agents apparently self-corrected mid-research rather than at final cleanup. Net: v2 instruction file is materially better at preventing drift to content farms, but per-prompt reinforcement is still helping at the margin.

56. **Manufacturer site gates are universal at this scale.** WebFetch 403/JS-rendering issues affected every consumer site checked: jaguar.com, polestar.com, jeep.com, ramtrucks.com, mitsubishicars.com, alfaromeousa.com, maseratiusa.com, bentleymotors.com, cars.mclaren.com, lotuscars.com, rivian.com, lucidmotors.com — that's 12/15 brand consumer sites blocked. Only McLaren produced direct asset URLs (cars-assets-production.mclaren.com CDN). Phase 4 will need brand-specific config tactics (press subdomains, JS-rendering fallbacks) for nearly every new brand.

57. **Discontinued model patterns are now documented across 15 brands.** Notable exclusions this session: Mirage (Mitsubishi), Q50/Q60/QX50/QX55 (Infiniti), XE/XF/F-TYPE/I-PACE/E-PACE (Jaguar), Ghibli/Levante/Quattroporte (Maserati), Wagoneer/Wagoneer S/Renegade (Jeep), Polestar 2/5 (Polestar, US-specific). Pattern: brands cycling through aggressive lineup pruning in 2024-2026 due to electrification transitions and tariff exposure. The instruction file's "discontinued mid-MY" rule and Step 1 enumeration discipline caught all of these correctly.

58. **Tariff exposure is now a material factor in lineup decisions.** Multiple brands explicitly cited US tariffs as the reason for skipping/limiting US lineups: Polestar 2 (China production), Polestar 4 (moved to Korea for 2026), Lotus Eletre/Emeya (sole-trim due to 100% Chinese EV tariff), Buick Electra (US launch delayed). This is a 2026-specific phenomenon that may evolve significantly in the next research cycle.

### From the 15-brand parallel verification + fix-pass + brand-config build (session 4, 2026-05-13)

59. **Parallel subagent delegation scales cleanly to verification work.** All 15 verifications launched simultaneously (no sequential batching) and completed within a single 6-minute window. Each subagent ran a fully self-contained verification — read instruction file, read brand JSON, executed all steps, wrote report. Verification turned out to be even safer to parallelize than Phase 1 research because each verification is read-only on the data file and writes to a brand-specific report file with no shared state. Lesson #34 ("verification batching is safer than Phase 1 batching") is reconfirmed and extended: even simultaneous launch of 15 independent verifications worked without race conditions because STATUS.md updates were deferred to a central post-batch step rather than done by each subagent.

60. **Brand-config building parallelizes similarly well.** All 15 brand-config subagents ran in parallel with the verification subagents. Each subagent had a single output file (scripts/brand-configs/<slug>.json) and a defined shape (matching honda.json). Average wall-clock per config was 30-90 seconds. Total session-4 wall-clock from Task 1 build to Task 6 complete: roughly 30-40 minutes — vs session 3's ~2-hour Phase 1 research session for 15 brands. Verification + brand-config is ~5x faster than Phase 1 at the same brand count because it's lighter web/think workload per task.

61. **Strengthened forbidden-source warning DID reduce drift, with caveat.** Per session 1 baseline of ~30-40 forbidden URLs per 10-brand batch, the 15-brand session 4 verification surfaced only **1 confirmed dealer-blog URL** (maseratiofedmonton.com) as the sole forbidden-source residual. Adjusted for scale that's roughly 0.07 forbidden URLs per brand vs the ~3-4 per brand baseline — a meaningful ~50x reduction. Caveats: (a) some session-4 agents reported moparinsiders.com (Stellantis fan/news) and gmauthority.com (GM fan/news) as fallback sources — these aren't on the strict forbidden list but are flagged as warnings. So the per-batch warning count is higher (Jeep 149 warnings includes 97 moparinsiders citations; GMC 39 warnings includes 77 gmauthority FYIs) even though strict blocker count is near-zero. (b) The session-4 forbidden-source reduction is harder to attribute solely to the v2 instructions because the verification was reading data from a session that already had baked-in forbidden-source reminders. Net: v2 instructions + per-prompt reinforcement together produce near-clean output; isolating which component does what would require a controlled experiment.

62. **Singleton trim_family violations recur at the start of new brands' Phase 1.** Infiniti hit this 4x (QX60+QX80 SPORT and AUTOGRAPH trims marked is_base_trim:false with non-null delta_from_base despite being singleton trim_families). Pattern: when a model has multiple trim_families and one is a step-up performance variant, agents sometimes attempt to compute delta_from_base relative to a lower trim's reference rather than recognizing the singleton-as-its-own-base rule. The v2 verifier catches it mechanically (Step 5, "Singleton trim_family check") and fix is trivial (flip is_base_trim, null delta_from_base). The pattern is stable across brands — Mazda saw 36 instances in session 1, Acura 1, Infiniti 4 in session 4. Worth knowing: the rule is correct and well-understood but agents still occasionally miss it on visually-distinct-but-singleton variants like SPORT/AUTOGRAPH/Mulliner.

63. **msrp_range.high pollution by option packages.** Three of the 10 session-4 blockers were msrp_range.high values pulled from option-package or limited-edition prices rather than trim base MSRPs. Hummer EV Pickup (121500 included Carbon Fiber Edition pack); Hummer EV SUV (120000 same); Eclipse Cross (33695 included SEL Touring package); Rivian R1T/R1S Quad Max (live pricing increased $4,000 since research date earlier in the same day). The verifier's "msrp_range.high should equal max trim msrp_base" rule is mechanical and catches all of these. Easy fix once flagged.

64. **Live MSRP shifts mid-session.** Rivian's Quad Max trims went from $115,990/$121,990 in the morning Phase 1 research to $119,990/$125,990 by the afternoon verification — same date, $4,000 increase. Caught only because the verification spot-check sampled the live Rivian product page. Lesson: even within a single research session, manufacturer pricing can shift. Source URLs preserved in the data are the right approach because re-verification surfaces drift mechanically. For session-time-sensitive data the catalog should ideally re-run verification before publication.

65. **Ultra-luxury brands produce many FYIs but zero blockers.** Bentley generated 26 FYIs (all expected ultra-luxury patterns), McLaren 16, Lotus 7 — all 0 blockers, 0 warnings combined. The Phase 3 nuances baked into v2 (null msrp_base FYI when documented per §13; NHTSA/IIHS roll-up URLs FYI for the ultra-luxury list) work exactly as intended. Without these nuances, Bentley alone would have produced 22 false-positive blockers and ~10-20 false-positive warnings.

66. **Step-up trims with singleton trim_family architecture produce high warning counts.** Jeep's 149 warnings is dominated by 40 step-up trims with mostly-null spec blocks under the F-150/Sierra-style singleton convention plus 97 moparinsiders.com citations. GMC's 39 warnings is similar (30 trims with >2 null spec blocks). The architecture is correct per spec §6.2 but produces noisy verification output. Future verifier could downgrade these to FYI when the trim's notes explicitly document the singleton-family convention and reference the model's primary trim for inherited specs.

---

## What to do next (in a new chat or session)

### Step 1 (DONE 2026-05-13 session 1): Phase 3 verification + fix-pass for the first 26 brands

Completed. All 26 brands verified clean (0 blockers each). See `SESSION_SUMMARY.md` for the per-brand fix counts.

### Step 2 (DONE 2026-05-13 session 1): Patch script bugs

Completed. `scripts/scrape_image_urls.mjs` and `scripts/download_images.mjs` carry the three patches plus the `.bak` defensive backup. **NOT YET EXECUTED.**

### Step 3 (DONE 2026-05-13 session 4): Phase 2 incremental build for the 15 new brands

Completed. Catalog now contains 41 brands / 424 models / 1,463 trims. See `SESSION_SUMMARY_4.md`.

### Step 4 (DONE 2026-05-13 session 4): Phase 3 verification + fix-pass for the 15 new brands

Completed. 10 blockers across 5 brands fixed; all 15 brands now report 0 blockers. See `SESSION_SUMMARY_4.md`.

### Step 5 (DONE 2026-05-13 session 4): Phase 4 brand configs for the 15 new brands

Completed. `scripts/brand-configs/` now holds all 41 brand configs.

### Step 6 (NEXT — GATE TO ALL FURTHER PHASE 4 WORK): Smoke-test the patched scrape script on Mini

```
node scripts/scrape_image_urls.mjs --brand mini
```
Verify behavior matches expectations in `STATUS.md` "Image-scrape state (Phase 4)" section before chaining to any other brand. Inspect `catalog/data/mini.json.bak` to confirm pre-write backup is written. After this smoke test, retry the patched scripts on Toyota with the recovered partials data, then chain across all 37 remaining brands.

### Step 7: Honda Phase 4 smoke test (formerly Step 3)

Fresh PowerShell window from project root:
```
cd C:\Users\nadea\car-catalogs
node scripts/scrape_image_urls.mjs --brand honda
node scripts/download_images.mjs --brand honda
```

Expected: ~72% coverage or better. If regression, fix scripts before running on other brands.

### Step 4: Phase 4 for the other 25 brands

Per `instructions/04_scrape_images.md`. Each brand needs:
- `scripts/brand-configs/<brand>.json` created (one-time, ~10 min per brand of model-URL collection)
- scrape + download run (~5 min per brand)

Can be chained or parallelized. Honda smoke-test result will inform what to expect from others. Manufacturer CDN access remains the binding constraint per lesson #24.

### Step 5 (optional): Update instruction files

Based on patterns observed across 26 brands:

- **`01_research_brand.md`:** Bake the explicit forbidden-source warning naming the recurring domains (`www.cars.com`, Motor1, Carbuzz, Autoblog, AutoEvolution, Tesla Oracle, dealer sites) directly into the permanent instruction text. Document ultra-luxury MSRP non-disclosure as an expected pattern. Note that NHTSA/IIHS don't test ultra-luxury or specialty performance models.
- **`03_verify_catalog.md`:** Adjust the "null msrp_base is BLOCKER" rule to be context-aware (FYI when trim notes document manufacturer non-disclosure). Add a check for forbidden-source domains in sources maps and professional_reviews.links — would catch the pattern at scale automatically. Add the singleton trim_family-without-images check explicitly (already implicit via spec §7).
- **`00_master_spec.md`:** Document body-style taxonomy decisions for liftbacks (Sportback), wagons-marketed-as-sedans (Sport Turismo, Avant), and convertibles within sedan-classified models. Add a convention note for NHTSA/IIHS roll-up URLs for ultra-luxury brands.

### Step 6 (optional): More brand research

26 brands covers most of the meaningful US market. Remaining notable absences: Stellantis brands (Jeep, Ram, Chrysler, Dodge, Alfa Romeo, Fiat, Maserati), GMC, Buick, Jaguar, Bentley, McLaren, Polestar (if treated separately from Volvo), Lucid, Rivian. The shortlist's original 12 (Hyundai, Kia, Nissan, Subaru, Genesis, Volvo, Volkswagen, Mini, Cadillac, Ford, Chevrolet, Land Rover) are all now done.

---

## Things to keep in mind when resuming

1. **The instruction files reference each other but are designed to run standalone in Claude Code.** Each phase file includes a condensed inline schema reference.
2. **Save after every model.** Phase 1 is resumable.
3. **Update both copies of any file you change.** Local `instructions/` folder AND the Claude.ai Project. (Scripts and configs are local-only — they don't go in the Project.)
4. **Honda/Toyota are the simple-case references; BMW/Mercedes/Porsche/Ford are the complex-case references; Ferrari/Aston Martin are the ultra-luxury references.**
5. **Fix passes should be tight and item-by-item.** Don't ask Claude Code to "fix the whole report" — list each item with the exact edit (lesson #16).
6. **Verifier output can have false positives.** Direct file inspection beats a second verification run when you suspect a false positive (lesson #17).
7. **Phase 4 makes only manufacturer-affiliated requests.** No Wikipedia, no Edmunds/KBB galleries, no Google Images. If a brand's coverage is bad, the answer is placeholders and an honest report — not third-party fallbacks (lesson #3).
8. **Batched sessions work cleanly through at least 12 brands.** Earlier worry about long-session drift was overstated; the actual drift problem is per-brand instruction-following (e.g., sole-trim rule, forbidden sources), not session length (lessons #25, #28, #40).
9. **`www.cars.com` and content-farm citations recur every batch** unless explicitly warned against in the prompt. Either bake the warning into the permanent instruction file or expect to run a cleanup pass after every batch (lessons #26, #33, #35).
10. **For overnight runs: set Windows Update active hours OR pause updates.** Sleep settings alone don't prevent forced restarts (lesson #41).
11. **The file system is the source of truth for "what brands exist."** STATUS.md can lag (lesson #42). When in doubt, run `ls data/*.json`.
12. **NEVER run Phase 4 on any brand until the two script bugs (destructive reset + ANGLE_PATTERNS) are patched.** This is non-negotiable — running Phase 4 on a brand with already-resolved Phase-1 URLs WILL destroy them. Toyota was destroyed on 2026-05-13 by this exact bug; recovered from partials, but the partials are not a guarantee for every brand.
13. **Per-model partials in `data/_partials/` are the project's only data-safety net.** Toyota's recovery worked because the partials predated the destruction. The partials should be preserved indefinitely. Future Phase 1 runs should continue to write partials per-model.
14. **When a script touches existing brand JSONs, verify what the script DOES touch vs. what it should touch.** "Idempotent" in instructions doesn't mean "safe" — read the actual script behavior, not the doc claim. This applies to any future automation that mutates committed data.

15. **The instruction file forbidden-source list now names specific domains** (Task 1A of the 2026-05-13 instruction-update session). Future verification batches should produce fewer cars.com/motor1.com residuals — measure this by comparing the per-batch residual count to the pre-update baseline (which was approximately 30-40 forbidden URLs per 10-brand batch).

16. **The verifier now flags singleton trim_family without 4 images as a blocker** (Task 2C of the same session). Future Phase 1 batches should produce fewer of these architectural errors — and when they do occur, the verifier will catch them before fix-pass.

17. **All 22 Phase 4 brand configs exist in scripts/brand-configs/.** Phase 4 chaining is now a single-step process: run scrape + download per brand in a loop, after smoke-testing the patched scripts on Mini.

18. **All 41 Phase 4 brand configs now exist (session 4).** The 15 new-brand configs added in session 4 use the same shape as honda.json and were verified live (or via WebSearch where consumer sites were gated). McLaren is the only brand-config with image URLs already resolved at Phase 1 (cars-assets-production.mclaren.com CDN — 24/24 image URLs). All other brands' image entries are `needs_scraping: true` placeholders awaiting Phase 4 execution.

19. **Verification can launch all 15 subagents simultaneously without race conditions** (session 4 lesson #59). The key safety mechanism is keeping STATUS.md updates centralized in a single post-batch step rather than allowing each subagent to touch shared files. Brand-config building parallelizes the same way. Reserve single-threaded execution for: fix-pass (mutates data JSONs in lockstep), Phase 2 build (writes manifest), and STATUS.md/PROJECT_STATE.md updates.

20. **msrp_range.high pollution by option packages is a recurring blocker class** (session 4 lesson #63). Whenever a model offers an option package or limited-edition trim that exceeds the highest "trim base" MSRP, the model-level msrp_range.high can get set to the package price rather than the trim's msrp_base. The fix is mechanical (recompute high = max(trim.msrp_base)) but it should keep being verified mechanically until the Phase 1 instruction explicitly addresses this edge case.

---

## Quick reference for prompting in a new chat

> "Continuing the Car Catalog Project. Read PROJECT_STATE.md to see current state. Last checkpoint: 26 brands fully researched/built/verified (358 models, 1,208 trims) — site renders. Phase 4 image scrape attempted for Honda (72% pass), BMW (93%), Toyota (destroyed by script bug, recovered from partials), Mercedes (0% — wrong source). Two critical script bugs identified in scripts/scrape_image_urls.mjs that must be patched before any further Phase 4 work: a destructive URL reset and an ANGLE_PATTERNS crash on extended angles. 22 brands remain to attempt Phase 4 once scripts are patched."

The Project files are accessible automatically, so I'll have full context once I read this file.
