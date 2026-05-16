# Jeep Phase 3 Image-Scrape Investigation (session 6) — 2026-05-14

## Headline

Coverage lifted from **22.7% (50/220)** to **64.5% (142/220)** — a +41.8-pt absolute,
roughly 2.8x relative — with no shared-script changes and a single brand-config
edit (`scripts/brand-configs/jeep.json`).

Excluding the two Phase-B-flagged discontinued 4xe models (32 entries that are
expected to stay at zero):
- Effective coverage **142 / 188 = 75.5%**

## Diagnosis (Step 1 + 2)

The `reports/phase4_coverage_2026-05-14.md` report classified jeep under "match gap".
The actual diagnostic (`scripts/diag_jeep_candidates.mjs` -> `reports/jeep_candidates_raw.log`)
told a more specific story.

**Slug-matching was not the limiter.** On the original parent-page URLs
(`/<model>.html`), unique-by-URL match rates were already strong:

| model            | unique candidates | matched | match rate |
|------------------|------------------:|--------:|-----------:|
| wrangler         |  8                |  4      | 50%        |
| grand-cherokee   | 12                | 11      | 92%        |
| compass          | 11                | 10      | 91%        |
| grand-wagoneer   | 11                | 10      | 91%        |
| gladiator        | 10                |  9      | 90%        |
| grand-cherokee-l |  7                |  6      | 86%        |

The real problem was twofold:

1. **Candidate-volume gap.** Bare `/<model>.html` pages each carried only 7-12
   unique image candidates. After the 4-angle-pattern filter and per-trim-family
   `used` set, that's not enough to fill 4 angles x 6-8 trims.
