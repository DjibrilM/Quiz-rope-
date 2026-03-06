import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../src/hooks/useOrientation";
import { io, Socket } from "socket.io-client";
import { apiService } from "../src/services/api";
import { useGameStore } from "../src/stores/gameStore";
import { BackButton, BouncePress } from "../src/components/common";
import { QRCodeDisplay, SessionCodeDisplay } from "../src/components/device";
import { FONTS } from "../src/constants/theme";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || "http://localhost:3000";

export default function ChildJoinScreen() {
  const { t } = useTranslation(["device", "common"]);
  usePortrait();
  const [sessionToken, setSessionToken] = useState("");
  const [status, setStatus] = useState<
    "generating" | "ready" | "waiting" | "expired" | "linked" | "error"
  >("generating");
  const [error, setError] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handledRef = useRef(false);
  const mountedRef = useRef(true);
  const { setChildSession } = useGameStore();

  const cleanup = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (expiryRef.current) {
      clearTimeout(expiryRef.current);
      expiryRef.current = null;
    }
  }, []);

  const handleAuthorized = useCallback(
    async (parentId: string, token: string, childId?: string | null) => {
      if (handledRef.current) return;
      handledRef.current = true;

      cleanup();

      if (!mountedRef.current) return;
      setStatus("linked");

      try {
        const result = await apiService.getChildToken(token);
        apiService.setToken(result.token);
        setChildSession({
          sessionToken: token,
          parentId,
          childId: childId || result.childId || null,
          jwtToken: result.token,
        });
        router.replace("/home");
      } catch {
        if (!mountedRef.current) return;
        handledRef.current = false;
        setError(t("device:childJoin.errorToken"));
        setStatus("error");
      }
    },
    [cleanup, setChildSession, t]
  );

  const createSession = useCallback(async () => {
    cleanup();
    handledRef.current = false;
    setStatus("generating");
    setError("");

    try {
      const result = await apiService.createChildSession();
      const token = result.sessionToken;

      if (!mountedRef.current) return;
      setSessionToken(token);
      setStatus("waiting");

      expiryRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        setStatus("expired");
        cleanup();
      }, 10 * 60 * 1000);

      const socket = io(SERVER_URL, { transports: ["websocket"] });
      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("session:watch", { sessionToken: token });
      });

      socket.on("session:authorized", (data: { parentId: string; childId?: string | null }) => {
        handleAuthorized(data.parentId, token, data.childId);
      });

      pollRef.current = setInterval(async () => {
        if (handledRef.current) return;
        try {
          const statusResult = await apiService.getSessionStatus(token);
          if (statusResult.authorized && statusResult.parentId) {
            handleAuthorized(statusResult.parentId, token, statusResult.childId);
          }
        } catch {
          // Polling error
        }
      }, 3000);
    } catch {
      if (!mountedRef.current) return;
      setError("Failed to create session");
      setStatus("generating");
    }
  }, [cleanup, handleAuthorized]);

  const handleRetry = useCallback(() => {
    createSession();
  }, [createSession]);

  useEffect(() => {
    mountedRef.current = true;
    createSession();
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [createSession, cleanup]);

  return (
    <SafeAreaView className="flex-1 bg-game-bg items-center justify-center px-8">
      <BackButton absolute />

      <Text
        className="text-3xl text-white mb-1"
        style={{ fontFamily: "LuckiestGuy_400Regular" }}
      >
        {t("device:childJoin.title")}
      </Text>
      <Text style={{ fontSize: 16, color: "#B8A9C9", marginBottom: 24, fontFamily: FONTS.body }}>
        {t("device:childJoin.instruction")}
      </Text>

      <QRCodeDisplay sessionToken={sessionToken} status={status === "error" ? "waiting" : status} />

      {sessionToken && status !== "expired" && status !== "error" && (
        <SessionCodeDisplay code={sessionToken} />
      )}

      {status === "waiting" && (
        <View className="flex-row items-center mt-2">
          <View className="w-2 h-2 rounded-full bg-game-purple mr-2" />
          <Text style={{ color: "#B8A9C9", fontSize: 14, fontFamily: FONTS.body }}>
            {t("device:childJoin.waitingStatus")}
          </Text>
        </View>
      )}

      {(status === "expired" || status === "error") && (
        <View className="items-center mt-4">
          {error !== "" && (
            <Text style={{ color: "#EF4444", fontSize: 14, fontFamily: FONTS.body, marginBottom: 16, textAlign: "center" }}>{error}</Text>
          )}
          <BouncePress
            onPress={handleRetry}
            className="bg-game-purple px-8 py-4 rounded-2xl"
          >
            <Text
              className="text-white text-lg"
              style={{ fontFamily: "Bungee_400Regular" }}
            >
              {status === "expired" ? t("device:childJoin.generateNewCode") : t("common:buttons.tryAgain")}
            </Text>
          </BouncePress>
        </View>
      )}
    </SafeAreaView>
  );
}
