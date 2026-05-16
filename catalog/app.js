/* Car Catalog — app.js
   Vanilla JavaScript (ES2020+). No frameworks. Loads manifest.json and brand
   JSONs on demand, renders views into <main>, routes via URL fragment.
*/
"use strict";

/* ============================================================
   STATE
   ============================================================ */
const State = {
  manifest: null,
  brands: Object.create(null), // brand_slug -> parsed JSON
  view: null,                  // current view name
  params: {},                  // current URL params
};

/* ============================================================
   BODY-STYLE METADATA
   ============================================================ */
const BODY_STYLES = [
  { slug: "sedan",            label: "Sedan" },
  { slug: "coupe",            label: "Coupe" },
  { slug: "hatchback",        label: "Hatchback" },
  { slug: "wagon",            label: "Wagon" },
  { slug: "convertible",      label: "Convertible" },
  { slug: "suv-compact",      label: "Compact SUV" },
  { slug: "suv-midsize",      label: "Midsize SUV" },
  { slug: "suv-3row",         label: "3-Row SUV" },
  { slug: "suv-full-size",    label: "Full-Size SUV" },
  { slug: "pickup-midsize",   label: "Midsize Pickup" },
  { slug: "pickup-full-size", label: "Full-Size Pickup" },
  { slug: "minivan",          label: "Minivan" },
  { slug: "sports-car",       label: "Sports Car" },
];
const BODY_LABEL = Object.fromEntries(BODY_STYLES.map(b => [b.slug, b.label]));

/* ============================================================
   UTILITIES
   ============================================================ */
function $(sel, root = document) { return root.querySelector(sel); }
function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function el(tag, attrs, ...children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") node.className = v;
      else if (k === "html") node.innerHTML = v;
      else if (k === "text") node.textContent = v;
      else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
      else if (v === true) node.setAttribute(k, "");
      else node.setAttribute(k, v);
    }
  }
  for (const c of children.flat()) {
    if (c == null || c === false || c === true) continue;
    if (c instanceof Node) {
      node.appendChild(c);
    } else {
      // strings, numbers, anything else stringifiable → text node
      node.appendChild(document.createTextNode(String(c)));
    }
  }
  return node;
}

function formatPrice(n) {
  if (n == null || isNaN(n)) return nullSpan();
  return "$" + Number(n).toLocaleString("en-US");
}

function formatMpg(c, h, comb) {
  if (c == null && h == null && comb == null) return nullSpan();
  const parts = [c, h, comb].map(v => v == null ? "—" : v);
  return `${parts[0]}/${parts[1]}/${parts[2]} mpg`;
}

function formatHp(n, src) {
  if (n == null) return nullSpan();
  if (src === "manufacturer-combined") return `${n} hp (combined)`;
  return `${n} hp`;
}

function formatZero60(t, src) {
  if (t == null) return nullSpan();
  let out = `${t.toFixed(1)} s`;
  if (src && src !== "manufacturer") out += ` (${src.replace(/_/g, " ")})`;
  return out;
}

function formatRange(low, high) {
  if (low == null && high == null) return nullSpan();
  if (low === high || high == null) return formatPrice(low);
  return `${formatPrice(low)} – ${formatPrice(high)}`;
}

function nullSpan() {
  const s = document.createElement("span");
  s.className = "null-val";
  s.textContent = "—";
  return s;
}

function nullDash() { return "—"; }

function valOrDash(v, suffix = "") {
  if (v == null) return nullSpan();
  return suffix ? `${v}${suffix}` : String(v);
}

function confidenceBadge(level) {
  if (!level || level === "high" || level === "medium") return null;
  const label = level === "unknown" ? "no data" : "low confidence";
  return el("span", { class: "confidence-badge", title: `Confidence: ${level}` }, label);
}

function imageWithFallback(image, altText) {
  // local_path first, then url. If both fail, swap to placeholder text.
  const candidates = [];
  if (image && image.local_path) candidates.push(image.local_path);
  if (image && image.url)        candidates.push(image.url);
  if (candidates.length === 0) return placeholderImage(altText);

  const img = el("img", { alt: altText, loading: "lazy" });
  let idx = 0;
  function tryNext() {
    if (idx >= candidates.length) {
      const p = placeholderImage(altText);
      if (img.parentElement) img.parentElement.replaceChild(p, img);
      return;
    }
    img.src = candidates[idx++];
  }
  img.addEventListener("error", tryNext);
  tryNext();
  return img;
}

function placeholderImage(altText) {
  return el("div", { class: "hero-img missing", role: "img", "aria-label": altText },
    "image unavailable");
}

function dedupePreserveOrder(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    if (x == null) continue;
    if (seen.has(x)) continue;
    seen.add(x);
    out.push(x);
  }
  return out;
}

