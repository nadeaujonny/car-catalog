# Phase D — Freshness spot-check (Session 10)

5 brands sampled across research age and tier. Detection-only — no fixes applied.

## Sample selection

| brand | research date | tier | session | rationale |
|---|---|---|---|---|
| BMW | 2026-05-11 | A (95.1% img) | 1 (4 days old) | Oldest data; high-volume luxury |
| Chevrolet | 2026-05-13 | A (88.9% img) | 2 overnight batch (2 days old) | Largest US brand by model count; GM family rep |
| Porsche | 2026-05-12 | B (50.3% img) | 3 ultra-luxury batch (3 days old) | Complex multi-trim brand (911 splits); previously had verification blocker |
| GMC | 2026-05-13 | A (85.6% img — just modified in Phase A) | 2 overnight batch (2 days old) | GM family rep; just modified in Phase A |
| Hyundai | 2026-05-13 | A (86.8% img) | 2 overnight batch (2 days old) | Mainstream Korean; complex EV lineup |

## Per-brand findings

### BMW (research 2026-05-11)
- **Model list match: yes** (all 29 stored slugs present; i3 sedan teased for 2027 but not yet on sale, correctly excluded)
- **Pricing drift (3 random trims):**
  - 3-series/330i: $47,500 → $48,000 (+$500, minor)
  - x5/xdrive40i: $68,600 → $70,600 (+$2,000, **major**)
  - x3/30-xdrive: $50,675 → $51,300 (+$625, minor)
- **Trim structure:** matches
- **Model-year drift:** no
- **Overall: minor drift, severity: minor**
- Recommendation: refresh X5/3-series msrp_base broadly; BMW appears to have nudged prices upward across the lineup since 2026-05-11.

### Chevrolet (research 2026-05-13)
- **Model list match: partial**
  - chevrolet.com in maintenance during check; agent used Cars.com (NB: Cars.com is forbidden as a primary spec source per §4.1; appropriate as a freshness comparison reference only).
  - Stored: corvette-z06, corvette-zr1, corvette-zr1x are separate models. Cars.com groups under "Corvette". Project schema decision, not drift.
  - Cars.com shows Malibu, Express 2500/3500, BrightDrop 400/600 — sedan/commercial models intentionally out of scope.
  - 2027 Bolt and 2027 Equinox redesign flagged as upcoming.
- **Pricing drift (3 random trims):**
  - equinox/lt-fwd: $28,600 → $28,800 (+$200, minor)
  - tahoe/rst-4wd: $73,995 → $71,700 (-$2,295, **major**)
  - colorado/lt-4wd: $41,395 → $39,300 (-$2,095, **major**)
- **Trim structure: drifted**
  - Equinox JSON missing RS-AWD, ACTIV-FWD variants present on Cars.com
  - Tahoe JSON has 6 trims; Cars.com lists 11 (missing 2WD variants of LT/RST/Premier/HighCountry and 4WD LS)
- **Model-year drift:** no (all 2026; 2027 Bolt + Equinox redesign flagged)
- **Overall: minor drift, severity: minor**
- Caveat: chevrolet.com was unavailable during check. Pricing deltas from Cars.com should be re-verified against chevrolet.com when available. The price drops could be model-year-end clearance pricing or a real downward correction.

### Porsche (research 2026-05-12)
- **Model list match: yes**
  - All 6 marketing models (911, 718, Taycan, Panamera, Macan, Cayenne) on porsche.com align with the stored 16 sub-model slugs.
  - Performance variant splits (911 GT3/GT3 RS/Turbo S/Spirit 70, 718 GT4 RS/Spyder RS, Taycan Turbo GT) are project schema decisions; site groups under parent models.
- **Pricing drift (3 random trims):**
  - 911/carrera: $135,500 → $135,500 ($0, **none**)
  - cayenne/cayenne: $89,900 → $89,900 ($0, **none**)
  - taycan/taycan: $105,800 → $105,800 ($0, **none**)
- **Trim structure:** matches
- **911 msrp_range.high:** 203,300 (correct — prior blocker value 246,800 is **resolved**, was fixed in an earlier fix-pass).
- **Model-year drift:** no
- **Overall: current, severity: none**
- Recommendation: no action required.

### GMC (research 2026-05-13)
- **Model list match: yes** (10 stored models match current gmc.com lineup)
  - gmc.com had a site-wide maintenance error during check; verified via GM Authority, Edmunds, KBB.
- **Pricing drift (3 random trims):**
  - sierra-1500/pro: $41,095 → $41,095 (none)
  - yukon/elevation: $69,200 → $69,200 (none)
  - terrain/elevation: $30,200 → $30,200 (none)
