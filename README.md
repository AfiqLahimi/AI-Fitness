# Pulse — AI Personal Fitness Trainer

Pulse is a fitness website that works like a personal trainer. It runs on your own computer while you build it, and you open it in your web browser.

**What it can do**

- **Your profile.** Calculates your BMI, BMR, TDEE, daily calories and protein/carbs/fat.
- **Workout plan.** Builds a weekly plan around your goal, your equipment and how many days you train. It gets harder or easier based on how your workouts feel.
- **Workout Studio.** Guides you through every exercise:
  1. **3D muscle model.** A realistic 3D human anatomy model (real muscle shapes, red muscle tissue with ivory tendons and bone). The muscles the exercise works glow **lime green** (primary) and **amber** (secondary). You can rotate it, zoom, see the front or back, and use X-ray mode to see deeper muscles.
  2. **Explanation.** What the exercise does, why it helps, correct posture and common mistakes.
  3. **Video demonstration.** Plays the trainer video in a large player with slow-motion (0.5×, 0.75×), loop and fullscreen (see "Exercise videos" below).
  4. **Start.** Choose Rep mode or Timer mode, then train with set tracking, rest countdowns, pause/resume, skip and next.
- **Nutrition.** Malaysian-friendly meal plans, a food log and calorie/protein tracking.
- **Progress.** Charts for weight, BMI, workouts, calories and protein.
- **AI Coach.** Chat with an AI that knows your profile. It can run free on your own computer (Ollama).

### What's real and what isn't yet

| Feature | Status |
|---|---|
| 3D muscle anatomy with highlighting | ✅ Working. Real anatomical model (Z-Anatomy / BodyParts3D, CC BY-SA 4.0) |
| Exercise intro (muscles → explanation → video → start) | ✅ Working |
| Workout tracking (sets, reps, timer, rest, pause, skip) | ✅ Working |
| Exercise video library (upload, play, replace, delete) | ✅ Working |
| Realistic trainer videos for each exercise | ⚠️ **Not included — you need to add them** (free options below). Until you do, the workout screen shows the realistic 3D muscle model instead, with a clear "No demonstration video yet" label. There is no stick figure or fake video anywhere. |
| Automatic AI video generation inside the app | ❌ Not built. Every AI video service with an API costs money, and you asked for no paid services. The app gives you ready-made prompts and an upload page instead. |
| AI Coach | ✅ Works once you install Ollama (free) or add a paid Claude key |

---

## 1. Install these once

You need two free programs. If you already have them, skip ahead.

1. **Node.js** (runs the website): go to <https://nodejs.org>, download the **LTS** version and install it with the default options.
2. **Git** (downloads the code): go to <https://git-scm.com/downloads>, install it with the default options.
3. **VS Code** (optional but recommended, makes everything easier): <https://code.visualstudio.com>

**Check they work.** Open a terminal (see the next section) and type:

```bash
node -v
```

You should see something like `v22.x.x`. Then:

```bash
git --version
```

You should see something like `git version 2.x`.

## 2. Open a terminal

A terminal is a window where you type commands.

- **Easiest (any computer):** open **VS Code**, then the top menu **Terminal → New Terminal**. It opens at the bottom of VS Code.
- **Windows:** press the Windows key, type **PowerShell**, press Enter.
- **Mac:** press Cmd + Space, type **Terminal**, press Enter.

## 3. Download the project (first time only)

In the terminal, run these one at a time (press Enter after each):

```bash
git clone -b claude/pulse-fitness-app https://github.com/AfiqLahimi/ai-fitness.git
```

This downloads the code into a new folder called `ai-fitness`.

```bash
cd ai-fitness
```

This moves the terminal **into** the project folder. **Every command below must be run inside this `ai-fitness` folder.** If you open a new terminal later, run `cd ai-fitness` again first (or, in VS Code, use **File → Open Folder** and choose `ai-fitness`; its terminal then starts in the right place).

```bash
npm install
```

This downloads the libraries the project needs. It takes 1–3 minutes, and you only repeat it after updating the code.

## 4. Settings file (`.env.local`)

The app reads its settings from a file called `.env.local`. Create it by copying the example:

```bash
cp .env.example .env.local
```

(`cp` works in PowerShell, Mac and Linux. In the old Windows "Command Prompt", use `copy .env.example .env.local` instead.)

You can leave it as it is to start. Open it in VS Code later to turn on optional features:

| Setting | What it does | Needed? |
|---|---|---|
| `OLLAMA_MODEL=qwen2.5:7b` | Free AI coach on your computer | Optional |
| `PEXELS_API_KEY=...` | Downloads free stock exercise videos | Optional |
| `ADMIN_EMAILS=you@example.com` | Who can upload videos on the live site | Only when you put the site online |
| `ANTHROPIC_API_KEY=...` | Paid Claude AI coach | Optional (costs money) |

Lines starting with `#` are switched off. Remove the `#` to switch one on.

