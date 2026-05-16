// Inline test of slug-matching against the alt text patterns observed on Lotus pages.

function variantToRegexFragment(v) {
  return (v || "").trim().toLowerCase()
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[-_ ]");
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

const slugVariants = {
  emira: ["emira", "emira-v6", "emira-turbo", "emira-i4"],
  eletre: ["eletre", "eletre-carbon"],
  emeya: ["emeya", "emeya-r"]
};

const tests = [
  // For emira, the URL has no slug; alt has emira-my26 → should match
  ["emira", "https://wlt-p-001.sitecorecontenthub.cloud/api/public/content/82cf79e6...?v=9095bc46 emira-my26-purple-imageslider"],
  ["emira", "https://wlt-p-001.sitecorecontenthub.cloud/api/public/content/dd4f25ae...?v=31f074b3 Emira-MY26-V6SE-green-image-slider-1080x800-desktop"],
  // For eletre, the URL has no slug; alt has "carbon hero desktop.webp" — no "eletre" string
  ["eletre", "https://wlt-p-001.sitecorecontenthub.cloud/api/public/content/65fb515f...?v=b91aa09a carbon hero desktop.webp"],
  // For emeya, the URL has no slug; alt has "AlphaPDP_Header_Desktop.webp" — no "emeya"
  ["emeya", "https://wlt-p-001.sitecorecontenthub.cloud/api/public/content/ac37e0a6...?v=57ef9966 AlphaPDP_Header_Desktop.webp"],
  // Empty alt — the most common case in the dump
  ["emira", "https://wlt-p-001.sitecorecontenthub.cloud/api/public/content/99dc1507...?v=a691afe5 "],
];

for (const [slug, hay] of tests) {
  const m = slugMatchesURL(slug, hay, slugVariants);
  console.log((m ? "MATCH " : "NO    ") + "[" + slug + "] hay: " + hay.slice(0, 120));
}
