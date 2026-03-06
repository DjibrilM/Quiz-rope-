import { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { usePortrait } from "../src/hooks/useOrientation";
import { useGameStore } from "../src/stores/gameStore";
import { socketService } from "../src/services/socket";
import { apiService } from "../src/services/api";
import { ScreenHeader, StaggeredList } from "../src/components/common";
import { SubjectCard } from "../src/components/match";
import { autoDifficulty } from "../src/utils/autoDifficulty";
import { MatchStatus } from "@shared/types/match.types";
import type { GameMode } from "@shared/types/match.types";
import { useTranslation } from "react-i18next";
import { FONTS } from "../src/constants/theme";
import { hapticsService } from "../src/services/haptics";

const SUBJECTS = ["MATH", "SCIENCE", "ENGLISH", "HISTORY", "GEOGRAPHY"];

function PlayIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M5 3l14 9-14 9V3z" fill="#FFFFFF" />
    </Svg>
  );
}

export default function CreateMatchScreen() {
  usePortrait();
  const { t } = useTranslation(["match", "common"]);
  const { children, userRole, setCurrentMatch } = useGameStore();
  const [gameMode, setGameMode] = useState<GameMode>("solo");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const handleSubjectPress = (subject: string) => {
    if (gameMode === "solo") {
      hapticsService.medium();
      router.push({ pathname: "/solo-match", params: { subject } });
    } else {
      setSelectedSubject(subject);
    }
  };

  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    if (!selectedSubject || starting) return;
    setStarting(true);

    try {
      hapticsService.medium();

      const difficulty =
        userRole === "child" ? "EASY" : autoDifficulty(children);
      const maxRounds = 10;
      const teams = [
        { name: "Red Team", color: "#EF4444", side: "LEFT" },
        { name: "Blue Team", color: "#3B82F6", side: "RIGHT" },
      ];

      const created = await apiService.createMatch({
        subject: selectedSubject,
        difficulty,
        maxRounds,
        teams,
      });

      const match = {
        ...(created as any),
        id: (created as any)._id || (created as any).id,
        gameMode,
        teams: ((created as any).teams || teams).map((t: any, i: number) => ({
          id: t._id || t.id || `team-${i}`,
          name: t.name,
          color: t.color,
          side: t.side,
          players: t.players || [],
        })),
        ropePosition: (created as any).ropePosition || 0,
        currentQuestionIndex: (created as any).currentQuestionIndex || 0,
        status: userRole === "child" ? MatchStatus.IN_PROGRESS : ((created as any).status || MatchStatus.WAITING),
        rounds: (created as any).rounds || 0,
        maxRounds,
        createdAt: (created as any).createdAt || new Date(),
      };

      socketService.connect();
      setCurrentMatch(match);

      const goDirectToGame = userRole === "child";
      router.replace(
        goDirectToGame
          ? { pathname: "/game", params: { matchId: match.id } }
          : { pathname: "/lobby", params: { matchId: match.id } },
      );
    } catch (error) {
      console.error("Failed to create match:", error);
    } finally {
      setStarting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-game-bg">
      <ScreenHeader title={t("match:create.title")} />

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
      >
        <Text
          style={{
            color: "#B8A9C9",
            fontSize: 14,
            textAlign: "center",
            marginBottom: 20,
            fontFamily: FONTS.body,
          }}
        >
          {t("match:create.subtitle")}
        </Text>

        {/* Game Mode Toggle */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <Text
            style={{
              color: "#5A4B6B",
              fontSize: 11,
              fontFamily: FONTS.bodySemiBold,
              marginBottom: 8,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            {t("match:create.modeLabel")}
          </Text>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#1A1520",
              borderRadius: 24,
              padding: 4,
            }}
          >
            <Pressable
              onPress={() => {
                hapticsService.selection();
                setGameMode("solo");
              }}
              style={{
                paddingHorizontal: 28,
                paddingVertical: 10,
                borderRadius: 20,
                backgroundColor:
                  gameMode === "solo" ? "#A78BFA" : "transparent",
              }}
            >
              <Text
                style={{
                  color: gameMode === "solo" ? "#FFFFFF" : "#7B6B8A",
                  fontSize: 14,
                  fontFamily: FONTS.bodyBold,
                }}
              >
                {t("match:create.solo")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                hapticsService.selection();
                setGameMode("splitscreen");
              }}
              style={{
                paddingHorizontal: 28,
                paddingVertical: 10,
                borderRadius: 20,
                backgroundColor:
                  gameMode === "splitscreen" ? "#A78BFA" : "transparent",
              }}
            >
              <Text
                style={{
                  color: gameMode === "splitscreen" ? "#FFFFFF" : "#7B6B8A",
                  fontSize: 14,
                  fontFamily: FONTS.bodyBold,
                }}
              >
                {t("match:create.splitScreen")}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Subject Grid */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "center",
            paddingTop: 4,
          }}
        >
          <StaggeredList staggerMs={80}>
            {SUBJECTS.map((subject) => (
              <SubjectCard
                key={subject}
                subject={subject}
                selected={selectedSubject === subject}
                onPress={handleSubjectPress}
              />
            ))}
          </StaggeredList>
        </View>
      </ScrollView>

      {/* Sticky start button (multiplayer only — solo navigates on subject tap) */}
      {selectedSubject && gameMode !== "solo" && (
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
            disabled={starting}
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
              opacity: starting ? 0.7 : 1,
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
              {starting
                ? t("common:buttons.loading")
                : t("match:create.startButton", {
                    subject: t(`common:subjects.${selectedSubject}`),
                  })}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
