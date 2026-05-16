# Phase A Session 10 — Targeted image investigation

Single-threaded per-brand judgment on 10 brands at <80% coverage; brand-config-level fixes where supported by visual verification.

## Headline

| metric | Session 9 final | Session 10 Phase A | Δ |
|---|---:|---:|---:|
| project-wide image coverage | 3,111 / 4,369 (71.21%) | 3,165 / 4,369 (72.43%) | **+54 entries / +1.22pp** |
| brands ≥80% image coverage | 19 | 20 | +1 (GMC joined) |
| brands 50-80% image coverage | 11 | 11 | 0 (Rolls-Royce joined; GMC left) |
| brands <50% image coverage | 11 | 10 | -1 (Rolls-Royce left) |

## Per-brand outcomes

| brand | Session 9 | Session 10 | Δ | mechanism |
|---|---:|---:|---:|---|
| mercedes-benz | 32.49% | **40.06%** | **+7.57pp** ★ | Config: `[-_]HC(?:-D)?\.(?:jpe?g\|png\|webp\|avif)` brand pattern for front_three_quarter (visually verified HC-D = front 3/4 on C-Class, CLE-Coupe; HC.jpg = front 3/4 on CLA byo-options). +24 entries via brand-specific angle match. |
| gmc | 75.96% | **85.58%** | **+9.62pp** ★ | Config: added `yukon` to yukon-xl's slug_variants (yukon-xl shares the /suvs/yukon page with no XL-specific imagery, same precedent as grand-cherokee-l sharing the Grand Cherokee gallery). +20 entries. Crossed B→A tier. |
| rolls-royce | 39.47% | **65.79%** | **+26.32pp** ★★ | Config: Black Badge models' URL paths use `bb-ghost-sii`, `bb-spectre`, `bb_cullinan_s2` (not `ghost-black-badge` etc.). Added the path-pattern slug_variants. +10 entries. Crossed C→B tier. |
| ford | 47.78% | 47.78% | 0 | Submodel pages (dark-horse, dark-horse-sc, gtd) have sparse candidate pools with action-shot imagery not labeled by angle. jellybean `_ps34_` token appears only on parent /cars/mustang/ where front_three_quarter is already matched via alt text. Structural ceiling at the submodel-page level. |
| ram | 44.32% | 44.32% | 0 | rear_three_quarter / interior_dashboard genuinely not published on ramtrucks.com static pages for ram-2500/ram-3500 (verified via candidate-token scan). Session 7+9 work already at ceiling. |
| kia | 70.31% | 70.31% | 0 | rear_three_quarter `/360/18.png` URLs are NOT in static HTML; only frames 04 (side) and 36 (front) appear. Frame 18 (rear) requires JS spin viewer interaction. interior shots are color swatches, not actual dashboards. Structural ceiling under static fetch. |
| mazda | 63.10% | 63.10% | 0 | Session 7 notes confirmed: rear_three_quarter hero shots are per-model-variable (cx-30/cx-50/m3-sedan are front; cx-70/cx-90/mx-5-rf are rear). No reliable brand-wide URL token. Structural ceiling without per-model patterns. |
| jeep | 64.55% | 64.55% | 0 | wrangler-4xe and grand-cherokee-4xe pages have 0 slug-matching candidates (4xe-specific pages don't host model imagery; 4xe pages redirect to parent overview pages without 4xe-specific imagery per Session 6 notes). Re-pointing to parent gallery would mean 4xe trims claim ICE imagery — flagged in jeep.json notes for human review, not auto-applied. |
| alfa-romeo | 71.43% | 71.43% | 0 | Giulia and Tonale pages have NO rear/back URLs at all in static HTML. Structural ceiling (Session 9 finding reconfirmed). |
| maserati | 45.83% | 45.83% | 0 | Grecale, Granturismo, Grancabrio pages don't expose all 4 angles in static HTML (interior is typically tab-content-loaded). Structural ceiling. |

## Cross-brand patterns observed

### "Single specific blocker" wins

Three brands had clean, single-pattern blockers that yielded +10pp or more:

1. **Mercedes-Benz HC-D / HC convention** (front_three_quarter): The class-page CDN uses HC-D.jpg or HC.jpg as the front-3/4 hero filename. Standard ANGLE_PATTERNS find no match because alt text is just the model name ("C-Class Sedan"). Brand pattern at score 6 cleanly fills the gap.

2. **GMC yukon-xl slug_variants gap**: yukon-xl shares the /suvs/yukon page with no XL-specific imagery; the slug_variants need to include the parent name as well. Same precedent as Jeep's grand-cherokee-l (Session 6).

3. **Rolls-Royce Black Badge URL paths**: BB Ghost lives at `/bb-ghost-sii/`, BB Spectre at `/bb-spectre/`, BB Cullinan at `/bb_cullinan_s2/`. The slug_variants for `ghost-black-badge` (etc.) didn't include any of these path tokens. Adding them via config (no script change) lifted all 3 BB models simultaneously.

### Confirmed structural ceilings

Seven brands showed no clean fix at this pass:

- **Ford**: submodel pages (dark-horse, dark-horse-sc, gtd) have sparse candidate pools with action-shot imagery; jellybean `_ps34_` token is parent-only.
- **Ram**: rear/interior tokens not present in ramtrucks.com static HTML for ram-2500/ram-3500.
- **Kia**: rear_three_quarter frame 18 in `/360/<NN>.png` spin is not statically referenced; loaded only via JS spin viewer. Interior URLs are color swatches.
- **Mazda**: rear hero convention varies per model (no brand-wide URL token).
- **Jeep**: wrangler-4xe and grand-cherokee-4xe pages don't host model-specific imagery; sharing with parent ICE would require data-integrity human review.
- **Alfa Romeo**: Giulia/Tonale pages publish no rear URLs.
- **Maserati**: interior URLs typically tab-content-loaded, not in static HTML.

## Script change verification (Phase A2)

The brief asked whether Session 9's HTML-entity decode + cdnRe `/content/dam/` extension help any brand beyond Kia/Ram. Re-scraped Cadillac and Chevrolet (both AEM /content/dam/-using brands):
- **Cadillac**: 75.6% → 75.6% (no change). Cadillac's AEM URLs do not use HTML-entity-encoded quotes; the existing extractCandidates regexes already see them.
- **Chevrolet**: 88.9% → 88.9% (no change). Same finding.

Conclusion: Session 9's script change is Kia/Ram-specific in its impact. Other AEM brands (Cadillac, Chevrolet, GMC, Buick) don't HTML-entity-encode their JSON data layers, so the pre-decode is a no-op for them.

## Files changed in Phase A

### Brand-config edits

- `scripts/brand-configs/mercedes-benz.json` — added `angle_url_patterns.front_three_quarter` with `[-_]HC(?:-D)?\.(?:jpe?g|png|webp|avif)`
- `scripts/brand-configs/gmc.json` — added `yukon` to yukon-xl's slug_variants (and de-duplicated the entry)
- `scripts/brand-configs/rolls-royce.json` — extended slug_variants for ghost-black-badge / spectre-black-badge / cullinan-black-badge with path-pattern tokens

### Brand JSON edits

- 5 brands re-scraped + re-downloaded with .bak backups: mercedes-benz, gmc, rolls-royce, cadillac (validation re-run), chevrolet (validation re-run)
- Other Phase A brands (ford, ram, kia, mazda, jeep, alfa-romeo, maserati) NOT re-scraped — no config/script changes warranted

### New diagnostic script

- `scripts/diag_phase_a_session10.mjs` — generic Phase A verbose extraction-pipeline diag (raw → slug-match → angle-match → gap pool)

## Checkpoint posture

Brief's A4: "succeeds regardless of magnitude — even 'nothing more is fixable, here's the structural ceiling per brand' is valuable. Proceed to Phase B in all cases EXCEPT if Phase A makes a script change that causes regression on brands not currently being investigated."

Phase A made ZERO script changes (only brand-config edits, all additive). No regression possible on out-of-scope brands. Proceed to Phase B.
