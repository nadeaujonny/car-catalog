#!/usr/bin/env python3
"""Aggregate Mercedes-Benz partials into data/mercedes-benz.json."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PARTIALS_DIR = ROOT / "data" / "_partials"
OUTPUT = ROOT / "data" / "mercedes-benz.json"

# Order matches the stub created during enumeration. EQB removed (discontinued for 2026 US).
MODEL_ORDER = [
    "cla",
    "c-class",
    "cle-coupe",
    "cle-cabriolet",
    "e-class-sedan",
    "e-class-wagon",
    "s-class",
    "maybach-s-class",
    "amg-gt-coupe",
    "amg-gt-4-door-coupe",
    "sl-roadster",
    "gla-suv",
    "glb-suv",
    "glc-suv",
    "glc-coupe",
    "gle-suv",
    "gle-coupe",
    "gls-suv",
    "maybach-gls",
    "g-class",
    "eqe-sedan",
    "eqe-suv",
    "eqs-sedan",
    "eqs-suv",
    "maybach-eqs-suv",
]

models = []
missing = []
for slug in MODEL_ORDER:
    fp = PARTIALS_DIR / f"mercedes-benz_{slug}.json"
    if not fp.exists():
        missing.append(slug)
        continue
    with fp.open(encoding="utf-8") as fh:
        models.append(json.load(fh))

brand_doc = {
    "brand": "Mercedes-Benz",
    "brand_slug": "mercedes-benz",
    "researched_at": "2026-05-12",
    "schema_version": "1.1",
    "models": models,
}

with OUTPUT.open("w", encoding="utf-8") as fh:
    json.dump(brand_doc, fh, indent=2, ensure_ascii=False)
    fh.write("\n")

# Print summary stats
total_trims = sum(len(m.get("trims", [])) for m in models)
print(f"Aggregated {len(models)} models, {total_trims} trims into {OUTPUT}")
if missing:
    print(f"Missing partials: {missing}")

# Build verification summary
low_conf_models = []
needs_scraping_count = 0
trim_with_null_safety_count = 0
spec_field_nulls = {
    "powertrain": 0, "ev_specifics": 0, "fuel_economy": 0,
    "performance.zero_to_60_sec": 0, "dimensions": 0,
    "safety.nhtsa_overall_rating": 0, "safety.iihs_top_safety_pick": 0,
    "features.head_up_display_false": 0,
}

for m in models:
    rel = m.get("reliability") or {}
    if rel.get("confidence") in ("low", "unknown"):
        low_conf_models.append(m.get("model_slug"))
    for trim in m.get("trims", []):
        for img in trim.get("images", []) or []:
            if img.get("needs_scraping"):
                needs_scraping_count += 1
        if trim.get("safety") is None and trim.get("is_base_trim"):
            trim_with_null_safety_count += 1
        safety = trim.get("safety") or {}
        if safety.get("nhtsa_overall_rating") is None:
            spec_field_nulls["safety.nhtsa_overall_rating"] += 1
        if safety.get("iihs_top_safety_pick") is None:
            spec_field_nulls["safety.iihs_top_safety_pick"] += 1
        perf = trim.get("performance") or {}
        if perf.get("zero_to_60_sec") is None:
            spec_field_nulls["performance.zero_to_60_sec"] += 1

print(f"\nLow/unknown-confidence reliability models ({len(low_conf_models)}): {low_conf_models}")
print(f"Image entries with needs_scraping: {needs_scraping_count}")
print(f"\nTop spec-field nulls:")
for k, v in sorted(spec_field_nulls.items(), key=lambda x: -x[1])[:8]:
    print(f"  {k}: {v}")
