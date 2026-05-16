# Dataset Schema — a tutorial guide

> A reader-friendly walk through how the dataset is structured. The authoritative contract is in [`instructions/00_master_spec.md`](../instructions/00_master_spec.md); this document is a tutorial, not the spec. When the two disagree, the spec wins.
>
> For the project narrative, see the [README](../README.md). For the engineering story, see [PROCESS.md](./PROCESS.md).

---

## 1. Top-level file structure

The dataset is one JSON file per brand: `data/honda.json`, `data/bmw.json`, ..., `data/volkswagen.json`. The catalog frontend mirrors these into `catalog/data/<brand>.json` and the build process keeps them byte-identical.

Each file has the same shape:

```json
{
  "brand": "Honda",
  "brand_slug": "honda",
  "researched_at": "2026-05-11",
  "schema_version": "1.3",
  "models": [
    { /* model object */ },
    { /* model object */ },
    ...
  ]
}
```

### Top-level fields

| Field | Type | Meaning |
|---|---|---|
| `brand` | string | The display name. Casing as the manufacturer brands it (e.g., "Mercedes-Benz", "Rolls-Royce", "GMC", "VinFast"). |
| `brand_slug` | string | URL-safe lowercase slug. Matches the filename. |
| `researched_at` | ISO date | The date the most recent research pass on this brand completed. Drift detection compares this against the current date. |
| `schema_version` | string | "1.0" through "1.3". Newer brands are at "1.3"; some early brands carry their original version. |
| `models` | array | One entry per current-MY model. |

The `manifest.json` file at `catalog/manifest.json` is a separate index listing every brand, its display name, its model count, and its `researched_at`. The catalog loads `manifest.json` first to populate the brand navigator, then lazy-loads each brand's `data/<slug>.json` as needed.

---

## 2. Model objects

A model is a vehicle nameplate. Honda Civic is one model; Honda Accord is another. Civic Hatchback and Civic Sedan are **separate models** because Honda sells them as separate body styles.

Each model object looks like this:

```json
{
  "model": "Civic",
  "model_slug": "civic",
  "model_year": 2026,
  "body_style": "sedan",
  "generation_context": "11th-gen, introduced 2022; styling/tech refresh for 2025-26 MY",
  "msrp_range": { "low": 24695, "high": 32395 },
  "model_summary": "Compact sedan available with a 150-hp 2.0L gas engine ...",
  "reliability": { /* see §3.1 */ },
  "customer_satisfaction": { /* see §3.2 */ },
  "professional_reviews": { /* see §3.3 */ },
  "owner_reviews": { /* see §3.4 */ },
  "trims": [
    { /* trim object — see §4 */ }
  ]
}
```

### Model-level fields

| Field | Type | Notes |
|---|---|---|
| `model` | string | Display name. |
| `model_slug` | string | URL-safe lowercase slug. Used in catalog URLs and image paths. |
| `model_year` | number | The MY this entry covers. Currently 2026 for all entries. |
| `body_style` | string | One of: `sedan`, `coupe`, `hatchback`, `wagon`, `convertible`, `compact_suv`, `midsize_suv`, `fullsize_suv`, `luxury_suv`, `compact_pickup`, `fullsize_pickup`, `minivan`, `sports_car`. Edge cases resolved in `instructions/00_master_spec.md` §5. |
| `generation_context` | string | One-line note on the generation: which-gen, when introduced, any refresh. |
| `msrp_range.low` / `high` | number / null | Min / max trim MSRP. Computed from trims. Null only when all trims have null MSRP (ultra-luxury non-disclosure). |
| `model_summary` | string | 2–4 sentences describing the model's offering. |
| `reliability` | object | JD Power VDS + Consumer Reports. See §3.1. |
| `customer_satisfaction` | object | JD Power APEAL. See §3.2. |
| `professional_reviews` | object | Synthesis of editorial reviews + link list. See §3.3. |
| `owner_reviews` | object | Edmunds / KBB star ratings + summary. See §3.4. |
| `trims` | array | One or more trim objects. See §4. |

---

## 3. Model-level review and reliability sub-objects

### 3.1 `reliability`

