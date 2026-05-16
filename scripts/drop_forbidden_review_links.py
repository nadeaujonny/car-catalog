#!/usr/bin/env python3
"""Drop professional_reviews.links entries whose url matches any of a set of
forbidden host patterns. Reports remaining-link counts per model.

Usage: drop_forbidden_review_links.py FILE PATTERN [PATTERN ...]
PATTERN is a substring matched against the link URL (case-insensitive).
"""
import sys, json, pathlib

if len(sys.argv) < 3:
    print("usage: drop_forbidden_review_links.py FILE PATTERN ..."); sys.exit(2)

fp = pathlib.Path(sys.argv[1])
patterns = [p.lower() for p in sys.argv[2:]]
doc = json.loads(fp.read_text(encoding="utf-8"))

dropped = 0
low_models = []
for m in doc.get("models", []):
    pr = m.get("professional_reviews") or {}
    links = pr.get("links") or []
    kept = []
    for l in links:
        u = (l.get("url") or "").lower()
        if any(p in u for p in patterns):
            dropped += 1
        else:
            kept.append(l)
    pr["links"] = kept
    if len(kept) < 2:
        low_models.append((m.get("model"), len(kept)))

fp.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"dropped {dropped} link(s)")
if low_models:
    print("Models now under 2 review links:")
    for name, n in low_models:
        print(f"  {name}: {n}")
