"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { Loader2, RotateCcw, ScanSearch, Info } from "lucide-react";
import { MUSCLES, highlightMap, preferredView, type ExerciseTargets } from "@/lib/anatomy/muscles";
import { cx } from "../ui";

const MODEL_URL = "/models/anatomy.glb";

// Realistic anatomy palette: red-brown muscle, ivory tendon and bone.
// Target muscles glow lime (primary) and amber (secondary).
const MUSCLE = new THREE.Color("#8e2e22");
const MUSCLE_DARK = new THREE.Color("#6a1d14");
const MUSCLE_LIGHT = new THREE.Color("#a5402f");
const TENDON = new THREE.Color("#b8a991");
const BONE = new THREE.Color("#b9ad98");
export const PRIMARY_HEX = "#b8ff2e";
export const SECONDARY_HEX = "#ffb020";
const PRIMARY = new THREE.Color("#66bf00");
const SECONDARY = new THREE.Color("#d98400");
const TENDON_RE = /tendon|tract|septum|aponeuros|tendinous|ring|arch|trochlea|tarsus/i;

/** Small, stable per-muscle colour variation so neighbouring muscles read as separate. */
function muscleTone(name: string): THREE.Color {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const t = (h % 1000) / 1000;
  return t < 0.5 ? MUSCLE.clone().lerp(MUSCLE_DARK, (0.5 - t) * 0.9) : MUSCLE.clone().lerp(MUSCLE_LIGHT, (t - 0.5) * 0.9);
}

let modelPromise: Promise<THREE.Group> | null = null;
function loadModel(): Promise<THREE.Group> {
  modelPromise ??= new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(MODEL_URL, (g) => resolve(g.scene), undefined, (e) => { modelPromise = null; reject(e); });
  });
  return modelPromise;
}

const meshBase = (name: string) => name.replace(/\.(l|r)$/, "");

/** Find which muscle group (if any) a mesh name belongs to, for tooltips. */
function groupFor(base: string) {
  return Object.values(MUSCLES).find((m) => m.meshes.includes(base));
}

interface Tip { x: number; y: number; title: string; sub: string; level: 0 | 1 | 2 }

