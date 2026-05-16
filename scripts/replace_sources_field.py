#!/usr/bin/env python3
"""Replace a specific URL pattern in a specific sources.* field across all trims.

Usage: replace_sources_field.py FILE FIELD BAD_PATTERN REPLACEMENT_URL [model_slug=specific_replacement ...]
- FIELD: e.g. "warranty", "dimensions", "msrp_base"
- BAD_PATTERN: substring match (case-insensitive)
- REPLACEMENT_URL: used unless an override per model_slug is given
"""
import sys, json, pathlib

if len(sys.argv) < 5:
    print("usage: replace_sources_field.py FILE FIELD BAD_PATTERN REPLACEMENT_URL [model_slug=url ...]"); sys.exit(2)

fp = pathlib.Path(sys.argv[1])
field = sys.argv[2]
bad = sys.argv[3].lower()
default_repl = sys.argv[4]
overrides = dict(arg.split("=", 1) for arg in sys.argv[5:])
doc = json.loads(fp.read_text(encoding="utf-8"))

changed = 0
for m in doc.get("models", []):
    repl = overrides.get(m.get("model_slug") or "", default_repl)
    for t in m.get("trims", []):
        s = t.get("sources") or {}
        u = (s.get(field) or "").lower()
        if u and bad in u:
            s[field] = repl
            changed += 1

fp.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"replaced {changed} entry(ies) in sources.{field}")
