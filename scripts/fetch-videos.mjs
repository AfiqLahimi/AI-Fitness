#!/usr/bin/env node
/**
 * Download free exercise demonstration videos from Pexels (free API, Pexels License:
 * free for personal and commercial use, no attribution required — we still credit creators).
 *
 *   PEXELS_API_KEY=xxx node scripts/fetch-videos.mjs                 # fetch every exercise without a video
 *   PEXELS_API_KEY=xxx node scripts/fetch-videos.mjs --list push-up  # show candidates for one exercise
 *   PEXELS_API_KEY=xxx node scripts/fetch-videos.mjs --pick push-up=1234567   # use a specific Pexels video id
 *   node scripts/fetch-videos.mjs --remove push-up                   # go back to the animated guide
 *   ... --force                                                       # re-download even if present
 *
 * Files are saved to data/videos/<slug>.mp4 and registered in data/video-library.json
 * (the same library the Video Library page uploads into).
 * Search results are not always the exact exercise: open /library and check every clip.
 * Anything you don't like, replace with --pick or --remove.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Load .env.local / .env so PEXELS_API_KEY can live there (no extra dependency).
for (const f of [".env.local", ".env"]) {
  try {
    for (const line of readFileSync(path.join(ROOT, f), "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch { /* file not present */ }
}
const MANIFEST = path.join(ROOT, "data/video-library.json");
const OUT = path.join(ROOT, "data/videos");

// Search terms tuned per exercise (Pexels search is keyword based).
const QUERIES = {
  "dumbbell-bicep-curl": "dumbbell bicep curl", "hammer-curl": "hammer curl dumbbell", "band-bicep-curl": "resistance band bicep curl",
  "overhead-tricep-extension": "overhead tricep extension", "bench-dip": "bench dips triceps", "push-up": "push up exercise",
  "incline-push-up": "incline push up", "dumbbell-bench-press": "dumbbell bench press", "barbell-bench-press": "barbell bench press",
  "dumbbell-row": "dumbbell row", "band-row": "resistance band row", "pull-up": "pull up bar exercise", "lat-pulldown": "lat pulldown",
  "barbell-row": "barbell bent over row", "dumbbell-shoulder-press": "dumbbell shoulder press", "pike-push-up": "pike push up",
  "lateral-raise": "dumbbell lateral raise", "front-raise": "dumbbell front raise", "bodyweight-squat": "bodyweight squat",
  "goblet-squat": "goblet squat", "barbell-back-squat": "barbell back squat", "reverse-lunge": "lunges exercise",
  "romanian-deadlift": "romanian deadlift", "glute-bridge": "glute bridge exercise", "calf-raise": "calf raises",
  "leg-press": "leg press machine", "plank": "plank exercise", "side-plank": "side plank", "crunch": "crunches abs",
  "lying-leg-raise": "lying leg raise", "mountain-climber": "mountain climbers exercise", "jumping-jacks": "jumping jacks",
  "high-knees": "high knees exercise", "burpee": "burpees", "kettlebell-swing": "kettlebell swing", "arm-circles": "arm circles warm up",
  "march-in-place": "marching in place exercise", "bodyweight-good-morning": "hip hinge exercise", "hamstring-stretch": "hamstring stretch standing",
  "quad-stretch": "standing quad stretch",
};

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const valueOf = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const KEY = process.env.PEXELS_API_KEY;

async function loadManifest() { try { return JSON.parse(await fs.readFile(MANIFEST, "utf8")); } catch { return {}; } }
async function saveManifest(m) {
  const sorted = Object.fromEntries(Object.keys(m).sort().map((k) => [k, m[k]]));
  await fs.writeFile(MANIFEST, JSON.stringify(sorted, null, 2) + "\n");
}

async function api(url) {
  const res = await fetch(url, { headers: { Authorization: KEY } });
  if (res.status === 401) throw new Error("Pexels rejected the API key. Get a free key at https://www.pexels.com/api/");
  if (res.status === 429) throw new Error("Pexels rate limit reached (free tier: 200 requests/hour). Try again later.");
  if (!res.ok) throw new Error(`Pexels error ${res.status}`);
  return res.json();
}

