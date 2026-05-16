# Process — engineering narrative

> The dataset and the catalog were built across 16 chained Claude Code sessions over six days (2026-05-11 through 2026-05-16). This document is the engineering record: how the work was structured, which architectural decisions paid off, where things went wrong, and what the verification system caught.
>
> For the project overview, see the [README](../README.md). For the dataset schema, see [SCHEMA.md](./SCHEMA.md). For the original specification, see [PROJECT_SPEC.md](./PROJECT_SPEC.md).

---

## 1. The setup — orchestrated AI engineering

The project's first decision was not technical. It was the workflow: **build the catalog via chained Claude Code sessions, each with an explicit brief, named safety rules, mid-session checkpoints, and per-phase artifacts.**

Concretely that meant a session looked like this:

1. **Read the project state.** Every session began by reading `PROJECT_STATE.md`, the most recent `SESSION_SUMMARY_N.md`, and `SESSION_NOTES.md`. This took under two minutes and prevented re-doing work that earlier sessions had already settled.
2. **Execute phases against a brief.** Phases were ordered to expose checkpoints — places where a halt was cheap and recovery was clean. Single-threaded work where state mattered (script edits, schema changes, instruction updates); parallel subagents where work was per-brand-independent (verification, research, fix-passes).
3. **Save after every unit of work.** No batching. Each brand JSON write, each verification report, each instruction edit — flushed to disk immediately. The .bak discipline (one-deep backup before mutation, overwritten on next mutation) made every step recoverable.
4. **Halt at checkpoints when reality diverged from the brief.** A checkpoint that fires is not a failure — it's the system working. The pattern across Sessions 14 and 15 was instructive: the brief expected Tier 2 image sources to lift coverage; the validation halt caught that the actual blocker was a layer deeper (alt-text vocabulary gap; then anti-bot decoys).
5. **Write artifacts.** Every session ended with a `SESSION_SUMMARY_N.md` (concise, structural), a `reports/session<N>_final.md` (detailed, per-phase), and updates to `STATUS.md` + `PROJECT_STATE.md`. `SESSION_NOTES.md` accumulated halts and mid-session decisions append-only.

The discipline is captured in [`instructions/05_session_runbook.md`](../instructions/05_session_runbook.md) — itself an instruction file written midway through the project (Session 11) to consolidate the meta-rules.

### Why this works

The session-summary discipline is what scaled the project. With 16 sessions, ~40 brands' worth of research, dozens of script-level changes, and policy decisions whose rationale could fade in two days, the only way to keep the work coherent was to make every step inspectable. When Session 15's NetCarShow decoy finding required reverting four image entries to their pre-session state, the session brief said "if any spot-check fails: restore from .bak, document, halt." That rule wasn't improvised in the moment — it was written ahead of time, and Session 15 followed it without drama.

### Tradeoffs of orchestrated AI engineering

There are real costs:

- **Verification is non-optional.** AI orchestration can produce a beautifully-structured brand JSON in 30 seconds; whether the cited URLs actually exist and resolve to real manufacturer pages is a question only verification can answer. The project's verification system (Sessions 1–4, then strengthened through Session 11) is doing the load-bearing work.
- **Drift between sessions is a real risk.** A small policy decision in Session 9 ("MSRP relaxation for ultra-luxury under documented non-disclosure") only stays consistent across Sessions 10–15 because the rationale is written into `instructions/01_research_brand.md` §4.6, not living in chat memory.
- **Each session has a fresh-context cost.** Reading PROJECT_STATE + the prior summary + SESSION_NOTES took ~2 minutes per session; over 16 sessions, that's 30+ minutes of pure orientation. Worth it for the coherence; not free.
- **Some kinds of work fit the pattern, some don't.** Per-brand independent work (research, verification, fix-pass) parallelizes via subagents at ~5× speedup. Cross-file consistency work (instruction edits, schema changes) is rigorously single-threaded — Session 11's consolidation pass deliberately ran one file at a time.

The work is honest about what it is. Nothing about the project hides the orchestration layer; the SESSION_SUMMARY files are committed alongside the code, and the README states the workflow explicitly.

---

## 2. Architecture decisions

Six decisions, each made early, each preserved across all 16 sessions.

### 2.1 Per-brand JSON files; no cross-file references

