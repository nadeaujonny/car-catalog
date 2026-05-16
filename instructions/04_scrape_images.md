# 04 — Scrape and Download Images for a Brand (Claude Code instructions)

You are working on the Car Catalog Project. This phase resolves image-URL placeholders left by Phase 1, downloads the resulting image assets, and updates the brand JSON with download status. Phase 1 often stores manufacturer page URLs (with `needs_scraping: true`) when CDN access fails at research time. Phase 4 turns those into real image asset URLs and downloads them.

**Input parameter:** a brand name (e.g., "Honda") provided at the bottom of this message.

**Output:**
- Updated `data/<brand_slug>.json` and `catalog/data/<brand_slug>.json` with direct image asset URLs and `image.downloaded: true` flags.
- Image files saved under `catalog/images/<brand_slug>/<model_slug>/<trim_family>/<angle>.<ext>`.
- `reports/<brand_slug>_image_scrape.md` documenting what worked, what didn't, and why.

This file is self-contained. The full canonical spec is `instructions/00_master_spec.md`.

---

## Operating principles (read first)

1. **Two steps, in order: scrape then download.** Scrape rewrites image URLs in the JSON. Download fetches those URLs as binary files. Don't skip the scrape — Phase 1 may have left page URLs that download cannot use.

2. **Use existing scripts, do not rewrite them.** The project has `scripts/scrape_image_urls.mjs` and `scripts/download_images.mjs`. They take a `--brand <slug>` argument and read per-brand configuration from `scripts/brand-configs/<slug>.json`. If a config file for the requested brand doesn't exist, your job is to create it (see Step 1 below) — not to modify the scripts.

3. **No fabrication.** If scraping yields no good image for a trim/angle, leave the entry alone and report it. If download returns 403/404/timeout, record the failure and move on. Never substitute placeholder images or stock photos. The site renders gracefully when images are missing.

4. **Allowed sources match Phase 1.** Manufacturer CDN, manufacturer press, manufacturer consumer site (parsed). No Wikimedia, no third-party galleries, no forum images. Same rules as Phase 1 §2e.

5. **Save points are automatic.** The scripts write JSON after each run completes. If a script crashes, the partial state is still useful — re-run is idempotent.

6. **Report honestly.** A brand with a 40% download success rate is still useful, because the site falls back to placeholders for missing images. Don't pad the report; state the real numbers and per-model breakdown.

7. **Headless-browser rendering (Playwright) is permitted for image-URL extraction** when static `fetch()` doesn't yield enough matches. Use it as a fallback, not a default — try static fetch first. The goal is to access what customers' browsers already see, not to circumvent any controls. This permission is narrow: image-URL extraction only, not spec data (the source hierarchy in `00_master_spec.md` §4 remains authoritative for spec data), and not authentication or rate-limit bypass.

---

## §A. Tiered source allowlist for image scraping (added Session 14)

This subsection scopes a relaxation of the manufacturer-only image source policy. **The relaxation applies to image scraping only — the source hierarchy for spec data in `00_master_spec.md` §4 is unchanged.** Spec sources (sources maps, professional_reviews.links, MSRP citations, EPA citations, safety citations) continue to follow the existing rules; the forbidden-source list in `03_verify_catalog.md` Step 1 remains in force for those fields.

The relaxation addresses a small set of brands whose manufacturer image infrastructure is structurally unreachable under the prior policy: Tesla (hard HTTP 403 anti-bot), Ferrari (~23% under prior policy), Land Rover (~32%), Mercedes-Benz (~40% on interior shots behind configurator gate), and several others diagnosed in `reports/persistent_low_coverage_brands.md`. The structural ceiling is real — the manufacturer simply doesn't expose these images publicly — and the project's catalog rendered with placeholder fallbacks for the gaps. This relaxation accepts a narrow set of press-syndicate and editorial-hero-photography sources where the originating photography is verifiably the manufacturer's own press kit.

### Tier 1 — manufacturer and manufacturer-affiliated distribution (existing, always allowed)