```json
"reliability": {
  "jd_power_vds_score": null,
  "jd_power_vds_year": 2026,
  "consumer_reports_predicted_reliability": 4,
  "summary": "JD Power 2026 VDS (Feb 2026, measuring 2023 MY vehicles) did not list ...",
  "jd_power_vds_source": "https://www.jdpower.com/business/press-releases/2026-us-vehicle-dependability-study-vds",
  "confidence": "medium",
  "sources": [ "https://...", "https://..." ]
}
```

- `jd_power_vds_score`: number (PP100, lower is better) or null if not in the study
- `consumer_reports_predicted_reliability`: 1–5 stars or null
- `confidence`: `"high"` / `"medium"` / `"low"` / `"unknown"`
- `summary` is required when sources is non-empty; explains the reasoning behind the score (or its absence)

### 3.2 `customer_satisfaction`

Mirrors the reliability shape but for JD Power APEAL.

```json
"customer_satisfaction": {
  "jd_power_apeal_score": null,
  "jd_power_apeal_year": null,
  "summary": "JD Power 2026 APEAL Study has not yet been published as of May 2026 (APEAL typically publishes in July) ...",
  "confidence": "unknown",
  "sources": [ "..." ]
}
```

Most 2026-MY entries currently have null `jd_power_apeal_score` because the 2026 APEAL study hasn't published yet (typical-July release). The `instructions/06_maintenance.md` §2 pattern queues a fill pass once it does.

### 3.3 `professional_reviews`

```json
"professional_reviews": {
  "summary": "Reviewers continue to praise the 11th-gen Civic Sedan for its refined ride ...",
  "links": [
    { "publication": "Edmunds", "url": "https://www.edmunds.com/honda/civic/2026/sedan/", "date": "2026-01-15" }
  ],
  "confidence": "medium"
}
```

`links` is a 1–3 element list of editorial reviews. The forbidden-source list applies: cars.com, motor1.com, carbuzz.com, etc. are blocked at verification time.

### 3.4 `owner_reviews`

```json
"owner_reviews": {
  "edmunds_star_rating": null,
  "edmunds_sample_size": null,
  "kbb_star_rating": null,
  "kbb_sample_size": null,
  "summary": "Too early in the 2026 MY cycle for meaningful owner-review samples ...",
  "confidence": "low",
  "sources": [ "https://www.edmunds.com/honda/civic/2026/sedan/" ]
}
```

Owner reviews for 2026-MY vehicles are typically sparse this early in the MY cycle. Summary explains the situation; star ratings may be null.

---

## 4. Trim objects

A trim is a configurable variant of a model. Honda Civic LX is one trim; Civic Sport is another. Each trim object carries either full specs (for `is_base_trim: true`) or only the deltas from base (for step-up trims).

### 4.1 Trim header fields

```json
{
  "trim": "LX",
  "trim_slug": "lx",
  "trim_family": "civic-sedan-standard",
  "is_base_trim": true,
  "msrp_base": 24695,
  "destination_fee": 1195,
  "msrp_as_equipped_estimate": null,
  ...
}
```

| Field | Type | Meaning |
|---|---|---|
| `trim` | string | Display name. |
| `trim_slug` | string | URL-safe lowercase. |
| `trim_family` | string | Grouping key for image sharing. Multiple trims can share a `trim_family` and a base trim's images. |
| `is_base_trim` | boolean | Exactly one trim per `trim_family` should be the base. |
| `msrp_base` | number / null | Manufacturer's published MSRP. Null for ultra-luxury non-disclosure (with documented notes). |
| `destination_fee` | number / null | Manufacturer destination charge. |
| `msrp_as_equipped_estimate` | number / null | Typical-config price including major options, when computable from manufacturer data. |

### 4.2 The base-trim / step-up-trim pattern

Base trim carries the full spec. Step-up trims carry only what changes from base.

#### Worked example: Honda Accord ICE + Hybrid lines

Honda Accord has 6 trims across two powertrain families. The dataset splits them into ICE and Hybrid `trim_family` groups:

```
Accord trims:
  LX        (trim_family: accord-ice,    is_base_trim: true)   — full spec
  EX        (trim_family: accord-ice,    is_base_trim: false)  — deltas only
  Sport     (trim_family: accord-hybrid, is_base_trim: true)   — full spec
  EX-L      (trim_family: accord-ice,    is_base_trim: false)  — deltas only
  Sport-L   (trim_family: accord-hybrid, is_base_trim: false)  — deltas only
  Touring   (trim_family: accord-hybrid, is_base_trim: false)  — deltas only
```

