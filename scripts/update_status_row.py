#!/usr/bin/env python3
"""Update a single brand's row in STATUS.md.

Usage: update_status_row.py "<Brand>" "<verified-date>" "<notes>"
Replaces the row whose first cell (after leading '| ') matches the given brand,
preserving the Research and 'Built into site' columns; rewrites Verified, Last updated, Notes.
"""
import sys, re, pathlib

if len(sys.argv) != 4:
    print("usage: update_status_row.py BRAND VERIFIED_DATE NOTES", file=sys.stderr); sys.exit(2)

brand, verified, notes = sys.argv[1], sys.argv[2], sys.argv[3]
p = pathlib.Path("STATUS.md")
lines = p.read_text(encoding="utf-8").splitlines(keepends=True)

# row pattern: | Brand<spaces>| Research<spaces>| Built into site<spaces>| Verified<spaces>| Last updated<spaces>| Notes |
brand_pat = re.compile(r"^\|\s*" + re.escape(brand) + r"\s*\|")
updated = False
for i, line in enumerate(lines):
    if brand_pat.match(line):
        # Split on '|' keeping spaces; expect 7 segments incl. leading/trailing empties
        parts = line.rstrip("\r\n").split("|")
        if len(parts) < 7:
            print(f"row found but unexpected column count: {len(parts)}", file=sys.stderr); sys.exit(3)
        # parts: '', ' Brand ', ' Research ', ' Built ', ' Verified ', ' LastUpd ', ' Notes ', ''
        # keep widths of cols 1..3 (brand, research, built into site)
        # update col 4 (verified), col 5 (last updated), col 6 (notes)
        parts[4] = f" {verified} "
        parts[5] = f" {verified}    "
        parts[6] = f" {notes} "
        lines[i] = "|".join(parts) + "\n"
        updated = True
        break

if not updated:
    print(f"no row found for brand={brand!r}", file=sys.stderr); sys.exit(4)

p.write_text("".join(lines), encoding="utf-8")
print(f"updated {brand}")
