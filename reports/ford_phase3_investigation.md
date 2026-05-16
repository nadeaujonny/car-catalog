# Ford Phase 3 Investigation — slug-match gap (2026-05-14, session 6)

## Headline

| | Before (session 5) | After (session 6) | Delta |
|---|---:|---:|---:|
| Image entries downloaded | 82 of 203 | **96 of 203** | +14 |
| Coverage % | 40.4% | **47.3%** | **+6.9 pp** |
| Models with zero downloaded images | 9 | 9 | 0 |
| Pages with ≥3 slug-matching candidates (static) | 17 / 21 | **18 / 21** | +1 |
| Pages escalated to Playwright | 0 | 3 | +3 (all failed with HTTP2 protocol error from Ford CDN) |

The fix was **purely config-level** — `scripts/brand-configs/ford.json` slug_variants. No `scripts/scrape_image_urls.mjs` changes.

## Root-cause diagnosis (what was in those 600-2199 candidates)

I dumped raw candidates from 6 representative pages (`scripts/diag_ford_candidates.mjs` → `reports/ford_candidates_raw.log`, 12,350 lines). Findings:

1. **Ford.com asset filenames use internal product codes that the default slug_variants don't match.** ford.com names its CDN assets like `26_FRD_BRS_43A7435_outb_ruby_desktop.webp` (`BRS` = Bronco Sport), `26_FRD_MME_68780.webp` (`MME` = Mustang Mach-E), `25_FRD_MST_61003.webp` (`MST` = Mustang), `26_FRD_FSD_*` (`FSD` = Ford Super Duty), `25_FRD_F15_64400_*` (`F15` = F-150 abbreviated without the trailing zero). The default `bronco-sport` slug variant matched only filenames where `bronco-sport` or `broncosport` appeared with a separator after — about 294/1794 candidates on the bronco-sport page. Adding `brs`, `bros`, `bspt`, `broncosport` raised that to 1010/1794.

2. **Trademark symbols (®, ™) immediately after the model name in alt-text block the trailing word-boundary in `slugMatchesURL`.** The regex `(^|[/_ -])fragment([/_ -]|\.|$)` rejects `Mustang®` / `F-150®` / `Bronco®` / `Mach-E®` because `®` isn't in `[/_ -]|\.|$`. On the Mach-E page, 135 candidates have `Ford Mustang Mach-E®` in their alt-text but missed the match; only 74 with hyphen/space alt-text variants matched. Same pattern on every Ford model page. **I considered a script-level fix here but chose not to** — see the "considered but rejected" section below.

3. **CamelCase trim concatenation also blocks matching.** Filenames like `F-150KingRanch_1.webp` or `F250XL_v1.webp` have the trim code glued onto the model identifier with no separator. The default `f-150` variant won't match `F-150K…` and `f250` won't match `F250XL…`. I added explicit variants for the most common concatenations (`f250xl`, `f250lariat`, `f250tremor`, etc.).

4. **Sub-page nav-hub pollution is real but the angle scorer is the dominant downstream blocker.** The 5 sub-pages (mustang/dark-horse, mach-e/rally, bronco/raptor, ranger/raptor, f150/raptor) are mostly nav hubs that surface 600 candidates dominated by *other* Ford model thumbnails. Slug-match was 0-22 candidates per page before; now 0-33 (the raptor sub-pages still have HTTP2 protocol errors on Playwright escalation, which is a Ford CDN issue not a config issue). But even where slug-match is plentiful (escape: 112 matches, explorer: 285, expedition: 175), 13/11/8 entries remain unresolved because `ANGLE_PATTERNS` can't find `front`/`rear`/`side`/`interior` words in Ford's descriptive alt-text ("parked on a rocky hillside", "being driven on a highway") and Ford uses direction codes like `_dr34_` / `_dr78_` / `_ps34_` in its filenames that aren't in the angle patterns.

## What was added to scripts/brand-configs/ford.json

```
mustang              + "mst"
mustang-dark-horse-sc + "dhsc"
mustang-mach-e       + "mme"
mustang-mach-e-rally + "mme-rally"
bronco               + "bro"
bronco-sport         + "broncosport", "brs", "bros", "bspt"
bronco-raptor        + "bro-rptr", "bronco-rptr"
ranger-raptor        + "rgr-rptr", "ranger-rptr"
f-150                + "f15"
f-150-raptor         + "f150-rptr", "f15-rptr", "f15-raptor"
f-150-raptor-r       + "f150-rptrr", "f15-rptrr"
f-150-lightning      + "lightninglux"
f-250-super-duty     + "f250-superduty", "f250xl", "f250xlt", "f250lariat", "f250tremor", "f250kr"
f-350-super-duty     + "f350-superduty", "f350xl", "f350xlt", "f350lariat", "f350tremor", "f350kr", "f350lar"
f-450-super-duty     + "f450-superduty", "f450xl", "f450xlt", "f450lariat", "f450kr"
```

## Cross-model collisions vetted

The dangerous pairs and the specific test that excludes each false positive:

| pair | does collision fire? | why not |
|---|---|---|
| `bro` matching `bronco-sport` URLs (e.g. `Bronco_Sport_Big_Bend`) | NO | after `bro` is `n`, not in `[/_ -]\|.\|$` |
| `bro` matching `_BRS_` or `_BROS_` filenames | NO | after `bro` is `s` (or position misaligned), not boundary |
| `broncosport` matching `bronco` slug regex | NO | `bronco` slug regex requires boundary after `bronco`; in `broncosport` the next char is `s` |
| `bronco` matching `_broncosport_` filename | NO | same — `s` after `bronco` blocks the trailing boundary |
| `f15` matching `_F150_` filenames | NO | after `f15` is `0`, not boundary |
| `f15` matching `F-150` in alt-text | NO | after `f15` is `0` (the regex is case-insensitive and scans through `F-150` as `f-15` then `0`) |
| `dhsc` matching `dark-horse` slug regex | NO | `dark-horse` regex needs `[-_ ]` between `dark` and `horse`; `dhsc` has neither — different token shape entirely |
| `mst` matching outside of `_MST_` cassettes | NO | only fires on `_MST_` / `_mst_` patterns Ford uses on Mustang assets (verified across 12k candidate dump — no false friends in other Ford content) |

