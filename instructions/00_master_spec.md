# 00 — Master Spec

The contract for the Car Catalog Project. Defines the data schema, source hierarchy, field-by-field rules, edge cases, and file conventions. The research, build, and verify instruction files reference this document. If anything is ambiguous in those files, this document is the source of truth.

---

## 1. Scope

- **Coverage:** every current-model-year vehicle each chosen brand sells new in the US.
- **Current model year** = the model year currently being sold new at US dealers as the primary offering for that nameplate. Verified per-model — do not assume all of a brand's models are on the same MY.
- **Out of scope:** historical model years, non-US markets, commercial vehicles, motorcycles, powersports, used-car data, full per-trim spec sheets (use trim deltas instead — see §6), every optional package itemized (capture standard features fully, summarize options at the package level).

---

## 2. Data architecture

- One JSON file per brand: `data/<brand>.json`. Brand slug is lowercase, hyphenated (`mercedes-benz`, not `Mercedes Benz`).
- The unified catalog site (`catalog/index.html`) loads all brand JSONs at runtime via `catalog/manifest.json`, which lists available brands.
- Each JSON is self-contained — no cross-file references — so brands can be researched, updated, or deleted independently.
- Total data size at full v1 scope (4 brands × ~15 models × ~5 trims) is well under 5 MB. Don't optimize for size.

---

## 3. JSON schema

The top-level shape of each brand file:

```jsonc
{
  "brand": "Honda",
  "brand_slug": "honda",
  "researched_at": "2026-05-15",     // ISO date of latest research pass
  "schema_version": "1.0",
  "models": [ /* one entry per model, in any order */ ]
}
```

### 3.1 Model object

```jsonc
{
  "model": "Accord",
  "model_slug": "accord",
  "model_year": 2026,
  "body_style": "sedan",              // see §5 for taxonomy
  "generation_context": "11th-gen Accord, introduced 2023",
  "msrp_range": { "low": 28295, "high": 39850 },   // computed from trims; USD
  "model_summary": "Midsize sedan offered with gas and hybrid powertrains. Top trims are hybrid-only.",
  "reliability": { /* see §3.3 */ },
  "customer_satisfaction": { /* see §3.3 */ },
  "professional_reviews": { /* see §3.3 */ },
  "owner_reviews": { /* see §3.3 */ },
  "trims": [ /* one entry per trim */ ],
  "researched_at": "2026-05-15",
  "notes": "Hybrid Sport-L, Touring trims have shared photography with Sport. Some EX features unavailable to verify on press kit."
}
```

- `model` = display name as the manufacturer brands it (e.g., "CR-V Hybrid", not "CRV Hybrid"; "X3 M50", not "X3 M50i").
- `model_slug` = lowercased, hyphenated, no special chars (`cr-v-hybrid`, `x3-m50`).
- `body_style` must come from the fixed taxonomy in §5.
- `msrp_range` is computed from the trims; if a brand publishes a different "starting from" price for marketing, use the lowest trim's `msrp_base` here regardless.
- `model_summary` is 1–3 sentences. Plain prose, no marketing language. Notes the model's role, available powertrains, and anything unusual.
- `notes` is for research-pass observations: photo sharing across trims, data gaps, anomalies. Plain prose.

### 3.2 Trim object

A trim represents one purchasable configuration as the manufacturer markets it. For trims that offer multiple powertrains or drivetrains as distinct choices (not optional add-ons), each combination is its own trim entry.

```jsonc
{
  "trim": "Sport Hybrid",
  "trim_slug": "sport-hybrid",
  "trim_family": "sport",             // for image sharing; see §7
  "is_base_trim": false,
  "msrp_base": 33655,
  "destination_fee": 1095,
  "msrp_as_equipped_estimate": null,  // optional, see §6.2

  "powertrain": { /* see §3.4 */ },
  "ev_specifics": null,               // only present for EV/PHEV/HEV; see §3.5
  "fuel_economy": { /* see §3.6 */ },
  "performance": { /* see §3.7 */ },
  "dimensions": { /* see §3.8 */ },
  "capacity": { "seats": 5, "rows": 2 },
  "wheels_tires": { "wheel_size_in": 19, "tire_spec": "235/40R19" },
  "safety": { /* see §3.9 */ },
  "features": { /* see §3.10 */ },
  "warranty": { /* see §3.11 */ },
  "images": [ /* see §3.12 */ ],

  "delta_from_base": null,            // null for base trim; populated for step-ups, see §6
  "notes": ""
}
```

### 3.3 Model-level review/reliability blocks

These live on the model, not the trim — JD Power and others rate at the model level. Each block has its own confidence and source.

