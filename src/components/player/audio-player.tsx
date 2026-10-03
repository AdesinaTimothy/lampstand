"use client";

import * as React from "react";
import { Headphones, Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import { formatTimestamp } from "@/lib/format";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export function AudioPlayer({
  src,
  title,
  courseTitle,
  startAt = 0,
  mediaRef,
}: {
  src: string;
  title: string;
  courseTitle: string;
  startAt?: number;
  mediaRef: React.RefObject<HTMLAudioElement | null>;
}) {
  const [playing, setPlaying] = React.useState(false);
  const [time, setTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [speed, setSpeed] = React.useState(1);

  const toggle = () => {
    const a = mediaRef.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => undefined);
    else a.pause();
  };
  const skip = (d: number) => {
    const a = mediaRef.current;
    if (a) a.currentTime = Math.max(0, Math.min(a.duration || 0, a.currentTime + d));
  };

  return (
    <div className="bg-gradient-to-br from-primary to-primary-hover px-4 py-8 text-primary-foreground sm:px-8 sm:py-12 lg:rounded-xl">
      <audio
        ref={mediaRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          if (startAt > 3 && startAt < e.currentTarget.duration - 5) e.currentTarget.currentTime = startAt;
        }}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <div className="grid size-16 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20">
          <Headphones className="size-7" aria-hidden />
        </div>
        <p className="mt-4 text-xs font-medium uppercase tracking-wider opacity-75">{courseTitle}</p>
        <h2 className="text-display mt-1 text-2xl font-medium sm:text-3xl">{title}</h2>

        <div className="mt-8 w-full">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={Math.floor(time)}
            onChange={(e) => {
              if (mediaRef.current) mediaRef.current.currentTime = Number(e.target.value);
            }}
            aria-label="Seek"
            aria-valuetext={`${formatTimestamp(time)} of ${formatTimestamp(duration)}`}
            className="w-full accent-white"
          />
          <div className="mt-1 flex justify-between text-xs tabular-nums opacity-80">
            <span>{formatTimestamp(time)}</span>
            <span>-{formatTimestamp(Math.max(0, duration - time))}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <button type="button" onClick={() => skip(-15)} className="grid size-11 place-items-center rounded-full hover:bg-white/10" aria-label="Back 15 seconds">
            <RotateCcw className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={toggle}
            className="grid size-16 place-items-center rounded-full bg-white text-primary shadow-lg transition-transform hover:scale-105"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="size-7" fill="currentColor" aria-hidden /> : <Play className="ml-1 size-7" fill="currentColor" aria-hidden />}
          </button>
          <button type="button" onClick={() => skip(15)} className="grid size-11 place-items-center rounded-full hover:bg-white/10" aria-label="Forward 15 seconds">
            <RotateCw className="size-5" aria-hidden />
          </button>
        </div>
        <button
          type="button"
          className="mt-4 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-white/30 hover:bg-white/10"
          onClick={() => {
            const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]!;
            setSpeed(next);
            if (mediaRef.current) mediaRef.current.playbackRate = next;
          }}
          aria-label={`Playback speed ${speed}x. Change speed`}
        >
          {speed}× speed
        </button>
      </div>
    </div>
  );
}
