# Phase C — Data completeness (Session 10)

JD Power 2026 VDS scores and 2026 CR predicted reliability ratings filled across mainstream brands. JD Power 2026 APEAL has not yet been published (typical July release) — all customer_satisfaction unknowns received documented notes but remain at "unknown".

## Headline

| metric | Session 10 pre-C | Session 10 post-C | Δ |
|---|---:|---:|---:|
| reliability.confidence == "unknown" | 150 | **70** | **-80 (-53.3%)** |
| customer_satisfaction.confidence == "unknown" | 354 | 362 | +8 (new brands; APEAL not published) |
| reliability.confidence != "unknown" | 274 | 365 | +91 (+33%) |
| customer_satisfaction.confidence != "unknown" | 70 | 73 | +3 (small fixes during Phase C) |

## Per agent group

### Group 1 — German luxury (BMW, Mercedes-Benz, Audi)
- BMW: 21 reliability fills (most ICE models that were "unknown" plus M-cars + iX3)
- Mercedes-Benz: 12 reliability fills (CLA, CLE, MB-AMG models, EQS-SUV, Maybach-EQS-SUV, etc.)
- Audi: 4 reliability fills (a5, s5, a6-sedan, q3)
- **Total: 37 fills**

JD Power 2026 brand-level PP100: BMW=198, Mercedes-Benz=235, Audi=244.
CR 2026 Brand Report Card: BMW 5th (most reliable European brand); Mercedes-Benz 19th (lowest European); Audi 13th.

### Group 2 — Japanese (Honda, Toyota, Lexus, Acura, Mazda, Mitsubishi)
- Honda: 12 fills (entire Honda lineup)
- Toyota: 3 fills (bZ Woodland, C-HR, Camry — newly added MY26)
- Lexus: 1 fill (ES)
- Acura: 0 fills (all already at "low")
- Mazda: 1 fill (CX-5)
- Mitsubishi: 0 fills (all already at "low")
- **Total: 17 fills**

JD Power 2026 VDS: Lexus #1 premium at 151 PP100 (4th consecutive year); Toyota top-5 mass market at 185 PP100. CR 2026: Toyota #1 (62), Subaru #2 (68), Lexus #2 (65), Honda #4 (59), Acura #5 (55), Mazda #6 (55, dropped 8 spots due to CX-70/CX-90).

