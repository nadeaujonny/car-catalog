#!/usr/bin/env python3
"""For each step-up trim (is_base_trim:false) with empty images[] and a
singleton trim_family, reassign its trim_family to its delta_from_base
ancestor's trim_family. This is the Pattern E "preferred" fix.

Usage: reassign_step_up_families.py data/<brand>.json
"""
import sys, json, pathlib
from collections import defaultdict

if len(sys.argv) != 2:
    print("usage: reassign_step_up_families.py FILE"); sys.exit(2)

fp = pathlib.Path(sys.argv[1])
doc = json.loads(fp.read_text(encoding="utf-8"))
changed = 0
report = []
for m in doc.get("models", []):
    trims = m.get("trims", [])
    by_slug = {t.get("trim_slug"): t for t in trims}
    fam_counts = defaultdict(int)
    for t in trims:
        fam = t.get("trim_family")
        if fam: fam_counts[fam] += 1
    for t in trims:
        if t.get("is_base_trim"): continue
        if t.get("images"): continue  # only fix empty-images cases
        fam = t.get("trim_family")
        if not fam or fam_counts[fam] != 1: continue
        delta = t.get("delta_from_base") or {}
        anc_slug = delta.get("from_trim_slug")
        anc = by_slug.get(anc_slug)
        if not anc: continue
        anc_fam = anc.get("trim_family")
        if not anc_fam or anc_fam == fam: continue
        t["trim_family"] = anc_fam
        changed += 1
        report.append(f"  {m.get('model')!r} / {t.get('trim')!r}: {fam!r} -> {anc_fam!r}")

fp.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"reassigned {changed} trim(s)")
for r in report: print(r)
