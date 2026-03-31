import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGameStore } from "../stores/gameStore";
import { useFocusEffect } from "expo-router";

export const UPLOAD_LIMIT = 3;
export const getUploadKey = (userId: string) => `@hw_daily_uploads_${userId}`;

export async function getDailyCount(userId: string): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(getUploadKey(userId));
    if (!raw) return 0;
    const { date, count } = JSON.parse(raw);
    const today = new Date().toDateString();
    return date === today ? count : 0;
  } catch {
    return 0;
  }
}

export async function incrementDailyCount(userId: string): Promise<void> {
  try {
    const count = await getDailyCount(userId);
    await AsyncStorage.setItem(
      getUploadKey(userId),
      JSON.stringify({ date: new Date().toDateString(), count: count + 1 })
    );
  } catch {}
}

export function useHomeworkLimit() {
  const { parentUser, guestProfile } = useGameStore();
  const userId = parentUser?._id ?? parentUser?.id ?? guestProfile?.guestId ?? "anonymous";
  
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchLimit = useCallback(async () => {
    const c = await getDailyCount(userId);
    setCount(c);
    setLoading(false);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchLimit();
    }, [fetchLimit])
  );

  return {
    count,
    limit: UPLOAD_LIMIT,
    remaining: Math.max(0, UPLOAD_LIMIT - count),
    loading,
    refreshLimit: fetchLimit,
    userId,
    isDev: __DEV__,
  };
}
