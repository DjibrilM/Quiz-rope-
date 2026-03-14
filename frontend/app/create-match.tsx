import { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { usePortrait } from "../src/hooks/useOrientation";
import { StaggeredList, ScreenHeader } from "../src/components/common";
import { SubjectCard } from "../src/components/match";
import type { GameMode } from "@shared/types/match.types";
import { useTranslation } from "react-i18next";
import { FONTS } from "../src/constants/theme";
import { hapticsService } from "../src/services/haptics";

const SUBJECTS = ["MATH", "SCIENCE", "ENGLISH", "HISTORY", "GEOGRAPHY"];

export default function CreateMatchScreen() {
  usePortrait();
  const { t } = useTranslation(["match", "common"]);
  const [gameMode, setGameMode] = useState<GameMode>("solo");

  const handleSubjectPress = (subject: string) => {
    hapticsService.medium();
    if (gameMode === "solo") {
      router.push({ pathname: "/solo-match", params: { subject } });
    } else {
      router.push({ pathname: "/split-match" as any, params: { subject } });
    }
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-game-bg">
      <ScreenHeader title={t("match:create.title")} />

      <ScrollView
        className="flex-1 px-6"
        contentInsetAdjustmentBehavior="automatic"
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
                selected={false}
                onPress={handleSubjectPress}
              />
            ))}
          </StaggeredList>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