The ICE base (LX) carries the full spec for the gas powertrain. The Hybrid base (Sport) carries the full spec for the hybrid powertrain. Each step-up trim records only what differs.

A step-up trim looks like this:

```json
{
  "trim": "Sport",
  "trim_slug": "sport",
  "trim_family": "civic-sedan-standard",
  "is_base_trim": false,
  "msrp_base": 26695,
  "destination_fee": 1195,
  "msrp_as_equipped_estimate": null,
  "powertrain": null,
  "ev_specifics": null,
  "fuel_economy": { "city_mpg": 31, "highway_mpg": 39, "combined_mpg": 34, ... },
  "performance": null,
  "dimensions": null,
  "capacity": { "seats": 5, "rows": 2 },
  "wheels_tires": { "wheel_size_in": 18, "tire_spec": "235/40R18 alloy ..." },
  "safety": { ... },
  "features": { ... },
  "warranty": null,
  "images": [ ... ],
  "sources": { ... },
  "delta_from_base": null,
  "notes": "..."
}
```

When a field is `null` on a step-up trim, **it inherits from the base trim of its `trim_family`**. The frontend's render logic computes the effective value by falling back to base.

Some fields are commonly preserved across trims (capacity, safety ratings if class-wide) and reported on each trim for clarity. Others (powertrain, dimensions, performance) are only re-stated on step-ups when they actually differ.

### 4.3 Full spec sub-objects

The base trim's full spec includes:

#### `powertrain`

```json
"powertrain": {
  "type": "ice",
  "engine_displacement_l": 2,
  "engine_config": "I4",
  "aspiration": "naturally_aspirated",
  "horsepower_hp": 150,
  "horsepower_source": "manufacturer-engine",
  "torque_lb_ft": 133,
  "transmission": "Continuously Variable Transmission (CVT)",
  "transmission_speeds": null,
  "drivetrain": "FWD"
}
```

- `type`: `"ice"`, `"hybrid"`, `"phev"`, `"ev"`, `"fuel_cell"`
- For `"ev"`, `engine_displacement_l` / `engine_config` / `aspiration` are null; see `ev_specifics`
- `drivetrain`: `"FWD"`, `"RWD"`, `"AWD"`, `"4WD"` (with manufacturer terminology varying)

#### `ev_specifics` (EV/PHEV only)

```json
"ev_specifics": {
  "epa_range_mi": 358,
  "epa_combined_mpge": 122,
  "battery_capacity_kwh": 99,
  "battery_capacity_usable_kwh": 90,
  "charging_dc_max_kw": 200,
  "charging_ac_max_kw": 11.5,
  "onboard_charger_kw": 11.5,
  "ten_to_eighty_dc_min": 28
}
```

For PHEVs, also includes `epa_electric_only_range_mi`. EVs always cite `fueleconomy.gov` for range and MPGe.

#### `fuel_economy`

```json
"fuel_economy": {
  "city_mpg": 32,
  "highway_mpg": 41,
  "combined_mpg": 36,
  "fuel_tank_gal": 12.4,
  "fuel_type_required": "regular",
  "epa_annual_fuel_cost_usd": null
}
```

EV trims set `city_mpg` / `highway_mpg` / `combined_mpg` to the MPGe values (matching fueleconomy.gov reporting); `fuel_tank_gal` and `fuel_type_required` are null.

#### `performance`

```json
"performance": {
  "zero_to_60_sec": 9.8,
  "zero_to_60_source": "motortrend",
  "top_speed_mph": 125,
  "towing_capacity_lb": null,
  "payload_capacity_lb": null
}
```

`zero_to_60_source` records where the number came from when it's from an editorial source. Manufacturer-published values are preferred.

#### `dimensions`

```json
"dimensions": {
  "length_in": 184.8,
  "width_in": 70.9,
  "height_in": 55.7,
  "wheelbase_in": 107.7,
  "ground_clearance_in": 5.3,
  "curb_weight_lb": 2875,
  "cargo_volume_cuft": {
    "behind_2nd_row": null,
    "behind_1st_row": null,
    "max_with_seats_folded": null,
    "trunk_cuft": 14.8
  }
}
```

