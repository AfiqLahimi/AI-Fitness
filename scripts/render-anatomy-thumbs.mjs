#!/usr/bin/env node
/**
 * Renders a still image of each exercise's highlighted muscles (from the real 3D model)
 * into public/anatomy-thumbs/<slug>.jpg. Used on exercise cards, so a page doesn't open
 * dozens of live 3D views. Run with the dev server running:
 *   npm run dev          (in one terminal)
 *   npm run anatomy:thumbs   (in another; needs Playwright: npx playwright install chromium)
 */
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public/anatomy-thumbs");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const src = await import(path.join(ROOT, "src/lib/fitness/exercises.ts"));
const only = process.argv.slice(2);
const slugs = only.length ? only : src.EXERCISES.map((e) => e.slug);
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
for (const slug of slugs) {
  await page.goto(`${BASE}/anatomy-render/${slug}?focus=1`);
  await page.locator("[data-ready]").waitFor({ timeout: 90_000 });
  await page.waitForTimeout(1600); // let the highlight fade in
  await page.screenshot({ path: path.join(OUT, `${slug}.jpg`), type: "jpeg", quality: 82 });
  console.log("✓", slug);
}
await browser.close();
