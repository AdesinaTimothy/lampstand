"use client";

import * as React from "react";
import { Gauge, Loader2, Maximize, Minimize, Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX } from "lucide-react";
import { formatTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

export type MediaHandle = { currentTime: () => number; seek: (t: number) => void };

/**
 * Video player with keyboard-accessible custom controls (Space/K play, J/L ±10s,
 * ←/→ ±5s, M mute, F fullscreen). Native element underneath for codec support.
 */
export const VideoPlayer = React.forwardRef<
  MediaHandle,
  { src: string; title: string; startAt?: number; mediaRef: React.RefObject<HTMLVideoElement | null>; onEnded?: () => void }
>(function VideoPlayer({ src, title, startAt = 0, mediaRef, onEnded }, ref) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [wrapEl, setWrapEl] = React.useState<HTMLDivElement | null>(null);
  const setWrapRef = React.useCallback((node: HTMLDivElement | null) => {
    wrapRef.current = node;
    setWrapEl(node);
  }, []);
  const [playing, setPlaying] = React.useState(false);
  const [time, setTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [buffered, setBuffered] = React.useState(0);
  const [muted, setMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(1);
  const [speed, setSpeed] = React.useState(1);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [waiting, setWaiting] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [controlsVisible, setControlsVisible] = React.useState(true);
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useImperativeHandle(ref, () => ({
    currentTime: () => mediaRef.current?.currentTime ?? 0,
    seek: (t: number) => {
      if (mediaRef.current) mediaRef.current.currentTime = t;
    },
  }));

  const el = () => mediaRef.current;
  const toggle = React.useCallback(() => {
    const v = mediaRef.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => undefined);
    else v.pause();
  }, [mediaRef]);
  const skip = React.useCallback(
    (delta: number) => {
      const v = mediaRef.current;
      if (v) v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
    },
    [mediaRef],
  );
  const toggleFullscreen = React.useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void wrapRef.current?.requestFullscreen?.();
  }, []);

  React.useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  function poke() {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 2800);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.target as HTMLElement).closest("[role=menu],input[type=range]")) return;
    const key = e.key.toLowerCase();
    const map: Record<string, () => void> = {
      " ": toggle,
      k: toggle,
      j: () => skip(-10),
      l: () => skip(10),
      arrowleft: () => skip(-5),
      arrowright: () => skip(5),
      m: () => {
        const v = el();
        if (v) {
          v.muted = !v.muted;
          setMuted(v.muted);
        }
      },
      f: toggleFullscreen,
    };
    if (map[key]) {
      e.preventDefault();
      map[key]!();
      poke();
    }
  }

  const pct = duration ? (time / duration) * 100 : 0;
  const showControls = controlsVisible || !playing;

  return (
    <div
      ref={setWrapRef}
      className={cn("group relative aspect-video w-full overflow-hidden bg-black text-white", fullscreen ? "" : "lg:rounded-xl", !showControls && "cursor-none")}
      onMouseMove={poke}
      onKeyDown={onKeyDown}
      role="region"
      aria-label={`Video player: ${title}`}
      tabIndex={0}
    >
      <video
        ref={mediaRef}
        src={src}
        className="size-full"
        playsInline
        preload="metadata"
        onClick={toggle}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          setDuration(v.duration);
          // Resume, unless the learner had essentially finished.
          if (startAt > 3 && startAt < v.duration - 5) v.currentTime = startAt;
        }}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          setTime(v.currentTime);
          if (v.buffered.length) setBuffered((v.buffered.end(v.buffered.length - 1) / (v.duration || 1)) * 100);
        }}
        onPlay={() => {
          setPlaying(true);
          poke();
        }}
        onPause={() => setPlaying(false)}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onEnded={() => {
          setPlaying(false);
          onEnded?.();
        }}
        onVolumeChange={(e) => {
          setMuted(e.currentTarget.muted);
          setVolume(e.currentTarget.volume);
        }}
        onError={() => setError(true)}
      />

      {error && (
        <div className="absolute inset-0 grid place-items-center bg-black/80 p-6 text-center">
          <div>
            <p className="font-semibold">This video couldn&apos;t be played</p>
            <p className="mt-1 text-sm text-white/70">Check your connection and reload the page.</p>
          </div>
        </div>
      )}
      {waiting && !error && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden>
          <Loader2 className="size-10 animate-spin text-white/80" />
        </div>
      )}
      {!playing && !waiting && !error && (
        <button
          type="button"
          onClick={toggle}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/20 transition-colors hover:bg-black/30"
          aria-label={time > 0 ? "Resume" : "Play"}
        >
          <span className="grid size-14 place-items-center rounded-full bg-white/95 text-primary shadow-xl transition-transform hover:scale-105 sm:size-20">
            <Play className="ml-1 size-7 sm:size-8" fill="currentColor" aria-hidden />
          </span>
          {time === 0 && startAt > 3 && (
            <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-medium">Resume from {formatTimestamp(startAt)}</span>
          )}
        </button>
      )}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2 pt-10 transition-opacity duration-200 sm:px-4",
          showControls ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div className="relative h-4">
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/25" aria-hidden>
            <div className="absolute inset-y-0 left-0 rounded-full bg-white/35" style={{ width: `${buffered}%` }} />
            <div className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={1}
            value={Math.floor(time)}
            onChange={(e) => {
              const v = el();
              if (v) v.currentTime = Number(e.target.value);
            }}
            aria-label="Seek"
            aria-valuetext={`${formatTimestamp(time)} of ${formatTimestamp(duration)}`}
            className="absolute inset-0 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>
        <div className="mt-1 flex items-center gap-1 sm:gap-2">
          <ControlButton label={playing ? "Pause (k)" : "Play (k)"} onClick={toggle}>
            {playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
          </ControlButton>
          <ControlButton label="Back 10 seconds (j)" onClick={() => skip(-10)}>
            <RotateCcw />
          </ControlButton>
          <ControlButton label="Forward 10 seconds (l)" onClick={() => skip(10)}>
            <RotateCw />
          </ControlButton>
          <div className="group/vol flex items-center">
            <ControlButton
              label={muted ? "Unmute (m)" : "Mute (m)"}
              onClick={() => {
                const v = el();
                if (v) v.muted = !v.muted;
              }}
            >
              {muted || volume === 0 ? <VolumeX /> : <Volume2 />}
            </ControlButton>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => {
                const v = el();
                if (v) {
                  v.volume = Number(e.target.value);
                  v.muted = v.volume === 0;
                }
              }}
              aria-label="Volume"
              className="hidden w-20 accent-white sm:block"
            />
          </div>
          <span className="ml-1 text-xs tabular-nums text-white/90">
            {formatTimestamp(time)} <span className="text-white/50">/ {formatTimestamp(duration)}</span>
          </span>
          <div className="ml-auto flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-9 items-center gap-1 rounded-md px-2 text-xs font-semibold hover:bg-white/15" aria-label={`Playback speed ${speed}x`}>
                <Gauge className="size-4" aria-hidden /> {speed}×
              </DropdownMenuTrigger>
              <DropdownMenuContent container={wrapEl} align="end" className="min-w-32">
                <DropdownMenuLabel>Speed</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={String(speed)}
                  onValueChange={(v) => {
                    const n = Number(v);
                    setSpeed(n);
                    const m = el();
                    if (m) m.playbackRate = n;
                  }}
                >
                  {SPEEDS.map((s) => (
                    <DropdownMenuRadioItem key={s} value={String(s)}>
                      {s === 1 ? "Normal" : `${s}×`}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <ControlButton label={fullscreen ? "Exit full screen (f)" : "Full screen (f)"} onClick={toggleFullscreen}>
              {fullscreen ? <Minimize /> : <Maximize />}
            </ControlButton>
          </div>
        </div>
      </div>
    </div>
  );
});

function ControlButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-9 place-items-center rounded-md text-white transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white [&_svg]:size-[18px]"
    >
      {children}
    </button>
  );
}
