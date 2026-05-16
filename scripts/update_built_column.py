#!/usr/bin/env python3
"""Set the 'Built into site' column to 'yes (<date>)' for given brands in STATUS.md."""
import sys, re, pathlib

if len(sys.argv) < 3:
    print("usage: update_built_column.py DATE BRAND [BRAND ...]"); sys.exit(2)

date = sys.argv[1]
targets = set(sys.argv[2:])
p = pathlib.Path("STATUS.md")
lines = p.read_text(encoding="utf-8").splitlines(keepends=True)

updated = []
for i, line in enumerate(lines):
    parts = line.rstrip("\r\n").split("|")
    if len(parts) < 7: continue
    brand = parts[1].strip()
    if brand not in targets: continue
    parts[3] = f" yes ({date}) "
    lines[i] = "|".join(parts) + "\n"
    updated.append(brand)

p.write_text("".join(lines), encoding="utf-8")
print("updated:", ", ".join(updated))