export function AnatomyViewer({ targets, className, compact = false, bare = false, interactive = true, initialView, autoFocus = false }: { targets: ExerciseTargets; className?: string; compact?: boolean; bare?: boolean; interactive?: boolean; initialView?: "front" | "back"; autoFocus?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{ setView: (v: "front" | "back") => void; focus: () => void; reset: () => void; xray: (on: boolean) => void } | null>(null);
  const [xray, setXray] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "nowebgl">("loading");
  const [view, setView] = useState<"front" | "back">(() => initialView ?? preferredView(targets));
  const [tip, setTip] = useState<Tip | null>(null);
  const key = targets.primary.join(",") + "|" + targets.secondary.join(",");

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    setXray(false);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      setStatus("nowebgl");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = "none";

    renderer.toneMappingExposure = 0.85;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0b0b0d");
    // Soft studio reflections give the wet, glossy look of real muscle tissue.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 50);
    scene.add(new THREE.HemisphereLight("#fff3ea", "#1a1014", 0.25));
    // Lights ride with the camera so the front and back views are lit equally.
    scene.add(camera);
    const keyLight = new THREE.DirectionalLight("#fff6ee", 1.7); keyLight.position.set(1.2, 1.6, 0.4); camera.add(keyLight); keyLight.target.position.set(0, 0, -1); camera.add(keyLight.target);
    const fill = new THREE.DirectionalLight("#bcd6ff", 0.35); fill.position.set(-1.5, 0.2, 0.3); camera.add(fill); fill.target.position.set(0, 0, -1); camera.add(fill.target);
    const rim = new THREE.DirectionalLight("#9fc4ff", 1.1); rim.position.set(0, 1.2, -2.5); camera.add(rim); rim.target.position.set(0, 0, -1); camera.add(rim.target);

    // Bloom makes only the bright, emissive (highlighted) muscles glow.
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.32, 0.3, 0.9);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.rotateSpeed = 0.7;
    controls.enabled = interactive;

    const levels = highlightMap(targets);
    const animated: { mat: THREE.MeshPhysicalMaterial; base: THREE.Color; target: THREE.Color; emissive: THREE.Color; level: 0 | 1 | 2 }[] = [];
    const pickables: THREE.Mesh[] = [];
    let center = new THREE.Vector3();
    let fullDist = 4;
    let focusBox: THREE.Box3 | null = null;
    // Camera animation (front/back/focus) handled in the render loop.
    let tween: { from: THREE.Vector3; to: THREE.Vector3; tFrom: THREE.Vector3; tTo: THREE.Vector3; start: number; dur: number } | null = null;
    const start = performance.now();

    const fit = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    fit();

    const moveTo = (pos: THREE.Vector3, target: THREE.Vector3, dur = 900) => {
      tween = { from: camera.position.clone(), to: pos, tFrom: controls.target.clone(), tTo: target, start: performance.now(), dur };
    };
    const viewPos = (v: "front" | "back", dist = fullDist, at = center) => new THREE.Vector3(at.x, at.y + dist * 0.05, at.z + (v === "front" ? dist : -dist));

    loadModel()
      .then((src) => {
        if (disposed) return;
        const model = src.clone(true);
        model.traverse((o) => {
          if (!(o as THREE.Mesh).isMesh) return;
          const mesh = o as THREE.Mesh;
          const anat = String(mesh.userData.anat ?? mesh.parent?.userData.anat ?? mesh.name);
          const isBone = anat.startsWith("BONE_");
          const base = isBone ? "" : meshBase(anat);
          const level = isBone ? 0 : (levels.get(base) ?? 0);
          const isTendon = !isBone && TENDON_RE.test(base);
          const baseColor = isBone ? BONE : isTendon ? TENDON : muscleTone(base);
          const mat = new THREE.MeshPhysicalMaterial({
            color: baseColor.clone(),
            roughness: isBone ? 0.6 : isTendon ? 0.35 : 0.42,
            metalness: 0,
            clearcoat: isBone ? 0.05 : level > 0 ? 0.08 : 0.3,
            clearcoatRoughness: 0.35,
            sheen: isBone || level > 0 ? 0 : 0.25,
            sheenColor: new THREE.Color("#ff9d8a"),
            sheenRoughness: 0.5,
            envMapIntensity: level > 0 ? 0.1 : 0.22,
            emissive: new THREE.Color("#000000"),
          });
          mesh.material = mat;
          mesh.userData = { base, level, isBone };
          if (!isBone) {
            animated.push({ mat, base: baseColor, target: level === 2 ? PRIMARY : level === 1 ? SECONDARY : baseColor, emissive: level === 2 ? PRIMARY : level === 1 ? SECONDARY : new THREE.Color("#000"), level });
            pickables.push(mesh);
          }
        });
        scene.add(model);
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model);
        center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        fullDist = (size.y / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.12;
        controls.minDistance = fullDist * 0.12;
        controls.maxDistance = fullDist * 1.6;
        // Region to zoom into: bounding box of the primary muscles.
        const hot = pickables.filter((m) => m.userData.level === 2);
        if (hot.length) {
          focusBox = new THREE.Box3();
          hot.forEach((m) => focusBox!.expandByObject(m));
        }
        const v = initialView ?? preferredView(targets);
        camera.position.copy(viewPos(v));
        controls.target.copy(center);
        controls.update();
        api.current = {
          setView: (nv) => moveTo(viewPos(nv), center.clone()),
          reset: () => moveTo(viewPos(v), center.clone()),
          xray: (on) => {
            // Make non-target muscles see-through so deep muscles (e.g. erector spinae) show.
            for (const a of animated) {
              if (a.level !== 0) continue;
              a.mat.transparent = on; a.mat.opacity = on ? 0.12 : 1; a.mat.depthWrite = !on; a.mat.needsUpdate = true;
            }
          },
          focus: () => {
            if (!focusBox) return;
            const c = focusBox.getCenter(new THREE.Vector3());
            const s = focusBox.getSize(new THREE.Vector3());
            const d = Math.max(s.y, s.x * 0.8, 0.3) / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 2.3;
            const dir = camera.position.clone().sub(controls.target).normalize();
            moveTo(c.clone().add(dir.multiplyScalar(d)), c, autoFocus ? 1 : 900);
          },
        };
        if (autoFocus) api.current.focus();
        setStatus("ready");
      })
      .catch(() => !disposed && setStatus("error"));

    // Hover tooltips (desktop) / tap (touch).
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let lastPick = 0;
    const onMove = (e: PointerEvent) => {
      if (performance.now() - lastPick < 40 || !pickables.length) return;
      lastPick = performance.now();
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(pickables, false)[0];
      if (!hit) return setTip(null);
      const { base, level } = hit.object.userData as { base: string; level: 0 | 1 | 2 };
      const g = groupFor(base);
      setTip({ x: e.clientX - r.left, y: e.clientY - r.top, title: g?.name ?? base, sub: g ? base : "", level });
    };
    const onLeave = () => setTip(null);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerdown", onMove);
    renderer.domElement.addEventListener("pointerleave", onLeave);

    let visible = true;
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; });
    io.observe(el);

    const tmp = new THREE.Color();
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      if (tween) {
        const k = Math.min(1, (now - tween.start) / tween.dur);
        const e = 1 - Math.pow(1 - k, 3);
        camera.position.lerpVectors(tween.from, tween.to, e);
        controls.target.lerpVectors(tween.tFrom, tween.tTo, e);
        if (k >= 1) tween = null;
      }
      controls.update();
      // Smooth highlight fade-in, then a gentle pulse on the primary muscles.
      const intro = Math.min(1, (now - start) / 1100);
      const pulse = 0.5 + 0.5 * Math.sin(now / 420);
      for (const a of animated) {
        if (a.level === 0) continue;
        tmp.copy(a.base).lerp(a.target, intro);
        a.mat.color.copy(tmp);
        a.mat.emissive.copy(a.emissive).multiplyScalar(intro * (a.level === 2 ? 0.16 + pulse * 0.14 : 0.08));
      }
      composer.render();
    };
    raf = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      controls.dispose();
      composer.dispose();
      envTex.dispose();
      pmrem.dispose();
      animated.forEach((a) => a.mat.dispose());
      scene.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.Material | undefined; if (m && "dispose" in m) m.dispose(); });
      renderer.dispose();
      renderer.domElement.remove();
      api.current = null;
    };
    // targets identity is captured by `key`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const switchView = (v: "front" | "back") => { setView(v); api.current?.setView(v); };

  return (
    <div className={cx("relative overflow-hidden rounded-[1.5rem] border border-line bg-[radial-gradient(ellipse_at_50%_30%,#1b1c1f,#070708_70%)]", className)}>
      <div ref={host} data-ready={status === "ready" ? "1" : undefined} className={cx("absolute inset-0", interactive && "cursor-grab active:cursor-grabbing")} aria-label="Interactive 3D muscle model. Drag to rotate, scroll or pinch to zoom." role="img" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,transparent_45%,rgba(0,0,0,0.55)_100%)]" />

      {status === "loading" && !bare && (
        <div className="absolute inset-0 grid place-items-center text-sm text-dim"><span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading 3D anatomy…</span></div>
      )}
      {(status === "error" || status === "nowebgl") && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-dim">
          <p>{status === "nowebgl" ? "Your browser can't show 3D graphics (WebGL is turned off or unsupported)." : "The 3D model couldn't load. Check your connection and refresh."} The muscle list beside this panel still shows what this exercise trains.</p>
        </div>
      )}

      {tip && (
        <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[130%] rounded-xl border border-line-strong bg-raised/95 px-3 py-2 text-xs shadow-xl backdrop-blur" style={{ left: tip.x, top: tip.y }}>
          <p className="flex items-center gap-1.5 font-semibold text-fg">
            {tip.level > 0 && <span className="h-2 w-2 rounded-full" style={{ background: tip.level === 2 ? "#b8ff2e" : "#ffb020" }} />}
            {tip.title}
          </p>
          {tip.sub && <p className="text-mute">{tip.sub}</p>}
        </div>
      )}

      {status === "ready" && !bare && (
        <>
          <div className="absolute left-3 top-3 flex rounded-full border border-line bg-black/50 p-0.5 backdrop-blur">
            {(["front", "back"] as const).map((v) => (
              <button key={v} onClick={() => switchView(v)} aria-pressed={view === v} className={cx("rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition", view === v ? "bg-white/15 text-fg" : "text-mute hover:text-fg")}>{v}</button>
            ))}
          </div>
          <div className="absolute right-3 top-3 flex gap-1.5">
            {targets.primary.length > 0 && <button onClick={() => api.current?.focus()} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-black/50 px-3 py-1.5 text-xs font-semibold text-fg backdrop-blur hover:border-line-strong"><ScanSearch className="h-3.5 w-3.5" /><span className="hidden sm:inline">Zoom to muscles</span></button>}
            <button onClick={() => { const n = !xray; setXray(n); api.current?.xray(n); }} aria-pressed={xray} className={cx("rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur", xray ? "border-[#ffb020]/60 bg-[#ffb020]/15 text-[#ffd27a]" : "border-line bg-black/50 text-dim hover:text-fg")} title="See deep muscles through the outer layer">X-ray</button>
            <button onClick={() => { setView(preferredView(targets)); api.current?.reset(); }} className="grid h-8 w-8 place-items-center rounded-full border border-line bg-black/50 text-dim backdrop-blur hover:text-fg" aria-label="Reset view"><RotateCcw className="h-3.5 w-3.5" /></button>
          </div>
          {!compact && (
            <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-3 rounded-full border border-line bg-black/50 px-3 py-1.5 text-[11px] text-dim backdrop-blur">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#b8ff2e]" /> {targets.stretch ? "Stretched" : "Primary"}</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#ffb020]" /> Secondary</span>
              <span className="hidden items-center gap-1 sm:inline-flex"><Info className="h-3 w-3" /> Drag to rotate · scroll to zoom</span>
            </div>
          )}
          <a href="https://github.com/Z-Anatomy/Models-of-human-anatomy" target="_blank" rel="noreferrer" className="absolute bottom-12 right-3 text-[10px] text-mute hover:text-dim sm:bottom-3">
            <span className="hidden sm:inline">Model: Z-Anatomy / BodyParts3D · CC BY-SA 4.0</span><span className="sm:hidden">© Z-Anatomy CC BY-SA</span>
          </a>
        </>
      )}
    </div>
  );
}
