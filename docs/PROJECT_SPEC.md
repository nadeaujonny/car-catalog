# Original Project Specification (preserved)

> **Note:** This is the project's original specification document, written before any code was committed. It defines what the project set out to be — the goal, scope, workflow, and constraints — in the project owner's voice as planning notes. It is preserved here unchanged for historical reference. For the current portfolio-facing overview, see the project [README](../README.md). For the engineering narrative, see [PROCESS.md](./PROCESS.md). The same content also lives at `instructions/README.md`, which is where the per-phase Claude Code workflow continues to reference it.
>
> Dataset and code state described below has since evolved through 16 chained sessions; consult `PROJECT_STATE.md` and the `SESSION_SUMMARY_*.md` files for the cumulative history.

---

# Car Catalog Project

A personal project to build a single self-contained HTML site that catalogs every current-model-year vehicle from chosen car brands sold new in the US. Built for car enthusiasts (one user: me) who want to browse and learn brand lineups, not for car shoppers.

The site is offline-first, JSON-backed, organized brand-by-brand with cross-brand views available. Priority: see every model in a brand sorted by ascending price, with full specs and 4+ real photos per trim family.

This is for personal use, not publication.

---

## Project goal

Produce a single static HTML site at `catalog/index.html` that:

- Covers every current-model-year vehicle from selected brands sold new in the US
- For each brand, presents all models on one long-scroll page in ascending price order (the headline view)
- For each model, captures full specs for the base trim plus a delta table showing what each step-up trim changes
- Includes reliability/satisfaction scores, professional review summaries, and owner review aggregates at the model level (sparser/clearly labeled when data is unavailable)
- Includes at least 4 real photos per trim family: front 3/4, rear 3/4, side profile, interior dashboard
- Is browsable entirely offline — no server needed, just open the HTML file
- Supports sortable, filterable views: by brand, by body style across all brands, by any spec
- Supports model-vs-model comparison across any brands
- Cites the source for every spec field; flags low-confidence or missing data honestly

Priority brands: Honda (pilot), then BMW, Toyota, Mercedes-Benz. Additional brands can be added later using the same workflow.

---

## Folder structure

```
car-catalogs/
├── instructions/
│   ├── README.md                  (this file)
│   ├── 00_master_spec.md          (data schema, sources, rules)
│   ├── 01_research_brand.md       (Claude Code: research one brand)
│   ├── 02_build_catalog.md        (Claude Code: build/update the unified site)
│   └── 03_verify_catalog.md       (Claude Code: QA pass)
├── data/                          (one JSON per brand)
│   ├── honda.json
│   ├── bmw.json
│   └── ...
├── images/                        (one folder per brand/model/trim-family)
│   └── <brand>/<model>/<trim_family>/
└── catalog/                       (single unified site)
    ├── index.html
    ├── styles.css
    ├── app.js
    ├── manifest.json              (lists which brands are available)
    └── data/                      (copies of brand JSONs the site loads)
        ├── honda.json
        └── ...
```

Claude Code will create folders as needed. You only need `instructions/` to exist before the first run.

---

## Workflow

Three Claude Code phases per brand, plus a one-time-ish site build/update step. Each phase has its own instruction file you paste into a fresh Claude Code session.

### Phase 1: Research a brand
**Instruction file:** `01_research_brand.md`
**Input:** a brand name
**Output:** `data/<brand>.json` containing every current model, every trim
**What Claude Code does:** web-searches manufacturer site, EPA, NHTSA, IIHS, JD Power, Consumer Reports, Edmunds, etc., per the source hierarchy in `00_master_spec.md`. Works one model at a time. Saves progress after each model so a session crash doesn't lose work. Cites source per field. Marks unknowns honestly.

### Phase 2: Build or update the unified site
**Instruction file:** `02_build_catalog.md`
**Input:** all current `data/<brand>.json` files
**Output:** `catalog/` directory with `index.html` and assets
**What Claude Code does:** builds the unified HTML/CSS/JS site if it doesn't exist; if it does, updates it to include any new or changed brand data. Generates the brand pages (long-scroll, price-ascending), cross-brand body-style views, comparison view, and search. No backend, no build tools — just plain HTML/CSS/JS that loads the JSON files at runtime.

### Phase 3: Verify a brand's data
**Instruction file:** `03_verify_catalog.md`
**Input:** a brand name (and its `data/<brand>.json`)
**Output:** `reports/<brand>_verification.md` flagging issues
**What Claude Code does:** spot-checks random trims against manufacturer sites, confirms image URLs resolve, flags any spec with only one source or with `confidence: low`, flags missing fields, flags conflicts between sources.

---

