// DIAGNOSTIC (session 5) — unit-test the patched slugMatchesURL against real
// MINI cases + regression cases. Safe to delete.
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function variantToRegexFragment(v) {
  return (v || "").trim().toLowerCase()
    .split(/[-_ ]+/).filter(Boolean).map(escapeRe).join("[-_ ]");
}
function slugMatchesURL(slug, haystack, slugVariants) {
  const variants = slugVariants[slug] || [slug];
  const hay = (haystack || "").toLowerCase();
  for (const v of variants) {
    const frag = variantToRegexFragment(v);
    if (!frag) continue;
    const re = new RegExp(`(^|[/_ -])${frag}([/_ -]|\\.|$)`, "i");
    if (re.test(hay)) return true;
  }
  return false;
}

const sv = {
  "cooper-hardtop-2-door": ["cooper-hardtop-2-door", "hardtop-2-door", "hardtop2door", "cooper-2-door"],
  "cooper-hardtop-4-door": ["cooper-hardtop-4-door", "hardtop-4-door", "hardtop4door", "cooper-4-door"],
  "jcw-2-door": ["jcw-2-door", "jcw-hardtop", "jcw2door"],
  "jcw-convertible": ["jcw-convertible", "jcwconvertible"],
  "jcw-countryman-all4": ["jcw-countryman-all4", "jcw-countryman", "jcwcountryman"],
};

const T = [
  // [slug, haystack(url + " " + alt), expectMatch, note]
  ["jcw-countryman-all4", "https://x/vehicles/mini-convertible/2025/jcw/m.png the front exterior of the mini jcw countryman all4.", true, "countryman img in convertible folder — match via alt"],
  ["jcw-countryman-all4", "https://x/vehicles/countryman-ice/2025/jcw/m.png side view of a mini jcw countryman all4 driving.", true, "countryman img in countryman folder"],
  ["jcw-countryman-all4", "https://x/vehicles/mini-convertible/2025/jcw/m.png a parked mini jcw convertible.", false, "convertible cross-link must NOT match countryman"],
  ["jcw-convertible", "https://x/vehicles/mini-convertible/2025/jcw/m.png the rear exterior of the mini jcw convertible.", true, "convertible img"],
  ["jcw-convertible", "https://x/vehicles/mini-convertible/2025/jcw/m.png side view of the mini jcw countryman all4.", false, "countryman cross-link must NOT match convertible"],
  ["jcw-2-door", "https://x/vehicles/mini-hardtop2door/2025/jcw/mobile/m.png front view of the mini jcw 2 door while driving.", true, "jcw 2-door img"],
  ["jcw-2-door", "https://x/vehicles/mini-convertible/2025/jcw/m.png side view of the mini jcw countryman all4.", false, "countryman cross-link must NOT match jcw-2-door"],
  ["cooper-hardtop-2-door", "https://x/vehicles/mini-hardtop2door/2025/overview/m.png the dashboard of the mini cooper 2 door.", true, "cooper 2-door via URL folder"],
  ["cooper-hardtop-4-door", "https://x/vehicles/mini-hardtop4door/2025/overview/m.png a mini cooper s 4 door.", true, "cooper 4-door via URL folder"],
  ["cooper-hardtop-2-door", "https://x/vehicles/mini-hardtop4door/2025/overview/m.png a mini cooper s 4 door.", false, "4-door img must NOT match 2-door"],
  // regression: a generic brand with a simple URL-only variant should still work
  ["civic", "https://hondacdn.com/civic/2026/front-34.jpg ", true, "plain URL-only match still works"],
  ["civic", "https://hondacdn.com/accord/2026/front-34.jpg ", false, "wrong model URL still excluded"],
];

let pass = 0, fail = 0;
for (const [slug, hay, exp, note] of T) {
  const variants = slug === "civic" ? { civic: ["civic"] } : sv;
  const got = slugMatchesURL(slug, hay, variants);
  const ok = got === exp;
  ok ? pass++ : fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${slug.padEnd(22)} want=${String(exp).padEnd(5)} got=${String(got).padEnd(5)} ${note}`);
}
console.log(`\n${pass} pass, ${fail} fail`);
process.exitCode = fail ? 1 : 0;
