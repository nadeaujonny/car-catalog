# Session 9 verification summary (2026-05-15)

Per Phase C2 of the brief, the brands modified in Phase A and Phase B were re-verified using `scripts/verify_brand.mjs`. Raw verifier JSON outputs are in `reports/verification_session9/<brand>_verify_raw.json`. This document consolidates findings.

## Brands modified this session

- **Phase A** (image scrape changes): alfa-romeo, ford, gmc, jeep, kia, mazda, mercedes-benz, ram
- **Phase B** (MSRP fills): aston-martin, bentley, ferrari, lamborghini, lotus, mclaren, rolls-royce

## Per-brand verifier counts

| brand | blockers | warnings | FYIs | notes |
|---|---:|---:|---:|---|
| aston-martin | 12 | 0 | 0 | Mostly pre-existing false-positive (manufacturer URL containing "of-" string matches isDealerDomain heuristic). 3 new "msrp_base null" entries are §4.6-eligible (not filled, notes document non-disclosure). |
| bentley | 7 | 0 | 0 | "msrp_base null" entries are §4.6-eligible (not filled by Phase B; notes document non-disclosure). |
| ferrari | 7 | 2 | 0 | Existing nulls in 296 GTS, Speciale, etc. Note: 296 Speciale/12Cilindri/Purosangue carry their original non-disclosure notes; not in Phase B target list because notes wording differs slightly from the regex. |
| lamborghini | 1 | 0 | 0 | Pre-existing false-positive ("of-the" in manufacturer URL). |
| lotus | 8 | 0 | 0 | Includes pre-existing false-positives + Emeya R null (couldn't fill from allowed editorial sources). |
| mclaren | 11 | 0 | 0 | Includes pre-existing false-positives + 2 remaining null MSRPs (Le Mans Special Edition, GTS). |
| rolls-royce | 9 | 0 | 0 | Includes pre-existing false-positives + Phantom + Spectre Black Badge nulls. |
| alfa-romeo | (image-only changes; no MSRP changes; verifier output reflects pre-existing state) | — | — | No structural changes from Phase A — image entries updated only. |
| ford | (image-only) | — | — | Same as above. |
| gmc | (image-only) | — | — | Same as above. |
| jeep | (image-only) | — | — | Same as above. |
| kia | (image-only) | — | — | Same as above. |
| mazda | (image-only) | — | — | Same as above. |
| mercedes-benz | (image-only) | — | — | Same as above. |
| ram | (image-only) | — | — | Same as above. |

## Key finding: pre-existing verifier false-positive

The `verify_brand.mjs` `isDealerDomain` heuristic returns true on any URL containing `of-`, `of_`, ` of `, or `.of.`. This false-positives on manufacturer URLs like `astonmartin.com/our-world/news/...the-peak-of-sports-car-performance` and `lamborghini.com/news/the-new-human-machine-interface-of-lamborghini-revuelto`. These are legitimate manufacturer sources; the heuristic is over-aggressive.

Counts of FALSE-POSITIVE blockers in this category across Phase B brands:
- aston-martin: ~9 of 12 blockers
- bentley: ~0 of 7 (Bentley has different URL conventions)
- ferrari: ~4 of 7
- lamborghini: 1 of 1
- mclaren: ~6 of 11
- rolls-royce: ~5 of 9

The remaining "real" blockers across Phase B brands are mostly `msrp_base is null` entries where the trim's notes legitimately document manufacturer non-disclosure, which per §4.6 should be FYI, not BLOCKER.

## Phase B-introduced changes — schema validity

For each trim where Phase B set msrp_base:
- `msrp_base` is integer (e.g., 338250)
- `sources.msrp_base` is a string URL pointing to allowed editorial publisher
- `notes` contains the appended source-class sentence
- All other fields untouched
- Schema integrity preserved (verify_brand.mjs's `model_count`, `trim_count`, `total_images` counts unchanged)

Verifier did not surface any NEW blocker class introduced by Phase B's editorial-source MSRP. The new MSRP values cleanly satisfy the schema's integer + non-null requirement when present.

## Real blockers worth future attention

These would be candidates for a future verification fix-pass:

1. **Aston Martin "manufacturer URL contains 'of-'" false positives** — fix the verifier's `isDealerDomain` to be more specific.
2. **The verifier doesn't distinguish "msrp_base null + notes document non-disclosure" from "msrp_base null + no documentation"** — per the §4.6 policy and prior lesson #38, the null+documented case should be FYI not BLOCKER. The verify script wasn't updated when the master spec §13 nuance was added.
3. **Some trims have null msrp_base but their notes don't carry the regex-matchable non-disclosure phrasing** (Ferrari 296 GTS, 296 Speciale, 296 Speciale A, 12Cilindri, 12Cilindri Spider, Purosangue; Lotus Emeya R; etc.) — these were not Phase B targets per the brief's regex, so still null.

Per brief safety rule: "If any verification produces blockers, list them in SESSION_NOTES.md. Do not auto-fix in this session — that's a future session's call." Listing them here; no auto-fixes applied.

## Conclusion

The Phase B JSON edits are structurally valid. The verifier's blocker counts are inflated by a pre-existing false-positive in the dealer-domain heuristic, plus the verifier's not-yet-updated null-MSRP policy nuance. NEW Phase B work introduces zero new blocker classes; the new MSRP values + sources + notes pass schema validation cleanly.

The 41 trims filled by Phase B all have:
- non-null integer msrp_base
- editorial URL in sources.msrp_base
- notes documenting the §4.6 source class

The 16 trims left null still carry the existing non-disclosure note OR the new "MSRP not findable from allowed editorial sources as of 2026-05-15" addendum (where applicable).
