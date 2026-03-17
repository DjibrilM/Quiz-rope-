import { useEffect } from "react";
import * as ScreenOrientation from "expo-screen-orientation";
import { useGameStore } from "../stores/gameStore";

export function usePortrait() {
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    // No cleanup — the next screen sets its own lock.
    // Calling unlockAsync() here creates a jitter window during transitions.
  }, []);
}

export function useLandscape() {
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      // Restore portrait instead of unlocking entirely.
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);
}

/**
 * Role-aware orientation for game screens (lobby + game).
 * Parent account → landscape (tablet shared between two kids on a table).
 * Child account  → portrait  (child playing on their own phone).
 */
export function useGameOrientation() {
  const userRole = useGameStore((s) => s.userRole);
  const gameMode = useGameStore((s) => s.currentMatch?.gameMode);

  useEffect(() => {
    const wantPortrait = gameMode !== "splitscreen" && (userRole === "child" || userRole === "guest" || gameMode === "solo");
    const lock = wantPortrait
      ? ScreenOrientation.OrientationLock.PORTRAIT_UP
      : ScreenOrientation.OrientationLock.LANDSCAPE;

    ScreenOrientation.lockAsync(lock);
    return () => {
      // Restore portrait instead of unlocking entirely.
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, [userRole, gameMode]);

  return userRole;
}
