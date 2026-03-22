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
import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../../src/hooks/useOrientation";
import { useGameStore } from "../../src/stores/gameStore";
import { apiService } from "../../src/services/api";
import * as guestDb from "../../src/services/guestDb";
import { hapticsService } from "../../src/services/haptics";
import { BackButton, ScreenHeader } from "../../src/components/common";
import { FONTS } from "../../src/constants/theme";

export default function LinkToParentScreen() {
  const { t } = useTranslation(["auth", "common"]);
  usePortrait();

  const { setChildSession, clearGuestProfile, guestProfile } = useGameStore();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleLink = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      setError(t("auth:guest.linkCodeLengthError"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await apiService.redeemGuestCode(trimmed);

      apiService.setToken(result.token);
      setChildSession({
        sessionToken: trimmed,
        parentId: result.parentId,
        childId: result.childId,
        jwtToken: result.token,
      });

      // Migrate all local SQLite guest data to MongoDB silently.
      try {
        const payload = await guestDb.getAllDataForMigration();
        if (payload.matches.length > 0 || payload.homeworkSessions.length > 0) {
          await apiService.migrateLocalGuestData(payload, result.token);
        }
        await guestDb.clearAllGuestData();
      } catch {
        // Migration is best-effort; local data already cleared or migration failed — continue
      }

      // Remove guest profile — they're now a real child account
      clearGuestProfile();

      hapticsService.success();
      setSuccess(true);

      setTimeout(() => {
        router.replace("/home");
      }, 1500);
    } catch {
      hapticsService.error();
      setError(t("auth:guest.linkCodeInvalidError"));
    } finally {
      setLoading(false);
    }
  };

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
            onSubmitEditing={handleLink}
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
            onPress={handleLink}
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
