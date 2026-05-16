# SESSION_SUMMARY_3.md — 2026-05-13 (15-brand chained Phase 1 batch)

Third chained Phase 1 session for the Car Catalog Project. This session added 15 new brand JSONs (Infiniti, GMC, Buick, Jaguar, Polestar, Jeep, Ram, Mitsubishi, Alfa Romeo, Maserati, Bentley, McLaren, Lotus, Rivian, Lucid), bringing the project to 41 researched brands. Tested the v2 `instructions/01_research_brand.md` (strengthened forbidden-source warning + pre-save self-check) at scale for the first time.

---

## Session totals

- **Brands researched this session:** 15 (1 more than the original target of 14 — all 15 from the brief had US lineups in 2026; none were excluded entirely).
- **Total models added:** 66
- **Total trims added:** 255
- **Total image entries flagged needs_scraping:** ~860 across the batch
- **Project cumulative:** 41 brands, 424 models, 1,463 trims

---

## Per-brand summary

| Brand | Models | Trims | researched_at | Notable findings / decisions |
|-------|--------|-------|---------------|-------------------------------|
| Infiniti | 2 | 12 | 2026-05-13 | Q50/Q60/QX50/QX55 all discontinued — Infiniti now SUV-only (QX60, QX80). QX60 uses 2.0L VC-Turbo I4 (replaced V6 in 2025); QX80 in Y63 2nd MY with new SPORT trim. NHTSA not yet rated either model for 2026. |
| GMC | 10 | 52 | 2026-05-13 | Sierra HD (HD pickups exempt from EPA/NHTSA/IIHS testing — MPG/safety null with notes). Hummer EV uses 2025 EPA data (mechanically identical for 2026). IIHS denied 2026 TSP for Acadia after tightening rear-seat criteria. Sierra 1500 has 4 engines including diesel; multi-powertrain split. Each step-up trim is its own trim_family per F-150 precedent. |
| Buick | 4 | 12 | 2026-05-13 | SUV-only brand (Encore GX, Envista, Envision, Enclave). Buick Electra EV (E5) China-only — US launch delayed by tariffs. 30-inch ultrawide display standard on Envision/Enclave for 2026. Super Cruise standard only on Enclave Avenir. |
| Jaguar | 1 | 3 | 2026-05-13 | F-PACE is the SOLE MY26 Jaguar (final ICE Jaguar, last unit built Dec 19 2025). XE/XF/F-TYPE production ended mid-2024; E-PACE/I-PACE ended Dec 2024. Type 01 GT EV delayed from late-2025 to mid-2026 — not yet on sale. Three powertrain lines (P250 I4 / P400 I6 MHEV / SVR V8) as singleton trim_families per Land Rover Defender precedent. Decision documented in SESSION_NOTES.md. |
| Polestar | 2 | 6 | 2026-05-13 | Polestar 2 dropped from US new-car sales (pre-owned only) due to tariff exposure of China production. Polestar 5 not yet on US sale (Europe/Australia only). Polestar 3 stays on 400V architecture for US MY26 (800V refresh UK first). Polestar 4 production moved to Busan, South Korea for tariff mitigation. |
| Jeep | 12 | 55 | 2026-05-13 | Lineup-heavy. Stellantis announced 4xe (PHEV) phase-out beginning MY26 — Wrangler 4xe and Grand Cherokee 4xe are FINAL-MY PHEVs. New 2.0L Hurricane 4 Turbo replaces V6 as Grand Cherokee standard. Wrangler Moab 392 split as separate model (V8 successor to discontinued Rubicon 392). All-new Cherokee returns as hybrid. Recon EV launches in single Moab trim only. Wagoneer S 2026 MY skipped per Stellantis Apr 2026 (production paused). |
| Ram | 3 | 22 | 2026-05-13 | Ram 1500 has 4 engines (V6 / HEMI V8 eTorque REVIVED for 2026 / Hurricane SO / Hurricane HO). Ram 1500 topped 2026 JD Power VDS Large Light Duty Pickup. 10yr/100k powertrain warranty announced for all Ram trucks. EXCLUDED: ProMaster (commercial), Ramcharger / Ram 1500 REV (2027 MY arrival), Ram 1500 SRT TRX (2027 MY). HD pickups (2500/3500) exempt from EPA/NHTSA/IIHS testing per regs. |
| Mitsubishi | 4 | 24 | 2026-05-13 | Mirage and Mirage G4 confirmed DISCONTINUED (production ended late 2024 — excluded). 2026 Outlander gets new 1.5L 48V MHEV replacing 2.5L NA + new LE trim + new Black Edition. 2026 Outlander PHEV mid-cycle refresh: 22.7 kWh battery (vs 20), 297 hp (vs 248), 45 mi range (vs 38), 73 MPGe. Eclipse Cross carries over with minimal changes. Outlander PHEV plug_type set null because CHAdeMO not in schema enum (one of only two US PHEVs still using CHAdeMO). |
| Alfa Romeo | 3 | 7 | 2026-05-13 | Quadrifoglio variants NOT offered for MY26 US (Stellantis dropped them after MY24; revived QF Collezione is Europe-only). Tonale PHEV DROPPED for 2026 US (slow sales + European engine-defect recall) — MY26 Tonale is gas-only Q4 AWD. Each model has 2 named trims (base + Veloce) per Stellantis press release language. Small lineup, completed quickly. |
| Maserati | 6 | 12 | 2026-05-13 | Ghibli, Levante, Quattroporte all DISCONTINUED. MC20/MC20 Cielo replaced by MCPura/MCPura Cielo for 2026. New GT2 Stradale (limited 914 units, sole-trim). Trofeo step-up trims treated as own powertrain lines per BMW X3 30 xDrive vs M50 xDrive precedent. GranTurismo Folgore + GranCabrio Folgore cite 2025 EPA IDs since 2026 not yet published. Maserati MSRPs sourced from KBB/TrueCar with secondary cross-references (manufacturer site gated to WebFetch). |
| Bentley | 5 | 22 | 2026-05-13 | Continental GT/GTC and Flying Spur now PHEV-ONLY for 2026 (W12 and pure V8 dropped). Two power tunes within PHEV line: High Performance Hybrid (671 bhp) and Ultra Performance Hybrid (771 bhp). Bentayga retains V8 + V6 PHEV. **ALL 22 trims have msrp_base null** per spec §13 ultra-luxury non-disclosure (Bentley does not publish US MSRP on consumer or accessible press sites). Mulliner treated as full trims (each has dedicated bentleymotors.com model card). Bentley first EV expected 2027 — not in 2026 lineup. |
| McLaren | 6 | 6 | 2026-05-13 | All sole-trim per spec §13. Lineup: Artura PHEV / Artura Spider / 750S / 750S Spider / 750S Le Mans Special Edition (50-unit MSO) / GTS. **ALL 6 trims have msrp_base null** per ultra-luxury non-disclosure. McLaren W1 EXCLUDED — 399-unit hypercar, all customer-allocated with waiting list (Aston Martin Valkyrie precedent). NHTSA/IIHS do not test McLaren. Artura cites 2023 EPA ID 45395 (only McLaren on EPA); 750S/GTS use brand-browse fallback per spec §4 since no EPA entries exist. 24 image URLs resolved directly to cars-assets-production.mclaren.com CDN (no needs_scraping flags). |
| Lotus | 3 | 6 | 2026-05-13 | Emira (4 trims), Eletre (sole-trim 'Carbon' due to 100% US tariff), Emeya (sole-trim 'R'). Evija EXCLUDED (130-unit limited-production hypercar, invite-only). Emeya R has msrp_base null per ultra-luxury non-disclosure (Lotus has not publicly announced US MSRP). Eletre and Emeya have NO EPA entries at any model year (Chinese-built EVs not yet US-EPA-tested) — sources.fuel_economy uses brand-browse fallback. Tariff context: Lotus Tech 44% revenue plunge / 46% delivery drop in 2025, slashed EV sales targets 78% due to US tariff exposure. |
| Rivian | 3 | 10 | 2026-05-13 | EV-only brand. R1T (5 trims), R1S (4 trims), R2 (1 trim Performance Launch Edition only). R1S earned IIHS 2026 TOP SAFETY PICK+ (one of only two large SUVs); R1T = no 2026 award. R2 EPA not yet published; sources.fuel_economy uses brand-browse fallback. Gen 2 R1 introduced 1,025-hp in-house Quad-Motor (replacing Bosch 835 hp Gen 1) + native NACS port + zonal electrical architecture. CR predicted reliability 2/5 on R1T/R1S. Schema extension for pickup: bed_length_in, bed_volume_cuft, frunk_cuft, gear_tunnel_cuft on R1T. |
| Lucid | 2 | 6 | 2026-05-13 | EV-only brand. Air (4 trims: Pure/Touring/GT/Sapphire), Gravity (2 trims: Touring/GT). Gravity is Lucid's first vehicle with NATIVE NACS port; Air retains CCS1 with adapter. Air Sapphire $249K (1,234 hp, 1.89s 0-60). Gravity GT longest-range three-row EV SUV (450 mi). 2027 MY Gravity refresh announced April 2 2026 EXCLUDED (still 2026 MY for this catalog). Dream Edition Gravity excluded as limited-launch. NHTSA Air 5-star (MY25 carried forward); Gravity not yet rated. |