- Manufacturer CDN domains (`cdn.<brand>.com`, `media.<brand>.com`, `*.aem.<brand>.com`, `<brand>.scene7.com`, `assets.<brand>.com`, `images.<brand>.com`)
- Manufacturer press / media subdomains (`press.<brand>.com`, `<brand>news.com`, `pressroom.<brand>.com`, `media.<brand>.com`, `newsroom.<brand>.com`)
- Manufacturer consumer sites (only when image asset URLs can be extracted from page HTML and verified as image content-type)
- OEM-affiliated dealer information portals (e.g., `<brand>infocenter.com`)
- Manufacturer build-and-price API endpoints (these serve the same images as the consumer site through a different endpoint; treated as Tier 1)

### Tier 2 — press-kit aggregation and reputable automotive press hero photography (newly allowed)

- **NetCarShow.com** — republishes manufacturer press kits verbatim with clean direct image URLs (`netcarshow.com/cars/<year>-<make>-<model>/...`)
- **CarScoops** — `official` / press-release-tagged sections only (NOT general galleries or rumor posts)
- **Car and Driver, MotorTrend, Road & Track, Automobile, Hagerty** — model-overview pages or spec-page hero shots only, where the publication has clearly sourced from a manufacturer press kit (the photo's EXIF or `<img>` alt text reads as press-kit hero photography, not a road-test paparazzi shot)
- **Edmunds** — editorial pages on `/<make>/<model>/<year>/` paths (NOT `/<make>/<model>/inventory`, NOT `/used-cars/`, NOT `/pricing-tools/`)

### Tier 3 — manufacturer parts/configurator endpoints (newly allowed)

- Manufacturer build-and-price configurator JSON endpoints that serve direct image URLs (e.g., Tesla configurator JSON endpoints exposing the same `digitalassets.tesla.com` paths the customer-facing configurator uses)
- These are technically the same source as Tier 1 consumer sites but accessed through a different surface — the consumer page is JS-gated, but the underlying API endpoint serves clean JSON with embedded image URLs. Categorized as Tier 3 (separate from Tier 1) to make the access pattern auditable in provenance records.

### Explicitly forbidden under this relaxation (unchanged from existing rules)

- **Wikimedia Commons, Wikipedia** (the original Civic Hatchback incident source — pulled an old UK-market sedan as "2026 Civic Hatchback")
- **KBB image galleries, Cars.com images, Autotrader** (dealer-aggregator surfaces)
- **Carbuzz, Motor1 galleries, Autoblog galleries, AutoEvolution** (content farms; their "official" tagging is unreliable)
- **Forums, Reddit, enthusiast wikis, *.fandom.com**
- **Generic stock photo sites** (Getty, Shutterstock, etc.)
- **Dealer websites and dealer-operated blogs** (matched by `isDealerDomain` heuristic on hostname)

### Provenance requirements

Every image entry MUST record:

- **`source_tier`**: 1, 2, or 3 (integer). Tier 1 is the default for entries already in the JSON before this relaxation.
- **`source_domain`**: the hostname the image was sourced from (e.g., `"netcarshow.com"`, `"digitalassets.tesla.com"`, `"caranddriver.com"`).

For Tier 2 and 3 sources: a brief note in the trim's `notes` field documenting the fallback. The note is added **once per trim** (not once per image), and reads:

> "Hero photography fallback from `<source_domain>` (Tier `<N>`); manufacturer images unavailable for some angles."

This makes the provenance auditable at the trim level without bloating every image entry.

### MY/model verification at scrape time

For Tier 2 sources, the scraper MUST verify that the source page URL contains the current model year (e.g., `/2026/` or `/2026-` or `-2026.`) before accepting candidates. Pages that don't match the current MY are skipped — old MY photography of the same nameplate is not acceptable substitution. Examples that PASS:

- `netcarshow.com/cars/2026-ferrari-amalfi/`
- `caranddriver.com/ferrari/amalfi/2026/`

Examples that FAIL (skipped):

- `netcarshow.com/cars/2024-ferrari-roma/` (wrong year; the nameplate may have changed)
- `caranddriver.com/ferrari/roma/2023/` (wrong year)

The brand config provides the current MY for each model via the existing `data/<brand>.json` `model.model_year` field; the scraper reads it before each Tier 2 lookup.

### Order of preference

The scraper MUST attempt sources in this order, and MUST NOT escalate to a lower tier when a higher tier has produced sufficient coverage:

1. **Tier 1 static fetch** (existing behavior — first attempt)
2. **Tier 1 Playwright fallback** (existing behavior — when static fails)
3. **Tier 3 manufacturer configurator endpoints** (new — when Tier 1 fails AND `tier3_endpoints` is configured for the brand)
4. **Tier 2 sources** (new — only when Tier 1 and Tier 3 have been exhausted for the affected angles)

The scraper SHOULD NOT escalate to Tier 2 if Tier 1 already provided at least 2 of the 4 required angles for a trim family — partial coverage from a higher tier is better than mixed-tier coverage. Mixed-tier coverage is allowed only when the higher tier produced fewer than 2 of 4 angles.

### Cross-reference to §4.6 of `01_research_brand.md`

The §A relaxation is structurally parallel to the §4.6 MSRP scoped relaxation in `01_research_brand.md`: both narrow exceptions to a strict source policy, both require explicit provenance recording (`sources_confidence` for MSRP, `source_tier` + `source_domain` for images), both apply only when the strict source is verifiably unreachable. The two relaxations are independent — §A relaxes image sources for any brand where Tier 1 is insufficient; §4.6 relaxes MSRP sources only for ultra-luxury brands with documented manufacturer non-disclosure. A given brand may use both, one, or neither.

### NetCarShow positional heuristic (Session 15, HALTED — anti-bot decoy)

**Status:** Implemented in `scripts/scrape_image_urls.mjs` but disabled in practice for NetCarShow. Session 15's Phase 2 validation found that NetCarShow serves anti-bot decoy images (multi-colored pixel noise) to the scrape/download script. The downloaded files are valid JPEG/AVIF binaries with realistic sizes but contain no real photography. NetCarShow's bot-detection requires real-browser context (JS execution, persistent cookies, full navigation history) that the current architecture does not provide. **Do not enable NetCarShow tier2_endpoints in any brand config until the underlying fetch mechanism is upgraded** (Playwright-rendered Tier 2 fetches are the most plausible future path — see SESSION_NOTES.md Session 15 entry).

The heuristic's logic is preserved below for reference and for future re-use with a different Tier 2 source that:
1. Serves real images (no anti-bot decoys), AND
2. Has multiple heroes per model page, OR has consistent editorial layout that maps the single hero to a specific angle.

NetCarShow republishes manufacturer press kits with hero photography that is correct on model + MY but whose filenames (`Make-Model-YYYY-WIDTH-seq.jpg`) and alt-text lack the English angle vocabulary that `pickBestForAngle` requires. Session 14 verified that Tier 2 candidates from NetCarShow reach the scraper successfully but get rejected at the angle-matching stage, producing zero fills despite (what appeared to be) real model-correct photography being available.

The scraper invokes a NetCarShow-specific positional fallback when ALL of the following are true:

1. Standard Tier 2 angle-matching produced zero fills for the trim family.
2. The Tier 2 candidate set contains at least 1 hero-sized NetCarShow URL (URL width-hint ≥ 1000, or DOM-reported natural width ≥ 1000 on the Playwright path).
3. The brand's pre-run baseline-angle coverage was below 75% (so high-coverage brands aren't polluted with positional Tier 2 fallbacks).