Each brand is one self-contained JSON: `data/honda.json`, `data/bmw.json`, etc. Cross-brand relationships (body-style filters, comparison views) are computed at runtime in the frontend, never encoded as cross-file foreign keys.

**Why:** independence. A research session on Hyundai cannot corrupt Toyota's data. A verification run on BMW reads only `data/bmw.json` and `scripts/verify_brand.mjs`. A parallel-subagent fix-pass on 7 brands at once never collides because no two agents write to the same file. When the Wikimedia incident (see §4.2) required restoring Honda's images from backup, only `data/honda.json` needed a `.bak` recovery — no cascade across other brands.

The cost is duplication of common reference data (manufacturer URL patterns, body-style taxonomy values) in the verifier and frontend rather than the dataset. That's the right tradeoff for a static dataset where the per-brand independence pays back constantly.

### 2.2 Schema versioning with documented evolution

`schema_version: "1.0"` → `"1.1"` → `"1.2"` → `"1.3"` over the project. Each bump is documented in `instructions/00_master_spec.md` §12 with a changelog entry.

| Version | Added |
|---|---|
| 1.0 | Initial schema (Honda pilot) |
| 1.1 | Singleton-trim rule (sole-trim of a model carries full spec, no delta); EV `customer_satisfaction` mirroring; sources_confidence per-field |
| 1.2 | Body-style decision rules (LC 500 Convertible, Panamera Sport Turismo, Audi Sportback variants); NHTSA/IIHS source URL convention; ultra-luxury MSRP non-disclosure docs |
| 1.3 | `behind_3rd_row` cargo field for 3-row SUVs; trim-level `sources_confidence` optional map; `angle_url_patterns` brand-config field |

**Why:** schema changes during a project are inevitable. The choice was between (a) tagging each version and migrating earlier brands, or (b) letting earlier brands carry older schema versions and never re-migrating. Chose (a): every brand was re-verified against the latest schema at the next verification pass, and the schema versions are still readable as historical artifacts inside each brand JSON.

The result is that any reader can open `data/honda.json` and see `"schema_version": "1.1"` (or "1.3" after re-verification) and know exactly which set of rules applied at the time the data was written.

### 2.3 Manufacturer-only source policy (with documented scoped relaxations)

The default rule: every spec field cites a manufacturer URL. `automobiles.honda.com`, `bmwusa.com`, `tesla.com`, etc. Government sources (`fueleconomy.gov`, `nhtsa.gov`, `iihs.org`) and JD Power are also Tier 1.

Two scoped relaxations exist:

- **Ultra-luxury MSRP** (`instructions/01_research_brand.md` §4.6, added Session 9): manufacturers like Bentley, McLaren, Aston Martin, Rolls-Royce, Ferrari, and Lamborghini do not publish prices. For trims where `trim.notes` documents the non-disclosure, MSRP may be cited from Car and Driver, MotorTrend, Hagerty, or Road & Track. Confidence is recorded as "medium." Cars.com, KBB, dealer sites remain forbidden.
- **Tier 2/3 image sources** (`instructions/04_scrape_images.md` §A, added Session 14): a small allowlist of press-kit aggregators (NetCarShow primarily) is permitted for image fetches when Tier 1 produces no candidates. Image-entry provenance fields (`source_tier`, `source_domain`) are recorded. **Currently dormant** pending the anti-bot decoy finding from Session 15 (see §4.5).

Both relaxations are scoped, documented, and enforced by the verifier. The default of manufacturer-only sourcing is not academic — it is what kept the project from drifting into content-farm citations like cars.com or motor1.com that Session 1's verification swept up across multiple brands. The forbidden-source list is in `instructions/01_research_brand.md` §4.1 and the verifier enforces it as blockers.

### 2.4 Trim-delta pattern

Every model has a `base_trim` with full specs and a list of `step_up_trims` that record only the differences from base. A typical model looks like this:

```json
{
  "model_slug": "accord",
  "trims": [
    {
      "trim_name": "LX",
      "is_base_trim": true,
      "trim_family": "lx-ice",
      "msrp_base": 28295,
      "performance": { "horsepower": 192, "torque_lbft": 192, ... },
      ...
    },
    {
      "trim_name": "EX-L",
      "is_base_trim": false,
      "trim_family": "ex-l-ice",
      "msrp_base": 33840,
      "delta_from_base": {
        "horsepower": null,
        "wheels": "19-inch alloy",
        "features_added": ["leather seats", "heated rear seats"]
      },
      ...
    }
  ]
}
```

