import { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { usePortrait } from "../src/hooks/useOrientation";
import { useGameStore } from "../src/stores/gameStore";
import { socketService } from "../src/services/socket";
import { apiService } from "../src/services/api";
import { ScreenHeader } from "../src/components/common";
import { DifficultySelector, RoundsSelector } from "../src/components/match";
import { MatchStatus } from "@shared/types/match.types";
import { useTranslation } from "react-i18next";
import { FONTS } from "../src/constants/theme";
import { hapticsService } from "../src/services/haptics";

function PlayIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M5 3l14 9-14 9V3z" fill="#FFFFFF" />
    </Svg>
  );
}

export default function SoloMatchScreen() {
  usePortrait();
  const { t } = useTranslation(["match", "common"]);
  const { subject } = useLocalSearchParams<{ subject: string }>();
  const { setCurrentMatch } = useGameStore();
  const [difficulty, setDifficulty] = useState("EASY");
  const [maxRounds, setMaxRounds] = useState(10);

  const subjectLabel = t(`common:subjects.${subject}`);

  const handleStart = async () => {
    try {
      hapticsService.medium();

      const teams = [
        { name: "Red Team", color: "#EF4444", side: "LEFT" },
        { name: "Blue Team", color: "#3B82F6", side: "RIGHT" },
      ];

      const created = await apiService.createMatch({
        subject: subject!,
        difficulty,
        maxRounds,
        teams,
      });

      const match = {
        ...(created as any),
        id: (created as any)._id || (created as any).id,
        gameMode: "solo" as const,
        teams: ((created as any).teams || teams).map((t: any, i: number) => ({
          id: t._id || t.id || `team-${i}`,
          name: t.name,
          color: t.color,
          side: t.side,
          players: t.players || [],
        })),
        ropePosition: (created as any).ropePosition || 0,
        currentQuestionIndex: (created as any).currentQuestionIndex || 0,
        status: MatchStatus.IN_PROGRESS,
        rounds: (created as any).rounds || 0,
        maxRounds,
        createdAt: (created as any).createdAt || new Date(),
      };

      socketService.connect();
      setCurrentMatch(match);
      router.replace({ pathname: "/game", params: { matchId: match.id } });
    } catch (error) {
      console.error("Failed to create match:", error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-game-bg">
      <ScreenHeader
        title={t("match:solo.title", { subject: subjectLabel })}
      />

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 24 }}
      >
        <DifficultySelector selected={difficulty} onSelect={setDifficulty} />
        <RoundsSelector selected={maxRounds} onSelect={setMaxRounds} />
      </ScrollView>

      {/* Start Game button */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingBottom: 36,
          paddingTop: 16,
          backgroundColor: "#0D0B14E8",
        }}
      >
        <Pressable
          onPress={handleStart}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            backgroundColor: "#9B59B6",
            paddingVertical: 18,
            borderRadius: 20,
            shadowColor: "#9B59B6",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <PlayIcon />
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 18,
              fontFamily: FONTS.heading,
            }}
          >
            {t("match:solo.startButton")}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
