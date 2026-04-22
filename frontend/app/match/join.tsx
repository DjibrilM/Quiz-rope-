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
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePortrait } from "../../src/hooks/useOrientation";
import { useGameStore } from "../../src/stores/gameStore";
import { apiService } from "../../src/services/api";
import { socketService } from "../../src/services/socket";
import { hapticsService } from "../../src/services/haptics";
import { BackButton } from "../../src/components/common";
import { MatchStatus } from "@shared/types/match.types";
import { FONTS } from "../../src/constants/theme";

export default function JoinMatchScreen() {
  const { t } = useTranslation(["match", "common"]);
  usePortrait();

  const { setCurrentMatch } = useGameStore();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      setError(t("match:join.codeLengthError"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await apiService.findMatchByCode(trimmed);

      if (!result.found || !result.matchId) {
        hapticsService.error();
        setError(t("match:join.notFoundError"));
        return;
      }

      if (result.status === "COMPLETED" || result.status === "CANCELLED") {
        hapticsService.error();
        setError(t("match:join.matchEndedError"));
        return;
      }

      hapticsService.success();

      // Set a minimal match object so the game/lobby screen has context
      setCurrentMatch({
        _id: result.matchId,
        hostParentId: "",
        subject: result.subject || "MATH",
        difficulty: result.difficulty || "EASY",
        gameMode: "splitscreen",
        teams: [
          {
            id: "team-red",
            name: "Red Team",
            color: "#EF4444",
            side: "LEFT",
            players: [],
          },
          {
            id: "team-blue",
            name: "Blue Team",
            color: "#3B82F6",
            side: "RIGHT",
            players: [],
          },
        ],
        ropePosition: 0,
        currentQuestionIndex: 0,
        status: MatchStatus.IN_PROGRESS,
        rounds: 0,
        maxRounds: result.maxRounds || 10,
        createdAt: new Date(),
      });

      socketService.connect();

      if (result.status === "WAITING") {
        router.replace({
          pathname: "/match/lobby",
          params: { matchId: result.matchId },
        });
      } else {
        router.replace({
          pathname: "/match/game",
          params: { matchId: result.matchId },
        });
      }
    } catch {
      hapticsService.error();
      setError(t("match:join.networkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D0B14" }}>
      <BackButton absolute />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
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
              borderColor: "#E85D75",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <Text style={{ fontSize: 36 }}>⚡</Text>
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
            {t("match:join.title")}
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
            {t("match:join.subtitle")}
          </Text>

          {/* Code input */}
          <TextInput
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
            placeholder="ABC123"
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
                  ? "#E85D75"
                  : "#3D2E4A",
            }}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleJoin}
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

          <Pressable
            onPress={handleJoin}
            disabled={loading}
            style={({ pressed }) => ({
              width: "100%",
              backgroundColor: pressed ? "#C44D66" : "#E85D75",
              paddingVertical: 18,
              borderRadius: 20,
              alignItems: "center",
              opacity: loading ? 0.7 : 1,
              shadowColor: "#E85D75",
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
                  fontSize: 20,
                  fontFamily: "LuckiestGuy_400Regular",
                  letterSpacing: 1,
                }}
              >
                {t("match:join.joinButton")}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
