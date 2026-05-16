# Phase 3 freshness drift fixes — Session 11

**Date:** 2026-05-15
**Source:** Session 10 Phase D findings (`reports/freshness_check_session10.md`)

## Summary

Applied 6 trim-level MSRP updates across 2 brands. All changes from the Session 10 freshness spot-check are now reflected in the catalog data.

## BMW (3 trims)

Model-level `researched_at` updated 2026-05-11 → 2026-05-15. Brand-level `researched_at` also bumped.

| Model | Trim | Old MSRP | New MSRP | Δ | msrp_range.low change |
|---|---|---:|---:|---:|---|
| 3-series | 330i | $47,500 | $48,000 | +$500 | 47500 → 48000 |
| x5 | xdrive40i | $68,600 | $70,600 | +$2,000 | unchanged (cheaper trim exists) |
| x3 | 30-xdrive | $50,675 | $51,300 | +$625 | 50675 → 51300 |

destination_fee unchanged on all three (no freshness signal indicated movement).

## Chevrolet (3 trims)

Model-level `researched_at` updated 2026-05-13 → 2026-05-15. Brand-level `researched_at` also bumped.

| Model | Trim | Old MSRP | New MSRP | Δ | msrp_range change |
|---|---|---:|---:|---:|---|
| equinox | lt-fwd | $28,600 | $28,800 | +$200 | low: 28600 → 28800 |
| tahoe | rst-4wd | $73,995 | $71,700 | -$2,295 | range unchanged (rst-4wd not at min or max) |
| colorado | lt-4wd | $41,395 | $39,300 | -$2,095 | range unchanged (lt-4wd not at min or max) |

destination_fee unchanged on all three.

## Caveats from the Session 10 freshness check (preserved here for traceability)

- Chevrolet check used Cars.com because chevrolet.com was in maintenance during the spot-check. The Tahoe and Colorado price drops "could be model-year-end clearance pricing or a real downward correction" — applied as-is since the freshness brief allowed Cars.com as a comparison reference (NOT primary source for ongoing research, per §4.1).
- BMW check used bmwusa.com directly. The X5 +$2,000 was the largest single drift seen across the 5-brand freshness sample.

## Trim structure drift (not applied)

The Session 10 freshness check also flagged:

- Chevrolet Equinox: missing RS-AWD, ACTIV-FWD variants per Cars.com listing
- Chevrolet Tahoe: 6 stored trims vs Cars.com's 11 (missing 2WD variants and 4WD LS)
- GMC Hummer EV SUV: Cars.com shows a 3X Carbon Fiber Edition not in our data

These are **structural changes** requiring Phase 1 research (not just price updates) and are out of scope for Phase 3 per the brief. Documented for a future targeted-refresh session per `06_maintenance.md` §2.

## Verification

```
node scripts/verify_brand.mjs bmw       → blockers=0 warnings=2 fyis=0
node scripts/verify_brand.mjs chevrolet → blockers=0 warnings=36 fyis=0
```

No new blockers introduced. Warnings unchanged from Phase 2 final state.

## Files modified (with .bak)

- `data/bmw.json` + `catalog/data/bmw.json` (byte-identical SHA256)
- `data/chevrolet.json` + `catalog/data/chevrolet.json` (byte-identical SHA256)

## Script

`scripts/phase3_apply_drift.mjs` — applied all 6 trim updates with `.bak` backups, recomputed `msrp_range` per affected model, updated `researched_at` at model and brand levels.
