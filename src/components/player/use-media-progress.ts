"use client";

import * as React from "react";

type ProgressResponse = {
  watchedSeconds: number;
  completed: boolean;
  justCompleted: boolean;
  courseCompleted: boolean;
  certificateId: string | null;
};

const HEARTBEAT_MS = 10_000;

/**
 * Reports playback position to the server: every 10s while playing, on pause,
 * on end, and on tab hide/close (via sendBeacon so it survives unload).
 * The server decides completion; seeking ahead doesn't count as watching.
 */
export function useMediaProgress(
  mediaRef: React.RefObject<HTMLMediaElement | null>,
  opts: {
    lessonId: string;
    enabled: boolean;
    onCompleted?: (r: ProgressResponse) => void;
  },
) {
  const { lessonId, enabled } = opts;
  const onCompletedRef = React.useRef(opts.onCompleted);
  React.useEffect(() => {
    onCompletedRef.current = opts.onCompleted;
  });
  const lastSent = React.useRef<number>(-1);
  const completedRef = React.useRef(false);

  const payload = React.useCallback(() => {
    const el = mediaRef.current;
    if (!el) return null;
    return JSON.stringify({
      lessonId,
      positionSeconds: Math.floor(el.currentTime),
      durationSeconds: Number.isFinite(el.duration) ? Math.floor(el.duration) : null,
    });
  }, [lessonId, mediaRef]);

  const send = React.useCallback(async () => {
    if (!enabled) return;
    const body = payload();
    const el = mediaRef.current;
    if (!body || !el) return;
    const pos = Math.floor(el.currentTime);
    if (pos === lastSent.current) return;
    lastSent.current = pos;
    try {
      const res = await fetch("/api/progress", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
      if (!res.ok) return;
      const data = (await res.json()) as ProgressResponse;
      if (data.justCompleted && !completedRef.current) {
        completedRef.current = true;
        onCompletedRef.current?.(data);
      }
    } catch {
      // Offline: the next heartbeat will catch up.
    }
  }, [enabled, payload, mediaRef]);

  React.useEffect(() => {
    if (!enabled) return;
    const el = mediaRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (!timer) timer = setInterval(send, HEARTBEAT_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
      void send();
    };
    const beacon = () => {
      const body = payload();
      if (body && navigator.sendBeacon) navigator.sendBeacon("/api/progress", new Blob([body], { type: "text/plain" }));
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") beacon();
    };
    el.addEventListener("play", start);
    el.addEventListener("pause", stop);
    el.addEventListener("ended", stop);
    window.addEventListener("pagehide", beacon);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (timer) clearInterval(timer);
      el.removeEventListener("play", start);
      el.removeEventListener("pause", stop);
      el.removeEventListener("ended", stop);
      window.removeEventListener("pagehide", beacon);
      document.removeEventListener("visibilitychange", onVisibility);
      // Navigating to another lesson inside the app: flush once more.
      beacon();
    };
  }, [enabled, mediaRef, payload, send]);
}
