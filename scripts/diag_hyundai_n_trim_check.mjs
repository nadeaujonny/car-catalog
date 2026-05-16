#!/usr/bin/env node
// Quick verification: does elantra-n's page expose the -001 trim-color URL
// as a real image candidate (in <img>/<source>/og:image), or only as a JS data
// blob? If only in JS data, the production scraper will not see it.

import { fileURLToPath } from "node:url";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
           "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function fetchAndCheck(slug) {
  const url = `https://www.hyundaiusa.com/us/en/vehicles/${slug}`;
  const r = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html" }, redirect: "follow" });
  const html = await r.text();
  console.log(`========== ${slug} (${html.length} bytes) ==========`);

  // Look for the -001 URLs in different contexts
  const re = /https:\/\/s7d1\.scene7\.com\/is\/image\/hyundai\/[a-z0-9-]+-001(?:[^a-z0-9])/gi;
  const matches = [...html.matchAll(re)];
  console.log(`  -001 URLs total: ${matches.length}`);
  // De-dup
  const unique = new Set(matches.map(m => m[0].slice(0,-1)));
  console.log(`  unique: ${unique.size}`);
  for (const u of [...unique].slice(0, 5)) console.log(`    - ${u}`);

  // Check if any of them appear in <img>, <source>, srcset, or og:image
  const imgCount = (html.match(/<img\b[^>]*(?:src|srcset|data-src|data-srcset)\s*=\s*["'][^"']*-001\b/gi) || []).length;
  const sourceCount = (html.match(/<source\b[^>]*(?:srcset|data-srcset)\s*=\s*["'][^"']*-001\b/gi) || []).length;
  const ogCount = (html.match(/<meta\b[^>]*og:image[^>]*-001\b/gi) || []).length;
  console.log(`  in <img>: ${imgCount}, <source>: ${sourceCount}, og:image: ${ogCount}`);
}

(async () => {
  await fetchAndCheck("elantra-n");
  await fetchAndCheck("ioniq-5-n");
  await fetchAndCheck("ioniq-6-n");
})();