For sedans/coupes, `cargo_volume_cuft.trunk_cuft` is populated; the rest are null.
For SUVs, `behind_2nd_row` and `behind_1st_row` (with seats folded) are populated.
For 3-row SUVs, schema v1.3 adds `behind_3rd_row` to capture the cargo volume behind the third row of seats — many manufacturers publish this separately.

#### `capacity`

```json
"capacity": { "seats": 5, "rows": 2 }
```

#### `wheels_tires`

```json
"wheels_tires": {
  "wheel_size_in": 16,
  "tire_spec": "215/55R16 all-season on steel wheels with covers"
}
```

#### `safety`

```json
"safety": {
  "nhtsa_overall_rating": 5,
  "nhtsa_rating_year": 2025,
  "iihs_top_safety_pick": "TSP+",
  "iihs_rating_year": 2026,
  "standard_adas": {
    "automatic_emergency_braking": true,
    "lane_keeping_assist": true,
    "lane_departure_warning": true,
    "adaptive_cruise_control": true,
    "blind_spot_monitoring": false,
    "rear_cross_traffic_alert": false,
    "rear_automatic_braking": false,
    "driver_attention_monitoring": true
  }
}
```

- `nhtsa_overall_rating`: 1–5 stars or null
- `iihs_top_safety_pick`: `"TSP+"`, `"TSP"`, or null

#### `features`

```json
"features": {
  "infotainment_screen_in": 7,
  "driver_display_in": 7,
  "apple_carplay": "wired",
  "android_auto": "wired",
  "sound_system": "4-speaker 160-watt audio",
  "sunroof": "none",
  "seat_material": "cloth",
  "heated_seats_front": false,
  "ventilated_seats_front": false,
  "heated_steering_wheel": false,
  "power_seats_driver": false,
  "memory_seats_driver": false,
  "wireless_phone_charging": false,
  "head_up_display": false,
  "remote_start": false,
  "notable_other": [
    "LED headlights",
    "automatic climate control",
    "Honda Sensing standard"
  ]
}
```

#### `warranty`

```json
"warranty": {
  "basic_yr_mi": "3yr/36k",
  "powertrain_yr_mi": "5yr/60k",
  "corrosion_yr_mi": "5yr/unlimited",
  "roadside_yr_mi": "3yr/36k",
  "ev_battery_yr_mi": null,
  "complimentary_maintenance_yr_mi": "1yr/12k"
}
```

EVs populate `ev_battery_yr_mi` (typically 8yr/100k or similar). All other types leave it null.

### 4.4 `delta_from_base` (step-up trims only)

A step-up trim may declare its deltas explicitly:

```json
"delta_from_base": {
  "horsepower": null,
  "wheels": "19-inch alloy",
  "features_added": ["leather seats", "heated rear seats"],
  "features_removed": [],
  "performance_change": null
}
```

This is informational — the source of truth for what changed is the populated fields on the step-up trim itself. `delta_from_base` is rendered in the catalog's trim-delta table as a human-readable summary.

Singleton trims (sole trim of their `trim_family`) MUST have `delta_from_base: null` and `is_base_trim: true`. The verifier enforces this; Session 11–12's Toyota cleanup pass merged 49 trim_families to clear singleton-no-images blockers.

### 4.5 `notes`

Free-text trim-specific clarifications. Used for:
- Documented MSRP non-disclosure ("Bentley does not publish ...")
- Carry-over data when the current-MY entry is sparse
- Field-level explanations (the LX `notes` on Civic clarifies the destination fee source)
- Reasoning behind any unusual structural choice

The verifier scans notes for non-disclosure phrasings to downgrade null-MSRP blockers to FYIs (see PROCESS §3 verifier patches).

---

## 5. The `sources` map

Every trim has a `sources` map recording the citation for each spec field:

```json
"sources": {
  "msrp_base": "https://www.hondainfocenter.com/2026/Civic-Sedan/",
  "powertrain": "https://www.motormatchup.com/catalog/Honda/Civic/2026/LX-CVT",
  "fuel_economy": "https://www.motormatchup.com/catalog/Honda/Civic/2026/LX-CVT",
  "performance.zero_to_60_sec": "https://www.motormatchup.com/catalog/Honda/Civic/2026/LX-CVT",
  "dimensions": "https://www.motormatchup.com/catalog/Honda/Civic/2026/LX-CVT",
  "safety.nhtsa_overall_rating": "https://hondanews.com/en-US/honda-automobiles/releases/...",
  "safety.iihs_top_safety_pick": "https://www.iihs.org/ratings/vehicle/honda/civic-4-door-sedan/2026",
  "features": "https://www.hondainfocenter.com/2026/Civic-Sedan/",
  "warranty": "https://automobiles.honda.com/hr-v/honda-service-pass",
  "wheels_tires": "https://www.wheel-size.com/size/honda/civic/2026/"
}
```

