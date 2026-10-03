"use client";

import * as React from "react";
import type { AutosaveState } from "./autosave-status";

/**
 * Debounced autosave that never loses content: saves `delay` ms after the last
 * change, immediately on `flush()` (e.g. blur), serializes requests, retries
 * newer changes made while a save was in flight, and saves on unmount.
 */
export function useAutosave(initial: string, save: (value: string) => Promise<boolean>, delay = 1500) {
  const [state, setState] = React.useState<AutosaveState>("saved");
  const latest = React.useRef(initial);
  const saved = React.useRef(initial);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = React.useRef(false);
  const saveRef = React.useRef(save);
  React.useEffect(() => {
    saveRef.current = save;
  });

  const run = React.useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      // Keep going until the latest content is stored (it may change mid-request).
      while (latest.current !== saved.current) {
        const value = latest.current;
        setState("saving");
        const ok = await saveRef.current(value);
        if (!ok) return setState("error");
        saved.current = value;
      }
      setState("saved");
    } finally {
      inFlight.current = false;
    }
  }, []);

  const change = React.useCallback(
    (value: string) => {
      latest.current = value;
      if (value === saved.current && !inFlight.current) {
        if (timer.current) clearTimeout(timer.current);
        return setState("saved");
      }
      setState((s) => (s === "saving" ? s : "pending"));
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void run(), delay);
    },
    [delay, run],
  );

  // Save anything outstanding when the editor unmounts (in-app navigation).
  React.useEffect(
    () => () => {
      if (latest.current !== saved.current) void saveRef.current(latest.current);
    },
    [],
  );

  return { state, change, flush: run };
}