```jsonc
"reliability": {
  "jd_power_vds_score": null,                  // numeric (e.g., 82); null if not yet rated for this MY
  "jd_power_vds_year": null,                   // study year, e.g., 2025
  "consumer_reports_predicted_reliability": null, // numeric 1-5, or null
  "summary": "JD Power has not yet rated 2026 Accord (VDS measures 3-year-old cars). Prior gen (2023+) rated 'About Average'.",
  "confidence": "medium",
  "sources": ["jdpower.com/cars/2025-honda-accord", "consumerreports.org/cars/honda/accord/2025"]
},

"customer_satisfaction": {
  "jd_power_apeal_score": null,
  "jd_power_apeal_year": null,
  "summary": "Not separately measured for current MY.",
  "confidence": "low",
  "sources": []
},

"professional_reviews": {
  "summary": "Reviewers consistently praise refined ride, intuitive infotainment, and class-leading hybrid efficiency; common critiques are uninspired styling and modest cargo space versus rivals.",
  "links": [
    { "publication": "Car and Driver", "url": "https://www.caranddriver.com/honda/accord", "date": "2025-10-14" },
    { "publication": "Edmunds", "url": "https://www.edmunds.com/honda/accord/2026/", "date": "2026-01-22" },
    { "publication": "MotorTrend", "url": "https://www.motortrend.com/cars/honda/accord/2026/", "date": "2025-12-05" }
  ],
  "confidence": "high"
},

"owner_reviews": {
  "edmunds_star_rating": 4.5,
  "edmunds_sample_size": 312,
  "kbb_star_rating": 4.6,
  "kbb_sample_size": 487,
  "summary": "Owners praise fuel economy and comfort; common complaints are road noise and infotainment quirks.",
  "confidence": "high",
  "sources": ["edmunds.com/honda/accord/2026/consumer-reviews/", "kbb.com/honda/accord/2026/"]
}
```

All four blocks are required keys on every model, even when empty — set numeric fields to `null` and `confidence` to `"low"` or `"unknown"`, and write a `summary` explaining the gap. Never omit the block.

### 3.4 Powertrain

```jsonc
"powertrain": {
  "type": "hybrid",                   // "ice" | "hybrid" | "phev" | "ev" | "fcev"
  "engine_displacement_l": 2.0,       // null for pure EVs
  "engine_config": "I4",              // "I3"/"I4"/"I5"/"I6"/"V6"/"V8"/"V10"/"V12"/"flat-4"/"flat-6"/"rotary"/"none" (for EVs)
  "aspiration": "naturally_aspirated", // "naturally_aspirated"|"turbocharged"|"twin_turbocharged"|"supercharged"|"electric"
  "horsepower_hp": 204,
  "horsepower_source": "manufacturer-combined", // see notes below
  "torque_lb_ft": 247,
  "transmission": "e-CVT",            // free-text; e.g., "8-speed automatic", "10-speed automatic", "single-speed direct drive", "7-speed DCT"
  "transmission_speeds": null,         // numeric if applicable; null for CVT, single-speed, e-CVT
  "drivetrain": "FWD"                  // "FWD"|"RWD"|"AWD"|"4WD"|"AWD-electric" (for EVs with separate motors per axle)
}
```

Horsepower notes:
- `horsepower_hp` is the trim's headline number as advertised by the manufacturer.
- For hybrids/PHEVs, manufacturers publish a "combined" system output and separately publish engine-only and motor-only outputs. Use the combined system output. Set `horsepower_source` to `"manufacturer-combined"`.
- For ICE: use the engine output. `horsepower_source: "manufacturer-engine"`.
- For EVs: combined motor output. `horsepower_source: "manufacturer-combined"`.
- Always cite the source URL in the trim's `sources` field-map (§4.4).

### 3.5 EV/hybrid specifics

`ev_specifics` is `null` for pure ICE. Present for hybrid, PHEV, EV, FCEV.

```jsonc
"ev_specifics": {
  "battery_capacity_kwh": 1.06,         // total pack capacity (NOT just usable); null if not published
  "battery_usable_kwh": null,            // optional; for EVs/PHEVs if published separately
  "electric_range_mi": null,             // EPA-rated all-electric range; null for HEVs
  "total_range_mi": 600,                 // EPA combined range; for EVs, equals electric_range_mi
  "dc_fast_charge_peak_kw": null,        // null for HEVs
  "dc_fast_charge_10_to_80_min": null,   // null for HEVs
  "ac_charge_kw": null,                  // onboard charger AC peak
  "mpge_combined": null,                 // EVs/PHEVs only
  "plug_type": null                      // e.g., "NACS", "CCS1", "Tesla NACS native"; null for HEVs
}
```