Keys are field names; nested fields use dot notation (`safety.nhtsa_overall_rating`). Values are URLs.

The verifier:
- Walks every `sources` URL and checks against the forbidden-source list. Hit → blocker.
- Checks every `professional_reviews.links[].url` similarly.
- Hostname-only matching (per the Session 11 isDealerDomain fix) avoids false-positives on legitimate URLs whose paths happen to contain "of-" etc.

### Source confidence (optional, schema v1.3)

Schema v1.3 adds an optional `sources_confidence` map alongside `sources`:

```json
"sources_confidence": {
  "msrp_base": "high",
  "performance.zero_to_60_sec": "medium",
  "dimensions": "high"
}
```

Values: `"high"`, `"medium"`, `"low"`. Used to flag fields where the citation was solid but the underlying value was an editorial estimate (e.g., zero-to-60 from MotorTrend rather than manufacturer-published).

---

## 6. Image entries

Each trim has an `images` array. A typical entry:

```json
{
  "angle": "front_three_quarter",
  "url": "https://automobiles.honda.com/-/media/Honda-Automobiles/Vehicles/2026/civic-sedan/Full-Gallery-OP/Exterior/Modal/2026-honda-civic-sedan-sport-rallye-red-front-three-quarter-13.jpg?...",
  "local_path": "images/honda/civic/civic-sedan-standard/front_three_quarter.jpg",
  "credit": "Honda press/consumer site",
  "is_shared_with_trim_family": true,
  "downloaded": true
}
```

| Field | Meaning |
|---|---|
| `angle` | One of `front_three_quarter`, `rear_three_quarter`, `side_profile`, `interior_dashboard` (the 4 required), plus optional extras like `interior_rear_seats`, `wheel_detail`, `engine_bay`, `cargo_area`, `exterior_color_options_grid` |
| `url` | Direct asset URL when available; falls back to page URL with `needs_scraping: true` if the asset URL isn't findable at research time |
| `local_path` | Path within the repo where the downloaded image lives. Catalog renders from this. |
| `credit` | Source attribution. Almost always "Manufacturer press/consumer site" for Tier 1 entries. |
| `is_shared_with_trim_family` | When true, the trim shares its image with the base trim of its trim_family. Frontend renders the shared image; the trim doesn't need its own copy. |
| `downloaded` | True when the local file exists. False when the URL points to a remote that hasn't been downloaded (or failed). |

### Optional fields (post-Session 14)

Schema v1.3 added optional provenance fields for tiered sourcing:

```json
{
  "angle": "front_three_quarter",
  "url": "https://example.com/...",
  ...
  "source_tier": 1,
  "source_domain": "automobiles.honda.com",
  "content_type": "image/jpeg",
  "assignment_method": "url_pattern"
}
```

- `source_tier`: 1 (manufacturer), 2 (press-kit aggregator), 3 (manufacturer configurator endpoint)
- `source_domain`: the hostname from `url`
- `content_type`: the `Content-Type` header at download time
- `assignment_method`: how the angle was assigned — e.g., `"url_pattern"` (matched on URL regex), `"alt_text"` (matched on `<img alt>`), `"positional"` (assigned by hero order)

These fields are additive (existing entries without them still validate). They primarily exist to track Tier 2/3 sources should they be re-enabled after the Session 15 anti-bot finding.

### `needs_scraping` workflow

When Phase 1 research can't find a direct asset URL for an image (e.g., the manufacturer's page is JS-rendered and the asset URLs only appear after a click), it stores the page URL with `needs_scraping: true`:

```json
{
  "angle": "front_three_quarter",
  "url": "https://automobiles.honda.com/civic-sedan",
  "needs_scraping": true,
  "downloaded": false
}
```

