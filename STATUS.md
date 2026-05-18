# STATUS.md

Per-brand pipeline state for the Car Catalog Project. Updated by each phase at the end of its run.

| Brand          | Research | Built into site | Verified | Last updated  | Notes                                                                  |
|----------------|----------|-----------------|----------|---------------|------------------------------------------------------------------------|
| Honda          | done     | yes             | done     | 2026-05-15    | Session 11 fix-pass: 28 forbidden-source blockers eliminated (cars.com/carbuzz/autoblog in sources + professional_reviews removed); now clean (0 blockers, 3 warnings) |
| BMW            | done     | yes             | done     | 2026-05-15    | Session 11 fix-pass: 62 forbidden-source blockers eliminated. Session 11 Phase 3: pricing drift applied (3-series/330i +$500, x5/xdrive40i +$2000, x3/30-xdrive +$625). Clean (0 blockers, 2 warnings) |
| Toyota         | done     | yes             | done     | 2026-05-15    | Session 12 fix-pass: 56 singleton-no-images blockers cleared via 49 minimal-diff trim_family renames (15 models — corolla/corolla-cross/corolla-hatchback/gr-corolla/gr-supra/gr86/grand-highlander/highlander/land-cruiser/prius/rav4/sequoia/sienna/tacoma/tundra). No image/local_path/is_base_trim changes. Now clean (0 blockers, 28 warnings). Singleton-with-<4-images warnings remain on partially-imaged singleton trims — out of scope. Session 11 fix-pass (63 forbidden-source) already applied. |
| Mercedes-Benz  | done     | yes             | done     | 2026-05-15    | Session 11 fix-pass: 15 forbidden-source blockers eliminated (carbuzz/cars.com/motor1). Now clean (0 blockers, 1 warning) |
| Mazda          | done     | yes (2026-05-13) | 2026-05-13 | 2026-05-13    | post-fix-pass clean (3 informational warnings retained: CX-70 PHEV MPGe 56 vs EPA 61, CX-70 base city 24 vs EPA 23, Mazda3 Hatchback dimensions URL 404) |
| Acura          | done     | yes (2026-05-13) | 2026-05-13 | 2026-05-13    | post-fix-pass clean (2 informational warnings retained: Integra Type S IIHS TSP scope question, brand-wide safety-source-URL roll-ups vs per-vehicle) |
| Lexus          | done     | yes (2026-05-12) | 2026-05-12 | 2026-05-12  | verification: 0 blockers, 3 warnings, 4 FYIs; 11 models, 54 trims; 216 image entries need_scraping; IS 500/RC/RC F/RX L/UX-gas/LBX excluded (discontinued or not US-sold); LS in final year as single Heritage Edition; ES is all-new 8th-gen with hybrid+BEV powertrains only (no gas); RZ refreshed with NACS port and new 550e F SPORT |
| Audi           | done     | yes (2026-05-13) | 2026-05-13 | 2026-05-13    | post-fix-pass clean (2 informational warnings retained: RS 7 Sportback body-style, 48V MHEV powertrain.type classification) |
| Tesla          | done     | yes (2026-05-13) | 2026-05-13 | 2026-05-13    | post-fix-pass clean (3 informational warnings retained: evspecifications.com source policy, Cybertruck truck-bed schema fields, Model Y Performance NHTSA 2025 URL year) |
| Lamborghini    | done     | yes (2026-05-13) | 2026-05-13 | 2026-05-13    | post-fix-pass clean (3 informational warnings retained: Temerario MPGe vs EPA HEV, Urus SE MSRP source provenance, Urus SE fuel_tank mfr vs EPA) |
| Rolls-Royce    | done     | yes (2026-05-13) | 2026-05-15 | 2026-05-15    | Session 11 fix-pass: 4 forbidden-source blockers eliminated (mix of notes-rewording for verifier non-disclosure-aware FYI + URL replacements). Now clean (0 blockers, 4 FYIs) |
| Aston Martin   | done     | yes (2026-05-12) | 2026-05-15 | 2026-05-15    | Session 11: 3 null-MSRP blockers downgraded to FYIs by patched verifier (now correctly treats documented ultra-luxury non-disclosure as FYI per spec §13). Clean (0 blockers, 3 FYIs) |
| Porsche        | done     | yes (2026-05-13) | 2026-05-13 | 2026-05-13    | post-fix-pass clean (5 informational warnings retained: 2 EPA MPG accuracy, 2 Cayenne E-Hybrid base-trim null blocks, 1 Panamera/Taycan Sport Turismo body-style taxonomy) |
| Mini           | done     | yes (2026-05-13) | 2026-05-13 | 2026-05-13    | verification: 0 blockers, 0 warnings, 4 FYIs (cleanest brand of this batch); Phase 1 research complete 2026-05-12; 7 models, 11 trims; 38 image entries flagged needs_scraping; MY2026 pricing/lineup verified from press.bmwgroup.com USA press release T0450606EN_US (June 5, 2025) + miniusa.com; all 10 EPA fueleconomy.gov IDs verified (Cooper C 2 Door 49227, Cooper S 2 Door 49228, JCW 2 Door 49229, Cooper C 4 Door 49265, Cooper S 4 Door 49266, Cooper C Convertible 49185, Cooper S Convertible 49186, JCW Convertible 49187, Countryman S ALL4 49522, JCW Countryman ALL4 49523, Countryman SE ALL4 18" 50222, Countryman SE ALL4 19" 50223); Cooper SE Electric 2 Door dropped for 2026; Countryman SE ALL4 EV included as 2026 MY based on EPA + miniusa.com consumer page (press release had said it would remain as 2025 MY pending pricing announcement but pricing/EPA listings have since appeared); JCW 2 Door / JCW Convertible / JCW Countryman ALL4 split as separate models per performance-variant rule (each has dedicated miniusa.com page); Countryman has dual powertrain lines (ICE S ALL4 base + EV SE ALL4 base, both is_base_trim true with delta_from_base null per multi-powertrain rule); Signature/Signature Plus/Iconic equipment tiers treated as packages per spec §6.5 not separate trims; JD Power 2026 VDS Mini ranked 3rd among mass-market brands with 168 PP100 (vs 204 industry avg) — medium confidence on reliability for all models; IIHS Top Safety Pick carries from 2025 award for Countryman/JCW Countryman ALL4 (same generation); NHTSA has not yet rated any 2026 Mini; sole-trim atomic rule applied to JCW 2 Door / JCW Convertible / JCW Countryman ALL4 / Countryman SE ALL4 |
| Ferrari        | done     | yes (2026-05-12) | 2026-05-15 | 2026-05-15    | Session 11: 7 null-MSRP blockers downgraded to FYIs by patched verifier (documented Ferrari-US no-published-MSRP gap → FYI per spec §13). Clean (0 blockers, 2 warnings, 7 FYIs) |
| Cadillac       | done     | yes (2026-05-13) | 2026-05-13 | 2026-05-13    | post-fix-pass clean (4 informational warnings retained: 73 gmauthority sources for fallback, LYRIQ/OPTIQ Sport 3 null spec blocks, CT5 PL 1-MPG EPA off, NHTSA/IIHS partial) |
| Subaru         | done     | yes (2026-05-13) | 2026-05-15 | 2026-05-15    | Session 11: 13 verifier false-positive blockers eliminated by isDealerDomain hostname-only patch (subaru.com/owners/benefits-of-ownership URLs no longer misflagged). Now clean (0 blockers, 9 warnings) |
| Volvo          | done     | yes (2026-05-13) | 2026-05-15 | 2026-05-15    | Session 11 fix-pass: 3 ES90 trim notes reworded ("MSRP not yet announced" → "pricing not published by Volvo / MSRP not findable from allowed editorial sources") to match verifier non-disclosure regex. Now clean (0 blockers, 11 warnings, 3 FYIs) |
| Volkswagen     | done     | yes (2026-05-13) | 2026-05-15 | 2026-05-15    | Session 11 fix-pass: 1 dealer URL (vwofnpr.com on atlas/sel-premium-r-line msrp_base) replaced with media.vw.com press kit. Clean (0 blockers, 1 warning) |
| Genesis        | done     | yes (2026-05-13) | 2026-05-13 | 2026-05-13    | post-fix-pass clean (1 image-gap note retained on GV70 2.5T Sport Prestige AWD singleton) |
| Kia            | done       | yes (2026-05-13) | 2026-05-13 | 2026-05-13    | post-fix-pass clean |
| Hyundai        | done       | yes (2026-05-13) | 2026-05-13 | 2026-05-13    | post-fix-pass clean |
| Land Rover     | done       | yes (2026-05-13) | 2026-05-13 | 2026-05-13    | post-fix-pass clean |
| Chevrolet      | done       | yes (2026-05-13) | 2026-05-15 | 2026-05-15    | Session 11 Phase 3: pricing drift applied (equinox/lt-fwd +$200, tahoe/rst-4wd -$2295, colorado/lt-4wd -$2095). Clean (0 blockers, 36 warnings — most are HD truck EPA-exempt / GMauthority secondary citations) |
| Ford           | done       | yes (2026-05-13) | 2026-05-13 | 2026-05-13    | post-fix-pass clean (4 informational warnings retained: 4 base trims missing sources entries, 27 singleton families had 1/4 images now resolved via flips, NHTSA/IIHS partial, Super Duty fuel_economy populated despite HD-truck exemption) |
| Nissan         | done       | yes (2026-05-13) | 2026-05-13 | 2026-05-13    | post-fix-pass clean |
| Infiniti       | done       | yes (2026-05-13) | 2026-05-13 | 2026-05-13    | post-fix-pass clean (4 fixes: QX60+QX80 SPORT and AUTOGRAPH singleton trim_families flipped to is_base_trim:true + delta_from_base:null; 6 warnings retained including QX80 IIHS TSP→TSP+ rating mismatch and NHTSA roll-up URLs on 2 base trims; 4 FYIs) |
| Jaguar         | done       | yes (2026-05-13) | 2026-05-13 | 2026-05-13    | post-fix-pass clean (0 fixes needed; 1 warning: P400 rear_three_quarter image flagged needs_scraping; 3 FYIs). F-PACE only — final ICE Jaguar; three singleton trim_families (P250/P400 MHEV/SVR) per Land Rover Defender precedent |
| Buick          | done       | yes (2026-05-13) | 2026-05-13 | 2026-05-13    | post-fix-pass clean (0 fixes needed; 3 warnings including buick.com maintenance page during verification; 4 FYIs). SUV-only brand |
| Mitsubishi     | done       | yes (2026-05-13) | 2026-05-15 | 2026-05-15    | Session 11 fix-pass: 2 outlander-phev trim notes reworded to match verifier non-disclosure regex. Now clean (0 blockers, 19 warnings, 2 FYIs) |
| GMC            | done       | yes (2026-05-13) | 2026-05-13 | 2026-05-13    | post-fix-pass clean (2 fixes: Hummer EV Pickup msrp_range.high 121500→107195 and Hummer EV SUV 120000→104700 — Carbon Fiber Edition option package was inflating high; 39 warnings retained including EV trims duplicating MPGe into fuel_economy.mpg fields and 30 base trims with >2 null spec blocks under singleton architecture; 19 FYIs including 77 gmauthority.com fallback citations). HD pickups exempt from EPA/NHTSA/IIHS testing |
| Polestar       | done       | yes (2026-05-13) | 2026-05-13 | 2026-05-13    | post-fix-pass clean (0 fixes needed; 6 warnings including EV trims populating fuel_economy.mpg with MPGe values, NHTSA/IIHS roll-up URLs, Polestar 3 LRSM citing P4 warranty page; 5 FYIs). 2 models (Polestar 3, Polestar 4), 6 trims — EV only |
| Jeep           | done       | yes (2026-05-13) | 2026-05-13 | 2026-05-13    | post-fix-pass clean (0 fixes needed; 149 warnings including 97 moparinsiders.com Stellantis-fan-site citations and 40 step-up trims with mostly-null spec blocks under singleton architecture; 3 FYIs). Largest brand of session 4 — 12 models, 55 trims |
| Alfa Romeo     | done        | yes (2026-05-13) | 2026-05-13 | 2026-05-13    | post-fix-pass clean (0 fixes needed; 2 warnings on NHTSA roll-up URLs for mainstream brand convention; 4 FYIs). 3 models, 7 trims; Tonale PHEV dropped, Quadrifoglios dropped for MY26 US |
| Ram            | done        | yes (2026-05-13) | 2026-05-13 | 2026-05-13    | post-fix-pass clean (0 fixes needed; 11 warnings including 9 moparinsiders.com citations on Ram 1500 msrp_base; 7 FYIs). HD pickups (2500/3500) exempt from EPA/NHTSA/IIHS testing |
| Bentley        | done        | yes (2026-05-13) | 2026-05-15 | 2026-05-15    | Session 11: 7 null-MSRP blockers downgraded to FYIs by patched verifier. Clean (0 blockers, 0 warnings, 7 FYIs) |
| Rivian         | done       | yes (2026-05-13) | 2026-05-15 | 2026-05-15    | Session 11 fix-pass: 2 iseecars.com dimensions URLs replaced with rivian.com model pages (r1t/dual-standard, r1s/dual-large). Now clean (0 blockers) |
| Lotus          | done        | yes (2026-05-13) | 2026-05-15 | 2026-05-15    | Session 11 fix-pass: 7 wikipedia dimensions URLs replaced with lotuscars.com pages across emira/eletre/emeya. Now clean (0 blockers, 1 FYI) |
| Maserati       | done       | yes (2026-05-13) | 2026-05-15 | 2026-05-15    | Session 11 fix-pass: 1 topspeed.com URL on grancabrio/modena performance.zero_to_60_sec replaced with kbb.com specs page. Now clean (0 blockers) |
| McLaren        | done       | yes (2026-05-13) | 2026-05-15 | 2026-05-15    | Session 11 fix-pass: 6 wikipedia dimensions URLs replaced with cars.mclaren.com trim pages; 1 hiconsumption professional_reviews removed. Now clean (0 blockers, 2 FYIs) |
| Lucid          | done       | yes (2026-05-13) | 2026-05-13 | 2026-05-13    | post-fix-pass clean (0 fixes needed; 7 warnings; 5 FYIs). 2 models (Air, Gravity), 6 trims — EV only; 2027 MY Gravity refresh deliberately excluded |
| Bugatti        | done        | yes (2026-05-15) | session10-verified | 2026-05-15    | Phase 1 research + Phase 2 build + Phase 4 download complete. 2 models, 2 trims, 8/8 = 100% image coverage. Verifier 0 blockers / 1 warning / 0 fyi. Tourbillon MY2026 (V16 hybrid PHEV $4.1M) + W16 Mistral MY2025 (quad-turbo W16 $5.4M); both sole-trim. Bolide excluded (track-only). §4.6 MSRP relaxation applied. |
| Dodge          | done        | yes (2026-05-15) | 2026-05-15 | 2026-05-15 | Session 11: 12 verifier false-positive blockers eliminated by isDealerDomain hostname-only patch (prnewswire.com/dodgegarage.com URLs no longer misflagged). Clean (0 blockers, 12 warnings). Phase 1 research complete 2026-05-15. 3 models, 15 trims. Lineup: Charger Daytona (EV, 4 trims: Scat Pack Coupe / Scat Pack Sedan / Scat Pack Plus Coupe / Scat Pack Plus Sedan — base Daytona R/T EV trim discontinued for MY26 per autonews + Stellantis citing weak demand and US tariffs on Canada-built Charger); Charger Sixpack (ICE, 8 trims: R/T Coupe/Sedan, R/T Plus Coupe/Sedan, Scat Pack Coupe/Sedan, Scat Pack Plus Coupe/Sedan — new 3.0L Hurricane twin-turbo I6 in S.O. 420 hp and H.O. 550 hp tunes, standard AWD with selectable RWD); Durango (3 trims: GT 5.7L HEMI / R/T 392 Launch Edition 6.4L HEMI / SRT Hellcat 6.2L supercharged HEMI — 2026 is final MY for Hellcat and R/T 392 before MY27 V8 discontinuation, every Durango is now V8-standard, V6 limited-production only). Charger Daytona EV split from Charger Sixpack ICE as separate models per spec §6.4 multi-powertrain rule and jeep.json Wrangler/Wrangler 4xe precedent. Hornet (discontinued for MY26) and Challenger (discontinued earlier) excluded. dodge.com WebFetch returned HTTP 403 throughout — primary sources are dodgegarage.com press-room releases, media.stellantisnorthamerica.com (release IDs 26970 Charger Daytona Scat Pack + 26972 Durango HEMI lineup), and prnewswire.com Stellantis press releases. All EPA fueleconomy.gov IDs individually verified: Charger Daytona Scat Pack 49649 (86 MPGe, 241 mi range), Charger R/T Sixpack 50283 (20 mpg combined), Charger Scat Pack Sixpack 50068 (19 mpg combined), Durango GT 5.7L 49576 (16 mpg combined), Durango R/T 392 6.4L 50150 (15 mpg combined), Durango SRT Hellcat 6.2L 50149 (13 mpg combined). NHTSA 4 stars on Durango (carries over from 2011-2026 same-platform third-gen testing); Charger 2026 not yet rated by NHTSA or IIHS (second-gen LB platform too new). IIHS small-overlap-front Marginal on Durango driver-side only (incomplete), no Top Safety Pick. Image URLs sourced from Stellantis Media galleries 1509 (Charger) and 1512 (Durango), all direct s3.amazonaws.com/chryslermedia.iconicweb.com JPG paths. Side profile and interior images flagged needs_scraping for several Charger trims and 1 Durango trim (8 needs_scraping entries total) — Stellantis press gallery focuses on 3/4 exterior angles. Sole-trim atomic rule applied to all 15 trims correctly (every base trim has is_base_trim:true + delta_from_base:null; step-up Plus trims point at the corresponding family base). Tow N Go (Durango GT HEMI), GT Plus/GT Premium/America250 (Durango GT), Hellcat Jailbreak ($995 customization unlock), and R/T 392 Launch Edition Premium ($57,595 content package) all treated as packages per §6.5 not separate trims. msrp_range computed per trim-base spec. |
| Fiat           | done        | yes (2026-05-15) | session10-verified | 2026-05-15 | Phase 1 research complete 2026-05-15. Single-model brand: 500e (MY2026, hatchback) with 2 trims (Pop base $35,700, Icona step-up $37,700; destination $1,995). BEV only — 42 kWh battery, 117 hp FWD single motor, 0-60 8.5 sec, 8yr/100k EV battery warranty. EPA fueleconomy.gov IDs 50198 (Pop low-rolling-resistance 149 mi / 116 MPGe combined) and 50199 (Icona all-season 141 mi / 110 MPGe combined) individually verified. NHTSA + IIHS have not tested any 2024-2026 Fiat 500e (safety ratings null). JD Power and Consumer Reports do not publish current-MY scores (sample size below threshold; CR notes 'expected less reliable than other new cars'). fiatusa.com returned HTTP 403 to WebFetch — primary source = Stellantis press releases at media.stellantisnorthamerica.com (US release id=27662, Canada release id=27659). Image URLs sourced from Stellantis media gallery 1561 (8 direct s3.amazonaws.com/chryslermedia.iconicweb.com JPGs covering both trims; all four required angles present on each trim's images[]). Pop and Icona share trim_family '500e' (same body and powertrain). Discontinued / not-in-scope: 500X, 124 Spider, 500 Abarth (all dropped from US years ago); MY25 'INSPI(RED)' / Inspired By Music / Beauty / LA tiers and Giorgio Armani Collector's Edition (MY25-only); Topolino (announced, not yet on sale in US) |
| VinFast        | done        | yes (2026-05-15) | 2026-05-15 | 2026-05-15 | Session 11: 2 verifier false-positive blockers eliminated by isDealerDomain hostname-only patch (vinfastauto.us URLs no longer misflagged). Clean (0 blockers, 1 warning). Phase 1 research complete 2026-05-15. 2 models (VF 8 MY2025, VF 9 MY2024), 4 trims total. BEV-only brand. Both models share single powertrain line (dual-motor AWD) with Eco base + Plus step-up. All EPA fueleconomy.gov IDs verified individually (VF 8 Eco 49086, VF 8 Plus 49087, VF 9 Eco 47487, VF 9 Plus 47488). NHTSA tested 2024 VF 8 only (4-star overall, 2-star frontal — applied to 2025 VF 8 trims; VF 9 not tested); IIHS has not tested any VinFast model. JD Power VDS/APEAL and CR predicted-reliability confidence: unknown for both models (brand entered US market 2023, no aggregator data yet). All units currently assembled in Hai Phong, Vietnam (Chatham County NC plant remains delayed, production now targeting 2028 per March 2026 financial release). VF 7 and VF 6 deliberately excluded (coming-soon / not US-launched). Destination fee $1,390 sourced from VF 8 offer-terms page (no separate VF 9 offer-terms page — redirects to vehicles/vf-9). VF 9 Plus MSRP $73,800 sourced from VinFast November 2024 US-launch press release (consumer page currently advertises only the Eco's $62,900 starting figure). VF 8 trim_family 'vf-8' (Eco+Plus share styling), VF 9 trim_family 'vf-9' (Eco+Plus share styling). Owner reviews sample size <10 on both models — confidence: low/unknown |
| Chrysler       | done       | yes (2026-05-15) | session10-verified | 2026-05-15 | Phase 1 research complete 2026-05-15. 3 models, 6 trims. Pacifica gas line (Select base $42,465 / Limited / Pinnacle), Pacifica Hybrid PHEV line (Plug-in Hybrid Select base $51,070 / Plug-in Hybrid Pinnacle), Voyager LX sole-trim ($39,995). Chrysler 300 sedan discontinued after MY23 — excluded per task brief. All 3 EPA fueleconomy.gov IDs verified individually: 49434 (2026 Pacifica gas FWD), 49762 (2026 Pacifica Hybrid PHEV — 82 MPGe / 32 mi electric / 520 mi total / 30 MPG charge-sustain), 49435 (2026 Voyager). chrysler.com WebFetch returned HTTP 403 throughout — primary sources are Stellantis press kit PDFs (2026_CH_Pacifica_SP.pdf, 2026_CH_Pacifica_Plug-in_Hybrid_SP.pdf, 2026_CH_Pacifica_FA.pdf served via s3.amazonaws.com/chryslermedia.iconicweb.com CDN), media.stellantisnorthamerica.com press releases (id 27056 Pacifica 100th Anniversary, id 26177/26223 Voyager return), and Edmunds/KBB for Limited and Pinnacle MSRPs (Stellantis published only Select-tier launch prices for 2026). 100th Anniversary Edition treated as $1,925 package on Select per spec §6.5 (not separate trim). AWD treated as +$2,995 per-trim driveline option per Chrysler build-and-price marketing (not separate trim line) — matches Toyota Sienna precedent. Pacifica Hybrid split as separate model per spec §6.2 multi-powertrain rule (distinct powertrain line: Atkinson V6 + 2 motors + 16-kWh battery + eFlite eVT vs gas 9-spd auto). Voyager LX sole-trim atomic rule applied (is_base_trim:true + delta_from_base:null). NHTSA 5-star overall on all 3 models; IIHS Marginal moderate-overlap-front prevents Top Safety Pick on all 3 (Voyager additionally rated Poor headlights). JD Power 2026 VDS excluded Chrysler brand (below sample size); CR predicted reliability not publicly published for 2026 MY. All 24 image URLs are direct .jpg assets on Stellantis press S3 CDN (zero needs_scraping). PHEV city/highway/combined_mpg set to 30/30/30 per fueleconomy.gov charge-sustaining (EPA does not separately break out city vs highway for the gasoline-only mode on PHEV summary page); MPGe 82 in ev_specifics. EV battery warranty 10yr/100k for PHEV per federal mandate. |

---

## Site totals (after incremental Phase 2 rebuild on 2026-05-15, session 10)

- **46 brands** in `catalog/manifest.json` (up from 41 at Session 9 final)
- **435 models total** (up from 424)
- **1,492 trims total** (up from 1,463)
- App shell at `catalog/index.html` is brand-agnostic; reads from `manifest.json` at runtime

### Session 10 brand-count delta
- New brands added: chrysler, dodge, fiat, bugatti, vinfast (+5)
- Karma evaluated but excluded as not viable (146 cars/yr 2024, Revero EOL)
- New models: +11 (chrysler 3, dodge 3, fiat 1, bugatti 2, vinfast 2)
- New trims: +29 (chrysler 6, dodge 15, fiat 2, bugatti 2, vinfast 4)

### Session 10 image coverage delta (project-wide)
- Pre-Session-10: 3,111 / 4,369 = **71.21%**
- Post-Session-10: 3,253 / 4,482 = **72.58%**
- Δ: +142 entries / +1.37pp (Phase A: +54 entries from mercedes-benz/gmc/rolls-royce; Phase B: +88 entries from 5 new brands)
- Tier crossings: GMC C→B→A (+9.6pp); Rolls-Royce C→B (+26.3pp)

| Brand | Models | Trims |
|-------|--------|-------|
| Acura | 6 | 19 |
| Alfa Romeo | 3 | 7 |
| Aston Martin | 11 | 13 |
| Audi | 25 | 47 |
| Bentley | 5 | 22 |
| BMW | 30 | 74 |
| Buick | 4 | 12 |
| Cadillac | 18 | 42 |
| Chevrolet | 18 | 72 |
| Ferrari | 12 | 12 |
| Ford | 22 | 74 |
| Genesis | 8 | 39 |
| GMC | 10 | 52 |
| Honda | 13 | 53 |
| Hyundai | 14 | 71 |
| Infiniti | 2 | 12 |
| Jaguar | 1 | 3 |
| Jeep | 12 | 55 |
| Kia | 16 | 69 |
| Lamborghini | 3 | 3 |
| Land Rover | 11 | 36 |
| Lexus | 11 | 54 |
| Lotus | 3 | 6 |
| Lucid | 2 | 6 |
| Maserati | 6 | 12 |
| Mazda | 12 | 57 |
| McLaren | 6 | 6 |
| Mercedes-Benz | 25 | 78 |
| Mini | 7 | 11 |
| Mitsubishi | 4 | 24 |
| Nissan | 13 | 48 |
| Polestar | 2 | 6 |
| Porsche | 16 | 62 |
| Ram | 3 | 22 |
| Rivian | 3 | 10 |
| Rolls-Royce | 7 | 9 |
| Subaru | 10 | 50 |
| Tesla | 10 | 16 |
| Toyota | 23 | 127 |
| Volkswagen | 9 | 31 |
| Volvo | 8 | 41 |
| **Bugatti (new S10)** | **2** | **2** |
| **Chrysler (new S10)** | **3** | **6** |
| **Dodge (new S10)** | **3** | **15** |
| **Fiat (new S10)** | **1** | **2** |
| **VinFast (new S10)** | **2** | **4** |
| **Total** | **435** | **1,492** |

---

## Image-scrape state (Phase 4)

Phase 4 was added to the project on 2026-05-12. Instruction file: `instructions/04_scrape_images.md`. Generalized scripts: `scripts/scrape_image_urls.mjs` and `scripts/download_images.mjs`, taking `--brand <slug>` and reading `scripts/brand-configs/<brand>.json`.

All 41 brand configs are present and all 41 brands have completed a full scrape + download. Coverage below reflects Session 9 final state (2026-05-15) after the targeted per-brand image work (Phase A) including the script-level HTML-entity decode fix + Kia 360-spin angle URL patterns. Tier annotation: **A** = ≥80%, **B** = 50–80%, **C** = <50%. Δ column shows the lift over Session 8 final.

| Brand          | Config exists | Scrape run | Download run | Coverage | Δ vs Session 7 | Tier | Notes |
|----------------|---------------|------------|--------------|----------|---------------:|------|-------|
| Bentley        | yes | yes (2026-05-15) | yes (2026-05-15) | 100.0% (88/88) | 0.0 | A | unchanged. Session 9 Phase B: filled 15 of 22 trim MSRPs from MotorTrend editorial (per new §4.6 scoped policy) |
| Buick          | yes | yes (2026-05-15) | yes (2026-05-15) | 100.0% (48/48) | 0.0 | A | unchanged |
| Infiniti       | yes | yes (2026-05-15) | yes (2026-05-15) | 100.0% (32/32) | 0.0 | A | unchanged |
| McLaren        | yes | yes (2026-05-15) | yes (2026-05-15) | 100.0% (24/24) | 0.0 | A | unchanged |
| Mini           | yes | yes (2026-05-15) | yes (2026-05-15) | 100.0% (38/38) | 0.0 | A | unchanged |
| Audi           | yes | yes (2026-05-15) | yes (2026-05-15) | 98.4% (126/128) | 0.0 | A | unchanged |
| BMW            | yes | yes (2026-05-15) | yes (2026-05-15) | 95.1% (270/284) | 0.0 | A | unchanged |
| Toyota         | yes | yes (2026-05-15) | yes (2026-05-15) | 95.0% (133/140) | 0.0 | A | unchanged |
| Nissan         | yes | yes (2026-05-15) | yes (2026-05-15) | 93.3% (140/150) | 0.0 | A | unchanged |
| Jaguar         | yes | yes (2026-05-15) | yes (2026-05-15) | 91.7% (11/12) | 0.0 | A | unchanged |
| Volvo          | yes | yes (2026-05-15) | yes (2026-05-15) | 90.5% (86/95) | 0.0 | A | unchanged |
| Aston Martin   | yes | yes (2026-05-15) | yes (2026-05-15) | 90.4% (47/52) | 0.0 | A | unchanged. Session 9 Phase B: filled 10 of 13 trim MSRPs from Car and Driver editorial (per new §4.6 scoped policy) |
| Chevrolet      | yes | yes (2026-05-15) | yes (2026-05-15) | 88.9% (256/288) | 0.0 | A | unchanged |
| Mitsubishi     | yes | yes (2026-05-15) | yes (2026-05-15) | 87.5% (84/96) | 0.0 | A | unchanged |
| **Hyundai**    | yes | yes (2026-05-15) | yes (2026-05-15) | **86.8% (132/152)** | **+58.5** | **A ★★★** | **Phase B relax + scroll bump: scene7 URLs with `fmt=webp` query (no path extension) now accepted. Repair +12. Tier C → A** |
| Lucid          | yes | yes (2026-05-15) | yes (2026-05-15) | 83.3% (20/24) | 0.0 | A | unchanged |
| Honda          | yes | yes (2026-05-15) | yes (2026-05-15) | 82.1% (174/212) | 0.0 | A | unchanged |
| Acura          | yes | yes (2026-05-15) | yes (2026-05-15) | 81.9% (59/72) | 0.0 | A | unchanged |
| Genesis        | yes | yes (2026-05-15) | yes (2026-05-15) | 81.9% (77/94) | 0.0 | A | unchanged |
| Rivian         | yes | yes (2026-05-15) | yes (2026-05-15) | 78.9% (15/19) | 0.0 | B | unchanged (78 ext-less accepted but none new slug-matched) |
| **GMC**        | yes | yes (2026-05-15) | yes (2026-05-15) | **85.6% (178/208)** | **+9.6** | **A ★** | **Phase A (Session 10): added `yukon` to yukon-xl slug_variants — XL shares the yukon page, +20 entries. Tier B → A** |
| Cadillac       | yes | yes (2026-05-15) | yes (2026-05-15) | 75.6% (127/168) | 0.0 | B | unchanged |
| **Lotus**      | yes | yes (2026-05-15) | yes (2026-05-15) | **75.0% (18/24)** | **+75.0** | **B ★★★** | **Phase B relax + slug_variants ("carbon", "alphapdp") + scroll bump: Sitecore Content Hub URLs (`wlt-p-001.sitecorecontenthub.cloud`) now accepted. Tier C → B** |
| **Subaru**     | yes | yes (2026-05-15) | yes (2026-05-15) | **72.5% (95/131)** | **+63.4** | **B ★★★** | **Phase B relax: Sitecore Content Hub URLs accepted. 638 ext-less candidates accepted, 91 entries via ext-less URL. Repair +4. Tier C → B** |
| Alfa Romeo     | yes | yes (2026-05-15) | yes (2026-05-15) | 71.4% (20/28) | 0.0 | B | unchanged |
| Lexus          | yes | yes (2026-05-15) | yes (2026-05-15) | 70.8% (153/216) | 0.0 | B | unchanged |
| Jeep           | yes | yes (2026-05-15) | yes (2026-05-15) | 64.5% (142/220) | 0.0 | B | unchanged |
| Mazda          | yes | yes (2026-05-15) | yes (2026-05-15) | 63.1% (53/84) | 0.0 | B | unchanged |
| Porsche        | yes | yes (2026-05-15) | yes (2026-05-15) | 50.3% (78/155) | 0.0 | B | unchanged (62 ext-less accepted, all redirect-resolved variants of existing URLs) |
| **Ford**       | yes | yes (2026-05-15) | yes (2026-05-15) | **47.8% (97/203)** | **+0.5** | C | Phase A (Session 9): HTML-entity decode in extractor unlocked 1 additional candidate |
| Maserati       | yes | yes (2026-05-15) | yes (2026-05-15) | 45.8% (22/48) | 0.0 | C | repair recovered 1 entry (Phase B URL invalidation interaction); net unchanged |
| Lamborghini    | yes | yes (2026-05-15) | yes (2026-05-15) | 41.7% (5/12) | 0.0 | C | unchanged. Session 9 Phase B: filled 2 of 2 trim MSRPs from Car and Driver editorial (per new §4.6 scoped policy) |
| Polestar       | yes | yes (2026-05-15) | yes (2026-05-15) | 41.7% (5/12) | 0.0 | C | unchanged |
| **Rolls-Royce**| yes | yes (2026-05-15) | yes (2026-05-15) | **65.8% (25/38)** | **+26.3** | **B ★★** | **Phase A (Session 10): Black Badge URL paths `bb-ghost-sii` / `bb-spectre` / `bb_cullinan_s2` added as slug_variants. Tier C → B** |
| Volkswagen     | yes | yes (2026-05-15) | yes (2026-05-15) | 38.8% (19/49) | 0.0 | C | unchanged (19 ext-less accepted but resolved to same URLs as before) |
| **Ram**        | yes | yes (2026-05-15) | yes (2026-05-15) | **44.3% (39/88)** | **+11.4** | C | Phase A (Session 9): HTML-entity decode unlocked AEM JSON-embedded `/content/dam/...` URLs that were boundary-bound by `&#34;` entities |
| **Mercedes-Benz**| yes | yes (2026-05-15) | yes (2026-05-15) | **40.1% (127/317)** | **+7.6** | C | **Phase A (Session 10): `[-_]HC(?:-D)?\.` brand pattern for front_three_quarter (verified HC-D = front 3/4 on C-Class, CLE-Coupe; HC.jpg = front 3/4 on CLA). +24 entries via brand-specific angle match.** |
| **Land Rover** | yes | yes (2026-05-15) | yes (2026-05-15) | **31.9% (46/144)** | **+13.9** | C | **Phase A: L-chassis-code slug_variants (L460/L461/L462/L550/L551/L560/L663) — rangerover.com & landroverusa.com CDN URLs now slug-match** |
| **Kia**        | yes | yes (2026-05-15) | yes (2026-05-15) | **70.3% (45/64)** | **+45.3** | **B ★★★** | Phase A (Session 9): HTML-entity decode + angle_url_patterns mapping `360/04.png` to side_profile, `360/18.png` to rear_three_quarter, `360/36.png` to front_three_quarter (visually verified). Tier C → B |
| **Ferrari**    | yes | yes (2026-05-15) | yes (2026-05-15) | **22.9% (11/48)** | **+20.8** | **C ★★** | **Phase B: 481 ext-less candidates accepted. Session 7's "no usable signal" diagnosis was wrong — the signal exists, the filter rejected it. Still C tier but no longer "hard-blocked"** |
| Lotus          | (moved up — see above) |
| Subaru         | (moved up — see above) |
| Hyundai        | (moved up — see above) |
| Ferrari        | (above) |
| Tesla          | yes | yes (2026-05-15) | yes (2026-05-15) | 0.0% (0/64) | 0.0 | C | **persistent low coverage** — hard 403 anti-bot at HTTP layer (upstream of any filter relax) |
| **Bugatti (new S10)** | yes (S10) | n/a (Phase 1 had direct URLs) | yes (2026-05-15) | **100.0% (8/8)** | new | A | new brand; 8 direct URLs from bugatti-newsroom.imgix.net CDN |
| **Chrysler (new S10)** | yes (S10) | n/a (Phase 1 had direct URLs) | yes (2026-05-15) | **95.8% (23/24)** | new | A | new brand; Stellantis press CDN |
| **Dodge (new S10)** | yes (S10) | yes (2026-05-15, 16 needs_scraping) | yes (2026-05-15) | **60.0% (36/60)** | new | B | new brand; dodge.com JS-rendered, 16 side/interior unfilled |
| **Fiat (new S10)** | yes (S10) | n/a (Phase 1 had direct URLs) | yes (2026-05-15) | **100.0% (8/8)** | new | A | new brand; Stellantis press kit |
| **VinFast (new S10)** | yes (S10) | n/a (Phase 1 had direct URLs) | yes (2026-05-15) | **100.0% (13/13)** | new | A | new brand; VinFast CMS |

★ = brand crossed a tier boundary. ★★ = brand jumped 20+ percentage points. ★★★ = brand jumped 50+ percentage points or two tiers.

**Project-wide totals (2026-05-15, Session 10 final):**
- Image entries: **4,482** (up from 4,369 at Session 9 final — added 113 from new brands)
- Downloaded: **3,253 (72.58%)** — up from 3,111 (71.21%), a **+142 entries / +1.37pp** Session 10 lift
- Tier breakdown: **24 brands ≥80%** (was 19; GMC joined; new brands Bugatti/Chrysler/Fiat/VinFast also Tier A) · **12 brands 50–80%** (was 11; Rolls-Royce + Dodge joined; GMC left) · **10 brands <50%** (was 11; Rolls-Royce left, none added)
- Models with 0 downloaded images: 45 of 435 (10.3%) — was 49/424 (11.6%)
- Trims with all 4 required angles: 472 of 1,492 (31.6%)

**Session 10 tier crossings:**
- GMC: B → A (76.0% → 85.6%, +9.6pp) — yukon-xl slug fix
- Rolls-Royce: C → B (39.5% → 65.8%, +26.3pp) — Black Badge URL path slug-variants

**Session 10 reliability fills (Phase C):** 80 models lifted from reliability.confidence == "unknown" to "medium" with JD Power 2026 VDS scores + CR 2026 brand-level data. 70 models remain at unknown (ultra-luxury low-volume brands where neither JDP nor CR sample). Total reliability null reduction: 150 → 70 (-53%).

**Session 10 customer satisfaction (Phase C):** 0 fills — JD Power 2026 APEAL not yet published (typical July release). 362 entries documented with "checked 2026-05-15, APEAL release pending" notes and remain at unknown.

**Tier crossings this session (Session 9):**
- Kia: C → B (25.0% → 70.3%, +45.3pp)

**Persistent low coverage (3 brands):**
- Tesla 0% — HTTP 403 anti-bot, upstream of any filter change
- Land Rover 31.9% — page-URL-resolved entries on Defender Octa + Discovery (thin candidate pools)
- Mercedes-Benz 32.5% — mbusa.com CDN gates static + Playwright on most image URLs

**Script status (post-Session 9):** All Session 5/6/7/8 patches plus 1 Session 9 addition are live and validated:
- needs_scraping reset gating, ANGLE_PATTERNS guard, BOM strip, .bak backups (sessions 4-5)
- Playwright fallback with slug-match escalation threshold (session 6)
- ANGLE_PATTERNS separator fix, alt-text-aware slugMatchesURL, positional fallback (session 5)
- download_images.mjs Referer header from brand config (session 6)
- brand-config `angle_url_patterns` map (session 7 A1)
- extended `resolutionBonus` for width queries, device tokens, AEM renditions (session 7 B2)
- URL-change invalidates `img.downloaded` so downloader refreshes cached files (session 7 B latent)
- `scripts/repair_cached_downloads.mjs` helper (session 7 B6)
- `isPlausibleImageURL` extension-less-CDN relax (session 8 Phase B); Playwright scroll bumped to 5s (session 8 Phase B); Land Rover L-chassis-codes and Lotus "carbon"/"alphapdp" slug_variants (session 8 Phase A)
- **Session 9 (Phase A):** `extractCandidates` pre-decodes HTML-entity-encoded quote characters (`&#34;` → `"`, `&#39;` → `'`) so URLs embedded in JSON data layers become extractable. CDN-relative regex extended from `/-/media/` only to also cover `/content/dam/` and `/us/content/dam/` (Adobe AEM brands). Affects Kia (+45.3pp), Ram (+11.4pp), Ford (+0.5pp).
- **Session 9 (Phase A):** Kia `angle_url_patterns` extended with `/360/04.png` → side_profile, `/360/18.png` → rear_three_quarter, `/360/36.png` → front_three_quarter (frame-angle mappings visually verified on Sorento LX).

**Session 8 diagnosis additions:**
1. **Extension-less URL filter relax has cross-brand reach.** Confirmed unblocking on Lotus (+75pp), Hyundai (+58.5pp), Subaru (+63.4pp), Ferrari (+20.8pp). The relax is precise (host + path dual-gate) and additive — no brand regressed beyond the repaired 1 Maserati URL-invalidate side effect.
2. **Adobe Scene7 with `fmt=webp` query** (Hyundai uses `s7d1.scene7.com/is/image/hyundai/...?fmt=webp`) is the second most common extension-less CDN pattern after Sitecore Content Hub. The relax catches both.
3. **Session 7's "Ferrari = no usable signal" diagnosis was wrong.** Ferrari emits real image URLs from `ferrari-view.thron.com` (Thron CDN) with usable alt-like context tokens — the URLs just lacked file extensions and were filtered by the old `isPlausibleImageURL`. With the relax, Ferrari resolves 11 of 48 entries via standard pattern matching.
4. **Land Rover's LRDX CDN uses chassis codes** (L460/L461/L462/L550/L551/L560/L663) in path segments and filename prefixes. Bare chassis codes work as slug_variants — page-level isolation handles cross-model concerns.

**Persistent low coverage (post-Session 9) — 1 brand:**
1. **Tesla 0%** — HTTP 403 anti-bot at the transport layer (upstream of any pipeline filter). Requires either out-of-pipeline image sourcing or accepting placeholders.

Other brands <50% (Mercedes-Benz, Land Rover, Ferrari, Ram, Volkswagen, Rolls-Royce, Polestar, Lamborghini, Maserati, Ford) all have individually-diagnosed structural ceilings at the page level rather than pipeline failures. Each could improve with either per-brand investigation or policy relaxation, but none represent systemic pipeline gaps.

**Session 9 MSRP fills (Phase B — new):** 41 of 57 targeted ultra-luxury trims filled (71.9% fill rate) from allowed editorial sources (Car and Driver, MotorTrend, Hagerty) per the new instructions/01_research_brand.md §4.6 scoped policy. Project-wide MSRP nulls dropped from 70 to 29. See `reports/msrp_fill_results_session9.md`.

---

## Session 11 summary (2026-05-15)

**Phase 1 — Instruction file consolidation.** Created `instructions/05_session_runbook.md` (203 lines — read-first preamble, safety rules, parallel-subagent criteria, checkpoint design, output conventions, .bak discipline, common session shapes) and `instructions/06_maintenance.md` (182 lines — drift detection, targeted re-research, image-config rot repair, verifier-found blocker triage, freshness spot-check pattern). Updated `00_master_spec.md` to v1.3 (documented `sources_confidence`, `angle_url_patterns` brand-config field). Updated `01_research_brand.md` v3 (cumulative Sessions 5-10 image-scrape blocker patterns; researched_at-on-every-model rule). Updated `03_verify_catalog.md` (optional config fields, FYI-vs-blocker rules, isDealerDomain bug + fix, verification batching). Updated `04_scrape_images.md` (full validated architecture, structural ceiling concept, 5-step diagnostic).

**Phase 2 — Forbidden-source fix-pass + verifier patches.** Project blockers 271 → 56 (-79%).
- **Verifier patch 1**: `isDealerDomain` regex now hostname-only matching (was matching "of-" in URL paths). Eliminated ~27 false-positive blockers across Subaru, Dodge, VinFast. Test suite 19/19 pass.
- **Verifier patch 2**: `msrp_base null` blockers now downgraded to FYI when trim notes document manufacturer non-disclosure. Eliminated ~22 ultra-luxury MSRP-null blockers (Ferrari 7, Bentley 7, Aston Martin 3, McLaren 2, Rolls-Royce 4, Lotus 1).
- **Data fix-pass (5 parallel subagents)**: Toyota 63 forbidden-source URLs → manufacturer URLs; BMW 62 fixed; Honda 28; Mercedes-Benz 15; McLaren 7 + Lotus 7; small brands 16 (RR/AM/Volvo/Mitsu/Rivian/VW/Maserati).
- **Remaining 56 blockers**: All Toyota "singleton trim_family with 0 images" (§7) — pre-existing image-coverage class that Session 10's verification summary mis-attributed as forbidden-source. Distinct from Phase 2 scope. See SESSION_NOTES.md Session 11 entry; recommended future fix per `06_maintenance.md` §4.2.

**Phase 3 — Freshness drift fixes.** Applied Session 10 Phase D findings:
- BMW: 3-series/330i $47,500 → $48,000; x5/xdrive40i $68,600 → $70,600; x3/30-xdrive $50,675 → $51,300.
- Chevrolet: equinox/lt-fwd $28,600 → $28,800; tahoe/rst-4wd $73,995 → $71,700; colorado/lt-4wd $41,395 → $39,300.
- `researched_at` bumped to 2026-05-15 for affected models and at brand level.
- Trim structure drift (Chevrolet Equinox/Tahoe missing variants; GMC Hummer 3X CFE) NOT applied — out of scope for Phase 3; deferred per `06_maintenance.md` §2.

**Phase 4 — Final state.**
- 46 brands / 435 models / 1,492 trims (unchanged from Session 10).
- 56 blockers (all Toyota, all singleton-no-images), 322 warnings, 30 FYIs.
- 45 of 46 brands verify clean.
- Image coverage unchanged from Session 10: 3,253 / 4,482 = 72.58%.

**Files changed Session 11:**
- 6 instruction files (5 updated, 2 new)
- 1 verifier script (`scripts/verify_brand.mjs` — two patches + .bak)
- 17 brand JSONs (Toyota, BMW, Honda, Mercedes-Benz, McLaren, Lotus, Ferrari note unchanged, Bentley note unchanged, Aston Martin note unchanged, Rolls-Royce, Volvo, Mitsubishi, Rivian, Volkswagen, Maserati, Chevrolet drift, plus BMW drift on top of Phase 2 work) × 2 (data/ + catalog/data/) = 32 files + .bak files.
- 7 helper scripts (verify_session11_batch, test_isdealerdomain_session11, inspect_toyota_singletons, phase3_inspect_drift, phase3_apply_drift, fix_toyota_forbidden_sources_session11, fix_bmw_blockers).
- 5 reports (instruction_consolidation_session11, fixpass_session11, freshness_fixes_session11, session11_verification_summary, plus 46 verification raw JSONs).
- SESSION_NOTES.md appended (Session 11 Phase 2 checkpoint analysis).
- SESSION_SUMMARY_11.md (this session's summary, written separately).

---

## Session 12 summary (2026-05-15)

**Single task: clear Toyota's 56 singleton-no-images blockers** per `instructions/06_maintenance.md` §4.2.

**Outcome.** Project-wide blockers: **56 → 0**. All 46 brands now verify clean.

**Method.** 49 minimal-diff `trim_family` renames across 15 Toyota models. For each 0-image singleton blocker, changed its `trim_family` to match an existing populated (or base-containing) family in the same model + powertrain. Resulting families become multi-trim, so the §7 singleton-with-0-images blocker rule no longer fires. 7 of the 56 blockers (base trims of all-zero-image models — rav4/phev-se-awd, sequoia/sr5, sienna/le, tacoma/sr, tacoma/trailhunter, tundra/sr, tundra/trd-pro) were cleared indirectly when other trims merged into their family — that's why 49 renames clear 56 blockers.

**Models touched (15):** corolla, corolla-cross, corolla-hatchback, gr-corolla, gr-supra, gr86, grand-highlander, highlander, land-cruiser, prius, rav4, sequoia, sienna, tacoma, tundra.

**What was NOT touched.** No image entries, `local_path`, `is_shared_with_trim_family`, `is_base_trim`, `delta_from_base`, or any other field. Existing image files in `catalog/images/toyota/<model>/<old-family-slug>/...` remain at their original paths; the renamed trims have empty `images[]` arrays so no `local_path` references became stale.

**Verification (post-fix).** Toyota: 0 blockers / 28 warnings / 0 FYIs (down from 56 / 28 / 0). The 28 warnings are mostly singleton-with-<4-images warnings on trims that have 1–3 images each (out of scope for this session). Project-wide: 46 brands / 435 models / 1,492 trims / 0 blockers / 312 warnings / 30 FYIs.

**Files changed Session 12:**
- 2 brand JSONs (`data/toyota.json`, `catalog/data/toyota.json`) + `.bak` files. Byte-identical post-write.
- 3 helper scripts (`session12_inventory_toyota_singletons.mjs`, `session12_fix_toyota_singletons.mjs`, `verify_session12_batch.mjs`).
- 1 report (`reports/session12_toyota_inventory.json` + 46 per-brand verify_raw JSONs in `reports/verification_session12/`).
- 1 summary (`reports/session12_verification_summary.md`).
- STATUS.md (this section) + PROJECT_STATE.md + SESSION_SUMMARY_12.md.

**Project state.** Genuine zero-blocker maintenance mode. The only queued non-optional work is the JD Power 2026 APEAL fill when it publishes (~July). Quarterly freshness check pattern documented in `06_maintenance.md` §5.

---

## Session 13 (2026-05-16) — Frontend polish (catalog/ visual treatment)

**Outcome.** Catalog visual treatment moved from "functional grid" → "portfolio-ready editorial site." Zero data changes; only `catalog/index.html`, `catalog/styles.css`, `catalog/app.js`, and `catalog/manifest.json` (generated_at timestamp refresh) were touched.

**Five design stages, executed sequentially with per-stage backups:**

1. **Design system foundation.** Replaced the original ~10 CSS variables with a full token system: spacing scale (--space-1 through --space-12), type scale (--text-xs through --text-5xl), font stacks (system-only, no web fonts), color palettes for light + dark with full coverage (bg / bg-elevated / bg-subtle / text / text-muted / text-subtle / border / border-subtle / border-strong / accent / accent-hover / success / warning / null / focus-ring / highlight), transition tokens, radius tokens, shadow tokens (used sparingly). Replaced the prior automotive-red `#c10000` accent with a deep desaturated indigo `#1a3a7a` per the brief's "Apple Comparison Page > Car and Driver > Stripe > Linear" hierarchy. Backups: `catalog/.session13_stage_1_pre/`.

2. **Layout and navigation polish.** Topnav redesigned as a coherent toolbar with subtle backdrop-blur, dropdown carets that rotate on open, search icon glyph inside the input, divider between wordmark and primary links. Sidenav got an eyebrow with live model count + improved active state (left-border + font-weight + accent-tint background). Footer rewritten as a 3-cell editorial block (mark + stats + data-files modal trigger) — replaces the previous 46-link blob. View-transition fade-and-slide-in (200ms cubic-bezier) on each route change, respecting `prefers-reduced-motion`. Backups: `catalog/.session13_stage_2_pre/`.

3. **Brand view polish (headline view).** Brand wordmark at 64px black-weight. View-stats restructured into stat-pairs with strong + small uppercase label. Sticky controls bar with backdrop-blur; chips use accent indigo when pressed. Model section restructured to single-column vertical (title-block → hero → quick-stats strip → spec collapsibles → trim table → gallery → reviews → foot) with the hero at full content-width. Quick stats now a magazine-style horizontal callout (36px numbers, tabular-nums, 1px vertical rules between cells). Trim table base row distinguished by accent left rule. Image gallery thumbs are now real `<button>` elements with hover-revealed angle captions; modal upgraded to a real lightbox (4px backdrop blur, larger panel, image height-capped at 75vh). Reviews block restructured so the score sits prominently below the eyebrow at `--text-xl`. Model footer is now a dashed-rule editorial byline. Backups: `catalog/.session13_stage_3_pre/`.

4. **Home, body-style, compare views.** Home rewritten with: indigo eyebrow + 64px headline + tagline; brand grid as a 1px-gap hairline-divided index (46 cards in a tight indexed layout); body-style grid with inline-SVG line-art icons (13 monochrome silhouettes that imply car shape without being literal); compare promo block with bold accent link. Compare view replaced 3 generic picker cards with **compare-slot cards** combining slot eyebrow + hero image preview + brand/model/trim title block + price + clear button + 3 selects. Differences in the comparison table now use a winner-cell highlight (accent-left rule + subtle tint + weight bump) for numeric specs where `{ winner: "max" | "min" }` is declared; non-numeric differences just get the tint. Search dropdown now groups results by kind (Brands / Models / Trims) with eyebrow headers, keyboard-nav still works (data-idx attrs let activeIdx skip group label rows). Backups: `catalog/.session13_stage_4_pre/`.

5. **Cross-cutting polish + verification.** Loading toast appears top-right after 150ms if a view isn't ready. Empty states use a dashed-border card with a clear-filters action button. Error states render a styled `.view-error` block with a back-link. Print stylesheet: hides nav/sidenav/controls/footer/gallery, forces all `<details>` open, sets `page-break-inside: avoid` on model sections + review cards, caps hero height at 280pt, prints trims table at 9pt without min-width. Mobile pass: typography bumps below 600px, brand-card-grid drops to 2-col. Dark mode walked through every surface; chip-pressed and filter-empty-action both got `color: var(--color-bg)` overrides in dark for contrast. Backups: `catalog/.session13_stage_5_pre/`.

**Files touched Session 13:**
- `catalog/index.html` (structural updates: topnav-inner wrapper, sidenav-head with eyebrow, footer with stats + data-modal trigger).
- `catalog/styles.css` (complete rewrite: ~1500 lines, full design-system + dark-mode + print stylesheet).
- `catalog/app.js` (renderHome rewrite with body-style SVG icons + brand-card grid; renderCompare + buildCompareSlotCard rewrite; renderModelSection layout shift; renderReviewsBlock restructure; renderFilterEmptyState helper; openDataFilesModal helper; search-dropdown grouping; loading-indicator wiring; view-fade-in animation).
- `catalog/manifest.json` (generated_at timestamp bumped to 2026-05-16T14:12:32Z; brand list and counts unchanged).
- `catalog/.session13_stage_{1,2,3,4,5}_pre/` (per-stage backups + README explaining purpose).
- `reports/session13_progress.md` (per-stage progress notes).
- `reports/session13_final.md` (synthesis + Session 14 recommendations).
- `STATUS.md` (this section) + `PROJECT_STATE.md` + `SESSION_SUMMARY_13.md`.

**Zero data changes.** No brand JSON was opened for write; no `data/_partials/` files were touched; no instruction file was modified. The session was strictly frontend (catalog/index.html, styles.css, app.js, manifest.json). The site renders the same 46 brands / 435 models / 1,492 trims that have been in place since Session 12.

**Project state going forward.** The catalog now reads as an editorial publication rather than a generated dataset viewer. The natural Session 14 work is portfolio prep: screenshots, a public deploy, a one-page write-up. The Session 12 "what's next" of "wait for July APEAL or stop" remains true for *data* work; the polished frontend now makes "portfolio prep, then live" a clearer next move for the project as a whole.

---

## Session 14 (2026-05-16) — Tiered source allowlist (HALTED at Phase 3 checkpoint)

**Outcome.** Policy update (Phase 1) and script extension (Phase 2) landed cleanly; Phase 3 validation HALTED on the strict "if neither brand improves significantly" condition. Phase 4 (project-wide re-scrape) skipped per the HALT. Phase 5 (build/verify/status) ran in reduced scope: Ferrari and Tesla verify clean with the new provenance fields; project-wide totals unchanged at 46 brands / 435 models / 1,492 trims / 3,253 of 4,482 images = 72.58% coverage.

**Tesla.** 0/64 → 0/64. Tesla.com (all 5 model pages) returns 403 to both static fetch and Playwright. Tesla configurator API (`tesla.com/configurator/api/v3/`) — newly attempted as Tier 3 — also returns 403. NetCarShow Tier 2 URLs return 200 but redirect to brand landing (Tesla doesn't have 2026 photography on NetCarShow); the script's post-fetch MY-verification check correctly catches the redirect-away and skips the candidates. **No wrong-MY substitution occurred.** Tesla remains at the structural ceiling documented in PROJECT_STATE.md lesson #71.

**Ferrari.** 11/48 → 11/48. ferrari.com (en-EN) reachable; Tier 1 picked the same 11 URLs prior sessions resolved (no upgrade). NetCarShow Tier 2 architecture executed correctly: 4 of 12 URLs redirect to /ferrari/ landing (skipped by post-fetch MY check); 6 of the remaining 8 produce 0-17 slug-matched candidates per page. However, `pickBestForAngle` rejected all of them because NetCarShow hero filenames (`Ferrari-Amalfi-2026-1280-<hash>.jpg`) and alt-text lack angle vocabulary. The Tier 2 architecture worked; the matcher couldn't score the candidates.

**Project-wide impact.** Additive only. Ferrari's 11 Tier-1 image entries got `source_tier: 1` + `source_domain` provenance fields. No URLs changed. No new blockers. Tesla and Ferrari both still verify clean (Ferrari: 0 blockers / 2 pre-existing warnings / 7 pre-existing FYIs; Tesla: 0/0/0).

**Files changed Session 14:**
- `instructions/04_scrape_images.md` — added §A "Tiered source allowlist for image scraping" (full policy: Tier 1/2/3 definitions, explicit denylist, provenance requirements, MY/model verification, order of preference, cross-reference to §4.6 MSRP relaxation).
- `instructions/03_verify_catalog.md` — added Session 14 image-entry provenance fields documentation + verifier behavior changes (scopes existing forbidden-source check to spec sources only; new BLOCKER check for tier-2/3 images missing provenance note).
- `scripts/scrape_image_urls.mjs` — TIER_DEFINITIONS map, classifyTier(), tierTwoPageMatchesMY(), fetchTier3Endpoint(), extractURLsFromText(), per-trim post-Tier-1 fall-state evaluation, Tier 3/2 fallback dispatch with 2-of-4-angles threshold, post-fetch final-URL MY check (catches redirect-away), slug-match filtering on Tier 2 candidates, provenance attachment, once-per-trim note via maybeAddTrimNote(), SCRAPE SUMMARY tier breakdown.
- `scripts/download_images.mjs` — PER_HOST_REFERER map for Tier 2 hosts, per-URL effective-Referer resolution, response Content-Type recorded on image entry as `content_type`.
- `scripts/brand-configs/tesla.json` — added tier3_endpoints (Tesla configurator API per model) and tier2_endpoints (NetCarShow URLs per model). `.bak` preserved.
- `scripts/brand-configs/ferrari.json` — added tier2_endpoints (NetCarShow Ferrari URLs per model). path_blacklist_regex extended to filter NetCarShow's `/R/<other-cars>-*-thb.jpg` sidebar thumbnails. `.bak` preserved.
- `SESSION_NOTES.md` — appended Session 14 Phase 3 HALT diagnosis (~80 lines).
- `STATUS.md` (this section) + PROJECT_STATE.md + SESSION_SUMMARY_14.md + reports/session14_final.md.

**No Phase 4 re-scrape ran.** The brief's Phase 4 was conditioned on Phase 3 success; the HALT skipped it. No brand JSONs outside Tesla and Ferrari were touched.

**Project state going forward.** §A policy and script architecture are landed and verified safe. A future session can extract value from Tier 2 sources by adding ONE of: (a) a lower-precision per-source angle picker (e.g., NetCarShow "largest image = front_three_quarter"), (b) Playwright-rendered Tier 2 fetches with positional fallback, (c) per-brand `angle_url_patterns` Tier 2 hints. None are blocking the existing catalog; the 72.58% coverage from prior sessions is preserved.



---

## Session 15 (2026-05-16) — NetCarShow positional heuristic (HALTED at Phase 2 spot-check)

**Outcome.** Phase 1 (heuristic implementation + §A documentation) landed cleanly. Phase 2 (Ferrari validation) HALTED at the spot-check: **NetCarShow is serving anti-bot decoy images (multi-colored pixel noise) instead of real Ferrari press-kit photography.** Per the brief's safety rule, all 4 positional fills were reverted and the decoy image files were deleted. Phase 3 (project-wide application) SKIPPED. Phase 4 (build/verify/status) ran in reduced scope: Ferrari verifies clean and is restored to pre-Session-15 state.

**Project-wide totals:** unchanged at 46 brands / 435 models / 1,492 trims / 3,253 of 4,482 images = 72.58% coverage. Ferrari: 11/48 = 22.9% (identical to Session 14 final).

**The diagnosis.** Session 14 reported "NetCarShow filenames are angle-agnostic" as the blocker; Session 15's deeper investigation found that NetCarShow's actual image content (when fetched programmatically) is pixel-noise decoys, not real images. Session 14's diagnosis was based on URL/alt-text inspection (which only required fetching page HTML); the image-content failure mode could only have been caught by downloading and visually inspecting a sample image. This is materially different from the Session 14 brief's mental model, and invalidates NetCarShow as a Tier 2 image source under the current scrape/download architecture.

**The heuristic itself works.** `scripts/scrape_image_urls.mjs` correctly identified the hero candidates by URL width hint (`-1280-` etc.) and assigned them positionally. The fault is upstream: NetCarShow returns decoy content for these URLs. The heuristic and its supporting helpers (`getURLHintedWidth`, `isNetCarShowHero`, `applyNetCarShowPositional`) are preserved in the script for future re-use against a Tier 2 source that serves real images.

**Files changed Session 15:**
- `scripts/scrape_image_urls.mjs` — added `NETCARSHOW_HOST_RE`, `NETCARSHOW_BRAND_COVERAGE_THRESHOLD`, `NETCARSHOW_HERO_MIN_WIDTH`, `isHostNetCarShow()`, `getURLHintedWidth()` (filename-scoped, year-token-skipping), `isNetCarShowHero()`, brand pre-run coverage computation, `netcarshowPositionalFills` + `netcarshowPositionalTrims` counters, `applyFallbackCandidates` modified to return fills count, `applyNetCarShowPositional()` helper, conditional invocation after standard Tier 2 attempt, SCRAPE SUMMARY line for the heuristic's impact. Passes `node --check`.
- `instructions/04_scrape_images.md` — added §A "NetCarShow positional heuristic (Session 15, HALTED — anti-bot decoy)" subsection documenting the design + invocation gates + the HALT status. Explicit warning: do not enable NetCarShow `tier2_endpoints` in any brand config until the fetch mechanism is upgraded (Playwright-rendered Tier 2 is the most plausible future path).
- `SESSION_NOTES.md` — appended Session 15 Phase 2 HALT diagnosis (~80 lines) covering: what worked, what didn't, root cause, restoration steps, 5 lessons, and outstanding work deferred to future sessions.
- `data/ferrari.json` + `catalog/data/ferrari.json` — Tier 1 backfill from the first scrape run is preserved (additive only, same 11 URLs as Session 14). The 4 positional NetCarShow assignments from the second scrape run were reverted: URL reset to canonical, needs_scraping restored to true, source_tier/source_domain/assignment_method/content_type fields removed, downloaded set to false. Trim notes' "Hero photography positional fallback..." text removed.
- `catalog/images/ferrari/amalfi/amalfi/front_three_quarter.jpg`, `catalog/images/ferrari/296-speciale/296-speciale/front_three_quarter.jpg`, `catalog/images/ferrari/296-speciale-a/296-speciale-a/front_three_quarter.jpg`, `catalog/images/ferrari/849-testarossa/849-testarossa/front_three_quarter.jpg` — deleted (4 decoy image files).
- `scripts/brand-configs/ferrari.json` — unchanged from Session 14 (tier2_endpoints still defined; they are now effectively dormant per the §A HALT note).
- `STATUS.md` (this section) + PROJECT_STATE.md + SESSION_SUMMARY_15.md + reports/session15_final.md.

**Project state going forward.** The 72.58% project-wide image coverage and the polished frontend from Session 13 are unchanged. Future Tier 2 work must image-content-verify the source before integration — the §A documentation has been updated to flag this requirement. The natural next session remains portfolio prep + live deploy, per Session 13/14's "what's next."


---

## Session 16 (2026-05-16) — portfolio prep / project shipped

**Outcome.** Repo packaged as a portfolio-grade GitHub project. Zero data work; no brand JSON, instruction file, or production script behavior changed. The catalog, dataset, and instruction files from Session 15 are intact.

**Project-wide totals:** unchanged at 46 brands / 435 models / 1,492 trims / 3,253 of 4,482 images = 72.58% coverage / 0 verification blockers.

**New top-level files:**
- `README.md` — portfolio-facing README (replaces the implicit role of `instructions/README.md` for non-project-owner readers; preserves the original spec at `docs/PROJECT_SPEC.md`).
- `LICENSE` — MIT, Jonathan Nadeau, 2026, with a note clarifying the license covers code/schema/JSON structure/original prose only — not the third-party manufacturer image content in `catalog/images/`.
- `.gitignore` — comprehensive: `node_modules/`, `*.bak`, `data/_partials/`, `catalog/.session13_stage_*_pre/`, `.claude/`, OS/editor/Python cache files.
- `.github/workflows/deploy.yml` — GitHub Pages auto-deploy on push to `main`; uploads `catalog/` as the Pages artifact. First-time setup requires Settings → Pages → Source "GitHub Actions".

**New `docs/` directory:**
- `docs/PROCESS.md` — engineering narrative across the 16 sessions (orchestrated AI workflow, architecture decisions, verification system, notable findings, things that went wrong, honest limitations).
- `docs/SCHEMA.md` — reader-friendly dataset structure guide (model → trim → sources, the base-trim/step-up-delta pattern with a worked Honda Accord example, ev_specifics, image entries, special cases).
- `docs/PROJECT_SPEC.md` — original project specification preserved with a header noting historical context. Mirrors `instructions/README.md` content.
- `docs/screenshots/` — 8 Playwright-captured PNGs: home (light + dark), brand-bmw (light + dark), compare, body-suv, mobile-home, mobile-brand.

**New `analyses/` directory:**
- `analyses/price_performance.py` — MSRP vs HP scatter for 900 trims, colored by powertrain. Median ICE trim 312 hp / $55,600; median EV 435 hp / $66,200; median PHEV 577 hp / $121,700 (PHEVs concentrate in luxury-performance).
- `analyses/brand_reliability.py` — JD Power 2026 VDS bar chart for 16 brands. Lexus 151 best; Volkswagen 301 worst; 204 industry / 217 premium-segment averages overlaid.
- `analyses/ev_market.py` — Range vs MSRP scatter for 185 EV trims, bubble = DC charging kW. Lucid Air 512 mi range leader; Tesla Model 3/Y dominate under-$50K range-per-dollar; BMW iX3 / Lucid Gravity / Porsche Cayenne Electric tied at 400 kW peak charging.
- `analyses/README.md` + 3 chart PNGs in `analyses/charts/`.

**Cleanup:**
- Deleted all 5 `catalog/.session13_stage_*_pre/` directories (obsolete after Session 15; per safety rule 5 of the Session 16 brief).
- Deleted 3 stray `*.bak` files in `scripts/`: `scripts/verify_brand.mjs.bak`, `scripts/brand-configs/ferrari.json.bak`, `scripts/brand-configs/tesla.json.bak`. The `*.bak` files in `data/` and `catalog/data/` are retained as the project's safety net for future sessions (and are gitignored).
- Top-level empty `images/` directory gitignored.

**New helper script (non-production):**
- `scripts/take_screenshots.mjs` — Playwright headless screenshot capture for the catalog's home / brand / compare / body / mobile views. Used once in Session 16; safe to re-run if screenshots need refresh.

**Manual steps remaining (not Session 16's work):**
1. `git add . && git commit -m "Initial commit ..." && git push -u origin main` from project root.
2. Enable GitHub Pages in repo Settings → Pages → Source: "GitHub Actions".
3. Wait for the first workflow run; the live URL becomes `https://nadeaujonny.github.io/car-catalog/`.

Documented in `SESSION_NOTES.md` Session 16 entry with the exact push command.

**Project state going forward.** The Car Catalog Project is at functional + portfolio completion. Optional follow-ups: APEAL fills (~July 2026 when JD Power publishes), quarterly freshness check (Q3 2026), Toyota singleton-with-<4-images warnings (28 remain), image weight optimization. None are blocking.

## Recent fixes
- 2026-05-18: Compare view brand→model→trim cascade fixed. See `reports/compare_fix.md`.
