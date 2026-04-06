import {
  View,
  Text,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../../src/hooks/useOrientation";
import { apiService } from "../../src/services/api";
import { useGameStore } from "../../src/stores/gameStore";
import {
  ScreenHeader,
  BouncePress,
  AnimatedLoader,
  AvatarIcon,
} from "../../src/components/common";
import { QRScanner } from "../../src/components/device";
import { FONTS } from "../../src/constants/theme";

import * as guestDb from "../../src/services/guestDb";
import { NotificationService } from "../../src/services/NotificationService";

type Status = "idle" | "scanning" | "loading" | "error";

export default function ChildJoinScreen() {
  const { t } = useTranslation(["device", "common"]);
  usePortrait();
  const [status, setStatus] = useState<Status>("idle");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [linkInfo, setLinkInfo] = useState<any>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const scanEnabled = useRef(true);
  const { setChildSession } = useGameStore();

  // Look up child info when a 5-6 char code is entered
  useEffect(() => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length >= 4 && cleanCode.length <= 7) {
      const timer = setTimeout(async () => {
        setIsLookingUp(true);
        try {
          const info = await apiService.getLinkInfo(cleanCode);
          setLinkInfo(info);
          setError("");
        } catch {
          setLinkInfo(null);
        } finally {
          setIsLookingUp(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setLinkInfo(null);
    }
  }, [code]);

  const handleJoin = useCallback(
    async (rawCode: string) => {
      setStatus("loading");
      setError("");
      try {
        const cleanCode = rawCode.trim().toUpperCase();
        console.log("Attempting to join with code:", cleanCode);

        // Guest link codes are 6 characters, session tokens are 8 characters
        const result =
          cleanCode.length === 6
            ? await apiService.redeemGuestCode(cleanCode)
            : await apiService.getChildToken(cleanCode);

        apiService.setToken(result.token);

        // Immediately fetch the child profile so the frontend renders the avatar
        try {
          const me = (await apiService.getMe()) as any;
          if (me) {
            useGameStore.getState().setChildProfile({
              displayName: me.displayName ?? "",
              avatarUrl: me.avatarUrl ?? "",
              grade: me.grade ?? "",
            });
          }
        } catch (e) {
          console.warn("Failed to fetch fresh profile immediately:", e);
        }

        // Migrate guest data to the new child account
        try {
          const payload = await guestDb.getAllDataForMigration();
          if (
            payload.matches.length > 0 ||
            payload.homeworkSessions.length > 0
          ) {
            console.log("Migrating guest data...");
            await apiService.migrateLocalGuestData(payload, result.token);
            await guestDb.clearAllGuestData();
            useGameStore.getState().clearGuestProfile();
          }
          // After migration (or if none), sync EVERYTHING from backend to local SQLite
          // This ensures that even on a new device, the child's history is available offline.
          console.log("Syncing all backend data to local...");
          await apiService.syncBackendDataToLocal();
        } catch (migErr) {
          console.error("Migration/Sync failed (non-fatal):", migErr);
        }

        setChildSession({
          sessionToken: cleanCode,
          parentId: result.parentId,
          childId: result.childId || null,
          jwtToken: result.token,
        });
        NotificationService.sendSignInNotification();
        router.replace("/home");
      } catch (err) {
        console.error("Join failed:", err);
        setError(t("device:childJoin.invalidCode"));
        setStatus("idle");
      }
    },
    [setChildSession, t],
  );

  const handleScan = useCallback(
    (data: string) => {
      if (!scanEnabled.current) return;
      scanEnabled.current = false;
      handleJoin(data);
    },
    [handleJoin],
  );

  const handleSubmitCode = () => {
    if (code.trim()) {
      handleJoin(code);
    }
  };

  if (status === "loading") {
    return (
      <SafeAreaView className="flex-1 bg-game-bg">
        <ScreenHeader title={t("device:childJoin.connectAccount", "Connect Account")} />
        <View className="flex-1 items-center justify-center px-8">
          <AnimatedLoader size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  if (status === "scanning") {
    return (
      <SafeAreaView className="flex-1 bg-game-bg">
        <ScreenHeader title={t("device:childJoin.connectAccount", "Connect Account")} />
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-72 h-72 rounded-3xl overflow-hidden mb-6">
            <QRScanner onScan={handleScan} enabled={scanEnabled.current} />
          </View>
          <Pressable
            onPress={() => {
              scanEnabled.current = true;
              setStatus("idle");
            }}
            className="mt-4"
          >
            <Text
              style={{ color: "#B8A9C9", fontSize: 16, fontFamily: FONTS.body }}
            >
              {t("device:childJoin.enterCodeInstead")}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-game-bg">
      <ScreenHeader title={t("device:childJoin.connectAccount", "Connect Account")} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 12,
            paddingVertical: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={{
              fontSize: 32,
              color: "#FFFFFF",
              fontFamily: "LuckiestGuy_400Regular",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            {t("device:childJoin.connectAccount", "Connect Account")}
          </Text>

          <Text
            style={{
              fontSize: 16,
              color: "#9CA3AF",
              marginBottom: 32,
              textAlign: "center",
              fontFamily: FONTS.body,
            }}
          >
            {t("device:childJoin.instruction")}
          </Text>

          <View className="w-full max-w-sm mb-4">
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder={t("device:childJoin.codeInputPlaceholder")}
              placeholderTextColor="#9CA3AF"
              className="w-full text-white text-md px-4 rounded-2xl mb-4 h-20"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.08)",
                textAlign: "center",
                letterSpacing: 6,
                fontFamily: "Bungee_400Regular",
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              onSubmitEditing={handleSubmitCode}
            />
            <BouncePress
              onPress={handleSubmitCode}
              className="w-full py-4 rounded-2xl items-center justify-center mb-2"
              style={{ backgroundColor: "#6C5CE7" }}
            >
              <Text
                className="text-white text-lg"
                style={{ fontFamily: "Bungee_400Regular", letterSpacing: 0.5 }}
              >
                {t("common:buttons.link")}
              </Text>
            </BouncePress>
          </View>

          {isLookingUp && (
            <View className="mb-4">
              <AnimatedLoader size="sm" />
            </View>
          )}

          {!isLookingUp && linkInfo && (
            <View
              className="rounded-2xl px-6 py-4 mb-6 w-full max-w-md flex-row items-center gap-4"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                borderWidth: 1,
                borderColor: "rgba(167, 139, 250, 0.3)",
                shadowColor: "#9B59B6",
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center border"
                style={{
                  backgroundColor: "rgba(167, 139, 250, 0.1)",
                  borderColor: "rgba(167, 139, 250, 0.2)",
                }}
              >
                <AvatarIcon avatarId={linkInfo.avatarUrl} size={32} />
              </View>
              <View className="flex-1">
                <Text
                  style={{
                    color: "#9CA3AF",
                    fontSize: 12,
                    fontFamily: FONTS.body,
                  }}
                >
                  Linking to:
                </Text>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 18,
                    fontFamily: "LuckiestGuy_400Regular",
                  }}
                >
                  {linkInfo.displayName}
                </Text>
              </View>
            </View>
          )}

          {error !== "" && (
            <Text
              style={{
                color: "#EF4444",
                fontSize: 14,
                fontFamily: FONTS.body,
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              {error}
            </Text>
          )}

          <BouncePress
            onPress={() => {
              scanEnabled.current = true;
              setStatus("scanning");
            }}
            className="w-full max-w-sm py-4 rounded-2xl mt-4"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.08)",
            }}
          >
            <Text
              className="text-white text-base text-center"
              style={{ fontFamily: "Bungee_400Regular", letterSpacing: 0.5 }}
            >
              {t("device:childJoin.scanQR")}
            </Text>
          </BouncePress>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
