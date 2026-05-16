"""
EV Market Snapshot — range vs MSRP for every battery-EV trim in the catalog,
with DC fast-charging speed as bubble size.

Run from the project root:

    python analyses/ev_market.py

Saves the chart to analyses/charts/ev_market.png and prints a markdown
summary of findings.
"""

from __future__ import annotations

import glob
import json
import os
import sys

import matplotlib.pyplot as plt
import matplotlib.ticker as mtick

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
OUT_DIR = os.path.join(os.path.dirname(__file__), "charts")
os.makedirs(OUT_DIR, exist_ok=True)

# brands grouped by positioning, for color coding
LUXURY = {"audi", "bmw", "cadillac", "genesis", "lucid", "mercedes-benz",
          "porsche", "rolls-royce", "tesla", "polestar", "volvo"}
MASS_MARKET = {"chevrolet", "ford", "honda", "hyundai", "kia", "mini",
               "nissan", "subaru", "toyota", "volkswagen", "vinfast",
               "fiat", "dodge", "chrysler"}
PERFORMANCE = {"acura", "alfa-romeo", "infiniti", "jaguar", "land-rover",
               "lexus", "lotus", "maserati", "mclaren", "rivian"}
EXOTIC = {"aston-martin", "bentley", "bugatti", "ferrari", "lamborghini"}

POSITIONING_COLOR = {
    "Mass-market":   "#1a3a7a",
    "Luxury / EV-native": "#b91c1c",
    "Performance":   "#0e8a5f",
    "Exotic":        "#7c3aed",
}


def positioning_for(slug):
    if slug in EXOTIC:
        return "Exotic"
    if slug in PERFORMANCE:
        return "Performance"
    if slug in LUXURY:
        return "Luxury / EV-native"
    return "Mass-market"


def load_evs():
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
        brand_slug = brand.get("brand_slug", "")
        brand_name = brand.get("brand", "")
        for m in brand.get("models", []):
            for t in m.get("trims", []):
                pw = (t.get("powertrain") or {})
                if pw.get("type") != "ev":
                    continue
                ev = t.get("ev_specifics") or {}
                rng = ev.get("electric_range_mi") or ev.get("total_range_mi")
                kw = ev.get("dc_fast_charge_peak_kw")
                msrp = t.get("msrp_base")
                if rng is None or msrp is None:
                    continue
                rows.append({
                    "brand_slug": brand_slug,
                    "brand": brand_name,
                    "model": m.get("model", ""),
                    "trim": t.get("trim", ""),
                    "range_mi": rng,
                    "msrp": msrp,
                    "dc_max_kw": kw,
                    "positioning": positioning_for(brand_slug),
                })
    return rows