## How to run a phase

Each instruction file is self-contained. You paste its full contents into a fresh Claude Code session and add the input parameter (a brand name).

Example for Phase 1, Honda:

1. Open Windows Terminal in the project folder: `cd C:\Users\<you>\car-catalogs`
2. Start Claude Code: `claude`
3. Open `instructions/01_research_brand.md` in any editor, copy its contents
4. Paste into Claude Code, add a line at the bottom: `Brand: Honda`
5. Send. Claude Code will work, saving progress to `data/honda.json` after each model.

The instruction files reference `00_master_spec.md` but include condensed inline summaries of what they need from it, so you don't have to paste the spec doc alongside them. The full spec is the source of truth if anything is ambiguous.

---

## Setup (Windows)

Assumes Claude Code is already installed.

**Project folder.** Create it:

```
mkdir C:\Users\<you>\car-catalogs
cd C:\Users\<you>\car-catalogs
mkdir instructions
```

Or use File Explorer. Other folders (`data/`, `images/`, `catalog/`) will be created by Claude Code.

**Place instruction files.** Save all five `.md` files into `car-catalogs\instructions\`. Also upload them to the Claude.ai Project so they can be iterated on in chat.

**Open in VS Code (optional but recommended).** From the project folder:

```
code .
```

Lets you view data files, edit instructions, and preview the catalog HTML alongside Claude Code's terminal.

**Run Claude Code.** From the project folder:

```
claude
```

Then paste an instruction file's contents to start a phase.

**Open the catalog.** After Phase 2 finishes:

```
start catalog\index.html
```

Or double-click `index.html` in File Explorer. Works in any modern browser, no internet required after the first build.

---

## Iteration and revisions

Instruction files will evolve as the project matures. Workflow for revising one:

1. Discuss the change in the Claude.ai Project chat
2. Get the updated file
3. Save it to both the local `instructions/` folder AND the Claude.ai Project
4. Re-run the relevant phase if needed

`00_master_spec.md` is the contract. If it changes, the research and build instructions may need updates too — flag this when revising the spec.

---

## Scope and limitations

**In scope (v1):**
- Current model year only (the model year currently being sold new at dealers as the primary offering, verified per model)
- US-market vehicles only
- Every model and every trim each brand sells new
- Base trim full specs + trim-delta table for step-up trims (not full spec sheet per individual trim)
- Model-level reliability/satisfaction/review data (not per-trim — those metrics aren't trim-specific)
- One-line generation context per model for historical anchor
- 4+ real photos per trim family (not necessarily per trim variant)

**Out of scope (v1):**
- Historical model years (could be added later as `04_historical_addendum.md`)
- Non-US markets
- Commercial vehicles, motorcycles, powersports
- Used car pricing
- Full per-trim spec sheets (we use delta tables instead — see master spec)
- Every optional package itemized (we capture standard features fully; options summarized)

**Known difficulty areas:**
- Mid-cycle trim additions/refreshes — research instructions handle this by checking manufacturer spec sheets and recent news
- Reliability data is patchy for current MY (JD Power VDS measures 3-year-old cars, etc.) — data will be marked unknown or inferred where unavailable
- Image quality varies — manufacturer press photos preferred; trim-family sharing allowed when individual trim photos don't exist
- BMW and Mercedes have complex trim/line/package systems — first-pass research will likely miss some configurations; verification phase exists to catch these

---

## Data sources (summary; full details in `00_master_spec.md`)

Priority order:

1. **Manufacturer site** — primary source for trim names, pricing, features, dimensions, warranty
2. **fueleconomy.gov (EPA)** — authoritative for MPG/MPGe, range, fuel cost
3. **nhtsa.gov** — crash test ratings (NCAP)
4. **iihs.org** — safety awards
5. **JD Power** — reliability (VDS) and customer satisfaction (APEAL), where available
6. **Consumer Reports** — reliability ratings (publicly available portions only)
7. **Edmunds, KBB, Car and Driver, MotorTrend, Cars.com** — secondary cross-check, owner reviews, professional review synthesis

Every spec field in the JSON records its source. Every model has a `researched_at` date.

---

## Status tracking

Claude Code maintains `STATUS.md` in the project root tracking which brands are at which phase:

```
| Brand          | Research | Built into site | Verified | Last updated  | Notes  |
|----------------|----------|-----------------|----------|---------------|--------|
| Honda          | done     | yes             | done     | 2026-05-15    | pilot  |
| BMW            | done     | yes             | -        | 2026-05-22    |        |
| Toyota         | done     | -               | -        | -             |        |
| Mercedes-Benz  | -        | -               | -        | -             |        |
```
