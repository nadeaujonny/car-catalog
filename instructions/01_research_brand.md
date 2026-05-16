# 01 — Research a Brand (Claude Code instructions)

You are working on the Car Catalog Project. This phase produces `data/<brand>.json` — a complete, sourced, structured data file containing every current-model-year vehicle the named brand sells new in the US, every trim, every spec.

**Input parameter:** a brand name (e.g., "Honda") provided at the bottom of this message.

**Output:** `data/<brand>.json` conforming to the schema in this document.

This file is self-contained. The full canonical spec is `instructions/00_master_spec.md` — read it if anything is ambiguous, but you should not need to.

**Version history (v3 changelog — 2026-05-15):**
- Forbidden-source list verified at top of file (§ "Forbidden sources", lines ~41-43) in prominent position.
- §4.6 MSRP scoped relaxation for ultra-luxury brands with documented non-disclosure verified intact.
- Added cumulative "Sessions 5-10 image-scrape findings" subsection near Edge Cases — common single-blocker patterns to flag during research.
- Clarified that `researched_at` must be set on every model the session touches, including partial refreshes (the freshness-check pattern in 06_maintenance.md depends on accurate model-level dates).

---

## Scope

- Current model year, current US-market lineup only. Discontinued models, prior-MY-only trims, and non-US variants are out of scope unless the trim documents a structural reason for inclusion (e.g., a single-model-year sole-trim variant marketed alongside in-production trims).
- Coverage: every trim currently sold new in the US, every spec field the schema defines. Honesty rules apply (set to `null` with a `confidence` and `notes` rather than fabricate).
- New brands may be added at any time using this same instruction file. The `data/<brand>.json` output, schema, source hierarchy, and honesty rules are identical. After research completes, run Phase 2 build and Phase 4 image scraping per the established workflow.

---

## Operating principles (read first)

1. **One model at a time.** Enumerate the brand's full model lineup before starting any research. Then research one model fully, save progress, move to the next. If you crash or context runs out, the file already has the finished models.

2. **Manufacturer site first.** For pricing, trim names, features, dimensions, warranty, hp/torque — start at the manufacturer site. Only fall back to secondaries when the manufacturer doesn't publish what you need.

3. **EPA for fuel economy, NHTSA for safety, IIHS for awards.** Never use manufacturer MPG claims over EPA numbers. Cite the exact source URL.

4. **Never fabricate.** If a value isn't findable from real sources, set it to `null` and write a `notes` entry explaining why. Do not invent. Do not infer "probably the same as the other trim." Verify each trim independently.

5. **Cite every spec field.** Each trim has a `sources` map. URLs you actually opened during research go there.

6. **Save after every model.** After finishing each model, write the current state of `data/<brand>.json` to disk. Do not batch and save at the end.

7. **Date everything.** `researched_at` at brand level and model level. ISO date format (`YYYY-MM-DD`).

8. **Be honest about gaps.** Reliability data for current model year is often unavailable. That's fine — mark it `null` with `confidence: "unknown"` and explain. Better than guessing.

---

## Forbidden sources (read this first — applies project-wide)

These specific domains have been encountered repeatedly as forbidden sources in prior research batches and MUST NOT appear as primary or sole sources in any trim's `sources` map or in any model's `professional_reviews.links`: www.cars.com, motor1.com, carbuzz.com, autoblog.com, autoevolution.com, teslaoracle.com, carsfrenzy.net, carscoops.com (spec sheets — news context only), any individual dealer site (e.g., elcerritohonda.com, miller-motorcars.com, rollsroycepasadena.com, fisherhonda.com, middletownhonda.com, musiccityhonda.com, and any URL matching the pattern <dealername><brand>.com), forum posts, Reddit threads, and enthusiast wikis. If you find a useful piece of information at one of these domains, find a primary source for it before citing — never cite the secondary domain alone.

See §4 (Source hierarchy) below for detailed rationale, allowed primary sources, and the full source ranking.

---

## Workflow

### Step 0: Setup

Check that the project structure exists. If not, create:
```
data/
images/
```

Read `data/<brand_slug>.json` if it already exists — you may be resuming a prior session. If it exists, read which models are already done and skip them.

### Step 1: Enumerate the brand's current US lineup

Web-search the manufacturer's main US site (e.g., `honda.com`, `bmw.com`, `toyota.com`, `mbusa.com`). Find their "All Vehicles" / "Shop" / "Models" page. List every model currently sold new.

For each model, determine the current model year. **Do not assume all models share a year.** Check each model's page or build-and-price tool. Note the model year.

Output of this step (write to brand JSON as `models[]` with stubs):
```jsonc
{
  "brand": "Honda",
  "brand_slug": "honda",
  "researched_at": "2026-05-15",
  "schema_version": "1.1",
  "models": [
    { "model": "Civic", "model_slug": "civic", "model_year": 2026, "trims": [], "researched_at": null },
    { "model": "Civic Hatchback", "model_slug": "civic-hatchback", "model_year": 2026, "trims": [], "researched_at": null },
    ...
  ]
}
```

Save the file with stubs. Now begin filling in each model.

**Important:** treat performance variants (Civic Si, Civic Type R, BMW M3, AMG variants) as **separate models**, not trims. Use the manufacturer's marketing as the deciding signal — if they have their own model page, they're their own model.