2. **Angle-pattern gap.** Hero images on the parent pages have either empty alt
   text or generic marketing copy (e.g. "A blue 2026 Jeep Wrangler Sport...
   with its doors and top removed. Declaration of Deals.") that lacks the
   front/rear/side/interior keywords `ANGLE_PATTERNS` looks for. The image
   filenames likewise read `overview-banner`, `vlp-hero-main`, `colorizer-swatch`
   — none of which match the angle patterns.

The wrangler parent page exemplifies both: 8 unique candidates, 4 slug-matched,
0 angle-matched -> 0 image rewrites -> all 24 wrangler entries stuck on the
parent-page URL -> 0 successful downloads.

## Fix (Step 3)

Edited `scripts/brand-configs/jeep.json` — no changes to `scripts/scrape_image_urls.mjs`.

### model_pages: switch to `/gallery.html` where it exists

Jeep's `/<model>/gallery.html` pages carry 40-60 angle-named candidates with
rich alt text ("rear angle of", "passenger-side profile", "front driver-side
angle", "front end", "interior", "second row") that fires existing
`ANGLE_PATTERNS` at scores 7-14. Switched:

- wrangler, gladiator, grand-cherokee, compass, cherokee, grand-wagoneer ->
  `/<model>/gallery.html`
- grand-cherokee-l now also points at `/grand-cherokee/gallery.html` (it shares
  the body with the standard Grand Cherokee; the 3-row-suv.html marketing page
  has only 6 hero candidates with empty alt text)
- grand-wagoneer-l continues to share `/wagoneer/grand-wagoneer/gallery.html`
  with Grand Wagoneer (no separate L gallery exists on jeep.com)

Models kept on their existing URLs:
- recon (no gallery URL; recon.html already produces 93 candidates -> all 4 angles)
- wrangler-moab-392 (Twelve4Twelve limited edition; no gallery, page is hero-only)
- wrangler-4xe, grand-cherokee-4xe (Phase B-flagged discontinued, both URLs
  return 0 candidates static and via Playwright -> stay at 0)

### slug_variants: distinguish shared-page collisions

- `grand-cherokee-l`: added the URL-filename forms found in 3-row-suv.html
  (`grand-cherokee-3rowl`, `grand-cherokee-3row`, `3rowl`, `3row-suv`) plus
  the bare `grand-cherokee` tokens so the shared gallery's "Grand Cherokee"
  alt text is also claimed by the L (architecturally correct: same body, same
  hero imagery).
- `grand-wagoneer-l`: added the bare `grand-wagoneer` tokens for the same
  reason; both models claim the shared gallery imagery.

### path_blacklist_regex: drop partner-logo noise

Added `fox-factory-logo|jeep-fox-factory` to drop the two partner-logo PNGs that
appeared as no-op nav noise on parent pages.

### Collision check

- `wrangler` (variants: `wrangler`) vs `wrangler-4xe` (variants include
  `wrangler-4xe`, `4xe`): both models claim wrangler.html alt text, but
  wrangler now points at the gallery (54 slug-matches) while wrangler-4xe
  points at its dead 4xe URL (0 slug-matches, escalates to Playwright, still
  0) -> no real collision; the 4xe remains at 0 as intended.
- `grand-cherokee` vs `grand-cherokee-l`: both point at the same gallery URL.
  `grand-cherokee` matches on its bare tokens; `grand-cherokee-l` matches on
  its URL-filename forms AND on the shared `grand-cherokee` tokens. Both
  models independently filter the candidate pool and each runs its own
  per-trim-family `used` set. Result: same hero images applied to both —
  acceptable since they share the body shell.
- `grand-cherokee` vs `grand-cherokee-4xe`: 4xe's variants (`4xe`, `gc-4xe`)
  do not appear in the gallery, so the 4xe pulls only from its own
  (zero-candidate) page -> stays at 0.

## Results (Step 4)

```
node scripts/scrape_image_urls.mjs --brand jeep
node scripts/download_images.mjs  --brand jeep
```

**Scrape (`reports/jeep_scrape_session6.log`):**
- 10 pages attempted (1 model shares URL with another -> de-duped to 10)
- 8 static fetches succeeded with 54-89 slug-matching candidates each
- 2 escalated to Playwright (the two 4xe URLs); both produced 0 candidates
- Image entries rewritten: **137** (up from 50 in Phase C)
- Image entries unchanged: 83 (the page-URL fallback)

**Download (`reports/jeep_download_session6.log`):**
- Total attempted: 220
- Successful: **142 (64.5%)**, up from 50 (22.7%)
- Failed: 78 (all `wrong-content-type` on the page-URL fallback)
- Models with zero downloads: 3 -> wrangler-4xe (Phase B), wrangler-moab-392
  (limited-edition page), grand-cherokee-4xe (Phase B)

### Remaining unresolved (51 entries excluding discontinued 4xe)

- wrangler: 6 entries (all `side_profile` — gallery has no profile-named shots)
- wrangler-moab-392: 4 entries (Twelve4Twelve hero page; no gallery exists)
- grand-cherokee: 16 entries (all `rear_three_quarter` and `interior_dashboard`
  — gallery alts say "head-on angle", "Two girls sitting in the second row",
  none of which fire the existing rear/interior patterns)
- grand-cherokee-l: 16 entries (same as grand-cherokee — shared gallery)
- compass: 5 entries (all `side_profile`)
- cherokee: 4 entries (all `interior_dashboard`)

The remaining gaps are angle-pattern limitations on alt text that uses natural
English ("Two girls sitting in the second row", "head-on angle", "doors and top
removed") rather than CDN convention. Closing them would require either
shared-script changes to angle patterns ("second row" -> interior, "head-on"
-> front) or extended `ANGLE_PATTERNS` entries — out of scope per the brief's
"Conservative on shared script" rule.

## Files touched

- `scripts/brand-configs/jeep.json` (model_pages, slug_variants, path_blacklist_regex, notes)
- `scripts/diag_jeep_candidates.mjs` (new — Step 1 diagnostic, mirrors `diag_mercedes_candidates.mjs`)
- `data/jeep.json` and `catalog/data/jeep.json` (rewritten via scrape + download;
  these are the script's intended outputs, not manual edits)
- `reports/jeep_candidates_raw.log` (Step 1 output)
- `reports/jeep_scrape_session6.log` (Step 4 output)
- `reports/jeep_download_session6.log` (Step 4 output)
- `reports/jeep_phase3_investigation.md` (this file)