def plot(rows):
    fig, ax = plt.subplots(figsize=(12, 7.5), dpi=140)
    fig.patch.set_facecolor("#fafaf7")
    ax.set_facecolor("#fafaf7")

    by_pos = {}
    for r in rows:
        by_pos.setdefault(r["positioning"], []).append(r)

    # bubble area proportional to DC charging speed (default 100 kW if null)
    def bubble(r):
        kw = r.get("dc_max_kw") or 100
        return max(15, min(620, (kw - 50) * 4))

    plot_order = ["Mass-market", "Luxury / EV-native", "Performance", "Exotic"]
    for key in plot_order:
        pts = by_pos.get(key, [])
        if not pts:
            continue
        xs = [p["range_mi"] for p in pts]
        ys = [p["msrp"] for p in pts]
        sizes = [bubble(p) for p in pts]
        ax.scatter(
            xs, ys,
            s=sizes,
            c=POSITIONING_COLOR[key],
            alpha=0.50,
            label=key,
            edgecolor="white",
            linewidths=0.6,
        )

    ax.set_xlabel("EPA combined range (miles)", fontsize=11, color="#222")
    ax.set_ylabel("MSRP (USD)", fontsize=11, color="#222")
    ax.set_title(
        "EV Market Snapshot — range vs price, bubble = DC fast-charging kW",
        fontsize=14, weight="bold", color="#111", pad=12,
    )
    ax.set_yscale("log")
    ax.yaxis.set_major_formatter(mtick.FuncFormatter(lambda v, _: f"${int(v/1000)}K"))
    ax.set_yticks([30000, 50000, 75000, 100000, 150000, 250000, 500000])
    ax.grid(True, which="major", linestyle="--", linewidth=0.5, alpha=0.4)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.tick_params(colors="#333")

    leg = ax.legend(
        loc="upper left", frameon=True, fontsize=10,
        facecolor="#ffffff", edgecolor="#d0d0d0",
    )
    leg.get_frame().set_linewidth(0.5)
    # equal-size legend dots
    for handle in leg.legend_handles:
        handle._sizes = [80]

    # annotate top range and top value
    if rows:
        top_range = max(rows, key=lambda r: r["range_mi"])
        ax.annotate(
            f"{top_range['brand']} {top_range['model']}\n{top_range['range_mi']} mi",
            xy=(top_range["range_mi"], top_range["msrp"]),
            xytext=(-90, -28),
            textcoords="offset points",
            fontsize=8, color="#444",
            arrowprops=dict(arrowstyle="-", color="#888", lw=0.6),
        )
        # cheapest with decent range
        usable = [r for r in rows if r["range_mi"] >= 250]
        if usable:
            best_value = min(usable, key=lambda r: r["msrp"])
            ax.annotate(
                f"{best_value['brand']} {best_value['model']}\n${best_value['msrp']:,}",
                xy=(best_value["range_mi"], best_value["msrp"]),
                xytext=(10, 18),
                textcoords="offset points",
                fontsize=8, color="#444",
                arrowprops=dict(arrowstyle="-", color="#888", lw=0.6),
            )

    fig.text(
        0.99, 0.01,
        f"n = {len(rows)} EV trims  ·  Source: Car Catalog dataset, MY2026  ·  Bubble area ∝ DC charging kW",
        ha="right", va="bottom", fontsize=8, color="#777",
    )

    fig.tight_layout()
    out_path = os.path.join(OUT_DIR, "ev_market.png")
    fig.savefig(out_path, dpi=140, facecolor=fig.get_facecolor())
    plt.close(fig)
    return out_path


def summarize(rows):
    print(f"# EV Market Snapshot — findings")
    print()
    print(f"- **EV trims plotted:** {len(rows)} (filtered to EV trims with both `ev_specifics.electric_range_mi` and `msrp_base` populated; bubble size proportional to `ev_specifics.dc_fast_charge_peak_kw`, default 100 kW where null).")
    print()
    print("**Longest range (top 5):**")
    print()
    for r in sorted(rows, key=lambda r: -r["range_mi"])[:5]:
        print(f"- {r['brand']} {r['model']} {r['trim']} — {r['range_mi']} mi, ${r['msrp']:,}")
    print()
    print("**Best value under $50K (sorted by range):**")
    print()
    affordable = [r for r in rows if r["msrp"] < 50000]
    for r in sorted(affordable, key=lambda r: -r["range_mi"])[:5]:
        kw = r.get("dc_max_kw") or "n/a"
        print(f"- {r['brand']} {r['model']} {r['trim']} — {r['range_mi']} mi, ${r['msrp']:,} ({kw} kW DC)")
    print()
    print("**Fastest DC charging (top 5):**")
    print()
    has_kw = [r for r in rows if r.get("dc_max_kw")]
    for r in sorted(has_kw, key=lambda r: -(r['dc_max_kw'] or 0))[:5]:
        print(f"- {r['brand']} {r['model']} {r['trim']} — {r['dc_max_kw']} kW, {r['range_mi']} mi, ${r['msrp']:,}")
    print()


def main():
    rows = load_evs()
    out_path = plot(rows)
    print(f"Saved chart: {os.path.relpath(out_path)}")
    print()
    summarize(rows)


if __name__ == "__main__":
    main()
