# 05 — Session Runbook (meta-instructions for multi-phase sessions)

This is a meta-instruction file for running multi-phase Claude Code sessions on the Car Catalog Project. It captures the orchestration scaffolding that previously appeared in every session prompt: read-first preamble, safety rules, parallel-subagent decision criteria, checkpoint design pattern, output conventions, .bak backup discipline, when-to-consult guidance for the other instruction files, and recurring lessons distilled from Sessions 5–10.

This file is not consulted by the per-phase instruction files (00–04, 06). It is consulted by the **session as a whole** when planning multi-phase work.

---

## 1. Read-first preamble

Every multi-phase session starts by reading these state files, in this order:

1. **`PROJECT_STATE.md`** — current totals, what's done end-to-end, what's next, cumulative lessons learned. The single best file to load when picking up a session cold.
2. **The most recent `SESSION_SUMMARY_N.md`** at project root — per-phase outcomes of the prior session, files changed, safety rules observed, "what's next" handoff to this session.
3. **`SESSION_NOTES.md`** (if it exists) — append-only running log of halts, mid-session decisions, and unresolved questions. Read this to know what was deferred and why.
4. **Any phase-relevant `reports/<file>.md`** the prompt mentions — e.g., the prior session's verification summary, freshness check, or per-phase report referenced by the current brief.

Read these before doing any work. The reading is fast (≤2 minutes total) and prevents repeating effort already captured in prior sessions.

---

## 2. Safety rules (consolidated)

These rules apply project-wide unless the session prompt explicitly overrides them:

1. **Instruction file edits are forbidden** unless the current session prompt explicitly authorizes them. The instruction files (`instructions/00_master_spec.md` through `06_maintenance.md`) encode hard-won decisions; drifting them silently fragments project rules across sessions.

2. **`data/_partials/` is untouchable.** This directory holds per-model crash-safety partials (Toyota, Mercedes). Do not read, modify, delete, or reference its contents from within phase work.

3. **Brand JSON mutations require either:**
   - **Gated script-mediated changes** — image scripts (`scripts/scrape_image_urls.mjs`, `scripts/download_images.mjs`) mutate `data/<brand>.json` and `catalog/data/<brand>.json` only when `needs_scraping: true` is set on image entries; they write their own `.bak` files before mutating.
   - **Direct edits** — when a phase requires direct file mutation (e.g., fix-pass replacing a forbidden source URL), the editor MUST first create `data/<brand>.json.bak` and `catalog/data/<brand>.json.bak`. One-deep backups only; do not rotate (.bak.bak).

4. **`data/` and `catalog/data/` must stay in sync.** Any edit to one must be mirrored to the other. The build phase keeps these in sync automatically; manual edits must do this explicitly.

5. **Save after every operation.** After every brand mutation, every instruction file edit, every status update — write to disk. Never batch and save at the end of a phase. The "save after each model" rule from `01_research_brand.md` generalizes: save after each unit of work that can be re-done if context is lost.

6. **If ambiguity arises outside a defined checkpoint, write to `SESSION_NOTES.md` and stop.** Do not improvise. The next session can resume with the diagnosis you wrote down.

---

## 3. Parallel-subagent decision criteria

Multi-phase sessions often parallelize work using subagents (`Agent` tool with appropriate `subagent_type`). The decision to parallelize is not free — coordination has overhead, and shared file mutations introduce race conditions.

**Use parallel subagents when:**
- Tasks are **per-brand-independent** (verification, research, fix-pass on different brand JSONs).
- There are **no shared file mutations** across the parallel work — each agent writes to its own brand JSON or its own report file.
- Scope is **well-defined** — each agent gets a discrete deliverable, not an open-ended investigation.

**Use single-threaded execution when:**
- Tasks **share state** — script changes, instruction file edits, manifest mutations.
- Tasks need **sequential validation** — each step depends on the result of the previous.
- Work is **fast enough that coordination overhead beats parallelism** — under ~30 seconds of work per item, sequential is faster.

**Recommended batch sizes:**
- Verification: 5–7 brands per subagent (Session 4 and Session 10 ran ~38 brands across batches successfully).
- Phase 1 research: 3–5 brands per subagent (research is expensive in context — too many parallel agents inflates token cost without speedup).
- Phase 4 image scraping: 1 brand per subagent (image scripts are network-bound and serialize at the manufacturer-CDN rate limit).
- Script changes: 1 (always single-threaded).
- Brand-config edits: 1 brand per subagent for parallel work, OR all-in-one-session for ≤5 brands.

