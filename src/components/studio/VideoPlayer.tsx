"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Pause, Play, Repeat, Volume2, VolumeX } from "lucide-react";
import type { VideoSource } from "@/lib/media/provider";
import { cx } from "../ui";

const SPEEDS = [0.5, 0.75, 1] as const;

function fmt(t: number) {
  if (!Number.isFinite(t)) return "0:00";
  return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
}

/**
 * Large, premium exercise video player: autoplaying muted loop with custom controls,
 * a scrubber, slow-motion speeds for studying technique, and fullscreen.
 */
export function VideoPlayer({
  sources, poster, playing = true, label, credit, onError, minimal = false, className,
}: {
  sources: VideoSource[]; poster?: string; playing?: boolean; label: string; credit?: string;
  onError?: () => void; minimal?: boolean; className?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const v = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(!playing);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [loop, setLoop] = useState(true);
  const [muted, setMuted] = useState(true);
  const [idle, setIdle] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const key = sources.map((s) => s.src).join();

  useEffect(() => {
    const el = v.current;
    if (!el) return;
    if (playing) el.play().then(() => setPaused(false)).catch(() => setPaused(true));
    else { el.pause(); setPaused(true); }
  }, [playing, key]);
  useEffect(() => { if (v.current) v.current.playbackRate = speed; }, [speed, key]);

  const toggle = () => {
    const el = v.current;
    if (!el) return;
    if (el.paused) el.play().then(() => setPaused(false)).catch(() => {});
    else { el.pause(); setPaused(true); }
  };
  const wake = () => {
    setIdle(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), 2200);
  };

  return (
    <div ref={wrap} onPointerMove={wake} onPointerLeave={() => setIdle(true)} className={cx("group relative h-full w-full overflow-hidden bg-black", className)}>
      <video
        key={key}
        ref={v}
        className="h-full w-full object-cover"
        poster={poster}
        muted={muted} loop={loop} playsInline autoPlay={playing} preload="auto"
        onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        onError={onError}
        onClick={toggle}
        aria-label={label}
      >
        {sources.map((s, i) => (
          <source key={s.src} src={s.src} type={s.type} onError={i === sources.length - 1 ? onError : undefined} />
        ))}
      </video>

      {!minimal && (
        <>
          {paused && (
            <button onClick={toggle} className="absolute inset-0 m-auto grid h-20 w-20 place-items-center rounded-full bg-black/45 text-white backdrop-blur-md transition hover:scale-105" aria-label="Play video">
              <Play className="h-8 w-8 translate-x-0.5 fill-current" />
            </button>
          )}
          <div className={cx("absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-3 pt-10 transition-opacity duration-300", idle && !paused ? "opacity-0" : "opacity-100")}>
            <input
              type="range" min={0} max={dur || 0} step={0.01} value={t}
              onChange={(e) => { if (v.current) v.current.currentTime = Number(e.target.value); setT(Number(e.target.value)); }}
              className="h-1 w-full cursor-pointer" aria-label="Seek"
            />
            <div className="mt-2 flex items-center gap-2 text-xs text-white/85">
              <button onClick={toggle} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10" aria-label={paused ? "Play" : "Pause"}>
                {paused ? <Play className="h-4 w-4 fill-current" /> : <Pause className="h-4 w-4" />}
              </button>
              <span className="tabular">{fmt(t)} / {fmt(dur)}</span>
              <div className="ml-auto flex items-center gap-1">
                <div className="flex rounded-full bg-white/10 p-0.5" role="group" aria-label="Playback speed">
                  {SPEEDS.map((s) => (
                    <button key={s} onClick={() => setSpeed(s)} aria-pressed={speed === s} className={cx("rounded-full px-2 py-1 tabular", speed === s ? "bg-white/20 font-semibold text-white" : "text-white/70")}>{s === 1 ? "1×" : `${s}×`}</button>
                  ))}
                </div>
                <button onClick={() => setLoop((l) => !l)} aria-pressed={loop} className={cx("grid h-8 w-8 place-items-center rounded-full hover:bg-white/10", loop ? "text-lime" : "text-white/70")} aria-label="Loop"><Repeat className="h-4 w-4" /></button>
                <button onClick={() => setMuted((m) => !m)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10" aria-label={muted ? "Unmute" : "Mute"}>{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
                <button onClick={() => wrap.current?.requestFullscreen?.().catch(() => {})} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10" aria-label="Fullscreen"><Maximize2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
          {credit && <span className={cx("absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] text-white/75 backdrop-blur transition-opacity", idle && !paused ? "opacity-0" : "opacity-100")}>{credit}</span>}
        </>
      )}
    </div>
  );
}