### Step 2: For each model, research and fill in

For each model in the stubs list:

#### 2a. Enumerate trims
Visit the model's spec/feature page on the manufacturer site. List every trim. Include hybrid/EV/AWD variants as separate trims if the manufacturer markets them as separate selectable lines (see §6.4 in master spec).

Identify the **base trim** (lowest MSRP). Mark `is_base_trim: true`. All others get `is_base_trim: false`.

#### 2b. Fill in the base trim FULLY
Every spec block (powertrain, ev_specifics, fuel_economy, performance, dimensions, capacity, wheels_tires, safety, features, warranty, images) populated to the schema. See §3 below for the full schema.

For each spec block, record the URL you got it from in the trim's `sources` map.

#### 2c. Fill in step-up trims with deltas
For each step-up trim:
- Set `is_base_trim: false`
- Populate `delta_from_base` with a 3-8 bullet summary of what changes vs base
- For spec blocks that **change** vs base (e.g., powertrain on a higher trim with bigger engine, features that differ): fill them in
- For spec blocks that are **identical to base**: set the block to `null`. Do not copy values from base.
- Populate `msrp_base`, `destination_fee`, `wheels_tires`, `features`, `images`. These nearly always differ from base.

#### 2d. Fill in model-level review/reliability blocks
- **reliability:** look at JD Power VDS, Consumer Reports predicted reliability. Often `null` for current MY — that's fine, set `confidence: "unknown"` or `"low"` and explain in `summary`.
- **customer_satisfaction:** JD Power APEAL. Often `null`. Same handling.
- **professional_reviews:** find 2-3 recent reviews from Car and Driver, MotorTrend, Edmunds, KBB. Synthesize a 2-3 sentence summary (do not copy from articles). Record URLs.
- **owner_reviews:** Edmunds and KBB owner-review pages. Record star rating, sample size. Summarize common praise and complaints in 1-2 sentences.

#### 2e. Capture images

Find 4+ images per trim family (see §7 in master spec). Required angles: `front_three_quarter`, `rear_three_quarter`, `side_profile`, `interior_dashboard`.

**Critical: the `image.url` field must point to a direct image asset URL, not a page URL.**

A direct image asset URL:
- Ends in an image file extension (`.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`), OR
- Has been verified via HEAD request to return `Content-Type: image/*`

**Why this matters:** during the Honda pilot, Phase 1 stored consumer-site page URLs (like `https://automobiles.honda.com/civic-sedan`) in `image.url`. When the image-download script ran later, those URLs returned HTML, not images. 0/212 downloaded. The fix required a separate HTML-scraping pass to extract real asset URLs from `<img src>` tags. Avoid this by storing asset URLs from the start.

**How to find direct asset URLs:**

1. **Try the manufacturer CDN directly first.** Many brands serve images through CDN paths that don't block as aggressively as their consumer sites:
   - Honda: `cdn.honda.com/-/media/...` or `automobiles.honda.com/-/media/...`
   - BMW: `cdn.bmwusa.com/...` or `media.bmwgroup.com/...`
   - Toyota: `media-prod-toyota.aem.toyota.com/...` or `toyota.com/-/media/...`
   - Mercedes-Benz: `mbusa.com/-/media/...` or `mediaspace.mb.com/...`

2. **Try the brand's press/media site.** These often serve direct JPGs cleanly:
   - `hondanews.com`
   - `press.bmwgroup.com`
   - `pressroom.toyota.com`
   - `media.mbusa.com`

3. **Fetch the manufacturer consumer page HTML and parse it** for `<img src>`, `<picture><source srcset>`, and `og:image` tags. Extract the asset URLs from those. Verify each extracted URL is reachable and returns `image/*`.

If after trying all three you can only find a page URL for a given trim, **store the page URL in `image.url`** AND **add a flag `"needs_scraping": true`** to the image entry. The build phase will handle these in a follow-up scrape, but try to minimize this.

For now: just record image URLs + intended `local_path`. **Do not download images.** Downloading happens in a later pass. Set `local_path` to where the image *would* go if downloaded, following the convention `images/<brand>/<model_slug>/<trim_family>/<angle>.jpg`.

If a trim's images are shared with another trim in the same family, set `is_shared_with_trim_family: true` and note in trim `notes`.

#### 2f. Compute msrp_range for the model
After all trims are filled in: `msrp_range.low` = minimum trim `msrp_base`, `msrp_range.high` = maximum.

#### 2g. Set researched_at on the model
Use today's ISO date.

#### 2g.5. Pre-save self-check (REQUIRED)

Before saving the model: run this self-check.

- For every URL in this model's `sources` maps and `professional_reviews.links`: confirm the domain is NOT in the forbidden list (see "Forbidden sources" section near the top of this file, and §4 below).
- For every trim where `is_base_trim: true`: confirm `delta_from_base: null`.
- For every trim assigned to a `trim_family` slug that no other trim in this model uses: confirm `is_base_trim: true` and that the trim has all 4 required image angles in its own `images` array.
- For every EV trim: confirm `sources.fuel_economy` points to fueleconomy.gov.
- For every fueleconomy.gov URL: confirm it was actually opened during research (per the URL-verification rule in §4).

