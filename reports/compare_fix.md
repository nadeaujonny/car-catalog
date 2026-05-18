# Compare view fix

**Date:** 2026-05-18
**Files changed:** `catalog/app.js`

## Diagnosis
The Compare view's `applySlot()` closure in `buildCompareSlotCard` writes the slot state back into the URL fragment on every selection, but its token encoder required BOTH `brand` AND `model` to emit anything (`if (!s.brand || !s.model) return "";`). When the user picked just a brand, the slot was encoded as an empty string, the URL became `#compare=,,`, the `hashchange` listener re-ran `route()` → `renderCompare()`, which parsed all three slots back as empty. The brand selection was lost on the round-trip, so `mSel.disabled = !slot.brand` re-evaluated to `true` and the Model dropdown never populated.

## Root cause
`catalog/app.js`, in the `applySlot()` closure inside `buildCompareSlotCard()` (was lines 1482–1490). The token encoder treated "brand only" as an empty slot:

```js
const tokens = slotData.map(s => {
  if (!s.brand || !s.model) return "";       // <-- bug: drops brand-only state
  const t = s.trim ? `:${s.trim.trim_slug}` : "";
  return `${s.brand.brand_slug}:${s.model.model_slug}${t}`;
});
```

`parseCompareSlot()` on the other side already accepts a brand-only token correctly (`"honda".split(":")` → `["honda"]`, model resolves to undefined → returns `{ brand, model: undefined, trim: null }`), so only the encoder needed fixing.

This is a variant of **Cause A** from the runbook ("brand JSON fetch is never made / silently dropped") — except what was silently dropped was the URL fragment write, not the fetch. Causes B (event wiring), C (`disabled` not cleared — it IS cleared, but only when `slot.brand` is truthy after re-render, which it never was), and D (slug vs display name — the encoder uses `brand_slug` correctly) were ruled out by reading the code.

## Fix
Split the early-return into two checks so a brand-only slot encodes as just the brand slug:

```js
const tokens = slotData.map(s => {
  if (!s.brand) return "";
  // Emit a brand-only token so the brand selection survives the hash round-trip
  // before a model is picked; otherwise the Model dropdown can never populate.
  if (!s.model) return s.brand.brand_slug;
  const t = s.trim ? `:${s.trim.trim_slug}` : "";
  return `${s.brand.brand_slug}:${s.model.model_slug}${t}`;
});
```

After picking a brand the URL becomes e.g. `#compare=honda,,` (or `#compare=mercedes-benz,,`), the re-render parses slot 0 as `{ brand: honda, model: undefined, trim: null }`, `mSel.disabled = !slot.brand` evaluates to `false`, and the Model dropdown is populated with Honda's models. The Model→Trim cascade was never broken — it just couldn't be reached.

Total change: two lines plus a comment, inside one closure. No other files touched.

## Sanity checks performed
- [x] Walked through brand-change handler for **Honda** (single-word slug): pick → `#compare=honda,,` → re-render → Model dropdown lists Civic, Accord, … and is enabled.
- [x] Walked through for a **multi-word brand** (`mercedes-benz`, also valid for `aston-martin`, `land-rover`, `rolls-royce`, `alfa-romeo`): `encodeURIComponent` leaves hyphens untouched, only the separator commas are encoded, slug round-trips intact.
- [x] Walked through **Model → Trim** cascade: from a brand-only slot, picking a Model fires `mSel.onchange` which calls `applySlot({brand, model, trim: baseTrim(model)})` → encoder takes the third branch → full `brand:model:trim` token → re-render populates the Trim dropdown and enables it.
- [x] Picking a **different brand in the same slot** doesn't append options because `route()` does `main.innerHTML = ""` before re-rendering — the slot card is rebuilt from scratch each hashchange.
- [x] **Clear** button (only visible when slot is fully filled): produces `{null, null, null}` → tokens all empty → `#compare=,,` → slot resets.
- [x] **No regressions** to:
  - **Brand view** (`#brand=<slug>`): `renderBrand()` doesn't touch `applySlot` — unaffected.
  - **Body-style view** (`#body=<slug>`): same — unaffected.
  - **Search**: `renderSearch()` / suggestion list — same — unaffected.
  - The `el()` helper, `setHash`, `parseHash`, `loadBrand`, and `loadAllBrands` were not touched.

## Known limitations after fix
- The URL fragment format is `honda:civic:lx,,` (always pads to three slots with trailing empty commas) rather than the `honda:accord,toyota:camry` format described in `instructions/02_build_catalog.md`. This is pre-existing behavior — not introduced by this fix. Both forms parse correctly. Cleanup (trim trailing empty tokens before `join`) would be a separate cosmetic change.
- `parseCompareSlot()` returns `model: undefined` (not `null`) for brand-only tokens because `Array.prototype.find` returns `undefined` on miss. Both are falsy and all current consumers (`s.brand && s.model && s.trim`, `if (slot.model)`, `mSel.disabled = !slot.model`) treat them identically, so it's harmless. Would need a `|| null` defensive coalesce if a future caller used strict `=== null`.
- No keyboard support beyond default `<select>` behavior; no "swap slots" / "save comparison" features. Out of scope for this pass.

## How to test in browser
1. Start server: `cd catalog && python -m http.server 8000`
2. Open `http://localhost:8000/#compare=`
3. In Slot 1, pick a brand → Model should populate and become enabled.
4. Pick a model → Trim should populate and become enabled (with the base trim pre-selected).
5. Repeat in Slot 2 and Slot 3.
6. Try a multi-word brand (Mercedes-Benz, Land Rover, Aston Martin, Rolls-Royce) to confirm slug round-trip handling.
7. Pick a different brand in a slot that's already filled — Model and Trim should reset to that brand's options.
8. With at least two slots fully filled, the comparison table should render below the slot cards.
