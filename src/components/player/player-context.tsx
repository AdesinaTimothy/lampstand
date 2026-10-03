"use client";

import * as React from "react";
import type { PlayerData } from "@/server/queries/player";

export type CompletionEvent = { courseCompleted: boolean; certificateId: string | null };

type PlayerContextValue = {
  data: PlayerData;
  /** Learner is enrolled and progress is being tracked. */
  tracking: boolean;
  completed: boolean;
  onCompleted: (e: CompletionEvent) => void;
  /** Current media time, for timestamped notes. */
  mediaTime: () => number | null;
  seek: (seconds: number) => void;
};

export const PlayerContext = React.createContext<PlayerContextValue | null>(null);

export function usePlayer() {
  const ctx = React.useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerShell");
  return ctx;
}