### Group 3 — Asian/Korean (Hyundai, Kia, Nissan, Infiniti, Subaru, Mini)
- Hyundai: 3 fills (Ioniq 6 N, Ioniq 9, Nexo)
- Kia: 0 fills (all already "low")
- Nissan: 7 fills (Sentra, Z, Z NISMO, LEAF, Rogue PHEV, Armada, Armada NISMO)
- Infiniti: 1 fill (QX80)
- Subaru: 4 fills (BRZ, WRX, Trailseeker, Uncharted)
- Mini: 0 explicit fills (all 7 already had 168 PP100; confirmed against 2026 VDS — Mini mass-market #2 behind Buick)
- **Total: 15 fills**

Subaru 2026 VDS = 181 PP100 (6th overall). Infiniti = 233 PP100 (worst in premium segment). Mini = 168 PP100.

### Group 4 — American (Ford, Chevrolet, GMC, Cadillac, Buick)
- Ford: 6 fills (Mustang Dark Horse SC, GTD, Bronco Sport, Escape, F-150, Maverick) — brand 228 PP100
- Chevrolet: 4 fills (Equinox, Tahoe, ZR1, ZR1X) — brand 178 PP100
- GMC: 10 fills (every model) — brand 228 PP100
- Cadillac: 4 fills (XT5, OPTIQ-V, VISTIQ, Escalade IQL) — brand 175 PP100; 1 still unknown (CELESTIQ, hand-built)
- Buick: 4 fills (every model) — brand 160 PP100 (#1 mass-market 2nd consecutive year)
- **Total: 28 fills**

GM Buick #1 mass-market, Cadillac #2 premium. Ford/GMC at 228 PP100 near bottom. CR 2026 brand rank: Buick 8th (highest US), Ford 11th (best in 15 years), Chevrolet 17th, Cadillac 18th, GMC 23rd.

### Group 5 — Stellantis + Euro mainstream (Jeep, Ram, Chrysler, Dodge, Fiat, VW, Volvo, Alfa Romeo, Maserati, Jaguar, Land Rover)
- Jeep: 1 fill
- Ram: 0 fills (all already "low"/"medium")
- Chrysler: 0 (newly built, satisfaction unknown documented)
- Dodge: 0 (newly built, satisfaction unknown documented)
- Fiat: 0
- Volkswagen: 1 fill
- Volvo: 3 fills
- Alfa Romeo: 0 fills (already at "low")
- Maserati: 0 — brand excluded from both JDP VDS and CR 2026 (insufficient sample). Documented.
- Jaguar: 0 fills (already at "low")
- Land Rover: 0 fills (already at "low")
- **Total: 5 fills**

JD Power 2026 VDS rankings: VW LAST at 301 PP100, Volvo 296, Land Rover 274. Stellantis: Ram 216 PP100 highest, Jeep 267 PP100 4th from bottom. Chrysler/Dodge/Fiat/Alfa Romeo/Jaguar/Maserati excluded for insufficient sales. CR 2026: Jeep 24th, Ram 25th (last); others unranked.

### Group 6 — EV-only brands (Tesla, Polestar, Rivian, Lucid, VinFast)
- Tesla: 0 fills (all 10 already had CR data at low/medium)
- Polestar: 0 (excluded from EVX/VDS, CR notes "no detailed data")
- Rivian: 0 (R1T/R1S had CR data; R2 too new)
- Lucid: 0 (Air had CR data; Gravity too new)
- VinFast: 0 (not sampled)
- **Total: 0 fills**

Notable: JD Power 2026 US EVX (EV Experience Study) released Feb 2026 — Tesla Model 3 (804) and Model Y (797) top premium BEV segment. CR 2026 brand rankings moved Tesla up 8 spots to 9th — biggest jump ever.

## Customer satisfaction (APEAL) status

JD Power 2026 US APEAL is **NOT yet published** as of 2026-05-15. Typical release window is July (study based on early-MY26 owner surveys). Every customer_satisfaction.confidence == "unknown" entry received a documented note: "Checked 2026-05-15; JD Power 2026 APEAL not yet published. Anticipated release July 2026." Confidences remain at "unknown" pending future fills.

This is the largest source of the remaining 362 satisfaction unknowns. When APEAL publishes, a future Phase C pass would lift the mainstream brand satisfaction confidences from unknown to medium/high.

## Files modified

Across 6 subagents, 32 brand files modified:
- BMW, Mercedes-Benz, Audi, Honda, Toyota, Lexus, Acura, Mazda, Mitsubishi, Hyundai, Kia, Nissan, Infiniti, Subaru, Mini, Ford, Chevrolet, GMC, Cadillac, Buick, Jeep, Ram, Chrysler, Dodge, Fiat, Volkswagen, Volvo, Alfa Romeo, Maserati, Jaguar, Land Rover, Tesla, Polestar, Rivian, Lucid, VinFast

All files saved with `.bak` backups created before writing. Both `data/<brand>.json` and `catalog/data/<brand>.json` synchronized.

## Cross-brand 2026 VDS reference table

| brand | 2026 VDS PP100 | CR 2026 brand rank | category leader |
|---|---:|---:|---|
| Lexus | 151 | #2 (65) | #1 premium 4th year |
| Buick | 160 | #8 (51) | **#1 mass-market 2nd year** |
| Mini | 168 | n/r | #2 mass-market |
| Cadillac | 175 | #18 (41) | #2 premium |
| Chevrolet | 178 | #17 (42) | — |
| Subaru | 181 | #2/#1 | #6 overall |
| Toyota | 185 | #1 (62) | top-5 mass market |
| Nissan | 194 | n/r | — |
| BMW | 198 | #5 | — |
| industry avg | 204 | — | — |
| Ram | 216 | #25 (last) | highest Stellantis |
| Ford | 228 | #11 (48) | — |
| GMC | 228 | #23 (31) | — |
| Mercedes-Benz | 235 | #19 (lowest Euro) | — |
| Infiniti | 233 | n/r (insufficient) | worst premium |
| Audi | 244 | #13 | — |
| Jeep | 267 | #24 | 4th from bottom |
| Land Rover | 274 | n/r | — |
| Volvo | 296 | n/r | 2nd to last |
| Volkswagen | 301 | n/r | last |

Excluded entirely from JD Power 2026 VDS (insufficient sample): Chrysler, Dodge, Fiat, Alfa Romeo, Jaguar, Maserati, Polestar, Rivian, Lucid, VinFast, and most ultra-luxury brands.

## Conclusion

Phase C lifted reliability data for 80 models across mainstream brands. The biggest gains came from filling JD Power 2026 VDS brand-level scores into models that previously had only "unknown" confidence. Customer satisfaction (APEAL) remained at unknown because the 2026 study hasn't been published yet; this is now well-documented with future-fill-able notes on 362 models.

The remaining 70 reliability unknowns are concentrated in:
- Ultra-luxury brands (Bentley 5, Lamborghini 3, Lotus 3, McLaren 6, Rolls-Royce 7, Ferrari 12, Aston Martin 13, Bugatti 2 = 51 unknowns — JD Power/CR don't sample) — appropriate to remain at unknown
- New EV brands (Polestar 2, Rivian 1 R2, Lucid 1 Gravity, VinFast 2 = 6 unknowns — too new for 2026 ratings)
- Stellantis low-sample brands (Maserati 6 — JDP+CR both exclude)
- Some genuinely missing data on Honda (1 model — Civic Hybrid added recently), Mitsubishi outliers, etc. (~6 unknowns)

This is the floor — these brands will remain at unknown until the volume threshold for JD Power sampling is met or until manual editorial-source fills (similar to Session 9's §4.6 MSRP relaxation) are authorized.