/** Prefer landscape HD mp4 ≤1920px wide — sharp but light enough for phones. */
function bestFile(video) {
  const mp4 = video.video_files.filter((f) => f.file_type === "video/mp4" && f.width >= f.height);
  mp4.sort((a, b) => Math.abs(a.width - 1280) - Math.abs(b.width - 1280));
  return mp4.find((f) => f.width <= 1920) ?? mp4[0];
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed ${res.status}`);
  await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

async function install(slug, video, manifest) {
  const file = bestFile(video);
  if (!file) throw new Error("no landscape mp4 available");
  await download(file.link, path.join(OUT, `${slug}.mp4`));
  if (video.image) await download(video.image, path.join(OUT, `${slug}.jpg`)).catch(() => {});
  manifest[slug] = {
    kind: "video",
    sources: [{ src: `/media/videos/${slug}.mp4`, type: "video/mp4" }],
    poster: video.image ? `/media/videos/${slug}.jpg` : undefined,
    mistakes: manifest[slug]?.mistakes,
    credit: `${video.user?.name ?? "Unknown"} on Pexels`,
    license: "Pexels License",
    sourceUrl: video.url,
    aiGenerated: false,
  };
  console.log(`✓ ${slug.padEnd(28)} ${video.url}`);
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const manifest = await loadManifest();

  const remove = valueOf("--remove");
  if (remove) {
    delete manifest[remove];
    await fs.rm(path.join(OUT, `${remove}.mp4`), { force: true });
    await fs.rm(path.join(OUT, `${remove}.jpg`), { force: true });
    await saveManifest(manifest);
    return console.log(`Removed video for ${remove}; the animated guide will be used.`);
  }

  if (!KEY) {
    console.error("Set PEXELS_API_KEY first. It's free: https://www.pexels.com/api/ (sign up → copy your key).");
    process.exit(1);
  }

  const list = valueOf("--list");
  if (list) {
    const r = await api(`https://api.pexels.com/videos/search?query=${encodeURIComponent(QUERIES[list] ?? list)}&per_page=10&orientation=landscape`);
    for (const v of r.videos) console.log(`${v.id}\t${v.duration}s\t${v.url}`);
    return console.log(`\nUse one with: node scripts/fetch-videos.mjs --pick ${list}=<id>`);
  }

  const pick = valueOf("--pick");
  if (pick) {
    const [slug, id] = pick.split("=");
    const v = await api(`https://api.pexels.com/videos/videos/${encodeURIComponent(id)}`);
    await install(slug, v, manifest);
    return saveManifest(manifest);
  }

  const force = flag("--force");
  const only = valueOf("--only");
  const slugs = Object.keys(QUERIES).filter((s) => !only || s === only);
  let ok = 0, skipped = 0, failed = 0;
  for (const slug of slugs) {
    if (manifest[slug] && !force) { skipped++; continue; }
    try {
      const r = await api(`https://api.pexels.com/videos/search?query=${encodeURIComponent(QUERIES[slug])}&per_page=5&orientation=landscape`);
      const v = r.videos.find((x) => x.duration >= 4 && x.duration <= 60) ?? r.videos[0];
      if (!v) { console.log(`– ${slug.padEnd(28)} no result, keeps the animated guide`); failed++; continue; }
      await install(slug, v, manifest);
      ok++;
      await saveManifest(manifest);
    } catch (e) {
      console.log(`✗ ${slug.padEnd(28)} ${e.message}`); failed++;
      if (/rate limit|rejected/.test(e.message)) break;
    }
  }
  console.log(`\nDone: ${ok} downloaded, ${skipped} already had videos, ${failed} without a match.`);
  console.log("Now open http://localhost:3000/library and check every clip shows the right exercise.");
}

main().catch((e) => { console.error(e.message); process.exit(1); });
