import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { usePortrait } from "../src/hooks/useOrientation";
import { useGameStore } from "../src/stores/gameStore";
import { apiService } from "../src/services/api";
import { Button, ScreenHeader } from "../src/components/common";
import { RoundsSelector } from "../src/components/match";
import { MatchStatus } from "@shared/types/match.types";
import { useTranslation } from "react-i18next";
import { FONTS } from "../src/constants/theme";
import { hapticsService } from "../src/services/haptics";

// Age group → API difficulty mapping
const AGE_GROUPS = [
  {
    id: "EASY",
    label: "Kids",
    age: "Ages 6–12",
    color: "#10B981",
    Icon: KidsIcon,
  },
  {
    id: "MEDIUM",
    label: "Teens",
    age: "Ages 13–17",
    color: "#F59E0B",
    Icon: TeensIcon,
  },
  {
    id: "HARD",
    label: "Young Adults",
    age: "Ages 18+",
    color: "#6C5CE7",
    Icon: YoungAdultsIcon,
  },
] as const;

function KidsIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" fill="#10B981" opacity={0.85} />
      <Path
        d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"
        stroke="#10B981"
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
        opacity={0.85}
      />
      <Path
        d="M9 6.5c0-.8.7-1.5 1.5-1.5S12 5.7 12 6.5"
        stroke="#FFFFFF"
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.6}
      />
    </Svg>
  );
}

function TeensIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7.5" r="3.5" fill="#F59E0B" opacity={0.85} />
      <Path
        d="M5.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"
        stroke="#F59E0B"
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
        opacity={0.85}
      />
      <Path
        d="M9 5c1-1.5 3-1.5 4.5-.5"
        stroke="#FFFFFF"
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.6}
      />
    </Svg>
  );
}

function YoungAdultsIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7" r="3.5" fill="#6C5CE7" opacity={0.85} />
      <Path
        d="M5.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"
        stroke="#6C5CE7"
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
        opacity={0.85}
      />
      {/* Graduation cap */}
      <Path
        d="M8.5 4.5L12 3l3.5 1.5-3.5 1.5-3.5-1.5Z"
        fill="#6C5CE7"
        opacity={0.9}
      />
      <Rect x="13.5" y="4.5" width="1" height="2.5" rx="0.5" fill="#6C5CE7" opacity={0.7} />
    </Svg>
  );
}

function PlayIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M5 3l14 9-14 9V3z" fill="#FFFFFF" />
    </Svg>
  );
}

function SplitIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="3" width="9" height="18" rx="2" fill="#EF4444" opacity={0.8} />
      <Rect x="13" y="3" width="9" height="18" rx="2" fill="#3B82F6" opacity={0.8} />
    </Svg>
  );
}