Hero candidates are ordered by their position in the source page's HTML and assigned positionally: 1st → `front_three_quarter`, 2nd → `rear_three_quarter`, 3rd → `side_profile`, 4th → `interior_dashboard`. NetCarShow model overview pages typically serve exactly one hero per model (verified on Ferrari Amalfi 2026-05-16: 1 hero, 3 thumbnails, 1 wallpaper, 1 IG, 1 infographic), so in practice only `front_three_quarter` is assigned and the other angles stay unfilled — partial Tier 2 coverage by design (better partial than wrong). The image entry is tagged `assignment_method: "positional_netcarshow"` and provenance is recorded as `source_tier: 2`, `source_domain: "netcarshow.com"`. The trim's `notes` field receives a once-per-trim positional-variant fallback note. Implementation lives in `scripts/scrape_image_urls.mjs` (`applyNetCarShowPositional` and the supporting helpers `getURLHintedWidth`, `isNetCarShowHero`).

This heuristic is NetCarShow-specific. NetCarShow's editorial layout is consistent enough across model pages to make the positional convention reliable; other Tier 2 sources (Car and Driver, MotorTrend, Edmunds) use less consistent layouts, and extending the heuristic to them would require separate per-source design work. That work is deferred to a future session.

---

## Script behavior — what to know before running