`scripts/scrape_image_urls.mjs` then resolves these into direct asset URLs at scrape time, and `scripts/download_images.mjs` downloads them. The `needs_scraping` gate prevents the "idempotent reset" loop from clobbering already-resolved entries (this was Session 1's destructive-reset bug; see PROCESS §5.1).

---

## 7. Special cases briefly noted

The schema accommodates several recurring edge cases. Full details in `instructions/00_master_spec.md`.

### 7.1 Ultra-luxury null MSRP

Bentley, McLaren, Aston Martin, Rolls-Royce, Ferrari, and many Lamborghini trims do not publish MSRPs. Per Session 9's §4.6 policy relaxation, MSRP may be cited from Car and Driver, MotorTrend, Hagerty, or Road & Track when manufacturer non-disclosure is documented in `trim.notes`. When even editorial sources don't publish (invite-only specials), `msrp_base` stays null. The verifier downgrades documented null-MSRP to FYI rather than blocker.

### 7.2 3-row SUV cargo (schema v1.3)

`cargo_volume_cuft.behind_3rd_row` was added in v1.3 to capture the cargo behind the third row. Models without a third row use null for this field.

### 7.3 Multi-powertrain models

Models with both ICE and Hybrid (or ICE and EV) variants split into multiple `trim_family` groups. Each family has its own base trim with full powertrain specs. The Honda Accord example in §4.2 demonstrates this.

### 7.4 Singleton trim_family

A `trim_family` with exactly one trim. Schema v1.1 introduced the rule: singleton trims must have `is_base_trim: true`, `delta_from_base: null`, and 4 required image angles in their own `images` array (not shared from another trim). The verifier enforces this as a blocker. Session 12 cleaned up Toyota's 56 singleton-no-images violations via 49 minimal-diff trim_family merges.

### 7.5 NHTSA/IIHS source URL convention

Per-vehicle URLs (e.g., `iihs.org/ratings/vehicle/honda/civic-4-door-sedan/2026`) are preferred. Brand roll-up URLs (`iihs.org/ratings`) are valid only for documenting "not tested" — used for ultra-luxury / low-volume vehicles where NHTSA/IIHS simply don't have a rating. Mainstream brands using roll-up URLs generate a verifier warning.

### 7.6 EV MPGe mirroring

EV trims set `city_mpg` / `highway_mpg` / `combined_mpg` to the MPGe values from fueleconomy.gov. This keeps the schema homogeneous (the frontend renders the same field for all powertrain types) at the cost of slight semantic loosening. The `ev_specifics` object carries the additional EV-specific fields (range, battery capacity, charging speeds).

---

## 8. The brand-config layer

Each brand also has a `scripts/brand-configs/<slug>.json` file that the image-scraping pipeline reads. This is **not** part of the dataset schema — it's a per-brand hint file for the scraper:

```json
{
  "brand_slug": "honda",
  "model_pages": [
    { "model_slug": "civic", "url": "https://automobiles.honda.com/civic-sedan" },
    ...
  ],
  "slug_variants": {
    "civic": ["civic", "civic-sedan"]
  },
  "angle_url_patterns": {
    "front_three_quarter": [ "/360/36\\.(?:png|jpg|jpeg|webp)" ]
  },
  "accepted_cdn_domains": [ "automobiles.honda.com" ],
  "path_blacklist_regex": "..."
}
```

These configs let the scraper:
- Know which manufacturer URL to fetch per model
- Match alternate slugs (e.g., Yukon XL shares Yukon's page; Land Rover uses L-chassis-codes like L460)
- Recognize per-brand angle URL patterns when alt-text or filenames lack standard vocabulary
- Stay within manufacturer CDNs (no third-party leakage)

See `instructions/04_scrape_images.md` for the full brand-config spec.

---

## 9. Where to look next

- **For the authoritative schema spec:** `instructions/00_master_spec.md` (the contract; the source of truth when this document and the spec disagree)
- **For the research workflow:** `instructions/01_research_brand.md` (Phase 1)
- **For the verification rules:** `instructions/03_verify_catalog.md` (Phase 3 — what the verifier checks)
- **For the image pipeline:** `instructions/04_scrape_images.md` (Phase 4 — including the §A tiered source allowlist)
- **For the project narrative:** [PROCESS.md](./PROCESS.md)
- **For an example dataset analysis:** [`analyses/`](../analyses/)