export default function SplitMatchScreen() {
  usePortrait();
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [player1Name, setPlayer1Name] = useState("");
  const [player2Name, setPlayer2Name] = useState("");
  const [context, setContext] = useState("");
  const [contextError, setContextError] = useState("");
  const { t } = useTranslation(["match", "common"]);
  const { subject } = useLocalSearchParams<{ subject: string }>();
  const { setCurrentMatch } = useGameStore();
  const [ageGroup, setAgeGroup] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [maxRounds, setMaxRounds] = useState(10);

  const subjectLabel = t(`common:subjects.${subject}`);

  const handleStart = async () => {
    setContextError("");
    try {
      setCreatingMatch(true);
      hapticsService.medium();

      const p1 = player1Name.trim() || "Red Team";
      const p2 = player2Name.trim() || "Blue Team";
      const teams = [
        { name: p1, color: "#EF4444", side: "LEFT" },
        { name: p2, color: "#3B82F6", side: "RIGHT" },
      ];

      const created = await apiService.createMatch({
        subject: subject!,
        difficulty: ageGroup,
        maxRounds,
        gameMode: "splitscreen",
        context: context.trim() || undefined,
        teams,
      });

      const match = {
        ...(created as any),
        id: (created as any)._id || (created as any).id,
        gameMode: "splitscreen" as const,
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

      setCurrentMatch(match);
      router.replace({ pathname: "/game", params: { matchId: match.id, p1Name: p1, p2Name: p2 } });
    } catch (error: any) {
      setCreatingMatch(false);
      if (error?.message === "CONTEXT_NOT_RELATED") {
        setContextError(t("match:solo.contextNotRelated"));
      } else {
        console.error("Failed to create split-screen match:", error);
      }
    }
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-game-bg">
      <ScreenHeader title={`Split Screen · ${subjectLabel}`} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingBottom: 8,
        }}
      >
        <SplitIcon />
        <Text style={{ color: "#7B6B8A", fontSize: 12, fontFamily: FONTS.body }}>
          Two players · Same device
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1 px-6"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Age Group Selector */}
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                color: "#7B6B8A",
                fontSize: 11,
                fontFamily: FONTS.bodySemiBold,
                letterSpacing: 1.5,
                marginBottom: 12,
                textTransform: "uppercase",
                textAlign: "center",
              }}
            >
              Age Group
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {AGE_GROUPS.map((g) => {
                const selected = ageGroup === g.id;
                return (
                  <Pressable
                    key={g.id}
                    onPress={() => {
                      hapticsService.selection();
                      setAgeGroup(g.id);
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 16,
                      borderRadius: 16,
                      alignItems: "center",
                      borderWidth: 2,
                      backgroundColor: selected ? `${g.color}18` : "#1A1520",
                      borderColor: selected ? g.color : "#3D2E4A",
                    }}
                  >
                    <View style={{ marginBottom: 8 }}>
                      <g.Icon />
                    </View>
                    <Text
                      style={{
                        color: selected ? g.color : "#FFFFFF",
                        fontSize: 12,
                        fontFamily: FONTS.heading,
                        marginBottom: 3,
                        textAlign: "center",
                      }}
                    >
                      {g.label}
                    </Text>
                    <Text
                      style={{
                        color: selected ? `${g.color}99` : "#5A4B6B",
                        fontSize: 10,
                        fontFamily: FONTS.body,
                        textAlign: "center",
                      }}
                    >
                      {g.age}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <RoundsSelector selected={maxRounds} onSelect={setMaxRounds} />

          {/* Player names */}
          <View style={{ marginBottom: 28 }}>
            <Text
              style={{
                color: "#7B6B8A",
                fontSize: 11,
                fontFamily: FONTS.bodySemiBold,
                letterSpacing: 1.5,
                marginBottom: 12,
                textTransform: "uppercase",
                textAlign: "center",
              }}
            >
              Players
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              {/* Player 1 */}
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 6,
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: "#EF4444",
                    }}
                  />
                  <Text
                    style={{
                      color: "#B8A9C9",
                      fontSize: 12,
                      fontFamily: FONTS.bodySemiBold,
                    }}
                  >
                    Player 1
                  </Text>
                </View>
                <TextInput
                  value={player1Name}
                  onChangeText={setPlayer1Name}
                  placeholder="Red Team"
                  placeholderTextColor="#4A3D5A"
                  maxLength={20}
                  returnKeyType="next"
                  style={{
                    backgroundColor: "#1A1520",
                    borderWidth: 1.5,
                    borderColor: "#3D2E4A",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontFamily: FONTS.body,
                  }}
                />
              </View>

              {/* Player 2 */}
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 6,
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: "#3B82F6",
                    }}
                  />
                  <Text
                    style={{
                      color: "#B8A9C9",
                      fontSize: 12,
                      fontFamily: FONTS.bodySemiBold,
                    }}
                  >
                    Player 2
                  </Text>
                </View>
                <TextInput
                  value={player2Name}
                  onChangeText={setPlayer2Name}
                  placeholder="Blue Team"
                  placeholderTextColor="#4A3D5A"
                  maxLength={20}
                  returnKeyType="done"
                  style={{
                    backgroundColor: "#1A1520",
                    borderWidth: 1.5,
                    borderColor: "#3D2E4A",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontFamily: FONTS.body,
                  }}
                />
              </View>
            </View>
          </View>

          {/* Context input */}
          <View>
            <Text
              style={{
                color: "#B8A9C9",
                fontSize: 11,
                fontFamily: FONTS.bodySemiBold,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              {t("match:solo.contextLabel")}
            </Text>
            <TextInput
              value={context}
              onChangeText={(v) => {
                setContext(v);
                if (contextError) setContextError("");
              }}
              placeholder={t("match:solo.contextPlaceholder")}
              placeholderTextColor="#4A3D5A"
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: "#1A1520",
                borderWidth: 1.5,
                borderColor: contextError ? "#EF4444" : "#3D2E4A",
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: "#FFFFFF",
                fontSize: 14,
                fontFamily: FONTS.body,
                lineHeight: 20,
                minHeight: 80,
                textAlignVertical: "top",
              }}
            />
            {contextError ? (
              <Text
                style={{
                  color: "#EF4444",
                  fontSize: 13,
                  fontFamily: FONTS.body,
                  marginTop: 6,
                }}
              >
                {contextError}
              </Text>
            ) : (
              <Text
                style={{
                  color: "#4A3D5A",
                  fontSize: 12,
                  fontFamily: FONTS.body,
                  marginTop: 6,
                }}
              >
                {t("match:solo.contextHint")}
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Start button */}
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
        <Button
          className="min-w-full"
          onPress={handleStart}
          label="Start Battle"
          icon={<PlayIcon />}
          loading={creatingMatch}
        />
      </View>
    </SafeAreaView>
  );
}
