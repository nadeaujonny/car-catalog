"""
Brand Reliability Map — JD Power 2026 Vehicle Dependability Study (VDS) scores per brand,
with the industry average overlaid. Lower is better (PP100 = problems per 100 vehicles).

Run from the project root:

    python analyses/brand_reliability.py

Saves the chart to analyses/charts/reliability_map.png and prints a markdown
summary of findings.
"""

from __future__ import annotations

import glob
import json
import os
import sys

import matplotlib.pyplot as plt

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
OUT_DIR = os.path.join(os.path.dirname(__file__), "charts")
os.makedirs(OUT_DIR, exist_ok=True)

INDUSTRY_AVG_PP100 = 204     # per JD Power 2026 VDS press release
PREMIUM_AVG_PP100 = 217      # premium-segment subset average


def load_brand_vds():
    rows = []
    for path in sorted(glob.glob(os.path.join(DATA_DIR, "*.json"))):
        if "_partials" in path or path.endswith(".bak"):
            continue
        try:
            with open(path, encoding="utf-8") as fh:
                brand = json.load(fh)
        except Exception as exc:
            print(f"skip {path}: {exc}", file=sys.stderr)
            continue

        scores = set()
        for m in brand.get("models", []):
            rel = m.get("reliability") or {}
            s = rel.get("jd_power_vds_score")
            if s is not None:
                scores.add(s)
        if not scores:
            continue
        # one score per brand (VDS is reported per brand, mirrored to models)
        rows.append({"brand": brand.get("brand", ""), "vds": min(scores)})
    return rows


def plot(rows):
    rows_sorted = sorted(rows, key=lambda r: r["vds"])
    labels = [r["brand"] for r in rows_sorted]
    values = [r["vds"] for r in rows_sorted]

    n = len(rows_sorted)
    fig, ax = plt.subplots(figsize=(11, max(4.0, 0.32 * n + 1.5)), dpi=140)
    fig.patch.set_facecolor("#fafaf7")
    ax.set_facecolor("#fafaf7")

    # color: below industry average → green, between industry and premium → amber, above premium → red
    colors = []
    for v in values:
        if v <= INDUSTRY_AVG_PP100:
            colors.append("#0e8a5f")
        elif v <= PREMIUM_AVG_PP100:
            colors.append("#d97706")
        else:
            colors.append("#b91c1c")

    bars = ax.barh(labels, values, color=colors, height=0.7, edgecolor="none")

    # value labels at bar end
    for bar, v in zip(bars, values):
        ax.text(
            v + 2, bar.get_y() + bar.get_height() / 2,
            f"{v}",
            va="center", fontsize=9, color="#333",
        )

    # industry / premium average lines
    ax.axvline(INDUSTRY_AVG_PP100, color="#444", linestyle="--", linewidth=1.2, alpha=0.6)
    ax.text(INDUSTRY_AVG_PP100 + 2, -0.8, f"industry avg {INDUSTRY_AVG_PP100}",
            fontsize=9, color="#444", rotation=0, ha="left")

    ax.axvline(PREMIUM_AVG_PP100, color="#888", linestyle=":", linewidth=1.0, alpha=0.6)
    ax.text(PREMIUM_AVG_PP100 + 2, -1.7, f"premium-seg avg {PREMIUM_AVG_PP100}",
            fontsize=9, color="#777", rotation=0, ha="left")

    ax.set_xlabel("Problems per 100 vehicles (lower is better)", fontsize=11, color="#222")
    ax.set_title(
        "Brand Reliability — JD Power 2026 US Vehicle Dependability Study",
        fontsize=14, weight="bold", color="#111", pad=12,
    )
    ax.set_xlim(0, max(values) * 1.15)
    ax.invert_yaxis()
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color("#bbb")
    ax.tick_params(axis="y", colors="#333", length=0)
    ax.tick_params(axis="x", colors="#333")
    ax.grid(True, axis="x", linestyle="--", linewidth=0.5, alpha=0.4)

    fig.text(
        0.99, 0.01,
        f"n = {len(rows)} brands  ·  Source: jdpower.com 2026 VDS, Feb 2026",
        ha="right", va="bottom", fontsize=8, color="#777",
    )

    fig.tight_layout()
    out_path = os.path.join(OUT_DIR, "reliability_map.png")
    fig.savefig(out_path, dpi=140, facecolor=fig.get_facecolor())
    plt.close(fig)
    return out_path


def summarize(rows):
    rows_sorted = sorted(rows, key=lambda r: r["vds"])
    print(f"# Brand Reliability Map — findings")
    print()
    print(f"- **Brands covered:** {len(rows)} (of 46 in the dataset; the remaining 30 either are EV-only / low-volume marques not surveyed by JD Power, or had `jd_power_vds_score` recorded as null).")
    print(f"- **Industry average (2026 VDS):** {INDUSTRY_AVG_PP100} PP100. Premium-segment average: {PREMIUM_AVG_PP100} PP100. Lower is better.")
    print()
    print("**Best 5 (most dependable):**")
    print()
    for r in rows_sorted[:5]:
        print(f"- {r['brand']} — {r['vds']} PP100")
    print()
    print("**Worst 5 (least dependable):**")
    print()
    for r in rows_sorted[-5:][::-1]:
        print(f"- {r['brand']} — {r['vds']} PP100")
    print()
    below_industry = [r for r in rows_sorted if r['vds'] <= INDUSTRY_AVG_PP100]
    above_industry = [r for r in rows_sorted if r['vds'] > INDUSTRY_AVG_PP100]
    print(f"**Distribution:** {len(below_industry)} brands at or below industry average; {len(above_industry)} above.")
    print()


def main():
    rows = load_brand_vds()
    out_path = plot(rows)
    print(f"Saved chart: {os.path.relpath(out_path)}")
    print()
    summarize(rows)


if __name__ == "__main__":
    main()
