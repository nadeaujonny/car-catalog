# Persistent low-coverage brands (Phase 4 image scrape)

**Updated 2026-05-15 (Session 8).** Previous versions of this list (Sessions 5-7) included 3-5 brands. Session 8's `isPlausibleImageURL` extension-less-CDN relax (Phase B) unblocked the URL-filter-blocked brands; the list now narrows to **a single brand: Tesla**.

Brands listed here have a structural reason their coverage stays low — fixing them would require either a script-level change beyond this session's scope, accepting a non-manufacturer image source (against project policy), or simply manual image collection.

## Definition of "persistent low coverage"

A brand whose Phase 4 download coverage stays below 50% after every pipeline-level fix to date has been applied, AND whose remaining failure mode is **diagnosed and out of pipeline reach** rather than "we haven't tried yet."

## Brand on the list

### Tesla — 0% (0 of 64 image entries)

**Failure mode:** hard 403 anti-bot blocking on both the static fetch and the headless Chromium fallback. Both `tesla.com/<model>` and `shop.tesla.com/<model>` return 403 to any non-interactive client the scraper has tried, including a desktop UA Chromium with a populated viewport and locale. Session 8's filter relax did not help — the block is at the HTTP transport layer, upstream of any URL filtering.

**Evidence:** Session 5's Phase C report at `reports/phase4_coverage_2026-05-14.md` row tesla notes "5f" Playwright escalations (all 5 failed). Phase B URL check (using browser-UA plain fetch) returned 200 — Tesla's anti-bot kicks in on the second request from the same client, gating the actual page-content fetch.

**Recommended approach:** **accept as placeholder-only** OR **relax the manufacturer-only sourcing policy for Tesla specifically**. No pipeline-level fix can help. Adding Tesla images would require either:
- Acquiring cookies from an authentic browser session and feeding them to Playwright (out of scope; brittle; against the "non-interactive pipeline" principle), or
- Relaxing the manufacturer-only image policy specifically for Tesla (a project-direction decision, not an engineering one).

A trim.notes addendum acknowledging the gating is the project's honest answer for now.

## Brands removed from this list in Session 8

### Ferrari — was 2.1% (Session 7), now 22.9% (Session 8)

**Session 7's "JS-rendered, no usable signal" diagnosis was wrong.** Ferrari emits real image URLs from `ferrari-view.thron.com` (Thron CDN), but the URLs lack file extensions and were filtered upstream by `isPlausibleImageURL`. Session 8's filter relax accepted these (481 candidates), and the existing English ANGLE_PATTERNS matched alt text correctly. Ferrari now resolves 11 of 48 entries.

The remaining gap (22.9% — still under 50%) is a thin-candidates issue per model page, NOT a pipeline failure. Some Ferrari model pages still emit 1-8 images per page; the matcher handles them correctly but the candidate pool is limited.

### Lotus — was 0% (Session 7), now 75.0% (Session 8)

**Session 7's diagnosis was correct** ("extension-less Sitecore CDN URLs filtered by `isPlausibleImageURL`") and was explicitly flagged as a future-session engineering item. Session 8 implemented the relax, plus a scroll-depth bump and brand-specific slug_variants for Eletre/Emeya. Lotus now resolves 18 of 24 entries. Emeya is the remaining 0% submodel (4 of the 6 missing entries) — its alt text uses internal "AlphaPDP" codes that even the relax + extended slug_variants don't fully catch.

### Hyundai — was 28.3% (Session 7), now 86.8% (Session 8)

**Session 7's angle_url_patterns work was correct and partial.** The patterns lifted Hyundai 0% → 28.3%, but the remaining gap was extension-less Adobe Scene7 URLs with `fmt=webp` query parameter — filtered by the same isPlausibleImageURL check. Session 8's relax caught these, and Hyundai jumped to Tier A.

### Subaru — was 9.2% (Session 7), now 72.5% (Session 8)

**Session 7's pickByPosition diagnosis was correct in spirit but wrong about the mechanism.** Subaru's side_profile imagery was indeed recoverable, but via a different lever: the filter relax caught Subaru's Sitecore Content Hub URLs, and the existing English ANGLE_PATTERNS then matched alt text directly. No pickByPosition change was needed.

## Brands at <50% coverage but NOT classified "persistent low coverage"

These brands have known, diagnosable blockers that could respond to future per-brand engineering. They are NOT pipeline-systemic failures.

| Brand | Coverage | Root cause | Improvable via |
|---|---:|---|---|
| Ford | 47.3% | Thin candidate pools on F-150 Raptor R + Super Duty (shared-template pages) | Replace shared-template URLs with model-specific URLs |
| Maserati | 45.8% | scene7 desktop variant URLs returning 403 on some Folgore models | Brand-specific URL pattern tweaks |
| Lamborghini | 41.7% | Thin candidate pools; some pages are configurators | Replace configurator URLs with gallery URLs (per session 6 Jeep precedent) |
| Polestar | 41.7% | Only 2 models / 12 entries; small denominator | Each individual unresolved entry has outsize % impact |
| Rolls-Royce | 39.5% | Several URLs resolve to text/html placeholder pages | Per-model URL tuning |
| Volkswagen | 38.8% | Relax accepted ext-less URLs but resolved to same files; thin underlying imagery | Per-brand investigation |
| Ram | 33.0% | Session 7 patterns catch front but rear/side/interior URL tokens differ | Extended angle_url_patterns for rear/side/interior |
| Mercedes-Benz | 32.5% | mbusa.com CDN gates static + Playwright on most image URLs; press subdomain helps partially | Move to press subdomain entirely; or accept policy gap |
| Land Rover | 31.9% | defender-octa + discovery model pages have 2-3 raw candidates only | Replace thin-candidate-pool URLs with gallery URLs |
| Kia | 25.0% | Session 7 patterns + Session 8 relax catch some but not all angles | Extended angle_url_patterns for additional angle/URL idioms |
| Ferrari | 22.9% | Thin per-page candidate pool after URL filter relax | Per-model URL tuning |

## Project-policy decision points (for human)

Now that the filter-relax has unblocked the previously "structurally pipeline-blocked" Ferrari + Lotus, the project's policy question simplifies:

**Single remaining question: is the manufacturer-only image policy worth holding for Tesla?** If yes: live with 0% Tesla coverage. If no: relax the policy specifically for Tesla.

The other <50% brands are individually-solvable engineering problems — each has a specific blocker that a future per-brand investigation could address. None of these require a policy decision; they require time.

## Project-wide coverage trajectory

| Session | Project-wide % | Brands at ≥50% | Brands at <50% |
|---|---:|---:|---:|
| Session 5 (post-Phase-C) | 55.6% | 23 | 18 |
| Session 6 (post-C-bis) | 62.3% | 26 | 15 |
| Session 7 (post-A+B+repair) | 65.2% | 26 | 15 |
| **Session 8 (post-relax)** | **70.3%** | **29** | **12** |

The project is at functional completion under the stated manufacturer-only source policy. Continued work is optional.