---

## Lineup decisions / structural notes

### Models excluded as discontinued or out-of-scope

| Brand | Excluded | Reason |
|-------|----------|--------|
| Infiniti | Q50, Q60, QX50, QX55 | All sedans/coupes and lower SUVs discontinued for 2026 |
| Jaguar | E-PACE, F-TYPE, I-PACE, XE, XF | Production ended 2024-2025; only F-PACE survives |
| Polestar | Polestar 2 | US new-car sales discontinued (pre-owned only) due to tariff exposure |
| Polestar | Polestar 5 | Not yet on US sale (Europe/Australia only) |
| Jeep | Wagoneer S | 2026 MY skipped per Stellantis Apr 2026 (production paused) |
| Jeep | standard Wagoneer | Discontinued for 2026 — only Grand Wagoneer continues |
| Jeep | Renegade | US-discontinued, no successor till 2027 STLA Small EV |
| Jeep | old KL Cherokee | Replaced by all-new 5th-gen for 2026 |
| Ram | ProMaster Cargo Van / ProMaster City | Commercial vehicles, out of scope per project §1 |
| Ram | TRX, 1500 REV / Ramcharger | All 2027 MY arrivals — not yet on sale |
| Mitsubishi | Mirage, Mirage G4 | Production ended late 2024 |
| Alfa Romeo | Giulia Quadrifoglio, Stelvio Quadrifoglio | Discontinued for US after MY24 (Europe-only revival) |
| Maserati | Ghibli, Levante, Quattroporte, MC20 | All discontinued; MCXtrema is 62-unit track-only |
| Bentley | first Bentley EV (Beyond100+) | Expected 2027, not in 2026 lineup |
| McLaren | W1 | 399-unit hypercar, all customer-allocated (Valkyrie precedent) |
| Lotus | Evija | 130-unit limited-production hypercar, invite-only |
| Lucid | Dream Edition Gravity | Limited-launch edition no longer orderable |