## 5. Start the website

```bash
npm run dev
```

Wait until you see a line like `✓ Ready in 2s` and `Local: http://localhost:3000`.

**Open your browser and go to <http://localhost:3000>.**

Keep the terminal open while you use the site. Closing it stops the website.

### What to click first

1. Click **Get started** and create an account. It's stored only on your computer.
2. Fill in your profile (5 short steps) and click **Build my plan**.
3. On **Today**, click **Start workout**.
4. After the warm-up, you'll see the **Learn before you lift** screen: the 3D muscles, the explanation, the video and then the mode choice. Click **Next** through the steps, pick **Rep mode** or **Timer mode**, and press **Start**.
5. Explore **Plan**, **Nutrition**, **Progress**, **Coach**, **Exercise library** and **Video library** in the menu (on a phone, the menu is at the bottom; the libraries are linked from the Profile page).

## 6. Stop the website

Click inside the terminal and press **Ctrl + C** (on Mac too, it's Ctrl, not Cmd). If it asks `Terminate batch job (Y/N)?`, type `Y` and press Enter.

## 7. Start it again later

1. Open a terminal.
2. Go into the project folder:
   ```bash
   cd ai-fitness
   ```
3. Start it:
   ```bash
   npm run dev
   ```
4. Open <http://localhost:3000>.

Your account, workouts and food log are saved in `data/pulse.db` and are still there next time.

## 8. Get the latest version

When new code is pushed to GitHub, run these inside the `ai-fitness` folder (stop the website first with Ctrl + C):

```bash
git pull
```

```bash
npm install
```

```bash
npm run dev
```

---

## Exercise videos

Each exercise can have **one demonstration video** and an optional **"common mistakes" video**. Videos are stored once in `data/videos/` and reused for every workout. Nothing is generated while you train.

Open **Video library** in the app menu. It shows which exercises still need a video. Click an exercise to see:

- copy-ready **AI prompts** for one of two fictional trainers (**Coach Maya** or **Coach Adam**), so all your videos look consistent,
- an **upload form** (MP4 or WebM, up to 200 MB),
- buttons to **replace** or **remove** a video.

### Where to get videos — what's free and what isn't

I researched the options you mentioned. Prices and terms change often, so check each site yourself before relying on it.

| Option | Cost | Can the app connect to it automatically? | Notes |
|---|---|---|---|
| **Wan 2.2** (open source, Alibaba) | Free | No (it runs as its own program on your computer) | Apache-2.0 licence. Needs a strong **NVIDIA graphics card**. The smaller 5B model is the realistic home option; the 14B model needs a very large GPU. You're responsible for the content you generate. |
| **Pexels stock videos** | Free | Yes: `npm run videos` | Real trainers, free Pexels licence. Search results aren't always the exact exercise, so check each one. |
| **Kling AI** | Free daily credits in the web app; **API is paid** | No | The developer API is billed separately and needs an application. You can make clips in the web app and upload them, if Kling's terms allow your use. |
| **PixVerse** | Free web credits; **API from about US$100/month** | No | Free exports are watermarked and reportedly not for commercial use. |

A free web app **does not** mean a free API, so none of the paid APIs are connected. If you want one connected later (for example Kling's API), ask first. It will cost money.

### Option A: free stock videos (easiest)

1. Make a free account at <https://www.pexels.com/api/> and copy your API key.
2. Open `.env.local`, add a line `PEXELS_API_KEY=your-key-here` and save.
3. In the terminal (inside `ai-fitness`), run:
   ```bash
   npm run videos
   ```
   This downloads a clip for each exercise into `data/videos/`.
4. Open **Video library** in the app and watch each clip. If one is wrong:
   - `npm run videos -- --list push-up` shows other choices,
   - `npm run videos -- --pick push-up=1234567` uses a specific one (the number from the list),
   - `npm run videos -- --remove push-up` removes it again.

### Option B: AI-generated trainer videos (free with Wan 2.2, if you have an NVIDIA GPU)

1. Install **ComfyUI** (free) from <https://www.comfy.org> and open a **Wan 2.2** video workflow from its built-in templates (menu names may differ between versions). Its guides explain which model files to download.
2. In Pulse, open **Video library → any exercise**, choose a trainer and copy **"1 · Trainer reference photo"**. Generate that photo once (with any image tool) and keep it. Using the same photo for every exercise keeps the trainer consistent.
3. Copy **"2 · Demonstration video prompt"**, paste it into the image-to-video workflow together with your trainer photo, and generate. Also paste the **negative prompt** if the tool has one.
4. **Watch the result carefully.** AI often gets technique wrong (bent wrists, swinging, extra fingers). Don't upload a clip with bad form, because beginners will copy it.
5. Back in Pulse, choose the file, select **AI-generated**, tick the confirmation box and click **Upload video**. It now plays everywhere that exercise appears.
6. Optional: switch to the **Common mistakes** tab and repeat with the mistakes prompt.

You can use the same steps with clips made in the Kling or PixVerse web apps, as long as their terms allow it.

### Option C: film it yourself

Record each exercise from a 45° front-side angle, full body in frame. Upload as **My own recording**.

---

## The 3D anatomy model

Exercise cards show a still image of the same 3D model (in `public/anatomy-thumbs/`). They're rendered from the model by `npm run anatomy:thumbs` (needs the dev server running and Playwright installed with `npx playwright install chromium`). You only need to re-run it if you change which muscles an exercise targets.

`public/models/anatomy.glb` contains 246 real muscles and the main bones. It comes from **Z-Anatomy**, which is based on **BodyParts3D** (Database Center for Life Science, Japan). It is licensed **CC BY-SA 4.0**, so the attribution is shown on the model and in `public/models/ANATOMY-LICENSE.txt`. If you share or change the model file itself, keep that licence and credit.

Each exercise's highlighted muscles are listed in `src/lib/anatomy/muscles.ts`. They use the model's exact anatomical names, and a test (`npm test`) checks every name exists in the model.

To rebuild the model (advanced; needs Blender):

```bash
blender -b Z-Anatomy/Startup.blend --python scripts/anatomy/export_from_blender.py -- anatomy-raw.glb
```

```bash
node scripts/anatomy/compress.mjs anatomy-raw.glb public/models/anatomy.glb
```

## Free AI coach (Ollama)

1. Install **Ollama** from <https://ollama.com> and open it. It runs in the background.
2. In a terminal, download a model. This is about 4.7 GB and needs roughly 8 GB of RAM:
   ```bash
   ollama pull qwen2.5:7b
   ```
   On an older computer, use `qwen2.5:3b` instead.
3. In `.env.local`, remove the `#` in front of `OLLAMA_MODEL=qwen2.5:7b` and save.
4. Restart the website (Ctrl + C, then `npm run dev`).

---

## Troubleshooting

**`node` / `npm` / `git` is not recognized**
The program isn't installed, or the terminal was open before you installed it. Close the terminal, open a new one and try again. If it still fails, reinstall Node.js or Git.

**`npm install` shows errors**
Check that `node -v` shows version 20 or newer. Then delete the `node_modules` folder and run `npm install` again.

**`Error: Cannot find module ...` when starting**
You skipped `npm install`, or the code was updated. Run `npm install`, then `npm run dev`.

**`Port 3000 is in use`**
The website is already running in another terminal, so use that one or stop it with Ctrl + C. Next.js may also start on port 3001 instead; open the URL it prints.

**The page says "This site can't be reached"**
The website isn't running. Check the terminal: it must show `Ready`. Leave that terminal open.

**`ENOENT ... package.json`**
You're not inside the project folder. Run `cd ai-fitness` first.

**The 3D model doesn't appear**
Your browser needs WebGL. Update Chrome, Edge or Safari, and turn on "hardware acceleration" in the browser settings. The muscle list beside the model still works without it.

**Video upload says "Only admins can upload"**
Add `ADMIN_EMAILS=the-email-you-signed-up-with` to `.env.local` and restart. (On your own computer this isn't needed unless you set `ADMIN_EMAILS` already.)

**AI coach says it isn't set up / can't reach Ollama**
Make sure the Ollama app is open, the model is downloaded (`ollama list` shows it), and `OLLAMA_MODEL` in `.env.local` matches the name exactly. Restart the website after editing `.env.local`.

**I want to start completely fresh**
Stop the website and delete the file `data/pulse.db`. A new empty database is created on the next start. This deletes all accounts and logs.

If something else goes wrong, copy the red error text from the terminal and send it to Claude. Include which command you ran.

---

## Useful commands

All of these run inside the `ai-fitness` folder.

| Command | What it does |
|---|---|
| `npm run dev` | Start the website for development (<http://localhost:3000>) |
| `npm test` | Run the automatic checks |
| `npm run build` then `npm start` | Run the faster production version |
| `npm run videos` | Download free Pexels videos (needs `PEXELS_API_KEY`) |

## Project structure (for the curious)

```
src/app/                 pages (each folder = a URL)
src/app/studio/          the Workout Studio
src/components/studio/   studio parts: ExerciseIntro, WorkoutStudio, MotionGuide, ExerciseMedia
src/components/anatomy/  3D anatomy viewer and muscle list
src/lib/anatomy/         which muscles each exercise targets + plain-language guides
src/lib/fitness/         calculations, exercises, workout planner
src/lib/nutrition/       Malaysian food database and meal planner
src/lib/media/           video library, AI prompts
public/models/           the 3D anatomy model (CC BY-SA 4.0)
data/                    your database and uploaded videos (stays on your computer)
```

Tech stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4, SQLite (Drizzle ORM), three.js for 3D.

Pulse gives general fitness guidance, not medical advice. Calorie and burn figures are estimates.
