#!/usr/bin/env python3
"""Flip is_base_trim=true and delta_from_base=null on every trim that is
the sole member of its trim_family (within a given model).

Usage:
  flip_singleton_family.py data/<brand>.json <trim_family> [<trim_family> ...]

If trim_family args are omitted, the script auto-detects every singleton
trim_family across the brand and flips violators (those with is_base_trim:false
or delta_from_base != null).
"""
import sys, json, pathlib
from collections import defaultdict

if len(sys.argv) < 2:
    print("usage: flip_singleton_family.py FILE [FAMILY ...]"); sys.exit(2)

fp = pathlib.Path(sys.argv[1])
targets = set(sys.argv[2:])
doc = json.loads(fp.read_text(encoding="utf-8"))

changed = 0
report = []
for m in doc.get("models", []):
    fam_counts = defaultdict(int)
    for t in m.get("trims", []):
        fam = t.get("trim_family")
        if fam: fam_counts[fam] += 1
    singletons = {f for f, c in fam_counts.items() if c == 1}
    if targets:
        singletons &= targets
    for t in m.get("trims", []):
        fam = t.get("trim_family")
        if fam in singletons:
            need_flip = (t.get("is_base_trim") is not True) or (t.get("delta_from_base") is not None)
            if need_flip:
                t["is_base_trim"] = True
                t["delta_from_base"] = None
                changed += 1
                report.append(f"  {m.get('model')!r} / {t.get('trim')!r} ({fam})")

fp.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"flipped {changed} trim(s)")
for r in report: print(r)
