#!/usr/bin/env node
// Session 11 — test the isDealerDomain fix.
// Verifies all known false-positives are eliminated and known true-positives are preserved.

function isDealerDomain(url) {
  if (!url || typeof url !== 'string') return false;
  let host;
  try { host = new URL(url).hostname.toLowerCase(); } catch { return false; }
  if (/\.dealer\./.test(host)) return true;
  if (/[a-z]of[a-z]+\./.test(host)) return true;
  if (/[a-z]-of-[a-z]/.test(host)) return true;
  if (/(dealership|automall|miller-?motorcars)/.test(host)) return true;
  return false;
}

const cases = [
  // false-positives (should NOT match) — these were the Session 10 verifier blockers
  ['https://www.subaru.com/owners/benefits-of-ownership/added-security-program.html', false, 'Subaru manufacturer URL (path-content "of-")'],
  ['https://www.prnewswire.com/news-releases/sixpack-powered-2026-dodge-charger-rt-delivers-most-entry-level-horsepower-of-any-muscle-car-302708303.html', false, 'PR Newswire press release'],
  ['https://www.dodgegarage.com/news/article/press-room/2025/12/power-unpacked-dodge-unlocks-orders-for-sixpack-powered-charger-r-t-delivers-most-standard-horsepower-of-any-muscle-car', false, 'DodgeGarage press URL'],
  ['https://vinfastauto.us/investor-relations/news/vinfast-begins-us-deliveries-of-vf-9-all-electric-with-limited-time-special', false, 'VinFast manufacturer URL (path "of-")'],
  ['https://www.autoguide.com/auto/manufacturers/vinfast/2025-vinfast-vf-9-review-moments-of-goodness-44626225', false, 'AutoGuide review URL'],
  // true-positives (SHOULD match)
  ['https://www.bmwofbeverlyhills.com/inventory', true, 'BMW dealer: bmwofbeverlyhills.com'],
  ['https://lexusofdowntownla.com', true, 'Lexus dealer: lexusofdowntownla.com'],
  ['https://chevy-of-dallas.com/specials', true, 'Chevy dealer: chevy-of-dallas.com'],
  ['https://www.mercedes-benz-of-westchester.com/', true, 'Mercedes dealer: mercedes-benz-of-westchester.com'],
  ['https://www.somethingautomall.com/', true, 'Generic automall'],
  ['https://www.somedealership.net/', true, 'Generic dealership'],
  ['https://www.millermotorcars.com/', true, 'Miller Motorcars (no hyphen)'],
  // edge cases
  ['https://www.honda.com/specs/', false, 'Plain manufacturer URL'],
  ['https://hondanews.com/en-US/honda-corporate/something', false, 'Manufacturer press subdomain'],
  ['https://www.caranddriver.com/honda/accord/specs', false, 'Car and Driver editorial'],
  ['https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=49100', false, 'EPA URL'],
  // sanity
  [null, false, 'null URL'],
  ['', false, 'empty URL'],
  ['not a url', false, 'malformed URL'],
];

let pass = 0, fail = 0;
for (const [url, expected, label] of cases) {
  const actual = isDealerDomain(url);
  const ok = actual === expected;
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  expected=${expected}  actual=${actual}  ${label}`);
  if (!ok) console.log(`  url: ${url}`);
}
console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail === 0 ? 0 : 1);
