import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { useGameOrientation } from "../src/hooks/useOrientation";
import { useGameStore } from "../src/stores/gameStore";
import { socketService } from "../src/services/socket";
import { LobbyQuestionCard } from "../src/components/lobby";
import { TugOfWarRope } from "../src/components/game";
import { SAMPLE_QUESTIONS } from "../src/constants/sampleQuestions";
import { useTranslation } from "react-i18next";
import { FONTS } from "../src/constants/theme";

export default function LobbyScreen() {
  const { t } = useTranslation(["match", "common"]);
  const userRole = useGameOrientation();
  const isChildDevice = userRole === "child";
  const { matchId } = useLocalSearchParams();
  const { currentMatch } = useGameStore();

  const [questionIndex, setQuestionIndex] = useState(0);
  const currentSample = SAMPLE_QUESTIONS[questionIndex];

  const [ropePos, setRopePos] = useState(0);
  const ropeDirection = useRef(1);

  useEffect(() => {
    const questionInterval = setInterval(() => {
      setQuestionIndex((prev) => (prev + 1) % SAMPLE_QUESTIONS.length);
    }, 5000);

    const ropeInterval = setInterval(() => {
      setRopePos((prev) => {
        if (prev >= 0.3) ropeDirection.current = -1;
        if (prev <= -0.3) ropeDirection.current = 1;
        return prev + ropeDirection.current * 0.05;
      });
    }, 100);

    return () => {
      clearInterval(questionInterval);
      clearInterval(ropeInterval);
    };
  }, []);

  const handleStartGame = () => {
    socketService.emit("match:start", { matchId });
    router.replace({
      pathname: "/game",
      params: { matchId: matchId as string },
    });
  };

  const matchCode =
    (matchId as string)?.slice(-6)?.toUpperCase() || "ABC123";
  const subject = currentMatch?.subject || "MATH";
  const difficulty = currentMatch?.difficulty || "EASY";
  const rounds = currentMatch?.maxRounds || 10;

  return (
    <SafeAreaView className="flex-1 bg-game-bg">
      {/* Top Bar */}
      {isChildDevice ? (
        <View className="items-center px-4 pt-4 pb-2 gap-3">
          <View className="flex-row items-center justify-between w-full">
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 32,
                height: 32,
                backgroundColor: "#1A1520",
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#B8A9C9", fontSize: 16, fontWeight: "bold" }}>{"<"}</Text>
            </Pressable>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#1A1520", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 }}>
              <Text
                style={{ color: "#7B6B8A", fontSize: 12, marginRight: 8, fontFamily: "Bungee_400Regular" }}
              >
                {t("match:lobby.codeLabel")}
              </Text>
              <Text
                style={{ color: "#FFFFFF", fontSize: 18, fontFamily: "Bungee_400Regular", letterSpacing: 4 }}
              >
                {matchCode}
              </Text>
            </View>
            <View style={{ width: 32 }} />
          </View>
          <Text style={{ color: "#B8A9C9", fontSize: 14, fontFamily: FONTS.body }}>
            {t("match:lobby.matchInfo", { subject, difficulty, rounds })}
          </Text>
          <View className="flex-row items-center justify-center gap-6">
            <View className="flex-row items-center">
              <View className="bg-team-red/20 px-3 py-1.5 rounded-xl mr-2">
                <Text className="text-team-red text-lg font-extrabold">0</Text>
              </View>
              <Text
                className="text-sm text-team-red"
                style={{ fontFamily: "Bungee_400Regular" }}
              >
                {t("common:teams.red")}
              </Text>
            </View>
            <Text style={{ color: "#7B6B8A", fontSize: 12, fontFamily: FONTS.body }}>{t("common:labels.vs")}</Text>
            <View className="flex-row items-center">
              <Text
                className="text-sm text-team-blue"
                style={{ fontFamily: "Bungee_400Regular" }}
              >
                {t("common:teams.blue")}
              </Text>
              <View className="bg-team-blue/20 px-3 py-1.5 rounded-xl ml-2">
                <Text className="text-team-blue text-lg font-extrabold">0</Text>
              </View>
            </View>
          </View>
          <Pressable
            onPress={handleStartGame}
            className="bg-game-success px-8 py-3 rounded-xl active:bg-emerald-600"
          >
            <Text
              className="text-white text-base"
              style={{ fontFamily: "Bungee_400Regular" }}
            >
              {t("match:lobby.startMatch")}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 32,
              height: 32,
              backgroundColor: "#1A1520",
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#B8A9C9", fontSize: 16, fontWeight: "bold" }}>{"<"}</Text>
          </Pressable>

          <View className="flex-row items-center">
            <View className="bg-team-red/20 px-4 py-2 rounded-xl mr-2">
              <Text className="text-team-red text-xl font-extrabold">0</Text>
            </View>
            <Text
              className="text-base text-team-red"
              style={{ fontFamily: "Bungee_400Regular" }}
            >
              {t("common:teams.redTeam")}
            </Text>
          </View>

          <View className="items-center">
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#1A1520", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12, marginBottom: 4 }}>
              <Text
                style={{ color: "#7B6B8A", fontSize: 12, marginRight: 8, fontFamily: "Bungee_400Regular" }}
              >
                {t("match:lobby.codeLabel")}
              </Text>
              <Text
                style={{ color: "#FFFFFF", fontSize: 18, fontFamily: "Bungee_400Regular", letterSpacing: 4 }}
              >
                {matchCode}
              </Text>
            </View>
            <Text style={{ color: "#B8A9C9", fontSize: 14, fontFamily: FONTS.body }}>
              {t("match:lobby.matchInfo", { subject, difficulty, rounds })}
            </Text>
          </View>

          <View className="flex-row items-center">
            <Text
              className="text-base text-team-blue"
              style={{ fontFamily: "Bungee_400Regular" }}
            >
              {t("common:teams.blueTeam")}
            </Text>
            <View className="bg-team-blue/20 px-4 py-2 rounded-xl ml-2">
              <Text className="text-team-blue text-xl font-extrabold">0</Text>
            </View>
          </View>

          <Pressable
            onPress={handleStartGame}
            className="bg-game-success px-6 py-3 rounded-xl active:bg-emerald-600"
          >
            <Text
              className="text-white text-base"
              style={{ fontFamily: "Bungee_400Regular" }}
            >
              {t("match:lobby.startMatch")}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Rope */}
      <View className="h-48 items-center justify-center">
        <TugOfWarRope ropePosition={ropePos} />
      </View>

      {/* Split Screen Preview Questions */}
      <View
        className={`flex-1 px-4 pb-4 gap-4 ${isChildDevice ? "flex-col" : "flex-row"}`}
      >
        <View className="flex-1">
          <LobbyQuestionCard question={currentSample} teamSide="LEFT" />
        </View>
        {!isChildDevice && (
          <View className="flex-1">
            <LobbyQuestionCard question={currentSample} teamSide="RIGHT" />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
