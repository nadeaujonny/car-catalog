#!/usr/bin/env node
// Deeper Lotus probe: dump ALL network image URLs (no plausibility filter) and
// all DOM <img> currentSrc plus surrounding context. The first Playwright pass
// showed 27-51 network image responses but only 0-1 passed the
// isPlausibleImageURL filter (which requires an image extension at end of
// pathname). Lotus's CDN may serve images via querystring-only or content-type-
// only URLs.
//
// Logs to: reports/lotus_playwright_raw_full.log

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(PROJECT_ROOT, "reports", "lotus_playwright_raw_full.log");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
           "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const TARGETS = [
  { slug: "emira",  url: "https://www.lotuscars.com/en-US/emira",  source: "consumer" },
  { slug: "eletre", url: "https://www.lotuscars.com/en-US/eletre", source: "consumer" },
  { slug: "emeya",  url: "https://www.lotuscars.com/en-US/emeya",  source: "consumer" },
  { slug: "emira",  url: "https://www.lotuscars.com/en/press/galleries/emira",   source: "press-en" },
  { slug: "eletre", url: "https://www.lotuscars.com/en/press/galleries/eletre",  source: "press-en" },
  { slug: "emeya",  url: "https://www.lotuscars.com/en/press/galleries/emeya",   source: "press-en" },
];

async function main() {
  const lines = [];
  const log = (s) => { lines.push(s); console.log(s); };

  const { chromium } = await import("playwright");

  log(`# Lotus FULL Playwright dump — generated ${new Date().toISOString()}`);
  log("");

  const browser = await chromium.launch({ headless: true });
  try {
    for (const t of TARGETS) {
      log(`========================================================================`);
      log(`# MODEL: ${t.slug}    (source: ${t.source})`);
      log(`# URL:   ${t.url}`);
      log(`========================================================================`);

      const ctx = await browser.newContext({
        userAgent: UA,
        viewport: { width: 1280, height: 900 },
        locale: "en-US",
      });
      const page = await ctx.newPage();
      // Capture ALL network responses with image content-type or image-y URLs
      const networkImages = [];
      page.on("response", async (resp) => {
        try {
          const u = resp.url();
          const ct = (resp.headers()["content-type"] || "").toLowerCase();
          const status = resp.status();
          if (ct.startsWith("image/") || /\.(jpe?g|png|webp|avif|gif|svg)\b/i.test(u)) {
            let bytes = 0;
            try { const buf = await resp.body(); bytes = buf?.length || 0; } catch {}
            networkImages.push({ url: u, ct, status, bytes });
          }
        } catch {}
      });
      try {
        await page.goto(t.url, { waitUntil: "domcontentloaded", timeout: 30000 });
        await Promise.race([
          page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {}),
          new Promise(r => setTimeout(r, 10000)),
        ]);
        await page.evaluate(async () => {
          const start = Date.now();
          for (let y = 0; y < document.body.scrollHeight && Date.now() - start < 8000; y += 600) {
            window.scrollTo(0, y);
            await new Promise(r => setTimeout(r, 200));
          }
          window.scrollTo(0, 0);
          await new Promise(r => setTimeout(r, 1500));
        }).catch(() => {});
        await Promise.race([
          page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {}),
          new Promise(r => setTimeout(r, 5000)),
        ]);

        // Snapshot of every <img> in the DOM, with naturalSize.
        const imgs = await page.evaluate(() => {
          const out = [];
          for (const im of document.querySelectorAll("img")) {
            const r = im.getBoundingClientRect();
            out.push({
              src: im.currentSrc || im.src || "",
              alt: ((im.alt || "") + " " + (im.title || "")).trim().slice(0, 240),
              w: im.naturalWidth || 0,
              h: im.naturalHeight || 0,
              cssW: r.width, cssH: r.height,
              docY: Math.round(r.top + window.scrollY),
              visible: r.width > 2 && r.height > 2,
              parentText: (im.parentElement?.textContent || "").trim().slice(0, 200),
            });
          }
          return out;
        });

        log(`# DOM <img> count: ${imgs.length}`);
        log(`# Network image responses: ${networkImages.length}`);
        log("");

        // Sort network images: status 200 first, then by bytes desc
        networkImages.sort((a, b) => {
          if (a.status !== b.status) return a.status === 200 ? -1 : 1;
          return (b.bytes || 0) - (a.bytes || 0);
        });

        log(`# All network image responses (status, ct, bytes, URL):`);
        for (const n of networkImages) {
          log(`  [${n.status}] ${(n.ct||"").padEnd(20)} ${String(n.bytes||0).padStart(7)}  ${n.url}`);
        }
        log("");
        log(`# All DOM <img> (showing src + alt + dims):`);
        for (const im of imgs) {
          log(`  src: ${im.src}`);
          log(`  alt: ${JSON.stringify(im.alt)}`);
          log(`  natW=${im.w} natH=${im.h} cssW=${Math.round(im.cssW)} cssH=${Math.round(im.cssH)} docY=${im.docY} visible=${im.visible}`);
          if (im.parentText && im.parentText.length > 1) log(`  parent: ${JSON.stringify(im.parentText.slice(0,160))}`);
          log("");
        }
      } catch (e) {
        log(`ERROR: ${e.message}`);
      } finally {
        await page.close().catch(()=>{});
        await ctx.close().catch(()=>{});
      }
      log("");
    }
  } finally {
    await browser.close().catch(()=>{});
  }

  await fs.writeFile(OUT_PATH, lines.join("\n"), "utf-8");
  console.log(`\n--- wrote ${OUT_PATH} ---`);
}

main().catch(e => { console.error("Fatal:", e); process.exitCode = 1; });
