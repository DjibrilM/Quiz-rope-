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
import { usePortrait } from "../../src/hooks/useOrientation";
import { useGameStore } from "../../src/stores/gameStore";
import { apiService } from "../../src/services/api";
import { Button, ScreenHeader } from "../../src/components/common";
import { RoundsSelector } from "../../src/components/match";
import { MatchStatus } from "@shared/types/match.types";
import { useTranslation } from "react-i18next";
import { hapticsService } from "../../src/services/haptics";

const AGE_GROUPS = [
  { id: "EASY",   label: "Kids",         age: "Ages 6–12",  color: "#10B981", Icon: KidsIcon },
  { id: "MEDIUM", label: "Teens",        age: "Ages 13–17", color: "#F59E0B", Icon: TeensIcon },
  { id: "HARD",   label: "Young Adults", age: "Ages 18+",   color: "#6C5CE7", Icon: YoungAdultsIcon },
] as const;

function KidsIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" fill="#10B981" opacity={0.85} />
      <Path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="#10B981" strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.85} />
      <Path d="M9 6.5c0-.8.7-1.5 1.5-1.5S12 5.7 12 6.5" stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" opacity={0.6} />
    </Svg>
  );
}

function TeensIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7.5" r="3.5" fill="#F59E0B" opacity={0.85} />
      <Path d="M5.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" stroke="#F59E0B" strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.85} />
      <Path d="M9 5c1-1.5 3-1.5 4.5-.5" stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" opacity={0.6} />
    </Svg>
  );
}

function YoungAdultsIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7" r="3.5" fill="#6C5CE7" opacity={0.85} />
      <Path d="M5.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" stroke="#6C5CE7" strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.85} />
      <Path d="M8.5 4.5L12 3l3.5 1.5-3.5 1.5-3.5-1.5Z" fill="#6C5CE7" opacity={0.9} />
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
  const { setCurrentMatch, children, childSession, locale, userRole } = useGameStore();
  const [player1Id, setPlayer1Id] = useState<string | null>(childSession?.childId ?? null);
  const [player2Id, setPlayer2Id] = useState<string | null>(null);
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

      const created = userRole === "guest"
        ? await apiService.createGhostMatch({
            subject: subject!,
            difficulty: ageGroup,
            maxRounds,
            gameMode: "splitscreen",
            context: context.trim() || undefined,
            language: locale,
          })
        : await apiService.createMatch({
            subject: subject!,
            difficulty: ageGroup,
            maxRounds,
            gameMode: "splitscreen",
            context: context.trim() || undefined,
            teams,
            childIds: [player1Id, player2Id].filter(Boolean) as string[],
            language: locale,
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
      router.replace({
        pathname: "/match/game",
        params: {
          matchId: match.id,
          p1Name: p1,
          p2Name: p2,
          ...(player1Id ? { p1Id: player1Id } : {}),
          ...(player2Id ? { p2Id: player2Id } : {}),
        },
      });
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

      <View className="flex-row items-center justify-center gap-1.5 pb-2">
        <SplitIcon />
        <Text className="text-xs font-body" style={{ color: "#7B6B8A" }}>
          Two players · Same device
        </Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1 px-6"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Age Group Selector */}
          <View className="mb-8">
            <Text
              className="text-[11px] font-body-semibold uppercase text-center mb-3"
              style={{ color: "#7B6B8A", letterSpacing: 1.5 }}
            >
              Age Group
            </Text>
            <View className="flex-row gap-2.5">
              {AGE_GROUPS.map((g) => {
                const selected = ageGroup === g.id;
                return (
                  <Pressable
                    key={g.id}
                    onPress={() => {
                      hapticsService.selection();
                      setAgeGroup(g.id);
                    }}
                    className="flex-1 py-4 rounded-2xl items-center border-2"
                    style={{
                      backgroundColor: selected ? `${g.color}18` : "#1A1520",
                      borderColor: selected ? g.color : "#3D2E4A",
                    }}
                  >
                    <View className="mb-2">
                      <g.Icon />
                    </View>
                    <Text
                      className="text-xs font-heading text-center mb-0.5"
                      style={{ color: selected ? g.color : "#FFFFFF" }}
                    >
                      {g.label}
                    </Text>
                    <Text
                      className="text-[10px] font-body text-center"
                      style={{ color: selected ? `${g.color}99` : "#5A4B6B" }}
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
          <View className="mb-7">
            <Text
              className="text-[11px] font-body-semibold uppercase text-center mb-3"
              style={{ color: "#7B6B8A", letterSpacing: 1.5 }}
            >
              Players
            </Text>
            <View className="flex-row gap-3">
              {/* Player 1 */}
              <View className="flex-1">
                <View className="flex-row items-center mb-1.5 gap-1.5">
                  <View className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <Text className="text-xs font-body-semibold" style={{ color: "#B8A9C9" }}>
                    Player 1
                  </Text>
                </View>
                <TextInput
                  value={player1Name}
                  onChangeText={(v) => { setPlayer1Name(v); setPlayer1Id(null); }}
                  placeholder="Red Team"
                  placeholderTextColor="#4A3D5A"
                  maxLength={20}
                  returnKeyType="next"
                  className="bg-card-bg rounded-xl px-3.5 py-3 text-sm font-body text-white"
                  style={{
                    borderWidth: 1.5,
                    borderColor: player1Id ? "#EF444480" : "#3D2E4A",
                  }}
                />
                {children.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mt-2"
                    contentContainerStyle={{ gap: 6 }}
                  >
                    {children.map((c) => {
                      const active = player1Id === c.id;
                      const takenByP2 = player2Id === c.id;
                      return (
                        <Pressable
                          key={c.id}
                          disabled={takenByP2}
                          onPress={() => {
                            hapticsService.selection();
                            if (active) {
                              setPlayer1Name("");
                              setPlayer1Id(null);
                            } else {
                              setPlayer1Name(c.displayName);
                              setPlayer1Id(c.id);
                            }
                          }}
                          className="px-2.5 py-1 rounded-full border"
                          style={{
                            backgroundColor: active ? "#EF444420" : "#1A1520",
                            borderColor: active ? "#EF4444" : "#3D2E4A",
                            opacity: takenByP2 ? 0.3 : 1,
                          }}
                        >
                          <Text
                            className="text-[11px] font-body-semibold"
                            style={{ color: active ? "#EF4444" : "#B8A9C9" }}
                          >
                            {c.displayName}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              {/* Player 2 */}
              <View className="flex-1">
                <View className="flex-row items-center mb-1.5 gap-1.5">
                  <View className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <Text className="text-xs font-body-semibold" style={{ color: "#B8A9C9" }}>
                    Player 2
                  </Text>
                </View>
                <TextInput
                  value={player2Name}
                  onChangeText={(v) => { setPlayer2Name(v); setPlayer2Id(null); }}
                  placeholder="Blue Team"
                  placeholderTextColor="#4A3D5A"
                  maxLength={20}
                  returnKeyType="done"
                  className="bg-card-bg rounded-xl px-3.5 py-3 text-sm font-body text-white"
                  style={{
                    borderWidth: 1.5,
                    borderColor: player2Id ? "#3B82F680" : "#3D2E4A",
                  }}
                />
                {children.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mt-2"
                    contentContainerStyle={{ gap: 6 }}
                  >
                    {children.map((c) => {
                      const active = player2Id === c.id;
                      const takenByP1 = player1Id === c.id;
                      return (
                        <Pressable
                          key={c.id}
                          disabled={takenByP1}
                          onPress={() => {
                            hapticsService.selection();
                            if (active) {
                              setPlayer2Name("");
                              setPlayer2Id(null);
                            } else {
                              setPlayer2Name(c.displayName);
                              setPlayer2Id(c.id);
                            }
                          }}
                          className="px-2.5 py-1 rounded-full border"
                          style={{
                            backgroundColor: active ? "#3B82F620" : "#1A1520",
                            borderColor: active ? "#3B82F6" : "#3D2E4A",
                            opacity: takenByP1 ? 0.3 : 1,
                          }}
                        >
                          <Text
                            className="text-[11px] font-body-semibold"
                            style={{ color: active ? "#3B82F6" : "#B8A9C9" }}
                          >
                            {c.displayName}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            </View>
          </View>

          {/* Context input */}
          <View>
            <Text
              className="text-[11px] font-body-semibold uppercase mb-2"
              style={{ color: "#B8A9C9", letterSpacing: 1.5 }}
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
              className="bg-card-bg rounded-[14px] px-4 py-3 text-sm font-body text-white"
              style={{
                borderWidth: 1.5,
                borderColor: contextError ? "#EF4444" : "#3D2E4A",
                lineHeight: 20,
                minHeight: 80,
                textAlignVertical: "top",
              }}
            />
            {contextError ? (
              <Text className="text-[13px] font-body text-red-500 mt-1.5">
                {contextError}
              </Text>
            ) : (
              <Text className="text-xs font-body mt-1.5" style={{ color: "#4A3D5A" }}>
                {t("match:solo.contextHint")}
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Start button */}
      <View
        className="absolute bottom-0 left-0 right-0 px-6 pb-9 pt-4"
        style={{ backgroundColor: "#0D0B14E8" }}
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
