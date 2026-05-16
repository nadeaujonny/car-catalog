# Ram Phase-C-bis Image-Scrape Investigation — 2026-05-14 (session 6)

## TL;DR

**The Phase-4 coverage report's diagnosis ("match gap — 14–35 raw cand/page") was correct on the symptom but wrong on the root cause.** The slug_variants in `scripts/brand-configs/ram.json` are NOT the bottleneck for ram. Slug matching is already at 95%+ across all three pages. The actual bottleneck is the **angle-pattern matcher** — Ram's hero/feature-panel alt text is written in prose that does not contain "front", "rear", "side", "interior", "dashboard", or other angle keywords. Adding slug_variants cannot lift coverage because the candidates ARE matching slugs already; they just don't match any angle pattern.

Coverage remains **14/88 (15.9%)** after this investigation. To meaningfully lift ram coverage requires changes outside the per-brand config (either expanding `ANGLE_PATTERNS` in `scripts/scrape_image_urls.mjs` to recognise ram's hero-shot terminology, or accepting that ram's overview pages don't carry per-angle imagery).

## Method

1. Wrote `scripts/diag_ram_candidates.mjs` mirroring the production extractor + slug-match + angle-pattern logic.
2. Dumped all raw candidates from the 3 ram model pages to `reports/ram_candidates_raw.log`.
3. For each slug-matched candidate, recorded which angle pattern(s) it would match.
4. Verified false-positive risk for the bare-number variants ("1500" / "2500" / "3500" — task brief warned about "1500x1500" dimension matches).
5. Re-ran the production scraper and download to confirm a baseline measurement.

(I also attempted a Playwright probe in `scripts/diag_ram_playwright.mjs` — ramtrucks.com served 306-byte stub pages with zero candidates to a headless Chromium UA, so Playwright escalation is not a usable path for this brand. Removed the script after verification.)

## Findings

### Slug-match coverage is high

Static fetch, deduplicated by URL:

| page | raw cands | unique | slug-matched (deduped) | slug-matched (raw, what production reports) |
|---|---:|---:|---:|---:|
| ram-1500 | 32 | 22 | **21** | 28 |
| ram-2500 | 35 | 20 | **19** | 31 |
| ram-3500 | 14 | 7 | **6** | 10 |

So 21+19+6 = **46** unique candidates already slug-match. The slug variants (`["ram-1500", "ram_1500", "1500"]` etc.) are doing their job.

### Angle-pattern coverage is the real gap

Of those slug-matched candidates:

| page | slug-matched | also match >=1 angle pattern |
|---|---:|---:|
| ram-1500 | 21 | **0** |
| ram-2500 | 19 | **6** |
| ram-3500 | 6 | **0** |

That is why production rewrites 14 entries: only 6 unique ram-2500 candidates (the Lunar `vlp-desktop`, Black Express, Warlock images at desktop+mobile resolutions) carry alt text with angle keywords:
- `"A driver-side **front angle** of a light gray 2026 Ram 2500 Lunar..."` → matches `front[-_ ]?angle` (score 8) + space-bounded "front" (score 7) = 15 → fills front_three_quarter for all 7 ram-2500 trims.
- `"An angled **driver-side profile** of a gray 2026 Ram 2500 Warlock..."` → matches `side[-_ ]?profile` (score 14) + `\bprofile\b` (score 9) + space-bounded "side" (score 7) = 30 → fills side_profile for all 7 trims.

That accounts for the entire 14/88 production rewrite count (7 trims × 2 angles).

### ram-1500 candidates — none have angle keywords

The 21 ram-1500 slug-matched candidates are all hero/feature-panel/warranty/logo imagery whose alt text is empty or prose without angle words:
- Hero/slider (1 + 1 mobile + 1 tablet): alt `"A silver 2026 Ram 1500 Laramie 4x4 Crew Cab traveling down a highway, towing a skidsteer loader…"` — no angle keyword.
- Feature panel "serious power and capability" (8 srcset variants): alt empty.
- Warranty shared panel (6 srcset variants): alt empty.
- Fox Factory logo (3 variants): alt `"fox factory vehicles"` — irrelevant.
- Gallery thumbnail4: alt empty.

None of these will ever match the existing `ANGLE_PATTERNS` for front/rear/side/interior. ram-1500 cannot reach any angle via this page.

### ram-3500 candidates — same story

The 6 ram-3500 slug-matched candidates: hero (3 device variants of `vlp-hero-01`) and warranty (3 device variants of `vlp-warranty-hero`). Hero alt is the same prose ("A gray 2026 Ram 3500 Limited Longhorn 4x4 Crew Cab towing a large fifth-wheel livestock trailer as it travels down a highway…") with no angle keywords. Warranty alts are empty.

### False-positive scan: bare "1500"/"2500"/"3500" variants are SAFE

The task brief warned that a slug variant of "1500" could match dimension tokens like "1500x1500". The slug regex is `(^|[/_ -])${frag}([/_ -]|\.|$)` — the closing boundary set `[/_ -]|\.|$` does NOT include `x`, so "1500x1500" cannot match (the second "1500" abuts an "x", not a separator). Scan over all 21+19+6 candidates confirmed: zero false positives. The bare-number variants are safe to keep.

### Playwright is not a viable escalation path

ramtrucks.com served a 306-byte stub page (effectively empty) to a headless Chromium with the standard scraper UA. The site has bot detection that distinguishes Playwright's automation fingerprint from a real Chrome. With 21 slug-matched candidates the existing escalation gate (< 3 slug-matching) does not trigger anyway, but even if it did, Playwright would produce 0 candidates — strictly worse than the static fetch's 21–22.

## Changes applied

### `scripts/brand-configs/ram.json`

Added documentation in `notes` explaining the angle-pattern bottleneck. Slug variants extended to include space-separated and unhyphenated forms for completeness:

```json
"slug_variants": {
  "ram-1500": ["ram-1500", "ram_1500", "ram 1500", "ram1500", "1500"],
  "ram-2500": ["ram-2500", "ram_2500", "ram 2500", "ram2500", "2500"],
  "ram-3500": ["ram-3500", "ram_3500", "ram 3500", "ram3500", "3500"]
}
```

In practice these additions are no-ops vs the prior config: `variantToRegexFragment("ram-1500")` already produces `ram[-_ ]1500`, which matches space-separated "Ram 1500" alt text equally well. No new candidates slug-match after the change. They are kept for documentation clarity and future-proofing.

### `scripts/diag_ram_candidates.mjs`

New diagnostic script (safe to delete) that dumps raw candidates + angle-pattern preview to `reports/ram_candidates_raw.log`. Reuses the production extractor/blacklist verbatim for fidelity.

## Re-run results

```
node scripts/scrape_image_urls.mjs --brand ram     → reports/ram_scrape_session6.log
node scripts/download_images.mjs --brand ram       → reports/ram_download_session6.log
```

Identical to the prior baseline:
- Pages attempted: 3, failed: 0, Playwright escalated: 0.
- Rewritten: 14 (all ram-2500 front + side via the Lunar/Warlock alt-text angle hits).
- Downloaded: **14/88 (15.9%)** — unchanged.
- Models with zero downloaded images: ram-1500 (40 entries), ram-3500 (20 entries).

The bare-number variants did not introduce any false positives (confirmed by the false-positive scan).

## What WOULD lift ram coverage

Out of scope for this task per "Conservative on shared script", but documented for the next session:

1. **Expand `ANGLE_PATTERNS` in `scripts/scrape_image_urls.mjs`** to recognise ram-style terminology:
   - `front_three_quarter`: add `vlp[-_ ]?hero` or `hero(?:[-_]\d+)?` (most ram trim hero shots are titled "vlp-hero-01") — low score, e.g. 4.
   - `front_three_quarter`: add `\btraveling\b` or `\btowing\b` patterns derived from alt text — risky because they're scene-descriptive, not angle-descriptive.
   - This would let ram-1500 (`vlp-hero` filename), ram-3500 (`vlp-hero` filename) score a hero shot as front_three_quarter, lifting coverage from 14 to ~35–40 entries.

2. **Source from press.stellantisnorthamerica.com instead.** Stellantis press kits typically include explicitly angle-labelled photography (front-3q, rear-3q, side, interior). Would require a per-brand "press kit URL" config field and a different scraping flow.

3. **Accept that ram overview pages don't carry per-angle imagery** and document ram as a placeholder-mostly brand pending press-kit work.

Recommendation: option (1) with a low-confidence vlp-hero / overview-hero pattern is the cheapest improvement and is unlikely to false-positive on other brands (no other current brand uses "vlp-hero" in their URLs based on a quick scan).
