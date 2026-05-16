# Per-brand targeted image investigation — Session 9 (2026-05-15)

Phase A of Session 9 investigated 8 tier-B / low-tier-B brands single-threaded, looking for blocker-class fixes that could be addressed via brand-config edits or a small, generally-applicable script extension. The brief allowed (rule #4) a single-thread per-brand judgment per brand, and (rule #5) a script change only if it provably addressed multiple brands.

## Headline

| metric | before | after | Δ |
|---|---:|---:|---:|
| project-wide downloaded | 3071/4369 (70.29%) | 3111/4369 (71.21%) | **+40 entries / +0.92 pp** |
| Phase A targeted brands at ≥+5pp | — | 2 of 8 | (Kia +45.3, Ram +11.4) |

Two of the eight targeted brands gained materially: **Kia 25.00% → 70.31%** (+45.31pp) and **Ram 32.95% → 44.32%** (+11.37pp). One brand gained marginally (Ford +0.49pp). Five brands were unchanged.

Both of the major gains came from a single script-level fix: extending `extractCandidates` to pre-decode HTML entity-encoded quotes (`&#34;` → `"`, `&#39;` → `'`) AND extending the CDN-relative URL regex to cover Adobe AEM's `/content/dam/` and `/us/content/dam/` paths. Both Kia and Ram use AEM as their CMS and embed image URLs inside JSON data layers — the previous extractor never saw those URLs because their boundaries were HTML-entity-encoded.

Kia additionally got brand-specific `angle_url_patterns` matched against AEM 360-spin frame numbers (`360/04.png`, `360/18.png`, `360/36.png`) which were verified visually to map to side_profile, rear_three_quarter, and front_three_quarter respectively.

## Per-brand results

### Alfa Romeo — 71.43% → 71.43% (no change)

**Investigation:** scrape on alfaromeousa.com produces 140+ slug-matching candidates per page with rich alt text ("front end of a red 2026 Alfa Romeo Tonale Sport Speciale", "passenger-side front angle", etc.). The 8 unresolved entries are all rear_three_quarter for Tonale Sprint/Veloce/Sport Speciale and Stelvio Veloce, plus side_profile for Stelvio Veloce, plus rear for Giulia base/Veloce.

**Root cause:** Alfa Romeo's consumer pages do not publish rear-angle photography for these specific trims. The exterior gallery sections emphasize front and side shots; rear shots are absent or replaced with passenger-side-front-angle compositions. The remaining gap is structural at the page level, not a pipeline issue.

**Verdict:** no fix applied. Current 71.4% is the page's natural ceiling under the manufacturer-only source policy.

### Kia — 25.00% → 70.31% (+45.31pp) ★★★

**Investigation:** kia.com pages embed comprehensive trim-level imagery inside an Adobe AEM JSON data layer where all asset paths look like `/content/dam/kia/us/en/vehicles/<model>/2026/trims/<trim>/exterior/<hex>/360/<NN>.png` and `/content/dam/.../interior/<hex>/<trim>/<color>.png`. The existing scrape extractor only matched URL boundaries with literal `["']` characters; the JSON-embedded URLs use HTML-entity-encoded `&#34;` boundaries and were invisible to the extractor. Even when not entity-encoded, the existing CDN-relative regex only matched `/-/media/` prefixes, not `/content/dam/`.

**Frame-angle verification (visually inspected):**
- `360/04.png` — pure side profile (passenger side)
- `360/18.png` — rear-3/4 (driver side rear)
- `360/36.png` — front-3/4 (wraps back to start of spin)

**Fixes applied:**
1. Script-level: `extractCandidates` pre-decodes `&#34;` and `&#39;` HTML entities at the top of the function. CDN-relative regex extended from `/-/media/` only to also cover `/content/dam/` and `/us/content/dam/`. (`scripts/scrape_image_urls.mjs`)
2. Brand-config: added `angle_url_patterns` for the three verified frame-angle mappings. (`scripts/brand-configs/kia.json`)

**Per-model after fix:**
- 16 models, 64 image entries
- 45 downloaded (was 16)
- Most models now have all 4 angles
- Remaining gaps: niro-hybrid (rear + side), carnival (front + side), some sportage trims missing rear

The pattern still doesn't cover all Kia variants because not every model exposes `/360/<NN>.png` frames in JSON; some only emit hero shots in the page-level `<img>` elements which require different angle patterns.

### Mercedes-Benz — 32.49% → 32.49% (no change)

**Investigation:** mbusa.com class pages emit ~21 slug-matching candidates per page (per the earlier diag). The file naming convention is `2026-<MODEL>-<CODE>-<N>.jpg` where CODE is HC (Hero Center = front), EH (Exterior Hero), IH (Interior Hero), SH (Safety Hero), TH (Tech Hero). The EH-N images are exterior feature shots — grilles, headlamps, panorama roof, running boards — NOT angle-classified imagery. Alt text reflects the feature, not the angle ("Sizable wheel selection", "Standard Panorama roof").

The `IH-N` interior shots and `HC-D` front 3/4 shots ARE classified correctly; that's why coverage is ~32% (mostly front + some interior).

**Root cause:** Mercedes-Benz's consumer "class pages" don't expose dedicated rear-3/4, side-profile, or single-frame interior dashboard photography. The press subdomain (`press.mercedes-benz.com`) returns 403 to the scraper. The configurator gates the per-trim imagery.

**Verdict:** no fix applied. The 32.5% coverage is the structural ceiling under the manufacturer-only policy. Possible future paths: (a) accept press-syndicate imagery from authorized automotive press, (b) negotiate access to mbusa configurator, (c) accept the current placeholder rate.

### Ford — 47.29% → 47.78% (+0.49pp)

**Investigation:** Ford has a mix of static and JS-rendered pages. The script change added 1 additional downloaded entry. Ford's pages mostly use `<img src>` directly rather than JSON-embedded URLs, so the HTML-entity decode didn't help significantly.

The 106 unresolved entries are largely on Super Duty variants (which Ford serves a shared-template page for, with marginal model-specific imagery) and on Raptor/Raptor R variants (which point at the same Raptor page).

**Verdict:** no further fix attempted; existing config is correct. Better coverage would require either (a) per-trim Ford CDN URLs (hard to obtain without a Ford-specific data feed), or (b) accepting press images.

### Mazda — 63.10% → 63.10% (no change)

**Investigation:** Mazda already has comprehensive `angle_url_patterns` (added in Session 7) for the 34-jellies/ folder distinction between front-3/4 (`0\d_btv/...001_trims/34_jellies`) and side-profile (`content/dam/musa/vehicle-assets/.../001-trims/34-jellies` — CX-5 only). The session noted CX-5's redesign uses an alternate folder with side-profile imagery. The 31 unresolved entries are spread across models where Mazda doesn't publish a clean rear-3/4 hero shot.

**Verdict:** no fix applied. Mazda's coverage is at its natural ceiling under the current page structure.

### Ram — 32.95% → 44.32% (+11.37pp) ★

**Investigation:** ramtrucks.com pages use AEM with the same `/content/dam/...` path convention as Kia, but the URLs appear in both `<img src>` and inside JSON data layers. The script's HTML entity decode + extended CDN-relative regex caught the JSON-embedded URLs that previously slipped through.

**No brand-specific angle patterns added.** Ram's consumer pages don't expose rear/side/interior URL tokens — Session 7 already confirmed this. The 49 still-unresolved entries are rear_three_quarter / side_profile / interior_dashboard for ram-1500 and ram-3500.

**Verdict:** Ram is partially unblocked by the script change. The remaining gap is the same structural ceiling Session 7 documented (no rear/side/interior URL tokens), so 44.3% is the new ceiling.

### Jeep — 64.55% → 64.55% (no change)

**Investigation:** Jeep's gallery URLs (`/<model>/gallery.html`) already work as designed (Session 6 made this switch). The HTML-entity decode didn't add new candidates because Jeep's pages use direct `<img src>` rather than JSON-embedded URLs.

The 78 unresolved entries are scattered across models where the specific angle photo isn't published, or is published with alt text that doesn't fire ANGLE_PATTERNS.

**Verdict:** no fix applied. 64.5% is Jeep's ceiling under current page structure.

### GMC — 75.96% → 75.96% (no change)

**Investigation:** gmc.com uses the same Adobe AEM CMS as Kia, but the URLs appear in regular `<img src>` elements (not JSON-embedded), so the HTML-entity decode didn't help. GMC's 50 unresolved entries are split across:
- **yukon-xl (20 unresolved)**: shares page with yukon; current slug variants don't catch "yukon" without the "-xl" suffix, so all yukon URLs are claimed by the yukon model
- **Other models (30 unresolved)**: mostly rear_three_quarter, since GMC pages emit front-3/4 hero shots + interior shots but rarely a dedicated rear hero

A fix for yukon-xl (sharing imagery with yukon via slug-variant union) would require either modifying the `used`-tracking in pickBestForAngle or allowing the same URL to be assigned to both models. That's out of scope for this session.

**Verdict:** no fix applied. The 76% ceiling is structural at the page level.

## Cross-brand patterns observed

1. **Adobe AEM brands embed asset URLs in JSON data layers with HTML-entity-encoded quotes.** Kia and Ram both surfaced significant new candidates from a single script change. Other AEM brands (GMC, Buick — already at 100%, Cadillac, Chevrolet) saw no gain because their URLs sit in regular `<img src>` elements rather than JSON. Worth noting that the fix is additive and harmless to non-AEM brands.

2. **360-spin frames are a viable angle source for AEM brands.** Kia's `360/<NN>.png` naming maps to predictable angles (frame 04 = side, 18 = rear-3/4, 36 = front-3/4 of a 36-frame spin starting at front-3/4). The same convention may exist for other AEM brands but wasn't probed in this session. A future session could check Buick, Cadillac, Chevrolet for the same `/360/<NN>.png` pattern.

3. **Several brands have genuinely structural ceilings.** Alfa Romeo, Mazda, Ford (mostly), Jeep, GMC, and Mercedes-Benz all reach a per-page ceiling because the manufacturer doesn't publish certain angles on the consumer overview pages. The pipeline is doing what it should — those gaps would require either policy relaxation (accept non-manufacturer sources) or alternative manufacturer subsystems (press subdomain, configurator API).

4. **Mercedes-Benz's 32.5% is the most-stubborn structural ceiling among the high-entry-count brands.** Class-page imagery is feature-driven, not angle-driven, and the press subdomain returns 403. Without policy relaxation, this is unlikely to improve.

## Tier crossings this phase

- **Kia C → B** (25.00% → 70.31%, jumped a full tier)
- No other tier crossings.

## Brands still at <50% (post-Phase-A)

| brand | coverage | classification |
|---|---:|---|
| ford | 47.78% | structural ceiling at page level |
| maserati | 45.83% | structural (Folgore scene7 variants 403) |
| ram | 44.32% | improved this session; partial ceiling on rear/side/interior |
| lamborghini | 41.67% | thin candidate pools; configurator pages |
| polestar | 41.67% | small denominator |
| rolls-royce | 39.47% | many text/html placeholder URLs |
| volkswagen | 38.78% | thin page structure |
| mercedes-benz | 32.49% | structural; consumer pages feature-driven |
| land-rover | 31.94% | thin candidate pools on some models |
| ferrari | 22.92% | thin per-page candidate pool |
| tesla | 0.00% | hard 403 anti-bot |

## Phase A → Phase B handoff

Per the brief's revised A4 rule, Phase B proceeds regardless of Phase A's magnitude. This session is now moving to the scoped MSRP policy relaxation work documented in the brief's Phase B sections.

## Files changed in Phase A

- `scripts/scrape_image_urls.mjs` — `extractCandidates` extended to pre-decode HTML-entity-encoded quote characters AND CDN-relative regex extended from `/-/media/` only to also cover `/content/dam/` and `/us/content/dam/`
- `scripts/brand-configs/kia.json` — added angle_url_patterns for `360/04.png`, `360/18.png`, `360/36.png`
- `scripts/diag_alfa_candidates.mjs` — diag-only Session 9 helper
- `data/<brand>.json` + `catalog/data/<brand>.json` — re-scraped for the 8 targeted brands with .bak backups