If any self-check fails, fix before saving.

#### 2h. Save the JSON file to disk
Overwrite `data/<brand_slug>.json` with the updated state.

#### 2i. Update STATUS.md
At project root. Mark the brand as `in progress` with last-updated date.

---

## Image source rules (strict)

**Allowed sources for image URLs:**
- Manufacturer CDN domains (`cdn.<brand>.com`, `media.<brand>.com`, `*.aem.<brand>.com`, etc.)
- Manufacturer press/media sites (`press.<brand>.com`, `<brand>news.com` when operated by the brand, `pressroom.<brand>.com`, `media.<brand>.com`, etc.)
- Manufacturer consumer sites (only when image asset URLs can be extracted from page HTML and verified as image content-type)
- OEM-affiliated dealer information portals (e.g., `<brand>infocenter.com`)

**Forbidden sources for image URLs:**
- Wikimedia Commons, Wikipedia
- Edmunds, KBB, Cars.com, Autotrader, MotorTrend, Car and Driver, Cars.com galleries (use these for SPEC data and reviews, but NOT for images — coverage is inconsistent and licensing is unclear)
- User-uploaded forum images (Reddit, enthusiast forums)
- Generic stock photo sites
- Any source that doesn't visibly authenticate the photo as the current model year of the current US-market vehicle

**Why this rule exists:** during Honda image-coverage work, an attempt to extend coverage by adding Wikimedia Commons as a source pulled an old UK-market sedan (with a 1990s British license plate) and labeled it as a 2026 Civic Hatchback. Search-result relevance does not equal image accuracy. The site renders gracefully with missing images (placeholder shown), so it's better to have fewer correct images than more wrong ones.

If a trim has zero images findable from allowed sources, leave the `images` array empty for that trim and note the gap in the trim's `notes` field. The build phase will display "image unavailable" placeholders, which is acceptable per the master spec.

---

### Step 3: After all models are done

Set the brand-level `researched_at` to today's date. Save.

Update STATUS.md: brand `Research` column = `done`.

Output a brief summary message: number of models researched, total trims, count of nulls/low-confidence fields, anything notable.

---

## Schema (condensed reference)

Top level:
```jsonc
{
  "brand": "<Brand Name>",
  "brand_slug": "<lowercase-hyphenated>",
  "researched_at": "YYYY-MM-DD",
  "schema_version": "1.1",
  "models": [ ... ]
}
```

Model object — required keys:
```jsonc
{
  "model": "<display name>",
  "model_slug": "<lowercase-hyphenated>",
  "model_year": 2026,
  "body_style": "<from taxonomy below>",
  "generation_context": "<one line: e.g., '11th-gen, introduced 2023'>",
  "msrp_range": { "low": <int>, "high": <int> },
  "model_summary": "<1-3 sentences, plain prose, no marketing speak>",
  "reliability": { ... see model-level blocks below ... },
  "customer_satisfaction": { ... },
  "professional_reviews": { ... },
  "owner_reviews": { ... },
  "trims": [ ... ],
  "researched_at": "YYYY-MM-DD",
  "notes": "<prose: image sharing, data gaps, anomalies>"
}
```

Trim object — required keys:
```jsonc
{
  "trim": "<display name>",
  "trim_slug": "<lowercase-hyphenated>",
  "trim_family": "<slug for image-sharing group>",
  "is_base_trim": true|false,
  "msrp_base": <int USD>,
  "destination_fee": <int USD>,
  "msrp_as_equipped_estimate": null,
  "powertrain": { ... },
  "ev_specifics": null | { ... },
  "fuel_economy": { ... },
  "performance": { ... },
  "dimensions": { ... },
  "capacity": { "seats": <int>, "rows": <int> },
  "wheels_tires": { "wheel_size_in": <num>, "tire_spec": "<string>" },
  "safety": { ... },
  "features": { ... },
  "warranty": { ... },
  "images": [ ... ],
  "sources": { ... },
  "delta_from_base": null | { ... },
  "notes": ""
}
```

For step-up trims, any spec block can be `null` if unchanged from base — do not copy values.

### Spec blocks

**powertrain:**
```jsonc
{
  "type": "ice"|"hybrid"|"phev"|"ev"|"fcev",
  "engine_displacement_l": <num>|null,
  "engine_config": "I3"|"I4"|"I5"|"I6"|"V6"|"V8"|"V10"|"V12"|"flat-4"|"flat-6"|"rotary"|"none",
  "aspiration": "naturally_aspirated"|"turbocharged"|"twin_turbocharged"|"supercharged"|"electric",
  "horsepower_hp": <int>,
  "horsepower_source": "manufacturer-engine"|"manufacturer-combined",
  "torque_lb_ft": <int>,
  "transmission": "<free text e.g. '10-speed automatic'>",
  "transmission_speeds": <int>|null,
  "drivetrain": "FWD"|"RWD"|"AWD"|"4WD"|"AWD-electric"
}
```

