#!/usr/bin/env python3
"""Walk every sources.* string in trims and replace URLs matching BAD_PATTERN
with a per-model replacement. Resolves the per-model replacement via:
- model_slug=URL overrides
- a default URL

Usage: replace_in_sources_any.py FILE BAD_PATTERN DEFAULT_URL [model_slug=url ...]
"""
import sys, json, pathlib

if len(sys.argv) < 4:
    print("usage: replace_in_sources_any.py FILE BAD_PATTERN DEFAULT_URL [model_slug=url ...]"); sys.exit(2)

fp = pathlib.Path(sys.argv[1])
bad = sys.argv[2].lower()
default_url = sys.argv[3]
overrides = dict(arg.split("=", 1) for arg in sys.argv[4:])
doc = json.loads(fp.read_text(encoding="utf-8"))

changed = 0
for m in doc.get("models", []):
    ms = m.get("model_slug") or ""
    repl = overrides.get(ms, default_url)
    for t in m.get("trims", []):
        s = t.get("sources") or {}
        for k, v in list(s.items()):
            if isinstance(v, str) and bad in v.lower():
                s[k] = repl
                changed += 1

fp.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"replaced {changed} sources.* entry(ies) containing {bad!r}")
