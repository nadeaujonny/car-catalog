#!/usr/bin/env python3
"""Phase 2 build: copy data/*.json to catalog/data/*.json and regenerate manifest.json.

Reuses existing catalog/index.html, styles.css, app.js (which were generated in prior
build passes) — this incremental update only refreshes data and manifest. Leaves
HTML/CSS/JS untouched unless explicitly requested.
"""
import os, json, shutil, pathlib, datetime

root = pathlib.Path(".").resolve()
data_dir = root / "data"
catalog_dir = root / "catalog"
catalog_data = catalog_dir / "data"
manifest_path = catalog_dir / "manifest.json"

# Ensure catalog/data exists
catalog_data.mkdir(parents=True, exist_ok=True)

brand_files = sorted(p for p in data_dir.iterdir() if p.is_file() and p.suffix == ".json")
brands = []
total_models = 0
total_trims = 0

for src in brand_files:
    # parse to extract metadata
    try:
        doc = json.loads(src.read_text(encoding="utf-8-sig"))
    except Exception as e:
        print(f"WARN: skipped {src.name}: {e}")
        continue
    brand = doc.get("brand")
    brand_slug = doc.get("brand_slug")
    researched_at = doc.get("researched_at")
    models = doc.get("models") or []
    if not brand or not brand_slug:
        print(f"WARN: {src.name} missing brand/brand_slug")
        continue
    brands.append({
        "slug": brand_slug,
        "display_name": brand,
        "researched_at": researched_at,
        "model_count": len(models),
    })
    total_models += len(models)
    for m in models:
        total_trims += len(m.get("trims") or [])
    # copy file
    dst = catalog_data / src.name
    shutil.copyfile(src, dst)

brands.sort(key=lambda b: b["display_name"].lower())
manifest = {
    "schema_version": "1.0",
    "generated_at": datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
    "brands": brands,
}
manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

# verify HTML/CSS/JS exist unchanged
for f in ["index.html", "styles.css", "app.js"]:
    p = catalog_dir / f
    print(f"  {f}: {'OK' if p.exists() else 'MISSING'} ({p.stat().st_size if p.exists() else 0} bytes)")

print(f"\nWrote manifest.json: {len(brands)} brands, {total_models} models, {total_trims} trims")
print(f"Brand files in catalog/data/: {sum(1 for _ in catalog_data.glob('*.json'))}")
