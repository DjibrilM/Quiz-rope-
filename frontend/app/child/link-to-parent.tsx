import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../../src/hooks/useOrientation";
import { useGameStore } from "../../src/stores/gameStore";
import { apiService } from "../../src/services/api";
import * as guestDb from "../../src/services/guestDb";
import { hapticsService } from "../../src/services/haptics";
import { BackButton, ScreenHeader } from "../../src/components/common";
import { QRScanner } from "../../src/components/device";
import { FONTS } from "../../src/constants/theme";

export default function LinkToParentScreen() {
  const { t } = useTranslation(["auth", "common", "device"]);
  usePortrait();

  const { setChildSession, clearGuestProfile, setChildProfile, setChildren } = useGameStore();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const scanEnabled = useRef(true);

  const handleLink = useCallback(async (rawCode: string) => {
    // Extract the 6-char code whether rawCode is the code itself or a deep-link URL
    const match = rawCode.trim().toUpperCase().match(/[A-Z0-9]{6}/);
    const trimmed = match ? match[0] : "";
    if (trimmed.length !== 6) {
      setError(t("auth:guest.linkCodeLengthError"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await apiService.redeemGuestCode(trimmed);

      // Set token immediately so all subsequent calls are authenticated
      apiService.setToken(result.token);

      // Wipe any stale local user data from a previous session
      useGameStore.setState({ parentUser: null, children: [] });

      // Establish the child session (sets isAuthenticated + userRole)
      setChildSession({
        sessionToken: trimmed,
        parentId: result.parentId,
        childId: result.childId,
        jwtToken: result.token,
      });

      // Migrate local SQLite guest data to MongoDB (best-effort)
      try {
        const payload = await guestDb.getAllDataForMigration();
        if (payload.matches.length > 0 || payload.homeworkSessions.length > 0) {
          await apiService.migrateLocalGuestData(payload, result.token);
        }
        await guestDb.clearAllGuestData();
      } catch {
        // Non-blocking
      }

      // Fetch fresh child profile from backend and update store
      const me = (await apiService.getMe()) as any;
      setChildProfile({
        displayName: me?.displayName ?? (result as any).displayName ?? "",
        avatarUrl: me?.avatarUrl ?? (result as any).avatarUrl ?? "",
        grade: me?.grade ?? "",
      });

      clearGuestProfile();
      hapticsService.success();
      setChildren([]);
      router.replace("/home");
    } catch {
      hapticsService.error();
      setError(t("auth:guest.linkCodeInvalidError"));
      scanEnabled.current = true;
    } finally {
      setLoading(false);
    }
  }, [setChildSession, clearGuestProfile, setChildProfile, setChildren, t]);

  const handleScan = useCallback(
    (data: string) => {
      if (!scanEnabled.current) return;
      scanEnabled.current = false;
      setScanning(false);
      setCode(data.trim().toUpperCase().slice(0, 6));
      handleLink(data);
    },
    [handleLink],
  );

  const handleSubmit = () => handleLink(code);

  if (scanning) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0D0B14" }}>
        <ScreenHeader title={t("device:childJoin.title")} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <View style={{ width: 288, height: 288, borderRadius: 24, overflow: "hidden", marginBottom: 24 }}>
            <QRScanner onScan={handleScan} enabled={scanEnabled.current} />
          </View>
          <Pressable onPress={() => { scanEnabled.current = true; setScanning(false); }}>
            <Text style={{ color: "#B8A9C9", fontSize: 16, fontFamily: FONTS.body }}>
              {t("device:childJoin.enterCodeInstead")}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D0B14" }}>
      <ScreenHeader title={t("device:connectDevice.title")} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 28,
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "#1A1520",
              borderWidth: 2,
              borderColor: "#9B59B6",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <Text style={{ fontSize: 36 }}>🔗</Text>
          </View>

          <Text
            style={{
              fontSize: 28,
              color: "#FFFFFF",
              fontFamily: "LuckiestGuy_400Regular",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            {t("auth:guest.linkTitle")}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#B8A9C9",
              fontFamily: FONTS.body,
              textAlign: "center",
              marginBottom: 40,
              lineHeight: 22,
            }}
          >
            {t("auth:guest.linkSubtitle")}
          </Text>

          {/* Code input */}
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(v) => {
              setCode(
                v
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "")
                  .slice(0, 6),
              );
              setError("");
            }}
            placeholder="AB12CD"
            placeholderTextColor="#3D2E4A"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            style={{
              backgroundColor: "#1A1520",
              borderRadius: 16,
              paddingHorizontal: 24,
              paddingVertical: 18,
              fontSize: 32,
              color: "#FFFFFF",
              fontFamily: "Bungee_400Regular",
              letterSpacing: 10,
              textAlign: "center",
              width: "100%",
              marginBottom: 12,
              borderWidth: 2,
              borderColor: error
                ? "#EF4444"
                : code.length === 6
                  ? "#9B59B6"
                  : "#3D2E4A",
            }}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          {error !== "" && (
            <Text
              style={{
                color: "#EF4444",
                fontSize: 13,
                fontFamily: FONTS.body,
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              {error}
            </Text>
          )}

          {success && (
            <Text
              style={{
                color: "#22C55E",
                fontSize: 15,
                fontFamily: FONTS.bodySemiBold,
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              {t("auth:guest.linkSuccess")}
            </Text>
          )}

          <Pressable
            onPress={handleSubmit}
            disabled={loading || success}
            style={({ pressed }) => ({
              width: "100%",
              backgroundColor: success
                ? "#22C55E"
                : pressed
                  ? "#7C3AED"
                  : "#9B59B6",
              paddingVertical: 18,
              borderRadius: 20,
              alignItems: "center",
              opacity: loading ? 0.7 : 1,
              shadowColor: "#9B59B6",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 8,
              marginTop: error ? 0 : 8,
            })}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 18,
                  fontFamily: "LuckiestGuy_400Regular",
                  letterSpacing: 1,
                }}
              >
                {success ? t("auth:guest.linked") : t("auth:guest.linkButton")}
              </Text>
            )}
          </Pressable>

          {/* Scan QR option */}
          {!success && (
            <Pressable
              onPress={() => {
                scanEnabled.current = true;
                setScanning(true);
              }}
              style={{
                marginTop: 20,
                backgroundColor: "#1A1520",
                borderWidth: 1,
                borderColor: "#3D2E4A",
                paddingVertical: 14,
                paddingHorizontal: 32,
                borderRadius: 16,
                width: "100%",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#B8A9C9", fontSize: 14, fontFamily: "Bungee_400Regular" }}>
                {t("device:childJoin.scanQR")}
              </Text>
            </Pressable>
          )}

          <Text
            style={{
              color: "#5A4B6B",
              fontSize: 12,
              fontFamily: FONTS.body,
              textAlign: "center",
              marginTop: 24,
              lineHeight: 18,
            }}
          >
            {t("auth:guest.linkHint")}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