The scrape and download scripts were patched on 2026-05-13 after two destructive bugs were identified. As of this writing, the patches are landed-but-not-validated. Before running Phase 4 on any brand with already-resolved Phase-1 image URLs (i.e., URLs that are already direct asset URLs, not page URLs), run a smoke test on a low-risk brand first and inspect the post-run JSON to confirm:

- URLs marked `needs_scraping: false` (or without that field) were NOT rewritten
- URLs marked `needs_scraping: true` WERE rewritten to direct asset URLs where found
- The .bak files (data/<brand>.json.bak and catalog/data/<brand>.json.bak) were created before any mutations
- No JSON-parse errors occurred (BOM handling works)

The recommended smoke-test brand is Mini: small (7 models, 11 trims), all 38 image entries flagged `needs_scraping: true`, no Phase-4 history to compare against. Mini's CDN access pattern is also representative of BMW-family infrastructure, which informs whether the patched script will work on the broader fleet.

---

## Workflow

### Step 0: Setup

- Verify Node.js is available: `node --version`. If missing, abort with: "Phase 4 requires Node.js. Install Node.js (LTS) and re-run."
- Verify the brand's JSON exists: `data/<brand_slug>.json`. If missing, abort with: "No data for `<brand>`. Run Phase 1 first."
- Verify `scripts/scrape_image_urls.mjs` and `scripts/download_images.mjs` exist. If either is missing, abort with a clear message — these scripts must exist before Phase 4 can run.
- Create `reports/` directory if missing. Create `scripts/brand-configs/` directory if missing.

### Step 1: Ensure a brand config exists

Check whether `scripts/brand-configs/<brand_slug>.json` exists.

**If it exists**, skip to Step 2.

**If it does not exist**, create it. The config file tells the scrape script which consumer-page URLs to fetch per model and how to recognize the brand's image asset URLs. Structure:

```jsonc
{
  "brand_slug": "honda",
  "model_pages": {
    "civic":           "https://automobiles.honda.com/civic-sedan",
    "civic-hatchback": "https://automobiles.honda.com/civic-hatchback",
    "cr-v":            "https://automobiles.honda.com/cr-v"
  },
  "slug_variants": {
    "civic-hatchback": ["civic-hatchback", "civic_hatchback"],
    "cr-v":            ["cr-v", "crv"],
    "hr-v":            ["hr-v", "hrv"]
  },
  "path_blacklist_regex": "(?:Promo-Banner|Global-Nav|nav[/_-]?jelly|favicon|sprite|icon|logo)"
}
```

**Field meanings:**