## Sample matches (after fix)

```
[ 7.0] mustang/ecoboost-fastback/front_three_quarter
       → assets.ford.com/.../26_frd_mst_tld_17A2998.webp
       (alt: "high-gloss black grille with Sinister Bronze inserts and body-color front bumper")
[ 7.0] bronco-sport/big-bend/front_three_quarter
       → assets.ford.com/.../26_FRD_BRS_64854_outb_pltblu.webp
       (matched via new "brs" variant — would have missed otherwise)
[ 7.0] f-150/xl/front_three_quarter
       → assets.ford.com/.../24_FRD_F15_62098.webp
       (matched via new "f15" variant)
[ 7.0] bronco/base/front_three_quarter
       → assets.ford.com/.../2025_Bronco_Stroppe_Special_Edition_18.webp
       (matched via existing "bronco" variant; alt "side-of body" gave the "side" angle a hit too)
[12.0] f-250-super-duty/xl/interior_dashboard
       → assets.ford.com/.../26_FRD_FSD_64981_F250_PltPlus_SmkTru.webp
       (matched via existing "f250" — already worked, included for reference)
```

## Remaining problems (107 entries still unresolved)

Distribution of the 107 unresolved by angle:

- `front_three_quarter`: ~55 (the largest bucket — Ford rarely uses the word "front" in filenames or alt-text)
- `side_profile`: ~25 (Ford uses "side" almost never, except `_Passenger_Side` in interior shots which already match)
- `rear_three_quarter`: ~12
- `interior_dashboard`: ~15

These are **not slug-match misses**. They are angle-scorer misses: the page has plenty of slug-matching candidates but none of them carry a recognised angle word. Two structural fixes are possible (both would be script-level):

1. **Recognize Ford's direction codes in the angle-pattern table.** Ford's CDN filenames encode angle as `_dr34_` (front three-quarter), `_dr78_` (rear three-quarter), `_ps34_` (passenger-side three-quarter). I observed these on escape, explorer, expedition jellybean URLs (e.g. `26_frd_epr_actv_ps34_wrk-min.png`). Adding regex rules for `dr3[-_ ]?4|dr34|ps3[-_ ]?4|ps34` (front three-quarter), `dr7[-_ ]?8|dr78|ds7[-_ ]?8` (rear three-quarter) to `ANGLE_PATTERNS` would cleanly score these. This is Ford-CDN-specific; I am NOT sure it benefits 2+ other brands (other brands tend to use English angle words). I would NOT recommend this as a multi-brand script change but as a Ford-specific second-pass approach.

2. **Allow ®, ™, ©, and possibly comma as trailing word boundaries in `slugMatchesURL`.** The 135 Mach-E + ~300 Bronco + ~140 F-150 alt-text candidates that contain `Model®` could match via alt-text alone if the regex trailing class were `[/_ -]|[®™©]|\.|$`. This is a small, low-risk change and I confirmed it would help (1) ford definitively, (2) jeep — `https://www.jeep.com/wrangler.html` contains 78 `®` occurrences. But on a quick pass of mazda/ram/hyundai/toyota first pages, I did NOT find model-name-with-trademark alt-text — those brands seem to use trademarks more on tech features than on the model name itself. So the multi-brand benefit case is **at least 2 brands (ford, jeep)** but not the dominant pattern across the catalog. I left this on the table for a future session per the task brief's "strong preference for config-level fixes."

## Considered but rejected

- **Adding `fsd` and `superduty` generic variants to all three Super Duty slugs.** This would have cross-attributed generic Super Duty hero images to all 3 of f-250/f-350/f-450, including model-mismatched images. Instead I added trim-concatenated variants like `f250xl`/`f350tremor` so each Super Duty model only catches its own variant-tagged filenames.
- **Loosening angle patterns to fire on words like "pickup", "hero", "lifestyle".** Would cause many false positives where the picked URL has zero relationship to the requested angle. Better to leave entries unresolved than to seed wrong images.
- **The script-level trademark-boundary fix** (allowing `®`/`™` as trailing boundaries in `slugMatchesURL`). Conservative, helps Ford + Jeep definitively. Deferred to a future session per the task's preference for config-only.

## Files touched

- `scripts/brand-configs/ford.json` — slug_variants expanded as above, plus a session-6 note explaining the rationale and the collision-vetting summary.
- `scripts/diag_ford_candidates.mjs` (NEW, diagnostic — safe to delete) — dumps raw candidates from 6 representative Ford pages with MATCH/MISS labels relative to the current config.
- `data/ford.json` and `catalog/data/ford.json` — rewritten by `scrape_image_urls.mjs --brand ford` and then by `download_images.mjs --brand ford`. 96 URL changes vs prior; `downloaded:true` flag set on the 14 newly-resolved entries (one-deep .bak backups in place).

## Logs

- `reports/ford_candidates_raw.log` — diagnostic dump (12,350 lines).
- `reports/ford_scrape_session6.log` — final scrape run, 96 rewritten / 107 unchanged.
- `reports/ford_download_session6.log` — final download run, 96/203 successful (47.3%).