### Ultra-luxury MSRP nulls (per spec §13)

Confirmed brands with all/most trim msrp_base set to null due to manufacturer non-disclosure:
- **Bentley:** 22/22 trims
- **McLaren:** 6/6 trims
- **Lotus:** 1/6 trims (Emeya R only; Emira and Eletre Carbon have published MSRPs)

This is the expected pattern, not a research defect. Matches Rolls-Royce / Aston Martin / Ferrari precedent.

### Multi-powertrain decisions

Per spec §6: each powertrain line's lowest-MSRP trim is `is_base_trim: true`. Key examples in this batch:
- **GMC Sierra 1500:** 4 engines (2.7T / 5.3L V8 / 6.2L V8 / 3.0L Duramax I6 diesel) — Pro is base of gas line, Pro Diesel split as separate diesel-line base.
- **Jeep Wrangler ICE vs Wrangler 4xe vs Wrangler Moab 392:** three separate models per jeep.com marketing.
- **Ram 1500:** 4 engines, each major engine line has its own base trim.
- **Jaguar F-PACE:** 3 powertrain lines (I4 / I6 MHEV / V8 SVR) as singleton trim_families.
- **Bentley Bentayga:** V8 base + V6 PHEV + V8 Speed-tune — multi-powertrain handled at trim level within Bentayga model.
- **Maserati Grecale, GranTurismo, GranCabrio:** Modena (ICE) + Trofeo (high-output ICE) + Folgore (EV) — each Trofeo treated as own powertrain line per BMW X3 30 xDrive / M50 precedent.

