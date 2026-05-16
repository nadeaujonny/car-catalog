#!/usr/bin/env python3
"""Set msrp_range.high on specified models to the provided values.

Usage: fix_msrp_range_high.py FILE model_slug=high_value ...
"""
import sys, json, pathlib

if len(sys.argv) < 3:
    print("usage: fix_msrp_range_high.py FILE model_slug=int ..."); sys.exit(2)

fp = pathlib.Path(sys.argv[1])
overrides = {k: int(v) for k, v in (a.split("=", 1) for a in sys.argv[2:])}
doc = json.loads(fp.read_text(encoding="utf-8"))

changed = 0
for m in doc.get("models", []):
    ms = m.get("model_slug")
    if ms in overrides:
        old = (m.get("msrp_range") or {}).get("high")
        m.setdefault("msrp_range", {})["high"] = overrides[ms]
        print(f"  {ms}: high {old} -> {overrides[ms]}")
        changed += 1

fp.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"set high on {changed} model(s)")