---

## 4. Checkpoint design pattern

Every phase boundary in a multi-phase session should have a clear **halt** vs **continue** condition.

**When to halt:**
- **Regression** — the operation moved a metric backwards (e.g., a script change reduced image coverage on a control brand).
- **Unexpected magnitude shift** — the result is dramatically larger or smaller than expected, suggesting the diagnosis was wrong.
- **Broken validation** — `node --check` fails, a JSON parses as malformed, schema_version is missing.

**When to continue:**
- **Partial results** are expected and OK — e.g., "3 of 7 brands improved, 4 unchanged at structural ceiling" is a continue, not a halt.
- **Zero progress on a single agent** while others succeed — continue with the successful ones, write the failure to SESSION_NOTES.md.

**Halt actions:**
1. If mutations occurred, restore from `.bak` files.
2. Write the diagnosis to `SESSION_NOTES.md` with a clear date header and "what was attempted, what happened, what to try next."
3. Stop. Do not improvise a workaround.

**Default rule:** if ambiguity arises that is NOT covered by an explicit checkpoint, treat it as a halt — write SESSION_NOTES.md, stop. The next session will resume with your written diagnosis.

---

## 5. Output conventions

Sessions produce three kinds of artifacts: session summaries, phase reports, and brand-level verification reports.

- **`SESSION_SUMMARY_N.md`** at project root. Sequential numbering. Never overwrite a prior summary. Each session writes its own file. Format: headline outcomes, per-phase summary, files changed, safety rules observed, what's next.

- **`reports/<phase_or_topic>_session<N>.md`** for detailed phase reports. Examples: `reports/phase_a_session10.md`, `reports/data_completeness_session10.md`, `reports/instruction_consolidation_session11.md`. These contain per-brand details that would clutter the session summary.

- **`reports/<brand>_verification.md`** for individual brand verification reports. One per brand. Overwritten on re-verification (the file always reflects the latest state).

- **`reports/<brand>_verification_session<N>.md`** for session-specific re-verifications when the standard report is preserved (e.g., a fix-pass session writes session-specific reports so the project history is traceable).

- **`SESSION_NOTES.md`** is **append-only**. Never delete entries. Each new entry gets a date header (`## SESSION N — YYYY-MM-DD`). The file functions as a running log of halts, mid-session decisions, and unresolved questions.

---

## 6. `.bak` backup pattern

Before any direct edit to brand JSON or instruction files, create a backup:

- Before editing `data/<brand>.json`: copy to `data/<brand>.json.bak`.
- Before editing `catalog/data/<brand>.json`: copy to `catalog/data/<brand>.json.bak`.
- `.bak` files are **one-deep**. Do not rotate to `.bak.bak` — overwrite the existing `.bak` instead.
- Scripts handle their own `.bak` (the scrape/download scripts already do this). Manual edits need explicit backup.

**Pre-edit pattern (PowerShell):**
```powershell
Copy-Item data\<brand>.json data\<brand>.json.bak -Force
Copy-Item catalog\data\<brand>.json catalog\data\<brand>.json.bak -Force
# then edit
```

**Rationale:** the `.bak` discipline saved Session 5 (Mini Playwright halt restored without data loss) and Session 7 (Subaru rollback during structural-ceiling investigation). When a mutation goes wrong, the cost of restoring is one Copy-Item; the cost of NOT having a backup is re-running Phase 1 on a brand.

---

## 7. When to consult which instruction file

| File | When to read |
|---|---|
| `00_master_spec.md` | Schema fields, taxonomy values, source hierarchy, edge cases. Authoritative reference. If anything is ambiguous in 01/02/03/04/06, this is the source of truth. |
| `01_research_brand.md` | Phase 1 research workflow. Read when researching a new brand or refreshing a brand's data. Contains the forbidden-source list at the top. |
| `02_build_catalog.md` | Phase 2 build workflow. Read when rebuilding the catalog from brand JSONs (manifest, copy to `catalog/data/`, regenerate index/styles/app if needed). |
| `03_verify_catalog.md` | Phase 3 verification workflow. Read when running verification on one or more brands. Contains the blocker/warning/FYI rules. |
| `04_scrape_images.md` | Phase 4 image scraping workflow. Read when running the image pipeline (scrape + download) for a brand. Contains the script architecture and brand-config conventions. |
| `05_session_runbook.md` (this file) | Multi-phase session orchestration. Read when planning a session that spans multiple phases or involves checkpoints. |
| `06_maintenance.md` | Periodic maintenance. Read when handling drift detection, targeted re-research, image-config rot, or verifier-found blocker triage. |