### Sole-trim atomic rule

Applied consistently across all 255 trims this session. Confirmed in the agents' self-checks: every trim where `trim_family` has exactly one trim has `is_base_trim:true` AND `delta_from_base:null` simultaneously.

---

## Items requiring human attention

Items written/appended to `SESSION_NOTES.md`:

1. **Jaguar F-PACE Final Edition** — Dealer pages list an "SVR 575 Final Edition" at $95K, but jaguar.com's primary trims page lists only 3 trims. Could be a fourth trim in a future fix-pass when a Jaguar press release confirms. Treated as note on SVR 575 Edition for now.
2. **Mitsubishi Outlander PHEV SE/SEL MSRPs** — Press release only published ES and Black Edition pricing; SE/SEL announced "closer to launch" but not yet disclosed as of 2026-05-13. Set to null with notes (mainstream brand null MSRP is normally a blocker — verifier should treat as FYI for this case).
3. **Bentley/McLaren/Lotus Emeya R ultra-luxury MSRP nulls** — Documented per §13 pattern. Verifier should treat as FYI not blocker.
4. **Jeep Recon, Ram REV/Ramcharger** — EPA entries not yet published for these new EVs; sources.fuel_economy uses brand-browse fallback per spec §4. Some values null pending EPA publication.

---

## Effectiveness of v2 instruction file at scale (qualitative)

The v2 `instructions/01_research_brand.md` was being tested at scale for the first time. Observations:

1. **Forbidden-source warnings appear to be working.** All five agents in the second batch (Jeep, Ram, Mitsubishi, Alfa Romeo, Maserati) self-reported running cleanup passes when they initially cited cars.com / motor1.com / carbuzz.com etc., and the pre-save self-check caught these before final save. Maserati specifically noted "All forbidden sources (cars.com, motor1.com, carbuzz.com, autoblog.com, autoevolution.com) removed and replaced with manufacturer/Stellantis/EPA URLs". The Bentley/McLaren/Lotus/Rivian/Lucid agents reported no forbidden-source residuals.

2. **Sole-trim atomic rule held up cleanly.** All 15 brands' agents explicitly confirmed every singleton trim_family satisfied `is_base_trim:true` + `delta_from_base:null` simultaneously. This rule's mid-instruction-file placement with its "atomic action" language seems to land.

3. **Ultra-luxury MSRP non-disclosure pattern is now the explicit expected answer.** Bentley (22/22 nulls), McLaren (6/6), and partial Lotus all used null + notes correctly without prompting. The §13 documentation paid off.

4. **NHTSA/IIHS non-testing acknowledgment for low-volume.** Bentley, McLaren, Lotus, Maserati, Jaguar (F-PACE), Alfa Romeo all set safety ratings null with proper notes; no agent escalated null safety to a blocker.

