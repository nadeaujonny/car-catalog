"""
Price-Performance Landscape — MSRP vs horsepower across every trim in the catalog,
colored by powertrain type. Surfaces value tiers, performance outliers, and EV positioning.

Run from the project root:

    python analyses/price_performance.py

Saves the chart to analyses/charts/price_performance.png and prints a markdown
summary of findings.
"""

from __future__ import annotations

import glob
import json
import os
import sys
from collections import Counter

import matplotlib.pyplot as plt
import matplotlib.ticker as mtick

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
OUT_DIR = os.path.join(os.path.dirname(__file__), "charts")
os.makedirs(OUT_DIR, exist_ok=True)

POWERTRAIN_COLORS = {
    "ice":    "#1a3a7a",   # deep indigo (the catalog's accent)
    "hybrid": "#0e8a5f",   # green
    "phev":   "#d97706",   # amber
    "ev":     "#b91c1c",   # crimson
    "fcev":   "#7c3aed",   # violet
}

POWERTRAIN_LABELS = {
    "ice":    "ICE",
    "hybrid": "Hybrid",
    "phev":   "Plug-in Hybrid",
    "ev":     "Battery EV",
    "fcev":   "Fuel Cell EV",
}


def load_trims():
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
        brand_name = brand.get("brand", "")
        for m in brand.get("models", []):
            model = m.get("model", "")
            for t in m.get("trims", []):
                pw = (t.get("powertrain") or {})
                hp = pw.get("horsepower_hp")
                pwtype = pw.get("type")
                msrp = t.get("msrp_base")
                if hp is None or msrp is None or pwtype is None:
                    continue
                rows.append({
                    "brand": brand_name,
                    "model": model,
                    "trim": t.get("trim", ""),
                    "msrp": msrp,
                    "hp": hp,
                    "powertrain": pwtype,
                })
    return rows


def plot(rows):
    fig, ax = plt.subplots(figsize=(12, 7), dpi=140)
    fig.patch.set_facecolor("#fafaf7")
    ax.set_facecolor("#fafaf7")

    # group by powertrain so the legend renders cleanly
    by_pw = {}
    for r in rows:
        by_pw.setdefault(r["powertrain"], []).append(r)

    plot_order = ["ice", "hybrid", "phev", "ev", "fcev"]
    for key in plot_order:
        pts = by_pw.get(key, [])
        if not pts:
            continue
        xs = [p["hp"] for p in pts]
        ys = [p["msrp"] for p in pts]
        ax.scatter(
            xs, ys,
            s=18,
            c=POWERTRAIN_COLORS[key],
            alpha=0.55,
            label=POWERTRAIN_LABELS[key],
            linewidths=0,
        )

    ax.set_xlabel("Horsepower", fontsize=11, color="#222")
    ax.set_ylabel("MSRP (USD)", fontsize=11, color="#222")
    ax.set_title(
        "Price vs Horsepower — every current-MY US trim, 46 brands",
        fontsize=14, weight="bold", color="#111", pad=12,
    )
    ax.set_yscale("log")
    ax.set_xscale("log")
    ax.yaxis.set_major_formatter(mtick.FuncFormatter(lambda v, _: f"${int(v/1000)}K"))
    ax.xaxis.set_major_formatter(mtick.FuncFormatter(lambda v, _: f"{int(v)}"))
    ax.set_xticks([100, 200, 300, 500, 750, 1000, 1500])
    ax.set_yticks([20000, 30000, 50000, 100000, 200000, 500000, 1000000, 2000000])
    ax.grid(True, which="major", linestyle="--", linewidth=0.5, alpha=0.4)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.tick_params(colors="#333")

    leg = ax.legend(
        loc="upper left", frameon=True, fontsize=10,
        facecolor="#ffffff", edgecolor="#d0d0d0",
    )
    leg.get_frame().set_linewidth(0.5)

    fig.text(
        0.99, 0.01,
        f"n = {len(rows)} trims  ·  Source: Car Catalog dataset, MY2026",
        ha="right", va="bottom", fontsize=8, color="#777",
    )

    fig.tight_layout()
    out_path = os.path.join(OUT_DIR, "price_performance.png")
    fig.savefig(out_path, dpi=140, facecolor=fig.get_facecolor())
    plt.close(fig)
    return out_path


def summarize(rows):
    n_total = len(rows)
    counts = Counter(r["powertrain"] for r in rows)
    hp_by_pw = {}
    msrp_by_pw = {}
    for r in rows:
        hp_by_pw.setdefault(r["powertrain"], []).append(r["hp"])
        msrp_by_pw.setdefault(r["powertrain"], []).append(r["msrp"])

    def median(xs):
        s = sorted(xs)
        n = len(s)
        if n == 0:
            return 0
        if n % 2 == 1:
            return s[n // 2]
        return (s[n // 2 - 1] + s[n // 2]) / 2

    # value-tier finder: top 5 best $/hp
    value_ratios = sorted(rows, key=lambda r: r["msrp"] / r["hp"])
    best = value_ratios[:5]

    # performance outliers: top 5 by HP
    perf = sorted(rows, key=lambda r: -r["hp"])[:5]

    print(f"# Price–Performance Landscape — findings")
    print()
    print(f"- **Trims plotted:** {n_total} (filtered to trims with both `msrp_base` and `powertrain.horsepower_hp` populated).")
    print()
    print("**Powertrain breakdown:**")
    print()
    print("| Powertrain | Trims | Median HP | Median MSRP |")
    print("|---|---:|---:|---:|")
    for key in ["ice", "hybrid", "phev", "ev", "fcev"]:
        if key not in counts:
            continue
        print(
            f"| {POWERTRAIN_LABELS[key]} | {counts[key]} "
            f"| {int(median(hp_by_pw[key]))} "
            f"| ${int(median(msrp_by_pw[key])):,} |"
        )
    print()
    print("**Top 5 value trims (lowest $/hp):**")
    print()
    for r in best:
        print(f"- {r['brand']} {r['model']} {r['trim']} — ${r['msrp']:,} / {r['hp']} hp = ${r['msrp']/r['hp']:.0f}/hp")
    print()
    print("**Top 5 horsepower outliers:**")
    print()
    for r in perf:
        print(f"- {r['brand']} {r['model']} {r['trim']} — {r['hp']} hp / ${r['msrp']:,}")
    print()


def main():
    rows = load_trims()
    out_path = plot(rows)
    print(f"Saved chart: {os.path.relpath(out_path)}")
    print()
    summarize(rows)


if __name__ == "__main__":
    main()