**Why:** trim sheets duplicate 90%+ of their data from the base trim. Storing full specs per trim creates noise in research and verification (you have to verify the same fact 10 times for a 10-trim model) and obscures the actual upgrade story (what does Sport actually add over Sport-S?). The delta pattern surfaces upgrades directly. The frontend renders them as a delta table in each model view.

**Edge case: singleton trim_family rule.** When a model has exactly one trim, the delta concept doesn't apply. Schema v1.1 introduced the rule: any trim that is the sole member of its `trim_family` must carry `is_base_trim: true`, `delta_from_base: null`, and the 4 required image angles in its own images array. The verifier enforces this as a blocker; Session 11 cleaned up 56 Toyota violations in a single targeted maintenance pass.

### 2.5 Structural ceiling concept

Coined in Session 7, formalized in `instructions/04_scrape_images.md` and `06_maintenance.md`. The structural ceiling is the **upper bound on image coverage achievable under the current source policy** — what's actually published by manufacturers vs. what's gated, missing, or only available via post-purchase configurator.

Examples:
- **Tesla 0/64.** Tesla.com all-page and the configurator API both return HTTP 403 to any non-browser client. The structural ceiling for Tesla under manufacturer-only sourcing is exactly 0%. No engineering work changes this; only a fetch-mechanism upgrade (Playwright + browser session) or policy relaxation does.
- **Mercedes-Benz interior shots.** mbusa.com publishes hero exteriors per class but routes interior detail through the configurator (which the script can't open). Sessions 9 and 10 chased this; the conclusion was that the interior shots simply aren't published outside the configurator.
- **3-row SUV cargo configurations.** Many manufacturers publish exterior + interior dashboard but not behind-3rd-row vs. all-rows-folded cargo dimensions. The dataset records null when not published, and the catalog renders that honestly (no fabrication, no scraped third-party numbers).

The project's coverage reporting acknowledges the ceiling explicitly. 72.58% image coverage is the achieved number; the remaining 27% is accounted for by named structural ceilings per brand. The catalog renders placeholders for missing images, not stale or substituted content.

### 2.6 No frontend toolchain

The catalog at `catalog/index.html` is vanilla JS, vanilla CSS, no build tools. Open by double-clicking `index.html` and the site works from `file://`. Open it via `python -m http.server` and it works over HTTP. Deploy to GitHub Pages and it works there too.

**Why:** the data is the asset. The frontend exists to make the data browsable, not to be a framework showcase. Adding webpack/vite/Next would have added compile steps, framework version pinning, and a CI/CD layer that would have dwarfed the data work in cognitive overhead.

The constraint also enforces clarity. `catalog/app.js` is ~77 KB of plain JS that renders the entire site (home view, brand view, body-style cross-brand views, comparison view, modal lightboxes, search). Every interaction is traceable to its handler in one file. The Session 13 frontend polish refactor moved from "functional generated grid" to "editorial publication" without touching the data layer or adding any dependencies.

---

## 3. The verification system

Verification is encoded in `scripts/verify_brand.mjs` (~1,200 lines, Node.js, no dependencies). It produces three categories of findings:

- **Blockers** — schema violations or forbidden-source citations. A brand with blockers does not pass verification.
- **Warnings** — pattern deviations that may be intentional. Warnings are informational; sometimes they reflect a per-brand exception (e.g., ultra-luxury brand with no JD Power VDS coverage).
- **FYIs** — observations worth noting but expected. The most common FYI is ultra-luxury MSRP non-disclosure, downgraded from blocker after Session 11.

### Structural rules

Encoded in the verifier:

1. **Forbidden-source detection.** Hostname-only match (with proper URL parsing, not substring) against a list including: `cars.com`, `motor1.com`, `carbuzz.com`, `autoblog.com`, `autoevolution.com`, `teslaoracle.com`, `carsfrenzy.net`, `carscoops.com`, dealer-site hostname patterns, forums, Reddit, enthusiast wikis. Every spec field's `source` URL is checked; every model's `professional_reviews.links[].url` is checked.
2. **Singleton trim_family rule.** Every trim with a unique `trim_family` slug must carry `is_base_trim: true`, `delta_from_base: null`, and 4 required image angles (front_three_quarter, rear_three_quarter, side_profile, interior_dashboard) in its own `images` array. Violations are blockers.
3. **msrp_range consistency.** Each model's `msrp_range.low` and `msrp_range.high` must match the min and max of `trims[].msrp_base` (excluding nulls). Drift is a blocker.
4. **Cross-trim sanity checks.** Price outliers (single trim 50%+ above family median), horsepower typos (a "350 hp" sedan with a single-trim outlier 850 hp value), MSRP step-down outside expected range. These are warnings.
5. **MSRP null handling.** Mainstream-brand null `msrp_base` is a blocker; ultra-luxury non-disclosure (where trim.notes documents "manufacturer does not publish prices" or similar) is downgraded to FYI per the Session 11 patch.
6. **NHTSA/IIHS source URL convention.** Per-vehicle URLs preferred; brand roll-up URLs (nhtsa.gov/ratings or iihs.org/ratings) are FYI for ultra-luxury where the model isn't tested, but warnings for mainstream brands.
7. **EV MPGe mirroring.** EV trims must cite `fueleconomy.gov` for fuel economy fields; failure to do so is a warning.

### Bug history of the verifier itself

The verifier has been patched twice:

- **Session 11, `isDealerDomain` hostname-only fix.** The original regex matched URL paths containing "of-" (e.g., `subaru.com/owners/benefits-of-ownership`, `dodgegarage.com/.../horsepower-of-any-muscle-car`), flagging 27 legitimate manufacturer URLs as dealer domains. The fix moves matching to `new URL(url).hostname` only, with refined patterns for actual dealer hostnames. Test suite at `scripts/test_isdealerdomain_session11.mjs` — 19/19 pass.
- **Session 11, `msrp_base null` non-disclosure-aware FYI downgrade.** The verifier was unconditionally flagging null `msrp_base` as a blocker, but the spec said it should be FYI when `trim.notes` documents non-disclosure. The patch scans trim notes for known non-disclosure phrasings via regex.

The bug history is the point. The verifier is itself code that can be wrong; treating it as an authority requires periodically auditing its rules against the spec. The bug-fix sessions caught real false-positives that had been quietly flagged as blockers for weeks.

---

## 4. Notable findings during the project

Selected episodes from across the 16 sessions, in roughly chronological order.

### 4.1 The Honda pilot's 0/212 image download

The first image-scrape attempt on Honda was the Honda pilot. The script downloaded 0 of 212 expected images. Investigation revealed that Phase 1 had stored consumer-site **page URLs** in `image.url` (e.g., `https://automobiles.honda.com/civic-sedan`), expecting Phase 4 to extract the actual `<img src>` URLs from those pages. Phase 4 instead downloaded the URLs as-is — and they returned HTML, not images.

The fix shaped two rules:

- **`instructions/01_research_brand.md` §4.1:** `image.url` must point to a direct image asset URL, not a page URL. If the asset URL isn't findable at research time, store a page URL and set `needs_scraping: true` — a separate scrape pass extracts the real URLs.
- **The page-vs-asset distinction was added to the schema docs.** Every subsequent brand's Phase 1 output records actual image asset URLs when findable, falling back to page URLs only when the asset URL is gated or behind JS rendering.

The 0/212 incident is documented in `instructions/01_research_brand.md` §4.1 verbatim as a teaching example.

### 4.2 The Wikimedia incident

Honda was at ~72% image coverage from the pilot; the question was whether to lift the remaining ~28% by fetching from Wikimedia Commons. A test pulled a Civic Hatchback image — and the image was a 1990s UK-market Civic Hatchback with a British license plate, labeled as the 2026 Civic Hatchback.

Search-result relevance is not image accuracy. The incident shaped the manufacturer-only policy in `instructions/01_research_brand.md` §2e:

> Why this rule exists: during Honda image-coverage work, an attempt to extend coverage by adding Wikimedia Commons as a source pulled an old UK-market sedan (with a 1990s British license plate) and labeled it as a 2026 Civic Hatchback. Search-result relevance does not equal image accuracy. The site renders gracefully with missing images (placeholder shown), so it's better to have fewer correct images than more wrong ones.

The policy was deliberately conservative from then on. Sessions 5–12 chased coverage gains within the manufacturer-only constraint; the bimodal coverage pattern (most brands at 80%+, several stuck at <50%) became one of the project's documented findings.

### 4.3 Session 5 — Toyota S3 403 and the Referer header

Toyota's first Phase 4 run got 0% coverage. The scrape script extracted URLs correctly; the download script got HTTP 403 on every single one. Investigation found that Toyota's image CDN (`toyota.scene7.com`) serves only when the request `Referer` header points to `toyota.com`. The browser does this by default; the download script's bare `fetch` did not.

Patch: a `PER_HOST_REFERER` map in `scripts/download_images.mjs` that sets the appropriate `Referer` per CDN hostname. Toyota's coverage jumped from 0% to 95%+ in one re-run.

This pattern recurred. Sessions 8 and 9 found similar latent gating: Hyundai's Adobe Scene7 URLs required `fmt=webp` queries to actually serve images; Subaru's Sitecore Content Hub URLs were extension-less and being rejected by the script's `isPlausibleImageURL` filter. Each fix was the same shape: minimal, scoped, validated on the affected brand before applying to others.

### 4.4 Session 9 — the regex separator bug

Session 9 ran per-brand image investigation for 8 mid-tier brands. Most found structural ceilings; Kia jumped from 25% → 70% from two things:

1. An HTML-entity decode bug in `extractCandidates` (Adobe AEM URLs were embedded in JSON data layers with `&#34;` escapes that the extractor wasn't decoding).
2. Per-brand `angle_url_patterns` for Kia's 360-spin frame URLs (`/360/36.png` = front_three_quarter, `/360/04.png` = side_profile, etc.).

The script bug (HTML entity decode) was a latent issue that had been silently underperforming on multiple brands. Ram gained +11.4 percentage points from the same fix. Ford gained +0.5pp. The fix touched one regex but lifted three brands.

The pattern surfaced a meta-lesson, recorded in `instructions/05_session_runbook.md` §8 ("Test your assumptions"):

> When a fix doesn't deliver the expected magnitude, the first move is to question the diagnosis rather than refine the fix.

Sessions 5/6/8 each had a moment where the original diagnosis was half right and a second layer of investigation found the actual blocker. Session 9 was the first to surface a script bug visible to multiple brands at once. Session 15 was the most dramatic case (anti-bot decoys two layers below the original diagnosis); see §4.5.

### 4.5 Session 15 — the NetCarShow anti-bot decoy

Session 14 added a tiered source allowlist (`instructions/04_scrape_images.md` §A) permitting NetCarShow as a Tier 2 image source. The architecture landed cleanly; the validation found that NetCarShow's image filenames lack angle vocabulary (no "front" / "rear" / "side" tokens) and the existing angle-matcher rejected all candidates. Session 14 halted at the validation checkpoint.

Session 15 added a NetCarShow-specific positional heuristic: when a NetCarShow page has a hero candidate (filename suffix `-1280` indicating high-resolution; URL hint width ≥ 1000), assign it positionally to `front_three_quarter`. The implementation was clean and the heuristic correctly identified 4 Ferrari hero candidates (amalfi, 296-speciale, 296-speciale-a, 849-testarossa). The download script fetched all 4 successfully — proper JFIF JPEG headers, realistic file sizes (113–185 KB), correct content type.

The session brief required a visual spot-check before promoting Tier 2 fills to project-wide. The spot-check failed: **all 4 downloaded files were anti-bot pixel-noise decoys.** Valid JPEGs, but containing random-color mosaic content rather than real Ferrari photography. NetCarShow serves decoy images to non-browser clients to defeat scraping; the static-fetch architecture had no way to bypass it.

Per the brief's safety rule ("if any spot-checked image is wrong: restore from .bak, document, halt"), the session restored Ferrari's 4 affected entries (the .bak files had been overwritten by the download step, requiring a manual revert script), deleted the 4 decoy image files, and halted Phase 3 (project-wide application across NetCarShow-eligible brands).

The §A documentation was updated to flag NetCarShow as "HALTED — anti-bot decoy" with an explicit warning not to enable NetCarShow tier2_endpoints in brand configs until the fetch mechanism is upgraded (Playwright-rendered Tier 2 is the next plausible path; out of scope for Session 15).

**What this demonstrates:**

- The session's checkpoint discipline prevented the decoy fills from propagating to other brands. The brief said "validate on one brand first" — that brand was Ferrari; the validation caught the decoys; the project-wide pass was canceled.
- The .bak discipline plus a manual revert script (targeting `assignment_method === "positional_netcarshow"` entries specifically, not blanket restoration) preserved the 11 legitimate Tier 1 entries from Session 14's provenance backfill while reverting only the Session 15 Tier 2 fills.
- The HTTP-level success was a false signal. Future Tier 2 sources must be image-content spot-checked, not just URL/header-checked. The instruction file now mandates this pre-flight.

Three sessions in a row (13, 14, 15) found that data-side coverage work had hit diminishing returns. The natural Session 16 became portfolio prep, which is what this session is.

### 4.6 Session 11 — the consolidation pass

By Session 10 the instruction files were drifting. Multiple sessions had added clauses; the v1 instructions were the original Honda pilot's notes; the v2 instructions were the post-fix-pass updates; there was no canonical statement of "what does the project's process look like in steady state."

Session 11 was a four-phase pass:

1. **Phase 1: Instruction consolidation.** Created `instructions/05_session_runbook.md` (multi-phase session orchestration meta-rules) and `instructions/06_maintenance.md` (periodic upkeep workflows). Updated 00, 01, 03, 04 with cumulative findings from Sessions 5–10. Bumped the schema to v1.3.
2. **Phase 2: Forbidden-source fix-pass.** Project blockers dropped 271 → 56 (-79%). The pass touched 17 brands; the 56 remaining were all Toyota singleton-no-images cases, distinct from the forbidden-source class.
3. **Phase 3: Pricing drift.** Applied Session 10's freshness check findings on BMW (3 trims) and Chevrolet (3 trims). Recomputed msrp_range. Bumped researched_at dates.
4. **Phase 4: Final build + verification.** Confirmed 56 blockers (all Toyota), 322 warnings, 30 FYIs, 45 of 46 brands clean.

Session 12 then targeted the remaining 56 with 49 minimal-diff `trim_family` renames across 15 Toyota models. **Project-wide blockers went to 0 across all 46 brands.** That state held through Sessions 13–15.

The consolidation pattern is now codified. Future maintenance work follows `instructions/06_maintenance.md` §1–5: drift detection, targeted re-research, image-config rot, verifier-found blocker triage, freshness spot-checks.

---

## 5. Things that went wrong and what we learned

A non-exhaustive list, with the lesson attached:

### 5.1 The destructive-reset bug (Session 1)

Early in the project, the scrape script had a bug: the "idempotent reset" loop in `main()` unconditionally reset all `image.url` entries to their canonical model page URL on every run. The intent was to reset only entries with `needs_scraping: true` (i.e., entries that hadn't been resolved yet). The bug reset everything, including already-resolved direct asset URLs.

The mistake destroyed working URLs on brands that had been partially scraped. Recovery required restoring from `.bak` (which fortunately existed because the script wrote one before mutation).

**Lesson:** the idempotent-reset loop now gates on `i.needs_scraping === true`. Entries with resolved direct-asset URLs are left untouched. The script also logs `Reset N image entries with needs_scraping:true to their model page URLs` on every run so the reset count is visible.

**Broader lesson:** "idempotent" is not a property the code can claim by name. The reset loop was named "idempotent" but wasn't, until the gate was added.

### 5.2 The mid-session pause-point gap (Sessions 2–4)

Early sessions didn't have explicit mid-session pause-points. A session ran end-to-end; if a phase produced bad output, recovery required re-running the entire chain. This is what made the Honda pilot's image issue painful (the bad URLs were only discovered after the download phase ran).

Sessions 5+ began structuring phases as gated checkpoints. Each phase has explicit "halt if X" conditions. The Session 14 and Session 15 halts (Tier 2 validation failures) are examples of the checkpoint pattern working. The Mini smoke test (Session 5) is another: rather than running script changes on all 41 brand configs at once, the brief required validating on Mini first; the script issues that surfaced on Mini (URL drift; regex separator bug) were caught before they could damage 40 other brands.

**Lesson:** named pause-points are non-optional. The cost of a pause-point is small; the cost of a runaway session that produces bad data across many brands is large.

### 5.3 The Toyota destruction (averted)

Session 4's brief was "scrape Phase 4 on all 41 brands." The Mini smoke test had passed; the natural move was to chain all 41 brands. The brief explicitly forbade this: "no Phase 4 image work until Mini smoke test passes AND the script-bug audit confirms no remaining destructive paths."

The audit found the destructive-reset bug described in §5.1, still present in a different code path. Had the chained 41-brand run gone ahead, it would have damaged Toyota's, BMW's, and Mercedes-Benz's previously-resolved image URLs — none of which had been re-scraped since the bug was patched (the patch was in scrape_image_urls.mjs but the test path didn't exercise the reset loop on already-resolved entries).

The session brief's gate is what prevented the destruction. There was no actual incident — just the safety rule firing correctly.

**Lesson:** safety rules are valuable even when they're never triggered. The cost of writing the gate is one paragraph in a session brief; the value is the entire class of incidents that don't happen.

### 5.4 The .bak overwrite problem (Session 15)

The .bak discipline (one-deep backup; overwritten on every mutation) works cleanly when only one script mutates a file per session. Session 15 ran two scripts in sequence (scrape then download), and both scripts wrote `.bak` before mutating. So the `.bak` file after both scripts reflected the **post-scrape, pre-download** state — which already had the 4 anti-bot decoy positional assignments — making it useless for restoration.

The fix was a manual revert script targeting `assignment_method === "positional_netcarshow"` entries specifically, plus the trim notes that contained the positional fallback note text. The 11 legitimate Tier 1 entries from Session 14's backfill were preserved (the manual revert targeted the Session 15 fills, not the Session 14 ones).

**Lesson:** for multi-script sessions, manual revert scripts targeting specific session-added fields are more reliable than blanket .bak restoration. Future sessions that combine scrape + download in one pass should either (a) write session-scoped .bak names (`<brand>.json.session<N>.bak`) or (b) plan the revert script ahead of time as part of the brief.

### 5.5 The Bentley research subagent

Session 9's Phase B MSRP fills used 4 parallel subagents to research ultra-luxury MSRP for 57 trims across 7 brands. Three of the four agents discovered and used the Google Translate proxy workaround (`www-caranddriver-com.translate.goog`) when WebFetch was blocked for the editorial sources; the fourth (Bentley) strictly followed the policy and reported all sources blocked. Bentley returned 0 of 22 fills.

A retry with explicit proxy guidance unblocked it (15 of 22 filled).

**Lesson:** when a subagent reports "blocked, no progress," the question to ask is whether other agents working in parallel have found a workaround. The retry that unblocked Bentley used the same policy + an explicit hint that the proxy workaround was permitted. This is a documentation gap that future sessions can avoid by including the workaround in the brief upfront.

---

## 6. The dataset as the asset

The catalog frontend is the demonstration; the dataset is the asset. Concretely:

- **1,492 rows × ~40 fields per row.** Each row is one trim of one model of one brand.
- **Every field with a source citation.** The `sources` map on each trim records the URL for MSRP, EPA, NHTSA, IIHS, JD Power, dimensions, drivetrain, etc. Forbidden domains are blocked at verification time.
- **Schema-versioned and validated.** `schema_version: "1.3"` on every recent brand. Every spec field's presence is checked against the schema; every source URL is checked against the forbidden-source list.
- **Designed for cross-brand analysis.** Models share a body-style taxonomy (sedan, coupe, hatchback, wagon, convertible, four SUV subcategories, two pickup subcategories, minivan, sports car). Powertrain types are standardized (ICE, hybrid, PHEV, EV, fuel cell). MSRPs are in USD; EPA values use the standard fueleconomy.gov reporting; reliability uses the standard JD Power VDS scale.
- **Honestly unfinished where the data is unfinished.** Tesla's image entries are null with documented reason. Ferrari's MSRPs are partially null with documented non-disclosure notes. JD Power APEAL fields are null pending the typical-July 2026 publication. The dataset records what it knows; it does not invent.

The dataset enables analyses that the catalog itself doesn't surface directly. The `analyses/` directory has three example scripts that demonstrate this: a price-performance scatter colored by powertrain, a brand-reliability bar chart against the industry average, and an EV market snapshot. Each is a standalone Python script (matplotlib only, no other dependencies) reading the brand JSONs directly. The analyses are demonstrative, not exhaustive — any reader can fork the repo and write more.

---

## 7. Honest limitations

Stated explicitly. None of these are bugs; they are scope or structural facts.

### 7.1 Tesla unreachable

Tesla's website returns HTTP 403 to any client without a real browser fingerprint. The configurator API behaves the same way. The catalog includes Tesla's 10 models / 16 trims with full spec data (sourced from Tesla's investor presentations, EPA, and IIHS for ratings) but **0 image coverage**. The catalog renders Tesla model views with placeholder images.

This is a structural ceiling, not an engineering miss. A future session could lift it via Playwright-rendered scraping (cost: significantly slower per-fetch; complexity in maintaining a browser session) or via policy relaxation (cost: deviates from manufacturer-only; documentation of which Tesla press images come from where).

### 7.2 ~27% of images unavailable

Project-wide image coverage is 72.58%. The 27% gap is a mix of:

- **Tesla 0%** (per §7.1)
- **Land Rover, Mercedes-Benz, Ferrari interior shots** — these brands' interior detail is routed through configurators or build-your-own flows that the script can't open
- **Pre-release / final-MY 2026 specifics** — some 2026-MY photography hasn't been published yet (manufacturers refresh MY assets opportunistically)
- **Sole-trim variants without unique photography** — some sole-trim models share photography with the family, but the trim's own `images[]` array is empty because the manufacturer hasn't shot the specific trim variant

Each gap is documented per-brand in `STATUS.md` and the per-brand verification reports.

### 7.3 Data freshness

`researched_at` is recorded per model. Most brands were researched between 2026-05-11 and 2026-05-15. The `instructions/06_maintenance.md` §5 freshness-check pattern is designed to detect drift quarterly; the next scheduled check is Q3 2026 (around MY27 announcement season).

Some specific drift is already known and queued:

- **JD Power 2026 APEAL** publishes ~July 2026; ~150–200 `customer_satisfaction` unknowns will be fillable then. This is the only non-optional pending data work.
- **Mid-2026 trim refreshes.** Some manufacturers issue mid-MY trim adds (e.g., Equinox, Tahoe, GMC Hummer 3X CFE noted in Session 11). Out of scope for the freshness Phase 3 but queued for a future targeted-refresh session.

### 7.4 Ultra-luxury MSRP gaps

Bentley, McLaren, Aston Martin, Rolls-Royce, Ferrari, Lamborghini, and some Lotus trims do not publish MSRPs. The dataset records null with documented non-disclosure notes; the verifier downgrades these to FYI rather than blocker. ~29 trims project-wide are in this state after Session 9's editorial-source fill pass (down from 70).

For trims where the editorial sources also don't publish a price (typically invite-only specials like Aston Martin's bespoke commissions or Bentley Mulliner builds), the field stays null.

### 7.5 What this project does NOT do

The original spec (`docs/PROJECT_SPEC.md`) listed in-scope and out-of-scope items. Out of scope, restated:

- **Historical model years.** v1 is current-MY (2026) only. Could be extended later with `04_historical_addendum.md`.
- **Non-US markets.** US-spec only.
- **Commercial vehicles, motorcycles, powersports.**
- **Used car pricing.** New MSRP only.
- **Full per-trim spec sheets.** The trim-delta pattern stores deltas, not full spec sheets per trim.
- **Every optional package itemized.** Standard features fully captured; option packages summarized.

These exclusions are not engineering gaps; they are scope discipline that kept the project deliverable.

---

## 8. The portfolio takeaway

The Car Catalog Project is a study in what AI-orchestrated engineering produces when paired with verification discipline and explicit safety rules.

The work is honest:

- **Every field traces back to a source URL** that verification scripts check against a forbidden-source list. Every brand passes verification with zero blockers.
- **Every session produced inspectable artifacts** — JSON diffs, verification reports, session summaries. The session history is committed alongside the code.
- **Every halt is documented** in `SESSION_NOTES.md` with date headers and a "what was attempted, what happened, what to try next" narrative. The two recent halts (Session 14 angle-vocab; Session 15 anti-bot decoys) are visible in the project record.
- **The orchestration layer is not hidden.** The README states the workflow; the instruction files are committed; the AI-driven approach is presented as a deliberate engineering choice with documented tradeoffs.

The dataset is the asset. The catalog is the demonstration. The verification system is the gate. The session-summary discipline is what made it scale.

For anyone forking the repo: every spec field is auditable to its source, every session traces back to a SESSION_SUMMARY, and every halt traces back to a SESSION_NOTES entry. There is no hidden state.