function safeSortVal(v, dir) {
  // null → end regardless of direction
  if (v == null || isNaN(v)) return dir === "asc" ? Infinity : -Infinity;
  return v;
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function bodyLabel(slug) { return BODY_LABEL[slug] || slug; }

/* ============================================================
   DATA LOADING
   ============================================================ */
async function loadManifest() {
  if (State.manifest) return State.manifest;
  const res = await fetch("manifest.json");
  if (!res.ok) throw new Error("Could not load manifest.json");
  State.manifest = await res.json();
  return State.manifest;
}

async function loadBrand(slug) {
  if (State.brands[slug]) return State.brands[slug];
  const res = await fetch(`data/${slug}.json`);
  if (!res.ok) throw new Error(`Could not load data/${slug}.json`);
  const data = await res.json();
  State.brands[slug] = data;
  return data;
}

async function loadAllBrands() {
  const mani = await loadManifest();
  const slugs = mani.brands.map(b => b.slug);
  const loaded = await Promise.all(slugs.map(async slug => {
    try { return await loadBrand(slug); }
    catch (err) {
      console.warn(`Skipping brand ${slug}: ${err.message}`);
      return null;
    }
  }));
  return loaded.filter(Boolean);
}

/* ============================================================
   ROUTING
   ============================================================ */
function parseHash() {
  const hash = location.hash.replace(/^#/, "");
  if (!hash) return { view: "home", params: {} };

  const params = {};
  for (const part of hash.split("&")) {
    const [k, v = ""] = part.split("=");
    params[decodeURIComponent(k)] = decodeURIComponent(v);
  }

  if (params.brand)   return { view: "brand",   params };
  if (params.body)    return { view: "body",    params };
  if (params.compare !== undefined) return { view: "compare", params };
  if (params.search)  return { view: "search",  params };
  if (params.model) {
    // #model=<brand-slug>:<model-slug> → brand view with deep-link scroll
    const [bSlug, mSlug] = params.model.split(":");
    if (bSlug && mSlug) {
      return { view: "brand", params: { ...params, brand: bSlug, model: mSlug } };
    }
  }
  return { view: "home", params };
}

function setHash(params, { replace = false } = {}) {
  const out = Object.entries(params)
    .filter(([_, v]) => v != null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  const newHash = out ? `#${out}` : "#";
  if (replace) history.replaceState(null, "", newHash);
  else location.hash = newHash;
}

/* ============================================================
   TOP NAV INITIALIZATION
   ============================================================ */
function initTopNav(manifest) {
  // brand menu
  const brandMenu = $("#brand-menu");
  brandMenu.innerHTML = "";
  if (manifest.brands.length === 0) {
    brandMenu.appendChild(el("li", null, el("span", { class: "menu-meta" }, "No brands yet")));
  } else {
    for (const b of manifest.brands) {
      brandMenu.appendChild(el("li", null,
        el("a", { href: `#brand=${b.slug}` },
          b.display_name,
          el("span", { class: "menu-meta" }, `${b.model_count} models`)
        )
      ));
    }
  }

  // body-style menu
  const bodyMenu = $("#body-menu");
  bodyMenu.innerHTML = "";
  for (const bs of BODY_STYLES) {
    bodyMenu.appendChild(el("li", null,
      el("a", { href: `#body=${bs.slug}` }, bs.label)
    ));
  }

  // dropdown open/close
  for (const dd of $$(".dropdown")) {
    const toggle = $(".dropdown-toggle", dd);
    toggle.addEventListener("click", e => {
      e.stopPropagation();
      const open = dd.getAttribute("data-open") === "true";
      // close all others
      $$(".dropdown").forEach(d => d.setAttribute("data-open", "false"));
      dd.setAttribute("data-open", open ? "false" : "true");
      toggle.setAttribute("aria-expanded", open ? "false" : "true");
    });
  }
  document.addEventListener("click", () => {
    $$(".dropdown").forEach(d => d.setAttribute("data-open", "false"));
    $$(".dropdown-toggle").forEach(t => t.setAttribute("aria-expanded", "false"));
  });

  // sidenav toggle (mobile)
  $(".sidenav-toggle").addEventListener("click", () => {
    const sn = $("#sidenav");
    const open = !sn.hidden;
    sn.hidden = open;
    $(".sidenav-toggle").setAttribute("aria-expanded", open ? "false" : "true");
  });

  // search
  initSearch();
}

/* ============================================================
   SEARCH
   ============================================================ */
function initSearch() {
  const input = $("#search-input");
  const list = $("#search-suggestions");
  let activeIdx = -1;
  let currentResults = [];

  async function buildIndex() {
    const all = await loadAllBrands();
    const items = [];
    for (const brand of all) {
      items.push({
        kind: "brand",
        label: brand.brand,
        sub: `${brand.models.length} models`,
        href: `#brand=${brand.brand_slug}`,
      });
      for (const m of brand.models) {
        items.push({
          kind: "model",
          label: `${brand.brand} ${m.model}`,
          sub: bodyLabel(m.body_style),
          href: `#brand=${brand.brand_slug}&model=${m.model_slug}`,
        });
        for (const t of (m.trims || [])) {
          items.push({
            kind: "trim",
            label: `${brand.brand} ${m.model} ${t.trim}`,
            sub: formatPrice(t.msrp_base),
            href: `#brand=${brand.brand_slug}&model=${m.model_slug}`,
          });
        }
      }
    }
    return items;
  }

  let indexPromise = null;
  function getIndex() {
    if (!indexPromise) indexPromise = buildIndex();
    return indexPromise;
  }

  function renderSuggestions(items) {
    currentResults = items;
    activeIdx = -1;
    list.innerHTML = "";
    if (items.length === 0) {
      list.appendChild(el("li", { class: "suggest-empty", role: "option" }, "No matches."));
      list.hidden = false;
      return;
    }
    // Group items by kind (brand / model / trim) while preserving order.
    const groups = new Map();
    for (const it of items) {
      if (!groups.has(it.kind)) groups.set(it.kind, []);
      groups.get(it.kind).push(it);
    }
    const labelMap = { brand: "Brands", model: "Models", trim: "Trims" };
    const order = ["brand", "model", "trim"];
    let globalIdx = 0;
    for (const kind of order) {
      const arr = groups.get(kind);
      if (!arr || arr.length === 0) continue;
      list.appendChild(el("li", { class: "suggest-group", role: "presentation" }, labelMap[kind] || kind));
      for (const it of arr) {
        const myIdx = globalIdx++;
        const li = el("li", { "data-idx": myIdx, role: "option" },
          el("span", { class: "suggest-label" }, it.label),
          it.sub ? el("span", { class: "suggest-sub" }, it.sub) : null
        );
        li.addEventListener("mousedown", e => {
          e.preventDefault();
          location.hash = it.href;
          input.value = "";
          list.hidden = true;
        });
        list.appendChild(li);
      }
    }
    list.hidden = false;
  }

  function highlightActive() {
    let activeNode = null;
    for (const li of list.children) {
      if (li.dataset.idx == null) continue;
      const idx = parseInt(li.dataset.idx, 10);
      const isActive = idx === activeIdx;
      li.classList.toggle("active", isActive);
      if (isActive) activeNode = li;
    }
    if (activeNode) activeNode.scrollIntoView({ block: "nearest" });
  }

  input.addEventListener("input", async () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { list.hidden = true; return; }
    const items = await getIndex();
    const matches = items
      .filter(it => it.label.toLowerCase().includes(q))
      .slice(0, 12);
    renderSuggestions(matches);
  });

  input.addEventListener("keydown", e => {
    if (list.hidden) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIdx = Math.min(activeIdx + 1, currentResults.length - 1);
      highlightActive();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIdx = Math.max(activeIdx - 1, 0);
      highlightActive();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const idx = activeIdx >= 0 ? activeIdx : 0;
      const pick = currentResults[idx];
      if (pick) {
        location.hash = pick.href;
        input.value = "";
        list.hidden = true;
      }
    } else if (e.key === "Escape") {
      list.hidden = true;
    }
  });

  input.addEventListener("blur", () => {
    setTimeout(() => list.hidden = true, 150);
  });
}

/* ============================================================
   SORT / FILTER
   ============================================================ */
const SORT_OPTIONS = [
  { value: "price-asc",   label: "Price (low → high)" },
  { value: "price-desc",  label: "Price (high → low)" },
  { value: "hp-desc",     label: "Horsepower (high → low)" },
  { value: "hp-asc",      label: "Horsepower (low → high)" },
  { value: "mpg-desc",    label: "Combined MPG (high → low)" },
  { value: "mpg-asc",     label: "Combined MPG (low → high)" },
  { value: "0-60-asc",    label: "0–60 (quickest first)" },
  { value: "0-60-desc",   label: "0–60 (slowest first)" },
];

function sortKeyFor(modelRef, sort) {
  const base = baseTrim(modelRef.model);
  if (!base) return null;
  switch (sort) {
    case "price-asc":
    case "price-desc": {
      const v = (base.msrp_base ?? null) != null && (base.destination_fee ?? null) != null
        ? base.msrp_base + base.destination_fee
        : base.msrp_base;
      return v;
    }
    case "hp-asc":
    case "hp-desc":
      return base.powertrain && base.powertrain.horsepower_hp;
    case "mpg-asc":
    case "mpg-desc":
      return base.fuel_economy && base.fuel_economy.combined_mpg;
    case "0-60-asc":
    case "0-60-desc":
      return base.performance && base.performance.zero_to_60_sec;
    default:
      return null;
  }
}

function sortModelRefs(refs, sort) {
  const dir = sort.endsWith("-desc") ? "desc" : "asc";
  const sorted = refs.slice().sort((a, b) => {
    const va = safeSortVal(sortKeyFor(a, sort), dir);
    const vb = safeSortVal(sortKeyFor(b, sort), dir);
    return dir === "asc" ? va - vb : vb - va;
  });
  return sorted;
}

function powertrainsInModel(model) {
  const set = new Set();
  for (const t of (model.trims || [])) {
    if (t.powertrain && t.powertrain.type) set.add(t.powertrain.type);
  }
  return set;
}

function applyFilters(refs, filters) {
  return refs.filter(({ model }) => {
    if (filters.body && filters.body.size > 0 && !filters.body.has(model.body_style)) return false;
    if (filters.powertrain && filters.powertrain.size > 0) {
      const have = powertrainsInModel(model);
      let any = false;
      for (const p of filters.powertrain) if (have.has(p)) { any = true; break; }
      if (!any) return false;
    }
    return true;
  });
}

function baseTrim(model) {
  return (model.trims || []).find(t => t.is_base_trim) || (model.trims || [])[0] || null;
}

/* ============================================================
   ROUTING DISPATCH
   ============================================================ */
async function route() {
  const { view, params } = parseHash();
  State.view = view;
  State.params = params;

  // close any open dropdowns
  $$(".dropdown").forEach(d => d.setAttribute("data-open", "false"));

  const main = $("#main");
  main.innerHTML = "";
  main.classList.remove("view-enter");
  $("#sidenav").hidden = true;

  // Soft loading indicator: shows after 150ms if the view isn't ready yet.
  // It's appended directly to body so it does NOT interfere with the main
  // content tree (renderHome / renderBrand append to main as they progress).
  const loader = el("div", { class: "view-loading", "aria-live": "polite" },
    el("span", { class: "view-loading-spinner", "aria-hidden": "true" }),
    el("span", null, "Loading…"));
  const loadingTimer = setTimeout(() => document.body.appendChild(loader), 150);

  try {
    if (view === "home")         await renderHome(main);
    else if (view === "brand")   await renderBrand(main, params);
    else if (view === "body")    await renderBody(main, params);
    else if (view === "compare") await renderCompare(main, params);
    else                          await renderHome(main);
  } catch (err) {
    console.error(err);
    main.appendChild(el("div", { class: "view-error" },
      el("h2", null, "Could not load this view"),
      el("p", null, err.message)));
  } finally {
    clearTimeout(loadingTimer);
    if (loader.parentNode) loader.parentNode.removeChild(loader);
  }

  // Trigger the entrance animation by re-adding the class after layout.
  requestAnimationFrame(() => main.classList.add("view-enter"));
  window.scrollTo({ top: 0, behavior: "instant" });
}

/* ============================================================
   HOME VIEW
   ============================================================ */
const BODY_ICONS = {
  "sedan":            `<path d="M3 17h2m12 0h4M3 17l2-5 5-1h7l3 2 2 4M3 17v2m18-2v2M7.5 17a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zm6 0a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0z"/>`,
  "coupe":            `<path d="M3 17h2m12 0h4M3 17l2-4 4-2h5l4 3 3 3M3 17v2m18-2v2M7.5 17a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zm6 0a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0z"/>`,
  "hatchback":        `<path d="M3 17h2m12 0h4M3 17l2-5 5-1h6l4 6M3 17v2m18-2v2M7.5 17a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zm6 0a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0z"/>`,
  "wagon":            `<path d="M3 17h2m12 0h4M3 17l2-5 5-1h11l-1 6M3 17v2m18-2v2M7.5 17a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zm6 0a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0z"/>`,
  "convertible":      `<path d="M3 17h2m12 0h4M3 17l2-5 5-1h7l3 2 2 4M5 12c0-1 2-1.5 5-1.5h7M3 17v2m18-2v2M7.5 17a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zm6 0a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0z" stroke-dasharray="1.4 1.6"/>`,
  "suv-compact":      `<path d="M3 17h2m12 0h4M3 17l1-5 4-2h8l3 2 2 5M3 17v2m18-2v2M7.5 17a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zm6 0a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0z"/>`,
  "suv-midsize":      `<path d="M2 17h2m12 0h4M2 17l1-6 5-2h9l3 2 1 6M2 17v2m18-2v2M6.5 17a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zm6 0a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0z"/>`,
  "suv-3row":         `<path d="M2 17h2m12 0h4M2 17l1-6 6-2h10l3 2 1 6M2 17v2m18-2v2M6.5 17a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zm6 0a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zM10 11v5M14 11v5"/>`,
  "suv-full-size":    `<path d="M2 17h2m12 0h4M2 17l1-7 7-2h10l2 3 1 6M2 17v2m18-2v2M6.5 17a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zm6 0a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0z"/>`,
  "pickup-midsize":   `<path d="M2 17h2m12 0h4M2 17l1-4 5-2h6l1 4h7v2M2 17v2m18-2v2M6.5 17a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zm6 0a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zM15 11v6"/>`,
  "pickup-full-size": `<path d="M2 17h2m12 0h4M2 17l1-5 5-2h7l1 5h6v2M2 17v2m18-2v2M6.5 17a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zm6 0a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zM15 10v7"/>`,
  "minivan":          `<path d="M3 17h2m12 0h4M3 17l1-7 5-1h10l1 8M3 17v2m18-2v2M7.5 17a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zm6 0a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0z"/>`,
  "sports-car":       `<path d="M3 17h2m12 0h4M3 17l3-3 5-1h6l3 1 1 3M3 17v2m18-2v2M7.5 17a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zm6 0a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0z"/>`,
};

function bodyIconSvg(slug) {
  const path = BODY_ICONS[slug] || BODY_ICONS["sedan"];
  return `<svg class="body-icon" viewBox="0 0 24 20" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

async function renderHome(main) {
  const mani = await loadManifest();
  const all = await loadAllBrands();

  const totalModels = mani.brands.reduce((s, b) => s + (b.model_count || 0), 0);
  const totalTrims = all.reduce((s, br) => s + br.models.reduce((sm, m) => sm + (m.trims || []).length, 0), 0);
  const brandCount = mani.brands.length;

  // Hero
  main.appendChild(el("section", { class: "home-hero" },
    el("span", { class: "eyebrow" }, "Car Catalog"),
    el("h1", null, "Every current-model-year vehicle, on one page per brand."),
    el("p", { class: "home-lead" },
      `${brandCount} brands · ${totalModels} models · ${totalTrims.toLocaleString()} trims. ` +
      `Cross-brand comparison. Sourced specs. Real manufacturer photography.`)
  ));

  // Compute per-brand price ranges from already-loaded data.
  const brandStats = Object.create(null);
  for (const br of all) {
    let lo = Infinity, hi = 0, hasPrice = false;
    for (const m of br.models) {
      const base = baseTrim(m);
      if (base && base.msrp_base != null) {
        hasPrice = true;
        lo = Math.min(lo, base.msrp_base);
        hi = Math.max(hi, base.msrp_base);
      }
    }
    brandStats[br.brand_slug] = { hasPrice, lo, hi, modelCount: br.models.length };
  }

  // Brand grid
  const brandsSection = el("section", { class: "home-section" },
    el("h2", null, "Browse by brand"),
    el("p", { class: "section-lead" }, "One brand · one long-scroll page · every current model in ascending price order.")
  );
  const brandGrid = el("div", { class: "brand-card-grid" });
  for (const b of mani.brands) {
    const stat = brandStats[b.slug] || { hasPrice: false, modelCount: b.model_count };
    const priceLine = stat.hasPrice
      ? `${formatPriceCompact(stat.lo)}${stat.lo !== stat.hi ? ` – ${formatPriceCompact(stat.hi)}` : ""}`
      : "Price on request";
    brandGrid.appendChild(el("a", { class: "brand-card", href: `#brand=${b.slug}` },
      el("div", { class: "brand-card-name" }, b.display_name),
      el("div", { class: "brand-card-stats" },
        el("span", { class: "brand-card-count" }, `${stat.modelCount} ${stat.modelCount === 1 ? "model" : "models"}`),
        el("span", { class: "brand-card-prices" }, priceLine)
      )
    ));
  }
  if (mani.brands.length === 0) {
    brandGrid.appendChild(el("div", { class: "brand-card" }, "No brands yet. Run Phase 1."));
  }
  brandsSection.appendChild(brandGrid);
  main.appendChild(brandsSection);

  // Body-style grid with line-art icons
  const presentBodies = new Set();
  for (const br of all) for (const m of br.models) presentBodies.add(m.body_style);
  const bodiesSection = el("section", { class: "home-section" },
    el("h2", null, "Browse by body style"),
    el("p", { class: "section-lead" }, "Cross-brand comparison. All midsize SUVs side by side, every sports car together, etc.")
  );
  const bodyGrid = el("div", { class: "body-card-grid" });
  for (const bs of BODY_STYLES) {
    if (!presentBodies.has(bs.slug)) continue;
    const count = all.reduce((s, br) => s + br.models.filter(m => m.body_style === bs.slug).length, 0);
    const card = el("a", { class: "body-card", href: `#body=${bs.slug}` });
    const iconHolder = el("div", { class: "body-card-icon" });
    iconHolder.innerHTML = bodyIconSvg(bs.slug);
    card.appendChild(iconHolder);
    card.appendChild(el("div", { class: "body-card-label" }, bs.label));
    card.appendChild(el("div", { class: "body-card-count" }, `${count} ${count === 1 ? "model" : "models"}`));
    bodyGrid.appendChild(card);
  }
  bodiesSection.appendChild(bodyGrid);
  main.appendChild(bodiesSection);

  // Compare promo
  main.appendChild(el("section", { class: "home-section home-compare-promo" },
    el("h2", null, "Compare side-by-side"),
    el("p", { class: "section-lead" }, "Pick two or three models — or specific trims — to see their specs aligned column-by-column."),
    el("a", { class: "home-compare-link", href: "#compare=" }, "Open compare", el("span", { class: "arrow", "aria-hidden": "true" }, " →"))
  ));
}