**ev_specifics** (null for pure ICE; populated for hybrid/PHEV/EV/FCEV):
```jsonc
{
  "battery_capacity_kwh": <num>|null,
  "battery_usable_kwh": <num>|null,
  "electric_range_mi": <int>|null,
  "total_range_mi": <int>|null,
  "dc_fast_charge_peak_kw": <num>|null,
  "dc_fast_charge_10_to_80_min": <int>|null,
  "ac_charge_kw": <num>|null,
  "mpge_combined": <int>|null,
  "plug_type": "NACS"|"CCS1"|"Tesla NACS native"|null
}
```

**fuel_economy:**
```jsonc
{
  "city_mpg": <int>|null,
  "highway_mpg": <int>|null,
  "combined_mpg": <int>|null,
  "fuel_tank_gal": <num>|null,
  "fuel_type_required": "regular"|"premium"|"diesel"|"electricity"|"hydrogen"|"flex_e85",
  "epa_annual_fuel_cost_usd": <int>|null
}
```

**EV/PHEV MPGe handling.** For EV trims, populate `city_mpg`/`highway_mpg`/`combined_mpg` with the EPA MPGe values from fueleconomy.gov (the same MPGe figures that also go into `ev_specifics.mpge_combined` — they are intentionally mirrored). Do NOT leave these fields null for EVs. For PHEV trims, put the charge-sustaining MPG (gasoline mode) into `city_mpg`/`highway_mpg`/`combined_mpg`, and the charge-depleting MPGe into `ev_specifics.mpge_combined`. `fuel_tank_gal` is null for EVs; `fuel_type_required` is `"electricity"` for EVs.

**performance:**
```jsonc
{
  "zero_to_60_sec": <num>|null,
  "zero_to_60_source": "manufacturer"|"car_and_driver"|"motortrend"|"edmunds"|"estimated",
  "top_speed_mph": <int>|null,
  "towing_capacity_lb": <int>|null,
  "payload_capacity_lb": <int>|null
}
```

**dimensions:**
```jsonc
{
  "length_in": <num>,
  "width_in": <num>,  // excluding mirrors
  "height_in": <num>,
  "wheelbase_in": <num>,
  "ground_clearance_in": <num>,
  "curb_weight_lb": <int>,
  "cargo_volume_cuft": {
    "behind_3rd_row": <num>|null,  // 3-row SUVs only
    "behind_2nd_row": <num>|null,
    "behind_1st_row": <num>|null,
    "max_with_seats_folded": <num>|null,
    "trunk_cuft": <num>|null
  }
}
```

For sedans/coupes: only `trunk_cuft` populated; all SUV cargo fields `null`.
For 2-row SUVs/wagons/hatches: `behind_2nd_row` and `behind_1st_row` populated; `behind_3rd_row` and `trunk_cuft` `null`.
For 3-row SUVs: `behind_3rd_row` (cargo with all 3 rows up, typically the smallest number), `behind_2nd_row` (3rd row folded), AND `behind_1st_row` (= max) all populated; `trunk_cuft` `null`.
For trucks: add `bed_length_in` and `bed_volume_cuft` keys; set `trunk_cuft: null`.

**safety:**
```jsonc
{
  "nhtsa_overall_rating": <1-5>|null,
  "nhtsa_rating_year": <year>|null,
  "iihs_top_safety_pick": "TSP"|"TSP+"|null,
  "iihs_rating_year": <year>|null,
  "standard_adas": {
    "automatic_emergency_braking": <bool>,
    "lane_keeping_assist": <bool>,
    "lane_departure_warning": <bool>,
    "adaptive_cruise_control": <bool>,
    "blind_spot_monitoring": <bool>,
    "rear_cross_traffic_alert": <bool>,
    "rear_automatic_braking": <bool>,
    "driver_attention_monitoring": <bool>
  }
}
```

ADAS booleans = standard equipment on THIS trim. If optional, set `false` and note in trim `notes`.

**features:**
```jsonc
{
  "infotainment_screen_in": <num>|null,
  "driver_display_in": <num>|null,
  "apple_carplay": "wired"|"wireless"|"none",
  "android_auto": "wired"|"wireless"|"none",
  "sound_system": "<free text e.g. 'Bose 12-speaker'>"|null,
  "sunroof": "none"|"standard"|"panoramic",
  "seat_material": "cloth"|"synthetic_leather"|"leather"|"nappa_leather"|"alcantara_mix"|"performance_cloth",
  "heated_seats_front": <bool>,
  "ventilated_seats_front": <bool>,
  "heated_steering_wheel": <bool>,
  "power_seats_driver": <bool>,
  "memory_seats_driver": <bool>,
  "wireless_phone_charging": <bool>,
  "head_up_display": <bool>,
  "remote_start": <bool>,
  "notable_other": ["<free text>"]
}
```

**warranty:**
```jsonc
{
  "basic_yr_mi": "<Xyr/Xk>",
  "powertrain_yr_mi": "<Xyr/Xk>",
  "corrosion_yr_mi": "<Xyr/<Xk or 'unlimited'>>",
  "roadside_yr_mi": "<Xyr/Xk>",
  "ev_battery_yr_mi": "<Xyr/Xk>"|null,
  "complimentary_maintenance_yr_mi": "<Xyr/Xk>"|null
}
```