For HEVs (no plug), most fields are `null`; only `battery_capacity_kwh` and sometimes `total_range_mi` are populated.

### 3.6 Fuel economy

EPA-sourced. Always cite `fueleconomy.gov` URL.

```jsonc
"fuel_economy": {
  "city_mpg": 51,
  "highway_mpg": 44,
  "combined_mpg": 48,
  "fuel_tank_gal": 12.8,                 // null for EVs
  "fuel_type_required": "regular",       // "regular"|"premium"|"diesel"|"electricity"|"hydrogen"|"flex_e85"
  "epa_annual_fuel_cost_usd": null       // if EPA publishes it; optional
}
```

For EVs, **populate `city_mpg`/`highway_mpg`/`combined_mpg` with the EPA MPGe values from fueleconomy.gov** — the same MPGe figures that also appear in `ev_specifics.mpge_combined`. This mirroring is intentional: it lets cross-model sort/filter on `combined_mpg` include EVs naturally, without the build phase having to branch on `powertrain.type`. For PHEVs, populate `city_mpg`/`highway_mpg`/`combined_mpg` with the charge-sustaining MPG values (gasoline mode), and put the charge-depleting MPGe in `ev_specifics.mpge_combined`.

### 3.7 Performance

```jsonc
"performance": {
  "zero_to_60_sec": 7.1,
  "zero_to_60_source": "manufacturer",   // "manufacturer"|"car_and_driver"|"motortrend"|"edmunds"|"estimated"
  "top_speed_mph": null,
  "towing_capacity_lb": 1000,
  "payload_capacity_lb": null
}
```

Notes:
- `zero_to_60_sec`: prefer manufacturer-published. If unavailable, use Car and Driver or MotorTrend tested numbers. Note the source.
- If multiple credible sources disagree by more than 0.5 sec, prefer manufacturer if available, otherwise the most recent independent test. Note the disagreement in trim `notes`.
- `top_speed_mph`: often unpublished for non-performance trims. Leave `null` if not findable.
- `towing_capacity_lb` and `payload_capacity_lb`: as published by manufacturer. If a model has a "properly equipped" caveat with a higher number, use the standard equipment number and mention the optional max in trim `notes`.

### 3.8 Dimensions

```jsonc
"dimensions": {
  "length_in": 195.7,
  "width_in": 73.3,                       // excluding mirrors
  "height_in": 57.1,
  "wheelbase_in": 111.4,
  "ground_clearance_in": 5.5,
  "curb_weight_lb": 3473,
  "cargo_volume_cuft": {
    "behind_3rd_row": null,               // for 3-row SUVs only; cargo with all 3 rows up
    "behind_2nd_row": null,               // for SUVs/wagons/hatches; null for sedans
    "behind_1st_row": null,
    "max_with_seats_folded": null,        // = behind_1st_row for most, but some manufacturers measure differently
    "trunk_cuft": 16.7                    // for sedans/coupes
  }
}
```

For each model type:
- **Sedans/coupes:** only `trunk_cuft` populated; SUV-style cargo fields `null`.
- **Hatchbacks/2-row SUVs/wagons:** `behind_2nd_row` and `behind_1st_row` populated; `behind_3rd_row` and `trunk_cuft` `null`.
- **3-row SUVs:** populate `behind_3rd_row` (cargo with all 3 rows up — typically the smallest number, e.g. 22.4 cu ft on Honda Pilot), `behind_2nd_row` (cargo with 3rd row folded), AND `behind_1st_row` (= max with both rear rows folded). `trunk_cuft` is `null`.
- **Trucks:** use `trunk_cuft: null` and add `bed_length_in` and `bed_volume_cuft` keys for trucks — extend the schema for trucks only. Note this in trim `notes`.

### 3.9 Safety

```jsonc
"safety": {
  "nhtsa_overall_rating": 5,              // 1-5 stars, integer; null if not yet rated
  "nhtsa_rating_year": 2026,
  "iihs_top_safety_pick": "TSP+",         // "TSP"|"TSP+"|null
  "iihs_rating_year": 2025,
  "standard_adas": {
    "automatic_emergency_braking": true,
    "lane_keeping_assist": true,
    "lane_departure_warning": true,
    "adaptive_cruise_control": true,
    "blind_spot_monitoring": true,
    "rear_cross_traffic_alert": true,
    "rear_automatic_braking": false,
    "driver_attention_monitoring": true
  }
}
```

ADAS booleans are for *this trim's standard equipment*. If a feature is optional, set `false` (mention in trim `notes` that it's optional). NHTSA/IIHS ratings are model-level data but stored on each trim for query convenience — they'll be identical across all trims of a model.