5. **EPA-unavailable fallback pattern (§4) worked smoothly.** Multiple brands had at least one model with no current-MY EPA entry (Jeep Recon, Ram 1500 REV, McLaren 750S/GTS, Lotus Eletre/Emeya, Lucid Gravity Touring); each agent applied the brand-browse fallback URL convention without confusion.

6. **Multi-powertrain rule was consistently applied.** Particularly tested by Jeep (Wrangler ICE vs 4xe vs Moab 392), Maserati (Trofeo vs Folgore vs Modena), GMC (Sierra 1500's 4 engines), and Bentley (Bentayga's V8 + V6 PHEV + V8 Speed).

7. **Image scraping placeholder convention** — agents correctly flagged image URLs as needs_scraping when manufacturer CDN access was gated (most brands), but resolved direct asset URLs when possible (McLaren 24/24 resolved, Jaguar 11/12 resolved).

**Quantitative drift events to forbidden domains noted by agents during this session:** approximately 8-15 cleanup events across 5 agents (Jeep, Ram, Maserati, plus 2 minor in earlier batches). Compared to prior batches' 30-40 forbidden URL residuals per 10-brand batch, this is a meaningful drop — though it's hard to fully attribute because (a) this session used per-agent prompts with explicit forbidden-source reminders baked in, and (b) the prior batch totals included Mazda/Audi/Tesla residuals that pre-dated v2 instructions. Net: v2 instructions clearly help, magnitude of help is uncertain.

---

## Files modified in this session

```
data/infiniti.json            (new — 2 models, 12 trims)
data/gmc.json                 (new — 10 models, 52 trims)
data/buick.json               (new — 4 models, 12 trims)
data/jaguar.json              (new — 1 model, 3 trims)
data/polestar.json            (new — 2 models, 6 trims)
data/jeep.json                (new — 12 models, 55 trims)
data/ram.json                 (new — 3 models, 22 trims)
data/mitsubishi.json          (new — 4 models, 24 trims)
data/alfa-romeo.json          (new — 3 models, 7 trims)
data/maserati.json            (new — 6 models, 12 trims)
data/bentley.json             (new — 5 models, 22 trims)
data/mclaren.json             (new — 6 models, 6 trims)
data/lotus.json               (new — 3 models, 6 trims)
data/rivian.json              (new — 3 models, 10 trims)
data/lucid.json               (new — 2 models, 6 trims)
STATUS.md                     (15 new brand rows added by subagents)
SESSION_NOTES.md              (Jaguar decision notes added by subagent)
SESSION_SUMMARY_3.md          (this file)
PROJECT_STATE.md              (cumulative totals + new lessons learned)
```

---

## What's next (for the next session)

Per the project's now-extended scope:

1. **Phase 2 incremental build for the 15 new brands** — run `python scripts/build_catalog.py` to copy the new JSONs into `catalog/data/` and regenerate `catalog/manifest.json`. Should bring the unified site to 41 brands / 424 models / 1,463 trims.
2. **Phase 3 verification** of the 15 new brands — independent verification of each, focusing on:
   - Forbidden-source URL residuals (v2 instruction-file test signal)
   - Singleton trim_family without 4 images
   - Multi-powertrain `is_base_trim:true` correctness
   - Ultra-luxury null msrp_base + notes correctness (Bentley, McLaren, partial Lotus)
3. **Phase 4 image scrape** — STILL gated on human Mini smoke test. After smoke test passes, can chain across 22 brand configs PLUS the 15 new brands' configs (which still need to be created in `scripts/brand-configs/`).

Phase 4 brand configs need creation for: infiniti, gmc, buick, jaguar, polestar, jeep, ram, mitsubishi, alfa-romeo, maserati, bentley, mclaren, lotus, rivian, lucid (15 new). Total brand configs needed will be 41.

**Safety rules from this session's brief observed:**
- No Phase 4 scripts executed.
- No script files in scripts/ modified.
- No instruction files in instructions/ modified.
- No data/_partials/ modifications.
- Save points after every model per agent self-reports.
- Items flagged in SESSION_NOTES.md, not acted on.