**images** (array):
```jsonc
[
  {
    "angle": "front_three_quarter"|"rear_three_quarter"|"side_profile"|"interior_dashboard"|"interior_rear_seats"|"cargo_area"|"wheel_detail"|"engine_bay"|"exterior_color_options_grid",
    "url": "<direct image asset URL — ends in image extension OR verified image/* content-type>",
    "local_path": "images/<brand_slug>/<model_slug>/<trim_family>/<angle>.jpg",
    "credit": "<source credit string>",
    "is_shared_with_trim_family": <bool>,
    "needs_scraping": <bool>  // optional; true only when url is a page URL that needs follow-up scraping
  }
]
```

**sources** (map of field path to URL):
```jsonc
{
  "msrp_base": "<url>",
  "powertrain": "<url>",
  "fuel_economy": "<url>",
  "performance.zero_to_60_sec": "<url>",
  "dimensions": "<url>",
  "safety.nhtsa_overall_rating": "<url>",
  "safety.iihs_top_safety_pick": "<url>",
  "features": "<url>",
  "warranty": "<url>"
}
```

**delta_from_base** (null for base trim):
```jsonc
{
  "from_trim_slug": "<base trim slug>",
  "msrp_delta_usd": <int>,
  "changes": ["<bullet 1>", "<bullet 2>", ...]
}
```

3-8 bullets ordered most-impactful to least.

### Model-level blocks

**reliability:**
```jsonc
{
  "jd_power_vds_score": <int>|null,
  "jd_power_vds_year": <year>|null,
  "consumer_reports_predicted_reliability": <1-5>|null,
  "summary": "<1-2 sentences explaining what's known and what's missing>",
  "confidence": "high"|"medium"|"low"|"unknown",
  "sources": ["<url>", ...]
}
```

**customer_satisfaction:**
```jsonc
{
  "jd_power_apeal_score": <int>|null,
  "jd_power_apeal_year": <year>|null,
  "summary": "<1-2 sentences>",
  "confidence": "high"|"medium"|"low"|"unknown",
  "sources": ["<url>", ...]
}
```

**professional_reviews:**
```jsonc
{
  "summary": "<2-3 sentence synthesis in your own words>",
  "links": [
    { "publication": "Car and Driver", "url": "<url>", "date": "YYYY-MM-DD" },
    { "publication": "Edmunds", "url": "<url>", "date": "YYYY-MM-DD" },
    { "publication": "MotorTrend", "url": "<url>", "date": "YYYY-MM-DD" }
  ],
  "confidence": "high"|"medium"|"low"|"unknown"
}
```

**owner_reviews:**
```jsonc
{
  "edmunds_star_rating": <num>|null,
  "edmunds_sample_size": <int>|null,
  "kbb_star_rating": <num>|null,
  "kbb_sample_size": <int>|null,
  "summary": "<1-2 sentences on common praise / complaints>",
  "confidence": "high"|"medium"|"low"|"unknown",
  "sources": ["<url>", ...]
}
```

All four blocks are required keys, even when sparse.

---

## Body style taxonomy (fixed — pick exactly one)

`sedan`, `coupe`, `hatchback`, `wagon`, `convertible`, `suv-compact`, `suv-midsize`, `suv-3row`, `suv-full-size`, `pickup-midsize`, `pickup-full-size`, `minivan`, `sports-car`.

Rules:
- Civic Hatchback → `hatchback`
- Civic Si → same body style as the Civic it's based on (separate model entry)
- Civic Type R → `hatchback`
- BMW X4/X6/X2 coupe-SUVs → `suv-midsize`, note in `model.notes`
- 4-door coupes (BMW Gran Coupe, Mercedes CLS) → `coupe` if marketed as such
- If a model defies all categories, pick closest match and explain in `model.notes`

---

## Source hierarchy