### 3.10 Features

Standard equipment for this trim. Keep this section curated — not every minor feature, just the ones enthusiasts and shoppers care about.

```jsonc
"features": {
  "infotainment_screen_in": 12.3,
  "driver_display_in": 10.2,                // null if it's an analog cluster
  "apple_carplay": "wireless",              // "wired"|"wireless"|"none"
  "android_auto": "wireless",
  "sound_system": "Bose 12-speaker",        // free-text; e.g., "6-speaker", "Harman Kardon 16-speaker"
  "sunroof": "panoramic",                   // "none"|"standard"|"panoramic"
  "seat_material": "leather",               // "cloth"|"synthetic_leather"|"leather"|"nappa_leather"|"alcantara_mix"|"performance_cloth"
  "heated_seats_front": true,
  "ventilated_seats_front": false,
  "heated_steering_wheel": true,
  "power_seats_driver": true,
  "memory_seats_driver": true,
  "wireless_phone_charging": true,
  "head_up_display": false,
  "remote_start": true,
  "notable_other": []                        // array of free-text strings for distinctive trim features
}
```

If the manufacturer doesn't separately publish a sound system spec (e.g., "premium audio" with no brand), record what they publish. Default to `null` if truly absent.

### 3.11 Warranty

Brand-level; identical across trims of a brand unless powertrain-specific (EV battery).

```jsonc
"warranty": {
  "basic_yr_mi": "3yr/36k",
  "powertrain_yr_mi": "5yr/60k",
  "corrosion_yr_mi": "5yr/unlimited",
  "roadside_yr_mi": "3yr/36k",
  "ev_battery_yr_mi": null,                  // for EVs/PHEVs/HEVs; e.g., "8yr/100k"
  "complimentary_maintenance_yr_mi": "2yr/24k" // some brands include this; null if none
}
```

Format `"<years>yr/<miles>k"` for compactness. Use `"unlimited"` where applicable.

### 3.12 Images

Array of image references. Each image:

```jsonc
{
  "angle": "front_three_quarter",            // see angle taxonomy below
  "url": "https://hondanews.com/.../accord-sport-hybrid-front.jpg",
  "local_path": "images/honda/accord/sport-hybrid/front-three-quarter.jpg",
  "credit": "American Honda Motor Co., Inc.",
  "is_shared_with_trim_family": false        // true if this image is reused across trims in the same family
}
```

**Required angles per trim family (minimum 4):**

- `"front_three_quarter"` — front 3/4 exterior
- `"rear_three_quarter"` — rear 3/4 exterior
- `"side_profile"` — side exterior
- `"interior_dashboard"` — interior, dashboard/console view

**Optional but encouraged:**

- `"interior_rear_seats"`, `"cargo_area"`, `"wheel_detail"`, `"engine_bay"` (rarely available), `"exterior_color_options_grid"`.

Image sourcing priority:
1. Manufacturer media/press site (e.g., hondanews.com, press.bmwgroup.com)
2. Manufacturer consumer site (honda.com, bmw.com)
3. Reputable automotive press galleries (Car and Driver, MotorTrend, Edmunds)
4. Wikimedia Commons for older/discontinued items where step 1-3 fail

`is_shared_with_trim_family: true` permits using the same image for multiple trims that share a family (see §7). Always note in trim `notes` when images are shared rather than trim-specific.

---

## 4. Source hierarchy and citation

### 4.1 Source ranking (per field, take the highest available)

1. **Manufacturer site / official press materials** — primary for: trim names, MSRP, destination fee, dimensions, weights, standard features, warranty, transmission, drivetrain, powertrain claims (hp/torque), towing/payload, images.
2. **fueleconomy.gov (EPA)** — authoritative for: city/highway/combined MPG, MPGe, electric range, total range, fuel cost. Always use EPA over manufacturer claims if they differ.
3. **nhtsa.gov** — authoritative for: NHTSA overall, frontal/side/rollover ratings.
4. **iihs.org** — authoritative for: IIHS TSP/TSP+ awards, crashworthiness ratings.
5. **JD Power (jdpower.com)** — primary for: VDS reliability, IQS initial quality, APEAL satisfaction. Note study year.
6. **Consumer Reports (consumerreports.org)** — predicted reliability, owner satisfaction (publicly readable summary pages only — do not require subscription to verify).
7. **Edmunds, KBB, Car and Driver, MotorTrend, Cars.com** — secondary cross-check for specs; primary for owner-review aggregates and professional review synthesis.

### 4.2 When sources conflict

