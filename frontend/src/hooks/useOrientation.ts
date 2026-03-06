import { useEffect } from "react";
import * as ScreenOrientation from "expo-screen-orientation";
import { useGameStore } from "../stores/gameStore";

export function usePortrait() {
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);
}

export function useLandscape() {
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      ScreenOrientation.unlockAsync();
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
    const usePortrait = userRole === "child" || gameMode === "solo";
    const lock = usePortrait
      ? ScreenOrientation.OrientationLock.PORTRAIT_UP
      : ScreenOrientation.OrientationLock.LANDSCAPE;

    ScreenOrientation.lockAsync(lock);
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, [userRole, gameMode]);

  return userRole;
}