---

## 8. Test your assumptions (recurring Sessions 5–9 lesson)

Sessions 5 through 9 repeatedly found that a **diagnosis from one session was wrong in the next session.** Examples:

- **Session 6 vs Session 8 — Lotus's blocker.** Session 6 diagnosed Lotus's low coverage as JS-rendering and added Playwright fallback. Session 8 found the real blocker: `isPlausibleImageURL` was filtering out Lotus's extension-less CDN URLs. The Playwright fallback was correct work but didn't address Lotus's actual issue.
- **Session 5 vs Session 5d — Mini's blocker.** Session 5 diagnosed Mini's 10.5% coverage as filename-naming-convention mismatch (F65/F67/U25 codes). Session 5d found the real blocker: a space-vs-hyphen separator bug in `ANGLE_PATTERNS` regex. The diagnosis was half right; the fix was different.
- **Session 7 vs Session 8 — Kia's blocker.** Session 7 added `angle_url_patterns` and 360-spin patterns. Session 8 found the additional issue: HTML entity encoding in Kia URLs. Two layered fixes; the first session's diagnosis was correct but incomplete.

**Heuristic:** when a fix doesn't deliver the expected magnitude, the first move is to **question the diagnosis** rather than refine the fix. Test the assumption that produced the diagnosis. If "the blocker is X," try a minimal experiment that should be sensitive to X and see whether it confirms.

---

## 9. Forbidden-source vigilance

The forbidden-source list in `01_research_brand.md` §4.1 was strengthened progressively (Session 2 moved it earlier in the file; later sessions added domains). But:

- **The original 4-brand cohort** (Toyota, BMW, Honda, Mercedes-Benz, researched before Session 2) still has ~233 historical citations to forbidden domains, surfaced by Session 10's verification batch.
- **The 12-brand overnight batch** (Mini, Genesis, Cadillac, Subaru, Volvo, Volkswagen, Nissan, Kia, Hyundai, Land Rover, Chevrolet, Ford, Session 3) had the warning baked into the prompt and is largely clean.

**Recommendation:** every session that produces or modifies brand JSONs should grep its output for the named forbidden domains before saving. If any appears, fix before save. This is a self-check, not a separate phase.

A grep on the full forbidden list:
```
www\.cars\.com|motor1\.com|carbuzz\.com|autoblog\.com|autoevolution\.com|teslaoracle\.com|carsfrenzy\.net|reddit\.com
```

---

## 10. Common session shapes

The Car Catalog Project has settled into a few common multi-phase session shapes:

**Shape A — New-brand addition.**
1. Viability check (subagent, parallel if multiple candidates)
2. Phase 1 research (parallel subagents per brand)
3. Phase 2 build (single-threaded)
4. Brand-config creation
5. Phase 4 image scrape + download (single-threaded per brand)
6. Phase 3 verification (parallel subagents)
7. Status updates, session summary

**Shape B — Targeted improvement.**
1. Investigation (single-threaded — diagnostic scripts, sample analysis)
2. Brand-config or script-level change
3. Phase 4 re-run on affected brands
4. Re-verification
5. Status updates, session summary

**Shape C — Maintenance.**
1. Read freshness check + verification reports
2. Identify drift / fixable blockers
3. Targeted re-research or fix-pass (single-threaded or parallel as scope dictates)
4. Phase 2 build + Phase 3 verification on affected brands
5. Status updates, session summary

**Shape D — Consolidation / instruction-file work.**
1. Single-threaded (consistency-critical)
2. Per-file edit pass
3. Cross-file consistency check
4. Per-file diff summary report
5. Status updates, session summary

When planning a session, pick a shape and adapt. Don't invent a new shape unless the work truly doesn't fit one of the above.

---

End of runbook.