1. **Manufacturer site/press** — trim names, MSRP, dimensions, weights, features, warranty, transmission, drivetrain, hp/torque, towing/payload, images
2. **fueleconomy.gov (EPA)** — MPG, MPGe, electric/total range, fuel cost. Always prefer over manufacturer claims.
3. **nhtsa.gov** — NHTSA ratings (overall, frontal, side, rollover)
4. **iihs.org** — IIHS TSP/TSP+, crashworthiness
5. **JD Power** — VDS, IQS, APEAL (note study year)
6. **Consumer Reports** — predicted reliability (public summary pages only; don't try to bypass paywall)
7. **Edmunds, KBB, Car and Driver, MotorTrend, Cars.com** — cross-check, owner reviews, professional review synthesis. **Spec data only — NOT a source for image URLs (see image source rules above).**

### Forbidden sources for spec data

The Honda pilot found that when the manufacturer consumer site returned 403, research fell back to **dealer blog posts** as primary sources for MSRP, destination fee, horsepower, and dimensions. One such dealer blog quoted a wrong destination fee that ended up in the data. **Do not use these as primary or sole sources for spec values:**

- Individual dealer websites and dealer-operated blogs (e.g., `elcerritohonda.com`, `middletownhonda.com`, `musiccityhonda.com`, `fisherhonda.com`, any `<dealername>honda.com` / `<dealername>bmw.com` / etc.)
- Third-party SEO content farms repackaging press releases (e.g., `carsfrenzy.net`, `carscoops.com` for spec sheets — fine for news context, not for primary spec values)
- Forum posts, Reddit, enthusiast wikis

These are acceptable only as confirmation of a value already sourced from a primary, NEVER as the sole source. A trim's `sources.msrp_base` or `sources.destination_fee` must point to one of: the manufacturer's consumer site, the manufacturer's press site, the manufacturer's investor/communications site, EPA (for fuel_economy), or NHTSA/IIHS (for safety).

### When the manufacturer site returns 403

Honda's `automobiles.honda.com` blocked WebFetch even with realistic User-Agents. Expected to happen with BMW (`bmwusa.com`, `press.bmwgroup.com`), Toyota (`toyota.com`), and Mercedes (`mbusa.com`). Acceptable fallbacks **in this order**:

1. **Manufacturer press/media subdomain** (`hondanews.com`, `press.bmwgroup.com`, `pressroom.toyota.com`, `media.mbusa.com`) — often serves through different infrastructure that doesn't block.
2. **Manufacturer-published PDFs** — brochures, spec sheets, pricing announcements often linked from the press site.
3. **Reputable automotive press** (Car and Driver, MotorTrend, Edmunds, KBB, Cars.com) **for cross-check only**, never as sole MSRP source.
4. **EPA fueleconomy.gov** for fuel economy regardless of whether the manufacturer site loaded.
5. **NHTSA, IIHS** for safety regardless.

If a spec value can only be sourced from non-manufacturer sites, set `confidence: "low"` on its block (where applicable) and add a note in trim `notes` explaining the gap.

### EV fuel_economy source rule

For any trim with `powertrain.type == "ev"` or `"phev"`: the `sources.fuel_economy` URL MUST point to a `fueleconomy.gov` page for that specific MY/model/trim. The EPA is the only authoritative source for MPGe and EPA-rated electric range. Do not omit this source entry.

### fueleconomy.gov URL verification (CRITICAL)

Before recording ANY `fueleconomy.gov` URL in a trim's `sources.fuel_economy`, you MUST open the URL and confirm the page shows the exact brand, model, model year, and trim you intend to cite. fueleconomy.gov uses sequential numeric IDs (`?id=49100`, `?id=49101`, etc.) where consecutive IDs often belong to entirely different makes and models. **Never copy an ID from a neighboring trim. Never invent an ID by pattern-matching. Never reuse the same ID across multiple trims unless you have verified each trim individually maps to that ID.**

If you cannot find a specific fueleconomy.gov entry for a trim (common for newly-released MY trims that EPA hasn't published yet, especially AMG/M/SRT/specialty PHEV variants), do this instead:
- Set `sources.fuel_economy` to the brand's model-browse page (e.g., `https://www.fueleconomy.gov/feg/bymodel/2026_Mercedes-Benz.shtml`)
- Add a note in the trim's `notes` field: `"fueleconomy.gov has not yet published a specific 2026 entry for this trim as of <date>; source set to model browse page until EPA publishes."`
- Leave the numeric `fuel_economy.city_mpg/highway_mpg/combined_mpg` values either null OR sourced from the manufacturer (with confidence: low and a note explaining the gap)

This rule exists because Mercedes-Benz Phase 1 research cited 18 trims with fueleconomy.gov IDs that resolved to entirely different vehicles (Lexus RZ, Porsche Taycan, Audi SQ5). The MPG values themselves happened to be plausible, but the citations were unverifiable, which is a worse failure mode than admitting EPA hasn't published.

### 4.6 MSRP for ultra-luxury brands with manufacturer non-disclosure

For ultra-luxury and exotic brands where:
- Manufacturer does not publish US MSRP on consumer or accessible press sites, AND
- This non-disclosure is documented in the relevant trim's notes field

THE FOLLOWING SOURCES ARE PERMITTED for msrp_base, with confidence: medium and source URL recorded:

- **Reputable automotive press editorial pages**: Car and Driver, MotorTrend, Road & Track, Automobile, Hagerty (editorial sections only). These publications maintain editorial standards for pricing reporting and typically receive pricing through manufacturer press communications even when not in formal press releases.
- **Allowed specifically**: caranddriver.com/<make>/<model>/specs or .../<make>/<model>/<year> pages where MSRP is explicitly stated; motortrend.com/cars/<make>/<model>/<year> spec pages; roadandtrack.com editorial pricing reports.
- **Forbidden even under this relaxation**: retail-price tools (KBB, Edmunds inventory pages, cars.com listings, Autotrader), dealer sites, content farms (Carbuzz, AutoEvolution, Motor1, Autoblog), forums, Wikipedia.

The trim's sources.msrp_base must point to the editorial page URL. The trim's notes must mention the source class (e.g., 'MSRP per Car and Driver editorial; manufacturer does not publish US MSRP'). The trim's existing sources_confidence (or equivalent) for the MSRP field is set to medium.

This relaxation applies ONLY to brands where trim.notes documents manufacturer non-disclosure. It is not a general source-policy change.

### Conflict resolution

- Manufacturer vs EPA on MPG → EPA wins. Note manufacturer's claim in trim `notes` if substantially different.
- Manufacturer vs independent test on 0-60 → prefer manufacturer if published; otherwise most recent independent test, or median if multiple within 0.5 sec. Set `zero_to_60_source` accordingly.
- Two secondary sources disagree on something manufacturer doesn't publish → take the more recent; note disagreement in trim `notes`.
- Reliability sources disagree → record what each says rather than picking one.

---

## Honesty rules

- Never fabricate. `null` + `notes` is correct when data isn't findable.
- Never copy from another trim without verifying for THIS trim. Spec sheets often differ in non-obvious ways.
- Every URL in `sources` must be a URL you actually opened during research.
- Use `confidence` fields honestly. Use `notes` for prose explanation of weak data.
- Image URLs must be verified as actual images, not page URLs (see §2e and image source rules).

---

## Edge cases and how to handle them

- **Ultra-luxury MSRP non-disclosure (expected, not a defect).** Ultra-luxury and exotic brands often do not publish US MSRP on consumer or press sites. Confirmed brands following this pattern: Rolls-Royce, Aston Martin, Ferrari, Lamborghini (partially), Bentley (likely), McLaren (likely). For these brands, setting `msrp_base` and `destination_fee` to null and writing a trim.notes entry like 'Manufacturer does not publish US MSRP on consumer or press sites' is the correct, honest answer. Do not substitute dealer-quoted prices, content-farm estimates, or KBB/Edmunds retail prices — those are forbidden sources per §4. Null with documentation is preferred over fabricated precision.

- **NHTSA/IIHS non-testing of low-volume vehicles.** NHTSA and IIHS do not crash-test most ultra-luxury, exotic, or specialty performance models. Null safety ratings are expected for: any Ferrari, Lamborghini, Rolls-Royce, Aston Martin, Bentley, McLaren, Bugatti model; any AMG/M/RS/SRT/Type R/STI specialty variant where the rating differs from the base model's; and any newly-released model where the rating year is before the model's first sales year. Set `nhtsa_overall_rating` and `iihs_top_safety_pick` to null with the relevant `_rating_year` also null. Do not assume the base model's rating transfers to a specialty variant unless NHTSA/IIHS explicitly says so.

- **JD Power VDS / APEAL low-volume gaps.** JD Power Vehicle Dependability Study (VDS) and Automotive Performance, Execution and Layout (APEAL) studies sample mainstream brands by volume. Low-volume brands routinely don't appear in JD Power data: Rolls-Royce, Aston Martin, Ferrari, Lamborghini, Bentley, McLaren, Bugatti, Lotus, Polestar (often), Lucid (often), Rivian (often). Setting both blocks to `confidence: 'unknown'` with a summary explaining the gap is correct. Consumer Reports may have data for some of these (e.g., Tesla Cybertruck 1/5 predicted reliability) — check before defaulting to unknown.

- **Mid-cycle trim refresh.** If recent news indicates a trim was added/removed mid-MY, include the current state. Mention in `model.notes`.
- **Multiple powertrains within a single model — IMPORTANT.** When one model offers both ICE and hybrid/PHEV/EV trims (e.g., Honda Accord LX/Sport are ICE; Sport Hybrid/EX-L Hybrid/Touring Hybrid are hybrid), each powertrain line has its own base trim. **Mark the lowest-MSRP trim of EACH powertrain line with `is_base_trim: true`.** A single model can — and often must — have multiple base trims.
  - **How to identify powertrain lines:** group all trims of the model by `powertrain.type` (ice / hybrid / phev / ev / fcev). Each group with 1+ trims is a powertrain line. The cheapest trim in each group is that line's base.
  - **`delta_from_base.from_trim_slug` must reference a base trim of the SAME powertrain line.** Hybrid step-ups reference the hybrid base, not the ICE base. ICE step-ups reference the ICE base.
  - **Worked example — Honda Accord (current MY has ICE + Hybrid lines):**
    - LX (ICE, lowest MSRP of ICE line) → `is_base_trim: true`, `delta_from_base: null`
    - SE (ICE) → `is_base_trim: false`, `delta_from_base.from_trim_slug: "lx"`
    - Sport Hybrid (hybrid, lowest MSRP of hybrid line) → `is_base_trim: true`, `delta_from_base: null`
    - EX-L Hybrid → `is_base_trim: false`, `delta_from_base.from_trim_slug: "sport-hybrid"`
    - Sport-L Hybrid → `is_base_trim: false`, `delta_from_base.from_trim_slug: "sport-hybrid"`
    - Touring Hybrid → `is_base_trim: false`, `delta_from_base.from_trim_slug: "sport-hybrid"`
  - **PHEV note:** if a model has ICE + PHEV (e.g., a future BMW 330i + 330e), treat PHEV as its own powertrain line with its own base. Same logic.
  - **All-hybrid models:** if every trim of a model shares one powertrain type (e.g., a fully-hybrid Camry, or any EV-only model like the Prologue), there's only one powertrain line and only one base trim — the lowest-MSRP trim overall.
  - **Sole-trim line — IMPORTANT (atomic rule).** When a powertrain line OR a trim_family has exactly one trim, two things must be true ON THE SAME TRIM, simultaneously: `is_base_trim: true` AND `delta_from_base: null`. These are not two separate decisions — they are one atomic action whenever you identify a singleton line/family. Setting one without the other is a schema violation. Example: BMW X3 currently has `30 xDrive` (48V MHEV / ICE per our rules) and `M50 xDrive` (different higher-output engine, treated as its own powertrain line). Both should be `is_base_trim: true` AND `delta_from_base: null`. The M50 is not a step-up of 30 xDrive; they are separate powertrain lines, and the M50 is the sole trim of its line. Same rule applies at the trim_family level: if a `trim_family` has exactly one trim (e.g., BMW M4 Competition xDrive Coupe in family `m4-coupe-xdrive`), that trim is `is_base_trim: true` with `delta_from_base: null` and must carry all 4 required image angles in its own `images` array (no other trim to inherit from). Models whose entire lineup is one trim (BMW XM Label, ALPINA XB7, BMW M5 Touring) are the simplest case: one trim, `is_base_trim: true`, `delta_from_base: null`. **Self-check before saving any model:** for every trim where you set `is_base_trim: true`, confirm `delta_from_base` is null. For every trim where you put it in a `trim_family` by itself, confirm `is_base_trim: true`. These two checks catch the most common sole-trim failure mode.
- **BMW/Mercedes "lines"** (Sport Line, M Sport, Luxury, AMG Line). If the manufacturer's build-and-price treats them as selectable trim variants, they're trims. If they're packages on top of a trim, they're packages — note in trim `notes`.
- **AWD as separate trim** (Toyota Camry XLE AWD). Yes, separate trim. Note that the only delta from XLE is drivetrain and price.
- **Trucks with cab/bed configurations** (crew cab vs double cab, short bed vs long bed). Treat each cab+bed combination available on a trim as a separate trim only if priced differently. Otherwise note in trim `notes`.
- **EV-only sub-brands sold as separate model lines** (Honda Prologue, BMW i4/iX/i5/i7/iX1/iX2/iX3). Just list them as models under the parent brand.
- **Genesis is separate from Hyundai. Lexus is separate from Toyota. Acura is separate from Honda.** Don't include Acura models in a Honda catalog. Each is its own brand for our purposes.
- **Discontinued mid-MY.** If a model was announced but pulled, exclude it. If it's still on dealer lots as outgoing but successor is the primary current offering, exclude the outgoing one; document the successor.

---

## Sessions 5-10 findings (image-scrape blocker patterns — flag in trim.notes when researching)

Image scraping (Phase 4) repeatedly found that **most brands have 1-2 single specific blockers**, not generic failures. Research-time awareness of these patterns lets you flag unusual URL conventions in trim or model notes so Phase 4 work has context.

**Common blocker patterns observed in Sessions 5-10:**

- **HTML entity encoding** in JSON-embedded URLs (Kia `&amp;` in `&amp;`-style HTML-encoded JSON URLs). The scraper needs explicit decoding.
- **JSON-embedded URLs** that aren't in `<img src=>` tags but are stringified in `<script>` JSON blobs (multiple brands).
- **Extension-less CDN URLs** that don't end in `.jpg`/`.png`/`.webp` (Lotus, Hyundai). The default `isPlausibleImageURL` heuristic excludes these unless extended for the brand.
- **Chassis-code-named CDN paths** that don't contain the model slug (Land Rover uses internal chassis codes like `L405`, `L460`). The default `slugMatchesURL` heuristic misses these.
- **Specific URL fragments** like `vlp-hero` (Hyundai), `34-jellies` (multiple), `bb-` (Black Badge Rolls-Royce), `HC-D` (Mercedes-Benz). These signal angle (front 3/4, side, etc.) but only when known per-brand.
- **Soft 404 pages** that return 200 but contain no real candidates (Mini, others). The scraper extracts hundreds of candidates from these pages; `slugMatchesURL` filters them out, but they pollute extraction.
- **JS-rendering** of the main marketing page (Mercedes-Benz mbusa.com, others). Playwright fallback is the mitigation (Session 5).
- **S3 buckets requiring Referer** (Toyota — Session 6 added `--with-referer` for the S3 URLs).

**Action during research:** if a brand's manufacturer site uses an unusual URL convention (chassis codes, internal model codes, JSON-embedded URLs), note it in the affected trim's `notes` field so future Phase 4 work knows what to look for. Examples:

- "CDN uses chassis code `L460` for this model instead of slug `range-rover`."
- "Manufacturer page is JS-rendered; static fetch returns shell. Phase 4 must use Playwright fallback."
- "Image URLs are extension-less CDN paths; isPlausibleImageURL must be brand-aware."

This is one-line documentation, not a blocker. Phase 4 picks it up and applies the right script extension or brand-config override.

---

## Save points

- After Step 1 (stub creation): save the brand JSON with stubbed models.
- After each model fully researched: save the brand JSON. Update STATUS.md.
- After all models done: final save. Update STATUS.md to mark `Research: done`.

If you crash or run out of context, the next session can read the existing JSON and skip models that have `researched_at: <date>` set.

---

## Output summary at the end

After completing all models, print a brief summary in the chat:
- Brand researched
- Number of models
- Total trim count
- Models with low-confidence reliability data (list)
- Spec fields most frequently null (top 5 with counts)
- Image entries with `needs_scraping: true` count (so the build phase knows there's follow-up work)
- Anything else notable

This gives a quick QA signal before the verify phase.

---

## Input

Brand: <REPLACE WITH BRAND NAME WHEN PASTING INTO CLAUDE CODE>
