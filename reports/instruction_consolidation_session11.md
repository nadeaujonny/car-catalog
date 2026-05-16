# Instruction Consolidation — Session 11

**Date:** 2026-05-15
**Phase:** P1 of Session 11

## Per-file diff summary

### NEW: `instructions/05_session_runbook.md`

Created from scratch. 200 lines. Captures multi-phase session orchestration meta-rules previously baked into every session prompt:

- §1 Read-first preamble (state file reading order).
- §2 Safety rules (instruction-file edits, _partials untouchable, .bak discipline, save-after-every-operation, ambiguity → SESSION_NOTES.md halt).
- §3 Parallel-subagent decision criteria (when to parallel, when single-threaded, recommended batch sizes).
- §4 Checkpoint design pattern (halt vs continue conditions, halt actions, default halt rule).
- §5 Output conventions (SESSION_SUMMARY_N.md, reports/, SESSION_NOTES.md append-only).
- §6 .bak backup pattern (one-deep, no rotation, PowerShell pattern).
- §7 When to consult which instruction file (cross-reference table).
- §8 Test-your-assumptions lesson (Sessions 5-9 mis-diagnoses with concrete examples).
- §9 Forbidden-source vigilance (grep self-check pattern).
- §10 Common session shapes (A new-brand, B targeted, C maintenance, D consolidation).

### NEW: `instructions/06_maintenance.md`

Created from scratch. 130 lines. Captures periodic maintenance work that doesn't fit Phases 1-4:

- §1 When drift detection is appropriate (opportunistic + scheduled triggers).
- §2 Targeted re-research workflow (per-model refresh without full Phase 1 re-run).
- §3 Image-config rot detection and repair.
- §4 Verifier-found blocker triage (forbidden-source, singleton trim_family, msrp_range mismatch, schema violations, delta_from_base integrity).
- §5 Freshness spot-check pattern (Session 10 Phase D codified).
- §6 When NOT to do maintenance (FYIs, unknown-confidence reliability, structural ceilings, ultra-luxury non-disclosure, recently-researched).

### UPDATED: `instructions/01_research_brand.md`

Changes:

1. Added v3 changelog note at top (lines ~10-15) documenting Session 11 cumulative findings.
2. Added "Sessions 5-10 findings" subsection between "Edge cases" and "Save points" (~25 lines):
   - Common image-scrape blocker patterns (HTML entity encoding, JSON-embedded URLs, extension-less CDN URLs, chassis-code-named CDN paths, specific URL fragments, soft 404 pages, JS-rendering, S3 buckets requiring Referer).
   - Action item: flag unusual URL conventions in trim/model notes during research.

Confirmed intact (no edits needed):
- Forbidden-source list at top of file (§ "Forbidden sources", lines ~41-43). Still in prominent position.
- §4.6 MSRP scoped relaxation for ultra-luxury brands. Wording unchanged.

### UPDATED: `instructions/03_verify_catalog.md`

Changes:

1. Added "Sessions 2-10 additions (cumulative)" subsection at end (~50 lines):
   - Documented optional `angle_url_patterns` and `sources_confidence` config fields.
   - Clarified FYI-vs-blocker rules (ultra-luxury null MSRP, NHTSA/IIHS roll-up URLs, forbidden-source URLs, singleton trim_family).
   - Documented the isDealerDomain false-positive bug surfaced in Session 10 and the Session 11 fix.
   - Added verification-batching recommendation (5–7 brands per subagent).

### UPDATED: `instructions/04_scrape_images.md`

Changes:

1. Added "Validated architecture as of Session 10" subsection at end (~50 lines):
   - Static-first → Playwright fallback (Session 5).
   - `angle_url_patterns` extension (Session 7).
   - Resolution preference (Session 7).
   - `isPlausibleImageURL` extension-less CDN handling (Session 8).
   - HTML entity decode + `cdnRe` `/content/dam/` extension (Session 9).
   - Referer header for Toyota-style S3 buckets (Session 6).
   - Structural ceiling concept (Tesla 0%, Ferrari ~23%, etc.).
   - 5-step single-specific-blocker diagnostic pattern.

### UPDATED: `instructions/00_master_spec.md`

Changes:

1. Bumped version to v1.3 in §12.
2. Added v1.3 changelog entry documenting Session 11 additions.
3. Added optional `sources_confidence` documentation in §4.4 (~8 lines).
4. Added "Brand-config conventions (script-level)" subsection in §8 (~14 lines) documenting `model_pages`, `slug_variants`, `path_blacklist_regex`, `angle_url_patterns`, `accepted_cdn_domains`.

## Line counts (estimated)

| file | lines before | lines after | net |
|---|---:|---:|---:|
| 00_master_spec.md | ~590 | ~615 | +25 |
| 01_research_brand.md | ~660 | ~700 | +40 |
| 03_verify_catalog.md | ~240 | ~290 | +50 |
| 04_scrape_images.md | ~250 | ~300 | +50 |
| 05_session_runbook.md | 0 | ~200 | +200 (new) |
| 06_maintenance.md | 0 | ~130 | +130 (new) |
| **total** | **1740** | **2235** | **+495** |

## Validation

All six instruction files parsed without markdown errors. The two new files (05, 06) are referenced from PROJECT_STATE.md per P1.8 checkpoint (to be confirmed in Phase 4 PROJECT_STATE.md update).

## Outcome

The session-orchestration scaffolding that previously inflated every session prompt is now centralized in 05_session_runbook.md. Future session prompts can drop:

- Read-first preamble (replaced by "see 05_session_runbook.md §1")
- Safety rules list (replaced by "see 05_session_runbook.md §2")
- Parallel-subagent criteria (replaced by "see 05_session_runbook.md §3")
- Checkpoint design pattern (replaced by "see 05_session_runbook.md §4")

This is expected to reduce future session prompts from ~5 pages to ~1-2 pages, with the orchestration boilerplate replaced by phase-specific intent only.
