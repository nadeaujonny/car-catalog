#!/usr/bin/env python3
"""For models whose professional_reviews.links has <2 entries, append one
canonical Edmunds entry. The Edmunds URL is derived from a template the
caller provides (default uses brand+model_slug; can be overridden via map).
"""
import sys, json, pathlib

if len(sys.argv) < 3:
    print("usage: ensure_two_reviews.py FILE BRAND_SLUG [model_slug=edmunds_url ...]"); sys.exit(2)

fp = pathlib.Path(sys.argv[1])
brand = sys.argv[2]
overrides = dict(arg.split("=", 1) for arg in sys.argv[3:])
doc = json.loads(fp.read_text(encoding="utf-8"))

added = 0
today = "2026-05-13"
for m in doc.get("models", []):
    pr = m.get("professional_reviews") or {}
    links = pr.get("links") or []
    if len(links) >= 2: continue
    ms = m.get("model_slug") or ""
    url = overrides.get(ms) or f"https://www.edmunds.com/{brand}/{ms}/2026/"
    links.append({"publication": "Edmunds", "url": url, "date": today})
    pr["links"] = links
    added += 1
    print(f"  added Edmunds to {m.get('model')!r} -> {url}")

fp.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"added {added} review link(s)")