- `model_pages`: map of `model_slug` → manufacturer consumer page URL for that model. **Every model in `data/<brand_slug>.json` should appear here**, with the model_slug exactly matching the JSON. If a model doesn't have a public page, omit it (the scrape script will skip those models and report them as unsourceable).
- `slug_variants`: optional map from `model_slug` → array of alternate path tokens to match in CDN image URLs. Helps the scraper recognize that `crv` and `cr-v` refer to the same model. Default behavior (if a model isn't listed) is to use the model_slug as-is.
- `path_blacklist_regex`: optional regex of URL path tokens that identify chrome/nav/promo images (not vehicle photos). The scraper rejects URLs whose path matches this pattern. Default behavior (if omitted) is a generic blacklist for common nav/icon patterns.

**To populate `model_pages` for a new brand:**

1. Read `data/<brand_slug>.json` to get the list of `model_slug` values.
2. For each model, identify its current US consumer page URL on the manufacturer site. Visit the brand's main site (e.g., `bmwusa.com`, `toyota.com`, `mbusa.com`) and find each model's individual page. Use the page that shows the trim lineup and photography, not generic landing pages.
3. Save the result as `scripts/brand-configs/<brand_slug>.json`.

This is a one-time, ~10 minute manual step per brand. Once the config exists, the scrape script handles every model automatically.

### Step 2: Run the scrape

From the project root:

```
node scripts/scrape_image_urls.mjs --brand <brand_slug>
```

The script reads `catalog/data/<brand_slug>.json` and the brand config, fetches each model page, extracts and scores image candidates by angle (front_three_quarter, rear_three_quarter, side_profile, interior_dashboard), and rewrites `image.url` on every image entry. It also writes back to `data/<brand_slug>.json` so the source and catalog copies stay in sync.

**Capture the script's output.** It prints a summary at the end with:
- Pages successfully fetched vs failed
- Image entries rewritten with model-specific URLs
- Image entries left unchanged (no good match found)
- Per-model unresolved-angle counts

Save this output for the report (Step 4).

**If the scrape script fails entirely** (e.g., network error, abort), do not retry blindly. Report the error and stop. The brand JSON is unchanged on a fatal error.

### Step 3: Run the download

From the project root:

```
node scripts/download_images.mjs --brand <brand_slug>
```

The script reads `catalog/data/<brand_slug>.json`, walks every image entry, and downloads each URL to its `local_path` (relative to `catalog/`). On success, sets `image.downloaded: true` and writes the JSON back. On failure (HTTP error, non-image content-type, timeout, empty body), leaves the entry alone and logs the failure.

**Idempotent.** If an image was previously downloaded and the file still exists at `local_path` with non-zero size, the script skips it and counts it as cached. Re-running is safe.

**Capture the script's output.** It prints a summary with:
- Total attempted, succeeded, failed
- Failures grouped by HTTP status (403, 404, etc.) and error kind (timeout, wrong content-type, network error)
- Models with zero successful images
- A representative example URL per failure group

Save this output for the report.

### Mercedes-Benz brand-config special case

The mercedes-benz.json brand config currently points model_pages at mbusa.com consumer URLs. The 2026-05-13 Phase 4 run produced 0% download success because mbusa.com is JS-rendered (returns shells with 4-62 candidates per page) and the 2026 AMG restructure broke 99 URLs. Per PROJECT_STATE.md lesson #47, the recommendation for Mercedes is to rewrite scripts/brand-configs/mercedes-benz.json to use press.mbusa.com URLs instead.

When rewriting: for each model, find the corresponding press kit page on press.mbusa.com. These follow the pattern `press.mbusa.com/presskits/<model-slug>` for most models, though the 2026 restructure may have changed slugs. Verify each URL returns content with `<img>` tags pointing to direct asset URLs before saving the config.

If press.mbusa.com is also gated or also JS-rendered, the Playwright-capable scraper (introduced in this revision) should handle either source. If both static and headless approaches still fail (true gating, not just JS rendering), document that and accept that Mercedes will use placeholder coverage in the catalog. This is honest per the project's standards.

### Step 4: Write the report

Write `reports/<brand_slug>_image_scrape.md` with this structure:

```markdown
# Image Scrape Report: <Brand>

**Date:** YYYY-MM-DD
**Brand:** <Brand>
**Models in JSON:** <count>
**Total image entries:** <count>

---

## Summary

- **Scraped (URLs rewritten):** <count>
- **Downloaded successfully:** <count> (<percentage>%)
- **Download failures:** <count>
- **Page fetches failed during scrape:** <count>

## Scrape results

<paste relevant portions of the scrape script output, especially:>
- Pages attempted vs failed (with URLs and failure reasons)
- Number of image entries rewritten
- Number of image entries left unchanged due to no good match
- Per-model breakdown of unresolved angles

## Download results

<paste relevant portions of the download script output, especially:>
- Total attempted / succeeded / failed
- Failures grouped by HTTP status code
- Failures grouped by other error kinds (timeout, wrong-content-type, network)
- Models with zero successful downloads (list explicitly)
- Representative URL per failure group

## Recommendations

- If a model has zero successful downloads, list it with the failure reason. The catalog will render placeholders for these.
- If a brand-wide failure is observed (e.g., the brand's CDN returns 403 on 90% of downloads), recommend follow-up: check whether the URLs need different headers, signed URL parameters, or a different CDN domain entirely.
- If page-fetch failures during scrape are common, the brand's consumer site may be blocking the script's User-Agent or requiring JavaScript. Note this and recommend either (a) revising the `model_pages` config to use press/media subdomain URLs (try this first — it's cheaper than headless rendering), or (b) enabling the Playwright fallback path on the scrape script for that brand.

## Notes

<Any unusual findings: a model whose page URL has changed since the config was written, a CDN that returns gif/svg for some URLs and jpg for others, etc.>
```

### Step 5: Update STATUS.md

Add a column or note to the brand's row indicating image-scrape state. If STATUS.md doesn't already have an "Images" column, add it. Mark the brand with the download success percentage (e.g., `78% (132/170)`) and today's date.

### Step 6: Print a chat summary

After writing the report:
- Path to the report file
- Brand name, models covered, image entries total
- Headline numbers: scrape success rate, download success rate
- Any model with zero successful downloads (list)
- Recommendation: "Coverage is good, proceed" or "Significant gaps remain, see report"

---

## What this phase does NOT do

- **Re-research models or trims.** If the brand JSON is missing models, that's a Phase 1 issue. Phase 4 only resolves images for the trims that exist.
- **Modify the schema.** No new fields are added to image entries beyond what's already documented (`downloaded`, `needs_scraping`, etc.).
- **Bypass authentication or rate-limiting controls.** If a manufacturer's CDN requires authenticated session cookies, signed URLs, or CAPTCHA-style human verification, Phase 4 fails honestly and reports it. Do not attempt to spoof credentials, evade rate limits, or defeat bot-detection systems.

  Note on headless browsers: Playwright (or equivalent) IS permitted for image-URL extraction from JS-rendered manufacturer marketing pages. This is a narrow scope — the goal is to access the same image URLs a regular customer's browser sees after the page renders. It is NOT permission to scrape spec data via headless browsing (the source hierarchy in `00_master_spec.md` §4 remains authoritative for spec data), and it is NOT permission to bypass authentication or rate limits. Headless-browser use should be: single-shot per page, no concurrent requests beyond what a normal user would issue, no defeating of access controls.
- **Touch other brands.** Phase 4 is single-brand. Run it once per brand.
- **Rewrite the scripts.** If the scripts are missing features or have bugs, file that as a separate task. Phase 4 runs the scripts as-is.
- **Run before script patches are validated.** If the scrape/download scripts have unpatched bugs (e.g., the 2026-05-13 destructive reset or ANGLE_PATTERNS crash), Phase 4 MUST NOT run on any brand with already-resolved Phase-1 URLs. Smoke-test the patched scripts on a low-risk brand (Mini is recommended) before running on any brand whose JSON contains direct asset URLs you want to preserve.

---

## Failure modes and what to do

- **Brand config doesn't exist and `data/<brand_slug>.json` has no obvious manufacturer URLs to base it on:** Create the config with whatever model_pages can be determined. List the unsourceable models in the report under "Notes."
- **Scrape script crashes:** Report the error verbatim. Do not modify the script. The user will triage.
- **Download script crashes:** Same. The JSON is unchanged on a fatal error.
- **Brand's CDN returns 403 on every download attempt:** Run the download script anyway, let it record the 403s, and write the report. The site will use placeholders. Recommend follow-up in the report (e.g., "Mercedes-Benz CDN requires session cookies; consider running browser-assisted scraping or accept placeholder coverage").
- **A model's page URL in the config has rotted (404):** The scrape script reports it as a failed page fetch. Update the config in a follow-up run, or note it in the report for manual fix.
- **A model in `data/<brand_slug>.json` is not in the config's `model_pages`:** The scrape script skips it. Report this explicitly. The user may want to add it to the config.

---

## Honesty rules in the report

- Report the actual percentages, not rounded-up "good enough" numbers.
- If a model had zero downloads, name it. Don't bury it in aggregate stats.
- If you noticed something unusual during the run (a CDN domain you weren't expecting, an unusual HTTP redirect chain, a content-type mismatch), put it in the Notes section.
- If you suspect a recurring failure pattern across brands (e.g., "all 403s are on `*.amazonaws.com` URLs"), document that — it informs future Phase 4 runs for other brands.

---

## Save points

- The scrape script writes JSON to disk at the end of its run. Partial saves only happen on graceful completion.
- The download script writes JSON to disk only if at least one download succeeded.
- The report is written at the end of Step 4. If anything in Steps 1-3 fails, write the report with whatever data was collected, plus a "scrape failed" or "download failed" note at the top.

---

## Validated architecture as of Session 10

The image pipeline has accumulated patches across Sessions 5–10. The current validated architecture:

### Script architecture (`scripts/scrape_image_urls.mjs`)

1. **Static-first → Playwright fallback design** (added Session 5).
   - Default path: `fetch()` the consumer page, extract `<img>` / `<picture>` / `<meta og:image>` candidates.
   - Escalation gate: if `cands.length === 0` after static fetch, escalate to Playwright (`fetchHTMLWithPlaywright`).
   - Playwright is single-instance, lazy-launched, reused across pages within a brand, closed via `closePlaywrightBrowser()` in main's finally block.
   - `--no-playwright` CLI flag disables fallback.

2. **`angle_url_patterns` brand-config extension** (added Session 7).
   - Optional map on `scripts/brand-configs/<brand>.json` from angle name to regex.
   - If present, the regex augments the default `ANGLE_PATTERNS` table for that brand. Example: Mercedes-Benz `[-_]HC(?:-D)?\.(?:jpe?g|png|webp|avif)` for `front_three_quarter` (HC-D = front 3/4 on C-Class, CLE-Coupe; HC = front 3/4 on CLA).

3. **Resolution preference** (added Session 7).
   - When multiple candidates score equally for an angle, prefer higher resolution (parsed from URL parameters like `?w=`, `?h=`, or filename suffixes like `_2400x1600.jpg`).

4. **`isPlausibleImageURL` extension-less CDN handling** (added Session 8).
   - The default heuristic excludes URLs without an image extension. Extended to accept extension-less CDN URLs that match a brand-specific CDN domain pattern (Lotus, Hyundai, others). Brand-config can extend the accepted CDN domain list.

5. **HTML entity decode + cdnRe `/content/dam/` extension** (added Session 9).
   - HTML entity decoding applied to JSON-embedded URLs before candidate extraction (Kia `&amp;` in JSON blobs).
   - The CDN-recognition regex `cdnRe` extended to accept `/content/dam/` URL paths (used by Mercedes-Benz and others on AEM-based CDNs).

6. **Referer header for Toyota-style S3 buckets** (added Session 6).
   - `--with-referer` CLI flag (or per-brand-config flag) sets a Referer header matching the manufacturer's consumer domain. Some S3 buckets reject requests with no Referer or wrong Referer (Toyota's `media-prod-toyota.aem.toyota.com`).

### Diagnostic patterns

**The "structural ceiling" concept** — some brands cannot exceed a certain coverage under the manufacturer-only image policy. This is structural, not a bug:

- **Tesla 0%**: HTTP 403 anti-bot at transport layer; no static or Playwright fetch succeeds.
- **Ferrari ~23%**: Most assets behind a JS gate that returns no useful candidates even via Playwright; the manufacturer simply doesn't expose them publicly.
- **Mercedes-Benz ~40%**: Many model_pages JS-render shells with few candidates; interior shots in particular sit behind a configurator gate. Phase A Session 10 lifted to 40% via HC-D pattern, but the next ceiling is the configurator gate.
- **Land Rover ~32%**: CDN uses chassis codes (L405, L460) not model slugs; slugMatchesURL would need brand-aware aliases.

When a brand's coverage doesn't improve after a fix, **check whether it's at structural ceiling** before iterating. See `reports/persistent_low_coverage_brands.md`.

**The "single specific blocker" pattern** — most brands have ONE specific issue blocking coverage, not generic failures. Identify the blocker before trying generic improvements:

1. Run scrape on the brand with `--brand <slug>`.
2. Inspect the per-model output: how many candidates per page, how many filtered out, what's left.
3. If candidates are 0: the page isn't loading or doesn't have images. Try Playwright fallback or change `model_pages` URL.
4. If candidates are 100+ but rewrites are 0: the candidates are getting filtered. Either `isPlausibleImageURL` excludes them (extension/CDN issue) or `slugMatchesURL` excludes them (slug-naming issue).
5. If rewrites happen but downloads 403/404: the asset URLs themselves are gated. Try a different referrer header or accept structural ceiling.

This 5-step diagnosis isolates the blocker in one or two iterations. Don't blindly add Playwright if the static fetch returns plenty of candidates — that's solving the wrong problem.

---

## Input

Brand: <REPLACE WITH BRAND NAME WHEN PASTING INTO CLAUDE CODE>