- Manufacturer vs. EPA on MPG: EPA wins. Note manufacturer's number in trim `notes` if it's substantially different.
- Manufacturer vs. independent test on 0-60: prefer manufacturer if published. If only independent tests exist, use the most recent or take the median if multiple exist within 0.5 sec. Set `zero_to_60_source` accordingly.
- Two secondary sources disagreeing on a spec the manufacturer doesn't publish: take the more recent. Note disagreement in trim `notes`.
- Reliability data: VDS, CR, and JD Power can disagree. Record what each says rather than picking one.

### 4.3 Confidence levels (per field, per block)

- `"high"`: primary source (manufacturer/EPA/NHTSA/IIHS), no conflicts.
- `"medium"`: secondary source, OR primary source with minor caveats (e.g., "properly equipped" qualifier).
- `"low"`: single secondary source, OR sources disagree, OR data is older than current MY but reasonably inferred.
- `"unknown"`: not findable from any source. Field is `null` in that case.

Confidence applies to *blocks* (reliability, customer_satisfaction, professional_reviews, owner_reviews) rather than to every individual field, to keep the schema manageable. For trim-level spec fields, confidence is implied by source — see §4.4.

### 4.4 Source citation per spec field

Every trim has a `sources` map at the trim level (not shown above for brevity; required field):

```jsonc
"sources": {
  "msrp_base": "https://automobiles.honda.com/accord-hybrid/specs-features",
  "powertrain": "https://automobiles.honda.com/accord-hybrid/specs-features",
  "fuel_economy": "https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=...",
  "performance.zero_to_60_sec": "https://www.caranddriver.com/honda/accord/specs",
  "dimensions": "https://automobiles.honda.com/accord-hybrid/specs-features",
  "safety.nhtsa_overall_rating": "https://www.nhtsa.gov/vehicle/2026/HONDA/ACCORD",
  "safety.iihs_top_safety_pick": "https://www.iihs.org/ratings/vehicle/honda/accord-4-door-sedan/2026",
  "features": "https://automobiles.honda.com/accord-hybrid/specs-features",
  "warranty": "https://automobiles.honda.com/warranty"
}
```

Use dot-notation keys for sub-fields when the source for one sub-field differs from the block's main source. Group sources by block when they share the same URL.

**Optional `sources_confidence` trim-level map.** When a source field needs a confidence value distinct from the spec block's confidence (e.g., the §4.6 scoped MSRP relaxation in `01_research_brand.md`), include an optional `sources_confidence` map alongside `sources`:

```jsonc
"sources_confidence": {
  "msrp_base": "medium"
}
```

This is a no-op for the build phase. The verifier accepts it. Use cases: ultra-luxury MSRPs sourced from automotive-press editorial (per §4.6) carry `medium` confidence to signal the data is reliable but not from primary manufacturer disclosure. Most trims don't need this map at all.

### 4.5 NHTSA/IIHS source URL convention

Per-vehicle pages on nhtsa.gov/vehicle/<year>/<make>/<model> and iihs.org/ratings/vehicle/<make>/<model>/<year> are preferred for `sources.safety.nhtsa_overall_rating` and `sources.safety.iihs_top_safety_pick`. For brands and vehicles where no per-vehicle page exists (typically ultra-luxury, exotic, and certain specialty performance variants), use the brand's NHTSA/IIHS roll-up page (e.g., nhtsa.gov/ratings?make=Ferrari or iihs.org/ratings/all?make=ferrari) and set the relevant safety rating fields to null with `_rating_year: null`. Roll-up URLs are valid sources for documenting 'not tested' — they are not valid sources for actual ratings.

---

## 5. Body style taxonomy (fixed)

Use exactly one of these for `body_style`. Do not invent new categories.

- `sedan` — three-box, conventional trunk, 4 doors
- `coupe` — two-door OR four-door with coupe-styled roofline marketed as such by manufacturer (e.g., BMW Gran Coupe)
- `hatchback` — two-box with rear liftgate, car-height
- `wagon` — two-box, longer rear cargo area than hatchback, car-height (e.g., Audi A6 Allroad, Volvo V60)
- `convertible` — open-top, includes hardtop and softtop
- `suv-compact` — crossovers under ~185" length, ~3,800 lb (e.g., Honda HR-V, BMW X1, Toyota Corolla Cross)
- `suv-midsize` — 185–200" length OR 3,800–5,000 lb, typically 5-seat (e.g., Honda CR-V, BMW X3, Toyota RAV4)
- `suv-3row` — 3-row crossover or SUV (e.g., Honda Pilot, BMW X7, Toyota Grand Highlander)
- `suv-full-size` — body-on-frame full-size (e.g., Toyota Sequoia, GMC Yukon)
- `pickup-midsize` — midsize trucks (e.g., Toyota Tacoma, Honda Ridgeline)
- `pickup-full-size` — full-size trucks (e.g., Toyota Tundra, Chevy Silverado)
- `minivan` — sliding rear doors, 7+ seat people-mover (e.g., Honda Odyssey)
- `sports-car` — performance-focused 2-seater or 2+2 (e.g., Toyota GR Supra, BMW M2)