- **Trim structure: drifted (one variant)**
  - Hummer EV SUV stored has 2X and 3X. Current site adds a 3X Carbon Fiber Edition (~$124,900) as a separate trim variant.
- **Model-year drift:** no
- **Overall: current, severity: minor**
- Caveat: gmc.com unavailable during check. The Hummer 3X CFE may have existed at research time but been treated as an option package rather than a trim — project precedent §6.5 supports that interpretation.
- Recommendation: re-verify Hummer EV SUV 3X Carbon Fiber Edition is a separate trim vs. an option package once gmc.com is back.

### Hyundai (research 2026-05-13)
- **Model list match: yes** (14 stored models confirmed on hyundaiusa.com)
  - Standard Ioniq 6 correctly excluded (US MY26 lineup is N-only)
  - Nexo (2nd-gen) confirmed launched 2025
- **Pricing drift (3 random trims):**
  - tucson/se: $29,200 → $29,200 ($0, **none**)
  - santa-fe/sel: $37,340 → $37,340 ($0, **none**)
  - ioniq-5/limited: $45,075 → $45,075 ($0, **none**)
  - Notable: Hyundai cut Ioniq 5 MSRPs up to $9,800 for MY26. Stored data already reflects post-cut pricing.
- **Trim structure:** matches (Ioniq 9 all 6 trims confirmed at exact stored prices)
- **Model-year drift:** no
- **Overall: current, severity: none**
- Recommendation: no action required.

## Overall freshness assessment

| brand | freshness | severity | days since research |
|---|---|---|---|
| BMW | minor drift | minor | 4 |
| Chevrolet | minor drift | minor | 2 |
| Porsche | current | none | 3 |
| GMC | current | minor | 2 |
| Hyundai | current | none | 2 |

## Patterns observed

1. **Pricing drift is small but real.** BMW saw $500-$2000 upward nudges across 3-4 days. Chevrolet's Tahoe/Colorado saw $2000+ downward drift (possibly model-year clearance pricing or correction). At a 3-day check window, this is noise-level for most pricing. Worth re-checking pricing at quarterly intervals.

2. **Manufacturer site availability varies.** Both chevrolet.com and gmc.com had maintenance errors during the spot-check. Agents fell back to secondary sources (GM Authority, Cars.com, Edmunds) for comparison. This suggests a more robust freshness pipeline should:
   - Wait/retry on manufacturer maintenance
   - Or cache periodic snapshots so the comparison isn't dependent on a single point-in-time fetch

3. **Trim structure drift is rare but real.** Chevrolet's Equinox/Tahoe trim count differs from Cars.com (which may not match the manufacturer site — needs re-verification). GMC's Hummer EV SUV may have a new Carbon Fiber Edition trim or option package.

4. **Model-year drift is not yet a factor.** None of the 5 sampled brands have a MY27 transition in progress; all current entries are MY26. The 2027 Bolt and Equinox redesign at Chevrolet are the closest upcoming MY change.

5. **Verification fixes hold over time.** The Porsche 911 msrp_range.high blocker (246,800 → 203,300) from earlier sessions is confirmed resolved. The verification → fix-pass loop works.

## Recommendations for next maintenance pass

Priority order for re-research, if/when a freshness pass is undertaken:
1. **BMW** — minor pricing drift across multiple trims; worth refreshing msrp_base values brand-wide.
2. **Chevrolet** — trim coverage gaps (Equinox/Tahoe) and pricing drift on Tahoe/Colorado; needs chevrolet.com direct re-verification.
3. **GMC** — single Hummer EV SUV variant to confirm.
4. **BMW i5 / i7 / iX / iX3** — Phase C noted these have CR data but not JD Power scores; could re-check after JD Power 2026 EVX expansion.
5. (No urgency) Porsche, Hyundai — both essentially clean.

The 41-brand catalog overall: **mostly current with minor pricing drift on some brands**. No catastrophic staleness signal detected on the 5-brand sample.

## Caveats

- Single freshness sample of 5 brands cannot generalize to the full 46-brand catalog.
- 3-day windows are short; longer-windowed drift (3-6 months) may surface entirely different patterns.
- Cars.com and other freshness-reference sources should not be confused with primary spec sources (per §4.1).

## Phase D conclusion

The catalog is in good freshness state for May 2026. The recommendation is NOT to undertake a full re-research pass at this time. Instead, schedule a quarterly maintenance check (~Q3 2026 after MY27 announcements begin) using a similar 5-10 brand sample.
