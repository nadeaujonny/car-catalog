#!/usr/bin/env python3
"""Replace forbidden URLs in sources.dimensions with a per-model manufacturer URL.

Usage: replace_dimensions_sources.py FILE BAD_PATTERN model_slug=replacement_url ...
Any trim whose sources.dimensions contains BAD_PATTERN (substring, case-insensitive)
will be replaced. The replacement_url is selected by the trim's parent model_slug.
"""
import sys, json, pathlib

if len(sys.argv) < 4:
    print("usage: replace_dimensions_sources.py FILE BAD_PATTERN model_slug=replacement_url ..."); sys.exit(2)

fp = pathlib.Path(sys.argv[1])
patterns = [sys.argv[2].lower()]
overrides = dict(arg.split("=", 1) for arg in sys.argv[3:])
doc = json.loads(fp.read_text(encoding="utf-8"))

changed = 0
unmatched = []
for m in doc.get("models", []):
    ms = m.get("model_slug") or ""
    repl = overrides.get(ms)
    for t in m.get("trims", []):
        s = t.get("sources") or {}
        u = (s.get("dimensions") or "").lower()
        if not u: continue
        if not any(p in u for p in patterns): continue
        if not repl:
            unmatched.append((ms, t.get("trim")))
            continue
        s["dimensions"] = repl
        changed += 1

fp.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"replaced {changed} entry(ies)")
if unmatched:
    print("Unmatched (no override for model_slug):")
    for ms, t in unmatched: print(f"  {ms} / {t}")