If a model genuinely defies these (very rare), default to the closest match and explain in model `notes`. Don't create new categories.

**Body-style decision rules:**

- Civic Hatchback → `hatchback`, not `sedan`.
- Civic Si → same `body_style` as the Civic it's based on (`sedan`), but it's a separate model entry with its own `model: "Civic Si"`.
- Civic Type R → `hatchback` (it's based on the hatch, not the sedan).
- BMW X4 / X6 / X2 (coupe-SUVs) → use `suv-midsize` and explain the styling variant in `notes`. Don't invent a "suv-coupe" category.
- 4-door coupes (BMW Gran Coupe, Mercedes CLS) → `coupe` if marketed as such; `sedan` otherwise. Default: follow the manufacturer's marketing language.
- Lexus LC 500 Convertible → `convertible` (the LC 500 coupe and LC 500 Convertible are separate models in our taxonomy because they have distinct body_style values per §6.4 "separate marketing lines").
- Porsche Panamera Sport Turismo / Taycan Sport Turismo / Taycan Cross Turismo → `wagon`, not `sedan`. Sport Turismo and Cross Turismo are explicitly wagon-bodied variants marketed alongside the sedan. Each is a separate trim (or separate model if priced as a distinct line in Porsche's build-and-price).
- Audi Sportback variants (A5 Sportback, A7 Sportback, RS 7 Sportback, e-tron GT) → `sedan` if four doors AND has a trunk (not a hatchback liftgate), `hatchback` if four doors AND has a liftgate over the rear cargo area. Audi's Sportback marketing language is ambiguous — check whether the rear opening lifts as one piece (hatchback) or hinges as a trunk lid (sedan).
- Audi Avant variants (RS 4 Avant, RS 6 Avant, A4 Allroad, A6 Allroad) → `wagon`.
- Mercedes-AMG GT 4-Door → `sedan` (Mercedes markets it as a 4-door coupe in some materials but the body is sedan-form with conventional trunk).

---

## 6. Trim deltas

### 6.1 Concept

Rather than writing the full 40-field spec list for every trim, we capture **full specs for the base trim**, then for each step-up trim record **only what differs from the base**.

The trim object includes all spec blocks (powertrain, fuel_economy, etc.) regardless of trim level. For the **base trim**, every block is fully populated. For **step-up trims**, blocks may be partially populated — only the fields that differ from base need to be filled — and a `delta_from_base` block summarizes the key changes in human-readable form.

### 6.2 Base trim selection

The "base trim" is the lowest-MSRP trim of the model. If two trims share the same starting MSRP (rare), pick the one with the more standard configuration.

For models with multiple distinct powertrains as separate trim lines (e.g., Civic non-hybrid vs. Civic Hybrid), treat each powertrain line as a separate base trim. Record full specs for both.

**Sole-trim case.** If a powertrain line has exactly one trim, that trim is the base trim for its line — set `is_base_trim: true` and `delta_from_base: null`. Do not give it a `delta_from_base` pointing to a trim in a different powertrain line. The same rule applies at the trim-family level (§7): if a `trim_family` contains exactly one trim, that trim is the family's base trim, has `is_base_trim: true`, and must carry the full 4 required image angles in its own `images` array (no inheritance from other families). A model whose entire lineup is a single trim (e.g., BMW XM Label, ALPINA XB7) has that trim as its sole base, with `is_base_trim: true` and `delta_from_base: null`.

### 6.3 Trim object — step-up vs base

For the **base trim**:
- `is_base_trim: true`
- All spec blocks fully populated.
- `delta_from_base: null`

For **step-up trims**:
- `is_base_trim: false`
- Spec blocks can omit fields that match the base trim. If a block is entirely unchanged, set it to `null` rather than copying.
- `delta_from_base` must be populated:

```jsonc
"delta_from_base": {
  "from_trim_slug": "lx",
  "msrp_delta_usd": 2300,
  "changes": [
    "Adds 17\" alloy wheels (vs. 16\" steel with covers)",
    "Adds heated front seats",
    "Adds power driver's seat (8-way)",
    "Adds wireless phone charging",
    "Adds blind spot monitoring with rear cross-traffic alert"
  ]
}
```

`changes` is an array of short human-readable bullets, ordered from most impactful (powertrain/major equipment) to least (cosmetic). Aim for 3–8 bullets. The build phase will render this as a table.

### 6.4 What counts as a "trim"

A trim is one purchasable line as the manufacturer markets it. Powertrain or drivetrain choices that the manufacturer presents as separate model lines (not options on a single trim) become separate trim entries.

Examples:
- Honda Accord: LX, Sport, EX-L, Sport Hybrid, EX-L Hybrid, Sport-L Hybrid, Touring Hybrid → 7 trims (the hybrid versions are separate marketing lines).
- BMW 3 Series: 330i (RWD), 330i xDrive (AWD), M340i (RWD), M340i xDrive (AWD), 330e (PHEV) → 5 trims.
- BMW M3 is a separate model from 3 Series.
- Toyota Camry (all hybrid in current gen): LE, SE, XLE, XSE, LE AWD, SE AWD, XLE AWD, XSE AWD → 8 trims.

When in doubt: if the manufacturer's build-and-price tool or main spec page treats it as a separate selectable line at the top level, it's a separate trim.

### 6.5 Optional packages

Packages (e.g., "Premium Package", "Driver Assistance Plus") are not separate trims. Capture standard features at the trim level. If a notable feature is optional on a trim, set its boolean to `false` and mention the package in trim `notes`.

Exception: when an optional package fundamentally changes the car (e.g., M Sport package on BMW 5 Series, JBL audio + Tech package combos), include a 1-line summary of major available packages in trim `notes`.

---

## 7. Trim families and image sharing

Some trims are cosmetically and mechanically near-identical, differing only in equipment levels. Within such families, image sharing is allowed.

A `trim_family` is a string slug grouping trims that share photography. Common patterns:
- All trims of the same powertrain that share exterior styling: one family.
- Trims that have distinct exterior styling (e.g., Sport-bodied vs. base-bodied; M Performance trims with unique grilles) get their own family.

When a trim's images are reused from another trim in the same family, set `is_shared_with_trim_family: true` on each shared image and note this in trim `notes`.

The minimum 4-image requirement applies to the **trim family**, not every individual trim. If a family has 5 trims, you need 4 unique images for the family — not 20 separate images. **Singleton families** (a `trim_family` containing exactly one trim) must carry all 4 required angles directly on that trim's own `images` array; there is no other trim in the family to inherit from. See also §6.2 sole-trim rule.

---

## 8. File and slug conventions

- **Brand slug:** lowercase, hyphenated, ASCII-only. Examples: `honda`, `bmw`, `mercedes-benz`, `land-rover`, `mini`.
- **Model slug:** lowercase, hyphenated, no spaces. Strip non-alphanumeric except hyphens. Examples: `accord`, `cr-v`, `cr-v-hybrid`, `x3-m50`, `s-class`, `911`, `911-turbo`.
- **Trim slug:** lowercase, hyphenated. Examples: `lx`, `sport-hybrid`, `m50i-xdrive`, `xse-awd`.
- **Trim family slug:** same conventions. Examples: `base`, `sport`, `touring`, `m-sport`.
- **Image filenames:** `<angle>.jpg` (or `.webp`/`.png`). Example: `front-three-quarter.jpg`. Stored under `images/<brand>/<model_slug>/<trim_family>/`.

### Brand-config conventions (script-level)

Brand-configs live at `scripts/brand-configs/<brand_slug>.json` and drive the Phase 4 image pipeline (`scripts/scrape_image_urls.mjs`, `scripts/download_images.mjs`). They are not part of the brand JSON schema, but the conventions are worth referencing here:

- **`model_pages`** (required): map of `model_slug` → manufacturer consumer page URL.
- **`slug_variants`** (optional): map of `model_slug` → array of alternate slug tokens to match in CDN URLs.
- **`path_blacklist_regex`** (optional): regex of URL path tokens to reject (chrome/nav/promo images).
- **`angle_url_patterns`** (optional, added Session 7): map of angle name (`front_three_quarter`, `rear_three_quarter`, `side_profile`, `interior_dashboard`) to a regex pattern. The scrape script uses these as brand-specific angle hints in addition to its default ANGLE_PATTERNS. Example (Mercedes-Benz): `"front_three_quarter": "[-_]HC(?:-D)?\\.(?:jpe?g|png|webp|avif)"`.
- **`accepted_cdn_domains`** (optional, added Session 8): array of CDN domain substrings the extension-less URL handler accepts beyond the default.

The image script reads these fields if present; absence means default behavior.

---

## 9. Honesty rules

- **Never fabricate values.** If a spec is not findable, set it to `null` and explain in `notes`.
- **Never copy-from-a-prior-trim without verification.** It may be wrong.
- **Never invent sources.** Every URL in `sources` must be a URL that was actually read during research.
- **Mark uncertainty.** Use `confidence` fields. Use trim and model `notes` for prose explanations of weak data.
- **Date everything.** `researched_at` at both model and brand levels.

---

## 10. Manifest file

`catalog/manifest.json` lists which brands the unified site should load:

```jsonc
{
  "schema_version": "1.0",
  "generated_at": "2026-05-22T14:30:00Z",
  "brands": [
    { "slug": "honda", "display_name": "Honda", "researched_at": "2026-05-15", "model_count": 13 },
    { "slug": "bmw", "display_name": "BMW", "researched_at": "2026-05-22", "model_count": 22 }
  ]
}
```

The build phase generates/updates this whenever it processes brand data.

---

## 11. STATUS.md (project root)

Tracks pipeline state across brands. Markdown table with these columns:

```
| Brand | Research | Built into site | Verified | Last updated | Notes |
```

The research, build, and verify phases each update this file at the end of their run.

---

## 12. Versioning

`schema_version` is a top-level field in every brand JSON and in the manifest. If we ever change the schema in a breaking way (renamed fields, restructured blocks), bump the version. The build phase warns if it encounters a brand file with a different schema version than the catalog supports.

Current version: **1.3**.

### Changelog

- **1.3** (2026-05-15): Documentation updates (non-breaking, no schema field changes): (1) Documented `sources_confidence` optional trim-level map (used for the §4.6 MSRP scoped relaxation in `01_research_brand.md`; ultra-luxury MSRPs sourced from automotive press editorial carry `medium` confidence on the MSRP field). (2) Documented `angle_url_patterns` optional brand-config field used by `scripts/scrape_image_urls.mjs` for brand-specific URL angle hints (added in Session 7). (3) Cross-referenced the new `05_session_runbook.md` (multi-phase session orchestration meta-rules) and `06_maintenance.md` (periodic maintenance) instruction files from Session 11. Existing brand JSONs do not require migration.
- **1.2** (2026-05-13): Documentation and convention updates (non-breaking, no schema field changes): (1) Expanded body-style decision rules in §5 for Sportback/Avant/Sport Turismo/AMG GT 4-Door variants per cross-batch findings. (2) Added §4.5 documenting NHTSA/IIHS roll-up URL convention for ultra-luxury and exotic brands. (3) Documented ultra-luxury MSRP non-disclosure as a structural project pattern in §13. Existing brand JSONs do not require migration — these updates clarify existing conventions rather than changing data shape.
- **1.1** (2026-05-11, revised): Convention changes (non-breaking, no schema field changes): (1) EV trims now mirror MPGe values into `fuel_economy.city_mpg/highway_mpg/combined_mpg` instead of leaving them null; this makes cross-model sort/filter work without special-casing powertrain.type. (2) Sole-trim rule clarified in §6.2 and §7: a single-trim powertrain line or single-trim trim_family is always `is_base_trim: true` with `delta_from_base: null`, and a singleton trim_family carries its 4 required images directly. Existing 2026-MY brand JSONs may have EV trims with null MPG fields under the old convention; those should be patched to the new convention during the next data-fix pass.
- **1.1** (2026-05-11): Added `dimensions.cargo_volume_cuft.behind_3rd_row` for 3-row SUVs. Backward compatible — older 1.0 files without this field are treated as having `behind_3rd_row: null`, and the build phase reads either version.
- **1.0** (initial): Initial schema.

---

## 13. Open issues / known limitations

- Reliability data for current MY is structurally weak (VDS measures 3-year-old cars). Spec accepts `null` and `"low"` confidence as honest answers.
- Some manufacturers (especially European luxury) lock detailed specs behind build-and-price flows that require JavaScript interaction. Spec sheets and brochure PDFs are the fallback; some trim configurations may be missed on first pass. Verification phase exists to catch this.
- Press kits often don't have trim-specific photos for every trim. Trim-family sharing is allowed (§7); a brand with 5 trims may legitimately have only 1 set of 4 photos if all trims share a family.
- Cargo-volume measurement standards vary by manufacturer (some use SAE J1100, some don't); we record the published number and don't attempt to standardize.
- Ultra-luxury and exotic-brand MSRP non-disclosure is structural, not a research gap. Approximately one in four current Car Catalog Project brands does not publish US MSRP on consumer or accessible press sites. Per the honesty rules in §9, null MSRP with a trim.notes entry explaining the non-disclosure is the correct answer, not a defect to be filled. The verifier (§3 of 03_verify_catalog.md) treats this case as FYI rather than BLOCKER when notes document the pattern.

End of spec.