function formatPriceCompact(n) {
  if (n == null || isNaN(n)) return "—";
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000)    return `$${Math.round(n / 1000)}k`;
  return `$${n}`;
}

/* ============================================================
   BRAND VIEW
   ============================================================ */
async function renderBrand(main, params) {
  const slug = params.brand;
  let brand;
  try { brand = await loadBrand(slug); }
  catch {
    main.appendChild(el("div", { class: "view-error" },
      el("h2", null, `Brand "${slug}" not found`),
      el("p", null, "The brand data file may have been removed or renamed. Try browsing from the homepage."),
      el("p", null, el("a", { href: "#", class: "view-error-link" }, "← Back to home"))
    ));
    return;
  }

  const sort = params.sort || "price-asc";
  const group = params.group || "off";
  const bodyFilter = new Set((params["filter-body"] || "").split(",").filter(Boolean));
  const ptFilter = new Set((params["filter-pt"] || "").split(",").filter(Boolean));

  let refs = brand.models.map(m => ({ brand, model: m }));
  refs = applyFilters(refs, { body: bodyFilter, powertrain: ptFilter });
  refs = sortModelRefs(refs, sort);

  // header
  const prices = brand.models
    .map(m => baseTrim(m))
    .filter(Boolean)
    .map(t => (t.msrp_base ?? 0));
  const minP = Math.min(...prices), maxP = Math.max(...prices);
  const hybrids = brand.models.filter(m => (m.trims || []).some(t => t.powertrain && t.powertrain.type === "hybrid")).length;
  const evs     = brand.models.filter(m => (m.trims || []).some(t => t.powertrain && t.powertrain.type === "ev")).length;
  const phevs   = brand.models.filter(m => (m.trims || []).some(t => t.powertrain && t.powertrain.type === "phev")).length;

  main.appendChild(el("section", { class: "view-header" },
    el("span", { class: "view-eyebrow" }, "Brand"),
    el("h1", null, brand.brand),
    el("div", { class: "view-stats" },
      el("span", null, el("strong", null, brand.models.length),
        el("span", { class: "stat-label" }, brand.models.length === 1 ? "model" : "models")),
      el("span", null, el("strong", null, `${formatPrice(minP)} – ${formatPrice(maxP)}`),
        el("span", { class: "stat-label" }, "base MSRP")),
      hybrids > 0 ? el("span", null, el("strong", null, hybrids),
        el("span", { class: "stat-label" }, "hybrid offering" + (hybrids === 1 ? "" : "s"))) : null,
      phevs > 0 ? el("span", null, el("strong", null, phevs),
        el("span", { class: "stat-label" }, "PHEV")) : null,
      evs > 0 ? el("span", null, el("strong", null, evs),
        el("span", { class: "stat-label" }, "EV")) : null,
      el("span", null, el("span", { class: "stat-label" }, "researched"),
        el("strong", null, brand.researched_at || "—"))
    )
  ));

  // controls
  main.appendChild(buildControls({
    sort, group, bodyFilter, ptFilter,
    bodyOptions: Array.from(new Set(brand.models.map(m => m.body_style))),
    onChange: nextParams => setHash({ brand: slug, ...nextParams }, { replace: true }) || route(),
    showBodyFilter: true,
    showGroup: true,
    onApply: nextParams => setHash({ brand: slug, ...nextParams }),
  }));

  // Build the display structure so sidenav order and main-content order are
  // guaranteed to match (esp. when group=body re-clusters refs).
  let groups; // [{ label, refs }] — label is null when not grouping
  if (group === "body") {
    const byBody = new Map();
    for (const r of refs) {
      const k = r.model.body_style;
      if (!byBody.has(k)) byBody.set(k, []);
      byBody.get(k).push(r);
    }
    groups = Array.from(byBody, ([bs, list]) => ({ label: bodyLabel(bs), refs: list }));
  } else {
    groups = [{ label: null, refs }];
  }
  const displayOrder = groups.flatMap(g => g.refs);

  // sidenav — same order as main
  renderSidenav(displayOrder, "brand");

  // model sections
  const wrapper = el("div", { class: "model-list" });
  if (refs.length === 0) {
    wrapper.appendChild(renderFilterEmptyState(() => setHash({ brand: slug })));
  }
  for (const g of groups) {
    if (g.label) {
      wrapper.appendChild(el("h2", { class: "group-divider" }, g.label));
    }
    for (const r of g.refs) {
      wrapper.appendChild(renderModelSection(r, {
        showBrand: false,
        brandPosition: brandPositionLabel(brand, r.model)
      }));
    }
  }
  main.appendChild(wrapper);

  // deep-link to a specific model on this brand page
  if (params.model) {
    requestAnimationFrame(() => {
      const target = document.getElementById(`model-${params.model}`);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  initSidenavObserver();
}

function renderFilterEmptyState(clearAction) {
  return el("div", { class: "filter-empty" },
    el("h2", null, "No models match these filters."),
    el("p", null, "Try removing a filter or two to see more results."),
    el("button", {
      type: "button",
      class: "filter-empty-action",
      onclick: () => clearAction()
    }, "Clear all filters")
  );
}

function brandPositionLabel(brand, model) {
  // rank by msrp_base
  const sorted = brand.models.slice().sort((a, b) => {
    const ba = baseTrim(a)?.msrp_base ?? Infinity;
    const bb = baseTrim(b)?.msrp_base ?? Infinity;
    return ba - bb;
  });
  const rank = sorted.findIndex(m => m.model_slug === model.model_slug) + 1;
  if (rank === 1)                 return `Cheapest model in ${brand.brand}'s lineup`;
  if (rank === sorted.length)     return `Most expensive model in ${brand.brand}'s lineup`;
  return `${ordinal(rank)} cheapest model in ${brand.brand}'s lineup`;
}

/* ============================================================
   BODY-STYLE VIEW
   ============================================================ */
async function renderBody(main, params) {
  const body = params.body;
  const all = await loadAllBrands();
  const refs = [];
  for (const brand of all) {
    for (const model of brand.models) {
      if (model.body_style === body) refs.push({ brand, model });
    }
  }
  const sort = params.sort || "price-asc";
  const ptFilter = new Set((params["filter-pt"] || "").split(",").filter(Boolean));

  let filtered = applyFilters(refs, { powertrain: ptFilter });
  filtered = sortModelRefs(filtered, sort);

  const brandsInView = new Set(refs.map(r => r.brand.brand_slug));

  main.appendChild(el("section", { class: "view-header" },
    el("span", { class: "view-eyebrow" }, "Body style"),
    el("h1", null, `All ${bodyLabel(body).toLowerCase()}s`),
    el("div", { class: "view-stats" },
      el("span", null, el("strong", null, refs.length),
        el("span", { class: "stat-label" }, refs.length === 1 ? "model" : "models")),
      el("span", null, el("span", { class: "stat-label" }, "across"),
        el("strong", null, brandsInView.size),
        el("span", { class: "stat-label" }, "brand" + (brandsInView.size === 1 ? "" : "s")))
    )
  ));

  main.appendChild(buildControls({
    sort, ptFilter,
    onApply: nextParams => setHash({ body, ...nextParams }),
    showBodyFilter: false,
    showGroup: false,
  }));

  // sidenav — same order as main
  renderSidenav(filtered, "body");

  const wrapper = el("div", { class: "model-list" });
  if (filtered.length === 0) {
    wrapper.appendChild(renderFilterEmptyState(() => setHash({ body })));
  }
  for (const r of filtered) {
    wrapper.appendChild(renderModelSection(r, {
      showBrand: true,
      anchorId: `model-${r.brand.brand_slug}-${r.model.model_slug}`,
    }));
  }
  main.appendChild(wrapper);

  initSidenavObserver();
}

/* ============================================================
   CONTROLS (sort/filter/group)
   ============================================================ */
function buildControls({ sort, group, bodyFilter, ptFilter, bodyOptions = BODY_STYLES.map(b => b.slug), showBodyFilter, showGroup, onApply }) {
  const controls = el("div", { class: "controls" });

  // sort
  const sortSel = el("select", {
    "aria-label": "Sort",
    onchange: e => onApply(updateParam("sort", e.target.value))
  });
  for (const o of SORT_OPTIONS) {
    const opt = el("option", { value: o.value }, o.label);
    if (o.value === sort) opt.selected = true;
    sortSel.appendChild(opt);
  }
  controls.appendChild(el("label", null, "Sort", sortSel));

  // group toggle
  if (showGroup) {
    const groupSel = el("select", {
      "aria-label": "Group",
      onchange: e => onApply(updateParam("group", e.target.value === "off" ? null : e.target.value))
    });
    for (const opt of [["off", "no grouping"], ["body", "group by body style"]]) {
      const o = el("option", { value: opt[0] }, opt[1]);
      if (opt[0] === group) o.selected = true;
      groupSel.appendChild(o);
    }
    controls.appendChild(el("label", null, "View", groupSel));
  }

  // body filter
  if (showBodyFilter) {
    const chips = el("div", { class: "chips" });
    for (const bs of bodyOptions) {
      const active = bodyFilter && bodyFilter.has(bs);
      const chip = el("button", {
        type: "button",
        class: "chip",
        "aria-pressed": active ? "true" : "false",
        onclick: () => {
          const next = new Set(bodyFilter);
          if (next.has(bs)) next.delete(bs); else next.add(bs);
          onApply(updateParam("filter-body", Array.from(next).join(",") || null));
        }
      }, bodyLabel(bs));
      chips.appendChild(chip);
    }
    controls.appendChild(el("label", null, "Body", chips));
  }

  // powertrain filter
  const ptChips = el("div", { class: "chips" });
  for (const p of ["ice", "hybrid", "phev", "ev", "fcev"]) {
    const active = ptFilter && ptFilter.has(p);
    const chip = el("button", {
      type: "button",
      class: "chip",
      "aria-pressed": active ? "true" : "false",
      onclick: () => {
        const next = new Set(ptFilter);
        if (next.has(p)) next.delete(p); else next.add(p);
        onApply(updateParam("filter-pt", Array.from(next).join(",") || null));
      }
    }, p.toUpperCase());
    ptChips.appendChild(chip);
  }
  controls.appendChild(el("label", null, "Powertrain", ptChips));

  return controls;
}

function updateParam(name, value) {
  const cur = { ...State.params };
  if (value == null || value === "") delete cur[name]; else cur[name] = value;
  // strip view-route params so caller can supply them
  delete cur.brand; delete cur.body; delete cur.compare;
  return cur;
}

/* ============================================================
   MODEL SECTION RENDER
   ============================================================ */
function renderModelSection({ brand, model }, opts = {}) {
  const base = baseTrim(model);
  const anchorId = opts.anchorId || `model-${model.model_slug}`;
  const section = el("section", { class: "model-section", id: anchorId });

  // head — single column, typographic-first
  const head = el("div", { class: "model-head" });
  const titleBlock = el("div", { class: "model-title-block" });
  const titleLine = el("h2", { class: "model-title" });
  if (opts.showBrand) titleLine.appendChild(el("span", { class: "brand-prefix" }, brand.brand));
  titleLine.appendChild(el("span", { class: "model-name" }, model.model));
  if (model.body_style) titleLine.appendChild(el("span", { class: "body-badge" }, bodyLabel(model.body_style)));
  titleBlock.appendChild(titleLine);

  if (model.generation_context) {
    titleBlock.appendChild(el("p", { class: "gen-context" }, model.generation_context));
  }

  const metaRow = el("div", { class: "model-meta-row" });
  metaRow.appendChild(el("div", { class: "price-range" },
    formatRange(model.msrp_range && model.msrp_range.low, model.msrp_range && model.msrp_range.high),
    el("span", { class: "price-range-label" }, "MSRP range")
  ));
  if (opts.brandPosition) {
    metaRow.appendChild(el("div", { class: "model-position" }, opts.brandPosition));
  }
  titleBlock.appendChild(metaRow);

  if (model.model_summary) {
    titleBlock.appendChild(el("p", { class: "model-summary" }, model.model_summary));
  }
  head.appendChild(titleBlock);

  // hero image
  const heroImg = pickImage(base, "front_three_quarter") || pickFirstImage(model);
  const heroHolder = el("div", { class: "hero-wrap" });
  const altText = `${brand.brand} ${model.model} — front 3/4`;
  if (heroImg) heroHolder.appendChild(imageWithFallback(heroImg, altText));
  else heroHolder.appendChild(placeholderImage(altText));
  const heroNode = heroHolder.firstChild;
  if (heroNode && heroNode.tagName === "IMG") heroNode.classList.add("hero-img");
  head.appendChild(heroHolder);
  section.appendChild(head);

  // quick stats
  if (base) {
    const pt = base.powertrain || {};
    const fe = base.fuel_economy || {};
    const perf = base.performance || {};
    section.appendChild(el("div", { class: "quick-stats" },
      qStat("Horsepower",  pt.horsepower_hp != null ? `${pt.horsepower_hp}` : null, "hp"),
      qStat("Combined MPG", fe.combined_mpg != null ? `${fe.combined_mpg}` : (base.ev_specifics?.mpge_combined != null ? `${base.ev_specifics.mpge_combined}` : null), fe.combined_mpg != null ? "mpg" : "MPGe"),
      qStat("0–60",         perf.zero_to_60_sec != null ? perf.zero_to_60_sec.toFixed(1) : null, "s"),
      qStat("Drivetrain",   pt.drivetrain || null, ""),
      qStat("Seats",        base.capacity?.seats != null ? `${base.capacity.seats}` : null, "")
    ));
  }

  // spec collapsibles
  if (base) {
    section.appendChild(specBlockPowertrain(model, base));
    section.appendChild(specBlockPerformance(base));
    section.appendChild(specBlockDimensions(base));
    section.appendChild(specBlockCapacityWheels(base));
    section.appendChild(specBlockSafety(base));
    section.appendChild(specBlockFeatures(base));
    section.appendChild(specBlockWarranty(base));
  }

  // trim table
  section.appendChild(renderTrimTable(model));

  // image gallery (one set per trim_family using first image set we find)
  const galleryImages = collectGalleryImages(model);
  if (galleryImages.length > 0) {
    const gallery = el("div", { class: "gallery" });
    for (const img of galleryImages.slice(0, 8)) {
      const angleLabel = img.angle ? img.angle.replace(/_/g, " ") : "image";
      const thumb = el("button", {
        type: "button",
        class: "thumb",
        "aria-label": `Open ${angleLabel} image`,
        onclick: () => openImageModal(img, `${brand.brand} ${model.model} — ${angleLabel}`)
      });
      thumb.appendChild(imageWithFallback(img, `${brand.brand} ${model.model} — ${angleLabel}`));
      thumb.appendChild(el("span", { class: "thumb-caption" }, angleLabel));
      gallery.appendChild(thumb);
    }
    section.appendChild(gallery);
  }

  // reviews block
  section.appendChild(renderReviewsBlock(model));

  // model-level notes
  if (model.notes) {
    section.appendChild(el("div", { class: "notes-callout" },
      el("strong", null, "Research notes: "),
      model.notes
    ));
  }

  // footer
  section.appendChild(el("div", { class: "model-foot" },
    el("a", { href: "#", onclick: e => { e.preventDefault(); openSourcesModal(brand, model); } },
      "Data sources"),
    el("a", { href: `data/${brand.brand_slug}.json`, target: "_blank", rel: "noopener" },
      "Open raw JSON")
  ));

  return section;
}

function qStat(label, value, suffix) {
  const numNode = value == null
    ? el("span", { class: "num null-val" }, "—")
    : el("span", { class: "num" }, value, suffix ? el("span", { class: "num-suffix" }, ` ${suffix}`) : null);
  return el("div", { class: "quick-stat" },
    numNode,
    el("span", { class: "lbl" }, label)
  );
}

/* ============================================================
   SPEC BLOCKS (collapsible)
   ============================================================ */
function specBlock(title, contentNodes) {
  const det = el("details", { class: "spec-block" },
    el("summary", null, title),
    el("div", { class: "spec-body" }, ...contentNodes)
  );
  return det;
}

function specRow(label, value) {
  return el("tr", null,
    el("th", null, label),
    el("td", { class: "val" }, value == null ? nullSpan() : (typeof value === "string" || typeof value === "number" ? String(value) : value))
  );
}

function specBlockPowertrain(model, base) {
  const pt = base.powertrain || {};
  const ev = base.ev_specifics;
  const rows = el("tbody", null,
    specRow("Type",          pt.type ? pt.type.toUpperCase() : null),
    specRow("Engine",         pt.engine_displacement_l ? `${pt.engine_displacement_l}L ${pt.engine_config || ""}` : (pt.type === "ev" ? "Electric — n/a" : null)),
    specRow("Aspiration",    pt.aspiration ? pt.aspiration.replace(/_/g, " ") : null),
    specRow("Horsepower",    formatHp(pt.horsepower_hp, pt.horsepower_source)),
    specRow("Torque",        pt.torque_lb_ft != null ? `${pt.torque_lb_ft} lb-ft` : null),
    specRow("Transmission",  pt.transmission || null),
    specRow("Drivetrain",    pt.drivetrain || null),
  );
  const nodes = [el("table", { class: "spec-table" }, rows)];

  if (ev) {
    nodes.push(el("h4", { class: "spec-subhead" }, "EV / Hybrid specifics"));
    const evRows = el("tbody", null,
      specRow("Battery capacity",       ev.battery_capacity_kwh != null ? `${ev.battery_capacity_kwh} kWh` : null),
      specRow("Usable capacity",        ev.battery_usable_kwh != null ? `${ev.battery_usable_kwh} kWh` : null),
      specRow("Electric range",         ev.electric_range_mi != null ? `${ev.electric_range_mi} mi` : null),
      specRow("Total range",            ev.total_range_mi != null ? `${ev.total_range_mi} mi` : null),
      specRow("DC fast charge peak",    ev.dc_fast_charge_peak_kw != null ? `${ev.dc_fast_charge_peak_kw} kW` : null),
      specRow("DC fast charge 10→80%",  ev.dc_fast_charge_10_to_80_min != null ? `${ev.dc_fast_charge_10_to_80_min} min` : null),
      specRow("AC charge",              ev.ac_charge_kw != null ? `${ev.ac_charge_kw} kW` : null),
      specRow("MPGe (combined)",        ev.mpge_combined != null ? `${ev.mpge_combined}` : null),
      specRow("Plug type",              ev.plug_type || null)
    );
    nodes.push(el("table", { class: "spec-table" }, evRows));
  }

  // trim variations
  const variants = trimPowertrainVariations(model);
  if (variants.length > 1) {
    nodes.push(el("h4", { class: "spec-subhead" }, "Trim variations"));
    const ul = el("ul", { class: "spec-variant-list" });
    for (const v of variants) ul.appendChild(el("li", null, v));
    nodes.push(ul);
  }

  return specBlock("Powertrain", nodes);
}

function trimPowertrainVariations(model) {
  const map = new Map();
  for (const t of (model.trims || [])) {
    const pt = t.powertrain;
    if (!pt) continue;
    const sig = JSON.stringify([pt.type, pt.horsepower_hp, pt.torque_lb_ft, pt.drivetrain, pt.transmission]);
    if (!map.has(sig)) map.set(sig, { trims: [], pt });
    map.get(sig).trims.push(t.trim);
  }
  if (map.size <= 1) return [];
  return Array.from(map.values()).map(v =>
    `${v.trims.join(", ")}: ${v.pt.type?.toUpperCase() || "?"} · ${v.pt.horsepower_hp ?? "—"} hp · ${v.pt.drivetrain || "—"}`
  );
}

function specBlockPerformance(base) {
  const p = base.performance || {};
  const rows = el("tbody", null,
    specRow("0–60 mph",       p.zero_to_60_sec != null ? formatZero60(p.zero_to_60_sec, p.zero_to_60_source) : null),
    specRow("Top speed",       p.top_speed_mph != null ? `${p.top_speed_mph} mph` : null),
    specRow("Towing capacity", p.towing_capacity_lb != null ? `${p.towing_capacity_lb.toLocaleString()} lb` : null),
    specRow("Payload",         p.payload_capacity_lb != null ? `${p.payload_capacity_lb.toLocaleString()} lb` : null)
  );
  return specBlock("Performance", [el("table", { class: "spec-table" }, rows)]);
}

function specBlockDimensions(base) {
  const d = base.dimensions || {};
  const cv = d.cargo_volume_cuft || {};
  const rows = el("tbody", null,
    specRow("Length",            d.length_in != null ? `${d.length_in}″` : null),
    specRow("Width",             d.width_in != null ? `${d.width_in}″` : null),
    specRow("Height",            d.height_in != null ? `${d.height_in}″` : null),
    specRow("Wheelbase",         d.wheelbase_in != null ? `${d.wheelbase_in}″` : null),
    specRow("Ground clearance",  d.ground_clearance_in != null ? `${d.ground_clearance_in}″` : null),
    specRow("Curb weight",       d.curb_weight_lb != null ? `${d.curb_weight_lb.toLocaleString()} lb` : null),
    specRow("Trunk (sedan)",     cv.trunk_cuft != null ? `${cv.trunk_cuft} cu ft` : null),
    specRow("Behind 2nd row",    cv.behind_2nd_row != null ? `${cv.behind_2nd_row} cu ft` : null),
    specRow("Behind 1st row",    cv.behind_1st_row != null ? `${cv.behind_1st_row} cu ft` : null),
    specRow("Max (seats folded)",cv.max_with_seats_folded != null ? `${cv.max_with_seats_folded} cu ft` : null),
    cv.bed_length_in != null ? specRow("Bed length", `${cv.bed_length_in}″`) : null,
    cv.bed_volume_cuft != null ? specRow("Bed volume", `${cv.bed_volume_cuft} cu ft`) : null
  );
  return specBlock("Dimensions", [el("table", { class: "spec-table" }, rows)]);
}

function specBlockCapacityWheels(base) {
  const cap = base.capacity || {};
  const wt = base.wheels_tires || {};
  const fe = base.fuel_economy || {};
  const rows = el("tbody", null,
    specRow("Seats",       cap.seats || null),
    specRow("Rows",        cap.rows || null),
    specRow("Wheel size",  wt.wheel_size_in != null ? `${wt.wheel_size_in}″` : null),
    specRow("Tires",       wt.tire_spec || null),
    specRow("Fuel type",   fe.fuel_type_required || null),
    specRow("Fuel tank",   fe.fuel_tank_gal != null ? `${fe.fuel_tank_gal} gal` : null),
    specRow("EPA MPG (city/hwy/combined)", formatMpg(fe.city_mpg, fe.highway_mpg, fe.combined_mpg)),
    specRow("Annual fuel cost",            fe.epa_annual_fuel_cost_usd != null ? formatPrice(fe.epa_annual_fuel_cost_usd) : null)
  );
  return specBlock("Capacity, wheels & fuel", [el("table", { class: "spec-table" }, rows)]);
}

function specBlockSafety(base) {
  const s = base.safety || {};
  const adas = s.standard_adas || {};
  const adasLabels = {
    automatic_emergency_braking: "Automatic emergency braking",
    lane_keeping_assist:         "Lane keeping assist",
    lane_departure_warning:      "Lane departure warning",
    adaptive_cruise_control:     "Adaptive cruise control",
    blind_spot_monitoring:       "Blind spot monitoring",
    rear_cross_traffic_alert:    "Rear cross traffic alert",
    rear_automatic_braking:      "Rear automatic braking",
    driver_attention_monitoring: "Driver attention monitoring",
  };
  const rows = el("tbody", null,
    specRow("NHTSA overall",   s.nhtsa_overall_rating != null ? `${s.nhtsa_overall_rating} ★ (${s.nhtsa_rating_year || "year n/a"})` : null),
    specRow("IIHS award",      s.iihs_top_safety_pick ? `${s.iihs_top_safety_pick} (${s.iihs_rating_year || "year n/a"})` : null)
  );
  const adasList = el("ul", { class: "adas-list" });
  for (const [k, label] of Object.entries(adasLabels)) {
    const yes = adas[k] === true;
    adasList.appendChild(el("li", { class: yes ? "yes" : "no" }, label));
  }
  return specBlock("Safety", [
    el("table", { class: "spec-table" }, rows),
    el("h4", { class: "spec-subhead" }, "Standard driver assists (base trim)"),
    adasList
  ]);
}

function specBlockFeatures(base) {
  const f = base.features || {};
  const dl = el("dl", { class: "feature-grid" });
  function row(label, value) {
    dl.appendChild(el("dt", null, label));
    dl.appendChild(el("dd", null, value == null ? nullSpan() : value));
  }
  row("Infotainment screen", f.infotainment_screen_in != null ? `${f.infotainment_screen_in}″` : null);
  row("Driver display",      f.driver_display_in != null ? `${f.driver_display_in}″` : null);
  row("Apple CarPlay",       f.apple_carplay || null);
  row("Android Auto",        f.android_auto || null);
  row("Sound system",        f.sound_system || null);
  row("Sunroof",             f.sunroof || null);
  row("Seat material",       f.seat_material ? f.seat_material.replace(/_/g, " ") : null);
  row("Heated front seats",  yesNo(f.heated_seats_front));
  row("Ventilated front seats", yesNo(f.ventilated_seats_front));
  row("Heated steering wheel",  yesNo(f.heated_steering_wheel));
  row("Power driver seat",   yesNo(f.power_seats_driver));
  row("Memory driver seat",  yesNo(f.memory_seats_driver));
  row("Wireless charging",   yesNo(f.wireless_phone_charging));
  row("Head-up display",     yesNo(f.head_up_display));
  row("Remote start",        yesNo(f.remote_start));
  const nodes = [dl];
  if (Array.isArray(f.notable_other) && f.notable_other.length > 0) {
    nodes.push(el("h4", { class: "spec-subhead" }, "Other features"));
    const ul = el("ul", { class: "feature-extras" });
    for (const x of f.notable_other) ul.appendChild(el("li", null, x));
    nodes.push(ul);
  }
  return specBlock("Features (base trim)", nodes);
}

function yesNo(v) {
  if (v === true) return "yes";
  if (v === false) return "no";
  return null;
}

function specBlockWarranty(base) {
  const w = base.warranty || {};
  const rows = el("tbody", null,
    specRow("Basic",         w.basic_yr_mi || null),
    specRow("Powertrain",     w.powertrain_yr_mi || null),
    specRow("Corrosion",      w.corrosion_yr_mi || null),
    specRow("Roadside",       w.roadside_yr_mi || null),
    specRow("EV battery",      w.ev_battery_yr_mi || null),
    specRow("Complimentary maintenance", w.complimentary_maintenance_yr_mi || null)
  );
  return specBlock("Warranty", [el("table", { class: "spec-table" }, rows)]);
}

/* ============================================================
   TRIM TABLE
   ============================================================ */
function renderTrimTable(model) {
  const wrap = el("div", { class: "trim-table-wrap" });
  const tbl = el("table", { class: "trim-table" });
  tbl.appendChild(el("thead", null,
    el("tr", null,
      el("th", null, "Trim"),
      el("th", null, "MSRP (base + dest)"),
      el("th", null, "Changes from base")
    )
  ));
  const tbody = el("tbody");
  for (const t of (model.trims || [])) {
    const tr = el("tr", { class: t.is_base_trim ? "is-base" : "" });
    tr.appendChild(el("td", null,
      el("strong", null, t.trim),
      t.is_base_trim ? el("span", { class: "body-badge", style: "margin-left:8px" }, "base") : null
    ));
    const priceCell = el("td", { class: "price" });
    if (t.msrp_base != null) {
      priceCell.appendChild(el("span", { class: "price-base" }, formatPrice(t.msrp_base)));
      if (t.destination_fee != null) {
        priceCell.appendChild(el("div", { class: "price-dest" },
          `+ ${formatPrice(t.destination_fee)} dest`));
      }
    } else {
      priceCell.appendChild(nullSpan());
    }
    tr.appendChild(priceCell);

    const changesCell = el("td");
    if (t.is_base_trim) {
      changesCell.appendChild(el("em", { class: "base-config-label" }, "Base configuration"));
    } else if (t.delta_from_base && Array.isArray(t.delta_from_base.changes)) {
      const ul = el("ul", { class: "delta" });
      for (const c of t.delta_from_base.changes) ul.appendChild(el("li", null, c));
      changesCell.appendChild(ul);
      if (t.delta_from_base.msrp_delta_usd != null) {
        changesCell.appendChild(el("div", { class: "price-dest", style: "margin-top:6px" },
          `+${formatPrice(t.delta_from_base.msrp_delta_usd)} over ${t.delta_from_base.from_trim_slug}`));
      }
    } else {
      changesCell.appendChild(nullSpan());
    }
    if (t.notes && t.notes.trim()) {
      changesCell.appendChild(el("div", { class: "notes-callout", style: "margin:8px 0 0" },
        el("strong", null, "Trim note: "), t.notes));
    }
    tr.appendChild(changesCell);
    tbody.appendChild(tr);
  }
  tbl.appendChild(tbody);
  wrap.appendChild(tbl);
  return wrap;
}

/* ============================================================
   IMAGES
   ============================================================ */
function pickImage(trim, angle) {
  if (!trim || !Array.isArray(trim.images)) return null;
  return trim.images.find(img => img.angle === angle) || null;
}

function pickFirstImage(model) {
  for (const t of (model.trims || [])) {
    if (Array.isArray(t.images) && t.images.length) return t.images[0];
  }
  return null;
}

function collectGalleryImages(model) {
  const out = [];
  const seenFamily = new Set();
  for (const t of (model.trims || [])) {
    const fam = t.trim_family || t.trim_slug;
    if (seenFamily.has(fam)) continue;
    seenFamily.add(fam);
    for (const img of (t.images || [])) out.push(img);
  }
  return out;
}

/* ============================================================
   REVIEWS BLOCK
   ============================================================ */
function renderReviewsBlock(model) {
  const wrap = el("div", { class: "reviews" });

  function reviewCard(eyebrow, scoreNode, summary, confidence, extraNode) {
    const head = el("div", { class: "review-card-head" },
      el("h4", null, eyebrow, confidenceBadge(confidence))
    );
    if (scoreNode) head.appendChild(scoreNode);
    const card = el("div", { class: `review-card confidence-${confidence || "unknown"}` }, head,
      el("p", { class: "summary-text" }, summary || nullSpan())
    );
    if (extraNode) card.appendChild(extraNode);
    return card;
  }

  // reliability
  const rel = model.reliability || {};
  wrap.appendChild(reviewCard(
    "Reliability",
    rel.jd_power_vds_score != null
      ? el("span", { class: "score" }, `${rel.jd_power_vds_score}`,
          el("span", { class: "score-suffix" }, " VDS"))
      : null,
    rel.summary, rel.confidence));

  // customer satisfaction
  const cs = model.customer_satisfaction || {};
  wrap.appendChild(reviewCard(
    "Customer satisfaction",
    cs.jd_power_apeal_score != null
      ? el("span", { class: "score" }, `${cs.jd_power_apeal_score}`,
          el("span", { class: "score-suffix" }, " APEAL"))
      : null,
    cs.summary, cs.confidence));

  // professional reviews
  const pr = model.professional_reviews || {};
  let prExtra = null;
  if (Array.isArray(pr.links) && pr.links.length > 0) {
    const ul = el("ul", { class: "review-links" });
    for (const link of pr.links) {
      ul.appendChild(el("li", null,
        el("a", { href: link.url, target: "_blank", rel: "noopener" }, link.publication || link.url),
        link.date ? el("span", { class: "review-link-date" }, ` · ${link.date}`) : null
      ));
    }
    prExtra = ul;
  }
  wrap.appendChild(reviewCard("Professional reviews", null, pr.summary, pr.confidence, prExtra));

  // owner reviews
  const ow = model.owner_reviews || {};
  const ownerScore = [];
  if (ow.edmunds_star_rating != null) ownerScore.push(`Edmunds ${ow.edmunds_star_rating}★${ow.edmunds_sample_size ? ` (n=${ow.edmunds_sample_size})` : ""}`);
  if (ow.kbb_star_rating != null) ownerScore.push(`KBB ${ow.kbb_star_rating}★${ow.kbb_sample_size ? ` (n=${ow.kbb_sample_size})` : ""}`);
  wrap.appendChild(reviewCard(
    "Owner reviews",
    ownerScore.length ? el("span", { class: "score score-small" }, ownerScore.join(" · ")) : null,
    ow.summary, ow.confidence));

  return wrap;
}

/* ============================================================
   COMPARE VIEW
   ============================================================ */
async function renderCompare(main, params) {
  const all = await loadAllBrands();
  if (all.length === 0) { main.appendChild(el("p", null, "No brand data loaded.")); return; }

  // parse compare param: brand:model[:trim], brand:model[:trim]
  const rawSlots = params.compare ? params.compare.split(",") : [];
  while (rawSlots.length < 3) rawSlots.push("");
  const slots = rawSlots.slice(0, 3);

  const slotData = slots.map(s => parseCompareSlot(s, all));

  main.appendChild(el("section", { class: "view-header" },
    el("span", { class: "view-eyebrow" }, "Side-by-side"),
    el("h1", null, "Compare"),
    el("div", { class: "view-stats" },
      el("span", null, "Pick two or three models — or specific trims — to align them column-by-column."))
  ));

  // slot cards (header row, doubles as picker)
  const slotGrid = el("div", { class: `compare-slots compare-slots-${slotData.filter(s => s.brand).length || 3}` });
  for (let i = 0; i < 3; i++) {
    slotGrid.appendChild(buildCompareSlotCard(i, slotData[i], all, slotData));
  }
  main.appendChild(slotGrid);

  // table
  const filled = slotData.filter(s => s.brand && s.model && s.trim);
  if (filled.length < 2) {
    main.appendChild(el("div", { class: "compare-empty" },
      el("h2", null, "Pick at least two trims to see a comparison."),
      el("p", null, "Choose a brand, model, and trim in two or three slots above. Differences will be highlighted automatically.")
    ));
    return;
  }
  main.appendChild(renderCompareTable(filled));
}

function parseCompareSlot(token, all) {
  if (!token) return { brand: null, model: null, trim: null };
  const [bSlug, mSlug, tSlug] = token.split(":");
  const brand = all.find(b => b.brand_slug === bSlug) || null;
  const model = brand ? brand.models.find(m => m.model_slug === mSlug) : null;
  let trim = null;
  if (model) {
    trim = tSlug ? model.trims.find(t => t.trim_slug === tSlug) : baseTrim(model);
  }
  return { brand, model, trim };
}

function buildCompareSlotCard(idx, slot, all, slotData) {
  const filled = slot.brand && slot.model && slot.trim;
  const wrap = el("div", { class: `compare-slot ${filled ? "filled" : "empty"}` });

  function applySlot(newSlot) {
    slotData[idx] = newSlot;
    const tokens = slotData.map(s => {
      if (!s.brand || !s.model) return "";
      const t = s.trim ? `:${s.trim.trim_slug}` : "";
      return `${s.brand.brand_slug}:${s.model.model_slug}${t}`;
    });
    setHash({ compare: tokens.join(",") });
  }

  // slot eyebrow (Slot 1 / Slot 2 / Slot 3) + clear button if filled
  const head = el("div", { class: "compare-slot-head" },
    el("span", { class: "eyebrow" }, `Slot ${idx + 1}`)
  );
  if (filled) {
    head.appendChild(el("button", {
      type: "button",
      class: "compare-slot-clear",
      "aria-label": `Clear slot ${idx + 1}`,
      onclick: () => applySlot({ brand: null, model: null, trim: null })
    }, "Clear"));
  }
  wrap.appendChild(head);

  // hero preview (only if a model is picked)
  if (slot.brand && slot.model) {
    const hero = pickImage(slot.trim, "front_three_quarter") || pickFirstImage(slot.model);
    const altText = `${slot.brand.brand} ${slot.model.model}`;
    const holder = el("div", { class: "compare-slot-hero" });
    if (hero) holder.appendChild(imageWithFallback(hero, altText));
    else holder.appendChild(placeholderImage(altText));
    const heroNode = holder.firstChild;
    if (heroNode && heroNode.tagName === "IMG") heroNode.classList.add("compare-hero-img");
    wrap.appendChild(holder);

    wrap.appendChild(el("div", { class: "compare-slot-title" },
      el("span", { class: "brand-prefix" }, slot.brand.brand),
      el("span", { class: "model-name" }, slot.model.model),
      slot.trim ? el("span", { class: "compare-slot-trim" }, slot.trim.trim) : null
    ));
    if (slot.trim && slot.trim.msrp_base != null) {
      wrap.appendChild(el("div", { class: "compare-slot-price" },
        formatPrice(slot.trim.msrp_base),
        slot.trim.destination_fee != null
          ? el("span", { class: "compare-slot-dest" }, ` + ${formatPrice(slot.trim.destination_fee)} dest`)
          : null
      ));
    }
  }

  // picker fields
  const pickers = el("div", { class: "compare-slot-pickers" });

  // brand select
  const bSel = el("select", {
    "aria-label": "Brand",
    onchange: e => {
      const brand = all.find(b => b.brand_slug === e.target.value) || null;
      applySlot({ brand, model: null, trim: null });
    }
  });
  bSel.appendChild(el("option", { value: "" }, "— Brand —"));
  for (const b of all) {
    const o = el("option", { value: b.brand_slug }, b.brand);
    if (slot.brand && slot.brand.brand_slug === b.brand_slug) o.selected = true;
    bSel.appendChild(o);
  }
  pickers.appendChild(bSel);

  // model select
  const mSel = el("select", {
    "aria-label": "Model",
    onchange: e => {
      const brand = slot.brand;
      const model = brand ? brand.models.find(m => m.model_slug === e.target.value) : null;
      applySlot({ brand, model, trim: model ? baseTrim(model) : null });
    }
  });
  mSel.appendChild(el("option", { value: "" }, "— Model —"));
  if (slot.brand) {
    for (const m of slot.brand.models) {
      const o = el("option", { value: m.model_slug }, m.model);
      if (slot.model && slot.model.model_slug === m.model_slug) o.selected = true;
      mSel.appendChild(o);
    }
  }
  mSel.disabled = !slot.brand;
  pickers.appendChild(mSel);

  // trim select
  const tSel = el("select", {
    "aria-label": "Trim",
    onchange: e => {
      const trim = slot.model.trims.find(t => t.trim_slug === e.target.value) || null;
      applySlot({ ...slot, trim });
    }
  });
  if (slot.model) {
    for (const t of slot.model.trims) {
      const o = el("option", { value: t.trim_slug }, t.trim);
      if (slot.trim && slot.trim.trim_slug === t.trim_slug) o.selected = true;
      tSel.appendChild(o);
    }
  } else {
    tSel.appendChild(el("option", { value: "" }, "— Trim —"));
  }
  tSel.disabled = !slot.model;
  pickers.appendChild(tSel);

  wrap.appendChild(pickers);
  return wrap;
}

function renderCompareTable(slots) {
  // resolve effective trims with fallbacks for null blocks
  const effective = slots.map(s => effectiveTrim(s.model, s.trim));

  const wrap = el("div", { class: "compare-table-wrap" });
  const tbl = el("table", { class: "compare-table" });
  const thead = el("thead", null,
    el("tr", null,
      el("th", { class: "row-label" }, "Spec"),
      ...slots.map(s => el("th", null,
        el("div", { class: "brand-prefix" }, s.brand.brand),
        el("div", { class: "model-name" }, s.model.model),
        el("div", { class: "compare-th-trim" }, s.trim.trim)
      ))
    )
  );
  tbl.appendChild(thead);

  const sections = [
    { title: "Price", rows: [
      ["MSRP base",      s => formatPrice(s.trim.msrp_base), { winner: "min" }],
      ["Destination",    s => formatPrice(s.trim.destination_fee)],
      ["Total starting", s => formatPrice((s.trim.msrp_base ?? null) != null && (s.trim.destination_fee ?? null) != null ? s.trim.msrp_base + s.trim.destination_fee : s.trim.msrp_base), { winner: "min" }],
    ]},
    { title: "Powertrain", rows: [
      ["Type",         (s, e) => (e.powertrain.type || "—").toUpperCase()],
      ["Engine",       (s, e) => e.powertrain.engine_displacement_l ? `${e.powertrain.engine_displacement_l}L ${e.powertrain.engine_config || ""}` : (e.powertrain.type === "ev" ? "Electric" : nullDash())],
      ["Horsepower",   (s, e) => e.powertrain.horsepower_hp != null ? `${e.powertrain.horsepower_hp} hp` : nullDash(), { winner: "max" }],
      ["Torque",       (s, e) => e.powertrain.torque_lb_ft != null ? `${e.powertrain.torque_lb_ft} lb-ft` : nullDash(), { winner: "max" }],
      ["Transmission", (s, e) => e.powertrain.transmission || nullDash()],
      ["Drivetrain",   (s, e) => e.powertrain.drivetrain || nullDash()],
    ]},
    { title: "Fuel / EV", rows: [
      ["MPG (city/hwy/comb)", (s, e) => formatMpg(e.fuel_economy.city_mpg, e.fuel_economy.highway_mpg, e.fuel_economy.combined_mpg)],
      ["MPGe",                (s, e) => e.ev_specifics && e.ev_specifics.mpge_combined != null ? `${e.ev_specifics.mpge_combined} MPGe` : nullDash(), { winner: "max" }],
      ["Range (mi)",          (s, e) => e.ev_specifics && e.ev_specifics.total_range_mi != null ? `${e.ev_specifics.total_range_mi}` : nullDash(), { winner: "max" }],
      ["DC fast charge peak", (s, e) => e.ev_specifics && e.ev_specifics.dc_fast_charge_peak_kw != null ? `${e.ev_specifics.dc_fast_charge_peak_kw} kW` : nullDash(), { winner: "max" }],
      ["Fuel tank (gal)",     (s, e) => e.fuel_economy.fuel_tank_gal != null ? `${e.fuel_economy.fuel_tank_gal}` : nullDash()],
      ["Fuel type",           (s, e) => e.fuel_economy.fuel_type_required || nullDash()],
    ]},
    { title: "Performance", rows: [
      ["0–60 (s)",     (s, e) => e.performance.zero_to_60_sec != null ? `${e.performance.zero_to_60_sec.toFixed(1)}` : nullDash(), { winner: "min" }],
      ["Top speed",    (s, e) => e.performance.top_speed_mph != null ? `${e.performance.top_speed_mph} mph` : nullDash(), { winner: "max" }],
      ["Towing",       (s, e) => e.performance.towing_capacity_lb != null ? `${e.performance.towing_capacity_lb.toLocaleString()} lb` : nullDash(), { winner: "max" }],
    ]},
    { title: "Dimensions & cargo", rows: [
      ["Length",            (s, e) => e.dimensions.length_in != null ? `${e.dimensions.length_in}″` : nullDash()],
      ["Width",             (s, e) => e.dimensions.width_in != null ? `${e.dimensions.width_in}″` : nullDash()],
      ["Height",            (s, e) => e.dimensions.height_in != null ? `${e.dimensions.height_in}″` : nullDash()],
      ["Wheelbase",         (s, e) => e.dimensions.wheelbase_in != null ? `${e.dimensions.wheelbase_in}″` : nullDash(), { winner: "max" }],
      ["Ground clearance",  (s, e) => e.dimensions.ground_clearance_in != null ? `${e.dimensions.ground_clearance_in}″` : nullDash(), { winner: "max" }],
      ["Curb weight",       (s, e) => e.dimensions.curb_weight_lb != null ? `${e.dimensions.curb_weight_lb.toLocaleString()} lb` : nullDash(), { winner: "min" }],
      ["Cargo (max)",       (s, e) => {
        const cv = e.dimensions.cargo_volume_cuft || {};
        return cv.max_with_seats_folded ?? cv.trunk_cuft ?? cv.behind_2nd_row ?? nullDash();
      }, { winner: "max" }],
      ["Seats",             (s, e) => e.capacity.seats != null ? `${e.capacity.seats}` : nullDash(), { winner: "max" }],
    ]},
    { title: "Safety", rows: [
      ["NHTSA overall", (s, e) => e.safety.nhtsa_overall_rating != null ? `${e.safety.nhtsa_overall_rating}★` : nullDash(), { winner: "max" }],
      ["IIHS",          (s, e) => e.safety.iihs_top_safety_pick || nullDash()],
    ]},
    { title: "Warranty", rows: [
      ["Basic",      (s, e) => e.warranty.basic_yr_mi || nullDash()],
      ["Powertrain", (s, e) => e.warranty.powertrain_yr_mi || nullDash()],
      ["EV battery", (s, e) => e.warranty.ev_battery_yr_mi || nullDash()],
    ]},
  ];

  for (const section of sections) {
    const tbody = el("tbody");
    tbody.appendChild(el("tr", { class: "section-row" },
      el("th", { colspan: slots.length + 1 }, section.title)
    ));
    for (const [label, fn, opts] of section.rows.map(r => r.length === 2 ? [...r, {}] : r)) {
      const values = slots.map((s, i) => {
        const e = effective[i];
        try { return fn(s, e); } catch { return nullDash(); }
      });
      const allSame = values.every(v => String(v) === String(values[0]));
      // Determine the "winner" — useful for numeric specs only.
      let winners = new Set();
      if (!allSame && opts.winner) {
        const numerics = values.map(v => {
          if (v == null || v === "—" || v === nullDash()) return null;
          const m = String(v).match(/-?\d+(?:\.\d+)?/);
          return m ? parseFloat(m[0]) : null;
        });
        const filtered = numerics.filter(n => n != null);
        if (filtered.length > 1) {
          const best = opts.winner === "max" ? Math.max(...filtered) : Math.min(...filtered);
          numerics.forEach((n, i) => { if (n === best) winners.add(i); });
        }
      }
      const tr = el("tr", null, el("th", { class: "row-label" }, label));
      for (let i = 0; i < values.length; i++) {
        const v = values[i];
        const classes = [];
        if (!allSame) classes.push("diff");
        if (winners.has(i)) classes.push("diff-winner");
        const td = el("td", classes.length ? { class: classes.join(" ") } : null);
        td.textContent = v == null ? "—" : String(v);
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    tbl.appendChild(tbody);
  }
  wrap.appendChild(tbl);
  return wrap;
}

function effectiveTrim(model, trim) {
  // for null spec blocks on step-up trims, fall back to base trim's value
  const base = baseTrim(model);
  function pick(key) {
    if (trim && trim[key] != null) return trim[key];
    return (base && base[key]) || {};
  }
  return {
    powertrain:    pick("powertrain"),
    ev_specifics:  pick("ev_specifics"),
    fuel_economy:  pick("fuel_economy"),
    performance:   pick("performance"),
    dimensions:    pick("dimensions"),
    capacity:      pick("capacity"),
    wheels_tires:  pick("wheels_tires"),
    safety:        pick("safety"),
    features:      pick("features"),
    warranty:      pick("warranty"),
  };
}

/* ============================================================
   MODAL
   ============================================================ */
function openImageModal(image, title) {
  const titleNode = $("#modal-title");
  const bodyNode  = $("#modal-body");
  titleNode.textContent = title;
  bodyNode.innerHTML = "";
  bodyNode.appendChild(imageWithFallback(image, title));
  bodyNode.appendChild(el("p", { class: "card-meta", style: "margin-top:10px" },
    image.credit ? `Credit: ${image.credit}` : "",
    image.url ? el("span", null, " · ", el("a", { href: image.url, target: "_blank", rel: "noopener" }, "source")) : null
  ));
  $("#modal").hidden = false;
}

function openSourcesModal(brand, model) {
  const titleNode = $("#modal-title");
  const bodyNode  = $("#modal-body");
  titleNode.textContent = `${brand.brand} ${model.model} — data sources`;
  bodyNode.innerHTML = "";

  const urls = [];
  for (const t of (model.trims || [])) {
    if (t.sources) {
      for (const v of Object.values(t.sources)) if (typeof v === "string") urls.push(v);
    }
  }
  // model-level review/reliability sources
  for (const blk of ["reliability", "customer_satisfaction", "owner_reviews"]) {
    const b = model[blk];
    if (b && Array.isArray(b.sources)) urls.push(...b.sources);
  }
  if (model.professional_reviews && Array.isArray(model.professional_reviews.links)) {
    for (const l of model.professional_reviews.links) if (l && l.url) urls.push(l.url);
  }
  const unique = dedupePreserveOrder(urls);

  if (unique.length === 0) {
    bodyNode.appendChild(el("p", null, "No source URLs recorded."));
  } else {
    const ul = el("ul");
    for (const u of unique) {
      ul.appendChild(el("li", null,
        el("a", { href: u, target: "_blank", rel: "noopener" }, u)
      ));
    }
    bodyNode.appendChild(ul);
  }
  $("#modal").hidden = false;
}

function initModal() {
  const m = $("#modal");
  for (const node of $$("[data-close-modal]", m)) {
    node.addEventListener("click", () => m.hidden = true);
  }
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") m.hidden = true;
  });
}

/* ============================================================
   SIDENAV — rendering + click intercept + scroll spy
   ============================================================ */
function renderSidenav(refs, viewKind /* "brand" | "body" */) {
  const sn = $("#sidenav");
  sn.hidden = refs.length === 0;
  const eyebrow = $("#sidenav-eyebrow");
  if (eyebrow) {
    const n = refs.length;
    eyebrow.textContent = `${n} model${n === 1 ? "" : "s"}`;
  }
  const snList = $("#sidenav-list");
  snList.innerHTML = "";
  for (const r of refs) {
    const brandSlug = r.brand.brand_slug;
    const modelSlug = r.model.model_slug;
    const anchorId = viewKind === "body"
      ? `model-${brandSlug}-${modelSlug}`
      : `model-${modelSlug}`;
    const label = viewKind === "body"
      ? `${r.brand.brand} ${r.model.model}`
      : r.model.model;
    snList.appendChild(el("li", { "data-anchor": anchorId },
      el("a", { href: `#model=${brandSlug}:${modelSlug}`, "data-anchor": anchorId }, label)
    ));
  }
}

// Intercept in-page sidenav clicks: when on the brand or body-style view, smooth-scroll
// to the target section without firing a re-render (preserves sort/filter state).
// On other views, allow the default navigation so the #model= hash takes the user
// to the brand view.
function initSidenavClickHandler() {
  $("#sidenav-list").addEventListener("click", e => {
    const link = e.target.closest("a[data-anchor]");
    if (!link) return;
    if (State.view !== "brand" && State.view !== "body") return; // let default navigation handle
    const anchorId = link.getAttribute("data-anchor");
    const target = document.getElementById(anchorId);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

let _ioInstance = null;
function initSidenavObserver() {
  if (_ioInstance) { _ioInstance.disconnect(); _ioInstance = null; }
  const sn = $("#sidenav");
  if (sn.hidden) return;
  const links = Array.from(sn.querySelectorAll("li[data-anchor]"));
  if (links.length === 0) return;

  _ioInstance = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const id = entry.target.id;
      for (const li of links) {
        li.classList.toggle("active", li.dataset.anchor === id);
      }
    }
  }, { rootMargin: "-30% 0px -65% 0px", threshold: 0 });

  for (const li of links) {
    const target = document.getElementById(li.dataset.anchor);
    if (target) _ioInstance.observe(target);
  }
}

/* ============================================================
   FOOTER
   ============================================================ */
async function renderFooter() {
  const mani = await loadManifest();
  const built = mani.generated_at?.slice(0, 10);
  $("#build-date").textContent = built ? `Built ${built}` : "Build date —";

  const totalModels = mani.brands.reduce((s, b) => s + (b.model_count || 0), 0);
  const brandCount = mani.brands.length;
  $("#sitefoot-counts").textContent =
    `${brandCount} brand${brandCount === 1 ? "" : "s"} · ${totalModels} models`;

  const trigger = $("#open-data-modal");
  trigger.addEventListener("click", e => {
    e.preventDefault();
    openDataFilesModal(mani);
  });
}

function openDataFilesModal(mani) {
  const titleNode = $("#modal-title");
  const bodyNode  = $("#modal-body");
  titleNode.textContent = "Browse data files";
  bodyNode.innerHTML = "";
  bodyNode.appendChild(el("p", { class: "modal-lead" },
    "Each brand's catalog is a single JSON file under ",
    el("code", null, "data/"), ". Open one to see its full structured spec."));
  const grid = el("ul", { class: "data-file-grid" });
  for (const b of mani.brands) {
    grid.appendChild(el("li", null,
      el("a", { href: `data/${b.slug}.json`, target: "_blank", rel: "noopener" },
        el("span", { class: "data-file-name" }, b.display_name),
        el("span", { class: "data-file-count" }, `${b.model_count} model${b.model_count === 1 ? "" : "s"}`)
      )));
  }
  bodyNode.appendChild(grid);
  $("#modal").hidden = false;
}

/* ============================================================
   BOOT
   ============================================================ */
async function main() {
  try {
    const mani = await loadManifest();
    initTopNav(mani);
    initModal();
    initSidenavClickHandler();
    await renderFooter();
    await route();
    window.addEventListener("hashchange", route);
  } catch (err) {
    console.error(err);
    document.getElementById("main").innerHTML =
      `<p class="notes-callout"><strong>Could not load catalog:</strong> ${err.message}. ` +
      `If you're opening this file directly (file://), some browsers block local fetch — ` +
      `try serving the folder with a tiny HTTP server (e.g. <code>python -m http.server</code>).</p>`;
  }
}

main();
