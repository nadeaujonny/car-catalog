# 02 — Build the Catalog Site (Claude Code instructions)

You are working on the Car Catalog Project. This phase builds or updates the unified static HTML site at `catalog/` from one or more `data/<brand>.json` files produced by Phase 1.

**Input:** all existing `data/<brand>.json` files in the project. (No specific brand parameter — the build is whole-site.)

**Output:** `catalog/` directory containing `index.html`, `styles.css`, `app.js`, `manifest.json`, and a `data/` subfolder with copies of brand JSONs.

This file is self-contained. The full canonical spec is `instructions/00_master_spec.md` — consult it if anything is ambiguous about data shape.

---

## Operating principles (read first)

1. **Single unified site, not per-brand sites.** One `index.html` is the entry point. All views (brand pages, body-style cross-brand views, comparison, search) are inside this one app, navigated via URL fragments (`#brand=honda`, `#body=suv-midsize`, etc.).

2. **Static site, no build tools.** Plain HTML, plain CSS, plain JavaScript. No webpack, no Vite, no npm, no frameworks. The user opens `index.html` by double-clicking; it must work from `file://` URLs.

3. **No external network dependencies at runtime.** No CDN-loaded fonts or scripts. No analytics. No external API calls. The site must work fully offline. (Image `url` fields in JSON point to external sources for reference, but the site should attempt to use `local_path` first and fall back to `url` only if local images aren't present.)

4. **Incremental build.** If `catalog/` already exists, update it — don't blow it away. Add new brands' data, update manifest, leave existing HTML/CSS/JS in place unless the layout/code itself needs changes.

5. **Headline view = brand price ladder.** When the user clicks into a brand, the default view is every model in that brand, in ascending price order, on one long-scroll page. This is THE feature. Everything else is secondary.

6. **Honor `null` values.** Missing data is shown as "—" or "not available" — never as "0" or hidden silently. Low-confidence data is shown with a subtle indicator (e.g., italic text or a small flag).

7. **Save the data files into the catalog folder.** Copy each `data/<brand>.json` into `catalog/data/<brand>.json` so the site can `fetch()` them from a relative path. Build phase is responsible for keeping these in sync.

---

## Workflow

### Step 0: Setup

Check that the project structure has at least one brand JSON in `data/`. If `data/` is empty, abort with a message telling the user to run Phase 1 first.

If `catalog/` doesn't exist, create it with the structure:
```
catalog/
├── index.html
├── styles.css
├── app.js
├── manifest.json
└── data/
```

If `catalog/` exists, you're updating it. Proceed.

### Step 1: Generate `catalog/manifest.json`

Scan `data/*.json` for every brand file. For each, read `brand`, `brand_slug`, `researched_at`, and `models.length`. Build the manifest:

```jsonc
{
  "schema_version": "1.0",
  "generated_at": "<ISO 8601 timestamp now>",
  "brands": [
    { "slug": "honda", "display_name": "Honda", "researched_at": "2026-05-15", "model_count": 13 },
    { "slug": "bmw", "display_name": "BMW", "researched_at": "2026-05-22", "model_count": 22 }
  ]
}
```

Sort brands alphabetically by `display_name`.

### Step 2: Copy brand JSONs into `catalog/data/`

Copy every `data/<brand>.json` into `catalog/data/<brand>.json`. Overwrite existing copies. The site loads from `catalog/data/` so the catalog folder is self-contained for serving/sharing.

### Step 3: Generate/update `index.html`

The HTML is a single-page app shell. It contains:
- Top nav with: brand picker, body-style picker, compare link, search
- A `<main>` element that JavaScript populates based on the URL fragment
- Footer with build date and "Open data file" link per brand

Use semantic HTML5. Use the structure from §UI below.

### Step 4: Generate/update `styles.css`

Use clean, modern CSS. Mobile-friendly. Dark mode optional (use CSS custom properties so it's easy to add). See §Visual design below for the actual style direction.

### Step 5: Generate/update `app.js`

Plain vanilla JavaScript (ES2020+). No frameworks. The app:
- Reads `manifest.json` on load to know what brands exist
- Routes based on URL fragment (`#brand=honda`, `#body=suv-midsize`, etc.)
- Fetches brand JSONs on demand
- Renders the appropriate view
- Handles sort/filter/search interactions

See §App behavior below for the actual logic.

### Step 6: Update STATUS.md

For each brand present in `catalog/data/`, set the `Built into site` column to `yes` with today's date.

### Step 7: Print a summary

Briefly report:
- Brands now in the site (count and names)
- Total models, total trims across all brands
- Whether this was a fresh build or an update
- Any data anomalies noticed (e.g., a brand with `model_count: 0`)

---

## UI — site structure and views

### Layout

The page has three regions:
- **Top nav** — brand/body-style picker, compare link, search box. Sticky to top of viewport.
- **Side nav** (only on brand and body-style views) — list of all models in the current view, click to jump. Sticky to left of viewport. Highlights the model the user is currently scrolled to.
- **Main content** — the active view (long-scroll list of models, comparison panel, etc.)

On narrow viewports (under ~900px), side nav collapses to a hamburger or top-of-page list.

### Views

The app has four views, switched by URL fragment:

**1. Home (`#` or empty fragment)**

Landing page when `index.html` opens with no fragment.

- Site title and short description
- "Browse by brand" — grid of brand cards (one per brand in manifest), each clickable
- "Browse by body style" — grid of body-style cards (sedan, SUV, etc.)
- "Compare" — link to compare view
- Build date at bottom

**2. Brand view (`#brand=<slug>`)**

The headline view. Long-scroll, all models of one brand.

- Brand header at top: brand name, count of models, MSRP range across all models, brief stats (e.g., "13 models, $24k–$55k, 4 hybrid offerings, 1 EV")
- Sort/filter bar (sticky, just below top nav):
  - Sort: Price ↑ (default), Price ↓, Horsepower ↑/↓, Combined MPG ↑/↓, 0-60 ↑/↓
  - Filter: Body style (multi-select chips), Powertrain (multi-select: ICE, hybrid, PHEV, EV)
  - Toggle: Group by body style (off by default; on = sections per body style, models within each sorted by current sort)
- Side nav: list of all models in current sort/filter state. Click → smooth-scroll to that model. Highlights current model on scroll.
- Main: each model as a section, in current sort order. See §Model section below.

**3. Body-style view (`#body=<style-slug>`)**

Cross-brand view of one body style.

- Header: "All <body-style> across <brand count> brands" (e.g., "All midsize SUVs across 4 brands")
- Same sort/filter bar as brand view, minus the body-style filter (since this view IS already filtered to one body style)
- Side nav: list of all matching models from all brands, in current sort
- Main: each model as a section, in current sort order. Each model section additionally shows the brand prominently at the top.

**4. Compare view (`#compare=<slug1>,<slug2>[,<slug3>]`)**

Side-by-side spec comparison of 2–3 models (or specific trims). Model picker at top with two/three dropdowns. Below, a table with rows = specs, columns = picked models/trims. Highlight differences. Allow picking specific trims of a model (default to base trim).

### Model section (used in brand and body-style views)

Each model is one section in the long scroll. Structure:

- **Header row:** Brand (if in body-style view) · Model name · Price range (e.g., "$28,295 – $39,850") · Body style badge · Generation context (small italic text below name)
- **Hero image:** large `front_three_quarter` image of the base trim. Falls back to any image if base trim has none.
- **Quick stats row:** base trim hp, combined MPG, 0-60, drivetrain, seats. Five numbers in a row, big.
- **Brand-position indicator** (brand view only): "2nd cheapest model in Honda's lineup" or "Most powerful Honda"
- **Collapsible spec sections** — collapsed by default:
  - Powertrain (full base trim block + a "Trim variations" subsection showing trim-by-trim differences in powertrain if any)
  - Performance
  - Dimensions
  - Capacity & wheels
  - Safety (NHTSA, IIHS, standard ADAS as a list)
  - Features (the curated list from spec — render as a 2-column grid)
  - Warranty
- **Trim table** (always visible, not collapsed): rows = trims, columns = trim name, MSRP (base + destination), key delta bullets. Base trim shows "Base configuration"; step-ups show the `delta_from_base.changes` bullets.
- **Image gallery:** 4+ thumbnails (front 3/4, rear 3/4, side, interior), clickable to enlarge in a modal. Show one set per `trim_family`.
- **Reviews block:** small panel with:
  - Reliability summary + score if available, with confidence indicator
  - Customer satisfaction summary + score if available
  - Professional reviews: synthesis paragraph + links to 2-3 full reviews
  - Owner reviews: aggregate stars + sample size + summary
- **Divider** between model sections

### Search

Top nav has a search box. As the user types:
- Search across model names, trim names, brand names
- Show dropdown of matches, click to navigate to that model
- Press Enter without selecting → if 1 match, go to it; if multiple, show a results page

---

## Visual design

Aim for **clean, dense-but-readable, enthusiast-magazine feel.** Think Car and Driver's site, MotorTrend's better pages, automotive industry data sites — informational, well-organized, lets the data speak.

### Color palette

Use CSS custom properties so palette is swappable:

```css
:root {
  --bg: #fafafa;
  --bg-alt: #f0f0f0;
  --text: #1a1a1a;
  --text-muted: #666;
  --accent: #c10000;      /* deep red for headers, links, highlights */
  --border: #d4d4d4;
  --confidence-low: #b87333; /* subtle bronze for low-confidence data */
  --null-text: #999;
}
```

Dark mode optional via `@media (prefers-color-scheme: dark)` overrides.

### Typography

- Headings: a clean sans-serif. System fonts only — `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. No web fonts (offline rule).
- Body: same family. 16px base, 1.5 line-height.
- Spec numbers: tabular figures (`font-variant-numeric: tabular-nums`) so numbers align in tables.
- Italic for low-confidence data; gray (`var(--null-text)`) for nulls displayed as `—`.

### Layout

- Max content width: ~1200px, centered.
- Side nav width: ~220px (fixed on viewport, scrolls independently if its content overflows).
- Model section width: full content width minus side nav.
- Spec tables: use real `<table>` with proper headers. Striped rows.
- Trim table: each row a trim, columns variable based on context.
- Image gallery: 4-up grid that becomes 2-up on narrow viewports.

### Interactive bits

- Collapsible sections: native `<details>` and `<summary>` elements (zero JS needed, accessible by default).
- Image modal: vanilla JS, opens on thumbnail click, ESC to close.
- Sort/filter changes: re-render main content without page reload; update URL fragment.
- Smooth-scroll for side-nav clicks (`scroll-behavior: smooth`).

### Accessibility

- Semantic HTML5 (`<nav>`, `<main>`, `<section>`, `<article>`).
- All images have `alt` text (use `<angle>` + model name + trim).
- Color is never the only signal — use text + color for confidence indicators.
- Keyboard navigation works for everything.

---

## App behavior — `app.js` logic

The script is procedural and small. No state-management library. Module structure (single file, organized in sections):

### Initialization

On page load:
1. Fetch `manifest.json`.
2. Parse URL fragment to determine current view.
3. Render top nav (populate brand list from manifest).
4. Route to the appropriate view-rendering function.

### Routing

URL fragment formats:
- `` (empty) → home
- `#brand=honda` → brand view
- `#brand=honda&sort=price-asc&group=body` → brand view with sort/group state
- `#body=suv-midsize` → body-style view
- `#body=suv-midsize&sort=price-asc` → body-style view with sort
- `#compare=honda:accord,toyota:camry` → compare view (model granularity)
- `#compare=honda:accord:ex-l,toyota:camry:xle` → compare view (trim granularity)
- `#model=honda:accord` → optional deep link to a specific model on the brand page (smooth-scrolls there after brand view loads)

Listen to `hashchange` events to re-render when URL changes.

### Data loading

Cache fetched brand JSONs in a module-level object: `{ honda: <parsed>, bmw: <parsed>, ... }`. Don't re-fetch within the same session.

For body-style and compare views, fetch every brand listed in manifest (or only those needed).

### Sorting

Sort functions accept a list of `{ brand, model, trim }` references (the relevant trim being the base trim for sort purposes — or a specific picked trim in compare). Sort by:
- `price-asc` / `price-desc`: by `trim.msrp_base + trim.destination_fee`
- `hp-asc` / `hp-desc`: by `trim.powertrain.horsepower_hp`
- `mpg-asc` / `mpg-desc`: by `trim.fuel_economy.combined_mpg` (treating nulls as Infinity for asc, -Infinity for desc — so they sort to the end)
- `0-60-asc` / `0-60-desc`: by `trim.performance.zero_to_60_sec`

Always sort `null` values to the end.

### Filtering

Filter functions accept the same list, return filtered subset:
- Body style: keep models whose `body_style` matches selected styles
- Powertrain: keep models that have any trim with `powertrain.type` matching selected types

### Rendering helpers

A small set of helpers:
- `formatPrice(n)` → `"$28,295"` or `"—"` if null
- `formatMpg(c, h, comb)` → `"51/44/48 mpg"` or `"—"` if missing
- `formatHp(n, src)` → `"204 hp"` or `"204 hp (combined)"` for hybrids
- `confidenceBadge(level)` → small inline element, only shown if level is `low` or `unknown`
- `imageWithFallback(image)` → `<img>` element trying `local_path` first, then `url`

---

## Cross-brand views (multi-brand site behavior)

When the site contains 2+ brands, the body-style view, compare view, and search should automatically include all of them. No special build step — the views read from `manifest.json` to know what's available.

When only one brand is present (e.g., during the Honda pilot), the body-style view should still work — it'll just show one brand's offerings of that body style. The compare view should still work — you can compare trims within Honda. The home page should show "1 brand cataloged" honestly.

---

## Incremental updates

When this phase runs and `catalog/` already exists:

1. Re-generate `catalog/manifest.json` from current `data/`.
2. Copy/overwrite all brand JSONs into `catalog/data/`.
3. Compare existing `index.html`, `styles.css`, `app.js` against what would be generated. If they're substantively the same (same generated content), leave them. If the build logic has changed, overwrite them.
4. Don't delete brand JSONs in `catalog/data/` unless they no longer exist in `data/` — but warn the user before deleting.

If the user has manually edited any catalog file, preserve those changes if reasonable, or back up the existing file to `<filename>.backup` before overwriting.

---

## Honesty rules in the rendered output

- A `null` field shows as `"—"` in gray.
- Low-confidence data is rendered in italic with a small "low confidence" badge on hover.
- The `professional_reviews` and `owner_reviews` blocks render exactly the summary text from JSON — don't embellish.
- The `notes` field on model and trim, if non-empty, renders as a small "Research notes" callout below the trim table.
- Every model section has a small "Data sources" link in its footer that, when clicked, opens a modal listing all source URLs used for that model (collected from each trim's `sources` map, deduplicated).

---

## Out of scope for Phase 2

Things this phase explicitly DOES NOT do:
- Download images. The site uses image URLs from the JSON. If `local_path` exists on disk it's preferred, but Phase 2 doesn't fetch images. A separate utility script can do that later.
- Validate the JSON against the schema. Phase 3 handles verification.
- Touch `data/` (the source). Only writes to `catalog/`.
- Network requests at runtime in the live site (beyond loading local data files).

---

## Failure modes and what to do

- **Brand JSON has invalid structure** (missing required keys, wrong types): log a warning, skip that brand in the manifest, continue. Don't crash the build.
- **Image URL is malformed**: render placeholder ("image unavailable") at runtime. Don't fail the build.
- **No brands in `data/`**: abort with clear message: "No brand data found. Run Phase 1 first."
- **`catalog/` is locked / unwritable**: abort with file system error message.

---

## Save points

- After Step 1 (manifest written): save and continue.
- After each generated file (`index.html`, `styles.css`, `app.js`): file is saved to disk before moving on.
- After Step 6 (STATUS.md updated): save.

---

## Output summary at the end

Print to the chat:
- Brands now in site: list with model counts
- Files generated/updated: list with sizes
- Confirmation that `catalog/index.html` exists
- Path to open: e.g., `start C:\Users\<you>\car-catalogs\catalog\index.html`
- Any warnings or anomalies

---

## Input

No parameter needed — this phase builds from all `data/*.json` files present.
