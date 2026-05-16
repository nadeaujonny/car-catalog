#!/usr/bin/env python3
"""Normalize 48V mild-hybrid powertrain.type from 'hybrid' to 'ice' for consistency with BMW partials.

True hybrids (Toyota HSD-style full hybrid with high-voltage motor capable of EV-only driving) keep 'hybrid'.
But 2026 Mercedes 48V MHEV is ICE with starter-motor assist; this matches BMW M340i / X3 30 xDrive convention
in this catalog where 48V MHEV stayed as 'ice'.

Mercedes 48V MHEV trims affected: GLA, GLB, G-Class, C-Class (C 300, AMG C 43), GLC Coupe (GLC 300, AMG GLC 43).
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PARTIALS_DIR = ROOT / "data" / "_partials"
AFFECTED = ["gla-suv", "glb-suv", "g-class", "c-class", "glc-coupe"]

for slug in AFFECTED:
    fp = PARTIALS_DIR / f"mercedes-benz_{slug}.json"
    if not fp.exists():
        print(f"skip {slug}: missing")
        continue
    with fp.open(encoding="utf-8") as fh:
        doc = json.load(fh)
    changed = 0
    for trim in doc.get("trims", []):
        pt = trim.get("powertrain") or {}
        if pt.get("type") == "hybrid":
            ev = trim.get("ev_specifics") or {}
            # Treat as 48V MHEV if there's no usable battery / range — i.e., not a PHEV/full hybrid
            battery = ev.get("battery_capacity_kwh")
            ev_range = ev.get("electric_range_mi")
            is_mhev = (battery in (None, 0)) and (ev_range in (None, 0))
            if is_mhev:
                pt["type"] = "ice"
                trim["ev_specifics"] = None
                notes = trim.get("notes", "") or ""
                if "48V MHEV" not in notes and "48V mild-hybrid" not in notes.lower():
                    add = " Powertrain type normalized to 'ice'; engine includes 48V mild-hybrid starter-generator (EQ Boost) for ~13-22 hp transient assist — cannot drive the vehicle on electricity alone."
                    trim["notes"] = (notes + add).strip()
                changed += 1
    if changed:
        with fp.open("w", encoding="utf-8") as fh:
            json.dump(doc, fh, indent=2, ensure_ascii=False)
            fh.write("\n")
        print(f"{slug}: normalized {changed} trims")
    else:
        print(f"{slug}: no changes")
